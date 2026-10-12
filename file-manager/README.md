# file-manager

Service lưu và phục vụ ảnh/file upload của **Questa Fashion**, tách riêng khỏi ứng dụng chính.

| Route | Ai gọi | Bảo vệ |
|---|---|---|
| `/file-manager/*` (upload, tạo/đổi tên/xóa thư mục và file) | Server ecommerce (mạng nội bộ) | Header `Authorization: Bearer <FILE_MANAGER_SECRET>` |
| `/media/*` (trả file) | Trình duyệt | `Referer` phải bắt đầu bằng `DOMAIN` |
| `/healthz` | Docker healthcheck | — |

Mọi đường dẫn bị giới hạn trong thư mục `media/` (chống path traversal); tối đa 20MB/file, 10 file/lần;
chặn upload loại file trình duyệt có thể thực thi (`.html`, `.svg`, `.js`...).

Thiết kế tổng thể: xem [README ở thư mục gốc](../README.md).

```bash
cp .env.example .env
npm install
npm run dev               # http://localhost:4000
```
