/* ============================================================================
   CẤU HÌNH KẾT NỐI — TRƯỜNG THCS BẠCH LIÊU

   ⚠️ THẦY CHỈ CẦN SỬA ĐÚNG 2 DÒNG TRONG TỆP NÀY.

   Lấy 2 giá trị đó ở đâu:
     Supabase → dự án của thầy → Settings (bánh răng) → API
       · "Project URL"        →  dán vào DIA_CHI
       · "anon public" key    →  dán vào KHOA_CONG_KHAI

   Hai giá trị này CÔNG KHAI được, không phải mật khẩu. Người khác biết cũng
   không lấy được dữ liệu, vì hàng rào bảo vệ nằm ở phía máy chủ (RLS).

   Khi hai dòng này còn để trống, trang web chạy ở chế độ xem thử — không đòi
   đăng nhập, dùng dữ liệu mẫu trong trang. Điền vào là trang tự chuyển sang
   chế độ thật, bắt buộc đăng nhập. Hiện hai dòng đã điền đủ, trang đang chạy
   ở chế độ thật.
   ============================================================================ */

const CAU_HINH = {

  DIA_CHI: 'https://lppljfrnojbmrbnyhxrz.supabase.co',

  KHOA_CONG_KHAI: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwcGxqZnJub2pibXJibnloeHJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NTQ2MDMsImV4cCI6MjEwMTEzMDYwM30.ivqlOssSPqKQz9AD4xXqS0mzt_MFsznHh7HRNsjov9U',

  TEN_TRUONG: 'Trường THCS Bạch Liêu',
  NAM_HOC: '2026-2027',

  /* ------------------------------------------------------------------------
     THÔNG TIN IN RA VĂN BẢN — sửa ở ĐÂY, một chỗ duy nhất.

     Trước đây mấy giá trị này gõ thẳng vào từng tệp kết xuất. Đến khi Hiệu
     trưởng đổi người, hay sĩ số đổi, thì mỗi tệp Word in ra một con số khác
     nhau mà không ai biết nên tin bản nào. Nay chỉ có một nguồn.

     Đơn vị chủ quản ghi theo hành chính 2 cấp: chỉ Tỉnh và Xã, không còn cấp
     huyện, không còn Phòng Giáo dục và Đào tạo.
     ------------------------------------------------------------------------ */
  DON_VI_CHU_QUAN: 'UBND XÃ YÊN THÀNH',
  DIA_DANH: 'Yên Thành',                       // đứng trước ngày tháng trong văn bản
  DIA_CHI_TRUONG: 'Xã Yên Thành, tỉnh Nghệ An',
  CO_QUAN_QUAN_LY: 'Sở Giáo dục và Đào tạo Nghệ An',
  HIEU_TRUONG: 'Nguyễn Phúc Lộc',

  /* Quy mô nhà trường — dùng cho phần Tổng quan của báo cáo tự đánh giá */
  SO_LOP: 16,
  SO_HOC_SINH: 636,
  SO_CBGV: 38
};

/* Trang có đang chạy ở chế độ thật (đã nối cơ sở dữ liệu) hay không */
CAU_HINH.DA_NOI = Boolean(CAU_HINH.DIA_CHI && CAU_HINH.KHOA_CONG_KHAI);
