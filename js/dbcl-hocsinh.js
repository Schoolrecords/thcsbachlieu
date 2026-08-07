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

  /* ========================================================================
     TẢI DỮ LIỆU
     ======================================================================== */
  async function tai() {
    const [mh, hs] = await Promise.all([
      sb.from('mon_hoc').select('*').order('so_tt'),
      sb.from('hoc_sinh_lop').select('*, hoc_sinh(*)').eq('nam_hoc', NAM).order('lop')
    ]);
    MON = mh.data || [];
    DS = (hs.data || []).filter(r => r.hoc_sinh);
    DS.sort((a, b) => (a.lop || '').localeCompare(b.lop || '', 'vi')
      || (a.hoc_sinh.ho_ten || '').localeCompare(b.hoc_sinh.ho_ten || '', 'vi'));
  }

  /* ========================================================================
     MÀN HÌNH
     ======================================================================== */
  async function ve(hop, namHoc) {
    if (namHoc) NAM = namHoc;
    if (!sb) sb = window.sbClient;
    if (!sb) { hop.innerHTML = '<div class="hs-canh">Thầy cô đăng nhập để xem phần này.</div>'; return; }

    hop.innerHTML = '<p style="color:#8a94a6;font-size:13.4px">Đang tải dữ liệu học sinh…</p>';
    try { await tai(); }
    catch (e) { hop.innerHTML = '<div class="hs-canh">Không tải được: ' + chan(e.message) + '</div>'; return; }

    if (!MON.length) {
      hop.innerHTML = '<div class="hs-canh">Cơ sở dữ liệu chưa có danh mục môn học. '
        + 'Kiểm tra đã chạy tệp <code>sql/17</code> chưa.</div>';
      return;
    }

    const lops = Array.from(new Set(DS.map(r => r.lop))).sort((a, b) => a.localeCompare(b, 'vi'));
    const loc = LOP ? DS.filter(r => r.lop === LOP) : DS;
    const qt = laQuanTri();

    /* ---- Hai khối việc ---- */
    let html = '<div class="hs-buoc">'
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

    if (qt) {
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
    const sl = document.getElementById('hsLop');
    if (sl) sl.addEventListener('change', function () { LOP = this.value; ve(hop); });
    ganNut(hop);
  }

  function ganNut(hop) {
    const g = (id, fn) => { const e = document.getElementById(id); if (e) e.addEventListener('click', fn); };
    g('hsMauDS', mauDanhSach);
    g('hsMauKQ', mauKetQua);
    g('hsLenDS', () => chonTep('ds'));
    g('hsLenKQ', () => chonTep('kq'));
    g('hsTinh', tinhChiTieu);
  }

  /* ========================================================================
     MẪU EXCEL
     ======================================================================== */
  function mauDanhSach() {
    if (!coThuVien()) return;
    const hang = [
      ['MẪU KHAI BÁO DANH SÁCH HỌC SINH — ' + (CAU_HINH.TEN_TRUONG || '')],
      ['Năm học', NAM],
      [],
      ['Hướng dẫn: Mã học sinh lấy ĐÚNG mã đang dùng trên VnEdu, giữ nguyên suốt cấp học.'],
      ['Cột Hoà nhập ghi x nếu em học hoà nhập — Thông tư 22 đánh giá theo quy định riêng.'],
      ['Cột Miễn/giảm môn ghi tên môn được miễn, ví dụ: Giáo dục thể chất.'],
      ['Trạng thái: Đang học / Chuyển đi / Bảo lưu / Thôi học. Để trống nghĩa là Đang học.'],
      [],
      ['Mã học sinh', 'Họ và tên', 'Ngày sinh', 'Giới tính', 'Lớp',
       'Hoà nhập', 'Miễn/giảm môn', 'Ngày vào học', 'Trạng thái']
    ];
    if (DS.length) {
      DS.forEach(r => {
        const h = r.hoc_sinh;
        hang.push([h.ma, h.ho_ten, h.ngay_sinh || '', h.gioi_tinh || '', r.lop,
          h.hoa_nhap ? 'x' : '', h.mien_giam_mon || '', r.ngay_vao || '', TEN_TT[r.trang_thai] || '']);
      });
    } else {
      hang.push(['HS0001', 'Nguyễn Văn A', '2014-05-20', 'Nam', '6A', '', '', '', '']);
      hang.push(['HS0002', 'Trần Thị B', '2014-11-03', 'Nữ', '6A', 'x', 'Giáo dục thể chất', '', '']);
    }
    xuat(hang, [{ wch: 14 }, { wch: 26 }, { wch: 12 }, { wch: 9 }, { wch: 8 },
                { wch: 10 }, { wch: 22 }, { wch: 13 }, { wch: 13 }],
         'Danh sach HS', 'mau-danh-sach-hoc-sinh-' + NAM + '.xlsx');
    notify('Đã tải mẫu danh sách học sinh. Điền xong bấm "Tải danh sách lên".');
  }

  function mauKetQua() {
    if (!coThuVien()) return;
    if (!DS.length) { notify('Chưa có danh sách học sinh, chưa tạo được mẫu kết quả.'); return; }
    const cotMon = MON.map(m => m.ten + (m.kieu === 'dat' ? ' (Đ/CĐ)' : ''));
    const hang = [
      ['MẪU NHẬP KẾT QUẢ HỌC TẬP — ' + (CAU_HINH.TEN_TRUONG || '')],
      ['Năm học', NAM, 'Kỳ', 'ghi ca_nam hoặc hoc_ki_1 vào ô bên cạnh', ''],
      [],
      ['Hướng dẫn: KHÔNG sửa cột Mã học sinh — hệ thống ghép theo cột này.'],
      ['Môn tính điểm ghi số từ 0 đến 10. Môn đánh giá Đạt ghi Đ hoặc CĐ.'],
      ['Cột Rèn luyện ghi: Tốt / Khá / Đạt / Chưa đạt.'],
      ['Cột Lên lớp chỉ điền khi nhập kết quả cả năm: ghi x nếu được lên lớp.'],
      [],
      ['Mã học sinh', 'Họ và tên', 'Lớp'].concat(cotMon).concat(['Rèn luyện', 'Lên lớp'])
    ];
    DS.filter(r => r.trang_thai === 'dang_hoc').forEach(r => {
      hang.push([r.hoc_sinh.ma, r.hoc_sinh.ho_ten, r.lop].concat(MON.map(() => '')).concat(['', '']));
    });
    const cols = [{ wch: 14 }, { wch: 26 }, { wch: 8 }]
      .concat(MON.map(() => ({ wch: 13 }))).concat([{ wch: 12 }, { wch: 9 }]);
    xuat(hang, cols, 'Ket qua', 'mau-ket-qua-hoc-tap-' + NAM + '.xlsx');
    notify('Đã tải mẫu kết quả với ' + DS.filter(r => r.trang_thai === 'dang_hoc').length
      + ' học sinh đang học. Nhớ ghi rõ kỳ ở dòng 2.');
  }

  function xuat(hang, cols, ten, tep) {
    const ws = XLSX.utils.aoa_to_sheet(hang);
    ws['!cols'] = cols;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, ten);
    XLSX.writeFile(wb, tep);
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

  function timDongTieuDe(hang, khoa) {
    for (let i = 0; i < Math.min(hang.length, 20); i++) {
      const d = (hang[i] || []).map(x => String(x).trim().toLowerCase());
      if (d.some(x => x.indexOf(khoa) >= 0)) return i;
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
    const hang = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });

    const iTd = timDongTieuDe(hang, 'mã học sinh');
    if (iTd < 0) {
      notify('Không tìm thấy dòng tiêu đề có cột "Mã học sinh". Thầy cô dùng đúng mẫu do hệ thống tải xuống.');
      return;
    }
    const td = hang[iTd].map(x => String(x).trim());
    const cot = {};
    td.forEach((t, i) => { cot[t.toLowerCase()] = i; });
    const than = hang.slice(iTd + 1).filter(d => String(d[cot['mã học sinh']] || '').trim() !== '');

    if (!than.length) { notify('Tệp không có dòng dữ liệu nào.'); return; }
    if (CHE_DO === 'ds') return napDanhSach(than, cot, tep.name);
    return napKetQua(than, cot, td, hang, tep.name);
  }

  /* ---------------- Nạp danh sách học sinh ---------------- */
  async function napDanhSach(than, cot, tenTep) {
    const c = (d, ten) => String(d[cot[ten]] == null ? '' : d[cot[ten]]).trim();
    const hs = [], hl = [], loi = [];
    const daGap = {};

    than.forEach((d, i) => {
      const ma = c(d, 'mã học sinh');
      const ten = c(d, 'họ và tên');
      const lop = c(d, 'lớp');
      const dong = i + 1;
      if (daGap[ma]) { loi.push('Dòng ' + dong + ': mã ' + ma + ' bị lặp'); return; }
      if (!ten) { loi.push('Dòng ' + dong + ': thiếu họ tên'); return; }
      if (!lop) { loi.push('Dòng ' + dong + ': thiếu lớp'); return; }
      const khoi = khoiTuLop(lop);
      if (!khoi || khoi < 6 || khoi > 9) {
        loi.push('Dòng ' + dong + ': lớp "' + lop + '" không suy ra được khối 6 đến 9'); return;
      }
      daGap[ma] = true;
      const tt = c(d, 'trạng thái').toLowerCase();
      hs.push({
        ma: ma, ho_ten: ten,
        ngay_sinh: c(d, 'ngày sinh') || null,
        gioi_tinh: ['Nam', 'Nữ'].indexOf(c(d, 'giới tính')) >= 0 ? c(d, 'giới tính') : null,
        hoa_nhap: /^(x|có|1|true)$/i.test(c(d, 'hoà nhập') || c(d, 'hòa nhập')),
        mien_giam_mon: c(d, 'miễn/giảm môn') || null
      });
      hl.push({
        hoc_sinh_ma: ma, nam_hoc: NAM, lop: lop, khoi: khoi,
        ngay_vao: c(d, 'ngày vào học') || null,
        trang_thai: tt.indexOf('chuyển') >= 0 ? 'chuyen_di'
                  : tt.indexOf('bảo lưu') >= 0 ? 'bao_luu'
                  : tt.indexOf('thôi') >= 0 ? 'thoi_hoc' : 'dang_hoc'
      });
    });

    if (loi.length) {
      notify(loi.length + ' dòng có lỗi, chưa nạp gì cả. Lỗi đầu tiên: ' + loi[0]);
      return;
    }
    if (!window.confirm('Nạp ' + hs.length + ' học sinh vào năm học ' + NAM
      + ' từ tệp "' + tenTep + '"?\n\n'
      + 'Em nào đã có thì cập nhật lại thông tin và lớp.\n'
      + 'Kết quả học tập đã nhập trước đó không bị đụng tới.')) return;

    const a = await sb.from('hoc_sinh').upsert(hs, { onConflict: 'ma' });
    if (a.error) { notify('Chưa nạp được danh sách: ' + a.error.message); return; }
    const b = await sb.from('hoc_sinh_lop').upsert(hl, { onConflict: 'hoc_sinh_ma,nam_hoc' });
    if (b.error) { notify('Nạp được học sinh nhưng chưa gán lớp: ' + b.error.message); return; }

    notify('Đã nạp ' + hs.length + ' học sinh cho năm học ' + NAM + '.');
    ve(document.getElementById('dbclKhac'));
  }

  /* ---------------- Nạp kết quả học tập ---------------- */
  async function napKetQua(than, cot, td, hangGoc, tenTep) {
    /* Kỳ ghi ở dòng 2 của mẫu */
    let ky = 'ca_nam';
    hangGoc.slice(0, 6).forEach(d => {
      const s = (d || []).map(x => String(x).trim());
      const i = s.indexOf('Kỳ');
      if (i >= 0 && /hoc_ki_1|học kỳ i|hk1/i.test(s[i + 1] || '')) ky = 'hoc_ki_1';
    });

    const coMa = {};
    DS.forEach(r => { coMa[r.hoc_sinh.ma] = r; });

    /* Ánh xạ cột môn theo tên trong tiêu đề */
    const cotMon = [];
    MON.forEach(m => {
      const i = td.findIndex(t => t.replace(/\s*\(.*\)\s*$/, '').trim().toLowerCase()
        === m.ten.toLowerCase());
      if (i >= 0) cotMon.push({ mon: m, i: i });
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
    than.forEach(d => {
      const ma = String(d[iMa] == null ? '' : d[iMa]).trim();
      if (!coMa[ma]) { maLa.push(ma); return; }
      daCo[ma] = true;
      cotMon.forEach(x => {
        const v = String(d[x.i] == null ? '' : d[x.i]).trim();
        if (!v) return;
        if (x.mon.kieu === 'diem') {
          const n = parseFloat(v.replace(',', '.'));
          if (isNaN(n) || n < 0 || n > 10) return;
          kq.push({ nam_hoc: NAM, ky: ky, hoc_sinh_ma: ma, mon_ma: x.mon.ma, diem: n, muc: null });
        } else {
          const m = /^(đ|d|đạt|dat)$/i.test(v) ? 'D' : /^(cđ|cd|chưa đạt)$/i.test(v) ? 'CD' : null;
          if (!m) return;
          kq.push({ nam_hoc: NAM, ky: ky, hoc_sinh_ma: ma, mon_ma: x.mon.ma, diem: null, muc: m });
        }
      });
      if (iRL >= 0) {
        const v = String(d[iRL] == null ? '' : d[iRL]).trim();
        if (['Tốt', 'Khá', 'Đạt', 'Chưa đạt'].indexOf(v) >= 0) {
          rl.push({ nam_hoc: NAM, ky: ky, hoc_sinh_ma: ma, muc: v });
        }
      }
      if (iLL >= 0 && ky === 'ca_nam') {
        const v = String(d[iLL] == null ? '' : d[iLL]).trim();
        if (v) ll.push({ ma: ma, len: /^(x|có|1|true)$/i.test(v) });
      }
    });

    const thieu = DS.filter(r => r.trang_thai === 'dang_hoc' && !daCo[r.hoc_sinh.ma]);

    /* Ba con số bắt buộc hiện trước khi ghi */
    let hoi = 'Tệp "' + tenTep + '" — nạp kết quả '
      + (ky === 'hoc_ki_1' ? 'HỌC KỲ I' : 'CẢ NĂM') + ' năm học ' + NAM + '.\n\n'
      + '✔ Khớp mã: ' + Object.keys(daCo).length + ' học sinh, ' + kq.length + ' ô điểm\n';
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
    if (rl.length) {
      await sb.from('hs_ren_luyen').upsert(rl, { onConflict: 'nam_hoc,ky,hoc_sinh_ma' });
    }
    for (const x of ll) {
      await sb.from('hoc_sinh_lop').update({ len_lop: x.len })
        .eq('hoc_sinh_ma', x.ma).eq('nam_hoc', NAM);
    }

    notify('Đã nạp ' + kq.length + ' ô điểm cho ' + Object.keys(daCo).length + ' học sinh'
      + (maLa.length ? ', bỏ qua ' + maLa.length + ' mã lạ' : '')
      + '. Bấm "Tính lại 33 chỉ tiêu" để cập nhật các phụ lục.');
    ve(document.getElementById('dbclKhac'));
  }

  /* ========================================================================
     TÍNH 33 CHỈ TIÊU TỪ DỮ LIỆU HỌC SINH
     ======================================================================== */
  async function tinhChiTieu() {
    const sel = document.getElementById('hsTinhKy');
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
