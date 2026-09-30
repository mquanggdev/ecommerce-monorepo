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
];




export const pointConfig = {
  MONEY_PER_POINT: 10000, // 10.000đ = 1 điểm
  POINT_TO_MONEY: 100, // 1 điểm = 100đ
};