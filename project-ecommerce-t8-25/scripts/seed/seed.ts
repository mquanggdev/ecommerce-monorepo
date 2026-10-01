// Nạp dữ liệu mẫu (thời trang nam) vào CSDL. Chạy lại nhiều lần không tạo trùng: mọi bản ghi được upsert theo slug.
//
//   npm run seed                    → thuộc tính, danh mục, sản phẩm, bài viết, bản ghi media
//   npm run seed -- --home          → thêm: cập nhật nội dung các block trang chủ cho khớp dữ liệu mẫu
//   npm run seed -- --archive-old   → thêm: xóa mềm sản phẩm/danh mục/bài viết/thuộc tính KHÔNG thuộc dữ liệu mẫu
//
// Lưu ý: --archive-old sẽ ẩn cả dữ liệu bạn tự tạo. Chỉ dùng khi muốn dọn dữ liệu thử.
import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { connectDB } from "../../configs/database.config";
import Product from "../../models/product.model";
import CategoryProduct from "../../models/category-product.model";
import AttributeProduct from "../../models/attribute-product.model";
import Blog from "../../models/blog.model";
import CategoryBlog from "../../models/categories-blog.model";
import Media from "../../models/media.model";
import Block from "../../models/block.model";
import Template from "../../models/template.model";
import AccountAdmin from "../../models/account-admin.model";
import { COLORS, PRODUCT_CATEGORIES, PRODUCTS, SIZES_PANTS, SIZES_TOP } from "./data.products";
import { BLOG_CATEGORIES, BLOGS } from "./data.blogs";
import { blogImagePath, listSeedImages, productImagePaths, SEED_MEDIA_DIR, toSearch, toSlug } from "./common";

const FLASH_SALE_SLUG = "flash-sell"; // slug có sẵn, đang được block Flash Sale trên trang chủ sử dụng
const ATTRIBUTE_NAMES = { top: "Kích cỡ áo", pants: "Size quần", color: "Màu sắc" };
const DAY = 24 * 60 * 60 * 1000;
const args = process.argv.slice(2);

// Số giả ngẫu nhiên nhưng cố định theo chuỗi đầu vào, để mỗi lần chạy cho cùng kết quả
const stableNumber = (text: string, min: number, max: number) => {
  let hash = 0;
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) % 100003;
  return min + (hash % (max - min + 1));
};

// Upsert theo điều kiện, tự quản lý createdAt/updatedAt. Trả về id của bản ghi.
const upsert = async (Model: any, filter: any, data: any, createdAt?: Date): Promise<string> => {
  await Model.updateOne(
    filter,
    { $set: { ...data, deleted: false, updatedAt: new Date() }, $setOnInsert: { createdAt: createdAt || new Date() } },
    { upsert: true, timestamps: false }
  );
  const record = await Model.findOne(filter).select("_id").lean();
  return `${record._id}`;
};

const CARE_GUIDE: Record<string, string> = {
  "ao-nam": "Giặt máy ở nước lạnh, lộn trái áo trước khi giặt. Không dùng chất tẩy. Phơi trong bóng râm để giữ màu.",
  "quan-nam": "Lộn trái quần, giặt với nước lạnh và đồ cùng màu. Hạn chế sấy nhiệt cao để vải không co.",
  "ao-khoac-giu-am-nam": "Giặt tay hoặc giặt máy chế độ nhẹ. Không vắt xoắn. Treo trên móc bản to hoặc gấp phẳng khi cất.",
  "phu-kien-nam": "Lau bằng khăn mềm, khô. Tránh để tiếp xúc lâu với nước và ánh nắng trực tiếp.",
};

const seedAttributes = async () => {
  const option = (label: string, value: string) => ({ label, value });
  const ids = {
    top: await upsert(AttributeProduct, { name: ATTRIBUTE_NAMES.top }, {
      type: "text", search: toSearch(ATTRIBUTE_NAMES.top), options: SIZES_TOP.map(size => option(size, size.toLowerCase())),
    }),
    pants: await upsert(AttributeProduct, { name: ATTRIBUTE_NAMES.pants }, {
      type: "text", search: toSearch(ATTRIBUTE_NAMES.pants), options: SIZES_PANTS.map(size => option(size, size)),
    }),
    color: await upsert(AttributeProduct, { name: ATTRIBUTE_NAMES.color }, {
      type: "color", search: toSearch(ATTRIBUTE_NAMES.color), options: Object.entries(COLORS).map(([label, value]) => option(label, value)),
    }),
  };
  console.log("Thuộc tính: 3");
  return ids;
};

const seedProductCategories = async () => {
  const ids: Record<string, string> = {};
  const parentOf: Record<string, string> = {};
  const avatar = (productSlug: string) => `/media/seed/products/${productSlug}-1.jpg`;

  for (const parent of PRODUCT_CATEGORIES) {
    ids[parent.slug] = await upsert(CategoryProduct, { slug: parent.slug }, {
      name: parent.name, parent: "", description: parent.description, avatar: avatar(parent.avatarFrom), status: "active", search: toSearch(parent.name),
    });
    for (const child of parent.children) {
      ids[child.slug] = await upsert(CategoryProduct, { slug: child.slug }, {
        name: child.name, parent: ids[parent.slug], description: child.description, avatar: avatar(child.avatarFrom), status: "active", search: toSearch(child.name),
      });
      parentOf[child.slug] = parent.slug;
    }
  }
  ids[FLASH_SALE_SLUG] = await upsert(CategoryProduct, { slug: FLASH_SALE_SLUG }, {
    name: "Flash Sale", parent: "", description: "Sản phẩm đang giảm giá sâu trong thời gian giới hạn.", avatar: avatar("ao-thun-cotton-co-tron-basic"), status: "active", search: "flash sale",
  });
  console.log(`Danh mục sản phẩm: ${Object.keys(ids).length}`);
  return { ids, parentOf };
};

const seedProducts = async (attributeIds: { top: string, pants: string, color: string }, categoryIds: Record<string, string>, parentOf: Record<string, string>) => {
  const productIds: Record<string, string> = {};

  for (const [index, product] of PRODUCTS.entries()) {
    const slug = toSlug(product.name);
    const parentSlug = parentOf[product.category];
    const colors = product.colors || [];
    const sizes = product.sizes === "top" ? SIZES_TOP : product.sizes === "pants" ? SIZES_PANTS : [];
    const sizeAttrId = product.sizes === "pants" ? attributeIds.pants : attributeIds.top;

    // Biến thể = mọi tổ hợp kích cỡ x màu (hoặc chỉ theo màu với phụ kiện)
    const variants: any[] = [];
    const colorValue = (label: string) => ({ attrId: attributeIds.color, attrType: "color", label, value: COLORS[label] });
    if (sizes.length > 0) {
      for (const size of sizes) {
        for (const color of colors) {
          variants.push({
            status: true,
            attributeValue: [{ attrId: sizeAttrId, attrType: "text", label: size, value: size.toLowerCase() }, colorValue(color)],
            priceOld: product.priceOld, priceNew: product.priceNew,
            stock: stableNumber(`${slug}-${size}-${color}`, 4, 18),
          });
        }
      }
    } else {
      for (const color of colors) {
        variants.push({
          status: true, attributeValue: [colorValue(color)],
          priceOld: product.priceOld, priceNew: product.priceNew,
          stock: Math.round((product.stock || 30) / colors.length),
        });
      }
    }

    const images = productImagePaths(product.name, product.images.length);
    const category = [categoryIds[product.category], categoryIds[parentSlug]];
    if (product.flashSale) category.push(categoryIds[FLASH_SALE_SLUG]);

    const content = [
      `<p>${product.description}</p>`,
      `<h3>Chất liệu và kiểu dáng</h3>`,
      `<ul><li><strong>Chất liệu:</strong> ${product.material}</li><li><strong>Kiểu dáng:</strong> ${product.fit}</li></ul>`,
      `<h3>Điểm nổi bật</h3>`,
      `<ul>${product.features.map(feature => `<li>${feature}</li>`).join("")}</ul>`,
      `<h3>Hướng dẫn bảo quản</h3>`,
      `<p>${CARE_GUIDE[parentSlug]}</p>`,
    ].join("");

    productIds[slug] = await upsert(Product, { slug }, {
      name: product.name,
      sku: `TTN${String(index + 1).padStart(4, "0")}`,
      position: PRODUCTS.length - index,
      category,
      images,
      priceOld: product.priceOld,
      priceNew: product.priceNew,
      discount: Math.floor(((product.priceOld - product.priceNew) / product.priceOld) * 100),
      stock: variants.reduce((total, variant) => total + variant.stock, 0),
      attributes: sizes.length > 0 ? [sizeAttrId, attributeIds.color] : [attributeIds.color],
      variants,
      description: product.description,
      content,
      status: "active",
      view: stableNumber(slug, 40, 900),
      search: toSearch(product.name),
      tags: product.tags,
      seo: {
        title: `${product.name} | Thời trang nam`,
        description: product.description,
        keywords: product.tags,
        robots: { index: true, follow: true },
        og: { title: product.name, description: product.description, image: images[0] },
      },
    }, new Date(Date.now() - index * 2 * DAY));
  }

  // Sản phẩm mua kèm: 2 sản phẩm cùng nhóm cha nhưng khác danh mục con
  for (const product of PRODUCTS) {
    const related = PRODUCTS
      .filter(other => other.category !== product.category && parentOf[other.category] === parentOf[product.category])
      .slice(0, 2)
      .map(other => productIds[toSlug(other.name)]);
    await Product.updateOne({ slug: toSlug(product.name) }, { boughtTogether: related }, { timestamps: false });
  }
  console.log(`Sản phẩm: ${PRODUCTS.length}`);
};

const seedBlogs = async () => {
  const categoryIds: Record<string, string> = {};
  for (const category of BLOG_CATEGORIES) {
    categoryIds[category.slug] = await upsert(CategoryBlog, { slug: category.slug }, {
      name: category.name, parent: "", description: category.description, status: "active", search: toSearch(category.name),
    });
  }

  // Tác giả: tài khoản admin tạo sớm nhất (chủ shop)
  const admin: any = await AccountAdmin.findOne({ deleted: false, status: "active" }).sort({ createdAt: 1 }).select("_id").lean();
  const authorId = admin ? `${admin._id}` : `${process.env.SUPER_ADMIN_ID}`;

  for (const [index, blog] of BLOGS.entries()) {
    const publishAt = new Date(Date.now() - index * 3 * DAY);
    const slug = toSlug(blog.name);
    await upsert(Blog, { slug }, {
      name: blog.name,
      category: [categoryIds[blog.category]],
      avatar: blogImagePath(blog.name),
      description: blog.description,
      content: `<p>${blog.description}</p>` + blog.sections.map(([heading, text]) => `<h2>${heading}</h2><p>${text}</p>`).join(""),
      status: "published",
      view: stableNumber(slug, 30, 600),
      search: toSearch(blog.name),
      publishAt,
      createdBy: authorId,
    }, publishAt);
  }
  console.log(`Danh mục bài viết: ${BLOG_CATEGORIES.length} | Bài viết: ${BLOGS.length}`);
};

// Bản ghi media để ảnh mẫu hiện trong trang Quản lý file của admin
const seedMedia = async () => {
  let count = 0;
  for (const image of listSeedImages()) {
    const filePath = path.join(SEED_MEDIA_DIR, image.folder.replace("/media/seed/", ""), image.filename);
    if (!fs.existsSync(filePath)) {
      console.log(`  Thiếu file ảnh: ${image.folder}/${image.filename} (chạy npm run seed:images)`);
      continue;
    }
    await Media.updateOne(
      { folder: image.folder, filename: image.filename },
      { $set: { mimetype: "image/jpeg", size: fs.statSync(filePath).size } },
      { upsert: true }
    );
    count++;
  }
  // Xóa bản ghi của ảnh mẫu đã bị gỡ khỏi dữ liệu mẫu
  const images = listSeedImages();
  const removed = await Media.deleteMany({
    folder: { $in: [...new Set(images.map(image => image.folder))] },
    filename: { $nin: images.map(image => image.filename) },
  });
  console.log(`Bản ghi media: ${count}${removed.deletedCount ? ` (gỡ ${removed.deletedCount} bản ghi cũ)` : ""}`);
};

// Xóa mềm mọi thứ không thuộc dữ liệu mẫu
const archiveOld = async () => {
  const deleted = { deleted: true, deletedAt: new Date() };
  const keepCategories = [FLASH_SALE_SLUG, ...PRODUCT_CATEGORIES.flatMap(parent => [parent.slug, ...parent.children.map(child => child.slug)])];
  const results = {
    "sản phẩm": await Product.updateMany({ deleted: false, slug: { $nin: PRODUCTS.map(product => toSlug(product.name)) } }, deleted),
    "danh mục sản phẩm": await CategoryProduct.updateMany({ deleted: false, slug: { $nin: keepCategories } }, deleted),
    "thuộc tính": await AttributeProduct.updateMany({ deleted: false, name: { $nin: Object.values(ATTRIBUTE_NAMES) } }, deleted),
    "bài viết": await Blog.updateMany({ deleted: false, slug: { $nin: BLOGS.map(blog => toSlug(blog.name)) } }, deleted),
    "danh mục bài viết": await CategoryBlog.updateMany({ deleted: false, slug: { $nin: BLOG_CATEGORIES.map(category => category.slug) } }, deleted),
  };
  console.log("Đã xóa mềm dữ liệu cũ: " + Object.entries(results).map(([name, result]) => `${result.modifiedCount} ${name}`).join(", "));
};

// Cập nhật nội dung các block của template trang chủ cho khớp dữ liệu mẫu
const seedHome = async () => {
  const template: any = await Template.findOne({ slug: "/", deleted: false }).lean();
  if (!template) { console.log("Không có template trang chủ, bỏ qua --home"); return; }
  const blocks: any[] = await Block.find({ _id: { $in: template.blocks.map((block: any) => block.blockId) } }).lean();
  const image = (name: string) => `/client/assets/images/${name}`;
  const shopLink = "/product/category";
  const byCategory = (slug: string, by: string, limit = 10) => ({ type: "product", category: [slug], limit, sort: { by, type: "desc" } });

  const dataByFile: Record<string, any> = {
    "banner_2.pug": {
      categories: { enable: true },
      sliders: [
        { background: image("seed/banner-1.jpg"), subtitle: "Bộ sưu tập mới", title: "Lịch lãm mỗi ngày cùng blazer và sơ mi", button: { text: "Mua ngay", link: "/product/category/blazer-nam" } },
        { background: image("seed/banner-2.jpg"), subtitle: "Thu đông", title: "Áo khoác giữ ấm, gọn nhẹ, dễ phối", button: { text: "Mua ngay", link: "/product/category/ao-khoac-giu-am-nam" } },
        { background: image("seed/banner-3.jpg"), subtitle: "Bán chạy nhất", title: "Áo thun cotton mặc được quanh năm", button: { text: "Mua ngay", link: "/product/category/ao-thun-nam" } },
      ],
      sideBanner: { background: image("seed/banner-side.jpg"), subtitle: "Ưu đãi trong tuần", title: "Quần jean giảm đến 20%", button: { text: "Xem ngay", link: "/product/category/quan-jean-nam" } },
    },
    "features.pug": {
      items: [
        { color: "purple", icon: image("feature-icon_1.svg"), title: "Đổi trả trong 7 ngày", description: "Hoàn tiền nếu không vừa ý" },
        { color: "green", icon: image("feature-icon_3.svg"), title: "Hỗ trợ trực tuyến", description: "Tư vấn qua chat mỗi ngày" },
        { color: "orange", icon: image("feature-icon_2.svg"), title: "Thanh toán an toàn", description: "VNPay, ZaloPay hoặc tiền mặt" },
        { color: "", icon: image("feature-icon_4.svg"), title: "Tích điểm đổi quà", description: "Mỗi đơn hàng đều được cộng điểm" },
      ],
    },
    "category_2.pug": {
      items: [
        { title: "Áo nam", image: image("category_img_2.png"), link: "/product/category/ao-nam" },
        { title: "Áo khoác", image: image("category_img_4.png"), link: "/product/category/ao-khoac-nam" },
        { title: "Hoodie & áo len", image: image("category_img_8.png"), link: "/product/category/hoodie-ao-len-nam" },
        { title: "Phụ kiện", image: image("category_img_9.png"), link: "/product/category/phu-kien-nam" },
      ],
    },
    "flash_sell_2.pug": {
      title: { highlight: "Flash", normal: " Sale" }, showCountdown: true, endTime: "2027-12-31T23:59:59",
      viewAll: "Xem tất cả", linkViewAll: `/product/category/${FLASH_SALE_SLUG}`,
      getByCategory: byCategory(FLASH_SALE_SLUG, "discount"),
    },
    "trending_product_2.pug": {
      title: { highlight: "Sản phẩm", normal: " nổi bật" },
      tabs: [
        { key: "1", label: "Áo nam", getByCategory: byCategory("ao-nam", "position") },
        { key: "2", label: "Quần nam", getByCategory: byCategory("quan-nam", "position") },
        { key: "3", label: "Áo khoác & giữ ấm", getByCategory: byCategory("ao-khoac-giu-am-nam", "position") },
        { key: "4", label: "Phụ kiện", getByCategory: byCategory("phu-kien-nam", "position") },
      ],
    },
    "best_selling_product_2.pug": {
      title: { normal1: "Sản phẩm ", highlight: "bán chạy", normal2: "" }, viewAll: "Xem tất cả", linkViewAll: "/product/category?sort=position-desc",
      banner: { image: image("seed/block-bestsell.jpg"), title: "Quần jean nam giảm đến 20%", subtitle: "Chỉ từ 399.000đ", button: { text: "Mua ngay", link: "/product/category/quan-jean-nam" } },
      getByCategory: { type: "product", category: [], limit: 3, sort: { by: "view", type: "desc" } },
    },
    "favourite_product_2.pug": {
      title: { normal1: "Được ", highlight: "yêu thích", normal2: " nhất" },
      banner: { image: image("seed/block-favourite.jpg"), title: "Polo cho ngày hè", highlight: "Giảm đến 25%", subtitle: "Số lượng có hạn", button: { text: "Mua ngay", link: "/product/category/ao-polo-nam" } },
      getByCategory: { type: "product", category: ["ao-nam", "ao-khoac-giu-am-nam"], limit: 8, sort: { by: "view", type: "desc" } },
    },
    "new_arrival_2.pug": {
      title: { normal1: "Hàng ", highlight: "mới về", normal2: "" }, viewAll: "Xem tất cả", linkViewAll: "/product/category?sort=createdAt-desc",
      getByCategory: { type: "product", category: [], limit: 4, sort: { by: "createdAt", type: "desc" } },
    },
    "special_product_2.pug": {
      title: { normal1: "Ưu đãi ", highlight: "đặc biệt", normal2: "" }, viewAll: "Xem tất cả", linkViewAll: `/product/category/${FLASH_SALE_SLUG}`,
      banner: { image: image("seed/block-special.jpg"), title: "Áo khoác denim cho mọi mùa", subtitle: "Bền, càng mặc càng đẹp", button: { text: "Mua ngay", link: "/product/category/ao-khoac-nam" } },
      getByCategory: { type: "product", category: [], limit: 6, sort: { by: "discount", type: "desc" } },
    },
    "subscription_2.pug": {
      background: image("seed/block-subscribe.jpg"),
      title: { normal1: "Giảm đến ", highlight: "30%", normal2: " cho đơn hàng đầu tiên" },
      description: "Tạo tài khoản để tích điểm và nhận ưu đãi dành riêng cho thành viên",
      button: { text: "Đăng ký ngay", link: "/auth/register" },
    },
    "blog_2.pug": {
      title: { normal1: "Bài viết ", highlight: "thời trang", normal2: " nam" }, viewAll: "Xem tất cả", linkViewAll: "/article/category/phoi-do",
      getByCategory: { type: "blog", category: BLOG_CATEGORIES.map(category => category.slug), limit: 4, sort: { by: "publishAt", type: "desc" } },
    },
  };

  let updated = 0;
  for (const block of blocks) {
    const data = dataByFile[block.fileName];
    if (!data) continue;
    await Block.updateOne({ _id: block._id }, { data });
    updated++;
  }
  // Ảnh logo trong block thương hiệu của template là nhãn hiệu thật (không phải đối tác) nên tắt block này
  const brandBlockIds = blocks.filter(block => block.fileName === "brand_2.pug").map(block => block._id);
  await Block.updateMany({ _id: { $in: brandBlockIds } }, { status: "inactive" });
  console.log(`Block trang chủ đã cập nhật: ${updated}, tắt block thương hiệu: ${brandBlockIds.length}`);
};

(async () => {
  await connectDB();
  try {
    const attributeIds = await seedAttributes();
    const { ids: categoryIds, parentOf } = await seedProductCategories();
    await seedProducts(attributeIds, categoryIds, parentOf);
    await seedBlogs();
    await seedMedia();
    if (args.includes("--archive-old")) await archiveOld();
    if (args.includes("--home")) await seedHome();
    console.log("Hoàn tất.");
  } finally {
    await mongoose.disconnect();
  }
})().catch(error => { console.error("LỖI:", error); process.exit(1); });
