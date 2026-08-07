/* ============================================================================
   QUẢN TRỊ HỆ THỐNG — TAB "DANH MỤC HỒ SƠ SỐ"

   Hộp sửa ở màn hình Hồ sơ số chỉ đổi được trạng thái, người phụ trách, link
   Drive và ghi chú. Muốn sửa TÊN minh chứng, mã tiêu chí, hay THÊM một minh
   chứng mới thì trước nay phải viết SQL — tức là phải qua người làm phần mềm.
   Tab này để ban giám hiệu tự làm.

   VÌ SAO KHÔNG LÀM TẢI LÊN HÀNG LOẠT Ở ĐÂY
   Danh mục 138 minh chứng là cái khung mà cả kho Drive, bảng tự đánh giá và
   bản xuất Phụ lục IV đều bám vào. Ghi đè cả bảng bằng một tệp Excel là rủi
   ro không cân xứng với cái lợi — sửa vài dòng một năm thì sửa từng dòng an
   toàn hơn nhiều. Mã minh chứng cũng KHÔNG cho sửa: nó đã in trong báo cáo tự
   đánh giá và đặt tên thư mục trên Drive.
   ============================================================================ */

(function () {
  'use strict';

  if (typeof CAU_HINH === 'undefined' || !CAU_HINH.DA_NOI) return;

  const sb = () => window.sbClient;
  let NHOM = [], NHOM_CON = [], HS = [], TIEU_CHI = [], LOC = '', TC_LOI = '';

  const css = `
  .qh-thanh{display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin-bottom:12px}
  .qh-thanh input,.qh-thanh select{padding:8px 11px;border:1.5px solid #d7dde8;
    border-radius:9px;font-size:13.4px;font-family:inherit;background:#fff}
  .qh-bang{width:100%;border-collapse:collapse;font-size:13.4px}
  .qh-bang th{background:#eef3fb;color:#14306b;font-weight:700;padding:8px 9px;
    border:1px solid #dbe3ef;font-size:12.5px;text-align:left;white-space:nowrap}
  .qh-bang td{border:1px solid #e4e9f2;padding:6px 9px;vertical-align:top}
  .qh-bang tr:hover td{background:#fafcff}
  .qh-ma{font-family:ui-monospace,Menlo,monospace;font-size:12.4px;color:#14306b;font-weight:700}
  .qh-tt{display:inline-block;font-size:11.2px;font-weight:700;padding:2px 7px;border-radius:5px}
  .qh-tt.co{background:#dcfce7;color:#15803d}
  .qh-tt.dang{background:#fef3c7;color:#92400e}
  .qh-tt.chua{background:#f1f5f9;color:#64748b}
  .qh-canh{background:#eef4ff;border:1px solid #cfe0ff;color:#1d4ed8;border-radius:10px;
    padding:12px 15px;font-size:13.5px;margin-bottom:13px;line-height:1.65}
  .qh-do{background:#fdf3f2;border-color:#f3c9c5;color:#8a3428}
  .qh-nho{font-size:12px;color:#64748b}
  .qh-o{display:grid;gap:11px;margin-top:4px}
  .qh-o label{display:block;font-size:12.4px;font-weight:600;color:#14306b;margin-bottom:4px}
  .qh-o input,.qh-o textarea,.qh-o select{width:100%;padding:9px 11px;border:1.5px solid #d7dde8;
    border-radius:9px;font-size:13.6px;font-family:inherit;background:#fff}
  .qh-o textarea{min-height:62px;resize:vertical;line-height:1.6}
  `;
  document.head.insertAdjacentHTML('beforeend', '<style>' + css + '</style>');

  function chan(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function bao(s) { if (typeof notify === 'function') notify(s); }
  function laQuanTri() {
    const u = window.NGUOI_DUNG;
    return !!u && ['admin', 'ban_giam_hieu'].includes(u.vai_tro);
  }

  /* Máy chủ chỉ trả 1000 dòng mỗi lần. Sắp theo khoá chính để thứ tự giữa các
     trang không đổi — không sắp thì dòng bị đọc trùng hoặc rơi mất. */
  async function taiHet(bang, chon) {
    const BUOC = 1000;
    let tuDau = 0, gom = [];
    for (;;) {
      const r = await sb().from(bang).select(chon)
        .order('id', { ascending: true }).range(tuDau, tuDau + BUOC - 1);
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
    const s = sb();
    const [nh, nc, tc] = await Promise.all([
      s.from('nhom_ho_so').select('*').order('so_tt'),
      s.from('nhom_con').select('*').order('so_tt'),
      s.from('tieu_chi').select('ma, ten').order('so_tt')
    ]);
    /* Soi lỗi từng câu — thư viện trả { data:null, error } chứ không ném lỗi.
       Bỏ qua là màn hình hiện danh mục rỗng rồi ai đó tưởng mất dữ liệu. */
    if (nh.error) throw nh.error;
    if (nc.error) throw nc.error;
    NHOM = nh.data || [];
    NHOM_CON = nc.data || [];
    /* Đọc hỏng bộ tiêu chí thì PHẢI NHỚ, không nuốt lỗi. Nuốt rồi để mảng
       rỗng là phần kiểm mã bên dưới tự tắt, mọi mã gõ vào đều được lưu kể cả
       "abc" — minh chứng đó sau này không xuất hiện ở đâu trong Phụ lục IV và
       bảng tự đánh giá, không ai biết vì sao. */
    TIEU_CHI = tc.error ? [] : (tc.data || []);
    TC_LOI = tc.error ? tc.error.message : '';
    HS = await taiHet('ho_so', '*');
  }

  async function ve(hop) {
    if (!laQuanTri()) {
      hop.innerHTML = '<div class="qt-trong">Chỉ quản trị và ban giám hiệu '
        + 'mới sửa được danh mục hồ sơ.</div>';
      return;
    }
    hop.innerHTML = '<div class="qt-trong">Đang tải danh mục…</div>';
    try { await tai(); }
    catch (e) {
      hop.innerHTML = '<div class="qh-canh qh-do"><b>Chưa đọc được danh mục hồ sơ.</b><br>'
        + 'Thầy cô đăng nhập lại. Nếu vẫn vậy thì báo quản trị.<br>'
        + '<span class="qh-nho">Chi tiết: ' + chan(e.message) + '</span></div>';
      return;
    }
    veBang(hop);
  }

  function tenHop(id) {
    const c = NHOM_CON.find(x => x.id === id);
    if (!c) return '—';
    const n = NHOM.find(x => x.id === c.nhom_id);
    return (n ? n.ten + ' › ' : '') + c.ten;
  }

  function locHS() {
    const t = LOC.trim().toLowerCase();
    return t
      ? HS.filter(h => [h.ma, h.ten, h.nguoi_phu_trach, (h.tieu_chi || []).join(' ')]
          .join(' ').toLowerCase().indexOf(t) >= 0)
      : HS;
  }

  function dongBang(h) {
    /* Link do SQL cũ chèn có thể là javascript: — chặn ngay lúc vẽ, đường lưu
       đã kiểm http(s) nhưng dòng cũ thì chưa qua đường đó bao giờ. */
    const link = /^https?:\/\//i.test(h.link_drive || '') ? h.link_drive : '';
    return '<tr>'
      + '<td class="qh-ma">' + chan(h.ma) + '</td>'
      + '<td>' + chan(h.ten) + '<div class="qh-nho">' + chan(tenHop(h.nhom_con_id)) + '</div></td>'
      + '<td>' + chan((h.tieu_chi || []).join(', ') || '—') + '</td>'
      + '<td><span class="qh-tt ' + chan(h.trang_thai) + '">'
        + (h.trang_thai === 'co' ? 'Đã có' : h.trang_thai === 'dang' ? 'Đang làm' : 'Chưa có')
        + '</span></td>'
      + '<td>' + chan(h.nguoi_phu_trach || '—') + '</td>'
      + '<td>' + (link
          ? '<a href="' + chan(link) + '" target="_blank" rel="noopener">📂 mở</a>'
          : '<span class="qh-nho">—</span>') + '</td>'
      + '<td><button class="btn btn-out" data-sua="' + chan(h.ma)
        + '" style="padding:5px 10px;font-size:12.5px">✏ Sửa</button></td>'
      + '</tr>';
  }

  /* Chỉ thay phần thân bảng, GIỮ NGUYÊN ô tìm kiếm. Vẽ lại cả khối thì thẻ
     input bị huỷ và tạo lại: con trỏ nhảy về cuối nên không sửa được giữa
     chuỗi, và bộ gõ tiếng Việt đang ghép dở thì mất phím. */
  function veThan(hop) {
    const ds = locHS();
    const tb = hop.querySelector('.qh-bang tbody');
    if (!tb) { veBang(hop); return; }
    tb.innerHTML = ds.map(dongBang).join('');
    const dem = hop.querySelector('#qhDem');
    if (dem) {
      dem.innerHTML = 'Đang hiện <b>' + ds.length + '</b>'
        + (LOC.trim() ? ' trong tổng ' + HS.length : ' minh chứng') + '.';
    }
    tb.querySelectorAll('[data-sua]').forEach(b =>
      b.addEventListener('click', () => veHopSua(hop, HS.find(x => x.ma === b.dataset.sua))));
  }

  function veBang(hop) {
    const ds = locHS();

    let html = '<div class="qh-canh"><b>Sửa được:</b> tên minh chứng · tiêu chí · trạng thái · '
      + 'người phụ trách · <b>đường dẫn Drive</b> · ghi chú · thứ tự. '
      + 'Thêm được minh chứng mới vào bất kỳ hộp nào.<br>'
      + '<b>Không sửa được mã minh chứng</b> — mã đã in trong báo cáo tự đánh giá và '
      + 'đặt tên thư mục trên Drive, đổi là hai bên lệch nhau.</div>';

    html += '<div class="qh-thanh">'
      + '<input id="qhTim" placeholder="Tìm theo mã, tên, người phụ trách, tiêu chí…" '
      + 'value="' + chan(LOC) + '" style="flex:1;min-width:220px">'
      + '<button class="btn btn-pri" id="qhThem">➕ Thêm minh chứng</button>'
      + '</div>';

    html += '<div class="qh-nho" id="qhDem" style="margin-bottom:8px">Đang hiện <b>' + ds.length
      + '</b>' + (LOC.trim() ? ' trong tổng ' + HS.length : ' minh chứng') + '.</div>';

    html += '<div class="tbl-wrap" style="max-height:52vh;overflow:auto">'
      + '<table class="qh-bang"><thead><tr>'
      + '<th style="width:96px">Mã</th><th>Tên minh chứng</th>'
      + '<th style="width:120px">Tiêu chí</th><th style="width:96px">Trạng thái</th>'
      + '<th style="width:150px">Người phụ trách</th><th style="width:70px">Drive</th>'
      + '<th style="width:64px"></th></tr></thead><tbody>';

    html += ds.map(dongBang).join('');
    html += '</tbody></table></div>';
    hop.innerHTML = html;

    const o = hop.querySelector('#qhTim');
    let hen = null;
    o.addEventListener('input', function () {
      clearTimeout(hen);
      const v = this.value;
      hen = setTimeout(() => { LOC = v; veThan(hop); }, 250);
    });
    hop.querySelector('#qhThem').addEventListener('click', () => veHopSua(hop, null));
    hop.querySelectorAll('[data-sua]').forEach(b =>
      b.addEventListener('click', () => veHopSua(hop, HS.find(x => x.ma === b.dataset.sua))));
  }

  /* ==========================================================================
     HỘP SỬA MỘT MINH CHỨNG
     ========================================================================== */
  function veHopSua(hop, h) {
    const moi = !h;
    const tc = (h && h.tieu_chi) ? h.tieu_chi.join(', ') : '';

    let html = '<div class="qh-canh"><b>' + (moi ? 'Thêm minh chứng mới' : 'Sửa minh chứng ' + chan(h.ma))
      + '</b></div><div class="qh-o">';

    if (moi) {
      html += '<div><label>Mã minh chứng — không đổi được sau khi lưu</label>'
        + '<input id="qhMa" placeholder="MC.1.1.09"></div>';
    }
    html += '<div><label>Hộp hồ sơ</label><select id="qhHop">'
      + NHOM_CON.map(c => '<option value="' + c.id + '"'
          + (h && h.nhom_con_id === c.id ? ' selected' : '') + '>'
          + chan(tenHop(c.id)) + '</option>').join('')
      + '</select></div>'
      + '<div><label>Tên minh chứng</label><input id="qhTen" value="'
        + chan(h ? h.ten : '') + '"></div>'
      + '<div><label>Mã tiêu chí làm minh chứng — ngăn nhau bằng dấu phẩy'
        + (TIEU_CHI.length ? ' (có ' + TIEU_CHI.length + ' tiêu chí)' : '') + '</label>'
        + '<input id="qhTc" value="' + chan(tc) + '" placeholder="1.1, 3.5"></div>'
      + '<div><label>Trạng thái</label><select id="qhTt">'
        + [['chua', 'Chưa có'], ['dang', 'Đang làm'], ['co', 'Đã có']]
            .map(x => '<option value="' + x[0] + '"'
              + (h && h.trang_thai === x[0] ? ' selected' : '') + '>' + x[1] + '</option>').join('')
        + '</select></div>'
      + '<div><label>Người phụ trách</label><input id="qhNguoi" value="'
        + chan(h ? (h.nguoi_phu_trach || '') : '') + '"></div>'
      + '<div><label>Đường dẫn Drive — dán vào đây</label><input id="qhLink" value="'
        + chan(h ? (h.link_drive || '') : '') + '" placeholder="https://drive.google.com/..."></div>'
      + '<div><label>Ghi chú</label><textarea id="qhGc">'
        + chan(h ? (h.ghi_chu || '') : '') + '</textarea></div>'
      + '<div><label>Thứ tự trong hộp</label><input id="qhStt" type="number" value="'
        + (h ? (h.so_tt || 0) : 0) + '"></div>'
      + '</div>';

    html += '<div id="qhLoi"></div><div class="qh-thanh" style="margin-top:14px">'
      + '<button class="btn btn-pri" id="qhLuu">💾 Lưu</button>'
      + '<button class="btn btn-out" id="qhQuay">← Quay lại danh mục</button>'
      + (moi ? '' : '<button class="btn btn-out" id="qhXoa" style="margin-left:auto;color:#b3261e">🗑 Xoá minh chứng này</button>')
      + '</div>';

    hop.innerHTML = html;
    hop.querySelector('#qhQuay').addEventListener('click', () => veBang(hop));
    hop.querySelector('#qhLuu').addEventListener('click', () => luu(hop, h));
    const x = hop.querySelector('#qhXoa');
    if (x) x.addEventListener('click', () => xoa(hop, h));
  }

  function loi(hop, s) {
    const o = hop.querySelector('#qhLoi');
    if (o) o.innerHTML = '<div class="qh-canh qh-do" style="margin-top:11px">' + chan(s) + '</div>';
  }

  async function luu(hop, h) {
    const moi = !h;
    const g = id => (hop.querySelector('#' + id) || {}).value || '';
    const ten = g('qhTen').trim();
    const link = g('qhLink').trim();
    if (!ten) return loi(hop, 'Chưa nhập tên minh chứng.');
    if (link && !/^https?:\/\//i.test(link)) {
      return loi(hop, 'Đường dẫn Drive phải bắt đầu bằng http:// hoặc https://');
    }

    /* Tiêu chí phải có thật trong bộ tiêu chí, không thì bản xuất Phụ lục IV
       và màn hình tự đánh giá sẽ không tìm thấy minh chứng này ở đâu cả. */
    const tc = g('qhTc').split(',').map(s => s.trim()).filter(Boolean);
    if (!TIEU_CHI.length && tc.length) {
      return loi(hop, 'Chưa đọc được bộ tiêu chí nên không kiểm được mã có thật hay không'
        + (TC_LOI ? ' (' + TC_LOI + ')' : '')
        + '. Thầy cô tải lại trang rồi lưu, hoặc xoá trống ô Tiêu chí.');
    }
    if (TIEU_CHI.length) {
      const la = tc.filter(m => !TIEU_CHI.some(t => t.ma === m));
      if (la.length) {
        return loi(hop, 'Không có tiêu chí nào mang mã: ' + la.join(', ')
          + '. Mã hợp lệ: ' + TIEU_CHI.map(t => t.ma).join(', '));
      }
    }

    const ban = {
      nhom_con_id: parseInt(g('qhHop'), 10),
      ten: ten,
      tieu_chi: tc,
      trang_thai: g('qhTt'),
      nguoi_phu_trach: g('qhNguoi').trim() || null,
      link_drive: link || null,
      ghi_chu: g('qhGc').trim() || null,
      so_tt: parseInt(g('qhStt'), 10) || 0,
      cap_nhat_luc: new Date().toISOString(),
      cap_nhat_boi: window.NGUOI_DUNG ? window.NGUOI_DUNG.id : null
    };

    let r;
    if (moi) {
      const ma = g('qhMa').trim().toUpperCase();
      if (!ma) return loi(hop, 'Chưa nhập mã minh chứng.');
      if (HS.some(x => x.ma === ma)) return loi(hop, 'Mã ' + ma + ' đã có rồi.');
      ban.ma = ma;
      r = await sb().from('ho_so').insert(ban).select().single();
    } else {
      r = await sb().from('ho_so').update(ban).eq('ma', h.ma).select().single();
    }
    if (r.error) return loi(hop, 'Chưa lưu được: ' + r.error.message);

    if (moi) HS.push(r.data);
    else Object.assign(h, r.data);
    bao(moi ? ('Đã thêm minh chứng ' + r.data.ma) : ('Đã lưu ' + r.data.ma));
    veBang(hop);
  }

  async function xoa(hop, h) {
    /* Xoá minh chứng là gỡ luôn nó khỏi mọi tiêu chí đang trích dẫn nó trong
       báo cáo tự đánh giá. Hỏi thật kỹ, và bắt gõ lại mã cho chắc tay. */
    const g = window.prompt('XOÁ minh chứng ' + h.ma + ' — "' + h.ten + '"\n\n'
      + 'Thư mục trên Drive KHÔNG bị xoá, nhưng minh chứng này sẽ biến mất khỏi '
      + 'danh mục, khỏi bản xuất Phụ lục IV, và khỏi mọi tiêu chí đang trích dẫn nó '
      + 'trong báo cáo tự đánh giá.\n\n'
      + 'Gõ lại đúng mã "' + h.ma + '" để xác nhận:');
    if (g === null) return;
    if (String(g).trim().toUpperCase() !== h.ma.toUpperCase()) {
      bao('Mã gõ lại không khớp — chưa xoá gì cả.');
      return;
    }
    /* .select() để ĐẾM số dòng thật sự xoá. Không đếm thì khi hàng rào máy
       chủ chặn, lệnh trả về không lỗi mà cũng không xoá dòng nào — màn hình
       vẫn báo "Đã xoá", tải lại trang thì minh chứng còn nguyên. */
    const r = await sb().from('ho_so').delete().eq('ma', h.ma).select('ma');
    if (r.error) { loi(hop, 'Chưa xoá được: ' + r.error.message); return; }
    if (!r.data || !r.data.length) {
      loi(hop, 'Không xoá được minh chứng nào — tài khoản này chưa đủ quyền xoá.');
      return;
    }
    HS = HS.filter(x => x.ma !== h.ma);
    bao('Đã xoá minh chứng ' + h.ma + '.');
    veBang(hop);
  }

  window.qtTabPhu = window.qtTabPhu || [];
  window.qtTabPhu.push({ ma: 'qhs', ten: 'Danh mục Hồ sơ số', ve: ve });
})();
