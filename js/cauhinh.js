/* ============================================================================
   CẤU HÌNH KẾT NỐI — TRƯỜNG THCS BẠCH LIÊU

   ⚠️ THẦY CHỈ CẦN SỬA ĐÚNG 2 DÒNG TRONG TỆP NÀY.

   Lấy 2 giá trị đó ở đâu:
     Supabase → dự án của thầy → Settings (bánh răng) → API
       · "Project URL"        →  dán vào DIA_CHI
       · "anon public" key    →  dán vào KHOA_CONG_KHAI

   Hai giá trị này CÔNG KHAI được, không phải mật khẩu. Người khác biết cũng
   không lấy được dữ liệu, vì hàng rào bảo vệ nằm ở phía máy chủ (RLS).

   Khi hai dòng này còn để trống, trang web chạy ở chế độ xem thử như hiện
   nay — không đòi đăng nhập, dùng dữ liệu mẫu trong trang. Điền vào là
   trang tự chuyển sang chế độ thật, bắt buộc đăng nhập.
   ============================================================================ */

const CAU_HINH = {

  DIA_CHI: 'https://lppljfrnojbmrbnyhxrz.supabase.co',

  KHOA_CONG_KHAI: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwcGxqZnJub2pibXJibnloeHJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NTQ2MDMsImV4cCI6MjEwMTEzMDYwM30.ivqlOssSPqKQz9AD4xXqS0mzt_MFsznHh7HRNsjov9U',

  TEN_TRUONG: 'Trường THCS Bạch Liêu',
  NAM_HOC: '2026-2027'
};

/* Trang có đang chạy ở chế độ thật (đã nối cơ sở dữ liệu) hay không */
CAU_HINH.DA_NOI = Boolean(CAU_HINH.DIA_CHI && CAU_HINH.KHOA_CONG_KHAI);
