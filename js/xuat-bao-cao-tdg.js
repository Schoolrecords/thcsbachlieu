/* ============================================================================
   XUẤT BÁO CÁO TỰ ĐÁNH GIÁ — BIỂU 1 PHỤ LỤC V THÔNG TƯ 57/2026/TT-BGDĐT

   Kết xuất tệp Word đủ bốn phần theo đúng Biểu 1:
     Phần I   — Tổng quan
     Phần II  — Tự đánh giá (từng tiêu chí + đánh giá chung từng tiêu chuẩn)
     Phần III — Kết luận (hai bảng tổng hợp, mức đạt, đề xuất kiến nghị)
     Phần IV  — Phụ lục (danh mục minh chứng)

   Cách trình bày bám lối viết quen thuộc của nhà trường trong báo cáo cũ:
   mỗi ý một đoạn, mã minh chứng đi liền sau đoạn đó. Riêng cách ghi mã đổi
   theo Phụ lục IV — ngoặc tròn, dấu phẩy, đặt trong câu:
       Ví dụ Phụ lục IV: "Nhà trường đã ban hành kế hoạch năm học (MC.1.1.01)."

   Ba điểm khác bảng mẫu cũ, do quy định đổi chứ không phải bỏ sót:
     · Chỉ còn Mức 1 và Mức 2, không còn Mức 3
     · Điểm mạnh, điểm hạn chế viết ở cấp TIÊU CHUẨN thay vì từng tiêu chí
     · Kế hoạch cải tiến tách hẳn sang Biểu 2, không nằm trong báo cáo này
   ============================================================================ */

(function () {
  'use strict';

  if (typeof CAU_HINH === 'undefined' || !CAU_HINH.DA_NOI) return;

  const TR = "font-family:'Times New Roman',serif;";
  const O = TR + 'border:1px solid #000;padding:5pt 7pt;font-size:12pt;vertical-align:top;';

  function chan(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function doan(s) {
    /* Giữ cách xuống dòng người dùng đã gõ — mỗi ý một đoạn như báo cáo cũ */
    const t = String(s || '').trim();
    if (!t) return '<p style="' + TR + 'font-size:12pt;font-style:italic;color:#555;margin:0">'
      + '(chưa nhập)</p>';
    return t.split(/\n+/).map(function (d) {
      return '<p style="' + TR + 'font-size:12pt;margin:0 0 5pt;text-align:justify">'
        + chan(d.trim()) + '</p>';
    }).join('');
  }
  function tenTruong() {
    return (typeof CAU_HINH !== 'undefined' && CAU_HINH.TEN_TRUONG) || 'Trường THCS Bạch Liêu';
  }
  function ngayThang() {
    const d = new Date();
    return (CAU_HINH.DIA_DANH || 'Yên Thành') + ', ngày ' + d.getDate()
      + ' tháng ' + (d.getMonth() + 1) + ' năm ' + d.getFullYear();
  }

  function layDuLieu() {
    if (typeof window.duLieuTuDanhGia !== 'function') return null;
    const d = window.duLieuTuDanhGia();
    return (d && d.tieuChi && d.tieuChi.length) ? d : null;
  }

  /* ---------------- Phần I — Tổng quan ---------------- */
  function phanI(d) {
    const tong = d.tieuChi.length;
    const soMC = Object.keys(d.mcTheoTC).reduce(function (a, k) { return a + d.mcTheoTC[k].length; }, 0);
    return ''
      + '<p style="' + TR + 'text-align:center;font-size:13pt;font-weight:bold;margin:16pt 0 8pt">Phần I. TỔNG QUAN</p>'
      + '<p style="' + TR + 'font-size:12pt;font-weight:bold;margin:8pt 0 4pt">1. Thông tin chung</p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 3pt">a) Tên cơ sở giáo dục: ' + chan(tenTruong()) + '</p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 3pt">b) Địa chỉ: '
      + chan(CAU_HINH.DIA_CHI_TRUONG || 'Xã Yên Thành, tỉnh Nghệ An') + '</p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 3pt">c) Cơ quan quản lý trực tiếp: '
      + chan(CAU_HINH.CO_QUAN_QUAN_LY || 'Sở Giáo dục và Đào tạo Nghệ An') + '</p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 3pt">d) Loại hình và cấp học: Công lập — Trung học cơ sở</p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 3pt">đ) Năm thành lập: …</p>'
      /* Quy mô lấy từ cauhinh.js. Trước đây gõ cứng "616 học sinh" trong khi
         quy mô thật là 636 — bản Word gửi Sở lệch 20 em so với mọi màn hình
         khác của chính hệ thống này. */
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 3pt">e) Quy mô: '
      + chan(CAU_HINH.SO_LOP || '…') + ' lớp, '
      + chan(CAU_HINH.SO_HOC_SINH || '…') + ' học sinh, '
      + chan(CAU_HINH.SO_CBGV || '…') + ' cán bộ quản lý, giáo viên và nhân viên</p>'
      + '<p style="' + TR + 'font-size:12pt;font-weight:bold;margin:8pt 0 4pt">2. Bối cảnh và đặc điểm</p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 3pt">a) Điều kiện kinh tế - xã hội địa phương: …</p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 3pt">b) Thuận lợi: …</p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 3pt">c) Khó khăn: …</p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 3pt">d) Đặc điểm người học: …</p>'
      + '<p style="' + TR + 'font-size:12pt;font-weight:bold;margin:8pt 0 4pt">3. Mục đích, phạm vi, thời gian thực hiện tự đánh giá</p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 5pt;text-align:justify">Báo cáo tự đánh giá được xây dựng nhằm phân tích thực trạng chất lượng giáo dục của nhà trường trên cơ sở '
      + tong + ' tiêu chí thuộc 04 tiêu chuẩn bảo đảm chất lượng; xác định điểm mạnh, điểm hạn chế và nguyên nhân; '
      + 'làm căn cứ xây dựng và triển khai kế hoạch cải tiến chất lượng giáo dục theo hướng liên tục, thực chất và có minh chứng.</p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 5pt;text-align:justify">Phạm vi tự đánh giá bao gồm toàn bộ hoạt động của nhà trường liên quan đến việc bảo đảm chất lượng giáo dục. '
      + 'Việc tự đánh giá được thực hiện định kỳ hằng năm, gắn với chu kỳ kế hoạch năm học ' + chan(d.namHoc) + '.</p>'
      + '<p style="' + TR + 'font-size:12pt;font-weight:bold;margin:8pt 0 4pt">4. Quá trình thực hiện tự đánh giá</p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 3pt">a) Lập kế hoạch tự đánh giá: …</p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 3pt">b) Tổ chức thực hiện: …</p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 3pt">c) Kiểm tra, phân tích: đối chiếu ' + soMC
      + ' minh chứng trong hệ thống hồ sơ số với yêu cầu của từng mức, xác định mức đạt của từng tiêu chí.</p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 3pt">d) Tổng hợp và xác nhận kết quả tự đánh giá: …</p>';
  }

  /* ---------------- Phần II — Tự đánh giá ---------------- */
  function motTieuChi(c, d) {
    const datM1 = c.self >= 1, datM2 = c.self >= 2;
    const mc = d.mcTheoTC[c.code] || [];
    const dsMa = mc.length
      ? '<p style="' + TR + 'font-size:11.5pt;font-style:italic;margin:4pt 0 0">Minh chứng của tiêu chí: ('
        + mc.map(function (h) { return chan(h.ma); }).join(', ') + ')</p>'
      : '<p style="' + TR + 'font-size:11.5pt;font-style:italic;color:#555;margin:4pt 0 0">'
        + 'Tiêu chí này chưa có minh chứng trong danh mục.</p>';

    return ''
      + '<p style="' + TR + 'font-size:12pt;font-weight:bold;margin:12pt 0 4pt">Tiêu chí ' + chan(c.code)
      + '. ' + chan(c.name) + (c.bb ? ' <i>(tiêu chí bắt buộc)</i>' : '') + '</p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 3pt;text-align:justify"><b>Mức 1:</b> ' + chan(c.m1) + '</p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 5pt;text-align:justify"><b>Mức 2:</b> ' + chan(c.m2) + '</p>'
      + '<p style="' + TR + 'font-size:12pt;font-style:italic;margin:0 0 3pt">Mô tả hiện trạng:</p>'
      + '<table style="width:100%;border-collapse:collapse">'
      + '<tr>'
      +   '<td style="' + O + 'width:9%;text-align:center;font-weight:bold">Mức</td>'
      +   '<td style="' + O + 'font-weight:bold;text-align:center">Hiện trạng, kết quả đạt được của tiêu chí đến thời điểm đánh giá <i>(kèm mã minh chứng)</i></td>'
      +   '<td style="' + O + 'width:15%;text-align:center;font-weight:bold">Đánh giá</td>'
      + '</tr>'
      + '<tr>'
      +   '<td style="' + O + 'text-align:center">Mức 1</td>'
      +   '<td style="' + O + '">' + doan(c.htM1) + '</td>'
      +   '<td style="' + O + 'text-align:center;font-weight:bold">' + (datM1 ? 'Đạt' : 'Không đạt') + '</td>'
      + '</tr>'
      + '<tr>'
      +   '<td style="' + O + 'text-align:center">Mức 2</td>'
      +   '<td style="' + O + '">' + (datM1 ? doan(c.htM2)
            : '<p style="' + TR + 'font-size:12pt;font-style:italic;color:#555;margin:0">'
              + 'Chỉ xem xét Mức 2 khi Mức 1 được xác định đạt.</p>') + '</td>'
      +   '<td style="' + O + 'text-align:center;font-weight:bold">' + (datM2 ? 'Đạt' : 'Không đạt') + '</td>'
      + '</tr>'
      + '</table>'
      + dsMa
      + '<p style="' + TR + 'font-size:12pt;font-weight:bold;margin:5pt 0 0">Tự đánh giá: Tiêu chí '
      + (datM2 ? 'đạt Mức 2' : datM1 ? 'đạt Mức 1' : 'không đạt Mức 1') + '.</p>';
  }

  function danhGiaChung(soTC, d) {
    const r = d.dgtc[soTC] || {};
    const ds = d.tieuChi.filter(function (c) { return c.std === soTC; });
    let h = '<p style="' + TR + 'font-size:12pt;font-weight:bold;margin:12pt 0 5pt">Đánh giá chung về Tiêu chuẩn ' + soTC + ':</p>'
      + '<p style="' + TR + 'font-size:12pt;font-weight:bold;margin:5pt 0 2pt">1. Điểm mạnh nổi bật của Tiêu chuẩn ' + soTC + ':</p>' + doan(r.diem_manh)
      + '<p style="' + TR + 'font-size:12pt;font-weight:bold;margin:5pt 0 2pt">2. Điểm hạn chế trọng tâm của Tiêu chuẩn ' + soTC + ' và nguyên nhân cốt lõi:</p>' + doan(r.han_che_nguyen_nhan)
      + '<p style="' + TR + 'font-size:12pt;font-weight:bold;margin:5pt 0 2pt">3. Định hướng cải tiến chất lượng:</p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 2pt"><i>a) Phân tích chung về xu hướng chất lượng của Tiêu chuẩn ' + soTC + ' trong 03 năm học liên tiếp:</i></p>' + doan(r.xu_huong_3_nam)
      + '<p style="' + TR + 'font-size:12pt;margin:4pt 0 2pt"><i>b) Các vấn đề trọng tâm cần ưu tiên cải tiến ở Tiêu chuẩn ' + soTC + ':</i></p>' + doan(r.van_de_uu_tien)
      + '<p style="' + TR + 'font-size:12pt;font-weight:bold;margin:8pt 0 3pt">4. Tổng hợp kết quả đánh giá các tiêu chí của Tiêu chuẩn ' + soTC + ':</p>'
      + '<table style="width:100%;border-collapse:collapse">'
      + '<tr><td rowspan="2" style="' + O + 'text-align:center;font-weight:bold;width:34%">Tiêu chí</td>'
      +   '<td colspan="3" style="' + O + 'text-align:center;font-weight:bold">Kết quả đánh giá tiêu chí</td></tr>'
      + '<tr><td style="' + O + 'text-align:center;font-weight:bold">Không đạt</td>'
      +   '<td style="' + O + 'text-align:center;font-weight:bold">Mức 1</td>'
      +   '<td style="' + O + 'text-align:center;font-weight:bold">Mức 2</td></tr>';
    ds.forEach(function (c) {
      h += '<tr><td style="' + O + '">Tiêu chí ' + chan(c.code) + '</td>'
        + '<td style="' + O + 'text-align:center">' + (c.self === 0 ? '×' : '') + '</td>'
        + '<td style="' + O + 'text-align:center">' + (c.self === 1 ? '×' : '') + '</td>'
        + '<td style="' + O + 'text-align:center">' + (c.self === 2 ? '×' : '') + '</td></tr>';
    });
    return h + '</table>';
  }

  function phanII(d) {
    let h = '<p style="' + TR + 'text-align:center;font-size:13pt;font-weight:bold;margin:18pt 0 8pt">Phần II. TỰ ĐÁNH GIÁ</p>';
    [1, 2, 3, 4].forEach(function (so) {
      const ds = d.tieuChi.filter(function (c) { return c.std === so; });
      if (!ds.length) return;
      h += '<p style="' + TR + 'font-size:12.5pt;font-weight:bold;margin:14pt 0 4pt">Tiêu chuẩn ' + so + ': '
        + chan((window.TEN_TC_BAOCAO && window.TEN_TC_BAOCAO[so]) || tenTC(so)).toUpperCase() + '</p>';
      ds.forEach(function (c) { h += motTieuChi(c, d); });
      h += danhGiaChung(so, d);
    });
    return h;
  }

  function tenTC(so) {
    return ({
      1: 'Quản trị nhà trường và bảo đảm chất lượng',
      2: 'Phát triển đội ngũ',
      3: 'Thực hiện chương trình, đổi mới phương pháp giáo dục và phát triển người học',
      4: 'Điều kiện giáo dục, môi trường an toàn và phối hợp xã hội'
    })[so] || '';
  }

  /* ---------------- Phần III — Kết luận ---------------- */
  function phanIII(d) {
    const tc = d.tieuChi;
    const ketLuan = (typeof xepMucNhaTruong === 'function') ? xepMucNhaTruong().ketLuan : '';

    let bang1 = '<table style="width:100%;border-collapse:collapse">'
      + '<tr><td rowspan="2" style="' + O + 'text-align:center;font-weight:bold;width:34%">Tiêu chuẩn, Tiêu chí</td>'
      +   '<td colspan="3" style="' + O + 'text-align:center;font-weight:bold">Kết quả đánh giá tiêu chí</td></tr>'
      + '<tr><td style="' + O + 'text-align:center;font-weight:bold">Không đạt Mức 1</td>'
      +   '<td style="' + O + 'text-align:center;font-weight:bold">Mức 1</td>'
      +   '<td style="' + O + 'text-align:center;font-weight:bold">Mức 2</td></tr>';
    [1, 2, 3, 4].forEach(function (so) {
      bang1 += '<tr><td style="' + O + 'font-weight:bold">Tiêu chuẩn ' + so + '</td>'
        + '<td style="' + O + '"></td><td style="' + O + '"></td><td style="' + O + '"></td></tr>';
      tc.filter(function (c) { return c.std === so; }).forEach(function (c) {
        bang1 += '<tr><td style="' + O + '">Tiêu chí ' + chan(c.code) + '</td>'
          + '<td style="' + O + 'text-align:center">' + (c.self === 0 ? '×' : '') + '</td>'
          + '<td style="' + O + 'text-align:center">' + (c.self === 1 ? '×' : '') + '</td>'
          + '<td style="' + O + 'text-align:center">' + (c.self === 2 ? '×' : '') + '</td></tr>';
      });
    });
    const t0 = tc.filter(function (c) { return c.self === 0; }).length;
    const t1 = tc.filter(function (c) { return c.self === 1; }).length;
    const t2 = tc.filter(function (c) { return c.self === 2; }).length;
    bang1 += '<tr><td style="' + O + 'font-weight:bold">Cộng chung</td>'
      + '<td style="' + O + 'text-align:center;font-weight:bold">' + t0 + '</td>'
      + '<td style="' + O + 'text-align:center;font-weight:bold">' + t1 + '</td>'
      + '<td style="' + O + 'text-align:center;font-weight:bold">' + t2 + '</td></tr></table>';

    function pt(a, b) { return b ? (Math.round(a / b * 1000) / 10) + '%' : '0%'; }
    let bang2 = '<table style="width:100%;border-collapse:collapse">'
      + '<tr><td rowspan="3" style="' + O + 'text-align:center;font-weight:bold;width:26%">Tiêu chuẩn</td>'
      +   '<td rowspan="3" style="' + O + 'text-align:center;font-weight:bold;width:12%">Tổng số tiêu chí</td>'
      +   '<td colspan="6" style="' + O + 'text-align:center;font-weight:bold">Tổng hợp kết quả đánh giá tiêu chí trong tiêu chuẩn</td></tr>'
      + '<tr><td colspan="2" style="' + O + 'text-align:center;font-weight:bold">Không đạt</td>'
      +   '<td colspan="2" style="' + O + 'text-align:center;font-weight:bold">Mức 1</td>'
      +   '<td colspan="2" style="' + O + 'text-align:center;font-weight:bold">Mức 2</td></tr>'
      + '<tr>' + ['SL', '%', 'SL', '%', 'SL', '%'].map(function (x) {
          return '<td style="' + O + 'text-align:center;font-style:italic">' + x + '</td>'; }).join('') + '</tr>';
    [1, 2, 3, 4].forEach(function (so) {
      const ds = tc.filter(function (c) { return c.std === so; });
      const a0 = ds.filter(function (c) { return c.self === 0; }).length;
      const a1 = ds.filter(function (c) { return c.self === 1; }).length;
      const a2 = ds.filter(function (c) { return c.self === 2; }).length;
      bang2 += '<tr><td style="' + O + '">Tiêu chuẩn ' + so + '</td>'
        + '<td style="' + O + 'text-align:center">' + ds.length + '</td>'
        + '<td style="' + O + 'text-align:center">' + a0 + '</td><td style="' + O + 'text-align:center">' + pt(a0, ds.length) + '</td>'
        + '<td style="' + O + 'text-align:center">' + a1 + '</td><td style="' + O + 'text-align:center">' + pt(a1, ds.length) + '</td>'
        + '<td style="' + O + 'text-align:center">' + a2 + '</td><td style="' + O + 'text-align:center">' + pt(a2, ds.length) + '</td></tr>';
    });
    bang2 += '<tr><td style="' + O + 'font-weight:bold">Cộng chung</td>'
      + '<td style="' + O + 'text-align:center;font-weight:bold">' + tc.length + '</td>'
      + '<td style="' + O + 'text-align:center;font-weight:bold">' + t0 + '</td><td style="' + O + 'text-align:center">' + pt(t0, tc.length) + '</td>'
      + '<td style="' + O + 'text-align:center;font-weight:bold">' + t1 + '</td><td style="' + O + 'text-align:center">' + pt(t1, tc.length) + '</td>'
      + '<td style="' + O + 'text-align:center;font-weight:bold">' + t2 + '</td><td style="' + O + 'text-align:center">' + pt(t2, tc.length) + '</td></tr></table>';

    return ''
      + '<p style="' + TR + 'text-align:center;font-size:13pt;font-weight:bold;margin:18pt 0 8pt">Phần III. KẾT LUẬN</p>'
      + '<p style="' + TR + 'font-size:12pt;font-weight:bold;margin:8pt 0 3pt">1. Khái quát về mức độ đáp ứng tiêu chuẩn chất lượng giáo dục của cơ sở giáo dục</p>'
      + '<p style="' + TR + 'font-size:12pt;font-style:italic;color:#555;margin:0 0 5pt">(Nhà trường bổ sung nhận định khái quát về mức độ ổn định và tính bền vững của hệ thống bảo đảm chất lượng nội bộ.)</p>'
      + '<p style="' + TR + 'font-size:12pt;font-weight:bold;margin:8pt 0 3pt">2. Tổng hợp kết quả tự đánh giá</p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 3pt"><i>a) Bảng tổng hợp kết quả đánh giá tiêu chí</i></p>' + bang1
      + '<p style="' + TR + 'font-size:12pt;margin:8pt 0 3pt"><i>b) Bảng tổng hợp chung</i></p>' + bang2
      + '<p style="' + TR + 'font-size:12pt;font-weight:bold;margin:10pt 0 3pt">3. Mức đạt của cơ sở giáo dục</p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 5pt">Cơ sở giáo dục <b>' + chan(ketLuan) + '</b>.</p>'
      + '<p style="' + TR + 'font-size:11.5pt;font-style:italic;margin:0 0 5pt;text-align:justify">Căn cứ khoản 3 Điều 5 Thông tư số 57/2026/TT-BGDĐT: đạt Mức 1 khi tất cả tiêu chí bắt buộc đạt Mức 1 và có ít nhất 05 trong 07 tiêu chí còn lại đạt Mức 1 trở lên; đạt Mức 2 khi tất cả tiêu chí bắt buộc đạt Mức 2 và có ít nhất 05 trong 07 tiêu chí còn lại đạt Mức 2, các tiêu chí còn lại đạt tối thiểu Mức 1.</p>'
      + '<p style="' + TR + 'font-size:12pt;font-weight:bold;margin:8pt 0 3pt">4. Đề xuất, kiến nghị</p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 3pt">a) Với Sở Giáo dục và Đào tạo Nghệ An: …</p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 3pt">b) Với Uỷ ban nhân dân xã '
      + chan(CAU_HINH.DIA_DANH || 'Yên Thành') + ': …</p>'
      + '<p style="' + TR + 'font-size:12pt;margin:0 0 5pt">c) Với tổ chức, cá nhân liên quan: …</p>'
      + '<p style="' + TR + 'font-size:12pt;margin:8pt 0 0;text-align:justify">Hiệu trưởng chịu trách nhiệm về tính trung thực, chính xác của thông tin, số liệu và minh chứng trong báo cáo tự đánh giá./.</p>';
  }

  /* ---------------- Phần IV — Phụ lục ---------------- */
  function phanIV(d) {
    const ds = [];
    Object.keys(d.mcTheoTC).forEach(function (k) {
      d.mcTheoTC[k].forEach(function (h) {
        if (!ds.some(function (x) { return x.ma === h.ma; })) ds.push(h);
      });
    });
    ds.sort(function (a, b) { return String(a.ma).localeCompare(String(b.ma), 'vi'); });

    let h = '<p style="' + TR + 'text-align:center;font-size:13pt;font-weight:bold;margin:18pt 0 8pt">Phần IV. PHỤ LỤC</p>'
      + '<p style="' + TR + 'font-size:12pt;font-weight:bold;margin:0 0 5pt">Danh mục minh chứng</p>'
      + '<table style="width:100%;border-collapse:collapse">'
      + '<tr><td style="' + O + 'text-align:center;font-weight:bold;width:6%">TT</td>'
      +   '<td style="' + O + 'text-align:center;font-weight:bold;width:16%">Mã minh chứng</td>'
      +   '<td style="' + O + 'text-align:center;font-weight:bold">Tên minh chứng</td>'
      +   '<td style="' + O + 'text-align:center;font-weight:bold;width:26%">Vị trí lưu trữ</td></tr>';
    ds.forEach(function (m, i) {
      const vt = m.link_drive
        ? '<a href="' + m.link_drive + '">Thư mục trên hệ thống hồ sơ số</a>'
        : 'Chưa gán thư mục';
      h += '<tr><td style="' + O + 'text-align:center">' + (i + 1) + '</td>'
        + '<td style="' + O + 'font-weight:bold">' + chan(m.ma) + '</td>'
        + '<td style="' + O + '">' + chan(m.ten) + '</td>'
        + '<td style="' + O + 'font-size:11pt">' + vt + '</td></tr>';
    });
    return h + '</table>';
  }

  /* ---------------- Ghép và tải ---------------- */
  function xuatBaoCao() {
    const d = layDuLieu();
    if (!d) {
      if (typeof notify === 'function') {
        notify('Chưa có dữ liệu tự đánh giá — thầy cô đăng nhập rồi thử lại.');
      }
      return;
    }

    const bia = ''
      + '<p style="' + TR + 'text-align:center;font-size:13pt;margin:0">'
      + chan(CAU_HINH.DON_VI_CHU_QUAN || 'UBND XÃ YÊN THÀNH') + '</p>'
      + '<p style="' + TR + 'text-align:center;font-size:13pt;font-weight:bold;margin:0 0 30pt">'
      + chan(tenTruong()).toUpperCase() + '</p>'
      + '<p style="' + TR + 'text-align:center;font-size:17pt;font-weight:bold;margin:40pt 0 6pt">BÁO CÁO TỰ ĐÁNH GIÁ</p>'
      + '<p style="' + TR + 'text-align:center;font-size:13pt;margin:0 0 4pt">Năm học ' + chan(d.namHoc) + '</p>'
      + '<p style="' + TR + 'text-align:center;font-size:11.5pt;font-style:italic;margin:6pt 0 40pt">'
      + 'Lập theo Biểu 1 Phụ lục V Thông tư số 57/2026/TT-BGDĐT ngày 07/7/2026<br>'
      + 'của Bộ trưởng Bộ Giáo dục và Đào tạo</p>'
      + '<p style="' + TR + 'text-align:center;font-size:13pt;margin:60pt 0 0"><i>' + ngayThang() + '</i></p>'
      + '<p style="page-break-after:always"></p>';

    const cuoi = ''
      + '<table style="width:100%;border-collapse:collapse;margin-top:20pt"><tr>'
      + '<td style="width:52%"></td>'
      + '<td style="' + TR + 'text-align:center;font-size:13pt">'
      + '<i>' + ngayThang() + '</i><br><b>HIỆU TRƯỞNG</b><br><i>(Ký tên, đóng dấu)</i><br><br><br><br></td>'
      + '</tr></table>';

    const html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" '
      + 'xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">'
      + '<head><meta charset="utf-8"><title>Báo cáo tự đánh giá ' + chan(d.namHoc) + '</title>'
      + '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom>'
      + '</w:WordDocument></xml><![endif]-->'
      + '<style>@page{size:A4;margin:2cm 1.5cm 2cm 3cm}'
      + 'body{font-family:"Times New Roman",serif;font-size:12pt}'
      + 'table{page-break-inside:auto}tr{page-break-inside:avoid}</style>'
      + '</head><body>' + bia + phanI(d) + phanII(d) + phanIII(d) + phanIV(d) + cuoi + '</body></html>';

    const blob = new Blob(['﻿' + html], { type: 'application/msword' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'bao-cao-tu-danh-gia-' + String(d.namHoc).replace(/\s/g, '') + '.doc';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);

    if (typeof notify === 'function') {
      notify('Đã tải Báo cáo tự đánh giá theo Biểu 1. Những chỗ ghi "(chưa nhập)" hoặc dấu … là phần nhà trường bổ sung trực tiếp trên tệp Word.');
    }
  }

  window.xuatBaoCaoTuDanhGia = xuatBaoCao;

  /* Gắn vào nút có sẵn trên màn hình Tự đánh giá */
  function ganNut() {
    const ds = document.querySelectorAll('#view-kdcl .toolbar button');
    for (let i = 0; i < ds.length; i++) {
      if (ds[i].textContent.indexOf('Xuất báo cáo tự đánh giá') >= 0) {
        ds[i].removeAttribute('onclick');
        ds[i].addEventListener('click', xuatBaoCao);
        ds[i].title = 'Kết xuất Word theo Biểu 1 Phụ lục V Thông tư 57';
      }
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ganNut);
  } else {
    ganNut();
  }
})();
