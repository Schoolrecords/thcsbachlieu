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

  /* Tên TỆP lấy thẳng năm học, giữ nguyên gạch nối. namHoc() ở trên đổi gạch
     nối thành gạch dài có dấu cách cho đẹp bản in; đem chuỗi ấy đi đặt tên
     tệp rồi bóc hết dấu cách và gạch dài thì ra "20262027" — nhìn tên tệp
     không đọc được năm học nào. */
  function namTep() {
    return (typeof CAU_HINH !== 'undefined' && CAU_HINH.NAM_HOC) || '';
  }

  function ngayThang() {
    var d = new Date();
    var diaDanh = (typeof CAU_HINH !== 'undefined' && CAU_HINH.DIA_DANH) || 'Yên Thành';
    return diaDanh + ', ngày ' + d.getDate() + ' tháng ' + (d.getMonth() + 1) + ' năm ' + d.getFullYear();
  }

  function hieuTruong() {
    return (typeof CAU_HINH !== 'undefined' && CAU_HINH.HIEU_TRUONG) || '';
  }

  /* Khai báo khổ giấy cho Word.

     Word KHÔNG hiểu 'size:A4' một mình — nó lấy khổ mặc định của máy in, nên
     bản landscape mở ra vẫn dọc và bảng bị cắt mất mấy cột cuối. Phải ghi kích
     thước bằng centimet VÀ thêm mso-page-orientation thì Word mới xoay giấy.
     Lề đặt theo Nghị định 30/2020/NĐ-CP: trên/dưới 20-25mm, trái 30-35mm,
     phải 15-20mm (khổ ngang thì hoán vị cho cân). */
  function dauTep(tieuDeTep, ngang) {
    var kho = ngang
      ? '@page{size:29.7cm 21cm;mso-page-orientation:landscape;margin:1.5cm 2cm 1.5cm 2cm}'
      : '@page{size:21cm 29.7cm;margin:2cm 1.5cm 2cm 3cm}';
    return '<html xmlns:o="urn:schemas-microsoft-com:office:office" '
      + 'xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">'
      + '<head><meta charset="utf-8"><title>' + chan(tieuDeTep) + '</title>'
      + '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View>'
      + '<w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->'
      + '<style>' + kho + cssChung() + '</style></head><body>';
  }

  /* Dùng chung cho tệp Word và cửa sổ bản in, để hai đường ra giống hệt nhau */
  function cssChung() {
    return 'body{font-family:"Times New Roman",serif;font-size:13pt;line-height:1.5;color:#000}'
      + 'p{margin:0 0 6pt}'
      + 'table{border-collapse:collapse}'
      /* Bảng danh mục dài mấy trang; không có dòng này thì từ trang 2 trở đi
         thầy cô nhìn một rừng số mà không biết cột nào là cột nào. */
      + 'thead{display:table-header-group}'
      + 'tr{page-break-inside:avoid}'
      + 'td,th{line-height:1.3}';
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

  var O = 'border:1px solid #000;padding:3pt 5pt;font-family:\'Times New Roman\',serif;vertical-align:top;';

  function bangDanhMuc(coFontNho) {
    var cs = coFontNho ? 'font-size:11pt;' : 'font-size:12.5pt;';
    var oTd = O + cs + 'background:#e8e8e8;font-weight:bold;text-align:center;vertical-align:middle;';
    /* Đặt bề rộng bằng colgroup chứ không nhét vào từng ô tiêu đề: khi bảng
       tràn sang trang sau, dòng tiêu đề được Word vẽ lại mà bề rộng vẫn giữ. */
    var h = '<table border="1" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%">'
      + '<colgroup><col style="width:6%"><col style="width:13%"><col style="width:45%">'
      + '<col style="width:21%"><col style="width:15%"></colgroup>'
      + '<thead><tr>'
      + '<th style="' + oTd + '">TT</th>'
      + '<th style="' + oTd + '">MÃ HỒ SƠ</th>'
      + '<th style="' + oTd + '">TÊN HỒ SƠ</th>'
      + '<th style="' + oTd + '">NGƯỜI PHỤ TRÁCH</th>'
      + '<th style="' + oTd + '">TRẠNG THÁI</th></tr></thead><tbody>';

    var laMa = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    var tt = 0;
    layCats().forEach(function (c, i) {
      h += '<tr><td colspan="5" style="' + O + cs
        + 'background:#d9d9d9;font-weight:bold;text-transform:uppercase">'
        + (laMa[i] || (i + 1)) + '. ' + chan(c.name) + '</td></tr>';
      (c.subs || []).forEach(function (s) {
        h += '<tr><td colspan="5" style="' + O + cs
          + 'background:#f2f2f2;font-weight:bold;font-style:italic">' + chan(s.name)
          + ' (' + (s.items || []).length + ' hồ sơ)</td></tr>';
        (s.items || []).forEach(function (it) {
          tt++;
          h += '<tr>'
            + '<td style="' + O + cs + 'text-align:center">' + tt + '</td>'
            + '<td style="' + O + cs + 'text-align:center">' + chan(it[0]) + '</td>'
            + '<td style="' + O + cs + '">' + chan(it[1]) + '</td>'
            + '<td style="' + O + cs + '">' + chan(it[2] === '—' ? '' : it[2]) + '</td>'
            + '<td style="' + O + cs + 'text-align:center">' + nhanTrangThai(it[3]) + '</td></tr>';
        });
      });
    });
    var tk = thongKe();
    h += '<tr><td colspan="2" style="' + O + cs + 'font-weight:bold;text-align:center;'
      + 'background:#e8e8e8">TỔNG CỘNG</td>'
      + '<td colspan="3" style="' + O + cs + 'font-weight:bold;background:#e8e8e8">'
      + tk.tong + ' hồ sơ — Đã có: ' + tk.co + ' · Đang cập nhật: ' + tk.dang
      + ' · Chưa có: ' + tk.chua + '</td></tr>';
    return h + '</tbody></table>';
  }

  /* ---------------- thể thức văn bản (Nghị định 30/2020/NĐ-CP) ----------------
     Ô số 2 (tên cơ quan) bên trái, ô số 1-2 (Quốc hiệu, tiêu ngữ) bên phải,
     ô số 4 (địa danh, ngày tháng) nghiêng ngay dưới tiêu ngữ. Trước đây ngày
     tháng chỉ nằm ở khối chữ ký — đúng thói quen gõ tay nhưng sai thể thức. */
  function theThuc() {
    var TR = "font-family:'Times New Roman',serif;";
    var donViChuQuan = (typeof CAU_HINH !== 'undefined' && CAU_HINH.DON_VI_CHU_QUAN) || 'UBND XÃ YÊN THÀNH';
    return '<table style="width:100%;border-collapse:collapse"><tr>'
      + '<td style="' + TR + 'width:42%;text-align:center;font-size:13pt;vertical-align:top">'
      +   chan(donViChuQuan) + '<br><b>' + chan(tenTruong()).toUpperCase() + '</b>'
      +   '<div style="border-top:1px solid #000;width:58%;margin:2pt auto 0"></div></td>'
      + '<td style="' + TR + 'text-align:center;font-size:13pt;vertical-align:top">'
      +   '<b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br><b>Độc lập - Tự do - Hạnh phúc</b>'
      +   '<div style="border-top:1px solid #000;width:50%;margin:2pt auto 0"></div>'
      +   '<p style="' + TR + 'font-size:13pt;font-style:italic;margin:8pt 0 0">'
      +   chan(ngayThang()) + '</p></td></tr></table>';
  }

  /* Khối chữ ký: chức vụ in hoa đậm — chừa chỗ ký — họ tên đậm.
     Chừa bốn dòng trống vì con dấu tròn cần khoảng 2,5cm chiều cao. */
  function khoiKy(chucDanh) {
    var TR = "font-family:'Times New Roman',serif;";
    var ht = hieuTruong();
    return '<table style="width:100%;border-collapse:collapse;margin-top:16pt"><tr>'
      + '<td style="width:55%"></td>'
      + '<td style="' + TR + 'text-align:center;font-size:13pt">'
      +   '<b>' + chan(chucDanh) + '</b><br><i>(Ký tên, đóng dấu)</i><br><br><br><br>'
      +   (ht ? '<b>' + chan(ht) + '</b>' : '') + '</td></tr></table>';
  }

  function thanVanBan(coFontNho) {
    var TR = "font-family:'Times New Roman',serif;";
    return ''
      + theThuc()
      + '<p style="' + TR + 'text-align:center;font-size:15pt;margin:14pt 0 2pt"><b>DANH MỤC HỒ SƠ SỐ</b></p>'
      + '<p style="' + TR + 'text-align:center;font-size:13pt;margin:0"><b>Năm học ' + chan(namHoc()) + '</b></p>'
      + '<p style="' + TR + 'text-align:center;font-size:11pt;font-style:italic;margin:4pt 0 12pt">'
      +   'Căn cứ Điều 21 Điều lệ trường trung học ban hành kèm theo Thông tư 15/2026/TT-BGDĐT</p>'
      + bangDanhMuc(coFontNho)
      + khoiKy('HIỆU TRƯỞNG');
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

  /* Danh mục hồ sơ có 5 cột, trong đó "Tên hồ sơ" là câu dài và cột "Người phụ
     trách" là họ tên đầy đủ. Khổ dọc chỉ còn 17cm bề ngang, tên hồ sơ bị xuống
     bốn năm dòng, bảng dài gấp đôi. Nên chọn A4 NGANG. */
  function xuatWord() {
    if (chuaCoDuLieu()) return;
    var html = dauTep('Danh mục hồ sơ số', true) + thanVanBan(false) + '</body></html>';
    taiTep(html, 'application/msword', 'danh-muc-ho-so-so-' + namTep() + '.doc');
    if (typeof notify === 'function') notify('Đã tải tệp Word — mở bằng Microsoft Word để chỉnh sửa và trình ký.');
  }

  /* --------------------------- 2. XUẤT EXCEL --------------------------- */

  /* Bản cũ xuất một tệp .xls thực chất là HTML đổi đuôi: Excel mở được nhưng
     luôn hiện cảnh báo "định dạng không khớp phần mở rộng", không đóng băng
     được dòng tiêu đề và không đặt được khổ giấy khi in. Nay dựng bằng ExcelJS
     như js/mau-excel.js: ô nào có dữ liệu là ô đó có khung viền. */
  var V_FONT = 'Times New Roman';
  var NEN_TIEU_DE = 'FF14306B';

  function vien() {
    var m = { style: 'thin', color: { argb: 'FF000000' } };
    return { top: m, left: m, bottom: m, right: m };
  }

  async function xuatExcelThat() {
    if (chuaCoDuLieu()) return false;
    if (typeof ExcelJS === 'undefined') {
      if (typeof notify === 'function') {
        notify('Chưa nạp được thư viện tạo tệp Excel. Thầy cô kiểm tra mạng rồi tải lại trang.');
      }
      return false;
    }

    var wb = new ExcelJS.Workbook();
    var ws = wb.addWorksheet('Danh mục hồ sơ số', {
      pageSetup: {
        paperSize: 9, orientation: 'landscape',
        fitToPage: true, fitToWidth: 1, fitToHeight: 0,
        margins: { left: .35, right: .35, top: .45, bottom: .45, header: .2, footer: .2 }
      }
    });
    ws.columns = [{ width: 6 }, { width: 16 }, { width: 62 }, { width: 26 }, { width: 16 }];

    /* Tiêu đề gộp giữa: đặt kiểu dáng cho TỪNG Ô rồi mới gộp dải — gộp trước
       rồi mới đặt thì ExcelJS bỏ sót các ô phía sau (xem mau-excel.js:144). */
    function dongGop(d, chu, cao, dam, nghieng) {
      for (var c = 1; c <= 5; c++) {
        var o = ws.getCell(d, c);
        o.value = c === 1 ? chu : '';
        o.font = { name: V_FONT, size: cao, bold: !!dam, italic: !!nghieng };
        o.alignment = { horizontal: 'center', vertical: 'middle' };
      }
      ws.mergeCells(d, 1, d, 5);
    }
    dongGop(1, tenTruong().toUpperCase(), 12.5, true, false);
    dongGop(2, 'DANH MỤC HỒ SƠ SỐ', 15, true, false);
    dongGop(3, 'Năm học ' + namHoc(), 12.5, false, true);
    ws.getRow(1).height = 20; ws.getRow(2).height = 24; ws.getRow(3).height = 18;

    var D_TD = 5;                       // dòng tiêu đề bảng, chừa dòng 4 trống
    ['TT', 'MÃ HỒ SƠ', 'TÊN HỒ SƠ', 'NGƯỜI PHỤ TRÁCH', 'TRẠNG THÁI'].forEach(function (t, i) {
      var o = ws.getCell(D_TD, i + 1);
      o.value = t;
      o.font = { name: V_FONT, size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      o.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NEN_TIEU_DE } };
      o.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      o.border = vien();
    });
    ws.getRow(D_TD).height = 28;
    ws.views = [{ state: 'frozen', ySplit: D_TD }];
    ws.pageSetup.printTitlesRow = D_TD + ':' + D_TD;

    var laMa = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    var d = D_TD, tt = 0;

    /* Dòng nhóm: chữ đậm trên nền xám, gộp cả năm cột cho dễ nhìn tầng bậc */
    function dongNhom(chu, nen, nghieng) {
      d++;
      for (var c = 1; c <= 5; c++) {
        var o = ws.getCell(d, c);
        o.value = c === 1 ? chu : '';
        o.font = { name: V_FONT, size: 11, bold: true, italic: !!nghieng };
        o.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: nen } };
        o.alignment = { horizontal: 'left', vertical: 'middle' };
        o.border = vien();
      }
      ws.mergeCells(d, 1, d, 5);
      ws.getRow(d).height = 19;
    }

    layCats().forEach(function (c, i) {
      dongNhom((laMa[i] || (i + 1)) + '. ' + String(c.name).toUpperCase(), 'FFD9D9D9', false);
      (c.subs || []).forEach(function (s) {
        dongNhom(s.name + ' (' + (s.items || []).length + ' hồ sơ)', 'FFF2F2F2', true);
        (s.items || []).forEach(function (it) {
          tt++; d++;
          var gt = [tt, it[0], it[1], it[2] === '—' ? '' : it[2], nhanTrangThai(it[3])];
          gt.forEach(function (v, j) {
            var o = ws.getCell(d, j + 1);
            o.value = v == null ? '' : v;
            o.font = { name: V_FONT, size: 11 };
            o.border = vien();
            o.alignment = {
              horizontal: (j === 0 || j === 1 || j === 4) ? 'center' : 'left',
              vertical: 'middle', wrapText: j === 2 || j === 3
            };
          });
          /* Không ép chiều cao dòng: tên hồ sơ dài đã bật xuống dòng, ép cứng
             một dòng 18 là Excel cắt mất phần còn lại. */
        });
      });
    });

    var tk = thongKe();
    d++;
    for (var c2 = 1; c2 <= 5; c2++) {
      var oc = ws.getCell(d, c2);
      oc.value = c2 === 1 ? 'TỔNG CỘNG'
        : c2 === 3 ? (tk.tong + ' hồ sơ — Đã có: ' + tk.co + ' · Đang cập nhật: '
                      + tk.dang + ' · Chưa có: ' + tk.chua) : '';
      oc.font = { name: V_FONT, size: 11, bold: true };
      oc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8E8' } };
      oc.alignment = { horizontal: c2 === 1 ? 'center' : 'left', vertical: 'middle' };
      oc.border = vien();
    }
    ws.mergeCells(d, 1, d, 2);
    ws.mergeCells(d, 3, d, 5);
    ws.getRow(d).height = 20;

    var buf = await wb.xlsx.writeBuffer();
    var blob = new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'danh-muc-ho-so-so-' + namTep() + '.xlsx';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
    if (typeof notify === 'function') notify('Đã tải tệp Excel danh mục hồ sơ.');
    return true;
  }

  /* ------------------------ 3. BẢN IN PDF CHUẨN ------------------------ */

  function inDanhMuc() {
    if (chuaCoDuLieu()) return;
    var w = window.open('', '_blank');
    if (!w) {
      if (typeof notify === 'function') notify('Trình duyệt chặn cửa sổ mới — thầy cô cho phép cửa sổ bật lên rồi bấm lại.');
      return;
    }
    /* Bản in dùng cùng khổ ngang với tệp Word để hai đường ra giống hệt nhau —
       thầy cô in thử trên màn hình thấy sao thì mở Word ra đúng như vậy. */
    w.document.write('<html><head><meta charset="utf-8"><title>Danh mục hồ sơ số — ' + chan(tenTruong()) + '</title>'
      + '<style>@page{size:29.7cm 21cm;margin:1.5cm 2cm 1.5cm 2cm}'
      + cssChung() + 'body{margin:0}'
      + 'table{page-break-inside:auto}'
      + '@media screen{body{background:#525659;padding:24px}'
      + '.to-giay{background:#fff;max-width:29.7cm;margin:0 auto;padding:1.5cm 2cm;'
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
    var O = TR + 'border:1px solid #000;padding:4pt 6pt;font-size:11.5pt;vertical-align:top;';
    var oTd = O + 'text-align:center;font-weight:bold;background:#e8e8e8;vertical-align:middle;';
    var ds = dsMinhChung();
    var h = '<table style="width:100%;border-collapse:collapse">'
      + '<colgroup><col style="width:5%"><col style="width:14%"><col style="width:38%">'
      + '<col style="width:29%"><col style="width:14%"></colgroup>'
      + '<thead><tr>'
      + '<td style="' + oTd + '">TT</td>'
      + '<td style="' + oTd + '">Mã minh chứng</td>'
      + '<td style="' + oTd + '">Tên minh chứng</td>'
      + '<td style="' + oTd + '">Định dạng, vị trí lưu trữ<br>hoặc đường dẫn điện tử</td>'
      + '<td style="' + oTd + '">Ghi chú</td>'
      + '</tr></thead><tbody>';

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
        + '<td style="' + O + 'font-weight:bold;text-align:center">' + chan(m.ma) + '</td>'
        + '<td style="' + O + '">' + chan(m.ten) + '</td>'
        + '<td style="' + O + 'font-size:10.5pt">' + oViTri + '</td>'
        + '<td style="' + O + 'font-size:10.5pt">' + ghiChu + '</td>'
        + '</tr>';
    });

    var daCo = ds.filter(function (m) { return m.trangThai === 'co'; }).length;
    h += '<tr><td colspan="2" style="' + O + 'font-weight:bold;text-align:center;background:#e8e8e8">'
      + 'TỔNG CỘNG</td>'
      + '<td colspan="3" style="' + O + 'font-weight:bold;background:#e8e8e8">' + ds.length
      + ' minh chứng — đã có tệp: ' + daCo + ' · chưa có: ' + (ds.length - daCo) + '</td></tr>';
    return h + '</tbody></table>';
  }

  function thanMinhChung() {
    var TR = "font-family:'Times New Roman',serif;";
    return ''
      + theThuc()
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
      + khoiKy('HIỆU TRƯỞNG');
  }

  /* Năm cột, trong đó hai cột là câu dài (tên minh chứng và đường dẫn điện tử).
     Khổ dọc thì đường dẫn bị bẻ vụn mỗi dòng vài ký tự, hội đồng thẩm định đọc
     không ra. Chọn A4 NGANG. */
  function xuatMinhChung() {
    if (chuaCoDuLieu()) return;
    var html = dauTep('Danh mục minh chứng', true) + thanMinhChung() + '</body></html>';
    taiTep(html, 'application/msword',
      'danh-muc-minh-chung-' + namTep() + '.doc');
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
