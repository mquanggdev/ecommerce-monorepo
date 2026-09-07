import dns from "dns";
import mongoose from "mongoose";

dns.setServers(["1.1.1.1", "8.8.8.8"]); // thiết lập DNS servers để phân giai tên miền 1111 là của Cloudflare và 8888 là của Google

export const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.DATABASE}`);
    console.log("Kết nối DB thành công!");
  } catch (error) {
    console.log("Kết nối DB thất bại!", error);
  }
}