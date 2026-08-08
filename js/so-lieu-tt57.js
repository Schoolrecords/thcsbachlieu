/* ============================================================================
   BẢNG SỐ LIỆU 03 NĂM HỌC — Phần I "THÔNG TIN DỮ LIỆU" (trường phổ thông)
   Biểu mẫu đính kèm báo cáo tự đánh giá, Biểu 1 Phụ lục V Thông tư
   57/2026/TT-BGDĐT, trang 12-15 của bản Thông tư.

   Tệp này làm HAI việc bằng MỘT bảng khai báo:
     · Vẽ màn hình nhập trong bảng Quản trị hệ thống (tab "Số liệu báo cáo")
     · Sinh đúng bảng đó ra bản Word khi xuất báo cáo tự đánh giá

   Vì sao phải chung một khai báo: nếu màn hình nhập và bản Word mỗi bên tự liệt
   kê các dòng, thì thêm một dòng ở bên này mà quên bên kia là nhà trường nhập số
   vào chỗ không bao giờ in ra — mất công mà không ai biết.

   BA LOẠI Ô, PHÂN BIỆT RÕ TRÊN MÀN HÌNH

     dem   Máy đếm từ dữ liệu thật (hàm so_lieu_tt57 của sql/31). Không cho sửa
           tay. Đếm không ra thì MỞ cho nhập — năm học cũ chưa nhập học sinh vào
           hệ thống thì phải cho nhà trường điền, chứ không để trống vĩnh viễn.
     nhap  Hệ thống không có dữ liệu, nhà trường nhập. Đếm là đoán, mà đây là số
           liệu gửi Sở.
     cong  Máy cộng từ các dòng con. Không cho sửa: cho sửa thì có ngày tổng
           không bằng tổng các phần, hội đồng thẩm định cộng lại là thấy ngay.

   ⚠ ĐỘI NGŨ CHỈ ĐẾM ĐƯỢC CHO NĂM HỌC HIỆN TẠI. Danh sách CBGV-NV là danh sách
     hôm nay, không có cột năm học. Cột của hai năm trước phải nhập tay — xem ghi
     chú đầu tệp sql/31.
   ============================================================================ */

(function () {
  'use strict';

  if (typeof CAU_HINH === 'undefined' || !CAU_HINH.DA_NOI) return;

  const sb = () => window.sbClient;

  /* ==========================================================================
     KHAI BÁO BIỂU MẪU — thứ tự và chữ nghĩa theo đúng bản in của Thông tư
     ==========================================================================
     Mỗi dòng: { ma, nhan, kieu, cap, congTu, ghi }
       cap    0 = mục lớn (I, II…), 1 = mục con (1, 2, 3), 2 = mục cháu (a, b, c)
       stt    chữ ở cột TT của biểu mẫu
       ghi    chữ cho cột "Ghi chú"
     Dòng có kieu 'chu' là dòng chữ, không có ô số nào. */

  /* --- Khối thông tin đầu biểu mẫu (hai bảng nhỏ nằm cạnh nhau) --- */
  const DAU_TRAI = [
    ['tt.tinh', 'Tỉnh/thành phố trực thuộc Trung ương'],
    ['tt.xa', 'Xã / phường/thị trấn'],
    ['tt.chuan_qg', 'Đạt chuẩn quốc gia năm, mức độ'],
    ['tt.nam_tl', 'Năm thành lập trường (theo quyết định thành lập)'],
    ['tt.cong_lap', 'Công lập'],
    ['tt.tu_thuc', 'Tư thục'],
    ['tt.chuyen_biet', 'Trường chuyên biệt'],
    ['tt.lien_ket_nn', 'Trường liên kết với nước ngoài']
  ];
  const DAU_PHAI = [
    ['tt.ht', 'Họ và tên hiệu trưởng'],
    ['tt.dien_thoai', 'Điện thoại'],
    ['tt.website', 'Website'],
    ['tt.so_diem_truong', 'Số điểm trường'],
    ['tt.loai_hinh_khac', 'Loại hình khác'],
    ['tt.vung_kho_khan', 'Thuộc vùng khó khăn'],
    ['tt.vung_dbkk', 'Thuộc vùng đặc biệt khó khăn']
  ];

  /* --- 1. Số lớp học --- */
  const M1_LOP = [
    { ma: 'lop.k6', nhan: 'Khối lớp 6', kieu: 'dem' },
    { ma: 'lop.k7', nhan: 'Khối lớp 7', kieu: 'dem' },
    { ma: 'lop.k8', nhan: 'Khối lớp 8', kieu: 'dem' },
    { ma: 'lop.k9', nhan: 'Khối lớp 9', kieu: 'dem' },
    { ma: 'lop.cong', nhan: 'Cộng', kieu: 'cong', congTu: ['lop.k6', 'lop.k7', 'lop.k8', 'lop.k9'] }
  ];

  /* --- 2. Cơ cấu khối công trình --- */
  const M2_CT = [
    { stt: 'I', ma: 'cc.I', nhan: 'Phòng học, phòng học bộ môn và khối phục vụ học tập',
      kieu: 'cong', congTu: ['cc.1', 'cc.2', 'cc.3'], cap: 0 },
    { stt: '1', ma: 'cc.1', nhan: 'Phòng học', kieu: 'cong',
      congTu: ['cc.1a', 'cc.1b', 'cc.1c'], cap: 1 },
    { stt: 'a', ma: 'cc.1a', nhan: 'Phòng kiên cố', kieu: 'nhap', cap: 2 },
    { stt: 'b', ma: 'cc.1b', nhan: 'Phòng bán kiên cố', kieu: 'nhap', cap: 2 },
    { stt: 'c', ma: 'cc.1c', nhan: 'Phòng tạm', kieu: 'nhap', cap: 2 },
    { stt: '2', ma: 'cc.2', nhan: 'Phòng học bộ môn', kieu: 'cong',
      congTu: ['cc.2a', 'cc.2b', 'cc.2c'], cap: 1 },
    { stt: 'a', ma: 'cc.2a', nhan: 'Phòng kiên cố', kieu: 'nhap', cap: 2 },
    { stt: 'b', ma: 'cc.2b', nhan: 'Phòng bán kiên cố', kieu: 'nhap', cap: 2 },
    { stt: 'c', ma: 'cc.2c', nhan: 'Phòng tạm', kieu: 'nhap', cap: 2 },
    { stt: '3', ma: 'cc.3', nhan: 'Khối phục vụ học tập', kieu: 'cong',
      congTu: ['cc.3a', 'cc.3b', 'cc.3c'], cap: 1 },
    { stt: 'a', ma: 'cc.3a', nhan: 'Phòng kiên cố', kieu: 'nhap', cap: 2 },
    { stt: 'b', ma: 'cc.3b', nhan: 'Phòng bán kiên cố', kieu: 'nhap', cap: 2 },
    { stt: 'c', ma: 'cc.3c', nhan: 'Phòng tạm', kieu: 'nhap', cap: 2 },
    { stt: 'II', ma: 'cc.II', nhan: 'Khối phòng hành chính - quản trị', kieu: 'cong',
      congTu: ['cc.II1', 'cc.II2', 'cc.II3'], cap: 0 },
    { stt: '1', ma: 'cc.II1', nhan: 'Phòng kiên cố', kieu: 'nhap', cap: 1 },
    { stt: '2', ma: 'cc.II2', nhan: 'Phòng bán kiên cố', kieu: 'nhap', cap: 1 },
    { stt: '3', ma: 'cc.II3', nhan: 'Phòng tạm', kieu: 'nhap', cap: 1 },
    { stt: 'III', ma: 'cc.III', nhan: 'Thư viện', kieu: 'nhap', cap: 0 },
    { stt: 'IV', ma: 'cc.IV', nhan: 'Các công trình, khối phòng chức năng khác (nếu có)',
      kieu: 'nhap', cap: 0 },
    { stt: '', ma: 'cc.cong', nhan: 'Cộng', kieu: 'cong',
      congTu: ['cc.I', 'cc.II', 'cc.III', 'cc.IV'], cap: 0 }
  ];

  /* --- 3a. Đội ngũ tại thời điểm tự đánh giá (chỉ một năm học) --- */
  const DN_HANG = [
    ['ht', 'Hiệu trưởng', 'nay.ht'],
    ['pht', 'Phó hiệu trưởng', 'nay.pht'],
    ['gv', 'Giáo viên', 'nay.gv'],
    ['nsht', 'Nhân sự hỗ trợ giáo dục', 'nay.nsht']
  ];
  const DN_COT = [
    ['tong', 'Tổng số'], ['nu', 'Nữ'], ['dan_toc', 'Dân tộc'],
    ['td_chua', 'Chưa đạt chuẩn'], ['td_dat', 'Đạt chuẩn'], ['td_tren', 'Trên chuẩn']
  ];

  /* --- 3b. Đội ngũ 03 năm học gần nhất --- */
  const M3B = [
    { stt: '1', ma: 'dn3.gv_tong', nhan: 'Tổng số giáo viên', kieu: 'dem', tuDem: 'nay.gv' },
    { stt: '2', ma: 'dn3.gv_lop', nhan: 'Tỉ lệ giáo viên/lớp', kieu: 'dem', tuDem: 'nay.gv_lop' },
    { stt: '3', ma: 'dn3.gv_hs', nhan: 'Tỉ lệ giáo viên/học sinh', kieu: 'dem', tuDem: 'nay.gv_hs' },
    { stt: '4', ma: 'dn3.gv_gioi', nhan: 'Tổng số giáo viên dạy giỏi các cấp (nếu có)', kieu: 'nhap' },
    { stt: '5', ma: 'dn3.gv_gioi_tinh', nhan: 'Tổng số giáo viên dạy giỏi cấp tỉnh trở lên (nếu có)', kieu: 'nhap' },
    { stt: '…', ma: 'dn3.khac', nhan: 'Các số liệu khác (nếu có)', kieu: 'nhap' }
  ];

  /* --- 4a. Học sinh — số liệu chung --- */
  const M4A = [
    { stt: '1', ma: 'hs.tong', nhan: 'Tổng số học sinh', kieu: 'dem' },
    { stt: '', ma: 'hs.nu', nhan: '- Nữ', kieu: 'dem', cap: 2 },
    { stt: '', ma: 'hs.dtts', nhan: '- Dân tộc thiểu số', kieu: 'nhap', cap: 2,
      ghi: 'Hệ thống chưa có cột dân tộc' },
    { stt: '', ma: 'hs.k6', nhan: '- Khối lớp 6', kieu: 'dem', cap: 2 },
    { stt: '', ma: 'hs.k7', nhan: '- Khối lớp 7', kieu: 'dem', cap: 2 },
    { stt: '', ma: 'hs.k8', nhan: '- Khối lớp 8', kieu: 'dem', cap: 2 },
    { stt: '', ma: 'hs.k9', nhan: '- Khối lớp 9', kieu: 'dem', cap: 2 },
    { stt: '2', ma: 'hs.tuyen_moi', nhan: 'Tổng số tuyển mới', kieu: 'nhap' },
    { stt: '3', ma: 'hs.hai_buoi', nhan: 'Học 2 buổi/ngày', kieu: 'nhap' },
    { stt: '4', ma: 'hs.ban_tru', nhan: 'Bán trú', kieu: 'nhap' },
    { stt: '5', ma: 'hs.noi_tru', nhan: 'Nội trú', kieu: 'nhap' },
    { stt: '6', ma: 'hs.bq_lop', nhan: 'Bình quân số học sinh/lớp học', kieu: 'dem' },
    { stt: '7', ma: 'hs.dung_tuoi', nhan: 'Số lượng và tỉ lệ % đi học đúng độ tuổi', kieu: 'nhap' },
    { stt: '', ma: 'hs.dung_tuoi_nu', nhan: '- Nữ', kieu: 'nhap', cap: 2 },
    { stt: '', ma: 'hs.dung_tuoi_dtts', nhan: '- Dân tộc thiểu số', kieu: 'nhap', cap: 2 },
    { stt: '8', ma: 'hs.gioi_cac_cap', nhan: 'Tổng số học sinh giỏi các cấp (nếu có)', kieu: 'nhap' },
    { stt: '9', ma: 'hs.gioi_qg', nhan: 'Tổng số học sinh giỏi quốc gia (nếu có)', kieu: 'nhap' },
    { stt: '10', ma: 'hs.chinh_sach', nhan: 'Tổng số học sinh thuộc đối tượng chính sách', kieu: 'nhap' },
    { stt: '', ma: 'hs.chinh_sach_nu', nhan: '- Nữ', kieu: 'nhap', cap: 2 },
    { stt: '', ma: 'hs.chinh_sach_dtts', nhan: '- Dân tộc thiểu số', kieu: 'nhap', cap: 2 },
    { stt: '11', ma: 'hs.hcdb', nhan: 'Tổng số học sinh (trẻ em) có hoàn cảnh đặc biệt', kieu: 'nhap' },
    { stt: '…', ma: 'hs.khac', nhan: 'Các số liệu khác (nếu có)', kieu: 'nhap' }
  ];

  /* --- 4c. Kết quả giáo dục (trường THCS) ---
     CHÚ Ý: biểu mẫu in ra chỉ có ba mức học tập (Tốt, Khá, Chưa đạt) và ba mức
     rèn luyện (Tốt, Khá, Đạt). Thông tư 22/2021 thì có bốn mức cho cả hai. Ở đây
     giữ ĐÚNG các dòng của biểu mẫu, không tự thêm dòng vào một biểu mẫu do Bộ
     ban hành; hai mức còn lại được ghi thành một dòng chú thích dưới bảng. */
  const M4C = [
    { ma: 'kq.ht_tot', nhan: 'Tỉ lệ học sinh có kết quả học tập xếp loại Tốt', kieu: 'dem' },
    { ma: 'kq.ht_kha', nhan: 'Tỉ lệ học sinh có kết quả học tập xếp loại Khá', kieu: 'dem' },
    { ma: 'kq.ht_chua_dat', nhan: 'Tỉ lệ học sinh có kết quả học tập xếp loại Chưa đạt', kieu: 'dem' },
    { ma: 'kq.rl_tot', nhan: 'Tỉ lệ học sinh có kết quả rèn luyện xếp loại Tốt', kieu: 'dem' },
    { ma: 'kq.rl_kha', nhan: 'Tỉ lệ học sinh có kết quả rèn luyện xếp loại Khá', kieu: 'dem' },
    { ma: 'kq.rl_dat', nhan: 'Tỉ lệ học sinh có kết quả rèn luyện xếp loại Đạt', kieu: 'dem' },
    { ma: 'kq.hoan_thanh_lop', nhan: 'Tỉ lệ học sinh hoàn thành chương trình lớp học', kieu: 'dem' },
    { ma: 'kq.chuyen_cap', nhan: 'Tỉ lệ học sinh chuyển cấp', kieu: 'nhap' }
  ];

  /* Mọi mã dòng theo năm học — dùng để biết ô nào cần đọc, ô nào cần ghi */
  function moiDongTheoNam() {
    const ra = [];
    M1_LOP.forEach(x => ra.push(x));
    M2_CT.forEach(x => ra.push(x));
    M3B.forEach(x => ra.push(x));
    M4A.forEach(x => ra.push(x));
    M4C.forEach(x => ra.push(x));
    return ra;
  }

  /* ==========================================================================
     DỮ LIỆU
     ========================================================================== */
  let NAM = [];          // ba năm học, cũ nhất trước
  let DEM = {};          // nam_hoc -> { ma: gia_tri }  (máy đếm)
  let NHAP = {};         // nam_hoc -> { ma: gia_tri }  (người nhập)
  let DA_TAI = false;
  /* Hàm so_lieu_tt57 trả về dòng 'quyen.toan_truong' cho biết người đang đăng
     nhập có xem được số liệu toàn trường không (xem tệp sql/33). Không có quyền
     thì hàm bỏ qua phần tỉ lệ xếp loại — phải NÓI RA, chứ để trống thì thầy cô
     tưởng hệ thống mất số. */
  let CO_QUYEN = true;

  function baNamHoc(namHoc) {
    const n = parseInt(String(namHoc || CAU_HINH.NAM_HOC || '').slice(0, 4), 10);
    if (!n) return [];
    /* "Số liệu của 03 năm học gần nhất tính đến thời điểm tự đánh giá" — gồm cả
       năm học đang tự đánh giá, xếp cũ nhất trước cho giống bản in. */
    return [n - 2, n - 1, n].map(x => x + '-' + (x + 1));
  }

  async function tai(namHoc) {
    const s = sb();
    if (!s) throw new Error('Chưa nối được cơ sở dữ liệu.');
    NAM = baNamHoc(namHoc);
    const cau = await Promise.all(
      NAM.map(nh => s.rpc('so_lieu_tt57', { p_nam_hoc: nh }))
        .concat([s.from('so_lieu_bao_cao').select('*').in('nam_hoc', NAM)])
    );
    DEM = {}; NHAP = {};
    NAM.forEach((nh, i) => {
      DEM[nh] = {}; NHAP[nh] = {};
      const r = cau[i];
      /* Chưa chạy sql/31 thì hàm chưa có — ném lỗi ra để màn hình nói thẳng,
         chứ không hiện một bảng trắng trông như trường chưa có số liệu nào. */
      if (r.error) throw r.error;
      (r.data || []).forEach(x => { DEM[nh][x.ma_dong] = x.gia_tri; });
    });
    /* Đọc ở năm học đang làm — ba năm cùng một người gọi nên quyền như nhau */
    const cuoi = NAM[NAM.length - 1];
    CO_QUYEN = String((DEM[cuoi] || {})['quyen.toan_truong'] || '1') !== '0';
    const bg = cau[cau.length - 1];
    if (bg.error) throw bg.error;
    (bg.data || []).forEach(x => {
      if (!NHAP[x.nam_hoc]) NHAP[x.nam_hoc] = {};
      NHAP[x.nam_hoc][x.ma_dong] = x.gia_tri;
    });
    DA_TAI = true;
  }

  /* Giá trị cuối cùng của một ô, theo đúng thứ tự ưu tiên đã nói ở đầu tệp:
     máy cộng → máy đếm → người nhập. */
  function giaTri(nh, d) {
    if (d.kieu === 'cong') {
      let tong = 0, co = false;
      (d.congTu || []).forEach(function (m) {
        const x = giaTri(nh, timDong(m) || { ma: m, kieu: 'nhap' });
        const n = soCua(x);
        if (n !== null) { tong += n; co = true; }
      });
      return co ? String(tong) : '';
    }
    if (d.kieu === 'dem') {
      /* Dòng 3b lấy số đội ngũ, mà số đội ngũ chỉ đúng cho năm học hiện tại */
      const khoa = d.tuDem || d.ma;
      const chiNamNay = String(khoa).indexOf('nay.') === 0;
      if (!chiNamNay || nh === NAM[NAM.length - 1]) {
        const v = (DEM[nh] || {})[khoa];
        if (v !== undefined && v !== null && String(v) !== '') return String(v);
      }
    }
    const t = (NHAP[nh] || {})[d.ma];
    return (t === undefined || t === null) ? '' : String(t);
  }

  /* Những dòng mà số 0 KHÔNG THỂ là số thật khi trường đang có học sinh. Đếm ra 0
     ở đây nghĩa là dữ liệu nguồn còn trống, không phải "trường không có em nào".

     Đây là lỗi thật đã gặp ngày 08/8/2026: bảng hoc_sinh chưa nhập cột gioi_tinh
     nên hs.nu đếm ra 0, mà màn hình lại coi 0 là "máy đếm được" rồi KHOÁ ô đó —
     báo cáo gửi Sở in ra "466 học sinh, 0 nữ". Số 0 bịa còn tệ hơn ô trống.

     Không đưa vào danh sách này những dòng mà 0 là số thật: bán trú, nội trú,
     học sinh giỏi quốc gia — trường không có thì đúng là 0. */
  const KHONG_THE_BANG_0 = ['hs.tong', 'hs.nu', 'hs.bq_lop', 'lop.cong',
                            'nay.gv', 'nay.ht'];

  /* Ô 'dem' mà máy đếm được thì khoá; đếm không ra thì mở cho nhập */
  function mayDemDuoc(nh, d) {
    if (d.kieu !== 'dem') return false;
    const khoa = d.tuDem || d.ma;
    if (String(khoa).indexOf('nay.') === 0 && nh !== NAM[NAM.length - 1]) return false;
    const v = (DEM[nh] || {})[khoa];
    if (v === undefined || v === null || String(v) === '') return false;
    if (KHONG_THE_BANG_0.indexOf(d.ma) >= 0 && soCua(v) === 0) return false;
    return true;
  }

  /* Dòng nào đếm ra 0 một cách vô lý thì nói ra, để thầy cô biết phải đi sửa dữ
     liệu nguồn chứ không phải gõ tay vào đây mỗi năm. */
  function dongNghiVan() {
    const nh = NAM[NAM.length - 1];
    const ds = KHONG_THE_BANG_0.filter(function (ma) {
      const v = (DEM[nh] || {})[ma];
      return v !== undefined && v !== null && String(v) !== '' && soCua(v) === 0;
    });
    if (!ds.length) return '';
    const ten = { 'hs.tong': 'Tổng số học sinh', 'hs.nu': 'Học sinh nữ',
      'hs.bq_lop': 'Bình quân học sinh/lớp', 'lop.cong': 'Tổng số lớp',
      'nay.gv': 'Tổng số giáo viên', 'nay.ht': 'Hiệu trưởng' };
    return '<div class="sl-canh do"><b>Có dòng đếm ra 0 trong khi trường đang hoạt động:</b> '
      + ds.map(m => chan(ten[m] || m)).join(' · ')
      + '.<br>Hệ thống <b>không</b> điền số 0 vào báo cáo — các ô đó đang mở cho nhập tay. '
      + 'Nhưng gõ tay chỉ chữa được một năm: gốc là dữ liệu nguồn còn trống '
      + '(ví dụ bảng học sinh chưa nhập cột giới tính). Sửa ở gốc thì máy tự đếm mọi năm.</div>';
  }

  let CHI_MUC = null;
  function timDong(ma) {
    if (!CHI_MUC) {
      CHI_MUC = {};
      moiDongTheoNam().forEach(function (d) { CHI_MUC[d.ma] = d; });
    }
    return CHI_MUC[ma];
  }

  /* "12", "1,25", "98,5%" -> số. Không phải số thì trả null để dòng Cộng bỏ qua
     chứ không cộng thành NaN rồi in ra chữ "NaN" trong văn bản gửi Sở. */
  function soCua(s) {
    const t = String(s == null ? '' : s).replace('%', '').replace(',', '.').trim();
    if (!t) return null;
    const n = parseFloat(t);
    return isNaN(n) ? null : n;
  }

  function chan(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ==========================================================================
     GHI
     ========================================================================== */
  async function ghiO(nh, ma, gt) {
    const s = sb();
    const moi = String(gt == null ? '' : gt).trim();
    if (String((NHAP[nh] || {})[ma] || '') === moi) return true;
    const r = await s.from('so_lieu_bao_cao').upsert({
      nam_hoc: nh, ma_dong: ma, gia_tri: moi || null,
      cap_nhat_boi: window.NGUOI_DUNG ? window.NGUOI_DUNG.id : null
    }, { onConflict: 'nam_hoc,ma_dong' }).select('ma_dong');
    if (r.error) throw r.error;
    if (!r.data || !r.data.length) {
      throw new Error('Máy chủ không cho ghi ô này — kiểm tra quyền quản trị.');
    }
    if (!NHAP[nh]) NHAP[nh] = {};
    NHAP[nh][ma] = moi;
    return true;
  }

  /* ==========================================================================
     MÀN HÌNH NHẬP — tab trong bảng Quản trị hệ thống
     ========================================================================== */
  const css = `
  .sl-canh{background:#eef4ff;border:1px solid #cfe0ff;color:#1d4ed8;border-radius:10px;
    padding:12px 15px;font-size:13.5px;margin-bottom:13px;line-height:1.65}
  .sl-canh.do{background:#fdf3f2;border-color:#f3c9c5;color:#8a3428}
  .sl-bang{width:100%;border-collapse:collapse;font-size:13.2px}
  .sl-bang th{background:#eef3fb;color:#14306b;font-weight:700;padding:7px 8px;
    border:1px solid #dbe3ef;font-size:12.3px;text-align:center;white-space:nowrap}
  .sl-bang td{border:1px solid #e4e9f2;padding:4px 7px;vertical-align:middle}
  .sl-bang td.nhan{text-align:left}
  .sl-bang tr.nhom td{background:#f4f7fc;font-weight:700}
  .sl-bang tr.cong td{background:#eef3fb;font-weight:700}
  .sl-stt{width:38px;text-align:center;color:#64748b;font-size:12px}
  .sl-o{width:100%;padding:4px 6px;border:1.5px solid #cbd5e1;border-radius:6px;
    font-size:13px;font-family:inherit;text-align:center;background:#fff}
  .sl-o:focus{outline:0;border-color:#2563eb;box-shadow:0 0 0 3px #dbeafe}
  .sl-khoa{display:block;text-align:center;font-weight:700;color:#14306b}
  .sl-khoa i{display:block;font-size:10.6px;font-weight:600;color:#5eb884;font-style:normal}
  .sl-nho{font-size:11.8px;color:#64748b}
  .sl-muc{font-size:14px;font-weight:700;color:#14306b;margin:20px 0 7px}
  .sl-luu{color:#15803d;font-weight:600;font-size:12px;margin-left:7px;opacity:0;transition:.3s}
  .sl-luu.hien{opacity:1}
  `;
  document.head.insertAdjacentHTML('beforeend', '<style>' + css + '</style>');

  function laQuanTri() {
    const u = window.NGUOI_DUNG;
    return !!u && ['admin', 'ban_giam_hieu'].includes(u.vai_tro);
  }

  function oNhapHtml(nh, d, suaDuoc) {
    if (d.kieu === 'cong') {
      return '<span class="sl-khoa">' + chan(giaTri(nh, d) || '—') + '<i>tự cộng</i></span>';
    }
    if (mayDemDuoc(nh, d)) {
      return '<span class="sl-khoa">' + chan(giaTri(nh, d)) + '<i>máy đếm</i></span>';
    }
    if (!suaDuoc) return '<span class="sl-khoa">' + chan(giaTri(nh, d) || '—') + '</span>';
    return '<input class="sl-o" data-nam="' + chan(nh) + '" data-ma="' + chan(d.ma)
      + '" value="' + chan(giaTri(nh, d)) + '">';
  }

  function bangNam(ds, suaDuoc, coStt, coGhi) {
    let h = '<div class="tbl-wrap"><table class="sl-bang"><thead><tr>'
      + (coStt ? '<th style="width:38px">TT</th>' : '')
      + '<th class="nhan" style="text-align:left">Số liệu</th>'
      + NAM.map(nh => '<th style="width:110px">Năm học ' + chan(nh) + '</th>').join('')
      + (coGhi ? '<th style="width:150px">Ghi chú</th>' : '')
      + '</tr></thead><tbody>';
    ds.forEach(function (d) {
      const lop = d.kieu === 'cong'
        ? (d.ma.indexOf('cong') >= 0 ? 'cong' : 'nhom') : '';
      h += '<tr class="' + lop + '">'
        + (coStt ? '<td class="sl-stt">' + chan(d.stt || '') + '</td>' : '')
        + '<td class="nhan" style="padding-left:' + (7 + (d.cap || 0) * 16) + 'px">'
          + chan(d.nhan) + '</td>'
        + NAM.map(nh => '<td>' + oNhapHtml(nh, d, suaDuoc) + '</td>').join('')
        + (coGhi ? '<td class="sl-nho">' + chan(d.ghi || '') + '</td>' : '')
        + '</tr>';
    });
    return h + '</tbody></table></div>';
  }

  /* Bảng đội ngũ tại thời điểm TĐG: chỉ một năm học, nhiều cột */
  function bangDoiNgu(suaDuoc) {
    const nh = NAM[NAM.length - 1];
    let h = '<div class="tbl-wrap"><table class="sl-bang"><thead>'
      + '<tr><th rowspan="2" class="nhan" style="text-align:left">Số liệu tại thời điểm tự đánh giá</th>'
      + '<th rowspan="2" style="width:80px">Tổng số</th><th rowspan="2" style="width:70px">Nữ</th>'
      + '<th rowspan="2" style="width:80px">Dân tộc</th>'
      + '<th colspan="3">Trình độ đào tạo</th>'
      + '<th rowspan="2" style="width:120px">Ghi chú</th></tr>'
      + '<tr><th style="width:90px">Chưa đạt chuẩn</th><th style="width:80px">Đạt chuẩn</th>'
      + '<th style="width:80px">Trên chuẩn</th></tr></thead><tbody>';
    DN_HANG.forEach(function (hang) {
      h += '<tr><td class="nhan">' + chan(hang[1]) + '</td>'
        + DN_COT.map(function (cot) {
            const d = { ma: 'dn.' + hang[0] + '.' + cot[0],
                        kieu: cot[0] === 'tong' ? 'dem' : 'nhap', tuDem: hang[2] };
            return '<td>' + oNhapHtml(nh, d, suaDuoc) + '</td>';
          }).join('')
        + '<td><input class="sl-o" data-nam="' + chan(nh) + '" data-ma="dn.' + hang[0]
          + '.ghi" value="' + chan(giaTri(nh, { ma: 'dn.' + hang[0] + '.ghi', kieu: 'nhap' }))
          + '"' + (suaDuoc ? '' : ' disabled') + '></td></tr>';
    });
    /* Dòng Cộng của bảng đội ngũ — tự cộng bốn hàng trên theo từng cột */
    h += '<tr class="cong"><td class="nhan">Cộng</td>'
      + DN_COT.map(function (cot) {
          const d = { ma: 'dn.cong.' + cot[0], kieu: 'cong',
                      congTu: DN_HANG.map(x => 'dn.' + x[0] + '.' + cot[0]) };
          /* congTu trỏ tới các mã không nằm trong CHI_MUC nên timDong trả
             undefined; giaTri đã lo trường hợp đó bằng dòng nhap mặc định. Riêng
             cột Tổng số phải cộng từ ô 'dem', nên tính tay ở đây. */
          let tong = 0, co = false;
          DN_HANG.forEach(function (x) {
            const dd = { ma: 'dn.' + x[0] + '.' + cot[0],
                         kieu: cot[0] === 'tong' ? 'dem' : 'nhap', tuDem: x[2] };
            const n = soCua(giaTri(nh, dd));
            if (n !== null) { tong += n; co = true; }
          });
          void d;
          return '<td><span class="sl-khoa">' + (co ? tong : '—') + '<i>tự cộng</i></span></td>';
        }).join('')
      + '<td></td></tr>';
    return h + '</tbody></table></div>';
  }

  function bangDau(suaDuoc) {
    const nh = NAM[NAM.length - 1];
    const nua = function (ds) {
      let h = '<table class="sl-bang" style="width:100%"><tbody>';
      ds.forEach(function (x) {
        h += '<tr><td class="nhan" style="width:58%">' + chan(x[1]) + '</td><td>'
          + oNhapHtml(nh, { ma: x[0], kieu: 'nhap' }, suaDuoc) + '</td></tr>';
      });
      return h + '</tbody></table>';
    };
    /* "Tên trước đây (nếu có)" là một dòng riêng phía trên hai bảng trong bản in,
       không nằm trong bảng nào — nên cũng để riêng ở đây cho khớp. */
    return '<table class="sl-bang" style="margin-bottom:10px"><tbody><tr>'
      + '<td class="nhan" style="width:58%">Tên trước đây (nếu có)</td><td>'
      + oNhapHtml(nh, { ma: 'tt.ten_truoc_day', kieu: 'nhap' }, suaDuoc) + '</td></tr></tbody></table>'
      + '<div style="display:flex;gap:12px;flex-wrap:wrap">'
      + '<div style="flex:1;min-width:280px">' + nua(DAU_TRAI) + '</div>'
      + '<div style="flex:1;min-width:280px">' + nua(DAU_PHAI) + '</div></div>';
  }

  /* khongTaiLai = true khi vẽ lại sau lúc lưu một ô: giá trị mới đã có sẵn trong
     NHAP rồi, gọi lại máy chủ bốn câu nữa chỉ để hiện đúng một dòng Cộng là phí. */
  async function ve(hop, khongTaiLai) {
    if (!laQuanTri()) {
      hop.innerHTML = '<div class="qt-trong">Chỉ quản trị và ban giám hiệu '
        + 'mới nhập được bảng số liệu của báo cáo tự đánh giá.</div>';
      return;
    }
    if (khongTaiLai && DA_TAI) return veThan(hop);
    hop.innerHTML = '<div class="qt-trong">Đang tải số liệu…</div>';
    try { await tai(CAU_HINH.NAM_HOC); }
    catch (e) {
      hop.innerHTML = '<div class="sl-canh do"><b>Chưa đọc được bảng số liệu.</b><br>'
        + 'Thường là chưa chạy tệp <code>sql/31-so-lieu-bao-cao-tt57.sql</code> trên Supabase.<br>'
        + '<span class="sl-nho">Chi tiết: ' + chan(e.message || e) + '</span></div>';
      return;
    }
    veThan(hop);
  }

  function veThan(hop) {
    const suaDuoc = laQuanTri();

    let h = '<div class="sl-canh">Bảng này là <b>Phần I. Thông tin dữ liệu</b> kèm theo báo cáo '
      + 'tự đánh giá (Biểu 1 Phụ lục V Thông tư 57). Ô ghi <b style="color:#15803d">máy đếm</b> '
      + 'lấy từ dữ liệu thật, không sửa tay được. Ô ghi <b>tự cộng</b> cộng từ các dòng con. '
      + 'Các ô còn lại nhà trường nhập, hệ thống không có dữ liệu để đếm.</div>'
      + dongNghiVan();

    h += '<div class="sl-muc">Thông tin chung</div>' + bangDau(suaDuoc)
      + '<div class="sl-muc">1. Số lớp học</div>' + bangNam(M1_LOP, suaDuoc, false, false)
      + '<div class="sl-muc">2. Cơ cấu khối công trình của nhà trường</div>'
        + bangNam(M2_CT, suaDuoc, true, true)
      + '<div class="sl-muc">3. Cán bộ quản lý, giáo viên, nhân sự hỗ trợ giáo dục</div>'
      + '<div class="sl-nho" style="margin-bottom:6px">a) Số liệu tại thời điểm tự đánh giá</div>'
        + bangDoiNgu(suaDuoc)
      + '<div class="sl-nho" style="margin:12px 0 6px">b) Số liệu của 03 năm học gần nhất</div>'
        + bangNam(M3B, suaDuoc, true, false)
      + '<div class="sl-nho" style="margin:6px 0 0">Cột của hai năm học trước phải nhập tay: '
        + 'danh sách CBGV-NV là danh sách hiện nay, không có cột năm học.</div>'
      + '<div class="sl-muc">4. Học sinh</div>'
      + '<div class="sl-nho" style="margin-bottom:6px">a) Số liệu chung</div>'
        + bangNam(M4A, suaDuoc, true, true)
      + '<div class="sl-nho" style="margin:12px 0 6px">b) Kết quả giáo dục</div>'
        + (CO_QUYEN ? '' : '<div class="sl-canh do" style="margin-bottom:8px">'
            + '<b>Chưa hiện được tỉ lệ xếp loại.</b> Tài khoản đang dùng không có quyền xem '
            + 'dữ liệu học tập của toàn trường, nên hệ thống bỏ qua phần này thay vì đoán. '
            + 'Các ô dưới đây vì vậy đang mở cho nhập tay — thầy cô đăng nhập bằng tài khoản '
            + 'quản trị hoặc ban giám hiệu thì máy tự đếm.</div>')
        + bangNam(M4C, suaDuoc, false, false)
      + ghiChuBonMuc()
      + '<div class="sl-muc">5. Các số liệu khác (nếu có)</div>'
        + bangNam([{ ma: 'khac', nhan: 'Các số liệu khác', kieu: 'nhap' }], suaDuoc, false, false);

    hop.innerHTML = h;

    hop.querySelectorAll('input.sl-o').forEach(function (o) {
      o.addEventListener('blur', async function () {
        try {
          await ghiO(this.dataset.nam, this.dataset.ma, this.value);
          /* Vẽ lại để các dòng Cộng cập nhật theo. Chỉ vẽ khi ô vừa rời có ảnh
             hưởng tới một dòng Cộng nào, kẻo mỗi lần rời ô là cả bảng nhấp nháy. */
          if (anhHuongDongCong(this.dataset.ma)) ve(hop, true);
        } catch (e) {
          if (typeof notify === 'function') notify('Không lưu được: ' + (e.message || e));
        }
      });
    });
  }

  function anhHuongDongCong(ma) {
    return moiDongTheoNam().some(function (d) {
      return d.kieu === 'cong' && (d.congTu || []).indexOf(ma) >= 0;
    }) || String(ma).indexOf('dn.') === 0;
  }

  /* Biểu mẫu của Thông tư thiếu học tập mức Đạt và rèn luyện mức Chưa đạt. Không
     tự thêm dòng vào biểu mẫu do Bộ ban hành, nhưng cũng không im lặng để tổng
     phần trăm không đủ 100 — nói ra bằng một dòng chú thích. */
  function ghiChuBonMuc() {
    const nh = NAM[NAM.length - 1];
    const a = (DEM[nh] || {})['kq.ht_dat'];
    const b = (DEM[nh] || {})['kq.rl_chua_dat'];
    if (!a && !b) return '';
    let t = 'Biểu mẫu của Thông tư 57 không có dòng học tập mức <b>Đạt</b> và rèn luyện mức '
      + '<b>Chưa đạt</b>, trong khi Thông tư 22/2021 xếp bốn mức. Số liệu năm học '
      + chan(nh) + ': ';
    const ds = [];
    if (a) ds.push('học tập mức Đạt ' + chan(a));
    if (b) ds.push('rèn luyện mức Chưa đạt ' + chan(b));
    return '<div class="sl-nho" style="margin-top:6px">' + t + ds.join(' · ') + '.</div>';
  }

  /* ==========================================================================
     SINH BẢNG CHO BẢN WORD — tệp xuất báo cáo gọi vào đây
     ========================================================================== */
  const TR = "font-family:'Times New Roman',serif;";
  const O = TR + 'border:1px solid #000;padding:4pt 6pt;font-size:11.5pt;vertical-align:top;';
  const OT = O + 'background:#e8e8e8;font-weight:bold;text-align:center;vertical-align:middle;';

  function wBangNam(tieuDe, ds, coStt, coGhi) {
    let h = '<table style="width:100%;border-collapse:collapse;margin:0 0 8pt"><thead><tr>'
      + (coStt ? '<td style="' + OT + 'width:6%">TT</td>' : '')
      + '<td style="' + OT + '">' + tieuDe + '</td>'
      + NAM.map(nh => '<td style="' + OT + 'width:14%">Năm học ' + nh + '</td>').join('')
      + (coGhi ? '<td style="' + OT + 'width:14%">Ghi chú</td>' : '')
      + '</tr></thead><tbody>';
    ds.forEach(function (d) {
      const dam = d.kieu === 'cong' ? 'font-weight:bold;' : '';
      h += '<tr>'
        + (coStt ? '<td style="' + O + 'text-align:center;' + dam + '">' + (d.stt || '') + '</td>' : '')
        + '<td style="' + O + dam + 'padding-left:' + (6 + (d.cap || 0) * 12) + 'pt">' + d.nhan + '</td>'
        + NAM.map(nh => '<td style="' + O + 'text-align:center;' + dam + '">'
            + (giaTri(nh, d) || '') + '</td>').join('')
        + (coGhi ? '<td style="' + O + 'font-size:10.5pt">' + (d.ghi || '') + '</td>' : '')
        + '</tr>';
    });
    return h + '</tbody></table>';
  }

  function wBangDau() {
    const nh = NAM[NAM.length - 1];
    const nua = function (ds) {
      let h = '<table style="width:100%;border-collapse:collapse"><tbody>';
      ds.forEach(function (x) {
        h += '<tr><td style="' + O + 'width:60%">' + x[1] + '</td>'
          + '<td style="' + O + 'text-align:center">'
          + (giaTri(nh, { ma: x[0], kieu: 'nhap' }) || '') + '</td></tr>';
      });
      return h + '</tbody></table>';
    };
    return '<table style="width:100%;border-collapse:collapse;margin:0 0 8pt"><tr>'
      + '<td style="width:49%;vertical-align:top;padding-right:6pt;border:0">' + nua(DAU_TRAI) + '</td>'
      + '<td style="width:49%;vertical-align:top;border:0">' + nua(DAU_PHAI) + '</td></tr></table>';
  }

  function wBangDoiNgu() {
    const nh = NAM[NAM.length - 1];
    let h = '<table style="width:100%;border-collapse:collapse;margin:0 0 8pt"><thead>'
      + '<tr><td rowspan="2" style="' + OT + '"></td>'
      + '<td rowspan="2" style="' + OT + '">Tổng số</td><td rowspan="2" style="' + OT + '">Nữ</td>'
      + '<td rowspan="2" style="' + OT + '">Dân tộc</td>'
      + '<td colspan="3" style="' + OT + '">Trình độ đào tạo</td>'
      + '<td rowspan="2" style="' + OT + '">Ghi chú</td></tr>'
      + '<tr><td style="' + OT + '">Chưa đạt chuẩn</td><td style="' + OT + '">Đạt chuẩn</td>'
      + '<td style="' + OT + '">Trên chuẩn</td></tr></thead><tbody>';
    DN_HANG.forEach(function (hang) {
      h += '<tr><td style="' + O + '">' + hang[1] + '</td>'
        + DN_COT.map(function (cot) {
            const d = { ma: 'dn.' + hang[0] + '.' + cot[0],
                        kieu: cot[0] === 'tong' ? 'dem' : 'nhap', tuDem: hang[2] };
            return '<td style="' + O + 'text-align:center">' + (giaTri(nh, d) || '') + '</td>';
          }).join('')
        + '<td style="' + O + '">'
        + (giaTri(nh, { ma: 'dn.' + hang[0] + '.ghi', kieu: 'nhap' }) || '') + '</td></tr>';
    });
    h += '<tr><td style="' + O + 'font-weight:bold">Cộng</td>'
      + DN_COT.map(function (cot) {
          let tong = 0, co = false;
          DN_HANG.forEach(function (x) {
            const dd = { ma: 'dn.' + x[0] + '.' + cot[0],
                         kieu: cot[0] === 'tong' ? 'dem' : 'nhap', tuDem: x[2] };
            const n = soCua(giaTri(nh, dd));
            if (n !== null) { tong += n; co = true; }
          });
          return '<td style="' + O + 'text-align:center;font-weight:bold">'
            + (co ? tong : '') + '</td>';
        }).join('')
      + '<td style="' + O + '"></td></tr>';
    return h + '</tbody></table>';
  }

  /* Trả về HTML cả biểu mẫu. Tự tải dữ liệu nếu tab nhập chưa mở lần nào —
     nếu không thì xuất báo cáo mà chưa vào tab đó là ra bảng trắng. */
  window.bangSoLieuTT57Word = async function (namHoc) {
    try {
      if (!DA_TAI || (namHoc && NAM[NAM.length - 1] !== namHoc)) await tai(namHoc);
    } catch (e) {
      return '<p style="' + TR + 'font-size:11.5pt;font-style:italic">'
        + 'Chưa lập được bảng số liệu: ' + (e.message || e)
        + '. Kiểm tra đã chạy tệp sql/31 chưa.</p>';
    }

    const nh = NAM[NAM.length - 1];
    const dat = (DEM[nh] || {})['kq.ht_dat'];
    const chuaDat = (DEM[nh] || {})['kq.rl_chua_dat'];
    let chu = '';
    if (dat || chuaDat) {
      const ds = [];
      if (dat) ds.push('học tập mức Đạt ' + dat);
      if (chuaDat) ds.push('rèn luyện mức Chưa đạt ' + chuaDat);
      chu = '<p style="' + TR + 'font-size:10.5pt;font-style:italic;margin:0 0 8pt">'
        + 'Ghi chú: biểu mẫu không có dòng học tập mức Đạt và rèn luyện mức Chưa đạt; '
        + 'số liệu năm học ' + nh + ' của hai mức này là ' + ds.join(' và ') + '.</p>';
    }

    return ''
      + '<p style="page-break-before:always"></p>'
      + '<p style="' + TR + 'text-align:center;font-size:13pt;font-weight:bold;margin:0 0 2pt">Phần I</p>'
      + '<p style="' + TR + 'text-align:center;font-size:13pt;font-weight:bold;margin:0 0 2pt">THÔNG TIN DỮ LIỆU</p>'
      + '<p style="' + TR + 'text-align:center;font-size:11.5pt;font-style:italic;margin:0 0 10pt">(Đối với trường phổ thông)</p>'
      + '<p style="' + TR + 'font-size:11.5pt;margin:0 0 2pt">Tên trường (theo quyết định mới nhất): '
        + ((CAU_HINH.TEN_TRUONG) || '') + '</p>'
      + '<p style="' + TR + 'font-size:11.5pt;margin:0 0 2pt">Tên trước đây (nếu có): '
        + (giaTri(nh, { ma: 'tt.ten_truoc_day', kieu: 'nhap' }) || '') + '</p>'
      + '<p style="' + TR + 'font-size:11.5pt;margin:0 0 8pt">Cơ quan quản lý: '
        + ((CAU_HINH.CO_QUAN_QUAN_LY) || '') + '</p>'
      + wBangDau()
      + '<p style="' + TR + 'font-size:11.5pt;margin:0 0 10pt;text-align:justify">Cơ sở dữ liệu là '
        + 'nguồn thông tin phục vụ phân tích, đối chiếu minh chứng và xác định mức đạt của các '
        + 'tiêu chí chất lượng giáo dục.</p>'
      + '<p style="' + TR + 'font-size:12pt;font-weight:bold;margin:8pt 0 4pt">1. Số lớp học</p>'
      + wBangNam('Số lớp học', M1_LOP, false, false)
      + '<p style="' + TR + 'font-size:12pt;font-weight:bold;margin:8pt 0 4pt">2. Cơ cấu khối công trình của nhà trường</p>'
      + wBangNam('Số liệu', M2_CT, true, true)
      + '<p style="' + TR + 'font-size:12pt;font-weight:bold;margin:8pt 0 4pt">3. Cán bộ quản lý cơ sở giáo dục, giáo viên, nhân sự hỗ trợ giáo dục</p>'
      + '<p style="' + TR + 'font-size:11.5pt;margin:0 0 4pt">a) Số liệu tại thời điểm TĐG</p>'
      + wBangDoiNgu()
      + '<p style="' + TR + 'font-size:11.5pt;margin:0 0 4pt">b) Số liệu của 3 năm học gần nhất tính đến thời điểm tự đánh giá</p>'
      + wBangNam('Số liệu', M3B, true, false)
      + '<p style="' + TR + 'font-size:12pt;font-weight:bold;margin:8pt 0 4pt">4. Học sinh</p>'
      + '<p style="' + TR + 'font-size:11.5pt;margin:0 0 4pt">a) Số liệu chung</p>'
      + wBangNam('Số liệu', M4A, true, true)
      + '<p style="' + TR + 'font-size:11.5pt;margin:0 0 4pt">b) Kết quả giáo dục (đối với trường THCS)</p>'
      + wBangNam('Số liệu', M4C, false, false)
      + chu
      + '<p style="' + TR + 'font-size:12pt;font-weight:bold;margin:8pt 0 4pt">5. Các số liệu khác (nếu có)</p>'
      + '<p style="' + TR + 'font-size:11.5pt;margin:0 0 8pt">'
        + (giaTri(nh, { ma: 'khac', kieu: 'nhap' }) || '') + '</p>';
  };

  /* ==========================================================================
     ĐĂNG KÝ TAB VÀO BẢNG QUẢN TRỊ
     ========================================================================== */
  window.qtTabPhu = window.qtTabPhu || [];
  window.qtTabPhu.push({
    ma: 'sl',
    ten: 'Số liệu báo cáo',
    tt: 35,
    ve: function (hop) { return ve(hop); }
  });
})();
