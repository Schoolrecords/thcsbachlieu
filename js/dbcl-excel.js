/* ============================================================================
   ĐẢM BẢO CHẤT LƯỢNG — TẢI MẪU EXCEL VÀ ĐỌC TỆP TẢI LÊN (Phương án 2)

   Vì sao cần: thầy cô quen Excel hơn quen gõ trên web, lại làm được khi không
   có mạng. Một người gom số liệu cả trường rồi nộp một tệp duy nhất.

   Mẫu tải xuống có 8 cột:
       Mã · Nhóm · Chỉ tiêu · Khối 6 · Khối 7 · Khối 8 · Khối 9 · Đối sánh tỉnh
   Số liệu đang có trong hệ thống được điền sẵn, thầy cô chỉ sửa chỗ cần.

   Khi đọc lên, hệ thống DÒ THEO CỘT MÃ chứ không theo vị trí dòng. Nhờ vậy
   thầy cô có chèn dòng, đổi thứ tự, thêm ghi chú thì vẫn đọc đúng. Dòng nào
   không có mã hợp lệ thì bỏ qua và báo lại số dòng đã bỏ.

   Ba dòng đầu tệp ghi năm học, tên phụ lục và mã bảng. Khi tải lên, nếu tệp
   thuộc bảng khác với bảng đang mở thì hỏi lại chứ không ghi đè lặng lẽ.

   HAI THƯ VIỆN, HAI VIỆC KHÁC NHAU — ĐỪNG GỘP LẠI
   Phần TẠO mẫu đi qua window.taoMauExcel (js/mau-excel.js, dựng bằng ExcelJS)
   để mẫu có khung viền, dòng tiêu đề nền navy đóng băng, khổ A4 ngang in được
   ngay. Bản trước dựng bằng xlsx bản miễn phí: thư viện đó KHÔNG viết được
   kiểu dáng nào cả — tệp tải về là một bảng chữ trần, không viền, không màu,
   in ra không biết đâu là tiêu đề. Phần ĐỌC tệp tải lên vẫn giữ nguyên xlsx.
   ============================================================================ */

(function () {
  'use strict';

  if (typeof CAU_HINH === 'undefined' || !CAU_HINH.DA_NOI) return;

  const COT = ['Mã', 'Nhóm', 'Chỉ tiêu', 'Khối 6', 'Khối 7', 'Khối 8', 'Khối 9',
               'Đối sánh toàn tỉnh'];

  function coThuVien() {
    if (typeof XLSX !== 'undefined') return true;
    if (typeof notify === 'function')
      notify('Chưa nạp được thư viện đọc Excel. Thầy cô kiểm tra kết nối mạng rồi tải lại trang.');
    return false;
  }

  /* Bộ tạo mẫu nằm ở tệp khác (js/mau-excel.js) và tệp đó lại phụ thuộc ExcelJS
     nạp từ CDN. Mạng trường chập một nhịp là window.taoMauExcel thành undefined,
     gọi thẳng vào thì bấm nút không có gì xảy ra ngoài một dòng đỏ trong console
     mà thầy cô không bao giờ mở tới. */
  function coBoTaoMau() {
    if (typeof window.taoMauExcel === 'function') return true;
    if (typeof notify === 'function')
      notify('Chưa nạp được bộ tạo mẫu Excel. Thầy cô kiểm tra kết nối mạng rồi tải lại trang.');
    return false;
  }
  function trangThai() {
    if (typeof window.dbclTrangThai !== 'function') return null;
    const t = window.dbclTrangThai();
    return (t && t.chiTieu && t.chiTieu.length) ? t : null;
  }
  function khongDau(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  /* ========================================================================
     TẢI MẪU XUỐNG
     ======================================================================== */
  /* Bề rộng cột và cách căn lề của mẫu. Tên cột PHẢI khớp từng chữ với hằng
     COT ở trên: phần đọc tệp dò cột theo tên trong dòng tiêu đề ("khối 6",
     "đối sánh"…), đổi một chữ là nạp lên lệch cột. */
  function dinhNghiaCot() {
    return COT.map(function (ten, i) {
      if (i === 0) return { ten: ten, rong: 9,  giua: true, chu: true };
      if (i === 1) return { ten: ten, rong: 22, xuongDong: true };
      if (i === 2) return { ten: ten, rong: 48, xuongDong: true };
      /* Các cột số ép định dạng Văn bản: ô ghi "138/90.8" hay "Đ" mà để Excel
         tự đoán kiểu thì nó bẻ thành ngày tháng hoặc phân số, nạp lên là sai. */
      return { ten: ten, rong: i === COT.length - 1 ? 17 : 13, giua: true, chu: true };
    });
  }

  async function taiMau() {
    if (!coBoTaoMau()) return;
    const t = trangThai();
    if (!t) {
      if (typeof notify === 'function')
        notify('Chưa tải được danh mục chỉ tiêu. Thầy cô đăng nhập và chờ bảng hiện lên.');
      return;
    }

    const dong = t.chiTieu.map(ct => {
      const d = [ct.ma, ct.nhom, ct.ten];
      t.khoi.forEach(k => {
        if (ct.chi_khoi_9 && k !== 9) { d.push('—'); return; }
        const r = t.lay(k, ct.ma);
        d.push(r && r.gia_tri ? r.gia_tri : '');
      });
      const r9 = t.lay(9, ct.ma);
      d.push(r9 && r9.doi_sanh_tinh ? r9.doi_sanh_tinh : '');
      return d;
    });

    /* Dòng thông số phải giữ nguyên từng ô RIÊNG theo đúng thứ tự
       nhãn - giá trị - nhãn - giá trị: phần đọc tệp tìm ô ghi đúng chữ
       "Mã bảng" rồi lấy ô ngay bên phải. Gộp ô hay đổi thứ tự là không dò
       được nữa, tệp nạp lên vào nhầm bảng mà không một lời cảnh báo. */
    const ok = await window.taoMauExcel({
      ten: 'Phụ lục ' + t.maPhuLuc,
      tieuDe: ['BIỂU MẪU NHẬP SỐ LIỆU — HỆ THỐNG HỒ SƠ SỐ THCS BẠCH LIÊU',
               'Phụ lục ' + t.maPhuLuc + ' — ' + t.tenPhuLuc],
      thongSo: ['Năm học', t.namHoc, 'Mã bảng', t.loai, 'Kỳ', t.ky],
      cot: dinhNghiaCot(),
      dong: dong,
      /* Tám cột, trong đó cột "Chỉ tiêu" là câu dài — khổ A4 ngang mới in đủ */
      ngang: true,
      huongDan: [
        'CÁCH ĐIỀN MẪU',
        'Chỉ sửa các cột Khối 6 đến Khối 9 và cột Đối sánh toàn tỉnh.',
        'Không được xoá hoặc sửa cột Mã — hệ thống dò theo cột này khi đọc tệp lên.',
        'Không xoá dòng tiêu đề của bảng và không xoá dòng ghi Năm học · Mã bảng · Kỳ.',
        'Thầy cô có thể chèn thêm dòng ghi chú hoặc đổi thứ tự dòng, hệ thống vẫn đọc đúng.',
        '',
        'CÁCH GHI GIÁ TRỊ',
        'Dạng số kèm tỉ lệ: gõ "138/90.8" (138 em, đạt 90,8%).',
        'Dạng điểm trung bình: gõ "8.86" — dùng dấu chấm, không dùng dấu phẩy.',
        'Dạng đạt / chưa đạt: gõ "Đ" hoặc "CĐ".',
        'Ô ghi dấu "—" là chỉ tiêu chỉ tính cho khối 9, thầy cô để nguyên.',
        '',
        'Điền xong thầy cô lưu tệp rồi bấm "Tải tệp Excel lên" ở màn hình Đảm bảo chất lượng.'
      ],
      tenTep: 'mau-nhap-phu-luc-' + t.maPhuLuc + '-' + khongDau(t.loai)
              + '-' + t.namHoc + '.xlsx'
    });
    if (!ok) return;               // taoMauExcel đã tự báo lý do rồi

    if (typeof notify === 'function') {
      notify('Đã tải mẫu Phụ lục ' + t.maPhuLuc + '. Điền xong thầy cô bấm '
        + '"Tải tệp Excel lên" để đưa số liệu vào hệ thống.');
    }
  }

  /* ========================================================================
     ĐỌC TỆP TẢI LÊN
     ======================================================================== */
  function chonTep() {
    if (!coThuVien()) return;
    const t = trangThai();
    /* Thầy cô vừa bấm một nút thì phải biết kết quả. Bản cũ lặng lẽ thoát,
       bấm nút xong không có gì xảy ra — nút bên cạnh thì lại có báo. */
    if (!t) {
      if (typeof notify === 'function')
        notify('Chưa tải được danh mục chỉ tiêu. Thầy cô đăng nhập và chờ bảng hiện lên.');
      return;
    }
    if (!t.coQuyen) {
      if (typeof notify === 'function')
        notify('Tài khoản của thầy cô chỉ xem, không nhập được số liệu này.');
      return;
    }
    const inp = document.getElementById('dbclTepExcel');
    if (!inp) return;
    inp.value = '';
    inp.click();
  }

  async function docTep(tep) {
    const t = trangThai();
    if (!t || !tep) return;

    let wb;
    try {
      const buf = await tep.arrayBuffer();
      wb = XLSX.read(buf, { type: 'array' });
    } catch (e) {
      notify('Không đọc được tệp: ' + e.message);
      return;
    }
    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws) { notify('Tệp không có trang tính nào.'); return; }
    const hang = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });

    /* DÒ DÒNG TIÊU ĐỀ TRƯỚC MỌI VIỆC KHÁC.
       Bản trước tìm ba ô thông số trong SÁU dòng đầu — một con số đặt cứng.
       Mà chính mẫu lại mời thầy cô "chèn thêm dòng ghi chú" ở đầu tệp: chèn
       bốn dòng là ba ô thông số rơi xuống dưới dòng thứ sáu, cả ba lớp đối
       chiếu Mã bảng · Năm học · Kỳ biến mất KHÔNG một lời nào, mà số liệu
       vẫn nạp. Tải mẫu lúc mở Học kì I rồi nạp lên lúc mở Cả năm học là ghi
       đè kỳ khác, đúng cái tai nạn mà ba lớp ấy sinh ra để chặn.
       Nay dò trong TOÀN BỘ phần nằm trên dòng tiêu đề, chèn bao nhiêu dòng
       cũng không mất; và mất marker thì NÓI RA chứ không im lặng. */
    let iTd = -1;
    for (let i = 0; i < Math.min(hang.length, 20); i++) {
      const d = (hang[i] || []).map(x => String(x).trim().toLowerCase());
      if (d.indexOf('mã') >= 0 && d.some(x => x.indexOf('chỉ tiêu') >= 0)) { iTd = i; break; }
    }
    if (iTd < 0) {
      notify('Không tìm thấy dòng tiêu đề có cột "Mã" và "Chỉ tiêu". '
        + 'Thầy cô dùng đúng mẫu do hệ thống tải xuống, đừng xoá dòng tiêu đề.');
      return;
    }
    const td = (hang[iTd] || []).map(x => String(x).trim().toLowerCase());
    const iMa = td.indexOf('mã');
    /* Cột từng khối tìm theo chữ "khối 6"… nên chèn cột ở giữa vẫn đúng */
    const iKhoi = t.khoi.map(k => td.findIndex(x => x === 'khối ' + k));
    const iDoiSanh = td.findIndex(x => x.indexOf('đối sánh') >= 0);

    const khoiThieu = t.khoi.filter((k, i) => iKhoi[i] < 0);
    if (khoiThieu.length === t.khoi.length) {
      notify('Không nhận ra cột khối nào trong tệp (cần các cột "Khối 6" đến "Khối 9"). '
        + 'Thầy cô dùng đúng mẫu do hệ thống tải xuống.');
      return;
    }

    /* Đối chiếu bảng · năm · kỳ ghi trong tệp với bảng đang mở trên màn hình */
    let maBang = null, namTep = null, kyTep = null;
    hang.slice(0, iTd).forEach(d => {
      const s = d.map(x => String(x).trim());
      const i = s.indexOf('Mã bảng');
      if (i >= 0 && s[i + 1]) maBang = s[i + 1];
      const j = s.indexOf('Năm học');
      if (j >= 0 && s[j + 1]) namTep = s[j + 1];
      const l = s.indexOf('Kỳ');
      if (l >= 0 && s[l + 1]) kyTep = s[l + 1];
    });
    /* Thiếu marker KHÔNG phải là hợp lệ — chỉ là hệ thống hết đường kiểm.
       Nói thẳng ra để thầy cô tự soát, đừng để im lặng thành ra bảo đảm. */
    const thieuMarker = [];
    if (!maBang) thieuMarker.push('Mã bảng');
    if (!namTep) thieuMarker.push('Năm học');
    if (!kyTep) thieuMarker.push('Kỳ');
    if (thieuMarker.length) {
      const canh = 'Tệp này không còn dòng ghi ' + thieuMarker.join(' · ')
        + ' nên hệ thống KHÔNG đối chiếu được.\n\n'
        + 'Thầy cô tự kiểm: số trong tệp có đúng là của bảng "' + t.tenBang
        + '", năm học ' + t.namHoc + ', ' + (t.ky === 'hoc_ki_1' ? 'Học kì I' : 'Cả năm học')
        + ' không?\n\nĐúng thì bấm OK để nạp tiếp.';
      if (!window.confirm(canh)) return;
    }
    if (maBang && maBang !== t.loai) {
      /* Hiện TÊN TIẾNG VIỆT, không hiện mã trong cơ sở dữ liệu. Bản cũ in ra
         câu "Tệp này thuộc bảng chuan_dau_ra nhưng thầy cô đang mở bảng
         ket_qua" — thầy cô không hiểu gì. */
      const ten = (t.tenTheoLoai && t.tenTheoLoai[maBang]) || maBang;
      const canh = 'Tệp này là bảng "' + ten + '" nhưng thầy cô đang mở bảng "'
        + t.tenBang + '" (Phụ lục ' + t.maPhuLuc + ').\n\nVẫn nạp vào bảng đang mở chứ?';
      if (!window.confirm(canh)) return;
    }
    if (namTep && namTep !== t.namHoc) {
      const canh = 'Tệp ghi năm học ' + namTep + ' nhưng thầy cô đang mở năm học '
        + t.namHoc + '.\n\nVẫn nạp vào năm học đang mở chứ?';
      if (!window.confirm(canh)) return;
    }
    /* Mẫu ghi cả ô Kỳ ở dòng 3 nhưng bản cũ không đối chiếu. Tải mẫu lúc đang
       chọn "Học kì I" rồi nạp lên lúc đang chọn "Cả năm học" là số vào nhầm
       kỳ, không một lời cảnh báo nào. */
    const TEN_KY = { ca_nam: 'Cả năm học', hoc_ki_1: 'Học kì I' };
    if (kyTep && kyTep !== t.ky) {
      const canh = 'Tệp này là số liệu ' + (TEN_KY[kyTep] || kyTep)
        + ' nhưng thầy cô đang mở ' + (TEN_KY[t.ky] || t.ky)
        + '.\n\nVẫn nạp vào kỳ đang mở chứ?';
      if (!window.confirm(canh)) return;
    }

    /* Dò theo cột Mã, không theo vị trí dòng.
       Cột từng khối dò theo TÊN trong dòng tiêu đề (đã làm ở trên), không
       theo vị trí cứng — chèn thêm một cột ghi chú ở giữa vẫn đúng khối. */
    const theoMa = {};
    t.chiTieu.forEach(ct => { theoMa[ct.ma] = ct; });

    const nguoi = window.NGUOI_DUNG ? window.NGUOI_DUNG.id : null;
    const luc = new Date().toISOString();
    const rows = [];
    const maDaGap = {};
    let boQua = 0, oCoSo = 0;

    hang.slice(iTd + 1).forEach(d => {
      const ma = String(d[iMa] == null ? '' : d[iMa]).trim().toUpperCase();
      const ct = theoMa[ma];
      if (!ct) { if (ma) boQua++; return; }
      if (maDaGap[ma]) { boQua++; return; }      // mã lặp thì chỉ lấy dòng đầu
      maDaGap[ma] = true;

      const doiSanh = iDoiSanh >= 0
        ? String(d[iDoiSanh] == null ? '' : d[iDoiSanh]).trim() : '';
      t.khoi.forEach((k, i) => {
        if (ct.chi_khoi_9 && k !== 9) return;
        if (iKhoi[i] < 0) return;                // tệp không có cột khối này thì để yên
        let v = String(d[iKhoi[i]] == null ? '' : d[iKhoi[i]]).trim();
        if (v === '—' || v === '-') v = '';
        if (v) oCoSo++;
        /* Cột "Đối sánh toàn tỉnh" là số Sở gửi về, chỉ có ý nghĩa ở dòng khối
           9. Trước đây mọi bản ghi đều kèm doi_sanh_tinh: null, nên nạp Excel
           một lần là xoá sạch số của Sở đang lưu — phải đi tra lại từ đầu.
           Nay tệp không ghi gì thì giữ nguyên giá trị cũ.

           Vẫn phải để KHOÁ NÀY TRONG MỌI BẢN GHI: máy chủ nhận cả mẻ một lúc
           và đòi mọi bản ghi có cùng bộ khoá, thiếu một khoá là từ chối cả mẻ. */
        const cu = t.lay(k, ct.ma);
        rows.push({
          nam_hoc: t.namHoc, loai: t.loai, ky: t.ky, khoi: k, chi_tieu_ma: ct.ma,
          gia_tri: v || null,
          doi_sanh_tinh: (k === 9 && doiSanh) ? doiSanh : ((cu && cu.doi_sanh_tinh) || null),
          cap_nhat_boi: nguoi, cap_nhat_luc: luc
        });
      });
    });

    if (!rows.length) {
      notify('Không tìm thấy dòng nào có mã chỉ tiêu hợp lệ (CT01 đến CT33). '
        + 'Thầy cô kiểm tra lại xem có xoá nhầm cột Mã không.');
      return;
    }

    /* Câu chốt phải nêu ĐỦ BA: bảng · kỳ · năm học. Bản trước thiếu KỲ, mà
       kỳ lại là thứ dễ nhầm nhất — hai kỳ dùng chung một mẫu, nhìn tệp không
       phân biệt được. Đây là lưới cuối cùng trước khi ghi đè. */
    const hoi = 'Nạp ' + Object.keys(maDaGap).length + ' chỉ tiêu từ tệp "' + tep.name
      + '" vào bảng "' + t.tenBang + '" — '
      + (t.ky === 'hoc_ki_1' ? 'Học kì I' : 'Cả năm học')
      + ' — năm học ' + t.namHoc + '.\n\n'
      + 'Tệp có ' + oCoSo + ' ô ghi số liệu.\n'
      + (khoiThieu.length
          ? '⚠ Tệp KHÔNG có cột của khối ' + khoiThieu.join(', ')
            + ' → số liệu các khối này giữ nguyên, không bị đụng tới.\n'
          : '')
      + (iDoiSanh < 0
          ? '⚠ Tệp không có cột "Đối sánh toàn tỉnh" → số của Sở giữ nguyên.\n'
          : (khoiThieu.indexOf(9) >= 0
              ? '⚠ Tệp có cột "Đối sánh toàn tỉnh" nhưng thiếu cột Khối 9 → '
                + 'số đối sánh trong tệp sẽ KHÔNG được ghi vào.\n'
              : ''))
      /* Câu chốt phải khớp với việc code thật sự làm. Trước đây nói "kể cả ô
         để trống" trong khi cột Đối sánh toàn tỉnh và các khối tệp không có
         đều được giữ nguyên — cùng một hộp thoại nói hai điều ngược nhau. */
      + '⚠ Ô của các chỉ tiêu này trong hệ thống sẽ bị GHI ĐÈ theo tệp, kể cả ô '
      + 'để trống trong tệp — trừ cột "Đối sánh toàn tỉnh" và những khối tệp không có.'
      + '\n\nThầy cô đồng ý chứ?';
    if (!window.confirm(hoi)) return;

    const kq = await window.dbclGhiHangLoat(rows);
    if (kq.loi) { notify('Chưa nạp được: ' + kq.loi); return; }
    notify('Đã nạp ' + kq.so + ' ô từ tệp Excel'
      + (boQua ? ', bỏ qua ' + boQua + ' dòng không có mã hợp lệ' : '') + '.');
  }

  /* ---------------- Gắn vào trang ----------------

     taiMau và docTep là hàm async. Chỗ gọi ở dbcl-sql.js:1025 và ở sự kiện
     chọn tệp bên dưới đều gọi mà KHÔNG await, KHÔNG catch — nghĩa là mọi lỗi
     ngoài phần đã bọc sẵn đều rơi thẳng vào khoảng không: thầy cô bấm nút,
     không có tệp tải về, mà cũng không một dòng chữ nào hiện ra, tưởng máy
     treo. Bọc ngay tại cửa ra để mọi chỗ gọi đều được che, không phải đi sửa
     từng nơi gọi và không sợ sót nơi nào. */
  function bocLoi(fn, viec) {
    return function () {
      const keu = e => {
        console.error('[Excel ĐBCL]', e);
        notify('Chưa ' + viec + ' được: ' + ((e && e.message) || e)
          + '. Thầy cô tải lại trang rồi thử lại.');
      };
      try {
        const r = fn.apply(this, arguments);
        if (r && typeof r.catch === 'function') r.catch(keu);
        return r;
      } catch (e) { keu(e); }
    };
  }

  window.dbclTaiMauExcel  = bocLoi(taiMau, 'tải mẫu Excel');
  window.dbclChonTepExcel = chonTep;

  function gan() {
    const inp = document.getElementById('dbclTepExcel');
    const doc = bocLoi(docTep, 'đọc tệp Excel');
    if (inp) inp.addEventListener('change', function () {
      if (this.files && this.files[0]) doc(this.files[0]);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', gan);
  } else {
    gan();
  }
})();
