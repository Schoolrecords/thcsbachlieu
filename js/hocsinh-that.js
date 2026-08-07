/* ============================================================================
   MÀN HÌNH "QUẢN LÝ HỌC SINH" — NỐI VỚI DỮ LIỆU THẬT

   Màn hình này trước nay chạy bằng danh sách bịa: 636 em, họ tên sinh ngẫu
   nhiên, giáo viên chủ nhiệm cũng bịa. Nay nhà trường đã nạp danh sách thật
   từ sổ điểm VnEdu nên thay hẳn bằng số thật.

   CÁCH LÀM giống nhansu-sql.js và hoso-sql.js: KHÔNG sửa index.html, mà ghi
   đè ba hàm vẽ sau khi đăng nhập xong. Tệp này hỏng thì trang vẫn chạy như cũ.

   BA ĐIỀU PHẢI GIỮ

   1. CHƯA ĐĂNG NHẬP thì không đọc được gì (hàng rào RLS), nên giữ nguyên bản
      xem thử kèm dải cảnh báo. Không được im lặng hiện bảng rỗng.

   2. NĂM HỌC. Hệ thống đang ở năm 2026-2027, mà dữ liệu nhà trường vừa nạp là
      2025-2026. Nếu cứ lấy năm hiện hành thì màn hình trống trơn và thầy cô
      tưởng nạp hỏng. Nên: đọc xem cơ sở dữ liệu CÓ những năm nào, mở sẵn năm
      mới nhất có dữ liệu, và nói rõ đang xem năm nào.

   3. GIÁO VIÊN CHỦ NHIỆM lấy từ bảng phân công thật (la_chu_nhiem = true),
      không bịa nữa. Lớp nào chưa phân công thì để trống chứ không điền bừa.
   ============================================================================ */

(function () {
  'use strict';

  if (typeof CAU_HINH === 'undefined' || !CAU_HINH.DA_NOI) return;

  let NAM = '';            // năm học đang xem
  let CAC_NAM = [];        // các năm học có dữ liệu
  let LOP = {};            // "6A" -> { khoi, em: [...] }
  let CN = {};             // "6A" -> tên giáo viên chủ nhiệm
  let DA_NOI = false;      // đã thay được bằng dữ liệu thật chưa

  function chan(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function ngayVN(s) {
    const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
  }

  /* Máy chủ chỉ trả 1000 dòng mỗi lần. Trường hơn 600 em nên phải đọc theo
     trang, và PHẢI sắp theo khoá chính — không sắp thì hai trang có thể về
     theo hai thứ tự khác nhau, dòng bị đọc trùng hoặc rơi mất. */
  async function taiHet(bang, chon, loc) {
    const sb = window.sbClient, BUOC = 1000;
    let tuDau = 0, gom = [];
    for (;;) {
      let q = sb.from(bang).select(chon);
      (loc || []).forEach(f => { q = q.eq(f[0], f[1]); });
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
    const sb = window.sbClient;
    if (!sb) return false;

    /* Năm nào có dữ liệu — đọc gọn, chỉ lấy cột năm */
    const nam = await taiHet('hoc_sinh_lop', 'id, nam_hoc');
    CAC_NAM = Array.from(new Set(nam.map(r => r.nam_hoc))).filter(Boolean).sort().reverse();
    if (!CAC_NAM.length) return false;
    if (!NAM || CAC_NAM.indexOf(NAM) < 0) {
      NAM = CAC_NAM.indexOf(CAU_HINH.NAM_HOC) >= 0 ? CAU_HINH.NAM_HOC : CAC_NAM[0];
    }

    const ds = await taiHet('hoc_sinh_lop', '*, hoc_sinh(*)', [['nam_hoc', NAM]]);
    LOP = {};
    ds.filter(r => r.hoc_sinh).forEach(r => {
      const l = String(r.lop || '').toUpperCase();
      if (!l) return;
      (LOP[l] = LOP[l] || { khoi: r.khoi, em: [] }).em.push(r);
    });
    Object.keys(LOP).forEach(l => LOP[l].em.sort((a, b) =>
      String(a.hoc_sinh.ho_ten || '').localeCompare(String(b.hoc_sinh.ho_ten || ''), 'vi')));

    /* Giáo viên chủ nhiệm thật. Đọc lỗi thì để trống, không chặn màn hình —
       thiếu tên chủ nhiệm không làm sai con số nào. */
    CN = {};
    try {
      const pc = await sb.from('phan_cong_day')
        .select('lop, la_chu_nhiem, nguoi_dung:nguoi_dung_id(ho_ten)')
        .eq('nam_hoc', NAM).eq('la_chu_nhiem', true);
      if (!pc.error) {
        (pc.data || []).forEach(r => {
          if (r.nguoi_dung && r.nguoi_dung.ho_ten) {
            CN[String(r.lop || '').toUpperCase()] = r.nguoi_dung.ho_ten;
          }
        });
      }
    } catch (e) { /* không có cũng được */ }

    return true;
  }

  /* ==========================================================================
     GHI ĐÈ BA HÀM VẼ
     ========================================================================== */
  function dsKhoi() {
    const k = {};
    Object.keys(LOP).forEach(l => {
      const kh = LOP[l].khoi;
      (k[kh] = k[kh] || { k: kh, lops: [], si: [] });
    });
    Object.keys(LOP).sort().forEach(l => {
      const kh = LOP[l].khoi;
      k[kh].lops.push(l);
      k[kh].si.push(LOP[l].em.length);
    });
    return Object.keys(k).map(Number).sort().map(x => k[x]);
  }

  function veKhoi() {
    const ks = dsKhoi();
    const tongLop = ks.reduce((s, x) => s + x.lops.length, 0);
    const tongHS = ks.reduce((s, x) => s + x.si.reduce((a, b) => a + b, 0), 0);

    const pill = document.getElementById('stuPill');
    if (pill) pill.textContent = 'Năm học ' + NAM + ' · ' + tongLop + ' lớp · ' + tongHS + ' học sinh';

    const khac = NAM !== CAU_HINH.NAM_HOC;

    /* Ô chọn năm học chuyển vào khối tiêu đề, ngay dưới dòng sĩ số. Trước đây
       nó nằm nhờ trong dải cảnh báo; bỏ dòng "Số liệu thật" đi thì dải ấy chỉ
       còn mỗi ô xổ, teo lại lệch hẳn so với khối bên dưới.
       Liệt kê MỌI năm có trong bảng xếp lớp chứ không riêng năm hiện hành —
       thầy cô hay cần bấm ngược lại năm cũ để lấy số ngay. */
    const boc = document.getElementById('stuNamBoc');
    if (boc) {
      /* Trường mới dùng, chỉ có một năm thì chẳng có gì để chọn — để ô xổ trơ
         ra chỉ tổ rối mắt mà bấm vào không đổi được gì. */
      boc.innerHTML = CAC_NAM.length > 1
        ? '<div class="stu-nam"><label for="hsNamChon">Xem năm học</label>'
          + '<select id="hsNamChon">'
          + CAC_NAM.map(n => '<option value="' + chan(n) + '"'
              + (n === NAM ? ' selected' : '') + '>' + chan(n) + '</option>').join('')
          + '</select></div>'
        : '';
      /* Đọc hỏng thì TRẢ NĂM VỀ NHƯ CŨ, không để ô xổ một đằng số liệu một
         nẻo. Bản trước đổi NAM trước rồi mới tải: tải hỏng là veKhoi() không
         chạy, bảng và sĩ số giữ nguyên năm cũ trong khi NAM đã sang năm mới —
         mà veDsHs() lại in "· Năm học " + NAM lên đầu danh sách lớp VÀ lên
         bản in. Thầy cô bấm In danh sách là tờ giấy ghi sai năm học. */
      const o = document.getElementById('hsNamChon');
      if (o) o.addEventListener('change', async function () {
        const cu = NAM;
        NAM = this.value;
        try {
          await tai();
          veKhoi();
        } catch (e) {
          console.error(e);
          NAM = cu;
          this.value = cu;
          if (typeof notify === 'function') {
            notify('Chưa đọc được dữ liệu năm học vừa chọn. Màn hình giữ nguyên năm ' + cu + '.');
          }
        }
      });
    }

    /* Dải trên cùng nay chỉ còn một nhiệm vụ: CẢNH BÁO khi đang xem năm khác
       năm hiện hành. Xem đúng năm thì ẩn hẳn — thông báo "số liệu thật" hiện
       ở mọi lần mở màn hình là thứ thầy cô đọc một lần rồi thôi, để mãi chỉ
       chiếm chỗ. Việc bình thường thì không cần báo; báo là để chặn cái sai. */
    const canh = document.querySelector('#view-hocsinh .hs-mau-canh');
    if (canh) {
      canh.className = 'hs-mau-canh';
      canh.style.display = khac ? '' : 'none';
      canh.innerHTML = khac
        ? '<b>⚠ Đang xem năm học ' + chan(NAM) + '</b> — đọc trực tiếp từ cơ sở '
          + 'dữ liệu của nhà trường. Năm hiện hành của hệ thống là <b>'
          + chan(CAU_HINH.NAM_HOC) + '</b>. Con số dưới đây là của năm '
          + chan(NAM) + ', <b>đừng dùng làm số của năm nay</b>.'
        : '';
    }

    const grid = document.getElementById('khoiGrid');
    if (grid) {
      grid.innerHTML = ks.map(x => '<button class="khoi" onclick="showLop(' + x.k + ')">'
        + '<div class="em">' + x.k + '</div><h3>Khối ' + x.k + '</h3>'
        + '<div class="khoi-n"><div><b>' + x.lops.length + '</b><span>LỚP</span></div>'
        + '<div><b>' + x.si.reduce((a, b) => a + b, 0) + '</b><span>HỌC SINH</span></div></div>'
        + '<span class="go">Xem các lớp →</span></button>').join('');
    }
    const la = document.getElementById('lopArea');
    if (la) la.innerHTML = '';
  }

  function veLop(k, scroll) {
    const x = dsKhoi().find(y => y.k === k);
    if (!x) return;
    const o = document.getElementById('lopArea');
    if (!o) return;
    o.innerHTML = '<div class="group-banner"><div class="ic">K' + k + '</div>'
      + '<div><b>Khối ' + k + '</b><span>' + x.lops.length + ' lớp · '
      + x.si.reduce((a, b) => a + b, 0) + ' học sinh</span></div></div>'
      + '<div class="lop-grid">'
      + x.lops.map((l, i) => '<button class="lop" onclick="showDsHs(\'' + chan(l) + '\')">'
          + '<b>' + chan(l) + '</b><div class="si">' + x.si[i] + ' học sinh</div>'
          + '<span class="gv">' + chan(CN[l] || '— chưa phân công chủ nhiệm —') + '</span>'
          + '</button>').join('')
      + '</div>';
    if (scroll !== false) o.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function veDsHs(lop) {
    const l = LOP[String(lop).toUpperCase()];
    if (!l) return;
    const nam = l.em.filter(r => r.hoc_sinh.gioi_tinh === 'Nam').length;
    const nu = l.em.filter(r => r.hoc_sinh.gioi_tinh === 'Nữ').length;
    const chuaRo = l.em.length - nam - nu;

    document.getElementById('shIc').className = 'ic';
    document.getElementById('shIc').textContent = '🎒';
    document.getElementById('shTitle').textContent = 'Lớp ' + lop;
    document.getElementById('shSub').textContent =
      (CN[String(lop).toUpperCase()] ? 'Giáo viên chủ nhiệm: ' + CN[String(lop).toUpperCase()]
                                     : 'Chưa phân công giáo viên chủ nhiệm')
      + ' · Năm học ' + NAM;

    /* Bản in của màn hình này KHÔNG còn là dữ liệu mẫu nữa nên gỡ cờ la-mau */
    const than = document.getElementById('shBody');
    than.classList.remove('la-mau');
    than.innerHTML =
      '<div class="sheet-sum">'
      + '<div><div class="big">' + l.em.length + ' học sinh</div>'
      + '<div class="sub">Nam: ' + nam + ' · Nữ: ' + nu
      + (chuaRo ? ' · chưa ghi giới tính: ' + chuaRo : '')
      + ' · Năm học ' + chan(NAM) + '</div></div>'
      + '<div class="sp"></div>'
      + '<button class="btn btn-pri" onclick="window.print()">🖨 In danh sách</button>'
      + '</div>'
      + '<div class="tbl-wrap"><table class="data"><thead><tr>'
      + '<th style="width:56px">STT</th><th style="width:120px">Mã học sinh</th>'
      + '<th>Họ và tên</th><th style="width:110px">Ngày sinh</th>'
      + '<th style="width:84px">Giới tính</th></tr></thead><tbody>'
      + l.em.map((r, i) => '<tr><td class="num">' + (i + 1) + '</td>'
          + '<td class="num">' + chan(r.hoc_sinh.ma) + '</td>'
          + '<td>' + chan(r.hoc_sinh.ho_ten) + '</td>'
          + '<td class="num">' + chan(ngayVN(r.hoc_sinh.ngay_sinh) || '—') + '</td>'
          + '<td class="num">' + chan(r.hoc_sinh.gioi_tinh || '—') + '</td></tr>').join('')
      + '</tbody></table></div>'
      /* KHÔNG in số định danh cá nhân ra màn hình — số ấy trùng số căn cước,
         chỉ lưu chứ không hiện, theo Nghị định 13/2023 và quy ước của dự án. */
      + '<p style="font-size:12.4px;color:var(--muted);margin-top:12px;line-height:1.6">'
      + 'Thông tin cá nhân của học sinh được bảo vệ theo Nghị định 13/2023/NĐ-CP. '
      + 'Số định danh cá nhân có lưu trong hệ thống nhưng không hiển thị ở đây. '
      + 'Thầy cô chỉ xem được lớp mình phụ trách; hàng rào đặt ở máy chủ.</p>';

    document.getElementById('sheetOverlay').classList.add('on');
    document.body.style.overflow = 'hidden';
  }

  /* ==========================================================================
     THAY THẾ SAU KHI ĐĂNG NHẬP XONG
     ========================================================================== */
  async function noi() {
    try {
      if (!await tai()) return;   // chưa có dữ liệu thì để nguyên bản xem thử
    } catch (e) {
      console.error('[Quản lý học sinh] Không đọc được danh sách thật:', e);
      return;                    // giữ nguyên bản xem thử kèm cảnh báo, không hiện bảng rỗng
    }
    DA_NOI = true;
    window.renderKhoi = veKhoi;
    window.showLop = veLop;
    window.showDsHs = veDsHs;
    veKhoi();
  }

  document.addEventListener('dangnhap-xong', noi);
  /* Nạp xong danh sách mới thì gọi lại để màn hình cập nhật ngay */
  window.hocSinhNoiLai = noi;
})();
