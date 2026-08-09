/* ============================================================================
   XUẤT WORD — HỘI ĐỒNG TỰ ĐÁNH GIÁ

   Hai bản in phục vụ hai việc khác nhau của cùng một hội đồng:

     1. DANH SÁCH HỘI ĐỒNG TỰ ĐÁNH GIÁ — bản kèm theo Quyết định thành lập.
        Quyết định này là tài liệu PHẢI kèm báo cáo tự đánh giá (Phần IV Biểu 1),
        nên danh sách phải in ra được thành văn bản đúng thể thức.
        Khổ A4 DỌC, 5 cột.

     2. BẢNG PHÂN CÔNG NHIỆM VỤ — điểm b khoản 3 Điều 9 Thông tư 57 giao hội
        đồng "phân công nhiệm vụ cụ thể cho từng thành viên". Bảng này ghi ai
        phụ trách tiêu chí nào, thuộc nhóm công tác nào, làm việc gì.
        Khổ A4 NGANG vì có 7 cột, trong đó cột Nhiệm vụ là câu dài.

   VÌ SAO KHÔNG GỘP VÀO xuat-giao-viec.js
   Tệp đó in phiếu cho MỘT người ký nhận việc. Hai bản ở đây là văn bản của cả
   hội đồng, người ký là Chủ tịch Hội đồng chứ không phải Hiệu trưởng. Khác
   người ký thì khác khối ký, để chung dễ sửa nhầm.

   VÌ SAO KHÔNG LÀM NÚT TẢI MẪU VÀ TẢI LÊN
   Hội đồng chỉ 5-7 người, nhập tay trên màn hình mất chừng ba phút và CHỌN
   ĐƯỢC TỪ DANH SÁCH CBGV-NV nên không bao giờ sai tên. Đi vòng qua Excel thì
   "Ngô Thị Thủy" và "Ngô thị Thuỷ" thành hai người khác nhau, lệch với quyết
   định thành lập — đúng thứ đoàn kiểm tra soi. Thầy Chung chốt hướng này
   ngày 09/8/2026.

   KHỔ GIẤY KHAI BẰNG CM
   Word bỏ qua `size:A4`, lấy khổ mặc định của máy in. Phải ghi bằng cm.
   Lề theo Nghị định 30/2020: trên 20mm, dưới 20mm, trái 30mm, phải 15mm.
   ============================================================================ */

(function () {
  'use strict';

  const FONT = 'font-family:"Times New Roman",serif';

  function chan(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function cauHinh(khoa, mac) {
    return (typeof CAU_HINH !== 'undefined' && CAU_HINH[khoa]) || mac;
  }

  function ngayVN(d) {
    const t = d ? new Date(d) : new Date();
    return 'ngày ' + String(t.getDate()).padStart(2, '0')
      + ' tháng ' + String(t.getMonth() + 1).padStart(2, '0')
      + ' năm ' + t.getFullYear();
  }

  /* Ngày dạng dd/mm/yyyy cho câu "Quyết định số … ngày …" */
  function ngayGon(s) {
    const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
  }

  /* Địa danh trong thể thức là tên xã, không kèm chữ "Xã" và không kèm tỉnh */
  function diaDanh() {
    const dc = cauHinh('DIA_CHI_TRUONG', '');
    const m = dc.match(/[Xx]ã\s+([^,]+)/);
    return m ? m[1].trim() : (dc.split(',')[0] || '').trim();
  }

  /* ==========================================================================
     KHUNG TỆP WORD — nhận khổ giấy vì hai bản in khác khổ
     ========================================================================== */
  function khungWord(tieuDeTab, than, ngang) {
    const khoGiay = ngang
      ? '@page{size:29.7cm 21cm;margin:1.5cm 1.5cm 1.5cm 2cm}'
      : '@page{size:21cm 29.7cm;margin:2cm 1.5cm 2cm 3cm}';
    return '<html xmlns:o="urn:schemas-microsoft-com:office:office" '
      + 'xmlns:w="urn:schemas-microsoft-com:office:word" '
      + 'xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8">'
      + '<title>' + chan(tieuDeTab) + '</title>'
      + '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View>'
      + '<w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->'
      + '<style>' + khoGiay
      + 'body{' + FONT + ';font-size:13pt;line-height:1.5;color:#000}'
      + 'table{border-collapse:collapse;width:100%}'
      + 'th,td{border:1px solid #000;padding:4pt 6pt;font-size:12pt;vertical-align:top}'
      + 'th{background:#e8e8e8;font-weight:bold;text-align:center}'
      /* Bảng dài phải lặp dòng tiêu đề ở mỗi trang giấy */
      + 'thead{display:table-header-group}'
      + 'tr{page-break-inside:avoid}'
      + '.giua{text-align:center}.phai{text-align:right}'
      + '.nghieng{font-style:italic}'
      + '</style></head><body>' + than + '</body></html>';
  }

  /* Quốc hiệu · tiêu ngữ · tên cơ quan — thể thức Nghị định 30/2020.
     Cơ quan chủ quản in hoa KHÔNG đậm; tên trường in hoa VÀ đậm. Ô Quốc hiệu
     rộng 62% cộng dấu cách không ngắt để chữ "NAM" không rơi xuống dòng. */
  function theThuc() {
    const chuQuan = 'UBND ' + (cauHinh('DIA_CHI_TRUONG', '').split(',')[0] || 'Xã').trim();
    return '<table style="border:none;width:100%;border-collapse:collapse"><tr>'
      + '<td style="border:none;padding:0;width:38%;text-align:center;font-size:12pt">'
      + chan(chuQuan.toUpperCase()) + '<br>'
      + '<b>' + chan(cauHinh('TEN_TRUONG', '').toUpperCase()) + '</b>'
      + '<div style="width:62%;margin:3pt auto 0;border-bottom:1px solid #000;font-size:1pt;line-height:1pt">&nbsp;</div></td>'
      + '<td style="border:none;padding:0;width:62%;text-align:center;font-size:12pt">'
      + '<b style="white-space:nowrap">CỘNG&nbsp;HÒA&nbsp;XÃ&nbsp;HỘI&nbsp;'
      + 'CHỦ&nbsp;NGHĨA&nbsp;VIỆT&nbsp;NAM</b><br>'
      + '<b>Độc lập - Tự do - Hạnh phúc</b>'
      + '<div style="width:48%;margin:3pt auto 0;border-bottom:1px solid #000;font-size:1pt;line-height:1pt">&nbsp;</div></td>'
      + '</tr></table>'
      + '<p class="phai nghieng" style="margin:10pt 0 14pt;font-size:12pt">'
      + chan(diaDanh()) + ', ' + ngayVN() + '</p>';
  }

  function taiVe(html, tenTep) {
    /* Dấu BOM ở đầu để Word đọc đúng tiếng Việt có dấu */
    const blob = new Blob(['﻿' + html], { type: 'application/msword' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = tenTep;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    }, 400);
  }

  function bao(s) { if (typeof notify === 'function') notify(s); }

  /* Lấy dữ liệu hội đồng đang hiện trên màn hình. Không tự đọc lại cơ sở dữ
     liệu: bản in phải khớp đúng thứ thầy cô đang nhìn thấy, kể cả dòng vừa sửa
     chưa kịp tải lại. */
  function duLieu() {
    if (typeof window.duLieuHoiDong !== 'function') return null;
    return window.duLieuHoiDong();
  }

  /* Câu "Kèm theo Quyết định số … ngày …". Chưa nhập quyết định thì để chỗ
     trống có dấu chấm cho nhà trường điền tay, KHÔNG bịa số. */
  function cauCanCu(hd) {
    const so = hd && hd.so_quyet_dinh ? chan(hd.so_quyet_dinh) : '……/QĐ-…';
    const ng = hd && hd.ngay_quyet_dinh ? ngayGon(hd.ngay_quyet_dinh) : '…/…/……';
    return '(Kèm theo Quyết định số ' + so + ' ngày ' + ng + ' của Hiệu trưởng '
      + chan(cauHinh('TEN_TRUONG', '')) + ')';
  }

  /* Khối ký của văn bản hội đồng: người ký là CHỦ TỊCH HỘI ĐỒNG, không phải
     Hiệu trưởng — hội đồng tự đánh giá là một tập thể có chủ tịch riêng
     (khoản 2 Điều 9), dù chủ tịch thường chính là Hiệu trưởng.
     Chưa có ai giữ vai Chủ tịch thì để trống chỗ tên, không điền bừa. */
  function khoiKyHoiDong(tv) {
    const ct = (tv || []).find(function (x) { return x.vai_tro === 'Chủ tịch'; });
    const tk = (tv || []).find(function (x) { return x.vai_tro === 'Thư ký'; });
    return '<table style="border:none;width:100%;margin-top:18pt"><tr>'
      + '<td style="border:none;width:50%;text-align:center;font-size:12pt">'
      + '<b>THƯ KÝ HỘI ĐỒNG</b><br>'
      + '<span class="nghieng">(Ký, ghi rõ họ tên)</span>'
      + '<div style="height:56pt"></div>'
      + (tk ? '<b>' + chan(tk.ho_ten) + '</b>'
            : '<span style="letter-spacing:1pt">.....................................</span>')
      + '</td>'
      + '<td style="border:none;width:50%;text-align:center;font-size:12pt">'
      + '<b>TM. HỘI ĐỒNG TỰ ĐÁNH GIÁ<br>CHỦ TỊCH</b><br>'
      + '<span class="nghieng">(Ký tên, đóng dấu)</span>'
      + '<div style="height:56pt"></div>'
      + (ct ? '<b>' + chan(ct.ho_ten) + '</b>'
            : '<span style="letter-spacing:1pt">.....................................</span>')
      + '</td></tr></table>';
  }

  /* Thứ tự in theo VAI TRÒ, không theo thứ tự nhập: văn bản hành chính bao giờ
     cũng xếp Chủ tịch trước, rồi Phó Chủ tịch, Thư ký, sau cùng là ủy viên. */
  const THU_TU_VAI = { 'Chủ tịch': 1, 'Phó Chủ tịch': 2, 'Thư ký': 3, 'Ủy viên': 4 };
  function xepTheoVai(tv) {
    return (tv || []).slice().sort(function (a, b) {
      const va = THU_TU_VAI[a.vai_tro] || 9, vb = THU_TU_VAI[b.vai_tro] || 9;
      if (va !== vb) return va - vb;
      return (a.so_tt || 0) - (b.so_tt || 0);
    });
  }

  function tenTep(goc, namHoc) {
    return goc + '-' + String(namHoc || '').replace(/[^0-9-]/g, '') + '.doc';
  }

  /* ==========================================================================
     1. DANH SÁCH HỘI ĐỒNG TỰ ĐÁNH GIÁ — A4 dọc
     ========================================================================== */
  window.xuatDanhSachHoiDong = function () {
    const d = duLieu();
    if (!d) { bao('Chưa đọc được dữ liệu hội đồng. Thầy cô mở lại mục này.'); return; }
    if (!d.tv || !d.tv.length) {
      bao('Hội đồng chưa có thành viên nào — chưa có gì để in.');
      return;
    }
    const ds = xepTheoVai(d.tv);

    let h = theThuc();
    h += '<p class="giua" style="margin:6pt 0 2pt"><b style="font-size:14pt">'
      + 'DANH SÁCH HỘI ĐỒNG TỰ ĐÁNH GIÁ</b></p>'
      + '<p class="giua" style="margin:0 0 2pt;font-size:13pt">Năm học '
      + chan(d.nam_hoc || '') + '</p>'
      + '<p class="giua nghieng" style="margin:0 0 14pt;font-size:12pt">'
      + cauCanCu(d.hd) + '</p>';

    h += '<table><thead><tr>'
      + '<th style="width:8%">TT</th><th style="width:30%">Họ và tên</th>'
      + '<th style="width:24%">Chức vụ</th><th style="width:22%">Vai trò trong Hội đồng</th>'
      + '<th style="width:16%">Ghi chú</th>'
      + '</tr></thead><tbody>';
    ds.forEach(function (t, i) {
      h += '<tr><td class="giua">' + (i + 1) + '</td>'
        + '<td>' + chan(t.ho_ten) + '</td>'
        + '<td>' + chan(t.chuc_vu || '') + '</td>'
        + '<td class="giua">' + chan(t.vai_tro || '') + '</td>'
        + '<td>' + chan(t.ghi_chu || '') + '</td></tr>';
    });
    h += '</tbody></table>';

    h += '<p style="margin:10pt 0 0;font-size:12pt">Danh sách gồm <b>'
      + ds.length + '</b> thành viên.</p>';

    /* Nhắc điều kiện của Điều 9 ngay trên bản in — người duyệt văn bản đọc là
       thấy, khỏi phải mở lại phần mềm để đối chiếu. Chỉ nhắc khi CHƯA đạt;
       đạt rồi mà vẫn in dòng cảnh báo thì thành văn bản có tì vết. */
    const le = ds.length % 2 === 1, du = ds.length >= 5;
    const soCT = ds.filter(function (x) { return x.vai_tro === 'Chủ tịch'; }).length;
    const soTK = ds.filter(function (x) { return x.vai_tro === 'Thư ký'; }).length;
    const thieu = [];
    if (!du) thieu.push('chưa đủ 05 thành viên');
    if (!le) thieu.push('số lượng đang là số chẵn');
    if (soCT !== 1) thieu.push('phải có đúng 01 Chủ tịch, đang có ' + soCT);
    if (soTK !== 1) thieu.push('phải có đúng 01 Thư ký, đang có ' + soTK);
    if (thieu.length) {
      h += '<p class="nghieng" style="margin:8pt 0 0;font-size:11.5pt">'
        + 'Lưu ý theo khoản 1 và khoản 2 Điều 9 Thông tư 57/2026/TT-BGDĐT: '
        + chan(thieu.join('; ')) + '.</p>';
    }

    h += khoiKyHoiDong(ds);
    taiVe(khungWord('Danh sách Hội đồng tự đánh giá', h, false),
      tenTep('danh-sach-hoi-dong-tu-danh-gia', d.nam_hoc));
    bao('Đã tải Danh sách Hội đồng tự đánh giá — ' + ds.length + ' thành viên.');
  };

  /* ==========================================================================
     2. BẢNG PHÂN CÔNG NHIỆM VỤ — A4 ngang
     ========================================================================== */
  window.xuatPhanCongHoiDong = function () {
    const d = duLieu();
    if (!d) { bao('Chưa đọc được dữ liệu hội đồng. Thầy cô mở lại mục này.'); return; }
    if (!d.tv || !d.tv.length) {
      bao('Hội đồng chưa có thành viên nào — chưa có gì để in.');
      return;
    }
    const ds = xepTheoVai(d.tv);

    /* Tra tên tiêu chí để in "1.1 Tầm nhìn…" thay vì mỗi mã trơ trọi. Người
       nhận bản giấy không thuộc lòng 15 mã tiêu chí. */
    const tenTC = {};
    (d.tieuChi || []).forEach(function (x) { tenTC[x.ma] = x.ten; });
    function moTaTC(ma) {
      return tenTC[ma] ? ma + '. ' + tenTC[ma] : ma;
    }

    let h = theThuc();
    h += '<p class="giua" style="margin:6pt 0 2pt"><b style="font-size:14pt">'
      + 'BẢNG PHÂN CÔNG NHIỆM VỤ THÀNH VIÊN HỘI ĐỒNG TỰ ĐÁNH GIÁ</b></p>'
      + '<p class="giua" style="margin:0 0 2pt;font-size:13pt">Năm học '
      + chan(d.nam_hoc || '') + '</p>'
      + '<p class="giua nghieng" style="margin:0 0 12pt;font-size:12pt">'
      + cauCanCu(d.hd) + '</p>'
      + '<p style="margin:0 0 10pt;font-size:12pt"><i>Căn cứ điểm b khoản 3 Điều 9 '
      + 'Thông tư 57/2026/TT-BGDĐT: Hội đồng tự đánh giá phân công nhiệm vụ cụ thể '
      + 'cho từng thành viên.</i></p>';

    h += '<table><thead><tr>'
      + '<th style="width:4%">TT</th><th style="width:15%">Họ và tên</th>'
      + '<th style="width:11%">Chức vụ</th><th style="width:11%">Vai trò trong Hội đồng</th>'
      + '<th style="width:14%">Nhóm công tác</th>'
      + '<th style="width:24%">Tiêu chí phụ trách</th>'
      + '<th style="width:21%">Nhiệm vụ cụ thể</th>'
      + '</tr></thead><tbody>';
    let soChuaGiao = 0;
    ds.forEach(function (t, i) {
      const mc = t.tieu_chi_phu_trach || [];
      if (!mc.length) soChuaGiao++;
      h += '<tr><td class="giua">' + (i + 1) + '</td>'
        + '<td>' + chan(t.ho_ten) + '</td>'
        + '<td>' + chan(t.chuc_vu || '') + '</td>'
        + '<td class="giua">' + chan(t.vai_tro || '') + '</td>'
        + '<td>' + chan(t.nhom || '') + '</td>'
        /* Chưa giao thì để TRỐNG, không ghi "0" hay "không có" — ô trống trên
           bản giấy đọc ra là "còn phải điền", đúng thực tế. */
        + '<td>' + (mc.length
            ? mc.map(function (m) { return chan(moTaTC(m)); }).join('<br>')
            : '') + '</td>'
        + '<td>' + chan(t.nhiem_vu || '') + '</td></tr>';
    });
    h += '</tbody></table>';

    if (soChuaGiao) {
      h += '<p class="nghieng" style="margin:9pt 0 0;font-size:11.5pt">Còn <b>'
        + soChuaGiao + '</b> thành viên chưa được phân công tiêu chí.</p>';
    }

    h += khoiKyHoiDong(ds);
    taiVe(khungWord('Bảng phân công nhiệm vụ Hội đồng tự đánh giá', h, true),
      tenTep('phan-cong-nhiem-vu-hoi-dong', d.nam_hoc));
    bao('Đã tải Bảng phân công nhiệm vụ — ' + ds.length + ' thành viên'
      + (soChuaGiao ? ', còn ' + soChuaGiao + ' người chưa được giao tiêu chí.' : '.'));
  };
})();
