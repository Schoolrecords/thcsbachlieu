/* ============================================================================
   TỰ ĐÁNH GIÁ — ĐỌC VÀ GHI THẬT TỪ CƠ SỞ DỮ LIỆU

   Trước đây màn hình Tự đánh giá chạy bằng dữ liệu gõ sẵn trong trang: bấm
   chọn mức chỉ đổi trên trình duyệt, tắt trang là mất. Tệp này thay bằng
   dữ liệu thật trong Supabase và lưu lại mọi lựa chọn.

   Lấy về ba thứ:
     · tieu_chi     — nguyên văn Mức 1, Mức 2 theo Phụ lục II Thông tư 57
     · tu_danh_gia  — kết quả nhà trường đã chấm cho năm học đang chọn
     · ho_so        — minh chứng thật, lọc theo tiêu chí mà nó phục vụ

   Ghi lại khi:
     · Bấm Đạt / Không đạt cho từng mức
     · Nhập xong ô mô tả hiện trạng (lưu khi rời ô)

   Ai sửa được: quản trị hệ thống, ban giám hiệu và tổ trưởng — đúng như
   hàng rào bảo vệ đã đặt ở máy chủ cho bảng tu_danh_gia. Người khác vẫn
   xem được đầy đủ nhưng không bấm được.
   ============================================================================ */

(function () {
  'use strict';

  if (typeof CAU_HINH === 'undefined' || !CAU_HINH.DA_NOI) return;

  let sb = null;
  let NAM_HOC = (CAU_HINH.NAM_HOC || '2026-2027');
  let TDG = {};          // mã tiêu chí -> bản ghi tu_danh_gia
  let MC_THEO_TC = {};   // mã tiêu chí -> danh sách minh chứng
  let DGTC = {};         // số tiêu chuẩn -> bản ghi danh_gia_tieu_chuan
  let DANG_TAI = false;

  /* --- Ba thứ của tệp sql/30 ---
     NOI_HAM  'mã tiêu chí|mức' -> các nội hàm, tức TỪNG YÊU CẦU của mức đó,
              trích nguyên văn Phụ lục II.
     HT_NH    noi_ham_id -> hiện trạng và mã minh chứng của riêng nội hàm ấy.
     NH_CUA   noi_ham_id -> { code, muc }. Có để lúc lưu một nội hàm còn biết
              phải cập nhật lại ô đếm "đã viết mấy/mấy" của mức nào.
     BC       các mục văn xuôi của Biểu 1 (bối cảnh, quá trình TĐG, kiến nghị).

     Chưa chạy sql/30 thì THIEU_NH bật, màn hình quay về đúng lối cũ: một mức
     một ô văn xuôi. KHÔNG chặn màn hình — thầy cô vẫn chấm mức được như thường. */
  let NOI_HAM = {}, HT_NH = {}, NH_CUA = {}, BC = {};
  let THIEU_NH = false, THIEU_BC = false;
  /* Bật khi lần tải gần nhất hỏng — chặn renderKdcl vẽ lại số minh hoạ */
  let TAI_HONG = false;

  const TEN_TIEU_CHUAN = {
    1: 'Quản trị nhà trường và bảo đảm chất lượng',
    2: 'Phát triển đội ngũ',
    3: 'Thực hiện chương trình, đổi mới phương pháp giáo dục và phát triển người học',
    4: 'Điều kiện giáo dục, môi trường an toàn và phối hợp xã hội'
  };

  /* Bốn mục bắt buộc của phần "Đánh giá chung về Tiêu chuẩn" trong Biểu 1 */
  const MUC_DGTC = [
    ['diem_manh', '1. Điểm mạnh nổi bật của tiêu chuẩn',
     'Nêu những mặt làm tốt, có số liệu và mốc thời gian cụ thể.'],
    ['han_che_nguyen_nhan', '2. Điểm hạn chế trọng tâm và nguyên nhân cốt lõi',
     'Nêu hạn chế kèm nguyên nhân. Không có thì ghi rõ "Không có".'],
    ['xu_huong_3_nam', '3a. Xu hướng chất lượng trong 03 năm học liên tiếp',
     'Nội dung đã cải thiện, chưa cải thiện và biến động, so với hai năm học trước.'],
    ['van_de_uu_tien', '3b. Các vấn đề trọng tâm cần ưu tiên cải tiến',
     'Đây là căn cứ để lập Kế hoạch cải tiến chất lượng theo Biểu 2.']
  ];

  /* Các mục văn xuôi của Biểu 1 mà không suy ra được từ dữ liệu. Không có chỗ
     nhập thì bản Word in ra dấu "…" ở đúng những chỗ này — chính là chỗ báo cáo
     bị sơ lược. Cột trong bảng bao_cao_tdg của sql/30. */
  const NHOM_BC = [
    ['Phần I — Thông tin chung và bối cảnh', [
      ['nam_thanh_lap', 'đ) Năm thành lập', 'Theo quyết định thành lập trường.', 1],
      ['kt_xh', 'a) Điều kiện kinh tế - xã hội địa phương',
       'Nêu đặc điểm địa phương có ảnh hưởng tới việc học của học sinh.'],
      ['thuan_loi', 'b) Thuận lợi', ''],
      ['kho_khan', 'c) Khó khăn', ''],
      ['dac_diem_nguoi_hoc', 'd) Đặc điểm người học', '']
    ]],
    ['Phần I mục 4 — Quá trình thực hiện tự đánh giá', [
      ['lap_ke_hoach', 'a) Lập kế hoạch tự đánh giá',
       'Quyết định thành lập Hội đồng tự đánh giá và kế hoạch tự đánh giá.'],
      ['to_chuc_thuc_hien', 'b) Tổ chức thực hiện',
       'Phân công nhiệm vụ, thu thập minh chứng, rà soát hoạt động giáo dục.'],
      ['kiem_tra_phan_tich', 'c) Kiểm tra, phân tích',
       'Phân tích minh chứng, đối chiếu yêu cầu của tiêu chí, xác định mức đạt.'],
      ['tong_hop_xac_nhan', 'd) Tổng hợp và xác nhận kết quả tự đánh giá', '']
    ]],
    ['Phần III — Kết luận', [
      ['khai_quat', '1. Khái quát về mức độ đáp ứng tiêu chuẩn chất lượng giáo dục',
       'Mức đáp ứng chung, mức độ ổn định và tính bền vững của hệ thống bảo đảm chất lượng nội bộ.'],
      ['kn_so', '4a) Với Sở Giáo dục và Đào tạo Nghệ An', ''],
      ['kn_ubnd', '4b) Với Uỷ ban nhân dân xã', ''],
      ['kn_khac', '4c) Với tổ chức, cá nhân liên quan',
       'Không có thì để trống — báo cáo sẽ không in mục này.']
    ]]
  ];

  /* ========================================================================
     KIỂU DÁNG
     ======================================================================== */
  const css = `
  .tdg-ht{margin-top:11px}
  .tdg-ht label{display:block;font-size:12.2px;font-weight:600;color:var(--navy);
    margin-bottom:5px;letter-spacing:.02em}
  .tdg-ht textarea{width:100%;min-height:74px;padding:10px 12px;border:1.5px solid #d7dde8;
    border-radius:10px;font-size:14px;font-family:inherit;line-height:1.6;color:#1f2937;
    background:#fff;resize:vertical}
  .tdg-ht textarea:focus{outline:0;border-color:var(--navy-2)}
  .tdg-ht textarea:disabled{background:#f6f8fb;color:#5b6b85}
  .tdg-ht .goi{font-size:11.6px;color:#8a94a6;margin-top:5px;line-height:1.5}
  .tdg-luu{font-size:12px;color:#15803d;font-weight:600;margin-left:8px;opacity:0;transition:.3s}
  .tdg-luu.hien{opacity:1}
  .tdg-nam{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
  .tdg-nam label{font-size:13.2px;font-weight:600;color:var(--muted)}
  .ev-mc{display:inline-flex;align-items:center;gap:5px;cursor:pointer}
  .ev-mc b{color:var(--navy-2)}
  .tdg-chuadu{background:#fdf3f2;border:1px solid #f3c9c5;color:#8a3428;border-radius:9px;
    padding:9px 12px;font-size:13px;margin-top:10px;line-height:1.55}

  /* ---- Nhập hiện trạng theo TỪNG NỘI HÀM ---- */
  .nh-dem{font-size:12.4px;color:#64748b;margin:12px 0 2px}
  .nh-dem b{color:var(--navy)}
  .nh-o{border:1px solid #e2e8f2;border-left:3px solid #c7d5ee;border-radius:10px;
    padding:11px 13px;margin-top:9px;background:#fbfcfe}
  .nh-o.xong{border-left-color:#5eb884;background:#fafefb}
  .nh-so{display:inline-block;background:#eef4ff;color:#1d4ed8;font-size:11.2px;
    font-weight:700;padding:2px 8px;border-radius:6px}
  /* Nguyên văn yêu cầu của Thông tư — chữ nhỏ hơn ô nhập nhưng KHÔNG mờ:
     đây là thứ thầy cô phải đọc để viết đúng, không phải chú thích cho đẹp. */
  .nh-vb{font-size:13.2px;color:#3b4a63;line-height:1.62;margin:6px 0 8px}
  .nh-o textarea{width:100%;min-height:56px;padding:9px 11px;border:1.5px solid #d7dde8;
    border-radius:9px;font-size:13.8px;font-family:inherit;line-height:1.6;
    color:#1f2937;background:#fff;resize:vertical}
  .nh-o textarea:focus{outline:0;border-color:var(--navy-2)}
  .nh-o textarea:disabled{background:#f6f8fb;color:#5b6b85}
  .nh-mcs{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;align-items:center}
  .nh-mcs .nhan{font-size:11.6px;color:#8a94a6;margin-right:2px}
  .nh-mc{border:1px solid #cfd8e6;background:#fff;border-radius:999px;padding:4px 11px;
    font-size:12px;font-weight:600;color:#42526b;cursor:pointer;user-select:none}
  .nh-mc:hover{background:#eef4ff}
  .nh-mc.on{background:#14306b;color:#fff;border-color:#14306b}
  .nh-mc.khoa{cursor:default;opacity:.75}
  `;
  document.head.insertAdjacentHTML('beforeend', '<style>' + css + '</style>');

  /* Bọc mọi chuỗi trước khi nhét vào innerHTML. Câu lỗi của máy chủ có lúc
     lặp lại nguyên giá trị dữ liệu người dùng vừa gửi lên. */
  function chan(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function laQuanTri() {
    const u = window.NGUOI_DUNG;
    return !!u && ['admin', 'ban_giam_hieu'].includes(u.vai_tro);
  }
  /* Đúng theo chính sách tdg_sua đặt ở máy chủ */
  function coQuyenCham() {
    const u = window.NGUOI_DUNG;
    return !!u && (laQuanTri() || u.vai_tro === 'to_truong');
  }

  /* ========================================================================
     TẢI DỮ LIỆU
     ======================================================================== */
  async function taiTuDanhGia() {
    if (!sb || DANG_TAI) return;
    DANG_TAI = true;
    try {
      const [tc, tdg, hs, dgtc] = await Promise.all([
        sb.from('tieu_chi').select('*').order('so_tt'),
        sb.from('tu_danh_gia').select('*').eq('nam_hoc', NAM_HOC),
        /* ghi_chu để dành cho cột "Ghi chú" của danh mục minh chứng — Phụ lục IV
           mục 4 có 05 cột, thiếu cột này là bảng không đúng mẫu. */
        sb.from('ho_so').select('ma, ten, tieu_chi, trang_thai, link_drive, ghi_chu'),
        sb.from('danh_gia_tieu_chuan').select('*').eq('nam_hoc', NAM_HOC)
      ]);
      /* Soi lỗi CẢ BỐN câu hỏi. Trước đây chỉ soi câu đầu, nên khi máy chủ từ
         chối ba câu sau thì màn hình vẫn vẽ đủ 15 tiêu chí nhưng mọi mức đều
         trống — nhìn hệt như trường chưa tự đánh giá lần nào, và chấm lại là
         ghi đè lên kết quả cũ. */
      if (tc.error) throw tc.error;
      if (tdg.error) throw tdg.error;
      if (hs.error) throw hs.error;
      if (dgtc.error) throw dgtc.error;

      DGTC = {};
      (dgtc.data || []).forEach(r => { DGTC[r.tieu_chuan] = r; });
      if (!tc.data || !tc.data.length) {
        throw new Error('Cơ sở dữ liệu chưa có bộ tiêu chí. Kiểm tra đã chạy tệp sql/12 chưa.');
      }

      /* Ba bảng của tệp sql/30. Ba câu này KHÔNG được ném lỗi ra ngoài: chưa
         chạy sql/30 thì bảng chưa tồn tại, mà đó không phải cớ để che cả màn
         hình tự đánh giá đang dùng được. Lỗi ở đây chỉ có nghĩa "quay về lối
         nhập cũ". */
      const [nh, tnh, bc] = await Promise.all([
        sb.from('noi_ham').select('*'),
        sb.from('tdg_noi_ham').select('*').eq('nam_hoc', NAM_HOC),
        sb.from('bao_cao_tdg').select('*').eq('nam_hoc', NAM_HOC)
      ]);

      NOI_HAM = {}; NH_CUA = {};
      THIEU_NH = !!nh.error || !(nh.data && nh.data.length);
      if (!THIEU_NH) {
        nh.data.slice()
          .sort((a, b) => (a.muc - b.muc) || (a.so_tt - b.so_tt))
          .forEach(r => {
            const k = r.tieu_chi_ma + '|' + r.muc;
            (NOI_HAM[k] = NOI_HAM[k] || []).push(r);
            NH_CUA[r.id] = { code: r.tieu_chi_ma, muc: r.muc };
          });
      }
      HT_NH = {};
      if (!tnh.error) (tnh.data || []).forEach(r => { HT_NH[r.noi_ham_id] = r; });
      THIEU_BC = !!bc.error;
      BC = (!bc.error && bc.data && bc.data[0]) ? bc.data[0] : {};

      TDG = {};
      (tdg.data || []).forEach(r => { TDG[r.tieu_chi_ma] = r; });

      MC_THEO_TC = {};
      (hs.data || []).forEach(h => {
        (h.tieu_chi || []).forEach(ma => {
          (MC_THEO_TC[ma] = MC_THEO_TC[ma] || []).push(h);
        });
      });
      Object.keys(MC_THEO_TC).forEach(k =>
        MC_THEO_TC[k].sort((a, b) => String(a.ma).localeCompare(String(b.ma), 'vi')));

      /* Đọc được số thật rồi thì mở lại đường vẽ */
      TAI_HONG = false;
      /* TIEU_CHI khai báo bằng const nên thay từng phần tử, không gán đè */
      TIEU_CHI.length = 0;
      tc.data.forEach(t => {
        const r = TDG[t.ma];
        TIEU_CHI.push({
          code: t.ma,
          std: t.tieu_chuan,
          bb: !!t.bat_buoc,
          name: t.ten,
          m1: t.muc_1,
          m2: t.muc_2,
          self: r ? (r.muc_dat || 0) : 0,
          htM1: r ? (r.hien_trang_m1 || '') : '',
          htM2: r ? (r.hien_trang_m2 || '') : '',
          ev: (MC_THEO_TC[t.ma] || []).map(h => h.ma + '. ' + h.ten)
        });
      });

      /* 15 tiêu chí vừa hiện ra màn hình đã là bằng chứng tải xong — không
         báo việc bình thường, và đây cũng không phải kết quả của nút nào thầy
         cô vừa bấm. */
      renderKdcl();
    } catch (e) {
      console.error('[Tự đánh giá] Không tải được:', e);
      /* Phải CHE bảng mẫu đi, không chỉ báo một câu rồi thôi.
         index.html vẽ sẵn 15 tiêu chí với mức tự đánh giá minh hoạ ngay lúc
         mở trang. Tải hỏng mà để nguyên thì thầy cô ngồi nhìn kết quả tự
         đánh giá GIẢ hiện y như thật, kể cả dòng kết luận "Đạt Mức 2", còn
         câu báo lỗi thì đã tắt sau ba giây. */
      /* Phải xoá CẢ BA ô, không chỉ danh sách tiêu chí. Ô kdStats in đậm 22px
         chính là dòng kết luận "Đạt Mức 2" của số minh hoạ, và nó nằm PHÍA
         TRÊN dải cảnh báo — con số nguy hiểm nhất lại là con số còn sót. */
      TAI_HONG = true;
      ['kdStats', 'kdGiaiThich', 'kdDanhGiaChung'].forEach(id => {
        const x = document.getElementById(id);
        if (x) x.innerHTML = '';
      });
      const o = document.getElementById('kdList');
      if (o) {
        o.innerHTML = '<div style="background:#fdf3f2;border:1.5px solid #f3c9c5;'
          + 'border-left:5px solid #d05a4c;color:#8a3428;border-radius:12px;'
          + 'padding:15px 18px;font-size:15.4px;line-height:1.7">'
          + '<b>Chưa đọc được kết quả tự đánh giá của nhà trường.</b><br>'
          + 'Bảng tiêu chí và dòng kết luận đã được ẩn đi để thầy cô không đọc nhầm '
          + 'số minh hoạ thành số thật. Thầy cô đăng nhập lại rồi mở lại mục này. '
          + 'Nếu vẫn vậy thì báo quản trị.<br>'
          + '<span style="font-size:13.4px;color:#a0564a">Chi tiết: '
          + chan(e.message || e) + '</span></div>';
      }
      if (typeof notify === 'function') notify('Không tải được dữ liệu tự đánh giá.');
    } finally {
      DANG_TAI = false;
    }
  }

  /* ========================================================================
     GHI XUỐNG CƠ SỞ DỮ LIỆU
     ======================================================================== */
  async function luu(maTC, thayDoi) {
    const cu = TDG[maTC] || {};
    const ban = Object.assign({
      nam_hoc: NAM_HOC,
      tieu_chi_ma: maTC,
      dat_m1: cu.dat_m1 || false,
      dat_m2: cu.dat_m2 || false,
      hien_trang_m1: cu.hien_trang_m1 || null,
      hien_trang_m2: cu.hien_trang_m2 || null
    }, thayDoi, {
      cap_nhat_boi: window.NGUOI_DUNG ? window.NGUOI_DUNG.id : null
    });

    const { data, error } = await sb.from('tu_danh_gia')
      .upsert(ban, { onConflict: 'nam_hoc,tieu_chi_ma' })
      .select().single();

    if (error) throw error;
    TDG[maTC] = data;
    return data;
  }

  /* ========================================================================
     VẼ LẠI MÀN HÌNH — ghi đè hàm cùng tên trong index.html
     ======================================================================== */
  /* Lối nhập CŨ: một mức một ô văn xuôi. Chỉ dùng khi chưa chạy sql/30, hoặc
     tiêu chí đó vì lý do gì mà chưa có nội hàm nào trong danh mục. Giữ lại chứ
     không xoá: những gì thầy cô đã viết vào ô này vẫn còn, báo cáo vẫn in ra. */
  function oHienTrangVanXuoi(c, muc) {
    const chamDuoc = coQuyenCham();
    const gt = muc === 1 ? c.htM1 : c.htM2;
    const goi = muc === 1
      ? 'Mô tả nhà trường đã làm được gì so với yêu cầu của Mức 1, kèm mã minh chứng trong ngoặc — ví dụ (MC.1.1.01, MC.1.1.02).'
      : 'Mô tả phần vượt lên so với Mức 1: đã dùng dữ liệu, phản hồi để cải tiến ra sao, kết quả cải tiến thế nào.';
    return `
      <div class="tdg-ht">
        <label>Hiện trạng, kết quả đạt được của Mức ${muc}
          <span class="tdg-luu" id="luu-${c.code}-${muc}">✓ đã lưu</span></label>
        <textarea id="ht-${c.code}-${muc}" ${chamDuoc ? '' : 'disabled'}
          placeholder="${chamDuoc ? 'Nhập mô tả hiện trạng…' : 'Chỉ ban giám hiệu và tổ trưởng nhập được nội dung này'}"
          onblur="luuHienTrang('${c.code}',${muc},this.value)">${gt ? gt.replace(/</g, '&lt;') : ''}</textarea>
        <div class="goi">${goi}</div>
      </div>`;
  }

  /* Lối nhập theo NỘI HÀM — Biểu 1 Phụ lục V, Lưu ý 1:
       "Nội dung mô tả hiện trạng phải bám sát, thể hiện rõ mức đáp ứng TỪNG YÊU
        CẦU của từng mức đánh giá; sử dụng số liệu cụ thể và viện dẫn mã minh
        chứng tương ứng."
     Mỗi nội hàm một ô riêng, mã minh chứng chọn riêng cho từng ô. Nhờ vậy báo
     cáo ghép ra được câu có mã đặt đúng chỗ theo Phụ lục IV mục I.3 — thay vì
     dồn tất cả mã vào một dòng ở cuối tiêu chí, đọc không biết mã nào chứng
     cho ý nào. */
  function oHienTrang(c, muc) {
    const ds = NOI_HAM[c.code + '|' + muc] || [];
    if (!ds.length) return oHienTrangVanXuoi(c, muc);

    const chamDuoc = coQuyenCham();
    const mc = MC_THEO_TC[c.code] || [];
    const daViet = ds.filter(n => String((HT_NH[n.id] || {}).hien_trang || '').trim()).length;

    return `
      <div class="nh-khoi">
        <div class="nh-dem" id="nhdem-${c.code}-${muc}">Hiện trạng theo từng yêu cầu của Mức ${muc}
          — đã viết <b>${daViet}/${ds.length}</b> nội hàm</div>
        ${ds.map((n, i) => {
          const r = HT_NH[n.id] || {};
          const dang = r.ma_minh_chung || [];
          const xong = String(r.hien_trang || '').trim() ? ' xong' : '';
          return `
          <div class="nh-o${xong}" id="nho-${n.id}">
            <span class="nh-so">Nội hàm ${i + 1}/${ds.length}</span>
            <span class="tdg-luu" id="luunh-${n.id}">✓ đã lưu</span>
            <div class="nh-vb">${chan(n.noi_dung)}</div>
            <textarea id="nh-${n.id}" ${chamDuoc ? '' : 'disabled'}
              placeholder="${chamDuoc
                ? 'Nhà trường đã làm gì cho đúng yêu cầu này? Ghi số liệu cụ thể.'
                : 'Chỉ ban giám hiệu và tổ trưởng nhập được nội dung này'}"
              onblur="luuNoiHam(${n.id},this.value)">${chan(r.hien_trang || '')}</textarea>
            ${mc.length
              ? `<div class="nh-mcs"><span class="nhan">Minh chứng cho ý này:</span>
                  ${mc.map(h => `<span class="nh-mc${dang.indexOf(h.ma) >= 0 ? ' on' : ''}${chamDuoc ? '' : ' khoa'}"
                        title="${chan(h.ten)}"
                        ${chamDuoc ? `onclick="batMinhChung(${n.id},'${chan(h.ma)}',this)"` : ''}
                        >${chan(h.ma)}</span>`).join('')}
                </div>`
              : ''}
          </div>`;
        }).join('')}
      </div>`;
  }

  function nhayDaLuu(id) {
    const nhan = document.getElementById(id);
    if (!nhan) return;
    nhan.classList.add('hien');
    setTimeout(function () { nhan.classList.remove('hien'); }, 2200);
  }

  /* Cập nhật lại ô đếm "đã viết mấy/mấy" mà KHÔNG vẽ lại màn hình: vẽ lại là
     huỷ mọi thẻ textarea, con trỏ nhảy đi và bộ gõ tiếng Việt đang ghép dở thì
     mất phím — đúng lỗi đã phải vá ở tab danh mục hồ sơ. */
  function demLaiNoiHam(code, muc) {
    const ds = NOI_HAM[code + '|' + muc] || [];
    const o = document.getElementById('nhdem-' + code + '-' + muc);
    if (!o || !ds.length) return;
    const daViet = ds.filter(n => String((HT_NH[n.id] || {}).hien_trang || '').trim()).length;
    o.innerHTML = 'Hiện trạng theo từng yêu cầu của Mức ' + muc
      + ' — đã viết <b>' + daViet + '/' + ds.length + '</b> nội hàm';
  }

  window.renderKdcl = function () {
    /* Tải hỏng thì KHÔNG vẽ lại nữa. Thiếu chốt này thì hàng rào chỉ chặn
       được đúng một lần: sau khi hiện dải báo lỗi, thầy cô chỉ cần đổi ô lọc
       "Tiêu chuẩn" là ô kdStd gọi lại hàm này, bộ 15 tiêu chí minh hoạ gõ sẵn
       trong trang hiện lại nguyên vẹn kèm dòng kết luận "Đạt Mức 2", còn dải
       báo lỗi thì biến mất. */
    if (TAI_HONG) return;
    const oStd = document.getElementById('kdStd');
    const f = oStd ? oStd.value : '';
    const list = TIEU_CHI.filter(c => !f || String(c.std) === f);
    const chamDuoc = coQuyenCham();
    let no = 0;
    TIEU_CHI.forEach(c => { if (!(c.self >= 1)) no++; });

    document.getElementById('kdList').innerHTML = list.map(c => {
      const datM1 = c.self >= 1, datM2 = c.self >= 2;
      const mc = MC_THEO_TC[c.code] || [];
      return `
      <div class="crit">
        <button class="crit-head" onclick="this.parentNode.classList.toggle('open')">
          <span class="crit-code">${c.code}</span>
          <span class="crit-ttl">${c.name}${c.bb ? ' <span class="tc-bb">Bắt buộc</span>' : ''}</span>
          <span class="badge ${datM2 ? 'badge-m2' : (datM1 ? 'badge-m1' : 'badge-no')}">${datM2 ? 'Đạt Mức 2' : (datM1 ? 'Đạt Mức 1' : 'Không đạt Mức 1')}</span>
          <span class="sub-arrow">▶</span>
        </button>
        <div class="crit-body">
          <div class="lv">
            <span class="lv-tag">MỨC 1</span><p>${c.m1}</p>
            <div class="lv-pick">
              <span class="lv-hoi">Nhà trường tự đánh giá Mức 1:</span>
              ${chamDuoc
                ? `<button class="pick${datM1 ? ' on' : ''}" onclick="setMuc('${c.code}',1,true)">Đạt</button>
                   <button class="pick${!datM1 ? ' on' : ''}" onclick="setMuc('${c.code}',1,false)">Không đạt</button>`
                : `<b style="font-size:13.5px;color:${datM1 ? '#15803d' : '#b91c1c'}">${datM1 ? 'Đạt' : 'Không đạt'}</b>`}
            </div>
            ${oHienTrang(c, 1)}
          </div>
          <div class="lv${datM1 ? '' : ' lv-khoa'}">
            <span class="lv-tag m2">MỨC 2</span><p>${c.m2}</p>
            <div class="lv-pick">
              ${!datM1
                ? `<span class="lv-hoi">Chỉ xem xét Mức 2 khi Mức 1 đã được xác định đạt (Biểu 1, Phụ lục V).</span>`
                : (chamDuoc
                  ? `<span class="lv-hoi">Nhà trường tự đánh giá Mức 2:</span>
                     <button class="pick${datM2 ? ' on' : ''}" onclick="setMuc('${c.code}',2,true)">Đạt</button>
                     <button class="pick${!datM2 ? ' on' : ''}" onclick="setMuc('${c.code}',2,false)">Không đạt</button>`
                  : `<b style="font-size:13.5px;color:${datM2 ? '#15803d' : '#b91c1c'}">${datM2 ? 'Đạt' : 'Không đạt'}</b>`)}
            </div>
            ${datM1 ? oHienTrang(c, 2) : ''}
          </div>
          <div class="ev-box">
            <b>📎 Minh chứng trong kho Hồ sơ số (${mc.length})</b>
            ${mc.length ? `<div class="ev-list">
              ${mc.map(h => `<span class="ev ev-mc" title="${String(h.ten).replace(/"/g, '')}"
                    onclick="openDrive('${h.ma}','')"><b>${h.ma}</b> ${cat(h.ten, 46)}</span>`).join('')}
            </div>` : `<div class="tdg-chuadu">Tiêu chí này chưa có minh chứng nào trong danh mục.
              Vào mục <b>Hồ sơ số</b> để gắn tiêu chí cho minh chứng tương ứng.</div>`}
          </div>
        </div>
      </div>`;
    }).join('');

    const kq = xepMucNhaTruong();
    const bbDat2 = TIEU_CHI.filter(c => c.bb && c.self >= 2).length;
    const soBB = TIEU_CHI.filter(c => c.bb).length || 8;
    document.getElementById('kdStats').innerHTML = `
      <div class="stat"><b style="font-size:22px">${kq.ketLuan}</b><span>Mức thực hiện hoạt động đảm bảo chất lượng</span></div>
      <div class="stat ok"><b>${bbDat2}/${soBB}</b><span>tiêu chí bắt buộc đạt Mức 2</span><div class="prog"><i style="width:${Math.round(bbDat2 / soBB * 100)}%"></i></div></div>
      <div class="stat warn"><b>${kq.clM2}/7</b><span>tiêu chí còn lại đạt Mức 2 <i>(cần ≥ 5)</i></span></div>
      <div class="stat miss"><b>${no}</b><span>tiêu chí chưa đạt Mức 1</span></div>`;

    document.getElementById('kdGiaiThich').innerHTML = kq.vi
      ? `<b>Vì sao xếp mức này:</b> ${kq.vi}`
      : `<b>Vì sao xếp mức này:</b> Toàn bộ ${soBB} tiêu chí bắt buộc đạt Mức 2, ${kq.clM2}/7 tiêu chí còn lại đạt Mức 2 và không có tiêu chí nào chưa đạt Mức 1.`;

    veDanhGiaChung(f);
    veThongTinBaoCao();
  };

  /* ========================================================================
     ĐÁNH GIÁ CHUNG VỀ TIÊU CHUẨN — Biểu 1 bắt buộc có, viết một lần cho cả
     tiêu chuẩn chứ không viết ở từng tiêu chí như bảng mẫu cũ của trường.
     Chỉ hiện khi đang lọc theo một tiêu chuẩn, để màn hình khỏi quá dài.
     ======================================================================== */
  function veDanhGiaChung(soTC) {
    let hop = document.getElementById('kdDanhGiaChung');
    if (!hop) {
      hop = document.createElement('div');
      hop.id = 'kdDanhGiaChung';
      const ds = document.getElementById('kdList');
      ds.parentNode.insertBefore(hop, ds.nextSibling);
    }
    if (!soTC) {
      hop.innerHTML = `<div class="legal-note" style="margin-top:20px">
        <b>Đánh giá chung về tiêu chuẩn.</b> Biểu 1 Phụ lục V yêu cầu mỗi tiêu chuẩn có phần
        đánh giá chung gồm điểm mạnh, điểm hạn chế kèm nguyên nhân và định hướng cải tiến.
        Chọn một tiêu chuẩn ở ô lọc phía trên để nhập phần này.
        <br><br><i>Lưu ý: bảng mẫu cũ của nhà trường viết điểm mạnh, điểm yếu ở từng tiêu chí.
        Thông tư 57 chuyển nội dung đó lên cấp tiêu chuẩn, còn kế hoạch cải tiến tách hẳn
        sang Biểu 2 — đây là thay đổi của quy định, không phải phần mềm bỏ sót.</i>
      </div>`;
      return;
    }

    const so = parseInt(soTC, 10);
    const r = DGTC[so] || {};
    const chamDuoc = coQuyenCham();
    hop.innerHTML = `
      <div class="sub open" style="margin-top:22px">
        <div class="sub-head" style="cursor:default">
          <span class="fo">📝</span>
          <b>Đánh giá chung về Tiêu chuẩn ${so} — ${TEN_TIEU_CHUAN[so] || ''}</b>
        </div>
        <div class="sub-body" style="padding:18px 16px">
          ${MUC_DGTC.map(([cot, nhan, goi]) => `
            <div class="tdg-ht" style="margin-bottom:16px">
              <label>${nhan}
                <span class="tdg-luu" id="luu-dgtc-${so}-${cot}">✓ đã lưu</span></label>
              <textarea id="dgtc-${so}-${cot}" ${chamDuoc ? '' : 'disabled'}
                onblur="luuDanhGiaChung(${so},'${cot}',this.value)"
                placeholder="${chamDuoc ? 'Nhập nội dung…' : 'Chỉ ban giám hiệu và tổ trưởng nhập được'}"
                >${(r[cot] || '').replace(/</g, '&lt;')}</textarea>
              <div class="goi">${goi}</div>
            </div>`).join('')}
        </div>
      </div>`;
  }

  window.luuDanhGiaChung = async function (soTC, cot, giaTri) {
    if (!coQuyenCham()) return;
    const cu = DGTC[soTC] || {};
    const moi = String(giaTri || '').trim();
    if ((cu[cot] || '') === moi) return;

    const ban = {
      nam_hoc: NAM_HOC, tieu_chuan: soTC,
      diem_manh: cu.diem_manh || null,
      han_che_nguyen_nhan: cu.han_che_nguyen_nhan || null,
      xu_huong_3_nam: cu.xu_huong_3_nam || null,
      van_de_uu_tien: cu.van_de_uu_tien || null,
      cap_nhat_boi: window.NGUOI_DUNG ? window.NGUOI_DUNG.id : null
    };
    ban[cot] = moi || null;

    try {
      const { data, error } = await sb.from('danh_gia_tieu_chuan')
        .upsert(ban, { onConflict: 'nam_hoc,tieu_chuan' }).select().single();
      if (error) throw error;
      DGTC[soTC] = data;
      const nhan = document.getElementById('luu-dgtc-' + soTC + '-' + cot);
      if (nhan) {
        nhan.classList.add('hien');
        setTimeout(function () { nhan.classList.remove('hien'); }, 2200);
      }
    } catch (e) {
      console.error('[Đánh giá chung] Không lưu được:', e);
      if (typeof notify === 'function') notify('Không lưu được đánh giá chung: ' + (e.message || e));
    }
  };

  /* Cho tệp xuất báo cáo lấy dữ liệu đang có trên màn hình.

     noiHam + htNh là thứ tệp xuất dùng để ghép mô tả hiện trạng: mỗi nội hàm
     một đoạn, mã minh chứng đặt trong ngoặc tròn ở cuối đoạn đó. Trường nào
     chưa nhập theo nội hàm thì tệp xuất tự quay về htM1/htM2 như cũ. */
  window.duLieuTuDanhGia = function () {
    return {
      namHoc: NAM_HOC, tieuChi: TIEU_CHI, dgtc: DGTC, mcTheoTC: MC_THEO_TC, tdg: TDG,
      noiHam: NOI_HAM, htNh: HT_NH, bc: BC, thieuNoiHam: THIEU_NH
    };
  };

  function cat(s, n) {
    s = String(s || '');
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  }

  /* ========================================================================
     BẤM ĐẠT / KHÔNG ĐẠT — lưu thật, chấm tuần tự
     ======================================================================== */
  window.setMuc = async function (code, muc, dat) {
    const c = TIEU_CHI.find(x => x.code === code);
    if (!c) return;
    if (!coQuyenCham()) {
      if (typeof notify === 'function') notify('Chỉ ban giám hiệu và tổ trưởng mới chấm được mức tự đánh giá.');
      return;
    }

    /* Bỏ đạt Mức 1 thì Mức 2 cũng không còn — nguyên tắc tuần tự của Biểu 1 */
    const thayDoi = muc === 1
      ? { dat_m1: dat, dat_m2: dat ? (c.self >= 2) : false }
      : { dat_m1: true, dat_m2: dat };

    const mo = [...document.querySelectorAll('#kdList .crit')].map(e => e.classList.contains('open'));
    try {
      const bg = await luu(code, thayDoi);
      c.self = bg.muc_dat || 0;
      renderKdcl();
      [...document.querySelectorAll('#kdList .crit')].forEach((e, i) => { if (mo[i]) e.classList.add('open'); });
      if (typeof notify === 'function') {
        notify('Đã lưu: tiêu chí ' + code + ' — '
          + (bg.muc_dat === 2 ? 'Đạt Mức 2' : bg.muc_dat === 1 ? 'Đạt Mức 1' : 'Không đạt Mức 1')
          + '. Người chấm và thời điểm đã ghi vào nhật ký.');
      }
    } catch (e) {
      console.error('[Tự đánh giá] Không lưu được:', e);
      if (typeof notify === 'function') notify('Không lưu được: ' + (e.message || e));
    }
  };

  /* ========================================================================
     LƯU MÔ TẢ HIỆN TRẠNG — tự lưu khi rời ô
     ======================================================================== */
  window.luuHienTrang = async function (code, muc, giaTri) {
    const c = TIEU_CHI.find(x => x.code === code);
    if (!c || !coQuyenCham()) return;

    const cu = muc === 1 ? (c.htM1 || '') : (c.htM2 || '');
    const moi = String(giaTri || '').trim();
    if (cu === moi) return;                       // không đổi thì khỏi ghi

    try {
      const bg = await luu(code, muc === 1 ? { hien_trang_m1: moi || null }
                                           : { hien_trang_m2: moi || null });
      if (muc === 1) c.htM1 = moi; else c.htM2 = moi;
      const nhan = document.getElementById('luu-' + code + '-' + muc);
      if (nhan) {
        nhan.classList.add('hien');
        setTimeout(function () { nhan.classList.remove('hien'); }, 2200);
      }
      void bg;
    } catch (e) {
      console.error('[Tự đánh giá] Không lưu mô tả:', e);
      if (typeof notify === 'function') notify('Không lưu được mô tả hiện trạng: ' + (e.message || e));
    }
  };

  /* ========================================================================
     LƯU HIỆN TRẠNG VÀ MINH CHỨNG CỦA MỘT NỘI HÀM

     Cả hai việc ghi vào cùng một dòng (nam_hoc, noi_ham_id), nên luôn gửi ĐỦ
     hai cột: gửi thiếu một cột thì lệnh ghi đè xoá trắng cột kia — bấm chọn
     minh chứng là mất câu vừa viết.
     ======================================================================== */
  async function luuNH(id, thayDoi) {
    const cu = HT_NH[id] || {};
    const ban = Object.assign({
      nam_hoc: NAM_HOC,
      noi_ham_id: id,
      hien_trang: cu.hien_trang || null,
      ma_minh_chung: cu.ma_minh_chung || []
    }, thayDoi, {
      cap_nhat_boi: window.NGUOI_DUNG ? window.NGUOI_DUNG.id : null
    });
    const { data, error } = await sb.from('tdg_noi_ham')
      .upsert(ban, { onConflict: 'nam_hoc,noi_ham_id' }).select().single();
    if (error) throw error;
    HT_NH[id] = data;
    return data;
  }

  window.luuNoiHam = async function (id, giaTri) {
    if (!coQuyenCham()) return;
    const cu = String((HT_NH[id] || {}).hien_trang || '');
    const moi = String(giaTri || '').trim();
    if (cu === moi) return;                     // không đổi thì khỏi ghi
    try {
      await luuNH(id, { hien_trang: moi || null });
      nhayDaLuu('luunh-' + id);
      const o = document.getElementById('nho-' + id);
      if (o) o.classList.toggle('xong', !!moi);
      const v = NH_CUA[id];
      if (v) demLaiNoiHam(v.code, v.muc);
    } catch (e) {
      console.error('[Tự đánh giá] Không lưu nội hàm:', e);
      if (typeof notify === 'function') notify('Không lưu được hiện trạng: ' + (e.message || e));
    }
  };

  /* Bấm một mã là bật, bấm lại là tắt. Chỉ đổi lớp trên đúng cái chip vừa bấm,
     không vẽ lại khối — thầy cô thường bấm chọn minh chứng NGAY SAU khi gõ dở
     một câu ở ô bên cạnh. */
  window.batMinhChung = async function (id, ma, chip) {
    if (!coQuyenCham()) return;
    const cu = (HT_NH[id] || {}).ma_minh_chung || [];
    const ds = cu.slice();
    const i = ds.indexOf(ma);
    if (i >= 0) ds.splice(i, 1); else ds.push(ma);
    ds.sort((a, b) => String(a).localeCompare(String(b), 'vi'));
    try {
      await luuNH(id, { ma_minh_chung: ds });
      if (chip) chip.classList.toggle('on', i < 0);
      nhayDaLuu('luunh-' + id);
    } catch (e) {
      console.error('[Tự đánh giá] Không lưu minh chứng:', e);
      if (typeof notify === 'function') notify('Không lưu được minh chứng: ' + (e.message || e));
    }
  };

  /* ========================================================================
     CÁC MỤC VĂN XUÔI CỦA BÁO CÁO — Biểu 1 Phần I và Phần III
     ======================================================================== */
  function veThongTinBaoCao() {
    let hop = document.getElementById('kdBaoCao');
    if (!hop) {
      hop = document.createElement('div');
      hop.id = 'kdBaoCao';
      const truoc = document.getElementById('kdDanhGiaChung') || document.getElementById('kdList');
      if (!truoc) return;
      truoc.parentNode.insertBefore(hop, truoc.nextSibling);
    }
    if (THIEU_BC) {
      hop.innerHTML = '<div class="legal-note" style="margin-top:20px">'
        + '<b>Chưa chạy tệp <code>sql/30</code>.</b> Các mục Bối cảnh, Quá trình tự đánh giá, '
        + 'Khái quát và Đề xuất kiến nghị của Biểu 1 chưa có chỗ lưu, nên bản Word xuất ra '
        + 'sẽ để trống những mục đó.</div>';
      return;
    }
    const suaDuoc = laQuanTri();
    hop.innerHTML = `
      <div class="sub" style="margin-top:22px">
        <div class="sub-head" onclick="this.parentNode.classList.toggle('open')">
          <span class="fo">📄</span>
          <b>Các mục viết bằng lời của báo cáo (Phần I và Phần III)</b>
          <span class="sub-arrow">▶</span>
        </div>
        <div class="sub-body" style="padding:16px">
          ${NHOM_BC.map(([ten, oS]) => `
            <div style="margin-bottom:6px">
              <div style="font-size:13px;font-weight:700;color:var(--navy);margin:12px 0 2px">${ten}</div>
              ${oS.map(([cot, nhan, goi, motDong]) => `
                <div class="tdg-ht" style="margin-bottom:13px">
                  <label>${nhan}
                    <span class="tdg-luu" id="luu-bc-${cot}">✓ đã lưu</span></label>
                  <textarea id="bc-${cot}" ${suaDuoc ? '' : 'disabled'}
                    ${motDong ? 'style="min-height:0;height:44px"' : ''}
                    placeholder="${suaDuoc ? 'Nhập nội dung…' : 'Chỉ quản trị và ban giám hiệu nhập được'}"
                    onblur="luuBaoCao('${cot}',this.value)">${chan(BC[cot] || '')}</textarea>
                  ${goi ? `<div class="goi">${goi}</div>` : ''}
                </div>`).join('')}
            </div>`).join('')}
        </div>
      </div>`;
  }

  window.luuBaoCao = async function (cot, giaTri) {
    if (!laQuanTri()) return;
    const moi = String(giaTri || '').trim();
    if (String(BC[cot] || '') === moi) return;
    /* Gửi đủ mọi cột đang có, y như bảng đánh giá chung: gửi một cột thì lệnh
       ghi đè đặt các cột khác về mặc định, mất phần đã nhập từ trước. */
    const ban = { nam_hoc: NAM_HOC, cap_nhat_boi: window.NGUOI_DUNG ? window.NGUOI_DUNG.id : null };
    NHOM_BC.forEach(([, oS]) => oS.forEach(([c]) => { ban[c] = BC[c] || null; }));
    ban[cot] = moi || null;
    try {
      const { data, error } = await sb.from('bao_cao_tdg')
        .upsert(ban, { onConflict: 'nam_hoc' }).select().single();
      if (error) throw error;
      BC = data;
      nhayDaLuu('luu-bc-' + cot);
    } catch (e) {
      console.error('[Báo cáo TĐG] Không lưu được:', e);
      if (typeof notify === 'function') notify('Không lưu được: ' + (e.message || e));
    }
  };

  /* ========================================================================
     CHỌN NĂM HỌC
     ======================================================================== */
  function themChonNamHoc() {
    const tb = document.querySelector('#view-kdcl .toolbar');
    if (!tb || document.getElementById('kdNamHoc')) return;

    const hop = document.createElement('div');
    hop.className = 'tdg-nam';
    hop.innerHTML = '<label for="kdNamHoc">Năm học:</label>';

    const sel = document.createElement('select');
    sel.id = 'kdNamHoc';
    const nay = parseInt(String(NAM_HOC).slice(0, 4), 10) || 2026;
    for (let i = 1; i >= -3; i--) {
      const nh = (nay + i) + '-' + (nay + i + 1);
      const o = document.createElement('option');
      o.value = nh; o.textContent = nh;
      if (nh === NAM_HOC) o.selected = true;
      sel.appendChild(o);
    }
    sel.addEventListener('change', function () {
      NAM_HOC = this.value;
      taiTuDanhGia();
    });
    hop.appendChild(sel);
    tb.insertBefore(hop, tb.firstChild);
  }

  /* ========================================================================
     KHỞI ĐỘNG SAU KHI ĐĂNG NHẬP XONG
     ======================================================================== */
  document.addEventListener('dangnhap-xong', async () => {
    sb = window.sbClient;
    if (!sb) return;
    themChonNamHoc();
    await taiTuDanhGia();
  });
})();
