# 3C — Callback thanh toán idempotent + kiểm tra đủ kết quả giao dịch

> ⚠️ Đọc `2-KE-HOACH-TONG-THE.md` trước. Tuân thủ mục 2 (Quy tắc thực thi) và mục 3 (Quy ước codebase).

| | |
|---|---|
| **Đợt** | 1 — Chặn |
| **Mức** | 🔴 Sai tiền / sai điểm |
| **Nhánh** | `fix/3c-idempotent-thanh-toan` |
| **Ước tính** | 4–5 giờ |

---

## 1. MỤC TIÊU

Sau batch này: một đơn hàng chỉ chuyển `unpaid → paid` **đúng một lần**, điểm thưởng chỉ cộng **đúng một lần** dù callback đến bao nhiêu lần, và một giao dịch **thất bại hoặc sai số tiền** không bao giờ được đánh dấu là đã thanh toán.

---

## 2. ĐIỀU KIỆN TIÊN QUYẾT

Batch 3A và 3B đã merge vào `main`.

```bash
cd "/d/Middle Nodejs/Node TH"
git checkout main && git pull
grep -c "domainPublic" project-ecommerce-t8-25/helpers/block.helper.ts   # phải > 0
git checkout -b fix/3c-idempotent-thanh-toan
```

---

## 3. PHẠM VI

Đường dẫn tính từ `project-ecommerce-t8-25/`.

### ✅ Được sửa

```
controllers/client/order.controller.ts   ← CHỈ 4 hàm: paymentZaloPay, paymentZalopayResult,
                                            paymentVNPay, paymentVNPayResult
helpers/point.helper.ts
models/order.model.ts
views/client/pages/order-payment-failed.pug   ← tạo mới
```

### ⛔ KHÔNG đụng

```
hàm createPost, success, exportPdf trong order.controller.ts   ← batch 3D, 3E, 4D
controllers/admin/order.controller.ts                          ← batch 3D
validates/client/order.validate.ts                             ← batch 3D
routes/client/order.route.ts                                   ← không đổi route nào
```

Batch 3D sẽ sửa `createPost` trong cùng file. Nếu bạn đụng vào `createPost` ở đây, hai batch sẽ xung đột.

---

## 4. HIỆN TRẠNG

### 4.1. Cộng điểm không có gì chặn — `helpers/point.helper.ts`

```ts
export const addPointAfterPayment = async (orderCode: string) => {
  const order: any = await Order.findOne({ code: orderCode, deleted: false });
  if(order && order.userId) {
    const pointEarned = Math.floor(order.total / pointConfig.MONEY_PER_POINT);
    if (pointEarned > 0) {
      await AccountUser.updateOne({ ... }, { $inc: { totalPoint: pointEarned } });
    }
  }
}
```

Gọi N lần → cộng N lần.

### 4.2. VNPay — `paymentVNPayResult` (khoảng dòng 473–513)

```ts
  if(secureHash === signed){
    const [ phone, orderCode ] = (vnp_Params['vnp_TxnRef'] as string).split('-');
    await Order.findOneAndUpdate({ phone, code: orderCode, deleted: false }, { paymentStatus: 'paid' })
    await addPointAfterPayment(orderCode);
    ...
    res.redirect(`${settingGeneral.domainWebsite}/order/success?orderCode=${orderCode}&phone=${phone}`);
  } else{
    res.render('success', {code: '97'})      // ← view 'success' KHÔNG TỒN TẠI
  }
```

Ba lỗi:

1. Đây là route **GET** (URL trả về trên trình duyệt khách). Khách bấm F5 → chạy lại toàn bộ → **cộng điểm lần nữa**.
2. Chỉ kiểm chữ ký. Không kiểm `vnp_ResponseCode`, `vnp_TransactionStatus`, `vnp_Amount`. VNPay ký cả response của giao dịch **thất bại / bị huỷ** → hiện tại vẫn đánh dấu `paid`.
3. Nhánh `else` render view không tồn tại → lỗi 500.

### 4.3. ZaloPay — `paymentZalopayResult` (khoảng dòng 357–407)

```ts
      const [phone, orderCode] = dataJson.app_user.split("-");
      await Order.updateOne({ phone, code: orderCode, deleted: false }, { paymentStatus: "paid" });
      await addPointAfterPayment(orderCode);
```

ZaloPay gọi lại callback tối đa 3 lần khi không nhận được phản hồi → cộng điểm tối đa 3 lần. Không kiểm `amount`.

### 4.4. Model `Order` không lưu gì về giao dịch

Không có `paidAt`, không có mã giao dịch của cổng thanh toán, không có cờ đã cộng điểm.

---

## 5. YÊU CẦU

### YC-1. Thêm trường vào `models/order.model.ts`

Thêm vào schema, **không sửa/xoá trường nào có sẵn**:

```ts
    paidAt: Date, // Thời điểm xác nhận thanh toán
    pointsAwardedAt: Date, // Thời điểm đã cộng điểm thưởng (dùng để chặn cộng lặp)
    payment: { // Thông tin giao dịch từ cổng thanh toán
      provider: String, // "vnpay" | "zalopay"
      transactionId: String, // Mã giao dịch phía cổng thanh toán
      responseCode: String, // Mã kết quả cổng trả về
      amount: Number, // Số tiền cổng xác nhận
      confirmedAt: Date
    },
```

### YC-2. Tạo hàm xác nhận thanh toán dùng chung — `helpers/point.helper.ts`

Thêm hàm mới `confirmOrderPaid` và **viết lại** `addPointAfterPayment` cho idempotent. Cả hai nằm trong `helpers/point.helper.ts`.

```ts
// Chuyển đơn từ unpaid sang paid ĐÚNG MỘT LẦN.
// Trả về true nếu lần gọi này thực sự đổi trạng thái, false nếu đơn đã paid từ trước hoặc không tồn tại.
export const confirmOrderPaid = async (
  orderCode: string,
  phone: string,
  payment: { provider: string, transactionId: string, responseCode: string, amount: number }
): Promise<boolean> => {
  const result = await Order.updateOne(
    {
      code: orderCode,
      phone: phone,
      deleted: false,
      paymentStatus: "unpaid" // điều kiện then chốt: chỉ khớp khi CHƯA thanh toán
    },
    {
      paymentStatus: "paid",
      paidAt: new Date(),
      payment: { ...payment, confirmedAt: new Date() }
    }
  );
  return result.modifiedCount === 1;
}
```

`addPointAfterPayment` phải tự chặn lặp bằng conditional update trên `pointsAwardedAt`:

```ts
export const addPointAfterPayment = async (orderCode: string) => {
  // "Giành quyền" cộng điểm: chỉ một lời gọi đặt được pointsAwardedAt
  const order: any = await Order.findOneAndUpdate(
    {
      code: orderCode,
      deleted: false,
      paymentStatus: "paid",
      pointsAwardedAt: { $exists: false }
    },
    { pointsAwardedAt: new Date() }
  );
  if(!order || !order.userId) return;

  const pointEarned = Math.floor(order.total / pointConfig.MONEY_PER_POINT);
  if (pointEarned > 0) {
    await AccountUser.updateOne(
      { _id: order.userId, deleted: false, status: "active" },
      { $inc: { totalPoint: pointEarned } }
    );
  }
}
```

> Hai lớp chặn độc lập (`paymentStatus: "unpaid"` và `pointsAwardedAt`) là cố ý. Không gộp lại.

### YC-3. Sửa `paymentVNPayResult`

Thứ tự kiểm tra bắt buộc:

1. Chữ ký sai → render trang thất bại (YC-5), **không** đụng DB.
2. Tách `phone`, `orderCode` từ `vnp_TxnRef`. Tìm đơn `{ code, phone, deleted: false }`. Không thấy → trang thất bại.
3. `vnp_ResponseCode !== "00"` **hoặc** `vnp_TransactionStatus !== "00"` → trang thất bại, không đổi trạng thái.
4. `Number(vnp_Params['vnp_Amount']) !== Math.round(order.total * 100)` → trang thất bại.
5. Đạt cả 4 → gọi `confirmOrderPaid(...)` với `provider: "vnpay"`, `transactionId: vnp_TransactionNo`, `responseCode: vnp_ResponseCode`, `amount: vnp_Amount / 100`.
6. **Chỉ khi `confirmOrderPaid` trả `true`** mới gọi `addPointAfterPayment(orderCode)`.
7. Dù `true` hay `false` (đơn đã paid từ trước — tức là khách F5) đều redirect về trang `/order/success` như cũ. F5 là hành vi bình thường, không phải lỗi.

Lưu ý: sau khi `sortObject`, giá trị trong `vnp_Params` đã bị `encodeURIComponent`. Đọc `vnp_ResponseCode`, `vnp_TransactionStatus`, `vnp_Amount`, `vnp_TransactionNo`, `vnp_TxnRef` từ **`req.query` gốc**, lấy ra **trước** khi gọi `sortObject`.

Đổi 2 chỗ `new Buffer(signData, 'utf-8')` trong hai hàm VNPay thành `Buffer.from(signData, 'utf-8')`.

### YC-4. Sửa `paymentZalopayResult`

Sau khi MAC khớp và `JSON.parse(dataStr)`:

1. Tách `phone`, `orderCode` từ `dataJson.app_user`. Tìm đơn. Không thấy → `return_code = -1`, `return_message = "order not found"`.
2. `Number(dataJson.amount) !== order.total` → `return_code = -1`, `return_message = "amount mismatch"`.
3. Gọi `confirmOrderPaid(...)` với `provider: "zalopay"`, `transactionId: String(dataJson.zp_trans_id)`, `responseCode: "1"`, `amount: dataJson.amount`.
4. Chỉ khi trả `true` mới `addPointAfterPayment`.
5. Trả `return_code = 1` cho **cả hai** trường hợp `true` và `false` — callback lặp phải được trả lời "success" để ZaloPay ngừng gọi lại.

Giữ nguyên nhánh MAC sai và nhánh `catch`.

### YC-5. Trang thanh toán thất bại

Tạo `views/client/pages/order-payment-failed.pug`, extends cùng layout và dùng cùng cấu trúc với `views/client/pages/order-success.pug` (đọc file đó làm mẫu). Nội dung: tiêu đề "Thanh toán không thành công", một dòng lý do (`message`), mã đơn nếu có, và link quay về `/dashboard/order/list`.

Trong controller, thay `res.render('success', {code: '97'})` và mọi nhánh thất bại của VNPay bằng:

```ts
res.render("client/pages/order-payment-failed", {
  pageTitle: "Thanh toán không thành công",
  message: "<lý do bằng tiếng Việt>",
  orderCode: orderCode   // nếu đã biết
});
```

Không hiển thị mã lỗi thô của cổng thanh toán cho khách.

### YC-6. Không tạo link thanh toán cho đơn đã thanh toán

Đầu `paymentZaloPay` và `paymentVNPay`, sau khi tìm thấy `orderDetail`: nếu `orderDetail.paymentStatus === "paid"` → redirect thẳng về `/order/success?orderCode=...&phone=...`, không gọi cổng thanh toán.

---

## 6. CÁCH TỰ KIỂM CHỨNG

### KC-1. Typecheck

```bash
cd "/d/Middle Nodejs/Node TH/project-ecommerce-t8-25" && npm run typecheck
```

### KC-2. Idempotent — kiểm bằng script, không cần cổng thanh toán thật

Viết một script tạm (đặt trong thư mục project để resolve được `node_modules`, **xoá sau khi chạy, không commit**) làm đúng các bước:

1. Kết nối DB, tạo một `AccountUser` thử và một `Order` thử: `paymentStatus: "unpaid"`, `total: 250000`, `userId` trỏ tới user thử, `code` và `phone` riêng biệt dễ nhận.
2. Gọi `confirmOrderPaid` **5 lần song song** bằng `Promise.all`. In ra mảng kết quả.
3. Gọi `addPointAfterPayment` **5 lần song song**.
4. Đọc lại user và order, in `totalPoint`, `paymentStatus`, `paidAt`, `pointsAwardedAt`.
5. **Xoá user thử và order thử.**

Kết quả mong đợi:
- Mảng kết quả của bước 2 có **đúng một** `true`, bốn `false`.
- `totalPoint` tăng **đúng 25** (250000 / 10000), không phải 125.

Dán output thật vào báo cáo.

### KC-3. VNPay — kiểm logic từ chối

Dùng script tạm tương tự: tự ký một bộ tham số bằng `vnPayHashSecret` lấy từ `getApiPayment()` rồi gọi endpoint `GET /order/payment-vnpay-result` trên server đang chạy (`npm run dev`), với 4 kịch bản trên cùng một đơn thử `unpaid`:

| Kịch bản | Mong đợi |
|---|---|
| Chữ ký đúng, `vnp_ResponseCode=24` (khách huỷ) | Trang thất bại, đơn vẫn `unpaid` |
| Chữ ký đúng, mã `00`, `vnp_Amount` sai | Trang thất bại, đơn vẫn `unpaid` |
| Chữ ký sai | Trang thất bại (HTTP 200, không phải 500), đơn vẫn `unpaid` |
| Chữ ký đúng, mã `00`, số tiền đúng — gọi **3 lần** | Cả 3 lần redirect về `/order/success`; đơn `paid`; điểm cộng **một lần** |

Xoá dữ liệu thử sau khi chạy. Dán bảng kết quả thật vào báo cáo.

> Trước khi chạy, kiểm `netstat -ano | findstr :3000` — nếu có tiến trình cũ giữ cổng 3000 thì kết quả sẽ sai. Dừng nó trước.

### KC-4. CI

```bash
git push origin fix/3c-idempotent-thanh-toan
```

Cả 3 job xanh.

---

## 7. ĐỊNH NGHĨA HOÀN THÀNH

- [ ] Model `Order` có `paidAt`, `pointsAwardedAt`, `payment{...}`
- [ ] `confirmOrderPaid` dùng điều kiện `paymentStatus: "unpaid"` và trả về theo `modifiedCount`
- [ ] `addPointAfterPayment` chặn lặp bằng `pointsAwardedAt`
- [ ] VNPay kiểm đủ: chữ ký, đơn tồn tại, `ResponseCode`, `TransactionStatus`, `Amount`
- [ ] ZaloPay kiểm `amount`, trả `return_code = 1` cho callback lặp
- [ ] Không còn `res.render('success', ...)`; có view `order-payment-failed.pug`
- [ ] Không còn `new Buffer(`
- [ ] Đơn đã `paid` không tạo được link thanh toán mới
- [ ] Hàm `createPost`, `success`, `exportPdf` **không bị sửa** (`git diff` chứng minh)
- [ ] KC-2 và KC-3 đạt, output thật đã dán; dữ liệu thử đã xoá; script tạm không bị commit
- [ ] CI xanh, đã mở PR, **chưa merge**

---

## 8. BẪY CẦN TRÁNH

| Bẫy | Vì sao |
|---|---|
| Kiểm "đã paid chưa" bằng `findOne` rồi mới `updateOne` | Hai callback đồng thời cùng đọc thấy `unpaid`. Phải là **một** lệnh update có điều kiện. |
| Đọc `vnp_Amount`/`vnp_ResponseCode` sau `sortObject` | Giá trị đã bị encode. Đọc từ `req.query` gốc trước. |
| Coi F5 trang trả về là lỗi | Đơn đã paid + callback hợp lệ = redirect về trang thành công, chỉ là không cộng điểm nữa. |
| Trả `return_code` khác 1 cho callback ZaloPay lặp | ZaloPay sẽ tiếp tục gọi lại. |
| So `order.total * 100` bằng `===` với số thực | Dùng `Math.round(order.total * 100)`. |
| Sửa `createPost` "tiện tay" | Thuộc 3D/3E. Sẽ xung đột. |
| Để lại đơn/user thử trong DB | DB là Atlas thật của dự án. Script kiểm chứng phải tự dọn, kể cả khi lỗi giữa chừng (`try/finally`). |
| Thêm collection `payments` riêng | Ngoài phạm vi. Subdocument `payment` trong `Order` là đủ cho batch này. |

---

## KẾT QUẢ THỰC THI

*(CODEX điền phần này sau khi làm xong — xem mẫu ở mục 2.5 của `2-KE-HOACH-TONG-THE.md`)*
