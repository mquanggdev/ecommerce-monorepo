import { Response } from "express";
import { domainPublic, siteInfo } from "../configs/variable.config";

type SeoOptions = {
  title: string,
  fullTitle?: boolean, // true: dùng nguyên tiêu đề, không thêm "| Questa"
  description?: string,
  keywords?: string[],
  image?: string,
  ogTitle?: string,
  ogDescription?: string,
  type?: "website" | "product" | "article",
  index?: boolean, // mặc định false: trang phải chủ động bật mới được Google index
  follow?: boolean,
  jsonLd?: object[]
};

// Tiêu đề có tên thương hiệu: "Áo thun | Questa" (đã có chữ Questa thì giữ nguyên)
export const withBrand = (title: string): string => {
  const text = `${title || ""}`.trim();
  if(!text) return siteInfo.name;
  return text.toLowerCase().includes(siteInfo.name.toLowerCase()) ? text : `${text} | ${siteInfo.name}`;
}

// Mô tả cho Google: bỏ thẻ HTML, gộp khoảng trắng, cắt ~160 ký tự ở ranh giới từ
export const toDescription = (text?: string, max: number = 160): string => {
  const plain = `${text || ""}`.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  if(plain.length <= max) return plain;
  const cut = plain.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 80 ? cut.lastIndexOf(" ") : cut.length)}…`;
}

// URL tuyệt đối: ảnh upload (/media/...) nằm ở domainPublic, ảnh giao diện (/client/...) nằm ở chính website
export const toAbsoluteUrl = (res: Response, path?: string): string => {
  if(!path) return "";
  if(/^https?:\/\//.test(path)) return path;
  const base = path.startsWith("/media") ? domainPublic : res.locals.siteOrigin;
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

// Dựng đầy đủ dữ liệu SEO cho layout in ra <head>
export const buildSeo = (res: Response, options: SeoOptions) => {
  const title = options.fullTitle ? options.title : withBrand(options.title);
  const description = toDescription(options.description) || siteInfo.description;
  return {
    title: title,
    description: description,
    keywords: options.keywords || [],
    robots: {
      index: options.index === true,
      follow: options.follow !== false
    },
    og: {
      title: options.ogTitle || title,
      description: toDescription(options.ogDescription) || description,
      image: toAbsoluteUrl(res, options.image || siteInfo.shareImage)
    },
    type: options.type || "website",
    // Chuỗi JSON in thẳng vào <script>: thoát "<" để dữ liệu (tên, mô tả sản phẩm) không đóng được thẻ script
    jsonLd: (options.jsonLd || []).map(item => JSON.stringify(item).replace(/</g, String.fromCharCode(92) + "u003c"))
  };
}

// Dữ liệu cấu trúc cho trang chủ: Google lấy "name" của WebSite làm tên website trên kết quả tìm kiếm
export const homeJsonLd = (res: Response): object[] => {
  const url = `${res.locals.siteOrigin}/`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteInfo.name,
      alternateName: res.locals.siteHost,
      url: url
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: siteInfo.name,
      url: url,
      logo: toAbsoluteUrl(res, siteInfo.logo),
      telephone: siteInfo.telephone
    }
  ];
}

// Dữ liệu cấu trúc sản phẩm: giá VNĐ + còn hàng (có phân loại thì lấy khoảng giá của các phân loại đang bật)
export const productJsonLd = (res: Response, product: any, url: string): object => {
  const activeVariants = (product.variants || []).filter((item: any) => !!item.status && item.status !== "false");
  const prices: number[] = activeVariants.length > 0
    ? activeVariants.map((item: any) => Number(item.priceNew)).filter((price: number) => price > 0)
    : [Number(product.priceNew)].filter((price: number) => price > 0);
  const stock = activeVariants.length > 0
    ? activeVariants.reduce((total: number, item: any) => total + (Number(item.stock) || 0), 0)
    : Number(product.stock) || 0;
  const availability = stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";

  const offers = prices.length > 1 && Math.min(...prices) !== Math.max(...prices)
    ? { "@type": "AggregateOffer", priceCurrency: "VND", lowPrice: Math.min(...prices), highPrice: Math.max(...prices), offerCount: prices.length, availability: availability, url: url }
    : { "@type": "Offer", priceCurrency: "VND", price: prices[0] || 0, availability: availability, url: url };

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: (product.images || []).slice(0, 5).map((image: string) => toAbsoluteUrl(res, image)),
    description: toDescription(product.description, 300),
    sku: product.sku || undefined,
    brand: { "@type": "Brand", name: siteInfo.name },
    offers: offers
  };
}
