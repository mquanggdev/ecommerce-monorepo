import dns from "dns";
import mongoose from "mongoose";

dns.setServers(["1.1.1.1", "8.8.8.8"]); // thiết lập DNS servers để phân giai tên miền 1111 là của Cloudflare và 8888 là của Google

export const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.DATABASE}`);
    console.log("Kết nối DB thành công!");
  } catch (error) {
    // Không có DB thì mọi trang đều lỗi: dừng hẳn để Docker khởi động lại và log báo rõ nguyên nhân
    // (thường gặp khi deploy: MongoDB Atlas chưa cho phép IP của VPS, sai chuỗi kết nối)
    console.error("Kết nối DB thất bại!", error);
    process.exit(1);
  }
}