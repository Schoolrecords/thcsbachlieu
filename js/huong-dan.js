/* ============================================================================
   HƯỚNG DẪN SỬ DỤNG — HỆ THỐNG HỒ SƠ SỐ THCS BẠCH LIÊU

   VÌ SAO ĐẶT TRONG APP CHỨ KHÔNG PHÁT TỜ GIẤY
   Thầy cô vướng lúc đang làm dở, giữa chừng một việc. Lúc ấy mà phải đi tìm
   tệp Word gửi qua Zalo từ đầu năm thì phần lớn sẽ bỏ, rồi hỏi người bên
   cạnh — người bên cạnh cũng đoán. Để ngay trong app thì bấm một cái là có,
   và sửa app xong sửa luôn hướng dẫn, không bao giờ lệch nhau.

   NĂM NGUYÊN TẮC VIẾT
   1. Mỗi việc là một chuỗi bước BẤM GÌ, theo đúng thứ tự trên màn hình. Không
      giải thích kiến trúc, không kể tính năng — thầy cô cần làm xong việc.
   2. Tên nút chép ĐÚNG TỪNG CHỮ như trên màn hình, kể cả biểu tượng. Viết
      "vào phần quản lý" thì thầy cô phải tự dò; viết "bấm 📥 Nạp tệp VnEdu"
      thì mắt tìm ra ngay.
   3. Nói rõ DẤU HIỆU BIẾT LÀ ĐÚNG sau mỗi việc. Không có thì thầy cô làm
      xong vẫn không biết đã xong hay chưa, lại bấm thêm lần nữa.
   4. Chỗ nào từng gây tai nạn thật thì ghi thành cảnh báo, kèm lý do. Cảnh
      báo không có lý do thì lần thứ ba người ta bỏ qua.
   5. Việc nào hay quên đường thì kèm ẢNH CHỤP MÀN HÌNH. Chữ tả một cái nút
      bao giờ cũng chậm hơn nhìn thấy chính cái nút ấy.

   ẢNH MINH HOẠ
   Ảnh để trong thư mục demo/img/huong-dan/, khai bằng khối { a: 'ten-tep.png',
   ct: 'chú thích' }. Chưa có tệp ảnh thì khối tự ẩn với thầy cô, chỉ hiện
   khung nhắc với tài khoản quản trị — người dùng thường không việc gì phải
   nhìn thấy ô trống báo thiếu ảnh. Danh sách ảnh cần chụp nằm ở
   demo/img/huong-dan/DANH-SACH-ANH-CAN-CHUP.md.

   LỌC THEO VAI TRÒ
   Mỗi mục khai vai trò nào đọc được. Giáo viên không thấy phần tịnh tiến lên
   lớp — bày ra một việc họ không có quyền làm chỉ khiến họ tưởng máy hỏng.
   Chưa đăng nhập thì hiện hết, vì lúc đó chưa biết ai đang xem.
   ============================================================================ */

(function () {
  'use strict';

  /* Thứ tự vai trò từ hẹp tới rộng. 'tatca' nghĩa là ai cũng đọc được. */
  const GV = ['giao_vien', 'nhan_vien', 'to_truong', 'ban_giam_hieu', 'admin'];
  const TT = ['to_truong', 'ban_giam_hieu', 'admin'];
  const BGH = ['ban_giam_hieu', 'admin'];
  const QT = ['admin'];

  /* Thư mục ảnh minh hoạ. Đổi chỗ để ảnh thì sửa đúng một dòng này. */
  const THU_MUC_ANH = 'img/huong-dan/';

  /* ==========================================================================
     NỘI DUNG
     Mỗi phần có: tên phần · các mục. Mỗi mục có: tiêu đề · vai trò đọc được ·
     nội dung (mảng khối). Khối gồm:
       t : đoạn văn
       b : các bước, mỗi bước một dòng
       c : cảnh báo (nền vàng)
       d : dấu hiệu biết là đúng (nền xanh)
       k : bảng — [tiêu đề cột], [các dòng]
       a : ảnh chụp màn hình — { a:'ten-tep.png', ct:'chú thích' }
     ========================================================================== */
  const PHAN = [

  /* ---------------------------------------------------------------- BẮT ĐẦU */
  { ten: 'Bắt đầu', ic: '🚪', muc: [

    { td: 'Đăng nhập lần đầu', ai: GV, tim: 'dang nhap gmail google tai khoan', nd: [
      { t: 'Thầy cô không phải nhớ thêm mật khẩu nào cả. Hệ thống nhận diện thầy cô qua chính hộp thư Gmail nhà trường đã cấp.' },
      { b: [
        'Mở trang web của trường bằng Chrome hoặc Cốc Cốc.',
        'Trang vừa mở ra là hiện ngay thẻ đăng nhập — bấm <b>Đăng nhập bằng Google</b>.',
        'Chọn đúng hộp thư nhà trường cấp. Máy đang mở sẵn thư cá nhân thì bấm <b>Sử dụng tài khoản khác</b>.',
        'Bấm <b>Tiếp tục</b> khi Google hỏi cho phép.'
      ] },
      { a: 'dang-nhap.png', ct: 'Chưa đăng nhập thì cả trang chỉ hiện đúng thẻ này.' },
      { t: 'Chưa đăng nhập thì thầy cô chưa thấy màn hình nào cả — không có thanh menu, không có nội dung. Đó là cố ý: dữ liệu của nhà trường không để người ngoài mở ra xem được.' },
      { d: 'Vào đúng rồi thì thanh menu hiện lên, và ở cuối thanh menu bên phải có họ tên thầy cô kèm chức danh — Giáo viên, Tổ trưởng chuyên môn, Ban giám hiệu hoặc Quản trị hệ thống.' },
      { c: '⚠ Hiện màn hình <b>“Tài khoản đang chờ duyệt”</b> nghĩa là địa chỉ thư ấy chưa có trong danh sách cán bộ, giáo viên, nhân viên. Thầy cô báo bộ phận quản trị; được cấp quyền rồi thì chỉ cần tải lại trang là vào được, đăng nhập lại nhiều lần cũng không đổi được gì.' }
    ] },

    { td: 'Không đăng nhập được — làm gì', ai: GV, tim: 'loi khong dang nhap duoc cho duyet', nd: [
      { t: 'Thầy cô đối chiếu dòng chữ hiện trên màn hình với bảng dưới đây là biết ngay phải làm gì.' },
      { k: [['Màn hình báo gì', 'Nghĩa là', 'Thầy cô làm gì'], [
        ['<b>Tài khoản đang chờ duyệt</b> — kèm địa chỉ thư vừa đăng nhập',
         'Địa chỉ ấy chưa có trong danh sách cán bộ, giáo viên, nhân viên. Hoặc là chưa được cấp quyền, hoặc là vừa đăng nhập nhầm bằng thư cá nhân',
         'Nhìn địa chỉ thư ghi trên màn hình: <b>đúng thư nhà trường cấp</b> thì báo quản trị cấp quyền, được duyệt rồi tải lại trang là vào. <b>Là thư cá nhân</b> thì bấm Đăng xuất rồi vào lại bằng thư nhà trường'],
        ['Vào được nhưng chỉ xem, không sửa được', 'Đúng quyền được giao', 'Cần sửa thì đề nghị quản trị đổi quyền'],
        ['Trang trắng, không có gì', 'Mạng chập lúc tải trang', 'Bấm Ctrl+F5 để tải lại toàn bộ']
      ]] },
      { t: 'Thẻ đăng nhập có báo lỗi ngay dưới nút bấm. Thầy cô đọc dòng chữ đỏ ấy trước khi bấm lại — bấm mãi một nút mà không đọc thì lỗi vẫn thế.' }
    ] },

    { td: 'Sáu màn hình của hệ thống', ai: GV, tim: 'man hinh menu tong quan bo cuc', nd: [
      { t: 'Cả hệ thống chỉ có sáu màn hình. Nhớ được sáu dòng dưới đây là thầy cô đi đâu cũng không lạc.' },
      { k: [['Màn hình', 'Dùng để làm gì'], [
        ['🏠 Trang chủ', 'Nhìn nhanh quy mô trường và lối vào các phần'],
        ['📁 Quản lý Hồ sơ', 'Danh mục minh chứng theo Thông tư 57, mở thư mục Google Drive của từng minh chứng'],
        ['👥 Hồ sơ CBGV–NV', 'Hồ sơ cá nhân của từng cán bộ, giáo viên, nhân viên. Vào từ thẻ cuối trong Quản lý Hồ sơ, hoặc thẻ ngoài trang chủ'],
        ['🎒 Quản lý học sinh', 'Xem danh sách học sinh theo khối, theo lớp; in danh sách'],
        ['🎖 Trường chuẩn Quốc gia', 'Hội đồng tự đánh giá, tự đánh giá theo tiêu chí, kết xuất báo cáo'],
        ['📊 Đảm bảo chất lượng', 'Số liệu, chuẩn đầu ra, cam kết và năm phụ lục gửi Sở']
      ]] },
      { a: 'menu-6-man-hinh.png', ct: 'Thanh menu ở đầu trang. Trên điện thoại thì các mục này nằm trong nút ba gạch ☰ ở góc trên bên trái.' }
    ] },

    { td: 'Ba thói quen giúp không bao giờ nhầm số', ai: GV, tim: 'thoi quen kiem nam hoc ky vai tro truoc khi bam', nd: [
      { t: 'Gần như mọi trục trặc thầy cô gặp đều rơi vào ba chỗ này. Nhìn qua ba chỗ ấy trước khi bấm là xong.' },
      { k: [['Nhìn chỗ nào', 'Hỏi mình câu gì'], [
        ['Ô <b>Năm học</b> ở đầu màn hình', 'Mình đang xem năm nào? Có đúng năm cần làm không?'],
        ['Ô <b>Kỳ</b> bên cạnh', 'Học kỳ I, học kỳ II hay cả năm?'],
        ['Chức danh ở góc trên bên phải', 'Việc này có thuộc quyền của mình không?']
      ]] },
      { t: 'Ba câu hỏi ấy mất năm giây. Chọn nhầm năm học rồi bấm một nút có chữ “ghi đè” thì mất cả buổi dò lại.' }
    ] }

  ] },

  /* -------------------------------------------------------------- GIÁO VIÊN */
  { ten: 'Việc của giáo viên', ic: '👩‍🏫', muc: [

    { td: 'Tìm một minh chứng và mở thư mục Drive của nó', ai: GV, tim: 'tim minh chung ma ho so drive thu muc', nd: [
      { b: [
        'Vào màn hình <b>Quản lý Hồ sơ</b>.',
        'Gõ vào ô tìm kiếm: mã minh chứng (<b>MC.1.1.01</b>), mã cũ (<b>H15-1.8-02</b>) hoặc vài chữ trong tên minh chứng.',
        'Bấm vào dòng hiện ra trong danh sách gợi ý.',
        'Bấm biểu tượng <b>📂</b> ở cuối dòng để mở thư mục Google Drive.'
      ] },
      { a: 'hoso-tim-minh-chung.png', ct: 'Gõ mã hoặc vài chữ vào ô tìm kiếm, rồi bấm <b>📂</b> ở cuối dòng.' },
      { t: 'Ô tìm kiếm nhận <b>cả mã mới lẫn mã cũ</b>. Thầy cô còn quen mã cũ ghi trên bìa hồ sơ giấy thì cứ gõ mã cũ, hệ thống vẫn hiểu.' },
      { c: '⚠ Bấm 📂 mà Drive báo “Bạn cần quyền truy cập” thì thầy cô đang đăng nhập Drive bằng thư cá nhân. Đổi sang thư nhà trường cấp là vào được.' }
    ] },

    { td: 'Nộp minh chứng lên Drive', ai: GV, tim: 'nop minh chung tai len drive upload', nd: [
      { b: [
        'Tìm minh chứng theo cách ở mục trên, bấm <b>📂</b> mở thư mục.',
        'Kéo thả tệp vào thư mục, hoặc bấm <b>+ Mới</b> → <b>Tải tệp lên</b>.',
        'Quay lại hệ thống, bấm <b>Kiểm tra ngay</b> để hệ thống đếm lại tệp trong thư mục.'
      ] },
      { a: 'hoso-nop-drive.png', ct: 'Kéo thả tệp vào thư mục Drive, rồi quay lại bấm <b>Kiểm tra ngay</b>.' },
      { d: 'Trạng thái của minh chứng đổi từ <b>Chưa có</b> sang <b>Đã có</b>, và bốn thẻ thống kê ở đầu màn hình đổi số theo.' },
      { t: 'Không bấm nút cũng không sao: <b>mỗi đêm khoảng 1 giờ sáng hệ thống tự rà soát toàn bộ thư mục Drive một lượt</b>, sáng ra vào là đã đúng trạng thái. Nút <b>Kiểm tra ngay</b> để dùng khi thầy cô vừa nộp tệp và muốn thấy kết quả liền, không phải chờ đến hôm sau. Dòng chữ nhỏ dưới tiêu đề hộp cho biết lần rà soát gần nhất là lúc nào và do máy tự chạy hay do người bấm.' },
      { c: '⚠ Đặt tên tệp có dấu tiếng Việt đầy đủ, ghi rõ năm học. Tên kiểu “scan001.pdf” thì đến lúc đoàn kiểm tra hỏi, cả trường phải mở từng tệp ra dò.' }
    ] },

    { td: 'Xem hội đồng tự đánh giá và phần việc của mình', ai: GV, tim: 'hoi dong tu danh gia thanh vien tieu chi phu trach xem', nd: [
      { t: 'Trước đây danh sách hội đồng nằm trong bảng Quản trị nên thầy cô không vào xem được, dù chính mình có tên trong đó. Nay danh sách hiện thẳng trên màn hình <b>Trường chuẩn Quốc gia</b>, ai đăng nhập cũng xem được.' },
      { b: [
        'Vào màn hình <b>Trường chuẩn Quốc gia</b>.',
        'Kéo xuống khối <b>👥 Hội đồng tự đánh giá</b> ngay dưới bốn thẻ tổng quan.',
        'Tìm dòng có tên mình, đọc cột <b>Tiêu chí phụ trách</b> và cột <b>Tiến độ</b>.',
        'Cần bản giấy thì bấm <b>📄 Danh sách hội đồng</b> hoặc <b>📄 Bảng phân công nhiệm vụ</b> để tải tệp Word.'
      ] },
      { a: 'truong-chuan-hoi-dong.png', ct: 'Khối <b>👥 Hội đồng tự đánh giá</b> trên màn hình Trường chuẩn Quốc gia — ai đăng nhập cũng xem được.' },
      { d: 'Thấy đủ họ tên, vai trò trong hội đồng, tiêu chí được giao và số nội hàm đã viết của từng người.' },
      { t: 'Cột <b>Tiến độ</b> do máy chủ tự đếm từ số nội hàm đã viết, không phải ai tự đánh dấu. Ô ghi “chưa được giao” nghĩa là người đó chưa nhận tiêu chí nào, khác hẳn với làm chưa xong.' },
      { c: '⚠ Khối này chỉ để xem. Muốn thêm người, đổi vai trò hay giao tiêu chí thì phải là Ban giám hiệu hoặc Quản trị hệ thống — bấm nút <b>✏ Sửa hội đồng</b> ở bên phải.' }
    ] },

    { td: 'Lập bản cam kết của giáo viên — Phụ lục 15', ai: GV, tim: 'cam ket giao vien phu luc 15 chuan dau ra', nd: [
      { b: [
        'Vào <b>Đảm bảo chất lượng</b>.',
        'Bấm nhóm <b>Kết xuất phụ lục</b>.',
        'Bấm thẻ <b>Phụ lục 15</b>.',
        'Tìm dòng có tên mình, điền chỉ tiêu cho từng lớp mình dạy.',
        'Điền xong bấm nút xuất Word ở cuối dòng để lấy bản in.'
      ] },
      { a: 'phu-luc-15.png', ct: 'Thẻ <b>Phụ lục 15</b> trong nhóm Kết xuất phụ lục.' },
      { d: 'Tệp Word tải về, mở ra là <b>khổ A4 dọc</b>, có Quốc hiệu, có tên thầy cô in đậm ở phần ký.' },
      { t: 'Thầy cô chỉ thấy và sửa được các lớp, môn mình được phân công. Không thấy lớp mình dạy thì báo bộ phận chuyên môn kiểm lại bảng phân công giúp.' }
    ] },

    { td: 'Xem và in danh sách lớp', ai: GV, tim: 'in danh sach lop hoc sinh si so', nd: [
      { b: [
        'Vào <b>Quản lý học sinh</b>.',
        'Kiểm ô <b>Xem năm học</b> trong khối tiêu đề — chọn đúng năm cần xem.',
        'Bấm thẻ khối, rồi bấm tên lớp.',
        'Bấm <b>🖨 In danh sách</b>.'
      ] },
      { a: 'in-danh-sach-lop.png', ct: 'Chọn khối, chọn lớp, rồi bấm <b>🖨 In danh sách</b>.' },
      { d: 'Cửa sổ xem trước bản in hiện ra với <b>đủ toàn bộ học sinh của lớp</b>, tiêu đề bảng lặp lại ở mỗi trang giấy.' },
      { c: '⚠ Ô chọn năm học liệt kê mọi năm còn dữ liệu. Xem năm cũ xong thầy cô nhớ chuyển lại năm hiện hành, kẻo lấy nhầm sĩ số năm trước làm số của năm nay.' }
    ] }

  ] },

  /* ------------------------------------------------------------- TỔ TRƯỞNG */
  { ten: 'Việc của tổ trưởng chuyên môn', ic: '📋', muc: [

    { td: 'Nhập số liệu bằng Excel', ai: TT, tim: 'excel tai mau nhap so lieu phu luc', nd: [
      { t: 'Cách này tiện khi phải gom số của cả tổ, hoặc khi mạng chập chờn — điền ngoại tuyến rồi nộp một tệp duy nhất.' },
      { b: [
        'Vào <b>Đảm bảo chất lượng</b> → nhóm <b>Kết xuất phụ lục</b> → chọn phụ lục cần nhập.',
        'Kiểm hai ô <b>Năm học</b> và <b>Kỳ</b> ở đầu màn hình cho đúng.',
        'Bấm <b>↓ Tải mẫu Excel</b>.',
        'Mở tệp, điền các cột Khối 6 đến Khối 9. Trang tính <b>Hướng dẫn</b> trong tệp ghi rõ cách ghi từng dạng giá trị.',
        'Lưu tệp rồi bấm <b>↑ Tải tệp Excel lên</b>.',
        'Đọc kỹ cửa sổ xác nhận — nó ghi rõ nạp vào <b>bảng nào, kỳ nào, năm học nào</b>. Đúng thì bấm Đồng ý.'
      ] },
      { a: 'excel-tai-mau.png', ct: 'Hai nút <b>↓ Tải mẫu Excel</b> và <b>↑ Tải tệp Excel lên</b> nằm cạnh nhau ở đầu bảng.' },
      { k: [['Dạng giá trị', 'Gõ thế nào', 'Ví dụ'], [
        ['Số em kèm tỉ lệ', 'số em / tỉ lệ phần trăm', '138/90.8'],
        ['Điểm trung bình', 'Dùng dấu chấm, không dùng dấu phẩy', '8.86'],
        ['Đạt / chưa đạt', 'Đ hoặc CĐ', 'Đ'],
        ['Chỉ tính khối 9', 'Để nguyên dấu gạch ngang', '—']
      ]] },
      { d: 'Bảng trên màn hình đổi số ngay sau khi nạp, và có dòng báo đã nạp bao nhiêu ô.' },
      { c: '⚠ Chỉ sửa các cột số. <b>Đừng xoá cột Mã</b> — hệ thống dò theo cột đó. Cũng đừng xoá dòng ghi Năm học · Mã bảng · Kỳ, vì đó là chỗ hệ thống đối chiếu xem tệp có đúng bảng đang mở không.' },
      { t: 'Còn lại thầy cô cứ thoải mái: chèn thêm dòng ghi chú, đổi thứ tự dòng, thêm cột riêng — hệ thống vẫn đọc đúng.' }
    ] },

    { td: 'Tính lại 33 chỉ tiêu', ai: TT, tim: 'tinh lai 33 chi tieu ket qua thuc hien', nd: [
      { t: 'Nút này bảo hệ thống đọc lại điểm và mức rèn luyện của từng em rồi tự tính ra 33 chỉ tiêu, thay cho việc cộng tay.' },
      { b: [
        'Vào <b>Đảm bảo chất lượng</b> → nhóm <b>Dữ liệu và cam kết</b> → thẻ <b>Học sinh</b>.',
        'Chọn đúng <b>Năm học</b> ở ô đầu màn hình.',
        'Bấm <b>🔄 Tính lại 33 chỉ tiêu từ dữ liệu học sinh</b>, chọn kỳ ở ô bên cạnh.',
        'Cửa sổ xác nhận hiện ra <b>nền đỏ</b> — đọc kỹ dòng ghi năm học và kỳ, đúng thì bấm <b>Tính lại và ghi đè</b>.'
      ] },
      { a: 'tinh-lai-33-chi-tieu.png', ct: 'Cửa sổ xác nhận <b>nền đỏ</b> — dòng ghi năm học và kỳ là chỗ phải đọc kỹ nhất.' },
      { d: 'Có dòng báo đã ghi bao nhiêu ô. Mở thẻ Phụ lục 5 là thấy số mới.' },
      { c: '⚠ Nút này <b>GHI ĐÈ</b> bảng Kết quả thực hiện của năm và kỳ đang chọn. Sai năm là đè mất số của năm đó. Cửa sổ xác nhận ghi rõ năm và kỳ — đọc dòng ấy rồi mới bấm. Riêng cột “Đối sánh toàn tỉnh” nhập tay thì vẫn giữ nguyên.' },
      { t: 'Học sinh diện hoà nhập không tính vào mẫu số các tỉ lệ, đúng theo Thông tư 22.' }
    ] },

    { td: 'Chép số từ bảng khác cho đỡ gõ lại', ai: TT, tim: 'chep tu bang thuc trang chuan dau ra nam truoc', nd: [
      { t: 'Ba nút ở đầu bảng nhập giúp lấy sẵn số từ chỗ khác thay vì gõ lại từ đầu.' },
      { k: [['Nút', 'Lấy số từ đâu'], [
        ['Chép từ bảng Thực trạng đầu năm', 'Phụ lục 1 của cùng năm học'],
        ['Chép từ Chuẩn đầu ra', 'Phụ lục 2 của cùng năm học'],
        ['Lấy bảng này của năm …', 'Chính bảng này nhưng của năm học trước']
      ]] },
      { t: 'Ô <b>Mức nâng khi chép</b> quyết định chép xong có nâng chỉ tiêu lên không. Mức “vừa” nâng tỉ lệ 1 điểm phần trăm và điểm trung bình 0,1 — đúng cách nhà trường vẫn làm.' },
      { c: '⚠ Chép xong vẫn phải rà lại từng dòng. Máy chỉ nâng đều tay theo một công thức, còn môn nào nâng được tới đâu thì chỉ thầy cô biết.' }
    ] }

  ] },

  /* -------------------------------------------------------- BAN GIÁM HIỆU */
  { ten: 'Việc của ban giám hiệu', ic: '🏫', muc: [

    { td: 'Nạp thẳng sổ điểm VnEdu — cách nhanh nhất', ai: BGH, tim: 'nap so diem vnedu tai len ket qua hoc tap', nd: [
      { t: 'Thả nguyên các tệp tải từ VnEdu về. Một lần vào cả danh sách học sinh lẫn điểm 12 môn — không phải chép sang mẫu, không có chỗ cho lỗi chép nhầm.' },
      { b: [
        'Tải từ VnEdu về các tệp <b>so_diem_tong_ket_khoi_*.xls</b> — <b>cả học kỳ I lẫn học kỳ II</b>, mỗi kỳ 4 tệp theo 4 khối.',
        'Vào <b>Đảm bảo chất lượng</b> → nhóm <b>Dữ liệu và cam kết</b> → thẻ <b>Học sinh</b>.',
        'Bấm <b>📥 Nạp tệp VnEdu</b>.',
        'Vào thư mục HK1, bấm Ctrl+A rồi Open. Sau đó bấm <b>📂 Chọn thêm tệp</b>, vào thư mục HK2, làm tương tự.',
        'Xem bảng tổng hợp: phải đủ <b>16 lớp mỗi kỳ</b>, số học sinh hai kỳ bằng nhau.',
        'Kiểm ô <b>Năm học</b> — hệ thống tự chọn theo năm ghi trong tệp, nhưng thầy vẫn nên nhìn lại.',
        'Bấm <b>✅ Ghi vào cơ sở dữ liệu</b>.',
        'Ghi xong bấm <b>🔍 Đọc ngược từ máy chủ để kiểm chứng</b>.'
      ] },
      { a: 'nap-vnedu.png', ct: 'Bảng tổng hợp sau khi chọn tệp: đủ <b>16 lớp mỗi kỳ</b> thì mới bấm <b>✅ Ghi vào cơ sở dữ liệu</b>.' },
      { d: 'Bảng kiểm chứng đếm từ chính cơ sở dữ liệu, không lấy số máy tự nhớ. Khớp với bảng bên trên là chắc chắn đã lưu.' },
      { c: '⚠ <b>Phải nạp đủ cả hai học kỳ một lượt.</b> Điều 9 khoản 1 Thông tư 22 quy định điểm cả năm là trung bình có trọng số, học kỳ II hệ số 2: ĐTBmcn = (ĐTBmhkI + 2 × ĐTBmhkII) / 3. Thiếu học kỳ I thì không có cách nào tính ra con số đúng, nên hệ thống chặn không cho ghi.' },
      { c: '⚠ Nạp lại chính những tệp đã nạp thì <b>an toàn</b>, dữ liệu không nhân đôi — mọi bước đều ghi theo khoá duy nhất.' },
      { t: 'Hệ thống <b>không</b> lấy cột “Kết quả học tập” của VnEdu, mà tự xếp loại từ điểm theo Điều 9 Thông tư 22 rồi so lại với sổ. Hai bên tính độc lập, khớp nhau là bằng chứng số liệu đúng; lệch nhau thì hệ thống chỉ ra đúng em nào.' }
    ] },

    { td: 'Tịnh tiến lên lớp — đầu năm học mới', ai: BGH, tim: 'tinh tien len lop chuyen khoi nam moi', nd: [
      { t: 'Khối 6 năm cũ thành khối 7 năm mới, 7 thành 8, 8 thành 9. Giữ nguyên mã học sinh, số định danh, họ tên, ngày sinh — không phải gõ lại gì. Khối 9 ra trường.' },
      { b: [
        'Vào <b>Đảm bảo chất lượng</b> → nhóm <b>Dữ liệu và cam kết</b> → thẻ <b>Học sinh</b>.',
        'Bấm <b>↗ Tịnh tiến lên lớp</b>.',
        'Chọn <b>năm nguồn</b> (năm học vừa kết thúc) và <b>năm đích</b> (năm học mới).',
        'Đọc bảng liệt kê: em nào đủ điều kiện, em nào còn thiếu dữ liệu.',
        'Bấm nút tịnh tiến rồi xác nhận.'
      ] },
      { a: 'tinh-tien-len-lop.png', ct: 'Chọn <b>năm nguồn</b> và <b>năm đích</b>, đọc bảng liệt kê rồi mới xác nhận.' },
      { d: 'Dòng báo ghi rõ đã tịnh tiến bao nhiêu em sang năm mới, và ghi kết luận lên lớp cho bao nhiêu em ở năm nguồn.' },
      { t: 'Điều kiện lên lớp theo Điều 12 khoản 1 Thông tư 22 gồm <b>ba</b> điều: (a) rèn luyện cả năm từ Đạt trở lên, (b) học tập cả năm từ Đạt trở lên, (c) nghỉ không quá 45 buổi.' },
      { c: '⚠ Chỉ khi kiểm được <b>đủ cả ba</b> điều kiện hệ thống mới ghi kết luận lên lớp. Thiếu số buổi nghỉ thì để trống chứ không kết luận — “chưa có dữ liệu” khác hẳn “chưa đạt”, mà con số này chảy thẳng vào chỉ tiêu CT10, CT11 gửi Sở.' },
      { c: '⚠ Bấm mấy lần cũng không nhân đôi và không đè lên dòng đã có ở năm đích. Học sinh diện hoà nhập không xét ở đây, vì Thông tư 22 đánh giá các em theo kế hoạch giáo dục cá nhân — thầy cô tự chuyển lớp cho các em.' },
      { t: 'Khối 6 mới phải nhập riêng bằng nút <b>↓ Tải mẫu danh sách</b>, vì các em vừa từ tiểu học lên, không suy ra được từ dữ liệu cũ.' }
    ] },

    { td: 'Trình tự cuối năm học — làm đúng thứ tự này', ai: BGH, tim: 'cuoi nam trinh tu tong ket thu tu cac buoc', nd: [
      { t: 'Bốn việc phải làm đúng thứ tự. Làm ngược là ra số 0 hoặc số sai.' },
      { k: [['Thứ tự', 'Việc', 'Vì sao phải đúng thứ tự'], [
        ['1', 'Nạp sổ điểm VnEdu cả hai kỳ', 'Chưa có điểm thì không tính được gì'],
        ['2', 'Tịnh tiến lên lớp', 'Bước này mới ghi kết luận lên lớp cho năm vừa kết thúc'],
        ['3', 'Tính lại 33 chỉ tiêu — chọn năm vừa kết thúc', 'Chỉ tiêu CT10, CT11 lấy từ kết luận ở bước 2'],
        ['4', 'Kết xuất Phụ lục 5 ra Word', 'Số đã đủ mới xuất được bản gửi Sở']
      ]] },
      { c: '⚠ Bước 3 phải chọn <b>năm học vừa kết thúc</b>, không phải năm mới. Kết luận lên lớp thuộc về năm học đã xong; chọn năm mới thì năm đó chưa có điểm nào, kết quả ra toàn số 0 và ghi đè mất bảng.' }
    ] },

    { td: 'Kết xuất năm phụ lục gửi Sở', ai: BGH, tim: 'xuat word phu luc 1 2 5 15 16 gui so', nd: [
      { b: [
        'Vào <b>Đảm bảo chất lượng</b> → nhóm <b>Kết xuất phụ lục</b>.',
        'Bấm thẻ phụ lục cần lấy.',
        'Kiểm hai ô <b>Năm học</b> và <b>Kỳ</b>.',
        'Bấm <b>📄 Tải bản Word</b>.'
      ] },
      { a: 'xuat-phu-luc.png', ct: 'Nhóm <b>Kết xuất phụ lục</b> với các thẻ Phụ lục 1, 2, 5, 15, 16.' },
      { k: [['Phụ lục', 'Nội dung', 'Khổ giấy'], [
        ['Phụ lục 1', 'Thực trạng nhà trường đầu năm', 'A4 ngang'],
        ['Phụ lục 2', 'Chuẩn đầu ra chất lượng học tập', 'A4 ngang'],
        ['Phụ lục 5', 'Kết quả học tập và rèn luyện', 'A4 ngang'],
        ['Phụ lục 15', 'Cam kết của giáo viên với Hiệu trưởng', 'A4 dọc'],
        ['Phụ lục 16', 'Cam kết chất lượng giáo dục của nhà trường', 'A4 ngang']
      ]] },
      { d: 'Mở tệp bằng Word: đúng khổ giấy như bảng trên, có Quốc hiệu và tiêu ngữ, mọi bảng có khung viền, tiêu đề bảng lặp lại ở mỗi trang.' },
      { t: 'Phụ lục 2 và Phụ lục 16 dùng chung một bộ chỉ tiêu — nhập một lần, hệ thống tự đối chiếu và báo nếu hai nơi vênh nhau.' },
      { c: '⚠ Lần đầu mở tệp, Word có thể hỏi “tệp ở định dạng khác với phần mở rộng”. Bấm <b>Yes</b> là mở bình thường.' }
    ] },

    { td: 'Công bố chuẩn đầu ra lên trang công khai', ai: BGH, tim: 'cong bo chuan dau ra trang cong khai', nd: [
      { b: [
        'Vào <b>Đảm bảo chất lượng</b> → nhóm <b>Bộ máy và theo dõi</b> → thẻ <b>Vận hành</b>.',
        'Kiểm ô <b>Năm học</b>.',
        'Bấm <b>📢 Công bố chuẩn đầu ra lên trang công khai</b>, xác nhận.',
        'Bấm <b>👁 Xem trang công khai</b> để kiểm lại.'
      ] },
      { a: 'cong-bo-chuan-dau-ra.png', ct: 'Thẻ <b>Vận hành</b> — nút công bố và nút xem lại trang công khai.' },
      { c: '⚠ Công bố là đưa ra <b>trang ai cũng xem được</b>. Rà kỹ số liệu trước khi bấm.' },
      { t: 'Ba mốc bắt buộc của năm học theo Công văn 2180 của Sở: trước <b>30/9</b> hoàn thành ký cam kết và công bố chuẩn đầu ra · trước <b>30/01</b> sơ kết học kỳ I · trước <b>30/7</b> tổng kết năm học và báo cáo.' }
    ] },

    { td: 'Lập hội đồng tự đánh giá và phân công tiêu chí', ai: BGH, tim: 'lap hoi dong tu danh gia phan cong tieu chi dieu 9', nd: [
      { t: 'Danh sách hội đồng ai cũng xem được ngay trên màn hình <b>Trường chuẩn Quốc gia</b>, nhưng chỉ Ban giám hiệu và Quản trị mới sửa được.' },
      { b: [
        'Vào <b>Trường chuẩn Quốc gia</b>, bấm <b>✏ Sửa hội đồng</b> ở bên phải khối hội đồng.',
        'Nhập <b>số quyết định</b> và <b>ngày quyết định</b> thành lập hội đồng trước — thành viên gắn vào quyết định đó.',
        'Bấm <b>➕ Thêm thành viên</b>, chọn người trong danh sách CBGV–NV.',
        'Chọn vai trò trong hội đồng, ghi nhóm công tác và gõ tiêu chí phụ trách vào ô, cách nhau dấu phẩy: <b>1.1, 1.2</b>.',
        'Nhập <b>ngày phê duyệt báo cáo tự đánh giá</b> khi hội đồng đã họp phê duyệt.'
      ] },
      { d: 'Dải kiểm tra ở đầu khối chuyển sang <b>nền xanh</b> với dòng “Hội đồng đủ điều kiện của Điều 9”.' },
      { t: 'Điều 9 đòi hội đồng có <b>số lẻ, từ 05 người trở lên</b>, đúng 01 Chủ tịch và 01 Thư ký. Hệ thống tự soát bốn điều kiện ấy và chỉ ra đúng điều kiện nào chưa đạt, thầy không phải tra lại Thông tư.' },
      { c: '⚠ Hạn phê duyệt báo cáo tự đánh giá là <b>trước 15/6</b> của năm học (điểm d khoản 3 Điều 9). Hệ thống đếm ngược số ngày còn lại ngay trên khối hội đồng.' }
    ] },

    { td: 'Kết xuất báo cáo tự đánh giá', ai: BGH, tim: 'bao cao tu danh gia kiem dinh chat luong tieu chi', nd: [
      { b: [
        'Vào <b>Trường chuẩn Quốc gia</b>.',
        'Điền mức đạt và minh chứng cho từng tiêu chí.',
        'Bấm nút xuất báo cáo tự đánh giá.'
      ] },
      { d: 'Tệp Word khổ A4 dọc, trang bìa có Quốc hiệu, phần Thông tin chung là bảng có khung.' },
      { t: 'Vài mục trong báo cáo còn để dấu “…” — đó là phần nhận định nhà trường tự viết, hệ thống không có dữ liệu nên không điền thay.' }
    ] }

  ] },

  /* ---------------------------------------------------------- QUẢN TRỊ */
  { ten: 'Việc của quản trị hệ thống', ic: '⚙', muc: [

    { td: 'Các tab của cửa sổ Quản trị', ai: QT, tim: 'quan tri he thong tab tong quan nguoi dung nhat ky', nd: [
      { t: 'Bấm vào tên mình ở góc trên bên phải để mở cửa sổ Quản trị hệ thống.' },
      { a: 'quan-tri-cac-tab.png', ct: 'Cửa sổ <b>Quản trị hệ thống</b> mở ra khi bấm vào tên mình ở góc trên bên phải.' },
      { k: [['Tab', 'Dùng để làm gì'], [
        ['Tổng quan', 'Nhìn nhanh toàn hệ thống'],
        ['Danh mục Hồ sơ số', 'Hai màn: <b>Minh chứng</b> — sửa/thêm/xoá từng minh chứng, gán người phụ trách, gán link Drive · <b>Cây danh mục</b> — sửa/thêm tên bộ phận và tên hộp hồ sơ'],
        ['Danh sách CBGV-NV', 'Nhập và sửa hồ sơ cán bộ, giáo viên, nhân viên'],
        ['Số liệu báo cáo', 'Bảng số liệu 03 năm học đính kèm Phần IV báo cáo tự đánh giá'],
        ['Hội đồng TĐG', 'Lập hội đồng, phân công tiêu chí cho từng thành viên'],
        ['KH cải tiến (Biểu 2)', 'Kế hoạch cải tiến chất lượng theo Mẫu số 2 Phụ lục V'],
        ['Chuẩn quốc gia', 'Đối chiếu điều kiện công nhận trường chuẩn — Điều 16'],
        ['Danh sách học sinh', 'Nhập danh sách, nạp sổ VnEdu, tịnh tiến lên lớp'],
        ['Người dùng', 'Đổi quyền tài khoản'],
        ['Danh sách mời', 'Mời tài khoản mới vào hệ thống'],
        ['Nhật ký', 'Xem ai đã làm gì, lúc nào'],
        ['Sao lưu', 'Tải toàn bộ dữ liệu về máy']
      ]] },
      { c: '⚠ Tab <b>Danh sách học sinh</b> có ô chọn <b>Năm học</b> riêng. Ô đó chi phối các nút tải mẫu, tải lên và Tính lại 33 chỉ tiêu. Riêng <b>Nạp tệp VnEdu</b> và <b>Tịnh tiến lên lớp</b> có ô chọn năm riêng bên trong — nhớ xem lại năm ở đó trước khi bấm.' }
    ] },

    { td: 'Mời người mới và phân quyền', ai: QT, tim: 'moi tai khoan phan quyen vai tro nguoi dung', nd: [
      { b: [
        'Mở cửa sổ <b>Quản trị hệ thống</b> → tab <b>Danh sách mời</b>.',
        'Thêm địa chỉ Gmail của người cần mời, chọn vai trò.',
        'Người đó đăng nhập bằng Google một lần là vào được.',
        'Cần đổi quyền về sau thì sang tab <b>Người dùng</b>.'
      ] },
      { k: [['Vai trò', 'Làm được gì'], [
        ['Giáo viên', 'Xem lớp mình dạy, nộp minh chứng, xem hội đồng TĐG, lập cam kết Phụ lục 15'],
        ['Tổ trưởng chuyên môn', 'Thêm: nhập số liệu Excel, tính lại 33 chỉ tiêu'],
        ['Ban giám hiệu', 'Toàn bộ nghiệp vụ: nạp sổ VnEdu, tịnh tiến lên lớp, lập hội đồng, kết xuất phụ lục'],
        ['Quản trị hệ thống', 'Thêm: phân quyền, mời tài khoản, sao lưu, xem nhật ký']
      ]] },
      { c: '⚠ Nguyên tắc: giao đúng quyền cần dùng, không giao thừa. Dữ liệu học sinh có ngày sinh và số định danh cá nhân — thuộc phạm vi Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.' }
    ] },

    { td: 'Sao lưu dữ liệu', ai: QT, tim: 'sao luu backup du lieu tai ve', nd: [
      { b: [
        'Mở <b>Quản trị hệ thống</b> → tab <b>Sao lưu</b>.',
        'Bấm nút tải toàn bộ dữ liệu về máy.',
        'Cất tệp vào thư mục riêng, ghi rõ ngày trong tên tệp.'
      ] },
      { t: 'Nên sao lưu vào <b>ba mốc</b>: sau khi nạp sổ điểm cuối mỗi kỳ · trước khi tịnh tiến lên lớp · trước khi làm việc gì có chữ “ghi đè”.' }
    ] },

    { td: 'Thêm ảnh minh hoạ cho mục Hướng dẫn', ai: QT, tim: 'anh minh hoa chup man hinh huong dan bo sung', nd: [
      { t: 'Mục Hướng dẫn có sẵn chỗ cho ảnh chụp màn hình. Chỗ nào chưa có ảnh thì chỉ tài khoản quản trị nhìn thấy khung nhắc màu vàng, thầy cô khác không thấy gì.' },
      { b: [
        'Chụp màn hình đúng chỗ khung nhắc mô tả (phím <b>PrtSc</b>, hoặc <b>Windows + Shift + S</b> để chụp một vùng).',
        'Khoanh đỏ cái nút cần bấm — dùng Paint hoặc công cụ chụp của Windows.',
        'Lưu ảnh <b>đúng tên tệp</b> khung nhắc ghi, vào thư mục <code>demo/img/huong-dan/</code>.',
        'Tải lại trang bằng <b>Ctrl+F5</b>, ảnh hiện lên thay chỗ khung nhắc.'
      ] },
      { t: 'Danh sách đầy đủ các ảnh cần chụp nằm ở tệp <code>demo/img/huong-dan/DANH-SACH-ANH-CAN-CHUP.md</code>.' },
      { c: '⚠ Ảnh chụp màn hình <b>không được để lộ danh sách học sinh có ngày sinh, số định danh</b> hay số điện thoại phụ huynh. Chụp chỗ nào có dữ liệu cá nhân thì bôi mờ trước khi lưu — Nghị định 13/2023/NĐ-CP.' }
    ] },

    { td: 'Xem nhật ký khi số liệu có gì đó lạ', ai: QT, tim: 'nhat ky audit log ai da lam gi', nd: [
      { b: [
        'Mở <b>Quản trị hệ thống</b> → tab <b>Nhật ký</b>.',
        'Lọc theo ngày hoặc theo người dùng.'
      ] },
      { t: 'Mọi thao tác thêm, sửa, xoá dữ liệu học sinh đều được ghi lại. Số liệu đổi mà không rõ vì sao thì đây là chỗ tra đầu tiên.' }
    ] }

  ] },

  /* ----------------------------------------------------------- GẶP LỖI */
  { ten: 'Gặp trục trặc thì làm gì', ic: '🔧', muc: [

    { td: 'Bảng tra nhanh các lỗi hay gặp', ai: GV, tim: 'loi su co khong chay khong hien treo', nd: [
      { k: [['Hiện tượng', 'Nguyên nhân thường gặp', 'Cách xử lý'], [
        ['Bấm nút không thấy gì xảy ra', 'Mạng chập lúc tải trang, thiếu một tệp', 'Bấm <b>Ctrl+F5</b> tải lại toàn bộ'],
        ['Số liệu không đổi sau khi nạp', 'Đang xem sai năm học hoặc sai kỳ', 'Kiểm hai ô Năm học và Kỳ ở đầu màn hình'],
        ['Chỉ tiêu ra toàn số 0', 'Tính cho năm chưa có dữ liệu', 'Chọn lại đúng năm rồi tính lại'],
        ['Không xuất được Word hoặc Excel', 'Trình duyệt chặn tải tệp', 'Cho phép tải tệp từ trang này'],
        ['In ra trang trắng hoặc cụt', 'Bản in cũ lưu trong bộ nhớ đệm', 'Bấm Ctrl+F5 rồi in lại'],
        ['Bấm 📂 Drive báo cần quyền', 'Đang đăng nhập Drive bằng thư cá nhân', 'Đổi sang thư nhà trường cấp'],
        ['Khối hội đồng TĐG để trống', 'Năm học đang chọn chưa lập hội đồng', 'Chọn lại năm học, hoặc đề nghị Ban giám hiệu lập hội đồng']
      ]] }
    ] },

    { td: 'Ba việc thử trước khi báo người khác', ai: GV, tim: 'thu truoc khi bao ho tro tu xu ly', nd: [
      { b: [
        '<b>Ctrl+F5</b> — tải lại toàn bộ trang, bỏ qua bộ nhớ đệm. Việc này xử lý được phần lớn trục trặc.',
        'Kiểm <b>ô Năm học</b> và <b>ô Kỳ</b> ở đầu màn hình. Sai năm là nguyên nhân thường gặp nhất.',
        'Kiểm chức danh ở góc trên bên phải — có đúng vai trò cần dùng cho việc đang làm không.'
      ] },
      { t: 'Ba việc đó không xong thì chụp <b>toàn màn hình</b> — chụp cả thanh menu và góc trên bên phải, đừng chụp mỗi ô báo lỗi — rồi gửi kèm câu: đang làm gì, bấm nút nào, mong đợi ra sao.' },
      { t: 'Gửi cho người thiết kế hệ thống: <b>thầy Chung Trần — 0913031073</b>. Số này cũng có ở cuối mỗi trang, bấm vào là gọi được ngay trên điện thoại.' }
    ] },

    { td: 'Những chỗ hệ thống cố ý chặn', ai: GV, tim: 'chan khong cho ghi tai sao bi tu choi', nd: [
      { t: 'Vài chỗ hệ thống không cho làm. Đó là cố ý, không phải hỏng.' },
      { k: [['Hệ thống chặn', 'Vì sao'], [
        ['Chỉ có sổ học kỳ II, không cho ghi', 'Điểm cả năm là trung bình có trọng số của hai kỳ. Thiếu kỳ I thì không có cách nào tính đúng'],
        ['Không ghi kết luận lên lớp khi thiếu dữ liệu', 'Con số này gửi Sở. “Chưa có dữ liệu” khác “chưa đạt” — ghi bừa là biến em đang học thành em lưu ban'],
        ['Không xét học sinh diện hoà nhập', 'Thông tư 22 đánh giá các em theo kế hoạch giáo dục cá nhân, không xét chung'],
        ['Không đè lên dòng đã có ở năm đích', 'Quyết định của hội đồng đã ghi thì máy không được đè']
      ]] }
    ] }

  ] }

  ];

  /* ==========================================================================
     ĐOẠN MỞ ĐẦU — hệ thống này giúp nhà trường việc gì

     Viết cho người đọc lần đầu: hiệu trưởng, thầy cô mới, đoàn kiểm tra của
     Sở. Ba mảng công việc để thành ba thẻ đứng cạnh nhau chứ không viết liền
     một mạch — người đọc lướt qua là nhận ra ngay hệ thống gồm những gì, rồi
     mới đọc kỹ từng mảng.
     ========================================================================== */
  const GIOI_THIEU = `
  <div class="hd-mo">
    <h3>Hệ thống này giúp nhà trường việc gì</h3>
    <p>Hệ thống tập trung ba mảng công việc lớn của nhà trường vào một nơi:
    <b>Hồ sơ số · Kiểm định chất lượng – Trường chuẩn quốc gia · Đảm bảo chất
    lượng</b>. Thay vì hồ sơ nằm rải rác trong máy tính, Google Drive, Word hay
    Excel, dữ liệu được tổ chức thống nhất, phân quyền rõ ràng và dễ dàng tra
    cứu, cập nhật ngay trên trình duyệt.</p>

    <div class="hd-ba">
      <div class="hd-the">
        <div class="ic">📁</div>
        <h4>Hồ sơ số</h4>
        <p>Nhà trường quản lý tập trung hồ sơ quản trị, chuyên môn, cán bộ –
        giáo viên – nhân viên và học sinh. Tài liệu được sắp xếp theo năm học,
        lĩnh vực, người phụ trách; những hồ sơ đủ điều kiện làm minh chứng có
        thể dùng trực tiếp cho công tác tự đánh giá, không phải tạo thêm một bộ
        hồ sơ riêng để phục vụ kiểm định.</p>
      </div>
      <div class="hd-the">
        <div class="ic">🎖</div>
        <h4>Kiểm định chất lượng –<br>Trường chuẩn quốc gia</h4>
        <p>Hệ thống hỗ trợ thực hiện tự đánh giá theo từng tiêu chuẩn, tiêu chí;
        phân công nhiệm vụ, quản lý minh chứng và theo dõi tiến độ. Hội đồng tự
        đánh giá biết được tiêu chí nào đã hoàn thành, tiêu chí nào còn thiếu và
        ai chịu trách nhiệm, thuận lợi cho việc hoàn thiện hồ sơ đánh giá ngoài
        và công nhận trường đạt chuẩn quốc gia.</p>
      </div>
      <div class="hd-the">
        <div class="ic">📊</div>
        <h4>Đảm bảo chất lượng</h4>
        <p>Nhà trường theo dõi thường xuyên các nội dung cần tự rà soát, kết quả
        thực hiện và những vấn đề cần cải tiến. Mỗi nội dung đều có người phụ
        trách, minh chứng và tiến độ thực hiện, giúp hoạt động đảm bảo chất
        lượng trở thành công việc thường xuyên thay vì chỉ chuẩn bị khi có kiểm
        tra, đánh giá.</p>
      </div>
    </div>

    <div class="hd-nhan">
      <h4>Một nguồn dữ liệu – nhiều mục đích sử dụng</h4>
      <p>Hồ sơ hình thành trong hoạt động hằng ngày được kế thừa cho tự đánh giá,
      kiểm định chất lượng, trường chuẩn quốc gia và đảm bảo chất lượng; qua đó
      giảm hồ sơ trùng lặp, giảm nhập liệu nhiều lần, dễ kiểm tra – đối chiếu và
      chủ động cải tiến chất lượng nhà trường.</p>
    </div>
  </div>`;

  /* ==========================================================================
     VẼ MÀN HÌNH
     ========================================================================== */
  const css = `
  .hd-mo{background:linear-gradient(140deg,#0e2454,var(--navy) 60%,#22488c);
    color:#fff;border-radius:15px;padding:24px 26px;margin:0 0 20px;
    position:relative;overflow:hidden}
  .hd-mo::before{content:"";position:absolute;inset:0;pointer-events:none;
    background-image:radial-gradient(rgba(255,255,255,.09) 1px,transparent 1px);
    background-size:19px 19px}
  .hd-mo>*{position:relative;z-index:2}
  .hd-mo h3{font-family:var(--serif);font-size:20.5px;color:#fff;margin:0 0 12px}
  .hd-mo p{font-size:14.8px;line-height:1.82;margin:0 0 11px;color:rgba(255,255,255,.9)}
  .hd-mo>p:last-of-type{margin-bottom:0}
  .hd-mo b{color:var(--gold-2);font-weight:700}
  /* Ba mảng công việc đứng cạnh nhau. Màn hẹp thì tự xuống thành một cột. */
  .hd-ba{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));
    gap:12px;margin:16px 0 14px}
  .hd-the{background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.17);
    border-radius:12px;padding:15px 16px}
  .hd-the .ic{font-size:26px;line-height:1;margin-bottom:7px}
  .hd-the h4{font-family:var(--serif);font-size:16px;color:var(--gold-2);
    margin:0 0 7px;line-height:1.35}
  .hd-the p{font-size:14px;line-height:1.72;margin:0;color:rgba(255,255,255,.87)}
  .hd-nhan{background:rgba(255,255,255,.13);border-left:4px solid var(--gold-2);
    border-radius:0 12px 12px 0;padding:14px 17px}
  .hd-nhan h4{font-family:var(--serif);font-size:16.5px;color:var(--gold-2);margin:0 0 6px}
  .hd-nhan p{margin:0;font-size:14.5px}
  @media(max-width:640px){.hd-mo{padding:19px 18px}
    .hd-mo h3{font-size:18.5px}.hd-mo p{font-size:14.2px}}
  @media print{.hd-mo{background:#fff!important;color:#000;border:1px solid #999}
    .hd-mo p{color:#000}.hd-mo b{color:#000}.hd-mo h3{color:#000}
    .hd-the{background:#fff;border:1px solid #bbb}
    .hd-the h4,.hd-nhan h4{color:#000}.hd-the p{color:#000}
    .hd-nhan{background:#fff;border:1px solid #bbb;border-left:4px solid #999}
    .hd-mo::before{display:none}}
  .hd-tim{position:relative;margin:0 0 20px}
  .hd-tim input{width:100%;padding:15px 17px 15px 46px;border:1.5px solid #d7dde8;
    border-radius:13px;font-size:15.5px;font-family:inherit;background:#fff;color:var(--ink)}
  .hd-tim input:focus{outline:none;border-color:var(--navy);box-shadow:0 0 0 3px rgba(20,48,107,.1)}
  .hd-tim .ic{position:absolute;left:16px;top:50%;transform:translateY(-50%);
    font-size:17px;opacity:.5;pointer-events:none}
  .hd-vt{background:#f7f9fc;border:1.5px solid #e2e8f2;border-radius:11px;
    padding:11px 15px;font-size:13.6px;color:var(--muted);margin-bottom:18px;line-height:1.6}
  .hd-vt b{color:var(--navy)}
  .hd-phan{margin-bottom:26px}
  .hd-phan>h3{font-family:var(--serif);font-size:20px;color:var(--navy);
    margin:0 0 11px;display:flex;align-items:center;gap:9px}
  .hd-muc{background:#fff;border:1px solid var(--line);border-radius:13px;
    margin-bottom:9px;overflow:hidden;box-shadow:var(--shadow)}
  .hd-dau{width:100%;text-align:left;background:none;border:0;padding:15px 18px;
    font-size:15.6px;font-weight:700;color:var(--navy);font-family:inherit;
    cursor:pointer;display:flex;align-items:center;gap:11px}
  .hd-dau:hover{background:#f5f8fd}
  .hd-dau .mui{margin-left:auto;font-size:13px;color:var(--muted);transition:transform .2s;flex:none}
  /* Mục đang mở có nền xanh đậm nên chữ phải đổi sang trắng. Để nguyên màu
     xanh của lúc đóng thì chữ chìm vào nền, thầy cô không đọc được đang mở
     mục nào — nhất là máy chiếu ở phòng họp vốn đã bợt màu. */
  .hd-muc.mo .hd-dau{background:var(--navy-fill);border-bottom:1px solid var(--line);color:#fff}
  .hd-muc.mo .hd-dau:hover{background:var(--navy-fill)}
  .hd-muc.mo .hd-dau .mui{transform:rotate(90deg);color:#fbbf24}
  .hd-than{display:none;padding:17px 19px 21px;font-size:14.8px;line-height:1.78;color:var(--ink)}
  .hd-muc.mo .hd-than{display:block}
  .hd-than p{margin:0 0 11px}
  .hd-than code{background:#f1f5fb;border:1px solid #dde5f0;border-radius:5px;
    padding:1px 5px;font-size:13.2px}
  .hd-than ol{margin:0 0 13px;padding-left:0;list-style:none;counter-reset:hdb}
  .hd-than ol li{counter-increment:hdb;position:relative;padding:7px 0 7px 40px;margin:0}
  .hd-than ol li::before{content:counter(hdb);position:absolute;left:0;top:6px;
    width:27px;height:27px;border-radius:50%;background:var(--navy);color:#fff;
    display:grid;place-items:center;font-size:13.4px;font-weight:700;font-family:var(--serif)}
  .hd-canh{background:#fff8e8;border:1px solid #f0d089;border-left:4px solid #e0a72e;
    color:#7a5410;border-radius:10px;padding:12px 15px;margin:12px 0;font-size:14.2px}
  .hd-canh b{color:#6b4409}
  .hd-dat{background:#f2fdf6;border:1px solid #bfe8cd;border-left:4px solid #2f9e5f;
    color:#1a6437;border-radius:10px;padding:12px 15px;margin:12px 0;font-size:14.2px}
  .hd-dat::before{content:"Biết là đúng khi: ";font-weight:700}
  .hd-dat b{color:#15803d}
  .hd-bang{width:100%;border-collapse:collapse;margin:12px 0;font-size:14px}
  .hd-bang th{background:var(--navy);color:#fff;font-weight:700;padding:10px 12px;
    text-align:left;font-size:13.4px;border:1px solid #24407c}
  .hd-bang td{border:1px solid var(--line);padding:9px 12px;vertical-align:top}
  .hd-bang tr:nth-child(even) td{background:#fafcff}
  .hd-cuon{overflow-x:auto;-webkit-overflow-scrolling:touch}
  /* Ảnh minh hoạ. Bấm vào ảnh là mở tệp gốc ra tab mới để phóng to xem cho rõ. */
  .hd-anh{margin:14px 0;padding:0;border:1px solid var(--line);border-radius:12px;
    overflow:hidden;background:#fbfcfe}
  .hd-anh img{display:block;width:100%;height:auto;cursor:zoom-in}
  .hd-anh figcaption{font-size:13.4px;color:var(--muted);padding:9px 13px;
    border-top:1px solid var(--line);line-height:1.6;background:#fff}
  .hd-anh figcaption b{color:var(--navy)}
  /* Chưa có tệp ảnh: ẩn hẳn với người dùng thường, chỉ quản trị thấy khung nhắc */
  .hd-anh.thieu{display:none}
  body.hd-qt .hd-anh.thieu{display:block;background:#fff8e8;border:1.5px dashed #e0a72e}
  body.hd-qt .hd-anh.thieu a{display:none}
  body.hd-qt .hd-anh.thieu figcaption{background:transparent;border-top:0;color:#7a5410}
  body.hd-qt .hd-anh.thieu figcaption b{color:#6b4409}
  .hd-trong{background:#fff8e8;border:1px solid #f0d089;border-radius:12px;
    padding:19px;text-align:center;color:#7a5410;font-size:15px}
  @media(max-width:640px){
    .hd-dau{font-size:14.6px;padding:13px 15px}
    .hd-than{padding:14px 15px 17px;font-size:14.2px}
  }
  @media print{
    .hd-tim,.hd-vt{display:none!important}
    .hd-than{display:block!important}
    .hd-muc{break-inside:avoid;box-shadow:none;border:1px solid #999}
    .hd-anh{break-inside:avoid}
    .hd-anh.thieu{display:none!important}
    .hd-dau .mui{display:none}
  }`;

  function chan(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  /* Nội dung do chính dự án viết nên cho phép thẻ <b> và <code>. Chặn dấu
     ngoặc nhọn trước, rồi mở lại đúng hai cặp thẻ ấy — không mở cửa cho thẻ
     nào khác. */
  function dam(s) {
    return chan(s)
      .replace(/&lt;b&gt;/g, '<b>').replace(/&lt;\/b&gt;/g, '</b>')
      .replace(/&lt;code&gt;/g, '<code>').replace(/&lt;\/code&gt;/g, '</code>');
  }
  function khongDau(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  }

  function vaiTro() {
    return (window.NGUOI_DUNG && window.NGUOI_DUNG.vai_tro) || null;
  }

  /* Bỏ thẻ đi để dùng làm thuộc tính alt — alt không hiểu HTML */
  function chuTran(s) {
    return String(s || '').replace(/<[^>]*>/g, '');
  }

  function veKhoi(k) {
    if (k.t) return '<p>' + dam(k.t) + '</p>';
    if (k.b) return '<ol>' + k.b.map(x => '<li>' + dam(x) + '</li>').join('') + '</ol>';
    if (k.c) return '<div class="hd-canh">' + dam(k.c) + '</div>';
    if (k.d) return '<div class="hd-dat">' + dam(k.d) + '</div>';
    if (k.a) {
      /* onerror gắn thẳng vào thẻ chứ không nghe sự kiện sau khi vẽ: ảnh hỏng
         nằm sẵn trong bộ nhớ đệm có thể báo lỗi ngay, trước khi kịp gắn hàm
         nghe — lúc ấy khối ảnh trống nằm lại mãi trên màn hình. */
      const tep = THU_MUC_ANH + k.a;
      return '<figure class="hd-anh">'
        + '<a href="' + chan(tep) + '" target="_blank" rel="noopener">'
        + '<img src="' + chan(tep) + '" alt="' + chan(chuTran(k.ct)) + '" loading="lazy"'
        + ' onerror="this.closest(\'figure\').classList.add(\'thieu\')"></a>'
        + '<figcaption>' + dam(k.ct || '')
        + '<span class="hd-thieu-nhac"><br><b>Chưa có ảnh này.</b> Chụp màn hình rồi lưu thành '
        + '<code>' + chan(THU_MUC_ANH + k.a) + '</code></span>'
        + '</figcaption></figure>';
    }
    if (k.k) {
      const cot = k.k[0], dong = k.k[1];
      return '<div class="hd-cuon"><table class="hd-bang"><thead><tr>'
        + cot.map(c => '<th>' + dam(c) + '</th>').join('')
        + '</tr></thead><tbody>'
        + dong.map(d => '<tr>' + d.map(o => '<td>' + dam(o) + '</td>').join('') + '</tr>').join('')
        + '</tbody></table></div>';
    }
    return '';
  }

  /* Gom mọi chữ của một mục lại để ô tìm kiếm dò được cả nội dung bên trong,
     không riêng tiêu đề. Thầy cô nhớ mang máng "cái nút màu đỏ ghi đè" chứ
     ít khi nhớ đúng tên mục. */
  function chuCuaMuc(m) {
    let s = m.td + ' ' + (m.tim || '');
    m.nd.forEach(k => {
      if (k.t) s += ' ' + k.t;
      if (k.b) s += ' ' + k.b.join(' ');
      if (k.c) s += ' ' + k.c;
      if (k.d) s += ' ' + k.d;
      if (k.ct) s += ' ' + k.ct;
      if (k.k) s += ' ' + k.k[0].join(' ') + ' ' + k.k[1].map(d => d.join(' ')).join(' ');
    });
    return khongDau(s);
  }

  let TU_TIM = '';

  function ve() {
    const hop = document.getElementById('hdNoiDung');
    if (!hop) return;
    const vt = vaiTro();
    const tim = khongDau(TU_TIM).trim();

    /* Khung nhắc "chưa có ảnh" chỉ hiện với quản trị. Đánh dấu trên thẻ body
       để CSS lo phần còn lại, khỏi rắc mỗi khối ảnh một điều kiện. */
    document.body.classList.toggle('hd-qt', vt === 'admin');

    /* Đoạn mở đầu đặt TRƯỚC ô tìm kiếm: người lần đầu vào thì đọc để biết hệ
       thống làm được gì, người đã quen thì lướt qua xuống ô tìm. Đang tìm thì
       ẩn đi — lúc ấy thầy cô cần kết quả, không cần đọc lời giới thiệu. */
    let h = '';
    if (!tim) h += GIOI_THIEU;

    h += '<div class="hd-tim"><span class="ic">🔍</span>'
      + '<input type="search" id="hdTim" placeholder="Tìm việc cần làm — ví dụ: nạp sổ điểm, in danh sách, hội đồng…" '
      + 'value="' + chan(TU_TIM) + '"></div>';

    /* Nói rõ đang lọc theo vai trò nào, và vì sao có mục không thấy */
    h += '<div class="hd-vt">'
      + (vt
          ? 'Đang hiện phần dành cho <b>' + chan(tenVaiTro(vt)) + '</b>. '
            + 'Việc nào không thuộc quyền của thầy cô thì không hiện ở đây — bày ra một việc bấm vào không được chỉ khiến thầy cô tưởng máy hỏng.'
          : 'Thầy cô <b>chưa đăng nhập</b> nên đang hiện toàn bộ hướng dẫn. Đăng nhập rồi thì chỉ còn phần thuộc quyền của mình.')
      + '</div>';

    let soMuc = 0;
    PHAN.forEach((p, iP) => {
      const muc = p.muc.filter(m => {
        if (vt && m.ai.indexOf(vt) < 0) return false;
        if (tim && chuCuaMuc(m).indexOf(tim) < 0) return false;
        return true;
      });
      if (!muc.length) return;
      soMuc += muc.length;
      h += '<div class="hd-phan"><h3><span>' + p.ic + '</span>' + chan(p.ten) + '</h3>';
      muc.forEach((m, iM) => {
        /* Đang tìm thì mở sẵn: gõ xong còn phải bấm thêm một cái nữa mới đọc
           được thì ô tìm kiếm mất một nửa tác dụng. */
        const mo = tim ? ' mo' : '';
        h += '<div class="hd-muc' + mo + '" data-m="' + iP + '-' + iM + '">'
          + '<button type="button" class="hd-dau">' + chan(m.td)
          + '<span class="mui">▶</span></button>'
          + '<div class="hd-than">' + m.nd.map(veKhoi).join('') + '</div></div>';
      });
      h += '</div>';
    });

    if (!soMuc) {
      h += '<div class="hd-trong">Không có mục nào khớp với <b>“' + chan(TU_TIM) + '”</b>.<br>'
        + 'Thầy cô thử gõ ngắn hơn, ví dụ <b>vnedu</b>, <b>in</b>, <b>excel</b>, <b>lên lớp</b>.</div>';
    }

    hop.innerHTML = h;

    const o = document.getElementById('hdTim');
    if (o) {
      o.addEventListener('input', function () {
        TU_TIM = this.value;
        ve();
        /* Vẽ lại là mất con trỏ, thầy cô đang gõ dở mà phải bấm lại vào ô */
        const m = document.getElementById('hdTim');
        if (m) { m.focus(); m.setSelectionRange(m.value.length, m.value.length); }
      });
    }
    hop.querySelectorAll('.hd-dau').forEach(b => {
      b.addEventListener('click', function () {
        this.parentNode.classList.toggle('mo');
      });
    });
  }

  function tenVaiTro(v) {
    return ({
      admin: 'Quản trị hệ thống', ban_giam_hieu: 'Ban giám hiệu',
      to_truong: 'Tổ trưởng chuyên môn', giao_vien: 'Giáo viên',
      nhan_vien: 'Nhân viên'
    })[v] || v;
  }

  /* Câu nhắc chụp ảnh chỉ hiện ở khung đang thiếu ảnh. Để trong tệp CSS chính
     thì phải nhớ hai chỗ, nên gắn luôn vào đây cạnh phần vẽ. */
  const cssNhac = `
  .hd-thieu-nhac{display:none}
  .hd-anh.thieu .hd-thieu-nhac{display:inline}`;

  const st = document.createElement('style');
  st.textContent = css + cssNhac;
  document.head.appendChild(st);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ve);
  } else {
    ve();
  }

  /* Đăng nhập xong thì vẽ lại để lọc đúng vai trò. Không có chỗ này thì thầy
     cô mở hướng dẫn trước khi đăng nhập sẽ thấy mãi bản đầy đủ.
     Bám vào sự kiện dangnhap.js vẫn phát sẵn, không sửa tệp đó — một chỗ
     đăng nhập, nhiều nơi cùng nghe, thêm màn hình mới không phải sửa lại. */
  document.addEventListener('dangnhap-xong', function () {
    TU_TIM = '';
    ve();
  });

  window.huongDanVeLai = ve;
})();
