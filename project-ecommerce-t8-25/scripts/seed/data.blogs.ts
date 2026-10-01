// Dữ liệu mẫu: danh mục bài viết và bài viết về thời trang nam. Nội dung tự viết.

export const BLOG_CATEGORIES = [
  { name: "Phối đồ", slug: "phoi-do", description: "Gợi ý kết hợp trang phục cho từng hoàn cảnh." },
  { name: "Xu hướng", slug: "xu-huong", description: "Những gì đang được mặc nhiều trong mùa này." },
  { name: "Bảo quản trang phục", slug: "bao-quan-trang-phuc", description: "Giặt, phơi, cất giữ để quần áo bền lâu." },
  { name: "Chọn size & kiểu dáng", slug: "chon-size-kieu-dang", description: "Cách chọn đúng cỡ và đúng dáng cho cơ thể." },
  { name: "Thời trang công sở", slug: "thoi-trang-cong-so", description: "Ăn mặc chỉn chu khi đi làm." },
];

export interface SeedBlog {
  name: string;
  category: string; // slug danh mục
  image: string; // mã ảnh Unsplash
  description: string;
  sections: [string, string][]; // [tiêu đề mục, nội dung]
}

export const BLOGS: SeedBlog[] = [
  // ===== Phối đồ =====
  {
    name: "5 cách phối áo thun trắng không bao giờ lỗi mốt", category: "phoi-do", image: "photo-1617114919297-3c8ddb01f599",
    description: "Áo thun trắng là món dễ mặc nhất trong tủ đồ, nhưng phối sao cho không nhạt lại là chuyện khác.",
    sections: [
      ["Với quần jean xanh đậm", "Đây là công thức kinh điển. Chọn áo vừa vai, sơ vin hờ phần trước và thêm một đôi sneaker trắng là đủ gọn gàng cho cuối tuần."],
      ["Khoác ngoài sơ mi flannel", "Khi trời se lạnh, một chiếc sơ mi caro mở khuy khoác bên ngoài tạo thêm lớp lang cho bộ đồ mà không cần đến áo khoác dày."],
      ["Dưới blazer", "Thay sơ mi bằng áo thun trắng bên trong blazer là cách nhanh nhất để bộ đồ công sở trông trẻ hơn. Nhớ chọn áo có cổ bo đứng, không bị chảy."],
    ],
  },
  {
    name: "Phối đồ layer cho ngày giao mùa", category: "phoi-do", image: "photo-1642886513448-6e6997b8de4a",
    description: "Sáng lạnh, trưa nắng, chiều gió: mặc nhiều lớp mỏng là lời giải hợp lý nhất.",
    sections: [
      ["Nguyên tắc ba lớp", "Lớp trong cùng mỏng và thấm mồ hôi, lớp giữa giữ ấm, lớp ngoài chắn gió. Mỗi lớp nên cởi ra được mà bộ đồ vẫn ổn."],
      ["Chơi với độ dài", "Để lớp trong dài hơn lớp ngoài một chút sẽ tạo chiều sâu cho bộ đồ. Áo thun dài hơn áo len, áo len ngắn hơn áo khoác là một thứ tự dễ áp dụng."],
      ["Giới hạn màu sắc", "Ba màu là đủ. Hai màu trung tính làm nền và một màu nhấn ở lớp giữa sẽ giúp tổng thể không bị rối."],
    ],
  },
  {
    name: "Mặc gì khi đi cà phê cuối tuần", category: "phoi-do", image: "photo-1636590416708-68a4867918f1",
    description: "Thoải mái nhưng không xuề xòa: vài gợi ý cho buổi hẹn bạn bè ngày nghỉ.",
    sections: [
      ["Polo và quần short kaki", "Bộ đôi này mát, gọn và lịch sự hơn áo thun một bậc. Chọn quần dài trên gối khoảng một gang tay để chân trông cân đối."],
      ["Sơ mi Oxford xắn tay", "Một chiếc Oxford xanh nhạt xắn tay lên khuỷu, mặc cùng chino màu be, gần như không thể sai."],
      ["Đừng quên phụ kiện", "Mũ lưỡi trai trơn hoặc một chiếc đồng hồ dây da đủ để bộ đồ đơn giản có điểm nhìn."],
    ],
  },
  {
    name: "Quần jean và áo khoác denim: mặc cùng nhau thế nào cho đúng", category: "phoi-do", image: "photo-1620834767726-61b1986287ff",
    description: "Denim trên denim từng bị coi là cấm kỵ. Thật ra chỉ cần nhớ một quy tắc.",
    sections: [
      ["Khác tông màu", "Hai món denim nên lệch nhau rõ ràng về độ đậm nhạt. Áo sáng với quần tối, hoặc ngược lại, sẽ tránh được cảm giác mặc đồ bộ."],
      ["Tách bằng lớp giữa", "Một chiếc áo thun trắng hay xám ở giữa giúp ngắt mảng xanh và làm bộ đồ dễ nhìn hơn."],
      ["Giày quyết định phong cách", "Boots da đưa bộ đồ về hướng bụi bặm, còn sneaker trắng giữ cho mọi thứ nhẹ nhàng, trẻ trung."],
    ],
  },
  {
    name: "Tủ đồ tối giản: 10 món đủ mặc cả tuần", category: "phoi-do", image: "photo-1713943189183-c5a9dde63b45",
    description: "Ít đồ hơn nhưng món nào cũng phối được với nhau, buổi sáng sẽ đỡ mất thời gian.",
    sections: [
      ["Danh sách cốt lõi", "Hai áo thun trơn, hai sơ mi, một polo, một quần jean đậm màu, một chino, một quần âu, một áo khoác và một blazer. Tất cả theo tông trung tính."],
      ["Vì sao nên chọn màu trung tính", "Trắng, đen, xám, navy và be gần như kết hợp được với nhau theo mọi cách. Mười món có thể tạo ra hơn ba mươi bộ khác nhau."],
      ["Đầu tư vào chất liệu", "Khi số lượng ít đi, mỗi món phải chịu mặc nhiều hơn. Vải tốt và đường may chắc sẽ đáng tiền hơn nhiều kiểu dáng lạ."],
    ],
  },
  // ===== Xu hướng =====
  {
    name: "Quần ống suông trở lại: vì sao và mặc thế nào", category: "xu-huong", image: "photo-1589270216117-7972b3082c7d",
    description: "Sau nhiều năm skinny thống trị, ống quần đang rộng dần ra.",
    sections: [
      ["Thoải mái là lý do chính", "Ống suông cho chân không gian cử động và thoáng hơn hẳn trong khí hậu nóng ẩm. Đó là lý do xu hướng này bám trụ chứ không chỉ thoáng qua."],
      ["Cân bằng phần trên", "Quần rộng nên đi cùng áo vừa hoặc hơi ôm. Nếu cả hai đều rộng, hãy sơ vin để lộ thắt lưng và định lại tỷ lệ cơ thể."],
      ["Độ dài gấu quần", "Gấu chạm nhẹ mu giày là đẹp nhất. Dài hơn sẽ bị dồn đống, ngắn hơn sẽ khiến dáng quần mất tự nhiên."],
    ],
  },
  {
    name: "Màu đất lên ngôi trong tủ đồ nam", category: "xu-huong", image: "photo-1619603364937-8d7af41ef206",
    description: "Be, nâu, xanh rêu: những gam màu trầm đang thay thế dần đen và trắng.",
    sections: [
      ["Dễ mặc hơn bạn nghĩ", "Màu đất hợp với hầu hết tông da và không kén dáng. Bắt đầu bằng một chiếc chino be hoặc áo khoác xanh rêu là an toàn nhất."],
      ["Phối cùng tông", "Mặc nhiều sắc độ của cùng một màu, ví dụ be nhạt với nâu đậm, tạo cảm giác có chủ ý mà không cần cầu kỳ."],
      ["Điểm sáng bằng màu trắng", "Một chiếc áo thun trắng bên trong giúp bộ đồ màu đất không bị tối và nặng."],
    ],
  },
  {
    name: "Áo polo không còn là đồ của các chú", category: "xu-huong", image: "photo-1581381685617-4dc270458aa6",
    description: "Dáng áo gọn hơn, chất vải mới hơn, polo đang được người trẻ mặc lại.",
    sections: [
      ["Thay đổi ở phom dáng", "Polo bây giờ ôm vừa vai, tay áo ngắn hơn và thân áo không còn thụng. Chỉ riêng điều đó đã khiến chiếc áo trẻ ra nhiều."],
      ["Mặc bỏ ngoài", "Trừ khi đi làm, polo mặc bỏ ngoài với quần short hoặc jean trông tự nhiên hơn là sơ vin."],
      ["Chi tiết viền", "Đường viền tương phản trên cổ và tay áo gợi cảm giác thể thao cổ điển, là điểm nhấn vừa đủ."],
    ],
  },
  {
    name: "Bomber, denim hay áo da: chọn áo khoác nào cho mùa này", category: "xu-huong", image: "photo-1504593811423-6dd665756598",
    description: "Ba kiểu áo khoác phổ biến nhất và hoàn cảnh phù hợp của từng kiểu.",
    sections: [
      ["Bomber cho ngày thường", "Nhẹ, gọn và dễ phối nhất. Bomber hợp với áo thun, hoodie và gần như mọi loại quần."],
      ["Denim cho phong cách bụi", "Áo khoác jean bền và càng cũ càng đẹp. Nó kém cản gió hơn nhưng bù lại mặc được nhiều mùa."],
      ["Áo da cho buổi tối", "Áo da tạo ấn tượng mạnh nhất. Nên chọn dáng ôm vừa và để nó là điểm nhấn duy nhất của bộ đồ."],
    ],
  },
  {
    name: "Hoodie mặc đi làm được không", category: "xu-huong", image: "photo-1539125530496-3ca408f9c2d9",
    description: "Câu trả lời là có, nếu chọn đúng chiếc và mặc đúng cách.",
    sections: [
      ["Chọn hoodie trơn, màu trầm", "Hoodie không in hình, màu đen, xám hoặc navy trông gọn gàng hơn nhiều so với loại có logo lớn."],
      ["Khoác blazer bên ngoài", "Kết hợp này cân bằng giữa thoải mái và chỉn chu, phù hợp với môi trường công sở không quá nghiêm ngặt."],
      ["Giữ phần dưới lịch sự", "Quần chino hoặc quần âu cùng giày da sẽ kéo tổng thể về phía nghiêm túc."],
    ],
  },
  // ===== Bảo quản trang phục =====
  {
    name: "Giặt quần jean thế nào để không bạc màu", category: "bao-quan-trang-phuc", image: "photo-1582735689369-4fe89db7114c",
    description: "Quần jean không cần giặt thường xuyên như bạn vẫn làm.",
    sections: [
      ["Giặt ít lại", "Sau năm đến sáu lần mặc mới cần giặt, trừ khi quần bẩn thật sự. Giữa các lần giặt, chỉ cần phơi quần ở nơi thoáng gió."],
      ["Lộn trái và dùng nước lạnh", "Lộn trái quần giúp mặt ngoài ít cọ xát. Nước lạnh giữ màu chàm tốt hơn nước ấm rất nhiều."],
      ["Không sấy nhiệt cao", "Nhiệt làm sợi co giãn trong vải nhanh hỏng. Phơi tự nhiên trong bóng râm là tốt nhất."],
    ],
  },
  {
    name: "Cách gấp và cất áo len không bị giãn", category: "bao-quan-trang-phuc", image: "photo-1635274605638-d44babc08a4f",
    description: "Treo áo len lên móc là cách nhanh nhất để làm hỏng nó.",
    sections: [
      ["Luôn gấp, không treo", "Trọng lượng của áo len sẽ kéo giãn phần vai khi treo lâu ngày. Gấp phẳng và xếp chồng là cách đúng."],
      ["Giặt tay hoặc chế độ nhẹ", "Dùng nước lạnh và nước giặt dịu nhẹ. Không vắt xoắn, chỉ ép nhẹ cho ráo nước."],
      ["Phơi nằm ngang", "Trải áo trên mặt phẳng có lót khăn khô để áo giữ nguyên dáng trong lúc khô."],
    ],
  },
  {
    name: "Bảo quản áo da đúng cách", category: "bao-quan-trang-phuc", image: "photo-1567113463300-102a7eb3cb26",
    description: "Một chiếc áo da tốt có thể mặc cả chục năm nếu được chăm sóc đúng.",
    sections: [
      ["Tránh nước và nắng gắt", "Nước làm da cứng lại, nắng làm da khô và nứt. Nếu áo bị ướt, lau bằng khăn mềm rồi để khô tự nhiên."],
      ["Dùng móc bản to", "Móc mảnh sẽ để lại vết hằn trên vai áo. Móc gỗ bản rộng giữ dáng áo tốt hơn."],
      ["Dưỡng da định kỳ", "Mỗi vài tháng, thoa một lớp kem dưỡng da chuyên dụng để bề mặt luôn mềm."],
    ],
  },
  {
    name: "Là ủi sơ mi nhanh trong 3 phút", category: "bao-quan-trang-phuc", image: "photo-1504198458649-3128b932f49e",
    description: "Thứ tự là ủi quyết định tốc độ và độ phẳng của chiếc áo.",
    sections: [
      ["Bắt đầu từ cổ áo", "Là mặt trong cổ trước, từ hai đầu vào giữa, rồi mới đến mặt ngoài."],
      ["Tiếp theo là cầu vai và tay áo", "Phần cầu vai và măng séc khó nhất nên làm khi áo còn hơi ẩm."],
      ["Thân áo cuối cùng", "Là thân trước có khuy trước, vòng ra thân sau rồi kết thúc ở thân trước còn lại. Treo lên móc ngay sau khi xong."],
    ],
  },
  {
    name: "Khử mùi quần áo mà không cần giặt", category: "bao-quan-trang-phuc", image: "photo-1548768041-2fceab4c0b85",
    description: "Vài mẹo cho những món đồ chưa bẩn nhưng đã ám mùi.",
    sections: [
      ["Phơi gió qua đêm", "Treo đồ ở nơi thoáng, tránh nắng trực tiếp. Phần lớn mùi sẽ tự bay sau một đêm."],
      ["Dùng hơi nước", "Treo quần áo trong phòng tắm lúc xả nước nóng. Hơi nước vừa khử mùi vừa làm phẳng nếp nhăn nhẹ."],
      ["Xịt khử mùi vải", "Chọn loại không mùi hoặc mùi nhẹ, xịt cách vải khoảng hai gang tay và để khô hẳn trước khi mặc."],
    ],
  },
  // ===== Chọn size & kiểu dáng =====
  {
    name: "Hướng dẫn chọn size áo thun theo chiều cao và cân nặng", category: "chon-size-kieu-dang", image: "photo-1743877428895-fd3aabd06528",
    description: "Bảng size chỉ là điểm bắt đầu. Đây là cách đọc nó cho đúng.",
    sections: [
      ["Đo vai trước tiên", "Đường may vai nên nằm đúng mỏm vai. Vai vừa thì áo gần như chắc chắn vừa, các số đo khác có thể châm chước."],
      ["Tham khảo theo cân nặng", "Dưới 60kg thường mặc S, từ 60 đến 68kg mặc M, từ 68 đến 76kg mặc L, trên mức đó chọn XL hoặc XXL. Người cao trên 1m75 nên tăng một cỡ."],
      ["Khi ở giữa hai cỡ", "Chọn cỡ lớn hơn nếu bạn thích mặc thoải mái, vì áo cotton thường co nhẹ sau vài lần giặt."],
    ],
  },
  {
    name: "Slim fit, regular fit, oversize khác nhau ra sao", category: "chon-size-kieu-dang", image: "photo-1549037173-e3b717902c57",
    description: "Ba thuật ngữ xuất hiện trên mọi nhãn áo và ý nghĩa thực tế của chúng.",
    sections: [
      ["Slim fit", "Ôm theo đường cơ thể, thu gọn ở eo và tay. Hợp với người gầy hoặc cân đối, tạo cảm giác gọn gàng."],
      ["Regular fit", "Dáng suông vừa phải, có độ dư để cử động. Đây là lựa chọn an toàn cho hầu hết dáng người."],
      ["Oversize", "Rộng có chủ ý, vai rớt và thân dài. Nên chọn đúng size của mình thay vì tăng cỡ một chiếc áo thường."],
    ],
  },
  {
    name: "Cách chọn size quần jean chuẩn ngay lần đầu", category: "chon-size-kieu-dang", image: "photo-1764779169349-a5adca68947c",
    description: "Hai con số trên nhãn quần nói lên điều gì và đo chúng như thế nào.",
    sections: [
      ["Đo vòng eo", "Quấn thước dây quanh eo, ngay trên xương hông, không siết chặt. Số đo tính bằng inch chính là cỡ quần."],
      ["Chọn độ dài ống", "Đo từ đáy quần xuống mắt cá chân của một chiếc quần bạn đang mặc vừa. Quần dài quá có thể lên gấu, nhưng ngắn quá thì không sửa được."],
      ["Thử ngồi xuống", "Quần jean vừa khi đứng có thể chật khi ngồi. Hãy thử ngồi xổm một lần trước khi quyết định."],
    ],
  },
  {
    name: "Người thấp nên mặc gì để trông cao hơn", category: "chon-size-kieu-dang", image: "photo-1627379114594-7aff6664cd94",
    description: "Không cần giày độn đế. Tỷ lệ và màu sắc làm được nhiều hơn thế.",
    sections: [
      ["Mặc cùng tông trên dưới", "Áo và quần cùng gam màu tạo một đường thẳng liền mạch, khiến cơ thể trông dài hơn."],
      ["Tránh áo quá dài", "Áo che hết mông sẽ làm chân ngắn lại. Gấu áo nên dừng ở khoảng giữa khóa quần."],
      ["Chọn quần ống gọn", "Ống côn nhẹ, không dồn vải ở mắt cá, kéo dài đôi chân hơn ống rộng thùng thình."],
    ],
  },
  {
    name: "Chọn áo sơ mi vừa vặn: 4 điểm cần kiểm tra", category: "chon-size-kieu-dang", image: "photo-1743877428891-7b05eb7b4444",
    description: "Một chiếc sơ mi vừa người khác hẳn một chiếc đúng size trên nhãn.",
    sections: [
      ["Cổ và vai", "Cài khuy cổ, bạn nên luồn vừa hai ngón tay. Đường may vai phải nằm đúng mỏm vai."],
      ["Ngực và eo", "Khi cài hết khuy, vải giữa các khuy không được kéo căng thành hình chữ X."],
      ["Chiều dài tay", "Măng séc nên chạm gốc ngón cái khi buông tay tự nhiên và lộ khoảng một centimet dưới tay áo vest."],
    ],
  },
  // ===== Thời trang công sở =====
  {
    name: "Smart casual là gì và mặc thế nào cho đúng", category: "thoi-trang-cong-so", image: "photo-1623880840102-7df0a9f3545b",
    description: "Quy định trang phục mơ hồ nhất ở công sở, giải thích bằng ví dụ cụ thể.",
    sections: [
      ["Ở giữa vest và áo thun", "Smart casual là lịch sự nhưng không gò bó. Một món trang trọng đi cùng một món thoải mái là cách hiểu đơn giản nhất."],
      ["Công thức dễ áp dụng", "Blazer với quần chino, hoặc sơ mi Oxford với quần jean đậm màu không rách. Cả hai đều đúng trong hầu hết trường hợp."],
      ["Những thứ nên tránh", "Quần short, dép và áo có hình in lớn nằm ngoài phạm vi, dù công ty có thoải mái đến đâu."],
    ],
  },
  {
    name: "5 món đồ công sở nên đầu tư đầu tiên", category: "thoi-trang-cong-so", image: "photo-1630667208073-82d53b1db540",
    description: "Mới đi làm và ngân sách có hạn, hãy mua theo thứ tự này.",
    sections: [
      ["Sơ mi trắng và xanh nhạt", "Hai chiếc sơ mi này phối được với mọi thứ bạn sẽ mua sau đó."],
      ["Quần âu xám hoặc navy", "Hai màu này dễ mặc hơn màu đen và hợp với nhiều màu áo hơn."],
      ["Blazer navy và giày da nâu", "Một chiếc blazer vừa vặn nâng tầm mọi bộ đồ. Giày da nâu linh hoạt hơn giày đen khi đi với quần sáng màu."],
    ],
  },
  {
    name: "Mặc gì khi đi phỏng vấn xin việc", category: "thoi-trang-cong-so", image: "photo-1621335829175-95f437384d7c",
    description: "Ấn tượng đầu tiên hình thành trong vài giây, và trang phục chiếm phần lớn trong đó.",
    sections: [
      ["Tìm hiểu văn hóa công ty", "Xem ảnh trên trang tuyển dụng của họ rồi mặc chỉn chu hơn mức đó một bậc."],
      ["Lựa chọn an toàn", "Sơ mi sáng màu, quần âu tối màu và giày da sạch sẽ phù hợp với gần như mọi ngành nghề."],
      ["Chú ý chi tiết nhỏ", "Áo phẳng phiu, giày được lau và móng tay gọn gàng cho thấy bạn là người cẩn thận."],
    ],
  },
  {
    name: "Phối blazer với quần jean: lịch sự mà không cứng nhắc", category: "thoi-trang-cong-so", image: "photo-1623975561190-49d8eab816bb",
    description: "Kết hợp phổ biến nhất của phong cách công sở hiện đại.",
    sections: [
      ["Chọn jean tối màu, không rách", "Màu chàm đậm hoặc đen, dáng slim hoặc ống đứng, là nền tốt nhất cho blazer."],
      ["Blazer khác chất với quần", "Tránh blazer vải bóng của bộ vest. Vải có bề mặt như cotton hay wool pha trông tự nhiên hơn khi đi với denim."],
      ["Giày hoàn thiện bộ đồ", "Giày lười, giày derby hoặc sneaker da trắng đều phù hợp, tùy mức độ trang trọng bạn muốn."],
    ],
  },
];
