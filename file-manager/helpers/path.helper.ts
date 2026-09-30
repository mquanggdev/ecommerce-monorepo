import path from "path";

// Thư mục gốc duy nhất mà service được phép đọc/ghi
export const mediaRoot = path.resolve(__dirname, "..", "media");

// Ghép các đoạn đường dẫn (tương đối so với thư mục media) và bảo đảm kết quả vẫn nằm trong media.
// Trả về đường dẫn tuyệt đối, hoặc null nếu đường dẫn thoát ra ngoài (vd: chứa "..") hay không hợp lệ.
export const resolveInsideMedia = (...segments: any[]): string | null => {
  const parts: string[] = [];
  for (const segment of segments) {
    if(typeof segment !== "string" || segment.includes("\0")) return null;
    parts.push(segment);
  }

  const resolved = path.resolve(mediaRoot, ...parts.map(part => `./${part}`));
  if(resolved !== mediaRoot && !resolved.startsWith(mediaRoot + path.sep)) return null;
  return resolved;
}

// Các API cũ nhận thư mục dạng "/media/abc" → đổi về dạng tương đối so với thư mục media ("abc")
export const stripMediaPrefix = (folder: any): string | null => {
  if(typeof folder !== "string") return null;
  const clean = folder.replace(/\\/g, "/").replace(/^\/+/, "");
  if(clean === "media") return "";
  if(clean.startsWith("media/")) return clean.substring("media/".length);
  return null;
}

// Tên file/thư mục không được chứa dấu phân cách đường dẫn
export const isSafeName = (name: any): boolean => {
  return typeof name === "string"
    && name.length > 0
    && name.length <= 255
    && name !== "."
    && name !== ".."
    && !/[\/\\\0]/.test(name);
}
