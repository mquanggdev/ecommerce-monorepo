# project-ecommerce-t8-25

Ứng dụng chính của **Questa**: cửa hàng, trang quản trị, API, chat realtime (Socket.IO) và tích hợp bên thứ ba
(VNPay, ZaloPay, GoShip, NDAMaps, Groq AI, Gmail SMTP, Google/Facebook OAuth).

Kiến trúc, chức năng và các quyết định kỹ thuật: xem [README ở thư mục gốc](../README.md).

```bash
cp .env.example .env      # điền các biến (xem chú thích trong file)
npm install
npm run dev               # http://localhost:3000, trang quản trị /admin
npm run typecheck         # kiểm tra kiểu
npm run build             # biên dịch ra dist/
npm run seed -- --home    # dữ liệu mẫu
```
