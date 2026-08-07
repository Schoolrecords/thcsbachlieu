/* ============================================================================
   DỮ LIỆU HỌC SINH VÀ KẾT QUẢ TỪNG MÔN — TẦNG GỐC CỦA MODULE ĐBCL

   Quyết định 1426 và 2616 của Sở yêu cầu nhà trường cam kết chuẩn đầu ra
   "cụ thể trên từng học sinh tương ứng với từng môn". Đây là màn hình làm
   việc đó, và cũng là nơi 33 chỉ tiêu của Phụ lục 1, 2, 5, 16 được TÍNH RA
   thay vì gõ tay.

   HAI TỆP, HAI VIỆC KHÁC NHAU — KHÔNG ĐƯỢC LẪN

     1. Danh sách học sinh  — khai báo MỘT LẦN đầu năm.
        Có mã học sinh làm khoá. Đây là bảng gốc.

     2. Kết quả từng kỳ     — tải lên sau mỗi đợt đánh giá.
        Ghép vào danh sách BẰNG MÃ, không bao giờ ghép theo họ tên.

   NGUYÊN TẮC CHỐNG SAI LỆCH
   Tệp kết quả KHÔNG BAO GIỜ tự tạo học sinh mới. Mã nào không có trong danh
   sách thì hệ thống dừng lại và báo, chứ không âm thầm bỏ qua hay thêm vào.
   Trước khi ghi luôn hiện đủ ba con số: khớp bao nhiêu, mã lạ bao nhiêu,
   thiếu bao nhiêu em.

   BẢO VỆ DỮ LIỆU
   Đây là dữ liệu cá nhân của trẻ em. Giáo viên chỉ thấy lớp mình dạy — hàng
   rào đặt ở máy chủ chứ không phải ở giao diện. Trang công khai không bao
   giờ hiện tên hay điểm của em nào.
   ============================================================================ */

(function () {
  'use strict';

  if (typeof CAU_HINH === 'undefined' || !CAU_HINH.DA_NOI) return;

  let sb = null;
  let NAM = CAU_HINH.NAM_HOC || '2026-2027';
  let LOP = '';
  let MON = [];
  let DS = [];          // danh sách học sinh của năm học đang chọn
  let CHE_DO = 'ds';    // 'ds' = danh sách · 'kq' = kết quả
  /* Dải cảnh báo còn lại sau lần nạp tệp gần nhất — hiện một lần rồi xoá.
     Dùng thay cho thông báo nổi khi nội dung dài hoặc quan trọng. */
  let CANH_SAU_NAP = '';

  const TEN_TT = {
    dang_hoc: 'Đang học', chuyen_di: 'Chuyển đi',
    bao_luu: 'Bảo lưu', thoi_hoc: 'Thôi học'
  };

  const css = `
  .hs-bar{display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin-bottom:13px}
  .hs-bar select,.hs-bar input{padding:8px 11px;border:1.5px solid #d7dde8;border-radius:9px;
    font-size:13.4px;font-family:inherit;background:#fff}
  .hs-buoc{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px;margin-bottom:16px}
  .hs-o{background:#fff;border:1px solid #e2e8f2;border-radius:12px;padding:15px 17px}
  .hs-o.dam{border-color:#cfe0ff;background:#f7faff}
  .hs-o h4{font-size:14.6px;color:var(--navy);margin-bottom:5px;font-weight:700}
  .hs-o p{font-size:12.8px;color:var(--muted);line-height:1.6;margin-bottom:10px}
  .hs-o .btn{padding:8px 13px;font-size:13px;margin-right:6px;margin-bottom:5px}
  .hs-bang{width:100%;border-collapse:collapse;font-size:13.4px}
  .hs-bang th{background:#eef3fb;color:var(--navy);font-weight:700;padding:9px 8px;
    border:1px solid #dbe3ef;font-size:12.6px;text-align:left;white-space:nowrap}
  .hs-bang td{border:1px solid #e4e9f2;padding:6px 9px}
  .hs-bang tr:hover td{background:#fafcff}
  .hs-co{display:inline-block;font-size:11.2px;font-weight:700;padding:2px 7px;border-radius:5px}
  .hs-co.hn{background:#f3e8ff;color:#6b21a8}
  .hs-co.mg{background:#fff4e5;color:#96660f}
  .hs-co.cd{background:#fdecea;color:#a3221a}
  .hs-canh{background:#fdf3f2;border:1px solid #f3c9c5;color:#8a3428;border-radius:10px;
    padding:12px 15px;font-size:13.2px;margin:12px 0;line-height:1.65}
  .hs-ok{background:#f2fdf6;border-color:#bfe8cd;color:#1a6437}
  .hs-tin{background:#eef4ff;border-color:#cfe0ff;color:#1d4ed8}
  .hs-tk{display:flex;gap:20px;flex-wrap:wrap;font-size:13.2px;color:var(--muted);margin:10px 0}
  .hs-tk b{color:var(--navy);font-size:16px;font-family:var(--serif)}
  `;
  document.head.insertAdjacentHTML('beforeend', '<style>' + css + '</style>');

  function chan(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function laQuanTri() {
    const u = window.NGUOI_DUNG;
    return !!u && ['admin', 'ban_giam_hieu'].includes(u.vai_tro);
  }
  function coThuVien() {
    if (typeof XLSX !== 'undefined') return true;
    notify('Chưa nạp được thư viện Excel. Thầy cô kiểm tra mạng rồi tải lại trang.');
    return false;
  }
  function khoiTuLop(lop) {
    const m = String(lop || '').match(/^\s*(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  }

  /* ĐƯA MỌI KIỂU GHI NGÀY VỀ DẠNG yyyy-mm-dd.

     Cột ngay_sinh trong cơ sở dữ liệu là kiểu date. Thầy cô gõ 20/05/2014,
     Excel tự biến ô thành ngày, thư viện đọc ra "20/5/14" — máy chủ từ chối
     CẢ MẺ với câu tiếng Anh "invalid input syntax for type date", mất trắng
     toàn bộ danh sách vì đúng một ô. Nhận cả bốn lối ghi thường gặp:
       20/05/2014 · 20-5-2014 · 2014-05-20 · số sê-ri của Excel (41779)
     Không hiểu thì trả null để bên gọi kể vào danh sách lỗi, đừng gửi đi. */
  function chuanNgay(v) {
    /* Ô đã là đối tượng ngày (khi thư viện đọc bằng cellDates) */
    if (v instanceof Date && !isNaN(v)) {
      return dungNgay(v.getFullYear(), v.getMonth() + 1, v.getDate());
    }

    let s = String(v == null ? '' : v).trim();
    if (!s) return { ok: true, gt: null };

    /* Gọt những thứ Excel hay chèn thêm mà vẫn là ngày hợp lệ:
       "Ngày 20/05/2014" · "20 / 05 / 2014" · "20/05/2014 00:00:00" */
    s = s.replace(/^ngày\s*/i, '')
         .replace(/[\sT]\d{1,2}:\d{2}(:\d{2})?(\s*[AP]M)?\s*$/i, '')
         .replace(/\s*([\/\-.])\s*/g, '$1')
         .trim();
    if (!s) return { ok: true, gt: null };

    let m = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/);
    if (m) return dungNgay(+m[1], +m[2], +m[3]);

    m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (m) {
      let nam = +m[3];
      /* Hai chữ số thì Excel hiểu 00-29 là 2000-2029, còn lại là 19xx */
      if (nam < 100) nam += (nam <= 29 ? 2000 : 1900);
      return dungNgay(nam, +m[2], +m[1]);
    }

    /* Số sê-ri Excel: đếm ngày từ 30/12/1899.
       CỬA SỐ PHẢI HẸP. Bản trước nhận mọi số từ 1 đến 80000, nên thầy cô gõ
       nhầm mỗi năm sinh "2014" vào ô Ngày sinh là ra ngày 06/7/1905 — hợp lệ
       về cú pháp nên ghi thẳng vào cơ sở dữ liệu, không một lời cảnh báo.
       Nay chỉ nhận khoảng có nghĩa với hồ sơ học sinh: 1941 đến 2064.
       Dùng floor chứ không round: ô định dạng ngày-giờ có phần lẻ, làm tròn
       lên là lệch mất một ngày. */
    if (/^\d+(\.\d+)?$/.test(s)) {
      const n = parseFloat(s);
      if (n >= 15000 && n <= 60000) {
        const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(n) * 86400000);
        return dungNgay(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
      }
    }
    return { ok: false, gt: null };
  }

  /* Đổi ngược yyyy-mm-dd của cơ sở dữ liệu về ngày/tháng/năm cho thầy cô đọc.
     Hàm này CÓ ở vài tệp khác nhưng nằm trong IIFE riêng, không dùng chung
     được — thiếu bản ở đây thì nút "Tải mẫu danh sách" ném ReferenceError
     ngay khi trường ĐÃ CÓ học sinh: không tải gì, không báo gì, chỉ có một
     dòng đỏ trong console. Máy trắng thì chạy, ra trường thì im lặng hỏng. */
  function ngayVN(s) {
    const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
  }

  /* Đổi mấy câu lỗi hay gặp của máy chủ sang tiếng Việt kèm CÁCH CHỮA.
     Câu gốc là tiếng Anh và nói theo lối kỹ thuật — thầy cô đọc "Could not
     find the 'so_dinh_danh' column in the schema cache" thì không thể suy ra
     là quản trị còn thiếu một bước chạy tệp SQL. */
  function loiTiengViet(e, viec) {
    const s = String(e && e.message || e || '');
    if (/so_dinh_danh/.test(s) && /schema cache|column/i.test(s)) {
      return 'Cơ sở dữ liệu chưa có cột "Số định danh cá nhân". '
        + 'Quản trị chạy tệp sql/25 rồi thầy cô thử lại — cột này mới thêm.';
    }
    if (/hoc_sinh_dinh_danh_hop_le/.test(s)) {
      return 'Có ô Số định danh không đúng 12 chữ số nên máy chủ từ chối cả mẻ. '
        + 'Thường do Excel nuốt mất số 0 đứng đầu — chọn cột đó, đặt định dạng '
        + 'ô thành Văn bản rồi gõ lại.';
    }
    if (/row-level security|permission denied/i.test(s)) {
      return 'Tài khoản của thầy cô chưa đủ quyền ghi ' + viec + '. Báo quản trị giúp em.';
    }
    if (/JWT|token|expired/i.test(s)) {
      return 'Phiên đăng nhập đã hết hạn. Thầy cô đăng nhập lại rồi làm lại.';
    }
    return 'Chưa nạp được ' + viec + ': ' + s;
  }
  window.hsLoiTiengViet = loiTiengViet;

  /* Mở ra ngoài để phần nạp thẳng tệp VnEdu dùng lại đúng bộ quy tắc này,
     khỏi viết hai bản rồi lệch nhau. */
  window.hsChuanNgay = chuanNgay;

  function dungNgay(nam, thang, ngay) {
    if (!(nam >= 1900 && nam <= 2100) || !(thang >= 1 && thang <= 12)
        || !(ngay >= 1 && ngay <= 31)) return { ok: false, gt: null };
    /* PHẢI kiểm số ngày theo từng tháng. Chỉ chặn 1..31 thì 31/02/2014 và
       29/02 năm không nhuận đều lọt qua, rồi máy chủ từ chối CẢ MẺ với câu
       "date/time field value out of range" — đúng thảm hoạ hàm này sinh ra
       để chặn. Dựng thử ngày rồi so lại là cách rẻ nhất. */
    const d = new Date(Date.UTC(nam, thang - 1, ngay));
    if (d.getUTCFullYear() !== nam || d.getUTCMonth() + 1 !== thang
        || d.getUTCDate() !== ngay) return { ok: false, gt: null };
    const hai = n => (n < 10 ? '0' : '') + n;
    return { ok: true, gt: nam + '-' + hai(thang) + '-' + hai(ngay) };
  }

  /* ========================================================================
     TẢI DỮ LIỆU
     ======================================================================== */
  /* Máy chủ chỉ trả tối đa 1000 dòng mỗi lần hỏi, mà trường có hơn 600 học
     sinh nên phải đọc theo trang cho tới hết. Thiếu chỗ này thì mẫu kết quả
     sinh ra sẽ sót học sinh mà không báo gì.

     BẮT BUỘC PHẢI CÓ .order('id') — đây là lỗi đã có thật:
     PostgreSQL không hứa hẹn thứ tự dòng khi câu hỏi không ghi rõ sắp xếp.
     Hỏi trang 1 rồi hỏi trang 2, máy chủ có quyền trả về hai thứ tự khác
     nhau, thế là có em bị đọc hai lần còn em khác không bao giờ được đọc.
     Sắp theo khoá chính id là cách rẻ nhất để thứ tự luôn cố định. */
  async function taiHet(bang, chon, loc) {
    const BUOC = 1000;
    let tuDau = 0, gom = [];
    for (;;) {
      let q = sb.from(bang).select(chon);
      loc.forEach(f => { q = q.eq(f[0], f[1]); });
      const r = await q.order('id', { ascending: true }).range(tuDau, tuDau + BUOC - 1);
      if (r.error) throw r.error;
      const d = r.data || [];
      gom = gom.concat(d);
      if (d.length < BUOC) break;
      tuDau += BUOC;
      if (tuDau > 60000) break;
    }
    return gom;
  }

  async function tai() {
    const [mh, hsD] = await Promise.all([
      sb.from('mon_hoc').select('*').order('so_tt'),
      taiHet('hoc_sinh_lop', '*, hoc_sinh(*)', [['nam_hoc', NAM]])
    ]);
    /* Thư viện Supabase KHÔNG ném lỗi — nó trả về { data: null, error }. Viết
       `mh.data || []` là nuốt trọn lỗi: danh mục môn hiện ra rỗng, màn hình
       báo "chưa chạy sql/17" trong khi thật ra chỉ là hết phiên đăng nhập. */
    if (mh.error) throw mh.error;
    MON = mh.data || [];
    DS = (hsD || []).filter(r => r.hoc_sinh);
    DS.sort((a, b) => (a.lop || '').localeCompare(b.lop || '', 'vi')
      || (a.hoc_sinh.ho_ten || '').localeCompare(b.hoc_sinh.ho_ten || '', 'vi'));
  }

  /* ========================================================================
     MÀN HÌNH
     ======================================================================== */
  /* Hộp chứa màn hình này. Màn hình được gắn ở HAI nơi — mục Đảm bảo chất
     lượng và tab Danh sách học sinh trong Quản trị hệ thống — nên tuyệt đối
     không được gõ cứng id nào. Gõ cứng 'dbclKhac' thì nạp tệp từ bảng quản
     trị xong sẽ vẽ lại vào ô của module kia đang bị ẩn: bảng không đổi, dải
     cảnh báo không ai thấy, và tệ nhất là hai bản ô "Kỳ" cùng id nên nút
     "Tính lại 33 chỉ tiêu" đọc nhầm ô ẩn rồi ghi đè số liệu SAI KỲ. */
  let HOP_HS = null;

  async function ve(hop, namHoc) {
    if (hop) HOP_HS = hop; else hop = HOP_HS;
    if (!hop) return;
    if (namHoc) NAM = namHoc;
    if (!sb) sb = window.sbClient;
    if (!sb) { hop.innerHTML = '<div class="hs-canh">Thầy cô đăng nhập để xem phần này.</div>'; return; }

    /* Lấy dải cảnh báo RA NGAY, trước mọi đường thoát sớm. Nếu để tới cuối
       hàm mới đọc thì lần vẽ nào hỏng giữa chừng là dải cảnh báo của tệp vừa
       nạp nằm chờ, rồi bật ra ở lần mở màn hình sau — lúc đó thầy cô không
       còn biết nó nói về tệp nào. */
    const canh = CANH_SAU_NAP;
    CANH_SAU_NAP = '';

    hop.innerHTML = canh
      + '<p style="color:#8a94a6;font-size:13.4px">Đang tải dữ liệu học sinh…</p>';
    /* Câu lỗi tiếng Anh của máy chủ làm thầy cô tưởng hệ thống hỏng. Nói bằng
       tiếng Việt, chi tiết kỹ thuật đẩy vào console cho quản trị xem. */
    try { await tai(); }
    catch (e) {
      console.error('[Học sinh] Không tải được:', e);
      hop.innerHTML = canh + '<div class="hs-canh"><b>Chưa đọc được dữ liệu học sinh.</b><br>'
        + 'Thầy cô thử đăng nhập lại. Nếu vẫn vậy thì tài khoản chưa được phân quyền '
        + 'xem phần này — báo quản trị giúp em.<br>'
        + '<span style="font-size:12.4px;color:#a0564a">Chi tiết: ' + chan(e.message) + '</span></div>';
      return;
    }

    if (!MON.length) {
      hop.innerHTML = canh + '<div class="hs-canh">Cơ sở dữ liệu chưa có danh mục môn học. '
        + 'Kiểm tra đã chạy tệp <code>sql/17</code> chưa.</div>';
      return;
    }

    const lops = Array.from(new Set(DS.map(r => r.lop))).sort((a, b) => a.localeCompare(b, 'vi'));
    const loc = LOP ? DS.filter(r => r.lop === LOP) : DS;
    const qt = laQuanTri();

    let html = canh;

    /* ---- Hai khối việc ---- */
    html += '<div class="hs-buoc">'
      + '<div class="hs-o dam"><h4>1. Danh sách học sinh — làm trước</h4>'
      + '<p>Khai báo một lần đầu năm. Có <b>mã học sinh</b> làm khoá ghép. '
      + 'Chưa có danh sách thì không nhận được tệp kết quả nào.</p>'
      + (qt ? '<button class="btn btn-out" id="hsMauDS">⬇ Tải mẫu danh sách</button>'
            + '<button class="btn btn-pri" id="hsLenDS">⬆ Tải danh sách lên</button>' : '')
      + '</div>'
      + '<div class="hs-o"><h4>2. Kết quả học tập từng kỳ</h4>'
      + '<p>Trích xuất từ VnEdu sau mỗi đợt đánh giá. Ghép vào danh sách <b>bằng mã</b>, '
      + 'không ghép theo họ tên. Tệp kết quả không tạo được học sinh mới.</p>'
      + (qt ? '<button class="btn btn-out" id="hsMauKQ">⬇ Tải mẫu kết quả</button>'
            + '<button class="btn btn-pri" id="hsLenKQ">⬆ Tải kết quả lên</button>' : '')
      + '</div>'
      + '<div class="hs-o dam"><h4>⚡ Cách nhanh nhất — nạp thẳng sổ điểm VnEdu</h4>'
      + '<p>Thả nguyên các tệp <b>so_diem_tong_ket_khoi_*.xls</b> tải từ VnEdu về. '
      + 'Một lần vào cả <b>danh sách học sinh</b> lẫn <b>điểm 12 môn</b> — '
      + 'không phải chép sang mẫu, không có chỗ cho lỗi chép nhầm.</p>'
      + (qt ? '<button class="btn btn-pri" id="hsVnEdu">📥 Nạp tệp VnEdu</button>' : '')
      + '</div></div>';

    if (!DS.length) {
      html += '<div class="hs-canh hs-tin"><b>Năm học ' + chan(NAM) + ' chưa có học sinh nào.</b><br>'
        + 'Bắt đầu bằng bước 1: tải mẫu danh sách, điền rồi tải lên. '
        + 'Sau đó mới tải được tệp kết quả.</div>';
      hop.innerHTML = html;
      ganNut(hop);
      return;
    }

    /* ---- Thống kê nhanh ---- */
    const dangHoc = DS.filter(r => r.trang_thai === 'dang_hoc').length;
    const hoaNhap = DS.filter(r => r.hoc_sinh.hoa_nhap).length;
    html += '<div class="hs-tk">'
      + '<span><b>' + DS.length + '</b> học sinh</span>'
      + '<span><b>' + lops.length + '</b> lớp</span>'
      + '<span><b>' + dangHoc + '</b> đang học</span>'
      + '<span><b>' + hoaNhap + '</b> diện hoà nhập</span>'
      + '</div>';

    /* Nút tính lại chỉ tiêu mở cho cả TỔ TRƯỞNG — đúng bằng hàm
       dbcl_tinh_tu_hoc_sinh trên máy chủ, vốn nhận admin, ban giám hiệu và
       tổ trưởng. Bản cũ chỉ cho quản trị, hẹp hơn máy chủ, nên tổ trưởng
       nhập xong dữ liệu lại phải đi nhờ người khác bấm hộ. */
    const tinhDuoc = qt || (window.NGUOI_DUNG && window.NGUOI_DUNG.vai_tro === 'to_truong');
    if (tinhDuoc) {
      html += '<div class="db-cong">'
        + '<button class="btn btn-pri" id="hsTinh">🔄 Tính lại 33 chỉ tiêu từ dữ liệu học sinh</button>'
        + '<select id="hsTinhKy" style="padding:8px 11px;border:1.5px solid #d7dde8;border-radius:9px">'
        + '<option value="ca_nam">Kết quả cả năm</option>'
        + '<option value="hoc_ki_1">Kết quả học kỳ I</option></select>'
        + '</div>';
    }

    /* ---- Bộ lọc lớp ---- */
    html += '<div class="hs-bar"><label style="font-size:13.2px;font-weight:600;color:var(--muted)">Lớp</label>'
      + '<select id="hsLop"><option value="">Tất cả (' + DS.length + ')</option>'
      + lops.map(l => '<option value="' + chan(l) + '"' + (l === LOP ? ' selected' : '') + '>'
          + chan(l) + ' (' + DS.filter(r => r.lop === l).length + ')</option>').join('')
      + '</select></div>';

    /* ---- Bảng học sinh ---- */
    html += '<div class="tbl-wrap"><table class="hs-bang"><tr>'
      + '<th style="width:5%">TT</th><th style="width:13%">Mã học sinh</th>'
      + '<th style="width:26%">Họ và tên</th><th style="width:11%">Ngày sinh</th>'
      + '<th style="width:8%">Lớp</th><th style="width:12%">Trạng thái</th>'
      + '<th>Ghi chú</th></tr>';
    loc.forEach((r, i) => {
      const h = r.hoc_sinh;
      const co = [];
      if (h.hoa_nhap) co.push('<span class="hs-co hn">Hoà nhập</span>');
      if (h.mien_giam_mon) co.push('<span class="hs-co mg">Miễn ' + chan(h.mien_giam_mon) + '</span>');
      if (r.trang_thai !== 'dang_hoc') co.push('<span class="hs-co cd">' + chan(TEN_TT[r.trang_thai]) + '</span>');
      html += '<tr><td>' + (i + 1) + '</td><td><b>' + chan(h.ma) + '</b></td>'
        + '<td>' + chan(h.ho_ten) + '</td>'
        + '<td>' + (h.ngay_sinh ? chan(String(h.ngay_sinh).slice(0, 10).split('-').reverse().join('/')) : '') + '</td>'
        + '<td>' + chan(r.lop) + '</td>'
        + '<td>' + chan(TEN_TT[r.trang_thai] || r.trang_thai) + '</td>'
        + '<td>' + (co.join(' ') || '') + '</td></tr>';
    });
    html += '</table></div>';

    hop.innerHTML = html;
    /* querySelector TRONG hộp, không getElementById toàn tài liệu: khi màn
       hình mở ở cả hai nơi thì mọi id đều có hai bản, tra toàn tài liệu là
       luôn lấy bản đứng trước trong DOM — tức bản đang bị ẩn. */
    const sl = hop.querySelector('#hsLop');
    if (sl) sl.addEventListener('change', function () { LOP = this.value; ve(hop); });
    ganNut(hop);
  }

  function ganNut(hop) {
    const g = (id, fn) => { const e = hop.querySelector('#' + id); if (e) e.addEventListener('click', fn); };
    g('hsMauDS', mauDanhSach);
    g('hsMauKQ', mauKetQua);
    g('hsLenDS', () => chonTep('ds'));
    g('hsLenKQ', () => chonTep('kq'));
    g('hsTinh', tinhChiTieu);
    g('hsVnEdu', () => {
      if (typeof window.vneduChonTep === 'function') window.vneduChonTep(hop);
      else notify('Chưa nạp được phần đọc tệp VnEdu, thầy cô tải lại trang.');
    });
  }

  /* Cho phần nạp VnEdu vẽ lại màn hình sau khi ghi xong */
  window.hsVeLai = function () { ve(); };

  /* ========================================================================
     MẪU EXCEL — theo ĐÚNG thứ tự cột sổ điểm VnEdu của nhà trường

     Trường đang dùng tệp "so_diem_tong_ket_khoi_*.xls" xuất từ VnEdu, cột xếp
     theo thứ tự:  STT · Mã học sinh · Số định danh cá nhân · Họ và tên ·
     Ngày sinh · rồi tới các môn. Mẫu của hệ thống bám đúng thứ tự đó để thầy
     cô chép cả cột sang là xong, không phải sắp lại từng cột.

     Phần TẠO mẫu đi qua mau-excel.js (ExcelJS) để có khổ A4 ngang, khung viền
     và màu nền — thư viện xlsx bản miễn phí không viết được những thứ đó.
     Phần ĐỌC tệp tải lên vẫn dùng xlsx như cũ.
     ======================================================================== */
  function mauDanhSach() {
    const dong = DS.length
      ? DS.map((r, i) => {
          const h = r.hoc_sinh;
          return [i + 1, h.ma, h.so_dinh_danh || '', h.ho_ten, ngayVN(h.ngay_sinh),
                  h.gioi_tinh || '', r.lop, h.hoa_nhap ? 'x' : '',
                  h.mien_giam_mon || '', ngayVN(r.ngay_vao), TEN_TT[r.trang_thai] || ''];
        })
      : [
          [1, 'VIDU-01', '', 'Nguyễn Văn A (ví dụ — xoá dòng này)', '20/05/2014', 'Nam', '6A', '', '', '', ''],
          [2, 'VIDU-02', '', 'Trần Thị B (ví dụ — xoá dòng này)', '03/11/2014', 'Nữ', '6A', 'x', 'Giáo dục thể chất', '', '']
        ];

    window.taoMauExcel({
      ten: 'Danh sach hoc sinh',
      ngang: true,
      tieuDe: [
        (CAU_HINH.TEN_TRUONG || '').toUpperCase(),
        'DANH SÁCH HỌC SINH',
        'Năm học ' + NAM
      ],
      cot: [
        { ten: 'STT',                  rong: 5,  giua: true },
        { ten: 'Mã học sinh',          rong: 14, giua: true },
        { ten: 'Số định danh cá nhân', rong: 19, giua: true, chu: true },
        /* chu: true → ô định dạng Văn bản, giữ được số 0 đứng đầu (040…) */
        { ten: 'Họ và tên',            rong: 26 },
        { ten: 'Ngày sinh',            rong: 12, giua: true },
        { ten: 'Giới tính',            rong: 10, giua: true, chon: ['Nam', 'Nữ'] },
        { ten: 'Lớp',                  rong: 8,  giua: true },
        { ten: 'Hoà nhập',             rong: 10, giua: true, chon: ['x'] },
        { ten: 'Miễn/giảm môn',        rong: 22 },
        { ten: 'Ngày vào học',         rong: 13, giua: true },
        { ten: 'Trạng thái',           rong: 14, giua: true,
          chon: ['Đang học', 'Chuyển đi', 'Bảo lưu', 'Thôi học'] }
      ],
      dong: dong,
      soDongTrong: DS.length ? 10 : 40,
      huongDan: [
        'Thứ tự cột giống hệt sổ điểm tổng kết xuất từ VnEdu, nên chép cả cột sang là xong.',
        '',
        '· Mã học sinh lấy ĐÚNG mã đang dùng trên VnEdu, giữ nguyên suốt cấp học. Đây là khoá ghép — tệp kết quả về sau ghép theo cột này, không ghép theo họ tên.',
        '· Số định danh cá nhân có thì điền, không có cũng được. Hệ thống không bắt buộc và không đưa số này ra màn hình công khai.',
        '· Ngày sinh và Ngày vào học ghi ngày/tháng/năm, ví dụ 20/05/2014. Để Excel tự định dạng ngày cũng đọc được.',
        '· Giới tính, Hoà nhập, Trạng thái đều có danh sách xổ xuống — bấm vào ô rồi chọn, khỏi gõ sai.',
        '· Cột Hoà nhập ghi x nếu em học hoà nhập. Thông tư 22 đánh giá diện này theo quy định riêng, và các em không tính vào mẫu số của tỉ lệ.',
        '· Cột Miễn/giảm môn ghi tên môn được miễn, ví dụ: Giáo dục thể chất.',
        '· Trạng thái để trống nghĩa là Đang học.',
        '',
        'HAI DÒNG VÍ DỤ',
        'Hai dòng mã VIDU-01 và VIDU-02 chỉ để xem mẫu. Xoá đi cũng được, để nguyên cũng được — hệ thống tự bỏ qua mọi dòng có mã bắt đầu bằng VIDU.',
        '',
        'CỘT NÀO TỆP KHÔNG CÓ THÌ HỆ THỐNG GIỮ NGUYÊN GIÁ TRỊ CŨ',
        'Ô để trống cũng vậy. Nạp lại một danh sách rút gọn không làm mất diện hoà nhập hay trạng thái của em nào.'
      ],
      tenTep: 'mau-danh-sach-hoc-sinh-' + NAM + '.xlsx'
    });
  }

  /* Tên môn viết tắt theo đúng sổ điểm VnEdu, và thứ tự cột cũng theo VnEdu —
     để mẫu kết quả trông y như tệp thầy cô đang có, chép sang không phải đổi
     tiêu đề cột hay sắp lại. */
  const TEN_VNEDU = {
    TOAN: 'Toán', LSDL: 'LS&ĐL', KHTN: 'KHTN', TIN: 'Tin', NV: 'Văn',
    NN1: 'Ng.ngữ', GDCD: 'GDCD', CN: 'C.nghệ', GDTC: 'GDTC', NT: 'Nghệ thuật',
    GDDP: 'NDGDCĐP', TNHN: 'HĐTN&HN'
  };
  const TT_VNEDU = ['TOAN', 'LSDL', 'KHTN', 'TIN', 'NV', 'NN1', 'GDCD', 'CN',
                    'GDTC', 'NT', 'GDDP', 'TNHN'];

  function monTheoVnEdu() {
    const co = {};
    MON.forEach(m => { co[m.ma] = m; });
    const ra = [];
    TT_VNEDU.forEach(ma => { if (co[ma]) { ra.push(co[ma]); delete co[ma]; } });
    /* Môn nào danh mục có mà VnEdu không liệt kê thì xếp cuối, không bỏ sót */
    MON.forEach(m => { if (co[m.ma]) ra.push(m); });
    return ra;
  }

  function mauKetQua() {
    if (!DS.length) { notify('Chưa có danh sách học sinh, chưa tạo được mẫu kết quả.'); return; }
    const mons = monTheoVnEdu();
    const dangHoc = DS.filter(r => r.trang_thai === 'dang_hoc');

    window.taoMauExcel({
      ten: 'Ket qua hoc tap',
      ngang: true,
      tieuDe: [
        (CAU_HINH.TEN_TRUONG || '').toUpperCase(),
        'BẢNG TỔNG HỢP KẾT QUẢ HỌC TẬP VÀ RÈN LUYỆN'
      ],
      /* Ô "Kỳ" phải đứng RIÊNG một ô để phần đọc tệp dò được giá trị ngay bên
         phải nó. Gộp vào dòng tiêu đề là không dò được nữa. */
      thongSo: ['Năm học', NAM, 'Kỳ', 'Cả năm'],
      cot: [
        { ten: 'STT',         rong: 5,  giua: true },
        { ten: 'Mã học sinh', rong: 14, giua: true },
        { ten: 'Họ và tên',   rong: 24 },
        { ten: 'Lớp',         rong: 7,  giua: true }
      ].concat(mons.map(m => ({
        ten: (TEN_VNEDU[m.ma] || m.ten) + (m.kieu === 'dat' ? ' (Đ/CĐ)' : ''),
        rong: 11, giua: true
      }))).concat([
        { ten: 'Rèn luyện', rong: 12, giua: true, chon: ['Tốt', 'Khá', 'Đạt', 'Chưa đạt'] },
        { ten: 'Lên lớp',   rong: 9,  giua: true, chon: ['x', '0'] }
      ]),
      dong: dangHoc.map((r, i) =>
        [i + 1, r.hoc_sinh.ma, r.hoc_sinh.ho_ten, r.lop]
          .concat(mons.map(() => '')).concat(['', ''])),
      soDongTrong: 0,
      huongDan: [
        'Thứ tự cột môn giống hệt sổ điểm tổng kết xuất từ VnEdu, nên chép cả vùng điểm sang là xong.',
        '',
        '· KHÔNG sửa cột Mã học sinh — hệ thống ghép theo cột này, không ghép theo họ tên.',
        '· Ô "Kỳ" ở đầu trang: ghi "Cả năm" hoặc "Học kì I". Không ghi thêm chữ nào khác. Ghi sai hoặc để trống thì hệ thống dừng lại và báo, chứ không đoán.',
        '· Môn tính điểm ghi số từ 0 đến 10. Môn có chữ (Đ/CĐ) ghi Đ hoặc CĐ.',
        '· Cột Rèn luyện chọn một trong bốn mức: Tốt / Khá / Đạt / Chưa đạt.',
        '',
        'CỘT LÊN LỚP — đọc kỹ chỗ này',
        'Chỉ điền khi nhập kết quả CẢ NĂM, và điền cho MỌI em: ghi x nếu được lên lớp, ghi 0 nếu ở lại lớp.',
        'Để trống CẢ CỘT thì hệ thống bỏ qua, coi như trường chưa xét lên lớp. Nhưng điền dở dang thì những em còn trống sẽ bị ghi là Ở LẠI LỚP — hệ thống có hỏi lại riêng một câu trước khi ghi.',
        'Con số này đi thẳng vào chỉ tiêu CT10 và CT11 của Phụ lục 5 gửi Sở.',
        '',
        'Ô nào máy không đọc được thì được kể ra trước khi ghi, không bỏ lặng lẽ. Tệp kết quả KHÔNG BAO GIỜ tạo được học sinh mới — mã lạ sẽ bị bỏ qua và báo lại.'
      ],
      tenTep: 'mau-ket-qua-hoc-tap-' + NAM + '.xlsx'
    });
  }

  /* ========================================================================
     ĐỌC TỆP TẢI LÊN
     ======================================================================== */
  function chonTep(che) {
    if (!coThuVien()) return;
    if (!laQuanTri()) { notify('Chỉ quản trị và ban giám hiệu mới nhập được dữ liệu này.'); return; }
    CHE_DO = che;
    const inp = document.getElementById('hsTepExcel');
    if (!inp) return;
    inp.value = '';
    inp.click();
  }

  /* TÌM DÒNG TIÊU ĐỀ BẰNG SO KHỚP CHÍNH XÁC TỪNG Ô — không dò chuỗi con.

     Đây là lỗi đã chặn cả module suốt từ đầu: bản cũ hỏi "ô nào CHỨA chữ
     'mã học sinh'", mà dòng thứ 4 của chính mẫu hệ thống tải xuống là câu
     "Hướng dẫn: Mã học sinh lấy ĐÚNG mã đang dùng trên VnEdu…" — câu ấy chứa
     chữ đó nên bị nhận nhầm là dòng tiêu đề. Từ đó cot['mã học sinh'] không
     có, mọi dòng bị lọc sạch, và hệ thống báo "Tệp không có dòng dữ liệu nào"
     ngay cả với đúng tệp nó vừa tải xuống.

     Nay đòi ô phải BẰNG ĐÚNG tên cột, và phải có thêm một cột thứ hai nữa
     mới nhận — câu hướng dẫn chỉ có một ô nên không thể lọt. */
  function timDongTieuDe(hang, khoa, khoaPhu) {
    for (let i = 0; i < Math.min(hang.length, 20); i++) {
      const d = (hang[i] || []).map(x => String(x).trim().toLowerCase());
      if (d.indexOf(khoa) >= 0 && (!khoaPhu || d.indexOf(khoaPhu) >= 0)) return i;
    }
    return -1;
  }

  async function docTep(tep) {
    let wb;
    try {
      wb = XLSX.read(await tep.arrayBuffer(), { type: 'array' });
    } catch (e) { notify('Không đọc được tệp: ' + e.message); return; }
    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws) { notify('Tệp không có trang tính nào.'); return; }
    /* Màn hình này CHỈ đọc trang tính đầu. Mẫu của hệ thống có trang thứ hai
       tên "Huong dan" nên không sao. Nhưng sổ điểm VnEdu có MỖI LỚP MỘT TRANG
       (6a, 6b, 6c, 6d) — đọc trang đầu là mất ba lớp, không một lời cảnh báo.
       Chặn lại và chỉ sang đúng nút dành cho việc đó. */
    const phu = wb.SheetNames.slice(1).filter(t => !/^h(uo|ướ)ng\s*d(an|ẫn)$/i.test(String(t).trim()));
    if (phu.length) {
      notify('Tệp có ' + wb.SheetNames.length + ' trang tính (' + wb.SheetNames.join(', ')
        + '). Màn hình này chỉ đọc trang đầu nên sẽ mất ' + phu.length
        + ' trang còn lại. Nếu đây là sổ điểm VnEdu thì thầy cô dùng nút '
        + '"📥 Nạp tệp VnEdu" — nút đó đọc hết mọi lớp.');
      return;
    }
    const hang = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });

    const iTd = timDongTieuDe(hang, 'mã học sinh', 'họ và tên');
    if (iTd < 0) {
      notify('Không tìm thấy dòng tiêu đề. Tệp phải có một dòng mà ô ghi đúng '
        + '"Mã học sinh" và một ô ghi đúng "Họ và tên". '
        + 'Thầy cô dùng đúng mẫu do hệ thống tải xuống, đừng sửa dòng tiêu đề.');
      return;
    }
    const td = hang[iTd].map(x => String(x).trim());
    const cot = {};
    td.forEach((t, i) => { cot[t.toLowerCase()] = i; });
    /* Gắn kèm SỐ DÒNG EXCEL THẬT cho từng dòng dữ liệu. Trước đây báo lỗi
       đếm theo vị trí trong mảng đã cắt, nên "Dòng 3" thật ra là dòng 14 của
       tệp — thầy cô mở ra đếm xuống 3 dòng rồi sửa nhầm vào dòng hướng dẫn. */
    const than = hang.slice(iTd + 1)
      .map((d, k) => { d.__dong = iTd + 2 + k; return d; })
      .filter(d => String(d[cot['mã học sinh']] || '').trim() !== '');

    if (!than.length) { notify('Tệp không có dòng dữ liệu nào.'); return; }
    if (CHE_DO === 'ds') return napDanhSach(than, cot, tep.name);
    return napKetQua(than, cot, td, hang, tep.name);
  }

  /* ---------------- Nạp danh sách học sinh ----------------

     CHỈ GHI ĐÈ NHỮNG CỘT CÓ THẬT TRONG TỆP. Đây là lỗi đã có thật và mất dữ
     liệu không lấy lại được: trước đây tệp nào thiếu cột "Hoà nhập" thì
     `cot['hoà nhập']` là undefined, đọc ra chuỗi rỗng, và upsert ghi
     hoa_nhap = false đè lên. Bốn em khuyết tật học hoà nhập biến mất khỏi
     diện hoà nhập, kéo theo mẫu số của toàn bộ tỉ lệ tính sai theo Thông tư
     22. Cột "Miễn/giảm môn", "Ngày sinh", "Giới tính", "Ngày vào học" cũng
     bị xoá y như vậy. Nay cột nào tệp không có thì KHÔNG đụng tới. */
  async function napDanhSach(than, cot, tenTep) {
    const c = (d, ten) => String(d[cot[ten]] == null ? '' : d[cot[ten]]).trim();
    /* Có cột đó trong dòng tiêu đề hay không — nhận cả hai lối viết "hoà/hòa" */
    const coCot = (...tens) => tens.some(t => cot[t] !== undefined);
    /* Gán vào bản ghi nếu tệp có cột; không có thì bỏ qua để giữ giá trị cũ.
       Tên là datNeuCo chứ không phải gan — trong tệp này đã có sẵn một hàm
       gan() lo việc gắn sự kiện chọn tệp, trùng tên là bẫy cho lần sửa sau. */
    const datNeuCo = (b, khoa, coCotKhong, giaTri) => { if (coCotKhong) b[khoa] = giaTri; };

    const coDinhDanh  = coCot('số định danh cá nhân', 'số định danh');
    const coNgaySinh  = coCot('ngày sinh');
    const coGioiTinh  = coCot('giới tính');
    const coHoaNhap   = coCot('hoà nhập', 'hòa nhập');
    const coMienGiam  = coCot('miễn/giảm môn');
    const coNgayVao   = coCot('ngày vào học');
    const coTrangThai = coCot('trạng thái');

    /* Giá trị đang có của từng em, để ô trống trong tệp không xoá mất số cũ */
    const coMaCu = {}, cuLop = {};
    DS.forEach(r => { if (r.hoc_sinh) { coMaCu[r.hoc_sinh.ma] = r.hoc_sinh; cuLop[r.hoc_sinh.ma] = r; } });

    const hs = [], hl = [], loi = [];
    const daGap = {};
    let boViDu = 0;

    than.forEach((d, i) => {
      const ma = c(d, 'mã học sinh');
      const ten = c(d, 'họ và tên');
      /* Chữ hoa cho khớp với bảng phân công — quyền xem học sinh và quyền ghi
         cam kết đều ghép hai bảng bằng tên lớp, "6a" khác "6A" là mất quyền. */
      const lop = c(d, 'lớp').toUpperCase();
      const dong = d.__dong || (i + 1);   // số dòng Excel thật, để thầy cô tìm đúng chỗ
      /* Bỏ hai dòng ví dụ của mẫu. Thầy cô điền tiếp bên dưới rồi nạp lên là
         hai em không có thật vào thẳng cơ sở dữ liệu — nay chặn ở đây.
         Lọc theo CẢ mã lẫn tên: thầy cô rất dễ sửa mã ví dụ thành mã thật vì
         đó là dòng đã có sẵn định dạng, mà quên đổi họ tên. */
      if (/^VIDU/i.test(ma) || /\(ví dụ/i.test(ten)) { boViDu++; return; }
      if (daGap[ma]) { loi.push('Dòng ' + dong + ': mã ' + ma + ' bị lặp'); return; }
      if (!ten) { loi.push('Dòng ' + dong + ': thiếu họ tên'); return; }
      if (!lop) { loi.push('Dòng ' + dong + ': thiếu lớp'); return; }
      const khoi = khoiTuLop(lop);
      if (!khoi || khoi < 6 || khoi > 9) {
        loi.push('Dòng ' + dong + ': lớp "' + lop + '" không suy ra được khối 6 đến 9'); return;
      }
      /* Ngày sai định dạng phải KỂ RA ở đây. Gửi thẳng xuống máy chủ thì nó
         từ chối cả mẻ vì đúng một ô, kèm câu tiếng Anh không ai hiểu. */
      const ns = chuanNgay(coNgaySinh ? c(d, 'ngày sinh') : '');
      if (!ns.ok) {
        loi.push('Dòng ' + dong + ': ngày sinh "' + c(d, 'ngày sinh')
          + '" không đọc được — ghi dạng 20/05/2014'); return;
      }
      const nv = chuanNgay(coNgayVao ? c(d, 'ngày vào học') : '');
      if (!nv.ok) {
        loi.push('Dòng ' + dong + ': ngày vào học "' + c(d, 'ngày vào học')
          + '" không đọc được — ghi dạng 05/09/2026'); return;
      }
      /* Số định danh phải đúng 12 chữ số — máy chủ có ràng buộc, gửi sai là
         từ chối CẢ MẺ. Bắt ở đây để kể tên đúng dòng, thay vì để thầy cô
         nhận một câu tiếng Anh về "check constraint". */
      const dd = coDinhDanh ? (c(d, 'số định danh cá nhân') || c(d, 'số định danh')) : '';
      if (dd && !/^[0-9]{12}$/.test(dd)) {
        loi.push('Dòng ' + dong + ': số định danh "' + dd + '" phải đúng 12 chữ số. '
          + (dd.length === 11 ? 'Có vẻ Excel đã nuốt mất số 0 đứng đầu — '
             : '') + 'chọn cột đó, đặt định dạng ô thành Văn bản rồi gõ lại.');
        return;
      }
      daGap[ma] = true;

      /* Ô TRỐNG cũng không được ghi đè. Nguyên tắc "tệp không có thì không
         đụng" đặt đúng ở mức CỘT nhưng thủng ở mức Ô: tệp có cột Ngày sinh mà
         bỏ trống 20 dòng là xoá mất ngày sinh của 20 em.

         Nhưng KHÔNG được bỏ hẳn khoá đó ở riêng vài dòng — máy chủ nhận cả mẻ
         một lúc và đòi mọi bản ghi cùng bộ khoá, thiếu một khoá là từ chối
         sạch. Nên ô trống thì điền lại chính giá trị đang có của em đó. */
      const cu = coMaCu[ma] || {};
      const bHs = { ma: ma, ho_ten: ten };
      /* Số định danh cá nhân là dữ liệu nhạy cảm theo Nghị định 13/2023 —
         chỉ lưu, không bao giờ đưa ra màn hình công khai. Giữ dạng chuỗi để
         không mất số 0 đứng đầu. */
      datNeuCo(bHs, 'so_dinh_danh', coDinhDanh, dd || cu.so_dinh_danh || null);
      datNeuCo(bHs, 'ngay_sinh', coNgaySinh,
               ns.gt !== null ? ns.gt : (cu.ngay_sinh || null));
      datNeuCo(bHs, 'gioi_tinh', coGioiTinh,
          ['Nam', 'Nữ'].indexOf(c(d, 'giới tính')) >= 0 ? c(d, 'giới tính') : null);
      datNeuCo(bHs, 'hoa_nhap', coHoaNhap,
          /^(x|có|1|true)$/i.test(c(d, 'hoà nhập') || c(d, 'hòa nhập')));
      datNeuCo(bHs, 'mien_giam_mon', coMienGiam, c(d, 'miễn/giảm môn') || null);
      hs.push(bHs);

      const bHl = { hoc_sinh_ma: ma, nam_hoc: NAM, lop: lop, khoi: khoi };
      datNeuCo(bHl, 'ngay_vao', coNgayVao,
               nv.gt !== null ? nv.gt : (cuLop[ma] ? cuLop[ma].ngay_vao || null : null));
      /* Trạng thái thì luôn ghi: tệp không có cột này nghĩa là danh sách đầu
         năm, mọi em đều đang học — đó cũng chính là giá trị mặc định. */
      /* Trạng thái cũng theo đúng quy tắc "tệp không có cột thì không đụng".
         Nạp giữa năm một tệp danh sách rút gọn không có cột này mà vẫn ghi đè
         thì mọi em chuyển đi, thôi học, bảo lưu bị kéo hết về "đang học" —
         mẫu số của CT02 đến CT11 phồng lên, tỉ lệ gửi Sở sai mà không báo gì.
         Dòng mới thì cơ sở dữ liệu tự đặt mặc định 'dang_hoc'. */
      if (coTrangThai) {
        const tt = c(d, 'trạng thái').toLowerCase();
        bHl.trang_thai = tt.indexOf('chuyển') >= 0 ? 'chuyen_di'
                       : tt.indexOf('bảo lưu') >= 0 ? 'bao_luu'
                       : tt.indexOf('thôi') >= 0 ? 'thoi_hoc' : 'dang_hoc';
      }
      hl.push(bHl);
    });

    if (loi.length) {
      /* Kể ra nhiều lỗi một lúc. Chỉ báo lỗi đầu tiên thì tệp có 40 dòng sai
         là thầy cô phải sửa rồi tải lên 40 lượt. */
      CANH_SAU_NAP = '<div class="hs-canh"><b>' + loi.length
        + ' dòng có lỗi — chưa nạp gì cả, danh sách đang có vẫn nguyên.</b><br>'
        + loi.slice(0, 8).map(chan).join('<br>')
        + (loi.length > 8 ? '<br>… và ' + (loi.length - 8) + ' dòng nữa.' : '')
        + '</div>';
      ve();
      notify(loi.length + ' dòng có lỗi, chưa nạp gì cả — đọc chi tiết trên trang.');
      return;
    }
    /* Nói rõ cột nào tệp không có để thầy cô biết trước, khỏi tưởng mất dữ liệu */
    const thieuCot = [];
    if (!coNgaySinh) thieuCot.push('Ngày sinh');
    if (!coGioiTinh) thieuCot.push('Giới tính');
    if (!coHoaNhap)  thieuCot.push('Hoà nhập');
    if (!coMienGiam) thieuCot.push('Miễn/giảm môn');
    if (!coNgayVao)  thieuCot.push('Ngày vào học');
    if (!coTrangThai) thieuCot.push('Trạng thái');

    if (!hs.length) {
      notify('Tệp không có dòng học sinh nào ngoài hai dòng ví dụ. '
        + 'Thầy cô điền danh sách vào bên dưới dòng tiêu đề rồi tải lại.');
      return;
    }

    if (!window.confirm('Nạp ' + hs.length + ' học sinh vào năm học ' + NAM
      + ' từ tệp "' + tenTep + '"?\n\n'
      + 'Em nào đã có thì cập nhật lại thông tin và lớp.\n'
      + 'Kết quả học tập đã nhập trước đó không bị đụng tới.'
      + (boViDu ? '\n\nĐã bỏ ' + boViDu + ' dòng ví dụ của mẫu.' : '')
      + (thieuCot.length
          ? '\n\nTệp không có ' + thieuCot.length + ' cột: ' + thieuCot.join(', ') + '.\n'
            + '→ Những cột này GIỮ NGUYÊN giá trị đang có, hệ thống không xoá.'
          : ''))) return;

    const a = await sb.from('hoc_sinh').upsert(hs, { onConflict: 'ma' });
    if (a.error) { notify(loiTiengViet(a.error, 'danh sách')); return; }
    const b = await sb.from('hoc_sinh_lop').upsert(hl, { onConflict: 'hoc_sinh_ma,nam_hoc' });
    if (b.error) { notify('Nạp được học sinh nhưng chưa gán lớp: ' + b.error.message); return; }

    notify('Đã nạp ' + hs.length + ' học sinh cho năm học ' + NAM + '.');
    ve();
  }

  /* ---------------- Nạp kết quả học tập ---------------- */
  async function napKetQua(than, cot, td, hangGoc, tenTep) {
    /* Kỳ ghi ở ô ngay sau chữ "Kỳ" tại dòng 2 của mẫu.
       So khớp CHÍNH XÁC giá trị ô, không dò chuỗi con — nếu dò chuỗi con thì
       câu hướng dẫn nào lỡ chứa chữ "học kỳ I" cũng làm nhận nhầm. */
    let ky = 'ca_nam', kyDoc = '', kyLa = '', daThayKy = false;
    const KY_HK1 = ['học kỳ i', 'học kì i', 'học kỳ 1', 'học kì 1',
                    'hoc_ki_1', 'hk1', 'hk i', 'hk 1'];
    const KY_CN  = ['cả năm', 'ca_nam', 'cn', 'cả năm học'];
    hangGoc.slice(0, 6).forEach(d => {
      if (daThayKy) return;         // lấy ô Kỳ ĐẦU TIÊN, ô rác phía sau không đè
      const s = (d || []).map(x => String(x).trim());
      const i = s.indexOf('Kỳ');
      if (i < 0) return;
      daThayKy = true;
      const v = (s[i + 1] || '').toLowerCase();
      kyDoc = s[i + 1] || '';
      kyLa = '';
      if (KY_HK1.indexOf(v) >= 0) ky = 'hoc_ki_1';
      else if (KY_CN.indexOf(v) >= 0) ky = 'ca_nam';
      else kyLa = s[i + 1] || '(để trống)';
    });
    /* Không hiểu ô Kỳ thì DỪNG HẲN, không lẳng lặng hiểu là Cả năm.
       Kể cả khi ô ĐỂ TRỐNG: thầy cô xoá ô định điền sau rồi quên là tệp học
       kì I nạp ĐÈ lên ô kết quả cả năm — hỏng số gửi Sở, không dấu hiệu nào. */
    if (!daThayKy || kyLa) {
      notify(!daThayKy
        ? 'Tệp không có ô "Kỳ" ở đầu trang nên chưa nạp gì cả. Thầy cô dùng đúng '
          + 'mẫu do hệ thống tải xuống, giữ nguyên ba dòng đầu.'
        : 'Ô "Kỳ" ở dòng 2 của tệp ghi "' + kyLa + '" — hệ thống không hiểu, nên chưa '
          + 'nạp gì cả. Thầy cô sửa ô đó thành đúng "Cả năm" hoặc "Học kì I" rồi tải lại.');
      return;
    }

    const coMa = {};
    DS.forEach(r => { coMa[r.hoc_sinh.ma] = r; });

    /* Ánh xạ cột môn theo tên trong tiêu đề.
       CHỈ cắt đúng hậu tố đánh dấu " (Đ/CĐ)". Trước đây cắt mọi cụm trong
       ngoặc ở cuối, làm "Ngoại ngữ 1 (Tiếng Anh)" và "Nghệ thuật (Âm nhạc,
       Mĩ thuật)" không khớp cột nào và bị bỏ qua lặng lẽ. */
    const bo = t => t.replace(/\s*\(Đ\/CĐ\)\s*$/i, '')
                     .replace(/\s*\(HS\s*\d\)\s*$/i, '')     // sổ VnEdu có "(HS 1)"
                     .replace(/\s*\(N\.xét\)\s*$/i, '')
                     .trim().toLowerCase();
    /* Nhận CẢ tên đầy đủ trong danh mục LẪN tên viết tắt của sổ điểm VnEdu.
       Sổ của trường ghi "LS&ĐL", "Ng.ngữ", "C.nghệ", "NDGDCĐP", "HĐTN&HN" —
       không chữ nào khớp tên đầy đủ ("Lịch sử và Địa lí", "Ngoại ngữ 1
       (Tiếng Anh)"…). Thiếu bảng này thì chép thẳng tệp VnEdu sang là mất
       gần hết cột điểm, mà chỉ báo chung chung "không tìm thấy cột của N môn". */
    const cotMon = [], monThieu = [];
    MON.forEach(m => {
      const tenDay = m.ten.toLowerCase();
      const tenTat = (TEN_VNEDU[m.ma] || '').toLowerCase();
      const i = td.findIndex(t => {
        const x = bo(t);
        return x === tenDay || (tenTat && x === tenTat) || x === m.ma.toLowerCase();
      });
      if (i >= 0) cotMon.push({ mon: m, i: i });
      else monThieu.push(m.ten);
    });
    if (!cotMon.length) {
      notify('Không nhận ra cột môn học nào trong tệp. Thầy cô dùng đúng mẫu do hệ thống tải xuống.');
      return;
    }

    const iRL = td.findIndex(t => t.toLowerCase().indexOf('rèn luyện') >= 0);
    const iLL = td.findIndex(t => t.toLowerCase().indexOf('lên lớp') >= 0);
    const iMa = cot['mã học sinh'];

    const kq = [], rl = [], ll = [];
    const maLa = [], daCo = {};
    /* Ô có chữ nhưng máy không hiểu thì PHẢI KỂ RA, đừng bỏ lặng lẽ. Trước
       đây gõ nhầm "8,5đ" hay "Đạt " thừa dấu cách là ô đó rơi mất mà màn hình
       vẫn báo nạp thành công — điểm của em ấy trống, không ai biết vì sao. */
    const oLoi = [], rlLoi = [], maLap = [];
    let soODaDien = 0;   // số ô cột "Lên lớp" thật sự có nội dung
    than.forEach(d => {
      const ma = String(d[iMa] == null ? '' : d[iMa]).trim();
      if (!coMa[ma]) { maLa.push(ma); return; }
      /* Mã lặp phải bỏ qua, không chỉ đếm. Hai dòng cùng một em cùng một môn
         là hai bản ghi trùng khoá trong CÙNG một mẻ ghi, Postgres từ chối cả
         mẻ với câu "ON CONFLICT DO UPDATE command cannot affect row a second
         time" — mất trắng kết quả cả trường vì một dòng thừa trong tệp. */
      if (daCo[ma]) { maLap.push(ma); return; }
      daCo[ma] = true;
      cotMon.forEach(x => {
        const v = String(d[x.i] == null ? '' : d[x.i]).trim();
        if (!v) return;
        if (x.mon.kieu === 'diem') {
          const n = parseFloat(v.replace(',', '.'));
          if (isNaN(n) || n < 0 || n > 10) {
            oLoi.push(ma + ' · ' + x.mon.ten + ': "' + v + '"');
            return;
          }
          kq.push({ nam_hoc: NAM, ky: ky, hoc_sinh_ma: ma, mon_ma: x.mon.ma, diem: n, muc: null });
        } else {
          const m = /^(đ|d|đạt|dat)$/i.test(v) ? 'D' : /^(cđ|cd|chưa đạt)$/i.test(v) ? 'CD' : null;
          if (!m) {
            oLoi.push(ma + ' · ' + x.mon.ten + ': "' + v + '"');
            return;
          }
          kq.push({ nam_hoc: NAM, ky: ky, hoc_sinh_ma: ma, mon_ma: x.mon.ma, diem: null, muc: m });
        }
      });
      if (iRL >= 0) {
        const v = String(d[iRL] == null ? '' : d[iRL]).trim();
        if (['Tốt', 'Khá', 'Đạt', 'Chưa đạt'].indexOf(v) >= 0) {
          rl.push({ nam_hoc: NAM, ky: ky, hoc_sinh_ma: ma, muc: v });
        } else if (v) {
          rlLoi.push(ma + ': "' + v + '"');
        }
      }
      /* Cột "Lên lớp": ô trống nghĩa là Ở LẠI LỚP, vì hướng dẫn trong mẫu ghi
         "ghi x nếu được lên lớp". Bản cũ bỏ qua ô rỗng nên len_lop nằm im ở
         NULL, mà CT10 đếm len_lop = true còn CT11 đếm len_lop = false — em
         lưu ban không vào cả hai, tỉ lệ gửi Sở thấp hơn thực tế.

         NHƯNG chỉ ghi khi CẢ CỘT có ít nhất một ô được điền. Thầy cô nạp
         điểm cả năm TRƯỚC cuộc họp xét lên lớp thì cột này còn trống hết —
         ghi bừa là cả trường thành lưu ban, CT10 = 0%, CT11 = 100%. */
      if (iLL >= 0 && ky === 'ca_nam') {
        const v = String(d[iLL] == null ? '' : d[iLL]).trim();
        if (v) soODaDien++;
        ll.push({ ma: ma, len: /^(x|có|1|true)$/i.test(v) });
      }
    });

    /* Cả cột để trống thì coi như trường chưa xét lên lớp — bỏ qua, đừng ghi */
    if (!soODaDien) ll.length = 0;

    const thieu = DS.filter(r => r.trang_thai === 'dang_hoc' && !daCo[r.hoc_sinh.ma]);

    /* CÂU HỎI ĐẶT LÊN ĐẦU. Hộp confirm của hệ điều hành cắt bớt nội dung dài
       trên điện thoại, mà phần chi tiết dưới đây có lúc lên hơn 20 dòng — để
       câu hỏi ở cuối là thầy cô bấm Đồng ý mà chưa từng nhìn thấy nó. */
    let hoi = 'Nạp kết quả ' + (ky === 'hoc_ki_1' ? 'Học kì I' : 'Cả năm')
      + ' năm học ' + NAM + ' từ tệp "' + tenTep + '" chứ?\n'
      + '(ô Kỳ trong tệp ghi: ' + kyDoc + ')\n\n'
      + '✔ Khớp mã: ' + Object.keys(daCo).length + ' học sinh, ' + kq.length + ' ô điểm\n'
      + '   Đọc được ' + cotMon.length + '/' + MON.length + ' cột môn học\n';
    if (monThieu.length) {
      hoi += '⚠ KHÔNG tìm thấy cột của ' + monThieu.length + ' môn: '
        + monThieu.slice(0, 4).join(', ') + (monThieu.length > 4 ? '…' : '') + '\n'
        + '   → Các môn này sẽ không có điểm. Kiểm tra lại tiêu đề cột.\n';
    }
    if (ll.length) {
      const soLen = ll.filter(x => x.len).length;
      hoi += '↑ Lên lớp: ' + soLen + ' em lên lớp, ' + (ll.length - soLen) + ' em Ở LẠI LỚP.\n'
        + '   → Con số này vào thẳng chỉ tiêu CT10 và CT11 gửi Sở. Rà kỹ trước khi đồng ý.\n';
      /* Cột điền DỞ là chỗ nguy nhất: điền 20 ô thì 616 em còn lại thành ở
         lại lớp. Phải hỏi riêng một câu, đừng để lẫn trong hộp thoại dài. */
      if (soODaDien < ll.length) {
        if (!window.confirm('⚠ Cột "Lên lớp" mới điền ' + soODaDien + '/' + ll.length + ' ô.\n\n'
          + (ll.length - soODaDien) + ' em còn lại để trống sẽ được ghi là Ở LẠI LỚP, '
          + 'và con số đó vào thẳng chỉ tiêu CT10, CT11 gửi Sở.\n\n'
          + 'Nếu trường chưa xét lên lớp xong thì bấm Huỷ, xoá trắng cả cột rồi tải lại — '
          + 'hệ thống sẽ bỏ qua cột đó.\n\nVẫn ghi như trên chứ?')) return;
      }
    } else if (iLL >= 0 && ky === 'ca_nam') {
      hoi += 'ℹ Cột Lên lớp để trống hoàn toàn → chưa ghi kết luận lên lớp cho em nào.\n'
        + '   → Xét lên lớp xong thì điền cột đó rồi tải lên lần nữa.\n';
    }
    if (maLap.length) {
      hoi += '⚠ Mã bị lặp trong tệp: ' + maLap.length + ' dòng ('
        + maLap.slice(0, 5).join(', ') + (maLap.length > 5 ? '…' : '') + ')\n'
        + '   → Chỉ lấy dòng ĐẦU TIÊN của mỗi mã. Kiểm lại xem có bị dán trùng không.\n';
    }
    if (oLoi.length) {
      hoi += '✖ ' + oLoi.length + ' ô có chữ nhưng không đọc được, sẽ để trống:\n'
        + '   ' + oLoi.slice(0, 3).join('\n   ') + (oLoi.length > 3 ? '\n   …' : '') + '\n'
        + '   → Môn tính điểm chỉ nhận số 0 đến 10. Môn đánh giá Đạt chỉ nhận Đ hoặc CĐ.\n';
    }
    if (rlLoi.length) {
      hoi += '✖ ' + rlLoi.length + ' ô Rèn luyện không đọc được: '
        + rlLoi.slice(0, 4).join(' · ') + (rlLoi.length > 4 ? '…' : '') + '\n'
        + '   → Chỉ nhận đúng bốn mức: Tốt, Khá, Đạt, Chưa đạt.\n';
    }
    if (maLa.length) {
      hoi += '✖ Mã lạ (có trong tệp, KHÔNG có trong danh sách): ' + maLa.length + '\n'
        + '   ' + maLa.slice(0, 5).join(', ') + (maLa.length > 5 ? '…' : '') + '\n'
        + '   → Những em này SẼ BỊ BỎ QUA. Muốn nạp thì bổ sung vào danh sách trước.\n';
    }
    if (thieu.length) {
      hoi += '⚠ Thiếu (có trong danh sách, không có trong tệp): ' + thieu.length + ' em\n'
        + '   ' + thieu.slice(0, 5).map(r => r.lop + ' ' + r.hoc_sinh.ho_ten).join(' · ')
        + (thieu.length > 5 ? '…' : '') + '\n';
    }
    hoi += '\nThầy cô đồng ý nạp chứ?';

    if (!kq.length) { notify('Không có ô điểm nào hợp lệ trong tệp.'); return; }
    if (!window.confirm(hoi)) return;

    const a = await sb.from('hs_ket_qua')
      .upsert(kq, { onConflict: 'nam_hoc,ky,hoc_sinh_ma,mon_ma' });
    if (a.error) { notify('Chưa nạp được: ' + a.error.message); return; }
    /* Trước đây không kiểm lỗi ở đây, nên khi phần rèn luyện bị từ chối thì
       vẫn báo "đã nạp thành công", rồi bốn chỉ tiêu CT06–CT09 im lặng để trống. */
    let loiRL = '';
    if (rl.length) {
      const r2 = await sb.from('hs_ren_luyen').upsert(rl, { onConflict: 'nam_hoc,ky,hoc_sinh_ma' });
      if (r2.error) loiRL = 'Riêng phần rèn luyện CHƯA nạp được: ' + r2.error.message;
    } else if (iRL >= 0 && rlLoi.length) {
      /* CHỈ mắng khi tệp CÓ cột Rèn luyện và trong đó CÓ ô ghi sai.
         Bản cũ mắng cả khi cột để trống — mà mẫu hệ thống sinh ra luôn có cột
         này bỏ trống, nên mọi lần nạp điểm giữa kỳ bình thường đều bị báo là
         ghi sai bốn mức. Thầy cô đi sửa cái không hỏng. */
      loiRL = 'Không đọc được ô Rèn luyện nào — cột Rèn luyện chỉ nhận đúng '
            + 'một trong bốn mức: Tốt, Khá, Đạt, Chưa đạt.';
    }
    /* Cột "Lên lớp" cũng phải soi lỗi. Trước đây chạy vòng lặp rồi bỏ mặc kết
       quả, nên khi máy chủ từ chối thì im lặng — mà lên lớp hay ở lại là kết
       luận cả năm học của một đứa trẻ, sai chỗ này không được. */
    /* Gộp thành HAI lệnh thay vì một lệnh mỗi em: hơn 600 lượt gọi tuần tự
       mất vài phút và chỉ cần rớt mạng giữa chừng là ghi được nửa chừng. */
    /* Chia mẻ 100 mã một lệnh. Thư viện đưa danh sách in.(…) vào ĐƯỜNG DẪN
       chứ không vào thân yêu cầu, nên 636 mã một lệnh cho ra đường dẫn hơn
       8 KB — vượt ngưỡng máy chủ, trả về lỗi 414. Lỗi này chỉ lộ ở quy mô
       thật của trường, thử 5 em thì không thấy gì. */
    let loiLL = '', soGhiLL = 0;
    if (ll.length) {
      const nhom = [[true, ll.filter(x => x.len).map(x => x.ma)],
                    [false, ll.filter(x => !x.len).map(x => x.ma)]];
      for (const [len, mas] of nhom) {
        for (let i = 0; i < mas.length && !loiLL; i += 100) {
          const me = mas.slice(i, i + 100);
          /* .select() để ĐẾM số dòng thật sự ghi được. Không đếm thì khi hàng
             rào máy chủ chặn hoặc năm học lệch, lệnh trả về không lỗi mà cũng
             không ghi dòng nào — màn hình vẫn báo thành công. */
          const u = await sb.from('hoc_sinh_lop').update({ len_lop: len })
            .eq('nam_hoc', NAM).in('hoc_sinh_ma', me).select('hoc_sinh_ma');
          if (u.error) loiLL = 'Cột Lên lớp CHƯA ghi được: ' + u.error.message;
          else soGhiLL += (u.data || []).length;
        }
        if (loiLL) break;
      }
      if (!loiLL && soGhiLL < ll.length) {
        loiLL = 'Cột Lên lớp chỉ ghi được ' + soGhiLL + '/' + ll.length + ' em — '
              + 'số còn lại không khớp năm học ' + NAM + ' hoặc tài khoản không đủ quyền.';
      }
    }

    /* Điều cần nhớ thì ĐỂ LẠI TRÊN TRANG, đừng nhét vào thông báo nổi.
       Thông báo nổi tự tắt sau 3,6 giây và không cuộn được, mà nội dung ở đây
       có khi là "phần rèn luyện chưa nạp được" hoặc "cột Lên lớp chưa ghi
       được" — lên lớp hay ở lại là kết luận cả năm học của một đứa trẻ. */
    const y = [];
    if (loiRL) y.push(loiRL);
    if (loiLL) y.push(loiLL);
    if (maLa.length) y.push(maLa.length + ' mã lạ đã bị bỏ qua: '
      + maLa.slice(0, 8).join(', ') + (maLa.length > 8 ? '…' : ''));
    if (oLoi.length) y.push(oLoi.length + ' ô không đọc được nên để trống: '
      + oLoi.slice(0, 8).join(' · ') + (oLoi.length > 8 ? '…' : ''));

    CANH_SAU_NAP = '<div class="hs-canh ' + (y.length ? '' : 'hs-ok') + '">'
      + '<b>Đã nạp ' + kq.length + ' ô điểm cho ' + Object.keys(daCo).length + ' học sinh.</b>'
      + (y.length ? '<br>⚠ ' + y.map(chan).join('<br>⚠ ') : '')
      + '<br>Bấm <b>"Tính lại 33 chỉ tiêu"</b> để cập nhật các phụ lục.</div>';

    notify(y.length
      ? 'Đã nạp xong nhưng có ' + y.length + ' điểm cần xem — đọc dải cảnh báo trên trang.'
      : 'Đã nạp ' + kq.length + ' ô điểm.');
    ve();
  }

  /* ========================================================================
     TÍNH 33 CHỈ TIÊU TỪ DỮ LIỆU HỌC SINH
     ======================================================================== */
  async function tinhChiTieu() {
    /* Ô Kỳ cũng phải tra trong hộp đang mở. Đọc nhầm ô ẩn là tính rồi GHI ĐÈ
       bảng Kết quả thực hiện sai kỳ, không báo gì. */
    const sel = (HOP_HS ? HOP_HS.querySelector('#hsTinhKy') : null)
              || document.getElementById('hsTinhKy');
    const ky = sel ? sel.value : 'ca_nam';
    if (!window.confirm('Tính lại 33 chỉ tiêu của năm học ' + NAM + ' từ dữ liệu từng học sinh?\n\n'
      + 'Kỳ: ' + (ky === 'hoc_ki_1' ? 'Học kỳ I' : 'Cả năm') + '\n\n'
      + '⚠ Bảng "Kết quả thực hiện" sẽ bị GHI ĐÈ theo số máy tính ra.\n'
      + 'Cột đối sánh toàn tỉnh nhập tay vẫn giữ nguyên.\n\n'
      + 'Học sinh diện hoà nhập không tính vào mẫu số các tỉ lệ, theo Thông tư 22.')) return;

    const kq = await sb.rpc('dbcl_tinh_tu_hoc_sinh', {
      p_nam_hoc: NAM, p_ky: ky, p_loai: 'ket_qua'
    });
    if (kq.error) { notify('Chưa tính được: ' + kq.error.message); return; }
    notify('Đã tính và ghi ' + kq.data + ' ô vào bảng Kết quả thực hiện. '
      + 'Mở tab Phụ lục 5 để xem.');
    if (typeof window.taiLaiDBCL === 'function') window.taiLaiDBCL();
  }

  /* ---------------- Đăng ký màn hình và bắt sự kiện chọn tệp ---------------- */
  window.dbclManHinh = window.dbclManHinh || {};
  window.dbclManHinh.hs = ve;

  /* Dùng ô chọn tệp RIÊNG, không dùng chung với dbcl-excel.js — nếu chung thì
     hai tệp cùng bắt một sự kiện và cùng đọc một tệp, ra kết quả sai. */
  function gan() {
    const inp = document.getElementById('hsTepExcel');
    if (!inp) return;
    inp.addEventListener('change', function () {
      if (this.files && this.files[0]) docTep(this.files[0]);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', gan);
  else gan();
})();
