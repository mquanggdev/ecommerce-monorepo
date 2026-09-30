import path from "path";
import slugify from "slugify";
import { PRODUCTS } from "./data.products";
import { BLOGS } from "./data.blogs";

// Thư mục vật lý chứa ảnh mẫu (nằm trong service file-manager, được commit vào git)
export const SEED_MEDIA_DIR = path.resolve(__dirname, "../../../file-manager/media/seed");

// Đường dẫn lưu trong CSDL (giống định dạng file-manager trả về khi upload)
export const PRODUCT_FOLDER = "/media/seed/products";
export const BLOG_FOLDER = "/media/seed/blogs";

export const toSlug = (text: string) => slugify(text, { lower: true, strict: true, locale: "vi" });
export const toSearch = (text: string) => slugify(text, { lower: true, replacement: " ", locale: "vi" });

export interface SeedImage {
  photoId: string; // mã ảnh Unsplash
  folder: string;
  filename: string;
  width: number;
  height: number;
}

// Danh sách toàn bộ ảnh mẫu, suy ra từ dữ liệu sản phẩm và bài viết
export const listSeedImages = (): SeedImage[] => {
  const images: SeedImage[] = [];
  for (const product of PRODUCTS) {
    product.images.forEach((photoId, index) => {
      images.push({ photoId, folder: PRODUCT_FOLDER, filename: `${toSlug(product.name)}-${index + 1}.jpg`, width: 800, height: 1000 });
    });
  }
  for (const blog of BLOGS) {
    images.push({ photoId: blog.image, folder: BLOG_FOLDER, filename: `${toSlug(blog.name)}.jpg`, width: 1000, height: 650 });
  }
  return images;
};

export const productImagePaths = (name: string, count: number) =>
  Array.from({ length: count }, (_, index) => `${PRODUCT_FOLDER}/${toSlug(name)}-${index + 1}.jpg`);

export const blogImagePath = (name: string) => `${BLOG_FOLDER}/${toSlug(name)}.jpg`;
