# 1 — ĐÁNH GIÁ TỔNG QUAN HỆ THỐNG ECOMMERCE — CODEX

> Ngày đánh giá: 07/09/2026  
> Agent thực hiện: CODEX  
> Phạm vi: `project-ecommerce-t8-25`, `file-manager`, `docker-compose.yml` tại thư mục `Node TH`  
> Hình thức: đọc mã nguồn, đối chiếu route/controller/model/view, kiểm tra TypeScript và cấu hình Docker; chưa thực hiện kiểm thử E2E với dữ liệu/thanh toán thật.

## 1. Kết luận điều hành

Project đã vượt xa mức CRUD cơ bản. Hệ thống hiện có đủ khung của một nền tảng ecommerce server-rendered: catalog, giỏ hàng, wishlist, so sánh, tài khoản, địa chỉ, checkout, mã giảm giá, điểm thưởng, đơn hàng, đánh giá, thanh toán VNPay/ZaloPay, vận chuyển GoShip, CMS block/template, SEO, dashboard quản trị, chat realtime, AI hỗ trợ chăm sóc khách hàng và một service quản lý file riêng.

Đánh giá ngắn gọn:

- **Phù hợp để demo/học tập/staging:** Có.
- **Sẵn sàng chạy production có giao dịch thật:** Chưa.
- **Mức hoàn thiện chức năng nhìn từ giao diện:** khoảng 70–75%.
- **Mức sẵn sàng production tổng thể:** khoảng 40–45%.
- **Rào cản lớn nhất:** an toàn file/chat, tính toàn vẹn đơn hàng–coupon–điểm–tồn kho, độ tin cậy của callback thanh toán, RBAC chưa phủ hết hệ thống, chưa có test và vận hành production còn thiếu.

Điểm mạnh nổi bật là phạm vi nghiệp vụ rộng, tổ chức source tương đối dễ lần theo, có validate ở nhiều luồng, mật khẩu người dùng thường được băm bằng bcrypt, cookie JWT dùng `httpOnly`, và đã chủ động tách file storage thành service riêng. Tuy nhiên, một số luồng quan trọng đang thực hiện nhiều cập nhật rời rạc mà không có transaction hoặc cơ chế idempotency. Vì vậy lỗi mạng, callback lặp, hoặc hai request đồng thời có thể làm lệch coupon, điểm thưởng, thanh toán và đơn hàng.

**Khuyến nghị quyết định:** chưa đưa hệ thống lên production trước khi hoàn tất toàn bộ nhóm P0 trong mục 10.

## 2. Phạm vi và quy mô đã đọc

### 2.1. Thành phần hệ thống

1. `project-ecommerce-t8-25`
   - Service chính chạy cổng 3000.
   - Express 5 + TypeScript + Pug + Mongoose/MongoDB.
   - Chứa cả storefront, trang quản trị, Socket.IO, cron job và tích hợp bên thứ ba.

2. `file-manager`
   - Service file chạy cổng 4000.
   - Express + Multer + filesystem cục bộ.
   - API quản lý được bảo vệ bằng shared bearer secret; API đọc media được kiểm tra bằng `Referer`.

3. `docker-compose.yml`
   - Khởi tạo hai service trên cùng mạng Docker mặc định.
   - Ecommerce gọi nội bộ tới `http://file-manager:4000`.
   - Chưa có MongoDB container; hệ thống đang dựa vào database bên ngoài.

### 2.2. Quy mô gần đúng

- Ecommerce: 121 file TypeScript, khoảng 10.094 dòng TypeScript; 140 file Pug, khoảng 10.391 dòng Pug.
- File-manager: 8 file TypeScript, khoảng 348 dòng.
- Tổng route khai báo của hai service: 178 route (`GET`: 101, `POST`: 34, `PATCH`: 39, `DELETE`: 4).
- Ecommerce có 20 Mongoose model/collection-level schema.

Không đọc chi tiết nội dung của `node_modules`, font, ảnh mẫu và thư viện JS/CSS minified bên thứ ba; các thành phần này không phải mã nghiệp vụ tự viết. Mã TypeScript, các route, controller, middleware, helper, socket, job, model, validate và các view/JS liên quan đến luồng chính đã được rà soát.

## 3. Kiến trúc hiện tại

```text
Browser
  ├─ Storefront Pug + JS (cart/wishlist/compare lưu localStorage)
  ├─ Admin Pug + JS
  └─ Socket.IO chat
          │
          ▼
Ecommerce service :3000
  ├─ Express routes → middleware → controller
  ├─ Mongoose → MongoDB bên ngoài
  ├─ Passport Google/Facebook
  ├─ GoShip / OpenMap
  ├─ VNPay / ZaloPay
  ├─ Gmail SMTP
  ├─ Groq AI
  ├─ Puppeteer tạo hóa đơn PDF
  └─ HTTP + shared secret
          │
          ▼
File-manager service :4000
  └─ Local filesystem: /media
```

Đây là **modular monolith cho nghiệp vụ ecommerce**, cộng thêm một **microservice file storage nhỏ**. Storefront là server-rendered, nhưng khá nhiều tương tác được xử lý bằng JavaScript phía trình duyệt. Cart, wishlist và compare chưa lưu trong database mà lưu ở `localStorage`.

### 3.1. Cấu trúc tầng

- `routes/`: ánh xạ URL và middleware.
- `controllers/`: chứa cả orchestration lẫn phần lớn business logic.
- `models/`: Mongoose schema.
- `validates/`: Joi middleware cho một số request.
- `middlewares/`: xác thực, dữ liệu dùng chung cho view, SEO và setting.
- `helpers/`: xử lý cây danh mục, block, email, điểm, vị trí, AI, log.
- `sockets/`: xác thực socket và chat realtime.
- `jobs/`: xóa phòng chat cũ.
- `views/` + `public/`: Pug và JS/CSS/assets.

Điểm cần lưu ý là controller đang gánh quá nhiều trách nhiệm. Ví dụ `controllers/client/order.controller.ts` vừa định giá, kiểm tra coupon, dùng điểm, gọi GoShip, tạo đơn, tạo payment request, xác minh callback và tạo PDF. Điều này làm khó test, khó rollback và dễ phát sinh cập nhật dở dang.

## 4. Bản đồ chức năng

| Nhóm | Hiện trạng | Nhận xét |
|---|---|---|
| Catalog sản phẩm | Khá đầy đủ | Danh mục, tìm kiếm, lọc giá/thuộc tính/rating, sort, phân trang, gợi ý tìm kiếm, sản phẩm liên quan/mua kèm/đã xem |
| Sản phẩm quản trị | Khá đầy đủ | CRUD mềm, danh mục, thuộc tính, biến thể, SEO, CSV import/export |
| CMS trang chủ | Đã có nền tảng | Block + template + JSON data + render Pug động; còn thiếu validate và fallback an toàn |
| Blog | Khá đầy đủ | Danh mục, bài viết, soft delete/thùng rác một phần, sitemap; comment blog mới chỉ là UI mẫu |
| Auth khách hàng | Đã có | Đăng ký/đăng nhập, Google/Facebook, OTP quên mật khẩu; cần gia cố reset token và rate limit |
| Auth quản trị/RBAC | Một phần | Có JWT, role và permission; permission mới bao phủ một số module |
| Cart | Có | Lưu client-side, backend hydrate lại giá; chưa có cart theo tài khoản hoặc đồng bộ nhiều thiết bị |
| Wishlist/Compare | Có | Lưu `localStorage`; chưa đồng bộ server/tài khoản |
| Checkout | Có luồng chính | Tính phí GoShip, coupon, điểm, tạo đơn; thiếu transaction, inventory và nhiều kiểm tra quan trọng |
| Thanh toán | Có tích hợp sandbox | VNPay và ZaloPay; callback/idempotency/chuyển trạng thái chưa đủ an toàn production |
| Đơn hàng | Có cơ bản | Khách xem đơn, admin sửa trạng thái/export; thiếu state machine đầy đủ, hủy/hoàn/trả hàng và lịch sử trạng thái |
| Coupon | Có cơ bản | Theo %, cố định, thời gian, giới hạn tổng; chưa có quota theo user, atomic reservation hoặc release |
| Điểm thưởng | Có cơ bản | Tích và dùng điểm; đang tự dùng toàn bộ điểm, có nguy cơ cộng lặp và không hoàn khi hủy |
| Review | Có | Upload ảnh, moderation; điểm trung bình đang tính trước duyệt và không tái tính khi reject |
| Dashboard | Khá rộng | KPI doanh thu, đơn, khách, top sản phẩm; nhiều query tuần tự và mốc thời gian còn mong manh |
| Chat realtime | Nhiều tính năng | Phân phòng, unread, upload, xóa, khóa, rating, online, AI reply/summary/emotion |
| File manager | Có CRUD | Upload/list/rename/delete/folder; rủi ro path traversal, file validation và persistence rất cao |
| SEO | Có nền tảng | Product SEO, canonical, sitemap, robots; ping Google kiểu cũ và một số null/error case |
| Email/newsletter | Một phần | OTP email có; newsletter/footer/contact vẫn là template tĩnh |
| Testing/CI | Chưa có | `npm test` của ecommerce chỉ báo chưa cấu hình; file-manager không có test script |
| Documentation | Gần như chưa có | README hiện chỉ có tiêu đề project |

## 5. Mô hình dữ liệu

Các miền dữ liệu chính:

- Identity: `accounts-admin`, `accounts-user`, `roles`, `verify-otp`, `user-address`.
- Catalog/CMS: `products`, `categories-product`, `attributes-product`, `blogs`, `categories-blog`, `blocks`, `templates`.
- Commerce: `orders`, `coupons`, `reviews`.
- Communication/operations: `chat-rooms`, `chat-messages`, `media`, `settings`, `admin-logs`.

### Đánh giá mô hình

Điểm tốt:

- Có timestamps ở hầu hết schema.
- Nhiều entity có soft delete.
- Order lưu snapshot tên/ảnh/giá/variant của sản phẩm, phù hợp để giữ lịch sử hóa đơn.
- Review có unique compound index `(userId, orderItemId)`.
- Schema đã thể hiện khá rõ các trạng thái nghiệp vụ.

Điểm cần cải thiện:

- Quan hệ chủ yếu dùng `String` thay vì `ObjectId`, vì vậy không có referential integrity và khó tận dụng `populate`.
- Hầu như chưa có index cho các trường truy vấn thường xuyên: email, phone, slug, code, status/deleted, userId, roomId, adminId, createdAt.
- Chưa có unique index cho email/phone người dùng, email admin, slug sản phẩm/bài viết/danh mục, coupon code và order code. Kiểm tra `findOne` trước `save` vẫn có race condition.
- `attributes`, `variants`, `data` và nhiều field dùng `Array`/`Object` quá rộng, khiến database chấp nhận cấu trúc không đồng nhất.
- `updateOne()` mặc định không chạy đầy đủ validator của Mongoose nếu không bật `runValidators`, nên status truyền tùy ý có thể lọt qua ở một số endpoint.
- Soft delete chưa nhất quán: có module có trash/undo/destroy, module khác chỉ đặt `deleted`, và dữ liệu liên quan không được cascade/reconcile.

## 6. Các điểm làm tốt

1. **Phạm vi nghiệp vụ rộng và có liên kết giữa các module.** Sản phẩm, coupon, vận chuyển, thanh toán, review, điểm và dashboard không tồn tại độc lập mà đã được nối thành luồng.
2. **Giá sản phẩm được đọc lại ở server khi đặt hàng.** Client không trực tiếp quyết định giá cuối cùng.
3. **Mật khẩu account thông thường được bcrypt hash.** Đây là nền tảng đúng.
4. **JWT cookie có `httpOnly` và phần lớn có `sameSite`.** Giảm một phần rủi ro lấy token bằng JavaScript và CSRF cross-site thông thường.
5. **Có phân tách file service và shared-secret authentication.** Ý tưởng tách storage khỏi app chính là hợp lý nếu sau này thay bằng object storage.
6. **Có validate Joi ở nhiều form quan trọng.** Validation message cũng thân thiện với người dùng.
7. **Có snapshot item trong order.** Hóa đơn cũ không bị thay đổi khi tên hoặc giá sản phẩm đổi.
8. **Có cơ chế moderation review, SEO schema, sitemap và cache-busting asset.** Đây là các phần thường bị bỏ qua trong project học tập.
9. **TypeScript strict đang bật.** Khi bỏ qua lỗi cấu hình `ignoreDeprecations`, source hiện biên dịch được.

## 7. Phát hiện ưu tiên cao

### P0-SEC-01 — File-manager có nguy cơ đọc/xóa/ghi ra ngoài thư mục media

Vị trí chính:

- `file-manager/controllers/file-manager.controller.ts`: các hàm upload, rename, delete file, create/delete/list folder.
- `file-manager/controllers/media.controller.ts`: ghép trực tiếp wildcard path vào đường dẫn filesystem.

Các giá trị `folderPath`, `folder`, `fileName`, `newFileName` và `subPath` đi vào `path.join()` mà không có bước `resolve` rồi kiểm tra đường dẫn kết quả vẫn nằm trong media root. Chuỗi chứa `..` có thể thoát khỏi thư mục `media`. Riêng delete folder dùng `fs.rmSync(..., { recursive: true })`, nên hậu quả có thể là xóa cả vùng khác trong container nếu shared secret bị lộ.

Shared secret hiện là hàng rào duy nhất cho API quản lý file, trong khi secret đang được lưu plaintext và có dấu hiệu tái sử dụng cho mục đích khác. API đọc media chỉ dựa vào `Referer`, mà header này không phải một cơ chế authorization đáng tin cậy.

**Cần làm:** tạo một hàm duy nhất `resolveInsideMediaRoot(input)`, từ chối absolute path, `..`, null byte, separator không hợp lệ; kiểm tra `resolvedPath.startsWith(mediaRoot + path.sep)`. Dùng allowlist filename, không nhận folder tuyệt đối từ client, và thêm test traversal trước khi chạy lại.

### P0-SEC-02 — Stored XSS qua chat có thể chạy trong trang admin

Vị trí:

- `public/client/assets/js/chat.js`: nội dung tin nhắn và file URL được nối vào HTML rồi gán `innerHTML`.
- `public/admin/assets/js/chat.js`: làm tương tự khi admin đọc tin nhắn.
- `controllers/admin/chat.controller.ts`: nội dung hội thoại được đưa vào prompt AI.
- `public/admin/assets/js/chat.js`: output AI tiếp tục được gán vào `innerHTML`.

Người dùng có thể gửi HTML/script payload trong nội dung chat. Khi admin mở phòng chat, payload được render bằng `innerHTML`. Đây là đường stored XSS trực tiếp từ tài khoản khách sang phiên admin. Ngoài ra, prompt injection từ tin nhắn có thể khiến output AI chứa markup nguy hiểm, sau đó output này cũng được render bằng `innerHTML`.

**Cần làm:** dùng `textContent` cho text, tạo DOM node/attribute bằng API thay vì template HTML, sanitize URL và AI output; thêm CSP bằng Helmet; giới hạn protocol; encode filename. Không coi output AI là HTML tin cậy.

### P0-PAY-01 — Callback thanh toán và cộng điểm chưa idempotent

Vị trí:

- `controllers/client/order.controller.ts`: `paymentZalopayResult`, `paymentVNPayResult`.
- `helpers/point.helper.ts`: `addPointAfterPayment`.

Mỗi callback hợp lệ đều gọi `addPointAfterPayment`. Nếu cổng thanh toán retry callback hoặc người dùng mở lại VNPay return URL hợp lệ, điểm có thể được cộng nhiều lần. Order không lưu transaction ID, provider status, paidAt hay cờ `pointsAwardedAt` để chặn xử lý lặp.

VNPay result hiện kiểm tra chữ ký nhưng chưa kiểm tra đầy đủ response code, transaction status, amount, merchant/terminal và sự tương ứng với payment attempt đã lưu. Một response có chữ ký nhưng là giao dịch thất bại không nên đánh dấu `paid`. ZaloPay cũng chưa map/persist payment attempt một cách rõ ràng.

**Cần làm:** tạo `payments` hoặc payment subdocument có unique provider transaction ID; xử lý callback trong transaction; chỉ chuyển `unpaid → paid` một lần bằng conditional update; chỉ cộng điểm khi update trạng thái thực sự thành công; kiểm tra toàn bộ trường kết quả và amount/currency/order mapping.

### P0-ORD-01 — Luồng tạo đơn không đảm bảo tính toàn vẹn

Vị trí: `controllers/client/order.controller.ts:createPost` và `validates/client/order.validate.ts`.

Các vấn đề chính:

- Joi chỉ kiểm tra `items` là array tối thiểu 1 phần tử, chưa validate schema từng item, quantity, productId và variant.
- Quantity có thể là 0, âm, số thập phân hoặc quá lớn; total vì thế có thể sai hoặc âm.
- Không kiểm tra/decrement tồn kho sản phẩm hay tồn kho từng variant.
- Variant không khớp có thể làm `variantMatched.priceNew` lỗi; variant inactive vẫn có thể được dùng.
- Product ID không hợp lệ/không còn active bị bỏ qua; sau đó đơn vẫn có thể tiếp tục với danh sách item rỗng.
- Coupon tăng `usedCount` trước khi gọi GoShip và trước khi order được save. Nếu bước sau lỗi, coupon đã bị tiêu hao nhưng không có đơn.
- Coupon counter không atomic, nên hai request đồng thời có thể vượt `usageLimit`.
- Hệ thống tự dùng toàn bộ điểm còn lại, không có lựa chọn số điểm cần dùng và không giới hạn point discount theo giá trị đơn.
- Không có transaction giữa coupon, điểm, stock và order.
- Shipment GoShip được tạo trước thanh toán online; đơn bị bỏ dở vẫn có thể tạo vận đơn.
- Điểm đã dùng chưa có cơ chế hoàn khi đơn bị hủy/returned hoặc tạo đơn thất bại.

**Cần làm:** tách Pricing/Inventory/Order/Payment service; validate item sâu; khóa/atomic decrement stock; tính total không âm; transaction MongoDB; reservation coupon/point; chỉ tạo shipment ở trạng thái phù hợp; thiết kế compensation khi external API thất bại.

### P0-SEC-03 — Khóa bí mật cần được rotate và quản lý lại

Trong quá trình kiểm tra cấu hình đã xác nhận có nhiều credential thật ở file môi trường và có một API key hard-code trực tiếp trong `helpers/location.helper.ts`. Giá trị bí mật không được chép lại trong báo cáo này.

Điểm tích cực: `.env` và `.env.docker` không nằm trong danh sách file Git đang track và không thấy lịch sử commit của hai file qua kiểm tra hiện tại.

Tuy vậy:

- Một số secret có độ mạnh thấp hoặc được tái sử dụng giữa nhiều mục đích.
- Super-admin password được so sánh trực tiếp với plaintext env.
- Payment/OAuth/Gmail secret được lưu plaintext trong collection `settings` và render lại nguyên giá trị trên form.
- Mọi admin đăng nhập hiện có thể truy cập phần settings do chưa có permission riêng.
- API key OpenMap hard-code trong source có thể đã nằm trong lịch sử Git.

**Cần làm ngay:** rotate toàn bộ database credential, JWT/session/file-manager secrets, OAuth, SMTP, GoShip/OpenMap, payment và AI keys; dùng secret manager; tách secret theo môi trường và mục đích; không render lại full secret; kiểm tra toàn bộ Git history bằng secret scanner.

### P0-AUTH-01 — RBAC mới áp dụng cho một phần trang quản trị

`verifyToken` được đặt cho các module admin, nhưng `checkPermission` mới được áp dụng rõ ở dashboard, article, role, account-admin và file-manager. Product, coupon, order, review, settings, block, template, account-user và phần lớn chat chỉ cần là admin active là có thể truy cập/chỉnh sửa.

Ngoài ra route xóa account admin đang kiểm tra permission `account-admin-edit` thay vì `account-admin-delete`. Các endpoint dashboard con cũng không gọi `checkPermission("dashboard")`, dù menu được ẩn theo permission.

Một số chat admin endpoint lấy `roomId` nhưng không ràng buộc `adminId`, nên admin A có thể đọc/phân tích phòng được giao cho admin B nếu biết ID.

**Cần làm:** định nghĩa permission đầy đủ theo resource/action; áp dụng ở route, không dựa vào ẩn menu; thêm ownership check cho chat; viết integration test cho từng role.

## 8. Phát hiện mức cao và trung bình

### 8.1. Authentication và account

- Luồng OTP phát hành chính token đăng nhập bình thường thay vì reset token có scope một lần. Endpoint reset password chấp nhận bất kỳ JWT user hợp lệ; trang “đổi mật khẩu” trong dashboard cũng dùng chung endpoint này mà không yêu cầu mật khẩu hiện tại.
- OTP không bị xóa/đánh dấu đã dùng sau khi xác minh, nên có thể tái sử dụng đến lúc TTL xóa record.
- Không có rate limit cho login, OTP, resend, chat, AI hoặc upload.
- Client JWT cookie ở đăng ký/đăng nhập/OAuth/profile update chưa đặt `secure` theo production một cách nhất quán.
- `NODE_ENV` trong cấu hình Docker hiện không thể hiện chế độ production, khiến các nhánh secure-cookie không được kích hoạt.
- JWT không có token version/revocation. Logout chỉ xóa cookie; token bị lộ vẫn dùng được đến khi hết hạn.
- Email/phone uniqueness chỉ được kiểm tra bằng query trước save, chưa được DB enforce.
- OAuth strategy đọc setting từ DB khi bootstrap. Nếu setting thiếu hoặc DB chưa sẵn sàng, startup có thể lỗi không được xử lý tốt.

### 8.2. Review

- User có thể review đơn chưa completed vì chỉ kiểm tra order thuộc user, không kiểm tra trạng thái giao hàng.
- `ratingAvg` và `ratingCount` được cập nhật ngay khi review mới còn status `null`, trước khi admin approve.
- Khi admin reject/approve, product aggregate không được tính lại.
- Cập nhật average kiểu read-modify-write có race condition.
- Upload review chỉ kiểm tra số lượng/dung lượng sau khi Multer đã giữ toàn bộ file trong memory; không kiểm tra MIME/signature ảnh.
- Nếu upload file thành công nhưng save review thất bại, file mồ côi không được xóa.

### 8.3. Catalog/CMS/SEO

- Kết hợp filter thuộc tính và rating bị ghi đè cùng field `$or`; nhiều filter thuộc tính hiện mang nghĩa “khớp bất kỳ” thay vì “khớp tất cả”.
- `limitItems` do client truyền chưa có trần tối đa, có thể tạo query rất lớn.
- Cookie `productViewHistory` được `JSON.parse` không có try/catch và không giới hạn số phần tử.
- `article.detail` truy cập `articleDetail.updatedBy` trước khi kiểm tra `articleDetail` tồn tại; slug sai có thể gây lỗi 500.
- Homepage giả định luôn có active template cho `/`; thiếu template/block hoặc block bị xóa có thể gây lỗi render.
- Nội dung product/blog được render unescaped. Đây có thể là chủ ý cho rich text, nhưng phải sanitize HTML khi lưu và giới hạn quyền nhập.
- Import CSV dùng `updateOne` không `upsert`, nên record mới không được tạo; import dữ liệu rộng, chưa validate từng row và có thể đưa markup không an toàn vào content.
- Ping `https://www.google.com/ping?sitemap=...` là cơ chế cần xem lại; nên dựa vào Search Console/sitemap discovery thay vì làm request đồng bộ khi admin tạo nội dung.

### 8.4. Chat và Socket.IO

- Message text, file count, file size và MIME chưa có giới hạn server-side hợp lý.
- `ADMIN_TYPING` chưa kiểm tra role, user socket có thể phát sự kiện mang tên admin.
- Auth socket catch lỗi nhưng không gọi `next(error)` hoặc `next()`, có thể làm handshake treo.
- `listAdminOnline`/`listUserOnline` chỉ lưu một entry mỗi account; nhiều tab/socket cùng account sẽ sai trạng thái khi một tab disconnect.
- Online state và room assignment nằm trong memory một process, không hoạt động đúng khi scale nhiều instance nếu không có Redis adapter/presence store.
- Cron xóa chat chạy trên từng instance, nên scale ngang có thể chạy job trùng.
- Job gọi xóa folder bằng Axios nhưng không `await`, sau đó xóa DB records; file và DB có thể lệch.

### 8.5. File storage

- Multer `memoryStorage` không có global size/count limit; upload lớn có thể làm hết RAM.
- Không allowlist MIME/extension, không kiểm tra magic bytes, không scan malware.
- Dùng filesystem sync (`writeFileSync`, `renameSync`, `rmSync`, `readdirSync`) chặn event loop.
- Tên file dùng `Date.now()`; các file trùng tên trong cùng millisecond có thể collision/overwrite.
- DB media nằm ở ecommerce nhưng file vật lý nằm service khác; không có transaction/outbox để giữ hai bên nhất quán.
- Domain middleware dựa vào `Referer`; direct download, privacy browser hoặc public domain khác có thể bị chặn, còn attacker vẫn có thể giả header.
- Media hiện được copy vào Docker image nhưng không mount volume. Rebuild/recreate container làm mất file mới; file cũ lại được bake vào image.

### 8.6. Docker và vận hành

- Compose chưa có volume cho media, healthcheck, restart policy, resource limit, dependency readiness hoặc reverse proxy/TLS.
- Port 4000 được publish trực tiếp; cần cân nhắc chỉ public qua reverse proxy/CDN hoặc object storage.
- Public CDN URL hiện mang dạng localhost, trong khi website có thể được truy cập qua domain/tunnel khác; browser người dùng ngoài máy dev sẽ gọi `localhost` của chính họ và media không tải được.
- `DOMAIN` của file-manager phải khớp origin thật; cấu hình hiện dễ làm media trả 403 ở domain triển khai.
- Dockerfile dùng `npm install`, chạy source qua `ts-node` và copy toàn bộ source vào image. Production nên dùng `npm ci`, build TypeScript, multi-stage và chạy JavaScript đã compile bằng non-root user.
- `node:22-alpine` + Puppeteer cần được kiểm chứng riêng. Chrome for Testing và dependency native thường không chạy ổn trên Alpine nếu chưa cài/chỉ định Chromium tương thích.
- Không có graceful shutdown, centralized logging, metrics, tracing, alert, backup/restore procedure.
- Không có timeout/retry/circuit breaker rõ ràng cho Axios/fetch tới GoShip, OpenMap, payment, file-manager và AI.

### 8.7. Hiệu năng

- Middleware toàn cục query danh mục sản phẩm, danh mục blog, thuộc tính, setting asset và unread chat trên gần như mọi request storefront.
- Nhiều N+1 query: category parent, role name, blog author, review user/product, chat room user/last message, cart attributes.
- Dashboard thực hiện nhiều count/aggregate tuần tự; riêng thống kê status lặp nhiều query cho 6 trạng thái.
- Chưa có database index rõ ràng cho các query chính.
- Mọi GET response bị tắt cache toàn cục, làm tăng tải và vô hiệu lợi ích cache ở các trang công khai.
- Session dùng MemoryStore mặc định và `saveUninitialized: true`, không phù hợp production và tạo session không cần thiết.

### 8.8. Error handling và tính ổn định

- `connectDB()` không được `await`; lỗi kết nối bị log rồi server vẫn listen.
- Passport configuration là async nhưng không được `await`, có thể có khoảng thời gian route OAuth đã mở nhưng strategy chưa sẵn sàng.
- Không có error middleware/404 handler thống nhất.
- Nhiều controller catch lỗi rồi trả message chung với HTTP 200, khiến monitoring và client khó phân biệt lỗi.
- Một số controller không có try/catch ở luồng phụ thuộc DB/external API.
- `success()` của order thiếu `await` ở `Order.findOne`, vì vậy kiểm tra order không tồn tại không hoạt động như mong muốn.
- Email send không được `await`; API có thể báo thành công dù mail gửi thất bại.
- Doanh thu đang nhóm theo `createdAt` của order thay vì `paidAt`/`completedAt`; số liệu có thể sai về thời điểm ghi nhận.
- Tính timezone bằng cách tạo local `Date` rồi trừ cứng 7 giờ phụ thuộc timezone của process; có thể bị trừ hai lần khi chạy trên máy đã ở Asia/Bangkok.
- Khi kỳ trước bằng 0, code trả tăng trưởng 100% kể cả kỳ hiện tại cũng bằng 0.

## 9. Những chức năng còn thiếu hoặc mới là UI mẫu

Đây là danh sách phù hợp với nhận xét của chủ project về “các chức năng lặp lại chưa làm”:

1. Comment bài blog: có form và danh sách/pagination mẫu nhưng không có model/route/controller nghiệp vụ.
2. Newsletter subscription: form `action="#"`, chưa có backend.
3. Contact, privacy, terms, return policy, FAQ, vendor và nhiều footer/mobile-menu link vẫn là `#` hoặc link template `index.html`.
4. Quản lý khách hàng ở admin mới chỉ có danh sách; chưa khóa/mở, xem chi tiết, chỉnh sửa hoặc lịch sử hoạt động.
5. Trash/restore/permanent delete chỉ đầy đủ hơn ở danh mục blog; product, coupon, role, account, block/template chưa nhất quán.
6. Order lifecycle chưa có hủy từ phía khách, xác nhận giao vận đầy đủ, tracking timeline, return/refund, hoàn stock/coupon/point.
7. Thanh toán chưa có payment history, retry/reconcile, webhook log và refund.
8. Tồn kho chưa có reservation/decrement/restock và chưa quản lý chắc chắn stock theo variant.
9. Coupon chưa có giới hạn theo user, danh sách user được phép dùng, usage history và release reservation.
10. Wishlist/cart/compare chưa đồng bộ tài khoản và nhiều thiết bị.
11. Customer change-password chưa có endpoint riêng yêu cầu mật khẩu hiện tại.
12. Review chưa có response của shop, edit/delete của user và tính rating theo review đã duyệt.
13. Admin log mới được gọi ở vài hành động, chưa bao phủ thay đổi nhạy cảm như settings, payment, role và order.
14. Search chưa có full-text index; regex trên chuỗi slugify sẽ giảm hiệu năng khi dữ liệu lớn.
15. Chưa có notification/email theo trạng thái đơn, queue xử lý nền, hoặc retry delivery.

## 10. Lộ trình hoàn thiện đề xuất

### P0 — Chặn trước production

1. Rotate mọi secret; đưa secret ra secret manager; xóa key hard-code; scan Git history.
2. Sửa path traversal và upload policy của file-manager; thêm volume bền vững hoặc chuyển object storage.
3. Sửa stored XSS chat/AI, thêm CSP/Helmet và sanitize rich text.
4. Thiết kế lại order transaction: item validation, stock reservation, coupon/point atomic, total floor, compensation.
5. Làm payment callback idempotent, kiểm tra đầy đủ status/amount/transaction, lưu payment attempt và webhook log.
6. Hoàn thiện RBAC cho toàn bộ admin route và ownership cho chat.
7. Thêm rate limit cho auth/OTP/upload/chat/AI/payment initiation.
8. Viết integration test bắt buộc cho order, payment callback, coupon, point, stock và file traversal.

### P1 — Ổn định nghiệp vụ

1. Tách controller thành service/repository: PricingService, InventoryService, CouponService, OrderService, PaymentService, StorageClient.
2. Thêm index/unique index và migration/dedup dữ liệu trước khi bật unique.
3. Xây order state machine và lưu lịch sử trạng thái (`statusHistory`, `paidAt`, `completedAt`, `cancelledAt`).
4. Sửa review aggregate chỉ dựa trên approved review.
5. Hoàn thiện change password, reset token one-time, revoke token và OTP consume.
6. Chuẩn hóa response HTTP/status code và error middleware.
7. Thêm timeout/retry có kiểm soát, queue/outbox cho email, webhook, AI và file cleanup.
8. Tối ưu N+1 và middleware query; thêm cache có chủ đích thay vì tắt cache mọi GET.

### P2 — Production engineering và phần còn thiếu

1. Build TypeScript trước khi chạy; Docker multi-stage, `npm ci`, non-root, healthcheck, graceful shutdown.
2. Redis cho session, Socket.IO adapter, presence và distributed locks/job leader.
3. Object storage/CDN thật; signed URL nếu file private; antivirus scanning.
4. CI gồm lint, typecheck, unit/integration/E2E, dependency/secret scanning và Docker build.
5. Monitoring: structured logs có request ID, metrics, error reporting, audit log, webhook dashboard.
6. Hoàn thiện blog comment, newsletter, policy pages, customer admin, returns/refunds và notification.
7. Dọn UI template thừa, link `#`, tiếng Anh/Vietnamese chưa đồng nhất và assets không dùng.

## 11. Kế hoạch test tối thiểu

### Unit test

- Tính price variant, discount %, fixed coupon, max discount, point discount và total không âm.
- Kiểm tra transition order/payment hợp lệ.
- Verify signature VNPay/ZaloPay với fixture thành công/thất bại.
- `resolveInsideMediaRoot` với path an toàn, `..`, absolute path, encoded traversal và separator Windows/POSIX.
- Sanitize chat/rich text.

### Integration test

- Hai request cùng dùng coupon cuối cùng: chỉ một request thành công.
- Hai callback thanh toán giống nhau: order chỉ paid một lần, điểm chỉ cộng một lần.
- Hai đơn cùng mua stock cuối: không oversell.
- Tạo order lỗi sau bước coupon/shipping: dữ liệu được rollback/compensate.
- Mọi admin role bị từ chối đúng endpoint không có permission.
- Admin A không đọc được chat của admin B.
- Review chỉ được tạo sau completed và rating chỉ đổi sau approved.

### E2E

- Register/login/logout; forgot password với reset token one-time.
- Catalog → variant → cart → shipping → coupon/point → COD.
- Sandbox VNPay/ZaloPay cả success, cancel, failed, retry callback.
- Admin xử lý order đến completed/cancelled/returned.
- Upload/rename/delete file hợp lệ và reject file/path độc hại.
- User chat gửi text có HTML và filename lạ; admin phải chỉ thấy text vô hại.

## 12. Kết quả kiểm tra kỹ thuật đã chạy

- `file-manager`: `npx tsc --noEmit` **thành công**.
- Ecommerce: `npx tsc --noEmit` ban đầu **thất bại do** `ignoreDeprecations: "6.0"` không hợp lệ với TypeScript đang cài.
- Ecommerce: chạy lại với override `--ignoreDeprecations 5.0` thì **biên dịch thành công**.
- `docker compose config`: parse thành công; qua đó phát hiện cấu hình hiện chưa có volume/healthcheck và có vấn đề URL public/domain nêu trên.
- Test tự động: không có suite để chạy. Script `test` của ecommerce hiện chỉ trả “no test specified”.
- Git working tree của cả hai project đang có thay đổi chưa commit; báo cáo đánh giá đúng trạng thái working tree hiện tại và không chỉnh sửa source nghiệp vụ.

Sửa nhanh cho TypeScript config: bỏ `ignoreDeprecations` nếu không cần, hoặc đặt giá trị được compiler hiện tại chấp nhận. Sau đó thêm script `typecheck: tsc --noEmit` vào CI.

## 13. Đề xuất cấu trúc refactor

Không cần chuyển ngay sang microservice. Với quy mô hiện tại, nên giữ ecommerce thành modular monolith nhưng tách business service rõ ràng:

```text
src/
  modules/
    auth/
    catalog/
    cart/
    checkout/
    orders/
    payments/
    coupons/
    loyalty/
    reviews/
    chat/
    cms/
  infrastructure/
    db/
    storage/
    mail/
    shipping/
    ai/
    jobs/
  web/
    routes/
    middleware/
    views/
```

Nguyên tắc quan trọng:

- Controller chỉ parse request, gọi service và map response.
- Business rule nằm trong service thuần, có thể unit test.
- Mọi side effect bên ngoài đi qua adapter/client có timeout và mock được.
- Transaction boundary nằm ở OrderService/PaymentService.
- Payment webhook là nguồn sự thật riêng, có log và idempotency key.
- File-manager chỉ thao tác với path đã chuẩn hóa hoặc được thay bằng S3-compatible storage.

## 14. Kết luận cuối

Đây là một project có nền tảng tốt và lượng chức năng đáng kể. Phần khó còn lại không phải là thêm vài màn CRUD giống nhau, mà là làm cho các luồng đã có **an toàn, nguyên tử, có thể retry và có thể kiểm chứng**. Nếu xử lý P0 trước, sau đó bổ sung test và tách business service, project có thể tiến từ một bản demo nhiều tính năng thành một hệ thống staging đáng tin cậy mà không cần viết lại toàn bộ.

Thứ tự nên bắt đầu ở vòng tiếp theo:

1. File-manager path safety + upload limits.
2. Chat XSS + RBAC đầy đủ.
3. Order/payment/coupon/point/stock redesign và test.
4. Secret rotation + production Docker.
5. Sau đó mới hoàn thiện các chức năng lặp/UI còn thiếu.

