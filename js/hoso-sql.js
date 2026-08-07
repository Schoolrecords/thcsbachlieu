/* ============================================================================
   HỒ SƠ SỐ — ĐỌC VÀ GHI THẬT TỪ CƠ SỞ DỮ LIỆU

   Tệp này thay dữ liệu gõ cứng trong trang bằng dữ liệu thật trong Supabase,
   và cho phép sửa trực tiếp trên giao diện.

   Cách làm: không sửa gì trong index.html. Sau khi đăng nhập xong, tệp này
   tải dữ liệu về, đổ vào đúng mảng CATS mà trang đang dùng, rồi gọi lại hàm
   vẽ có sẵn. Nhờ vậy giao diện giữ nguyên như thầy đã duyệt.

   Ai sửa được gì:
     · Quản trị hệ thống, Ban giám hiệu  → sửa mọi hồ sơ
     · Người được phân công phụ trách    → chỉ sửa hồ sơ của mình
   Việc chặn thật nằm ở máy chủ (RLS), phần kiểm tra ở đây chỉ để ẩn nút.
   ============================================================================ */

(function () {
  'use strict';

  if (typeof CAU_HINH === 'undefined' || !CAU_HINH.DA_NOI) return;

  let sb = null;
  let ANH_XA = {};        // mã hồ sơ  ->  bản ghi đầy đủ trong cơ sở dữ liệu
  let DS_TAI_KHOAN = [];  // danh sách người dùng, dùng cho ô chọn người phụ trách
  let CAT_DANG_MO = null; // nhóm đang mở trong lớp phủ, để vẽ lại sau khi lưu

  /* ========================================================================
     KIỂU DÁNG CHO Ô SỬA
     ======================================================================== */
  const css = `
  .hs-sua{margin-left:6px}
  .hs-lop{position:fixed;inset:0;z-index:9300;background:rgba(10,20,45,.55);
    display:none;align-items:flex-end;justify-content:center}
  .hs-lop.hien{display:flex}
  @media(min-width:760px){.hs-lop{align-items:center;padding:24px}}
  .hs-hop{background:#fff;width:100%;max-width:620px;max-height:92vh;overflow:auto;
    border-radius:18px 18px 0 0;display:flex;flex-direction:column}
  @media(min-width:760px){.hs-hop{border-radius:18px}}
  .hs-dau{padding:18px 20px;background:#14306b;color:#fff;display:flex;align-items:flex-start;gap:12px;
    position:sticky;top:0;z-index:2}
  .hs-dau .ma{background:#c8901c;border-radius:8px;padding:4px 10px;font-weight:700;font-size:13px;flex:none}
  .hs-dau h3{margin:0;font-size:16px;line-height:1.4;flex:1;font-weight:600}
  .hs-dau button{background:rgba(255,255,255,.15);border:0;color:#fff;width:32px;height:32px;
    border-radius:8px;cursor:pointer;font-size:15px;font-family:inherit;flex:none}
  .hs-than{padding:20px}
  .hs-o{margin-bottom:18px}
  .hs-o label{display:block;font-size:12.5px;font-weight:600;color:#14306b;
    margin-bottom:7px;text-transform:uppercase;letter-spacing:.03em}
  .hs-o input,.hs-o select,.hs-o textarea{width:100%;padding:11px 13px;border:1.5px solid #d7dde8;
    border-radius:10px;font-size:15px;font-family:inherit;background:#fff;color:#1f2937}
  .hs-o input:focus,.hs-o select:focus,.hs-o textarea:focus{outline:0;border-color:#14306b}
  .hs-o textarea{min-height:74px;resize:vertical}
  .hs-o .goi-y{font-size:12px;color:#8a94a6;margin-top:6px;line-height:1.5}
  .hs-tt{display:flex;gap:8px;flex-wrap:wrap}
  .hs-tt button{flex:1 1 120px;min-height:48px;border:1.5px solid #d7dde8;background:#fff;
    border-radius:10px;cursor:pointer;font-size:14px;font-weight:600;font-family:inherit;
    color:#64748b;transition:.15s}
  .hs-tt button.chon[data-tt="co"]{background:#dcfce7;border-color:#15803d;color:#15803d}
  .hs-tt button.chon[data-tt="dang"]{background:#fef3c7;border-color:#b45309;color:#b45309}
  .hs-tt button.chon[data-tt="chua"]{background:#fee2e2;border-color:#b91c1c;color:#b91c1c}
  .hs-chan{padding:16px 20px;border-top:1px solid #eef1f6;display:flex;gap:10px;
    position:sticky;bottom:0;background:#fff}
  .hs-chan button{flex:1;min-height:50px;border:0;border-radius:11px;cursor:pointer;
    font-size:15px;font-weight:600;font-family:inherit}
  .hs-chan .huy{background:#f1f5f9;color:#475569}
  .hs-chan .luu{background:#14306b;color:#fff}
  .hs-chan .luu:disabled{opacity:.6;cursor:default}
  .hs-loi{margin:0 20px 16px;padding:11px 13px;border-radius:10px;background:#fef2f2;
    border:1px solid #fecaca;color:#b91c1c;font-size:13.5px;line-height:1.5;display:none}
  .hs-loi.hien{display:block}
  .hs-dangtai{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:8000;
    background:#14306b;color:#fff;padding:14px 22px;border-radius:12px;font-size:14.5px;
    box-shadow:0 12px 32px rgba(0,0,0,.25);display:none}
  .hs-dangtai.hien{display:block}
  `;
  document.head.insertAdjacentHTML('beforeend', '<style>' + css + '</style>');

  const bangTai = document.createElement('div');
  bangTai.className = 'hs-dangtai';
  bangTai.textContent = 'Đang tải dữ liệu hồ sơ…';
  document.body.appendChild(bangTai);

  /* Giáo viên chưa được giao hồ sơ nào — KHÔNG phải lỗi.
     Quan trọng: phải dọn sạch danh mục mẫu trên trang, nếu không thầy cô sẽ
     thấy nguyên danh mục giả của toàn trường và tưởng đó là dữ liệu thật. */
  function veTrangKhongCoHoSo() {
    /* CATS khai báo const ở phạm vi script của trang nên KHÔNG nằm trên
       window — bản vá trước dùng window.CATS nên không dọn được gì, thầy cô
       gõ tìm kiếm là đổ ra nguyên danh mục mẫu của cả trường. */
    if (typeof CATS !== 'undefined' && Array.isArray(CATS)) CATS.length = 0;

    /* KHÔNG đụng vào thanh chỉ số đầu trang. Đó là số của cả trường, đặt về 0
       chỉ vì người này chưa được giao hồ sơ là sai và gây hiểu nhầm. */
    const oCats = document.getElementById('hsCats');
    const oStats = document.getElementById('hsStats');
    const oTim = document.getElementById('hsSearchResult');
    if (oStats) oStats.innerHTML = '';
    if (oTim) oTim.innerHTML = '';
    if (oCats) {
      oCats.style.display = '';
      oCats.innerHTML =
        '<div style="background:#eef4ff;border:1px solid #cfe0ff;color:#1d4ed8;'
        + 'border-radius:12px;padding:20px 22px;font-size:14px;line-height:1.7">'
        + '<b>Thầy cô chưa được giao hồ sơ nào.</b><br>'
        + 'Hệ thống chỉ hiện những hồ sơ mà thầy cô được phân công phụ trách. '
        + 'Nếu thầy cô đang phụ trách hồ sơ mà chưa thấy ở đây, đề nghị báo '
        + 'Ban giám hiệu gán người phụ trách trong danh mục hồ sơ.'
        + '</div>';
    }
    /* KHÔNG bật thông báo nổi. Việc tải dữ liệu chạy ngay lúc đăng nhập, khi
       thầy cô còn đang ở trang chủ — bật thông báo lúc đó là làm phiền vô cớ.
       Lời nhắc đã nằm sẵn trong mục Hồ sơ số, ai vào mới thấy. */
  }

  /* ========================================================================
     TẢI DỮ LIỆU VÀ ĐỔ VÀO MẢNG CATS CÓ SẴN
     ======================================================================== */
  async function taiDuLieu() {
    bangTai.classList.add('hien');
    try {
      const [nhom, nhomCon, hoSo] = await Promise.all([
        sb.from('nhom_ho_so').select('*').order('so_tt'),
        sb.from('nhom_con').select('*').order('so_tt'),
        sb.from('ho_so').select('*').order('so_tt')
      ]);

      const loi = nhom.error || nhomCon.error || hoSo.error;
      if (loi) throw loi;

      /* Không có hồ sơ nào — từ khi siết phân quyền ở tệp sql/18 thì đây có
         HAI nguyên nhân khác hẳn nhau, phải phân biệt:
           · Người xem hết mà vẫn trống  -> đúng là cơ sở dữ liệu chưa có gì.
           · Giáo viên, nhân viên trống  -> BÌNH THƯỜNG, chỉ là chưa được giao
             hồ sơ nào. Trước đây báo "chưa chạy tệp 02" là sai và làm thầy cô
             hoảng, lại còn rơi về dữ liệu mẫu nên hiện cả danh mục giả của
             toàn trường. */
      if (!hoSo.data || !hoSo.data.length) {
        const u = window.NGUOI_DUNG;
        const xemHet = !!u && ['admin', 'ban_giam_hieu', 'to_truong'].includes(u.vai_tro);
        if (xemHet) {
          throw new Error('Cơ sở dữ liệu chưa có hồ sơ nào. Kiểm tra lại đã chạy tệp '
            + '02-du-lieu-danh-muc.sql chưa.');
        }
        veTrangKhongCoHoSo();
        return;
      }

      ANH_XA = {};
      hoSo.data.forEach(h => { ANH_XA[h.ma] = h; });

      const catsMoi = nhom.data.map(n => ({
        id: n.so_tt,
        ico: n.bieu_tuong || '📁',
        name: n.ten,
        desc: n.mo_ta || '',
        subs: nhomCon.data
          .filter(c => c.nhom_id === n.id)
          .map(c => ({
            code: c.ma,
            name: c.ten,
            items: hoSo.data
              .filter(h => h.nhom_con_id === c.id)
              /* [5] là mã cũ theo bảng mã TT 18/2018 — hiện cạnh mã mới để
                 thầy cô đối chiếu với hồ sơ giấy đang dùng */
              .map(h => [h.ma, h.ten, h.nguoi_phu_trach || '—', h.trang_thai,
                         h.tieu_chi || [], h.ma_cu || ''])
          }))
      }));

      /* CATS khai báo bằng const nên không gán đè được, phải thay từng phần tử */
      CATS.length = 0;
      catsMoi.forEach(c => CATS.push(c));

      renderCats();
      /* Không báo gì khi tải xong. Việc tải chạy ngay lúc đăng nhập, khi thầy
         cô còn ở trang chủ — bật thông báo lúc đó là làm phiền vô cớ. Dữ liệu
         hiện ra trên màn hình đã là bằng chứng tải xong rồi. */
    } catch (e) {
      console.error('[Hồ sơ số] Không tải được dữ liệu:', e);
      if (typeof notify === 'function') {
        notify('Không tải được dữ liệu: ' + (e.message || e) + ' — trang đang hiển thị dữ liệu mẫu.');
      }
    } finally {
      bangTai.classList.remove('hien');
    }
  }

  async function taiDanhSachTaiKhoan() {
    const { data } = await sb.from('nguoi_dung')
      .select('id, ho_ten, email, chuc_vu, vai_tro')
      .eq('trang_thai', 'hoat_dong').order('ho_ten');
    DS_TAI_KHOAN = data || [];
  }

  /* ========================================================================
     QUYỀN SỬA
     ======================================================================== */
  function laQuanTri() {
    const u = window.NGUOI_DUNG;
    return !!u && ['admin', 'ban_giam_hieu'].includes(u.vai_tro);
  }
  function coQuyenSua(hs) {
    const u = window.NGUOI_DUNG;
    if (!u || !hs) return false;
    if (laQuanTri() || hs.phu_trach_id === u.id) return true;
    /* Phân quyền theo Gmail phụ trách hộp: nhiều người cách nhau dấu phẩy,
       dấu '*' nghĩa là mọi tài khoản đã duyệt (Hộp 15 - Giáo viên) */
    const ds = String(hs.phu_trach_email || '').toLowerCase();
    if (ds === '*') return true;
    return ds.split(',').map(s => s.trim()).includes(String(u.email || '').toLowerCase());
  }

  /* ========================================================================
     VẼ LẠI DÒNG HỒ SƠ — thêm nút sửa và mở Drive thật
     Ghi đè hàm cùng tên trong index.html, không sửa tệp đó.
     ======================================================================== */
  window.rowHtml = function (it) {
    const [ma, ten, ng, st, crit, maCu] = it;
    const hs = ANH_XA[ma];
    const suaDuoc = coQuyenSua(hs);
    const coLink = hs && hs.link_drive;
    const tenSach = String(ten).replace(/'/g, '');
    const cu = maCu || (hs && hs.ma_cu) || '';

    return `<tr>
      <td class="code">${ma}${cu
        ? `<span class="ma-cu" title="Mã theo bảng mã cũ, dùng để đối chiếu hồ sơ giấy">${cu}</span>`
        : `<span class="ma-cu ma-moi" title="Minh chứng mới do Thông tư 57 yêu cầu">mục mới</span>`}</td>
      <td class="rname">${ten}<span class="crits">${(crit || []).map(c =>
        `<span class="tag-crit" onclick="event.stopPropagation();showCrit('${c}')">Tiêu chí ${c}</span>`).join('')}</span></td>
      <td class="owner tdow">${ng || '—'}</td>
      <td class="tdst">
        <span class="st st-${st}">${ST_LABEL[st]}</span>
        ${coLink
          /* Đã có thư mục thì dùng THẺ LIÊN KẾT THẬT, không dùng window.open.
             Trên điện thoại, window.open bị Chrome và Safari coi là cửa sổ
             bật lên và chặn thẳng — thầy cô bấm 📂 thì không có gì xảy ra,
             tưởng nút hỏng. Điều hướng từ một liên kết thì trình duyệt nào
             cũng cho qua, lại còn giữ được thao tác "mở trong tab mới". */
          ? `<a class="drive" href="${String(hs.link_drive).replace(/"/g, '&quot;')}"
                target="_blank" rel="noopener"
                title="Mở thư mục trên Drive"
                onclick="event.stopPropagation()">📂</a>`
          : `<button class="drive" style="opacity:.4" title="Chưa gán thư mục Drive"
                onclick="event.stopPropagation();openDrive('${ma}','${tenSach}')">📂</button>`}
        ${suaDuoc ? `<button class="drive hs-sua" title="Sửa hồ sơ này"
                onclick="event.stopPropagation();moSuaHoSo('${ma}')">✏️</button>` : ''}
      </td>
    </tr>`;
  };

  /* Cho index.html tra bản ghi đầy đủ của một minh chứng theo mã.
     Dùng cho nút "Hồ sơ của tôi" để biết ai phụ trách minh chứng nào. */
  window.layHoSo = function (ma) { return ANH_XA[ma] || null; };

  /* Mở thư mục Drive thật thay vì chỉ hiện thông báo */
  window.openDrive = function (ma, ten) {
    const hs = ANH_XA[ma];

    if (hs && hs.link_drive) {                 // hồ sơ đã gán thư mục -> mở thật
      window.open(hs.link_drive, '_blank', 'noopener');
      return;
    }
    if (hs) {                                  // hồ sơ trong danh mục, chưa gán
      notify(coQuyenSua(hs)
        ? 'Hồ sơ này chưa gán thư mục Drive. Bấm nút ✏️ để dán đường dẫn vào.'
        : 'Hồ sơ “' + hs.ten + '” chưa được gán thư mục trên Drive.');
      return;
    }
    /* Gọi từ màn hình khác (hồ sơ cá nhân CBGV, hồ sơ học sinh) — chỉ có một tham số */
    notify('“' + (ten || ma) + '” chưa được gán thư mục trên Drive.');
  };

  /* Nhớ nhóm đang mở để vẽ lại sau khi lưu */
  const openCatGoc = window.openCat;
  window.openCat = function (id) {
    CAT_DANG_MO = id;
    openCatGoc(id);
  };

  /* ========================================================================
     Ô SỬA HỒ SƠ
     ======================================================================== */
  const oSua = document.createElement('div');
  oSua.className = 'hs-lop';
  oSua.innerHTML = `
    <div class="hs-hop">
      <div class="hs-dau">
        <span class="ma" id="hsMa"></span>
        <h3 id="hsTen"></h3>
        <button id="hsDong">✕</button>
      </div>
      <div class="hs-than">
        <div class="hs-o">
          <label>Trạng thái hồ sơ</label>
          <div class="hs-tt" id="hsTt">
            <button type="button" data-tt="co">Đã có</button>
            <button type="button" data-tt="dang">Đang cập nhật</button>
            <button type="button" data-tt="chua">Chưa có</button>
          </div>
        </div>
        <div class="hs-o">
          <label>Người phụ trách</label>
          <input id="hsNguoi" placeholder="Ví dụ: Hiệu trưởng, Văn thư, Tổ trưởng tổ Ngữ văn…">
          <div class="goi-y">Tên chức danh hiển thị trong bảng danh mục.</div>
        </div>
        <div class="hs-o" id="hsOTaiKhoan">
          <label>Giao quyền sửa cho tài khoản</label>
          <select id="hsTaiKhoan"><option value="">— Không giao cho ai —</option></select>
          <div class="goi-y">Người được chọn sẽ tự sửa được hồ sơ này mà không cần quản trị.</div>
        </div>
        <div class="hs-o">
          <label>Đường dẫn thư mục Google Drive</label>
          <input id="hsLink" placeholder="https://drive.google.com/drive/folders/…">
          <div class="goi-y">Dán đường dẫn thư mục chứa tệp của hồ sơ này.</div>
        </div>
        <div class="hs-o">
          <label>Ghi chú</label>
          <textarea id="hsGhiChu" placeholder="Ghi chú nội bộ, ví dụ: còn thiếu biên bản tháng 9…"></textarea>
        </div>
      </div>
      <div class="hs-loi" id="hsLoi"></div>
      <div class="hs-chan">
        <button class="huy" id="hsHuy">Huỷ</button>
        <button class="luu" id="hsLuu">Lưu thay đổi</button>
      </div>
    </div>`;
  document.body.appendChild(oSua);

  let maDangSua = null;
  let ttDangChon = null;

  const $ = id => document.getElementById(id);

  function dongOSua() {
    oSua.classList.remove('hien');
    document.body.style.overflow = '';
    $('hsLoi').classList.remove('hien');
  }

  window.moSuaHoSo = function (ma) {
    const hs = ANH_XA[ma];
    if (!hs) return;
    if (!coQuyenSua(hs)) {
      notify('Thầy cô không được phân công phụ trách hồ sơ này.');
      return;
    }

    maDangSua = ma;
    ttDangChon = hs.trang_thai;

    $('hsMa').textContent = hs.ma;
    $('hsTen').textContent = hs.ten;
    $('hsNguoi').value = hs.nguoi_phu_trach || '';
    $('hsLink').value = hs.link_drive || '';
    $('hsGhiChu').value = hs.ghi_chu || '';
    veNutTrangThai();

    /* Chỉ quản trị mới được giao quyền cho người khác */
    const oTk = $('hsOTaiKhoan');
    if (laQuanTri()) {
      oTk.style.display = '';
      const sel = $('hsTaiKhoan');
      sel.innerHTML = '<option value="">— Không giao cho ai —</option>' +
        DS_TAI_KHOAN.map(u =>
          `<option value="${u.id}" ${hs.phu_trach_id === u.id ? 'selected' : ''}>${u.ho_ten}${u.chuc_vu ? ' — ' + u.chuc_vu : ''}</option>`
        ).join('');
    } else {
      oTk.style.display = 'none';
    }

    oSua.classList.add('hien');
    document.body.style.overflow = 'hidden';
  };

  function veNutTrangThai() {
    $('hsTt').querySelectorAll('button').forEach(b => {
      b.classList.toggle('chon', b.dataset.tt === ttDangChon);
    });
  }

  $('hsTt').addEventListener('click', e => {
    const b = e.target.closest('button[data-tt]');
    if (!b) return;
    ttDangChon = b.dataset.tt;
    veNutTrangThai();
  });

  $('hsDong').addEventListener('click', dongOSua);
  $('hsHuy').addEventListener('click', dongOSua);
  oSua.addEventListener('click', e => { if (e.target === oSua) dongOSua(); });

  $('hsLuu').addEventListener('click', async function () {
    const nut = this;
    const link = $('hsLink').value.trim();

    if (link && !/^https?:\/\//i.test(link)) {
      hienLoi('Đường dẫn Drive phải bắt đầu bằng http:// hoặc https://');
      return;
    }

    nut.disabled = true;
    nut.textContent = 'Đang lưu…';
    $('hsLoi').classList.remove('hien');

    const thayDoi = {
      trang_thai: ttDangChon,
      nguoi_phu_trach: $('hsNguoi').value.trim() || null,
      link_drive: link || null,
      ghi_chu: $('hsGhiChu').value.trim() || null,
      cap_nhat_luc: new Date().toISOString(),
      cap_nhat_boi: window.NGUOI_DUNG ? window.NGUOI_DUNG.id : null
    };
    if (laQuanTri()) {
      thayDoi.phu_trach_id = $('hsTaiKhoan').value || null;
    }

    const { data, error } = await sb.from('ho_so')
      .update(thayDoi).eq('ma', maDangSua).select().single();

    nut.disabled = false;
    nut.textContent = 'Lưu thay đổi';

    if (error) {
      hienLoi('Không lưu được: ' + error.message +
        (error.code === '42501' ? ' — thầy cô không có quyền sửa hồ sơ này.' : ''));
      return;
    }

    /* Cập nhật lại dữ liệu trong trang, không cần tải lại toàn bộ */
    ANH_XA[maDangSua] = data;
    CATS.forEach(c => c.subs.forEach(s => s.items.forEach(it => {
      if (it[0] === maDangSua) {
        it[1] = data.ten;
        it[2] = data.nguoi_phu_trach || '—';
        it[3] = data.trang_thai;
      }
    })));

    dongOSua();
    renderCats();
    if (CAT_DANG_MO) openCatGoc(CAT_DANG_MO);
    notify('Đã lưu hồ sơ ' + maDangSua + '.');
  });

  function hienLoi(msg) {
    const el = $('hsLoi');
    el.textContent = msg;
    el.classList.add('hien');
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && oSua.classList.contains('hien')) dongOSua();
  });

  /* ========================================================================
     KHỞI ĐỘNG SAU KHI ĐĂNG NHẬP XONG
     ======================================================================== */
  document.addEventListener('dangnhap-xong', async () => {
    sb = window.sbClient;
    if (!sb) return;
    await taiDanhSachTaiKhoan();
    await taiDuLieu();
  });
})();
