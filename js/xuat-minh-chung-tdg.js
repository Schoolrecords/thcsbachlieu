/* ============================================================================
   XUẤT WORD — DANH MỤC MINH CHỨNG TRONG MÔ ĐUN TRƯỜNG CHUẨN QUỐC GIA

   Hai nút, hai phạm vi khác nhau:

     1. Nút trên thanh công cụ — danh mục minh chứng của TIÊU CHUẨN đang chọn.
        Đang lọc "Tiêu chuẩn 2" thì in minh chứng của Tiêu chuẩn 2; chọn "Tất cả
        4 tiêu chuẩn" thì in toàn bộ.

     2. Nút trong tab Minh chứng của từng tiêu chí — chỉ minh chứng của đúng
        tiêu chí đang mở. Dùng khi đưa cho người được phân công phụ trách tiêu
        chí ấy phần việc của họ.

   VÌ SAO KHÔNG DÙNG LẠI NÚT Ở MÀN HÌNH HỒ SƠ SỐ
   Nút "Danh mục minh chứng (Phụ lục IV)" bên ấy in TOÀN BỘ danh mục cả trường,
   không lọc được. Người đang làm Tiêu chuẩn 2 phải tải cả 139 đầu minh chứng
   rồi tự dò. Hai nút ở đây lọc sẵn.

   ⚠ CỘT NGƯỜI PHỤ TRÁCH — VÌ SAO CÓ Ở ĐÂY MÀ KHÔNG CÓ Ở BẢN NỘP SỞ
   Mẫu tại mục II khoản 4 Phụ lục IV do Bộ ban hành có ĐÚNG NĂM CỘT:
       TT · Mã minh chứng · Tên minh chứng
          · Định dạng, vị trí lưu trữ hoặc đường dẫn điện tử · Ghi chú
   Không có cột "Người phụ trách". Thêm cột thứ sáu vào bản nộp Sở là sửa mẫu
   của Bộ — không làm.

   Nên tách hẳn hai bản:
     · Bản NỘP SỞ  — nút ở màn hình Hồ sơ số, giữ nguyên 5 cột đúng mẫu.
     · Bản NỘI BỘ  — hai nút trong tệp này, có thêm cột Người phụ trách và cột
                     Trạng thái, dùng để phân công và đôn đốc trong trường.
   Bản nội bộ ghi rõ ngay dưới tiêu đề là "dùng trong nội bộ nhà trường", để
   không ai cầm nhầm đi nộp.
   ============================================================================ */

(function () {
  'use strict';

  const FONT = 'font-family:"Times New Roman",serif';
  const TEN_TT = { co: 'Đã có', dang: 'Đang cập nhật', chua: 'Chưa có' };

  function chan(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function cauHinh(khoa, mac) {
    return (typeof CAU_HINH !== 'undefined' && CAU_HINH[khoa]) || mac;
  }

  function bao(s) { if (typeof notify === 'function') notify(s); }

  function ngayVN() {
    const t = new Date();
    return 'ngày ' + String(t.getDate()).padStart(2, '0')
      + ' tháng ' + String(t.getMonth() + 1).padStart(2, '0')
      + ' năm ' + t.getFullYear();
  }

  function diaDanh() {
    const dc = cauHinh('DIA_CHI_TRUONG', '');
    const m = dc.match(/[Xx]ã\s+([^,]+)/);
    return m ? m[1].trim() : (dc.split(',')[0] || '').trim();
  }

  /* Khổ NGANG cho mọi bản ở đây: cột đường dẫn Drive rất dài, khổ dọc thì Word
     bẻ vụn mỗi dòng vài ký tự, đọc không ra. */
  function khungWord(tieuDe, than) {
    return '<html xmlns:o="urn:schemas-microsoft-com:office:office" '
      + 'xmlns:w="urn:schemas-microsoft-com:office:word" '
      + 'xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8">'
      + '<title>' + chan(tieuDe) + '</title>'
      + '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View>'
      + '<w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->'
      + '<style>@page{size:29.7cm 21cm;margin:1.5cm 1.5cm 1.5cm 2cm}'
      + 'body{' + FONT + ';font-size:13pt;line-height:1.45;color:#000}'
      + 'table{border-collapse:collapse;width:100%}'
      + 'th,td{border:1px solid #000;padding:4pt 6pt;font-size:11.5pt;vertical-align:top}'
      + 'th{background:#e8e8e8;font-weight:bold;text-align:center}'
      + 'thead{display:table-header-group}tr{page-break-inside:avoid}'
      + 'a{color:#000}'
      + '.giua{text-align:center}.phai{text-align:right}.nghieng{font-style:italic}'
      + '</style></head><body>' + than + '</body></html>';
  }

  /* Thể thức Nghị định 30/2020. Đường kẻ dưới phải có RUỘT (&nbsp;) và cỡ chữ
     1pt — thẻ rỗng thì Word bỏ qua, không vẽ viền. Đây là lỗi thầy Chung phát
     hiện trên bản in ngày 09/8/2026. */
  function theThuc() {
    const chuQuan = 'UBND ' + (cauHinh('DIA_CHI_TRUONG', '').split(',')[0] || 'Xã').trim();
    const ke = function (w) {
      return '<div style="width:' + w + '%;margin:3pt auto 0;border-bottom:1px solid #000;'
        + 'font-size:1pt;line-height:1pt">&nbsp;</div>';
    };
    return '<table style="border:none;width:100%;border-collapse:collapse"><tr>'
      + '<td style="border:none;padding:0;width:38%;text-align:center;font-size:12pt">'
      + chan(chuQuan.toUpperCase()) + '<br>'
      + '<b>' + chan(cauHinh('TEN_TRUONG', '').toUpperCase()) + '</b>' + ke(62) + '</td>'
      + '<td style="border:none;padding:0;width:62%;text-align:center;font-size:12pt">'
      + '<b style="white-space:nowrap">CỘNG&nbsp;HÒA&nbsp;XÃ&nbsp;HỘI&nbsp;'
      + 'CHỦ&nbsp;NGHĨA&nbsp;VIỆT&nbsp;NAM</b><br>'
      + '<b>Độc lập - Tự do - Hạnh phúc</b>' + ke(48) + '</td>'
      + '</tr></table>'
      + '<p class="phai nghieng" style="margin:10pt 0 12pt;font-size:12pt">'
      + chan(diaDanh()) + ', ' + ngayVN() + '</p>';
  }

  function taiVe(html, tenTep) {
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

  function duLieu() {
    if (typeof window.duLieuTuDanhGia !== 'function') return null;
    return window.duLieuTuDanhGia();
  }

  /* Gom minh chứng theo danh sách mã tiêu chí. Một minh chứng phục vụ nhiều
     tiêu chí thì CHỈ VÀO BẢNG MỘT LẦN — Phụ lục IV mục I.3 nói rõ minh chứng
     dùng cho nhiều tiêu chí vẫn giữ một mã duy nhất, in lặp là làm người đọc
     tưởng có nhiều tài liệu khác nhau. Cột "Dùng cho tiêu chí" ghi đủ các tiêu
     chí mà nó phục vụ. */
  function gomMinhChung(d, maTieuChi) {
    const gom = {}, thuocTC = {};
    (maTieuChi || []).forEach(function (ma) {
      (d.mcTheoTC[ma] || []).forEach(function (h) {
        if (!gom[h.ma]) { gom[h.ma] = h; thuocTC[h.ma] = []; }
        if (thuocTC[h.ma].indexOf(ma) < 0) thuocTC[h.ma].push(ma);
      });
    });
    return Object.keys(gom)
      .sort(function (a, b) { return a.localeCompare(b, 'vi', { numeric: true }); })
      .map(function (k) {
        return { h: gom[k], tc: thuocTC[k].sort(function (a, b) {
          return a.localeCompare(b, 'vi', { numeric: true }); }) };
      });
  }

  /* Bảng 7 cột — bản NỘI BỘ. Năm cột đầu giữ đúng thứ tự của Phụ lục IV để ai
     quen mẫu ấy đọc không bị lạ, hai cột thêm đặt ở cuối. */
  function bangMinhChung(ds) {
    let h = '<table><colgroup>'
      + '<col style="width:4%"><col style="width:11%"><col style="width:29%">'
      + '<col style="width:11%"><col style="width:19%"><col style="width:14%">'
      + '<col style="width:12%"></colgroup><thead><tr>'
      + '<th>TT</th><th>Mã minh chứng</th><th>Tên minh chứng</th>'
      + '<th>Dùng cho tiêu chí</th>'
      + '<th>Định dạng, vị trí lưu trữ<br>hoặc đường dẫn điện tử</th>'
      + '<th>Người phụ trách</th><th>Trạng thái</th>'
      + '</tr></thead><tbody>';

    ds.forEach(function (x, i) {
      const m = x.h;
      const tt = TEN_TT[m.trang_thai] ? m.trang_thai : 'chua';
      /* Mã là liên kết bấm được tới thư mục Drive — Phụ lục IV mục I.4 khuyến
         khích cách này. Chưa gắn link thì in mã trơn, không bịa đường dẫn. */
      const oMa = m.link_drive
        ? '<a href="' + chan(m.link_drive) + '">' + chan(m.ma) + '</a>'
        : chan(m.ma);
      const oViTri = m.link_drive
        ? chan(m.dinh_dang || 'Thư mục điện tử') + ' — <a href="' + chan(m.link_drive)
          + '">Thư mục trên hệ thống hồ sơ số</a>'
        : '<i>Chưa gắn đường dẫn</i>';
      h += '<tr><td class="giua">' + (i + 1) + '</td>'
        + '<td>' + oMa + '</td>'
        + '<td>' + chan(m.ten) + (m.ghi_chu ? '<br><i>' + chan(m.ghi_chu) + '</i>' : '') + '</td>'
        + '<td class="giua">' + chan(x.tc.join(', ')) + '</td>'
        + '<td>' + oViTri + '</td>'
        + '<td>' + chan(m.nguoi_phu_trach || '') + '</td>'
        + '<td class="giua">' + chan(TEN_TT[tt]) + '</td></tr>';
    });
    return h + '</tbody></table>';
  }

  /* Dòng tổng kết: đếm từ chính bảng vừa in, không gõ sẵn con số nào. */
  function dongTong(ds) {
    const d = { co: 0, dang: 0, chua: 0 };
    ds.forEach(function (x) {
      const k = TEN_TT[x.h.trang_thai] ? x.h.trang_thai : 'chua';
      d[k]++;
    });
    let s = '<p style="margin:10pt 0 0;font-size:12pt">Tổng cộng <b>' + ds.length
      + '</b> minh chứng: đã có <b>' + d.co + '</b>';
    if (d.dang) s += ', đang cập nhật <b>' + d.dang + '</b>';
    if (d.chua) s += ', <b>chưa có ' + d.chua + '</b>';
    s += '.</p>';
    if (d.chua) {
      s += '<p class="nghieng" style="margin:4pt 0 0;font-size:11.5pt">'
        + 'Việc chấm mức phải dựa trên minh chứng có thật — số chưa có ở trên là '
        + 'phần cần bổ sung trước khi hội đồng kết luận.</p>';
    }
    return s;
  }

  const TEN_TIEU_CHUAN = {
    1: 'Quản trị nhà trường và bảo đảm chất lượng',
    2: 'Phát triển đội ngũ',
    3: 'Thực hiện chương trình, đổi mới phương pháp giáo dục và phát triển người học',
    4: 'Điều kiện giáo dục, môi trường an toàn và phối hợp xã hội'
  };

  function dauBan(tieuDe, phuDe, namHoc) {
    return theThuc()
      + '<p class="giua" style="margin:4pt 0 2pt"><b style="font-size:14pt">'
      + chan(tieuDe) + '</b></p>'
      + (phuDe ? '<p class="giua" style="margin:0 0 2pt;font-size:12.5pt">'
          + chan(phuDe) + '</p>' : '')
      + '<p class="giua" style="margin:0 0 3pt;font-size:12.5pt">Năm học '
      + chan(namHoc || '') + '</p>'
      /* Nhãn phân biệt với bản nộp Sở. Bản nộp Sở theo mẫu 5 cột của Phụ lục IV
         nằm ở màn hình Hồ sơ số; bản này thêm hai cột nên không được dùng để
         nộp — phải nói thẳng trên giấy, không để ai cầm nhầm. */
      + '<p class="giua nghieng" style="margin:0 0 12pt;font-size:11.5pt">'
      + '(Bản dùng trong nội bộ nhà trường để theo dõi và phân công. Bản nộp Sở '
      + 'theo đúng mẫu 05 cột tại mục II khoản 4 Phụ lục IV Thông tư 57 '
      + 'được kết xuất ở mục Hồ sơ số.)</p>';
  }

  function tenTep(goc, namHoc) {
    return goc + '-' + String(namHoc || '').replace(/[^0-9-]/g, '') + '.doc';
  }

  /* ==========================================================================
     1. DANH MỤC MINH CHỨNG THEO TIÊU CHUẨN ĐANG CHỌN
     ========================================================================== */
  window.xuatMinhChungTheoTieuChuan = function () {
    const d = duLieu();
    if (!d || !d.tieuChi || !d.tieuChi.length) {
      bao('Chưa đọc được dữ liệu tự đánh giá. Thầy cô mở lại mục này.');
      return;
    }
    const oStd = document.getElementById('kdStd');
    const f = oStd ? oStd.value : '';
    const dsTC = d.tieuChi.filter(function (c) { return !f || String(c.std) === f; });
    const ds = gomMinhChung(d, dsTC.map(function (c) { return c.code; }));

    if (!ds.length) {
      bao(f ? 'Tiêu chuẩn ' + f + ' chưa có minh chứng nào trong danh mục.'
            : 'Danh mục chưa có minh chứng nào.');
      return;
    }

    const phuDe = f
      ? 'Tiêu chuẩn ' + f + '. ' + (TEN_TIEU_CHUAN[f] || '')
      : 'Đầy đủ 4 tiêu chuẩn, 15 tiêu chí';
    const than = dauBan('DANH MỤC MINH CHỨNG', phuDe, d.namHoc)
      + bangMinhChung(ds) + dongTong(ds);

    taiVe(khungWord('Danh mục minh chứng', than),
      tenTep('danh-muc-minh-chung' + (f ? '-tieu-chuan-' + f : ''), d.namHoc));
    bao('Đã tải danh mục ' + ds.length + ' minh chứng'
      + (f ? ' của Tiêu chuẩn ' + f : ' của cả 4 tiêu chuẩn') + '.');
  };

  /* ==========================================================================
     2. DANH MỤC MINH CHỨNG CỦA MỘT TIÊU CHÍ
     ========================================================================== */
  window.xuatMinhChungTieuChi = function (ma) {
    const d = duLieu();
    if (!d || !d.tieuChi) {
      bao('Chưa đọc được dữ liệu tự đánh giá. Thầy cô mở lại mục này.');
      return;
    }
    const c = d.tieuChi.find(function (x) { return x.code === ma; });
    if (!c) { bao('Không tìm thấy tiêu chí ' + ma + '.'); return; }

    const ds = gomMinhChung(d, [ma]);
    if (!ds.length) {
      bao('Tiêu chí ' + ma + ' chưa có minh chứng nào trong danh mục.');
      return;
    }

    const than = dauBan('DANH MỤC MINH CHỨNG THEO TIÊU CHÍ',
      'Tiêu chí ' + ma + '. ' + c.name, d.namHoc)
      + bangMinhChung(ds) + dongTong(ds);

    taiVe(khungWord('Minh chứng tiêu chí ' + ma, than),
      tenTep('minh-chung-tieu-chi-' + String(ma).replace('.', '-'), d.namHoc));
    bao('Đã tải danh mục ' + ds.length + ' minh chứng của tiêu chí ' + ma + '.');
  };
})();
