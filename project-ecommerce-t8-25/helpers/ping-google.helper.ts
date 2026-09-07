
import axios from "axios";
import { getGeneral } from "../configs/setting.config";

// Chủ động thông báo cho gg là pje của ta có thêm sản phẩm hoặc bài viết mới
export const pingGoogleSitemap = async () => {
  try {
    const settingGeneral = await getGeneral();
    const domain = settingGeneral.domainWebsite;
    const sitemapUrl = `${domain}/sitemap.xml`;
    const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    await axios.get(pingUrl);
    console.log("Ping Google sitemap thành công");
  } catch (error) {
    console.error(error);
    console.error("Ping Google sitemap thất bại");
  }
};