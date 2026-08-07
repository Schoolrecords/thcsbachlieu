/* ============================================================================
   CAM KẾT CHUẨN ĐẦU RA TỚI TỪNG HỌC SINH

   Đây là nội dung Quyết định 1426 và 2616 của Sở GD&ĐT Nghệ An yêu cầu:
   "Cam kết chuẩn đầu ra với học sinh, phụ huynh CỤ THỂ TRÊN TỪNG HỌC SINH
    tương ứng với TỪNG MÔN — làm rõ THỰC TRẠNG và CHUẨN ĐẦU RA với từng
    học sinh tương ứng với từng môn học."
   Trong bảng tự soát, đây là dòng TS13, gắn với tiêu chí 3.5 Thông tư 57.

   HAI CON SỐ CHO MỖI EM MỖI MÔN
     · Thực trạng   — kết quả CẢ NĂM của năm học trước, máy tự lấy.
                      Khối 6 mới vào thì chưa có, để trống là đúng.
     · Chuẩn đầu ra — mục tiêu giáo viên đặt cho em đó. Có nút nâng hàng loạt
                      cả lớp rồi chỉnh riêng vài em, khỏi gõ từng ô.

   IN RA GIẤY
     · Phiếu từng học sinh — mỗi em một trang, đủ các môn, có chỗ ký của
       học sinh và cha mẹ học sinh. Đây là bản đi ký thật.
     · Bảng tổng hợp cả lớp theo môn — để giáo viên bộ môn lưu hồ sơ.

   AI SỬA ĐƯỢC
   Giáo viên chỉ đặt được chuẩn đầu ra cho ĐÚNG lớp và môn mình dạy, hoặc
   lớp mình chủ nhiệm. Hàng rào thật nằm ở máy chủ (chính sách hsck_sua);
   giao diện chỉ khoá trước cho đỡ bấm nhầm.
   ============================================================================ */

(function () {
  'use strict';

  if (typeof CAU_HINH === 'undefined' || !CAU_HINH.DA_NOI) return;

  let sb = null;
  let NAM = CAU_HINH.NAM_HOC || '2026-2027';
  let LOP = '', MONMA = '';
  let MON = [], DS = [], PHAN_CONG = [];
  let CK = {};        // "ma|mon" -> bản ghi cam kết
  let TT = {};        // "ma|mon" -> thực trạng năm trước

  const css = `
  .ck-bar{display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin-bottom:13px}
  .ck-bar label{font-size:13.2px;font-weight:600;color:var(--muted)}
  .ck-bar select,.ck-bar input{padding:8px 11px;border:1.5px solid #d7dde8;border-radius:9px;
    font-size:13.4px;font-family:inherit;background:#fff}
  .ck-bang{width:100%;border-collapse:collapse;font-size:13.6px}
  .ck-bang th{background:#eef3fb;color:var(--navy);font-weight:700;padding:9px 8px;
    border:1px solid #dbe3ef;font-size:12.6px;white-space:nowrap}
  .ck-bang td{border:1px solid #e4e9f2;padding:5px 8px;vertical-align:middle}
  .ck-bang td.l{text-align:left}
  .ck-bang td.c{text-align:center}
  .ck-bang input,.ck-bang select{width:100%;padding:6px 8px;border:1px solid #dde3ed;
    border-radius:7px;font-size:13.2px;font-family:inherit;text-align:center;background:#fff}
  .ck-bang input:disabled,.ck-bang select:disabled{background:#f4f6fa;color:#9aa4b5}
  .ck-bang input.luu{border-color:#4ade80;background:#f2fdf6}
  .ck-tt{font-weight:700;color:var(--navy-2)}
  .ck-tt.trong{color:#b9c2d0;font-weight:400;font-style:italic}
  .ck-len{color:#15803d;font-weight:700;font-size:12.4px}
  .ck-xuong{color:#b3261e;font-weight:700;font-size:12.4px}
  .ck-canh{background:#fdf3f2;border:1px solid #f3c9c5;color:#8a3428;border-radius:10px;
    padding:12px 15px;font-size:13.2px;margin:12px 0;line-height:1.65}
  .ck-ok{background:#f2fdf6;border-color:#bfe8cd;color:#1a6437}
  .ck-tin{background:#eef4ff;border-color:#cfe0ff;color:#1d4ed8}
  .ck-tk{display:flex;gap:20px;flex-wrap:wrap;font-size:13.2px;color:var(--muted);margin:10px 0}
  .ck-tk b{color:var(--navy);font-size:16px;font-family:var(--serif)}
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
  function namTruoc(n) {
    const m = String(n).match(/^(\d{4})-(\d{4})$/);
    return m ? (parseInt(m[1], 10) - 1) + '-' + (parseInt(m[2], 10) - 1) : null;
  }
  /* Đúng bằng chính sách hsck_sua đặt ở máy chủ.
     So tên lớp phải CHUẨN HOÁ hoa thường và khoảng trắng, y như máy chủ làm
     (upper(btrim(...)) từ tệp sql/23). Bản cũ so === thô, nên tệp phân công
     ghi "6a" còn danh sách ghi "6A" là ô nhập bị khoá kèm câu "không được
     phân công dạy môn này" — thầy cô đi tìm một lỗi phân công không có thật,
     mà máy chủ thì đã cho ghi rồi. */
  function chuanLop(s) { return String(s || '').trim().toUpperCase(); }
  function suaDuoc(lop, monMa) {
    if (laQuanTri()) return true;
    return PHAN_CONG.some(p => chuanLop(p.lop) === chuanLop(lop)
      && (p.mon_ma === monMa || p.la_chu_nhiem));
  }
  function monHienTai() { return MON.find(m => m.ma === MONMA) || MON[0]; }

  /* ========================================================================
     TẢI DỮ LIỆU

     Máy chủ chỉ trả tối đa 1000 dòng mỗi lần hỏi. Trường có khoảng 616 học
     sinh × 12 môn ≈ 7.400 dòng kết quả, nên phải đọc theo trang cho tới hết.
     Nếu không, bộ nhớ trang chỉ có 1000 dòng đầu và tưởng những em còn lại
     CHƯA có cam kết — bấm "Đặt chuẩn đầu ra cả lớp" là ghi đè mất số thật.

     BẮT BUỘC PHẢI CÓ .order('id'): không ghi rõ sắp xếp thì máy chủ được
     quyền trả hai trang theo hai thứ tự khác nhau, dòng bị đọc trùng hoặc
     rơi mất mà không báo gì. Sắp theo khoá chính id cho thứ tự cố định.
     ======================================================================== */
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
      if (tuDau > 60000) break;         // chặn vòng lặp vô tận
    }
    return gom;
  }

  async function tai() {
    const nt = namTruoc(NAM);
    const u = window.NGUOI_DUNG;
    const [mh, hsD, ckD, kqD, pc] = await Promise.all([
      sb.from('mon_hoc').select('*').order('so_tt'),
      taiHet('hoc_sinh_lop', '*, hoc_sinh(*)', [['nam_hoc', NAM], ['trang_thai', 'dang_hoc']]),
      taiHet('hs_cam_ket', '*', [['nam_hoc', NAM]]),
      nt ? taiHet('hs_ket_qua', 'hoc_sinh_ma, mon_ma, diem, muc',
                  [['nam_hoc', nt], ['ky', 'ca_nam']])
         : Promise.resolve([]),
      u ? sb.from('phan_cong_day').select('*').eq('nam_hoc', NAM).eq('nguoi_dung_id', u.id)
        : Promise.resolve({ data: [] })
    ]);
    /* Thư viện Supabase KHÔNG ném lỗi — nó trả { data: null, error }. Không
       soi .error thì màn hình hiện ra "chưa có em nào cam kết", rồi nút "Đặt
       chuẩn đầu ra cả lớp" ghi đè lên số thật đang có dưới cơ sở dữ liệu. */
    if (mh.error) throw mh.error;
    if (pc.error) throw pc.error;
    const hs = { data: hsD }, ck = { data: ckD }, kq = { data: kqD };

    MON = mh.data || [];
    PHAN_CONG = pc.data || [];
    DS = (hs.data || []).filter(r => r.hoc_sinh);
    DS.sort((a, b) => (a.lop || '').localeCompare(b.lop || '', 'vi')
      || (a.hoc_sinh.ho_ten || '').localeCompare(b.hoc_sinh.ho_ten || '', 'vi'));

    CK = {}; (ck.data || []).forEach(r => { CK[r.hoc_sinh_ma + '|' + r.mon_ma] = r; });
    /* Đổi mã cơ sở dữ liệu sang ký hiệu Thông tư 22 ngay lúc nạp. Trước đây
       giữ nguyên 'D'/'CD', nên phiếu cam kết đưa học sinh và cha mẹ học sinh
       ký ghi thực trạng môn Giáo dục thể chất là "CD" — phụ huynh không hiểu,
       mà cũng sai ký hiệu quy định. */
    TT = {}; (kq.data || []).forEach(r => {
      TT[r.hoc_sinh_ma + '|' + r.mon_ma] = r.diem != null ? r.diem
        : (r.muc === 'D' ? 'Đ' : r.muc === 'CD' ? 'CĐ' : null);
    });
    if (!MONMA && MON.length) MONMA = MON[0].ma;
  }

  /* ========================================================================
     MÀN HÌNH
     ======================================================================== */
  async function ve(hop, namHoc) {
    if (namHoc) NAM = namHoc;
    if (!sb) sb = window.sbClient;
    if (!sb) { hop.innerHTML = '<div class="ck-canh">Thầy cô đăng nhập để xem phần này.</div>'; return; }

    hop.innerHTML = '<p style="color:#8a94a6;font-size:13.4px">Đang tải…</p>';
    try { await tai(); }
    catch (e) {
      console.error('[Cam kết HS] Không tải được:', e);
      hop.innerHTML = '<div class="ck-canh"><b>Chưa đọc được dữ liệu cam kết.</b><br>'
        + 'Thầy cô thử đăng nhập lại. Nếu vẫn vậy thì tài khoản chưa được phân công '
        + 'lớp nào trong năm học này — báo quản trị giúp em.<br>'
        + '<span style="font-size:12.4px;color:#a0564a">Chi tiết: ' + chan(e.message) + '</span></div>';
      return;
    }

    if (!DS.length) {
      hop.innerHTML = '<div class="ck-canh ck-tin"><b>Năm học ' + chan(NAM)
        + ' chưa có học sinh nào đang học.</b><br>'
        + 'Sang tab <b>Học sinh</b> khai báo danh sách trước đã — cam kết phải gắn với từng em cụ thể.</div>';
      return;
    }

    /* Chốt danh mục môn trước khi dùng. Thiếu chốt này thì monHienTai() trả
       undefined, dòng suaDuoc(LOP, mon.ma) ném TypeError NGOÀI try/catch, mà
       veTatCa gọi hàm này không await nên lỗi rơi vào hư không — màn hình
       đứng nguyên chữ "Đang tải…" cho tới khi tải lại trang. Hai màn hình anh
       em đã có chốt này, riêng đây bị sót. */
    if (!MON.length) {
      hop.innerHTML = '<div class="ck-canh">Chưa có danh mục môn học. '
        + 'Kiểm tra đã chạy tệp <code>sql/17</code> chưa.</div>';
      return;
    }

    const lops = Array.from(new Set(DS.map(r => r.lop))).sort((a, b) => a.localeCompare(b, 'vi'));
    if (!LOP || lops.indexOf(LOP) < 0) LOP = lops[0];
    const mon = monHienTai();
    const loc = DS.filter(r => r.lop === LOP);
    const sua = suaDuoc(LOP, mon.ma);
    const nt = namTruoc(NAM);

    /* ---- Thanh chọn ---- */
    let html = '<div class="ck-bar">'
      + '<label>Lớp</label><select id="ckLop">'
      + lops.map(l => '<option value="' + chan(l) + '"' + (l === LOP ? ' selected' : '') + '>'
          + chan(l) + ' (' + DS.filter(r => r.lop === l).length + ' em)</option>').join('')
      + '</select>'
      + '<label>Môn</label><select id="ckMon">'
      + MON.map(m => '<option value="' + m.ma + '"' + (m.ma === MONMA ? ' selected' : '') + '>'
          + chan(m.ten) + '</option>').join('')
      + '</select>'
      + (sua && mon.kieu === 'diem'
          ? '<label>Nâng cả lớp</label><select id="ckMuc">'
            + '<option value="0.1">+0,1 điểm</option><option value="0.3" selected>+0,3 điểm</option>'
            + '<option value="0.5">+0,5 điểm</option><option value="1">+1,0 điểm</option></select>'
            + '<button class="btn btn-out" id="ckNang">⬆ Đặt chuẩn đầu ra cả lớp</button>'
          : '')
      + '</div>';

    /* ---- Đếm đã cam kết ---- */
    let daCK = 0, thieuTT = 0;
    loc.forEach(r => {
      if (CK[r.hoc_sinh.ma + '|' + mon.ma]) daCK++;
      if (TT[r.hoc_sinh.ma + '|' + mon.ma] == null) thieuTT++;
    });
    html += '<div class="ck-tk">'
      + '<span>Lớp <b>' + chan(LOP) + '</b></span>'
      + '<span>Môn <b>' + chan(mon.ten) + '</b></span>'
      + '<span>Đã đặt chuẩn đầu ra: <b>' + daCK + '/' + loc.length + '</b></span>'
      + '</div>';

    if (thieuTT === loc.length) {
      html += '<div class="ck-canh ck-tin">Chưa có kết quả cả năm ' + chan(nt || '(năm trước)')
        + ' để làm thực trạng. Với khối 6 mới vào thì đúng là chưa có — thầy cô đặt chuẩn đầu ra '
        + 'căn cứ khảo sát đầu năm. Với các khối khác, sang tab <b>Học sinh</b> tải kết quả năm trước lên.</div>';
    }
    if (!sua) {
      html += '<div class="ck-canh">Tài khoản của thầy cô không được phân công dạy môn <b>'
        + chan(mon.ten) + '</b> ở lớp <b>' + chan(LOP) + '</b> nên chỉ xem được.</div>';
    }

    /* ---- Nút in ---- */
    html += '<div class="db-cong">'
      + '<button class="btn btn-pri" id="ckInPhieu">🖨 In phiếu cam kết từng học sinh (lớp ' + chan(LOP) + ')</button>'
      + '<button class="btn btn-out" id="ckInBang">📄 Bảng tổng hợp lớp ' + chan(LOP) + ' môn ' + chan(mon.ten) + '</button>'
      + '</div>';

    /* ---- Bảng ---- */
    const laDiem = mon.kieu === 'diem';
    html += '<div class="tbl-wrap"><table class="ck-bang"><tr>'
      + '<th style="width:5%">TT</th><th style="width:12%">Mã học sinh</th>'
      + '<th style="width:28%;text-align:left">Họ và tên</th>'
      + '<th style="width:14%">Thực trạng<br><span style="font-weight:400">' + chan(nt || '—') + '</span></th>'
      + '<th style="width:15%">Chuẩn đầu ra<br><span style="font-weight:400">cam kết</span></th>'
      + '<th style="width:9%">Chênh</th>'
      + '<th style="width:8%">HS ký</th><th style="width:9%">CMHS ký</th></tr>';

    loc.forEach((r, i) => {
      const h = r.hoc_sinh, k = h.ma + '|' + mon.ma;
      const c = CK[k] || {};
      const tt = TT[k];
      const camKet = laDiem ? (c.diem_cam_ket != null ? c.diem_cam_ket : '') : (c.muc_cam_ket || '');
      let chenh = '';
      if (laDiem && tt != null && c.diem_cam_ket != null) {
        const d = Math.round((c.diem_cam_ket - tt) * 100) / 100;
        chenh = d > 0 ? '<span class="ck-len">+' + d + '</span>'
              : d < 0 ? '<span class="ck-xuong">' + d + '</span>' : '0';
      }
      html += '<tr><td class="c">' + (i + 1) + '</td>'
        + '<td class="c"><b>' + chan(h.ma) + '</b></td>'
        + '<td class="l">' + chan(h.ho_ten)
        + (h.hoa_nhap ? ' <i style="color:#6b21a8;font-size:11.6px">(hoà nhập)</i>' : '') + '</td>'
        + '<td class="c"><span class="ck-tt' + (tt == null ? ' trong' : '') + '">'
        + (tt == null ? 'chưa có' : chan(tt)) + '</span></td>'
        + '<td>' + (laDiem
            ? '<input data-ma="' + chan(h.ma) + '" data-cot="diem_cam_ket" value="' + chan(camKet)
              + '" placeholder="vd 8.5"' + (sua ? '' : ' disabled') + '>'
            : '<select data-ma="' + chan(h.ma) + '" data-cot="muc_cam_ket"' + (sua ? '' : ' disabled') + '>'
              + '<option value=""></option>'
              + '<option value="D"' + (camKet === 'D' ? ' selected' : '') + '>Đ</option>'
              + '<option value="CD"' + (camKet === 'CD' ? ' selected' : '') + '>CĐ</option></select>')
        + '</td>'
        + '<td class="c">' + chenh + '</td>'
        + '<td class="c"><input type="checkbox" data-ma="' + chan(h.ma) + '" data-cot="hs_xac_nhan"'
        + (c.hs_xac_nhan ? ' checked' : '') + (sua ? '' : ' disabled') + ' style="width:auto"></td>'
        + '<td class="c"><input type="checkbox" data-ma="' + chan(h.ma) + '" data-cot="ph_xac_nhan"'
        + (c.ph_xac_nhan ? ' checked' : '') + (sua ? '' : ' disabled') + ' style="width:auto"></td></tr>';
    });
    html += '</table></div>';

    hop.innerHTML = html;

    document.getElementById('ckLop').addEventListener('change', function () { LOP = this.value; ve(hop); });
    document.getElementById('ckMon').addEventListener('change', function () { MONMA = this.value; ve(hop); });
    const nn = document.getElementById('ckNang');
    if (nn) nn.addEventListener('click', nangCaLop);
    document.getElementById('ckInPhieu').addEventListener('click', inPhieuTungEm);
    document.getElementById('ckInBang').addEventListener('click', inBangLop);

    if (sua) {
      hop.querySelectorAll('[data-ma]').forEach(el => {
        const su = () => luuO(el);
        if (el.type === 'checkbox' || el.tagName === 'SELECT') el.addEventListener('change', su);
        else el.addEventListener('blur', su);
      });
    }
  }

  /* ========================================================================
     LƯU
     ======================================================================== */
  function banGhi(ma, mon) {
    const c = CK[ma + '|' + mon.ma] || {};
    return {
      nam_hoc: NAM, hoc_sinh_ma: ma, mon_ma: mon.ma,
      diem_cam_ket: c.diem_cam_ket != null ? c.diem_cam_ket : null,
      muc_cam_ket: c.muc_cam_ket || null,
      giao_vien: c.giao_vien || (window.NGUOI_DUNG ? window.NGUOI_DUNG.ho_ten : null),
      ngay_ky: c.ngay_ky || null,
      hs_xac_nhan: !!c.hs_xac_nhan, ph_xac_nhan: !!c.ph_xac_nhan,
      cap_nhat_luc: new Date().toISOString(),
      cap_nhat_boi: window.NGUOI_DUNG ? window.NGUOI_DUNG.id : null
    };
  }

  async function luuO(el) {
    const mon = monHienTai(), ma = el.dataset.ma, cot = el.dataset.cot;
    const b = banGhi(ma, mon);
    if (cot === 'diem_cam_ket') {
      const v = el.value.trim().replace(',', '.');
      if (v === '') b.diem_cam_ket = null;
      else {
        const n = parseFloat(v);
        if (isNaN(n) || n < 0 || n > 10) { notify('Điểm cam kết phải từ 0 đến 10.'); return; }
        b.diem_cam_ket = n;
      }
    } else if (cot === 'muc_cam_ket') {
      b.muc_cam_ket = el.value || null;
    } else {
      b[cot] = el.checked;
    }

    const kq = await sb.from('hs_cam_ket')
      .upsert(b, { onConflict: 'nam_hoc,hoc_sinh_ma,mon_ma' }).select().single();
    if (kq.error) { notify('Chưa lưu được: ' + kq.error.message); return; }
    CK[ma + '|' + mon.ma] = kq.data;
    if (el.classList) { el.classList.add('luu'); setTimeout(() => el.classList.remove('luu'), 900); }
    if (cot === 'diem_cam_ket') ve(document.getElementById('dbclKhac'));
  }

  /* Đặt chuẩn đầu ra cho cả lớp bằng cách nâng từ thực trạng */
  async function nangCaLop() {
    const mon = monHienTai();
    const sel = document.getElementById('ckMuc');
    const buoc = parseFloat(sel ? sel.value : '0.3');
    const loc = DS.filter(r => r.lop === LOP);

    const co = loc.filter(r => TT[r.hoc_sinh.ma + '|' + mon.ma] != null);
    if (!co.length) {
      notify('Không em nào có thực trạng năm trước để nâng. Thầy cô nhập tay hoặc tải kết quả năm trước lên.');
      return;
    }
    const de = loc.filter(r => {
      const c = CK[r.hoc_sinh.ma + '|' + mon.ma];
      return c && c.diem_cam_ket != null;
    }).length;

    const nt = namTruoc(NAM);
    if (!window.confirm('Đặt chuẩn đầu ra môn ' + mon.ten + ' cho cả lớp ' + LOP + ' chứ?\n\n'
      + 'Lấy kết quả cả năm ' + (nt || '(năm trước)') + ' cộng thêm ' + buoc + ' điểm.\n'
      + co.length + ' em có thực trạng sẽ được đặt.\n'
      + (loc.length - co.length ? (loc.length - co.length) + ' em chưa có thực trạng sẽ bỏ qua.\n' : '')
      + (de ? '\n⚠ Sẽ GHI ĐÈ ' + de + ' em đã có chuẩn đầu ra.\n' : '')
      + '\nĐặt xong thầy cô vẫn chỉnh riêng từng em được.')) return;

    const rows = co.map(r => {
      const b = banGhi(r.hoc_sinh.ma, mon);
      let n = parseFloat(TT[r.hoc_sinh.ma + '|' + mon.ma]) + buoc;
      if (isNaN(n)) return null;
      if (n > 10) n = 10;
      b.diem_cam_ket = Math.round(n * 100) / 100;
      return b;
    }).filter(Boolean);

    const kq = await sb.from('hs_cam_ket')
      .upsert(rows, { onConflict: 'nam_hoc,hoc_sinh_ma,mon_ma' }).select();
    if (kq.error) { notify('Chưa đặt được: ' + kq.error.message); return; }
    (kq.data || []).forEach(r => { CK[r.hoc_sinh_ma + '|' + r.mon_ma] = r; });
    notify('Đã đặt chuẩn đầu ra cho ' + (kq.data || []).length + ' em. Thầy cô rà lại rồi chỉnh những em cần khác đi.');
    ve(document.getElementById('dbclKhac'));
  }

  /* ========================================================================
     IN RA GIẤY
     ======================================================================== */
  const TR = "font-family:'Times New Roman',serif;";
  const O = TR + 'border:1px solid #000;padding:4pt 6pt;font-size:11.5pt;';
  const OC = O + 'text-align:center;';

  function ngayThang() {
    const d = new Date();
    return (CAU_HINH.DIA_DANH || 'Yên Thành') + ', ngày ' + d.getDate()
      + ' tháng ' + (d.getMonth() + 1) + ' năm ' + d.getFullYear();
  }
  function dauTrang(phu) {
    return '<table style="width:100%;border-collapse:collapse"><tr>'
      + '<td style="' + TR + 'width:45%;text-align:center;font-size:12pt;vertical-align:top">'
      + chan(CAU_HINH.DON_VI_CHU_QUAN || 'UBND XÃ YÊN THÀNH')
      + '<br><b>' + chan(CAU_HINH.TEN_TRUONG || '').toUpperCase() + '</b></td>'
      + '<td style="' + TR + 'text-align:center;font-size:12pt;vertical-align:top">'
      + '<b>CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br><b>Độc lập - Tự do - Hạnh phúc</b>'
      + '<p style="' + TR + 'font-style:italic;margin:8pt 0 0">' + ngayThang() + '</p></td></tr></table>'
      + (phu || '');
  }
  function goiWord(than, tenTep, tieu) {
    const html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" '
      + 'xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">'
      + '<head><meta charset="utf-8"><title>' + chan(tieu) + '</title>'
      + '<style>@page{size:A4;margin:1.8cm 1.5cm 1.8cm 2.5cm}'
      + 'body{font-family:"Times New Roman",serif;font-size:12pt}'
      + 'table{page-break-inside:auto}tr{page-break-inside:avoid}</style></head><body>'
      + than + '</body></html>';
    const blob = new Blob(['﻿' + html], { type: 'application/msword' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = tenTep;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  }

  /* Mỗi em một trang, đủ các môn, có chỗ ký của em và cha mẹ — bản đi ký thật */
  function inPhieuTungEm() {
    const loc = DS.filter(r => r.lop === LOP);
    if (!loc.length) { notify('Lớp này chưa có học sinh.'); return; }
    const nt = namTruoc(NAM);
    let than = '';

    loc.forEach((r, idx) => {
      const h = r.hoc_sinh;
      let hang = '', coSo = false;
      MON.forEach((m, i) => {
        const k = h.ma + '|' + m.ma;
        const c = CK[k] || {};
        const tt = TT[k];
        const ck = m.kieu === 'diem'
          ? (c.diem_cam_ket != null ? c.diem_cam_ket : '')
          : (c.muc_cam_ket === 'D' ? 'Đ' : c.muc_cam_ket === 'CD' ? 'CĐ' : '');
        if (ck !== '') coSo = true;
        hang += '<tr><td style="' + OC + 'width:6%">' + (i + 1) + '</td>'
          + '<td style="' + O + '">' + chan(m.ten) + '</td>'
          + '<td style="' + OC + 'width:18%">' + chan(tt == null ? '' : tt) + '</td>'
          + '<td style="' + OC + 'width:20%;font-weight:bold">' + chan(ck) + '</td></tr>';
      });

      than += dauTrang()
        + '<p style="' + TR + 'text-align:center;font-size:13.5pt;font-weight:bold;margin:16pt 0 3pt">'
        + 'PHIẾU CAM KẾT CHUẨN ĐẦU RA</p>'
        + '<p style="' + TR + 'text-align:center;font-size:12pt;margin:0 0 3pt">Năm học ' + chan(NAM) + '</p>'
        + '<p style="' + TR + 'text-align:center;font-size:11pt;font-style:italic;margin:0 0 12pt">'
        + 'Theo Kế hoạch số 683/KH-UBND của UBND tỉnh Nghệ An và hướng dẫn của Sở Giáo dục và Đào tạo</p>'
        + '<p style="' + TR + 'font-size:12pt;margin:0 0 3pt">Họ và tên học sinh: <b>' + chan(h.ho_ten) + '</b>'
        + ' &nbsp;&nbsp; Mã học sinh: <b>' + chan(h.ma) + '</b></p>'
        + '<p style="' + TR + 'font-size:12pt;margin:0 0 10pt">Lớp: <b>' + chan(r.lop) + '</b>'
        + (h.ngay_sinh ? ' &nbsp;&nbsp; Ngày sinh: ' + chan(String(h.ngay_sinh).slice(0, 10).split('-').reverse().join('/')) : '')
        + (h.hoa_nhap ? ' &nbsp;&nbsp; <i>(Học hoà nhập — đánh giá theo quy định riêng)</i>' : '')
        + '</p>'
        + '<table style="width:100%;border-collapse:collapse"><tr>'
        + '<td style="' + OC + 'font-weight:bold">TT</td>'
        + '<td style="' + OC + 'font-weight:bold">Môn học, hoạt động giáo dục</td>'
        + '<td style="' + OC + 'font-weight:bold">Thực trạng<br>' + chan(nt || '') + '</td>'
        + '<td style="' + OC + 'font-weight:bold">Chuẩn đầu ra<br>cam kết</td></tr>'
        + hang + '</table>'
        + (coSo ? '' : '<p style="' + TR + 'font-size:11pt;font-style:italic;color:#666;margin:6pt 0 0">'
            + 'Chưa đặt chuẩn đầu ra cho em này.</p>')
        + '<p style="' + TR + 'font-size:12pt;margin:12pt 0 0;text-align:justify">'
        + 'Học sinh và cha mẹ học sinh đã được thông báo, thống nhất với chuẩn đầu ra nêu trên và '
        + 'cam kết phối hợp cùng nhà trường để đạt được kết quả đã đề ra.</p>'
        + '<table style="width:100%;border-collapse:collapse;margin-top:16pt"><tr>'
        + '<td style="' + TR + 'width:33%;text-align:center;font-size:12pt"><b>HỌC SINH</b><br>'
        + '<i>(Ký, ghi rõ họ tên)</i><br><br><br><br></td>'
        + '<td style="' + TR + 'width:34%;text-align:center;font-size:12pt"><b>CHA MẸ HỌC SINH</b><br>'
        + '<i>(Ký, ghi rõ họ tên)</i><br><br><br><br></td>'
        + '<td style="' + TR + 'text-align:center;font-size:12pt"><b>GIÁO VIÊN CHỦ NHIỆM</b><br>'
        + '<i>(Ký, ghi rõ họ tên)</i><br><br><br><br></td></tr></table>';

      if (idx < loc.length - 1) than += '<p style="page-break-after:always"></p>';
    });

    goiWord(than, 'phieu-cam-ket-lop-' + LOP + '-' + NAM + '.doc', 'Phiếu cam kết lớp ' + LOP);
    notify('Đã tải ' + loc.length + ' phiếu cam kết của lớp ' + LOP + ', mỗi em một trang.');
  }

  /* Bảng tổng hợp cả lớp theo một môn — để giáo viên bộ môn lưu hồ sơ */
  function inBangLop() {
    const mon = monHienTai();
    const loc = DS.filter(r => r.lop === LOP);
    if (!loc.length) { notify('Lớp này chưa có học sinh.'); return; }
    const nt = namTruoc(NAM);

    let hang = '';
    loc.forEach((r, i) => {
      const h = r.hoc_sinh, k = h.ma + '|' + mon.ma;
      const c = CK[k] || {}, tt = TT[k];
      const ck = mon.kieu === 'diem'
        ? (c.diem_cam_ket != null ? c.diem_cam_ket : '')
        : (c.muc_cam_ket === 'D' ? 'Đ' : c.muc_cam_ket === 'CD' ? 'CĐ' : '');
      hang += '<tr><td style="' + OC + '">' + (i + 1) + '</td>'
        + '<td style="' + OC + '">' + chan(h.ma) + '</td>'
        + '<td style="' + O + '">' + chan(h.ho_ten) + '</td>'
        + '<td style="' + OC + '">' + chan(tt == null ? '' : tt) + '</td>'
        + '<td style="' + OC + 'font-weight:bold">' + chan(ck) + '</td>'
        + '<td style="' + OC + '">' + (c.hs_xac_nhan ? '✔' : '') + '</td>'
        + '<td style="' + OC + '">' + (c.ph_xac_nhan ? '✔' : '') + '</td></tr>';
    });

    const than = dauTrang()
      + '<p style="' + TR + 'text-align:center;font-size:13.5pt;font-weight:bold;margin:16pt 0 3pt">'
      + 'BẢNG CAM KẾT CHUẨN ĐẦU RA THEO TỪNG HỌC SINH</p>'
      + '<p style="' + TR + 'text-align:center;font-size:12pt;margin:0 0 12pt">Môn '
      + chan(mon.ten) + ' — Lớp ' + chan(LOP) + ' — Năm học ' + chan(NAM) + '</p>'
      + '<table style="width:100%;border-collapse:collapse"><tr>'
      + '<td style="' + OC + 'font-weight:bold;width:6%">TT</td>'
      + '<td style="' + OC + 'font-weight:bold;width:14%">Mã học sinh</td>'
      + '<td style="' + OC + 'font-weight:bold">Họ và tên</td>'
      + '<td style="' + OC + 'font-weight:bold;width:14%">Thực trạng<br>' + chan(nt || '') + '</td>'
      + '<td style="' + OC + 'font-weight:bold;width:14%">Chuẩn đầu ra</td>'
      + '<td style="' + OC + 'font-weight:bold;width:9%">HS ký</td>'
      + '<td style="' + OC + 'font-weight:bold;width:10%">CMHS ký</td></tr>'
      + hang + '</table>'
      + '<table style="width:100%;border-collapse:collapse;margin-top:18pt"><tr>'
      + '<td style="' + TR + 'width:50%;text-align:center;font-size:12pt"><b>GIÁO VIÊN BỘ MÔN</b><br>'
      + '<i>(Ký, ghi rõ họ tên)</i><br><br><br><br></td>'
      + '<td style="' + TR + 'text-align:center;font-size:12pt"><b>HIỆU TRƯỞNG</b><br>'
      + '<i>(Ký tên, đóng dấu)</i><br><br><br><br></td></tr></table>';

    goiWord(than, 'bang-cam-ket-' + LOP + '-' + mon.ma + '-' + NAM + '.doc',
      'Bảng cam kết ' + LOP + ' ' + mon.ten);
    notify('Đã tải bảng tổng hợp lớp ' + LOP + ' môn ' + mon.ten + '.');
  }

  /* ---------------- Đăng ký màn hình ---------------- */
  window.dbclManHinh = window.dbclManHinh || {};
  window.dbclManHinh.ck = ve;
})();
