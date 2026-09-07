# 2B — Gộp monorepo + sửa tsconfig + dựng CI

> ⚠️ Đọc `2-KE-HOACH-TONG-THE.md` trước.

| | |
|---|---|
| **Đợt** | 0 — Nền tảng (làm TRƯỚC mọi batch khác) |
| **Nhánh** | Không dùng nhánh — xem mục 2 |
| **Ước tính** | 1–1.5 giờ |
| **Ai làm** | 🔴 **Khuyến nghị người dùng tự chạy từng bước**, hoặc chạy cùng CODEX và duyệt từng lệnh |

---

## 1. MỤC TIÊU

Ba việc nền, phải xong trước khi bắt đầu batch 3A:

1. **Gộp hai repo thành một monorepo** tại `Node TH/`, giữ nguyên lịch sử commit của cả hai.
2. **Sửa `tsconfig.json`** để `npx tsc --noEmit` chạy sạch.
3. **Dựng CI tối thiểu** trên GitHub Actions: kiểm tra kiểu TypeScript + build Docker.

### Vì sao phải làm trước

| Lý do | Chi tiết |
|---|---|
| `docker-compose.yml` đang **mồ côi** | Đã xác minh: `git ls-files \| grep compose` → rỗng ở cả hai repo. File quan trọng nhất để chạy hệ thống lại không được version control. **Batch 3B sẽ sửa chính file này** — nếu không gộp repo trước thì thay đổi đó không commit được ở đâu. |
| CI phải xanh từ commit đầu | `tsc --noEmit` hiện lỗi `TS5103`. Bật CI khi đang đỏ sẽ khiến mọi người quen bỏ qua nó. |
| 25 batch sắp tới | CI bắt lỗi kiểu tự động suốt cả 25 batch. Dựng sau thì mất đúng phần giá trị đó. |

---

## 2. ⚠️ CẢNH BÁO TRƯỚC KHI BẮT ĐẦU

Đây là **phẫu thuật git**, khác với các batch sửa code. Nguyên tắc an toàn:

- **Bước 0 (sao lưu) là bắt buộc.** Không bỏ qua.
- **Hai repo cũ trên GitHub KHÔNG bị xoá, KHÔNG bị đụng đến.** Chúng vẫn nguyên vẹn suốt quá trình. Nếu hỏng, chỉ cần xoá thư mục mới và chép bản sao lưu về.
- **Không dùng nhánh** cho batch này — ta đang tạo một repo hoàn toàn mới, chưa có gì để phân nhánh.
- Nếu bất kỳ bước nào ra kết quả khác mô tả → **dừng, báo cáo**, đừng chạy bước tiếp theo.

### Những thứ KHÔNG nằm trong git — phải chép tay, nếu mất là hỏng

Đã kiểm tra `git status --ignored`:

```
project-ecommerce-t8-25/.env           ← chứa mọi secret, KHÔNG có ở đâu khác
project-ecommerce-t8-25/.env.docker
file-manager/.env
file-manager/.env.docker
```

`node_modules/` cũng bị ignore nhưng cài lại được, không đáng lo.

> `file-manager/media/` **có** được git theo dõi (7 file) → sẽ theo lịch sử sang monorepo, không mất.

---

## 3. QUY TRÌNH

### Bước 0 — Sao lưu (BẮT BUỘC)

```bash
cd "/d/Middle Nodejs"
cp -r "Node TH" "Node TH-BACKUP-$(date +%Y%m%d)"
ls -la | grep BACKUP
```

Xác nhận thư mục sao lưu đã tồn tại rồi mới đi tiếp.

### Bước 1 — Đảm bảo hai repo cũ đã đẩy hết lên GitHub

```bash
cd "/d/Middle Nodejs/Node TH/project-ecommerce-t8-25"
git status -sb | head -1        # không được có "ahead"
git push origin main

cd "../file-manager"
git status -sb | head -1
git push origin main
```

> Bước này để hai repo trên GitHub trở thành bản lưu trữ đầy đủ. Nếu `git push` báo lỗi hoặc bị từ chối → dừng, báo cáo.

### Bước 2 — Đổi tên hai thư mục nguồn

```bash
cd "/d/Middle Nodejs/Node TH"
mv project-ecommerce-t8-25 _src-ecommerce
mv file-manager _src-file-manager
ls
```

Kết quả mong đợi: còn `_src-ecommerce`, `_src-file-manager`, `docs`, `docker-compose.yml`.

### Bước 3 — Khởi tạo monorepo

```bash
cd "/d/Middle Nodejs/Node TH"
git init
git branch -M main
```

Tạo `.gitignore` ở gốc:

```bash
cat > .gitignore <<'EOF'
node_modules/
.env
.env.docker

# Thư mục nguồn tạm khi gộp repo — xoá sau khi xong
_src-ecommerce/
_src-file-manager/
EOF
```

Commit nền:

```bash
git add .gitignore docker-compose.yml docs/
git commit -m "Khởi tạo monorepo: docker-compose và tài liệu"
```

### Bước 4 — Gộp repo `ecommerce` kèm lịch sử

```bash
cd "/d/Middle Nodejs/Node TH"
git subtree add --prefix=project-ecommerce-t8-25 ./_src-ecommerce main
```

> Lấy từ **thư mục local**, không phải URL GitHub — để chắc chắn có cả commit chưa push.

### Bước 5 — Gộp repo `file-manager` kèm lịch sử

```bash
git subtree add --prefix=file-manager ./_src-file-manager main
```

### Bước 6 — Kiểm chứng trước khi xoá gì

```bash
# Lịch sử của cả hai repo phải có mặt
git log --oneline | head -20

# Số file được track phải khớp với hai repo cũ
echo "ecommerce mới: $(git ls-files project-ecommerce-t8-25 | wc -l)"
echo "ecommerce cũ:  $(cd _src-ecommerce && git ls-files | wc -l)"
echo "fm mới:        $(git ls-files file-manager | wc -l)"
echo "fm cũ:         $(cd _src-file-manager && git ls-files | wc -l)"
```

🔴 **Hai cặp số phải bằng nhau.** Nếu lệch → dừng, báo cáo, đừng xoá gì cả.

### Bước 7 — Khôi phục file không nằm trong git

```bash
cd "/d/Middle Nodejs/Node TH"
cp _src-ecommerce/.env          project-ecommerce-t8-25/.env
cp _src-ecommerce/.env.docker   project-ecommerce-t8-25/.env.docker
cp _src-file-manager/.env       file-manager/.env
cp _src-file-manager/.env.docker file-manager/.env.docker

# Chuyển node_modules sang để khỏi cài lại (tiết kiệm ~5 phút và vài trăm MB)
mv _src-ecommerce/node_modules    project-ecommerce-t8-25/node_modules
mv _src-file-manager/node_modules file-manager/node_modules
```

Xác nhận:

```bash
ls -la project-ecommerce-t8-25/.env file-manager/.env
git status --short        # phải rỗng — 4 file .env đều bị ignore
```

### Bước 8 — Sửa `tsconfig.json`

Trong `project-ecommerce-t8-25/tsconfig.json`, **xoá hẳn dòng** `,"ignoreDeprecations": "6.0"` và dấu phẩy thừa. Kết quả cuối:

```json
{
  "compilerOptions": {
    "target": "ES6",                // Biên dịch về ES6
    "module": "CommonJS",            // Hỗ trợ module của Node.js
    "moduleResolution": "node",      // Hỗ trợ import module từ node_modules
    "esModuleInterop": true,         // Dùng import thay require
    "resolveJsonModule": true,       // Cho phép import file JSON
    "strict": true                   // Bật chế độ kiểm tra chặt chẽ
  }
}
```

> Đã kiểm chứng: bỏ hẳn dòng này thì `tsc --noEmit` chạy sạch, **không phát sinh lỗi nào**. Không cần thay bằng giá trị khác.

Thêm script vào `project-ecommerce-t8-25/package.json`:

```json
  "scripts": {
    "start": "node -r ts-node/register index.ts",
    "dev": "nodemon --exec \"node --inspect -r ts-node/register\" index.ts",
    "typecheck": "tsc --noEmit",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
```

Và vào `file-manager/package.json`:

```json
  "scripts": {
    "start": "node -r ts-node/register index.ts",
    "dev": "nodemon --exec \"node --inspect -r ts-node/register\" index.ts",
    "typecheck": "tsc --noEmit"
  },
```

### Bước 8B — Tạo `.env.example`

Hai file này **được commit lên GitHub**, nên tuyệt đối không chứa giá trị thật.

> 🔴 **Không dùng `cp .env .env.example`.** Đây là cách làm lộ secret phổ biến nhất — chép xong quên xoá giá trị là đẩy nguyên key lên repo. Gõ tay theo mẫu dưới đây.

Tạo `project-ecommerce-t8-25/.env.example`:

```bash
# ==========================================================
# BẮT BUỘC — được đọc trực tiếp từ process.env
# ==========================================================

# Chuỗi kết nối MongoDB Atlas
DATABASE=

# Chuỗi bí mật ký JWT (dùng cho cả admin và khách hàng)
JWT_SECRET=

# Chuỗi bí mật cho express-session (phục vụ luồng OAuth)
SESSION_SECRET=

# Rỗng = chạy HTTP (local). Đặt "production" khi đã có HTTPS
NODE_ENV=

# Tài khoản quản trị tối cao, đăng nhập không cần bản ghi trong DB
SUPER_ADMIN_EMAIL=
SUPER_ADMIN_PASSWORD=
SUPER_ADMIN_ID=

# Bí mật chia sẻ với file-manager — PHẢI giống hệt file-manager/.env
FILE_MANAGER_SECRET=

# URL server→server, dùng cho axios gọi file-manager
#   Local:  http://localhost:4000
#   Docker: http://file-manager:4000
CDN_URL=

# URL trình duyệt→file-manager, dùng trong <img src>
#   Local/Docker: http://localhost:4000
#   Production:   https://cdn.tenmien.com
CDN_PUBLIC=

# API key Groq cho các tính năng AI trong chat admin
GROQ_API_KEY=

# ==========================================================
# KHÔNG đọc từ file này — cấu hình trong giao diện admin.
# Liệt kê ở đây để biết cần chuẩn bị những gì khi dựng mới.
# ==========================================================
# Token GoShip                    → /admin/setting/api-shipping
# VNPay TmnCode / HashSecret / URL → /admin/setting/api-payment
# ZaloPay AppId / Key1 / Key2      → /admin/setting/api-payment
# Google & Facebook OAuth          → /admin/setting/api-login-social
# Gmail user + app password        → /admin/setting/api-app-password
# Domain website                   → /admin/setting/general
#
# LƯU Ý: API key OpenMap hiện đang hard-code trong
# helpers/location.helper.ts — sẽ đưa ra ENV ở batch 4E.
```

Tạo `file-manager/.env.example`:

```bash
# Origin của website ecommerce.
# Middleware checkDomain kiểm tra header Referer phải bắt đầu bằng giá trị này.
DOMAIN=

# Cổng chạy service
PORT=4000

# Bí mật chia sẻ — PHẢI giống hệt project-ecommerce-t8-25/.env
FILE_MANAGER_SECRET=
```

**Kiểm tra trước khi commit — bắt buộc:**

```bash
cd "/d/Middle Nodejs/Node TH"
cat project-ecommerce-t8-25/.env.example
cat file-manager/.env.example
```

Đọc bằng mắt: **mọi dòng `KEY=` phải trống phía sau dấu `=`** (trừ `PORT=4000`). Nếu thấy bất kỳ giá trị thật nào → xoá đi rồi kiểm lại.

> **Vì sao phải chia hai phần:** hơn nửa số biến trong `.env` hiện tại **không được code đọc** — chúng được lấy từ collection `settings` trong MongoDB. Ví dụ `GOSHIP_TOKEN` nằm trong `.env` nhưng code lại đọc `Setting{key:"apiShipping"}.data.tokenGoShip`. Nếu chép nguyên `.env` sang, người dựng môi trường mới sẽ điền đủ 31 biến mà hệ thống vẫn không chạy.

### Bước 9 — Tạo workflow CI

Tạo `.github/workflows/ci.yml` ở **gốc monorepo**:

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:

jobs:
  typecheck:
    name: Typecheck ${{ matrix.service }}
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        service: [ project-ecommerce-t8-25, file-manager ]
    env:
      # Chỉ kiểm tra kiểu, không cần Chromium — tiết kiệm ~2 phút mỗi lần chạy
      PUPPETEER_SKIP_DOWNLOAD: "true"
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: ${{ matrix.service }}/package-lock.json

      - name: Cài dependency
        run: npm ci
        working-directory: ${{ matrix.service }}

      - name: Kiểm tra kiểu TypeScript
        run: npm run typecheck
        working-directory: ${{ matrix.service }}

  docker-build:
    name: Build Docker images
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Tạo file env rỗng
        # docker compose cần env_file tồn tại, mà .env.docker bị gitignore
        run: |
          touch project-ecommerce-t8-25/.env.docker
          touch file-manager/.env.docker

      - name: Build
        run: docker compose build
```

Commit:

```bash
cd "/d/Middle Nodejs/Node TH"
git add .github \
        project-ecommerce-t8-25/tsconfig.json \
        project-ecommerce-t8-25/package.json \
        project-ecommerce-t8-25/.env.example \
        file-manager/package.json \
        file-manager/.env.example
git commit -m "Sửa tsconfig, thêm script typecheck, .env.example và CI"
```

🔴 **Trước khi commit, kiểm lần cuối rằng không có secret nào lọt vào:**

```bash
git diff --cached -- '*.env.example'
```

Đọc kỹ output. Nếu thấy bất kỳ giá trị thật nào (chuỗi Atlas, key, mật khẩu) → `git reset` và sửa lại.

### Bước 10 — Tạo repo GitHub mới và đẩy lên

Tạo repo mới trên GitHub, **để chế độ Private**, tên gợi ý: `ecommerce-monorepo`.

> Nên để private: repo chứa cấu trúc luồng thanh toán và tên biến môi trường. `.env` không bị commit, nhưng không có lý do gì phải công khai.

```bash
cd "/d/Middle Nodejs/Node TH"
git remote add origin https://github.com/mquanggdev/<TÊN-REPO-MỚI>.git
git push -u origin main
```

Vào tab **Actions** trên GitHub, xác nhận workflow chạy và **xanh cả 3 job**.

### 🛑 CHỐT KIỂM TRA — DỪNG Ở ĐÂY

**Làm xong Bước 10 thì DỪNG LẠI. Chưa xoá gì cả.**

Báo cho Claude để đối chiếu độc lập hai thứ mà chỉ đọc báo cáo thì không chắc được:

1. Lịch sử git của **cả hai** repo cũ có thật sự sang đủ không
2. CI có thật sự xanh không

Chỉ chạy Bước 11 và 12 **sau khi Claude xác nhận**.

> Lý do: Bước 11 xoá `_src-*`, mà đó là nơi duy nhất còn giữ 4 file `.env` gốc. Nếu monorepo có lỗi mà đã xoá rồi thì không lùi được (ngoài bản sao lưu ở Bước 0). Thêm một lượt mắt thứ hai ở đây gần như không tốn gì.

### Bước 11 — Dọn dẹp (chỉ sau khi Claude xác nhận)

```bash
cd "/d/Middle Nodejs/Node TH"
rm -rf _src-ecommerce _src-file-manager
ls
```

Kết quả cuối:

```
Node TH/
├── .git/
├── .github/workflows/ci.yml
├── .gitignore
├── docker-compose.yml
├── docs/
├── file-manager/
└── project-ecommerce-t8-25/
```

### Bước 12 — Lưu trữ hai repo cũ trên GitHub

Vào Settings của `PrjEcormerceT8` và `File-Manager` → **Archive repository**.

**Đừng xoá.** Lưu trữ là đủ: chúng thành chỉ-đọc, vẫn giữ lịch sử, vẫn là phương án dự phòng.

---

## 4. CÁCH TỰ KIỂM CHỨNG

### KC-1. Lịch sử của cả hai repo có mặt

```bash
cd "/d/Middle Nodejs/Node TH"
git log --oneline | wc -l                    # phải > 20
git log --oneline -- project-ecommerce-t8-25 | tail -3
git log --oneline -- file-manager | tail -3
```

Cả hai lệnh sau phải ra commit cũ (`up1`, `Up 5/4`, …), không phải chỉ 1 commit.

### KC-2. Typecheck sạch ở cả hai service

```bash
cd project-ecommerce-t8-25 && npm run typecheck && echo "ECOM OK"
cd ../file-manager && npm run typecheck && echo "FM OK"
```

Cả hai phải in `OK`, không có dòng lỗi nào. **Không được dùng cờ `--ignoreDeprecations` nữa.**

### KC-3. Ứng dụng vẫn chạy được

```bash
cd "/d/Middle Nodejs/Node TH/project-ecommerce-t8-25"
npm run dev
```

Mở `http://localhost:3000/` và `http://localhost:3000/admin/dashboard` — phải lên bình thường, log phải có `Kết nối DB thành công!`.

Nếu báo lỗi kết nối DB → `.env` chưa được chép đúng ở Bước 7.

### KC-4. `docker-compose.yml` đã được version control

```bash
cd "/d/Middle Nodejs/Node TH"
git ls-files | grep compose
```

Phải ra `docker-compose.yml`. Đây là mục tiêu chính của việc gộp repo.

### KC-5. CI xanh trên GitHub

Tab Actions → lần chạy mới nhất → cả 3 job (`typecheck (project-ecommerce-t8-25)`, `typecheck (file-manager)`, `docker-build`) đều ✅.

> `docker-build` mất khoảng 4–6 phút vì phải cài Puppeteer trong image. Đây là bình thường. Nếu quá phiền, xoá job đó đi — hai job typecheck mới là phần giá trị chính.

---

## 5. ĐỊNH NGHĨA HOÀN THÀNH

- [ ] Đã sao lưu `Node TH-BACKUP-*` và xác nhận tồn tại
- [ ] Hai repo cũ đã push hết lên GitHub
- [ ] `git subtree add` thành công cho cả hai
- [ ] KC-1: số file track khớp, lịch sử cũ có mặt
- [ ] 4 file `.env` đã chép lại, `git status` rỗng
- [ ] `tsconfig.json` đã bỏ `ignoreDeprecations`
- [ ] Script `typecheck` có ở cả hai `package.json`
- [ ] Hai file `.env.example` đã tạo, **đã kiểm bằng mắt là không có giá trị thật**
- [ ] `.github/workflows/ci.yml` đã tạo
- [ ] KC-2: typecheck sạch, **không cần cờ vá tạm**
- [ ] KC-3: `npm run dev` chạy được, kết nối DB thành công
- [ ] KC-4: `docker-compose.yml` đã trong git
- [ ] KC-5: CI xanh trên GitHub
- [ ] 🛑 **Đã báo Claude và nhận xác nhận** *(chốt kiểm tra sau Bước 10)*
- [ ] Đã xoá `_src-*` (chỉ sau khi có xác nhận)
- [ ] Đã archive hai repo cũ

---

## 6. BẪY CẦN TRÁNH

| Bẫy | Vì sao |
|---|---|
| **Bỏ qua Bước 0** | Không có đường lùi. Bắt buộc sao lưu. |
| **Xoá `_src-*` trước khi kiểm chứng** | `.env` nằm trong đó và **không có bản nào khác**. Mất là mất hết secret. |
| Xoá hai repo cũ trên GitHub | Archive, đừng xoá. Chúng là phương án dự phòng cuối cùng. |
| Dùng URL GitHub thay vì thư mục local ở Bước 4–5 | Nếu có commit chưa push, bạn sẽ mất nó. |
| Quên chép `node_modules` | Không hỏng gì, chỉ mất thêm ~5 phút chạy `npm install` lại. |
| Đặt repo mới ở chế độ Public | Repo chứa cấu trúc luồng thanh toán. Để Private. |
| Bật CI khi typecheck còn đỏ | Bước 8 phải xong **trước** Bước 9. |
| Thêm job test vào CI ngay | Chưa có test nào. Job sẽ đỏ vĩnh viễn. Thêm ở batch 4G. |

---

## KẾT QUẢ THỰC THI

*(Điền sau khi làm xong — xem mẫu ở mục 2.5 của `2-KE-HOACH-TONG-THE.md`)*
