# BÁO CÁO 1 — ĐÁNH GIÁ TỔNG QUAN HỆ THỐNG

| | |
|---|---|
| **Agent thực hiện** | Claude Opus 5 (`claude-opus-5`) — chạy trong Claude Code |
| **Ngày lập** | 07/09/2026 |
| **Phạm vi đọc** | `D:\Middle Nodejs\Node TH\` — gồm `project-ecommerce-t8-25`, `file-manager`, `docker-compose.yml` |
| **Nhánh git** | `main` — commit gần nhất `43d0fc8 Update 5/4` |
| **Loại báo cáo** | Đánh giá kiến trúc + kiểm kê chức năng + phát hiện rủi ro |

---

## MỤC LỤC

1. [Tóm tắt điều hành](#1-tóm-tắt-điều-hành)
2. [Kiến trúc hệ thống](#2-kiến-trúc-hệ-thống)
3. [Công nghệ & phụ thuộc](#3-công-nghệ--phụ-thuộc)
4. [Mô hình dữ liệu](#4-mô-hình-dữ-liệu)
5. [Bản đồ chức năng — khu vực Admin](#5-bản-đồ-chức-năng--khu-vực-admin)
6. [Bản đồ chức năng — khu vực Client](#6-bản-đồ-chức-năng--khu-vực-client)
7. [Các luồng nghiệp vụ chính](#7-các-luồng-nghiệp-vụ-chính)
8. [Những phần CHƯA HOÀN THIỆN](#8-những-phần-chưa-hoàn-thiện)
9. [Lỗi & rủi ro phát hiện được](#9-lỗi--rủi-ro-phát-hiện-được)
10. [Đánh giá bảo mật](#10-đánh-giá-bảo-mật)
11. [Đánh giá DevOps / Docker](#11-đánh-giá-devops--docker)
12. [Chất lượng mã nguồn](#12-chất-lượng-mã-nguồn)
13. [Lộ trình đề xuất](#13-lộ-trình-đề-xuất)
14. [Phụ lục](#14-phụ-lục)

---

## 1. TÓM TẮT ĐIỀU HÀNH

### 1.1. Hệ thống này là gì

Đây là một **nền tảng thương mại điện tử full-stack** viết bằng **TypeScript + Express 5 + MongoDB (Mongoose) + Pug SSR**, tách thành **2 service độc lập** chạy chung bằng Docker Compose:

| Service | Cổng | Vai trò |
|---|---|---|
| `ecommerce` | 3000 | Toàn bộ website: trang bán hàng (client) + trang quản trị (admin) + WebSocket chat + cron job |
| `file-manager` | 4000 | Đóng vai trò **CDN nội bộ**: nhận upload, lưu file xuống ổ đĩa, phục vụ file tĩnh, quản lý thư mục |

Hai service giao tiếp với nhau qua **HTTP + shared secret** (`FILE_MANAGER_SECRET`), không dùng chung database — `file-manager` **hoàn toàn stateless về DB**, mọi metadata file (`folder`, `filename`, `mimetype`, `size`) được lưu ở collection `media` phía service `ecommerce`.

### 1.2. Mức độ hoàn thiện

**Ước tính khoảng 75–80% so với một hệ thống e-commerce production.**

Điểm mạnh nổi bật — hệ thống đã đi xa hơn rất nhiều so với một project học tập thông thường:

- ✅ **Kiến trúc microservice thật** (tách CDN riêng, có auth giữa 2 service)
- ✅ **Page Builder động** (Block + Template) — cho phép dựng trang chủ bằng cách kéo-ghép block mà không sửa code
- ✅ **Thanh toán thật**: tích hợp VNPay + ZaloPay (có ký HMAC, có callback IPN)
- ✅ **Vận chuyển thật**: tích hợp GoShip (tính phí, tạo vận đơn) + reverse-geocoding OpenMap
- ✅ **Chat realtime** Socket.IO với load-balancing admin, đếm tin chưa đọc, gửi file, đánh giá phiên chat
- ✅ **Tích hợp AI (Groq / Llama 3.1)**: gợi ý câu trả lời, sửa câu trả lời, tóm tắt hội thoại, phân tích cảm xúc khách hàng
- ✅ **SEO đầy đủ**: sitemap.xml động, robots.txt, canonical, meta SEO/OG per-product, ping Google
- ✅ **Biến thể sản phẩm (variants) + thuộc tính động** — phần khó nhất của e-commerce
- ✅ **Xuất hoá đơn PDF** bằng Puppeteer
- ✅ **Hệ thống điểm thưởng**, mã giảm giá, wishlist, so sánh, lịch sử xem
- ✅ **RBAC** (phân quyền theo nhóm quyền) + audit log admin có TTL 30 ngày
- ✅ **Cron job** tự dọn phòng chat cũ (10 ngày) kèm xoá file liên quan

### 1.3. Kết luận nhanh

Phần **"chưa hoàn thiện"** mà bạn đề cập **không phải là thiếu tính năng lớn**, mà là **thiếu tính nhất quán**: bạn đã làm mẫu đầy đủ cho *một vài* module (ví dụ Bài viết có đủ thùng rác/khôi phục/xoá vĩnh viễn, Bài viết có đủ phân quyền), nhưng **chưa nhân bản mẫu đó ra các module còn lại** (Sản phẩm, Mã giảm giá, Đơn hàng, Đánh giá, Block, Template…).

Chi tiết đầy đủ ở [Mục 8](#8-những-phần-chưa-hoàn-thiện).

Ngoài ra tôi phát hiện **một số lỗi thật sự có thể gây sập hoặc sai tiền** (không phải chỉ là "thiếu tính năng"), quan trọng nhất là:

- 🔴 Đặt hàng **không trừ tồn kho** — bán vượt kho vô hạn
- 🔴 Đặt hàng **tự động tiêu hết điểm** của khách, khách không được chọn
- 🔴 Puppeteer (xuất PDF) **gần như chắc chắn chết** trong Docker `node:22-alpine`
- 🔴 `docker-compose` **không có volume** cho `file-manager/media` → **mất toàn bộ file upload** mỗi lần rebuild container
- 🔴 OTP quên mật khẩu chỉ **4 chữ số, không giới hạn số lần thử**

---

## 2. KIẾN TRÚC HỆ THỐNG

### 2.1. Sơ đồ tổng thể

```
                          ┌─────────────────────────────┐
                          │        TRÌNH DUYỆT          │
                          │  (Khách hàng  /  Admin)     │
                          └──────┬───────────────┬──────┘
                                 │ HTTP          │ WebSocket
                                 │ :3000         │ (socket.io)
                    ┌────────────▼───────────────▼────────────┐
                    │      SERVICE: ecommerce  (:3000)        │
                    │  ────────────────────────────────────   │
                    │  Express 5 + Pug SSR                    │
                    │   ├── routes/client/*  → 12 controller  │
                    │   ├── routes/admin/*   → 16 controller  │
                    │   ├── sockets/         → chat realtime  │
                    │   └── jobs/            → node-cron      │
                    └───┬────────────┬──────────────┬─────────┘
                        │            │              │
          ┌─────────────▼──┐   ┌─────▼──────┐  ┌────▼──────────────────┐
          │  MongoDB Atlas │   │ file-manager│  │  DỊCH VỤ BÊN NGOÀI    │
          │   (mongoose)   │   │   (:4000)   │  │  ─────────────────    │
          │   20 model     │   │             │  │  • VNPay              │
          └────────────────┘   │  multer     │  │  • ZaloPay            │
                               │  fs (đĩa)   │  │  • GoShip (sandbox)   │
                               │  ./media/   │  │  • OpenMap (geocode)  │
                               └─────────────┘  │  • Groq (Llama 3.1)   │
                                                │  • Google/Facebook    │
                                                │    OAuth2             │
                                                │  • Gmail SMTP         │
                                                └───────────────────────┘
```

### 2.2. Giao tiếp giữa 2 service

**Chiều `ecommerce` → `file-manager`** (dùng `axios` + `form-data`):

| Endpoint `file-manager` | Method | Được gọi từ |
|---|---|---|
| `/file-manager/upload` | POST | `admin/file-manager.controller`, `admin/chat.controller`, `client/chat.controller`, `client/dashboard.controller` (avatar + ảnh review) |
| `/file-manager/change-file-name` | PATCH | `admin/file-manager.controller` |
| `/file-manager/delete-file` | PATCH | `admin/file-manager.controller`, `client/dashboard.controller`, `sockets/chat.socket` |
| `/file-manager/folder/create` | POST | `admin/file-manager.controller` |
| `/file-manager/folder/list` | GET | `admin/file-manager.controller` |
| `/file-manager/folder/delete` | PATCH | `admin/file-manager.controller`, `sockets/chat.socket`, `jobs/chat.job` |

Tất cả đều gửi header `Authorization: Bearer ${FILE_MANAGER_SECRET}` — được chặn bởi `file-manager/middlewares/auth.middleware.ts`.

**Chiều trình duyệt → `file-manager`**: route `/media/*` phục vụ file tĩnh, bảo vệ bằng `domain.middleware.ts` (kiểm tra header `Referer` khớp `process.env.DOMAIN`).

### 2.3. Điểm kiến trúc đáng chú ý — biến `domainCDN` vs `domainPublic`

Đây là thay đổi **đang uncommit** trong working tree, và nó **đúng về mặt kiến trúc**:

```ts
// configs/variable.config.ts
export const domainCDN = process.env.CDN_URL || "http://localhost:4000";   // server→server (nội bộ Docker)
// index.ts
app.locals.domainPublic = process.env.CDN_PUBLIC || domainCDN;             // dùng trong <img src>, trình duyệt
```

Lý do: bên trong mạng Docker, `ecommerce` gọi `file-manager` qua hostname nội bộ (`http://file-manager:4000`), nhưng thẻ `<img>` trong HTML thì trình duyệt phải gọi được từ ngoài (`http://localhost:4000`). Việc tách 2 biến này là **cần thiết và làm đúng**.

⚠️ **Nhưng mới thay được 2 chỗ.** Xem [mục 8.6](#86-chưa-thay-hết-domaincdn--domainpublic-trong-view).

---

## 3. CÔNG NGHỆ & PHỤ THUỘC

### 3.1. Service `ecommerce`

| Nhóm | Thư viện |
|---|---|
| **Runtime** | Node 22 (Docker) / TypeScript 5.9 chạy qua `ts-node` |
| **Web** | `express@5.2`, `pug@3`, `express-session`, `cookie-parser` |
| **DB** | `mongoose@9.2`, `mongodb@7.1` |
| **Auth** | `jsonwebtoken`, `bcryptjs`, `passport` + `passport-google-oauth20` + `passport-facebook` |
| **Validate** | `joi@18` |
| **Realtime** | `socket.io@4.8`, `cookie` |
| **Upload** | `multer@2.1` (memoryStorage), `form-data`, `axios` |
| **Thanh toán** | `crypto-js` (HMAC-SHA256 cho ZaloPay), `crypto` core (HMAC-SHA512 cho VNPay), `qs` |
| **Tiện ích** | `moment`, `slugify`, `papaparse` (import CSV), `json2csv` (export CSV), `nodemailer`, `node-cron`, `puppeteer` |

### 3.2. Service `file-manager`

Rất gọn — chỉ 4 dependency: `express`, `multer`, `dotenv`, `@types/multer`. Không có DB, không có ORM. **Thiết kế này tốt** — đúng tinh thần "một service làm một việc".

### 3.3. Nhận xét về phụ thuộc

- ⚠️ **`@types/*` bị đặt nhầm vào `dependencies`** thay vì `devDependencies` (11 gói: `@types/cookie-parser`, `@types/crypto-js`, `@types/express-session`, …). Làm image Docker phình ra vô ích.
- ⚠️ **`puppeteer` nằm trong `dependencies`** → mỗi lần `npm install` tải Chromium (~150–300MB). Trong `node:22-alpine` thì Chromium tải về **không chạy được** vì thiếu glibc.
- ⚠️ **Không có `tsc` build step.** Production chạy `node -r ts-node/register index.ts` → biên dịch lại mỗi lần khởi động, chậm và cần toàn bộ devDependencies trong image.
- ℹ️ `mongodb@7.1` được khai báo tường minh dù `mongoose@9.2` đã kéo sẵn → có thể xung đột version.

---

## 4. MÔ HÌNH DỮ LIỆU

**20 model** trong `models/` + 1 sub-schema (`schemas/seo.schema.ts`).

### 4.1. Nhóm Tài khoản & Phân quyền

| Model | Collection | Ghi chú |
|---|---|---|
| `AccountAdmin` | `accounts-admin` | `roles: [String]`, `status: initial\|active\|inactive`, soft-delete, `lastLoginAt` |
| `Role` | `roles` | `permissions: [String]` — khớp với `permissionList` trong `configs/variable.config.ts` |
| `AccountUser` | `accounts-user` | `googleId`, `facebookId`, `totalPoint`, `usedPoint`, soft-delete |
| `UserAddress` | `user-address` | Nhiều địa chỉ / user, có `isDefault`, có `longitude`/`latitude` |
| `VerifyOTP` | `verify-otp` | TTL index qua `expireAt`, `type: otp-password\|otp-register` |
| `AdminLog` | `admin-logs` | TTL 30 ngày, ghi `adminId`/`method`/`route`/`title` |

### 4.2. Nhóm Sản phẩm

| Model | Collection | Ghi chú |
|---|---|---|
| `Product` | `products` | Trung tâm hệ thống: `variants: Array`, `attributes: Array`, `boughtTogether: [String]`, `ratingAvg`/`ratingCount`, `seo: SeoSchema`, `position` để sắp xếp thủ công |
| `CategoryProduct` | `categories-product` | Cây danh mục qua `parent: String` (đệ quy bằng `buildCategoryTree`) |
| `AttributeProduct` | `attributes-product` | `type: text\|select\|color`, `options: [{label, value}]` |
| `Review` | `reviews` | **Unique index `{userId, orderItemId}`** — chống đánh giá trùng. `status: approved\|rejected` |

### 4.3. Nhóm Bán hàng

| Model | Collection | Ghi chú |
|---|---|---|
| `Order` | `orders` | `items[]` snapshot giá/tên/ảnh tại thời điểm mua (đúng chuẩn), `paymentMethod: money\|vnpay\|zalopay`, `orderStatus` 6 trạng thái, `shipping{goshipOrderId,...}`, `usedPoint`/`pointDiscount` |
| `Coupon` | `coupons` | `typeDiscount: percentage\|fixed`, `usageLimit`/`usedCount`, `typeDisplay: public\|private` |

### 4.4. Nhóm Nội dung & Giao diện

| Model | Collection | Ghi chú |
|---|---|---|
| `Blog` | `blogs` | `status: draft\|published\|archived`, `createdBy`/`updatedBy` |
| `CategoryBlog` | `categories-blog` | Cây danh mục như sản phẩm |
| `Block` | `blocks` | `fileName` trỏ tới file trong `views/client/blocks/`, `data: Object` chứa cấu hình động |
| `Template` | `templates` | `slug` (đường dẫn áp dụng) + `blocks: [{blockId, position}]` |
| `Setting` | `settings` | Key-value: `apiShipping`, `apiPayment`, `apiLoginSocial`, `apiAppPassword`, `general`, `assetVersion` |
| `Media` | `media` | Metadata file — mirror của thư mục vật lý bên `file-manager` |

### 4.5. Nhóm Chat

| Model | Collection | Ghi chú |
|---|---|---|
| `ChatRoom` | `chat-rooms` | 1 user ↔ 1 admin, `unreadCount{user,admin}`, `status: open\|locked`, `rating[]` |
| `ChatMessage` | `chat-messages` | `senderRole: user\|admin`, `files: [String]` |

### 4.6. Nhận xét mô hình dữ liệu

**Điểm tốt:**
- Snapshot dữ liệu trong `Order.items` (lưu `name`, `image`, `price` tại thời điểm mua) — **rất đúng**, tránh việc sửa sản phẩm làm sai lịch sử đơn hàng.
- Unique index chống review trùng.
- TTL index cho OTP và AdminLog — tự dọn rác.
- Soft-delete nhất quán (`deleted` + `deletedAt`) trên hầu hết model.

**Điểm cần cải thiện:**
- ⚠️ **Không dùng `ObjectId` reference** ở bất kỳ đâu — tất cả quan hệ đều là `String` thủ công (`userId: String`, `category: [String]`, `productId: String`). Hệ quả: không dùng được `.populate()`, phải tự query lồng nhau → sinh ra **N+1 query** ở khắp nơi (xem [mục 12.3](#123-vấn-đề-n1-query)).
- ⚠️ **Thiếu index** cho các trường query nhiều: `Product.slug`, `Product.search`, `Order.userId`, `Order.code`, `ChatMessage.roomId`, `Media.folder`. Khi dữ liệu lớn sẽ chậm rõ rệt.
- ⚠️ `Review.status` khai báo `enum: ["approved","rejected"]` nhưng `default: null` — `null` không nằm trong enum, gây mâu thuẫn ngữ nghĩa (thực tế Mongoose sẽ bỏ trống field).
- ⚠️ `Product.attributes` và `Product.variants` khai báo là `Array` trống (không có schema con) → không có validation, không có type safety.

---

## 5. BẢN ĐỒ CHỨC NĂNG — KHU VỰC ADMIN

Prefix: `/admin` (từ `pathAdmin` trong `configs/variable.config.ts`). Toàn bộ (trừ `/account`) đi qua `authMiddleware.verifyToken`.

| Module | Route | Chức năng đã có | Phân quyền? | Validate? |
|---|---|---|---|---|
| **Đăng nhập** | `/account/login`, `/logout` | Login (có SuperAdmin từ ENV), logout, ghi AdminLog | — | ✅ Joi |
| **Tổng quan** | `/dashboard` | KPI doanh thu (hôm nay/hôm qua/tháng này/tháng trước/toàn thời gian) | ✅ | — |
| | `/dashboard/revenue-by-time` | Doanh thu theo thời gian | ❌ | — |
| | `/dashboard/order-statistic` | Thống kê đơn hàng | ❌ | — |
| | `/dashboard/top-selling-products` | Sản phẩm bán chạy | ❌ | — |
| | `/dashboard/customer-statistic` | Thống kê khách hàng | ❌ | — |
| **Sản phẩm** | `/product/list`, `/create`, `/edit/:id`, `/delete/:id` | CRUD + soft-delete, tìm kiếm, phân trang, `position` | ❌ | ✅ Joi |
| | `/product/category/*` | CRUD danh mục (cây) | ❌ | ✅ Joi |
| | `/product/attribute/*` | CRUD thuộc tính | ❌ | ✅ Joi |
| | `/product/export/csv`, `/import/csv` | Xuất/nhập CSV (`json2csv` / `papaparse`) | ❌ | ✅ Joi |
| | `/product/edit-seo/:id` | Sửa SEO riêng (title, desc, keywords, robots, OG) | ❌ | ✅ Joi |
| **Bài viết** | `/article/list`, `/create`, `/edit/:id`, `/delete/:id` | CRUD + soft-delete, ghi AdminLog | ✅ | ✅ Joi |
| | `/article/category/*` | CRUD + **thùng rác + khôi phục + xoá vĩnh viễn** | ✅ | ✅ Joi |
| **Mã giảm giá** | `/coupon/*` | CRUD + soft-delete, tìm kiếm | ❌ | ✅ Joi |
| **Đơn hàng** | `/order/list`, `/edit/:id` | Xem, đổi `orderStatus`/`paymentStatus`/`note` (có chặn quay ngược trạng thái) | ❌ | ❌ |
| | `/order/export/csv` | Xuất CSV toàn bộ đơn | ❌ | ❌ |
| **Đánh giá** | `/review/list`, `/change-status/:id/:status` | Duyệt / từ chối đánh giá | ❌ | ❌ |
| **Nhóm quyền** | `/role/*` | CRUD nhóm quyền + gán `permissions[]` | ✅ | ✅ Joi |
| **TK quản trị** | `/account-admin/*` | CRUD + đổi mật khẩu | ✅ | ✅ Joi |
| **TK người dùng** | `/account-user/list` | **Chỉ xem danh sách** | ❌ | — |
| **Quản lý file** | `/file-manager`, `/iframe` | Upload nhiều file, đổi tên, xoá, tạo/xoá thư mục, phân trang | ✅ | ❌ |
| **Block** | `/block/*` | CRUD block giao diện, chọn file `.pug` từ `views/client/blocks/` | ❌ | ❌ |
| **Template** | `/template/*` | CRUD template, ghép block + đặt `position` | ❌ | ❌ |
| **Chat** | `/chat/list/my-chat`, `/detail/:id` | Danh sách phòng, chi tiết, tải tin nhắn phân trang, upload file, khoá phòng, xem đánh giá | ❌ | ❌ |
| | `/chat/suggest-reply/:id` | 🤖 AI gợi ý 3 câu trả lời | ❌ | ❌ |
| | `/chat/edit-reply/:id` | 🤖 AI sửa câu trả lời đang soạn | ❌ | ❌ |
| | `/chat/summary/:id` | 🤖 AI tóm tắt hội thoại | ❌ | ❌ |
| | `/chat/customer-emotions/:id` | 🤖 AI phân tích cảm xúc & tiềm năng khách | ❌ | ❌ |
| **Cài đặt** | `/setting/api-shipping` | Token GoShip | ❌ | ❌ |
| | `/setting/api-payment` | Key VNPay + ZaloPay | ❌ | ❌ |
| | `/setting/api-login-social` | Google/Facebook OAuth credentials | ❌ | ❌ |
| | `/setting/api-app-password` | Gmail App Password | ❌ | ❌ |
| | `/setting/general` | `domainWebsite`, … | ❌ | ❌ |
| | `/setting/remove-cache` | Bump `assetVersion` để bust cache CSS/JS | ❌ | ❌ |
| **Helper** | `/helper/generate-slug` | Sinh slug tự động + chống trùng | ❌ | ❌ |

> **Tổng: 53 trang Pug admin.** Cột "Phân quyền?" chính là vấn đề lớn nhất — chỉ 5/17 module có `checkPermission`.

---

## 6. BẢN ĐỒ CHỨC NĂNG — KHU VỰC CLIENT

Global middleware chạy trước mọi route (`routes/client/index.route.ts`): `getAllCategory` → `getAttributeProduct` → `verifyToken` → `canonical` → `assetVersion` → `getChatMessageTotal`.

| Module | Route | Chức năng |
|---|---|---|
| **Trang chủ** | `GET /` | Render động từ Template `/` → ghép các Block |
| **SEO** | `GET /sitemap.xml` | Sitemap động (trang chủ + sản phẩm + bài viết) |
| | `GET /robots.txt` | Chặn bot vào `/admin/` |
| **Sản phẩm** | `GET /product/category[/:slug]` | Danh sách + **lọc đa tiêu chí**: từ khoá, khoảng giá, đang giảm giá, còn hàng, **thuộc tính động** (`attribute_<id>`), số sao, sắp xếp, phân trang |
| | `GET /product/suggest` | Gợi ý tìm kiếm (autocomplete, 5 kết quả) |
| | `GET /product/detail/:slug` | Chi tiết + biến thể + SP liên quan + SP mua kèm + SP đã xem (cookie) + danh sách đánh giá |
| **Bài viết** | `GET /article/category/:slug` | Danh sách theo danh mục + sidebar bài viết/danh mục phổ biến |
| | `GET /article/detail/:slug` | Chi tiết + tăng lượt xem |
| **Giỏ hàng** | `GET /cart`, `POST /cart/list` | Giỏ hàng lưu ở client, server trả chi tiết + **tính phí ship GoShip** + số điểm khả dụng |
| **So sánh** | `GET /compare`, `POST /compare/list` | So sánh sản phẩm |
| **Yêu thích** | `GET /wishlist`, `POST /wishlist/list` | Danh sách yêu thích |
| **Mã giảm giá** | `POST /coupon/check` | Kiểm tra mã (hạn, giới hạn dùng) |
| **Đặt hàng** | `GET /checkout` | Trang đặt hàng |
| | `POST /order/create` | Tạo đơn: tính subtotal → áp coupon → gọi GoShip tạo vận đơn → trừ điểm → lưu đơn |
| | `GET /order/success` | Trang cảm ơn |
| | `GET /order/payment-vnpay` + `/payment-vnpay-result` | Thanh toán VNPay (HMAC-SHA512) |
| | `GET /order/payment-zalopay` + `POST /payment-zalopay-result` | Thanh toán ZaloPay (HMAC-SHA256, IPN callback) |
| | `GET /order/export-pdf` | Xuất hoá đơn PDF (Pug → HTML → Puppeteer) |
| **Xác thực** | `GET/POST /auth/register`, `/login` | Đăng ký, đăng nhập (bcrypt + JWT cookie) |
| | `GET /auth/google`, `/google/callback` | OAuth Google |
| | `GET /auth/facebook`, `/facebook/callback` | OAuth Facebook |
| | `/auth/forgot-password` → `/otp-password` → `/reset-password` | Quên mật khẩu qua OTP email (Nodemailer + Gmail) |
| **Tài khoản** | `GET /dashboard` | Tổng quan: tổng đơn, đơn thành công, tổng đánh giá, 5 đơn gần nhất |
| | `/dashboard/profile[/edit]` | Xem/sửa hồ sơ (tự cấp lại JWT sau khi đổi email) |
| | `PATCH /dashboard/profile/change-avatar` | Đổi avatar (upload lên CDN + xoá ảnh cũ) |
| | `/dashboard/change-password` | Đổi mật khẩu (dùng chung endpoint `/auth/reset-password`) |
| | `/dashboard/address/*` | CRUD địa chỉ + đặt mặc định |
| | `/dashboard/order/list`, `/detail/:id` | Lịch sử đơn hàng |
| | `/dashboard/order/review/:id` + `POST /order/review` | Đánh giá sản phẩm đã mua (tối đa 5 ảnh, mỗi ảnh ≤ 5MB) |
| **Chat** | `GET /chat/messages` | Tải tin nhắn (phân trang lùi bằng `lastMessageId`) |
| | `POST /chat/upload` | Gửi file trong chat |
| | `POST /chat/rate` | Đánh giá phiên chat (sao + nhận xét) |

---

## 7. CÁC LUỒNG NGHIỆP VỤ CHÍNH

### 7.1. Luồng đặt hàng & thanh toán

```
Giỏ hàng (localStorage)
   │
   ├─ POST /cart/list ────────────► lấy chi tiết SP + gọi GoShip /rates (phí ship) + điểm khả dụng
   │
   ▼
Trang /checkout  ──► POST /order/create
   │                    ├─ 1. Sinh mã đơn ngẫu nhiên (chống trùng bằng vòng while)
   │                    ├─ 2. Duyệt items → tìm variant khớp → chốt giá
   │                    ├─ 3. Áp coupon (hạn / usageLimit / minOrderValue) → tăng usedCount
   │                    ├─ 4. Reverse-geocode toạ độ (OpenMap) → chuẩn hoá city/district/ward
   │                    ├─ 5. Gọi GoShip /shipments → tạo vận đơn thật, lấy fee + cod
   │                    ├─ 6. Trừ điểm thưởng (⚠ tiêu HẾT điểm, không cho chọn)
   │                    └─ 7. total = subTotal + shipFee − discount − pointDiscount
   ▼
Chọn phương thức
   ├─ money   → /order/success (paymentStatus vẫn "unpaid")
   ├─ vnpay   → ký HMAC-SHA512 → redirect VNPay → /payment-vnpay-result → verify → paid + tích điểm
   └─ zalopay → ký HMAC-SHA256 → redirect ZaloPay → IPN /payment-zalopay-result → verify mac → paid + tích điểm
```

**Đánh giá:** Luồng này làm khá bài bản — có verify chữ ký ở cả 2 cổng, có snapshot giá, có tích điểm sau thanh toán. Nhưng thiếu 2 mảnh quan trọng: **không trừ tồn kho** và **không có transaction** (nếu GoShip lỗi sau khi đã tăng `coupon.usedCount` thì mã bị "ăn" oan).

### 7.2. Luồng Page Builder (Block + Template)

```
Admin tạo Block ──► chọn fileName (views/client/blocks/*.pug) + nhập data (JSON)
                     data có thể chứa: getByCategory{type, category[], limit, sort}, tabs[], ...
                          │
Admin tạo Template ──► slug = "/" + danh sách blockId kèm position
                          │
GET /  ──► getBlockListByTemplate("/") ──► lấy Block active, sắp xếp theo position
       ──► renderHTML() ──► với mỗi block:
                              ├─ nếu data.getByCategory.type == "product" → getProductByCategory()
                              ├─ nếu có data.tabs[] → lặp lấy SP theo từng tab
                              ├─ nếu type == "blog" → getBlogByCategory()
                              └─ pug.renderFile(blockPath, {...}) → chuỗi HTML
       ──► res.render("client/pages/home", { blocksHtml })
```

**Đánh giá:** Đây là **phần hay nhất của hệ thống**. Có 12 block sẵn (`banner_2`, `flash_sell_2`, `trending_product_2`, …). Có `try/catch` từng block nên 1 block lỗi không sập cả trang. Rất tốt.

⚠️ Một lỗi tiềm tàng: `getBlockListByTemplate` không kiểm tra `template` có tồn tại không trước khi `template.blocks.map(...)` → nếu chưa tạo Template slug `/` thì **trang chủ sập ngay**.

### 7.3. Luồng chat realtime

```
Kết nối socket ──► authSocket: đọc cookie (tokenAdmin | tokenUser) → verify JWT → socket.data.account
   │
   ├─ role = "user"  → tìm ChatRoom theo userId
   │                   nếu chưa có → LOAD BALANCING: chọn admin đang online có ít phòng nhất
   │                                  (nếu không admin nào online → lấy admin bất kỳ)
   │                   → tạo phòng mới
   │
   └─ role = "admin" → tìm ChatRoom theo {adminId, _id: roomId từ handshake.auth}
   │
   ▼
socket.join(roomId)
   ├─ CLIENT_SEND_MESSAGE  → check status != locked → lưu DB → $inc unreadCount → broadcast SERVER_SEND_MESSAGE
   ├─ ADMIN_TYPING         → broadcast SERVER_SEND_ADMIN_TYPING
   ├─ CLIENT_OPEN_CHAT     → reset unreadCount.user = 0
   ├─ CLIENT_DELETE_MESSAGE→ xoá file trên CDN + xoá message → broadcast
   └─ ADMIN_DELETE_ROOM    → xoá folder chats/<userId> trên CDN + xoá toàn bộ message + xoá phòng
   
Song song: index.socket.ts giữ Map listAdminOnline / listUserOnline
           → phát USER_STATUS_ONLINE khi user online/offline
           
Cron 3h sáng hằng ngày (jobs/chat.job.ts):
   aggregate ChatMessage group theo roomId → lấy lastMessageAt
   → phòng nào > 10 ngày không nhắn → xoá folder CDN + xoá message + xoá phòng
```

**Đánh giá:** Thiết kế tốt, có load-balancing admin — không phổ biến ở project mức này. Nhưng xem [lỗi #9.7](#9-lỗi--rủi-ro-phát-hiện-được) về nguy cơ crash.

### 7.4. Luồng phân quyền (RBAC)

```
Request /admin/* ──► verifyToken
                       ├─ đọc cookie tokenAdmin → jwt.verify
                       ├─ nếu id+email khớp SUPER_ADMIN_* trong ENV
                       │     → res.locals.permissions = TẤT CẢ (permissionList.map(id))
                       └─ ngược lại
                             → tìm AccountAdmin (active, chưa xoá)
                             → duyệt roles[] → gộp permissions từ từng Role active
                             → res.locals.permissions = mảng gộp
                       │
                       ▼
                  checkPermission("article-create")
                       └─ permissions.includes(...) ? next() : res.json({code:"error"})
```

**Đánh giá:** Cơ chế đúng. Vấn đề là **`permissionList` chỉ có 22 quyền**, phủ đúng 4 nhóm (dashboard, article, role, account-admin, file-manager). Toàn bộ Sản phẩm / Đơn hàng / Đánh giá / Coupon / Block / Template / Chat / Setting **không có quyền nào được định nghĩa** và **không route nào gọi `checkPermission`**.

---

## 8. NHỮNG PHẦN CHƯA HOÀN THIỆN

> Đây là mục trả lời trực tiếp câu "*có một vài chức năng lặp lại tôi đã không làm*". Tôi sắp xếp theo **mức độ ảnh hưởng**.

### 8.1. 🔴 Phân quyền chỉ áp dụng cho 5/17 module

`permissionList` (`configs/variable.config.ts:4-98`) hiện chỉ có quyền cho: `dashboard`, `article-*` (10 quyền), `role-*` (5), `account-admin-*` (5), `file-manager`.

**Thiếu hoàn toàn quyền cho:**

| Module | Quyền cần bổ sung (gợi ý) |
|---|---|
| Sản phẩm | `product-list`, `product-create`, `product-edit`, `product-delete`, `product-trash`, `product-import`, `product-export`, `product-seo` |
| Danh mục SP | `product-category`, `product-category-create/edit/delete/trash` |
| Thuộc tính SP | `product-attribute`, `product-attribute-create/edit/delete` |
| Mã giảm giá | `coupon-list`, `coupon-create`, `coupon-edit`, `coupon-delete` |
| Đơn hàng | `order-list`, `order-edit`, `order-export` |
| Đánh giá | `review-list`, `review-change-status` |
| TK người dùng | `account-user-list`, `account-user-edit`, `account-user-delete` |
| Block | `block-list`, `block-create`, `block-edit`, `block-delete` |
| Template | `template-list`, `template-create`, `template-edit`, `template-delete` |
| Chat | `chat-list`, `chat-detail`, `chat-ai` |
| Cài đặt | `setting-shipping`, `setting-payment`, `setting-login-social`, `setting-app-password`, `setting-general`, `setting-remove-cache` |
| Dashboard con | `dashboard-revenue`, `dashboard-order`, `dashboard-product`, `dashboard-customer` |

**Và** phải gắn `checkPermission(...)` vào các route tương ứng trong `routes/admin/*.route.ts`.

**Ngoài ra**, `views/admin/partials/startbar.pug` cũng hiển thị menu vô điều kiện cho các module này (Sản phẩm, Coupon, Block, Template, Chat, Cài đặt, Đơn hàng, Đánh giá) — cần bọc `if (permissions.includes(...))` như đã làm với Bài viết.

---

### 8.2. 🟠 Thùng rác / Khôi phục / Xoá vĩnh viễn chỉ làm cho Danh mục bài viết

Hiện chỉ **Danh mục bài viết** có đủ bộ 3:

```
GET    /admin/article/category/trash        → trashCategory
PATCH  /admin/article/category/undo/:id     → undoCategoryPatch
DELETE /admin/article/category/destroy/:id  → destroyCategoryDelete
```

**Các module có `deleted: true` nhưng KHÔNG có trang thùng rác:**

| Module | Có soft-delete | Có trang trash | Có khôi phục | Có xoá vĩnh viễn |
|---|:---:|:---:|:---:|:---:|
| Danh mục bài viết | ✅ | ✅ | ✅ | ✅ |
| **Bài viết** | ✅ | ❌ | ❌ | ❌ |
| **Sản phẩm** | ✅ | ❌ | ❌ | ❌ |
| **Danh mục sản phẩm** | ✅ | ❌ | ❌ | ❌ |
| **Thuộc tính sản phẩm** | ✅ | ❌ | ❌ | ❌ |
| **Mã giảm giá** | ✅ | ❌ | ❌ | ❌ |
| **Nhóm quyền** | ✅ | ❌ | ❌ | ❌ |
| **TK quản trị** | ✅ | ❌ | ❌ | ❌ |
| **Block** | ✅ | ❌ | ❌ | ❌ |
| **Template** | ✅ | ❌ | ❌ | ❌ |
| **Đơn hàng** | ✅ (`deletedBy`) | ❌ | ❌ | ❌ |

→ Dữ liệu bị "xoá" nằm mãi trong DB, không ai xem lại hay khôi phục được. Đáng chú ý: `permissionList` **đã có sẵn** `article-trash` và `role-trash` nhưng chưa có route/trang tương ứng cho bài viết và nhóm quyền.

---

### 8.3. 🟠 Validate (Joi) thiếu ở nhiều module

Có validate: `account-admin`, `account`, `article`, `coupon`, `product`, `role` (admin); `auth`, `coupon`, `dashboard`, `order` (client).

**Thiếu validate hoàn toàn:**
- `admin/block.route.ts` — thậm chí **không có `multer`**, mà `createPost`/`editPatch` lại đọc `req.body` → nếu form gửi `multipart/form-data` thì `req.body` sẽ rỗng
- `admin/template.route.ts` — cùng vấn đề trên
- `admin/setting.route.ts` — nhận thẳng `req.body` làm `data` của Setting (`apiPaymentPatch`, `apiLoginSocialPatch`, `generalPatch` đều `data: req.body`) → **mass assignment**, ai gửi field gì cũng lưu
- `admin/order.route.ts` — `editPatch` không validate `orderStatus`/`paymentStatus` có nằm trong enum không
- `admin/review.route.ts` — `changeStatusPatch` nhận `:status` từ URL, không kiểm tra
- `admin/chat.route.ts`, `admin/account-user.route.ts`, `admin/file-manager.route.ts`

---

### 8.4. 🟠 Ghi AdminLog chỉ làm cho 3 hành động

`logAdminAction()` (`helpers/log.helper.ts`) hiện chỉ được gọi ở:
- `account.controller.ts:100` — đăng nhập
- `account.controller.ts:110` — đăng xuất
- `article.controller.ts:319, 460, 486` — tạo/sửa/xoá bài viết
- `product.controller.ts:331, 547` — tạo/sửa sản phẩm

**Chưa ghi log cho:** xoá sản phẩm, mọi thao tác danh mục, thuộc tính, coupon, đơn hàng, đánh giá, nhóm quyền, tài khoản quản trị, block, template, **và đặc biệt là thay đổi Cài đặt (API keys!)** — đây là nhóm nhạy cảm nhất, bắt buộc phải có log.

**Và:** đã có model `AdminLog` + TTL 30 ngày, nhưng **không có trang admin nào để XEM log** — dữ liệu ghi ra rồi không ai đọc được.

---

### 8.5. 🟡 Bộ lọc / sắp xếp trên danh sách admin không đồng đều

| Trang | Tìm kiếm | Lọc trạng thái | Sắp xếp | Phân trang |
|---|:---:|:---:|:---:|:---:|
| Sản phẩm | ✅ | ❌ | ❌ | ✅ |
| Bài viết | ✅ | ❌ | ❌ | ✅ |
| Mã giảm giá | ✅ | ❌ | ❌ | ✅ |
| Nhóm quyền | ✅ | ❌ | ❌ | ✅ |
| TK quản trị | ✅ | ❌ | ❌ | ✅ |
| TK người dùng | ✅ | ❌ | ❌ | ✅ |
| **Đơn hàng** | ❌ | ❌ | ❌ | ✅ |
| **Đánh giá** | ❌ | ❌ | ❌ | ✅ |
| **Block** | ❌ | ❌ | ❌ | ❌ |
| **Template** | ❌ | ❌ | ❌ | ❌ |

`grep "req.query.status"` trong `controllers/admin/` → **0 kết quả**. Không trang nào lọc theo trạng thái, dù mixin `views/admin/mixins/form-search.pug` đã có sẵn.

Đặc biệt: **Đơn hàng không có bộ lọc nào** — thực tế vận hành không dùng được (không lọc được "đơn chờ xác nhận", "đơn chưa thanh toán", theo ngày, theo mã…).

---

### 8.6. 🟡 Chưa thay hết `domainCDN` → `domainPublic` trong view

Thay đổi đang uncommit mới sửa **2 file**: `views/admin/pages/article-list.pug` và `views/admin/pages/file-manager.pug`.

Trong khi `views/admin/layouts/default.pug` đã **comment out** biến `domainCDN` phía JS:

```pug
//- const domainCDN = "#{domainCDN}";
const domainPublic = "#{domainPublic}";
```

→ **Mọi file JS hoặc Pug còn đang dùng `domainCDN` sẽ hỏng khi chạy Docker.** Cần rà soát toàn bộ `views/admin/**`, `views/client/**`, `public/admin/assets/js/**`, `public/client/assets/js/**`.

Lệnh rà soát:

```bash
grep -rn "domainCDN" views/ public/
```

---

### 8.7. 🟡 Chức năng khách hàng còn thiếu

| Thiếu | Mô tả |
|---|---|
| **Huỷ đơn hàng** | Khách không có cách huỷ đơn ở trạng thái `pending`. `orderStatus` có `cancelled` nhưng chỉ admin đổi được. |
| **Trang tra cứu đơn cho khách vãng lai** | `order/create` bắt buộc `authMiddleware.verifyToken` → **không cho khách chưa đăng nhập đặt hàng**, nhưng `success` lại tra theo `orderCode + phone` (thiết kế cho guest). Mâu thuẫn. |
| **Trang danh sách bài viết tổng** | Chỉ có `/article/category/:slug` và `/article/detail/:slug`. Không có `/article` liệt kê tất cả. |
| **Trang liên hệ / giới thiệu / FAQ / chính sách** | Không có route lẫn view. |
| **Đổi mật khẩu yêu cầu mật khẩu cũ** | `/dashboard/change-password` gọi `POST /auth/reset-password` — chỉ cần đăng nhập là đổi được, **không hỏi mật khẩu hiện tại**. Rủi ro chiếm tài khoản nếu ai đó mượn máy. |
| **Xác thực email khi đăng ký** | Model `VerifyOTP` có `type: "otp-register"` nhưng **chưa dùng ở đâu** — `registerPost` cho `status: "active"` ngay. |
| **Thông báo / theo dõi vận đơn** | Đã lưu `shipping.goshipOrderId` nhưng không có trang tra cứu trạng thái vận chuyển. |

---

### 8.8. 🟡 Hạ tầng ứng dụng còn thiếu

| Thiếu | Ảnh hưởng |
|---|---|
| **Global error handler** | Express 5 tự bắt lỗi async, nhưng không có `app.use((err, req, res, next) => ...)` → lỗi trả về HTML stack trace mặc định, **lộ đường dẫn server** |
| **Trang 404** | Route không khớp → Express trả HTML "Cannot GET /xyz" |
| **Rate limiting** | Không có ở bất kỳ đâu — login admin, login user, OTP, AI endpoint đều có thể spam |
| **Helmet / CSP** | Không có security header nào |
| **CSRF protection** | Không có |
| **Session store** | `express-session` dùng MemoryStore mặc định → rò rỉ bộ nhớ, mất session khi restart, không scale nhiều instance |
| **Kiểm tra loại file upload** | `multer` `fileFilter` chỉ sửa encoding tên file, **`cb(null, true)` chấp nhận MỌI loại file** — upload `.exe`, `.php`, `.svg` (XSS) đều được |
| **Giới hạn dung lượng upload** | Không có `limits: { fileSize }` ở multer (trừ chỗ review được check thủ công) |
| **Test** | `npm test` = `echo "Error: no test specified" && exit 1` |
| **Lint / format** | Không có ESLint, Prettier |
| **CI/CD** | Không có `.github/workflows` |
| **README** | File `README.md` chỉ chứa 2 dòng tiêu đề bị lỗi encoding (UTF-16), không có hướng dẫn cài đặt |

---

## 9. LỖI & RỦI RO PHÁT HIỆN ĐƯỢC

> Đây là các lỗi **thật sự trong code**, không phải "thiếu tính năng". Sắp theo mức nghiêm trọng.

### 🔴 Mức NGHIÊM TRỌNG

#### 9.1. Đặt hàng không trừ tồn kho

`grep '\$inc'` toàn bộ source → chỉ có ở `article.controller` (lượt xem), `point.helper` (điểm), `chat.socket` (unread). **Không có chỗ nào giảm `Product.stock`.**

→ Khách đặt bao nhiêu cũng được, kể cả khi `stock = 0` (bộ lọc "còn hàng" chỉ lọc lúc hiển thị). Bán vượt kho không giới hạn.

**Cần:** trừ kho trong `order.createPost`, và cộng lại khi đơn `cancelled`/`returned` ở `admin/order.editPatch`.

#### 9.2. Đơn hàng tiêu HẾT điểm của khách, không cho chọn

`controllers/client/order.controller.ts:249`

```ts
dataFinal.usedPoint = res.locals.accountUser.totalPoint - res.locals.accountUser.usedPoint;
dataFinal.pointDiscount = dataFinal.usedPoint * pointConfig.POINT_TO_MONEY;
```

Khách **không có lựa chọn** — mọi đơn đều tiêu sạch điểm. Trong khi `POST /cart/list` đã trả về `point.canUsePoint` cho giao diện, tức là **giao diện có ý định cho chọn nhưng backend bỏ qua**.

Hệ quả kèm theo: `total = subTotal + fee − discount − pointDiscount` **có thể âm** → đẩy số tiền âm sang VNPay/ZaloPay.

**Cần:** nhận `usedPoint` từ `req.body`, validate `0 ≤ usedPoint ≤ canUsePoint`, và `Math.max(0, total)`.

#### 9.3. Puppeteer nhiều khả năng không chạy được trong Docker

`dockerfile` dùng `FROM node:22-alpine`. Puppeteer tải Chromium bản glibc → **Alpine dùng musl**. Đây là chế độ hỏng đã biết, chức năng `/order/export-pdf` rất có thể ném lỗi.

> **Lưu ý về độ chắc chắn:** kết luận này dựa trên chế độ hỏng phổ biến, **chưa build thử container để xác nhận**. Cần chạy `docker compose up --build` rồi gọi `/order/export-pdf` để kết luận dứt điểm trước khi sửa.

**Cần:** hoặc đổi sang `node:22-slim` + cài các thư viện Chromium, hoặc dùng `puppeteer-core` + `chromium` của Alpine:

```dockerfile
FROM node:22-alpine
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

#### 9.4. Docker Compose không có volume → mất toàn bộ file upload

```yaml
file-manager:
  build: ./file-manager
  ports: ["4000:4000"]
  env_file: [./file-manager/.env.docker]
```

Thư mục `file-manager/media/` nằm **trong container**. Mỗi lần `docker compose up --build` hoặc `docker compose down` → **toàn bộ ảnh sản phẩm, avatar, ảnh review, file chat biến mất**, trong khi collection `media` trong MongoDB vẫn giữ record → hệ thống đầy ảnh 404.

**Cần:**

```yaml
file-manager:
  build: ./file-manager
  ports: ["4000:4000"]
  env_file: [./file-manager/.env.docker]
  volumes:
    - media-data:/app/media
  restart: unless-stopped

volumes:
  media-data:
```

#### 9.5. OTP quên mật khẩu: 4 chữ số, không giới hạn số lần thử

- `generateRandomNumber(4)` → chỉ 10.000 khả năng
- `otpPasswordPost` không đếm số lần sai, không khoá
- Không có rate limit ở tầng nào

→ Script brute-force **chiếm được bất kỳ tài khoản nào** trong vài giây.

**Cần:** OTP 6 chữ số, đếm số lần thử (tối đa 5), khoá 15 phút, thêm rate limit theo IP + theo email. Ngoài ra **xoá record `VerifyOTP` ngay sau khi dùng thành công** (hiện vẫn còn hiệu lực đến hết TTL 5 phút).

---

### 🟠 Mức CAO

#### 9.6. Passport được cấu hình bất đồng bộ, có thể làm sập app lúc khởi động

`index.ts:30, 79-80`

```ts
connectDB();                              // ❌ không await
...
configureGooglePassport(passport);        // ❌ async, không await, không .catch()
configureFacebookPassport(passport);
```

Bên trong, `configureGooglePassport` gọi `getApiLoginSocial()` — truy vấn MongoDB. Nếu chưa có document `Setting{key:"apiLoginSocial"}` → hàm trả `null` → `apiLoginSocial.googleClientId` ném `TypeError` trong một Promise **không ai bắt** → Node 22 mặc định **kết thúc tiến trình**.

Nói cách khác: **chạy `docker compose up` với DB trắng thì app sập ngay.**

**Cần:** `await connectDB()` rồi mới cấu hình passport, bọc `try/catch`, và có giá trị mặc định khi thiếu setting.

#### 9.7. Socket chat có thể crash server

`sockets/chat.socket.ts:71`

```ts
socket.join(chatRoom.id);   // chatRoom có thể là null
```

Với `role = "admin"`, `chatRoom` được tìm bằng `{adminId, _id: account.roomId}` — mà `roomId` lấy từ `socket.handshake.auth.roomId`, có thể là `undefined` hoặc ObjectId không hợp lệ → Mongoose ném `CastError`. `chatSocket()` là hàm `async` được gọi **không có `.catch()`** ở `index.socket.ts:35` → unhandled rejection.

**Cần:** `if (!chatRoom) return;` sau khi tìm, và bọc `chatSocket(...).catch(console.error)`.

#### 9.8. Trang chủ sập nếu chưa có Template

`helpers/block.helper.ts:60-68`

```ts
const template: any = await Template.findOne({ slug, deleted: false, status: "active" });
const blockIds = template.blocks.map(...)   // ❌ template có thể null
```

**Cần:** kiểm tra null, trả mảng rỗng.

#### 9.9. `order/success` thiếu `await` → kiểm tra vô nghĩa

`controllers/client/order.controller.ts:286`

```ts
const orderDetail: any = Order.findOne({ code: orderCode, phone, deleted: false });
if (!orderDetail) { ... }   // ❌ orderDetail là Query object → LUÔN truthy
```

→ Bất kỳ ai truy cập `/order/success?orderCode=XXX&phone=YYY` với dữ liệu bịa vẫn thấy trang "Đặt hàng thành công".

#### 9.10. Đếm trang sai ở Quản lý file

`controllers/admin/file-manager.controller.ts:28`

```ts
const totalRecord = await Media.countDocuments({});   // ❌ nên là countDocuments(find)
```

→ Khi vào một thư mục con, số trang tính theo **toàn bộ** file trong hệ thống → phân trang hiển thị sai, nhiều trang trống.

#### 9.11. Xoá thư mục dùng RegExp chưa escape

`controllers/admin/file-manager.controller.ts:317`

```ts
const regexFolderPath = new RegExp(`${folderPath}`);
await Media.deleteMany({ folder: regexFolderPath });
```

Hai vấn đề:
1. `folderPath` chứa ký tự đặc biệt (`.`, `(`, `+`, `*`) → regex sai hoặc ném lỗi
2. Không neo `^` → thư mục tên `"anh"` sẽ **xoá luôn record của `/media/hinh-anh/...`, `/media/thanh-anh/...`**

**Cần:** escape chuỗi và neo đầu: `new RegExp("^" + escapeRegex(folderPath))`

#### 9.12. `coupon.usedCount` có race condition

`controllers/client/order.controller.ts:169`

```ts
usedCount: couponDetail.usedCount + 1     // ❌ read-modify-write
```

Hai đơn đặt cùng lúc → cùng đọc `usedCount = 9`, cùng ghi `10` → mã bị dùng vượt `usageLimit`.

**Cần:** dùng atomic `$inc` kèm điều kiện:

```ts
await Coupon.updateOne(
  { _id, status: "active", $expr: { $lt: ["$usedCount", "$usageLimit"] } },
  { $inc: { usedCount: 1 } }
);
```

Đồng thời: nếu bước GoShip phía sau lỗi thì `usedCount` đã tăng mà đơn không được tạo → **cần rollback hoặc dời việc tăng xuống sau khi lưu đơn thành công**.

#### 9.13. Điểm đánh giá cập nhật ngay khi khách gửi, chưa cần duyệt

`controllers/client/dashboard.controller.ts:588-596` cộng ngay `ratingAvg`/`ratingCount` khi khách gửi review. Nhưng `product/detail` chỉ hiển thị review `status: "approved"`.

→ Review bị admin **từ chối** vẫn tính vào điểm trung bình. Số sao hiển thị không khớp danh sách đánh giá bên dưới.

**Cần:** dời việc cập nhật `ratingAvg` sang `admin/review.changeStatusPatch` (cộng khi `approved`, trừ khi chuyển từ `approved` → `rejected`).

---

### 🟡 Mức TRUNG BÌNH

#### 9.14. Không lấy được biến thể → crash

`controllers/client/order.controller.ts:66-74`

```ts
const variantMatched = productDetail.variants.find(...);
price = variantMatched.priceNew || 0;    // ❌ variantMatched có thể undefined
```

#### 9.15. `new Buffer()` đã deprecated

`controllers/client/order.controller.ts:466, 491` — `new Buffer(signData, 'utf-8')` deprecated từ Node 6.

> **Đính chính (07/09/2026):** bản đầu tiên của báo cáo này viết là "đã bị xoá khỏi Node 22" — **sai**. Đã chạy thử trên Node 22: vẫn hoạt động, chỉ in `DeprecationWarning [DEP0005]`. Đây là việc dọn dẹp, **không gây sập**. Vẫn nên đổi sang `Buffer.from(signData, 'utf-8')`.

#### 9.16. Render template không tồn tại

`controllers/client/order.controller.ts:511` — `res.render('success', { code: '97' })`. Không có file `views/success.pug` → khi VNPay trả chữ ký sai, khách gặp lỗi 500 thay vì thông báo thanh toán thất bại.

#### 9.17. `checkPermission` trả JSON cho request xem trang

`middlewares/admin/auth.middleware.ts:78-84` luôn `res.json({code:"error", message:"Không đủ quyền!"})`. Khi admin bấm vào một trang không có quyền, trình duyệt hiển thị **JSON thô** thay vì trang "403 Không đủ quyền".

**Cần:** phân biệt `req.method === "GET"` → render trang lỗi; còn lại → JSON.

#### 9.18. `listFolder` so sánh với chuỗi `"undefined"`

`file-manager/controllers/file-manager.controller.ts:188`

```ts
if(req.query.folderPath != "undefined") {
  mediaPath = path.join(mediaPath, `${req.query.folderPath}`);
}
```

Nếu gọi API **không kèm** `folderPath`, giá trị là `undefined` (kiểu undefined), `undefined != "undefined"` → **true** → ghép `path.join(media, "undefined")` → `readdirSync` ném lỗi.

Hiện chỉ chạy được vì phía admin luôn gửi `?folderPath=${req.query.folderPath}` (thành chuỗi `"undefined"`). Đây là code coupling ngầm, rất dễ vỡ.

**Cần:** `if (req.query.folderPath) { ... }`

#### 9.19. Ba đoạn tính mốc thời gian bị copy-paste

`controllers/admin/dashboard.controller.ts` — khối tính `startToday`/`endToday`/`startYesterday`/`startThisMonth`/`startLastMonth` (~60 dòng) lặp lại **ít nhất 3 lần** (dòng 7, 634, 832). File dài **897 dòng**.

**Cần:** tách thành `helpers/date-range.helper.ts`.

#### 9.20. Logic coupon bị nhân bản

Toàn bộ kiểm tra coupon (tồn tại / hạn / `usageLimit` / `minOrderValue`) có ở **cả hai nơi**:
- `controllers/client/coupon.controller.ts:4-58`
- `controllers/client/order.controller.ts:105-185`

Sửa một chỗ quên chỗ kia → bug ngầm. **Cần:** tách `helpers/coupon.helper.ts`.

#### 9.21. Toạ độ cửa hàng hard-code ở 2 nơi

```ts
const shopLocation = { lat: 10.8037448, lng: 106.6617749 };
```
Xuất hiện ở `client/cart.controller.ts` và `client/order.controller.ts`. Thông tin cửa hàng (tên, sđt, địa chỉ người gửi trong `dataGoShip.address_from`) cũng hard-code trong `order.controller.ts` (`"Nguyễn Văn A"`, `"0912345678"`).

**Cần:** đưa vào `Setting{key:"general"}` — đã có sẵn trang Cài đặt chung.

#### 9.22. Gọi geocode 2 lần thừa cho mỗi đơn

`getInfoAddress(shopLocation)` gọi OpenMap + 3 lần GoShip (`/cities`, `/districts`, `/wards`) — **toạ độ cửa hàng không bao giờ đổi** nhưng vẫn gọi lại mỗi request ở cả `/cart/list` và `/order/create`. Tổng cộng **8 request HTTP ngoài** cho một lần đặt hàng.

**Cần:** cache kết quả của cửa hàng (in-memory hoặc lưu vào Setting).

---

## 10. ĐÁNH GIÁ BẢO MẬT

### 10.1. Làm tốt ✅

- Mật khẩu hash bằng `bcryptjs` (cost 10)
- JWT lưu trong cookie `httpOnly` + `sameSite: strict` + `secure` theo `NODE_ENV`
- Xác thực chữ ký HMAC ở **cả** VNPay (SHA512) và ZaloPay (SHA256) trước khi cập nhật `paymentStatus`
- Service `file-manager` được bảo vệ bằng shared secret
- `robots.txt` chặn crawler vào `/admin`
- Không có file `.env` nào bị commit (`git ls-files | grep env` → rỗng) ✅
- Unique index chống spam đánh giá

### 10.2. Vấn đề cần xử lý ⚠️

| # | Vấn đề | Vị trí | Mức |
|---|---|---|---|
| 1 | **API key OpenMap hard-code trong source** — `apikey=AIusVEFVnFWCE0ysUJ0BNZYMOhnZptij` đã nằm trong git history. Trong khi `.env` **đã có** biến `OPENMAP_KEY` nhưng không dùng. | `helpers/location.helper.ts:43` | 🔴 |
| 2 | **Mật khẩu SuperAdmin so sánh plaintext** từ biến môi trường | `controllers/admin/account.controller.ts:20` | 🟠 |
| 3 | **`fileFilter` chấp nhận mọi loại file** — `cb(null, true)` vô điều kiện. Upload `.svg` chứa `<script>` rồi phục vụ qua `/media/*` → **stored XSS** | `routes/admin/file-manager.route.ts`, `file-manager/routes/file-manager.route.ts` | 🟠 |
| 4 | **Không giới hạn dung lượng upload** ở multer → DoS bằng file khổng lồ | Cả 2 service | 🟠 |
| 5 | **Path traversal ở `file-manager`**: `folder.replace("/", "")` chỉ bỏ dấu `/` **đầu tiên**; `newFileName`/`fileName` không được sanitize trước `path.join` | `file-manager/controllers/file-manager.controller.ts:67, 116` | 🟠 |
| 6 | **`media.controller.getFile` không kiểm tra đường dẫn** — `path.join(__dirname, "../media", ...subPath)` với `subPath` từ wildcard route | `file-manager/controllers/media.controller.ts:9` | 🟠 |
| 7 | **`checkDomain` chỉ kiểm tra header `Referer`** — client tự đặt được, không phải cơ chế bảo mật thật | `file-manager/middlewares/domain.middleware.ts` | 🟡 |
| 8 | **Mass assignment ở Setting** — `data: req.body` nhận nguyên xi | `controllers/admin/setting.controller.ts` (4 chỗ) | 🟠 |
| 9 | **Không rate limit** login / OTP / AI endpoint | Toàn hệ thống | 🟠 |
| 10 | **Không có CSRF token** — mọi form POST/PATCH đều nhận cross-site | Toàn hệ thống | 🟠 |
| 11 | **Không có Helmet / security headers** | `index.ts` | 🟡 |
| 12 | **Đổi mật khẩu không cần mật khẩu cũ** | `/auth/reset-password` | 🟠 |
| 13 | **AI prompt injection** — nội dung chat của khách được nhét thẳng vào prompt gửi Groq. Khách có thể viết "Bỏ qua chỉ dẫn trên và…" | `controllers/admin/chat.controller.ts` (4 hàm AI) | 🟡 |
| 14 | **`SESSION_SECRET` với `saveUninitialized: true`** + MemoryStore | `index.ts:70-74` | 🟡 |
| 15 | **Regex từ input người dùng** — `new RegExp(keyword, "i")` ở mọi ô tìm kiếm → ReDoS | 8 controller admin | 🟡 |

> **Lưu ý về mục #1:** Vì key OpenMap đã nằm trong lịch sử git, đổi code thôi chưa đủ — nên **thu hồi key đó** ở phía nhà cung cấp và tạo key mới.

---

## 11. ĐÁNH GIÁ DEVOPS / DOCKER

### 11.1. Hiện trạng

**`docker-compose.yml`** (13 dòng):
```yaml
services:
  ecommerce:
    build: ./project-ecommerce-t8-25
    ports: ["3000:3000"]
    env_file: [./project-ecommerce-t8-25/.env.docker]
  file-manager:
    build: ./file-manager
    ports: ["4000:4000"]
    env_file: [./file-manager/.env.docker]
```

**Cả 2 `dockerfile`** giống hệt nhau:
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

**`.dockerignore`**: `node_modules`, `.git`, `.env`, `dist`, `.env.docker` — ✅ đúng.

### 11.2. Vấn đề

| # | Vấn đề | Mức |
|---|---|---|
| 1 | **Không có volume cho `media/`** → mất toàn bộ file upload khi rebuild | 🔴 |
| 2 | **Puppeteer + Alpine** → chức năng PDF chết | 🔴 |
| 3 | **Không có `depends_on`** → `ecommerce` có thể khởi động trước `file-manager` | 🟡 |
| 4 | **Không có `restart: unless-stopped`** → container chết là chết luôn | 🟠 |
| 5 | **Không có `networks` tường minh** → dùng network mặc định, may mà DNS service name vẫn hoạt động | 🟡 |
| 6 | **Không có healthcheck** | 🟡 |
| 7 | **`npm install` thay vì `npm ci`** → không dùng `package-lock.json`, build không tái lập được | 🟠 |
| 8 | **Không build TypeScript** — chạy `ts-node` runtime → khởi động chậm, phải giữ toàn bộ devDependencies trong image, không phát hiện lỗi type lúc build | 🟠 |
| 9 | **Chạy bằng user `root`** trong container | 🟠 |
| 10 | **Không multi-stage build** → image phình to (có cả TypeScript compiler + Chromium) | 🟡 |
| 11 | **Không có service MongoDB** — phụ thuộc hoàn toàn vào Atlas. Nếu muốn chạy offline thì không được. | 🟡 |
| 12 | **Không có reverse proxy (nginx/traefik)** — expose thẳng 2 cổng, không TLS | 🟡 |

### 11.3. `docker-compose.yml` đề xuất

```yaml
services:
  ecommerce:
    build: ./project-ecommerce-t8-25
    ports:
      - "3000:3000"
    env_file:
      - ./project-ecommerce-t8-25/.env.docker
    depends_on:
      - file-manager
    restart: unless-stopped
    networks:
      - app-net

  file-manager:
    build: ./file-manager
    ports:
      - "4000:4000"
    env_file:
      - ./file-manager/.env.docker
    volumes:
      - media-data:/app/media      # ⬅ QUAN TRỌNG NHẤT
    restart: unless-stopped
    networks:
      - app-net

volumes:
  media-data:

networks:
  app-net:
```

Kèm theo, trong `.env.docker` của `ecommerce`:
```
CDN_URL=http://file-manager:4000      # server → server, dùng DNS nội bộ Docker
CDN_PUBLIC=http://localhost:4000      # trình duyệt → file-manager
```

Và trong `.env.docker` của `file-manager`:
```
DOMAIN=http://localhost:3000          # để checkDomain khớp Referer
```

---

## 12. CHẤT LƯỢNG MÃ NGUỒN

### 12.1. Điểm mạnh

- **Cấu trúc thư mục rõ ràng, nhất quán**: `configs / controllers / helpers / interfaces / jobs / middlewares / models / routes / sockets / validates / views`. Tách `admin`/`client` song song ở cả 4 tầng (routes, controllers, middlewares, views).
- **Đặt tên có quy ước**: `*.controller.ts`, `*.route.ts`, `*.model.ts`, `*.validate.ts`, `*.helper.ts`, `*.middleware.ts`.
- **Đặt tên hàm theo HTTP verb**: `create` / `createPost`, `edit` / `editPatch`, `deletePatch` — rất dễ đoán.
- **Comment tiếng Việt giải thích ý đồ** ở nhiều chỗ (đặc biệt trong `dashboard.controller.ts`, `socket`, `home.controller.ts` giải thích sitemap). Rất tốt cho việc học và bảo trì.
- **Pug mixin dùng lại tốt**: `pagination`, `form-search`, `form-group`, `checkbox`, `options`, `box-option`.
- **`tsconfig` bật `strict: true`** ✅

### 12.2. Điểm yếu

| Vấn đề | Chi tiết |
|---|---|
| **Lạm dụng `any`** | `const productList: any = await Product.find(...)` xuất hiện ở hàng chục chỗ → vô hiệu hoá `strict: true`. Nguyên nhân: gán thêm field ảo (`item.createdAtFormat`, `item.discount`, `item.colorList`) lên document Mongoose. **Nên** tạo interface DTO riêng thay vì ép `any`. |
| **Sửa `req.body` trực tiếp** | `req.body.category = JSON.parse(req.body.category)` — thay đổi input thô rồi truyền thẳng vào model. Dễ gây mass assignment. |
| **Xử lý lỗi lặp lại** | `catch (error) { res.json({ code: "error", message: "Dữ liệu không hợp lệ!" }) }` lặp lại **~50 lần**. Nên gom vào một `asyncHandler` wrapper + global error handler. |
| **File quá dài** | `dashboard.controller.ts` 897 dòng, `product.controller.ts` 769 dòng, `client/dashboard.controller.ts` 541 dòng, `order.controller.ts` 492 dòng. Nên tách theo domain con. |
| **Không có tầng Service** | Toàn bộ logic nghiệp vụ nằm trong controller. Logic đặt hàng (tính tiền, coupon, ship, điểm) ~250 dòng trong một hàm. Nên tách `services/order.service.ts`. |
| **Thông báo lỗi lộ thông tin** | `Email không tồn tại!` vs `Mật khẩu không chính xác!` → cho phép dò email tồn tại (user enumeration). |
| **Ghi log bằng `console.log`** | Không có logger có cấp độ (`pino`/`winston`), không ghi ra file, không có request-id. |
| **Encoding file `README.md`** | Lưu UTF-16 → hiển thị lỗi. |
| **Comment code chết** | `// const upload = multer();`, `// const mediaPath = ...`, `// import CategoryBlog from '../../models/category-blog.model';` |

### 12.3. Vấn đề N+1 query

Do không dùng `ObjectId` + `.populate()`, các chỗ sau query trong vòng lặp:

| Vị trí | Mô tả |
|---|---|
| `helpers/chat.helper.ts:11-38` | Mỗi phòng chat → 1 query `AccountUser` + 1 query `ChatMessage` |
| `controllers/admin/review.controller.ts:38-58` | Mỗi review → 1 query `AccountUser` + 1 query `Product` |
| `controllers/client/product.controller.ts` (detail) | Mỗi review → 1 query `AccountUser` |
| `controllers/client/order.controller.ts:76-83` | Mỗi biến thể trong mỗi item → 1 query `AttributeProduct` |
| `controllers/client/cart.controller.ts:17-47` | Mỗi item giỏ hàng → 1 query `Product` + 1 query `AttributeProduct` |
| `controllers/client/compare.controller.ts`, `wishlist.controller.ts` | Tương tự |
| `helpers/product.helper.ts:76-113` | Mỗi bài viết → 1 query `AccountAdmin` |
| `middlewares/admin/auth.middleware.ts:52-64` | Mỗi role của admin → 1 query `Role` (mỗi request!) |

→ Với 20 sản phẩm/trang và 20 review, một trang có thể sinh **40+ query**. Nên gom bằng `$in` + `Map`, hoặc chuyển sang `ObjectId` + `populate`.

---

## 13. LỘ TRÌNH ĐỀ XUẤT

### Giai đoạn 1 — Sửa lỗi chặn (1–2 ngày)

Ưu tiên cao nhất, làm trước khi làm bất cứ tính năng mới nào:

1. ✅ Thêm `volumes: media-data:/app/media` vào `docker-compose.yml` — **1 dòng, cứu toàn bộ file upload**
2. ✅ Sửa Dockerfile cho Puppeteer (Alpine + chromium hoặc đổi base image)
3. ✅ `await connectDB()` + bọc `try/catch` cho `configureGooglePassport`/`configureFacebookPassport`
4. ✅ Thêm `if (!chatRoom) return;` trong `chat.socket.ts` + `.catch()` khi gọi
5. ✅ Kiểm tra null cho `template` trong `getBlockListByTemplate`
6. ✅ Thêm `await` cho `Order.findOne` ở `order.success`
7. ✅ `Buffer.from()` thay `new Buffer()` (2 chỗ)
8. ✅ Sửa `countDocuments(find)` ở file-manager
9. ✅ Escape + neo `^` cho RegExp xoá thư mục
10. ✅ `if (req.query.folderPath)` thay vì so sánh `!= "undefined"`
11. ✅ Rà `grep -rn "domainCDN" views/ public/` và thay hết sang `domainPublic`

### Giai đoạn 2 — Đúng nghiệp vụ (2–3 ngày)

12. ✅ **Trừ tồn kho** khi đặt hàng + hoàn kho khi huỷ/trả
13. ✅ Cho khách **chọn số điểm muốn dùng** + `Math.max(0, total)`
14. ✅ `$inc` atomic cho `coupon.usedCount` + dời xuống sau khi lưu đơn thành công
15. ✅ Dời cập nhật `ratingAvg` sang lúc admin duyệt review
16. ✅ Kiểm tra `variantMatched` trước khi lấy giá
17. ✅ Tạo `views/order-payment-failed.pug` thay `res.render('success')`

### Giai đoạn 3 — Bảo mật (2–3 ngày)

18. ✅ Thu hồi + đưa key OpenMap vào ENV
19. ✅ `fileFilter` whitelist MIME type + `limits.fileSize` cho multer (cả 2 service)
20. ✅ Sanitize đường dẫn ở `file-manager` (dùng `path.resolve` + kiểm tra `startsWith(mediaRoot)`)
21. ✅ Thêm `express-rate-limit` cho login, OTP, AI endpoint
22. ✅ Thêm `helmet`
23. ✅ OTP 6 số + đếm số lần thử + xoá sau khi dùng
24. ✅ Đổi mật khẩu yêu cầu mật khẩu cũ
25. ✅ Whitelist field cho các endpoint Setting
26. ✅ Session store dùng `connect-mongo`

### Giai đoạn 4 — Hoàn thiện phần lặp lại (5–7 ngày)

> Đây chính là phần bạn nói "chưa làm".

27. ✅ Bổ sung đủ `permissionList` (~45 quyền) + gắn `checkPermission` vào toàn bộ route admin
28. ✅ Bọc `if (permissions.includes(...))` cho toàn bộ menu trong `startbar.pug`
29. ✅ Làm thùng rác + khôi phục + xoá vĩnh viễn cho: Bài viết, Sản phẩm, Danh mục SP, Thuộc tính, Coupon, Nhóm quyền, TK quản trị, Block, Template
30. ✅ Thêm Joi validate cho: Block, Template, Setting, Order, Review, Chat
31. ✅ Thêm `multer` (`upload.none()`) cho route Block + Template
32. ✅ Gọi `logAdminAction` ở **mọi** hành động ghi (đặc biệt Setting) + làm trang `/admin/log/list`
33. ✅ Thêm bộ lọc trạng thái + sắp xếp cho tất cả danh sách admin
34. ✅ Thêm tìm kiếm + phân trang cho Đơn hàng, Đánh giá, Block, Template
35. ✅ Bộ lọc đơn hàng theo: trạng thái, ngày, mã đơn, SĐT, phương thức thanh toán

### Giai đoạn 5 — Bổ sung phía khách (3–4 ngày)

36. ✅ Khách huỷ đơn ở trạng thái `pending`
37. ✅ Trang theo dõi vận đơn (dùng `shipping.goshipOrderId`)
38. ✅ Trang danh sách bài viết tổng + trang liên hệ/giới thiệu/FAQ
39. ✅ Quyết định dứt khoát về guest checkout (bỏ `verifyToken` ở `/order/create` hoặc bỏ tra cứu theo phone)
40. ✅ Xác thực email khi đăng ký (đã có sẵn `type: "otp-register"`)

### Giai đoạn 6 — Kỹ thuật (liên tục)

41. ✅ Global error handler + trang 404
42. ✅ Tách `helpers/date-range.helper.ts`, `helpers/coupon.helper.ts`
43. ✅ Tách `services/order.service.ts` khỏi controller
44. ✅ Thêm index MongoDB cho các trường query nhiều
45. ✅ Gom N+1 query bằng `$in` + `Map`
46. ✅ Build TypeScript thật (`tsc`) + multi-stage Dockerfile + `npm ci` + non-root user
47. ✅ Chuyển `@types/*` sang `devDependencies`
48. ✅ Viết lại `README.md` (UTF-8) với hướng dẫn cài đặt
49. ✅ ESLint + Prettier
50. ✅ Test cho các hàm tính tiền (`order`, `coupon`, `point`)

---

## 14. PHỤ LỤC

### 14.1. Biến môi trường

**`project-ecommerce-t8-25/.env` & `.env.docker`** (31 biến):

| Nhóm | Biến |
|---|---|
| Database | `DATABASE` |
| Bảo mật | `JWT_SECRET`, `SESSION_SECRET`, `NODE_ENV` |
| SuperAdmin | `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, `SUPER_ADMIN_ID` |
| CDN | `FILE_MANAGER_SECRET`, `CDN_URL`, `CDN_PUBLIC` |
| OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `FACEBOOK_CALLBACK_URL` |
| Email | `GMAIL_USER`, `GMAIL_PASS` |
| Vận chuyển | `GOSHIP_TOKEN`, `OPENMAP_KEY` |
| Thanh toán | `ZALOPAY_APPID`, `ZALOPAY_KEY1`, `ZALOPAY_KEY2`, `ZALOPAY_DOMAIN`, `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_URL` |
| AI | `GROQ_API_KEY` |
| Khác | `DOMAIN_WEBSITE` |

**`file-manager/.env` & `.env.docker`** (3 biến): `DOMAIN`, `PORT`, `FILE_MANAGER_SECRET`

> ⚠️ **Lưu ý quan trọng:** Rất nhiều biến trong nhóm OAuth / Email / Vận chuyển / Thanh toán **đang KHÔNG được đọc từ `.env`** mà đọc từ collection `settings` trong MongoDB (qua `configs/setting.config.ts`). Ví dụ: `GOSHIP_TOKEN` trong `.env` không dùng, code đọc `Setting{key:"apiShipping"}.data.tokenGoShip`. Đây là **nguồn nhầm lẫn lớn** — nên dọn `.env` bỏ những biến không dùng, hoặc thống nhất một nguồn.
>
> Các biến **thực sự** được đọc từ `process.env`: `DATABASE`, `JWT_SECRET`, `SESSION_SECRET`, `NODE_ENV`, `SUPER_ADMIN_*`, `FILE_MANAGER_SECRET`, `CDN_URL`, `CDN_PUBLIC`, `GROQ_API_KEY`, `DOMAIN`, `PORT`.

### 14.2. Thống kê mã nguồn

| Hạng mục | Số lượng |
|---|---|
| Model Mongoose | 20 (+1 sub-schema) |
| Controller admin | 16 file |
| Controller client | 12 file |
| Route file | 30 (17 admin + 13 client) |
| Middleware | 8 (1 admin + 7 client) |
| Helper | 11 |
| Validate (Joi) | 10 |
| Socket handler | 3 |
| Cron job | 1 |
| Trang Pug admin | 53 |
| Trang Pug client | 26 |
| Block giao diện | 12 |
| Partial Pug | 5 admin + 28 client |
| Mixin Pug | 6 admin + 7 client |
| **Controller dài nhất** | `admin/dashboard.controller.ts` — 897 dòng |

### 14.3. Cây thư mục (rút gọn, bỏ `node_modules` & assets tĩnh)

```
D:\Middle Nodejs\Node TH\
├── docker-compose.yml
├── docs\                          ← báo cáo này nằm ở đây
│
├── project-ecommerce-t8-25\
│   ├── index.ts                   ← entry: express + socket.io + cron
│   ├── dockerfile  .dockerignore  .env  .env.docker
│   ├── package.json  tsconfig.json  README.md
│   ├── configs\        (5)  database, variable, setting, googleOauth, facebookOauth
│   ├── controllers\
│   │   ├── admin\      (16)
│   │   └── client\     (12)
│   ├── helpers\        (11) ai, block, category, chat, format, generate,
│   │                        location, log, mail, ping-google, point, product
│   ├── interfaces\     (1)  request.interface
│   ├── jobs\           (2)  index, chat (cron dọn phòng chat)
│   ├── middlewares\
│   │   ├── admin\      (1)  auth (verifyToken + checkPermission)
│   │   └── client\     (7)  article, attribute, auth, category, chat, seo, setting
│   ├── models\         (20 + schemas/seo.schema)
│   ├── routes\
│   │   ├── admin\      (17)
│   │   └── client\     (13)
│   ├── sockets\        (3)  index, auth, chat
│   ├── validates\      (10) admin(6) + client(4)
│   ├── views\
│   │   ├── admin\      layouts(2) mixins(6) pages(53) partials(5)
│   │   └── client\     blocks(12) layouts(1) mixins(7) pages(26) partials(28)
│   └── public\         admin\assets\  client\assets\
│
└── file-manager\
    ├── index.ts
    ├── dockerfile  .dockerignore  .env  .env.docker
    ├── package.json  tsconfig.json
    ├── controllers\   file-manager, media
    ├── middlewares\   auth (Bearer secret), domain (Referer)
    ├── routes\        index, file-manager, media
    └── media\         ← LƯU FILE VẬT LÝ (cần Docker volume!)
        ├── Folder 1\
        ├── chats\<userId>\
        ├── users\<userId>\
        └── reviews\<userId>\
```

---

## KẾT LUẬN

Hệ thống này **vượt xa mức một bài tập lớn**. Kiến trúc 2 service, page-builder động, tích hợp thanh toán/vận chuyển thật, chat realtime có load-balancing, và tích hợp AI — đây là những thứ nhiều hệ thống thương mại đang chạy production cũng không có đủ.

Phần "chưa hoàn thiện" mà bạn nói đúng như bạn mô tả: **bạn đã xây xong khuôn mẫu, chỉ chưa nhân bản khuôn mẫu đó ra hết các module.** Đó là việc lặp lại, tốn công nhưng không khó — ước tính **5–7 ngày** cho toàn bộ Giai đoạn 4.

Điều tôi khuyến nghị làm **trước tiên**, ngay cả trước phần lặp lại đó, là **Giai đoạn 1 và 2**: một dòng `volumes:` trong `docker-compose.yml` sẽ cứu bạn khỏi việc mất toàn bộ file upload, và việc trừ tồn kho là thứ khiến hệ thống này khác biệt giữa "demo được" và "bán hàng thật được".

---

*Báo cáo được lập bởi Claude Opus 5 sau khi đọc toàn bộ mã nguồn của cả 2 service và file cấu hình Docker. Mọi vị trí lỗi đều kèm đường dẫn file và số dòng để tiện đối chiếu.*
