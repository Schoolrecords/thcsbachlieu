/* ============================================================================
   QUẢN TRỊ HỆ THỐNG — TAB "DANH SÁCH HỌC SINH"

   Thầy Chung muốn việc nhập danh sách học sinh nằm trong Quản trị hệ thống,
   nơi chỉ ban giám hiệu vào được.

   KHÔNG viết lại màn hình. Toàn bộ phần tải mẫu, đọc tệp, kiểm ngày sinh,
   lọc dòng ví dụ, tính 33 chỉ tiêu đã nằm trong dbcl-hocsinh.js — tệp đó
   đăng ký chính nó vào window.dbclManHinh.hs. Ở đây chỉ mở thêm một cửa vào.

   Một bộ mã, hai lối vào. Sửa một chỗ là cả hai nơi cùng đúng; không bao giờ
   xảy ra cảnh hai màn hình cùng làm một việc mà mỗi nơi một kiểu.
   ============================================================================ */

(function () {
  'use strict';

  if (typeof CAU_HINH === 'undefined' || !CAU_HINH.DA_NOI) return;

  function laQuanTri() {
    const u = window.NGUOI_DUNG;
    return !!u && ['admin', 'ban_giam_hieu'].includes(u.vai_tro);
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
      + '<b>Đảm bảo chất lượng → Học sinh</b> — cùng một bộ mã, vào lối nào cũng được.</span>'
      + '</div>'
      + '<div id="qtHsMan"></div>';

    await man(document.getElementById('qtHsMan'), CAU_HINH.NAM_HOC);
  }

  window.qtTabPhu = window.qtTabPhu || [];
  window.qtTabPhu.push({ ma: 'qths', ten: 'Danh sách học sinh', ve: ve });
})();
