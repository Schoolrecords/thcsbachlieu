/* ============================================================================
   TRÍCH XUẤT DANH MỤC HỒ SƠ SỐ — EXCEL · WORD · BẢN IN PDF CHUẨN

   Thay 2 nút cũ trên màn hình Hồ sơ số:
     · "Xuất Excel"  (trước đây là nút rỗng)  → tải tệp .xls thật
     · "In danh mục" (trước đây in cả trang web) → mở BẢN IN CHUẨN khổ A4
       (quốc hiệu, tiêu ngữ, bảng, chữ ký) — bấm In chọn "Lưu thành PDF" là ra PDF
   Và thêm nút mới:
     · "Xuất Word" → tải tệp .doc mở bằng Word, dễ chỉnh sửa và trình ký

   Cả ba đọc dữ liệu ĐANG HIỂN THỊ (mảng CATS) nên sau khi đăng nhập sẽ luôn
   là số liệu thật mới nhất từ cơ sở dữ liệu.
   ============================================================================ */

(function () {
  'use strict';

  /* ------------------------- tiện ích chung ------------------------- */

  function nhanTrangThai(st) {
    if (typeof ST_LABEL !== 'undefined' && ST_LABEL[st]) return ST_LABEL[st];
    return st === 'co' ? 'Đã có' : st === 'dang' ? 'Đang cập nhật' : 'Chưa có';
  }

  function chan(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function tenTruong() {
    return (typeof CAU_HINH !== 'undefined' && CAU_HINH.TEN_TRUONG) || 'Trường THCS Bạch Liêu';
  }

  function namHoc() {
    var nh = (typeof CAU_HINH !== 'undefined' && CAU_HINH.NAM_HOC) || '';
    return nh ? nh.replace('-', ' – ') : '';
  }

  function ngayThang() {
    var d = new Date();
    return 'Yên Thành, ngày ' + d.getDate() + ' tháng ' + (d.getMonth() + 1) + ' năm ' + d.getFullYear();
  }

  /* CATS khai báo bằng const trong index.html nên không nằm trên window —
     phải đọc qua typeof để không vỡ nếu thiếu */
  function layCats() {
    return (typeof CATS !== 'undefined' && CATS) ? CATS : [];
  }

  function thongKe() {
    var tk = { tong: 0, co: 0, dang: 0, chua: 0 };
    layCats().forEach(function (c) {
      (c.subs || []).forEach(function (s) {
        (s.items || []).forEach(function (it) {
          tk.tong++;
          if (it[3] === 'co') tk.co++;
          else if (it[3] === 'dang') tk.dang++;
          else tk.chua++;
        });
      });
    });
    return tk;
  }

  /* ---------------- bảng danh mục (dùng chung cho Word + bản in) ---------------- */

  var O = 'border:0.5pt solid #000;padding:3pt 5pt;font-family:\'Times New Roman\',serif;';

  function bangDanhMuc(coFontNho) {
    var cs = coFontNho ? 'font-size:11pt;' : 'font-size:13pt;';
    var h = '<table border="1" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%">';
    h += '<tr>'
      + '<th style="' + O + cs + 'width:9%;background:#eef1f6">TT</th>'
      + '<th style="' + O + cs + 'width:14%;background:#eef1f6">MÃ HỒ SƠ</th>'
      + '<th style="' + O + cs + 'width:42%;background:#eef1f6">TÊN HỒ SƠ</th>'
      + '<th style="' + O + cs + 'width:20%;background:#eef1f6">NGƯỜI PHỤ TRÁCH</th>'
      + '<th style="' + O + cs + 'width:15%;background:#eef1f6">TRẠNG THÁI</th></tr>';

    var laMa = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    var tt = 0;
    layCats().forEach(function (c, i) {
      h += '<tr><td colspan="5" style="' + O + cs
        + 'background:#dde5f0;font-weight:bold">' + (laMa[i] || (i + 1)) + '. ' + chan(c.name) + '</td></tr>';
      (c.subs || []).forEach(function (s) {
        h += '<tr><td colspan="5" style="' + O + cs
          + 'background:#f4f6fa;font-weight:bold;font-style:italic">' + chan(s.name)
          + ' (' + (s.items || []).length + ' hồ sơ)</td></tr>';
        (s.items || []).forEach(function (it) {
          tt++;
          h += '<tr>'
            + '<td style="' + O + cs + 'text-align:center">' + tt + '</td>'
            + '<td style="' + O + cs + '">' + chan(it[0]) + '</td>'
            + '<td style="' + O + cs + '">' + chan(it[1]) + '</td>'
            + '<td style="' + O + cs + '">' + chan(it[2] === '—' ? '' : it[2]) + '</td>'
            + '<td style="' + O + cs + 'text-align:center">' + nhanTrangThai(it[3]) + '</td></tr>';
        });
      });
    });
    var tk = thongKe();
    h += '<tr><td colspan="5" style="' + O + cs + 'font-weight:bold">TỔNG CỘNG: '
      + tk.tong + ' hồ sơ — Đã có: ' + tk.co + ' · Đang cập nhật: ' + tk.dang
      + ' · Chưa có: ' + tk.chua + '</td></tr>';
    return h + '</table>';
  }

  function thanVanBan(coFontNho) {
    var TR = "font-family:'Times New Roman',serif;";
    var donViChuQuan = (typeof CAU_HINH !== 'undefined' && CAU_HINH.DON_VI_CHU_QUAN) || 'UBND XÃ YÊN THÀNH';
    return ''
      + '<table style="width:100%;border-collapse:collapse"><tr>'
      + '<td style="' + TR + 'width:42%;text-align:center;font-size:13pt;vertical-align:top">'
      +   chan(donViChuQuan) + '<br><b>' + chan(tenTruong()).toUpperCase() + '</b><br>───────</td>'
      + '<td style="' + TR + 'text-align:center;font-size:13pt;vertical-align:top">'
      +   '<b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>Độc lập – Tự do – Hạnh phúc</b><br>───────────────</td>'
      + '</tr></table>'
      + '<p style="' + TR + 'text-align:center;font-size:15pt;margin:14pt 0 2pt"><b>DANH MỤC HỒ SƠ SỐ</b></p>'
      + '<p style="' + TR + 'text-align:center;font-size:13pt;margin:0"><b>Năm học ' + chan(namHoc()) + '</b></p>'
      + '<p style="' + TR + 'text-align:center;font-size:11pt;font-style:italic;margin:4pt 0 12pt">'
      +   'Căn cứ Điều 21 Điều lệ trường trung học ban hành kèm theo Thông tư 15/2026/TT-BGDĐT</p>'
      + bangDanhMuc(coFontNho)
      + '<table style="width:100%;border-collapse:collapse;margin-top:16pt"><tr>'
      + '<td style="width:50%"></td>'
      + '<td style="' + TR + 'text-align:center;font-size:13pt">'
      +   '<i>' + chan(ngayThang()) + '</i><br><b>HIỆU TRƯỞNG</b><br><i>(Ký tên, đóng dấu)</i>'
      +   '<br><br><br><br></td>'
      + '</tr></table>';
  }

  function taiTep(noiDung, kieuMime, tenTep) {
    var blob = new Blob(['﻿' + noiDung], { type: kieuMime });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = tenTep;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  }

  /* --------------------------- 1. XUẤT WORD --------------------------- */

  function chuaCoDuLieu() {
    if (thongKe().tong > 0) return false;
    if (typeof notify === 'function') notify('Chưa có dữ liệu danh mục để xuất — thầy cô đăng nhập rồi thử lại.');
    return true;
  }

  function xuatWord() {
    if (chuaCoDuLieu()) return;
    var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" '
      + 'xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">'
      + '<head><meta charset="utf-8"><title>Danh mục hồ sơ số</title>'
      + '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View>'
      + '<w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->'
      + '<style>@page{size:A4;margin:2cm 1.5cm 2cm 3cm}body{font-family:"Times New Roman",serif}</style>'
      + '</head><body>' + thanVanBan(false) + '</body></html>';
    taiTep(html, 'application/msword', 'danh-muc-ho-so-so-' + (namHoc() || '').replace(/\s|–/g, '') + '.doc');
    if (typeof notify === 'function') notify('Đã tải tệp Word — mở bằng Microsoft Word để chỉnh sửa và trình ký.');
  }

  /* --------------------------- 2. XUẤT EXCEL --------------------------- */

  function xuatExcelThat() {
    if (chuaCoDuLieu()) return;
    var html = '<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8">'
      + '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>'
      + '<x:Name>Danh mục hồ sơ số</x:Name><x:WorksheetOptions><x:DisplayGridlines/>'
      + '</x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->'
      + '</head><body>'
      + '<table><tr><td colspan="5" style="font-weight:bold;font-size:14pt">DANH MỤC HỒ SƠ SỐ — '
      + chan(tenTruong()).toUpperCase() + '</td></tr>'
      + '<tr><td colspan="5" style="font-weight:bold">Năm học ' + chan(namHoc()) + '</td></tr>'
      + '<tr><td colspan="5"></td></tr></table>'
      + bangDanhMuc(true)
      + '</body></html>';
    taiTep(html, 'application/vnd.ms-excel', 'danh-muc-ho-so-so-' + (namHoc() || '').replace(/\s|–/g, '') + '.xls');
    if (typeof notify === 'function') notify('Đã tải tệp Excel danh mục hồ sơ.');
  }

  /* ------------------------ 3. BẢN IN PDF CHUẨN ------------------------ */

  function inDanhMuc() {
    if (chuaCoDuLieu()) return;
    var w = window.open('', '_blank');
    if (!w) {
      if (typeof notify === 'function') notify('Trình duyệt chặn cửa sổ mới — thầy cô cho phép cửa sổ bật lên rồi bấm lại.');
      return;
    }
    w.document.write('<html><head><meta charset="utf-8"><title>Danh mục hồ sơ số — ' + chan(tenTruong()) + '</title>'
      + '<style>@page{size:A4;margin:2cm 1.5cm 2cm 3cm}'
      + 'body{font-family:"Times New Roman",serif;color:#000;margin:0}'
      + 'table{page-break-inside:auto}tr{page-break-inside:avoid}'
      + '@media screen{body{background:#525659;padding:24px}'
      + '.to-giay{background:#fff;max-width:21cm;margin:0 auto;padding:2cm 1.5cm 2cm 3cm;'
      + 'box-shadow:0 4px 24px rgba(0,0,0,.4)}}'
      + '@media print{.to-giay{padding:0}}</style></head><body>'
      + '<div class="to-giay">' + thanVanBan(false) + '</div>'
      + '<scr' + 'ipt>window.onload=function(){setTimeout(function(){window.print()},400)}</scr' + 'ipt>'
      + '</body></html>');
    w.document.close();
  }

  /* ---------------- gắn vào các nút của màn hình Hồ sơ số ---------------- */

  window.exportExcel = xuatExcelThat;   // nút "Xuất Excel" cũ gọi hàm này

  function ganNut() {
    var nutExcel = document.querySelector('button[onclick="exportExcel()"]');
    if (!nutExcel || document.getElementById('nutXuatWord')) return;

    var nutWord = document.createElement('button');
    nutWord.id = 'nutXuatWord';
    nutWord.className = nutExcel.className;
    nutWord.textContent = '📝 Xuất Word';
    nutWord.addEventListener('click', xuatWord);
    nutExcel.insertAdjacentElement('afterend', nutWord);

    var nutIn = nutWord.nextElementSibling;
    if (nutIn && nutIn.textContent.indexOf('In danh mục') >= 0) {
      nutIn.removeAttribute('onclick');
      nutIn.addEventListener('click', inDanhMuc);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ganNut);
  } else {
    ganNut();
  }
})();
