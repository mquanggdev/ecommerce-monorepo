# 3B — Hoàn tất `domainPublic` + sửa Docker để không mất file

> ⚠️ Đọc `2-KE-HOACH-TONG-THE.md` trước. Tuân thủ mục 2 (Quy tắc thực thi) và mục 3 (Quy ước codebase).

| | |
|---|---|
| **Đợt** | 1 — Chặn |
| **Mức** | 🔴 Đang hỏng sẵn + nguy cơ mất toàn bộ file upload |
| **Nhánh** | `fix/3b-docker-domain-public` |
| **Ước tính** | 2–3 giờ |

---

## 1. MỤC TIÊU

Hai việc, gộp chung vì cùng đụng vào cấu hình môi trường:

1. **Hoàn tất việc chuyển `domainCDN` → `domainPublic`** đang làm dở. Hiện `views/admin/layouts/default.pug` đã bỏ khai báo `domainCDN` cho JavaScript, nhưng 2 file JS admin vẫn tham chiếu biến đó → **ảnh trong chat admin và bộ chọn file đang hỏng ngay lúc này**.
2. **Thêm Docker volume cho thư mục `media`.** Hiện file upload nằm trong container; mỗi lần `docker compose up --build` là mất sạch ảnh sản phẩm, avatar, ảnh đánh giá, file chat — trong khi record trong MongoDB vẫn còn, gây đầy ảnh 404.

---

## 2. ĐIỀU KIỆN TIÊN QUYẾT

🔴 **BẮT BUỘC: batch 2B và batch 3A phải xong và đã merge vào `main`.**

- **2B** — vì batch này sửa `docker-compose.yml`, file chỉ nằm trong git sau khi gộp monorepo.
- **3A** — vì cả 3A và 3B đều sửa `public/admin/assets/js/chat.js` và `public/client/assets/js/chat.js`. Làm song song sẽ xung đột.

```bash
cd "/d/Middle Nodejs/Node TH"
git checkout main && git pull

git ls-files | grep compose                                        # 2B: phải ra docker-compose.yml
grep -c "escapeHtml" project-ecommerce-t8-25/public/admin/assets/js/chat.js   # 3A: phải > 0

git checkout -b fix/3b-docker-domain-public
```

Nếu một trong hai không đạt → **dừng lại, báo cáo**, đừng làm tiếp.

---

## 3. PHẠM VI

### ✅ Được sửa

Đường dẫn tính từ **gốc monorepo** (`Node TH/`).

**Nhóm A — cấu hình (5 file)**
```
docker-compose.yml                              ← nay đã nằm trong repo (nhờ 2B)
project-ecommerce-t8-25/index.ts
project-ecommerce-t8-25/helpers/block.helper.ts
project-ecommerce-t8-25/.env.docker
file-manager/.env.docker
```

**Nhóm B — JavaScript trình duyệt (4 file)**
```
public/admin/assets/js/chat.js
public/admin/assets/js/main.js
public/client/assets/js/chat.js
public/client/assets/js/main.js
```

**Nhóm C — Pug (24 file)** — danh sách đầy đủ ở mục 4.2.

### ⛔ KHÔNG đụng

```
configs/variable.config.ts     ← đã sửa đúng rồi, giữ nguyên
.env                           ← file local, người dùng tự quản lý
mọi file controllers/*.ts      ← domainCDN dùng cho axios server→server, PHẢI giữ nguyên
sockets/chat.socket.ts         ← như trên
jobs/chat.job.ts               ← như trên
project-ecommerce-t8-25/dockerfile
file-manager/dockerfile        ← Dockerfile production làm ở batch 7C
```

---

## 4. HIỆN TRẠNG

### 4.1. Nguyên tắc phân biệt hai biến

Đây là điểm cốt lõi, phải hiểu đúng trước khi sửa:

| Biến | Giá trị trong Docker | Ai dùng | Ví dụ |
|---|---|---|---|
| `domainCDN` | `http://file-manager:4000` | **Server** gọi server, qua `axios` | `axios.post(\`${domainCDN}/file-manager/upload\`)` |
| `domainPublic` | `http://localhost:4000` | **Trình duyệt** tải ảnh | `<img src="${domainPublic}/media/...">` |

Bên trong mạng Docker, `file-manager` là hostname nội bộ — trình duyệt của người dùng **không phân giải được**. Ngược lại `localhost:4000` trong container `ecommerce` sẽ trỏ về chính nó, không phải file-manager.

👉 **Quy tắc:** hễ giá trị đó xuất hiện trong HTML gửi về trình duyệt → dùng `domainPublic`. Hễ dùng trong lời gọi `axios`/`fetch` phía server → giữ `domainCDN`.

### 4.2. Toàn bộ 48 vị trí cần đổi

**JavaScript (17 vị trí / 4 file)**

| File | Dòng |
|---|---|
| `public/admin/assets/js/chat.js` | 82, 83, 88 |
| `public/admin/assets/js/main.js` | 13, 589, 595, 1513 |
| `public/client/assets/js/chat.js` | 96, 97, 102 |
| `public/client/assets/js/main.js` | 214, 518, 552, 598, 1222, 1527, 2364 |

> Số dòng của `chat.js` **sẽ lệch** sau batch 3A (đã thêm hàm escape ở đầu file). Tìm theo chuỗi `domainCDN`, đừng tin số dòng.

**Pug — admin (14 vị trí / 11 file)**

| File | Dòng |
|---|---|
| `views/admin/layouts/default.pug` | 11 *(xem ghi chú YC-3)* |
| `views/admin/pages/account-admin-list.pug` | 46 |
| `views/admin/pages/account-user-list.pug` | 46 |
| `views/admin/pages/article-category.pug` | 53 |
| `views/admin/pages/chat-detail.pug` | 14 |
| `views/admin/pages/order-edit.pug` | 47 |
| `views/admin/pages/product-category.pug` | 46 |
| `views/admin/pages/product-edit.pug` | 122 |
| `views/admin/pages/product-list.pug` | 67 |
| `views/admin/pages/review-list.pug` | 32, 42, 52 |
| `views/admin/partials/chat-box-left.pug` | 12 |
| `views/admin/partials/topbar.pug` | 276, 283 |

> `views/admin/pages/article-list.pug` và `views/admin/pages/file-manager.pug` **đã đổi rồi** (nằm trong 6 file uncommit trên `main`). Kiểm tra lại, không đổi hai lần.

**Pug — client (13 vị trí / 11 file)**

| File | Dòng |
|---|---|
| `views/client/layouts/default.pug` | 5, 26 |
| `views/client/mixins/blog-item.pug` | 9 |
| `views/client/mixins/menu-category-item.pug` | 18 |
| `views/client/mixins/product-item-2.pug` | 8 |
| `views/client/mixins/product-list-item.pug` | 10 |
| `views/client/pages/dashboard-order-review.pug` | 78 |
| `views/client/partials/blog-details-left.pug` | 5 |
| `views/client/partials/dashboard-sidebar.pug` | 9 |
| `views/client/partials/shop-details-des-area.pug` | 44, 59 |
| `views/client/partials/shop-details-slider-area.pug` | 10, 19 |
| `views/client/partials/sticky-sidebar-blog.pug` | 17 |
| `views/client/partials/sticky-sidebar-shop.pug` | 69 |

### 4.3. 🔴 BẪY LỚN NHẤT — block trang chủ không dùng `app.locals`

`helpers/block.helper.ts` render block bằng `pug.renderFile()`, **không đi qua `app.locals`** mà truyền biến thủ công:

```ts
const html = pug.renderFile(blockPath, {
  categoryProductList: res.locals.categoryProductList,
  domainCDN: domainCDN,          // ← phải đổi thành domainPublic
  blockData: block.data,
  blockProductList: productList,
  blockTabList: tabList,
  blockBlogList: blogList
});
```

Và các block **có include mixin dùng `domainCDN`**:

```
views/client/blocks/banner_2.pug            → include ../mixins/menu-category-item.pug
views/client/blocks/blog_2.pug              → include ../mixins/blog-item.pug
views/client/blocks/flash_sell_2.pug        → include ../mixins/product-item-2.pug
views/client/blocks/trending_product_2.pug  → include ../mixins/product-item-2.pug
```

👉 Nếu đổi mixin sang `domainPublic` mà **quên đổi `block.helper.ts`**, Pug sẽ render `undefined` vào `src` → **toàn bộ ảnh trang chủ mất**, và **không có thông báo lỗi nào** (Pug im lặng với biến không tồn tại).

### 4.4. `docker-compose.yml` hiện tại

```yaml
services:
  ecommerce:
    build: ./project-ecommerce-t8-25
    ports:
      - "3000:3000"
    env_file:
      - ./project-ecommerce-t8-25/.env.docker
  file-manager:
    build: ./file-manager
    ports:
      - "4000:4000"
    env_file:
      - ./file-manager/.env.docker
```

Thiếu: `volumes`, `restart`, `depends_on`, `networks`.

### 4.5. Lưu ý về `file-manager/media/` — đang được git theo dõi

Đã kiểm tra: `git ls-files file-manager/media/` ra **7 file** (ảnh mẫu, ảnh trong `Folder 1`, ảnh review). Nghĩa là chúng được `COPY . .` vào Docker image.

Khi gắn volume vào `/app/media`, Docker xử lý như sau:

| Tình huống | Hành vi |
|---|---|
| Volume **rỗng** (lần đầu) | Docker **chép** nội dung có sẵn trong image vào volume → 7 file mẫu vẫn còn ✅ |
| Volume **đã có dữ liệu** | Docker **không** chép gì thêm; nội dung volume che hoàn toàn nội dung image |

👉 Hệ quả cần biết: sau lần `up` đầu tiên, mọi file mới upload nằm trong volume. Nếu ai đó chạy `docker compose down -v` (có cờ `-v`) thì **xoá volume** → mất file đã upload, và 7 file mẫu sẽ được chép lại từ image.

**Batch này KHÔNG đụng gì tới việc `media/` nằm trong git.** Việc dọn nó ra khỏi repo là quyết định riêng, để sau. Chỉ cần biết hành vi trên để hiểu đúng kết quả kiểm chứng KC-5.

---

## 5. YÊU CẦU

### YC-1. Đổi `block.helper.ts` — LÀM ĐẦU TIÊN

Trong `helpers/block.helper.ts`:

```ts
// import: đổi tên biến nhập vào
import { domainPublic } from "../configs/variable.config";
```

```ts
      const html = pug.renderFile(blockPath, {
        categoryProductList: res.locals.categoryProductList,
        domainPublic: domainPublic,        // đổi từ domainCDN
        blockData: block.data,
        ...
      });
```

Và trong `configs/variable.config.ts`, **thêm** export mới (giữ nguyên `domainCDN` đang có):

```ts
export const pathAdmin = "admin";
export const domainCDN = process.env.CDN_URL || "http://localhost:4000";
export const domainPublic = process.env.CDN_PUBLIC || domainCDN;   // ← THÊM DÒNG NÀY
```

> Đây là ngoại lệ duy nhất được phép đụng `configs/variable.config.ts`: **chỉ thêm 1 dòng**, không sửa dòng nào có sẵn.

Sau đó trong `index.ts` sửa lại cho dùng chung một nguồn:

```ts
import { domainCDN, domainPublic, pathAdmin } from "./configs/variable.config";
...
app.locals.pathAdmin = pathAdmin;
app.locals.domainPublic = domainPublic;
// ĐÃ XÓA app.locals.domainCDN — xem YC-2
```

### YC-2. Xóa `app.locals.domainCDN`

Xóa hẳn dòng `app.locals.domainCDN = domainCDN;` trong `index.ts`.

> **Lý do phải xóa chứ không chỉ để đó:** ở máy local, `CDN_URL` và `CDN_PUBLIC` đều là `http://localhost:4000` — **giống hệt nhau**. Nghĩa là nếu bỏ sót một chỗ chưa đổi, ở local nó vẫn chạy đúng và chỉ vỡ khi lên Docker/VPS. Xóa `app.locals.domainCDN` khiến mọi chỗ bỏ sót **lộ ra ngay lập tức** dưới dạng ảnh hỏng khi test local.

Nếu sau khi xóa mà `import { domainCDN }` trong `index.ts` không còn dùng đến thì bỏ khỏi câu import.

### YC-3. Đổi 24 file Pug

Thay `domainCDN` → `domainPublic` ở toàn bộ vị trí liệt kê ở mục 4.2.

Hai chỗ cần chú ý:

`views/admin/layouts/default.pug` — **hiện đang khai báo CẢ HAI biến** (trạng thái tạm để không làm hỏng JS admin). Sau khi đã đổi hết 4 file JS ở YC-4, **xoá dòng `domainCDN`**:

```pug
    script.
        const pathAdmin = "#{pathAdmin}";
        const domainPublic = "#{domainPublic}";
```

> Chỉ xoá dòng này **sau khi** YC-4 xong, nếu không admin JS sẽ hỏng giữa chừng.

`views/client/layouts/default.pug` dòng 5 — đổi khai báo cho JavaScript trình duyệt:
```pug
      const domainPublic = "#{domainPublic}";
```

`views/admin/partials/topbar.pug` dòng 276, 283 — giữ nguyên biểu thức điều kiện, chỉ đổi tên biến:
```pug
              src=`${accountAdmin.isSuperAdmin ? "" : domainPublic}${accountAdmin.avatar}`
```

### YC-4. Đổi 4 file JavaScript

Thay toàn bộ `domainCDN` → `domainPublic` trong:
```
public/admin/assets/js/chat.js
public/admin/assets/js/main.js
public/client/assets/js/chat.js
public/client/assets/js/main.js
```

Ở `public/admin/assets/js/main.js` dòng 13 lưu ý ngữ cảnh:
```js
          inputSource.value = domainPublic;
```
Đây là giá trị điền vào ô nhập của bộ chọn file — người dùng sẽ nhìn thấy, nên đúng là phải dùng `domainPublic`.

### YC-5. Sửa `docker-compose.yml`

Thay toàn bộ nội dung file `Node TH/docker-compose.yml` bằng:

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
      # QUAN TRỌNG: giữ file upload tồn tại qua các lần rebuild container
      - media-data:/app/media
    restart: unless-stopped
    networks:
      - app-net

volumes:
  media-data:

networks:
  app-net:
```

### YC-6. Kiểm tra biến môi trường Docker

Mở `project-ecommerce-t8-25/.env.docker`, xác nhận đúng hai dòng sau (sửa nếu lệch):

```
CDN_URL="http://file-manager:4000"
CDN_PUBLIC="http://localhost:4000"
```

Mở `file-manager/.env.docker`, xác nhận:

```
DOMAIN="http://localhost:3000/"
PORT=4000
```

**`NODE_ENV` giữ nguyên rỗng — KHÔNG đổi thành `production`.**

> Lý do: `NODE_ENV=production` bật `secure: true` cho cookie, mà cookie `secure` **không được gửi qua HTTP**. Đổi bây giờ sẽ làm **không đăng nhập được** khi test local qua `http://localhost:3000`. Việc này thuộc batch 7C (deploy production có HTTPS).
>
> Thêm comment vào `.env.docker` để không quên:
> ```
> NODE_ENV="" # rỗng = HTTP (local). Khi deploy có HTTPS thì đặt "production" — xem batch 7C
> ```

### YC-7. Trả lời dứt điểm câu hỏi Puppeteer *(chỉ kiểm chứng, KHÔNG sửa)*

Hai báo cáo đánh giá còn để ngỏ việc Puppeteer có chạy được trên `node:22-alpine` hay không. Batch này chỉ cần **trả lời**, không sửa.

```bash
docker compose up -d --build
docker compose exec ecommerce node -e "const p=require('puppeteer'); p.launch().then(async b=>{console.log('PUPPETEER OK'); await b.close();}).catch(e=>console.log('PUPPETEER LOI:', e.message))"
```

Ghi nguyên văn kết quả vào báo cáo. Nếu ra `PUPPETEER LOI` → chỉ ghi lại, **đừng sửa Dockerfile** (thuộc batch 7C).

---

## 6. CÁCH TỰ KIỂM CHỨNG

### KC-1. Không còn `domainCDN` ở tầng trình duyệt

```bash
cd "project-ecommerce-t8-25"
grep -rn "domainCDN" views/ public/
```

Kết quả mong đợi: **rỗng, không có dòng nào.**

### KC-2. `domainCDN` vẫn còn nguyên ở tầng server

```bash
grep -rln "domainCDN" controllers/ sockets/ jobs/ configs/
```

Kết quả mong đợi: phải thấy các file sau (nếu thiếu file nào nghĩa là bạn đã đổi nhầm):
```
controllers/admin/chat.controller.ts
controllers/admin/file-manager.controller.ts
controllers/client/chat.controller.ts
controllers/client/dashboard.controller.ts
sockets/chat.socket.ts
jobs/chat.job.ts
configs/variable.config.ts
```

### KC-3. TypeScript biên dịch được

```bash
cd "/d/Middle Nodejs/Node TH/project-ecommerce-t8-25"
npm run typecheck
```

Kết quả mong đợi: không in ra dòng nào.

### KC-4. Chạy local — ảnh phải hiện ở mọi trang

```bash
npm run dev
```

Mở và **nhìn bằng mắt**, xác nhận ảnh hiển thị (không phải icon ảnh vỡ):

| Trang | Kiểm tra gì |
|---|---|
| `http://localhost:3000/` | 🔴 **Ảnh trong các block trang chủ** — đây là chỗ dễ vỡ nhất (mục 4.3) |
| `http://localhost:3000/product/category` | Ảnh sản phẩm trong danh sách |
| `http://localhost:3000/product/detail/<slug>` | Slider ảnh + ảnh đánh giá |
| `http://localhost:3000/admin/product/list` | Ảnh thumbnail sản phẩm |
| `http://localhost:3000/admin/file-manager/iframe` | Ảnh trong quản lý file |
| `http://localhost:3000/admin/chat/detail/<id>` | Avatar + ảnh đính kèm trong chat |
| `http://localhost:3000/admin/review/list` | Avatar, ảnh SP, ảnh đánh giá |

Mở DevTools → Console, không được có lỗi `domainPublic is not defined` hay `domainCDN is not defined`.
Mở DevTools → Network, không được có request ảnh nào tới URL chứa chữ `undefined`.

### KC-5. 🔴 Volume Docker thật sự giữ được file

Đây là phần kiểm chứng quan trọng nhất của batch. Làm đúng từng bước:

```bash
cd "D:/Middle Nodejs/Node TH"
docker compose up -d --build
```

1. Mở `http://localhost:3000/admin/file-manager/iframe`, **upload một ảnh bất kỳ**.
2. Xác nhận file đã nằm trong volume:
   ```bash
   docker compose exec file-manager ls -la /app/media
   ```
   → phải thấy file vừa upload.
3. Hủy và dựng lại container:
   ```bash
   docker compose down
   docker compose up -d --build
   ```
4. Kiểm tra lại:
   ```bash
   docker compose exec file-manager ls -la /app/media
   ```

**Kết quả mong đợi: file vẫn còn.** Nếu mất → volume chưa gắn đúng, xem lại YC-5.

5. Mở lại trang quản lý file, xác nhận ảnh vẫn hiển thị được (không phải ảnh vỡ).

Dán output thật của cả hai lần `ls` vào báo cáo.

### KC-6. Hai service gọi được nhau trong Docker

```bash
docker compose exec ecommerce wget -qO- http://file-manager:4000/media/ 2>&1 | head -3
```
Ra bất kỳ phản hồi HTTP nào (kể cả 403/404) đều đạt — nghĩa là DNS nội bộ hoạt động. Nếu ra lỗi phân giải tên miền là hỏng.

### KC-7. CI xanh

```bash
cd "/d/Middle Nodejs/Node TH"
git push origin fix/3b-docker-domain-public
```

Tab **Actions** → cả 3 job ✅. Batch này sửa `docker-compose.yml` nên job `docker-build` đặc biệt quan trọng.

---

## 7. ĐỊNH NGHĨA HOÀN THÀNH

- [ ] Đã xác nhận 2B và 3A có trong `main`, đã tạo nhánh `fix/3b-docker-domain-public`
- [ ] `configs/variable.config.ts` **chỉ thêm** dòng `export const domainPublic`
- [ ] `helpers/block.helper.ts` truyền `domainPublic` vào `pug.renderFile` *(bẫy mục 4.3)*
- [ ] `app.locals.domainCDN` đã bị xóa khỏi `index.ts`
- [ ] 24 file Pug đã đổi
- [ ] 4 file JS đã đổi
- [ ] `docker-compose.yml` có `volumes`, `restart`, `depends_on`, `networks`
- [ ] `.env.docker` đúng `CDN_URL` / `CDN_PUBLIC`, `NODE_ENV` vẫn rỗng + đã thêm comment
- [ ] KC-1 ra **rỗng**; KC-2 ra **đủ 7 file**
- [ ] KC-4: ảnh hiện đủ ở cả 7 trang, đặc biệt **trang chủ**
- [ ] KC-5: file **còn nguyên** sau `docker compose down` + `up --build`, output đã dán vào báo cáo
- [ ] Dòng `domainCDN` trong `views/admin/layouts/default.pug` đã xoá, **sau khi** YC-4 xong
- [ ] Đã ghi kết quả kiểm chứng Puppeteer (YC-7), **không sửa Dockerfile**
- [ ] KC-7: đã push nhánh, **CI xanh**, **chưa merge**

---

## 8. BẪY CẦN TRÁNH

| Bẫy | Vì sao |
|---|---|
| **Quên `block.helper.ts`** | Ảnh trang chủ mất sạch mà không có lỗi nào. Đây là bẫy số 1 của batch này. |
| Dùng `sed -i` thay toàn bộ `domainCDN` trong cả project | Sẽ đổi nhầm cả controller/socket/job → server không gọi được file-manager trong Docker. Chỉ thay trong `views/` và `public/`. |
| Tin vào số dòng của `chat.js` | Batch 3A đã thêm code ở đầu file, số dòng đã lệch. Tìm theo chuỗi. |
| Đổi `NODE_ENV` thành `production` | Cookie `secure` không gửi qua HTTP → không đăng nhập được khi test local. |
| Sửa Dockerfile trong batch này | Thuộc batch 7C. YC-7 chỉ **kiểm chứng** Puppeteer, không sửa. |
| Xóa `domainCDN` khỏi `configs/variable.config.ts` | Server vẫn cần nó cho axios. Chỉ **thêm** `domainPublic`, không xóa gì. |
| Bỏ qua KC-5 vì "nhìn compose thấy đúng rồi" | Volume là lý do chính của batch này. Bắt buộc test down/up thật. |
| Đổi `article-list.pug` và `file-manager.pug` lần nữa | Hai file này đã đổi sẵn trong 6 file uncommit. Kiểm tra trước. |

---

## KẾT QUẢ THỰC THI

- **Nhánh:** `fix/3b-docker-domain-public`
- **Commit mã nguồn:** `e544dbe` — 33 file (4 JS, 24 Pug, `index.ts`, `configs/variable.config.ts`, `helpers/block.helper.ts`, `docker-compose.yml`)
- **Kết quả kiểm chứng:**
  - KC-1: `grep -rn "domainCDN" views/ public/` → rỗng.
  - KC-2: `domainCDN` còn đúng 7 file tầng server (4 controller, `sockets/chat.socket.ts`, `jobs/chat.job.ts`, `configs/variable.config.ts`).
  - KC-3: `npm run typecheck` sạch.
  - Bẫy mục 4.3: chạy `getBlockListByTemplate("/")` + `renderHTML` thật → 12 block, 19 URL `/media`, **0 URL chứa `undefined`**.
  - `docker compose config --quiet` hợp lệ; volume `media-data` gắn vào `/app/media`.
  - KC-5 (người dùng chạy tay): upload file → `docker compose down` → `docker compose up -d --build` → **file vẫn còn**.
  - `.env.docker`: `CDN_URL=http://file-manager:4000`, `CDN_PUBLIC=http://localhost:4000`, `NODE_ENV` giữ rỗng.
- **YC-7 — Puppeteer trong container: HỎNG.**
  `Failed to launch the browser process: spawn /root/.cache/puppeteer/chrome/linux-146.0.7680.153/chrome-linux64/chrome ENOENT`
  → `/order/export-pdf` không chạy được khi dùng Docker (chạy local vẫn bình thường). Không sửa ở batch này; chuyển sang batch 7C (cài Chromium của Alpine + `PUPPETEER_EXECUTABLE_PATH`).
- **Chưa kiểm chứng:** KC-4 (xem bằng mắt 7 trang trên trình duyệt) và KC-6 (DNS nội bộ giữa hai container) không có kết quả ghi lại.
- **Phát hiện thêm ngoài phạm vi:** không.
