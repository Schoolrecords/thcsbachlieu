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
    if (!t) return;
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
    let maBang = null, namTep = null;
    hang.slice(0, 6).forEach(d => {
      const s = d.map(x => String(x).trim());
      const i = s.indexOf('Mã bảng');
      if (i >= 0 && s[i + 1]) maBang = s[i + 1];
      const j = s.indexOf('Năm học');
      if (j >= 0 && s[j + 1]) namTep = s[j + 1];
    });
    if (maBang && maBang !== t.loai) {
      const canh = 'Tệp này thuộc bảng "' + maBang + '" nhưng thầy cô đang mở bảng "'
        + t.loai + '" (Phụ lục ' + t.maPhuLuc + ').\n\nVẫn nạp vào bảng đang mở chứ?';
      if (!window.confirm(canh)) return;
    }
    if (namTep && namTep !== t.namHoc) {
      const canh = 'Tệp ghi năm học ' + namTep + ' nhưng thầy cô đang mở năm học '
        + t.namHoc + '.\n\nVẫn nạp vào năm học đang mở chứ?';
      if (!window.confirm(canh)) return;
    }

    /* Dò theo cột Mã, không theo vị trí dòng */
    const theoMa = {};
    t.chiTieu.forEach(ct => { theoMa[ct.ma] = ct; });

    const nguoi = window.NGUOI_DUNG ? window.NGUOI_DUNG.id : null;
    const luc = new Date().toISOString();
    const rows = [];
    const maDaGap = {};
    let boQua = 0, oCoSo = 0;

    hang.forEach(d => {
      const ma = String(d[0] == null ? '' : d[0]).trim().toUpperCase();
      const ct = theoMa[ma];
      if (!ct) { if (ma) boQua++; return; }
      if (maDaGap[ma]) { boQua++; return; }      // mã lặp thì chỉ lấy dòng đầu
      maDaGap[ma] = true;

      const doiSanh = String(d[3 + t.khoi.length] == null ? '' : d[3 + t.khoi.length]).trim();
      t.khoi.forEach((k, i) => {
        if (ct.chi_khoi_9 && k !== 9) return;
        let v = String(d[3 + i] == null ? '' : d[3 + i]).trim();
        if (v === '—' || v === '-') v = '';
        if (v) oCoSo++;
        rows.push({
          nam_hoc: t.namHoc, loai: t.loai, ky: t.ky, khoi: k, chi_tieu_ma: ct.ma,
          gia_tri: v || null,
          doi_sanh_tinh: (k === 9 && doiSanh) ? doiSanh : null,
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
      + 'Trong đó ' + oCoSo + ' ô có số liệu.\n'
      + '⚠ Toàn bộ ô của các chỉ tiêu này trong hệ thống sẽ bị GHI ĐÈ theo tệp, '
      + 'kể cả ô để trống trong tệp.\n\nThầy cô đồng ý chứ?';
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
