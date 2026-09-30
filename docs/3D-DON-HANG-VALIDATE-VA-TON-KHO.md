# 3D — Toàn vẹn đơn hàng (1): validate item + trừ/hoàn tồn kho

> ⚠️ Đọc `2-KE-HOACH-TONG-THE.md` trước. Tuân thủ mục 2 (Quy tắc thực thi) và mục 3 (Quy ước codebase).

| | |
|---|---|
| **Đợt** | 1 — Chặn |
| **Mức** | 🔴 Bán vượt kho, đơn sai tiền |
| **Nhánh** | `fix/3d-don-hang-ton-kho` |
| **Ước tính** | 1 ngày |

---

## 1. MỤC TIÊU

Sau batch này: không thể đặt số lượng âm/0/thập phân; không thể đặt biến thể không tồn tại hoặc đã tắt; đặt hàng **trừ tồn kho một cách nguyên tử** nên hai người cùng mua món cuối cùng thì chỉ một người thành công; và đơn bị huỷ/trả thì kho được hoàn lại đúng một lần.

**Không** xử lý coupon, điểm, `total` ở batch này — đó là 3E.

---

## 2. ĐIỀU KIỆN TIÊN QUYẾT

🔴 Batch **3C đã merge** vào `main` (cả hai cùng sửa `order.controller.ts` và `order.model.ts`).

```bash
cd "/d/Middle Nodejs/Node TH"
git checkout main && git pull
grep -c "confirmOrderPaid" project-ecommerce-t8-25/helpers/point.helper.ts   # phải > 0
git checkout -b fix/3d-don-hang-ton-kho
```

---

## 3. PHẠM VI

Đường dẫn tính từ `project-ecommerce-t8-25/`.

### ✅ Được sửa

```
validates/client/order.validate.ts
controllers/client/order.controller.ts    ← CHỈ hàm createPost
controllers/admin/order.controller.ts     ← CHỈ hàm editPatch
models/order.model.ts                     ← chỉ THÊM trường
helpers/stock.helper.ts                   ← tạo mới
```

### ⛔ KHÔNG đụng

```
Các hàm payment*, success, exportPdf trong order.controller.ts
models/product.model.ts            ← không đổi schema variants
Khối coupon (dòng ~105–185) và khối điểm (dòng ~245–266) trong createPost   ← batch 3E
Khối gọi GoShip trong createPost   ← giữ nguyên logic, chỉ được bọc try/catch như YC-5
public/client/assets/js/main.js    ← không đổi định dạng dữ liệu client gửi lên
```

---

## 4. HIỆN TRẠNG

### 4.1. Validate chỉ kiểm "là mảng có ≥ 1 phần tử"

`validates/client/order.validate.ts`:

```ts
    items: Joi.array().min(1).required()
```

Từng phần tử không được kiểm. `quantity: -5`, `quantity: 0.5`, `quantity: 999999` đều lọt.

### 4.2. `createPost` — đoạn dựng `items` (dòng ~51–97)

```ts
  for (const item of req.body.items) {
    const productDetail = await Product.findOne({ _id: item.productId, deleted: false, status: "active" });

    if(productDetail) {
      let price = 0;
      const variant = [];

      if(item.variant) {
        const variantMatched = productDetail.variants.find(variantItem => {
          return (
            variantItem.attributeValue.every((attr: any) => {
              const selected = item.variant.find((v: any) => v.attrId === attr.attrId);
              return selected && selected.value === attr.value;
            })
          );
        });
        price = variantMatched.priceNew || 0;      // ← crash nếu không khớp biến thể nào
        ...
```

Các lỗi:
- `variantMatched` có thể `undefined` → `TypeError` → 500.
- Không kiểm `variantItem.status` → biến thể đã tắt vẫn mua được.
- Sản phẩm không tồn tại bị **lặng lẽ bỏ qua**; nếu tất cả đều bị bỏ qua, đơn vẫn được tạo với `items: []`.
- `item.productId` không phải ObjectId hợp lệ → `CastError` → 500.
- **Không có chỗ nào trừ tồn kho.**

### 4.3. Cấu trúc tồn kho thực tế

`Product` có **hai tầng** tồn kho:

```ts
stock: Number,          // tồn kho của sản phẩm không có biến thể
variants: Array         // mỗi phần tử: { status, attributeValue: [{attrId, attrType, label, value}], priceOld, priceNew, stock }
```

`variants` là `Array` không có schema con và **biến thể không có `_id`**. Client gửi lên `item.variant = [{ attrId, value, label }, ...]`.

### 4.4. Admin đổi trạng thái đơn — `controllers/admin/order.controller.ts` `editPatch`

Hiện chỉ gán `orderStatus`, `paymentStatus`, `note` rồi `save()`. Không kiểm giá trị có thuộc enum không, không hoàn kho.

---

## 5. QUY TẮC NGHIỆP VỤ ĐÃ CHỐT

CODEX không tự quyết các điểm này:

1. **Sản phẩm có biến thể** (khách gửi `item.variant` không rỗng): trừ `variants[i].stock`. **Không** đụng `product.stock`.
2. **Sản phẩm không có biến thể**: trừ `product.stock`.
3. Sản phẩm **có** `variants.length > 0` nhưng khách **không** gửi `variant` → từ chối item đó (lỗi "Vui lòng chọn phân loại").
4. Bất kỳ item nào không hợp lệ (sản phẩm không tồn tại, biến thể không khớp/đã tắt, hết hàng) → **từ chối cả đơn** với thông báo nêu tên sản phẩm. Không lặng lẽ bỏ qua.
5. Kho được hoàn khi `orderStatus` chuyển sang `cancelled` hoặc `returned`. Hoàn **đúng một lần** cho mỗi đơn.
6. Giới hạn: tối đa 50 dòng item mỗi đơn, `quantity` từ 1 đến 100.

---

## 6. YÊU CẦU

### YC-1. Validate sâu từng item — `validates/client/order.validate.ts`

Thay định nghĩa `items`:

```ts
    items: Joi.array()
      .min(1)
      .max(50)
      .items(
        Joi.object({
          productId: Joi.string().hex().length(24).required(),
          quantity: Joi.number().integer().min(1).max(100).required(),
          variant: Joi.array().items(
            Joi.object({
              attrId: Joi.string().required(),
              value: Joi.string().required(),
              label: Joi.string().allow("")
            }).unknown(true)
          ).optional()
        }).unknown(true)   // client còn gửi kèm các trường hiển thị khác
      )
      .required()
      .messages({
        "array.min": "Giỏ hàng không được để trống!",
        "array.max": "Đơn hàng có quá nhiều sản phẩm!",
        "any.required": "Vui lòng chọn sản phẩm!",
        "number.base": "Số lượng không hợp lệ!",
        "number.integer": "Số lượng phải là số nguyên!",
        "number.min": "Số lượng phải từ 1 trở lên!",
        "number.max": "Số lượng mỗi sản phẩm tối đa là 100!",
        "string.hex": "Sản phẩm không hợp lệ!",
        "string.length": "Sản phẩm không hợp lệ!",
      }),
```

Trước khi chốt schema, **đọc `public/client/assets/js/main.js`** chỗ gửi `/order/create` để xác nhận đúng tên trường client gửi (`productId`, `quantity`, `variant`). Nếu lệch với mô tả ở đây → dừng, báo cáo.

### YC-2. Thêm trường vào `models/order.model.ts`

Trong `items[]`, thêm (giữ nguyên `variant: [String]` đang dùng để hiển thị):

```ts
        variantValue: Array, // Dữ liệu gốc của biến thể [{attrId, value}] — dùng để hoàn kho
```

Ở cấp đơn hàng, thêm:

```ts
    stockRestoredAt: Date, // Thời điểm đã hoàn kho (chặn hoàn lặp)
```

### YC-3. Tạo `helpers/stock.helper.ts`

Ba hàm. Toàn bộ thao tác kho của hệ thống đi qua file này.

```ts
// Tìm vị trí biến thể khớp với lựa chọn của khách. Trả -1 nếu không khớp hoặc biến thể đã tắt.
export const findVariantIndex = (variants: any[], selected: { attrId: string, value: string }[]): number

// Trừ kho nguyên tử. Trả true nếu trừ được, false nếu không đủ hàng.
export const decreaseStock = async (productId: string, quantity: number, variantIndex: number): Promise<boolean>

// Cộng lại kho.
export const increaseStock = async (productId: string, quantity: number, variantValue?: any[]): Promise<void>
```

**`findVariantIndex`**: khớp khi số thuộc tính bằng nhau **và** mọi `attributeValue` của biến thể đều có lựa chọn cùng `attrId` + `value`, **và** `variant.status` là truthy.

**`decreaseStock`** — bắt buộc là **một** lệnh update có điều kiện, không `find` rồi `save`:

```ts
  if (variantIndex >= 0) {
    const field = `variants.${variantIndex}.stock`;
    const result = await Product.updateOne(
      { _id: productId, deleted: false, status: "active", [field]: { $gte: quantity } },
      { $inc: { [field]: -quantity } }
    );
    return result.modifiedCount === 1;
  }
  const result = await Product.updateOne(
    { _id: productId, deleted: false, status: "active", stock: { $gte: quantity } },
    { $inc: { stock: -quantity } }
  );
  return result.modifiedCount === 1;
```

**`increaseStock`**: nếu có `variantValue` → đọc sản phẩm, tìm lại index bằng cùng phép so khớp (bỏ qua điều kiện `status`, vì biến thể có thể đã bị tắt sau khi bán), rồi `$inc` dương. Không tìm thấy biến thể (admin đã xoá) → `console.log` cảnh báo và bỏ qua, không ném lỗi. Không có `variantValue` → `$inc` `stock`.

### YC-4. Viết lại đoạn dựng `items` trong `createPost`

Thay vòng lặp ở dòng ~51–97. Với mỗi item:

1. Tìm sản phẩm `{ _id, deleted: false, status: "active" }`. Không thấy → trả lỗi `"Sản phẩm không còn tồn tại hoặc đã ngừng bán!"`, `return`.
2. Xác định biến thể theo quy tắc mục 5 (điểm 1–3). Không khớp → `"Phân loại của sản phẩm <tên> không hợp lệ!"`.
3. Giá lấy từ `variants[i].priceNew` hoặc `product.priceNew` — **luôn từ DB**, không bao giờ từ request.
4. Ghi nhớ `variantIndex` cho bước trừ kho. Lưu `variantValue: item.variant.map(v => ({ attrId: v.attrId, value: v.value }))` vào item của đơn.

Ở bước này **chưa trừ kho**. Chỉ dựng và kiểm tra.

### YC-5. Trừ kho đúng thời điểm, có hoàn lại khi lỗi

Thứ tự trong `createPost` sau batch này:

```
1. Dựng + kiểm items (YC-4)                 — chưa ghi gì vào DB
2. Khối coupon                              — GIỮ NGUYÊN, không sửa
3. TRỪ KHO tất cả item (mới)
4. Khối GoShip                              — giữ nguyên logic
5. Khối điểm + total                        — GIỮ NGUYÊN
6. newRecord.save()
```

**Bước 3:** duyệt lần lượt, gọi `decreaseStock`. Giữ một mảng `decreased` các item đã trừ thành công. Item nào trả `false` → hoàn lại toàn bộ `decreased` bằng `increaseStock`, trả lỗi `"Sản phẩm <tên> không đủ số lượng trong kho!"`, `return`.

**Bước 4–6:** bọc trong `try/catch`. Nếu bất kỳ lỗi nào xảy ra sau khi đã trừ kho (GoShip lỗi, save lỗi) → hoàn lại toàn bộ `decreased`, trả `{ code: "error", message: "Không thể tạo đơn hàng, vui lòng thử lại!" }`.

> Khối coupon (bước 2) hiện tăng `usedCount` trước cả bước trừ kho, nên nếu trừ kho thất bại thì mã vẫn bị tiêu oan. **Đây là lỗi đã biết, thuộc batch 3E.** Không sửa ở đây — chỉ ghi chú `// TODO 3E` tại chỗ đó.

### YC-6. Admin đổi trạng thái — `editPatch`

1. Kiểm `orderStatus` thuộc `["pending","confirmed","shipping","completed","cancelled","returned"]` và `paymentStatus` thuộc `["unpaid","paid","refunded"]`. Sai → `{ code: "error", message: "Trạng thái không hợp lệ!" }`.
2. Giữ nguyên hai luật chặn đang có (không lùi khỏi `completed`, không `paid → unpaid`).
3. Thêm luật: đơn đang `cancelled` hoặc `returned` **không được** chuyển sang trạng thái khác (kho đã hoàn rồi).
4. Khi trạng thái **mới** là `cancelled` hoặc `returned` và trạng thái **cũ** không phải hai giá trị đó → hoàn kho, chặn lặp bằng conditional update:

```ts
const claimed = await Order.findOneAndUpdate(
  { _id: id, stockRestoredAt: { $exists: false } },
  { stockRestoredAt: new Date() }
);
if (claimed) {
  for (const item of claimed.items) {
    await increaseStock(item.productId, item.quantity, item.variantValue);
  }
}
```

Đơn cũ tạo trước batch này không có `variantValue` → `increaseStock` sẽ cộng vào `product.stock`. Chấp nhận được; ghi chú điều này trong báo cáo.

---

## 7. CÁCH TỰ KIỂM CHỨNG

### KC-1. Typecheck

```bash
cd "/d/Middle Nodejs/Node TH/project-ecommerce-t8-25" && npm run typecheck
```

### KC-2. Validate — gọi API thật

`npm run dev` (kiểm cổng 3000 không bị tiến trình cũ chiếm trước). Đăng nhập một tài khoản khách thử để có cookie, rồi `POST /order/create` với từng payload, các trường khác hợp lệ:

| `items` | Mong đợi |
|---|---|
| `[]` | lỗi "Giỏ hàng không được để trống!" |
| `quantity: 0` | lỗi số lượng |
| `quantity: -3` | lỗi số lượng |
| `quantity: 1.5` | lỗi số nguyên |
| `quantity: 101` | lỗi tối đa |
| `productId: "abc"` | lỗi "Sản phẩm không hợp lệ!" — **không phải 500** |
| `productId` hợp lệ dạng nhưng không tồn tại | lỗi "không còn tồn tại" |
| sản phẩm có biến thể, `variant` sai giá trị | lỗi phân loại — **không phải 500** |

Cả 8 phải trả JSON `code: "error"`, không cái nào là HTTP 500, không cái nào tạo ra đơn.

### KC-3. Trừ kho nguyên tử — script

Script tạm (xoá sau khi chạy, không commit), dùng `try/finally` để luôn dọn:

1. Tạo sản phẩm thử không biến thể, `stock: 3`.
2. Gọi `decreaseStock(id, 1, -1)` **10 lần song song** (`Promise.all`).
3. In số lần `true` và `stock` cuối.
4. Tạo sản phẩm thử có 2 biến thể, biến thể thứ hai `stock: 2`. Gọi `decreaseStock(id, 1, 1)` 5 lần song song. In kết quả và `stock` của **cả hai** biến thể.
5. Gọi `increaseStock` cho biến thể thứ hai, in lại.
6. Xoá cả hai sản phẩm thử.

Mong đợi: bước 3 → đúng **3** `true`, `stock = 0` (không âm). Bước 4 → đúng **2** `true`, biến thể thứ nhất **không đổi**. Bước 5 → biến thể thứ hai tăng đúng 1.

### KC-4. Hoàn kho không lặp

Trong cùng script hoặc script khác: tạo đơn thử chứa 1 item của sản phẩm thử, gọi logic hoàn kho của YC-6 **3 lần song song**. Mong đợi: kho chỉ tăng **một lần**.

### KC-5. Đặt hàng thật một lần

Đặt một đơn COD qua giao diện với sản phẩm còn hàng. Xác nhận: đơn tạo được, `stock` giảm đúng số lượng, `items[].variantValue` có dữ liệu nếu là sản phẩm có biến thể. Sau đó vào admin chuyển đơn sang `cancelled` → `stock` trở về giá trị ban đầu.

> Bước này gọi GoShip sandbox. Nếu GoShip lỗi, xác nhận luôn là kho **được hoàn lại** (YC-5) — đó cũng là một kết quả kiểm chứng hợp lệ, ghi vào báo cáo.

### KC-6. CI

```bash
git push origin fix/3d-don-hang-ton-kho
```

---

## 8. ĐỊNH NGHĨA HOÀN THÀNH

- [ ] Joi validate từng item: `productId` hex 24, `quantity` nguyên 1–100, tối đa 50 item
- [ ] `helpers/stock.helper.ts` có đủ 3 hàm; `decreaseStock` là một lệnh update có điều kiện
- [ ] `createPost`: item không hợp lệ → từ chối cả đơn, không bỏ qua lặng lẽ
- [ ] `createPost`: không còn đường nào dẫn tới `TypeError` ở `variantMatched`
- [ ] Trừ kho sau coupon, trước GoShip; lỗi ở bất kỳ bước sau nào đều hoàn kho
- [ ] `items[].variantValue` và `stockRestoredAt` có trong model
- [ ] `editPatch` kiểm enum, chặn rời khỏi `cancelled`/`returned`, hoàn kho đúng một lần
- [ ] Khối coupon và khối điểm **không bị sửa** (chỉ thêm comment `// TODO 3E`)
- [ ] Các hàm `payment*`, `success`, `exportPdf` **không bị sửa**
- [ ] KC-2 → KC-5 đạt, output thật đã dán; dữ liệu thử đã xoá; script tạm không commit
- [ ] CI xanh, đã mở PR, **chưa merge**

---

## 9. BẪY CẦN TRÁNH

| Bẫy | Vì sao |
|---|---|
| `findOne` → kiểm `stock >= qty` → `save()` | Race condition: hai request cùng đọc `stock = 1`, cả hai cùng bán. Phải là `updateOne` có điều kiện `$gte`. |
| Trừ cả `product.stock` lẫn `variants[i].stock` | Quy tắc đã chốt: có biến thể thì chỉ trừ biến thể. |
| Thêm `_id` cho biến thể / đổi schema `variants` | Ngoài phạm vi, cần migrate dữ liệu. Dùng index + so khớp `attributeValue`. |
| Dùng MongoDB transaction (`session.startTransaction`) | Không cần cho batch này và làm tăng phạm vi. Conditional update + hoàn lại thủ công là đủ. |
| Sửa luôn coupon/điểm vì "đang ở đó" | Là batch 3E. Hai batch sẽ giẫm lên nhau. |
| Trừ kho trước khi kiểm hết item | Phải kiểm toàn bộ item (YC-4) xong mới bắt đầu trừ, để giảm số lần phải hoàn. |
| Quên hoàn kho khi GoShip ném lỗi | `createPost` hiện không có `try/catch` quanh lời gọi GoShip. |
| Đổi tên trường client gửi lên | Không sửa `main.js` phía client. Server thích nghi theo client. |
| Tạo đơn thử qua GoShip nhiều lần | Mỗi lần tạo một vận đơn sandbox. KC-5 chỉ cần một lần. |

---

## KẾT QUẢ THỰC THI

- **Người thực thi:** Claude (theo yêu cầu của người dùng, thay cho CODEX)
- **Nhánh:** `fix/3d-don-hang-ton-kho` — **xếp chồng lên** `fix/3c-idempotent-thanh-toan` (3C chưa merge lúc làm). Merge 3C trước, rồi mới merge 3D.
- **File đã sửa:** `validates/client/order.validate.ts`, `controllers/client/order.controller.ts` (chỉ `createPost` + import), `controllers/admin/order.controller.ts` (chỉ `editPatch` + import), `models/order.model.ts`, `helpers/stock.helper.ts` (mới).
- **Cách kiểm chứng:** script tạm gọi trực tiếp validate/controller/helper thật với `req`/`res` giả, trên 1 user thử + 2 sản phẩm thử trong Atlas. Script đã xoá, không commit.
- **Kết quả (output thật):**

```
KC-2 []              : Giỏ hàng không được để trống!
KC-2 quantity 0      : Số lượng phải từ 1 trở lên!
KC-2 quantity -3     : Số lượng phải từ 1 trở lên!
KC-2 quantity 1.5    : Số lượng phải là số nguyên!
KC-2 quantity 101    : Số lượng mỗi sản phẩm tối đa là 100!
KC-2 productId abc   : Sản phẩm không hợp lệ!
KC-2 hop le          : QUA VALIDATE
TAO khong ton tai    : Sản phẩm không còn tồn tại hoặc đã ngừng bán!
TAO thieu phan loai  : Vui lòng chọn phân loại cho sản phẩm KC3D-TEST bien the!
TAO phan loai sai    : Phân loại của sản phẩm KC3D-TEST bien the không hợp lệ!
TAO phan loai da tat : Phân loại của sản phẩm KC3D-TEST bien the không hợp lệ!
TAO het hang (2 item): Sản phẩm KC3D-TEST bien the không đủ số lượng trong kho!
   -> kho sau khi bi tu choi: 3 | product=99 S=7 M=2 (phai la 3 | S=7 M=2)
   -> so don duoc tao: 0
TAO loi van chuyen   : Không thể tạo đơn hàng, vui lòng thử lại! | kho: 3 (phai la 3) | don: 0
KC-3 san pham don, 10 lan song song, kho 3: 3 lan true | kho: 0
KC-3 bien the M, 5 lan song song, kho 2   : 2 lan true | product=99 S=7 M=0
KC-3 increaseStock bien the M +1          : product=99 S=7 M=1
KC-5 tao don         : success Đặt hàng thành công!
KC-5 don: items = KC3D-TEST don x2 @10000 variantValue=[] ; KC3D-TEST bien the x1 @30000 variantValue=[{"attrId":"aaaaaaaaaaaaaaaaaaaaaaaa","value":"m"}]
KC-5 subTotal = 50000 (phai la 2*10000 + 1*30000 = 50000)
KC-5 kho sau dat     : 1 | product=99 S=7 M=1 (phai la 1 | S=7 M=1)
ADMIN trang thai la  : Trạng thái không hợp lệ!
ADMIN huy x3 song song: ["Cập nhật đơn hàng thành công!","Cập nhật đơn hàng thành công!","Cập nhật đơn hàng thành công!"]
KC-4 kho sau khi huy : 3 | product=99 S=7 M=2 (phai la 3 | S=7 M=2)
ADMIN mo lai don huy : Không thể thay đổi trạng thái đơn hàng đã hủy hoặc đã trả!
DON DEP: ban ghi thu con lai = 0
```

- `npm run typecheck` sạch.
- **Tác dụng phụ của việc kiểm chứng:** script chạy 2 lần, mỗi lần tạo một đơn COD thật qua GoShip **sandbox** → có 2 vận đơn thử nằm lại trên tài khoản GoShip sandbox. Bản ghi trong MongoDB đã xoá hết.
- **Chưa kiểm chứng:** chưa đặt hàng qua giao diện trình duyệt thật (form checkout → `/order/create`); dạng dữ liệu client gửi được suy ra từ `public/client/assets/js/main.js` (`productId`, `quantity`, `variant[{attrId, value, label}]`, kèm `checked`).
- **Khác với brief:**
  - `value` của biến thể chấp nhận cả chuỗi lẫn số (brief ghi chỉ chuỗi).
  - Lỗi sau khi trừ kho chỉ ghi `error.message` ra log thay vì nguyên object — object lỗi của axios chứa cả API key OpenMap trong URL.
- **Phát hiện thêm ngoài phạm vi (dành cho 3E):**
  - Lệnh cập nhật `usedPoint` của khách nằm **sau** `newRecord.save()` và trong cùng `try`: nếu lệnh đó lỗi thì kho bị hoàn trong khi đơn đã lưu.
  - Luật có sẵn "không đổi trạng thái đơn đã `completed`" chặn luôn `completed → returned`, nên hiện không có đường nào để trả hàng một đơn đã giao xong.
  - Đơn tạo trước batch này không có `variantValue` → khi huỷ, kho được cộng vào `product.stock` thay vì biến thể.
  - Coupon vẫn bị tăng `usedCount` trước khi trừ kho (đã đánh dấu `// TODO 3E`).
