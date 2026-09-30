// Dữ liệu mẫu: danh mục, thuộc tính và sản phẩm cho cửa hàng thời trang nam.
// Nội dung chữ tự viết. Ảnh lấy từ Unsplash (giấy phép Unsplash, dùng tự do), mỗi ảnh là một mã "photo-...".

export const COLORS: Record<string, string> = {
  "Trắng": "#ffffff",
  "Đen": "#111111",
  "Xám": "#9ca3af",
  "Xanh navy": "#1e3a5f",
  "Xanh nhạt": "#a9c9e8",
  "Be": "#d9c7a7",
  "Nâu": "#7b4b2a",
  "Xanh rêu": "#4b5d3a",
  "Đỏ đô": "#7a1f2b",
  "Xanh denim": "#3b5b7d",
};

export const SIZES_TOP = ["S", "M", "L", "XL", "XXL"];
export const SIZES_PANTS = ["29", "30", "31", "32", "33", "34"];

// Cây danh mục 2 cấp. avatar lấy từ ảnh đầu tiên của sản phẩm có slug tương ứng.
export const PRODUCT_CATEGORIES = [
  {
    name: "Áo nam", slug: "ao-nam", description: "Áo thun, áo polo và sơ mi cho nam giới.", avatarFrom: "ao-thun-cotton-co-tron-basic",
    children: [
      { name: "Áo thun", slug: "ao-thun-nam", description: "Áo thun cotton mặc hằng ngày.", avatarFrom: "ao-thun-cotton-co-tron-basic" },
      { name: "Áo polo", slug: "ao-polo-nam", description: "Áo polo lịch sự, dễ phối đồ.", avatarFrom: "ao-polo-pique-basic" },
      { name: "Áo sơ mi", slug: "ao-so-mi-nam", description: "Sơ mi công sở và sơ mi dạo phố.", avatarFrom: "so-mi-trang-cong-so-dai-tay" },
    ],
  },
  {
    name: "Quần nam", slug: "quan-nam", description: "Quần jean, quần kaki, quần âu và quần short.", avatarFrom: "quan-jean-slim-fit-xanh-dam",
    children: [
      { name: "Quần jean", slug: "quan-jean-nam", description: "Quần jean nhiều kiểu dáng.", avatarFrom: "quan-jean-slim-fit-xanh-dam" },
      { name: "Quần kaki & quần âu", slug: "quan-kaki-quan-au-nam", description: "Quần kaki và quần âu đi làm.", avatarFrom: "quan-kaki-chino-ong-con" },
      { name: "Quần short", slug: "quan-short-nam", description: "Quần short mặc nhà, đi chơi.", avatarFrom: "quan-short-kaki-tui-xeo" },
    ],
  },
  {
    name: "Áo khoác & giữ ấm", slug: "ao-khoac-giu-am-nam", description: "Áo khoác, hoodie, áo len và blazer.", avatarFrom: "ao-khoac-bomber-lot-du",
    children: [
      { name: "Áo khoác", slug: "ao-khoac-nam", description: "Áo khoác da, bomber, denim, áo gió.", avatarFrom: "ao-khoac-bomber-lot-du" },
      { name: "Hoodie & áo len", slug: "hoodie-ao-len-nam", description: "Hoodie nỉ và áo len dệt kim.", avatarFrom: "hoodie-ni-bong-den" },
      { name: "Blazer", slug: "blazer-nam", description: "Blazer cho công sở và sự kiện.", avatarFrom: "blazer-xanh-navy-hai-khuy" },
    ],
  },
  {
    name: "Phụ kiện", slug: "phu-kien-nam", description: "Thắt lưng, ví, mũ và balo.", avatarFrom: "that-lung-da-bo-khoa-kim",
    children: [
      { name: "Thắt lưng & ví", slug: "that-lung-vi-nam", description: "Thắt lưng da và ví da.", avatarFrom: "that-lung-da-bo-khoa-kim" },
      { name: "Mũ & balo", slug: "mu-balo-nam", description: "Mũ lưỡi trai và balo.", avatarFrom: "mu-luoi-trai-tron-cotton" },
    ],
  },
];

export interface SeedProduct {
  name: string;
  category: string; // slug danh mục con
  priceOld: number;
  priceNew: number;
  flashSale?: boolean;
  sizes?: "top" | "pants";
  colors?: string[];
  stock?: number; // chỉ dùng cho sản phẩm không có biến thể
  images: string[]; // mã ảnh Unsplash
  description: string;
  material: string;
  fit: string;
  features: string[];
  tags: string[];
}

export const PRODUCTS: SeedProduct[] = [
  // ===== Áo thun =====
  {
    name: "Áo thun cotton cổ tròn basic", category: "ao-thun-nam", priceOld: 199000, priceNew: 149000, flashSale: true,
    sizes: "top", colors: ["Trắng", "Đen", "Xám"],
    images: ["photo-1581655353564-df123a1eb820", "photo-1521572163474-6864f9cf17ab", "photo-1651761179569-4ba2aa054997"],
    description: "Chiếc áo thun trơn mặc được quanh năm, phối với quần jean hay quần short đều gọn gàng.",
    material: "100% cotton chải kỹ, định lượng 220gsm", fit: "Regular fit, vừa người",
    features: ["Vải dày vừa, không lộ khi mặc màu trắng", "Bo cổ dệt hai lớp, giặt nhiều không giãn", "Đường may vai có dây gia cố giữ dáng"],
    tags: ["áo thun", "basic", "cotton"],
  },
  {
    name: "Áo thun oversize form rộng", category: "ao-thun-nam", priceOld: 249000, priceNew: 199000,
    sizes: "top", colors: ["Trắng", "Đen", "Be"],
    images: ["photo-1622445275463-afa2ab738c34", "photo-1759572095384-1a7e646d0d4f"],
    description: "Form rộng vai xuôi, mặc thoải mái trong những ngày nóng mà vẫn ra dáng.",
    material: "Cotton 2 chiều, định lượng 250gsm", fit: "Oversize, vai rớt",
    features: ["Thân áo rộng hơn size thường khoảng 6cm", "Tay áo dài qua khuỷu nhẹ", "Vải đứng form, ít nhăn sau khi giặt"],
    tags: ["áo thun", "oversize", "streetwear"],
  },
  {
    name: "Áo thun cotton compact chống nhăn", category: "ao-thun-nam", priceOld: 279000, priceNew: 229000,
    sizes: "top", colors: ["Xanh navy", "Xanh rêu", "Đỏ đô"],
    images: ["photo-1716541424893-734612ddcabb", "photo-1562157873-818bc0726f68", "photo-1523381294911-8d3cead13475"],
    description: "Sợi cotton compact bề mặt mịn, ít xù lông, hợp với người cần áo thun mặc đi làm.",
    material: "Cotton compact 95%, spandex 5%", fit: "Slim fit, ôm nhẹ",
    features: ["Bề mặt vải mịn, hạn chế xù sau nhiều lần giặt", "Co giãn 4 chiều, cử động dễ", "Màu nhuộm hoạt tính, lâu phai"],
    tags: ["áo thun", "cotton compact", "đi làm"],
  },
  // ===== Áo polo =====
  {
    name: "Áo polo pique basic", category: "ao-polo-nam", priceOld: 329000, priceNew: 259000, flashSale: true,
    sizes: "top", colors: ["Đen", "Xám", "Trắng"],
    images: ["photo-1625910513399-c9fcba54338c", "photo-1625910513520-bed0389ce32f", "photo-1625910513394-ea511bed44ca"],
    description: "Polo vải pique cá sấu cổ điển, lịch sự vừa đủ cho cả đi làm lẫn đi chơi.",
    material: "Cotton pique 60%, polyester 40%", fit: "Regular fit",
    features: ["Vải mắt lưới thoáng, thấm mồ hôi nhanh", "Cổ áo dệt bo cứng cáp, không quăn mép", "Xẻ tà hai bên, mặc bỏ ngoài gọn gàng"],
    tags: ["áo polo", "pique", "công sở"],
  },
  {
    name: "Áo polo cotton mềm mát", category: "ao-polo-nam", priceOld: 299000, priceNew: 249000,
    sizes: "top", colors: ["Xanh rêu", "Xám"],
    images: ["photo-1586363129094-d7a38564fae1"],
    description: "Chất cotton mềm rũ nhẹ, mặc mát trong tiết trời nóng ẩm.",
    material: "Cotton 100% sợi mảnh", fit: "Regular fit",
    features: ["Vải mỏng nhẹ, khô nhanh", "Cổ áo may hai lớp giữ phom", "Không in hình, dễ phối với mọi loại quần"],
    tags: ["áo polo", "cotton", "mùa hè"],
  },
  // ===== Áo sơ mi =====
  {
    name: "Sơ mi trắng công sở dài tay", category: "ao-so-mi-nam", priceOld: 399000, priceNew: 329000,
    sizes: "top", colors: ["Trắng", "Xanh nhạt"],
    images: ["photo-1621072156002-e2fccdc0b176", "photo-1603252109612-24fa03d145c8", "photo-1603252109303-2751441dd157"],
    description: "Chiếc sơ mi trắng nên có trong mọi tủ đồ, may trên nền vải ít nhăn để đỡ công là ủi.",
    material: "Cotton 60%, sợi tre 40%", fit: "Slim fit",
    features: ["Vải ít nhăn, chỉ cần treo phẳng sau khi giặt", "Cổ bẻ có lót dựng, đứng dáng khi thắt cà vạt", "Măng séc hai khuy điều chỉnh độ rộng"],
    tags: ["sơ mi", "công sở", "dài tay"],
  },
  {
    name: "Sơ mi Oxford xanh nhạt", category: "ao-so-mi-nam", priceOld: 429000, priceNew: 359000,
    sizes: "top", colors: ["Xanh nhạt", "Trắng"],
    images: ["photo-1620012253295-c15cc3e65df4", "photo-1602810316693-3667c854239a", "photo-1740711152088-88a009e877bb"],
    description: "Vải Oxford dệt kiểu rổ dày dặn, mặc nghiêm túc được mà xắn tay lên cũng rất ổn.",
    material: "Cotton Oxford 100%", fit: "Regular fit",
    features: ["Vải dày vừa, đứng form, bền màu", "Cổ button-down cài khuy hai đầu cổ", "Túi ngực trái may chìm"],
    tags: ["sơ mi", "oxford", "smart casual"],
  },
  {
    name: "Sơ mi kẻ sọc dọc", category: "ao-so-mi-nam", priceOld: 389000, priceNew: 319000, flashSale: true,
    sizes: "top", colors: ["Xanh nhạt", "Xanh navy"],
    images: ["photo-1594938291221-94f18cbb5660", "photo-1598033129183-c4f50c736f10", "photo-1603252110481-7ba873bf42ab"],
    description: "Họa tiết sọc dọc mảnh giúp dáng người trông cao và gọn hơn.",
    material: "Cotton poplin 100%", fit: "Slim fit",
    features: ["Sọc dệt trực tiếp trên vải, không phải in", "Vải poplin mỏng nhẹ, mát", "Khớp sọc ở nẹp và túi áo"],
    tags: ["sơ mi", "kẻ sọc", "công sở"],
  },
  {
    name: "Sơ mi flannel caro", category: "ao-so-mi-nam", priceOld: 369000, priceNew: 299000,
    sizes: "top", colors: ["Đỏ đô", "Xanh navy"],
    images: ["photo-1627153559528-476916f98ecc", "photo-1618595426380-10f004788ee6"],
    description: "Flannel chải lông mềm, mặc riêng hay khoác ngoài áo thun đều hợp với ngày se lạnh.",
    material: "Cotton flannel chải hai mặt", fit: "Regular fit",
    features: ["Vải chải lông mềm, giữ ấm nhẹ", "Hai túi ngực có nắp", "Mặc như áo khoác mỏng khi trời mát"],
    tags: ["sơ mi", "flannel", "caro"],
  },
  // ===== Quần jean =====
  {
    name: "Quần jean slim fit xanh đậm", category: "quan-jean-nam", priceOld: 499000, priceNew: 399000,
    sizes: "pants", colors: ["Xanh denim", "Đen"],
    images: ["photo-1714143136372-ddaf8b606da7", "photo-1714143136367-7bb68f3f0669"],
    description: "Dáng slim ôm vừa phải, màu chàm đậm dễ mặc đi làm lẫn đi chơi.",
    material: "Denim cotton 98%, spandex 2%, 12oz", fit: "Slim fit, ống côn nhẹ",
    features: ["Co giãn nhẹ, ngồi lâu không bí", "Wash một màu, không mài rách", "Khóa kéo kim loại, đinh tán gia cố túi"],
    tags: ["quần jean", "slim fit", "denim"],
  },
  {
    name: "Quần jean ống suông xanh nhạt", category: "quan-jean-nam", priceOld: 529000, priceNew: 449000,
    sizes: "pants", colors: ["Xanh denim", "Xanh nhạt"],
    images: ["photo-1713880453396-aa0493e308ec", "photo-1715758890151-2c15d5d482aa", "photo-1721637222188-fa7bf56ceaf5"],
    description: "Ống suông rộng rãi theo tinh thần thập niên 90, mặc thoáng và dễ chịu.",
    material: "Denim cotton 100%, 13oz", fit: "Straight fit, ống suông",
    features: ["Wash sáng màu tự nhiên", "Ống đứng từ đùi xuống gấu", "Vải dày, càng mặc càng mềm"],
    tags: ["quần jean", "ống suông", "vintage"],
  },
  {
    name: "Quần jean đen rách gối", category: "quan-jean-nam", priceOld: 549000, priceNew: 429000, flashSale: true,
    sizes: "pants", colors: ["Đen"],
    images: ["photo-1511196044526-5cb3bcb7071b"],
    description: "Chi tiết rách gối vừa đủ cá tính, màu đen giữ cho tổng thể vẫn gọn.",
    material: "Denim cotton 97%, spandex 3%", fit: "Skinny fit",
    features: ["Rách gối có lót vải phía trong", "Co giãn tốt, ôm chân", "Màu đen nhuộm sâu, hạn chế bạc màu"],
    tags: ["quần jean", "rách gối", "streetwear"],
  },
  // ===== Quần kaki & quần âu =====
  {
    name: "Quần kaki chino ống côn", category: "quan-kaki-quan-au-nam", priceOld: 449000, priceNew: 369000,
    sizes: "pants", colors: ["Be", "Nâu", "Xanh navy"],
    images: ["photo-1473966968600-fa801b869a1a", "photo-1609259886986-a642e7e1dbf9", "photo-1593030761757-71fae45fa0e7"],
    description: "Chiếc chino cân bằng giữa lịch sự và thoải mái, đi làm hay đi cà phê đều mặc được.",
    material: "Cotton twill 97%, spandex 3%", fit: "Slim fit, ống côn",
    features: ["Vải twill chéo bền, ít bám bụi", "Túi sau may viền có khuy cài", "Gấu quần có thể xắn lộ mắt cá"],
    tags: ["quần kaki", "chino", "smart casual"],
  },
  {
    name: "Quần âu công sở ống đứng", category: "quan-kaki-quan-au-nam", priceOld: 499000, priceNew: 419000,
    sizes: "pants", colors: ["Đen", "Xám", "Xanh navy"],
    images: ["photo-1622450180332-3da1126f10a4", "photo-1624835567150-0c530a20d8cc", "photo-1624835589323-442670703bc0"],
    description: "Quần âu ly thẳng, đứng dáng suốt ngày dài mà không cần ủi lại.",
    material: "Polyester 65%, viscose 32%, spandex 3%", fit: "Regular fit, ống đứng",
    features: ["Vải ít nhăn, giữ ly tốt", "Cạp có móc cài và khuy phụ bên trong", "Lót túi vải cotton thoáng"],
    tags: ["quần âu", "công sở", "lịch sự"],
  },
  {
    name: "Quần kaki ống đứng màu kem", category: "quan-kaki-quan-au-nam", priceOld: 429000, priceNew: 349000,
    sizes: "pants", colors: ["Be", "Trắng"],
    images: ["photo-1627976238251-a0191b91145b"],
    description: "Tông kem sáng làm bừng bộ đồ, hợp với áo tối màu hoặc sơ mi kẻ.",
    material: "Cotton kaki 100%", fit: "Straight fit",
    features: ["Vải kaki dày vừa, không lộ", "Ống đứng, hợp nhiều dáng người", "Dễ phối với giày da lẫn sneaker"],
    tags: ["quần kaki", "màu kem", "dạo phố"],
  },
  // ===== Quần short =====
  {
    name: "Quần short kaki túi xéo", category: "quan-short-nam", priceOld: 279000, priceNew: 219000,
    sizes: "pants", colors: ["Be", "Xanh rêu", "Xanh navy"],
    images: ["photo-1621496503717-095a410e1566", "photo-1697319452360-ee47502e39f6"],
    description: "Short kaki dài trên gối, mặc mát và vẫn đủ chỉn chu để ra phố.",
    material: "Cotton kaki 100%", fit: "Regular fit, dài trên gối",
    features: ["Cạp có đỉa, đeo được thắt lưng", "Túi xéo sâu, để vừa điện thoại", "Vải đã giặt mềm trước khi may"],
    tags: ["quần short", "kaki", "mùa hè"],
  },
  {
    name: "Quần short thể thao nhanh khô", category: "quan-short-nam", priceOld: 229000, priceNew: 169000, flashSale: true,
    sizes: "top", colors: ["Đen", "Xanh navy"],
    images: ["photo-1617953644310-e690da9be982", "photo-1587249247014-079373c40427"],
    description: "Vải gió mỏng nhẹ, khô nhanh, dùng để tập luyện hoặc đi biển.",
    material: "Polyester 100% dệt mịn", fit: "Relaxed fit, cạp chun",
    features: ["Cạp chun có dây rút", "Lót lưới thoáng khí bên trong", "Túi sau có khóa kéo"],
    tags: ["quần short", "thể thao", "đi biển"],
  },
  // ===== Áo khoác =====
  {
    name: "Áo khoác da biker", category: "ao-khoac-nam", priceOld: 1290000, priceNew: 990000,
    sizes: "top", colors: ["Đen", "Nâu"],
    images: ["photo-1675877879221-871aa9f7c314", "photo-1602525582399-7ef5f604ff7e", "photo-1632958978877-69406b688b11"],
    description: "Áo da dáng biker cổ bẻ khóa chéo, khoác lên là bộ đồ có ngay điểm nhấn.",
    material: "Da PU cao cấp, lót polyester", fit: "Slim fit, dài ngang hông",
    features: ["Khóa kéo kim loại chống gỉ", "Ba túi khóa kéo phía trước", "Lớp lót trơn, dễ mặc ngoài áo len"],
    tags: ["áo khoác", "áo da", "biker"],
  },
  {
    name: "Áo khoác bomber lót dù", category: "ao-khoac-nam", priceOld: 690000, priceNew: 549000, flashSale: true,
    sizes: "top", colors: ["Xanh rêu", "Đen", "Nâu"],
    images: ["photo-1591047139829-d91aecb6caea", "photo-1629353689974-af4d5c70440f", "photo-1629354113452-871f6aa61d39"],
    description: "Dáng bomber cổ điển với bo gấu và bo tay, gọn gàng và dễ mặc.",
    material: "Vải dù polyester, lót chần bông mỏng", fit: "Regular fit",
    features: ["Cản gió, chống thấm nước nhẹ", "Bo cổ, tay và gấu dệt co giãn", "Túi tay áo có khóa kéo"],
    tags: ["áo khoác", "bomber", "thu đông"],
  },
  {
    name: "Áo khoác denim xanh wash", category: "ao-khoac-nam", priceOld: 649000, priceNew: 529000,
    sizes: "top", colors: ["Xanh denim", "Xanh nhạt"],
    images: ["photo-1516257984-b1b4d707412e", "photo-1555583743-991174c11425", "photo-1527016021513-b09758b777bd"],
    description: "Áo khoác jean trucker kinh điển, càng mặc càng lên màu đẹp.",
    material: "Denim cotton 100%, 12oz", fit: "Regular fit, dài ngang hông",
    features: ["Hai túi ngực có nắp cài khuy", "Khuy kim loại khắc chìm", "Wash nhẹ, màu xanh tự nhiên"],
    tags: ["áo khoác", "denim", "trucker"],
  },
  {
    name: "Áo khoác denim đen", category: "ao-khoac-nam", priceOld: 669000, priceNew: 559000,
    sizes: "top", colors: ["Đen"],
    images: ["photo-1549237511-bbe6a0979d6a"],
    description: "Phiên bản đen của chiếc áo jean quen thuộc, mặc tối màu từ đầu đến chân rất hợp.",
    material: "Denim cotton 99%, spandex 1%", fit: "Slim fit",
    features: ["Màu đen nhuộm sâu", "Có túi trong để ví hoặc điện thoại", "Chỉ may đồng màu, tối giản"],
    tags: ["áo khoác", "denim", "màu đen"],
  },
  {
    name: "Áo khoác gió hai lớp", category: "ao-khoac-nam", priceOld: 590000, priceNew: 459000,
    sizes: "top", colors: ["Nâu", "Xanh navy", "Be"],
    images: ["photo-1620228922597-cca58f177310", "photo-1624548140129-74786c5f1279"],
    description: "Nhẹ, gấp gọn được, đủ chắn gió và mưa phùn cho những ngày giao mùa.",
    material: "Vải gió polyester, lót lưới", fit: "Regular fit",
    features: ["Trượt nước ở mưa nhỏ", "Mũ trùm có dây rút, tháo rời được", "Gấp gọn vào túi áo khi không dùng"],
    tags: ["áo khoác", "áo gió", "đi mưa"],
  },
  // ===== Hoodie & áo len =====
  {
    name: "Hoodie nỉ bông đen", category: "hoodie-ao-len-nam", priceOld: 459000, priceNew: 369000,
    sizes: "top", colors: ["Đen", "Nâu"],
    images: ["photo-1596075780750-81249df16d19", "photo-1677538537484-324385aff147", "photo-1578768079052-aa76e52ff62e"],
    description: "Hoodie nỉ bông dày dặn, mặt trong chải lông ấm áp.",
    material: "Nỉ bông cotton 80%, polyester 20%, 350gsm", fit: "Regular fit",
    features: ["Mặt trong chải bông mềm, giữ ấm tốt", "Mũ hai lớp có dây rút", "Túi kangaroo phía trước"],
    tags: ["hoodie", "nỉ bông", "thu đông"],
  },
  {
    name: "Hoodie nỉ trơn sáng màu", category: "hoodie-ao-len-nam", priceOld: 439000, priceNew: 359000, flashSale: true,
    sizes: "top", colors: ["Trắng", "Xám"],
    images: ["photo-1738486260590-23c954cf29b8", "photo-1564557287817-3785e38ec1f5", "photo-1611817757591-c3f345024273"],
    description: "Tông sáng trẻ trung, không in hình, mặc với quần jean hay jogger đều đẹp.",
    material: "Nỉ da cá cotton 100%, 320gsm", fit: "Oversize nhẹ",
    features: ["Vải nỉ da cá thoáng, không bí", "Bo tay và gấu dệt co giãn", "Không xù lông sau khi giặt"],
    tags: ["hoodie", "basic", "streetwear"],
  },
  {
    name: "Áo len dệt kim cổ tròn", category: "hoodie-ao-len-nam", priceOld: 479000, priceNew: 389000,
    sizes: "top", colors: ["Đen", "Xám", "Đỏ đô"],
    images: ["photo-1611312449297-a69dc9c3987b", "photo-1599032909736-0155c1d43a6c", "photo-1760013531865-89ff324f83a6"],
    description: "Áo len mỏng vừa, mặc riêng hoặc lồng sơ mi bên trong đều lịch sự.",
    material: "Sợi acrylic 70%, len 30%", fit: "Regular fit",
    features: ["Dệt kim mịn, không ngứa", "Bo cổ, tay và gấu đàn hồi tốt", "Giặt máy được ở chế độ nhẹ"],
    tags: ["áo len", "dệt kim", "thu đông"],
  },
  // ===== Blazer =====
  {
    name: "Blazer xanh navy hai khuy", category: "blazer-nam", priceOld: 1190000, priceNew: 949000,
    sizes: "top", colors: ["Xanh navy"],
    images: ["photo-1617137968427-85924c800a22", "photo-1617137984095-74e4e5e3613f", "photo-1593030103066-0093718efeb9"],
    description: "Blazer xanh navy là món đa dụng nhất: mặc cùng quần âu thành đồ công sở, cùng quần jean thành smart casual.",
    material: "Polyester 70%, viscose 28%, spandex 2%", fit: "Slim fit",
    features: ["Ve áo nhọn vừa, hai khuy", "Lót nửa thân, thoáng khi mặc", "Túi ngực và hai túi nắp"],
    tags: ["blazer", "công sở", "smart casual"],
  },
  {
    name: "Blazer đen cổ điển", category: "blazer-nam", priceOld: 1250000, priceNew: 990000,
    sizes: "top", colors: ["Đen", "Xám"],
    images: ["photo-1618886614638-80e3c103d31a", "photo-1617127365659-c47fa864d8bc", "photo-1622497170185-5d668f816a56"],
    description: "Dáng blazer cổ điển cho các dịp trang trọng, cắt may gọn ở vai và eo.",
    material: "Vải tuyết mưa pha wool", fit: "Slim fit",
    features: ["Đệm vai mỏng, lên dáng tự nhiên", "Xẻ tà sau giúp dễ ngồi", "Bốn khuy tay áo"],
    tags: ["blazer", "sự kiện", "lịch sự"],
  },
  // ===== Phụ kiện =====
  {
    name: "Thắt lưng da bò khóa kim", category: "that-lung-vi-nam", priceOld: 349000, priceNew: 279000, stock: 60,
    colors: ["Nâu", "Đen"],
    images: ["photo-1664286074176-5206ee5dc878", "photo-1624222247344-550fb60583dc", "photo-1711443982852-b3df5c563448"],
    description: "Thắt lưng da bò bản 3,5cm, khóa kim cổ điển đi được với cả quần âu lẫn quần jean.",
    material: "Da bò thật, khóa hợp kim mạ", fit: "Dài 120cm, cắt ngắn được",
    features: ["Da một lớp dày, không bong tróc", "Viền may chỉ sáp", "Có sẵn 5 lỗ, đục thêm được"],
    tags: ["thắt lưng", "da bò", "phụ kiện"],
  },
  {
    name: "Ví da gập đôi", category: "that-lung-vi-nam", priceOld: 399000, priceNew: 319000, stock: 45,
    colors: ["Nâu", "Đen"],
    images: ["photo-1579014134953-1580d7f123f3", "photo-1620109176813-e91290f6c795", "photo-1612023395494-1c4050b68647"],
    description: "Ví gập đôi mỏng, để vừa túi quần trước mà không cộm.",
    material: "Da bò sáp", fit: "11 x 9,5 cm",
    features: ["6 ngăn thẻ, 2 ngăn tiền", "Da sáp lên màu theo thời gian", "Đường may tay ở các góc"],
    tags: ["ví da", "phụ kiện", "quà tặng"],
  },
  {
    name: "Mũ lưỡi trai trơn cotton", category: "mu-balo-nam", priceOld: 179000, priceNew: 129000, stock: 80, flashSale: true,
    colors: ["Trắng", "Xám", "Đen"],
    images: ["photo-1691256676359-20e5c6d4bc92", "photo-1678721938524-1a3ee398de2a"],
    description: "Mũ lưỡi trai trơn không logo, che nắng và hoàn thiện bộ đồ dạo phố.",
    material: "Cotton kaki 100%", fit: "Freesize, khóa sau điều chỉnh",
    features: ["Khóa kim loại phía sau chỉnh vòng đầu", "6 lỗ thoáng khí", "Lưỡi trai cong sẵn"],
    tags: ["mũ", "lưỡi trai", "phụ kiện"],
  },
  {
    name: "Balo da phối vải canvas", category: "mu-balo-nam", priceOld: 690000, priceNew: 549000, stock: 30,
    colors: ["Nâu", "Đen"],
    images: ["photo-1622560481156-01fc7e1693e6", "photo-1642375352634-ad952121fdb3", "photo-1549943872-f7ff0b2b51be"],
    description: "Balo đựng vừa laptop 15 inch, đủ gọn để đi làm và đủ rộng cho chuyến đi ngắn ngày.",
    material: "Canvas chống thấm, phối da PU", fit: "42 x 30 x 14 cm",
    features: ["Ngăn laptop có đệm chống sốc", "Quai đeo đệm mút, điều chỉnh được", "Túi hông để bình nước"],
    tags: ["balo", "laptop", "phụ kiện"],
  },
];
