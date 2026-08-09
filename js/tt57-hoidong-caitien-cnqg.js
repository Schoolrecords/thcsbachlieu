/* ============================================================================
   BA MÀN HÌNH CÒN THIẾU CỦA THÔNG TƯ 57/2026/TT-BGDĐT

     1. Hội đồng tự đánh giá        — Điều 9
     2. Kế hoạch cải tiến (Biểu 2)  — Điều 10, Mẫu số 2 Phụ lục V
     3. Điều kiện chuẩn quốc gia    — Điều 16

   Ba việc này đã có bảng trong cơ sở dữ liệu (tệp sql/12 và sql/32) nhưng trước
   đó không màn hình nào dùng tới, nên nhà trường không nhập được. Gộp vào một
   tệp vì cả ba đều là ba tab của bảng Quản trị hệ thống và dùng chung một bộ
   hàm phụ trợ.

   NGUYÊN TẮC XUYÊN SUỐT, GIỐNG CÁC MÀN HÌNH KHÁC CỦA HỆ THỐNG
     · Mọi lệnh ghi đều .select() rồi ĐẾM số dòng đổi. Không đếm thì RLS lọc âm
       thầm: máy chủ trả "không lỗi" mà không ghi gì, màn hình reo "đã lưu".
     · Số nào máy tính được thì máy tính, và nói rõ là máy tính. Số nào là kết
       luận chuyên môn thì để nhà trường đánh dấu — khoản 4 Điều 27 cấm lấy dữ
       liệu định lượng làm căn cứ duy nhất để kết luận.
     · Thiếu dữ liệu KHÁC không đáp ứng. Chưa xét thì để trống, không tô đỏ.
   ============================================================================ */

(function () {
  'use strict';

  if (typeof CAU_HINH === 'undefined' || !CAU_HINH.DA_NOI) return;

  const sb = () => window.sbClient;
  const NAM = () => CAU_HINH.NAM_HOC || '2026-2027';

  function chan(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function laQuanTri() {
    const u = window.NGUOI_DUNG;
    return !!u && ['admin', 'ban_giam_hieu'].includes(u.vai_tro);
  }
  function bao(s) { if (typeof notify === 'function') notify(s); }
  function ngayVN(s) {
    const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
  }
  /* Ghi rồi ĐẾM. Trả về dòng vừa ghi, hoặc ném lỗi có câu người đọc hiểu được. */
  async function ghi(bang, ban, onConflict) {
    const r = await sb().from(bang).upsert(ban, onConflict ? { onConflict: onConflict } : undefined)
      .select();
    if (r.error) throw r.error;
    if (!r.data || !r.data.length) {
      throw new Error('Máy chủ nhận lệnh nhưng không dòng nào đổi — '
        + 'tài khoản đang dùng có thể không còn quyền quản trị.');
    }
    return r.data[0];
  }

  const css = `
  .tt-canh{background:#eef4ff;border:1px solid #cfe0ff;color:#1d4ed8;border-radius:10px;
    padding:12px 15px;font-size:13.5px;margin-bottom:13px;line-height:1.65}
  .tt-canh.do{background:#fdf3f2;border-color:#f3c9c5;color:#8a3428}
  .tt-canh.xanh{background:#f2fdf6;border-color:#bfe8cd;color:#1a6437}
  .tt-canh.vang{background:#fff8e8;border-color:#f0d089;color:#7a5410}
  .tt-muc{font-size:14px;font-weight:700;color:#14306b;margin:20px 0 8px}
  .tt-bang{width:100%;border-collapse:collapse;font-size:13.2px}
  .tt-bang th{background:#eef3fb;color:#14306b;font-weight:700;padding:7px 8px;
    border:1px solid #dbe3ef;font-size:12.3px;text-align:left}
  .tt-bang td{border:1px solid #e4e9f2;padding:5px 7px;vertical-align:top}
  .tt-o{width:100%;padding:5px 7px;border:1.5px solid #cbd5e1;border-radius:7px;
    font-size:13px;font-family:inherit;background:#fff}
  .tt-o:focus{outline:0;border-color:#2563eb;box-shadow:0 0 0 3px #dbeafe}
  textarea.tt-o{min-height:46px;resize:vertical;line-height:1.5}
  .tt-luoi{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:11px}
  .tt-luoi label{display:block;font-size:12.2px;font-weight:600;color:#14306b;margin-bottom:4px}
  .tt-nho{font-size:11.8px;color:#64748b}
  .tt-den{display:inline-block;width:11px;height:11px;border-radius:50%;margin-right:6px;
    vertical-align:middle}
  .tt-den.ok{background:#22c55e}
  .tt-den.khong{background:#dc2626}
  .tt-den.chua{background:#cbd5e1}
  .tt-nut{background:#fff;border:1px solid #cfd8e6;color:#14306b;border-radius:8px;
    padding:6px 12px;font-size:13px;cursor:pointer;font-family:inherit}
  .tt-nut:hover{background:#eef4ff}
  .tt-nut.xoa{color:#b91c1c;border-color:#f0cdc8}
  .tt-dk{border:1px solid #e2e8f2;border-left:4px solid #cbd5e1;border-radius:9px;
    padding:11px 14px;margin-bottom:10px;background:#fbfcfe}
  .tt-dk.ok{border-left-color:#22c55e;background:#fafefb}
  .tt-dk.khong{border-left-color:#dc2626;background:#fefafa}
  .tt-dk b{color:#14306b}
  .tt-dk .vb{font-size:12.8px;color:#3b4a63;line-height:1.6;margin:5px 0 7px}
  `;
  document.head.insertAdjacentHTML('beforeend', '<style>' + css + '</style>');


  /* ==========================================================================
     1. HỘI ĐỒNG TỰ ĐÁNH GIÁ — Điều 9
     ========================================================================== */
  const VAI_HD = ['Chủ tịch', 'Phó Chủ tịch', 'Thư ký', 'Ủy viên'];
  let HD = null, TV = [], KT = null, DS_CBGV = [];
  /* Của tệp sql/35: danh mục tiêu chí để kiểm tra mã nhập vào có thật, và tiến
     độ từng thành viên do máy chủ đếm. Chưa chạy sql/35 thì THIEU_PC bật, phần
     phân công tự ẩn — cả bảng vẫn dùng được như cũ. */
  let DS_TIEU_CHI = [], TIEN_DO = {}, THIEU_PC = false;

  async function taiHD() {
    const s = sb();
    const [hd, cb, tc] = await Promise.all([
      s.from('hoi_dong_tdg').select('*').eq('nam_hoc', NAM()),
      s.from('moi_tai_khoan').select('email, ho_ten, chuc_vu').order('ho_ten'),
      s.from('tieu_chi').select('ma, ten').order('so_tt')
    ]);
    if (hd.error) throw hd.error;
    HD = (hd.data && hd.data[0]) || null;
    DS_CBGV = cb.error ? [] : (cb.data || []);
    DS_TIEU_CHI = tc.error ? [] : (tc.data || []);

    TV = [];
    if (HD) {
      const tv = await s.from('thanh_vien_hoi_dong').select('*')
        .eq('hoi_dong_id', HD.id).order('so_tt');
      if (tv.error) throw tv.error;
      TV = tv.data || [];
    }
    /* Dò cột phân công từ chính dòng vừa đọc về. Chưa có thành viên nào thì
       chưa kết luận được — cứ coi như có, lệnh ghi đầu tiên sẽ báo rõ. */
    THIEU_PC = !!TV.length && !('tieu_chi_phu_trach' in TV[0]);

    /* Tiến độ đếm ở máy chủ. Hàm chưa có (chưa chạy sql/35) thì bỏ qua, KHÔNG
       ném lỗi ra ngoài — thiếu bảng tiến độ không phải cớ để che cả màn hình
       hội đồng đang dùng được. */
    TIEN_DO = {};
    const td = await s.rpc('tien_do_thanh_vien', { p_nam_hoc: NAM() });
    if (td.error) {
      /* CHỈ coi là "chưa chạy sql/35" khi máy chủ báo đúng là KHÔNG TÌM THẤY
         HÀM (42883 của PostgreSQL, PGRST202 của PostgREST). Bắt mọi lỗi rồi bật
         cờ là sai nặng: mạng chớp nhoáng hay hết hạn phiên cũng làm ba cột phân
         công biến mất khỏi màn hình kèm câu "hãy chạy sql/35" — trong khi tệp
         ấy đã chạy và dữ liệu vẫn nằm nguyên trong cơ sở dữ liệu. Thầy cô vừa
         gõ xong ô Tiêu chí phụ trách mà thấy cả cột mất thì kết luận đương
         nhiên là "phần mềm làm mất dữ liệu". */
      const ma = String(td.error.code || '');
      const s2 = String(td.error.message || '');
      if (ma === '42883' || ma === 'PGRST202' || /tien_do_thanh_vien/.test(s2)) {
        THIEU_PC = true;
      } else {
        console.error('[Hội đồng] Không đọc được tiến độ:', td.error);
      }
    } else {
      (td.data || []).forEach(function (r) { TIEN_DO[r.thanh_vien_id] = r; });
    }

    const kt = await s.rpc('kiem_tra_hoi_dong', { p_nam_hoc: NAM() });
    KT = (!kt.error && kt.data && kt.data[0]) ? kt.data[0] : null;
  }

  /* Ô nhập tiêu chí phụ trách nhận chuỗi "1.1, 1.2". Trả về mảng mã ĐÃ KIỂM
     TRA có thật trong danh mục, cùng danh sách mã sai để báo lại. Không tự bỏ
     mã sai đi im lặng: gõ nhầm "1.10" mà máy lặng lẽ xoá thì người nhập tưởng
     đã giao xong. */
  function tachMaTieuChi(s) {
    const co = DS_TIEU_CHI.map(x => x.ma);
    /* Chưa đọc được danh mục thì KHÔNG kết luận mã nào sai. Thiếu chốt này,
       câu đọc bảng tieu_chi hỏng là mọi mã nhập vào đều bị coi là sai, màn hình
       báo "Không có tiêu chí mang mã 1.1. Mã hợp lệ là ." — câu vô nghĩa, và
       thầy cô không cách nào giao được việc mà cũng không biết vì sao. */
    if (!co.length) return { dung: null, sai: [], thieuDanhMuc: true };
    const dung = [], sai = [];
    String(s || '').split(/[,;\s]+/).forEach(function (m) {
      const t = m.trim();
      if (!t) return;
      if (co.indexOf(t) >= 0) { if (dung.indexOf(t) < 0) dung.push(t); }
      else sai.push(t);
    });
    dung.sort(function (a, b) { return a.localeCompare(b, 'vi', { numeric: true }); });
    return { dung: dung, sai: sai };
  }

  /* Dải kiểm tra: chỉ ra ĐÚNG điều kiện nào chưa đạt, không nói chung "chưa hợp
     lệ". Nhà trường sửa được ngay mà không phải tra lại Thông tư. */
  function daiKiemHD() {
    if (!KT) return '';
    const d = function (ok, chu) {
      return '<div><span class="tt-den ' + (ok === null ? 'chua' : ok ? 'ok' : 'khong')
        + '"></span>' + chu + '</div>';
    };
    let h = '';
    h += d(KT.du_so_luong, '<b>Từ 05 thành viên trở lên</b> — đang có <b>'
      + KT.so_thanh_vien + '</b> người (khoản 1 Điều 9)');
    h += d(KT.la_so_le, '<b>Số lượng là số lẻ</b> — '
      + (KT.la_so_le ? 'đúng' : 'đang là số chẵn, phải thêm hoặc bớt một người'));
    h += d(KT.so_chu_tich === 1, '<b>Đúng 01 Chủ tịch</b> — đang có ' + KT.so_chu_tich);
    h += d(KT.so_thu_ky === 1, '<b>Đúng 01 Thư ký</b> — đang có ' + KT.so_thu_ky);

    /* Hạn 15/6: đếm ngược khi chưa phê duyệt, không tô đỏ khi còn thời gian —
       chưa tới hạn thì không phải là vi phạm. */
    const han = KT.han_phe_duyet, pd = KT.ngay_phe_duyet;
    if (pd) {
      h += d(KT.phe_duyet_dung_han, '<b>Phê duyệt báo cáo trước 15/6</b> — đã phê duyệt '
        + ngayVN(pd) + (KT.phe_duyet_dung_han ? ', đúng hạn' : ', QUÁ hạn ' + ngayVN(han)));
    } else if (han) {
      const conLai = Math.ceil((new Date(han) - new Date()) / 86400000);
      h += d(conLai >= 0 ? null : false,
        '<b>Hạn phê duyệt báo cáo tự đánh giá: ' + ngayVN(han) + '</b> — '
        + (conLai >= 0 ? 'còn <b>' + conLai + '</b> ngày' : 'ĐÃ QUÁ HẠN ' + (-conLai) + ' ngày')
        + ' (điểm d khoản 3 Điều 9)');
    }
    if (KT.so_thanh_vien > 0) {
      h += '<div class="tt-nho" style="margin-top:6px">Đã đánh dấu <b>'
        + KT.so_da_tap_huan + '/' + KT.so_thanh_vien
        + '</b> người từng tập huấn về bảo đảm chất lượng — khoản 2 Điều 9 ghi '
        + '"ưu tiên", không bắt buộc.</div>';
    }
    const xong = KT.hop_le;
    return '<div class="tt-canh ' + (xong ? 'xanh' : 'vang') + '">'
      + '<b>' + (xong ? 'Hội đồng đủ điều kiện của Điều 9.' : 'Hội đồng chưa đủ điều kiện:')
      + '</b>' + h + '</div>';
  }

  function veHD(hop) {
    const sua = laQuanTri();
    let h = '<div class="tt-canh">Quyết định thành lập hội đồng này là <b>tài liệu phải kèm '
      + 'theo báo cáo tự đánh giá</b> (Phần IV Biểu 1). Hội đồng cũng là bên theo dõi, đánh giá '
      + 'việc thực hiện kế hoạch cải tiến (khoản 3 Điều 10).</div>';

    h += daiKiemHD();

    h += '<div class="tt-muc">Quyết định thành lập</div><div class="tt-luoi">'
      + '<div><label>Số quyết định</label><input class="tt-o" id="hdSo" value="'
        + chan(HD ? (HD.so_quyet_dinh || '') : '') + '" placeholder="12/QĐ-THCSBL"'
        + (sua ? '' : ' disabled') + '></div>'
      + '<div><label>Ngày quyết định</label><input class="tt-o" id="hdNgay" type="date" value="'
        + chan(HD ? (HD.ngay_quyet_dinh || '') : '') + '"' + (sua ? '' : ' disabled') + '></div>'
      + '<div><label>Ngày phê duyệt báo cáo tự đánh giá</label>'
        + '<input class="tt-o" id="hdPD" type="date" value="'
        + chan(HD ? (HD.ngay_phe_duyet_bao_cao || '') : '') + '"' + (sua ? '' : ' disabled') + '>'
        + '<div class="tt-nho">Phải trước 15/6 của năm học</div></div>'
      + '<div><label>Ghi chú</label><input class="tt-o" id="hdGC" value="'
        + chan(HD ? (HD.ghi_chu || '') : '') + '"' + (sua ? '' : ' disabled') + '></div>'
      + '</div>';

    h += '<div class="tt-muc">Thành viên hội đồng'
      + (sua ? ' <button class="tt-nut" id="hdThem">➕ Thêm thành viên</button>' : '')
      /* Hai nút xuất hiện với MỌI người xem được mục này, không riêng quản trị:
         in ra bản giấy không sửa gì của ai. */
      + (TV.length
        ? ' <button class="tt-nut" id="hdInDS">📄 Danh sách hội đồng (Word)</button>'
          + ' <button class="tt-nut" id="hdInPC">📄 Bảng phân công nhiệm vụ (Word)</button>'
        : '')
      + '</div>';

    if (!TV.length) {
      h += '<div class="tt-canh vang">Chưa có thành viên nào. Điều 9 đòi <b>số lẻ, từ 05 người '
        + 'trở lên</b>, gồm Chủ tịch, Phó Chủ tịch, Thư ký và các ủy viên.</div>';
    } else {
      h += '<div class="tbl-wrap"><table class="tt-bang"><thead><tr>'
        + '<th style="width:36px">TT</th><th>Họ và tên</th><th style="width:150px">Chức vụ trong trường</th>'
        + '<th style="width:126px">Vai trò trong hội đồng</th>'
        + (THIEU_PC ? '' :
            '<th style="width:150px">Nhóm công tác</th>'
          + '<th style="width:150px">Tiêu chí phụ trách</th>'
          + '<th style="width:120px">Tiến độ</th>')
        + '<th style="width:88px">Đã tập huấn</th><th style="width:50px"></th>'
        + '</tr></thead><tbody>';
      TV.forEach(function (t, i) {
        const td = TIEN_DO[t.id];
        const ds = t.tieu_chi_phu_trach || [];
        h += '<tr><td>' + (i + 1) + '</td>'
          + '<td><b>' + chan(t.ho_ten) + '</b>'
            + (t.email ? '<div class="tt-nho">' + chan(t.email) + '</div>' : '')
            + (THIEU_PC ? '' :
                '<div style="margin-top:5px">' + (sua
                  ? '<input class="tt-o" data-tv="' + t.id + '" data-f="nhiem_vu" value="'
                    + chan(t.nhiem_vu || '') + '" placeholder="Nhiệm vụ được giao…">'
                  : (t.nhiem_vu ? '<span class="tt-nho">' + chan(t.nhiem_vu) + '</span>' : ''))
                + '</div>') + '</td>'
          + '<td>' + chan(t.chuc_vu || '—') + '</td>'
          + '<td>' + (sua
              ? '<select class="tt-o" data-tv="' + t.id + '" data-f="vai_tro">'
                + VAI_HD.map(v => '<option' + (v === t.vai_tro ? ' selected' : '') + '>'
                    + chan(v) + '</option>').join('') + '</select>'
              : chan(t.vai_tro)) + '</td>';

        if (!THIEU_PC) {
          h += '<td>' + (sua
              ? '<input class="tt-o" data-tv="' + t.id + '" data-f="nhom" value="'
                + chan(t.nhom || '') + '" placeholder="Dữ liệu và minh chứng…">'
              : chan(t.nhom || '—')) + '</td>'
            /* Ô text "1.1, 1.2" thay cho danh sách bấm chọn 15 dòng: gõ nhanh
               hơn nhiều khi giao cả một tiêu chuẩn, và mã sai thì báo lại chứ
               không lặng lẽ bỏ đi. */
            + '<td>' + (sua
              ? '<input class="tt-o" data-tv="' + t.id + '" data-f="tieu_chi_phu_trach" value="'
                + chan(ds.join(', ')) + '" placeholder="1.1, 1.2">'
                + '<div class="tt-nho">Cách nhau dấu phẩy</div>'
              : (ds.length ? chan(ds.join(', ')) : '—')) + '</td>'
            + '<td>' + (td && td.so_tieu_chi
              ? '<b>' + td.da_du_noi_ham + '/' + td.so_tieu_chi + '</b> tiêu chí viết đủ'
                + '<div class="tt-nho">' + td.da_cham_muc + '/' + td.so_tieu_chi + ' đã chấm mức</div>'
              /* Chưa giao tiêu chí nào KHÁC với làm chưa xong — để trống chứ
                 không ghi 0/0 rồi tô màu như người này chậm tiến độ. */
              : '<span class="tt-nho">chưa được giao</span>') + '</td>';
        }

        h += '<td style="text-align:center">' + (sua
              ? '<input type="checkbox" data-tv="' + t.id + '" data-f="da_tap_huan"'
                + (t.da_tap_huan ? ' checked' : '') + '>'
              : (t.da_tap_huan ? '✓' : '')) + '</td>'
          + '<td>' + (sua ? '<button class="tt-nut xoa" data-xoatv="' + t.id + '">🗑</button>' : '')
          + '</td></tr>';
      });
      h += '</tbody></table></div>';

      if (THIEU_PC) {
        h += '<div class="tt-canh vang">Chưa có chỗ lưu phần <b>phân công nhiệm vụ</b> '
          + '(nhóm công tác, tiêu chí phụ trách, tiến độ). Chạy tệp '
          + '<code>sql/35</code> trên Supabase là hiện ra.</div>';
      } else {
        h += '<div class="tt-nho" style="margin-top:8px">Điểm b khoản 3 Điều 9: hội đồng '
          + '<b>phân công nhiệm vụ cụ thể cho từng thành viên</b>. Cột “Tiến độ” do máy chủ đếm '
          + 'từ số nội hàm đã viết, không phải người tự đánh dấu.</div>';
      }
    }
    hop.innerHTML = h;

    /* Gắn hai nút in TRƯỚC lệnh thoát sớm bên dưới. Đặt sau thì người không
       phải quản trị bấm vào không có gì xảy ra — nút chết mà không ai biết vì
       sao. */
    const nDS = hop.querySelector('#hdInDS');
    if (nDS) nDS.addEventListener('click', function () {
      if (typeof window.xuatDanhSachHoiDong === 'function') window.xuatDanhSachHoiDong();
      else bao('Chưa nạp được phần xuất Word. Thầy cô tải lại trang.');
    });
    const nPC = hop.querySelector('#hdInPC');
    if (nPC) nPC.addEventListener('click', function () {
      if (typeof window.xuatPhanCongHoiDong === 'function') window.xuatPhanCongHoiDong();
      else bao('Chưa nạp được phần xuất Word. Thầy cô tải lại trang.');
    });

    if (!sua) return;

    ['hdSo', 'hdNgay', 'hdPD', 'hdGC'].forEach(function (id) {
      const o = hop.querySelector('#' + id);
      if (o) o.addEventListener('blur', () => luuHD(hop));
    });
    const th = hop.querySelector('#hdThem');
    if (th) th.addEventListener('click', () => themTV(hop));
    hop.querySelectorAll('[data-tv]').forEach(function (o) {
      o.addEventListener('change', async function () {
        const f = this.dataset.f;
        let gt;
        if (f === 'da_tap_huan') {
          gt = this.checked;
        } else if (f === 'tieu_chi_phu_trach') {
          /* Kiểm tra mã trước khi ghi. Mã sai thì DỪNG hẳn và trả ô về giá trị
             cũ — ghi một nửa rồi báo lỗi thì người nhập không biết phần nào đã
             vào, phần nào chưa. */
          const kq = tachMaTieuChi(this.value);
          if (kq.thieuDanhMuc) {
            const cu0 = TV.find(x => String(x.id) === this.dataset.tv);
            this.value = ((cu0 && cu0.tieu_chi_phu_trach) || []).join(', ');
            bao('Chưa đọc được danh mục tiêu chí nên không kiểm tra được mã. '
              + 'Thầy cô tải lại trang rồi thử lại.');
            return;
          }
          if (kq.sai.length) {
            const cu = TV.find(x => String(x.id) === this.dataset.tv);
            this.value = ((cu && cu.tieu_chi_phu_trach) || []).join(', ');
            bao('Không có tiêu chí mang mã: ' + kq.sai.join(', ')
              + '. Mã hợp lệ là ' + DS_TIEU_CHI.map(x => x.ma).join(', ') + '.');
            return;
          }
          gt = kq.dung;
        } else {
          /* Ô chữ để trống thì ghi null chứ không ghi chuỗi rỗng — hai thứ này
             đọc ra khác nhau ở mọi câu truy vấn sau đó. */
          gt = String(this.value || '').trim() || null;
        }
        try {
          const r = await sb().from('thanh_vien_hoi_dong')
            .update({ [f]: gt }).eq('id', this.dataset.tv).select('id');
          if (r.error) throw r.error;
          if (!r.data || !r.data.length) throw new Error('Máy chủ không cho sửa dòng này.');
          await taiHD(); veHD(hop);
        } catch (e) { bao('Không lưu được: ' + (e.message || e)); }
      });
    });
    hop.querySelectorAll('[data-xoatv]').forEach(function (b) {
      b.addEventListener('click', async function () {
        const t = TV.find(x => String(x.id) === this.dataset.xoatv);
        if (!await xacNhan('Xoá ' + (t ? t.ho_ten : 'thành viên này') + ' khỏi hội đồng?\n\n'
          + 'Bớt một người có thể làm số thành viên thành số chẵn — Điều 9 đòi số lẻ.',
          { tieuDe: 'Xoá thành viên', nutOk: 'Xoá', nguyHiem: true })) return;
        const r = await sb().from('thanh_vien_hoi_dong').delete().eq('id', this.dataset.xoatv).select('id');
        if (r.error) { bao('Chưa xoá được: ' + r.error.message); return; }
        await taiHD(); veHD(hop);
      });
    });
  }

  async function luuHD(hop) {
    const g = id => { const o = hop.querySelector('#' + id); return o ? o.value.trim() : ''; };
    try {
      HD = await ghi('hoi_dong_tdg', {
        nam_hoc: NAM(),
        so_quyet_dinh: g('hdSo') || null,
        ngay_quyet_dinh: g('hdNgay') || null,
        ngay_phe_duyet_bao_cao: g('hdPD') || null,
        ghi_chu: g('hdGC') || null
      }, 'nam_hoc');
      /* Vẽ lại để dải kiểm tra cập nhật theo ngày phê duyệt vừa nhập */
      await taiHD(); veHD(hop);
    } catch (e) { bao('Không lưu được: ' + (e.message || e)); }
  }

  /* Thêm thành viên bằng cách CHỌN trong danh sách CBGV-NV, không gõ tay tên:
     gõ tay thì tên trong hội đồng và tên trong quyết định dễ lệch nhau một dấu. */
  async function themTV(hop) {
    if (!HD) {
      bao('Nhập số và ngày quyết định thành lập trước đã — thành viên gắn vào quyết định đó.');
      return;
    }
    const con = DS_CBGV.filter(c => !TV.some(t => t.email && t.email === c.email));
    if (!con.length) { bao('Mọi người trong danh sách CBGV-NV đã ở trong hội đồng.'); return; }

    const hopChon = document.createElement('div');
    hopChon.className = 'tt-canh';
    hopChon.innerHTML = '<b>Chọn người thêm vào hội đồng</b><div class="tt-luoi" style="margin-top:8px">'
      + '<div><label>Người</label><select class="tt-o" id="tvAi">'
      + con.map(c => '<option value="' + chan(c.email) + '">' + chan(c.ho_ten)
          + (c.chuc_vu ? ' — ' + chan(c.chuc_vu) : '') + '</option>').join('')
      + '</select></div>'
      + '<div><label>Vai trò trong hội đồng</label><select class="tt-o" id="tvVai">'
      + VAI_HD.map(v => '<option' + (v === 'Ủy viên' ? ' selected' : '') + '>' + chan(v)
          + '</option>').join('') + '</select></div>'
      + '<div><label>&nbsp;</label><label style="font-weight:400"><input type="checkbox" id="tvTH"> '
      + 'Đã tập huấn về bảo đảm chất lượng</label></div>'
      + '</div><div style="margin-top:9px"><button class="tt-nut" id="tvOk">Thêm</button> '
      + '<button class="tt-nut" id="tvHuy">Huỷ</button></div>';
    hop.insertBefore(hopChon, hop.firstChild);

    hopChon.querySelector('#tvHuy').addEventListener('click', () => hopChon.remove());
    hopChon.querySelector('#tvOk').addEventListener('click', async function () {
      const mail = hopChon.querySelector('#tvAi').value;
      const c = con.find(x => x.email === mail);
      try {
        const r = await sb().from('thanh_vien_hoi_dong').insert({
          hoi_dong_id: HD.id, ho_ten: c.ho_ten, chuc_vu: c.chuc_vu || null,
          email: c.email, vai_tro: hopChon.querySelector('#tvVai').value,
          da_tap_huan: hopChon.querySelector('#tvTH').checked,
          so_tt: TV.length + 1
        }).select('id');
        if (r.error) throw r.error;
        await taiHD(); veHD(hop);
      } catch (e) { bao('Không thêm được: ' + (e.message || e)); }
    });
  }


  /* ==========================================================================
     2. KẾ HOẠCH CẢI TIẾN — Biểu 2 (Mẫu số 2 Phụ lục V)
     ========================================================================== */
  const MUC_DO = ['Hoàn thành', 'Đang thực hiện', 'Chưa hoàn thành'];
  const THOI_DIEM = ['Cuối học kỳ I', 'Cuối năm học'];
  let KH_TT = {}, KH_VD = [], KH_V = [], KH_TD = {}, DGTC_KH = {};

  async function taiKH() {
    const s = sb(), nh = NAM();
    const [tt, vd, v, td, dg] = await Promise.all([
      s.from('khct_thong_tin').select('*').eq('nam_hoc', nh),
      s.from('khct_van_de').select('*').eq('nam_hoc', nh).order('so_tt'),
      s.from('ke_hoach_cai_tien').select('*').eq('nam_hoc', nh).order('so_tt'),
      s.from('khct_theo_doi').select('*').eq('nam_hoc', nh),
      s.from('danh_gia_tieu_chuan').select('*').eq('nam_hoc', nh)
    ]);
    if (tt.error) throw tt.error;
    if (vd.error) throw vd.error;
    if (v.error) throw v.error;
    KH_TT = (tt.data && tt.data[0]) || {};
    KH_VD = vd.data || [];
    KH_V = v.data || [];
    KH_TD = {};
    if (!td.error) (td.data || []).forEach(r => { KH_TD[r.thoi_diem] = r; });
    DGTC_KH = {};
    if (!dg.error) (dg.data || []).forEach(r => { DGTC_KH[r.tieu_chuan] = r; });
  }

  function veKH(hop) {
    const sua = laQuanTri();
    /* Nguyên tắc này in thẳng lên màn hình vì nó chống đúng thói làm cho đủ:
       lập kế hoạch cho cả 15 tiêu chí thì không còn là "cải tiến trọng tâm". */
    let h = '<div class="tt-canh"><b>Yêu cầu điểm b mục III Biểu 2:</b> '
      + '"<i>Không xây dựng kế hoạch cải tiến đối với toàn bộ tiêu chí mà tập trung vào các '
      + 'vấn đề ưu tiên</i>." Mục VIII điểm a: rà soát, đánh giá <b>tối thiểu 02 lần</b> trong '
      + 'năm học — đúng hai dòng của mục VI bên dưới.'
      + (sua ? ' <button class="tt-nut" id="khXuat" style="margin-top:8px">📄 Xuất Biểu 2 (Word)</button>' : '')
      + '</div>';

    h += '<div class="tt-muc">I, II — Thể thức và căn cứ</div><div class="tt-luoi">'
      + oNhap('khSo', 'Số kế hoạch', KH_TT.so_ke_hoach, sua, '12/KH-THCSBL')
      + oNhap('khNgay', 'Ngày ban hành', KH_TT.ngay_ban_hanh, sua, '', 'date')
      + oNhap('khCanCu', 'Văn bản chỉ đạo khác (nếu có)', KH_TT.can_cu_khac, sua)
      + oNhap('khNoiNhan', 'Nơi nhận', KH_TT.noi_nhan, sua)
      + '</div>'
      + '<div class="tt-nho" style="margin-top:6px">Ba căn cứ đầu của mục II đã in sẵn trong '
      + 'mẫu (báo cáo tự đánh giá năm học ' + chan(NAM()) + ', kết quả rà soát kế hoạch năm '
      + 'trước, kế hoạch năm học) nên không phải nhập.</div>';

    /* ---- Mục IV ---- */
    h += '<div class="tt-muc">IV — Tóm tắt các vấn đề trọng tâm cần cải tiến'
      + (sua ? ' <button class="tt-nut" id="vdThem">➕ Thêm vấn đề</button>'
             + ' <button class="tt-nut" id="vdLay">↙ Lấy từ Đánh giá chung</button>' : '')
      + '</div>';
    h += '<div class="tbl-wrap"><table class="tt-bang"><thead><tr>'
      + '<th style="width:36px">TT</th><th style="width:90px">Tiêu chuẩn</th>'
      + '<th style="width:96px">Tiêu chí</th><th>Đánh giá hiện trạng</th>'
      + '<th>Điểm hạn chế</th><th>Nguyên nhân của hạn chế</th>'
      + '<th style="width:50px"></th></tr></thead><tbody>';
    if (!KH_VD.length) {
      h += '<tr><td colspan="7" class="tt-nho" style="text-align:center;padding:12px">'
        + 'Chưa có vấn đề nào. Bấm "Lấy từ Đánh giá chung" để đưa điểm hạn chế và nguyên nhân '
        + 'đã nhập ở báo cáo tự đánh giá sang đây, khỏi gõ lại.</td></tr>';
    }
    KH_VD.forEach(function (r, i) {
      h += '<tr><td>' + (i + 1) + '</td>'
        + '<td>' + oO(r.id, 'tieu_chuan', r.tieu_chuan, sua, 'vd', 'so') + '</td>'
        + '<td>' + oO(r.id, 'tieu_chi_ma', r.tieu_chi_ma, sua, 'vd') + '</td>'
        + '<td>' + oO(r.id, 'hien_trang', r.hien_trang, sua, 'vd', 'ta') + '</td>'
        + '<td>' + oO(r.id, 'han_che', r.han_che, sua, 'vd', 'ta') + '</td>'
        + '<td>' + oO(r.id, 'nguyen_nhan', r.nguyen_nhan, sua, 'vd', 'ta') + '</td>'
        + '<td>' + (sua ? '<button class="tt-nut xoa" data-xoavd="' + r.id + '">🗑</button>' : '')
        + '</td></tr>';
    });
    h += '</tbody></table></div>';

    /* ---- Mục V: 10 cột ---- */
    h += '<div class="tt-muc">V — Kế hoạch cải tiến chất lượng (10 cột)'
      + (sua ? ' <button class="tt-nut" id="vThem">➕ Thêm việc</button>' : '') + '</div>';
    h += '<div class="tbl-wrap"><table class="tt-bang" style="min-width:1100px"><thead><tr>'
      + ['TT', 'Nội dung cải tiến', 'Mục tiêu cải tiến', 'Hoạt động/giải pháp',
         'Chỉ số đánh giá kết quả', 'Thời gian thực hiện', 'Đơn vị/cá nhân phụ trách',
         'Nguồn lực bảo đảm', 'Thông tin, dữ liệu hoặc minh chứng dự kiến',
         'Mức độ thực hiện', '']
          .map((x, i) => '<th' + (i === 0 ? ' style="width:34px"' : '') + '>' + x
            + (i > 0 && i < 10 ? ' <i class="tt-nho">(' + i + ')</i>' : '') + '</th>').join('')
      + '</tr></thead><tbody>';
    if (!KH_V.length) {
      h += '<tr><td colspan="11" class="tt-nho" style="text-align:center;padding:12px">'
        + 'Chưa có việc nào trong kế hoạch cải tiến.</td></tr>';
    }
    KH_V.forEach(function (r, i) {
      h += '<tr><td>' + (i + 1) + '</td>'
        + '<td>' + oO(r.id, 'ten', r.ten, sua, 'v', 'ta') + '</td>'
        + '<td>' + oO(r.id, 'muc_tieu', r.muc_tieu, sua, 'v', 'ta') + '</td>'
        + '<td>' + oO(r.id, 'giai_phap', r.giai_phap, sua, 'v', 'ta') + '</td>'
        + '<td>' + oO(r.id, 'chi_so_ket_qua', r.chi_so_ket_qua, sua, 'v', 'ta') + '</td>'
        + '<td>' + oO(r.id, 'thoi_gian_thuc_hien', r.thoi_gian_thuc_hien, sua, 'v') + '</td>'
        + '<td>' + oO(r.id, 'nguoi_phu_trach', r.nguoi_phu_trach, sua, 'v') + '</td>'
        + '<td>' + oO(r.id, 'nguon_luc', r.nguon_luc, sua, 'v', 'ta') + '</td>'
        + '<td>' + oO(r.id, 'minh_chung_du_kien', r.minh_chung_du_kien, sua, 'v', 'ta') + '</td>'
        + '<td>' + (sua
            ? '<select class="tt-o" data-v="' + r.id + '" data-f="muc_do_thuc_hien">'
              + '<option value="">— chưa ghi —</option>'
              + MUC_DO.map(m => '<option' + (m === r.muc_do_thuc_hien ? ' selected' : '') + '>'
                  + chan(m) + '</option>').join('') + '</select>'
            : chan(r.muc_do_thuc_hien || '')) + '</td>'
        + '<td>' + (sua ? '<button class="tt-nut xoa" data-xoav="' + r.id + '">🗑</button>' : '')
        + '</td></tr>';
    });
    h += '</tbody></table></div>';

    /* ---- Mục VI: đúng hai dòng ---- */
    h += '<div class="tt-muc">VI — Theo dõi và đánh giá thực hiện (giám sát nội bộ)</div>'
      + '<div class="tbl-wrap"><table class="tt-bang"><thead><tr>'
      + '<th style="width:120px">Thời điểm</th><th>Nội dung theo dõi</th><th>Kết quả thực hiện</th>'
      + '<th>Điều chỉnh (nếu có)</th><th style="width:150px">Người đánh giá</th>'
      + '</tr></thead><tbody>';
    THOI_DIEM.forEach(function (td) {
      const r = KH_TD[td] || {};
      h += '<tr><td><b>' + chan(td) + '</b></td>'
        + ['noi_dung', 'ket_qua', 'dieu_chinh', 'nguoi_danh_gia'].map(function (f) {
            return '<td>' + (sua
              ? '<textarea class="tt-o" data-td="' + chan(td) + '" data-f="' + f + '">'
                + chan(r[f] || '') + '</textarea>'
              : chan(r[f] || '')) + '</td>';
          }).join('') + '</tr>';
    });
    h += '</tbody></table></div>';

    /* ---- Mục VII ---- */
    h += '<div class="tt-muc">VII — Tổ chức thực hiện</div><div class="tt-luoi">'
      + oNhap('khTc1', '1. Người đứng đầu cơ sở giáo dục', KH_TT.tc_nguoi_dung_dau, sua, '', 'ta')
      + oNhap('khTc2', '2. Hội đồng tự đánh giá', KH_TT.tc_hoi_dong, sua, '', 'ta')
      + oNhap('khTc3', '3. Các tổ chuyên môn và bộ phận liên quan', KH_TT.tc_to_chuyen_mon, sua, '', 'ta')
      + '</div>'
      + '<div class="tt-nho" style="margin-top:6px">Mục III (mục đích, yêu cầu) và mục VIII '
      + '(cơ chế đánh giá và báo cáo) đã in sẵn nguyên văn trong mẫu nên không phải nhập.</div>';

    hop.innerHTML = h;
    ganKH(hop, sua);
  }

  function oNhap(id, nhan, gt, sua, ph, kieu) {
    const v = chan(gt == null ? '' : gt);
    return '<div><label>' + chan(nhan) + '</label>'
      + (kieu === 'ta'
          ? '<textarea class="tt-o" id="' + id + '"' + (sua ? '' : ' disabled') + '>' + v + '</textarea>'
          : '<input class="tt-o" id="' + id + '"' + (kieu === 'date' ? ' type="date"' : '')
            + ' value="' + v + '" placeholder="' + chan(ph || '') + '"'
            + (sua ? '' : ' disabled') + '>')
      + '</div>';
  }
  function oO(id, f, gt, sua, nhom, kieu) {
    const v = chan(gt == null ? '' : gt);
    if (!sua) return v;
    if (kieu === 'ta') {
      return '<textarea class="tt-o" data-' + nhom + '="' + id + '" data-f="' + f + '">'
        + v + '</textarea>';
    }
    return '<input class="tt-o" data-' + nhom + '="' + id + '" data-f="' + f + '" value="' + v
      + '"' + (kieu === 'so' ? ' type="number" min="1" max="4"' : '') + '>';
  }

  function ganKH(hop, sua) {
    const x = hop.querySelector('#khXuat');
    if (x) x.addEventListener('click', () => xuatBieu2());
    if (!sua) return;

    const map = { khSo: 'so_ke_hoach', khNgay: 'ngay_ban_hanh', khCanCu: 'can_cu_khac',
                  khNoiNhan: 'noi_nhan', khTc1: 'tc_nguoi_dung_dau', khTc2: 'tc_hoi_dong',
                  khTc3: 'tc_to_chuyen_mon' };
    Object.keys(map).forEach(function (id) {
      const o = hop.querySelector('#' + id);
      if (!o) return;
      o.addEventListener('blur', async function () {
        const moi = this.value.trim();
        if (String(KH_TT[map[id]] || '') === moi) return;
        /* Gửi ĐỦ mọi cột: gửi một cột thì lệnh ghi đè đặt các cột khác về mặc
           định, mất phần đã nhập trước đó. */
        const ban = { nam_hoc: NAM(), cap_nhat_boi: window.NGUOI_DUNG ? window.NGUOI_DUNG.id : null };
        Object.keys(map).forEach(k => { ban[map[k]] = KH_TT[map[k]] || null; });
        ban[map[id]] = moi || null;
        try { KH_TT = await ghi('khct_thong_tin', ban, 'nam_hoc'); }
        catch (e) { bao('Không lưu được: ' + (e.message || e)); }
      });
    });

    /* Ô của bảng IV và V: lưu từng ô một, không gửi cả dòng — hai người cùng
       sửa hai ô khác nhau của một dòng thì không ghi đè nhau. */
    [['vd', 'khct_van_de'], ['v', 'ke_hoach_cai_tien']].forEach(function (c) {
      hop.querySelectorAll('[data-' + c[0] + ']').forEach(function (o) {
        const sk = o.tagName === 'SELECT' ? 'change' : 'blur';
        o.addEventListener(sk, async function () {
          let gt = this.value.trim();
          if (this.type === 'number') gt = gt === '' ? null : parseInt(gt, 10);
          try {
            const r = await sb().from(c[1]).update({ [this.dataset.f]: gt || null })
              .eq('id', this.dataset[c[0]]).select('id');
            if (r.error) throw r.error;
            if (!r.data || !r.data.length) throw new Error('Máy chủ không cho sửa dòng này.');
          } catch (e) { bao('Không lưu được: ' + (e.message || e)); }
        });
      });
    });

    hop.querySelectorAll('[data-td]').forEach(function (o) {
      o.addEventListener('blur', async function () {
        const td = this.dataset.td, cu = KH_TD[td] || {};
        const ban = { nam_hoc: NAM(), thoi_diem: td,
          noi_dung: cu.noi_dung || null, ket_qua: cu.ket_qua || null,
          dieu_chinh: cu.dieu_chinh || null, nguoi_danh_gia: cu.nguoi_danh_gia || null,
          cap_nhat_boi: window.NGUOI_DUNG ? window.NGUOI_DUNG.id : null };
        ban[this.dataset.f] = this.value.trim() || null;
        try { KH_TD[td] = await ghi('khct_theo_doi', ban, 'nam_hoc,thoi_diem'); }
        catch (e) { bao('Không lưu được: ' + (e.message || e)); }
      });
    });

    const vt = hop.querySelector('#vdThem');
    if (vt) vt.addEventListener('click', async function () {
      try {
        const r = await sb().from('khct_van_de')
          .insert({ nam_hoc: NAM(), so_tt: KH_VD.length + 1 }).select('id');
        if (r.error) throw r.error;
        await taiKH(); veKH(hop);
      } catch (e) { bao('Không thêm được: ' + (e.message || e)); }
    });

    /* Lấy sẵn điểm hạn chế và nguyên nhân từ phần Đánh giá chung của báo cáo tự
       đánh giá. Đây là chỗ app đỡ được nhiều công nhất: mục IV Biểu 2 hỏi đúng
       những thứ đã nhập ở đó. CHỈ thêm tiêu chuẩn nào chưa có trong bảng, để bấm
       hai lần không sinh ra hai bộ dòng giống nhau. */
    const vl = hop.querySelector('#vdLay');
    if (vl) vl.addEventListener('click', async function () {
      const them = [];
      [1, 2, 3, 4].forEach(function (so) {
        const r = DGTC_KH[so];
        if (!r || !String(r.han_che_nguyen_nhan || '').trim()) return;
        if (KH_VD.some(x => x.tieu_chuan === so)) return;
        them.push({ nam_hoc: NAM(), so_tt: KH_VD.length + them.length + 1, tieu_chuan: so,
          han_che: r.han_che_nguyen_nhan, nguyen_nhan: null,
          hien_trang: r.xu_huong_3_nam || null });
      });
      if (!them.length) {
        bao('Không có gì để lấy: phần Đánh giá chung chưa nhập điểm hạn chế, '
          + 'hoặc bốn tiêu chuẩn đều đã có dòng trong bảng này.');
        return;
      }
      try {
        const r = await sb().from('khct_van_de').insert(them).select('id');
        if (r.error) throw r.error;
        await taiKH(); veKH(hop);
        bao('Đã lấy ' + (r.data || []).length + ' vấn đề từ phần Đánh giá chung. '
          + 'Thầy cô tách lại cho gọn và điền nguyên nhân.');
      } catch (e) { bao('Không lấy được: ' + (e.message || e)); }
    });

    const vth = hop.querySelector('#vThem');
    if (vth) vth.addEventListener('click', async function () {
      try {
        const r = await sb().from('ke_hoach_cai_tien')
          .insert({ nam_hoc: NAM(), ten: 'Việc cải tiến mới', so_tt: KH_V.length + 1 })
          .select('id');
        if (r.error) throw r.error;
        await taiKH(); veKH(hop);
      } catch (e) { bao('Không thêm được: ' + (e.message || e)); }
    });

    [['xoavd', 'khct_van_de'], ['xoav', 'ke_hoach_cai_tien']].forEach(function (c) {
      hop.querySelectorAll('[data-' + c[0] + ']').forEach(function (b) {
        b.addEventListener('click', async function () {
          if (!await xacNhan('Xoá dòng này khỏi kế hoạch cải tiến?',
            { nutOk: 'Xoá', nguyHiem: true })) return;
          const r = await sb().from(c[1]).delete().eq('id', this.dataset[c[0]]).select('id');
          if (r.error) { bao('Chưa xoá được: ' + r.error.message); return; }
          await taiKH(); veKH(hop);
        });
      });
    });
  }


  /* ==========================================================================
     XUẤT BIỂU 2 RA WORD
     ========================================================================== */
  const TR = "font-family:'Times New Roman',serif;";
  const O = TR + 'border:1px solid #000;padding:4pt 6pt;font-size:11.5pt;vertical-align:top;';
  const OT = O + 'background:#e8e8e8;font-weight:bold;text-align:center;';

  function xuatBieu2() {
    const nh = NAM();
    const P = TR + 'font-size:12pt;margin:0 0 5pt;text-align:justify';
    const MUC = TR + 'font-size:12pt;font-weight:bold;margin:10pt 0 5pt';
    const doan = t => String(t || '').trim()
      ? String(t).trim().split(/\n+/).map(x => '<p style="' + P + '">' + chan(x) + '</p>').join('')
      : '<p style="' + P + ';font-style:italic;color:#555">(nhà trường bổ sung)</p>';

    let h = '<table style="width:100%;border-collapse:collapse"><tr>'
      + '<td style="' + TR + 'width:45%;text-align:center;font-size:13pt;vertical-align:top;border:0">'
      + chan(CAU_HINH.CO_QUAN_QUAN_LY || '') + '<br><b>' + chan(CAU_HINH.TEN_TRUONG || '').toUpperCase()
      + '</b><div style="border-top:1px solid #000;width:60%;margin:2pt auto 0"></div>'
      + '<p style="' + TR + 'font-size:13pt;margin:8pt 0 0">Số: '
      + chan(KH_TT.so_ke_hoach || '…/KH-…') + '</p></td>'
      + '<td style="' + TR + 'text-align:center;font-size:13pt;vertical-align:top;border:0">'
      + '<b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br><b>Độc lập - Tự do - Hạnh phúc</b>'
      + '<div style="border-top:1px solid #000;width:52%;margin:2pt auto 0"></div>'
      + '<p style="' + TR + 'font-size:13pt;font-style:italic;margin:8pt 0 0">'
      + chan(CAU_HINH.DIA_DANH || '') + ', ngày '
      + (KH_TT.ngay_ban_hanh ? ngayVN(KH_TT.ngay_ban_hanh).replace(/\//g, ' tháng ') : '… tháng …')
      + ' năm ' + (KH_TT.ngay_ban_hanh ? String(KH_TT.ngay_ban_hanh).slice(0, 4) : '202…')
      + '</p></td></tr></table>'
      + '<p style="' + TR + 'text-align:center;font-size:15pt;font-weight:bold;margin:22pt 0 4pt">KẾ HOẠCH</p>'
      + '<p style="' + TR + 'text-align:center;font-size:13pt;font-weight:bold;margin:0 0 18pt">'
      + 'Cải tiến chất lượng giáo dục năm học ' + chan(nh) + '</p>';

    h += '<p style="' + MUC + '">I. THÔNG TIN CHUNG</p>'
      + '<p style="' + P + '">1. Tên cơ sở giáo dục: ' + chan(CAU_HINH.TEN_TRUONG || '') + '</p>'
      + '<p style="' + P + '">2. Loại hình: Công lập</p>'
      + '<p style="' + P + '">3. Địa chỉ: ' + chan(CAU_HINH.DIA_CHI_TRUONG || '') + '</p>';

    h += '<p style="' + MUC + '">II. CĂN CỨ XÂY DỰNG KẾ HOẠCH</p>'
      + '<p style="' + P + '">1. Báo cáo tự đánh giá năm học ' + chan(nh) + '.</p>'
      + '<p style="' + P + '">2. Kết quả rà soát việc thực hiện kế hoạch cải tiến chất lượng năm học trước.</p>'
      + '<p style="' + P + '">3. Kế hoạch năm học và định hướng phát triển của cơ sở giáo dục.</p>'
      + (String(KH_TT.can_cu_khac || '').trim()
          ? '<p style="' + P + '">4. ' + chan(KH_TT.can_cu_khac) + '</p>' : '');

    /* Mục III in nguyên văn của mẫu — đây là chữ của Thông tư, không phải chữ
       nhà trường, nên in đủ chứ không rút gọn. */
    h += '<p style="' + MUC + '">III. MỤC ĐÍCH, YÊU CẦU</p>'
      + '<p style="' + TR + 'font-size:12pt;font-weight:bold;margin:5pt 0 3pt">1. Mục đích</p>'
      + ['a) Xác định các vấn đề trọng tâm cần cải tiến trên cơ sở kết quả tự đánh giá;',
         'b) Tổ chức thực hiện các giải pháp nhằm nâng cao chất lượng giáo dục;',
         'c) Tăng cường hiệu quả quản trị, sử dụng nguồn lực và trách nhiệm giải trình của cơ sở giáo dục.']
        .map(x => '<p style="' + P + '">' + x + '</p>').join('')
      + '<p style="' + TR + 'font-size:12pt;font-weight:bold;margin:5pt 0 3pt">2. Yêu cầu</p>'
      + ['a) Bảo đảm tính trọng tâm, khả thi, hiệu quả, phù hợp với điều kiện thực tế;',
         'b) Không xây dựng kế hoạch cải tiến đối với toàn bộ tiêu chí mà tập trung vào các vấn đề ưu tiên;',
         'c) Xác định rõ: nội dung, mục tiêu, biện pháp, thời gian, nguồn lực, trách nhiệm và kết quả;',
         'd) Gắn với kế hoạch năm học và kế hoạch phát triển của cơ sở giáo dục;',
         'đ) Có cơ chế theo dõi, đánh giá và điều chỉnh trong quá trình thực hiện.']
        .map(x => '<p style="' + P + '">' + x + '</p>').join('');

    h += '<p style="' + MUC + '">IV. TÓM TẮT CÁC VẤN ĐỀ TRỌNG TÂM CẦN CẢI TIẾN</p>'
      + '<table style="width:100%;border-collapse:collapse"><thead><tr>'
      + ['TT', 'Tiêu chuẩn', 'Tiêu chí liên quan (nếu có)', 'Đánh giá hiện trạng',
         'Điểm hạn chế', 'Nguyên nhân của hạn chế']
        .map(x => '<td style="' + OT + '">' + x + '</td>').join('') + '</tr></thead><tbody>'
      + (KH_VD.length ? KH_VD.map(function (r, i) {
          return '<tr><td style="' + O + 'text-align:center">' + (i + 1) + '</td>'
            + '<td style="' + O + 'text-align:center">' + chan(r.tieu_chuan || '') + '</td>'
            + '<td style="' + O + 'text-align:center">' + chan(r.tieu_chi_ma || '') + '</td>'
            + '<td style="' + O + '">' + chan(r.hien_trang || '') + '</td>'
            + '<td style="' + O + '">' + chan(r.han_che || '') + '</td>'
            + '<td style="' + O + '">' + chan(r.nguyen_nhan || '') + '</td></tr>';
        }).join('')
        : '<tr><td colspan="6" style="' + O + 'text-align:center;font-style:italic">(chưa nhập)</td></tr>')
      + '</tbody></table>'
      + '<p style="' + TR + 'font-size:11pt;font-style:italic;margin:4pt 0 0">Lưu ý: Chỉ lựa chọn '
      + 'các vấn đề trọng tâm, có tác động trực tiếp đến chất lượng giáo dục để đưa vào kế hoạch cải tiến.</p>';

    h += '<p style="' + MUC + '">V. KẾ HOẠCH CẢI TIẾN CHẤT LƯỢNG</p>'
      + '<table style="width:100%;border-collapse:collapse"><thead><tr>'
      + ['TT (1)', 'Nội dung cải tiến (2)', 'Mục tiêu cải tiến (3)', 'Hoạt động/giải pháp (4)',
         'Chỉ số đánh giá kết quả (5)', 'Thời gian thực hiện (6)', 'Đơn vị/cá nhân phụ trách (7)',
         'Nguồn lực bảo đảm (8)', 'Thông tin, dữ liệu hoặc minh chứng dự kiến (9)',
         'Mức độ thực hiện (10)']
        .map(x => '<td style="' + OT + 'font-size:10pt">' + x + '</td>').join('') + '</tr></thead><tbody>'
      + (KH_V.length ? KH_V.map(function (r, i) {
          return '<tr>' + [i + 1, r.ten, r.muc_tieu, r.giai_phap, r.chi_so_ket_qua,
                           r.thoi_gian_thuc_hien, r.nguoi_phu_trach, r.nguon_luc,
                           r.minh_chung_du_kien, r.muc_do_thuc_hien]
            .map((x, k) => '<td style="' + O + 'font-size:10.5pt'
              + (k === 0 ? ';text-align:center' : '') + '">' + chan(x == null ? '' : x)
              + '</td>').join('') + '</tr>';
        }).join('')
        : '<tr><td colspan="10" style="' + O + 'text-align:center;font-style:italic">(chưa nhập)</td></tr>')
      + '</tbody></table>';

    h += '<p style="' + MUC + '">VI. THEO DÕI VÀ ĐÁNH GIÁ THỰC HIỆN (GIÁM SÁT NỘI BỘ)</p>'
      + '<table style="width:100%;border-collapse:collapse"><thead><tr>'
      + ['Thời điểm', 'Nội dung theo dõi', 'Kết quả thực hiện', 'Điều chỉnh (nếu có)', 'Người đánh giá']
        .map(x => '<td style="' + OT + '">' + x + '</td>').join('') + '</tr></thead><tbody>'
      + THOI_DIEM.map(function (td) {
          const r = KH_TD[td] || {};
          return '<tr><td style="' + O + '">' + td + '</td>'
            + ['noi_dung', 'ket_qua', 'dieu_chinh', 'nguoi_danh_gia']
              .map(f => '<td style="' + O + '">' + chan(r[f] || '') + '</td>').join('') + '</tr>';
        }).join('')
      + '</tbody></table>';

    h += '<p style="' + MUC + '">VII. TỔ CHỨC THỰC HIỆN</p>'
      + '<p style="' + TR + 'font-size:12pt;font-weight:bold;margin:5pt 0 2pt">1. Người đứng đầu cơ sở giáo dục</p>'
      + doan(KH_TT.tc_nguoi_dung_dau)
      + '<p style="' + TR + 'font-size:12pt;font-weight:bold;margin:5pt 0 2pt">2. Hội đồng tự đánh giá</p>'
      + doan(KH_TT.tc_hoi_dong)
      + '<p style="' + TR + 'font-size:12pt;font-weight:bold;margin:5pt 0 2pt">3. Các tổ chuyên môn và bộ phận liên quan</p>'
      + doan(KH_TT.tc_to_chuyen_mon);

    h += '<p style="' + MUC + '">VIII. CƠ CHẾ ĐÁNH GIÁ VÀ BÁO CÁO</p>'
      + ['a) Thực hiện rà soát, đánh giá tối thiểu 02 lần trong năm học;',
         'b) Kết quả thực hiện kế hoạch cải tiến là cơ sở để cập nhật báo cáo tự đánh giá và xây dựng kế hoạch cải tiến của năm học tiếp theo;',
         'c) Bảo đảm công khai, minh bạch và phục vụ trách nhiệm giải trình của cơ sở giáo dục./.']
        .map(x => '<p style="' + P + '">' + x + '</p>').join('');

    h += '<table style="width:100%;border-collapse:collapse;margin-top:18pt"><tr>'
      + '<td style="' + TR + 'width:50%;font-size:12pt;vertical-align:top;border:0">'
      + '<b><i>Nơi nhận:</i></b><br>' + chan(KH_TT.noi_nhan || '…').replace(/\n/g, '<br>') + '</td>'
      + '<td style="' + TR + 'text-align:center;font-size:13pt;border:0">'
      + '<b>HIỆU TRƯỞNG</b><br><i>(Ký, ghi rõ họ tên, đóng dấu)</i><br><br><br><br>'
      + (CAU_HINH.HIEU_TRUONG ? '<b>' + chan(CAU_HINH.HIEU_TRUONG) + '</b>' : '')
      + '</td></tr></table>';

    /* Biểu 2 để KHỔ NGANG: bảng mục V có 10 cột, khổ dọc 16,5cm thì mỗi cột còn
       1,6cm — chữ rơi xuống từng chữ một, in ra không đọc được. */
    const html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" '
      + 'xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">'
      + '<head><meta charset="utf-8"><title>Kế hoạch cải tiến chất lượng ' + chan(nh) + '</title>'
      + '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->'
      + '<style>@page{size:29.7cm 21cm;mso-page-orientation:landscape;margin:1.5cm 1.5cm 1.5cm 2cm}'
      + 'body{font-family:"Times New Roman",serif;font-size:12pt;line-height:1.45;color:#000}'
      + 'thead{display:table-header-group}tr{page-break-inside:avoid}</style>'
      + '</head><body>' + h + '</body></html>';

    const blob = new Blob(['﻿' + html], { type: 'application/msword' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ke-hoach-cai-tien-' + String(nh).replace(/\s/g, '') + '.doc';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);

    const trong = KH_V.filter(r => !String(r.muc_do_thuc_hien || '').trim()).length;
    bao('Đã tải Kế hoạch cải tiến theo Biểu 2 (khổ ngang). '
      + KH_VD.length + ' vấn đề trọng tâm, ' + KH_V.length + ' việc cải tiến'
      + (trong ? ', ' + trong + ' việc chưa ghi mức độ thực hiện' : '') + '.');
  }
  window.xuatBieu2 = xuatBieu2;


  /* ==========================================================================
     3. ĐIỀU KIỆN CÔNG NHẬN TRƯỜNG ĐẠT CHUẨN QUỐC GIA — Điều 16
     ========================================================================== */
  /* Nguyên văn khoản 1. Chép đúng để nhà trường đối chiếu, không diễn giải lại. */
  const DK16 = [
    ['a', 'Có ít nhất một khóa trẻ em hoàn thành chương trình giáo dục ở độ tuổi cao nhất mà '
        + 'trường tổ chức hoặc một khóa học sinh hoàn thành chương trình cấp học tương ứng; '
        + 'đối với trường phổ thông có nhiều cấp học, có ít nhất một khóa học sinh hoàn thành '
        + 'chương trình của cấp học cao nhất', 'nhap'],
    ['b', 'Có dữ liệu tự đánh giá, kết quả thực hiện kế hoạch cải tiến chất lượng và dữ liệu '
        + 'phục vụ theo dõi, cải tiến chất lượng của ít nhất 03 năm học liên tiếp trước thời '
        + 'điểm xem xét công nhận', 'dem'],
    ['c', 'Đạt mức thực hiện hoạt động bảo đảm chất lượng giáo dục theo quy định tại Thông tư này',
        'tinh'],
    ['d', 'Đáp ứng các yêu cầu về cơ sở vật chất, thiết bị dạy học, an toàn trường học và các '
        + 'điều kiện khác theo quy định của pháp luật đối với mức độ công nhận tương ứng', 'nhap']
  ];
  let CN = {}, CN_BANG = [], CN_MUC = null, CN_NAM = null;

  async function taiCN() {
    const s = sb(), nh = NAM();
    const [dk, bg, xm, dn] = await Promise.all([
      s.from('cnqg_tu_danh_gia').select('*').eq('nam_hoc', nh),
      s.from('cnqg_bang').select('*').order('ngay_ky', { ascending: false }),
      s.rpc('xep_muc_nha_truong', { p_nam_hoc: nh }),
      s.rpc('dem_nam_du_lieu', { p_nam_hoc: nh })
    ]);
    if (dk.error) throw dk.error;
    CN = {};
    (dk.data || []).forEach(r => { CN[r.ma_dk] = r; });
    CN_BANG = bg.error ? [] : (bg.data || []);
    CN_MUC = (!xm.error && xm.data && xm.data[0]) ? xm.data[0] : null;
    CN_NAM = (!dn.error && dn.data && dn.data[0]) ? dn.data[0] : null;
  }

  function veCN(hop) {
    const sua = laQuanTri();
    let h = '<div class="tt-canh"><b>Khoản 1 Điều 16:</b> trường được xem xét công nhận đạt '
      + 'chuẩn quốc gia khi đáp ứng <b>đồng thời</b> bốn yêu cầu dưới đây. Điều kiện b và c máy '
      + 'tự tính; a và d là kết luận chuyên môn, nhà trường tự đánh dấu.</div>';

    const dat = {};
    DK16.forEach(function (dk) {
      const ma = dk[0], vb = dk[1], loai = dk[2];
      let ok = null, chu = '';

      if (loai === 'dem') {
        const n = CN_NAM ? Number(CN_NAM.so_nam_lien_tiep) : 0;
        ok = n >= 3;
        chu = '<b>Máy đếm:</b> có <b>' + n + '</b> năm học liên tiếp đủ dữ liệu'
          + (ok ? ' — đạt yêu cầu 03 năm.' : ' — còn thiếu ' + (3 - n) + ' năm.')
          + (CN_NAM && CN_NAM.chi_tiet
              ? '<div class="tt-nho" style="white-space:pre-line;margin-top:4px">'
                + chan(CN_NAM.chi_tiet) + '</div>' : '');
      } else if (loai === 'tinh') {
        const kl = CN_MUC ? CN_MUC.ket_luan : '';
        ok = kl === 'Đạt Mức 1' || kl === 'Đạt Mức 2';
        chu = '<b>Máy tính từ kết quả tự đánh giá:</b> ' + chan(kl || 'chưa có dữ liệu')
          + (ok ? '.' : ' — chưa đạt mức thực hiện nào.');
      } else {
        const r = CN[ma] || {};
        ok = (r.dap_ung === true) ? true : (r.dap_ung === false ? false : null);
        chu = sua
          ? '<select class="tt-o" style="max-width:220px" data-dk="' + ma + '">'
            + '<option value=""' + (r.dap_ung == null ? ' selected' : '') + '>— chưa xét —</option>'
            + '<option value="1"' + (r.dap_ung === true ? ' selected' : '') + '>Đáp ứng</option>'
            + '<option value="0"' + (r.dap_ung === false ? ' selected' : '') + '>Chưa đáp ứng</option>'
            + '</select>'
            + '<input class="tt-o" style="margin-top:6px" data-dkgc="' + ma
            + '" value="' + chan(r.ghi_chu || '') + '" placeholder="Ghi chú, căn cứ">'
          : (r.dap_ung == null ? '<i>chưa xét</i>' : (r.dap_ung ? 'Đáp ứng' : 'Chưa đáp ứng'))
            + (r.ghi_chu ? '<div class="tt-nho">' + chan(r.ghi_chu) + '</div>' : '');
      }
      dat[ma] = ok;
      h += '<div class="tt-dk ' + (ok === null ? '' : ok ? 'ok' : 'khong') + '">'
        + '<b><span class="tt-den ' + (ok === null ? 'chua' : ok ? 'ok' : 'khong') + '"></span>'
        + ma + ')</b> <span class="vb">' + chan(vb) + '</span>' + chu + '</div>';
    });

    /* Kết luận theo khoản 2 Điều 16. Chỉ kết luận khi cả bốn điều kiện đã xét —
       còn một điều kiện "chưa xét" thì nói là chưa xét xong, KHÔNG nói chưa đủ:
       thiếu dữ liệu không phải kết luận xấu. */
    const chuaXet = Object.keys(dat).filter(k => dat[k] === null);
    const khong = Object.keys(dat).filter(k => dat[k] === false);
    let kl;
    if (chuaXet.length) {
      kl = '<div class="tt-canh vang"><b>Chưa xét xong.</b> Còn điều kiện '
        + chuaXet.join(', ') + ' chưa đánh dấu. Đánh dấu đủ bốn điều kiện mới kết luận được.</div>';
    } else if (khong.length) {
      kl = '<div class="tt-canh do"><b>Chưa đủ điều kiện xem xét công nhận</b> — vướng điều kiện '
        + khong.join(', ') + '.</div>';
    } else {
      const m = CN_MUC ? CN_MUC.ket_luan : '';
      kl = '<div class="tt-canh xanh"><b>Đáp ứng đồng thời bốn điều kiện của khoản 1 Điều 16.</b><br>'
        + 'Theo khoản 2: trường đạt <b>' + chan(m) + '</b> về mức thực hiện hoạt động bảo đảm '
        + 'chất lượng nên tương ứng <b>Mức độ ' + (m === 'Đạt Mức 2' ? '2' : '1')
        + '</b>. Quyền xem xét, công nhận thuộc Sở Giáo dục và Đào tạo (Điều 17).</div>';
    }
    h += kl;

    h += '<div class="tt-muc">Bằng công nhận hiện có'
      + (sua ? ' <button class="tt-nut" id="cnThem">➕ Thêm bằng</button>' : '') + '</div>';
    if (!CN_BANG.length) {
      h += '<div class="tt-nho">Chưa nhập bằng công nhận nào. Bằng cấp trước ngày 07/7/2026 vẫn '
        + 'có giá trị đến hết thời hạn ghi trên bằng (khoản 2 Điều 27).</div>';
    } else {
      h += '<div class="tbl-wrap"><table class="tt-bang"><thead><tr>'
        + '<th style="width:80px">Mức độ</th><th>Số quyết định</th><th style="width:110px">Ngày ký</th>'
        + '<th style="width:110px">Hết hạn</th><th style="width:110px">Còn lại</th>'
        + '<th>Cơ quan cấp</th><th style="width:56px"></th></tr></thead><tbody>';
      CN_BANG.forEach(function (b) {
        /* Khoản 2 Điều 19: "Bằng công nhận trường đạt chuẩn quốc gia có giá trị
           05 NĂM KỂ TỪ NGÀY KÝ QUYẾT ĐỊNH." Nên chưa nhập ngày hết hạn thì suy
           ra được, không phải để trống. Vẫn cho nhập tay và ưu tiên số nhập:
           khoản 2 Điều 27 bảo lưu bằng cấp trước 07/7/2026 "đến hết thời hạn
           GHI TRÊN BẰNG" — chữ trên bằng mới là căn cứ, không phải phép cộng. */
        let het = b.ngay_het_han, suyRa = false;
        if (!het && b.ngay_ky) {
          const d = new Date(b.ngay_ky);
          d.setFullYear(d.getFullYear() + 5);
          het = d.toISOString().slice(0, 10);
          suyRa = true;
        }
        let con = '—';
        if (het) {
          const sn = Math.ceil((new Date(het) - new Date()) / 86400000);
          con = sn >= 0 ? Math.floor(sn / 30) + ' tháng'
            : '<b style="color:#b91c1c">đã hết hạn ' + Math.floor(-sn / 30) + ' tháng</b>';
        }
        h += '<tr><td><b>Mức độ ' + chan(b.muc_do) + '</b></td>'
          + '<td>' + chan(b.so_quyet_dinh || '—') + '</td>'
          + '<td>' + chan(ngayVN(b.ngay_ky) || '—') + '</td>'
          + '<td>' + chan(ngayVN(het) || '—')
            + (suyRa ? '<div class="tt-nho">suy ra: ngày ký + 05 năm</div>' : '') + '</td>'
          + '<td>' + con + '</td>'
          + '<td>' + chan(b.co_quan_cap || '—') + '</td>'
          + '<td>' + (sua ? '<button class="tt-nut xoa" data-xoabg="' + b.id + '">🗑</button>' : '')
          + '</td></tr>';
      });
      h += '</tbody></table></div>';

      /* Khoản 4 Điều 19: trường đã đạt Mức độ 1 thì SAU ÍT NHẤT 02 NĂM kể từ
         ngày được công nhận, Sở MỚI CÓ THỂ xem xét Mức độ 2. Tính hộ số tháng
         còn lại, nhưng nói rõ đây là điều kiện thời gian tối thiểu chứ không
         phải quyền đương nhiên được nâng mức. */
      const md1 = CN_BANG.filter(b => b.muc_do === 1 && b.ngay_ky)
        .sort((a, b) => String(b.ngay_ky).localeCompare(String(a.ngay_ky)))[0];
      const daCo2 = CN_BANG.some(b => b.muc_do === 2);
      if (md1 && !daCo2) {
        const moc = new Date(md1.ngay_ky);
        moc.setFullYear(moc.getFullYear() + 2);
        const sn = Math.ceil((moc - new Date()) / 86400000);
        h += '<div class="tt-canh ' + (sn <= 0 ? 'xanh' : 'vang') + '" style="margin-top:10px">'
          + '<b>Về việc xét nâng lên Mức độ 2 (khoản 4 Điều 19):</b> '
          + (sn <= 0
              ? 'đã qua mốc 02 năm kể từ ngày công nhận Mức độ 1 (' + ngayVN(md1.ngay_ky)
                + '), đủ điều kiện thời gian.'
              : 'phải sau ít nhất 02 năm kể từ ngày công nhận Mức độ 1 ('
                + ngayVN(md1.ngay_ky) + ') — còn <b>' + Math.ceil(sn / 30) + '</b> tháng nữa.')
          + ' Sở Giáo dục và Đào tạo <b>có thể</b> tổ chức xem xét, không phải trường đương nhiên '
          + 'được nâng mức.</div>';
      }

      /* Khoản 1 Điều 20 — nói ra vì đây là rủi ro của trường ĐANG CÓ bằng, dễ bị
         quên hơn cả điều kiện xét công nhận. */
      h += '<div class="tt-canh do" style="margin-top:10px"><b>Khoản 1 Điều 20 — thu hồi:</b> '
        + 'quyết định công nhận bị thu hồi khi trường vi phạm pháp luật đến mức bị đình chỉ hoạt '
        + 'động giáo dục, hoặc <b>không còn đáp ứng yêu cầu theo mức độ đã được công nhận</b> mà '
        + 'không khắc phục, hoặc khắc phục không đạt trong thời hạn Sở Giáo dục và Đào tạo yêu cầu.'
        + '</div>';
    }

    hop.innerHTML = h;
    if (!sua) return;

    hop.querySelectorAll('[data-dk]').forEach(function (o) {
      o.addEventListener('change', () => luuDK(hop, o.dataset.dk));
    });
    hop.querySelectorAll('[data-dkgc]').forEach(function (o) {
      o.addEventListener('blur', () => luuDK(hop, o.dataset.dkgc));
    });
    const t = hop.querySelector('#cnThem');
    if (t) t.addEventListener('click', async function () {
      try {
        const r = await sb().from('cnqg_bang').insert({ muc_do: 1 }).select('id');
        if (r.error) throw r.error;
        await taiCN(); veCN(hop);
        bao('Đã thêm một dòng bằng công nhận — thầy cô sửa lại số quyết định và ngày.');
      } catch (e) { bao('Không thêm được: ' + (e.message || e)); }
    });
    hop.querySelectorAll('[data-xoabg]').forEach(function (b) {
      b.addEventListener('click', async function () {
        if (!await xacNhan('Xoá bằng công nhận này?', { nutOk: 'Xoá', nguyHiem: true })) return;
        const r = await sb().from('cnqg_bang').delete().eq('id', this.dataset.xoabg).select('id');
        if (r.error) { bao('Chưa xoá được: ' + r.error.message); return; }
        await taiCN(); veCN(hop);
      });
    });
  }

  async function luuDK(hop, ma) {
    const sel = hop.querySelector('[data-dk="' + ma + '"]');
    const gc = hop.querySelector('[data-dkgc="' + ma + '"]');
    const v = sel ? sel.value : '';
    try {
      await ghi('cnqg_tu_danh_gia', {
        nam_hoc: NAM(), ma_dk: ma,
        dap_ung: v === '' ? null : (v === '1'),
        ghi_chu: gc ? (gc.value.trim() || null) : null,
        cap_nhat_boi: window.NGUOI_DUNG ? window.NGUOI_DUNG.id : null
      }, 'nam_hoc,ma_dk');
      await taiCN(); veCN(hop);
    } catch (e) { bao('Không lưu được: ' + (e.message || e)); }
  }


  /* ==========================================================================
     ĐĂNG KÝ BA TAB
     ========================================================================== */
  function boc(tenViec, taiFn, veFn) {
    return async function (hop) {
      if (!laQuanTri()) {
        hop.innerHTML = '<div class="qt-trong">Chỉ quản trị và ban giám hiệu mới vào được '
          + tenViec + '.</div>';
        return;
      }
      hop.innerHTML = '<div class="qt-trong">Đang tải…</div>';
      try { await taiFn(); }
      catch (e) {
        hop.innerHTML = '<div class="tt-canh do"><b>Chưa đọc được dữ liệu.</b><br>'
          + 'Thường là chưa chạy tệp <code>sql/32-hoi-dong-cai-tien-chuan-qg.sql</code> '
          + 'trên Supabase.<br><span class="tt-nho">Chi tiết: ' + chan(e.message || e)
          + '</span></div>';
        return;
      }
      veFn(hop);
    };
  }

  /* Cho tệp xuất Word lấy đúng dữ liệu đang hiện trên màn hình, kể cả dòng vừa
     sửa. Đọc lại cơ sở dữ liệu ở tệp kia thì bản in có thể khác thứ thầy cô
     đang nhìn. */
  window.duLieuHoiDong = function () {
    return { nam_hoc: NAM(), hd: HD, tv: TV, tieuChi: DS_TIEU_CHI, tienDo: TIEN_DO };
  };

  window.qtTabPhu = window.qtTabPhu || [];
  window.qtTabPhu.push({ ma: 'hd', ten: 'Hội đồng TĐG', tt: 36,
    ve: boc('mục Hội đồng tự đánh giá', taiHD, veHD) });
  window.qtTabPhu.push({ ma: 'kh', ten: 'KH cải tiến (Biểu 2)', tt: 37,
    ve: boc('mục Kế hoạch cải tiến', taiKH, veKH) });
  window.qtTabPhu.push({ ma: 'cn', ten: 'Chuẩn quốc gia', tt: 38,
    ve: boc('mục Điều kiện chuẩn quốc gia', taiCN, veCN) });
})();
