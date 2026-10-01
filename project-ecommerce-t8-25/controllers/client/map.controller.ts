import { Request, Response } from 'express';
import axios from 'axios';

// Bản đồ dùng NDAMaps (trước đây là openmap.vn) thay cho OpenStreetMap: tên miền openstreetmap.org
// đang bị một số nhà mạng trong nước chặn ở mức DNS nên bản đồ và tìm địa chỉ không chạy được.
// Mọi request đi qua server để giữ kín API key.
const MAP_TILE_URL = "https://maptiles.ndamaps.vn/styles/day-v1";
const MAP_API_URL = "https://mapapis.ndamaps.vn/v1";
const REQUEST_TIMEOUT = 10000;

// Ô ảnh bản đồ 256x256 theo chuẩn XYZ
export const tile = async (req: Request, res: Response) => {
  const z = Number(req.params.z);
  const x = Number(req.params.x);
  const y = Number(req.params.y);

  // Chỉ nhận toạ độ ô hợp lệ (tránh dùng proxy để gọi đường dẫn tuỳ ý)
  const maxIndex = 2 ** z;
  if (![z, x, y].every(Number.isInteger) || z < 0 || z > 20 || x < 0 || y < 0 || x >= maxIndex || y >= maxIndex) {
    res.status(400).end();
    return;
  }

  try {
    const response = await axios.get(`${MAP_TILE_URL}/${z}/${x}/${y}.png`, {
      params: { apikey: process.env.OPENMAP_KEY },
      responseType: "arraybuffer",
      timeout: REQUEST_TIMEOUT
    });
    res.set("Content-Type", "image/png");
    res.set("Cache-Control", "public, max-age=86400"); // Ô bản đồ ít thay đổi: trình duyệt giữ 1 ngày
    res.send(response.data);
  } catch (error: any) {
    console.error("Lỗi tải ô bản đồ:", error?.response?.status || "", error?.message);
    res.status(502).end();
  }
}

// Toạ độ -> địa chỉ (khi khách bấm chọn vị trí trên bản đồ)
export const reverse = async (req: Request, res: Response) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    res.json({ code: "error", message: "Vị trí không hợp lệ!" });
    return;
  }

  try {
    const response = await axios.get(`${MAP_API_URL}/geocode/reverse`, {
      params: { latlng: `${lat},${lng}`, apikey: process.env.OPENMAP_KEY },
      timeout: REQUEST_TIMEOUT
    });
    const result = response.data?.results?.[0];
    if (!result) {
      res.json({ code: "error", message: "Không tìm thấy địa chỉ tại vị trí này!" });
      return;
    }
    res.json({
      code: "success",
      address: result.formatted_address || result.address
    });
  } catch (error: any) {
    console.error("Lỗi lấy địa chỉ từ toạ độ:", error?.response?.status || "", error?.message);
    res.json({ code: "error", message: "Dịch vụ bản đồ đang gặp sự cố, vui lòng thử lại sau!" });
  }
}

// Địa chỉ -> toạ độ (ô tìm kiếm trên bản đồ)
export const search = async (req: Request, res: Response) => {
  const keyword = `${req.query.keyword || ""}`.trim();
  if (!keyword || keyword.length > 200) {
    res.json({ code: "error", message: "Vui lòng nhập địa chỉ tìm kiếm!" });
    return;
  }

  try {
    const response = await axios.get(`${MAP_API_URL}/geocode/forward`, {
      params: { address: keyword, apikey: process.env.OPENMAP_KEY },
      timeout: REQUEST_TIMEOUT
    });
    const result = response.data?.results?.[0];
    if (!result?.geometry?.location) {
      res.json({ code: "error", message: "Không tìm thấy địa chỉ!" });
      return;
    }
    res.json({
      code: "success",
      address: result.formatted_address || result.address,
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng
    });
  } catch (error: any) {
    console.error("Lỗi tìm địa chỉ:", error?.response?.status || "", error?.message);
    res.json({ code: "error", message: "Dịch vụ bản đồ đang gặp sự cố, vui lòng thử lại sau!" });
  }
}
