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
  function taiMau() {
    if (!coThuVien()) return;
    const t = trangThai();
    if (!t) {
      if (typeof notify === 'function')
        notify('Chưa tải được danh mục chỉ tiêu. Thầy cô đăng nhập và chờ bảng hiện lên.');
      return;
    }

    const hang = [];
    hang.push(['BIỂU MẪU NHẬP SỐ LIỆU — HỆ THỐNG HỒ SƠ SỐ THCS BẠCH LIÊU']);
    hang.push(['Phụ lục ' + t.maPhuLuc + ' — ' + t.tenPhuLuc]);
    hang.push(['Năm học', t.namHoc, 'Mã bảng', t.loai, 'Kỳ', t.ky]);
    hang.push([]);
    hang.push(['Hướng dẫn: chỉ sửa các cột Khối 6 đến Khối 9 và cột Đối sánh toàn tỉnh.']);
    hang.push(['Không được xoá hoặc sửa cột Mã — hệ thống dò theo cột này khi đọc tệp.']);
    hang.push(['Cách ghi: dạng số và tỉ lệ gõ "138/90.8" · dạng điểm gõ "8.86" · dạng đạt gõ "Đ" hoặc "CĐ".']);
    hang.push([]);
    hang.push(COT);

    t.chiTieu.forEach(ct => {
      const d = [ct.ma, ct.nhom, ct.ten];
      t.khoi.forEach(k => {
        if (ct.chi_khoi_9 && k !== 9) { d.push('—'); return; }
        const r = t.lay(k, ct.ma);
        d.push(r && r.gia_tri ? r.gia_tri : '');
      });
      const r9 = t.lay(9, ct.ma);
      d.push(r9 && r9.doi_sanh_tinh ? r9.doi_sanh_tinh : '');
      hang.push(d);
    });

    const ws = XLSX.utils.aoa_to_sheet(hang);
    ws['!cols'] = [{ wch: 8 }, { wch: 22 }, { wch: 46 },
                   { wch: 13 }, { wch: 13 }, { wch: 13 }, { wch: 13 }, { wch: 16 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Phu luc ' + t.maPhuLuc);
    XLSX.writeFile(wb, 'mau-nhap-phu-luc-' + t.maPhuLuc + '-' + khongDau(t.loai)
      + '-' + t.namHoc + '.xlsx');

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

    /* Đối chiếu bảng ghi ở dòng thứ ba của mẫu với bảng đang mở */
    let maBang = null, namTep = null, kyTep = null;
    hang.slice(0, 6).forEach(d => {
      const s = d.map(x => String(x).trim());
      const i = s.indexOf('Mã bảng');
      if (i >= 0 && s[i + 1]) maBang = s[i + 1];
      const j = s.indexOf('Năm học');
      if (j >= 0 && s[j + 1]) namTep = s[j + 1];
      const l = s.indexOf('Kỳ');
      if (l >= 0 && s[l + 1]) kyTep = s[l + 1];
    });
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

    /* DÒ CỘT THEO TÊN TRONG DÒNG TIÊU ĐỀ, không theo vị trí cứng.
       Chú thích đầu tệp vẫn nói "dò theo cột Mã" nhưng phần đọc lại lấy d[0],
       d[3+i] — nghĩa là chỉ đúng khi thầy cô không đụng gì tới cột. Chỉ cần
       chèn thêm một cột ghi chú ở giữa là toàn bộ số liệu lệch sang khối bên
       cạnh và ghi đè, mà không có dấu hiệu nào báo. */
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

    /* Dò theo cột Mã, không theo vị trí dòng */
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

    const hoi = 'Nạp ' + Object.keys(maDaGap).length + ' chỉ tiêu từ tệp "' + tep.name
      + '" vào bảng "' + t.tenBang + '" năm học ' + t.namHoc + '.\n\n'
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

  /* ---------------- Gắn vào trang ---------------- */
  window.dbclTaiMauExcel  = taiMau;
  window.dbclChonTepExcel = chonTep;

  function gan() {
    const inp = document.getElementById('dbclTepExcel');
    if (inp) inp.addEventListener('change', function () {
      if (this.files && this.files[0]) docTep(this.files[0]);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', gan);
  } else {
    gan();
  }
})();
