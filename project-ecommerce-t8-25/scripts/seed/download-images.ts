// Tải ảnh mẫu từ Unsplash về file-manager/media/seed (bỏ qua ảnh đã có).
// Chạy: npm run seed:images
// Ảnh đã được commit sẵn vào git, chỉ cần chạy lại khi thêm sản phẩm/bài viết mới vào dữ liệu mẫu.
import fs from "fs";
import path from "path";
import { listSeedImages, SEED_MEDIA_DIR } from "./common";

(async () => {
  const images = listSeedImages();
  let downloaded = 0, skipped = 0, failed = 0;

  for (const image of images) {
    // folder có dạng /media/seed/products → lấy phần sau "seed/"
    const dir = path.join(SEED_MEDIA_DIR, image.folder.replace("/media/seed/", ""));
    const filePath = path.join(dir, image.filename);
    if (fs.existsSync(filePath)) { skipped++; continue; }

    fs.mkdirSync(dir, { recursive: true });
    const url = `https://images.unsplash.com/${image.photoId}?w=${image.width}&h=${image.height}&fit=crop&q=72&fm=jpg`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      fs.writeFileSync(filePath, Buffer.from(await response.arrayBuffer()));
      downloaded++;
    } catch (error: any) {
      failed++;
      console.log(`LỖI ${image.filename} (${image.photoId}): ${error.message}`);
    }
  }

  console.log(`Tổng ${images.length} ảnh | tải mới ${downloaded} | đã có ${skipped} | lỗi ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
})();
