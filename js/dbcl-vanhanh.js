/* ============================================================================
   ĐẢM BẢO CHẤT LƯỢNG — BỘ KHUNG VẬN HÀNH

   Ba màn hình, dựng theo đúng quy trình của tỉnh chứ không phải theo phụ lục:

     · Vận hành  — vòng Plan-Do-Check-Action và các mốc phải hoàn thành.
                   Ba mốc cứng: 30/9 ký cam kết và công bố chuẩn đầu ra,
                   30/01 sơ kết học kỳ I, 30/7 tổng kết năm học.
     · Tổ ĐBCL   — quyết định thành lập và phân công, Phụ lục 10 và 11.
                   Máy tự soát điều kiện "ít nhất 07 thành viên".
     · Tự soát   — 28 nội dung lấy đúng từ Quyết định 1426 và 2616 của Sở,
                   tức là những gì đoàn kiểm tra sẽ hỏi. Mỗi nội dung gắn với
                   một tiêu chí Thông tư 57 để hồ sơ ĐBCL dùng lại được làm
                   minh chứng tự đánh giá, khỏi phải làm hai lần.

   Kèm chức năng công bố công khai chuẩn đầu ra — mục 2.3 Công văn 2180 bắt
   buộc đăng lên website. Bản công bố là ảnh chụp tại thời điểm bấm nút, để
   luôn khớp với bản Hiệu trưởng đã ký.
   ============================================================================ */

(function () {
  'use strict';

  if (typeof CAU_HINH === 'undefined' || !CAU_HINH.DA_NOI) return;

  let sb = null;
  let NAM = CAU_HINH.NAM_HOC || '2026-2027';

  const TEN_GD = {
    P: 'Lập kế hoạch', D: 'Thực hiện', C: 'Kiểm tra', A: 'Điều chỉnh, cải tiến'
  };
  const TEN_TT = {
    chua: 'Chưa làm', dang: 'Đang làm', xong: 'Đã xong', khong_ap_dung: 'Không áp dụng'
  };
  const TEN_TT_TS = {
    chua: 'Chưa có', dang: 'Đang làm', co: 'Đã có', khong_ap_dung: 'Không áp dụng'
  };

  const css = `
  .vh-the{display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:11px;margin-bottom:16px}
  .vh-o{background:#fff;border:1px solid #e2e8f2;border-radius:12px;padding:14px 16px;position:relative;overflow:hidden}
  .vh-o::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--navy-2)}
  .vh-o.p::before{background:#2563eb}.vh-o.d::before{background:#0d9488}
  .vh-o.c::before{background:#d97706}.vh-o.a::before{background:#7c3aed}
  .vh-o b{display:block;font-size:12.4px;color:var(--muted);font-weight:600;letter-spacing:.03em;text-transform:uppercase}
  .vh-o .so{font-family:var(--serif);font-size:25px;color:var(--navy);line-height:1.2;margin-top:4px}
  .vh-o .ghi{font-size:12px;color:#8a94a6;margin-top:2px}
  .vh-nhom{font-size:13px;font-weight:700;color:var(--navy);text-transform:uppercase;
    letter-spacing:.04em;margin:18px 0 8px;padding-bottom:6px;border-bottom:1px solid #e6ebf4}
  .vh-dong{display:flex;gap:11px;align-items:flex-start;padding:11px 13px;border:1px solid #e6ebf4;
    border-radius:10px;margin-bottom:7px;background:#fff;flex-wrap:wrap}
  .vh-dong.tre{border-color:#f0c6bf;background:#fdf6f5}
  .vh-dong.xong{border-color:#c9e8d6;background:#f6fdf9}
  .vh-dong .tt{flex:1;min-width:230px}
  .vh-dong .tt b{display:block;font-size:14px;color:#24314c;line-height:1.45;font-weight:600}
  .vh-dong .cc{font-size:11.6px;color:#8a94a6;margin-top:3px;line-height:1.5}
  .vh-dong .han{font-size:12.4px;font-weight:700;white-space:nowrap;padding-top:2px}
  .vh-dong .han.tre{color:#b3261e}
  .vh-dong select,.vh-dong input{padding:6px 9px;border:1px solid #dde3ed;border-radius:8px;
    font-size:12.8px;font-family:inherit;background:#fff}
  .vh-dong select:disabled,.vh-dong input:disabled{background:#f4f6fa;color:#9aa4b5}
  .vh-tc{display:inline-block;background:#eef4ff;border:1px solid #cfe0ff;color:#1d4ed8;
    border-radius:6px;padding:2px 7px;font-size:11.4px;font-weight:700;white-space:nowrap}
  .vh-canh{background:#fdf3f2;border:1px solid #f3c9c5;color:#8a3428;border-radius:10px;
    padding:11px 14px;font-size:13.2px;margin:12px 0;line-height:1.6}
  .vh-ok{background:#f2fdf6;border-color:#bfe8cd;color:#1a6437}
  .vh-tin{background:#eef4ff;border-color:#cfe0ff;color:#1d4ed8}
  .vh-bang{width:100%;border-collapse:collapse;font-size:13.4px;margin-top:10px}
  .vh-bang th{background:#eef3fb;color:var(--navy);font-weight:700;padding:9px 8px;
    border:1px solid #dbe3ef;font-size:12.6px;text-align:left}
  .vh-bang td{border:1px solid #e4e9f2;padding:6px 8px;vertical-align:middle}
  .vh-bang input,.vh-bang select{width:100%;padding:6px 8px;border:1px solid #dde3ed;
    border-radius:7px;font-size:13.2px;font-family:inherit;background:#fff}
  .vh-luu{border-color:#4ade80 !important;background:#f2fdf6 !important}
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
  function coQuyen() {
    const u = window.NGUOI_DUNG;
    return !!u && (laQuanTri() || u.vai_tro === 'to_truong');
  }
  function ngayVN(d) {
    if (!d) return '';
    const p = String(d).slice(0, 10).split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : String(d);
  }
  function homNay() { return new Date().toISOString().slice(0, 10); }
  function nhay(el) {
    el.classList.add('vh-luu');
    setTimeout(() => el.classList.remove('vh-luu'), 900);
  }

  /* ========================================================================
     MÀN HÌNH 1 — VẬN HÀNH
     ======================================================================== */
  async function veVanHanh(hop) {
    hop.innerHTML = '<p style="color:#8a94a6;font-size:13.4px">Đang tải mốc công việc…</p>';
    const kq = await sb.from('dbcl_moc').select('*').eq('nam_hoc', NAM)
      .order('giai_doan').order('han').order('ma');
    if (kq.error) {
      hop.innerHTML = '<div class="vh-canh">Không tải được: ' + chan(kq.error.message) + '</div>';
      return;
    }
    const ds = kq.data || [];
    if (!ds.length) {
      hop.innerHTML = '<div class="vh-canh">Năm học ' + chan(NAM) + ' chưa có mốc công việc nào. '
        + 'Chạy câu <code>select dbcl_sinh_moc(\'' + chan(NAM) + '\');</code> trong Supabase để sinh bộ mốc chuẩn.</div>';
      return;
    }

    const nay = homNay();
    const tre = ds.filter(m => m.trang_thai !== 'xong' && m.trang_thai !== 'khong_ap_dung'
      && m.han && m.han < nay);
    const sua = coQuyen();

    /* Bốn thẻ tổng hợp theo giai đoạn */
    let the = '<div class="vh-the">';
    ['P', 'D', 'C', 'A'].forEach(g => {
      const nhom = ds.filter(m => m.giai_doan === g);
      const xong = nhom.filter(m => m.trang_thai === 'xong').length;
      the += '<div class="vh-o ' + g.toLowerCase() + '"><b>' + g + ' · ' + chan(TEN_GD[g]) + '</b>'
        + '<div class="so">' + xong + '/' + nhom.length + '</div>'
        + '<div class="ghi">việc đã hoàn thành</div></div>';
    });
    the += '</div>';

    let canh = '';
    if (tre.length) {
      canh = '<div class="vh-canh"><b>⚠ ' + tre.length + ' việc đã quá hạn mà chưa xong:</b><br>'
        + tre.slice(0, 6).map(m => '· ' + chan(m.ten) + ' <i>(hạn ' + ngayVN(m.han) + ')</i>').join('<br>')
        + (tre.length > 6 ? '<br>· và ' + (tre.length - 6) + ' việc khác' : '') + '</div>';
    } else {
      canh = '<div class="vh-canh vh-ok">Không có việc nào quá hạn.</div>';
    }

    /* Ba mốc cứng theo Công văn 2180 */
    const cung = '<div class="vh-canh vh-tin"><b>Ba mốc bắt buộc của năm học:</b> '
      + 'trước <b>30/9</b> hoàn thành ký cam kết và công bố chuẩn đầu ra · '
      + 'trước <b>30/01</b> sơ kết học kỳ I và báo cáo Sở GD&ĐT, UBND xã · '
      + 'trước <b>30/7</b> tổng kết năm học và báo cáo. '
      + '<i>Căn cứ mục 2.2.d và 2.6 Công văn 2180/SGD&ĐT-KTKĐCLGD.</i></div>';

    let ds_html = '';
    ['P', 'D', 'C', 'A'].forEach(g => {
      const nhom = ds.filter(m => m.giai_doan === g);
      if (!nhom.length) return;
      ds_html += '<div class="vh-nhom">' + g + ' — ' + chan(TEN_GD[g]) + '</div>';
      nhom.forEach(m => {
        const laTre = m.trang_thai !== 'xong' && m.trang_thai !== 'khong_ap_dung'
          && m.han && m.han < nay;
        ds_html += '<div class="vh-dong' + (laTre ? ' tre' : (m.trang_thai === 'xong' ? ' xong' : '')) + '">'
          + '<div class="tt"><b>' + chan(m.ten) + '</b>'
          + '<div class="cc">' + chan(m.can_cu || '') + '</div></div>'
          + '<div class="han' + (laTre ? ' tre' : '') + '">Hạn ' + ngayVN(m.han) + '</div>'
          + '<select data-moc="' + m.id + '" data-cot="trang_thai"' + (sua ? '' : ' disabled') + '>'
          + Object.keys(TEN_TT).map(k => '<option value="' + k + '"'
              + (k === m.trang_thai ? ' selected' : '') + '>' + TEN_TT[k] + '</option>').join('')
          + '</select>'
          + '<input data-moc="' + m.id + '" data-cot="nguoi_phu_trach" placeholder="Người phụ trách" '
          + 'value="' + chan(m.nguoi_phu_trach) + '" style="width:150px"' + (sua ? '' : ' disabled') + '>'
          + '</div>';
      });
    });

    const nutCongBo = laQuanTri()
      ? '<div class="db-cong"><button class="btn btn-pri" id="vhCongBo">📢 Công bố chuẩn đầu ra lên trang công khai</button>'
        + '<button class="btn btn-out" id="vhXemCongBo">👁 Xem trang công khai</button></div>'
      : '';

    hop.innerHTML = the + canh + cung + nutCongBo + ds_html;

    hop.querySelectorAll('[data-moc]').forEach(el => {
      const su = () => luuMoc(el);
      if (el.tagName === 'SELECT') el.addEventListener('change', su);
      else el.addEventListener('blur', su);
    });
    const nb = document.getElementById('vhCongBo');
    if (nb) nb.addEventListener('click', congBo);
    const nx = document.getElementById('vhXemCongBo');
    if (nx) nx.addEventListener('click', () => window.open('cong-bo.html', '_blank'));
  }

  async function luuMoc(el) {
    const b = {};
    b[el.dataset.cot] = el.value || null;
    b.cap_nhat_luc = new Date().toISOString();
    b.cap_nhat_boi = window.NGUOI_DUNG ? window.NGUOI_DUNG.id : null;
    const kq = await sb.from('dbcl_moc').update(b).eq('id', el.dataset.moc);
    if (kq.error) { notify('Chưa lưu được: ' + kq.error.message); return; }
    nhay(el);
    if (el.dataset.cot === 'trang_thai') {
      veManHinh('vh', document.getElementById('dbclKhac'), NAM);
    }
  }

  /* ---------------- Công bố chuẩn đầu ra ra trang công khai ---------------- */
  async function congBo() {
    if (typeof window.duLieuDBCL !== 'function') { notify('Chưa tải được số liệu.'); return; }
    const d = window.duLieuDBCL();
    if (!d || !d.chiTieu || !d.chiTieu.length) { notify('Chưa tải được bộ chỉ tiêu.'); return; }

    const dong = [];
    d.chiTieu.forEach(ct => {
      const o = { ma: ct.ma, ten: ct.ten, nhom: ct.nhom, chi9: !!ct.chi_khoi_9, gt: {} };
      let co = false;
      d.khoi.forEach(k => {
        if (ct.chi_khoi_9 && k !== 9) return;
        const r = d.lay('chuan_dau_ra', 'ca_nam', k, ct.ma);
        if (r && r.gia_tri) { o.gt[k] = r.gia_tri; co = true; }
      });
      if (co) dong.push(o);
    });
    if (!dong.length) {
      notify('Bảng Chuẩn đầu ra của năm học ' + NAM + ' chưa có ô nào, chưa công bố được.');
      return;
    }
    if (!await xacNhan('Công bố chuẩn đầu ra năm học ' + NAM + ' lên trang công khai?\n\n'
      + dong.length + ' chỉ tiêu có số liệu sẽ được đăng.\n'
      + 'Ai cũng xem được, kể cả người chưa đăng nhập.\n\n'
      + 'Đây là việc bắt buộc theo mục 2.3 Công văn 2180 của Sở.')) return;

    const kq = await sb.from('dbcl_cong_bo').upsert({
      nam_hoc: NAM,
      noi_dung: { khoi: d.khoi, dong: dong, truong: CAU_HINH.TEN_TRUONG },
      ngay_cong_bo: homNay(),
      nguoi_cong_bo: window.NGUOI_DUNG ? window.NGUOI_DUNG.ho_ten : null,
      dang_hien: true,
      cap_nhat_luc: new Date().toISOString()
    }, { onConflict: 'nam_hoc' }).select().single();

    if (kq.error) { notify('Chưa công bố được: ' + kq.error.message); return; }
    notify('Đã công bố chuẩn đầu ra năm học ' + NAM
      + '. Bấm nút "Xem trang công khai" để kiểm tra.');
  }

  /* ========================================================================
     MÀN HÌNH 2 — TỔ ĐẢM BẢO CHẤT LƯỢNG
     ======================================================================== */
  const PHAN_CONG_MAU = [
    'Phân tích yếu tố bên trong, bên ngoài nhà trường',
    'Tầm nhìn, sứ mệnh, giá trị cốt lõi, mục tiêu chương trình giáo dục',
    'Xác định chuẩn đầu ra',
    'Chương trình giáo dục',
    'Xây dựng văn hóa nhà trường',
    'Phát triển cán bộ quản lý, giáo viên, nhân viên',
    'Cơ sở vật chất, trang thiết bị dạy học',
    'Khảo sát giáo viên, phụ huynh, học sinh, các bên liên quan'
  ];

  async function veTo(hop) {
    hop.innerHTML = '<p style="color:#8a94a6;font-size:13.4px">Đang tải…</p>';
    /* Soi lỗi trước khi kết luận "chưa có Tổ". Không soi thì máy chủ từ chối
       cũng ra .data = null, màn hình mời thầy cô bấm "Lập Tổ" — bấm vào là
       tạo tổ trùng hoặc nhận một câu lỗi khó hiểu. */
    const rTo = await sb.from('dbcl_to').select('*').eq('nam_hoc', NAM).maybeSingle();
    if (rTo.error) {
      hop.innerHTML = '<div class="vh-canh">Không đọc được Tổ Đảm bảo chất lượng: '
        + chan(rTo.error.message) + '</div>';
      return;
    }
    let to = rTo.data;
    const sua = coQuyen();

    if (!to) {
      hop.innerHTML = '<div class="vh-canh">Năm học ' + chan(NAM) + ' chưa có Tổ đảm bảo chất lượng.</div>'
        + (sua ? '<button class="btn btn-pri" id="vhTaoTo">➕ Lập Tổ đảm bảo chất lượng</button>' : '');
      const n = document.getElementById('vhTaoTo');
      if (n) n.addEventListener('click', async () => {
        const kq = await sb.from('dbcl_to').insert({ nam_hoc: NAM }).select().single();
        if (kq.error) { notify('Chưa lập được: ' + kq.error.message); return; }
        /* Ghi cả 8 nội dung trong MỘT lệnh và soi lỗi. Bản cũ chèn từng dòng
           rồi bỏ mặc kết quả — tổ lập xong mà bảng phân công thiếu dòng, chẳng
           ai biết cho tới lúc in quyết định ra thấy hụt. */
        const p = await sb.from('dbcl_phan_cong').insert(
          PHAN_CONG_MAU.map((nd, i) => ({ to_id: kq.data.id, noi_dung: nd, so_tt: i + 1 })));
        if (p.error) {
          notify('Đã lập Tổ nhưng chưa ghi được bảng phân công: ' + p.error.message
            + ' — thầy cô thêm tay ở bảng bên dưới.');
        }
        veTo(hop);
      });
      return;
    }

    const [tv, pc, kt] = await Promise.all([
      sb.from('dbcl_to_thanh_vien').select('*').eq('to_id', to.id).order('so_tt'),
      sb.from('dbcl_phan_cong').select('*').eq('to_id', to.id).order('so_tt'),
      sb.rpc('dbcl_kiem_tra_to', { p_nam_hoc: NAM })
    ]);
    /* Soi lỗi trước khi vẽ. Không soi thì tổ hiện ra "0 thành viên" và màn
       hình kết luận tổ chưa đủ 07 người theo Công văn 2180 — trong khi tổ vẫn
       đủ, chỉ là câu hỏi bị máy chủ từ chối. */
    const loi = tv.error || pc.error || kt.error;
    if (loi) {
      hop.innerHTML = '<div class="vh-canh">Không tải được Tổ Đảm bảo chất lượng: '
        + chan(loi.message) + '</div>';
      return;
    }
    const dsTv = tv.data || [], dsPc = pc.data || [];
    const k = (kt.data && kt.data[0]) || {};

    let canh;
    if (k.hop_le) {
      canh = '<div class="vh-canh vh-ok">Tổ có <b>' + k.so_thanh_vien + ' thành viên</b>, '
        + 'đủ Tổ trưởng, Tổ phó và Thư ký — đạt yêu cầu mục 2.1.a Công văn 2180.</div>';
    } else {
      const thieu = [];
      if (!k.du_bay) thieu.push('chưa đủ 07 thành viên (hiện có ' + (k.so_thanh_vien || 0) + ')');
      if (!k.co_to_truong) thieu.push('chưa có Tổ trưởng');
      if (!k.co_to_pho) thieu.push('chưa có Tổ phó');
      if (!k.co_thu_ky) thieu.push('chưa có Thư ký');
      canh = '<div class="vh-canh"><b>⚠ Chưa đạt yêu cầu:</b> ' + thieu.join(' · ')
        + '.<br><i>Mục 2.1.a Công văn 2180: Tổ đảm bảo chất lượng phải có ít nhất 07 thành viên, '
        + 'Tổ trưởng là Hiệu trưởng, Tổ phó là Phó Hiệu trưởng.</i></div>';
    }

    let html = '<div class="db-cong">'
      + '<label style="font-size:13.2px;font-weight:600;color:var(--muted);align-self:center">Số quyết định</label>'
      + '<input id="vhSoQD" value="' + chan(to.so_quyet_dinh) + '" placeholder="…/QĐ-THCSBL" '
      + 'style="padding:8px 11px;border:1.5px solid #d7dde8;border-radius:9px;width:150px"'
      + (sua ? '' : ' disabled') + '>'
      + '<label style="font-size:13.2px;font-weight:600;color:var(--muted);align-self:center">Ngày ký</label>'
      + '<input id="vhNgayQD" type="date" value="' + chan(to.ngay_quyet_dinh) + '" '
      + 'style="padding:8px 11px;border:1.5px solid #d7dde8;border-radius:9px"'
      + (sua ? '' : ' disabled') + '>'
      + '<button class="btn btn-out" id="vhXuat10">📄 Phụ lục 10</button>'
      + '<button class="btn btn-out" id="vhXuat11">📄 Phụ lục 11</button>'
      + '</div>' + canh;

    html += '<div class="vh-nhom">Thành viên Tổ đảm bảo chất lượng</div>'
      + '<table class="vh-bang"><tr><th style="width:6%">TT</th><th style="width:32%">Họ và tên</th>'
      + '<th style="width:28%">Chức danh, chức vụ</th><th style="width:22%">Nhiệm vụ</th>'
      + '<th style="width:12%"></th></tr>';
    dsTv.forEach((v, i) => {
      html += '<tr><td style="text-align:center">' + (i + 1) + '</td>'
        + '<td><input data-tv="' + v.id + '" data-cot="ho_ten" value="' + chan(v.ho_ten) + '"' + (sua ? '' : ' disabled') + '></td>'
        + '<td><input data-tv="' + v.id + '" data-cot="chuc_vu" value="' + chan(v.chuc_vu) + '"' + (sua ? '' : ' disabled') + '></td>'
        + '<td><select data-tv="' + v.id + '" data-cot="nhiem_vu"' + (sua ? '' : ' disabled') + '>'
        + ['Tổ trưởng', 'Tổ phó', 'Thư ký', 'Uỷ viên'].map(x => '<option' + (x === v.nhiem_vu ? ' selected' : '') + '>' + x + '</option>').join('')
        + '</select></td>'
        + '<td style="text-align:center">' + (sua ? '<button class="btn btn-out" data-xoa-tv="' + v.id + '" style="padding:5px 10px;font-size:12.4px">Xoá</button>' : '') + '</td></tr>';
    });
    html += '</table>'
      + (sua ? '<button class="btn btn-out" id="vhThemTv" style="margin-top:9px">➕ Thêm thành viên</button>' : '');

    html += '<div class="vh-nhom">Phân công nhiệm vụ — Phụ lục 11</div>'
      + '<table class="vh-bang"><tr><th style="width:6%">TT</th><th style="width:48%">Nội dung về ĐBCL</th>'
      + '<th>Nhóm công tác, cá nhân phụ trách</th></tr>';
    dsPc.forEach((p, i) => {
      html += '<tr><td style="text-align:center">' + (i + 1) + '</td>'
        + '<td>' + chan(p.noi_dung) + '</td>'
        + '<td><input data-pc="' + p.id + '" data-cot="phu_trach" value="' + chan(p.phu_trach) + '"'
        + (sua ? '' : ' disabled') + '></td></tr>';
    });
    html += '</table>';

    hop.innerHTML = html;

    if (sua) {
      ['vhSoQD', 'vhNgayQD'].forEach(id => {
        const el = document.getElementById(id);
        el.addEventListener('blur', async function () {
          const b = {};
          b[id === 'vhSoQD' ? 'so_quyet_dinh' : 'ngay_quyet_dinh'] = this.value || null;
          b.cap_nhat_luc = new Date().toISOString();
          const kq = await sb.from('dbcl_to').update(b).eq('id', to.id);
          if (!kq.error) nhay(this);
        });
      });
      hop.querySelectorAll('[data-tv]').forEach(el => {
        const su = async () => {
          const b = {}; b[el.dataset.cot] = el.value || null;
          const kq = await sb.from('dbcl_to_thanh_vien').update(b).eq('id', el.dataset.tv);
          if (kq.error) { notify('Chưa lưu được: ' + kq.error.message); return; }
          nhay(el);
          if (el.dataset.cot === 'nhiem_vu') veTo(hop);
        };
        if (el.tagName === 'SELECT') el.addEventListener('change', su);
        else el.addEventListener('blur', su);
      });
      hop.querySelectorAll('[data-pc]').forEach(el =>
        el.addEventListener('blur', async function () {
          const kq = await sb.from('dbcl_phan_cong').update({ phu_trach: this.value || null })
            .eq('id', this.dataset.pc);
          if (!kq.error) nhay(this);
        }));
      hop.querySelectorAll('[data-xoa-tv]').forEach(b =>
        b.addEventListener('click', async function () {
          if (!await xacNhan('Xoá thành viên này khỏi Tổ đảm bảo chất lượng?',
            { nguyHiem: true, nutOk: 'Xoá' })) return;
          await sb.from('dbcl_to_thanh_vien').delete().eq('id', this.dataset.xoaTv);
          veTo(hop);
        }));
      const tm = document.getElementById('vhThemTv');
      if (tm) tm.addEventListener('click', async () => {
        await sb.from('dbcl_to_thanh_vien').insert({
          to_id: to.id, ho_ten: '', nhiem_vu: 'Uỷ viên', so_tt: dsTv.length + 1
        });
        veTo(hop);
      });
    }
    document.getElementById('vhXuat10').addEventListener('click', () => xuatTo(to, dsTv, dsPc, 10));
    document.getElementById('vhXuat11').addEventListener('click', () => xuatTo(to, dsTv, dsPc, 11));
  }

  /* ========================================================================
     MÀN HÌNH 3 — TỰ SOÁT THEO NỘI DUNG SỞ KIỂM TRA
     ======================================================================== */
  async function veTuSoat(hop) {
    hop.innerHTML = '<p style="color:#8a94a6;font-size:13.4px">Đang tải…</p>';
    const [ds, kq, tc] = await Promise.all([
      sb.from('dbcl_tu_soat').select('*').order('so_tt'),
      sb.from('dbcl_tu_soat_kq').select('*').eq('nam_hoc', NAM),
      sb.from('tieu_chi').select('ma, ten, bat_buoc')
    ]);
    /* Lỗi máy chủ và "chưa chạy sql/16" là hai chuyện khác hẳn nhau — gộp
       chung một câu báo thì thầy cô đi chạy lại tệp SQL trong khi thật ra chỉ
       cần đăng nhập lại. Tách ra, và soi lỗi cả hai câu hỏi còn lại: thiếu
       chỗ đó thì 28 nội dung hiện toàn "Chưa làm" dù đã soát xong. */
    if (ds.error || kq.error || tc.error) {
      hop.innerHTML = '<div class="vh-canh">Không tải được danh mục tự soát: '
        + chan((ds.error || kq.error || tc.error).message) + '</div>';
      return;
    }
    if (!ds.data || !ds.data.length) {
      hop.innerHTML = '<div class="vh-canh">Chưa có danh mục tự soát. '
        + 'Kiểm tra đã chạy tệp <code>sql/16</code> chưa.</div>';
      return;
    }
    const KQ = {}; (kq.data || []).forEach(r => { KQ[r.tu_soat_ma] = r; });
    const TC = {}; (tc.data || []).forEach(r => { TC[r.ma] = r; });
    const sua = coQuyen();

    const dem = { chua: 0, dang: 0, co: 0, khong_ap_dung: 0 };
    ds.data.forEach(r => { dem[(KQ[r.ma] && KQ[r.ma].trang_thai) || 'chua']++; });

    /* Nội dung chưa có mà lại thuộc tiêu chí bắt buộc của Thông tư 57 */
    const nguy = ds.data.filter(r => {
      const t = (KQ[r.ma] && KQ[r.ma].trang_thai) || 'chua';
      return t === 'chua' && r.tieu_chi_tt57 && TC[r.tieu_chi_tt57] && TC[r.tieu_chi_tt57].bat_buoc;
    });

    let html = '<div class="vh-the">'
      + '<div class="vh-o"><b>Đã có</b><div class="so">' + dem.co + '/' + ds.data.length + '</div><div class="ghi">nội dung</div></div>'
      + '<div class="vh-o c"><b>Đang làm</b><div class="so">' + dem.dang + '</div><div class="ghi">nội dung</div></div>'
      + '<div class="vh-o a"><b>Chưa có</b><div class="so">' + dem.chua + '</div><div class="ghi">nội dung</div></div>'
      + '<div class="vh-o d"><b>Không áp dụng</b><div class="so">' + dem.khong_ap_dung + '</div><div class="ghi">nội dung</div></div>'
      + '</div>';

    html += '<div class="vh-canh vh-tin">Danh mục này lấy từ <b>Quyết định 1426 và 2616 của Sở GD&ĐT Nghệ An</b> — '
      + 'đúng những nội dung đoàn kiểm tra sẽ hỏi. Cột bên phải cho biết việc đó đồng thời là minh chứng '
      + 'cho tiêu chí nào của <b>Thông tư 57/2026</b>, để hồ sơ đảm bảo chất lượng dùng lại được cho tự đánh giá, '
      + 'khỏi phải làm hai lần.</div>';

    if (nguy.length) {
      html += '<div class="vh-canh"><b>⚠ ' + nguy.length + ' nội dung chưa có, lại thuộc tiêu chí BẮT BUỘC của Thông tư 57:</b><br>'
        + nguy.map(r => '· ' + chan(r.noi_dung) + ' <span class="vh-tc">TC ' + chan(r.tieu_chi_tt57) + '</span>').join('<br>')
        + '</div>';
    }

    let nhom = '';
    ds.data.forEach(r => {
      if (r.nhom !== nhom) {
        nhom = r.nhom;
        html += '<div class="vh-nhom">' + chan(nhom) + '</div>';
      }
      const k = KQ[r.ma] || {};
      const t = k.trang_thai || 'chua';
      html += '<div class="vh-dong' + (t === 'co' ? ' xong' : '') + '">'
        + '<div class="tt"><b>' + chan(r.noi_dung) + '</b>'
        + '<div class="cc">' + chan(r.can_cu)
        + (r.tieu_chi_tt57 ? ' &nbsp;<span class="vh-tc">Thông tư 57 · Tiêu chí ' + chan(r.tieu_chi_tt57)
            + (TC[r.tieu_chi_tt57] && TC[r.tieu_chi_tt57].bat_buoc ? ' (bắt buộc)' : '') + '</span>' : '')
        + '</div></div>'
        + '<select data-ts="' + r.ma + '" data-cot="trang_thai"' + (sua ? '' : ' disabled') + '>'
        + Object.keys(TEN_TT_TS).map(x => '<option value="' + x + '"' + (x === t ? ' selected' : '')
            + '>' + TEN_TT_TS[x] + '</option>').join('')
        + '</select>'
        + '<input data-ts="' + r.ma + '" data-cot="minh_chung" placeholder="Mã minh chứng" '
        + 'value="' + chan(k.minh_chung) + '" style="width:130px"' + (sua ? '' : ' disabled') + '>'
        + '<input data-ts="' + r.ma + '" data-cot="ghi_chu" placeholder="Ghi chú" '
        + 'value="' + chan(k.ghi_chu) + '" style="width:170px"' + (sua ? '' : ' disabled') + '>'
        + '</div>';
    });

    hop.innerHTML = html;
    hop.querySelectorAll('[data-ts]').forEach(el => {
      const su = async () => {
        const cu = KQ[el.dataset.ts] || {};
        const ban = {
          nam_hoc: NAM, tu_soat_ma: el.dataset.ts,
          trang_thai: cu.trang_thai || 'chua',
          minh_chung: cu.minh_chung || null,
          ghi_chu: cu.ghi_chu || null,
          cap_nhat_luc: new Date().toISOString(),
          cap_nhat_boi: window.NGUOI_DUNG ? window.NGUOI_DUNG.id : null
        };
        ban[el.dataset.cot] = el.value || (el.dataset.cot === 'trang_thai' ? 'chua' : null);
        const r = await sb.from('dbcl_tu_soat_kq')
          .upsert(ban, { onConflict: 'nam_hoc,tu_soat_ma' }).select().single();
        if (r.error) { notify('Chưa lưu được: ' + r.error.message); return; }
        KQ[el.dataset.ts] = r.data;
        nhay(el);
        if (el.dataset.cot === 'trang_thai') veTuSoat(hop);
      };
      if (el.tagName === 'SELECT') el.addEventListener('change', su);
      else el.addEventListener('blur', su);
    });
  }

  /* ========================================================================
     KẾT XUẤT PHỤ LỤC 10 VÀ 11
     ======================================================================== */
  function xuatTo(to, dsTv, dsPc, so) {
    const TR = "font-family:'Times New Roman',serif;";
    const O = TR + 'border:1px solid #000;padding:5pt 7pt;font-size:12pt;vertical-align:middle;';
    const truong = CAU_HINH.TEN_TRUONG || 'Trường THCS Bạch Liêu';
    const diaDanh = CAU_HINH.DIA_DANH || 'Yên Thành';
    const ngay = to.ngay_quyet_dinh
      ? diaDanh + ', ngày ' + ngayVN(to.ngay_quyet_dinh).replace(/\//g, ' tháng ').replace(/ tháng (\d{4})$/, ' năm $1')
      : diaDanh + ', ngày      tháng      năm ' + NAM.slice(0, 4);

    const dau = '<table style="width:100%;border-collapse:collapse"><tr>'
      + '<td style="' + TR + 'width:45%;text-align:center;font-size:12pt;vertical-align:top">'
      + chan(CAU_HINH.DON_VI_CHU_QUAN || 'UBND XÃ YÊN THÀNH')
      + '<br><b>' + truong.toUpperCase() + '</b>'
      + (so === 10 ? '<br>Số: ' + (to.so_quyet_dinh || '     /QĐ-THCSBL') : '') + '</td>'
      + '<td style="' + TR + 'text-align:center;font-size:12pt;vertical-align:top">'
      + '<b>CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br><b>Độc lập - Tự do - Hạnh phúc</b>'
      + '<p style="' + TR + 'font-style:italic;margin:8pt 0 0">' + ngay + '</p></td></tr></table>';

    let than;
    if (so === 10) {
      than = dau
        + '<p style="' + TR + 'text-align:center;font-size:14pt;font-weight:bold;margin:18pt 0 4pt">QUYẾT ĐỊNH</p>'
        + '<p style="' + TR + 'text-align:center;font-size:12.5pt;font-weight:bold;margin:0 0 12pt">'
        + 'Về việc thành lập Tổ đảm bảo chất lượng giáo dục năm học ' + NAM + '</p>'
        + '<p style="' + TR + 'text-align:center;font-size:12.5pt;font-weight:bold;margin:0 0 10pt">'
        + 'HIỆU TRƯỞNG ' + truong.toUpperCase() + '</p>'
        + '<p style="' + TR + 'font-size:12pt;margin:0 0 4pt">Căn cứ Thông tư số 15/2026/TT-BGDĐT ngày 24/3/2026 của Bộ trưởng Bộ Giáo dục và Đào tạo ban hành Điều lệ trường trung học cơ sở, trường trung học phổ thông và trường phổ thông có nhiều cấp học;</p>'
        + '<p style="' + TR + 'font-size:12pt;margin:0 0 4pt">Căn cứ Kế hoạch số 683/KH-UBND ngày 06/10/2022 của Uỷ ban nhân dân tỉnh Nghệ An và Công văn số 2180/SGD&ĐT-KTKĐCLGD ngày 11/10/2022 của Sở Giáo dục và Đào tạo Nghệ An về công tác đảm bảo chất lượng trong các cơ sở giáo dục phổ thông;</p>'
        + '<p style="' + TR + 'font-size:12pt;margin:0 0 10pt">Xét đề nghị của các tổ chuyên môn của trường,</p>'
        + '<p style="' + TR + 'text-align:center;font-size:12.5pt;font-weight:bold;margin:0 0 8pt">QUYẾT ĐỊNH:</p>'
        + '<p style="' + TR + 'font-size:12pt;margin:0 0 6pt;text-align:justify"><b>Điều 1.</b> Thành lập Tổ đảm bảo chất lượng '
        + truong + ' năm học ' + NAM + ' gồm các ông (bà) có tên trong danh sách kèm theo.</p>'
        + '<p style="' + TR + 'font-size:12pt;margin:0 0 4pt;text-align:justify"><b>Điều 2.</b> Tổ đảm bảo chất lượng có nhiệm vụ hướng dẫn, chỉ đạo việc xây dựng kế hoạch và vận hành hệ thống đảm bảo chất lượng; kiểm tra, giám sát, đánh giá và tổ chức cải tiến hệ thống; rà soát thực trạng nhà trường; tổ chức tập huấn cho cán bộ, giáo viên, nhân viên; tham mưu cho Hiệu trưởng công tác tự đánh giá để bảo đảm chất lượng giáo dục và duy trì trường đạt chuẩn quốc gia.</p>'
        + '<p style="' + TR + 'font-size:12pt;margin:0 0 12pt;text-align:justify"><b>Điều 3.</b> Quyết định có hiệu lực kể từ ngày ký. Các ông (bà) có tên tại Điều 1 chịu trách nhiệm thi hành Quyết định này./.</p>'
        + '<p style="' + TR + 'text-align:center;font-size:12.5pt;font-weight:bold;margin:14pt 0 6pt">'
        + 'DANH SÁCH CÁC THÀNH VIÊN TỔ ĐẢM BẢO CHẤT LƯỢNG</p>'
        + '<table style="width:100%;border-collapse:collapse"><tr>'
        + '<td style="' + O + 'text-align:center;font-weight:bold;width:8%">TT</td>'
        + '<td style="' + O + 'font-weight:bold">Họ và tên</td>'
        + '<td style="' + O + 'font-weight:bold">Chức danh, chức vụ</td>'
        + '<td style="' + O + 'font-weight:bold">Nhiệm vụ</td></tr>'
        + dsTv.map((v, i) => '<tr><td style="' + O + 'text-align:center">' + (i + 1) + '</td>'
            + '<td style="' + O + '">' + chan(v.ho_ten) + '</td>'
            + '<td style="' + O + '">' + chan(v.chuc_vu) + '</td>'
            + '<td style="' + O + '">' + chan(v.nhiem_vu) + '</td></tr>').join('')
        + '</table>';
    } else {
      than = dau
        + '<p style="' + TR + 'text-align:center;font-size:13pt;font-weight:bold;margin:18pt 0 4pt">PHỤ LỤC 11</p>'
        + '<p style="' + TR + 'text-align:center;font-size:12.5pt;font-weight:bold;margin:0 0 12pt">'
        + 'Phân công nhiệm vụ Tổ đảm bảo chất lượng năm học ' + NAM + '</p>'
        + '<table style="width:100%;border-collapse:collapse"><tr>'
        + '<td style="' + O + 'text-align:center;font-weight:bold;width:8%">TT</td>'
        + '<td style="' + O + 'font-weight:bold;width:46%">Nội dung về ĐBCL</td>'
        + '<td style="' + O + 'font-weight:bold">Nhóm công tác, cá nhân phụ trách</td></tr>'
        + dsPc.map((p, i) => '<tr><td style="' + O + 'text-align:center">' + (i + 1) + '</td>'
            + '<td style="' + O + '">' + chan(p.noi_dung) + '</td>'
            + '<td style="' + O + '">' + chan(p.phu_trach) + '</td></tr>').join('')
        + '</table>';
    }

    than += '<table style="width:100%;border-collapse:collapse;margin-top:18pt"><tr>'
      + '<td style="width:55%"></td><td style="' + TR + 'text-align:center;font-size:12pt">'
      + '<b>HIỆU TRƯỞNG</b><br><i>(Ký tên, đóng dấu)</i><br><br><br><br></td></tr></table>';

    const html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" '
      + 'xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">'
      + '<head><meta charset="utf-8"><title>Phụ lục ' + so + '</title>'
      + '<style>@page{size:A4;margin:2cm 1.5cm 2cm 3cm}'
      + 'body{font-family:"Times New Roman",serif;font-size:12pt}</style></head><body>'
      + than + '</body></html>';

    const blob = new Blob(['﻿' + html], { type: 'application/msword' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'phu-luc-' + so + '-to-dbcl-' + NAM + '.doc';
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
    notify('Đã tải Phụ lục ' + so + '.');
  }

  /* ========================================================================
     ĐIỀU PHỐI
     ======================================================================== */
  function veManHinh(ma, hop, namHoc) {
    if (!hop) return;
    if (namHoc) NAM = namHoc;
    /* Lấy thẳng, không chờ sự kiện — tệp này nạp sau dbcl-sql.js nên nếu đợi
       sự kiện đăng nhập thì lần vẽ đầu tiên sẽ chạy trước khi có kết nối. */
    if (!sb) sb = window.sbClient;
    if (!sb) { hop.innerHTML = '<div class="vh-canh">Thầy cô đăng nhập để xem phần này.</div>'; return; }
    if (ma === 'vh') return veVanHanh(hop);
    if (ma === 'to') return veTo(hop);
    if (ma === 'ts') return veTuSoat(hop);
    hop.innerHTML = '';
  }
  window.dbclVeManHinh = veManHinh;

  document.addEventListener('dangnhap-xong', () => { sb = window.sbClient; });
})();
