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
    var diaDanh = (typeof CAU_HINH !== 'undefined' && CAU_HINH.DIA_DANH) || 'Yên Thành';
    return diaDanh + ', ngày ' + d.getDate() + ' tháng ' + (d.getMonth() + 1) + ' năm ' + d.getFullYear();
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

  /* ============================================================
     4. DANH MỤC MINH CHỨNG THEO PHỤ LỤC IV THÔNG TƯ 57/2026

     Đúng mẫu tại mục II khoản 4 Phụ lục IV:
       TT | Mã minh chứng | Tên minh chứng
          | Định dạng, vị trí lưu trữ hoặc đường dẫn điện tử | Ghi chú

     Phụ lục IV khuyến khích mã minh chứng đặt dưới dạng liên kết điện tử
     tới thư mục lưu trữ — nên cột thứ tư là đường dẫn bấm được, hội đồng
     thẩm định mở thẳng thư mục mà không phải hỏi nhà trường.
     ============================================================ */

  /* Gom toàn bộ minh chứng đang hiển thị, sắp theo mã minh chứng */
  function dsMinhChung() {
    var ra = [];
    layCats().forEach(function (c) {
      (c.subs || []).forEach(function (s) {
        (s.items || []).forEach(function (it) {
          var hs = (typeof window.layHoSo === 'function') ? window.layHoSo(it[0]) : null;
          ra.push({
            ma: it[0],
            ten: it[1],
            maCu: it[5] || (hs && hs.ma_cu) || '',
            dinhDang: (hs && hs.dinh_dang) || '',
            link: (hs && hs.link_drive) || '',
            viTri: s.name || '',
            trangThai: it[3]
          });
        });
      });
    });
    ra.sort(function (a, b) { return a.ma.localeCompare(b.ma, 'vi'); });
    return ra;
  }

  function bangMinhChung() {
    var TR = "font-family:'Times New Roman',serif;";
    var O = TR + 'border:1px solid #000;padding:4pt 6pt;font-size:11.5pt;';
    var ds = dsMinhChung();
    var h = '<table style="width:100%;border-collapse:collapse">'
      + '<tr>'
      + '<td style="' + O + 'text-align:center;font-weight:bold;width:5%">TT</td>'
      + '<td style="' + O + 'text-align:center;font-weight:bold;width:14%">Mã minh chứng</td>'
      + '<td style="' + O + 'text-align:center;font-weight:bold;width:38%">Tên minh chứng</td>'
      + '<td style="' + O + 'text-align:center;font-weight:bold;width:29%">Định dạng, vị trí lưu trữ<br>hoặc đường dẫn điện tử</td>'
      + '<td style="' + O + 'text-align:center;font-weight:bold;width:14%">Ghi chú</td>'
      + '</tr>';

    ds.forEach(function (m, i) {
      var viTri = chan(m.viTri);
      var oViTri = m.link
        ? (chan(m.dinhDang || 'Thư mục điện tử') + ' — <a href="' + m.link + '">' + viTri + '</a>')
        : (chan(m.dinhDang || '') + (m.dinhDang ? ' — ' : '') + viTri);
      var ghiChu = m.maCu
        ? 'Mã cũ: ' + chan(m.maCu)
        : 'Lập mới theo Thông tư 57';
      h += '<tr>'
        + '<td style="' + O + 'text-align:center">' + (i + 1) + '</td>'
        + '<td style="' + O + 'font-weight:bold">' + chan(m.ma) + '</td>'
        + '<td style="' + O + '">' + chan(m.ten) + '</td>'
        + '<td style="' + O + 'font-size:10.5pt">' + oViTri + '</td>'
        + '<td style="' + O + 'font-size:10.5pt">' + ghiChu + '</td>'
        + '</tr>';
    });

    var daCo = ds.filter(function (m) { return m.trangThai === 'co'; }).length;
    h += '<tr><td colspan="5" style="' + O + 'font-weight:bold">TỔNG CỘNG: ' + ds.length
      + ' minh chứng — đã có tệp: ' + daCo + ' · chưa có: ' + (ds.length - daCo) + '</td></tr>';
    return h + '</table>';
  }

  function thanMinhChung() {
    var TR = "font-family:'Times New Roman',serif;";
    var donViChuQuan = (typeof CAU_HINH !== 'undefined' && CAU_HINH.DON_VI_CHU_QUAN) || 'UBND XÃ YÊN THÀNH';
    return ''
      + '<table style="width:100%;border-collapse:collapse"><tr>'
      + '<td style="' + TR + 'width:42%;text-align:center;font-size:13pt;vertical-align:top">'
      +   chan(donViChuQuan) + '<br><b>' + chan(tenTruong()).toUpperCase() + '</b><br>───────</td>'
      + '<td style="' + TR + 'text-align:center;font-size:13pt;vertical-align:top">'
      +   '<b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>Độc lập – Tự do – Hạnh phúc</b><br>───────────────</td>'
      + '</tr></table>'
      + '<p style="' + TR + 'text-align:center;font-size:15pt;margin:14pt 0 2pt"><b>DANH MỤC MINH CHỨNG</b></p>'
      + '<p style="' + TR + 'text-align:center;font-size:13pt;margin:0"><b>Năm học ' + chan(namHoc()) + '</b></p>'
      + '<p style="' + TR + 'text-align:center;font-size:11pt;font-style:italic;margin:4pt 0 12pt">'
      +   'Lập theo mục II khoản 4 Phụ lục IV Thông tư số 57/2026/TT-BGDĐT ngày 07/7/2026<br>'
      +   'của Bộ trưởng Bộ Giáo dục và Đào tạo</p>'
      + bangMinhChung()
      + '<p style="' + TR + 'font-size:11pt;font-style:italic;margin:10pt 0 0">'
      +   'Ghi chú: mã minh chứng được thiết lập dưới dạng liên kết điện tử tới thư mục lưu trữ '
      +   'trên hệ thống hồ sơ số của nhà trường. Một minh chứng dùng cho nhiều tiêu chí vẫn giữ '
      +   'một mã duy nhất.</p>'
      + '<table style="width:100%;border-collapse:collapse;margin-top:16pt"><tr>'
      + '<td style="width:50%"></td>'
      + '<td style="' + TR + 'text-align:center;font-size:13pt">'
      +   '<i>' + chan(ngayThang()) + '</i><br><b>HIỆU TRƯỞNG</b><br><i>(Ký tên, đóng dấu)</i>'
      +   '<br><br><br><br></td>'
      + '</tr></table>';
  }

  function xuatMinhChung() {
    if (chuaCoDuLieu()) return;
    var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" '
      + 'xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">'
      + '<head><meta charset="utf-8"><title>Danh mục minh chứng</title>'
      + '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View>'
      + '<w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->'
      + '<style>@page{size:A4;margin:2cm 1.5cm 2cm 3cm}body{font-family:"Times New Roman",serif}</style>'
      + '</head><body>' + thanMinhChung() + '</body></html>';
    taiTep(html, 'application/msword',
      'danh-muc-minh-chung-' + (namHoc() || '').replace(/\s|–/g, '') + '.doc');
    if (typeof notify === 'function') {
      notify('Đã tải Danh mục minh chứng theo Phụ lục IV — mã minh chứng là liên kết bấm được tới thư mục Drive.');
    }
  }

  /* ---------------- gắn vào các nút của màn hình Hồ sơ số ---------------- */

  window.xuatDanhMucMinhChung = xuatMinhChung;
  /* Nút Xuất Excel đã bỏ khỏi màn hình theo yêu cầu. Giữ hàm và mở qua window
     để gọi lại được nếu sau này cần, khỏi phải viết lại từ đầu. */
  window.xuatExcelHoSo = xuatExcelThat;

  /* Neo vào một thẻ TRỐNG đặt sẵn (#hsNeoNut), không neo vào nút nào cả.
     Đã hai lần suýt mất nút vì neo nhầm: neo vào "Xuất Excel" rồi nút đó bị
     bỏ, neo tiếp vào "Hồ sơ của tôi" thì nút đó cũng bị thay. Mà hai nút gắn
     vào đây — "Xuất Word" và "Danh mục minh chứng (Phụ lục IV)" — là bản nộp
     Sở, mất là hỏng việc. Thẻ neo trống thì không ai xoá nhầm. */
  function ganNut() {
    var neo = document.getElementById('hsNeoNut');
    if (!neo || document.getElementById('nutXuatWord')) return;

    var nutWord = document.createElement('button');
    nutWord.id = 'nutXuatWord';
    nutWord.className = 'btn btn-out';
    nutWord.textContent = '📝 Xuất Word';
    nutWord.addEventListener('click', xuatWord);
    neo.insertAdjacentElement('afterend', nutWord);

    var nutMC = document.createElement('button');
    nutMC.id = 'nutDanhMucMinhChung';
    nutMC.className = 'btn btn-gold';
    nutMC.textContent = '📋 Danh mục minh chứng (Phụ lục IV)';
    nutMC.title = 'Kết xuất danh mục minh chứng đúng mẫu Phụ lục IV Thông tư 57 để nộp Sở';
    nutMC.addEventListener('click', xuatMinhChung);
    nutWord.insertAdjacentElement('afterend', nutMC);
    /* Nút "In danh mục" đã bỏ khỏi màn hình, không còn gì để gắn.
       Hàm inDanhMuc vẫn giữ, gọi được từ window nếu sau này cần dùng lại. */
  }
  window.inDanhMucHoSo = inDanhMuc;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ganNut);
  } else {
    ganNut();
  }
})();
