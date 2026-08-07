/* ============================================================================
   XUẤT WORD ĐỂ GIAO VIỆC

   Hai bản in phục vụ đúng một việc: đưa cho từng người bản giấy của phần họ
   phải làm, rồi ký nhận.

     1. PHIẾU GIAO VIỆC theo HỘP hồ sơ  — bấm ở đầu mỗi hộp trong Hồ sơ số.
        Trước đây muốn giao việc cho Hiệu trưởng, Kế toán hay từng tổ, phải
        mở bảng trên máy rồi chép tay sang Word. Nay mỗi hộp một nút.

     2. DANH SÁCH LỚP — bấm trong cửa sổ danh sách học sinh của từng lớp.

   VÌ SAO KHÔNG DÙNG LẠI xuat-bieu-mau.js
   Tệp đó xuất TOÀN BỘ danh mục của cả trường, khổ ngang, dùng cho lưu hồ sơ.
   Hai bản ở đây in cho MỘT người, khổ dọc, có chỗ ký nhận — khác mục đích nên
   để riêng, sửa bản này không sợ vỡ bản kia.

   KHỔ GIẤY KHAI BẰNG CM
   Word bỏ qua `size:A4`, lấy khổ mặc định của máy in. Phải ghi 21cm × 29.7cm.
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

  /* Địa danh trong thể thức văn bản là tên xã, không kèm chữ "Xã" và không
     kèm tỉnh — "Yên Thành, ngày…" chứ không "Xã Yên Thành, tỉnh Nghệ An,
     ngày…". Cắt từ địa chỉ trường đã khai sẵn. */
  function diaDanh() {
    const dc = cauHinh('DIA_CHI_TRUONG', '');
    const m = dc.match(/[Xx]ã\s+([^,]+)/);
    return m ? m[1].trim() : (dc.split(',')[0] || '').trim();
  }

  /* ==========================================================================
     KHUNG TỆP WORD — dùng chung cho cả hai bản in
     ========================================================================== */
  function khungWord(tieuDeTab, than) {
    return '<html xmlns:o="urn:schemas-microsoft-com:office:office" '
      + 'xmlns:w="urn:schemas-microsoft-com:office:word" '
      + 'xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8">'
      + '<title>' + chan(tieuDeTab) + '</title>'
      /* Bảo Word mở thẳng ở chế độ Print, không phải Web Layout */
      + '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View>'
      + '<w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->'
      + '<style>'
      + '@page{size:21cm 29.7cm;margin:2cm 1.5cm 2cm 3cm}'
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

  /* Quốc hiệu · tiêu ngữ · tên cơ quan — thể thức Nghị định 30/2020 */
  function theThuc() {
    return '<table style="border:none;width:100%"><tr>'
      + '<td style="border:none;width:45%;text-align:center;font-size:12pt">'
      + 'UBND ' + chan(cauHinh('DIA_CHI_TRUONG', '').split(',')[0] || 'XÃ') + '<br>'
      + '<b>' + chan(cauHinh('TEN_TRUONG', '').toUpperCase()) + '</b>'
      + '<div style="border-bottom:1px solid #000;width:60%;margin:3pt auto 0"></div></td>'
      + '<td style="border:none;width:55%;text-align:center;font-size:12pt">'
      + '<b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br>'
      + '<b>Độc lập - Tự do - Hạnh phúc</b>'
      + '<div style="border-bottom:1px solid #000;width:55%;margin:3pt auto 0"></div></td>'
      + '</tr></table>'
      + '<p class="phai nghieng" style="margin:10pt 0 14pt;font-size:12pt">'
      + chan(diaDanh()) + ', ' + ngayVN() + '</p>';
  }

  /* Khối ký: bên trái người nhận việc, bên phải Hiệu trưởng */
  function khoiKy(nhanChuc, nhanTen) {
    return '<table style="border:none;width:100%;margin-top:16pt"><tr>'
      + '<td style="border:none;width:50%;text-align:center;font-size:12pt">'
      + '<b>' + chan(nhanChuc || 'NGƯỜI NHẬN VIỆC') + '</b><br>'
      + '<span class="nghieng">(Ký, ghi rõ họ tên)</span>'
      + '<div style="height:56pt"></div>'
      + (nhanTen ? '<b>' + chan(nhanTen) + '</b>' : '') + '</td>'
      + '<td style="border:none;width:50%;text-align:center;font-size:12pt">'
      + '<b>HIỆU TRƯỞNG</b><br>'
      + '<span class="nghieng">(Ký tên, đóng dấu)</span>'
      + '<div style="height:56pt"></div>'
      + '<b>' + chan(cauHinh('HIEU_TRUONG', '')) + '</b></td>'
      + '</tr></table>';
  }

  function taiVe(html, tenTep) {
    /* Dấu BOM ở đầu để Word đọc đúng tiếng Việt có dấu; thiếu nó là ra một
       trang toàn ký tự lạ. */
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

  const TEN_TT = { co: 'Đã có', dang: 'Đang cập nhật', chua: 'Chưa có' };

  /* ==========================================================================
     1. PHIẾU GIAO VIỆC THEO HỘP HỒ SƠ
     ========================================================================== */
  window.xuatHopWord = function (catId, subIdx) {
    if (typeof CATS === 'undefined') return;
    const cat = CATS.find(c => c.id === catId);
    if (!cat) return;
    const sub = cat.subs[subIdx];
    if (!sub) return;

    /* Lấy bản ghi thật từ cơ sở dữ liệu nếu có — mã cũ, người phụ trách và
       trạng thái ở đó mới là số liệu đang dùng; mảng CATS chỉ là bản dự phòng
       khi chưa đăng nhập. */
    const lay = (typeof window.layHoSo === 'function') ? window.layHoSo : function () { return null; };

    const dong = sub.items.map(function (it, i) {
      const ma = it[0], ten = it[1];
      const hs = lay(ma);
      const nguoi = (hs && hs.nguoi_phu_trach) || it[2] || '';
      const tt = (hs && hs.trang_thai) || it[3] || 'chua';
      const maCu = (hs && hs.ma_cu) || '';
      return '<tr>'
        + '<td class="giua">' + (i + 1) + '</td>'
        + '<td class="giua"><b>' + chan(ma) + '</b>'
        + (maCu ? '<br><span style="font-size:10pt">' + chan(maCu) + '</span>' : '') + '</td>'
        + '<td>' + chan(ten) + '</td>'
        + '<td class="giua">' + chan(TEN_TT[tt] || tt) + '</td>'
        + '<td></td></tr>';
    }).join('');

    const daCo = sub.items.filter(function (it) {
      const hs = lay(it[0]);
      return ((hs && hs.trang_thai) || it[3]) === 'co';
    }).length;

    /* Người phụ trách của hộp: lấy người xuất hiện nhiều nhất trong hộp */
    const dem = {};
    sub.items.forEach(function (it) {
      const hs = lay(it[0]);
      const n = (hs && hs.nguoi_phu_trach) || it[2] || '';
      if (n) dem[n] = (dem[n] || 0) + 1;
    });
    const phuTrach = Object.keys(dem).sort(function (a, b) { return dem[b] - dem[a]; })[0] || '';

    const than = theThuc()
      + '<p class="giua" style="font-size:15pt;font-weight:bold;margin:0">PHIẾU GIAO VIỆC</p>'
      + '<p class="giua" style="font-size:13pt;font-weight:bold;margin:4pt 0 2pt">'
      + 'HỒ SƠ MINH CHỨNG — ' + chan(cat.name) + '</p>'
      + '<p class="giua nghieng" style="font-size:12pt;margin:0 0 14pt">'
      + chan(sub.code) + '. ' + chan(sub.name)
      + ' · Năm học ' + chan(cauHinh('NAM_HOC', '')) + '</p>'

      + '<p style="margin:0 0 4pt"><b>Người phụ trách:</b> '
      + (phuTrach ? chan(phuTrach) : '.....................................') + '</p>'
      + '<p style="margin:0 0 12pt"><b>Số đầu hồ sơ:</b> ' + sub.items.length
      + ' &nbsp;·&nbsp; <b>Đã có:</b> ' + daCo
      + ' &nbsp;·&nbsp; <b>Còn phải hoàn thiện:</b> ' + (sub.items.length - daCo) + '</p>'

      + '<table><thead><tr>'
      + '<th style="width:6%">TT</th>'
      + '<th style="width:17%">Mã minh chứng<br><span style="font-weight:normal;font-size:10pt">mã mới / mã cũ</span></th>'
      + '<th style="width:45%">Tên minh chứng</th>'
      + '<th style="width:14%">Trạng thái</th>'
      + '<th style="width:18%">Thời hạn hoàn thành</th>'
      + '</tr></thead><tbody>' + dong + '</tbody></table>'

      + '<p class="nghieng" style="font-size:11.5pt;margin:10pt 0 0">'
      + 'Ghi chú: cột “Thời hạn hoàn thành” do nhà trường ghi khi giao việc. '
      + 'Hồ sơ nộp lên thư mục Google Drive của từng minh chứng; hệ thống tự '
      + 'cập nhật trạng thái sau khi quét.</p>'

      + khoiKy(phuTrach ? 'NGƯỜI PHỤ TRÁCH' : 'NGƯỜI NHẬN VIỆC', phuTrach);

    const tenTep = 'phieu-giao-viec-' + chan(sub.code).replace(/[^0-9A-Za-z.]/g, '')
      + '-' + cauHinh('NAM_HOC', '') + '.doc';
    taiVe(khungWord('Phiếu giao việc ' + sub.code, than), tenTep);

    if (typeof notify === 'function') {
      notify('Đã tải phiếu giao việc “' + sub.code + '. ' + sub.name + '” — '
        + sub.items.length + ' đầu hồ sơ.');
    }
  };

  /* ==========================================================================
     2. DANH SÁCH LỚP
     ========================================================================== */
  window.xuatLopWord = function (lop, namHoc, chuNhiem, ds) {
    if (!ds || !ds.length) {
      if (typeof notify === 'function') notify('Lớp này chưa có học sinh nào để xuất.');
      return;
    }

    const dong = ds.map(function (r, i) {
      return '<tr>'
        + '<td class="giua">' + (i + 1) + '</td>'
        + '<td class="giua">' + chan(r.ma) + '</td>'
        + '<td>' + chan(r.ten) + '</td>'
        + '<td class="giua">' + chan(r.ns || '') + '</td>'
        + '<td class="giua">' + chan(r.gt || '') + '</td>'
        + '<td></td></tr>';
    }).join('');

    const than = theThuc()
      + '<p class="giua" style="font-size:15pt;font-weight:bold;margin:0">DANH SÁCH HỌC SINH</p>'
      + '<p class="giua" style="font-size:14pt;font-weight:bold;margin:5pt 0 2pt">LỚP '
      + chan(String(lop).toUpperCase()) + '</p>'
      + '<p class="giua nghieng" style="font-size:12pt;margin:0 0 14pt">Năm học '
      + chan(namHoc) + '</p>'

      + '<p style="margin:0 0 4pt"><b>Giáo viên chủ nhiệm:</b> '
      + (chuNhiem ? chan(chuNhiem) : '.....................................') + '</p>'
      + '<p style="margin:0 0 12pt"><b>Sĩ số:</b> ' + ds.length + ' học sinh</p>'

      + '<table><thead><tr>'
      + '<th style="width:6%">TT</th>'
      + '<th style="width:17%">Mã học sinh</th>'
      + '<th style="width:34%">Họ và tên</th>'
      + '<th style="width:15%">Ngày sinh</th>'
      + '<th style="width:10%">Giới tính</th>'
      + '<th style="width:18%">Ghi chú</th>'
      + '</tr></thead><tbody>' + dong + '</tbody></table>'

      /* Nhắc ngay trên bản in: bản giấy ra khỏi hệ thống là hết hàng rào bảo
         vệ của máy chủ, người cầm tờ giấy phải tự giữ. */
      + '<p class="nghieng" style="font-size:11.5pt;margin:10pt 0 0">'
      + 'Thông tin cá nhân của học sinh được bảo vệ theo Nghị định 13/2023/NĐ-CP. '
      + 'Số định danh cá nhân không in trong danh sách này.</p>'

      + khoiKy('GIÁO VIÊN CHỦ NHIỆM', chuNhiem);

    const tenTep = 'danh-sach-lop-' + String(lop).toLowerCase().replace(/[^0-9a-z]/g, '')
      + '-' + namHoc + '.doc';
    taiVe(khungWord('Danh sách lớp ' + lop, than), tenTep);

    if (typeof notify === 'function') {
      notify('Đã tải danh sách lớp ' + String(lop).toUpperCase()
        + ' — ' + ds.length + ' học sinh.');
    }
  };
})();
