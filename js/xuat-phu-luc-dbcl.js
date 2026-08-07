/* ============================================================================
   KẾT XUẤT PHỤ LỤC HỒ SƠ ĐẢM BẢO CHẤT LƯỢNG (PA1)

   Sinh tệp Word cho bốn phụ lục dùng chung bộ chỉ tiêu, cộng phiếu cam kết:
       Phụ lục 1  — Thực trạng nhà trường
       Phụ lục 2  — Chuẩn đầu ra chất lượng học tập của học sinh
       Phụ lục 5  — Kết quả học tập và rèn luyện
       Phụ lục 15 — Bản cam kết của giáo viên với Hiệu trưởng
       Phụ lục 16 — Bản cam kết chất lượng của nhà trường

   BA CHỖ KHÁC BẢN GIẤY CŨ, do quy định đổi chứ không phải bỏ sót — trong tệp
   xuất ra đều có dòng chú thích để hội đồng đọc hiểu ngay:
     · Thể thức trên đầu là UBND XÃ YÊN THÀNH, không còn PHÒNG GIÁO DỤC VÀ
       ĐÀO TẠO. Cấp huyện đã giải thể, hệ thống chỉ còn Tỉnh và Xã.
     · Nơi nhận của Phụ lục 16 là UBND xã Yên Thành và Sở GD&ĐT Nghệ An.
       Phụ lục 17 cũ (Trưởng phòng ký với Giám đốc Sở) nay không còn đối tượng.
     · Dòng "Số học sinh giỏi cấp huyện" được thay bằng "cấp trường"; các cột
       "Tổng hợp kết quả của huyện" gộp lại thành một cột đối sánh toàn tỉnh.

   Phần nào thuộc Phụ lục 3, 4 (đội ngũ và cơ sở vật chất) chưa nối cơ sở dữ
   liệu ở giai đoạn này thì in sẵn khung bảng kèm ghi chú để nhà trường điền
   trực tiếp trên tệp Word — không im lặng bỏ qua.
   ============================================================================ */

(function () {
  'use strict';

  if (typeof CAU_HINH === 'undefined' || !CAU_HINH.DA_NOI) return;

  const TR = "font-family:'Times New Roman',serif;";
  const O  = TR + 'border:1px solid #000;padding:4pt 6pt;font-size:11.5pt;vertical-align:middle;';
  const OC = O + 'text-align:center;';
  /* Ô tiêu đề bảng dùng chung cho cả năm phụ lục: nền xám nhạt, chữ đậm, căn
     giữa. Bản cũ chỉ tô đậm nên in trắng đen ra nhìn không khác dòng dữ liệu. */
  const OT = OC + 'font-weight:bold;background:#e8e8e8;';
  /* Lấy từ cauhinh.js — một nguồn duy nhất, khỏi mỗi tệp một giá trị */
  const XA = CAU_HINH.DON_VI_CHU_QUAN || 'UBND XÃ YÊN THÀNH';
  const DIA_DANH = CAU_HINH.DIA_DANH || 'Yên Thành';

  function chan(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function tenTruong() {
    return (CAU_HINH.TEN_TRUONG || 'Trường THCS Bạch Liêu');
  }
  function ngayThang() {
    const d = new Date();
    return DIA_DANH + ', ngày ' + d.getDate() + ' tháng ' + (d.getMonth() + 1)
         + ' năm ' + d.getFullYear();
  }
  function duLieu() {
    if (typeof window.duLieuDBCL !== 'function') return null;
    const d = window.duLieuDBCL();
    return (d && d.chiTieu && d.chiTieu.length) ? d : null;
  }

  /* ---------------- Thể thức đầu trang ---------------- */
  function tieuDe() {
    return '<table style="width:100%;border-collapse:collapse"><tr>'
      + '<td style="' + TR + 'width:42%;text-align:center;font-size:12pt;vertical-align:top">'
      +   XA + '<br><b>' + chan(tenTruong()).toUpperCase() + '</b>'
      +   '<div style="border-top:1px solid #000;width:62%;margin:2pt auto 0"></div></td>'
      + '<td style="' + TR + 'text-align:center;font-size:12pt;vertical-align:top">'
      /* Viết "CỘNG HÒA" theo đúng Phụ lục I Nghị định 30/2020/NĐ-CP, không
         viết "CỘNG HOÀ" như thói quen cũ — để cả năm tệp xuất ra giống nhau. */
      +   '<b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br><b>Độc lập - Tự do - Hạnh phúc</b>'
      +   '<div style="border-top:1px solid #000;width:52%;margin:2pt auto 0"></div>'
      +   '<p style="' + TR + 'font-size:12pt;font-style:italic;margin:8pt 0 0">'
      +   ngayThang() + '</p></td></tr></table>';
    }

  function tenPhuLuc(so, ten, phu) {
    return '<p style="' + TR + 'text-align:center;font-size:13pt;font-weight:bold;margin:18pt 0 4pt">'
      + 'PHỤ LỤC ' + so + '</p>'
      + '<p style="' + TR + 'text-align:center;font-size:12.5pt;font-weight:bold;margin:0 0 4pt">'
      + chan(ten) + '</p>'
      + (phu ? '<p style="' + TR + 'text-align:center;font-size:11.5pt;font-style:italic;'
             + 'margin:0 0 10pt">' + chan(phu) + '</p>' : '');
  }

  /* Chức vụ in hoa đậm — chừa bốn dòng cho chữ ký và con dấu — họ tên đậm.
     Họ tên lấy ở cauhinh.js, khỏi phải viết tay lên tệp Word sau mỗi lần xuất. */
  function kyTen(chucDanh, hoTen) {
    const ht = hoTen === undefined ? (CAU_HINH.HIEU_TRUONG || '') : hoTen;
    return '<table style="width:100%;border-collapse:collapse;margin-top:18pt"><tr>'
      + '<td style="width:55%"></td>'
      + '<td style="' + TR + 'text-align:center;font-size:12pt">'
      + '<b>' + chan(chucDanh) + '</b><br><i>(Ký tên, đóng dấu)</i>'
      + '<br><br><br><br>' + (ht ? '<b>' + chan(ht) + '</b>' : '') + '</td></tr></table>';
  }

  function ghiChuSua() {
    return '<p style="' + TR + 'font-size:10.5pt;font-style:italic;color:#444;margin:12pt 0 0;'
      + 'text-align:justify">Ghi chú về thể thức: biểu mẫu đã cập nhật theo mô hình chính quyền '
      + 'địa phương hai cấp — cơ quan chủ quản ghi là Uỷ ban nhân dân xã ' + chan(DIA_DANH)
      + ' và ' + chan(CAU_HINH.CO_QUAN_QUAN_LY || 'Sở Giáo dục và Đào tạo Nghệ An')
      + '. Dòng "học sinh giỏi cấp huyện" của biểu mẫu cũ được thay bằng '
      + '"cấp trường"; các cột đối sánh cấp huyện gộp thành một cột đối sánh toàn tỉnh. '
      + 'Danh mục môn học ghi theo Chương trình giáo dục phổ thông 2018; mức xếp loại ghi theo '
      + 'Thông tư số 22/2021/TT-BGDĐT.</p>';
  }

  /* ---------------- Bảng số liệu dùng chung ---------------- */
  function bangSoLieu(d, loai, ky, coDoiSanh) {
    const KHOI = d.khoi;
    /* Bề rộng đặt bằng colgroup: cột "Số liệu" ăn phần còn lại, các cột khối
       chia đều. Đặt vào từng ô tiêu đề như trước thì lúc bảng sang trang mới,
       Word vẽ lại tiêu đề mà bề rộng nhảy lung tung. */
    const rongKhoi = coDoiSanh ? 10 : 12;
    const rongTen = 100 - 6 - rongKhoi * KHOI.length - (coDoiSanh ? 13 : 0);
    let h = '<table style="width:100%;border-collapse:collapse">'
      + '<colgroup><col style="width:6%"><col style="width:' + rongTen + '%">'
      + KHOI.map(() => '<col style="width:' + rongKhoi + '%">').join('')
      + (coDoiSanh ? '<col style="width:13%">' : '')
      + '</colgroup>'
      + '<thead><tr>'
      + '<td style="' + OT + '">TT</td>'
      + '<td style="' + OT + '">Số liệu</td>'
      + KHOI.map(k => '<td style="' + OT + '">Khối ' + k + '</td>').join('')
      + (coDoiSanh ? '<td style="' + OT + '">Đối sánh<br>toàn tỉnh</td>' : '')
      + '</tr></thead><tbody>';

    let stt = 0, nhom = '';
    const cot = KHOI.length + 2 + (coDoiSanh ? 1 : 0);
    d.chiTieu.forEach(ct => {
      if (ct.nhom !== nhom) {
        nhom = ct.nhom;
        h += '<tr><td colspan="' + cot + '" style="' + O
           + 'background:#f2f2f2;font-weight:bold;font-size:11pt">' + chan(nhom) + '</td></tr>';
      }
      stt++;
      h += '<tr><td style="' + OC + '">' + stt + '</td>'
         + '<td style="' + O + '">' + chan(ct.ten) + '</td>';
      KHOI.forEach(k => {
        /* Ô gạch chéo cho chỉ tiêu chỉ có ở khối 9: tô xám để hội đồng hiểu đây
           là ô không áp dụng, không phải nhà trường bỏ trống. */
        if (ct.chi_khoi_9 && k !== 9) { h += '<td style="' + OC + 'background:#f2f2f2"></td>'; return; }
        const r = d.lay(loai, ky, k, ct.ma);
        h += '<td style="' + OC + '">' + chan(r && r.gia_tri ? r.gia_tri : '') + '</td>';
      });
      if (coDoiSanh) {
        const r9 = d.lay(loai, ky, 9, ct.ma);
        h += '<td style="' + OC + '">' + chan(r9 && r9.doi_sanh_tinh ? r9.doi_sanh_tinh : '') + '</td>';
      }
      h += '</tr>';
    });
    return h + '</tbody></table>';
  }

  /* ---------------- Khung bảng cho phần chưa nối dữ liệu ---------------- */
  function khungChoDien(tieu, cot, soDong) {
    /* Cột TT chỉ chứa một con số nên bó hẹp 5%, phần còn lại chia đều — bản cũ
       để Word tự chia, cột TT rộng bằng cột "Trình độ đào tạo". */
    /* Chia phần dư cho các cột đầu chứ đừng bỏ rơi. Math.floor(95/7) = 13,
       13 × 7 = 91, cộng cột TT là 96% — khung 8 cột của Phụ lục 16 hụt 4%
       bề ngang, in ra thấy lệch so với các bảng khác trong cùng tệp. */
    const soConLai = Math.max(cot.length - 1, 1);
    const rongCoSo = Math.floor(95 / soConLai);
    const du = 95 - rongCoSo * soConLai;
    const rongCot = i => rongCoSo + (i < du ? 1 : 0);
    let h = '<p style="' + TR + 'font-size:12pt;font-weight:bold;margin:12pt 0 4pt">'
          + chan(tieu) + '</p>'
          + '<p style="' + TR + 'font-size:10.5pt;font-style:italic;color:#444;margin:0 0 5pt">'
          + 'Phần này thuộc Phụ lục 3 và Phụ lục 4, chưa nối cơ sở dữ liệu ở giai đoạn này. '
          + 'Nhà trường điền trực tiếp trên tệp Word.</p>'
          + '<table style="width:100%;border-collapse:collapse">'
          + '<colgroup><col style="width:5%">'
          + cot.slice(1).map((c, i) => '<col style="width:' + rongCot(i) + '%">').join('')
          + '</colgroup>'
          + '<thead><tr>'
          + cot.map(c => '<td style="' + OT + '">' + chan(c) + '</td>').join('')
          + '</tr></thead><tbody>';
    /* Đánh sẵn số thứ tự vào cột đầu: thầy cô điền tay trên Word thì khỏi phải
       tự đếm dòng. Chỉ làm khi cột đầu đúng là cột TT, để sau này ai gọi hàm
       với bộ cột khác thì không bị chèn số vào nhầm chỗ. */
    const coTT = String(cot[0] || '').trim().toUpperCase() === 'TT';
    for (let i = 0; i < soDong; i++) {
      h += '<tr>'
        + (coTT ? '<td style="' + OC + '">' + (i + 1) + '</td>'
                : '<td style="' + O + '">&nbsp;</td>')
        + cot.slice(1).map(() => '<td style="' + O + '">&nbsp;</td>').join('') + '</tr>';
    }
    return h + '</tbody></table>';
  }

  /* ---------------- Đóng gói và tải về ----------------
     Tham số thứ tư `ngang` = true thì xuất khổ A4 nằm ngang. Word KHÔNG hiểu
     'size:A4' đứng một mình — nó lấy khổ mặc định của máy in, nên phải ghi
     kích thước bằng centimet và kèm mso-page-orientation. Lề đặt theo Nghị
     định 30/2020/NĐ-CP: trên/dưới 20-25mm, trái 30-35mm, phải 15-20mm. */
  function taiVe(tieuDeTep, than, tenTep, ngang) {
    const kho = ngang
      ? '@page{size:29.7cm 21cm;mso-page-orientation:landscape;margin:1.5cm 2cm 1.5cm 2cm}'
      : '@page{size:21cm 29.7cm;margin:2cm 1.5cm 2cm 3cm}';
    const html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" '
      + 'xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">'
      + '<head><meta charset="utf-8"><title>' + chan(tieuDeTep) + '</title>'
      + '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom>'
      + '</w:WordDocument></xml><![endif]-->'
      + '<style>' + kho
      + 'body{font-family:"Times New Roman",serif;font-size:13pt;line-height:1.5;color:#000}'
      + 'p{margin:0 0 6pt}'
      + 'table{page-break-inside:auto;border-collapse:collapse}'
      /* Bảng chỉ tiêu dài hơn một trang. Không có dòng này thì từ trang 2 trở
         đi thầy cô nhìn bốn cột số mà không biết cột nào là khối nào. */
      + 'thead{display:table-header-group}'
      + 'tr{page-break-inside:avoid}td,th{line-height:1.3}</style>'
      + '</head><body>' + than + '</body></html>';

    const blob = new Blob(['﻿' + html], { type: 'application/msword' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = tenTep;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  }

  function thieuDuLieu() {
    if (typeof notify === 'function')
      notify('Chưa tải được số liệu. Thầy cô đăng nhập và chờ bảng hiện lên rồi xuất lại.');
  }

  /* Đếm số ô đã có dữ liệu của một bảng. Dùng để chặn việc xuất ra tờ mẫu rỗng —
     trước đây bấm nút lúc bảng còn trắng vẫn tải về một tệp không có số nào. */
  function demODaNhap(d, loai, ky) {
    let n = 0;
    d.chiTieu.forEach(ct => {
      d.khoi.forEach(k => {
        if (ct.chi_khoi_9 && k !== 9) return;
        const r = d.lay(loai, ky, k, ct.ma);
        if (r && r.gia_tri && String(r.gia_tri).trim() !== '') n++;
      });
    });
    return n;
  }

  function bangTrong(d, loai, ky, tenBang) {
    if (demODaNhap(d, loai, ky) > 0) return false;
    if (typeof notify === 'function') {
      notify('Bảng "' + tenBang + '" của năm học ' + d.namHoc + ' chưa có ô nào được nhập, '
        /* Giao diện không có ô nào tên "Bảng số liệu" — việc chọn bảng nằm ở
           hàng thẻ Phụ lục. Chỉ sai chỗ là thầy cô đi tìm cái không có. */
        + 'nên chưa xuất được. Thầy cô chọn đúng thẻ Phụ lục ở hàng trên, nhập số rồi xuất lại.');
    }
    return true;
  }

  /* ========================================================================
     PHỤ LỤC 1 — THỰC TRẠNG NHÀ TRƯỜNG
     ======================================================================== */
  function xuat1() {
    const d = duLieu(); if (!d) return thieuDuLieu();
    if (bangTrong(d, 'thuc_trang', 'ca_nam', 'Thực trạng đầu năm')) return;
    const than = tieuDe()
      + tenPhuLuc('1', 'Thực trạng nhà trường năm học ' + d.namHoc)
      + '<p style="' + TR + 'font-size:12pt;font-weight:bold;margin:10pt 0 5pt">'
      + '1. Kết quả học tập và rèn luyện của học sinh</p>'
      + bangSoLieu(d, 'thuc_trang', 'ca_nam', true)
      + khungChoDien('2. Đội ngũ cán bộ quản lý, giáo viên, nhân viên',
          ['TT', 'Chức danh', 'Tổng số', 'Nữ', 'Trình độ đào tạo', 'Chuẩn nghề nghiệp', 'Trình độ LLCT'], 5)
      + khungChoDien('3. Cơ sở vật chất, thiết bị dạy học',
          ['TT', 'Hạng mục', 'Số lượng', 'Đơn vị tính', 'Ghi chú'], 8)
      + ghiChuSua()
      + kyTen('HIỆU TRƯỞNG');
    /* A4 NGANG: bảng số liệu có 7 cột (TT, Số liệu, bốn khối, đối sánh tỉnh),
       thêm khung đội ngũ 7 cột và khung cơ sở vật chất 5 cột. Khổ dọc chỉ còn
       16,5cm bề ngang, tên chỉ tiêu dài bị bẻ năm sáu dòng. */
    taiVe('Phụ lục 1 — Thực trạng nhà trường ' + d.namHoc, than,
      'phu-luc-1-thuc-trang-' + d.namHoc + '.doc', true);
    if (typeof notify === 'function')
      notify('Đã tải Phụ lục 1. Phần đội ngũ và cơ sở vật chất in sẵn khung để nhà trường điền.');
  }

  /* ========================================================================
     PHỤ LỤC 2 — CHUẨN ĐẦU RA
     ======================================================================== */
  function xuat2() {
    const d = duLieu(); if (!d) return thieuDuLieu();
    if (bangTrong(d, 'chuan_dau_ra', 'ca_nam', 'Chuẩn đầu ra phấn đấu')) return;
    const than = tieuDe()
      + tenPhuLuc('2', 'Chuẩn đầu ra chất lượng học tập của học sinh năm học ' + d.namHoc,
          'Chỉ tiêu nhà trường phấn đấu đạt được trong năm học')
      + bangSoLieu(d, 'chuan_dau_ra', 'ca_nam', true)
      + ghiChuSua()
      + kyTen('HIỆU TRƯỞNG');
    /* A4 NGANG: cùng bảng 7 cột với Phụ lục 1 */
    taiVe('Phụ lục 2 — Chuẩn đầu ra ' + d.namHoc, than,
      'phu-luc-2-chuan-dau-ra-' + d.namHoc + '.doc', true);
    if (typeof notify === 'function') notify('Đã tải Phụ lục 2 — Chuẩn đầu ra.');
  }

  /* ========================================================================
     PHỤ LỤC 5 — KẾT QUẢ HỌC TẬP VÀ RÈN LUYỆN
     ======================================================================== */
  function xuat5() {
    const d = duLieu(); if (!d) return thieuDuLieu();
    const tenKy = d.ky === 'hoc_ki_1' ? 'học kì I' : 'cả năm học';
    if (bangTrong(d, 'ket_qua', d.ky, 'Kết quả thực hiện — ' + tenKy)) return;

    /* Bảng đối chiếu với chuẩn đã cam kết — thứ bản giấy không có */
    /* Lấy chuẩn CÙNG KỲ với kết quả, y như màn hình đối sánh. Bản cũ luôn lấy
       chuẩn cả năm, nên tệp Word Phụ lục 5 của học kì I liệt kê hàng loạt chỉ
       tiêu "chưa đạt cam kết" giả — mà đây là tệp gửi Sở, lại không có dòng
       "đây mới là mốc giữa đường" như trên màn hình. */
    let doiChieu = '';
    const hut = [];
    let muonCaNam = false;
    d.chiTieu.forEach(ct => {
      if (ct.don_vi === 'text') return;
      d.khoi.forEach(k => {
        if (ct.chi_khoi_9 && k !== 9) return;
        let c = d.lay('chuan_dau_ra', d.ky, k, ct.ma);
        let muonO = false;
        if ((!c || !c.gia_tri) && d.ky !== 'ca_nam') {
          c = d.lay('chuan_dau_ra', 'ca_nam', k, ct.ma);
          muonO = !!(c && c.gia_tri);
        }
        const r = d.lay('ket_qua', d.ky, k, ct.ma);
        if (!c || !r || !c.gia_tri || !r.gia_tri) return;
        const nc = so(c.gia_tri), nr = so(r.gia_tri);
        if (nc == null || nr == null) return;
        const dat = ct.chieu_tot === 'up' ? nr >= nc : nr <= nc;
        if (!dat) { hut.push({ ct: ct, k: k, c: c.gia_tri, r: r.gia_tri }); if (muonO) muonCaNam = true; }
      });
    });
    if (hut.length) {
      doiChieu = '<p style="' + TR + 'font-size:12pt;font-weight:bold;margin:14pt 0 5pt">'
        + (muonCaNam
            ? 'Các chỉ tiêu còn hụt so với đích cả năm (mốc giữa học kì I)'
            : 'Các chỉ tiêu chưa đạt chuẩn đầu ra đã cam kết') + '</p>'
        + (muonCaNam
            ? '<p style="' + TR + 'font-size:11.5pt;font-style:italic;margin:0 0 5pt;text-align:justify">'
              + 'Chuẩn đầu ra tại Phụ lục 2 và 16 là đích của cả năm học, còn kết quả trong bảng này '
              + 'mới hết học kì I. Bảng dưới đây dùng để xác định chỗ cần tập trung trong học kì II, '
              + 'không phải kết luận nhà trường chưa đạt cam kết.</p>'
            : '')
        + '<table style="width:100%;border-collapse:collapse">'
        + '<colgroup><col style="width:8%"><col style="width:52%"><col style="width:20%">'
        + '<col style="width:20%"></colgroup>'
        + '<thead><tr>'
        + '<td style="' + OT + '">Khối</td>'
        + '<td style="' + OT + '">Chỉ tiêu</td>'
        + '<td style="' + OT + '">Chuẩn đầu ra</td>'
        + '<td style="' + OT + '">Kết quả đạt</td></tr></thead><tbody>'
        + hut.map(x => '<tr><td style="' + OC + '">' + x.k + '</td>'
            + '<td style="' + O + '">' + chan(x.ct.ten) + '</td>'
            + '<td style="' + OC + '">' + chan(x.c) + '</td>'
            + '<td style="' + OC + '">' + chan(x.r) + '</td></tr>').join('')
        + '</tbody></table>'
        + '<p style="' + TR + 'font-size:11pt;font-style:italic;margin:6pt 0 0">'
        + 'Đây là căn cứ trực tiếp để lập Kế hoạch cải tiến chất lượng theo Biểu 2.</p>';
    }

    const than = tieuDe()
      + tenPhuLuc('5', 'Kết quả học tập và rèn luyện ' + tenKy + ' ' + d.namHoc
          + ' của học sinh ' + tenTruong())
      + bangSoLieu(d, 'ket_qua', d.ky, true)
      + doiChieu
      + ghiChuSua()
      + kyTen('HIỆU TRƯỞNG');
    /* A4 NGANG: bảng 7 cột, thêm bảng đối chiếu chuẩn đầu ra 4 cột */
    taiVe('Phụ lục 5 — Kết quả ' + tenKy + ' ' + d.namHoc, than,
      'phu-luc-5-ket-qua-' + (d.ky === 'hoc_ki_1' ? 'hk1-' : 'ca-nam-') + d.namHoc + '.doc', true);
    /* Câu này phải khớp với tiêu đề bảng vừa in ra. Trước đây luôn nói "chưa
       đạt cam kết" trong khi tệp Word đã ghi rõ đây mới là mốc giữa học kì I. */
    /* hut đếm Ô, không đếm CHỈ TIÊU: mỗi chỉ tiêu có bốn khối nên một chỉ
       tiêu hụt ở cả bốn khối là bốn dòng. Bản trước gọi thẳng hut.length là
       "chỉ tiêu", 33 chỉ tiêu × 4 khối báo thành "119 chỉ tiêu" trong khi cả
       bộ chỉ có 33 — thầy cô đọc xong tưởng hỏng nặng hơn thực tế. */
    const soCt = Object.keys(hut.reduce((a, x) => { a[x.ct.ma] = 1; return a; }, {})).length;
    if (typeof notify === 'function')
      notify('Đã tải Phụ lục 5' + (hut.length
        ? ' — có ' + soCt + ' chỉ tiêu ' + (muonCaNam ? 'còn cách đích cả năm' : 'chưa đạt cam kết')
          + ' (' + hut.length + ' ô tính theo từng khối), đã liệt kê ở cuối tệp.'
        : '.'));
  }

  function so(t) {
    const m = String(t == null ? '' : t).replace(/,/g, '.').match(/([0-9]+\.?[0-9]*)[^0-9]*$/);
    return m ? parseFloat(m[1]) : null;
  }

  /* ========================================================================
     PHỤ LỤC 15 — CAM KẾT CỦA GIÁO VIÊN VỚI HIỆU TRƯỞNG
     ======================================================================== */
  function xuat15(camKetId) {
    const d = duLieu(); if (!d) return thieuDuLieu();
    const c = d.camKet.find(x => x.id === camKetId);
    if (!c) { if (typeof notify === 'function') notify('Không tìm thấy bản cam kết.'); return; }
    const dong = d.camKetDong[c.id] || {};

    const rongLop = 12;
    let bang = '<table style="width:100%;border-collapse:collapse">'
      + '<colgroup><col style="width:6%">'
      + '<col style="width:' + (94 - rongLop * d.khoi.length) + '%">'
      + d.khoi.map(() => '<col style="width:' + rongLop + '%">').join('')
      + '</colgroup>'
      + '<thead><tr>'
      + '<td style="' + OT + '">TT</td>'
      + '<td style="' + OT + '">Số liệu cam kết</td>'
      + d.khoi.map(k => '<td style="' + OT + '">Lớp ' + k + '</td>').join('')
      + '</tr></thead><tbody>';
    let stt = 0, nhom = '';
    d.chiTieu.forEach(ct => {
      if (ct.don_vi === 'text' || ct.don_vi === 'dat') return;
      if (ct.nhom !== nhom) {
        nhom = ct.nhom;
        bang += '<tr><td colspan="' + (d.khoi.length + 2) + '" style="' + O
              + 'background:#f2f2f2;font-weight:bold;font-size:11pt">' + chan(nhom) + '</td></tr>';
      }
      stt++;
      bang += '<tr><td style="' + OC + '">' + stt + '</td>'
            + '<td style="' + O + '">' + chan(ct.ten) + '</td>'
            + d.khoi.map(k => '<td style="' + OC + '">'
                + chan(dong[k + '|' + ct.ma] || '') + '</td>').join('')
            + '</tr>';
    });
    bang += '</tbody></table>';

    const than = tieuDe()
      + tenPhuLuc('15', 'BẢN CAM KẾT', 'Về kết quả học tập và rèn luyện của học sinh')
      + '<p style="' + TR + 'font-size:12pt;margin:8pt 0 4pt"><b>Kính gửi:</b> Hiệu trưởng '
      + chan(tenTruong()) + '</p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 3pt">Tôi tên là: <b>'
      + chan(c.ho_ten) + '</b></p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 3pt">Giáo viên môn: '
      + chan(c.mon_day || '.....................................') + '</p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 3pt">Giảng dạy lớp: '
      + chan(c.lop_day || '.....................................') + '</p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 8pt">Chủ nhiệm lớp: '
      + chan(c.lop_chu_nhiem || '.....................................') + '</p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 8pt;text-align:justify">Tôi xin cam kết '
      + 'về kết quả học tập và rèn luyện của học sinh các lớp nêu trên trong năm học '
      + chan(c.nam_hoc) + ' như sau:</p>'
      + bang
      + '<table style="width:100%;border-collapse:collapse;margin-top:18pt"><tr>'
      + '<td style="width:55%"></td>'
      + '<td style="' + TR + 'text-align:center;font-size:12pt"><i>'
      + (c.ngay_ky ? DIA_DANH + ', ngày ' + c.ngay_ky.slice(8, 10) + ' tháng '
                   + c.ngay_ky.slice(5, 7) + ' năm ' + c.ngay_ky.slice(0, 4)
                   : ngayThang())
      + '</i><br><b>GIÁO VIÊN</b><br><i>(Ký và ghi rõ họ tên)</i><br><br><br><br>'
      + '<b>' + chan(c.ho_ten) + '</b></td></tr></table>';

    /* A4 DỌC: đây là bản cam kết cá nhân — phần lớn là chữ (kính gửi, họ tên,
       môn dạy, lời cam kết), bảng chỉ có bốn cột lớp chứa số ngắn. Xoay ngang
       thì một tờ giấy khổ lớn mà chữ nằm hết nửa trên, nhìn trống trải. */
    taiVe('Phụ lục 15 — Cam kết ' + c.ho_ten, than,
      'phu-luc-15-cam-ket-' + khongDau(c.ho_ten) + '-' + c.nam_hoc + '.doc', false);
    if (typeof notify === 'function') notify('Đã tải phiếu cam kết của ' + c.ho_ten + '.');
  }

  function khongDau(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  /* ========================================================================
     PHỤ LỤC 16 — CAM KẾT CHẤT LƯỢNG CỦA NHÀ TRƯỜNG
     ======================================================================== */
  function xuat16() {
    const d = duLieu(); if (!d) return thieuDuLieu();
    if (bangTrong(d, 'chuan_dau_ra', 'ca_nam', 'Chuẩn đầu ra phấn đấu')) return;
    const ht = CAU_HINH.HIEU_TRUONG || '……………………';

    const than = tieuDe()
      + tenPhuLuc('16', 'BẢN CAM KẾT CHẤT LƯỢNG GIÁO DỤC NHÀ TRƯỜNG',
          'Năm học ' + d.namHoc)
      + '<p style="' + TR + 'font-size:12pt;margin:8pt 0 4pt"><b>Kính gửi:</b></p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 2pt">- Uỷ ban nhân dân xã '
      + chan(DIA_DANH) + ';</p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 8pt">- '
      + chan(CAU_HINH.CO_QUAN_QUAN_LY || 'Sở Giáo dục và Đào tạo Nghệ An') + '.</p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 3pt">Tôi tên là: <b>' + chan(ht) + '</b></p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 8pt">Chức vụ: Hiệu trưởng</p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 8pt;text-align:justify">Tôi xin cam kết '
      + 'bảo đảm chất lượng giáo dục của ' + chan(tenTruong()) + ' trong năm học '
      + chan(d.namHoc) + ' với các nội dung sau:</p>'
      + '<p style="' + TR + 'font-size:12pt;font-weight:bold;margin:10pt 0 5pt">'
      + '1. Kết quả học tập và rèn luyện của học sinh (theo chuẩn đầu ra)</p>'
      + bangSoLieu(d, 'chuan_dau_ra', 'ca_nam', false)
      + khungChoDien('2. Nâng cao chất lượng cán bộ quản lý, giáo viên, nhân viên',
          ['TT', 'Họ và tên', 'Chức vụ', 'Trình độ chuyên môn', 'Chuẩn chức danh',
           'Cốt cán', 'GV giỏi cấp tỉnh', 'Trình độ LLCT'], 10)
      + khungChoDien('3. Nâng cao cơ sở vật chất, trang thiết bị dạy học',
          ['TT', 'Công trình, thiết bị', 'Mới', 'Sửa chữa, cải tạo',
           'Thời gian hoàn thành', 'Kinh phí', 'Nguồn kinh phí'], 6)
      + ghiChuSua()
      + '<p style="' + TR + 'font-size:10.5pt;font-style:italic;color:#444;margin:6pt 0 0;'
      + 'text-align:justify">Ghi chú về nơi nhận: theo mô hình chính quyền địa phương hai cấp, '
      + 'bản cam kết này gửi Uỷ ban nhân dân xã ' + chan(DIA_DANH) + ' và '
      + chan(CAU_HINH.CO_QUAN_QUAN_LY || 'Sở Giáo dục và Đào tạo Nghệ An') + '. '
      + 'Phụ lục 17 của bộ biểu mẫu cũ (Trưởng phòng Giáo dục và Đào tạo ký cam kết với Giám đốc Sở) '
      + 'không còn đối tượng thực hiện.</p>'
      + '<table style="width:100%;border-collapse:collapse;margin-top:18pt"><tr>'
      + '<td style="width:55%"></td>'
      + '<td style="' + TR + 'text-align:center;font-size:12pt"><i>' + ngayThang() + '</i>'
      + '<br><b>HIỆU TRƯỞNG</b><br><i>(Ký tên, đóng dấu)</i><br><br><br><br>'
      + '<b>' + chan(ht) + '</b></td></tr></table>';

    /* A4 NGANG: khung nâng cao chất lượng đội ngũ có tới 8 cột (họ tên, chức
       vụ, trình độ chuyên môn, chuẩn chức danh, cốt cán, GV giỏi cấp tỉnh,
       trình độ LLCT), khổ dọc thì mỗi cột chưa nổi 2cm, không viết nổi chữ. */
    taiVe('Phụ lục 16 — Cam kết chất lượng nhà trường ' + d.namHoc, than,
      'phu-luc-16-cam-ket-nha-truong-' + d.namHoc + '.doc', true);
    if (typeof notify === 'function')
      notify('Đã tải Phụ lục 16. Nơi nhận là UBND xã Yên Thành và Sở GD&ĐT Nghệ An.');
  }

  /* ---------------- Mở cửa cho trang gọi ---------------- */
  window.xuatPhuLuc1  = xuat1;
  window.xuatPhuLuc2  = xuat2;
  window.xuatPhuLuc5  = xuat5;
  window.xuatPhuLuc15 = xuat15;
  window.xuatPhuLuc16 = xuat16;
})();
