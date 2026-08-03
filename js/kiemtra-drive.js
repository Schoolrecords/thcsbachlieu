/* ============================================================================
   NÚT "KIỂM TRA NGAY" — RÀ SOÁT TỆP TRÊN DRIVE THẬT

   Bấm nút: gọi dịch vụ Apps Script quét 166 thư mục minh chứng → thư mục nào
   có tệp thì trạng thái hồ sơ trong app tự chuyển "Đã có" (qua hàm
   cap_nhat_tu_drive, có ghi sổ nhật ký). Xong tự tải lại dữ liệu.

   Cần làm trước: chạy sql/11 + triển khai Web app trong kiem-tra-tep-drive.gs
   rồi dán đường dẫn /exec vào DUONG_DAN_KIEM_TRA bên dưới.
   ============================================================================ */

(function () {
  'use strict';

  if (typeof CAU_HINH === 'undefined' || !CAU_HINH.DA_NOI) return;

  /* Dán đường dẫn Web app (kết thúc bằng /exec) vào giữa 2 dấu nháy */
  var DUONG_DAN_KIEM_TRA = '';

  var dangChay = false;

  document.addEventListener('click', async function (e) {
    var nut = e.target.closest('button');
    if (!nut || nut.textContent.indexOf('Kiểm tra ngay') < 0) return;
    if (dangChay) return;

    if (DUONG_DAN_KIEM_TRA.indexOf('https://') !== 0) {
      if (typeof notify === 'function') notify('Chức năng rà soát Drive chưa được cấu hình đường dẫn.');
      return;
    }

    dangChay = true;
    var nhanCu = nut.textContent;
    nut.textContent = '⏳ Đang rà soát…';
    nut.disabled = true;

    try {
      var res = await fetch(DUONG_DAN_KIEM_TRA);
      if (!res.ok) throw new Error('Dịch vụ kiểm tra trả về lỗi ' + res.status);
      var soTep = await res.json();

      var kq = await window.sbClient.rpc('cap_nhat_tu_drive', { du_lieu: soTep });
      if (kq.error) throw kq.error;

      /* Tải lại danh mục để số liệu và trạng thái mới hiện lên */
      document.dispatchEvent(new Event('dangnhap-xong'));

      var coTep = Object.keys(soTep).filter(function (k) { return soTep[k] > 0; }).length;
      if (typeof notify === 'function') {
        notify('Rà soát xong: ' + coTep + ' thư mục đã có tệp, ' + kq.data +
               ' hồ sơ vừa được đổi trạng thái. Mở lại hộp để xem số mới.');
      }
    } catch (err) {
      console.error('[Kiểm tra Drive]', err);
      if (typeof notify === 'function') {
        notify('Không rà soát được: ' + (err.message || err));
      }
    } finally {
      nut.textContent = nhanCu;
      nut.disabled = false;
      dangChay = false;
    }
  }, true);
})();
