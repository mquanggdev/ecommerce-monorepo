# 4. DEPLOY PRODUCTION (quangtm.site)

## Tổng quan

```
Trình duyệt ──HTTPS──► Nginx (VPS, cổng 80/443)
                        ├── /media/*     ──► file-manager:4000  (ảnh, kiểm tra Referer)
                        ├── /socket.io/* ──► ecommerce:3000     (chat, WebSocket)
                        └── /*           ──► ecommerce:3000
                                              └──► file-manager:4000 (upload, mạng nội bộ Docker)
                                              └──► MongoDB Atlas, GoShip, NDAMaps, VNPay, ZaloPay...
```

| Thành phần | File |
|---|---|
| Image production (build TypeScript, chạy user `node`, healthcheck) | `project-ecommerce-t8-25/dockerfile`, `file-manager/dockerfile` |
| Chạy trên VPS (Nginx + certbot + 2 service) | `deploy/docker-compose.prod.yml` |
| Cấu hình Nginx (HTTPS, WebSocket, upload 25MB) | `deploy/nginx/templates/default.conf.template` |
| Dựng VPS lần đầu | `deploy/scripts/setup-vps.sh` |
| Lấy chứng chỉ HTTPS lần đầu | `deploy/scripts/init-ssl.sh` (CD tự gọi, đã có thì bỏ qua) |
| Deploy + tự quay về bản cũ khi lỗi | `deploy/scripts/deploy.sh` |
| Sao lưu ảnh upload | `deploy/scripts/backup-media.sh` |
| CI/CD | `.github/workflows/ci-cd.yml` |

### Luồng CI/CD

| Sự kiện | Việc chạy |
|---|---|
| Pull request | Typecheck + biên dịch 2 service → build thử 2 image (không đẩy) |
| Push vào `main` | Như trên → đẩy image lên `ghcr.io/mquanggdev/ecommerce-monorepo/{ecommerce,file-manager}:<commit>` → SSH vào VPS: cập nhật file cấu hình + biến môi trường, lấy HTTPS nếu chưa có, chạy `deploy.sh` → gọi `https://quangtm.site/healthz` từ bên ngoài |
| Bấm tay (Actions → CI/CD → Run workflow) | Deploy lại `main` (vd: sau khi đổi secret) |

Repo private → image trên ghcr.io cũng private, dung lượng package có hạn mức (GitHub Free: 500MB).
Workflow tự xóa image cũ, chỉ giữ 3 bản gần nhất của mỗi service.

`deploy.sh` chờ cả 2 service `healthy` tối đa 3 phút. Không đạt → in log, **tự chạy lại bản trước**, job báo đỏ.
Job deploy chỉ chạy khi đã đặt biến `DOMAIN` trên GitHub (chưa dựng VPS thì được bỏ qua).

---

## Các bước làm một lần

### 1. DNS
Tại nơi quản lý tên miền, tạo 2 bản ghi **A** trỏ về IP của VPS:

| Tên | Giá trị |
|---|---|
| `@` (quangtm.site) | IP VPS |
| `www` | IP VPS |

Kiểm tra: `nslookup quangtm.site` ra đúng IP.

### 2. Khóa SSH cho GitHub Actions (trên máy bạn)
```bash
ssh-keygen -t ed25519 -C "github-actions-questa" -f ~/.ssh/questa_deploy -N ""
```
- `~/.ssh/questa_deploy.pub` → dùng ở bước 3
- `~/.ssh/questa_deploy` (khóa riêng) → secret `VPS_SSH_KEY`

### 3. Dựng VPS (Ubuntu, đăng nhập root)
Repo đang private nên VPS không tải thẳng từ GitHub được: chép script từ máy bạn lên.
```bash
# Trên máy bạn
scp deploy/scripts/setup-vps.sh root@<IP VPS>:/root/setup-vps.sh
# Trên VPS
bash setup-vps.sh "<nội dung file questa_deploy.pub>"
```
Script cài Docker, tạo user `deploy`, mở tường lửa 22/80/443, thêm 1GB swap nếu VPS chưa có, giới hạn log hệ thống 200MB, tạo `/opt/questa`.

Lấy dòng cho secret `VPS_SSH_KNOWN_HOSTS` (chạy trên máy bạn):
```bash
ssh-keyscan -H <IP VPS>
```

### 4. MongoDB Atlas
**Network Access → Add IP Address → IP của VPS.** Thiếu bước này ecommerce không lên được
(log: `Kết nối DB thất bại!`, container khởi động lại liên tục, deploy tự quay về bản cũ).

### 5. GitHub: Settings → Secrets and variables → Actions

**Variables** (không bí mật):

| Tên | Giá trị |
|---|---|
| `DOMAIN` | `quangtm.site` |
| `LETSENCRYPT_EMAIL` | email nhận thông báo chứng chỉ |
| `VPS_USER` | `deploy` (để ở Variables, không phải Secrets: tránh GitHub che mọi chữ "deploy" trong log) |

**Secrets**:

| Tên | Giá trị |
|---|---|
| `VPS_HOST` | IP VPS |
| `VPS_USER` | `deploy` |
| `VPS_PORT` | (không bắt buộc, mặc định 22) |
| `VPS_SSH_KEY` | toàn bộ nội dung `~/.ssh/questa_deploy` (mở bằng Notepad, Ctrl+A, Ctrl+C). Log deploy in fingerprint để đối chiếu với `ssh-keygen -lf questa_deploy.pub` |
| `VPS_SSH_KNOWN_HOSTS` | kết quả `ssh-keyscan -H <IP VPS>` |
| `ECOMMERCE_ENV` | toàn bộ nội dung `deploy/env/ecommerce.env` |
| `FILE_MANAGER_ENV` | toàn bộ nội dung `deploy/env/file-manager.env` |

`deploy/env/*.env` nằm trên máy, **đã bị .gitignore**, không commit. Mẫu các biến:

| File | Biến |
|---|---|
| `ecommerce.env` | `DATABASE`, `JWT_SECRET`, `SESSION_SECRET`, `FILE_MANAGER_SECRET`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, `SUPER_ADMIN_ID`, `GROQ_API_KEY`, `OPENMAP_KEY` |
| `file-manager.env` | `FILE_MANAGER_SECRET` (giống hệt bên ecommerce) |

`NODE_ENV=production`, `CDN_URL`, `CDN_PUBLIC`, `DOMAIN` của file-manager do `docker-compose.prod.yml` tự đặt.

### 6. Deploy lần đầu
Merge vào `main` (hoặc Actions → CI/CD → Run workflow). Lần đầu certbot xin chứng chỉ HTTPS cho `quangtm.site` và `www.quangtm.site`.

### 7. Cài đặt trong trang admin (lưu trong DB, không nằm trong .env)
Vào `https://quangtm.site/admin`:

| Trang | Sửa |
|---|---|
| Cài đặt chung | Domain website: `https://quangtm.site` (VNPay/ZaloPay trả kết quả về địa chỉ này) |
| API đăng nhập mạng xã hội | Callback Google: `https://quangtm.site/auth/google/callback`, Facebook: `https://quangtm.site/auth/facebook/callback` — đồng thời thêm vào Google Cloud Console / Facebook App. **Đổi xong phải restart ecommerce** (cấu hình OAuth chỉ đọc lúc khởi động) |
| API thanh toán | VNPay TmnCode / HashSecret sau khi đăng ký sandbox |

> Local và production đang dùng **chung database** Atlas: đổi các cài đặt trên cũng áp dụng cho bản chạy local
> (vd: thanh toán thử ở local sẽ trả về quangtm.site). Muốn tách hẳn thì đổi `DATABASE` trong `ECOMMERCE_ENV` sang database khác.

---

## Vận hành trên VPS (`ssh deploy@<IP VPS>`, thư mục `/opt/questa`)

| Việc | Lệnh |
|---|---|
| Trạng thái | `docker compose -f docker-compose.prod.yml ps` |
| Xem log | `docker compose -f docker-compose.prod.yml logs -f --tail 100 ecommerce` |
| Restart 1 service | `docker compose -f docker-compose.prod.yml restart ecommerce` |
| Quay về một bản cụ thể | `bash scripts/deploy.sh <commit sha>` (image còn trên máy hoặc đăng nhập ghcr.io trước) |
| Sao lưu ảnh | `bash scripts/backup-media.sh` (đặt cron hằng ngày: xem đầu file) |

Log mỗi service giới hạn 3 × 10MB. Image cũ được dọn sau mỗi lần deploy, giữ bản đang chạy và bản trước đó.

## Xử lý sự cố

| Hiện tượng | Nguyên nhân thường gặp |
|---|---|
| Deploy báo đỏ ở bước "Kiểm tra cấu hình" | Thiếu variable/secret ở mục 5 |
| `Permission denied (publickey)` | `VPS_SSH_KEY` không khớp khóa đã thêm ở bước 3, hoặc sai `VPS_USER` |
| `Host key verification failed` | `VPS_SSH_KNOWN_HOSTS` sai/thiếu (cài lại VPS thì phải lấy lại) |
| certbot lỗi khi xin chứng chỉ | DNS chưa trỏ về VPS, hoặc cổng 80 bị chặn |
| ecommerce không healthy, log `Kết nối DB thất bại!` | Atlas chưa cho phép IP VPS / sai `DATABASE` |
| Ảnh lỗi 403 | Mở web bằng địa chỉ khác `https://quangtm.site` (file-manager chỉ trả ảnh cho đúng tên miền) |
| Đăng nhập Google lỗi `redirect_uri_mismatch` | Chưa sửa callback ở mục 7 / chưa thêm vào Google Console |
