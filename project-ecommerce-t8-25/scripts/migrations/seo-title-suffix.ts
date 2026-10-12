// Bỏ đuôi "| Thời trang nam" trong tiêu đề SEO của sản phẩm (từ dữ liệu mẫu cũ).
// Layout giờ tự thêm "| Questa", giữ đuôi cũ sẽ thành "… | Thời trang nam | Questa".
// Mặc định chỉ in danh sách sẽ đổi; thêm --apply để ghi. Chạy lại nhiều lần không sao.
//   node -r ts-node/register scripts/migrations/seo-title-suffix.ts [--apply]
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../../configs/database.config";
import Product from "../../models/product.model";

const SUFFIX = /\s*\|\s*Thời trang nam\s*$/;

(async () => {
  await connectDB();
  try {
    const apply = process.argv.includes("--apply");
    const productList: any[] = await Product.find({ "seo.title": SUFFIX }).select("seo.title").lean();
    console.log(`${productList.length} sản phẩm có đuôi "| Thời trang nam"${apply ? "" : " (chạy thử, chưa ghi)"}`);

    for (const product of productList) {
      const newTitle = `${product.seo.title}`.replace(SUFFIX, "");
      console.log(`  "${product.seo.title}" -> "${newTitle}"`);
      if (apply) {
        // Chỉ đổi khi tiêu đề vẫn là giá trị vừa đọc (admin không sửa trong lúc chạy)
        await Product.updateOne({ _id: product._id, "seo.title": product.seo.title }, { "seo.title": newTitle });
      }
    }

    if (apply) {
      console.log(`Còn lại có đuôi cũ: ${await Product.countDocuments({ "seo.title": SUFFIX })}`);
    }
  } finally {
    await mongoose.disconnect();
  }
})();
