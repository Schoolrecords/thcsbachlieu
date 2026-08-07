/* ============================================================================
   BỘ TẠO MẪU EXCEL DÙNG CHUNG

   Mọi mẫu tải xuống của hệ thống đi qua đây, nên trông giống nhau và in ra
   dùng được ngay: khổ A4 ngang, tiêu đề trường gộp giữa trang, dòng tiêu đề
   nền navy chữ trắng, khung viền đủ bảng với đường biên ngoài đậm hơn.

   BA ĐIỀU RÚT RA TỪ HAI MẪU ĐẦU TIÊN, ĐỪNG LÀM LẠI

   1. VIỀN NGOÀI PHẢI VẼ RIÊNG. Đặt viền 'thin' cho mọi ô thì hai mép trái
      phải của bảng nhìn như mất — Excel vẽ nét mảnh sát lề nên in ra không
      thấy. Phải chồng thêm viền 'medium' lên đúng các ô ở rìa.

   2. HƯỚNG DẪN ĐỂ RA TRANG TÍNH RIÊNG. Nhét tám dòng hướng dẫn xuống dưới
      bảng làm tờ in dài thêm một trang toàn chữ, mà thầy cô cũng không đọc.
      Trang "Hướng dẫn" riêng thì bảng chính sạch, in là dùng.

   3. THƯ VIỆN xlsx BẢN MIỄN PHÍ KHÔNG VIẾT ĐƯỢC KIỂU DÁNG. Không màu nền,
      không khung viền, không khổ giấy. Phải dùng ExcelJS cho phần TẠO mẫu;
      phần ĐỌC tệp tải lên vẫn dùng xlsx như cũ.
   ============================================================================ */

(function () {
  'use strict';

  const V = 'Times New Roman';
  const NAVY = 'FF14306B';

  function net(mau, kieu) {
    return { style: kieu || 'thin', color: { argb: mau || 'FF8FA0BE' } };
  }

  /* Viền đủ bốn cạnh cho một ô, cạnh nào nằm ở rìa bảng thì vẽ đậm hơn */
  function vienO(dauCot, cuoiCot, dauDong, cuoiDong, c, d) {
    const m = net('FF3A5488', 'medium');
    return {
      top:    d === dauDong  ? m : net(),
      bottom: d === cuoiDong ? m : net(),
      left:   c === dauCot   ? m : net(),
      right:  c === cuoiCot  ? m : net()
    };
  }

  /* opts:
       ten        tên trang tính chính
       tieuDe     [dòng 1, dòng 2, dòng 3…] gộp giữa trang
       cot        [{ ten, rong, giua?, xuongDong?, chon? }]
       dong       mảng mảng giá trị, đã đúng thứ tự cột
       soDongTrong  chừa thêm bao nhiêu dòng trống để điền tiếp
       huongDan   [dòng…] — đưa sang trang tính riêng
       ngang      true = khổ A4 nằm ngang
       tenTep     tên tệp tải về
  */
  async function taoMau(opts) {
    if (typeof ExcelJS === 'undefined') {
      if (typeof notify === 'function') {
        notify('Chưa nạp được thư viện tạo mẫu. Thầy cô kiểm tra mạng rồi tải lại trang.');
      }
      return false;
    }

    const cot = opts.cot || [];
    const soCot = cot.length;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(opts.ten || 'Mau', {
      pageSetup: {
        paperSize: 9,
        orientation: opts.ngang === false ? 'portrait' : 'landscape',
        fitToPage: true, fitToWidth: 1, fitToHeight: 0,
        margins: { left: .35, right: .35, top: .45, bottom: .45, header: .2, footer: .2 }
      }
    });
    ws.columns = cot.map(c => ({ width: c.rong || 14 }));
    /* Cột nào là CHUỖI SỐ thì ép định dạng Văn bản. Số định danh cá nhân của
       Nghệ An bắt đầu bằng 040 — để Excel hiểu là số thì nó nuốt mất số 0 đầu,
       còn 11 chữ số, ràng buộc ở máy chủ từ chối CẢ MẺ danh sách vì một ô. */
    cot.forEach((c, i) => { if (c.chu) ws.getColumn(i + 1).numFmt = '@'; });

    /* ---- Tiêu đề gộp giữa trang ---- */
    const tds = opts.tieuDe || [];
    tds.forEach((t, i) => {
      ws.mergeCells(i + 1, 1, i + 1, soCot);
      const o = ws.getCell(i + 1, 1);
      o.value = t;
      o.font = { name: V, size: i === 1 ? 15 : 12.5, bold: i <= 1, italic: i >= 2 };
      o.alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(i + 1).height = i === 1 ? 22 : 18;
    });

    /* ---- Dòng thông số: từng ô RIÊNG, không gộp ----
       Ví dụ ['Năm học', '2026-2027', 'Kỳ', 'Cả năm']. Phần đọc tệp dò giá trị
       bằng cách tìm ô ghi đúng chữ "Kỳ" rồi lấy ô ngay bên phải — gộp ô là
       không dò được nữa. */
    let dTs = 0;
    if (opts.thongSo && opts.thongSo.length) {
      dTs = tds.length + 1;
      const r = ws.getRow(dTs);
      (opts.thongSo).forEach((v, i) => {
        const o = r.getCell(i + 1);
        o.value = v;
        o.font = { name: V, size: 11.5, bold: i % 2 === 0 };
        o.alignment = { horizontal: i % 2 === 0 ? 'right' : 'left', vertical: 'middle' };
      });
      r.height = 19;
    }

    const dHd = tds.length + (dTs ? 2 : 1) + 1;  // chừa một dòng trống rồi tới tiêu đề bảng
    const dDau = dHd + 1;
    const soDong = (opts.dong || []).length + (opts.soDongTrong || 0);
    const dCuoi = dDau + Math.max(soDong, 1) - 1;

    /* ---- Dòng tiêu đề bảng ---- */
    const hd = ws.getRow(dHd);
    cot.forEach((c, i) => {
      const o = hd.getCell(i + 1);
      o.value = c.ten;
      o.font = { name: V, size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      o.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
      o.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      o.border = vienO(1, soCot, dHd, dCuoi, i + 1, dHd);
    });
    hd.height = 32;
    ws.views = [{ state: 'frozen', ySplit: dHd }];   // khoá dòng tiêu đề khi cuộn

    /* ---- Thân bảng ---- */
    for (let r = 0; r < Math.max(soDong, 1); r++) {
      const gt = (opts.dong || [])[r] || [];
      const row = ws.getRow(dDau + r);
      cot.forEach((c, i) => {
        const o = row.getCell(i + 1);
        o.value = gt[i] === undefined ? '' : gt[i];
        o.font = { name: V, size: 11 };
        o.border = vienO(1, soCot, dHd, dCuoi, i + 1, dDau + r);
        o.alignment = {
          horizontal: c.giua ? 'center' : 'left',
          vertical: 'middle',
          wrapText: !!c.xuongDong
        };
      });
      row.height = 19;
    }

    /* Danh sách xổ xuống: đặt MỘT LẦN cho cả cột, không đặt từng ô.
       Đặt từng ô thì ExcelJS gộp dải bị lỗi khi vượt dòng 10 (nó so địa chỉ
       theo chuỗi nên "A10" < "A6"), sinh ra hai mục chồng nhau
       sqref="F10:F47" và sqref="F6:F47". Excel gặp XML kiểu đó hay bật hộp
       "We found a problem with some content… Removed Records: Data validation"
       rồi bỏ luôn phần xổ xuống. */
    cot.forEach((c, i) => {
      if (!c.chon || !c.chon.length) return;
      const cot1 = ws.getColumn(i + 1).letter;
      ws.dataValidations.add(cot1 + dDau + ':' + cot1 + dCuoi, {
        type: 'list', allowBlank: true,
        formulae: ['"' + c.chon.join(',') + '"'],
        showErrorMessage: true,
        errorTitle: 'Giá trị không hợp lệ',
        error: 'Chọn một trong: ' + c.chon.join(', ')
      });
    });

    /* ---- Hướng dẫn: TRANG TÍNH RIÊNG ---- */
    if (opts.huongDan && opts.huongDan.length) {
      const w2 = wb.addWorksheet('Huong dan', {
        pageSetup: { paperSize: 9, orientation: 'portrait',
          margins: { left: .6, right: .6, top: .6, bottom: .6, header: .2, footer: .2 } }
      });
      w2.columns = [{ width: 108 }];
      w2.getCell(1, 1).value = 'HƯỚNG DẪN ĐIỀN — ' + (opts.tieuDe && opts.tieuDe[1] ? opts.tieuDe[1] : '');
      w2.getCell(1, 1).font = { name: V, size: 13, bold: true, color: { argb: NAVY } };
      w2.getRow(1).height = 24;
      opts.huongDan.forEach((t, i) => {
        const o = w2.getCell(i + 3, 1);
        o.value = t;
        o.font = { name: V, size: 11.5, bold: /^[A-ZÀ-Ỹ\s—·]+$/.test(t.slice(0, 18)) };
        o.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
        w2.getRow(i + 3).height = t.length > 90 ? 30 : 17;
      });
    }

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = opts.tenTep || 'mau.xlsx';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return true;
  }

  /* Bọc ngoài để KHÔNG BAO GIỜ hỏng im lặng.
     Bản trước gọi thẳng taoMau: thư viện ExcelJS chưa nạp được (mạng trường
     chập, CDN bị chặn) hoặc bất kỳ lỗi nào bên trong là bấm nút không có gì
     xảy ra — không tệp, không thông báo, chỉ một dòng đỏ trong console mà
     thầy cô không bao giờ mở tới. */
  window.taoMauExcel = function (opts) {
    return Promise.resolve()
      .then(() => taoMau(opts))
      .catch(e => {
        console.error('[Mẫu Excel] Không tạo được:', e);
        if (typeof notify === 'function') {
          notify('Chưa tạo được tệp mẫu: ' + (e && e.message ? e.message : e)
            + '. Thầy cô tải lại trang rồi thử lại; nếu vẫn vậy thì báo quản trị.');
        }
        return false;
      });
  };
})();
