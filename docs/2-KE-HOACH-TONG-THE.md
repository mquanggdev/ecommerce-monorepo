# 2 — KẾ HOẠCH TỔNG THỂ

| | |
|---|---|
| **Người lập kế hoạch** | Claude Opus 5 |
| **Người thực thi** | CODEX |
| **Ngày lập** | 07/09/2026 |
| **Nguồn** | Tổng hợp từ `1-ĐÁNH-GIÁ-TỔNG-QUAN+CODEX.md` và `1-ĐÁNH-GIÁ-TỔNG-QUAN-claude-opus-5.md` |

> **CODEX: đọc trọn file này TRƯỚC KHI bắt đầu bất kỳ batch nào.**
> File này chứa bối cảnh, quy tắc và quy ước. File batch (`3A`, `3B`, …) chỉ chứa việc cụ thể.

---

## 1. BỐI CẢNH HỆ THỐNG

Đọc mục này là đủ — **không cần đọc lại hai báo cáo đánh giá**.

### 1.1. Hệ thống gồm 2 service

| Service | Thư mục | Cổng | Vai trò |
|---|---|---|---|
| `ecommerce` | `project-ecommerce-t8-25/` | 3000 | Website bán hàng + trang quản trị + Socket.IO + cron |
| `file-manager` | `file-manager/` | 4000 | CDN nội bộ: nhận upload, lưu xuống đĩa, phục vụ file tĩnh |

Giao tiếp: `ecommerce` gọi `file-manager` qua HTTP + header `Authorization: Bearer ${FILE_MANAGER_SECRET}`.
Database: **MongoDB Atlas bên ngoài** — không có container mongo, không được thêm.

### 1.2. Stack

TypeScript 5.9 (chạy qua `ts-node`, **chưa build**) · Express 5 · Mongoose 9 · Pug SSR · Socket.IO 4.8 · Joi · Multer (memoryStorage) · Passport (Google/Facebook) · node-cron.

Tích hợp ngoài: VNPay, ZaloPay, GoShip (sandbox), OpenMap, Groq (Llama 3.1), Gmail SMTP.

### 1.3. Cấu trúc thư mục `ecommerce`

```
configs/      database, variable, setting, googleOauth, facebookOauth
controllers/  admin/ (16 file)  client/ (12 file)
helpers/      11 file
interfaces/   request.interface.ts
jobs/         index.job.ts, chat.job.ts
middlewares/  admin/auth  client/(article,attribute,auth,category,chat,seo,setting)
models/       20 model + schemas/seo.schema.ts
routes/       admin/ (17)  client/ (13)
sockets/      index, auth, chat
validates/    admin/ (6)  client/ (4)
views/        admin/(layouts,mixins,pages,partials)  client/(blocks,layouts,mixins,pages,partials)
public/       admin/assets/  client/assets/
```

### 1.4. Trạng thái hiện tại

> Cập nhật 07/09/2026 sau khi hoàn tất batch **2B**.

- **Cấu trúc là monorepo** tại `Node TH/`, một repo git duy nhất chứa cả hai service, `docker-compose.yml` và `docs/`. Hai repo cũ (`PrjEcormerceT8`, `File-Manager`) đã được archive trên GitHub, giữ làm dự phòng.
- Việc chuyển `domainCDN` → `domainPublic` **đã làm dở và đã commit làm mốc nền**: `configs/variable.config.ts` đọc `CDN_URL` từ ENV, `index.ts` có `app.locals.domainPublic`, 2 trang admin đã đổi, và `views/admin/layouts/default.pug` khai báo **cả hai** biến cho JavaScript. Batch **3B** sẽ migrate nốt 48 vị trí còn lại rồi bỏ `domainCDN` khỏi tầng trình duyệt.
- `tsconfig.json` đã bỏ `ignoreDeprecations`. **`npm run typecheck` chạy sạch ở cả hai service** — dùng lệnh này, không cần cờ vá tạm nào.
- **Có CI** (`.github/workflows/ci.yml`): mỗi lần push/PR chạy typecheck cả hai service + `docker compose build`. **CI phải xanh trước khi merge bất kỳ nhánh nào.**
- `npm test` vẫn chưa có gì — test được thêm ở batch 4G.

---

## 2. QUY TẮC THỰC THI — BẮT BUỘC

### 2.1. Phạm vi

1. **Chỉ sửa những file được liệt kê ở mục "Được sửa" của batch.** Nếu thấy cần sửa file ngoài danh sách → **dừng lại và báo cáo**, không tự ý sửa.
2. **Không refactor ngoài phạm vi.** Thấy code xấu ở chỗ khác thì ghi vào mục "Phát hiện thêm" của báo cáo, đừng sửa.
3. **Không đổi `String` sang `ObjectId`** trong bất kỳ model nào. Toàn hệ thống đang dùng `String` cho quan hệ; đổi lẻ tẻ sẽ làm vỡ dữ liệu. Đây là việc riêng, có batch riêng sau này.
4. **Không đổi tên** route, hàm export, biến `res.locals`, tên collection đã có.
5. **Không cài thư viện ngoài danh sách** ghi trong batch.
6. **Không định dạng lại (reformat) file.** Chỉ đụng vào những dòng cần đổi, để diff dễ đọc.

### 2.2. Khi gặp mơ hồ

**Không tự suy diễn.** Nếu một yêu cầu trong batch không khớp với code thực tế (ví dụ số dòng lệch, hàm không tồn tại, mô tả sai) → **dừng, ghi rõ chỗ lệch, báo cáo lại**. Kế hoạch có thể sai; code là sự thật.

### 2.3. Git

Repo là **monorepo**, gốc ở `Node TH/`. Mọi lệnh git chạy từ gốc đó, không phải trong thư mục service.

- **Mỗi batch một nhánh riêng**, đặt tên theo mã batch:
  ```bash
  cd "/d/Middle Nodejs/Node TH"
  git checkout main && git pull
  git checkout -b fix/3a-xss-chat
  ```
- Commit trên nhánh đó. **Tuyệt đối không merge vào `main`**, không `git rebase`.
- **Được phép `git push` nhánh của mình** để CI chạy — đây là cách kiểm chứng, xem 2.4. Không push vào `main`.
- Cuối commit message thêm dòng:
  ```
  Co-Authored-By: Codex <noreply@openai.com>
  ```

### 2.4. Kiểm chứng

Được phép chạy:

| Lệnh | Dùng khi |
|---|---|
| `npm run typecheck` | Sau **mọi** thay đổi file `.ts`. Chạy trong thư mục service liên quan. |
| `npm install <package>` | Chỉ với thư viện được ghi rõ trong batch |
| `npm run dev` + gọi thử endpoint | Khi batch yêu cầu kiểm chứng hành vi |
| `docker compose up --build` | Khi batch yêu cầu (chủ yếu 3B). Chạy từ gốc monorepo. |
| `git push origin <nhánh>` | Để CI chạy trên nhánh |

**Hai nguyên tắc bắt buộc:**

1. Không được tuyên bố "đã xong" nếu chưa chạy phần "Cách tự kiểm chứng" của batch và **dán kết quả thật** vào báo cáo.
2. **CI phải xanh.** Sau khi push nhánh, kiểm tra tab Actions. Nếu đỏ → sửa cho xanh rồi mới báo cáo hoàn thành.

### 2.5. Báo cáo cuối mỗi batch

Ghi vào cuối chính file batch đó, mục `## KẾT QUẢ THỰC THI`:

```markdown
## KẾT QUẢ THỰC THI
- Nhánh: fix/3a-xss-chat
- File đã sửa: <liệt kê>
- Kết quả kiểm chứng: <dán output thật của lệnh>
- Yêu cầu KHÔNG làm được + lý do: <nếu có>
- Phát hiện thêm ngoài phạm vi: <nếu có, chỉ ghi, không sửa>
```

---

## 3. QUY ƯỚC CODEBASE — VIẾT CODE PHẢI KHỚP

### 3.1. Định dạng response JSON

Toàn hệ thống dùng đúng một dạng. **Giữ nguyên, kể cả khi biết nó chưa chuẩn REST:**

```ts
res.json({ code: "success", message: "Tạo sản phẩm thành công!" })
res.json({ code: "error",   message: "Dữ liệu không hợp lệ!" })
```

Hiện tại lỗi vẫn trả HTTP 200. **Không tự đổi status code** — có batch riêng (7A) chuẩn hóa việc này.

### 3.2. Đặt tên hàm controller

| Kiểu | Tên hàm |
|---|---|
| GET trang tạo | `create` |
| POST tạo | `createPost` |
| GET trang sửa | `edit` |
| PATCH sửa | `editPatch` |
| PATCH xóa mềm | `deletePatch` |
| DELETE xóa hẳn | `destroyDelete` |
| GET danh sách | `list` |

### 3.3. Khác

- **Comment bằng tiếng Việt**, đúng phong cách file hiện tại.
- Tài khoản đang đăng nhập: `res.locals.accountAdmin` / `res.locals.accountUser`.
- Xóa mềm: `{ deleted: true, deletedAt: Date.now() }`; mọi truy vấn kèm `deleted: false`.
- Render: `res.render("admin/pages/<ten>", { pageTitle: "...", ... })`.
- Biến admin path: `pathAdmin` từ `configs/variable.config.ts`, không hard-code `"admin"`.

---

## 4. SƠ ĐỒ PHỤ THUỘC

```
ĐỢT 0 — NỀN TẢNG
  2B  Monorepo + tsconfig + CI     ← PHẢI XONG TRƯỚC MỌI BATCH KHÁC
       ↓
ĐỢT 1 — CHẶN
  3A  XSS chat + Helmet
       ↓  ⚠ BẮT BUỘC tuần tự: cả hai batch cùng sửa 2 file chat.js
  3B  Docker + domainPublic
       │
  3C  Idempotent thanh toán       (độc lập)
       │
  3D  Đơn hàng (1): validate + tồn kho
       ↓
  3E  Đơn hàng (2): coupon + điểm + total
       ↓
  3F  Tách order.service.ts       ← phải sau 3D, 3E

ĐỢT 2 — BẢO MẬT & ỔN ĐỊNH
  4A file-manager path safety · 4B RBAC định nghĩa quyền
  4C RBAC ownership chat (sau 4B) · 4D 10 lỗi lẻ
  4E auth hardening · 4F đúng đắn dữ liệu · 4G test + tsconfig

ĐỢT 3 — PHẦN LẶP LẠI
  5A làm mẫu module Sản phẩm  →  5B..5x áp mẫu cho các module còn lại

ĐỢT 4 — CHỨC NĂNG CÒN THIẾU     ĐỢT 5 — KỸ THUẬT
```

**Thứ tự bắt buộc:** 3A → 3B → 3C → 3D → 3E → 3F. Không nhảy cóc, vì 3F sửa lại chính code mà 3D/3E vừa viết.

---

## 5. ĐẶC TẢ ĐỢT 0 VÀ ĐỢT 1

### 2B — Monorepo + tsconfig + CI ✅ *(đã có brief: `2B-MONOREPO-VA-CI.md`)*

Gộp hai repo thành một, sửa `tsconfig`, dựng CI. **Phải xong trước mọi batch khác** — vì batch 3B sẽ sửa `docker-compose.yml`, file hiện đang không thuộc repo nào.

---

Batch **3A** và **3B** đã có brief đầy đủ (file riêng). **3C–3F** dưới đây mới là đặc tả tóm tắt — brief đầy đủ sẽ được viết **sau khi review kết quả 3A**, để điều chỉnh cho khớp thực tế.

### 3A — XSS chat + Helmet ✅ *(đã có brief: `3A-XSS-CHAT-VA-CSP.md`)*

Người dùng gửi `<img src=x onerror=...>` trong chat → chạy trong phiên admin. Sửa 4 điểm render + thêm security header.

### 3B — Docker + domainPublic ✅ *(đã có brief: `3B-DOCKER-VA-DOMAIN-PUBLIC.md`)*

Hoàn tất việc chuyển `domainCDN` → `domainPublic` (48 vị trí / 28 file) + thêm volume Docker cho `media`.

### 3C — Idempotent callback thanh toán *(brief sẽ viết sau)*

**Vấn đề:** `helpers/point.helper.ts` cộng điểm bằng `$inc` không có cờ chặn. `paymentVNPayResult` là route **GET** — khách bấm F5 trên trang trả về của VNPay là điểm cộng lại, không giới hạn. Ngoài ra `paymentVNPayResult` chỉ kiểm tra chữ ký, **không kiểm tra `vnp_ResponseCode` / `vnp_TransactionStatus` / `vnp_Amount`** → giao dịch thất bại vẫn được đánh dấu `paid`.

**Hướng xử lý:**
- Thêm vào `Order`: `paidAt: Date`, `pointsAwardedAt: Date`, `payment: { provider, transactionId, responseCode, rawCallbackAt }`.
- Chuyển `unpaid → paid` bằng **conditional update**: `updateOne({ code, paymentStatus: "unpaid" }, {...})`, chỉ cộng điểm khi `modifiedCount === 1`.
- Kiểm tra đủ: `vnp_ResponseCode === "00"`, `vnp_TransactionStatus === "00"`, `vnp_Amount === order.total * 100`.
- ZaloPay: lưu `app_trans_id`, kiểm tra `amount`.

**Được sửa:** `controllers/client/order.controller.ts`, `helpers/point.helper.ts`, `models/order.model.ts`.

### 3D — Toàn vẹn đơn hàng (1): validate item + tồn kho *(brief sẽ viết sau)*

**Vấn đề:** `validates/client/order.validate.ts` chỉ kiểm `items` là mảng ≥ 1, không validate từng phần tử → `quantity` có thể là 0, âm, thập phân. Không có chỗ nào trừ `Product.stock` (`grep '$inc'` toàn source không ra kết quả nào chạm `stock`). `variantMatched.priceNew` ở `order.controller.ts:74` có thể `undefined` → crash.

**Hướng xử lý:**
- Joi: validate schema từng item — `productId` (string ≥ 1), `quantity` (integer, 1..100), `variant` (array optional).
- Kiểm tra `variantMatched` tồn tại trước khi đọc giá; variant phải `status: true`.
- Trừ tồn kho bằng conditional update: `updateOne({ _id, stock: { $gte: qty } }, { $inc: { stock: -qty } })`, `modifiedCount === 0` → báo hết hàng.
- Đơn bị hủy/trả (`admin/order.editPatch`) → hoàn kho.
- Nếu sau khi lọc mà `items` rỗng → trả lỗi, không tạo đơn.

**Được sửa:** `validates/client/order.validate.ts`, `controllers/client/order.controller.ts`, `controllers/admin/order.controller.ts`.

### 3E — Toàn vẹn đơn hàng (2): coupon + điểm + total *(brief sẽ viết sau)*

**Vấn đề:** `order.controller.ts:169` tăng `usedCount` bằng read-modify-write (race condition) và **tăng TRƯỚC khi gọi GoShip + trước khi lưu đơn** → lỗi bước sau thì mã đã bị tiêu mà không có đơn. Dòng 249 tiêu **toàn bộ** điểm của khách, không cho chọn. `total` có thể âm.

**Hướng xử lý:**
- `Coupon.updateOne({ _id, status:"active", $expr: { $lt: ["$usedCount","$usageLimit"] } }, { $inc: { usedCount: 1 } })` — atomic, kiểm `modifiedCount`.
- Dời việc tăng `usedCount` xuống **sau khi `newRecord.save()` thành công**; nếu lỗi giữa chừng thì hoàn lại.
- Nhận `usedPoint` từ `req.body`, validate `0 ≤ usedPoint ≤ (totalPoint - usedPoint)`, trừ đúng số đó.
- `dataFinal.total = Math.max(0, ...)`.
- Tách logic coupon dùng chung ra `helpers/coupon.helper.ts` (hiện đang lặp ở `coupon.controller.ts` và `order.controller.ts`).

**Được sửa:** `controllers/client/order.controller.ts`, `controllers/client/coupon.controller.ts`, `helpers/coupon.helper.ts` (tạo mới), `validates/client/order.validate.ts`.

### 3F — Tách `order.service.ts` *(brief sẽ viết sau)*

Sau khi 3D/3E làm cho logic đúng, tách phần nghiệp vụ (~250 dòng trong `createPost`) ra `services/order.service.ts`. Controller chỉ còn: đọc request → gọi service → trả response.

**Không** làm refactor toàn bộ sang `src/modules/`. Chỉ tách 1 service này.

---

## 6. TÓM TẮT CÁC ĐỢT SAU

| Mã | Việc | Nguồn phát hiện |
|---|---|---|
| 4A | `file-manager`: hàm `resolveInsideMediaRoot()`, allowlist MIME, `limits.fileSize`, escape + neo `^` cho RegExp xóa folder | Cả hai báo cáo |
| 4B | Bổ sung `permissionList` đủ ~45 quyền + gắn `checkPermission` toàn bộ route admin + sửa quyền xóa admin (đang dùng nhầm `account-admin-edit`) | Cả hai |
| 4C | Ownership chat (`detail`, `rate`, 4 endpoint AI đang không kiểm `adminId`) + ẩn menu theo quyền trong `startbar.pug` | CODEX |
| 4D | 10 lỗi lẻ: `$or` bị ghi đè, `article.detail` thiếu null check, `socket.join(chatRoom.id)` null, template null, `countDocuments({})`, `listFolder != "undefined"`, `render('success')`, `authSocket` thiếu `next()`, `ADMIN_TYPING` không kiểm role, timezone trừ 2 lần | Cả hai |
| 4E | Rate limit, OTP 6 số + consume + đếm lần thử, đổi mật khẩu yêu cầu mật khẩu cũ, `connect-mongo`, rotate key OpenMap hard-code | Cả hai |
| 4F | `ratingAvg` chỉ tính review đã duyệt, review chỉ cho đơn `completed`, `runValidators`, thêm index + unique index | CODEX |
| 4G | 3 test luồng tiền (total không âm · coupon chạy đồng thời · callback thanh toán lặp) + thêm job test vào CI | CODEX (rút gọn) |
| 5A | **Làm mẫu đầy đủ cho module Sản phẩm**: trash/undo/destroy + validate + AdminLog + bộ lọc trạng thái | Claude |
| 5B–5x | Áp đúng mẫu 5A cho: Bài viết, Danh mục SP, Thuộc tính, Coupon, Nhóm quyền, TK quản trị, Block, Template | Claude |
| 5Z | Trang xem AdminLog (`/admin/log/list`) | Claude |
| 6A | Khách hủy đơn + hoàn kho/điểm/coupon | Cả hai |
| 6B | Quản lý khách hàng ở admin (khóa/mở, chi tiết, lịch sử) | CODEX |
| 6C | Comment blog + newsletter (hiện chỉ là UI mẫu, không có model/route) | CODEX |
| 6D | Trang contact / policy / FAQ (hiện link `#`) | CODEX |
| 7A | Global error handler + trang 404 + chuẩn hóa HTTP status | Cả hai |
| 7B | Cache danh mục & toạ độ cửa hàng, gom N+1 query | Claude |
| 7C | Dockerfile production (multi-stage, `npm ci`, build TS, non-root) + README | Cả hai |

---

## 7. NHỮNG VIỆC CỐ Ý KHÔNG LÀM

Ghi rõ ở đây để CODEX không tự ý làm:

| Việc | Lý do |
|---|---|
| Refactor sang `src/modules/ + infrastructure/ + web/` | 121 file TS, project đang 75% xong, một người làm — rủi ro cao, không có giá trị người dùng thấy được. Thay bằng tách service dần (3F và các batch sau). |
| Chuyển quan hệ `String` → `ObjectId` | Phải migrate dữ liệu; là dự án riêng, không gộp vào batch sửa lỗi. |
| Thêm Redis | Chưa có nhu cầu: 1 instance, session dùng `connect-mongo` là đủ, cache dùng in-memory là đủ. |
| Thêm Kubernetes | Quy mô 2 container / 1 VPS. Không phù hợp. |
| Dựng secret manager | Với 1 VPS thì `.env` + quyền file là đủ. Chỉ rotate key OpenMap đang hard-code (batch 4E). |
| Đổi cart/wishlist/compare từ `localStorage` sang DB | Là tính năng mới, không phải sửa lỗi. Xét sau Đợt 4. |
| Bỏ `unsafe-inline` khỏi CSP | Cần đổi mọi inline script trong Pug sang nonce — batch riêng, sau Đợt 2. |

---

## 8. QUY TRÌNH LÀM VIỆC

```
Claude viết brief batch
        ↓
CODEX: git checkout -b fix/<mã>  →  làm  →  tự kiểm chứng
        →  git push origin <nhánh>  →  đợi CI xanh  →  ghi KẾT QUẢ THỰC THI
        ↓
Người dùng báo Claude
        ↓
Claude review diff  →  xác nhận / yêu cầu sửa  →  viết brief batch tiếp theo
        ↓
Người dùng merge nhánh vào main (chỉ khi CI xanh)
```

**Không viết trước toàn bộ 25 brief.** Lý do: nếu format hoặc mức chi tiết chưa phù hợp, phát hiện ở batch thứ 3 thì phải sửa 22 file còn lại.
