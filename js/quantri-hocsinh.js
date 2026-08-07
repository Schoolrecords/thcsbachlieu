/* ============================================================================
   QUẢN TRỊ HỆ THỐNG — TAB "DANH SÁCH HỌC SINH"

   Thầy Chung muốn việc nhập danh sách học sinh nằm trong Quản trị hệ thống,
   nơi chỉ ban giám hiệu vào được.

   KHÔNG viết lại màn hình. Toàn bộ phần tải mẫu, đọc tệp, kiểm ngày sinh,
   lọc dòng ví dụ, tính 33 chỉ tiêu đã nằm trong dbcl-hocsinh.js — tệp đó
   đăng ký chính nó vào window.dbclManHinh.hs. Ở đây chỉ mở thêm một cửa vào.

   Một bộ mã, hai lối vào. Sửa một chỗ là cả hai nơi cùng đúng; không bao giờ
   xảy ra cảnh hai màn hình cùng làm một việc mà mỗi nơi một kiểu.

   Ô CHỌN NĂM HỌC — vì sao phải có
   Bản đầu truyền cứng CAU_HINH.NAM_HOC vào màn hình, trong khi lối Đảm bảo
   chất lượng truyền năm thầy cô đang chọn. Hai lối vào cùng một bộ mã nhưng
   KHÁC năm học, mà dòng chữ dưới lại quả quyết "vào lối nào cũng được".
   Hậu quả thật: bấm "Tính lại 33 chỉ tiêu" ở lối này thì hàm trên máy chủ
   tính cho năm hiện hành chứ không phải năm vừa xem, rồi GHI ĐÈ bảng Kết quả
   thực hiện của năm ấy bằng số 0 — năm mới chưa có điểm nào.
   Nay có ô chọn năm ngay tại đây, và cảnh báo khi năm chọn khác năm hiện
   hành, để không ai bấm nhầm lần nữa.

   NÓI CHO ĐÚNG: ô này chi phối SÁU nút — tải mẫu và tải lên (danh sách,
   kết quả) cùng "Tính lại 33 chỉ tiêu". Hai nút còn lại KHÔNG theo nó:
   "Nạp tệp VnEdu" lấy năm ghi trong chính tệp, "Tịnh tiến lên lớp" tự dựng
   ô năm nguồn và năm đích riêng. Dòng cảnh báo phải nêu rõ ranh giới ấy.
   ============================================================================ */

(function () {
  'use strict';

  if (typeof CAU_HINH === 'undefined' || !CAU_HINH.DA_NOI) return;

  /* Năm đang xem. Giữ ở phạm vi tệp để thầy cô chuyển sang tab khác rồi quay
     lại vẫn còn nguyên lựa chọn, không bị kéo về năm hiện hành. */
  let NAM = CAU_HINH.NAM_HOC || '2026-2027';

  function laQuanTri() {
    const u = window.NGUOI_DUNG;
    return !!u && ['admin', 'ban_giam_hieu'].includes(u.vai_tro);
  }

  /* Danh sách năm dựng sẵn chứ không đọc từ cơ sở dữ liệu: màn hình này còn
     để NHẬP danh sách cho năm chưa có em nào — khối 6 mới đầu năm học. Chỉ
     liệt kê năm đã có dữ liệu thì đúng cái năm cần nhập lại không chọn được. */
  function cacNam() {
    const r = [];
    for (let y = 2024; y <= 2030; y++) r.push(y + '-' + (y + 1));
    return r;
  }

  function chan(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  async function ve(hop) {
    if (!laQuanTri()) {
      hop.innerHTML = '<div class="qt-trong">Chỉ quản trị và ban giám hiệu '
        + 'mới nhập được danh sách học sinh.</div>';
      return;
    }

    const man = (window.dbclManHinh || {}).hs;
    if (typeof man !== 'function') {
      hop.innerHTML = '<div class="qt-trong">Chưa nạp được màn hình học sinh. '
        + 'Thầy cô tải lại trang.</div>';
      return;
    }

    hop.innerHTML =
      '<div style="background:#eef4ff;border:1px solid #cfe0ff;color:#1d4ed8;'
      + 'border-radius:10px;padding:12px 15px;font-size:13.6px;line-height:1.65;margin-bottom:14px">'
      + '<b>Hai bước, làm đúng thứ tự:</b><br>'
      + '1. <b>Tải mẫu danh sách</b> → điền → <b>Tải danh sách lên</b>. '
      + 'Khai báo một lần đầu năm, có <b>mã học sinh</b> làm khoá.<br>'
      + '2. Sau mỗi đợt đánh giá: <b>Tải mẫu kết quả</b> → trích xuất từ VnEdu → '
      + '<b>Tải kết quả lên</b>. Ghép bằng mã, tệp kết quả không tạo được em mới.<br>'
      + '<span style="font-size:12.4px;color:#3b5fa8">Màn hình này giống hệt mục '
      + '<b>Đảm bảo chất lượng → Học sinh</b> — cùng một bộ mã, vào lối nào cũng được. '
      + 'Nhớ chọn đúng năm học ở ô bên dưới trước khi làm việc.</span>'
      + '</div>'
      /* Ô chọn năm đặt TRƯỚC màn hình, không đặt lẫn vào trong: mọi nút bên
         dưới đều làm việc trên năm này, thầy cô phải thấy nó trước khi bấm. */
      + '<div style="display:flex;align-items:center;gap:11px;flex-wrap:wrap;'
      + 'background:#f7f9fc;border:1.5px solid #e2e8f2;border-radius:10px;'
      + 'padding:12px 15px;margin-bottom:14px">'
      + '<label for="qtHsNam" style="font-size:14px;font-weight:700;color:var(--navy)">'
      + 'Năm học</label>'
      + '<select id="qtHsNam" style="padding:9px 14px;border:1.5px solid #d7dde8;'
      + 'border-radius:9px;background:#fff;font-size:14px;font-weight:600;'
      + 'font-family:inherit;cursor:pointer">'
      + cacNam().map(n => '<option value="' + chan(n) + '"'
          + (n === NAM ? ' selected' : '') + '>' + chan(n) + '</option>').join('')
      + '</select>'
      + '<span id="qtHsNamCanh"></span>'
      + '</div>'
      + '<div id="qtHsMan"></div>';

    const o = document.getElementById('qtHsNam');
    if (o) o.addEventListener('change', async function () {
      const cu = NAM;
      NAM = this.value;
      veCanhNam();
      const m = document.getElementById('qtHsMan');
      if (!m) return;
      m.innerHTML = '<div class="qt-trong">Đang tải…</div>';
      /* Hỏng thì phải NÓI RA và trả năm về như cũ. Không có nhánh này thì ô
         giữa màn hình đứng vĩnh viễn ở chữ "Đang tải…", thầy cô ngồi chờ một
         thứ không bao giờ tới. */
      try {
        await man(m, NAM);
      } catch (e) {
        console.error('[Danh sách học sinh]', e);
        NAM = cu;
        this.value = cu;
        veCanhNam();
        m.innerHTML = '<div class="qt-trong">Chưa đọc được dữ liệu năm học vừa chọn. '
          + 'Thầy cô chọn lại năm hoặc tải lại trang.</div>';
      }
    });

    veCanhNam();
    await man(document.getElementById('qtHsMan'), NAM);
  }

  /* Đứng ở năm khác năm hiện hành thì nói rõ ngay cạnh ô chọn.
     PHẢI NÓI ĐÚNG NÚT NÀO. Bản đầu viết "mọi nút bên dưới làm việc trên năm
     này" — sai, và sai ở chỗ nguy hiểm nhất. Lần theo mã thì chỉ sáu nút
     theo năm này (tải mẫu / tải lên danh sách và kết quả, tính lại chỉ tiêu
     — dbcl-hocsinh.js:35, 271). Còn "Nạp tệp VnEdu" lấy năm từ ô #vnNam theo
     năm ghi TRONG TỆP (vnedu-nhap.js:522), "Tịnh tiến lên lớp" tự dựng ô năm
     nguồn và năm đích riêng theo năm hiện hành (tinhtien-lop.js:272).
     Một dòng trấn an sai còn tệ hơn không có dòng nào: thầy cô đọc xong tin
     là đã chọn năm rồi, bấm qua ô năm bên trong mà không xem. */
  function veCanhNam() {
    const c = document.getElementById('qtHsNamCanh');
    if (!c) return;
    const rieng = '<span style="font-size:12.6px;color:#7b879b;display:block;margin-top:5px">'
      + 'Riêng <b>Nạp tệp VnEdu</b> và <b>Tịnh tiến lên lớp</b> có ô chọn năm riêng '
      + 'bên trong — thầy cô xem lại năm ở đó trước khi bấm.</span>';
    if (NAM === CAU_HINH.NAM_HOC) {
      c.innerHTML = '<span style="font-size:13px;color:#7b879b">'
        + 'Năm hiện hành của hệ thống.</span>' + rieng;
    } else {
      c.innerHTML = '<span style="font-size:13px;color:#7a5410;background:#fff8e8;'
        + 'border:1px solid #f0d089;border-radius:8px;padding:6px 11px">'
        + '⚠ Khác năm hiện hành (' + chan(CAU_HINH.NAM_HOC) + '). '
        + 'Nút <b>Tải mẫu</b>, <b>Tải lên</b> và <b>Tính lại 33 chỉ tiêu</b> làm việc '
        + 'trên năm <b>' + chan(NAM) + '</b>.</span>' + rieng;
    }
  }

  window.qtTabPhu = window.qtTabPhu || [];
  window.qtTabPhu.push({ ma: 'qths', ten: 'Danh sách học sinh', tt: 40, ve: ve });
})();
