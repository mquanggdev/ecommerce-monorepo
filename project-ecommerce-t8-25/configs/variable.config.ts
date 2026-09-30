export const pathAdmin = "admin";
export const domainCDN = process.env.CDN_URL || "http://localhost:4000";
export const domainPublic = process.env.CDN_PUBLIC || domainCDN;

export const permissionList = [
  {
    id: "dashboard",
    name: "Trang tổng quan"
  },
  //bài viết
  {
    id: "article-list",
    name: "Danh sách bài viết"
  },
  {
    id: "article-create",
    name: "Tạo bài viết"
  },
  {
    id: "article-edit",
    name: "Sửa bài viết"
  },
  {
    id: "article-delete",
    name: "Xóa bài viết"
  },
  {
    id: "article-trash",
    name: "Thùng rác bài viết"
  },
  // danh mục
  {
    id: "article-category",
    name: "Danh mục bài viết"
  },
  {
    id: "article-category-create",
    name: "Tạo danh mục bài viết"
  },
  {
    id: "article-category-edit",
    name: "Sửa danh mục bài viết"
  },
  {
    id: "article-category-delete",
    name: "Xóa danh mục bài viết"
  },
  {
    id: "article-category-trash",
    name: "Thùng rác danh mục bài viết"
  },
  // phân quyền
  {
    id: "role-list",
    name: "Danh sách nhóm quyền"
  },
  {
    id: "role-create",
    name: "Tạo nhóm quyền"
  },
  {
    id: "role-edit",
    name: "Sửa nhóm quyền"
  },
  {
    id: "role-delete",
    name: "Xóa nhóm quyền"
  },
  {
    id: "role-trash",
    name: "Thùng rác nhóm quyền"
  },
  // quản trị
  {
    id: "account-admin-list",
    name: "Danh sách tài khoản quản trị"
  },
  {
    id: "account-admin-create",
    name: "Tạo tài khoản quản trị"
  },
  {
    id: "account-admin-edit",
    name: "Sửa tài khoản quản trị"
  },
  {
    id: "account-admin-change-password",
    name: "Đổi mật khẩu tài khoản quản trị"
  },
  {
    id: "account-admin-delete",
    name: "Xóa tài khoản quản trị"
  },
  // quản lý
  {
    id: "file-manager",
    name: "Quản lý file"
  },
  // sản phẩm
  {
    id: "product-list",
    name: "Danh sách sản phẩm"
  },
  {
    id: "product-create",
    name: "Tạo sản phẩm"
  },
  {
    id: "product-edit",
    name: "Sửa sản phẩm"
  },
  {
    id: "product-delete",
    name: "Xóa sản phẩm"
  },
  {
    id: "product-export",
    name: "Xuất CSV sản phẩm"
  },
  {
    id: "product-import",
    name: "Nhập CSV sản phẩm"
  },
  {
    id: "product-category",
    name: "Danh mục sản phẩm"
  },
  {
    id: "product-category-create",
    name: "Tạo danh mục sản phẩm"
  },
  {
    id: "product-category-edit",
    name: "Sửa danh mục sản phẩm"
  },
  {
    id: "product-category-delete",
    name: "Xóa danh mục sản phẩm"
  },
  {
    id: "product-attribute",
    name: "Thuộc tính sản phẩm"
  },
  {
    id: "product-attribute-create",
    name: "Tạo thuộc tính sản phẩm"
  },
  {
    id: "product-attribute-edit",
    name: "Sửa thuộc tính sản phẩm"
  },
  {
    id: "product-attribute-delete",
    name: "Xóa thuộc tính sản phẩm"
  },
  // mã giảm giá
  {
    id: "coupon-list",
    name: "Danh sách mã giảm giá"
  },
  {
    id: "coupon-create",
    name: "Tạo mã giảm giá"
  },
  {
    id: "coupon-edit",
    name: "Sửa mã giảm giá"
  },
  {
    id: "coupon-delete",
    name: "Xóa mã giảm giá"
  },
  // đơn hàng
  {
    id: "order-list",
    name: "Danh sách đơn hàng"
  },
  {
    id: "order-edit",
    name: "Sửa đơn hàng"
  },
  {
    id: "order-export",
    name: "Xuất CSV đơn hàng"
  },
  // đánh giá
  {
    id: "review-list",
    name: "Danh sách đánh giá"
  },
  {
    id: "review-edit",
    name: "Duyệt đánh giá"
  },
  // tài khoản người dùng
  {
    id: "account-user-list",
    name: "Danh sách tài khoản người dùng"
  },
  // giao diện
  {
    id: "block-list",
    name: "Danh sách block"
  },
  {
    id: "block-create",
    name: "Tạo block"
  },
  {
    id: "block-edit",
    name: "Sửa block"
  },
  {
    id: "block-delete",
    name: "Xóa block"
  },
  {
    id: "template-list",
    name: "Danh sách template"
  },
  {
    id: "template-create",
    name: "Tạo template"
  },
  {
    id: "template-edit",
    name: "Sửa template"
  },
  // tin nhắn
  {
    id: "chat",
    name: "Tin nhắn khách hàng"
  },
  // cài đặt
  {
    id: "setting",
    name: "Cài đặt hệ thống (API, cấu hình chung)"
  },
];




export const pointConfig = {
  MONEY_PER_POINT: 10000, // 10.000đ = 1 điểm
  POINT_TO_MONEY: 100, // 1 điểm = 100đ
};