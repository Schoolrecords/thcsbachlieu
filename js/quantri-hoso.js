/* ============================================================================
   QUẢN TRỊ HỆ THỐNG — TAB "DANH MỤC HỒ SƠ SỐ"

   Hộp sửa ở màn hình Hồ sơ số chỉ đổi được trạng thái, người phụ trách, link
   Drive và ghi chú. Muốn sửa TÊN minh chứng, mã tiêu chí, hay THÊM một minh
   chứng mới thì trước nay phải viết SQL — tức là phải qua người làm phần mềm.
   Tab này để ban giám hiệu tự làm.

   HAI MÀN HÌNH
     · Minh chứng     — sửa / thêm / xoá từng dòng minh chứng
     · Cây danh mục   — sửa / thêm / xoá BỘ PHẬN và HỘP hồ sơ

   VÌ SAO PHẢI CÓ MÀN "CÂY DANH MỤC"
   Ngày 13/8/2026 trường đổi tên hai hộp tổ chuyên môn (bỏ chữ "Tổ trưởng").
   Việc con con ấy phải viết một tệp SQL riêng vì trên app không có chỗ sửa tên
   hộp. Cái gì nhà trường còn đổi hằng năm — tên tổ, tên ban, thứ tự hộp — thì
   phải sửa được ngay trên màn hình.

   VÌ SAO KHÔNG LÀM TẢI LÊN HÀNG LOẠT Ở ĐÂY
   Danh mục minh chứng là cái khung mà cả kho Drive, bảng tự đánh giá và bản
   xuất Phụ lục IV đều bám vào. Ghi đè cả bảng bằng một tệp Excel là rủi ro
   không cân xứng với cái lợi — sửa vài dòng một năm thì sửa từng dòng an toàn
   hơn nhiều. Mã minh chứng cũng KHÔNG cho sửa: nó đã in trong báo cáo tự đánh
   giá và đặt tên thư mục trên Drive.
   ============================================================================ */

(function () {
  'use strict';

  if (typeof CAU_HINH === 'undefined' || !CAU_HINH.DA_NOI) return;

  const sb = () => window.sbClient;
  let NHOM = [], NHOM_CON = [], HS = [], TIEU_CHI = [], LOC = '', TC_LOI = '';
  let MAN = 'mc';   // 'mc' = màn minh chứng · 'cay' = màn cây danh mục

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
  .qh-man{display:flex;gap:8px;margin-bottom:13px;flex-wrap:wrap}
  .qh-man button{padding:9px 15px;border:1.5px solid #d7dde8;background:#fff;color:#334155;
    border-radius:10px;font-size:13.6px;font-weight:600;font-family:inherit;cursor:pointer}
  .qh-man button.chon{background:#14306b;border-color:#14306b;color:#fff}
  .qh-bp{background:#f3f7ff;font-weight:700;color:#14306b}
  .qh-bp td{padding:9px}
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
    veMan(hop);
  }

  function veMan(hop) {
    if (MAN === 'cay') veCay(hop); else veBang(hop);
  }

  /* Thanh chuyển giữa hai màn. Vẽ lại ở đầu MỖI màn nên luôn bám theo màn đang
     mở, không cần giữ tham chiếu thẻ nào. */
  function thanhMan() {
    return '<div class="qh-man">'
      + '<button data-man="mc"' + (MAN === 'mc' ? ' class="chon"' : '') + '>📄 Minh chứng</button>'
      + '<button data-man="cay"' + (MAN === 'cay' ? ' class="chon"' : '') + '>🗂 Cây danh mục — bộ phận &amp; hộp</button>'
      + '</div>';
  }
  function ganThanhMan(hop) {
    hop.querySelectorAll('[data-man]').forEach(b => b.addEventListener('click', () => {
      if (MAN === b.dataset.man) return;
      MAN = b.dataset.man;
      veMan(hop);
    }));
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

    let html = thanhMan();
    html += '<div class="qh-canh"><b>Sửa được:</b> tên minh chứng · tiêu chí · trạng thái · '
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
    ganThanhMan(hop);
  }


  /* ==========================================================================
     MÀN HÌNH "CÂY DANH MỤC" — SỬA BỘ PHẬN VÀ HỘP HỒ SƠ

     Cây có hai tầng: bộ phận (nhom_ho_so) › hộp (nhom_con) › minh chứng.
     Bảng ho_so giữ thêm hai cột chép sẵn tên bộ phận và tên hộp (bo_phan, hop)
     để các bản kết xuất Word/Excel và view tra_ma_cu dùng. Đổi tên ở đây thì
     PHẢI chép sang hai cột đó ngay trong cùng thao tác, không thì bản in ra
     còn tên cũ mà màn hình đã tên mới — không ai biết bên nào đúng.
     ========================================================================== */

  function demHS(nhomConId) {
    return HS.filter(h => h.nhom_con_id === nhomConId).length;
  }

  function veCay(hop) {
    let html = thanhMan();
    html += '<div class="qh-canh"><b>Sửa được:</b> tên bộ phận · tên hộp · thứ tự hiện ra · '
      + 'mô tả bộ phận. Thêm được bộ phận mới và hộp mới.<br>'
      + '<b>Mã hộp không sửa được</b> sau khi lưu — mã đã dùng để nối với thư mục Drive '
      + 'và với các tệp SQL đã chạy.<br>'
      + '<b>Chỉ xoá được hộp rỗng</b> — hộp còn minh chứng thì xoá là mất luôn cả minh chứng '
      + 'bên trong. Muốn xoá thì chuyển hết minh chứng sang hộp khác trước.</div>';

    html += '<div class="qh-thanh">'
      + '<button class="btn btn-pri" id="qhThemHop">➕ Thêm hộp hồ sơ</button>'
      + '<button class="btn btn-out" id="qhThemBP">➕ Thêm bộ phận</button>'
      + '</div>';

    html += '<div class="tbl-wrap" style="max-height:58vh;overflow:auto">'
      + '<table class="qh-bang"><thead><tr>'
      + '<th style="width:70px">Mã hộp</th><th>Tên hộp</th>'
      + '<th style="width:70px">Thứ tự</th><th style="width:100px">Minh chứng</th>'
      + '<th style="width:150px"></th></tr></thead><tbody>';

    const bp = NHOM.slice().sort((a, b) => (a.so_tt || 0) - (b.so_tt || 0));
    bp.forEach(n => {
      const con = NHOM_CON.filter(c => c.nhom_id === n.id)
        .sort((a, b) => (a.so_tt || 0) - (b.so_tt || 0));
      const tong = con.reduce((s, c) => s + demHS(c.id), 0);
      html += '<tr class="qh-bp"><td colspan="3">' + chan(n.bieu_tuong || '📁') + ' '
        + chan(n.ten) + '</td>'
        + '<td>' + tong + ' minh chứng</td>'
        + '<td><button class="btn btn-out" data-suabp="' + n.id
          + '" style="padding:4px 9px;font-size:12.2px">✏ Sửa bộ phận</button></td></tr>';

      if (!con.length) {
        html += '<tr><td colspan="5" class="qh-nho" style="padding-left:22px">'
          + 'Bộ phận này chưa có hộp nào.</td></tr>';
      }
      con.forEach(c => {
        const sl = demHS(c.id);
        html += '<tr>'
          + '<td class="qh-ma" style="padding-left:22px">' + chan(c.ma) + '</td>'
          + '<td>' + chan(c.ten) + '</td>'
          + '<td>' + (c.so_tt || 0) + '</td>'
          + '<td>' + sl + '</td>'
          + '<td><button class="btn btn-out" data-suahop="' + c.id
            + '" style="padding:4px 9px;font-size:12.2px">✏ Sửa</button>'
          + (sl === 0
              ? ' <button class="btn btn-out" data-xoahop="' + c.id
                + '" style="padding:4px 9px;font-size:12.2px;color:#b3261e">🗑</button>'
              : '')
          + '</td></tr>';
      });
    });

    html += '</tbody></table></div>';
    hop.innerHTML = html;

    ganThanhMan(hop);
    hop.querySelector('#qhThemHop').addEventListener('click', () => veSuaHop(hop, null));
    hop.querySelector('#qhThemBP').addEventListener('click', () => veSuaBP(hop, null));
    hop.querySelectorAll('[data-suahop]').forEach(b => b.addEventListener('click',
      () => veSuaHop(hop, NHOM_CON.find(x => x.id === +b.dataset.suahop))));
    hop.querySelectorAll('[data-xoahop]').forEach(b => b.addEventListener('click',
      () => xoaHop(hop, NHOM_CON.find(x => x.id === +b.dataset.xoahop))));
    hop.querySelectorAll('[data-suabp]').forEach(b => b.addEventListener('click',
      () => veSuaBP(hop, NHOM.find(x => x.id === +b.dataset.suabp))));
  }


  /* ---------- Hộp hồ sơ ---------- */

  function veSuaHop(hop, c) {
    const moi = !c;
    const sl = moi ? 0 : demHS(c.id);

    let html = '<div class="qh-canh"><b>' + (moi ? 'Thêm hộp hồ sơ mới' : 'Sửa hộp ' + chan(c.ma))
      + '</b>' + (moi ? '' : ' — đang chứa ' + sl + ' minh chứng') + '</div><div class="qh-o">';

    if (moi) {
      html += '<div><label>Mã hộp — chữ và số, không dấu, không đổi được sau khi lưu</label>'
        + '<input id="qhcMa" placeholder="H19"></div>';
    }
    html += '<div><label>Bộ phận chứa hộp này</label><select id="qhcBP">'
      + NHOM.slice().sort((a, b) => (a.so_tt || 0) - (b.so_tt || 0))
          .map(n => '<option value="' + n.id + '"'
            + (c && c.nhom_id === n.id ? ' selected' : '') + '>' + chan(n.ten) + '</option>').join('')
      + '</select></div>'
      + '<div><label>Tên hộp — hiện ngay trên đầu bảng ở màn hình Hồ sơ số</label>'
        + '<input id="qhcTen" value="' + chan(c ? c.ten : '')
        + '" placeholder="Hộp 19 · Tổ Ngoại ngữ"></div>'
      + '<div><label>Thứ tự hộp trong bộ phận</label>'
        + '<input id="qhcStt" type="number" value="' + (c ? (c.so_tt || 0) : 0) + '"></div>';

    if (!moi && sl) {
      html += '<div><label>Đặt lại Người phụ trách cho CẢ ' + sl + ' minh chứng trong hộp</label>'
        + '<input id="qhcPT" placeholder="Để trống thì không đụng gì">'
        + '<div class="qh-nho" style="margin-top:5px">Chỉ điền khi muốn ghi đè. '
        + 'Điền vào là <b>tất cả ' + sl + ' dòng</b> đổi theo, kể cả dòng đã gán tên riêng.</div></div>';
    }
    html += '</div>';

    html += '<div id="qhLoi"></div><div class="qh-thanh" style="margin-top:14px">'
      + '<button class="btn btn-pri" id="qhcLuu">💾 Lưu</button>'
      + '<button class="btn btn-out" id="qhcQuay">← Quay lại cây danh mục</button>'
      + '</div>';

    hop.innerHTML = html;
    hop.querySelector('#qhcQuay').addEventListener('click', () => veCay(hop));
    hop.querySelector('#qhcLuu').addEventListener('click', () => luuHop(hop, c));
  }

  async function luuHop(hop, c) {
    const moi = !c;
    const g = id => (hop.querySelector('#' + id) || {}).value || '';
    const ten = g('qhcTen').trim();
    if (!ten) return loi(hop, 'Chưa nhập tên hộp.');

    const nhomId = parseInt(g('qhcBP'), 10);
    if (!nhomId) return loi(hop, 'Chưa chọn bộ phận.');
    const nhom = NHOM.find(n => n.id === nhomId);

    const ban = { nhom_id: nhomId, ten: ten, so_tt: parseInt(g('qhcStt'), 10) || 0 };

    let r;
    if (moi) {
      const ma = g('qhcMa').trim().toUpperCase();
      if (!ma) return loi(hop, 'Chưa nhập mã hộp.');
      /* Mã hộp đi vào tên thư mục Drive và vào các câu SQL sau này — chặn dấu
         cách, dấu tiếng Việt và ký tự lạ ngay từ đây. */
      if (!/^[A-Z0-9]{1,10}$/.test(ma)) {
        return loi(hop, 'Mã hộp chỉ gồm chữ cái không dấu và chữ số, tối đa 10 ký tự. '
          + 'Ví dụ: H19.');
      }
      if (NHOM_CON.some(x => x.ma === ma)) return loi(hop, 'Mã hộp ' + ma + ' đã có rồi.');
      ban.ma = ma;
      r = await sb().from('nhom_con').insert(ban).select().single();
    } else {
      r = await sb().from('nhom_con').update(ban).eq('id', c.id).select().single();
    }
    if (r.error) return loi(hop, 'Chưa lưu được hộp: ' + r.error.message);

    /* Chép tên hộp và tên bộ phận sang từng minh chứng bên trong. Hộp mới thì
       chưa có minh chứng nào nên bỏ qua. */
    if (!moi && demHS(c.id)) {
      const dong = { hop: ten, cap_nhat_luc: new Date().toISOString() };
      if (nhom) dong.bo_phan = nhom.ten;

      const pt = g('qhcPT').trim();
      if (pt) {
        const sl = demHS(c.id);
        if (!window.confirm('Ghi đè Người phụ trách của cả ' + sl + ' minh chứng trong hộp "'
            + ten + '" thành "' + pt + '"?\n\nDòng nào đang ghi tên riêng cũng bị đổi theo.')) {
          return loi(hop, 'Đã huỷ — chưa ghi đè Người phụ trách. Tên hộp thì đã lưu rồi.');
        }
        dong.nguoi_phu_trach = pt;
      }
      const rd = await sb().from('ho_so').update(dong).eq('nhom_con_id', c.id).select('ma');
      if (rd.error) {
        return loi(hop, 'Đã đổi tên hộp, nhưng CHƯA chép được tên mới xuống các minh chứng: '
          + rd.error.message + '. Thầy cô lưu lại lần nữa.');
      }
      bao('Đã lưu hộp và cập nhật ' + (rd.data || []).length + ' minh chứng bên trong.');
    } else {
      bao(moi ? ('Đã thêm hộp ' + r.data.ma) : ('Đã lưu hộp ' + r.data.ma));
    }

    await tai();
    veCay(hop);
  }

  async function xoaHop(hop, c) {
    /* Khoá ngoại ho_so.nhom_con_id đặt "on delete cascade" (tệp sql/01): xoá
       hộp là xoá sạch minh chứng bên trong mà máy chủ không hỏi lại câu nào.
       Nên chặn ngay ở đây, và đếm lại ngay trước khi xoá chứ không tin con số
       vẽ trên màn hình — danh sách có thể đã cũ. */
    const r0 = await sb().from('ho_so').select('ma').eq('nhom_con_id', c.id);
    if (r0.error) { bao('Chưa kiểm được hộp có rỗng không: ' + r0.error.message); return; }
    if (r0.data && r0.data.length) {
      await tai();
      veCay(hop);
      bao('Hộp "' + c.ten + '" đang có ' + r0.data.length + ' minh chứng nên không xoá được. '
        + 'Chuyển hết sang hộp khác rồi hãy xoá.');
      return;
    }
    if (!window.confirm('Xoá hộp "' + c.ten + '" (mã ' + c.ma + ')?\n\n'
        + 'Hộp đang rỗng nên không mất minh chứng nào. Thư mục trên Drive KHÔNG bị xoá.')) return;

    const r = await sb().from('nhom_con').delete().eq('id', c.id).select('id');
    if (r.error) { bao('Chưa xoá được: ' + r.error.message); return; }
    if (!r.data || !r.data.length) { bao('Không xoá được — tài khoản này chưa đủ quyền.'); return; }
    bao('Đã xoá hộp ' + c.ma + '.');
    await tai();
    veCay(hop);
  }


  /* ---------- Bộ phận ---------- */

  function veSuaBP(hop, n) {
    const moi = !n;
    const soHop = moi ? 0 : NHOM_CON.filter(c => c.nhom_id === n.id).length;

    let html = '<div class="qh-canh"><b>' + (moi ? 'Thêm bộ phận mới' : 'Sửa bộ phận')
      + '</b>' + (moi ? '' : ' — đang có ' + soHop + ' hộp') + '</div><div class="qh-o">'
      + '<div><label>Tên bộ phận — viết hoa như các bộ phận đang có</label>'
        + '<input id="qhbTen" value="' + chan(n ? n.ten : '') + '" placeholder="NGOẠI NGỮ"></div>'
      + '<div><label>Mô tả — dòng chữ nhỏ dưới tên bộ phận ở màn hình Hồ sơ số</label>'
        + '<textarea id="qhbMt">' + chan(n ? (n.mo_ta || '') : '') + '</textarea></div>'
      + '<div><label>Biểu tượng — một ký tự emoji</label>'
        + '<input id="qhbBt" value="' + chan(n ? (n.bieu_tuong || '') : '') + '" placeholder="📚"></div>'
      + '<div><label>Thứ tự bộ phận — mỗi bộ phận một số riêng, không trùng nhau</label>'
        + '<input id="qhbStt" type="number" value="' + (n ? (n.so_tt || 0) : (NHOM.length + 1)) + '"></div>'
      + '</div>';

    html += '<div id="qhLoi"></div><div class="qh-thanh" style="margin-top:14px">'
      + '<button class="btn btn-pri" id="qhbLuu">💾 Lưu</button>'
      + '<button class="btn btn-out" id="qhbQuay">← Quay lại cây danh mục</button>'
      + (moi || soHop ? ''
          : '<button class="btn btn-out" id="qhbXoa" style="margin-left:auto;color:#b3261e">'
            + '🗑 Xoá bộ phận rỗng này</button>')
      + '</div>';

    hop.innerHTML = html;
    hop.querySelector('#qhbQuay').addEventListener('click', () => veCay(hop));
    hop.querySelector('#qhbLuu').addEventListener('click', () => luuBP(hop, n));
    const x = hop.querySelector('#qhbXoa');
    if (x) x.addEventListener('click', () => xoaBP(hop, n));
  }

  async function luuBP(hop, n) {
    const moi = !n;
    const g = id => (hop.querySelector('#' + id) || {}).value || '';
    const ten = g('qhbTen').trim();
    if (!ten) return loi(hop, 'Chưa nhập tên bộ phận.');

    const stt = parseInt(g('qhbStt'), 10);
    if (!Number.isFinite(stt)) return loi(hop, 'Chưa nhập thứ tự bộ phận.');
    /* nhom_ho_so.so_tt khai báo "not null unique" ở tệp sql/01 — trùng số là
       máy chủ trả lỗi khoá trùng khó đọc. Bắt trước ở đây cho rõ nghĩa. */
    const dung = NHOM.find(x => (x.so_tt || 0) === stt && (moi || x.id !== n.id));
    if (dung) return loi(hop, 'Thứ tự ' + stt + ' đang là của bộ phận "' + dung.ten
      + '". Mỗi bộ phận phải một số riêng.');

    const ban = {
      ten: ten,
      mo_ta: g('qhbMt').trim() || null,
      bieu_tuong: g('qhbBt').trim() || null,
      so_tt: stt
    };

    let r;
    if (moi) r = await sb().from('nhom_ho_so').insert(ban).select().single();
    else     r = await sb().from('nhom_ho_so').update(ban).eq('id', n.id).select().single();
    if (r.error) return loi(hop, 'Chưa lưu được bộ phận: ' + r.error.message);

    /* Chép tên bộ phận xuống mọi minh chứng thuộc các hộp của nó */
    if (!moi) {
      const ids = NHOM_CON.filter(c => c.nhom_id === n.id).map(c => c.id);
      if (ids.length) {
        const rd = await sb().from('ho_so')
          .update({ bo_phan: ten, cap_nhat_luc: new Date().toISOString() })
          .in('nhom_con_id', ids).select('ma');
        if (rd.error) {
          return loi(hop, 'Đã đổi tên bộ phận, nhưng CHƯA chép được tên mới xuống các minh '
            + 'chứng: ' + rd.error.message + '. Thầy cô lưu lại lần nữa.');
        }
      }
    }
    bao(moi ? 'Đã thêm bộ phận.' : 'Đã lưu bộ phận.');
    await tai();
    veCay(hop);
  }

  async function xoaBP(hop, n) {
    /* Cùng cái bẫy như xoá hộp: nhom_con.nhom_id cũng "on delete cascade",
       xoá bộ phận là kéo theo cả hộp lẫn minh chứng. Đếm lại từ máy chủ. */
    const r0 = await sb().from('nhom_con').select('id').eq('nhom_id', n.id);
    if (r0.error) { bao('Chưa kiểm được bộ phận có rỗng không: ' + r0.error.message); return; }
    if (r0.data && r0.data.length) {
      await tai();
      veCay(hop);
      bao('Bộ phận "' + n.ten + '" đang có ' + r0.data.length + ' hộp nên không xoá được.');
      return;
    }
    if (!window.confirm('Xoá bộ phận "' + n.ten + '"?\n\nBộ phận đang không có hộp nào.')) return;

    const r = await sb().from('nhom_ho_so').delete().eq('id', n.id).select('id');
    if (r.error) { bao('Chưa xoá được: ' + r.error.message); return; }
    if (!r.data || !r.data.length) { bao('Không xoá được — tài khoản này chưa đủ quyền.'); return; }
    bao('Đã xoá bộ phận.');
    await tai();
    veCay(hop);
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

    /* Hai cột chép sẵn tên hộp và tên bộ phận phải đi theo hộp vừa chọn. Không
       ghi thì minh chứng chuyển sang hộp khác vẫn mang nhãn hộp cũ trong bản
       xuất Word/Excel và trong view tra_ma_cu — màn hình đúng, bản in sai. */
    const oHop = NHOM_CON.find(x => x.id === ban.nhom_con_id);
    if (oHop) {
      ban.hop = oHop.ten;
      const oBP = NHOM.find(x => x.id === oHop.nhom_id);
      if (oBP) ban.bo_phan = oBP.ten;
    }

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
  /* tt = số thứ tự trong hàng tab, do thầy Chung chốt: việc thường ngày của
     nhà trường xếp trước, việc quản trị tài khoản xếp sau. */
  window.qtTabPhu.push({ ma: 'qhs', ten: 'Danh mục Hồ sơ số', tt: 20, ve: ve });
})();
