🚀 Fullstack Ecommerce & CMS Ecosystem
Một hệ sinh thái thương mại điện tử toàn diện bao gồm: Storefront (Client), Admin Dashboard, và File Manager Server độc lập.

🏗️ Kiến trúc Hệ thống (Architecture)
Mô hình: Monolithic MVC (Model-View-Controller).

Rendering: Server-Side Rendering (SSR) với Pug.

Hệ thống File: Xây dựng một Server quản lý file tập trung (File Manager) riêng biệt để phục vụ cho dự án Ecommerce, đảm bảo tính độc lập và bảo mật.

🛠️ Công nghệ Sử dụng (Tech Stack)
Backend: Node.js, Express.js.

Database: MongoDB (Mongoose).

Real-time: Socket.io (Hệ thống Chat & Thông báo).

Giao diện: Pug, TailwindCSS, CSS Custom.

Tích hợp: ZaloPay, VNPay, GoShip (Vận chuyển), Google/Facebook Auth, TinyMCE.

🌟 Các Module Chính & Tính năng
1. Hệ thống Quản trị (Admin Dashboard)
Quản lý Nội dung (CMS):

Danh mục & Bài viết: Hỗ trợ cấu trúc dạng cây (Tree structure), tự động tạo Slug, tích hợp trình soạn thảo TinyMCE cao cấp.

Quản lý Sản phẩm: Thuộc tính sản phẩm đa dạng (Variants), quản lý kho (Stock), quản lý Tag và thương hiệu.

Phân quyền & Bảo mật:

Hệ thống nhóm quyền (Roles) chi tiết, phân quyền đến từng hành động (CRUD).

Xác thực đa tầng: Route bảo mật, OTP Password Reset, tài khoản Super Admin.

Log & Theo dõi: Ghi lại toàn bộ lịch sử hoạt động của quản trị viên (Activity Logs).

2. Hệ thống Lưu trữ (Independent File Manager)
Quản lý tập tin: Upload, sửa tên, xem trước (Preview), tải về, và xóa file/thư mục.

Cấu trúc thư mục: Hỗ trợ tạo folder con đa cấp, di chuyển và tổ chức file khoa học.

Bảo mật: Chỉ cho phép các tên miền cụ thể truy cập (CORS policy) và chỉ Admin mới có quyền thao tác dữ liệu.

3. Trải nghiệm Khách hàng (Storefront - Client)
Mua sắm thông minh:

Tìm kiếm nâng cao, tìm kiếm bằng giọng nói, gợi ý sản phẩm realtime (Autocomplete).

So sánh sản phẩm, danh sách yêu thích (Wishlist), lịch sử xem sản phẩm.

Giỏ hàng nâng cao: Mini-cart, cập nhật số lượng realtime, áp dụng mã giảm giá (Coupon).

Tương tác & Đánh giá: Hệ thống Review sản phẩm (Rating) kèm bộ lọc theo số sao.

Cá nhân hóa: Quản lý sổ địa chỉ (tích hợp bản đồ), theo dõi trạng thái đơn hàng, tích điểm thưởng khi mua hàng.

4. Giao dịch & Vận chuyển
Thanh toán: Tích hợp cổng thanh toán ZaloPay và VNPay.

Vận chuyển: Tích hợp API GoShip để lấy danh sách hãng vận chuyển và tính phí ship realtime dựa trên địa chỉ người dùng.

Hóa đơn: Xuất thông tin đơn hàng ra file PDF chuyên nghiệp.

5. Hệ thống Chat Real-time & AI
Hỗ trợ khách hàng: Nhắn tin Real-time giữa User và Admin qua Socket.io.

Tính năng nâng cao: Gửi file trong chat, hiển thị trạng thái Online/Offline, thông báo "đang gõ", tự động gán khách hàng cho nhân viên.

Tích hợp AI:

AI Suggest Reply: Gợi ý phản hồi nhanh cho Admin.

AI Chat Summary: Tóm tắt nội dung cuộc hội thoại.

Sentiment Analysis: Phân tích cảm xúc khách hàng để cải thiện chất lượng dịch vụ.

6. Marketing & Tối ưu hóa (SEO & Analytics)
SEO: Cấu hình SEO nâng cao cho từng sản phẩm/bài viết, tự động tạo sitemap.xml, cấu hình robots.txt và ping Google Search Console.

KPI Dashboard: Biểu đồ thống kê doanh thu theo giờ/ngày/tháng, thống kê đơn hàng, sản phẩm bán chạy và tăng trưởng khách hàng.

Dynamic UI: Hệ thống "Block" và "Template" cho phép Admin tùy chỉnh giao diện trang chủ linh hoạt mà không cần can thiệp vào code.

📈 Cải tiến & Tối ưu
Hỗ trợ đa ngôn ngữ (I18n).

Cơ chế Xóa Cache để tối ưu tốc độ tải trang sau khi cập nhật dữ liệu.

Hệ thống tự động xóa hội thoại cũ sau 10 ngày để tối ưu dung lượng database.

Author: Tran Minh Quang
Role: Fullstack Developer 
