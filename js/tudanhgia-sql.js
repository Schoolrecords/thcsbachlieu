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
  /* Bật khi cơ sở dữ liệu chưa có cột tu_danh_gia.ghi_chu (chưa chạy sql/35).
     Khi ấy ô Ghi chú của tab "Kết luận & Ghi chú" tự ẩn đi thay vì hiện ra rồi
     báo lỗi lúc thầy cô đã gõ xong cả đoạn. */
  let THIEU_GC = false;
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

  /* ---- Trạng thái của từng minh chứng ----
     Trước đây ô này chỉ ghi "Minh chứng (7)" — con số ấy đếm gộp cả minh chứng
     CHƯA CÓ trong kho, nên một tiêu chí trắng tay vẫn khoe bảy đầu minh chứng.
     Nay tách rõ ba trạng thái đúng cột trang_thai của bảng ho_so. */
  .ev-dem{display:flex;flex-wrap:wrap;gap:5px 14px;align-items:center;margin:7px 0 3px;
    font-size:12.6px;color:#5b6b85}
  .ev-dem i{font-style:normal;font-weight:700}
  .ev-dem .co{color:#15803d} .ev-dem .dang{color:#a16207} .ev-dem .chua{color:#b91c1c}
  .ev-tt{font-weight:700;margin-right:4px}
  .ev-tt.co{color:#15803d} .ev-tt.dang{color:#a16207} .ev-tt.chua{color:#b91c1c}
  .ev-pt{font-size:11.4px;color:#8a94a6;margin-left:5px}
  /* Chưa có tệp thật thì viền đứt — nhìn một cái là biết chỗ nào còn nợ */
  .ev.thieu{border-style:dashed;background:#fffdfd}

  /* Đếm nội hàm đã viết, hiện ngay trên dòng tiêu chí lúc còn đóng */
  .crit-nh{font-size:11.8px;font-weight:700;color:#5b6b85;background:#eef2f8;
    border-radius:999px;padding:3px 9px;white-space:nowrap;flex:none}
  .crit-nh.xong{background:#e8f7ee;color:#15803d}
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
           mục 4 có 05 cột, thiếu cột này là bảng không đúng mẫu.
           nguoi_phu_trach: bảng ho_so vẫn có sẵn cột này từ sql/01 nhưng màn hình
           tự đánh giá trước nay không lấy về, nên nhìn vào một tiêu chí thiếu
           minh chứng cũng không biết phải nhắc ai đi bổ sung. */
        sb.from('ho_so').select('ma, ten, tieu_chi, trang_thai, link_drive, ghi_chu, nguoi_phu_trach'),
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
      /* Dò cột ghi_chu từ chính dòng vừa đọc về (câu select lấy '*'). Bảng rỗng
         thì chưa kết luận được, cứ coi như có — lệnh ghi đầu tiên sẽ báo lỗi và
         luuGhiChuTC bắt lấy, nói rõ là thiếu sql/35. */
      THIEU_GC = !!(tdg.data && tdg.data.length) && !('ghi_chu' in tdg.data[0]);

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
      /* Phải xoá MỌI ô có số, không chỉ danh sách tiêu chí. Ô kdStats in đậm
         22px chính là dòng kết luận "Đạt Mức 2" của số minh hoạ, và nó nằm
         PHÍA TRÊN dải cảnh báo — con số nguy hiểm nhất lại là con số còn sót.

         Ba ô phải xoá thêm, mỗi ô một kiểu nguy hiểm riêng:
         · kdChiTiet  — cột phải còn nguyên nguyên văn, mức đã chấm và các ô
                        nhập của tiêu chí thuộc năm cũ.
         · kdBaoCao   — nguy hiểm nhất: đây là các ô textarea của Phần I và
                        Phần III còn giữ chữ của năm cũ, mà onblur của chúng
                        ghi upsert với nam_hoc = NĂM MỚI. Bấm vào một ô rồi bấm
                        ra ngoài là chép nguyên báo cáo năm cũ sang năm mới.
                        (Lỗi này có sẵn từ trước, không do lần sửa giao diện.) */
      TAI_HONG = true;
      ['kdStats', 'kdGiaiThich', 'kdDanhGiaChung', 'kdChiTiet', 'kdBaoCao'].forEach(id => {
        const x = document.getElementById(id);
        if (x) x.innerHTML = '';
      });
      /* Thẻ tiến độ nằm TRONG #kdStats nên đã bị xoá cùng ở trên — không cần
         xoá riêng. (Trước đây có một khối #kdTienDo đứng riêng, nay bỏ vì hàng
         thẻ đã ôm cả tiến độ.) */
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
  /* ------------------------------------------------------------------------
     XẾP HÀNG MỌI LỆNH GHI — chống hai lệnh chồng lên nhau

     Mọi lệnh ghi ở màn hình này đều lấy giá trị nền từ bộ nhớ đệm (TDG, HT_NH),
     mà bộ nhớ đệm chỉ được cập nhật SAU khi máy chủ trả lời. Hai lệnh phát ra
     trong cùng khoảng chờ sẽ cùng đọc một bản cũ và ghi đè lẫn nhau.

     Thao tác gây ra chuyện đó là thao tác THƯỜNG NGÀY, không phải hiếm: gõ dở
     một ô rồi bấm thẳng sang nút bên cạnh. Trình duyệt chạy onblur TRƯỚC onclick,
     nên lệnh của ô vừa gõ và lệnh của nút vừa bấm đi song song — lệnh nào về
     sau thì thắng, và thứ người dùng vừa làm lại là thứ bị mất.

     Xếp hàng thì lệnh sau chỉ bắt đầu khi lệnh trước đã cập nhật xong bộ nhớ
     đệm. Chậm hơn vài phần trăm giây, đổi lấy việc không bao giờ mất chữ.
     ------------------------------------------------------------------------ */
  let HANG_GHI = Promise.resolve();
  function xepHang(viec) {
    /* .then(viec, viec): lệnh trước hỏng thì lệnh sau VẪN chạy, không kéo cả
       hàng đợi chết theo. Lỗi của từng lệnh do nơi gọi tự bắt. */
    const p = HANG_GHI.then(viec, viec);
    HANG_GHI = p.catch(function () {});
    return p;
  }

  async function luu(maTC, thayDoi) {
    return xepHang(async function () {
      /* Đọc bộ nhớ đệm KHI ĐÃ TỚI LƯỢT, không đọc lúc xếp hàng — đọc sớm thì
         xếp hàng cũng vô nghĩa vì vẫn cầm bản cũ. */
      const cu = TDG[maTC] || {};
      const goc = {
        nam_hoc: NAM_HOC,
        tieu_chi_ma: maTC,
        dat_m1: cu.dat_m1 || false,
        dat_m2: cu.dat_m2 || false,
        hien_trang_m1: cu.hien_trang_m1 || null,
        hien_trang_m2: cu.hien_trang_m2 || null
      };
      if (!THIEU_GC) goc.ghi_chu = cu.ghi_chu || null;
      const ban = Object.assign(goc, thayDoi, {
        cap_nhat_boi: window.NGUOI_DUNG ? window.NGUOI_DUNG.id : null
      });

      let r = await sb.from('tu_danh_gia')
        .upsert(ban, { onConflict: 'nam_hoc,tieu_chi_ma' })
        .select().single();

      /* Chưa chạy sql/35 mà bảng đang rỗng thì không dò ra được cột ghi_chu,
         cờ THIEU_GC vẫn tắt và lệnh này bị từ chối. Không có chốt gỡ cờ ở đây
         thì hỏng cả việc chấm mức lẫn việc nhập hiện trạng, mà bảng cứ rỗng
         mãi nên tải lại bao nhiêu lần cũng vậy — bế tắc. Gỡ cờ rồi thử lại
         đúng một lần. */
      if (r.error && !THIEU_GC && /ghi_chu/.test(String(r.error.message || ''))) {
        THIEU_GC = true;
        delete ban.ghi_chu;
        r = await sb.from('tu_danh_gia')
          .upsert(ban, { onConflict: 'nam_hoc,tieu_chi_ma' })
          .select().single();
      }

      if (r.error) throw r.error;
      TDG[maTC] = r.data;
      return r.data;
    });
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
          onblur="luuHienTrang('${c.code}',${muc},this.value)">${chan(gt || '')}</textarea>
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

    /* Cập nhật luôn hai chỗ đếm khác cho khớp: huy hiệu "x/y ý" trên dòng tiêu
       chí và dòng tiến độ toàn trường. Cùng lối vá tại chỗ, KHÔNG vẽ lại màn
       hình — vẽ lại là huỷ ô textarea đang gõ dở, bộ gõ tiếng Việt mất phím. */
    const d = demNoiHamTC(code);
    const hh = document.querySelector('#kdList .crit-nh[data-ma="' + code + '"]');
    if (hh && d.tong) {
      hh.textContent = d.viet + '/' + d.tong + ' ý';
      /* Đổi cả câu chú giải, không riêng con số — bỏ sót thì di chuột lên huy
         hiệu "4/5 ý" vẫn đọc ra câu "…cho 3 trên 5 nội hàm" của lần vẽ trước. */
      hh.title = 'Đã viết mô tả hiện trạng cho ' + d.viet + ' trên ' + d.tong + ' nội hàm';
      hh.classList.toggle('xong', d.viet >= d.tong);
    }
    veTienDoNoiHam();
  }

  /* ========================================================================
     HAI CỘT — danh sách tiêu chí bên trái, tiêu chí đang chọn bên phải

     Lối cũ là 15 khối xếp dọc, bấm cái nào thì cái ấy xổ ra tại chỗ. Làm việc
     kiểu ấy thì mở tiêu chí 4.3 xong muốn quay lại 1.3 phải cuộn ngược cả màn
     hình. Nay danh sách đứng yên bên trái, nội dung đổi bên phải.

     Ba biến nhớ trạng thái, KHÔNG cất vào giao diện: vẽ lại màn hình sau mỗi
     lần chấm mức thì trạng thái nằm trong HTML sẽ mất sạch.
       TC_CHON  mã tiêu chí đang mở bên phải
       TAB_CT   'nd' nội dung · 'mc' minh chứng · 'kl' kết luận
       LOC      bộ lọc nhanh của cột trái
       DANG_SUA đang ở chế độ nhập (ẩn cột trái cho ô nhập giãn hết bề ngang)
     ======================================================================== */
  /* MO_HET mặc định BẬT: từ khi hai cột cao bằng nhau, cắt danh sách còn 7
     dòng chỉ để lại một khoảng trắng dưới đáy cột trái. Mở hết rồi cho danh
     sách tự cuộn trong cột thì hai khối khép đúng một đường. Nút "Thu gọn"
     vẫn còn cho ai muốn. */
  let TC_CHON = '', TAB_CT = 'nd', LOC = 'tat_ca', DANG_SUA = false, MO_HET = true;

  /* Số dòng hiện sẵn ở cột trái trước khi phải bấm "Xem tất cả". Bảy dòng vừa
     đúng chiều cao cột phải trên màn hình laptop, không phải cuộn cột trái. */
  const SO_DONG_GON = 7;

  /* Huy hiệu mức — dùng chung cho cột trái và đầu cột phải để hai chỗ không
     bao giờ nói khác nhau. */
  function huyHieu(self) {
    if (self >= 2) return '<span class="badge badge-m2">✓ Đạt Mức 2</span>';
    if (self >= 1) return '<span class="badge badge-m1">⊙ Đạt Mức 1</span>';
    return '<span class="badge badge-no">○ Chưa đạt Mức 1</span>';
  }

  /* Bốn bộ lọc của cột trái. Đếm từ TIEU_CHI thật, không gõ sẵn con số nào —
     bộ tiêu chí do sql/12 nạp, đổi bộ thì số tự đổi theo. */
  const BO_LOC = [
    ['tat_ca',  'Tất cả',       () => true],
    ['bat_buoc','Bắt buộc',     c => c.bb],
    ['chua_m2', 'Chưa đạt M2',  c => c.self < 2],
    ['da_m2',   'Đã đạt M2',    c => c.self >= 2]
  ];

  function locHienTai() {
    const b = BO_LOC.find(x => x[0] === LOC);
    return b ? b[2] : (() => true);
  }

  function veBoLoc(list) {
    const o = document.getElementById('kdLoc');
    if (!o) return;
    o.innerHTML = BO_LOC.map(([ma, ten, ham]) =>
      `<button class="${LOC === ma ? 'on' : ''}" onclick="kdDatLoc('${ma}')"
        >${ten} (${list.filter(ham).length})</button>`).join('');
  }

  window.kdDatLoc = function (ma) {
    LOC = ma;
    renderKdcl();
  };

  /* Bấm một dòng ở cột trái. Đổi tiêu chí thì trả tab về "Nội dung" — giữ
     nguyên tab "Kết luận" của tiêu chí trước thì mở tiêu chí mới ra là thấy
     ngay ô chấm mức mà chưa kịp đọc yêu cầu. */
  window.kdChon = function (ma) {
    TC_CHON = ma;
    TAB_CT = 'nd';
    DANG_SUA = false;
    renderKdcl();
    /* Trên màn hẹp hai cột xếp chồng, cột phải nằm dưới màn hình — cuộn tới
       cho thầy cô thấy, không thì bấm xong tưởng máy không phản ứng. */
    if (window.innerWidth < 1000) {
      const o = document.getElementById('kdChiTiet');
      if (o) o.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  window.kdDoiTab = function (t) { TAB_CT = t; veChiTiet(); };

  window.kdSua = function (bat) {
    DANG_SUA = !!bat;
    const lam = document.getElementById('kdLam');
    if (lam) lam.classList.toggle('rong', DANG_SUA);
    veChiTiet();
    if (!DANG_SUA) {
      const o = document.getElementById('kdLam');
      if (o) o.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  function veDanhSachTieuChi(list) {
    veBoLoc(list);
    const soTC = document.getElementById('kdSoTC');
    const ham = locHienTai();
    const ds = list.filter(ham);
    if (soTC) {
      const oStd = document.getElementById('kdStd');
      soTC.textContent = (oStd && oStd.value)
        ? '(Tiêu chuẩn ' + oStd.value + ')' : '(4 tiêu chuẩn)';
    }

    /* Tiêu chí đang chọn mà rơi khỏi bộ lọc thì chọn lại dòng đầu — để nguyên
       thì cột phải hiện một tiêu chí không còn nằm trong danh sách bên trái,
       nhìn như máy hỏng. */
    if (!ds.some(c => c.code === TC_CHON)) TC_CHON = ds.length ? ds[0].code : '';

    const o = document.getElementById('kdList');
    if (!o) return;
    if (!ds.length) {
      o.innerHTML = '<div class="kd-trong">Không có tiêu chí nào hợp với bộ lọc đang chọn.</div>';
      return;
    }

    /* Cắt bớt cho cột trái vừa tầm mắt. Tiêu chí đang chọn mà nằm ngoài phần
       cắt thì mở hết ra — giấu đúng dòng đang làm việc là lỗi khó chịu nhất. */
    const iChon = ds.findIndex(c => c.code === TC_CHON);
    const moHet = MO_HET || ds.length <= SO_DONG_GON || iChon >= SO_DONG_GON;
    const hien = moHet ? ds : ds.slice(0, SO_DONG_GON);
    const con = ds.length - hien.length;

    o.innerHTML = hien.map(c => {
      const nh = demNoiHamTC(c.code);
      return `<button class="tc-hang${c.code === TC_CHON ? ' chon' : ''}" onclick="kdChon('${chan(c.code)}')">
        <span class="ma">${chan(c.code)}</span>
        <span class="ten">${chan(c.name)}${c.bb ? ' <span class="tc-bb">Bắt buộc</span>' : ''}</span>
        ${nh.tong ? `<span class="crit-nh${nh.viet >= nh.tong ? ' xong' : ''}" data-ma="${chan(c.code)}"
          title="Đã viết mô tả hiện trạng cho ${nh.viet} trên ${nh.tong} nội hàm">${nh.viet}/${nh.tong} ý</span>` : ''}
        ${huyHieu(c.self)}
      </button>`;
    }).join('')
      + (con > 0
        ? `<button class="tc-them" onclick="kdMoHet(true)">… và ${con} tiêu chí khác</button>`
        : (MO_HET && ds.length > SO_DONG_GON
          ? `<button class="tc-them" onclick="kdMoHet(false)">Thu gọn danh sách</button>` : ''));
  }

  window.kdMoHet = function (bat) { MO_HET = !!bat; renderKdcl(); };

  /* Một mức trong tab Nội dung: nguyên văn yêu cầu + nút chấm + ô nhập.
     Chế độ ĐỌC chỉ hiện nguyên văn và số ý đã viết; bấm "Chỉnh sửa" mới bung
     ô nhập ra — 11 nội hàm mỗi tiêu chí không viết vừa cột 55%. */
  function khoiMuc(c, muc) {
    const chamDuoc = coQuyenCham();
    const datM1 = c.self >= 1;
    const dat = muc === 1 ? datM1 : c.self >= 2;
    const khoa = muc === 2 && !datM1;
    const ds = NOI_HAM[c.code + '|' + muc] || [];
    const viet = ds.filter(n => String((HT_NH[n.id] || {}).hien_trang || '').trim()).length;

    /* Ô YÊU CẦU — nguyên văn Phụ lục II. Đây là thứ thầy cô phải đọc để viết
       cho đúng, nên để nền hổ phách cho nổi hẳn khỏi phần nhập. */
    const oYeuCau = `<div class="yc">
      <h5>🔖 Yêu cầu tiêu chí (Thông tư 57) — Mức ${muc}</h5>
      <p>${chan(muc === 1 ? c.m1 : c.m2)}</p>
      <div class="lv-pick">
        ${khoa
          ? `<span class="lv-hoi">Chỉ xem xét Mức 2 khi Mức 1 đã được xác định đạt (Biểu 1, Phụ lục V).</span>`
          : (chamDuoc
            ? `<span class="lv-hoi">Nhà trường tự đánh giá Mức ${muc}:</span>
               <button class="pick${dat ? ' on' : ''}" onclick="setMuc('${chan(c.code)}',${muc},true)">Đạt</button>
               <button class="pick${!dat ? ' on' : ''}" onclick="setMuc('${chan(c.code)}',${muc},false)">Không đạt</button>`
            : `<b style="font-size:13.5px;color:${dat ? '#0f7b52' : '#9b2c3a'}">${dat ? 'Đạt' : 'Không đạt'}</b>`)}
      </div>
    </div>`;

    if (khoa) return oYeuCau;

    /* Ô THỰC TRẠNG — đọc thì tóm tắt, bấm Chỉnh sửa thì bung ô nhập */
    let than;
    if (DANG_SUA || !ds.length) {
      than = oHienTrang(c, muc);
    } else if (viet) {
      than = '<div class="ct-tomtat">'
        + ds.filter(n => String((HT_NH[n.id] || {}).hien_trang || '').trim())
            .map(n => '<div>✓ ' + chan(cat(String(HT_NH[n.id].hien_trang), 160)) + '</div>').join('')
        + '</div>';
    } else {
      than = '<div class="goi">Chưa nhập nội dung nào cho mức này.</div>';
    }

    return oYeuCau + `<div class="tt-box">
      <div class="tt-dau">
        <b>Thực trạng &amp; kết quả thực hiện của nhà trường</b>
        ${ds.length ? `<span class="goi">đã viết ${viet}/${ds.length} nội hàm</span>` : ''}
        ${(chamDuoc && ds.length && !DANG_SUA)
          ? '<button class="ct-quaylai" onclick="kdSua(true)">✏ Chỉnh sửa</button>' : ''}
      </div>
      ${than}
    </div>`;
  }

  function veChiTiet() {
    const o = document.getElementById('kdChiTiet');
    if (!o) return;
    const c = TIEU_CHI.find(x => x.code === TC_CHON);
    if (!c) {
      o.innerHTML = '<div class="kd-trong">Chọn một tiêu chí ở danh sách bên trái để xem và nhập nội dung.</div>';
      return;
    }
    const mc = MC_THEO_TC[c.code] || [];
    const datM1 = c.self >= 1, datM2 = c.self >= 2;
    const chamDuoc = coQuyenCham();
    const nh = demNoiHamTC(c.code);
    const r = TDG[c.code] || {};

    const TABS = [['nd', 'Nội dung'], ['mc', 'Minh chứng'], ['kl', 'Kết luận &amp; Ghi chú']];
    const dTT = demTrangThai(mc);

    let than = '';
    if (TAB_CT === 'mc') {
      than = oMinhChung(mc);
    } else if (TAB_CT === 'kl') {
      /* Tab Kết luận CHỈ nhắc lại mức đã chấm và ghi nhận ai chấm, lúc nào.
         KHÔNG có ô "Điểm mạnh / Hạn chế / Định hướng cải tiến" ở đây: Thông tư
         57 đặt ba nội dung ấy ở cấp TIÊU CHUẨN (bảng danh_gia_tieu_chuan, Biểu
         1), còn kế hoạch cải tiến tách hẳn sang Biểu 2. Thêm vào đây là quay
         về bảng mẫu cũ và bản Word xuất ra sẽ sai Biểu 1. */
      than = `<div class="ct-kl">
        <div class="ct-kl-muc ${datM2 ? 'm2' : (datM1 ? 'm1' : 'no')}">
          Nhà trường tự đánh giá: <b>${datM2 ? 'Đạt Mức 2' : (datM1 ? 'Đạt Mức 1' : 'Không đạt Mức 1')}</b>
        </div>
        <div class="goi" style="margin-top:9px">
          ${r.cap_nhat_luc
            ? 'Lần chấm gần nhất: ' + chan(gioVN(r.cap_nhat_luc))
            : 'Chưa có lần chấm nào được ghi lại cho năm học này.'}
        </div>
        ${THIEU_GC ? '' : `
        <div class="tdg-ht" style="margin-top:15px">
          <label>Ghi chú làm việc của Hội đồng về tiêu chí này
            <span class="tdg-luu" id="luu-gc-${chan(c.code)}">✓ đã lưu</span></label>
          <textarea id="gc-${chan(c.code)}" ${chamDuoc ? '' : 'disabled'}
            placeholder="${chamDuoc
              ? 'Lý do chấm mức, nội dung hội đồng đã thống nhất, việc còn phải làm rõ…'
              : 'Chỉ ban giám hiệu và tổ trưởng nhập được nội dung này'}"
            onblur="luuGhiChuTC('${chan(c.code)}',this.value)">${chan(r.ghi_chu || '')}</textarea>
          <div class="goi">Ghi chú này <b>không in vào báo cáo tự đánh giá</b> — chỉ để hội đồng
            theo dõi công việc. Mô tả hiện trạng nằm ở tab Nội dung.</div>
        </div>`}
        <div class="ct-kl-nhac">
          Điểm mạnh, hạn chế và định hướng cải tiến được viết <b>một lần cho cả tiêu chuẩn</b>
          ở mục “Đánh giá chung về Tiêu chuẩn ${c.std}” bên dưới — chọn Tiêu chuẩn ${c.std}
          ở ô lọc trên thanh công cụ. Kế hoạch cải tiến nằm ở <b>Biểu 2</b>, mục riêng.
        </div>
      </div>`;
    } else {
      than = khoiMuc(c, 1) + khoiMuc(c, 2)
        + `<div class="mc-dong">
            <span class="ic">🛡</span>
            <span>Minh chứng: <b>${dTT.co}/${mc.length}</b> đã có trong kho${
              dTT.chua ? ' · <b style="color:#9b2c3a">' + dTT.chua + ' chưa có</b>' : ''}</span>
            <button class="ct-quaylai" onclick="kdDoiTab('mc')">📁 Xem minh chứng</button>
          </div>`;
    }

    /* Tiêu chí kế tiếp trong danh sách ĐANG LỌC, không phải trong cả 15 — bấm
       "Tiếp theo" khi đang lọc "Chưa đạt M2" mà nhảy sang tiêu chí đã đạt rồi
       thì mạch làm việc đứt. */
    const dsLoc = TIEU_CHI.filter(x => {
      const oStd2 = document.getElementById('kdStd');
      const f2 = oStd2 ? oStd2.value : '';
      return (!f2 || String(x.std) === f2) && locHienTai()(x);
    });
    const iNay = dsLoc.findIndex(x => x.code === c.code);
    const sau = iNay >= 0 && iNay < dsLoc.length - 1 ? dsLoc[iNay + 1] : null;

    o.innerHTML = `
      <div class="ct-dau">
        <span class="ct-ma">Tiêu chí ${chan(c.code)}</span>
        <span class="ct-ten">${chan(c.name)}</span>
        ${c.bb ? '<span class="tc-bb">Bắt buộc</span>' : ''}
      </div>
      <div class="ct-tab">
        ${TABS.map(([m, t]) => `<button class="${TAB_CT === m ? 'on' : ''}" onclick="kdDoiTab('${m}')">${t}</button>`).join('')}
        <span class="ct-tab-phai">${huyHieu(c.self)}</span>
      </div>
      ${DANG_SUA
        ? `<div class="ct-thanh"><button class="ct-quaylai" onclick="kdSua(false)">← Xong, về danh sách</button>
             <span class="goi">Đang ở chế độ nhập — ô nhập giãn hết bề ngang. Nội dung tự lưu khi rời ô.</span></div>`
        : ''}
      ${than}
      <div class="ct-day">
        <button class="ct-nut nhat" onclick="kdDoiTab('kl')">📝 Ghi chú</button>
        <button class="ct-nut ${nh.tong && nh.viet >= nh.tong ? 'xong' : 'cho'}"
          onclick="kdDoiTab('kl')">${nh.tong
            ? (nh.viet >= nh.tong ? '✓ Đã viết đủ nội dung' : 'Còn ' + (nh.tong - nh.viet) + ' ý chưa viết')
            : 'Chưa có danh mục nội hàm'}</button>
        ${sau
          ? `<button class="ct-nut chinh" onclick="kdChon('${chan(sau.code)}')">Tiếp theo: ${chan(sau.code)} →</button>`
          : `<button class="ct-nut chinh" disabled>Đã là tiêu chí cuối</button>`}
      </div>`;
  }

  /* Ngày giờ Việt Nam cho dòng "lần chấm gần nhất" */
  function gioVN(s) {
    const d = new Date(s);
    if (isNaN(d.getTime())) return '';
    const hai = n => (n < 10 ? '0' : '') + n;
    return hai(d.getDate()) + '/' + hai(d.getMonth() + 1) + '/' + d.getFullYear()
      + ' lúc ' + hai(d.getHours()) + ':' + hai(d.getMinutes());
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
    let no = 0;
    TIEU_CHI.forEach(c => { if (!(c.self >= 1)) no++; });

    veDanhSachTieuChi(list);
    veChiTiet();

    const kq = xepMucNhaTruong();
    const bbDat2 = TIEU_CHI.filter(c => c.bb && c.self >= 2).length;
    const soBB = TIEU_CHI.filter(c => c.bb).length || 8;
    /* Thẻ cuối: số 0 ở đây là chuyện MỪNG (không tiêu chí nào rớt Mức 1), để
       màu đỏ thì liếc qua tưởng đang cảnh báo. Đỏ chỉ khi thật sự có tiêu chí
       chưa đạt. */
    const dat2 = TIEU_CHI.filter(c => c.self >= 2).length;
    const td = soTienDo();
    document.getElementById('kdStats').innerHTML = `
      <div class="the navy">
        <span class="ic">🏫</span>
        <span class="noi">
          <span class="nhan" style="margin:0">Mức hiện tại</span>
          <span class="so">${kq.ketLuan}</span>
          <span class="them">${no ? no + ' tiêu chí chưa đạt Mức 1' : 'Không tiêu chí nào chưa đạt Mức 1'}</span>
        </span>
      </div>
      <div class="the xanh">
        <span class="ic">🔖</span>
        <span class="noi">
          <span class="so">${TIEU_CHI.length}</span>
          <span class="nhan">Tiêu chí</span>
          <span class="them">${dat2} tiêu chí đã đạt Mức 2</span>
        </span>
      </div>
      <div class="the vang">
        <span class="ic">⭐</span>
        <span class="noi">
          <span class="so">${soBB}</span>
          <span class="nhan">Tiêu chí bắt buộc</span>
          <span class="them">${bbDat2}/${soBB} đạt Mức 2</span>
        </span>
      </div>
      <div class="the la" id="kdTheTienDo">${theTienDo(td)}</div>`;

    document.getElementById('kdGiaiThich').innerHTML = kq.vi
      ? `<b>Vì sao xếp mức này:</b> ${kq.vi}`
      : `<b>Vì sao xếp mức này:</b> Toàn bộ ${soBB} tiêu chí bắt buộc đạt Mức 2, ${kq.clM2}/7 tiêu chí còn lại đạt Mức 2 và không có tiêu chí nào chưa đạt Mức 1.`;

    veDanhGiaChung(f);
    veThongTinBaoCao();
  };

  /* ========================================================================
     TIẾN ĐỘ VIẾT MÔ TẢ HIỆN TRẠNG — bức tranh CÔNG VIỆC

     Khác hẳn hàng thẻ phía trên: hàng thẻ nói nhà trường đang ở Mức mấy, dòng
     này nói việc soạn báo cáo đã đi được bao xa. Hai câu hỏi khác nhau, người
     ngồi nhập cần câu thứ hai mà trước nay không có chỗ nào trả lời.

     Đếm từ dữ liệu thật, không gõ sẵn con số nào: tổng nội hàm lấy từ bảng
     noi_ham, số đã viết lấy từ tdg_noi_ham của đúng năm học đang chọn.
     ======================================================================== */
  function soTienDo() {
    let tong = 0, viet = 0;
    TIEU_CHI.forEach(c => { const d = demNoiHamTC(c.code); tong += d.tong; viet += d.viet; });
    return { tong: tong, viet: viet, pt: tong ? Math.round(viet / tong * 100) : 0 };
  }

  /* Vòng tròn vẽ bằng conic-gradient, không cần thư viện đồ hoạ nào.
     Chưa chạy sql/30 (THIEU_NH) hoặc chưa có nội hàm nào thì KHÔNG bịa ra 0% —
     0% đọc ra là "chưa ai viết gì", trong khi sự thật là "màn hình đang chạy
     lối nhập cũ, chưa có gì để đếm". Nói thẳng là chưa đếm được. */
  function theTienDo(d) {
    if (THIEU_NH || !d.tong) {
      return `<span class="ic">✍️</span>
        <span class="noi"><span class="nhan" style="margin:0;font-weight:700;color:var(--ink);font-size:14px">Tiến độ</span>
          <span class="them">chưa đếm được</span>
          <span class="them">danh mục nội hàm chưa có</span></span>`;
    }
    return `<span class="vong" style="background:conic-gradient(#0f7b52 ${d.pt * 3.6}deg,#d7ebe0 0)">
        <span>${d.pt}%</span></span>
      <span class="noi">
        <span class="nhan" style="margin:0;font-weight:700;color:var(--ink);font-size:14px">Tiến độ</span>
        <span class="them">đã viết ${d.viet}/${d.tong} nội hàm</span>
        <span class="them">${d.viet < d.tong ? 'còn ' + (d.tong - d.viet) + ' ý chưa viết' : 'đã viết đủ mọi nội hàm'}</span>
      </span>`;
  }

  /* Cập nhật riêng thẻ tiến độ, không vẽ lại cả màn hình — gọi ngay sau mỗi
     lần lưu một nội hàm, mà lúc ấy con trỏ đang nằm trong ô bên cạnh. */
  function veTienDoNoiHam() {
    const o = document.getElementById('kdTheTienDo');
    if (o) o.innerHTML = theTienDo(soTienDo());
  }

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
      /* Đặt sau KHỐI HAI CỘT, không phải sau #kdList. Từ khi có bố cục hai
         cột, #kdList nằm trong cột trái — chèn cạnh nó thì phần Đánh giá chung
         của cả một tiêu chuẩn lọt vào cột danh sách rộng 45%. */
      const neo = document.getElementById('kdLam') || document.getElementById('kdList');
      if (!neo) return;
      neo.parentNode.insertBefore(hop, neo.nextSibling);
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
                >${chan(r[cot] || '')}</textarea>
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
     MINH CHỨNG CỦA MỘT TIÊU CHÍ — nói đúng trạng thái thật

     Cột trang_thai của bảng ho_so có ba giá trị: 'co' (đã có), 'dang' (đang
     làm), 'chua' (chưa có). Trước đây màn hình lấy cột này về rồi bỏ không
     dùng, chỉ in ra số đầu minh chứng. Đếm gộp như vậy là bày số dễ chịu:
     tiêu chí ghi "7 minh chứng" trong khi có thể 4 đã có, 3 chưa có gì —
     mà chấm mức thì phải dựa trên minh chứng CÓ THẬT.
     ======================================================================== */
  const TEN_TT = { co: 'đã có', dang: 'đang làm', chua: 'chưa có' };
  const DAU_TT = { co: '✓', dang: '◐', chua: '○' };

  function demTrangThai(mc) {
    const d = { co: 0, dang: 0, chua: 0 };
    mc.forEach(h => { const k = h.trang_thai; if (d[k] != null) d[k]++; else d.chua++; });
    return d;
  }

  function oMinhChung(mc) {
    if (!mc.length) {
      return `<div class="ev-box">
        <b>📎 Minh chứng trong kho Hồ sơ số</b>
        <div class="tdg-chuadu">Tiêu chí này chưa có minh chứng nào trong danh mục.
          Vào mục <b>Hồ sơ số</b> để gắn tiêu chí cho minh chứng tương ứng.</div>
      </div>`;
    }
    const d = demTrangThai(mc);
    /* Chỉ nêu nhóm có số — liệt kê "0 đang làm" chỉ tổ làm dòng đếm dài ra */
    const phan = ['co', 'dang', 'chua']
      .filter(k => d[k] > 0)
      .map(k => `<span class="${k}"><i>${d[k]}</i> ${TEN_TT[k]}</span>`)
      .join('');
    return `<div class="ev-box">
      <b>📎 Minh chứng trong kho Hồ sơ số (${mc.length})</b>
      <div class="ev-dem">${phan}</div>
      <div class="ev-list">
        ${mc.map(h => {
          const tt = TEN_TT[h.trang_thai] ? h.trang_thai : 'chua';
          const pt = String(h.nguoi_phu_trach || '').trim();
          return `<span class="ev ev-mc${tt === 'co' ? '' : ' thieu'}"
                title="${chan(h.ten)}${pt ? ' — phụ trách: ' + chan(pt) : ''} (${TEN_TT[tt]})"
                onclick="openDrive('${chan(h.ma)}','')"
                ><span class="ev-tt ${tt}">${DAU_TT[tt]}</span><b>${chan(h.ma)}</b> ${chan(cat(h.ten, 42))}${
                  pt ? `<span class="ev-pt">· ${chan(cat(pt, 20))}</span>` : ''}</span>`;
        }).join('')}
      </div>
      ${d.chua ? `<div class="tdg-chuadu">Còn <b>${d.chua}</b> minh chứng chưa có trong kho.
        Chấm mức cần dựa trên minh chứng có thật — vào mục <b>Hồ sơ số</b> để bổ sung.</div>` : ''}
    </div>`;
  }

  /* Đếm nội hàm đã viết của cả một tiêu chí (gộp cả hai mức) */
  function demNoiHamTC(code) {
    let tong = 0, viet = 0;
    [1, 2].forEach(m => {
      (NOI_HAM[code + '|' + m] || []).forEach(n => {
        tong++;
        if (String((HT_NH[n.id] || {}).hien_trang || '').trim()) viet++;
      });
    });
    return { tong: tong, viet: viet };
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

    /* Lối cũ nhớ xem những khối nào đang xổ ra rồi mở lại sau khi vẽ. Nay danh
       sách không xổ nữa nên chỉ cần giữ đúng tiêu chí đang chọn, tab đang xem
       và chế độ nhập — cả ba đều nằm trong biến, renderKdcl tự dựng lại. */
    try {
      const bg = await luu(code, thayDoi);
      c.self = bg.muc_dat || 0;
      renderKdcl();
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
     LƯU GHI CHÚ LÀM VIỆC CỦA MỘT TIÊU CHÍ — tab "Kết luận & Ghi chú"
     ======================================================================== */
  window.luuGhiChuTC = async function (code, giaTri) {
    if (!coQuyenCham()) return;
    const cu = String((TDG[code] || {}).ghi_chu || '');
    const moi = String(giaTri || '').trim();
    if (cu === moi) return;                     // không đổi thì khỏi ghi
    try {
      await luu(code, { ghi_chu: moi || null });
      nhayDaLuu('luu-gc-' + code);
    } catch (e) {
      console.error('[Tự đánh giá] Không lưu ghi chú:', e);
      /* Máy chủ báo thiếu cột thì nói thẳng nguyên nhân, đừng để thầy cô đoán */
      const s = String(e.message || e);
      if (/ghi_chu/.test(s) && /column|cột/i.test(s)) {
        THIEU_GC = true;
        veChiTiet();
        if (typeof notify === 'function') {
          notify('Cơ sở dữ liệu chưa có chỗ lưu ghi chú — cần chạy tệp sql/35 trên Supabase.');
        }
        return;
      }
      if (typeof notify === 'function') notify('Không lưu được ghi chú: ' + s);
    }
  };

  /* ========================================================================
     LƯU HIỆN TRẠNG VÀ MINH CHỨNG CỦA MỘT NỘI HÀM

     Cả hai việc ghi vào cùng một dòng (nam_hoc, noi_ham_id), nên luôn gửi ĐỦ
     hai cột: gửi thiếu một cột thì lệnh ghi đè xoá trắng cột kia — bấm chọn
     minh chứng là mất câu vừa viết.
     ======================================================================== */
  async function luuNH(id, thayDoi) {
    /* Xếp hàng như luu(). Ở đây còn cần hơn: chú thích của batMinhChung ngay
       dưới đã nói rõ thầy cô "thường bấm chọn minh chứng NGAY SAU khi gõ dở một
       câu ở ô bên cạnh" — đúng thao tác làm hai lệnh chạy song song và câu vừa
       gõ bị chính bản cũ ghi đè lên. */
    return xepHang(async function () {
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
    });
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
      /* Cùng lý do như kdDanhGiaChung: neo vào khối hai cột, không neo vào
         #kdList vốn đã nằm trong cột trái. */
      const truoc = document.getElementById('kdDanhGiaChung')
        || document.getElementById('kdLam') || document.getElementById('kdList');
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
  /* Hai lối tắt sang Hội đồng tự đánh giá và Kế hoạch cải tiến. Hai màn hình
     ấy ĐÃ CÓ SẴN trong Quản trị hệ thống (tệp tt57-hoidong-caitien-cnqg.js),
     chỉ là nằm khuất nên nhà trường không biết đường vào. Mở lối chứ không
     dựng màn hình thứ hai cho cùng một bảng — hai chỗ nhập một bảng thì sớm
     muộn cũng lệch nhau.

     Chỉ hiện với quản trị và ban giám hiệu, đúng như điều kiện mở bảng Quản
     trị hệ thống. Người khác bấm vào cũng chỉ mở ra bảng mà họ không có quyền
     đọc, tổ hiện một loạt dòng báo lỗi. */
  function hienNutQuanTri() {
    if (!laQuanTri()) return;
    ['kdNutHD', 'kdNutKH'].forEach(id => {
      const n = document.getElementById(id);
      if (n) n.style.display = '';
    });
  }

  document.addEventListener('dangnhap-xong', async () => {
    sb = window.sbClient;
    if (!sb) return;
    themChonNamHoc();
    hienNutQuanTri();
    await taiTuDanhGia();
  });
})();
