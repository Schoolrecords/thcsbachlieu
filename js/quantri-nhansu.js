/* ============================================================================
   QUẢN TRỊ HỆ THỐNG — TAB "DANH SÁCH CBGV-NV"

   Ban giám hiệu tự cập nhật đội ngũ bằng MỘT tệp Excel, không phải gõ từng
   người hay nhờ người viết SQL. Mẫu đúng 8 cột nhà trường quen dùng:

     TT · Họ và tên · Ngày sinh · Trình độ chuyên môn · Chức vụ ·
     Nhiệm vụ phân công · Địa chỉ Gmail · Ghi chú

   BA BẢNG BỊ ĐỤNG TỚI, PHẢI HIỂU RÕ KHÁC NHAU CHỖ NÀO

     moi_tai_khoan   — DANH SÁCH MỜI: ai được phép vào hệ thống.
                       Cả trường đọc được, như bảng phân công treo phòng hội đồng.
     nhan_su_ho_so   — NGÀY SINH, TRÌNH ĐỘ, nguyên văn câu nhiệm vụ.
                       Khoá lại, chỉ quản trị và ban giám hiệu đọc.
     phan_cong_day   — Từng dòng LỚP-MÔN tách ra từ câu nhiệm vụ.
                       Đây mới là thứ hệ thống dùng để phân quyền.

   CÁI BẪY LỚN NHẤT
   Sửa vai trò trong danh sách mời KHÔNG đổi quyền của người ĐÃ đăng nhập —
   quyền đọc từ bảng nguoi_dung, sinh ra lần đầu người đó vào bằng Google.
   Vì vậy nạp xong luôn hỏi có đồng bộ sang tài khoản thật không.

   VÌ SAO CÓ BẢNG XEM TRƯỚC
   Cột "Nhiệm vụ phân công" viết tự do như văn bản hành chính, máy phải đoán.
   Đoán sai mà ghi thẳng là hỏng phân quyền cả trường. Nên luôn hiện bảng đã
   tách cho người duyệt, và kể rõ dòng nào không đọc được.
   ============================================================================ */

(function () {
  'use strict';

  if (typeof CAU_HINH === 'undefined' || !CAU_HINH.DA_NOI) return;

  const sb = () => window.sbClient;

  /* Chức vụ in ra văn bản → vai trò quyết định quyền trong hệ thống.
     Tổ phó chuyên môn giữ quyền như giáo viên (thầy Chung chốt 07/8/2026):
     chức vụ vẫn in đúng chữ, nhưng không mở thêm quyền nào. */
  const CHUC_VU = [
    { ten: 'Hiệu trưởng',        vai: 'ban_giam_hieu' },
    { ten: 'Phó Hiệu trưởng',    vai: 'ban_giam_hieu' },
    { ten: 'Tổ trưởng CM',       vai: 'to_truong' },
    { ten: 'Tổ phó CM',          vai: 'giao_vien' },
    { ten: 'Giáo viên',          vai: 'giao_vien' },
    { ten: 'Nhân viên',          vai: 'nhan_vien' }
  ];
  const TEN_VAI = {
    admin: 'Quản trị', ban_giam_hieu: 'Ban giám hiệu', to_truong: 'Tổ trưởng',
    giao_vien: 'Giáo viên', nhan_vien: 'Nhân viên'
  };
  const COT = ['TT', 'Họ và tên', 'Ngày sinh', 'Trình độ chuyên môn', 'Chức vụ',
               'Nhiệm vụ phân công', 'Địa chỉ Gmail', 'Ghi chú'];

  const css = `
  .ns-thanh{display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin-bottom:14px}
  .ns-canh{background:#fdf3f2;border:1px solid #f3c9c5;color:#8a3428;border-radius:10px;
    padding:12px 15px;font-size:13.6px;margin:11px 0;line-height:1.65}
  .ns-ok{background:#f2fdf6;border-color:#bfe8cd;color:#1a6437}
  .ns-tin{background:#eef4ff;border-color:#cfe0ff;color:#1d4ed8}
  .ns-vang{background:#fff8e8;border-color:#f0d089;color:#7a5410}
  .ns-bang{width:100%;border-collapse:collapse;font-size:13.4px}
  .ns-bang th{background:#eef3fb;color:#14306b;font-weight:700;padding:8px 9px;
    border:1px solid #dbe3ef;font-size:12.5px;text-align:left;white-space:nowrap}
  .ns-bang td{border:1px solid #e4e9f2;padding:6px 9px;vertical-align:top}
  .ns-bang tr:hover td{background:#fafcff}
  .ns-co{display:inline-block;font-size:11.2px;font-weight:700;padding:2px 7px;border-radius:5px}
  .ns-co.moi{background:#dcfce7;color:#15803d}
  .ns-co.doi{background:#fef3c7;color:#92400e}
  .ns-co.y{background:#e0e7ff;color:#3730a3}
  .ns-nho{font-size:12px;color:#64748b}
  `;
  document.head.insertAdjacentHTML('beforeend', '<style>' + css + '</style>');


  /* Bộ tạo mẫu nằm ở tệp riêng (mau-excel.js). Tệp đó không tải được thì
     window.taoMauExcel là undefined, gọi vào là TypeError im lặng. */
  function coBoTaoMau() {
    if (typeof window.taoMauExcel === 'function') return true;
    if (typeof notify === 'function') {
      notify('Chưa nạp được bộ tạo mẫu Excel. Thầy cô kiểm tra kết nối mạng '
        + 'rồi tải lại trang (Ctrl+F5).');
    }
    return false;
  }

  function chan(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function bao(s) { if (typeof notify === 'function') notify(s); }

  /* ==========================================================================
     TÁCH CÂU "NHIỆM VỤ PHÂN CÔNG"

     Thầy cô viết tự nhiên như trong quyết định phân công:
        "Dạy Toán lớp 9A, 9B, 9C; Chủ nhiệm 9A"
        "Dạy Ngữ văn 6A, 6B"
        "Chủ nhiệm 7C"

     Cách đọc: tìm các mã lớp trước (dạng 6A…9E), phần chữ đứng trước mã lớp
     đầu tiên là tên môn. Không dò theo vị trí từ vì tên môn có khoảng trắng
     và dấu ngoặc — "Ngoại ngữ 1 (Tiếng Anh)", "Nghệ thuật (Âm nhạc, Mĩ thuật)".
     ========================================================================== */
  function tachNhiemVu(cau, MON) {
    const ra = [], loi = [];
    const goc = String(cau == null ? '' : cau).trim();
    if (!goc) return { ra: ra, loi: loi };

    /* Ngăn nhau bằng chấm phẩy, xuống dòng, DẤU CHẤM, hoặc " - ".
       Chỉ nhận chấm phẩy thì câu "Dạy Toán 9A, 9B. Chủ nhiệm 9A" — lối viết
       rất thường gặp — bị hiểu thành MỘT nhiệm vụ: phần "Chủ nhiệm" biến mất,
       lớp 9A biến thành dòng dạy Toán thứ hai. Im lặng tuyệt đối, mà còn sinh
       hai dòng trùng khoá trong cùng một mẻ ghi khiến máy chủ từ chối cả mẻ
       phân công của 38 người vì một dấu chấm của một người. */
    goc.split(/[;\n]+|\.(?=\s|$)|\s+-\s+/).forEach(khuc => {
      const s = khuc.trim();
      if (!s) return;

      /* Mã lớp: 1-2 chữ số rồi một chữ cái, ví dụ 9A, 6B. Cho phép có khoảng
         trắng ở giữa ("9 A") vì thầy cô hay gõ vậy. */
      const lops = [];
      const re = /\b(\d{1,2})\s*([A-Za-zÀ-ỹ])\b/g;
      let m;
      while ((m = re.exec(s)) !== null) {
        const khoi = parseInt(m[1], 10);
        if (khoi >= 6 && khoi <= 9) lops.push((m[1] + m[2]).toUpperCase());
      }

      if (!lops.length) { loi.push(s + ' → không thấy lớp nào (6A đến 9E)'); return; }

      const dau = s.toLowerCase();
      /* Chủ nhiệm: không gắn môn nào. Nhận cả "Kiêm chủ nhiệm" và "GVCN" —
         hai lối viết chuẩn trong quyết định phân công. */
      if (/(^|\s)(ki[eê]m\s*)?ch[uủ]\s*nhi[eệ]m/i.test(dau) || /(^|\s)gvcn\b/i.test(dau)) {
        lops.forEach(l => ra.push({ lop: l, mon: null, cn: true }));
        return;
      }

      if (!/(^|\s)(gi[aả]ng\s*)?d[aạ]y\b/i.test(dau)) {
        loi.push(s + ' → không phải nhiệm vụ giảng dạy, bỏ qua');
        return;
      }

      /* Tên môn = chữ giữa "Dạy" và mã lớp đầu tiên, bỏ chữ "lớp"/"khối" */
      const viTri = s.search(/\b\d{1,2}\s*[A-Za-zÀ-ỹ]\b/);
      let tenMon = s.slice(0, viTri < 0 ? s.length : viTri)
        .replace(/^[^a-zA-ZÀ-ỹ]*(gi[aả]ng\s*)?d[aạ]y\s*/i, '')
        .replace(/\b(l[oớ]p|kh[oố]i)\b\s*$/i, '')
        .replace(/[,;:\-–]\s*$/, '')
        .trim();

      if (!tenMon) { loi.push(s + ' → chưa rõ dạy môn gì'); return; }

      const mon = timMon(tenMon, MON);
      if (!mon) {
        loi.push(s + ' → không có môn nào tên "' + tenMon + '" trong danh mục');
        return;
      }
      lops.forEach(l => ra.push({ lop: l, mon: mon.ma, tenMon: mon.ten, cn: false }));
    });

    return { ra: ra, loi: loi };
  }

  /* Khớp tên môn: đúng hệt trước, rồi mới tới chứa nhau. Bỏ dấu để "Ngu van"
     cũng khớp "Ngữ văn" — thầy cô đôi khi gõ không dấu. */
  function khongDau(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/\s+/g, ' ').trim();
  }
  /* Tên thầy cô quen gọi → mã môn trong Chương trình GDPT 2018.
     Bắt buộc phải có bảng này: cột "Tổ chuyên môn" của chính trường đang ghi
     "Tiếng Anh", "Nghệ Thuật", "LS&ĐL", "GDTC" — tức là thầy cô sẽ gõ đúng
     những chữ đó vào cột Nhiệm vụ, mà không chữ nào khớp tên đầy đủ trong
     danh mục ("Ngoại ngữ 1 (Tiếng Anh)", "Lịch sử và Địa lí"…). */
  const TEN_KHAC = {
    'tieng anh': 'NN1', 'anh van': 'NN1', 'ngoai ngu': 'NN1', 'ngoai ngu 1': 'NN1',
    'am nhac': 'NT', 'mi thuat': 'NT', 'my thuat': 'NT', 'nghe thuat': 'NT',
    'the duc': 'GDTC', 'gdtc': 'GDTC', 'giao duc the chat': 'GDTC',
    'dia li': 'LSDL', 'dia ly': 'LSDL', 'lich su': 'LSDL',
    'ls&dl': 'LSDL', 'lsdl': 'LSDL', 'lich su va dia li': 'LSDL',
    'gdcd': 'GDCD', 'cong dan': 'GDCD',
    'khtn': 'KHTN', 'ly': 'KHTN', 'hoa': 'KHTN', 'sinh': 'KHTN',
    'vat li': 'KHTN', 'hoa hoc': 'KHTN', 'sinh hoc': 'KHTN',
    'van': 'NV', 'ngu van': 'NV',
    'tin': 'TIN', 'cong nghe': 'CN',
    'gddp': 'GDDP', 'dia phuong': 'GDDP',
    'trai nghiem': 'TNHN', 'huong nghiep': 'TNHN', 'tnhn': 'TNHN'
  };

  function timMon(ten, MON) {
    const t = khongDau(ten);
    if (!t) return null;
    let m = MON.find(x => khongDau(x.ten) === t);
    if (m) return m;
    m = MON.find(x => khongDau(x.ma) === t);
    if (m) return m;
    if (TEN_KHAC[t]) return MON.find(x => x.ma === TEN_KHAC[t]) || null;
    /* Chỉ khớp theo chiều "tên đầy đủ BẮT ĐẦU BẰNG chữ đã gõ" — ví dụ "Ngoại
       ngữ" khớp "Ngoại ngữ 1 (Tiếng Anh)". KHÔNG khớp chiều ngược lại: chiều
       đó làm "Toán, Tin học" khớp tiền tố "Toán" rồi NUỐT MẤT Tin học mà
       không báo một chữ nào. */
    const nhieu = MON.filter(x => khongDau(x.ten).indexOf(t) === 0);
    return nhieu.length === 1 ? nhieu[0] : null;
  }

  /* Ngày: dùng lại đúng quy tắc của màn hình học sinh, kể cả số sê-ri Excel */
  function chuanNgay(v) {
    if (v instanceof Date && !isNaN(v)) return dungNgay(v.getFullYear(), v.getMonth() + 1, v.getDate());
    let s = String(v == null ? '' : v).trim();
    if (!s) return { ok: true, gt: null };
    s = s.replace(/^ngày\s*/i, '')
         .replace(/[\sT]\d{1,2}:\d{2}(:\d{2})?(\s*[AP]M)?\s*$/i, '')
         .replace(/\s*([\/\-.])\s*/g, '$1').trim();
    if (!s) return { ok: true, gt: null };
    let m = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/);
    if (m) return dungNgay(+m[1], +m[2], +m[3]);
    m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (m) { let n = +m[3]; if (n < 100) n += (n <= 29 ? 2000 : 1900); return dungNgay(n, +m[2], +m[1]); }
    if (/^\d+(\.\d+)?$/.test(s)) {
      const n = parseFloat(s);
      if (n >= 8000 && n <= 60000) {   // 1921 đến 2064, đủ rộng cho ngày sinh CBGV
        const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(n) * 86400000);
        return dungNgay(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
      }
    }
    return { ok: false, gt: null };
  }
  function dungNgay(nam, thang, ngay) {
    if (!(nam >= 1900 && nam <= 2100) || !(thang >= 1 && thang <= 12)
        || !(ngay >= 1 && ngay <= 31)) return { ok: false, gt: null };
    const d = new Date(Date.UTC(nam, thang - 1, ngay));
    if (d.getUTCFullYear() !== nam || d.getUTCMonth() + 1 !== thang
        || d.getUTCDate() !== ngay) return { ok: false, gt: null };
    const h = n => (n < 10 ? '0' : '') + n;
    return { ok: true, gt: nam + '-' + h(thang) + '-' + h(ngay) };
  }
  function ngayVN(s) {
    const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
  }

  /* ==========================================================================
     TẢI DỮ LIỆU ĐANG CÓ
     ========================================================================== */
  let DS = [], HS_NS = {}, MON = [], NGUOI = [], PC = [];

  async function tai() {
    const s = sb();
    const [mtk, nshs, mh, nd, pc] = await Promise.all([
      s.from('moi_tai_khoan').select('*').order('email'),
      s.from('nhan_su_ho_so').select('*'),
      s.from('mon_hoc').select('*').order('so_tt'),
      s.from('nguoi_dung').select('id, email, ho_ten, vai_tro, trang_thai'),
      s.from('phan_cong_day').select('*').eq('nam_hoc', CAU_HINH.NAM_HOC)
    ]);
    /* Soi lỗi từng câu — thư viện không ném lỗi, nó trả { data:null, error }.
       Bỏ qua là màn hình hiện danh sách rỗng rồi ghi đè lên đội ngũ thật. */
    if (mtk.error) throw mtk.error;
    if (mh.error) throw mh.error;
    if (nd.error) throw nd.error;
    if (pc.error) throw pc.error;
    /* Riêng bảng hồ sơ nhân sự: chưa chạy sql/24 thì bảng chưa có — không
       phải lỗi chặn, chỉ là chưa dùng được phần ngày sinh, trình độ. */
    DS = mtk.data || [];
    MON = mh.data || [];
    NGUOI = nd.data || [];
    PC = pc.data || [];
    HS_NS = {};
    if (!nshs.error) (nshs.data || []).forEach(r => { HS_NS[r.email] = r; });
    return { thieuBang: !!nshs.error, loiBang: nshs.error ? nshs.error.message : '' };
  }

  /* ==========================================================================
     MÀN HÌNH
     ========================================================================== */
  function laQuanTri() {
    const u = window.NGUOI_DUNG;
    return !!u && ['admin', 'ban_giam_hieu'].includes(u.vai_tro);
  }

  async function ve(hop) {
    /* Chốt quyền ngay ở đây cho nhất quán với hai tab kia. Hàng rào thật nằm
       ở máy chủ, nhưng chốt trước thì thầy cô không mất công điền cả tệp rồi
       mới bị từ chối. */
    if (!laQuanTri()) {
      hop.innerHTML = '<div class="qt-trong">Chỉ quản trị và ban giám hiệu '
        + 'mới cập nhật được danh sách CBGV-NV.</div>';
      return;
    }
    hop.innerHTML = '<div class="qt-trong">Đang tải danh sách…</div>';
    let tt;
    try { tt = await tai(); }
    catch (e) {
      hop.innerHTML = '<div class="ns-canh"><b>Chưa đọc được danh sách.</b><br>'
        + 'Thầy cô đăng nhập lại. Nếu vẫn vậy thì báo quản trị.<br>'
        + '<span class="ns-nho">Chi tiết: ' + chan(e.message) + '</span></div>';
      return;
    }

    let html = '';
    if (tt.thieuBang) {
      html += '<div class="ns-canh ns-vang"><b>Chưa chạy tệp <code>sql/24</code>.</b><br>'
        + 'Danh sách vẫn xem và sửa được, nhưng <b>Ngày sinh</b> và <b>Trình độ chuyên môn</b> '
        + 'chưa có chỗ lưu nên sẽ không ghi được.<br>'
        + '<span class="ns-nho">' + chan(tt.loiBang) + '</span></div>';
    }

    html += '<div class="ns-thanh">'
      + '<button class="btn btn-out" id="nsMau">⬇ Tải mẫu danh sách</button>'
      + '<button class="btn btn-pri" id="nsLen">⬆ Tải danh sách lên</button>'
      + '<button class="btn btn-out" id="nsDongBo">🔄 Đồng bộ vai trò sang tài khoản</button>'
      + '<button class="btn btn-out" id="nsGanPC">🗂 Gán lại phân công từ nhiệm vụ</button>'
      + '</div>';

    html += '<div class="ns-canh ns-tin"><b>Ba việc khác nhau, đừng lẫn:</b><br>'
      + '· <b>Danh sách này</b> quyết định ai được vào hệ thống và ở vai trò gì.<br>'
      + '· <b>Đồng bộ vai trò</b> mới đổi được quyền của người <b>đã đăng nhập</b> — '
      + 'sửa danh sách thôi thì họ vào vẫn giữ quyền cũ.<br>'
      + '· <b>Gán phân công</b> tách câu "Nhiệm vụ" thành từng dòng lớp–môn, '
      + 'đó mới là thứ dùng để giáo viên thấy đúng lớp mình dạy.</div>';

    const chuaVao = DS.filter(d => !NGUOI.some(n => sanh(n.email) === sanh(d.email))).length;
    html += '<div class="ns-nho" style="margin:8px 0 12px">Đang có <b>' + DS.length
      + '</b> người trong danh sách · <b>' + (DS.length - chuaVao) + '</b> đã đăng nhập ít nhất một lần'
      + (chuaVao ? ' · <b>' + chuaVao + '</b> chưa vào lần nào' : '') + '.</div>';

    html += '<div class="tbl-wrap"><table class="ns-bang"><thead><tr>'
      + '<th style="width:42px">TT</th><th>Họ và tên</th><th style="width:96px">Ngày sinh</th>'
      + '<th style="width:150px">Trình độ</th><th style="width:120px">Chức vụ</th>'
      + '<th>Nhiệm vụ phân công</th><th style="width:180px">Gmail</th>'
      + '<th style="width:110px">Tài khoản</th></tr></thead><tbody>';

    DS.slice().sort((a, b) => {
      const sa = (HS_NS[a.email] || {}).so_tt, sbb = (HS_NS[b.email] || {}).so_tt;
      if (sa != null && sbb != null) return sa - sbb;
      if (sa != null) return -1;
      if (sbb != null) return 1;
      return String(a.ho_ten || '').localeCompare(String(b.ho_ten || ''), 'vi');
    }).forEach((d, i) => {
      const r = HS_NS[d.email] || {};
      const tk = NGUOI.find(n => sanh(n.email) === sanh(d.email));
      html += '<tr><td>' + (r.so_tt != null ? r.so_tt : i + 1) + '</td>'
        + '<td><b>' + chan(d.ho_ten || '—') + '</b></td>'
        + '<td>' + chan(ngayVN(r.ngay_sinh) || '—') + '</td>'
        + '<td>' + chan(r.trinh_do || '—') + '</td>'
        + '<td>' + chan(d.chuc_vu || '—') + '<br><span class="ns-nho">'
          + chan(TEN_VAI[d.vai_tro] || d.vai_tro) + '</span></td>'
        + '<td>' + chan(r.nhiem_vu || '—') + '</td>'
        + '<td style="word-break:break-all">' + chan(d.email) + '</td>'
        + '<td>' + (tk
            ? (sanh(tk.vai_tro) === sanh(d.vai_tro)
                ? '<span class="ns-co y">khớp</span>'
                : '<span class="ns-co doi">lệch vai trò</span>')
            : '<span class="ns-nho">chưa vào</span>') + '</td></tr>';
    });
    html += '</tbody></table></div>';
    hop.innerHTML = html;

    hop.querySelector('#nsMau').addEventListener('click', taiMau);
    hop.querySelector('#nsLen').addEventListener('click', chonTep);
    hop.querySelector('#nsDongBo').addEventListener('click', () => dongBoVaiTro(hop));
    hop.querySelector('#nsGanPC').addEventListener('click', () => ganLaiPhanCong(hop));
  }

  function sanh(s) { return String(s || '').trim().toLowerCase(); }

  /* ==========================================================================
     TẢI MẪU — đi qua bộ tạo mẫu dùng chung ở mau-excel.js
     ========================================================================== */
  async function taiMau() {
    const sap = DS.slice().sort((a, b) => {
      const sa = (HS_NS[a.email] || {}).so_tt, sbb = (HS_NS[b.email] || {}).so_tt;
      if (sa != null && sbb != null) return sa - sbb;
      if (sa != null) return -1;
      if (sbb != null) return 1;
      return String(a.ho_ten || '').localeCompare(String(b.ho_ten || ''), 'vi');
    });

    const dong = sap.map((d, i) => {
      const r = HS_NS[d.email] || {};
      return [i + 1, d.ho_ten || '', ngayVN(r.ngay_sinh), r.trinh_do || '',
              d.chuc_vu || '', r.nhiem_vu || '', d.email, d.ghi_chu || ''];
    });

    if (!coBoTaoMau()) return;
    await window.taoMauExcel({
      ten: 'Danh sach CBGVNV',
      ngang: true,
      tieuDe: [
        (CAU_HINH.TEN_TRUONG || 'Trường THCS Bạch Liêu').toUpperCase(),
        'DANH SÁCH CÁN BỘ, GIÁO VIÊN, NHÂN VIÊN',
        'Năm học ' + (CAU_HINH.NAM_HOC || '')
      ],
      cot: [
        { ten: 'TT',                  rong: 5,  giua: true },
        { ten: 'Họ và tên',           rong: 26 },
        { ten: 'Ngày sinh',           rong: 12, giua: true },
        { ten: 'Trình độ chuyên môn', rong: 24 },
        { ten: 'Chức vụ',             rong: 17, chon: CHUC_VU.map(x => x.ten) },
        { ten: 'Nhiệm vụ phân công',  rong: 40, xuongDong: true },
        { ten: 'Địa chỉ Gmail',       rong: 30 },
        { ten: 'Ghi chú',             rong: 24, xuongDong: true }
      ],
      dong: dong,
      soDongTrong: 8,
      huongDan: [
        '· Cột Gmail là khoá ghép — mỗi người một địa chỉ, không được để trống, không sửa của người đang có.',
        '· Ngày sinh ghi ngày/tháng/năm, ví dụ 20/05/1980.',
        '· Chức vụ chọn trong danh sách xổ xuống: ' + CHUC_VU.map(x => x.ten).join(' · '),
        '· Để trống ô Chức vụ, hoặc ghi y hệt chức vụ đang có, thì hệ thống GIỮ NGUYÊN quyền cũ. Chỉ đổi quyền khi chức vụ thật sự đổi.',
        '',
        'NHIỆM VỤ PHÂN CÔNG — viết như trong quyết định, ngăn nhau bằng dấu chấm phẩy hoặc dấu chấm:',
        '     Dạy Toán lớp 9A, 9B, 9C; Chủ nhiệm 9A',
        'Máy đọc được cả "Kiêm chủ nhiệm", "GVCN", "Giảng dạy". Tên môn viết theo lối quen dùng cũng được:',
        '     Tiếng Anh · Địa lí · Lịch sử · Âm nhạc · Mĩ thuật · Thể dục — máy tự quy về đúng môn trong danh mục.',
        'Nạp xong hệ thống hiện BẢNG XEM TRƯỚC để duyệt; câu nào không đọc được thì kể ra, không bỏ lặng lẽ.',
        '',
        'HAI VIỆC LÀM SAU KHI NẠP',
        '· Bấm "Đồng bộ vai trò" nếu có người đổi chức vụ — sửa danh sách thôi thì người ĐÃ đăng nhập vẫn giữ quyền cũ.',
        '· Xoá một người khỏi danh sách: xoá riêng ở tab "Danh sách mời". Thiếu một dòng trong Excel KHÔNG làm mất người.'
      ],
      tenTep: 'danh-sach-cbgv-nv-' + (CAU_HINH.NAM_HOC || '') + '.xlsx'
    });
  }

  /* ==========================================================================
     ĐỌC TỆP TẢI LÊN
     ========================================================================== */
  function chonTep() {
    if (typeof XLSX === 'undefined') {
      bao('Chưa nạp được thư viện đọc Excel. Thầy cô kiểm tra mạng rồi tải lại trang.');
      return;
    }
    let inp = document.getElementById('nsTepExcel');
    if (!inp) {
      inp = document.createElement('input');
      inp.type = 'file';
      inp.id = 'nsTepExcel';
      inp.accept = '.xlsx,.xls';
      inp.style.display = 'none';
      document.body.appendChild(inp);
      inp.addEventListener('change', function () {
        if (this.files && this.files[0]) docTep(this.files[0]);
      });
    }
    inp.value = '';
    inp.click();
  }

  async function docTep(tep) {
    let wb;
    try { wb = XLSX.read(await tep.arrayBuffer(), { type: 'array' }); }
    catch (e) { bao('Không đọc được tệp: ' + e.message); return; }
    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws) { bao('Tệp không có trang tính nào.'); return; }
    const hang = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });

    /* Dò dòng tiêu đề bằng SO KHỚP CHÍNH XÁC từng ô, và đòi hai cột cùng lúc.
       Dò chuỗi con thì câu hướng dẫn nào chứa chữ "Họ và tên" cũng bị nhận
       nhầm — đúng lỗi đã chặn cả module học sinh suốt một phiên. */
    let iTd = -1;
    for (let i = 0; i < Math.min(hang.length, 25); i++) {
      const d = (hang[i] || []).map(x => String(x).trim().toLowerCase());
      if (d.indexOf('họ và tên') >= 0 && d.indexOf('địa chỉ gmail') >= 0) { iTd = i; break; }
    }
    if (iTd < 0) {
      bao('Không tìm thấy dòng tiêu đề. Tệp phải có một dòng vừa có ô ghi đúng '
        + '"Họ và tên" vừa có ô ghi đúng "Địa chỉ Gmail". Thầy cô dùng đúng mẫu hệ thống tải xuống.');
      return;
    }
    const td = (hang[iTd] || []).map(x => String(x).trim().toLowerCase());
    const cot = {};
    td.forEach((t, i) => { if (t) cot[t] = i; });
    const iMail = cot['địa chỉ gmail'];

    const o = (d, ten) => String(cot[ten] === undefined || d[cot[ten]] == null ? '' : d[cot[ten]]).trim();

    const rows = [], loi = [], nvLoi = [], pcMoi = [], canhVai = [];
    const daGap = {};
    let boTrong = 0;

    hang.slice(iTd + 1).forEach((d, k) => {
      const dong = iTd + 2 + k;
      const mail = sanh(d[iMail]);
      const ten = o(d, 'họ và tên');
      if (!mail && !ten) { boTrong++; return; }
      if (!mail) { loi.push('Dòng ' + dong + ': có họ tên "' + ten + '" nhưng thiếu Gmail'); return; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) {
        loi.push('Dòng ' + dong + ': "' + mail + '" không phải địa chỉ thư điện tử'); return;
      }
      if (daGap[mail]) { loi.push('Dòng ' + dong + ': Gmail ' + mail + ' bị lặp'); return; }
      if (!ten) { loi.push('Dòng ' + dong + ': thiếu họ và tên'); return; }

      /* ---- CHỨC VỤ VÀ QUYỀN: chỗ dễ mất quyền nhất của cả tab này ----

         Quy tắc, theo đúng thứ tự:
         1. Ô để trống, hoặc ghi Y HỆT chức vụ đang lưu → GIỮ NGUYÊN quyền cũ.
         2. Ô ghi khác đi và khớp danh sách 6 chức vụ → đổi quyền theo đó.
         3. Ô ghi khác đi mà không khớp → báo lỗi, không đoán.

         Vì sao quy tắc 1 phải đứng TRƯỚC quy tắc 2 — hai lỗi thật:

         · Trường đang có 5 chức vụ KHÔNG nằm trong danh sách 6 giá trị:
           "Kế toán", "Nhân viên thư viện", "Nhân viên thiết bị",
           "Nhân viên y tế", "Quản trị hệ thống". Nếu bắt khớp cứng thì tải
           mẫu xuống rồi tải lên NGAY, không sửa gì, đã hỏng 5 dòng — tab
           không dùng được lần nào.
         · Thầy Đặng Thanh Quý và thầy Lê Văn Tuấn ghi chức vụ "Giáo viên"
           nhưng quyền là TỔ TRƯỞNG. Nếu suy quyền từ chức vụ thì tải mẫu rồi
           tải lên là hai thầy mất quyền chấm tự đánh giá, âm thầm. */
      const cv = o(d, 'chức vụ');
      const cuNguoi = DS.find(x => sanh(x.email) === mail);
      const giuNguyen = !cv || (cuNguoi && khongDau(cv) === khongDau(cuNguoi.chuc_vu || ''));
      const cvKhop = CHUC_VU.find(x => khongDau(x.ten) === khongDau(cv));

      if (cv && !cvKhop && !giuNguyen) {
        loi.push('Dòng ' + dong + ': chức vụ "' + cv + '" vừa không có trong danh sách ('
          + CHUC_VU.map(x => x.ten).join(', ') + ') vừa khác chức vụ đang lưu'
          + (cuNguoi ? ' ("' + (cuNguoi.chuc_vu || 'chưa có') + '")' : ''));
        return;
      }

      const vaiTro = giuNguyen
        ? (cuNguoi ? cuNguoi.vai_tro : 'giao_vien')
        : (cvKhop ? cvKhop.vai : 'giao_vien');

      if (cuNguoi && giuNguyen && cv && cvKhop && cvKhop.vai !== cuNguoi.vai_tro) {
        /* Chức vụ và quyền vốn đã lệch nhau trong dữ liệu cũ — nói ra để ban
           giám hiệu biết, chứ không tự ý kéo về cho "khớp". */
        canhVai.push(ten + ' — chức vụ ghi "' + cv + '" nhưng quyền đang là '
          + (TEN_VAI[cuNguoi.vai_tro] || cuNguoi.vai_tro) + ', giữ nguyên quyền');
      } else if (!cv && cuNguoi) {
        canhVai.push(ten + ' — để trống ô Chức vụ, giữ nguyên quyền '
          + (TEN_VAI[cuNguoi.vai_tro] || cuNguoi.vai_tro));
      }

      const ns = chuanNgay(o(d, 'ngày sinh'));
      if (!ns.ok) {
        loi.push('Dòng ' + dong + ': ngày sinh "' + o(d, 'ngày sinh')
          + '" không đọc được — ghi dạng 20/05/1980');
        return;
      }

      daGap[mail] = true;
      const nv = o(d, 'nhiệm vụ phân công');
      const tach = tachNhiemVu(nv, MON);
      tach.loi.forEach(x => nvLoi.push(ten + ': ' + x));
      tach.ra.forEach(x => pcMoi.push(Object.assign({ email: mail, ho_ten: ten }, x)));

      const soTt = parseInt(o(d, 'tt'), 10);
      rows.push({
        email: mail,
        ho_ten: ten,
        chuc_vu: cv || (cuNguoi ? cuNguoi.chuc_vu : null),
        vai_tro: vaiTro,
        ghi_chu: o(d, 'ghi chú') || null,
        so_tt: isNaN(soTt) ? null : soTt,
        ngay_sinh: ns.gt,
        trinh_do: o(d, 'trình độ chuyên môn') || null,
        nhiem_vu: nv || null,
        soPc: tach.ra.length
      });
    });

    if (loi.length) {
      hienKetQua('<div class="ns-canh"><b>' + loi.length
        + ' dòng có lỗi — chưa nạp gì cả, danh sách đang có vẫn nguyên.</b><br>'
        + loi.slice(0, 10).map(chan).join('<br>')
        + (loi.length > 10 ? '<br>… và ' + (loi.length - 10) + ' dòng nữa.' : '')
        + '</div>');
      return;
    }
    if (!rows.length) { bao('Tệp không có dòng nào có Gmail.'); return; }

    veXemTruoc(rows, pcMoi, nvLoi, canhVai, tep.name);
  }

  /* ==========================================================================
     BẢNG XEM TRƯỚC — duyệt rồi mới ghi
     ========================================================================== */
  function veXemTruoc(rows, pcMoi, nvLoi, canhVai, tenTep) {
    const cu = {};
    DS.forEach(d => { cu[sanh(d.email)] = d; });

    const them = rows.filter(r => !cu[r.email]);
    const doi = rows.filter(r => cu[r.email] && (
      (cu[r.email].ho_ten || '') !== r.ho_ten ||
      (cu[r.email].chuc_vu || null) !== r.chuc_vu ||
      (cu[r.email].vai_tro || '') !== r.vai_tro));
    const moiCo = {};
    rows.forEach(r => { moiCo[r.email] = true; });
    const xoa = DS.filter(d => !moiCo[sanh(d.email)]);

    let h = '<div class="ns-canh ns-tin"><b>Xem trước trước khi ghi</b> — tệp "'
      + chan(tenTep) + '"<br>'
      + '<b>' + rows.length + '</b> người trong tệp · <b>' + them.length + '</b> thêm mới · <b>'
      + doi.length + '</b> đổi thông tin · <b>' + pcMoi.length + '</b> dòng phân công dạy.</div>';

    if (xoa.length) {
      h += '<div class="ns-canh"><b>⚠ ' + xoa.length
        + ' người đang có trong hệ thống nhưng KHÔNG có trong tệp:</b><br>'
        + xoa.slice(0, 12).map(d => chan(d.ho_ten || d.email)).join(' · ')
        + (xoa.length > 12 ? ' …' : '')
        + '<br><b>Hệ thống sẽ KHÔNG tự xoá họ.</b> Muốn cho ai nghỉ thì xoá riêng ở tab '
        + '"Danh sách mời" — như vậy không bao giờ mất người vì quên một dòng trong Excel.</div>';
    }

    if (canhVai.length) {
      h += '<div class="ns-canh ns-vang"><b>' + canhVai.length
        + ' dòng để trống ô Chức vụ — hệ thống giữ nguyên quyền đang có, '
        + 'không hạ ai xuống giáo viên:</b><br>'
        + canhVai.slice(0, 8).map(chan).join('<br>')
        + (canhVai.length > 8 ? '<br>… và ' + (canhVai.length - 8) + ' người nữa.' : '')
        + '</div>';
    }

    if (nvLoi.length) {
      h += '<div class="ns-canh"><b>✖ ' + nvLoi.length
        + ' nhiệm vụ không đọc được — sẽ không thành dòng phân công nào:</b><br>'
        + nvLoi.slice(0, 8).map(chan).join('<br>')
        + (nvLoi.length > 8 ? '<br>… và ' + (nvLoi.length - 8) + ' câu nữa.' : '')
        + '<br><span class="ns-nho">Câu nhiệm vụ vẫn được lưu nguyên văn để in ra văn bản. '
        + 'Viết đúng mẫu "Dạy Toán lớp 9A, 9B; Chủ nhiệm 9A" là máy đọc được.</span></div>';
    }

    if (them.length) {
      h += '<div class="ns-canh ns-ok"><b>Thêm mới ' + them.length + ' người:</b><br>'
        + them.map(r => chan(r.ho_ten) + ' <span class="ns-nho">(' + chan(r.chuc_vu || '—')
            + ')</span>').join(' · ') + '</div>';
    }
    if (doi.length) {
      h += '<div class="ns-canh ns-vang"><b>Đổi thông tin ' + doi.length + ' người:</b><br>'
        + doi.map(r => {
            const c = cu[r.email];
            const ph = [];
            if ((c.ho_ten || '') !== r.ho_ten) ph.push('tên: ' + chan(c.ho_ten || '—') + ' → ' + chan(r.ho_ten));
            if ((c.chuc_vu || null) !== r.chuc_vu) ph.push('chức vụ: ' + chan(c.chuc_vu || '—') + ' → ' + chan(r.chuc_vu || '—'));
            if ((c.vai_tro || '') !== r.vai_tro) ph.push('quyền: ' + (TEN_VAI[c.vai_tro] || c.vai_tro) + ' → ' + (TEN_VAI[r.vai_tro] || r.vai_tro));
            return '<div>' + chan(r.ho_ten) + ' — ' + ph.join(' · ') + '</div>';
          }).join('') + '</div>';
    }

    if (pcMoi.length) {
      /* Nói rõ sẽ dọn bao nhiêu dòng cũ. Không nói thì thầy cô không hiểu vì
         sao phân công năm ngoái biến mất — mà dọn là đúng: giữ lại thì thầy
         cô đã hết dạy lớp đó vẫn xem được lớp đó. */
      const aiCo = {};
      pcMoi.forEach(p => { const n = NGUOI.find(x => sanh(x.email) === p.email); if (n) aiCo[n.id] = true; });
      const soCu = PC.filter(x => aiCo[x.nguoi_dung_id]).length;
      if (soCu) {
        h += '<div class="ns-canh ns-vang"><b>Sẽ dọn ' + soCu + ' dòng phân công cũ</b> '
          + 'của năm học ' + chan(CAU_HINH.NAM_HOC) + ', rồi ghi lại theo tệp này. '
          + 'Không dọn thì thầy cô đã hết dạy một lớp vẫn xem được lớp đó.</div>';
      }
      h += '<div style="margin-top:12px"><b>Phân công dạy tách được từ cột Nhiệm vụ:</b></div>'
        + '<div class="tbl-wrap" style="max-height:260px;overflow:auto;margin-top:6px">'
        + '<table class="ns-bang"><thead><tr><th>Họ và tên</th><th>Lớp</th><th>Môn</th>'
        + '<th style="width:96px">Chủ nhiệm</th></tr></thead><tbody>'
        + pcMoi.map(p => '<tr><td>' + chan(p.ho_ten) + '</td><td>' + chan(p.lop) + '</td>'
            + '<td>' + chan(p.tenMon || '—') + '</td>'
            + '<td>' + (p.cn ? '✓' : '') + '</td></tr>').join('')
        + '</tbody></table></div>';
    }

    h += '<div class="ns-thanh" style="margin-top:16px">'
      + '<button class="btn btn-pri" id="nsGhi">✅ Ghi ' + rows.length + ' người vào hệ thống</button>'
      + '<button class="btn btn-out" id="nsHuy">Huỷ</button></div>';

    hienKetQua(h);
    const g = document.getElementById('nsGhi');
    if (g) g.addEventListener('click', () => ghi(rows, pcMoi));
    const hy = document.getElementById('nsHuy');
    if (hy) hy.addEventListener('click', () => ve(hopHienTai()));
  }

  let HOP = null;
  function hopHienTai() { return HOP || document.getElementById('qtThan'); }
  function hienKetQua(html) {
    const h = hopHienTai();
    if (h) { h.innerHTML = html; h.scrollTop = 0; }
  }

  /* ==========================================================================
     GHI XUỐNG CƠ SỞ DỮ LIỆU
     ========================================================================== */
  async function ghi(rows, pcMoi) {
    const s = sb();
    const nut = document.getElementById('nsGhi');
    if (nut) { nut.disabled = true; nut.textContent = 'Đang ghi…'; }
    const bao2 = [];

    /* 1. Danh sách mời */
    const a = await s.from('moi_tai_khoan').upsert(
      rows.map(r => ({
        email: r.email, ho_ten: r.ho_ten, chuc_vu: r.chuc_vu,
        vai_tro: r.vai_tro, ghi_chu: r.ghi_chu
      })), { onConflict: 'email' });
    if (a.error) {
      hienKetQua('<div class="ns-canh"><b>Chưa ghi được danh sách.</b><br>'
        + chan(a.error.message) + '</div>');
      return;
    }
    bao2.push('Đã ghi ' + rows.length + ' người vào danh sách.');

    /* 2. Ngày sinh, trình độ, nguyên văn nhiệm vụ */
    const b = await s.from('nhan_su_ho_so').upsert(
      rows.map(r => ({
        email: r.email, so_tt: r.so_tt, ngay_sinh: r.ngay_sinh,
        trinh_do: r.trinh_do, nhiem_vu: r.nhiem_vu,
        cap_nhat_luc: new Date().toISOString(),
        cap_nhat_boi: window.NGUOI_DUNG ? window.NGUOI_DUNG.id : null
      })), { onConflict: 'email' });
    if (b.error) {
      bao2.push('⚠ Ngày sinh và trình độ CHƯA ghi được: ' + b.error.message
        + ' (kiểm tra đã chạy sql/24 chưa)');
    }

    /* 3. Phân công dạy — chỉ gán được cho người ĐÃ có tài khoản thật */
    const kq = await ganPhanCong(pcMoi);
    bao2.push(kq);

    hienKetQua('<div class="ns-canh ns-ok"><b>Xong.</b><br>' + bao2.map(chan).join('<br>')
      + '</div><div class="ns-thanh"><button class="btn btn-pri" id="nsQuayLai">← Xem lại danh sách</button>'
      + '<button class="btn btn-out" id="nsDongBo2">🔄 Đồng bộ vai trò sang tài khoản</button></div>');
    const q = document.getElementById('nsQuayLai');
    if (q) q.addEventListener('click', () => ve(hopHienTai()));
    const d = document.getElementById('nsDongBo2');
    if (d) d.addEventListener('click', () => dongBoVaiTro(hopHienTai()));
  }

  /* Gán phân công: khoá ngoại trỏ tới nguoi_dung nên người chưa đăng nhập lần
     nào thì chưa gán được. Không phải lỗi — chỉ cần bấm "Gán lại phân công"
     sau khi họ vào lần đầu. Câu nhiệm vụ đã lưu nên không mất. */
  async function ganPhanCong(pcMoi) {
    if (!pcMoi.length) return 'Không có dòng phân công nào để gán.';
    const s = sb();
    const theoMail = {};
    NGUOI.forEach(n => { theoMail[sanh(n.email)] = n; });

    /* Khử trùng ngay trong mẻ. Hai dòng cùng khoá trong CÙNG một lệnh ghi làm
       Postgres từ chối cả mẻ: "ON CONFLICT DO UPDATE command cannot affect
       row a second time" — mất trắng phân công của 38 người vì một câu viết
       lặp của một người. */
    const co = [], chua = {}, daCo = {}, aiCo = {};
    pcMoi.forEach(p => {
      const n = theoMail[p.email];
      if (!n) { chua[p.ho_ten] = true; return; }
      const k = n.id + '|' + p.lop + '|' + (p.mon || '');
      if (daCo[k]) return;
      daCo[k] = true;
      aiCo[n.id] = true;
      co.push({
        nguoi_dung_id: n.id, nam_hoc: CAU_HINH.NAM_HOC,
        lop: p.lop, mon_ma: p.mon, la_chu_nhiem: !!p.cn
      });
    });
    const soChua = Object.keys(chua).length;
    if (!co.length) {
      return 'Chưa gán được dòng phân công nào — ' + soChua
        + ' thầy cô chưa đăng nhập lần nào. Sau khi họ vào, bấm "Gán lại phân công".';
    }

    /* XOÁ PHÂN CÔNG CŨ CỦA ĐÚNG NHỮNG NGƯỜI SẮP GHI, rồi mới ghi lại.
       Hai lý do bắt buộc:

       1. Ràng buộc duy nhất có cột mon_ma cho phép NULL, mà PostgreSQL coi
          hai NULL là KHÁC nhau. Dòng chủ nhiệm luôn mang mon_ma = NULL nên
          "ghi đè nếu trùng" không bao giờ khớp — mỗi lần bấm lại là đẻ thêm
          một bộ dòng chủ nhiệm mới, ba lần bấm là 45 dòng rác.
       2. Thầy A năm ngoái dạy 9A, năm nay dạy 8A. Không xoá dòng cũ thì thầy
          GIỮ QUYỀN XEM LỚP 9A vĩnh viễn — đây là rò rỉ quyền thật, không chỉ
          là rác dữ liệu.

       Chỉ xoá đúng năm học đang làm và đúng những người có tên trong mẻ này,
       nên không đụng phân công ai khác. */
    const ids = Object.keys(aiCo);
    for (let i = 0; i < ids.length; i += 50) {
      const x = await s.from('phan_cong_day').delete()
        .eq('nam_hoc', CAU_HINH.NAM_HOC).in('nguoi_dung_id', ids.slice(i, i + 50));
      if (x.error) return '⚠ Chưa dọn được phân công cũ: ' + x.error.message;
    }

    const r = await s.from('phan_cong_day').insert(co).select('id');
    if (r.error) return '⚠ Phân công CHƯA ghi được: ' + r.error.message;
    const soGhi = (r.data || []).length;
    return 'Đã gán ' + soGhi + '/' + co.length + ' dòng phân công cho '
      + ids.length + ' thầy cô (đã dọn phân công cũ của năm học này)'
      + (soChua ? '. Còn ' + soChua + ' thầy cô chưa đăng nhập lần nào nên chưa gán được — '
                + 'sau khi họ vào, bấm "Gán lại phân công".' : '.');
  }

  /* Gán lại từ câu nhiệm vụ đã lưu — dùng khi thầy cô mới đăng nhập lần đầu */
  async function ganLaiPhanCong(hop) {
    HOP = hop;
    const pcMoi = [];
    const nvLoi = [];
    DS.forEach(d => {
      const r = HS_NS[d.email];
      if (!r || !r.nhiem_vu) return;
      const t = tachNhiemVu(r.nhiem_vu, MON);
      t.loi.forEach(x => nvLoi.push((d.ho_ten || d.email) + ': ' + x));
      t.ra.forEach(x => pcMoi.push(Object.assign({ email: sanh(d.email), ho_ten: d.ho_ten }, x)));
    });
    if (!pcMoi.length) {
      bao('Không có câu nhiệm vụ nào đọc được. Nạp danh sách có cột "Nhiệm vụ phân công" trước đã.');
      return;
    }
    if (!await xacNhan('Gán lại ' + pcMoi.length + ' dòng phân công cho năm học '
      + CAU_HINH.NAM_HOC + '?\n\nLấy từ câu nhiệm vụ đã lưu trong danh sách.\n'
      + 'Dòng phân công cũ trùng lớp và môn thì ghi đè, không nhân đôi.')) return;
    const kq = await ganPhanCong(pcMoi);
    bao(kq);
    ve(hop);
  }

  /* ==========================================================================
     ĐỒNG BỘ VAI TRÒ SANG TÀI KHOẢN THẬT
     ========================================================================== */
  async function dongBoVaiTro(hop) {
    HOP = hop;
    const s = sb();
    const lech = DS.filter(d => {
      const n = NGUOI.find(x => sanh(x.email) === sanh(d.email));
      return n && n.vai_tro !== d.vai_tro;
    });
    if (!lech.length) {
      bao('Không có ai lệch vai trò — danh sách và tài khoản đã khớp nhau.');
      return;
    }
    const mo = lech.map(d => {
      const n = NGUOI.find(x => sanh(x.email) === sanh(d.email));
      return '· ' + (d.ho_ten || d.email) + ': ' + (TEN_VAI[n.vai_tro] || n.vai_tro)
           + ' → ' + (TEN_VAI[d.vai_tro] || d.vai_tro);
    }).join('\n');

    if (!await xacNhan('Đổi quyền THẬT của ' + lech.length + ' tài khoản?\n\n' + mo
      + '\n\n⚠ Đây là quyền dùng hệ thống, không phải chữ in ra văn bản. '
      + 'Nâng nhầm ai lên tổ trưởng là người đó chấm được tự đánh giá và xem hồ sơ toàn trường.'
      + '\n\nThầy cô đồng ý chứ?')) return;

    const r = await s.rpc('dong_bo_vai_tro_tu_danh_sach');
    if (r.error) { bao('Chưa đồng bộ được: ' + r.error.message); return; }
    const so = (r.data || []).length;
    bao(so ? ('Đã đổi quyền cho ' + so + ' tài khoản. Người đang mở trang phải tải lại trang mới thấy quyền mới.')
           : 'Không tài khoản nào cần đổi.');
    ve(hop);
  }

  /* ==========================================================================
     ĐĂNG KÝ TAB VÀO BẢNG QUẢN TRỊ
     ========================================================================== */
  window.qtTabPhu = window.qtTabPhu || [];
  window.qtTabPhu.push({
    ma: 'ns',
    ten: 'Danh sách CBGV-NV',
    tt: 30,
    ve: function (hop) { HOP = hop; return ve(hop); }
  });
})();
