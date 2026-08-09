/* ============================================================================
   QUY MÔ NHÀ TRƯỜNG — đếm từ dữ liệu thật, không gõ tay

   Số lớp, sĩ số, số cán bộ giáo viên nhân viên trước nay gõ cứng trong
   cauhinh.js. Gõ tay thì sớm muộn cũng lệch: trường tuyển sinh, chuyển đến,
   chuyển đi quanh năm, mà không ai nhớ vào sửa một con số nằm trong tệp mã.
   Đã có lần bản Word gửi Sở ghi 616 học sinh trong khi mọi màn hình khác ghi
   636 — lệch 20 em, không phải vì ai làm sai mà vì cùng một con số nằm ở hai
   chỗ.

   Nay chỉ cần nhà trường tải mẫu về, cập nhật danh sách lên trang là các con
   số này tự đúng theo. Đếm ngay sau khi đăng nhập:
     · số lớp   = số lớp khác nhau của năm học hiện hành
     · sĩ số    = số em trạng thái "đang học" của năm học hiện hành
     · số CBGV  = số dòng trong danh sách nhân sự

   CHƯA CÓ DỮ LIỆU THÌ GIỮ NGUYÊN SỐ TRONG CAU_HINH.
   Năm học mới chưa nạp danh sách mà đếm ra 0 rồi ghi đè thành "0 lớp, 0 học
   sinh" là biến một khoảng trống thành một lời khẳng định sai. Đếm được bao
   nhiêu mới thay bấy nhiêu; không đếm được thì im lặng để nguyên.
   ============================================================================ */

(function () {
  'use strict';

  if (typeof CAU_HINH === 'undefined' || !CAU_HINH.DA_NOI) return;

  /* Đếm nhanh, không kéo cả bảng về: PostgREST trả tổng số dòng ở phần đầu
     phản hồi khi dùng count exact, head bỏ luôn phần thân. */
  async function dem(bang, loc, chon) {
    const s = window.sbClient;
    if (!s) return null;
    let q = s.from(bang).select(chon || 'id', { count: 'exact', head: !chon });
    (loc || []).forEach(f => { q = q.eq(f[0], f[1]); });
    const r = await q;
    if (r.error) return null;
    return chon ? (r.data || []) : r.count;
  }

  async function doQuyMo() {
    const nam = CAU_HINH.NAM_HOC;
    const [siSo, dsLop, soCbgv] = await Promise.all([
      dem('hoc_sinh_lop', [['nam_hoc', nam], ['trang_thai', 'dang_hoc']]),
      dem('hoc_sinh_lop', [['nam_hoc', nam], ['trang_thai', 'dang_hoc']], 'lop'),
      dem('nhan_su_ho_so', [])
    ]);

    const soLop = dsLop ? new Set(dsLop.map(r => r.lop).filter(Boolean)).size : null;

    /* Chỉ thay khi đếm được số dương. Xem lí do ở đầu tệp. */
    if (siSo  > 0) CAU_HINH.SO_HOC_SINH = siSo;
    if (soLop > 0) CAU_HINH.SO_LOP      = soLop;
    if (soCbgv > 0) CAU_HINH.SO_CBGV    = soCbgv;

    veLenTrang();
  }

  /* Khối thống kê ở đầu trang chủ */
  function veLenTrang() {
    const oLop = document.getElementById('hsLopTop');
    const oHs  = document.getElementById('hsSiSoTop');
    const oCb  = document.getElementById('hsCbgvTop');
    if (oLop) oLop.textContent = CAU_HINH.SO_LOP || '—';
    if (oHs)  oHs.textContent  = CAU_HINH.SO_HOC_SINH || '—';
    if (oCb && CAU_HINH.SO_CBGV) oCb.textContent = CAU_HINH.SO_CBGV;

    /* Thẻ Hồ sơ CBGV–NV trong lưới danh mục hồ sơ */
    const oCbCat = document.getElementById('hsCbgvCat');
    if (oCbCat && CAU_HINH.SO_CBGV) oCbCat.textContent = CAU_HINH.SO_CBGV;
  }

  document.addEventListener('dangnhap-xong', () => {
    doQuyMo().catch(e => console.error('quy-mo:', e));
  });

  /* Nạp xong danh sách học sinh hoặc nhân sự thì đếm lại ngay, khỏi phải
     tải lại trang mới thấy số mới. */
  window.quyMoDemLai = () => doQuyMo().catch(e => console.error('quy-mo:', e));
})();
