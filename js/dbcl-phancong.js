/* ============================================================================
   PHÂN CÔNG GIẢNG DẠY

   Bảng này quyết định AI SỬA ĐƯỢC GÌ trong module. Không có phân công thì
   giáo viên không đặt được chuẩn đầu ra cho lớp mình, và cũng không xem được
   dữ liệu học sinh — vì hàng rào bảo vệ ở máy chủ soi vào đúng bảng này
   (hàm xem_duoc_hoc_sinh và chính sách hsck_sua trong tệp sql/17).

   HAI CÁCH NHẬP, ĐÚNG NHƯ CÁC PHẦN MỀM TRƯỜNG ĐANG DÙNG
     · Thủ công    — thêm từng dòng ngay trên trang, tiện khi sửa lẻ giữa năm.
     · Hàng loạt   — tải mẫu Excel, điền cả trường rồi tải lên một lượt.

   GHÉP GIÁO VIÊN BẰNG EMAIL, không ghép theo họ tên — cùng lý do như ghép
   học sinh bằng mã: trong trường có người trùng tên. Email là thứ duy nhất
   chắc chắn không trùng, và đã có sẵn trong bảng người dùng.

   Tệp tải lên KHÔNG tạo được tài khoản mới. Email lạ thì bỏ qua và báo rõ.
   ============================================================================ */

(function () {
  'use strict';

  if (typeof CAU_HINH === 'undefined' || !CAU_HINH.DA_NOI) return;

  let sb = null;
  let NAM = CAU_HINH.NAM_HOC || '2026-2027';
  let LOC_LOP = '', LOC_GV = '';
  let MON = [], GV = [], PC = [], LOPS = [];

  const css = `
  .pc-o{background:#fff;border:1px solid #e2e8f2;border-radius:12px;padding:15px 17px;margin-bottom:13px}
  .pc-o.dam{border-color:#cfe0ff;background:#f7faff}
  .pc-o h4{font-size:14.6px;color:var(--navy);margin-bottom:5px;font-weight:700}
  .pc-o p{font-size:12.8px;color:var(--muted);line-height:1.6;margin-bottom:11px}
  .pc-hang{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
  .pc-hang select,.pc-hang input{padding:8px 11px;border:1.5px solid #d7dde8;border-radius:9px;
    font-size:13.4px;font-family:inherit;background:#fff}
  .pc-hang label{font-size:13px;font-weight:600;color:var(--muted);display:flex;align-items:center;gap:5px}
  .pc-bang{width:100%;border-collapse:collapse;font-size:13.6px}
  .pc-bang th{background:#eef3fb;color:var(--navy);font-weight:700;padding:9px 8px;
    border:1px solid #dbe3ef;font-size:12.6px;text-align:left;white-space:nowrap}
  .pc-bang td{border:1px solid #e4e9f2;padding:6px 9px}
  .pc-bang tr:hover td{background:#fafcff}
  .pc-cn{display:inline-block;background:#e7f7ee;color:#15803d;font-size:11.2px;font-weight:700;
    padding:2px 8px;border-radius:5px}
  .pc-canh{background:#fdf3f2;border:1px solid #f3c9c5;color:#8a3428;border-radius:10px;
    padding:12px 15px;font-size:13.2px;margin:12px 0;line-height:1.65}
  .pc-ok{background:#f2fdf6;border-color:#bfe8cd;color:#1a6437}
  .pc-tin{background:#eef4ff;border-color:#cfe0ff;color:#1d4ed8}
  .pc-tk{display:flex;gap:20px;flex-wrap:wrap;font-size:13.2px;color:var(--muted);margin:10px 0}
  .pc-tk b{color:var(--navy);font-size:16px;font-family:var(--serif)}
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
  function tenMon(ma) {
    const m = MON.find(x => x.ma === ma);
    return m ? m.ten : '';
  }
  function khoa(p) { return p.nguoi_dung_id + '|' + p.lop + '|' + (p.mon_ma || ''); }

  /* ========================================================================
     TẢI DỮ LIỆU
     ======================================================================== */
  async function tai() {
    const [mh, nd, pc, hl] = await Promise.all([
      sb.from('mon_hoc').select('*').order('so_tt'),
      sb.from('nguoi_dung').select('id, email, ho_ten, chuc_vu, to_chuyen_mon, trang_thai')
        .eq('trang_thai', 'hoat_dong').order('ho_ten'),
      sb.from('phan_cong_day').select('*').eq('nam_hoc', NAM),
      sb.from('hoc_sinh_lop').select('lop').eq('nam_hoc', NAM)
    ]);
    MON = mh.data || [];
    GV = nd.data || [];
    PC = pc.data || [];
    LOPS = Array.from(new Set((hl.data || []).map(r => r.lop)))
      .concat(Array.from(new Set(PC.map(p => p.lop))));
    LOPS = Array.from(new Set(LOPS)).filter(Boolean).sort((a, b) => a.localeCompare(b, 'vi'));
  }

  /* ========================================================================
     MÀN HÌNH
     ======================================================================== */
  async function ve(hop, namHoc) {
    if (namHoc) NAM = namHoc;
    if (!sb) sb = window.sbClient;
    if (!sb) { hop.innerHTML = '<div class="pc-canh">Thầy cô đăng nhập để xem phần này.</div>'; return; }

    hop.innerHTML = '<p style="color:#8a94a6;font-size:13.4px">Đang tải…</p>';
    try { await tai(); }
    catch (e) { hop.innerHTML = '<div class="pc-canh">Không tải được: ' + chan(e.message) + '</div>'; return; }

    if (!MON.length) {
      hop.innerHTML = '<div class="pc-canh">Chưa có danh mục môn học. Kiểm tra đã chạy <code>sql/17</code> chưa.</div>';
      return;
    }
    const qt = laQuanTri();
    const gvTheoId = {}; GV.forEach(g => { gvTheoId[g.id] = g; });

    /* ---- Soát thiếu ---- */
    const lopCoCN = new Set(PC.filter(p => p.la_chu_nhiem).map(p => p.lop));
    const thieuCN = LOPS.filter(l => !lopCoCN.has(l));

    let html = '';

    /* ---- Hai cách nhập ---- */
    if (qt) {
      html += '<div class="pc-o dam"><h4>Cách 1 — Nhập thủ công từng dòng</h4>'
        + '<p>Tiện khi thêm hoặc sửa lẻ giữa năm học.</p>'
        + '<div class="pc-hang">'
        + '<select id="pcGV" style="min-width:220px"><option value="">— Chọn giáo viên —</option>'
        + GV.map(g => '<option value="' + g.id + '">' + chan(g.ho_ten)
            + (g.to_chuyen_mon ? ' · ' + chan(g.to_chuyen_mon) : '') + '</option>').join('')
        + '</select>'
        + '<input id="pcLop" list="pcDsLop" placeholder="Lớp, vd 7A" style="width:120px">'
        + '<datalist id="pcDsLop">' + LOPS.map(l => '<option value="' + chan(l) + '">').join('') + '</datalist>'
        + '<select id="pcMon" style="min-width:210px"><option value="">— Chỉ chủ nhiệm, không dạy môn —</option>'
        + MON.map(m => '<option value="' + m.ma + '">' + chan(m.ten) + '</option>').join('')
        + '</select>'
        + '<label><input type="checkbox" id="pcCN"> Chủ nhiệm lớp này</label>'
        + '<button class="btn btn-pri" id="pcThem">➕ Thêm phân công</button>'
        + '</div></div>';

      html += '<div class="pc-o"><h4>Cách 2 — Nhập hàng loạt từ Excel</h4>'
        + '<p>Tải mẫu về, điền phân công cả trường rồi tải lên một lượt. '
        + 'Ghép giáo viên <b>bằng email</b>, không ghép theo họ tên — vì trong trường có người trùng tên.</p>'
        + '<button class="btn btn-out" id="pcMau">⬇ Tải mẫu Excel</button>'
        + '<button class="btn btn-pri" id="pcLen">⬆ Tải tệp lên</button>'
        + (PC.length ? '<button class="btn btn-out" id="pcXoaHet" style="margin-left:6px">🗑 Xoá toàn bộ phân công năm ' + chan(NAM) + '</button>' : '')
        + '</div>';
    } else {
      html += '<div class="pc-canh pc-tin">Chỉ quản trị và ban giám hiệu mới nhập được phân công giảng dạy. '
        + 'Thầy cô xem được bảng bên dưới.</div>';
    }

    /* ---- Thống kê và soát thiếu ---- */
    html += '<div class="pc-tk">'
      + '<span><b>' + PC.length + '</b> dòng phân công</span>'
      + '<span><b>' + new Set(PC.map(p => p.nguoi_dung_id)).size + '</b> giáo viên</span>'
      + '<span><b>' + LOPS.length + '</b> lớp</span>'
      + '<span><b>' + lopCoCN.size + '</b> lớp đã có chủ nhiệm</span></div>';

    if (!PC.length) {
      html += '<div class="pc-canh pc-tin"><b>Năm học ' + chan(NAM) + ' chưa có phân công nào.</b><br>'
        + 'Chưa phân công thì giáo viên không xem được dữ liệu học sinh và không đặt được chuẩn đầu ra '
        + 'cho lớp mình — hàng rào bảo vệ ở máy chủ soi vào đúng bảng này.</div>';
    } else if (thieuCN.length) {
      html += '<div class="pc-canh"><b>⚠ ' + thieuCN.length + ' lớp chưa có giáo viên chủ nhiệm:</b> '
        + thieuCN.map(chan).join(' · ') + '</div>';
    } else if (LOPS.length) {
      html += '<div class="pc-canh pc-ok">Tất cả ' + LOPS.length + ' lớp đều đã có giáo viên chủ nhiệm.</div>';
    }

    /* ---- Bộ lọc ---- */
    if (PC.length) {
      html += '<div class="pc-hang" style="margin:14px 0 10px">'
        + '<label style="font-weight:600">Lọc theo lớp</label>'
        + '<select id="pcLocLop"><option value="">Tất cả</option>'
        + LOPS.map(l => '<option value="' + chan(l) + '"' + (l === LOC_LOP ? ' selected' : '') + '>'
            + chan(l) + '</option>').join('') + '</select>'
        + '<label style="font-weight:600">Lọc theo giáo viên</label>'
        + '<select id="pcLocGV" style="min-width:200px"><option value="">Tất cả</option>'
        + GV.filter(g => PC.some(p => p.nguoi_dung_id === g.id))
            .map(g => '<option value="' + g.id + '"' + (g.id === LOC_GV ? ' selected' : '') + '>'
              + chan(g.ho_ten) + '</option>').join('') + '</select>'
        + '</div>';

      const loc = PC.filter(p => (!LOC_LOP || p.lop === LOC_LOP) && (!LOC_GV || p.nguoi_dung_id === LOC_GV));
      loc.sort((a, b) => (a.lop || '').localeCompare(b.lop || '', 'vi')
        || (tenMon(a.mon_ma)).localeCompare(tenMon(b.mon_ma), 'vi'));

      html += '<div class="tbl-wrap"><table class="pc-bang"><tr>'
        + '<th style="width:5%">TT</th><th style="width:8%">Lớp</th>'
        + '<th style="width:26%">Giáo viên</th><th style="width:22%">Email</th>'
        + '<th>Môn học</th><th style="width:12%">Chủ nhiệm</th>'
        + (qt ? '<th style="width:8%"></th>' : '') + '</tr>';
      loc.forEach((p, i) => {
        const g = gvTheoId[p.nguoi_dung_id] || {};
        html += '<tr><td>' + (i + 1) + '</td><td><b>' + chan(p.lop) + '</b></td>'
          + '<td>' + chan(g.ho_ten || '(tài khoản đã xoá)') + '</td>'
          + '<td style="color:#5b6b85;font-size:12.6px">' + chan(g.email || '') + '</td>'
          + '<td>' + chan(p.mon_ma ? tenMon(p.mon_ma) : '—') + '</td>'
          + '<td>' + (p.la_chu_nhiem ? '<span class="pc-cn">Chủ nhiệm</span>' : '') + '</td>'
          + (qt ? '<td><button class="btn btn-out" data-xoa="' + p.id
              + '" style="padding:4px 10px;font-size:12.2px">Xoá</button></td>' : '')
          + '</tr>';
      });
      html += '</table></div>';
    }

    hop.innerHTML = html;
    ganNut(hop);
  }

  function ganNut(hop) {
    const g = (id, sk, fn) => { const e = document.getElementById(id); if (e) e.addEventListener(sk, fn); };
    g('pcThem', 'click', them);
    g('pcMau', 'click', taiMau);
    g('pcLen', 'click', chonTep);
    g('pcXoaHet', 'click', xoaHet);
    g('pcLocLop', 'change', function () { LOC_LOP = this.value; ve(hop); });
    g('pcLocGV', 'change', function () { LOC_GV = this.value; ve(hop); });
    hop.querySelectorAll('[data-xoa]').forEach(b =>
      b.addEventListener('click', () => xoaDong(b.dataset.xoa)));
  }

  /* ========================================================================
     NHẬP THỦ CÔNG
     ======================================================================== */
  async function them() {
    const id = document.getElementById('pcGV').value;
    const lop = document.getElementById('pcLop').value.trim();
    const mon = document.getElementById('pcMon').value || null;
    const cn = document.getElementById('pcCN').checked;

    if (!id) { notify('Thầy cô chọn giáo viên đã.'); return; }
    if (!lop) { notify('Thầy cô nhập lớp, ví dụ 7A.'); return; }
    if (!mon && !cn) { notify('Phải chọn môn dạy, hoặc đánh dấu là chủ nhiệm lớp.'); return; }

    const k = id + '|' + lop + '|' + (mon || '');
    if (PC.some(p => khoa(p) === k)) { notify('Dòng phân công này đã có rồi.'); return; }

    const kq = await sb.from('phan_cong_day').insert({
      nguoi_dung_id: id, nam_hoc: NAM, lop: lop, mon_ma: mon, la_chu_nhiem: cn
    }).select().single();
    if (kq.error) { notify('Chưa thêm được: ' + kq.error.message); return; }
    notify('Đã thêm phân công.');
    ve(document.getElementById('dbclKhac'));
  }

  async function xoaDong(id) {
    if (!window.confirm('Xoá dòng phân công này?\n\n'
      + 'Giáo viên sẽ mất quyền xem và sửa dữ liệu của lớp, môn tương ứng.')) return;
    const kq = await sb.from('phan_cong_day').delete().eq('id', id);
    if (kq.error) { notify('Chưa xoá được: ' + kq.error.message); return; }
    ve(document.getElementById('dbclKhac'));
  }

  async function xoaHet() {
    if (!window.confirm('XOÁ TOÀN BỘ ' + PC.length + ' dòng phân công của năm học ' + NAM + '?\n\n'
      + '⚠ Sau khi xoá, mọi giáo viên đều mất quyền xem dữ liệu học sinh và đặt chuẩn đầu ra, '
      + 'cho tới khi nhập phân công lại.\n\nViệc này không hoàn tác được.')) return;
    if (!window.confirm('Xác nhận lần nữa: xoá hết phân công năm học ' + NAM + '?')) return;
    const kq = await sb.from('phan_cong_day').delete().eq('nam_hoc', NAM);
    if (kq.error) { notify('Chưa xoá được: ' + kq.error.message); return; }
    notify('Đã xoá toàn bộ phân công của năm học ' + NAM + '.');
    ve(document.getElementById('dbclKhac'));
  }

  /* ========================================================================
     NHẬP HÀNG LOẠT TỪ EXCEL
     ======================================================================== */
  function taiMau() {
    if (!coThuVien()) return;
    const hang = [
      ['MẪU PHÂN CÔNG GIẢNG DẠY — ' + (CAU_HINH.TEN_TRUONG || '')],
      ['Năm học', NAM],
      [],
      ['Hướng dẫn: Ghép giáo viên theo cột Email — phải đúng email tài khoản đang dùng trên hệ thống.'],
      ['Cột Môn học ghi ĐÚNG tên trong danh mục (xem trang tính "Danh muc mon"). Để trống nếu chỉ chủ nhiệm.'],
      ['Cột Chủ nhiệm ghi x nếu là giáo viên chủ nhiệm lớp đó.'],
      ['Một giáo viên dạy nhiều lớp thì ghi nhiều dòng.'],
      [],
      ['Email giáo viên', 'Họ và tên (tham khảo)', 'Lớp', 'Môn học', 'Chủ nhiệm']
    ];
    if (PC.length) {
      const gvTheoId = {}; GV.forEach(g => { gvTheoId[g.id] = g; });
      PC.forEach(p => {
        const g = gvTheoId[p.nguoi_dung_id] || {};
        hang.push([g.email || '', g.ho_ten || '', p.lop, p.mon_ma ? tenMon(p.mon_ma) : '',
          p.la_chu_nhiem ? 'x' : '']);
      });
    } else {
      const vd = GV[0] || { email: 'giaovien@gmail.com', ho_ten: 'Nguyễn Văn A' };
      hang.push([vd.email, vd.ho_ten, '7A', 'Toán', 'x']);
      hang.push([vd.email, vd.ho_ten, '7B', 'Toán', '']);
    }

    const ws = XLSX.utils.aoa_to_sheet(hang);
    ws['!cols'] = [{ wch: 30 }, { wch: 26 }, { wch: 9 }, { wch: 30 }, { wch: 11 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Phan cong');

    /* Trang tính phụ: danh mục để thầy cô chép cho đúng chữ */
    const dm = [['DANH MỤC MÔN HỌC — chép đúng tên ở cột này'], []];
    MON.forEach(m => dm.push([m.ten]));
    dm.push([]); dm.push(['DANH SÁCH EMAIL TÀI KHOẢN ĐANG HOẠT ĐỘNG']); dm.push([]);
    GV.forEach(g => dm.push([g.email, g.ho_ten, g.to_chuyen_mon || '']));
    const ws2 = XLSX.utils.aoa_to_sheet(dm);
    ws2['!cols'] = [{ wch: 34 }, { wch: 26 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Danh muc mon');

    XLSX.writeFile(wb, 'mau-phan-cong-giang-day-' + NAM + '.xlsx');
    notify('Đã tải mẫu phân công. Trang tính thứ hai có sẵn danh mục môn và email tài khoản để chép cho đúng.');
  }

  function chonTep() {
    if (!coThuVien()) return;
    const inp = document.getElementById('pcTepExcel');
    if (!inp) return;
    inp.value = '';
    inp.click();
  }

  async function docTep(tep) {
    let wb;
    try { wb = XLSX.read(await tep.arrayBuffer(), { type: 'array' }); }
    catch (e) { notify('Không đọc được tệp: ' + e.message); return; }
    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws) { notify('Tệp không có trang tính nào.'); return; }
    const hang = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });

    /* Tìm dòng tiêu đề */
    let iTd = -1;
    for (let i = 0; i < Math.min(hang.length, 20); i++) {
      if ((hang[i] || []).some(x => String(x).trim().toLowerCase().indexOf('email') >= 0)) { iTd = i; break; }
    }
    if (iTd < 0) { notify('Không tìm thấy dòng tiêu đề có cột Email. Thầy cô dùng đúng mẫu hệ thống tải xuống.'); return; }

    const td = (hang[iTd] || []).map(x => String(x).trim().toLowerCase());
    const iEmail = td.findIndex(t => t.indexOf('email') >= 0);
    const iLop = td.findIndex(t => t.indexOf('lớp') >= 0);
    const iMon = td.findIndex(t => t.indexOf('môn') >= 0);
    const iCN = td.findIndex(t => t.indexOf('chủ nhiệm') >= 0);
    if (iEmail < 0 || iLop < 0) { notify('Tệp thiếu cột Email hoặc cột Lớp.'); return; }

    const theoEmail = {}; GV.forEach(g => { theoEmail[String(g.email).toLowerCase().trim()] = g; });
    const theoTenMon = {}; MON.forEach(m => { theoTenMon[m.ten.toLowerCase()] = m; theoTenMon[m.ma.toLowerCase()] = m; });
    const daCo = new Set(PC.map(khoa));

    const rows = [];
    const emailLa = [], monLa = [];
    let trung = 0;

    hang.slice(iTd + 1).forEach(d => {
      const em = String(d[iEmail] == null ? '' : d[iEmail]).toLowerCase().trim();
      const lop = String(d[iLop] == null ? '' : d[iLop]).trim();
      if (!em && !lop) return;
      const g = theoEmail[em];
      if (!g) { if (em) emailLa.push(em); return; }
      if (!lop) return;

      const tm = iMon >= 0 ? String(d[iMon] == null ? '' : d[iMon]).trim() : '';
      let monMa = null;
      if (tm) {
        const m = theoTenMon[tm.toLowerCase()];
        if (!m) { monLa.push(tm); return; }
        monMa = m.ma;
      }
      const cn = iCN >= 0 && /^(x|có|1|true)$/i.test(String(d[iCN] == null ? '' : d[iCN]).trim());
      if (!monMa && !cn) return;    // không dạy môn nào, cũng không chủ nhiệm thì bỏ

      const k = g.id + '|' + lop + '|' + (monMa || '');
      if (daCo.has(k)) { trung++; return; }
      daCo.add(k);
      rows.push({ nguoi_dung_id: g.id, nam_hoc: NAM, lop: lop, mon_ma: monMa, la_chu_nhiem: cn });
    });

    let hoi = 'Tệp "' + tep.name + '" — nạp phân công giảng dạy năm học ' + NAM + '.\n\n'
      + '✔ Dòng hợp lệ sẽ thêm mới: ' + rows.length + '\n';
    if (trung) hoi += '↺ Đã có sẵn, bỏ qua: ' + trung + '\n';
    if (emailLa.length) {
      const d = Array.from(new Set(emailLa));
      hoi += '✖ Email lạ (không có tài khoản trên hệ thống): ' + d.length + '\n'
        + '   ' + d.slice(0, 4).join(', ') + (d.length > 4 ? '…' : '') + '\n'
        + '   → Bỏ qua. Muốn nạp thì mời tài khoản vào hệ thống trước.\n';
    }
    if (monLa.length) {
      const d = Array.from(new Set(monLa));
      hoi += '✖ Tên môn không nhận ra: ' + d.length + '\n'
        + '   ' + d.slice(0, 4).join(', ') + (d.length > 4 ? '…' : '') + '\n'
        + '   → Bỏ qua. Chép đúng tên ở trang tính "Danh muc mon".\n';
    }
    hoi += '\nThầy cô đồng ý nạp chứ?';

    if (!rows.length) {
      notify('Không có dòng nào hợp lệ để nạp.'
        + (emailLa.length ? ' Có ' + emailLa.length + ' email không khớp tài khoản nào.' : ''));
      return;
    }
    if (!window.confirm(hoi)) return;

    const kq = await sb.from('phan_cong_day').insert(rows).select();
    if (kq.error) { notify('Chưa nạp được: ' + kq.error.message); return; }
    notify('Đã nạp ' + (kq.data || []).length + ' dòng phân công'
      + (emailLa.length ? ', bỏ qua ' + Array.from(new Set(emailLa)).length + ' email lạ' : '') + '.');
    ve(document.getElementById('dbclKhac'));
  }

  /* ---------------- Đăng ký ---------------- */
  window.dbclManHinh = window.dbclManHinh || {};
  window.dbclManHinh.pc = ve;

  function gan() {
    const inp = document.getElementById('pcTepExcel');
    if (!inp) return;
    inp.addEventListener('change', function () {
      if (this.files && this.files[0]) docTep(this.files[0]);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', gan);
  else gan();
})();
