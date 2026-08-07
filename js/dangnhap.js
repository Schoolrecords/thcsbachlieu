/* ============================================================================
   ĐĂNG NHẬP BẰNG TÀI KHOẢN GOOGLE — TRƯỜNG THCS BẠCH LIÊU

   Cách hoạt động, nói gọn:
     1. Thầy cô bấm nút "Đăng nhập bằng Google".
     2. Trang chuyển sang trang của Google. Mật khẩu gõ TRÊN TRANG GOOGLE.
        Hệ thống của nhà trường không nhìn thấy mật khẩu, không lưu mật khẩu.
     3. Google báo lại cho Supabase "đúng là người này", Supabase cấp một tấm
        vé điện tử có hạn cho trình duyệt.
     4. Mỗi lần lấy dữ liệu, trang web đưa tấm vé đó ra; máy chủ tự kiểm tra
        người này được xem gì, sửa gì.

   Nếu tệp cauhinh.js chưa điền địa chỉ thì toàn bộ tệp này nằm im,
   trang web chạy y như trước, không đòi đăng nhập.
   ============================================================================ */

(function () {
  'use strict';

  /* Chưa nối cơ sở dữ liệu thì thôi, không làm gì cả */
  if (typeof CAU_HINH === 'undefined' || !CAU_HINH.DA_NOI) {
    console.info('[Hồ sơ số] Chưa nối cơ sở dữ liệu — đang chạy chế độ xem thử.');
    return;
  }

  const sb = window.supabase.createClient(CAU_HINH.DIA_CHI, CAU_HINH.KHOA_CONG_KHAI);
  window.sbClient = sb;          // để các phần khác của trang dùng lại

  /* Người đang đăng nhập — các phần khác đọc qua window.NGUOI_DUNG */
  let nguoiDung = null;

  const TEN_VAI_TRO = {
    admin: 'Quản trị hệ thống',
    ban_giam_hieu: 'Ban giám hiệu',
    to_truong: 'Tổ trưởng chuyên môn',
    giao_vien: 'Giáo viên',
    nhan_vien: 'Nhân viên'
  };
  const TEN_TRANG_THAI = {
    cho_duyet: 'Chờ duyệt',
    hoat_dong: 'Đang hoạt động',
    khoa: 'Đã khoá'
  };

  /* ========================================================================
     GIAO DIỆN — chèn kiểu dáng, dùng đúng bảng màu navy + vàng đồng của trang
     ======================================================================== */
  const css = `
  .dn-lop{position:fixed;inset:0;z-index:9000;display:none;align-items:center;justify-content:center;
    padding:20px;background:linear-gradient(160deg,#14306b,#0e2454);
    background-image:radial-gradient(rgba(255,255,255,.07) 1px,transparent 1px);background-size:22px 22px}
  .dn-lop.hien{display:flex}
  .dn-hop{width:100%;max-width:420px;background:#fff;border-radius:18px;padding:34px 28px 28px;
    text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.32)}
  .dn-huy{width:64px;height:64px;margin:0 auto 16px;border-radius:16px;background:#14306b;
    display:flex;align-items:center;justify-content:center;font-size:32px}
  .dn-hop h2{font-size:21px;color:#14306b;margin:0 0 6px;line-height:1.35}
  .dn-hop .dn-phu{font-size:14px;color:#64748b;margin:0 0 24px;line-height:1.55}
  .dn-nut{width:100%;min-height:52px;border:1.5px solid #d7dde8;background:#fff;border-radius:12px;
    display:flex;align-items:center;justify-content:center;gap:11px;cursor:pointer;
    font-size:16px;font-weight:600;color:#1f2937;transition:.18s;font-family:inherit}
  .dn-nut:hover{border-color:#14306b;background:#f7f9fc}
  .dn-nut:disabled{opacity:.55;cursor:default}
  .dn-nut svg{width:21px;height:21px;flex:none}
  .dn-chan{margin-top:22px;padding-top:18px;border-top:1px solid #eef1f6;
    font-size:12.5px;color:#8a94a6;line-height:1.6}
  .dn-loi{margin-top:14px;padding:11px 13px;border-radius:10px;background:#fef2f2;
    border:1px solid #fecaca;color:#b91c1c;font-size:13.5px;line-height:1.5;text-align:left;display:none}
  .dn-loi.hien{display:block}
  .dn-cho{margin-top:6px;padding:16px;border-radius:12px;background:#fffbeb;
    border:1px solid #fde68a;color:#92400e;font-size:14px;line-height:1.6;text-align:left}

  /* Thẻ người dùng trên thanh điều hướng */
  .dn-the{display:flex;align-items:center;gap:9px;padding:5px 12px 5px 5px;border-radius:999px;
    border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.1);cursor:pointer;
    color:#fff;font-family:inherit;font-size:13.5px;transition:.18s;flex:none}
  .dn-the:hover{background:rgba(255,255,255,.2)}
  .dn-the .av{width:30px;height:30px;border-radius:50%;background:#c8901c;color:#fff;flex:none;
    display:flex;align-items:center;justify-content:center;font-size:12.5px;font-weight:700;
    overflow:hidden;background-size:cover;background-position:center}
  .dn-the .tt{text-align:left;line-height:1.25;display:none}
  .dn-the .tt b{display:block;font-weight:600;font-size:13.5px}
  .dn-the .tt span{font-size:11px;opacity:.75}
  @media(min-width:900px){.dn-the .tt{display:block}}

  .dn-menu{position:fixed;z-index:9100;background:#fff;border-radius:14px;min-width:230px;
    box-shadow:0 18px 44px rgba(15,32,66,.24);overflow:hidden;display:none;border:1px solid #e6eaf2}
  .dn-menu.hien{display:block}
  .dn-menu .dau{padding:14px 16px;border-bottom:1px solid #eef1f6;background:#f8fafc}
  .dn-menu .dau b{display:block;font-size:14.5px;color:#14306b}
  .dn-menu .dau span{display:block;font-size:12px;color:#64748b;margin-top:2px;word-break:break-all}
  .dn-menu .vt{display:inline-block;margin-top:7px;padding:3px 9px;border-radius:999px;
    background:#14306b;color:#fff;font-size:11px;font-weight:600}
  .dn-menu button{width:100%;padding:13px 16px;border:0;background:#fff;text-align:left;
    cursor:pointer;font-size:14.5px;color:#1f2937;font-family:inherit;display:flex;align-items:center;gap:10px}
  .dn-menu button:hover{background:#f1f5f9}
  .dn-menu button.thoat{color:#b91c1c;border-top:1px solid #eef1f6}

  /* Bảng quản trị */
  /* Bảng quản trị — KÍCH THƯỚC CỐ ĐỊNH.
     Bản cũ dùng max-height nên chiều cao chạy theo nội dung: đổi tab một cái
     là cả cửa sổ co giãn, thanh menu nhảy lên nhảy xuống, nhìn hoa mắt. Nay
     đặt height cứng, phần nội dung tự cuộn bên trong; thanh tiêu đề và hàng
     tab đứng yên một chỗ. Bề ngang lấy đúng 1320px bằng bề ngang nội dung
     trang, để bảng biểu bên trong có chỗ mà thở. */
  .qt-lop{position:fixed;inset:0;z-index:9200;background:rgba(10,20,45,.55);
    display:none;align-items:flex-end;justify-content:center;padding:0}
  .qt-lop.hien{display:flex;animation:qtHienDan .16s ease-out}
  .qt-lop.hien .qt-hop{animation:qtTroiLen .24s cubic-bezier(.2,.8,.3,1)}
  @keyframes qtHienDan{from{opacity:0}to{opacity:1}}
  @keyframes qtTroiLen{from{opacity:0;transform:translateY(16px) scale(.985)}
                       to{opacity:1;transform:none}}
  @media(prefers-reduced-motion:reduce){
    .qt-lop.hien,.qt-lop.hien .qt-hop{animation:none}
  }
  @media(min-width:820px){.qt-lop{align-items:center;padding:24px}}
  .qt-hop{background:#fff;width:100%;max-width:1320px;height:94vh;border-radius:18px 18px 0 0;
    display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 60px rgba(6,16,40,.4)}
  @media(min-width:820px){.qt-hop{border-radius:18px;height:88vh}}
  .qt-dau{padding:16px 20px;background:#14306b;color:#fff;display:flex;align-items:center;
    gap:12px;flex:none}
  .qt-dau h3{margin:0;font-size:17px;flex:1}
  .qt-dau button{background:rgba(255,255,255,.15);border:0;color:#fff;width:34px;height:34px;
    border-radius:9px;cursor:pointer;font-size:16px;font-family:inherit}
  /* Hàng tab đứng yên: flex:none nên không cuộn theo nội dung. Thêm đường kẻ
     và bóng nhẹ cho thấy rõ đây là thanh cố định, nội dung trượt bên dưới. */
  /* Mỗi tab là một KHỐI NỔI riêng, cùng lối với thanh điều hướng trên trang.
     Bản cũ là chữ trơn gạch chân — cả hàng đọc như một dòng liền, phải dò mới
     ra ranh giới giữa các mục. */
  .qt-tab{display:flex;gap:7px;padding:12px 16px;background:#f4f7fc;flex:none;
    overflow-x:auto;border-bottom:1px solid #e2e8f2;box-shadow:0 2px 8px rgba(15,32,70,.06)}
  .qt-tab button{border:1px solid #dbe3ef;background:#fff;padding:9px 15px;cursor:pointer;
    font-size:13.6px;font-weight:600;color:#54637c;border-radius:11px;font-family:inherit;
    white-space:nowrap;box-shadow:0 1px 3px rgba(15,32,70,.08);
    transition:background .15s,color .15s,box-shadow .15s,transform .15s}
  .qt-tab button:hover{background:#eaf1fb;color:#14306b;border-color:#bfd2ee;
    transform:translateY(-1px)}
  .qt-tab button.on{background:#14306b;color:#fff;border-color:#14306b;font-weight:700;
    box-shadow:0 4px 12px rgba(20,48,107,.34)}
  /* scrollbar-gutter giữ chỗ sẵn cho thanh cuộn: tab nào nội dung ngắn thì
     nội dung cũng không bị xê ngang khi thanh cuộn hiện ra rồi mất đi. */
  .qt-than{padding:16px 18px;overflow:auto;flex:1;-webkit-overflow-scrolling:touch;
    scrollbar-gutter:stable}
  .qt-bang{width:100%;border-collapse:collapse;font-size:13.5px;min-width:640px}
  .qt-bang th{text-align:left;padding:9px 10px;background:#f1f5f9;color:#475569;font-weight:600;
    font-size:12px;text-transform:uppercase;letter-spacing:.03em;position:sticky;top:0}
  .qt-bang td{padding:9px 10px;border-bottom:1px solid #eef1f6;vertical-align:middle}
  .qt-bang select{padding:6px 8px;border:1px solid #d7dde8;border-radius:7px;font-size:13px;
    font-family:inherit;background:#fff;max-width:100%}
  .qt-cuon{overflow-x:auto}
  .qt-them{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;padding:14px;background:#f8fafc;
    border-radius:12px;border:1px solid #e6eaf2}
  .qt-them input,.qt-them select{padding:9px 11px;border:1px solid #d7dde8;border-radius:8px;
    font-size:14px;font-family:inherit;flex:1 1 150px;min-width:0}
  .qt-them button{padding:9px 18px;border:0;border-radius:8px;background:#14306b;color:#fff;
    cursor:pointer;font-size:14px;font-weight:600;font-family:inherit;flex:none}
  .qt-xoa{border:0;background:#fef2f2;color:#b91c1c;padding:6px 11px;border-radius:7px;
    cursor:pointer;font-size:12.5px;font-family:inherit}
  .qt-trong{padding:34px;text-align:center;color:#94a3b8;font-size:14px}
  /* ---- Tab Tổng quan ---- */
  .qt-viec{border-radius:11px;padding:13px 16px;margin-bottom:16px;font-size:13.6px;line-height:1.6;
    background:#fef6f5;border:1px solid #f3c9c5;color:#8a3428}
  .qt-viec.ok{background:#f2fdf6;border-color:#bfe8cd;color:#1a6437}
  .qt-viec ul{margin:8px 0 0 18px;padding:0}
  .qt-viec li{margin-bottom:5px}
  .qt-muc{font-size:12.4px;font-weight:700;color:#1e4593;text-transform:uppercase;
    letter-spacing:.05em;margin:18px 0 9px;padding-bottom:6px;border-bottom:1px solid #e6ebf4}
  .qt-luoi{display:grid;grid-template-columns:repeat(auto-fit,minmax(168px,1fr));gap:10px}
  .qt-o{background:#fff;border:1px solid #e4e9f2;border-radius:11px;padding:12px 14px}
  .qt-o .n{display:block;font-size:12.2px;color:#64748b;font-weight:600;margin-bottom:4px}
  .qt-o .v{display:block;font-size:19px;font-weight:700;color:#14306b;line-height:1.25;
    word-break:break-word}
  .qt-o .p{display:block;font-size:11.6px;color:#94a3b8;margin-top:3px}
  .qt-o.canh{background:#fef6f5;border-color:#f3c9c5}
  .qt-o.canh .v{color:#b3261e}
  .qt-o.luu{background:#fff8ec;border-color:#f2ddb4}
  .qt-o.luu .v{color:#96660f}
  .qt-o.tot{background:#f2fdf6;border-color:#bfe8cd}
  .qt-o.tot .v{color:#15803d}
  .qt-ghi{font-size:12px;color:#94a3b8;line-height:1.6;margin-top:14px}
  .qt-nhac{padding:12px 14px;border-radius:10px;background:#eff6ff;border:1px solid #bfdbfe;
    color:#1e40af;font-size:13px;line-height:1.6;margin-bottom:14px}
  `;
  document.head.insertAdjacentHTML('beforeend', '<style>' + css + '</style>');

  /* ========================================================================
     MÀN HÌNH ĐĂNG NHẬP
     ======================================================================== */
  const LOGO_GOOGLE = `<svg viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.7 30.2.5 24 .5 14.6.5 6.5 5.8 2.6 13.6l7.8 6c1.9-5.7 7.2-10.1 13.6-10.1z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.15-3.2-.43-4.7H24v9h12.7c-.55 2.9-2.2 5.4-4.7 7.1l7.6 5.9c4.4-4.1 6.9-10.2 6.9-17.3z"/><path fill="#FBBC05" d="M10.4 28.4c-.5-1.4-.75-2.9-.75-4.4s.27-3 .74-4.4l-7.8-6C1 16.7 0 20.2 0 24s1 7.3 2.6 10.4l7.8-6z"/><path fill="#34A853" d="M24 47.5c6.2 0 11.5-2 15.3-5.6l-7.6-5.9c-2.1 1.4-4.8 2.3-7.7 2.3-6.4 0-11.7-4.3-13.6-10.1l-7.8 6C6.5 42.2 14.6 47.5 24 47.5z"/></svg>`;

  const manDangNhap = document.createElement('div');
  manDangNhap.className = 'dn-lop';
  manDangNhap.innerHTML = `
    <div class="dn-hop">
      <div class="dn-huy">🎓</div>
      <h2>Hệ thống Hồ sơ số<br>${CAU_HINH.TEN_TRUONG}</h2>
      <p class="dn-phu">Đăng nhập bằng địa chỉ Gmail của thầy cô để vào hệ thống.</p>
      <button class="dn-nut" id="dnNut">${LOGO_GOOGLE}<span>Đăng nhập bằng Google</span></button>
      <div class="dn-loi" id="dnLoi"></div>
      <div class="dn-chan">
        Nhà trường không lưu giữ mật khẩu Gmail của thầy cô. Việc xác thực do
        Google thực hiện. Dữ liệu cá nhân được bảo vệ theo Nghị định 13/2023/NĐ-CP.
      </div>
    </div>`;
  document.body.appendChild(manDangNhap);

  const manChoDuyet = document.createElement('div');
  manChoDuyet.className = 'dn-lop';
  manChoDuyet.innerHTML = `
    <div class="dn-hop">
      <div class="dn-huy">⏳</div>
      <h2>Tài khoản đang chờ duyệt</h2>
      <p class="dn-phu" id="cdEmail"></p>
      <div class="dn-cho">
        Địa chỉ này chưa có trong danh sách cán bộ, giáo viên, nhân viên của nhà
        trường. Thầy cô vui lòng liên hệ quản trị hệ thống để được cấp quyền.
        Sau khi được duyệt, chỉ cần tải lại trang là vào được.
      </div>
      <button class="dn-nut" id="cdThoat" style="margin-top:18px">Đăng xuất</button>
    </div>`;
  document.body.appendChild(manChoDuyet);

  function hienLoi(msg) {
    const el = document.getElementById('dnLoi');
    el.textContent = msg;
    el.classList.add('hien');
  }

  /* Ẩn toàn bộ nội dung trang cho tới khi đăng nhập xong */
  function khoaTrang(khoa) {
    document.body.style.overflow = khoa ? 'hidden' : '';
    document.querySelectorAll('.view, .topbar, footer').forEach(el => {
      el.style.visibility = khoa ? 'hidden' : '';
    });
  }

  document.getElementById('dnNut').addEventListener('click', async function () {
    this.disabled = true;
    this.querySelector('span').textContent = 'Đang chuyển sang Google…';
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: location.origin + location.pathname }
    });
    if (error) {
      this.disabled = false;
      this.querySelector('span').textContent = 'Đăng nhập bằng Google';
      hienLoi('Không kết nối được tới Google: ' + error.message);
    }
  });

  document.getElementById('cdThoat').addEventListener('click', async () => {
    await sb.auth.signOut();
    location.reload();
  });

  /* ========================================================================
     THẺ NGƯỜI DÙNG TRÊN THANH ĐIỀU HƯỚNG
     ======================================================================== */
  function chuCaiDau(ten) {
    const w = String(ten).trim().split(/\s+/);
    return ((w[0][0] || '') + (w[w.length - 1][0] || '')).toUpperCase();
  }

  function dungTheNguoiDung() {
    const thanh = document.querySelector('.topbar-in');
    if (!thanh || document.getElementById('dnThe')) return;

    const the = document.createElement('button');
    the.className = 'dn-the';
    the.id = 'dnThe';
    const anh = nguoiDung.anh_dai_dien
      ? `style="background-image:url('${nguoiDung.anh_dai_dien}')"` : '';
    the.innerHTML = `
      <span class="av" ${anh}>${nguoiDung.anh_dai_dien ? '' : chuCaiDau(nguoiDung.ho_ten)}</span>
      <span class="tt"><b>${nguoiDung.ho_ten}</b><span>${TEN_VAI_TRO[nguoiDung.vai_tro] || ''}</span></span>`;
    thanh.insertBefore(the, document.querySelector('.nav-burger'));

    const menu = document.createElement('div');
    menu.className = 'dn-menu';
    menu.id = 'dnMenu';
    const laQuanTri = ['admin', 'ban_giam_hieu'].includes(nguoiDung.vai_tro);
    menu.innerHTML = `
      <div class="dau">
        <b>${nguoiDung.ho_ten}</b>
        <span>${nguoiDung.email}</span>
        <span class="vt">${TEN_VAI_TRO[nguoiDung.vai_tro] || nguoiDung.vai_tro}</span>
      </div>
      ${laQuanTri ? '<button id="dnQuanTri">⚙️ Quản trị hệ thống</button>' : ''}
      <button class="thoat" id="dnThoat">↩ Đăng xuất</button>`;
    document.body.appendChild(menu);

    the.addEventListener('click', e => {
      e.stopPropagation();
      const r = the.getBoundingClientRect();
      menu.style.top = (r.bottom + 8) + 'px';
      menu.style.right = Math.max(10, window.innerWidth - r.right) + 'px';
      menu.classList.toggle('hien');
    });
    document.addEventListener('click', () => menu.classList.remove('hien'));
    menu.addEventListener('click', e => e.stopPropagation());

    document.getElementById('dnThoat').addEventListener('click', async () => {
      await sb.auth.signOut();
      location.reload();
    });
    if (laQuanTri) {
      document.getElementById('dnQuanTri').addEventListener('click', () => {
        menu.classList.remove('hien');
        moBangQuanTri();
      });
      /* Mở thêm một cửa vào ngay trang chủ. Trước đây chức năng quản trị chỉ
         nấp trong menu thả xuống ở góc, ít người biết là có. Thẻ này chỉ hiện
         với quản trị và ban giám hiệu — người khác không thấy gì. */
      const the = document.getElementById('modQuanTri');
      if (the) {
        the.style.display = '';
        the.addEventListener('click', () => moBangQuanTri());
      }
    }
  }

  /* Cho phần khác của trang gọi tới, ví dụ thẻ Quản trị hệ thống ở trang chủ */
  window.moQuanTri = function () { moBangQuanTri(); };

  /* ========================================================================
     BẢNG QUẢN TRỊ — người dùng, danh sách mời, nhật ký
     ======================================================================== */
  let bangQT = null;

  function moBangQuanTri() {
    if (!bangQT) {
      bangQT = document.createElement('div');
      bangQT.className = 'qt-lop';
      bangQT.innerHTML = `
        <div class="qt-hop">
          <div class="qt-dau">
            <h3>⚙️ Quản trị hệ thống</h3>
            <button id="qtDong">✕</button>
          </div>
          <div class="qt-tab">
            ${dsTab().map((t, i) =>
              `<button${i === 0 ? ' class="on"' : ''} data-tab="${t.ma}">${t.ten}</button>`).join('')}
          </div>
          <div class="qt-than" id="qtThan"></div>
        </div>`;
      document.body.appendChild(bangQT);
      bangQT.addEventListener('click', e => { if (e.target === bangQT) dongBangQuanTri(); });
      document.getElementById('qtDong').addEventListener('click', dongBangQuanTri);
      bangQT.querySelectorAll('.qt-tab button').forEach(b => {
        b.addEventListener('click', () => {
          bangQT.querySelectorAll('.qt-tab button').forEach(x => x.classList.remove('on'));
          b.classList.add('on');
          veTab(b.dataset.tab);
        });
      });
    }
    bangQT.classList.add('hien');
    document.body.style.overflow = 'hidden';
    /* Trả nút sáng về Tổng quan cho khớp với thân bảng. Thiếu dòng này thì
       xem tab khác rồi đóng, mở lại sẽ thấy thân là Tổng quan mà nút sáng vẫn
       là tab cũ. */
    bangQT.querySelectorAll('.qt-tab button')
      .forEach((x, i) => x.classList.toggle('on', i === 0));
    veTab('tq');
  }

  function dongBangQuanTri() {
    bangQT.classList.remove('hien');
    document.body.style.overflow = '';
  }

  const than = () => document.getElementById('qtThan');

  /* Thứ tự tab do thầy Chung chốt: việc thường ngày của nhà trường xếp trước,
     việc quản trị tài khoản xếp sau.
       Tổng quan → Danh mục Hồ sơ số → CBGV-NV → Học sinh
       → Người dùng → Danh sách mời → Nhật ký → Sao lưu
     Tab do tệp khác đăng ký mang sẵn số thứ tự riêng, trộn vào đúng chỗ chứ
     không dồn hết về một cụm. */
  const TAB_CHINH = [
    { ma: 'tq',  ten: 'Tổng quan',      tt: 10 },
    { ma: 'nd',  ten: 'Người dùng',     tt: 50 },
    { ma: 'moi', ten: 'Danh sách mời',  tt: 60 },
    { ma: 'nk',  ten: 'Nhật ký',        tt: 70 },
    { ma: 'sl',  ten: 'Sao lưu',        tt: 80 }
  ];
  function dsTab() {
    return TAB_CHINH.concat(window.qtTabPhu || [])
      .slice()
      .sort((a, b) => (a.tt == null ? 99 : a.tt) - (b.tt == null ? 99 : b.tt));
  }

  async function veTab(tab) {
    /* Về đầu trang mỗi khi đổi tab — không thì tab mới mở ra ở lưng chừng
       đúng chỗ đang cuộn của tab cũ, thầy cô tưởng thiếu nội dung. */
    than().scrollTop = 0;
    than().innerHTML = '<div class="qt-trong">Đang tải…</div>';
    if (tab === 'tq') return veTabTongQuan();
    if (tab === 'nd') return veTabNguoiDung();
    if (tab === 'moi') return veTabMoi();
    if (tab === 'nk') return veTabNhatKy();
    if (tab === 'sl') return veTabSaoLuu();
    /* Tab do tệp khác đăng ký — mỗi tệp lo phần của mình, khỏi phình tệp này */
    const phu = (window.qtTabPhu || []).find(t => t.ma === tab);
    if (phu && typeof phu.ve === 'function') {
      try { return await phu.ve(than()); }
      catch (e) {
        console.error('[Quản trị] Tab ' + tab + ' hỏng:', e);
        /* Bọc escape: câu lỗi của máy chủ có lúc lặp lại nguyên giá trị dữ
           liệu người dùng vừa gửi lên, mà dữ liệu đó đến từ ô Excel. */
        const s = String(e.message || e)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        than().innerHTML = '<div class="qt-trong">Không mở được mục này: ' + s + '</div>';
      }
      return;
    }
    than().innerHTML = '<div class="qt-trong">Chưa nạp được mục này, thầy cô tải lại trang.</div>';
  }

  /* --- Tab 0: TỔNG QUAN — sức khoẻ hệ thống trong một màn hình ---
     Trước đây muốn biết có việc gì cần xử lý thì phải bấm từng tab rồi tự
     nhẩm. Nay mở ra là thấy ngay, và những chỗ cần xử lý thì hiện màu cảnh
     báo chứ không nằm lẫn trong số liệu bình thường. */
  async function veTabTongQuan() {
    const { data, error } = await sb.rpc('qt_tong_quan');
    if (error) {
      return than().innerHTML = `<div class="qt-trong">Không đọc được tổng quan: ${error.message}
        <br><br>Nếu báo thiếu hàm <b>qt_tong_quan</b> thì chạy tệp <b>sql/21</b> trong Supabase.</div>`;
    }
    const d = data || {};
    const so = v => (v == null ? '—' : Number(v).toLocaleString('vi-VN'));
    const ngay = v => v ? new Date(v).toLocaleString('vi-VN') : '—';

    /* Nhịp tim: Supabase gói miễn phí tạm ngưng dự án nếu 7 ngày không ai gọi */
    const nt = Number(d.tim_so_ngay);
    const timXau = !isFinite(nt) || nt > 6;
    const timLo  = isFinite(nt) && nt > 3 && nt <= 6;

    const viec = [];
    if (d.tk_cho_duyet > 0)
      viec.push(`<b>${d.tk_cho_duyet}</b> tài khoản đang chờ duyệt — sang tab Người dùng đổi trạng thái sang <b>Đang hoạt động</b>.`);
    if (timXau)
      viec.push(`Nhịp tim cơ sở dữ liệu <b>${isFinite(nt) ? nt + ' ngày' : 'không đọc được'}</b> — lịch cron-job.org có thể đã hỏng. Supabase tạm ngưng dự án nếu 7 ngày không ai truy cập.`);
    else if (timLo)
      viec.push(`Nhịp tim <b>${nt} ngày</b> — vẫn an toàn nhưng nên để ý.`);
    if (d.hs_chua_gan > 0)
      viec.push(`<b>${d.hs_chua_gan}</b> hồ sơ chưa gán người phụ trách — sau khi siết quyền thì không giáo viên nào xem được.`);
    if (d.tk_admin < 2)
      viec.push(`Chỉ có <b>${d.tk_admin}</b> tài khoản quản trị. Nên có ít nhất hai người, phòng khi một người không truy cập được.`);

    const o = (nhan, gt, phu, mau) => `
      <div class="qt-o${mau ? ' ' + mau : ''}">
        <span class="n">${nhan}</span>
        <span class="v">${gt}</span>
        ${phu ? `<span class="p">${phu}</span>` : ''}
      </div>`;

    than().innerHTML = `
      ${viec.length
        ? `<div class="qt-viec"><b>⚠ Có ${viec.length} việc cần xử lý</b><ul>${viec.map(v => `<li>${v}</li>`).join('')}</ul></div>`
        : '<div class="qt-viec ok"><b>✅ Hệ thống bình thường, không có việc nào cần xử lý ngay.</b></div>'}

      <div class="qt-muc">Tài khoản</div>
      <div class="qt-luoi">
        ${o('Đang hoạt động', so(d.tk_hoat_dong))}
        ${o('Chờ duyệt', so(d.tk_cho_duyet), 'cần xử lý', d.tk_cho_duyet > 0 ? 'canh' : '')}
        ${o('Bị khoá', so(d.tk_khoa))}
        ${o('Quản trị, ban giám hiệu', so(d.tk_admin), '', d.tk_admin < 2 ? 'canh' : '')}
        ${o('Đã mời, chưa vào lần nào', so(d.moi_chua_vao))}
      </div>

      <div class="qt-muc">Hồ sơ số</div>
      <div class="qt-luoi">
        ${o('Tổng đầu mục', so(d.hs_tong))}
        ${o('Đã có hồ sơ', so(d.hs_da_co),
            d.hs_tong ? Math.round(d.hs_da_co * 100 / d.hs_tong) + '% tổng số' : '')}
        ${o('Chưa gán người phụ trách', so(d.hs_chua_gan), '', d.hs_chua_gan > 0 ? 'canh' : 'tot')}
        ${o('Chưa có đường dẫn Drive', so(d.hs_chua_link))}
      </div>

      <div class="qt-muc">Học sinh và phân công</div>
      <div class="qt-luoi">
        ${o('Học sinh đã khai báo', so(d.ths_tong))}
        ${o('Đang học', so(d.ths_dang_hoc))}
        ${o('Số lớp', so(d.ths_so_lop))}
        ${o('Dòng phân công giảng dạy', so(d.ths_phan_cong), '', d.ths_phan_cong == 0 ? 'canh' : '')}
      </div>

      <div class="qt-muc">Tình trạng hệ thống</div>
      <div class="qt-luoi">
        ${o('Nhịp tim gần nhất', ngay(d.tim_lan_cuoi),
            isFinite(nt) ? nt + ' ngày trước' : '', timXau ? 'canh' : (timLo ? 'luu' : 'tot'))}
        ${o('Nhật ký 30 ngày qua', so(d.nk_30_ngay), 'trên tổng ' + so(d.nk_tong))}
        ${o('Hoạt động gần nhất', ngay(d.nk_moi_nhat))}
      </div>

      <p class="qt-ghi">Nhịp tim là lần cuối có ai đó gọi tới cơ sở dữ liệu. Supabase gói miễn phí
        <b>tạm ngưng dự án nếu 7 ngày liền không ai truy cập</b>. Lịch tự động chạy 07:00 hằng ngày
        trên cron-job.org; nếu con số vượt quá 6 ngày thì lịch đã hỏng, phải vào kiểm tra ngay.</p>`;
  }

  /* --- Tab 1: danh sách người dùng đã đăng nhập --- */
  async function veTabNguoiDung() {
    const { data, error } = await sb.from('nguoi_dung')
      .select('*').order('trang_thai').order('ho_ten');
    if (error) return than().innerHTML = `<div class="qt-trong">Lỗi: ${error.message}</div>`;

    const cho = data.filter(x => x.trang_thai === 'cho_duyet').length;
    than().innerHTML = `
      ${cho ? `<div class="qt-nhac">Có <b>${cho}</b> tài khoản đang chờ duyệt. Đổi cột "Trạng thái" sang <b>Đang hoạt động</b> để cho phép vào hệ thống.</div>` : ''}
      <div class="qt-cuon"><table class="qt-bang">
        <thead><tr>
          <th>Họ và tên</th><th>Địa chỉ Gmail</th><th style="width:180px">Vai trò</th>
          <th style="width:160px">Trạng thái</th><th style="width:130px">Lần vào cuối</th>
        </tr></thead>
        <tbody>${data.map(u => `
          <tr>
            <td><b>${u.ho_ten}</b>${u.chuc_vu ? `<br><span style="color:#64748b;font-size:12px">${u.chuc_vu}</span>` : ''}</td>
            <td style="color:#64748b;font-size:12.5px;word-break:break-all">${u.email}</td>
            <td><select data-id="${u.id}" data-cot="vai_tro">
              ${Object.entries(TEN_VAI_TRO).map(([k, v]) =>
                `<option value="${k}" ${u.vai_tro === k ? 'selected' : ''}>${v}</option>`).join('')}
            </select></td>
            <td><select data-id="${u.id}" data-cot="trang_thai">
              ${Object.entries(TEN_TRANG_THAI).map(([k, v]) =>
                `<option value="${k}" ${u.trang_thai === k ? 'selected' : ''}>${v}</option>`).join('')}
            </select></td>
            <td style="color:#64748b;font-size:12.5px">${u.lan_vao_cuoi ? new Date(u.lan_vao_cuoi).toLocaleDateString('vi-VN') : '—'}</td>
          </tr>`).join('')}
        </tbody></table></div>`;

    than().querySelectorAll('select[data-id]').forEach(s => {
      s.addEventListener('change', async () => {
        const { error } = await sb.from('nguoi_dung')
          .update({ [s.dataset.cot]: s.value }).eq('id', s.dataset.id);
        baoNhanh(error ? 'Không lưu được: ' + error.message : 'Đã lưu thay đổi.');
      });
    });
  }

  /* --- Tab 2: danh sách email được mời trước --- */
  async function veTabMoi() {
    const { data, error } = await sb.from('moi_tai_khoan').select('*').order('email');
    if (error) return than().innerHTML = `<div class="qt-trong">Lỗi: ${error.message}</div>`;

    than().innerHTML = `
      <div class="qt-nhac">Nhập trước Gmail của cán bộ, giáo viên, nhân viên vào đây.
        Người có tên trong danh sách này đăng nhập lần đầu là <b>vào được ngay</b>,
        không cần chờ duyệt.</div>
      <div class="qt-them">
        <input id="mEmail" type="email" placeholder="Gmail, ví dụ: nguyenvana@gmail.com">
        <input id="mTen" placeholder="Họ và tên">
        <input id="mChucVu" placeholder="Chức vụ">
        <select id="mVaiTro">
          ${Object.entries(TEN_VAI_TRO).map(([k, v]) =>
            `<option value="${k}" ${k === 'giao_vien' ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
        <button id="mThem">➕ Thêm</button>
      </div>
      <div class="qt-cuon"><table class="qt-bang">
        <thead><tr><th>Gmail</th><th>Họ và tên</th><th>Chức vụ</th><th style="width:180px">Vai trò</th><th style="width:80px"></th></tr></thead>
        <tbody>${data.length ? data.map(m => `
          <tr>
            <td style="word-break:break-all">${m.email}</td>
            <td>${m.ho_ten || '—'}</td>
            <td style="color:#64748b">${m.chuc_vu || '—'}</td>
            <td>${TEN_VAI_TRO[m.vai_tro] || m.vai_tro}</td>
            <td><button class="qt-xoa" data-xoa="${m.id}">Xoá</button></td>
          </tr>`).join('') : '<tr><td colspan="5" class="qt-trong">Chưa có địa chỉ nào.</td></tr>'}
        </tbody></table></div>`;

    document.getElementById('mThem').addEventListener('click', async () => {
      const email = document.getElementById('mEmail').value.trim().toLowerCase();
      if (!email) return baoNhanh('Chưa nhập địa chỉ Gmail.');
      const { error } = await sb.from('moi_tai_khoan').insert({
        email,
        ho_ten: document.getElementById('mTen').value.trim() || null,
        chuc_vu: document.getElementById('mChucVu').value.trim() || null,
        vai_tro: document.getElementById('mVaiTro').value
      });
      if (error) return baoNhanh('Không thêm được: ' + error.message);
      baoNhanh('Đã thêm ' + email);
      veTabMoi();
    });

    than().querySelectorAll('[data-xoa]').forEach(b => {
      b.addEventListener('click', async () => {
        const { error } = await sb.from('moi_tai_khoan').delete().eq('id', b.dataset.xoa);
        if (error) return baoNhanh('Không xoá được: ' + error.message);
        veTabMoi();
      });
    });
  }

  /* --- Tab 3: nhật ký truy cập và thay đổi ---
     Có bộ lọc theo người, bảng dữ liệu và hành động. Nghị định 13/2023 đòi
     truy vết được "ai đã đụng vào dữ liệu nào"; 200 dòng gần nhất không lọc
     được thì đến lúc cần giải trình sẽ không tra ra. */
  let nkLoc = { email: '', bang: '', hd: '' };

  async function veTabNhatKy() {
    let q = sb.from('nhat_ky').select('*');
    if (nkLoc.email) q = q.ilike('email', '%' + nkLoc.email + '%');
    if (nkLoc.bang) q = q.eq('bang', nkLoc.bang);
    if (nkLoc.hd) q = q.eq('hanh_dong', nkLoc.hd);
    const { data, error } = await q.order('thoi_gian', { ascending: false }).limit(300);
    if (error) return than().innerHTML = `<div class="qt-trong">Lỗi: ${error.message}</div>`;

    /* Danh sách bảng để lọc — lấy từ chính dữ liệu đang có */
    const dsBang = Array.from(new Set((data || []).map(n => n.bang).filter(Boolean))).sort();
    if (nkLoc.bang && dsBang.indexOf(nkLoc.bang) < 0) dsBang.push(nkLoc.bang);

    const TEN_HD = {
      INSERT: 'Thêm mới', UPDATE: 'Sửa', DELETE: 'Xoá',
      DANG_NHAP_LAN_DAU: 'Đăng nhập lần đầu'
    };
    than().innerHTML = `
      <div class="qt-nhac">Sổ nhật ký ghi lại mọi thay đổi dữ liệu, phục vụ yêu cầu
        của Nghị định 13/2023/NĐ-CP. Không ai sửa hay xoá được nhật ký, kể cả quản trị.</div>
      <div class="qt-them">
        <input id="nkEmail" placeholder="Lọc theo người, gõ một phần địa chỉ Gmail" value="${nkLoc.email}">
        <select id="nkBang">
          <option value="">Tất cả bảng dữ liệu</option>
          ${dsBang.map(b => `<option value="${b}" ${b === nkLoc.bang ? 'selected' : ''}>${b}</option>`).join('')}
        </select>
        <select id="nkHd">
          <option value="">Tất cả hành động</option>
          ${Object.entries(TEN_HD).map(([k, v]) =>
            `<option value="${k}" ${k === nkLoc.hd ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
        <button id="nkLoc">🔍 Lọc</button>
        <button id="nkXoaLoc" class="qt-xoa">Bỏ lọc</button>
      </div>
      <div class="qt-cuon"><table class="qt-bang">
        <thead><tr><th style="width:150px">Thời gian</th><th>Người thực hiện</th>
          <th style="width:130px">Hành động</th><th>Bảng dữ liệu</th></tr></thead>
        <tbody>${data.length ? data.map(n => `
          <tr>
            <td style="color:#64748b;font-size:12.5px">${new Date(n.thoi_gian).toLocaleString('vi-VN')}</td>
            <td style="word-break:break-all">${n.email || '—'}</td>
            <td>${TEN_HD[n.hanh_dong] || n.hanh_dong}</td>
            <td style="color:#64748b">${n.bang || '—'}${n.ban_ghi ? ` <span style="font-size:11px">#${n.ban_ghi}</span>` : ''}</td>
          </tr>`).join('') : '<tr><td colspan="4" class="qt-trong">Không có dòng nào khớp bộ lọc.</td></tr>'}
        </tbody></table></div>
      <p class="qt-ghi">Hiện ${data.length} dòng gần nhất${data.length >= 300 ? ' (đã đạt giới hạn 300 dòng, thu hẹp bộ lọc để xem sâu hơn)' : ''}.</p>`;

    document.getElementById('nkLoc').addEventListener('click', () => {
      nkLoc.email = document.getElementById('nkEmail').value.trim();
      nkLoc.bang = document.getElementById('nkBang').value;
      nkLoc.hd = document.getElementById('nkHd').value;
      veTabNhatKy();
    });
    document.getElementById('nkXoaLoc').addEventListener('click', () => {
      nkLoc = { email: '', bang: '', hd: '' };
      veTabNhatKy();
    });
    document.getElementById('nkEmail').addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('nkLoc').click();
    });
  }

  /* --- Tab 4: SAO LƯU DỮ LIỆU ---
     Toàn bộ dữ liệu của trường nằm trên Supabase gói miễn phí. Dự án bị tạm
     ngưng, xoá nhầm hoặc mất tài khoản là mất sạch. Nút này kết xuất mọi bảng
     ra MỘT tệp Excel nhiều trang tính để nhà trường giữ bản riêng.

     Tệp chứa dữ liệu cá nhân của học sinh và cán bộ, nên phải cảnh báo rõ về
     nghĩa vụ bảo quản theo Nghị định 13/2023/NĐ-CP. */
  const BANG_SAO_LUU = [
    ['nguoi_dung', 'Tai khoan'], ['moi_tai_khoan', 'Danh sach moi'],
    ['nhom_ho_so', 'Nhom ho so'], ['nhom_con', 'Hop ho so'], ['ho_so', 'Ho so so'],
    ['tieu_chi', 'Tieu chi TT57'], ['tu_danh_gia', 'Tu danh gia'],
    ['danh_gia_tieu_chuan', 'Danh gia tieu chuan'], ['ke_hoach_cai_tien', 'Ke hoach cai tien'],
    ['chi_so', 'Chi so nhieu nam'],
    ['dbcl_chi_tieu', 'DBCL chi tieu'], ['dbcl_so_lieu', 'DBCL so lieu'],
    ['dbcl_cam_ket', 'DBCL cam ket GV'], ['dbcl_cam_ket_dong', 'DBCL cam ket dong'],
    ['dbcl_moc', 'DBCL moc cong viec'], ['dbcl_tu_soat_kq', 'DBCL tu soat'],
    ['dbcl_to', 'To DBCL'], ['dbcl_to_thanh_vien', 'To DBCL thanh vien'],
    ['dbcl_phan_cong', 'To DBCL phan cong'],
    ['mon_hoc', 'Mon hoc'], ['hoc_sinh', 'Hoc sinh'], ['hoc_sinh_lop', 'Hoc sinh lop'],
    ['phan_cong_day', 'Phan cong giang day'],
    ['hs_ket_qua', 'Ket qua tung mon'], ['hs_ren_luyen', 'Ren luyen'],
    ['hs_cam_ket', 'Cam ket tung hoc sinh']
  ];

  async function docHet(bang) {
    const BUOC = 1000;
    let tuDau = 0, gom = [];
    for (;;) {
      const r = await sb.from(bang).select('*').range(tuDau, tuDau + BUOC - 1);
      if (r.error) return { loi: r.error.message, data: gom };
      const d = r.data || [];
      gom = gom.concat(d);
      if (d.length < BUOC) break;
      tuDau += BUOC;
      if (tuDau > 100000) break;
    }
    return { loi: null, data: gom };
  }

  function veTabSaoLuu() {
    than().innerHTML = `
      <div class="qt-nhac">Toàn bộ dữ liệu của nhà trường đang nằm trên Supabase gói miễn phí.
        Dự án bị tạm ngưng, xoá nhầm hoặc mất quyền truy cập là mất sạch. Nên sao lưu
        <b>mỗi học kỳ một lần</b> và giữ tệp ở nơi khác.</div>
      <div class="qt-viec">
        <b>⚠ Tệp sao lưu chứa dữ liệu cá nhân</b>
        <ul>
          <li>Có họ tên, ngày sinh, kết quả học tập của học sinh và thông tin cán bộ, giáo viên.</li>
          <li>Theo <b>Nghị định 13/2023/NĐ-CP</b>, tệp này phải được bảo quản như hồ sơ mật:
              không gửi qua Zalo, Messenger; không lưu trên máy dùng chung.</li>
          <li>Nên lưu vào Drive của nhà trường, đặt quyền chỉ Ban giám hiệu xem được.</li>
        </ul>
      </div>
      <div class="qt-them">
        <button id="slChay">💾 Kết xuất toàn bộ dữ liệu ra Excel</button>
      </div>
      <div id="slKq"></div>
      <p class="qt-ghi">Tệp gồm ${BANG_SAO_LUU.length} trang tính, mỗi bảng dữ liệu một trang.
        Sổ nhật ký không đưa vào vì rất dài và không phải dữ liệu nghiệp vụ; muốn lấy thì
        dùng nút Export ở tab Nhật ký của Supabase.</p>`;

    document.getElementById('slChay').addEventListener('click', async () => {
      if (typeof XLSX === 'undefined') {
        return baoNhanh('Chưa nạp được thư viện Excel. Kiểm tra mạng rồi tải lại trang.');
      }
      const nut = document.getElementById('slChay');
      const kq = document.getElementById('slKq');
      nut.disabled = true;
      const wb = XLSX.utils.book_new();
      let tongDong = 0;
      const loi = [];

      for (let i = 0; i < BANG_SAO_LUU.length; i++) {
        const [bang, ten] = BANG_SAO_LUU[i];
        kq.innerHTML = `<div class="qt-nhac">Đang đọc <b>${bang}</b> … (${i + 1}/${BANG_SAO_LUU.length})</div>`;
        const r = await docHet(bang);
        if (r.loi) { loi.push(bang + ': ' + r.loi); continue; }
        const ws = XLSX.utils.json_to_sheet(r.data.length ? r.data : [{ '(bảng trống)': '' }]);
        XLSX.utils.book_append_sheet(wb, ws, ten.slice(0, 31));
        tongDong += r.data.length;
      }

      const nay = new Date();
      const ten = 'sao-luu-hoso-so-'
        + nay.getFullYear() + '-'
        + String(nay.getMonth() + 1).padStart(2, '0') + '-'
        + String(nay.getDate()).padStart(2, '0') + '.xlsx';
      XLSX.writeFile(wb, ten);
      nut.disabled = false;
      kq.innerHTML = `<div class="qt-viec ok"><b>✅ Đã kết xuất ${tongDong.toLocaleString('vi-VN')} dòng
        vào tệp ${ten}</b>${loi.length ? `<ul>${loi.map(l => `<li>Không đọc được ${l}</li>`).join('')}</ul>` : ''}</div>`;
      baoNhanh('Đã sao lưu ' + tongDong.toLocaleString('vi-VN') + ' dòng dữ liệu.');
    });
  }

  /* Dùng lại ô thông báo sẵn có của trang nếu có */
  function baoNhanh(msg) {
    if (typeof window.notify === 'function') window.notify(msg);
    else console.log(msg);
  }

  /* ========================================================================
     LUỒNG CHÍNH
     ======================================================================== */
  async function khoiDong() {
    khoaTrang(true);

    const { data: { session } } = await sb.auth.getSession();

    if (!session) {
      manDangNhap.classList.add('hien');
      return;
    }

    const { data, error } = await sb.from('nguoi_dung')
      .select('*').eq('id', session.user.id).maybeSingle();

    if (error) {
      manDangNhap.classList.add('hien');
      hienLoi('Không đọc được thông tin tài khoản: ' + error.message);
      return;
    }

    /* Hiếm khi xảy ra: đã đăng nhập nhưng chưa có hồ sơ trong bảng nguoi_dung */
    if (!data) {
      manChoDuyet.classList.add('hien');
      document.getElementById('cdEmail').textContent = session.user.email;
      return;
    }

    if (data.trang_thai !== 'hoat_dong') {
      manChoDuyet.classList.add('hien');
      document.getElementById('cdEmail').textContent = data.email;
      if (data.trang_thai === 'khoa') {
        manChoDuyet.querySelector('.dn-cho').textContent =
          'Tài khoản này đã bị khoá. Thầy cô vui lòng liên hệ quản trị hệ thống của nhà trường.';
        manChoDuyet.querySelector('h2').textContent = 'Tài khoản đã bị khoá';
        manChoDuyet.querySelector('.dn-huy').textContent = '🔒';
      }
      return;
    }

    /* Vào được */
    nguoiDung = data;
    window.NGUOI_DUNG = data;
    sb.rpc('ghi_nhan_dang_nhap');

    manDangNhap.classList.remove('hien');
    manChoDuyet.classList.remove('hien');
    khoaTrang(false);
    dungTheNguoiDung();

    document.dispatchEvent(new CustomEvent('dangnhap-xong', { detail: data }));
  }

  /* Sau khi quay về từ Google, Supabase gắn phiên vào trang rồi báo lại */
  sb.auth.onAuthStateChange((sukien) => {
    if (sukien === 'SIGNED_IN' && !nguoiDung) khoiDong();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', khoiDong);
  } else {
    khoiDong();
  }
})();
