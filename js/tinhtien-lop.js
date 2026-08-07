/* ============================================================================
   TỊNH TIẾN LÊN LỚP — đẩy danh sách học sinh sang năm học mới

   Khối 6 của năm cũ thành khối 7 của năm mới, 7 thành 8, 8 thành 9. Khối 9
   ra trường nên dừng lại. Khối 6 mới là học sinh vừa từ tiểu học lên, không
   suy ra được từ đâu — phải nhập riêng.

   Giữ nguyên mã học sinh, số định danh, họ tên, ngày sinh. Chỉ thêm một dòng
   xếp lớp cho năm mới.

   ĐIỀU KIỆN LÊN LỚP — Điều 12 khoản 1 Thông tư 22/2021/TT-BGDĐT, ba điều:
     a) Kết quả rèn luyện cả năm từ mức Đạt trở lên
     b) Kết quả học tập cả năm từ mức Đạt trở lên
     c) Nghỉ học không quá 45 buổi trong một năm học

   ------------------------------------------------------------------------
   BỐN NGUYÊN TẮC AN TOÀN — viết ra đây vì bản đầu đã phạm cả bốn
   ------------------------------------------------------------------------
   1. KHÔNG BAO GIỜ GHI ĐÈ DÒNG ĐÃ CÓ Ở NĂM ĐÍCH.
      Bản đầu dùng upsert merge nên em nào ở năm đích đang là chuyển đi,
      bảo lưu, thôi học bị kéo hết về "đang học", và lớp đã xếp lại bằng tay
      bị đặt lại theo bảng ánh xạ. Nay dùng ignoreDuplicates: chỉ THÊM em
      chưa có dòng, em đã có thì bỏ qua và báo rõ số lượng.

   2. NĂM ĐÍCH PHẢI SAU NĂM NGUỒN.
      Chọn ngược chiều là phá cả một năm học có thật. Nay danh sách năm đích
      dựng lại theo năm nguồn nên không chọn ngược được, và trước khi ghi
      còn một bước xác nhận nữa.

   3. THIẾU DỮ LIỆU KHÔNG PHẢI LÀ LƯU BAN.
      Cột len_lop chảy thẳng vào CT10 và CT11 của Phụ lục 5 gửi Sở. Em chưa
      nạp điểm mà bị ghi len_lop = false là bị đếm thành lưu ban trong báo
      cáo. Nay chỉ ghi kết luận cho em nào kiểm được ĐỦ CẢ BA điều kiện;
      thiếu bất kỳ điều nào thì để trống, không kết luận.
      Và kết luận "ở lại" không bao giờ đè lên kết luận hội đồng đã ghi.

   4. HỌC SINH HOÀ NHẬP ĐÁNH GIÁ RIÊNG.
      Thông tư 22 đánh giá các em theo kế hoạch giáo dục cá nhân, phần mềm
      không có kế hoạch đó nên không xét thay. Tách riêng, không ghi kết
      luận lên lớp, việc chuyển lớp để nhà trường tự chọn.

   KHÔNG TỰ QUYẾT PHẦN CỦA HỘI ĐỒNG
   Em nào chưa đủ điều kiện thì Điều 13 và 14 còn cho rèn luyện lại, kiểm tra
   lại trong kì nghỉ hè. Đó là việc của hội đồng nhà trường, không phải việc
   của phần mềm. Nên mặc định KHÔNG tạo dòng cho các em đó — liệt kê riêng để
   nhà trường xử lý, xong rồi thêm tay.
   ============================================================================ */

(function () {
  'use strict';

  if (typeof CAU_HINH === 'undefined' || !CAU_HINH.DA_NOI) return;

  const sb = () => window.sbClient;
  let HOP = null, DL = null;

  const css = `
  .tt-canh{background:#eef4ff;border:1px solid #cfe0ff;color:#1d4ed8;border-radius:10px;
    padding:12px 15px;font-size:13.6px;margin:11px 0;line-height:1.65}
  .tt-do{background:#fdf3f2;border-color:#f3c9c5;color:#8a3428}
  .tt-vang{background:#fff8e8;border-color:#f0d089;color:#7a5410}
  .tt-ok{background:#f2fdf6;border-color:#bfe8cd;color:#1a6437}
  .tt-bang{width:100%;border-collapse:collapse;font-size:13.4px;margin-top:8px}
  .tt-bang th{background:#eef3fb;color:#14306b;font-weight:700;padding:8px 9px;
    border:1px solid #dbe3ef;font-size:12.5px;text-align:left;white-space:nowrap}
  .tt-bang td{border:1px solid #e4e9f2;padding:6px 9px;vertical-align:middle}
  .tt-bang input[type=text]{width:88px;padding:5px 8px;border:1.5px solid #d7dde8;
    border-radius:7px;font-size:13.2px;font-family:inherit;text-align:center;
    text-transform:uppercase}
  .tt-chon{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:12px 0}
  .tt-chon label{font-size:13.4px;font-weight:600;color:var(--navy)}
  .tt-chon select{padding:9px 12px;border:1.5px solid #d7dde8;border-radius:9px;
    font-size:13.6px;font-family:inherit;background:#fff}
  .tt-nho{font-size:12.2px;color:#64748b}
  .tt-tick{display:flex;gap:9px;align-items:flex-start;margin-top:9px;
    font-size:13.4px;line-height:1.6;cursor:pointer}
  .tt-tick input{width:19px;height:19px;margin-top:1px;flex:0 0 auto;cursor:pointer}
  `;
  document.head.insertAdjacentHTML('beforeend', '<style>' + css + '</style>');

  function chan(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function bao(s) { if (typeof notify === 'function') notify(s); }
  /* "2025-2026" → 2025. Dùng để so năm nào trước năm nào. */
  function namSo(n) { const x = parseInt(String(n || '').slice(0, 4), 10); return isNaN(x) ? 0 : x; }
  function khongDau(s) {
    return String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  async function taiHet(bang, chon, loc) {
    const s = sb(), BUOC = 1000;
    let tuDau = 0, gom = [];
    for (;;) {
      let q = s.from(bang).select(chon);
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

  /* ==========================================================================
     XẾP LOẠI HỌC TẬP CẢ NĂM — Điều 9 khoản 2 Thông tư 22

     Trả về '' khi THIẾU DỮ LIỆU, và đó là chuyện khác hẳn với "Chưa đạt".
     Bản đầu chỉ đếm số môn CÓ điểm nên em mới nạp 6 môn, cả 6 đều trên 8.0,
     được xếp "Tốt" dù còn thiếu hai môn; ngược lại em chỉ có một hai môn thì
     rơi thẳng xuống "Chưa đạt". Sai cả hai chiều. Nay đòi đủ mặt toàn bộ môn
     mà em đó phải học, thiếu một môn là trả '' để đưa vào diện chờ.
     ========================================================================== */
  function xepLoai(diem, canDiem, canDat) {
    const coDiem = {}, coDat = {};
    diem.forEach(x => {
      if (canDiem[x.mon_ma]) { if (x.diem != null) coDiem[x.mon_ma] = Number(x.diem); }
      else if (canDat[x.mon_ma]) { if (x.muc) coDat[x.mon_ma] = x.muc; }
    });
    const soCanDiem = Object.keys(canDiem).length;
    const soCanDat = Object.keys(canDat).length;
    const d = Object.keys(coDiem).map(k => coDiem[k]);
    /* Thiếu môn nào cũng là chưa kiểm được */
    if (!soCanDiem || d.length < soCanDiem) return '';
    if (Object.keys(coDat).length < soCanDat) return '';

    const n = d.length;
    const nxChuaDat = Object.keys(coDat).filter(k => coDat[k] === 'CD').length;
    const tu65 = d.filter(x => x >= 6.5).length;
    const tu80 = d.filter(x => x >= 8.0).length;
    const tu50 = d.filter(x => x >= 5.0).length;
    const duoi35 = d.filter(x => x < 3.5).length;
    if (nxChuaDat === 0 && tu65 === n && tu80 >= 6) return 'Tốt';
    if (nxChuaDat === 0 && tu50 === n && tu65 >= 6) return 'Khá';
    if (nxChuaDat <= 1 && duoi35 === 0 && tu50 >= 6) return 'Đạt';
    return 'Chưa đạt';
  }
  const DAT = { 'Tốt': 1, 'Khá': 1, 'Đạt': 1, 'Chưa đạt': 0 };

  /* ==========================================================================
     ĐỌC DỮ LIỆU NĂM NGUỒN
     ========================================================================== */
  async function tai(namNguon, namDich) {
    const s = sb();
    const [mh, hsl, kq, rl, daCo] = await Promise.all([
      s.from('mon_hoc').select('*'),
      taiHet('hoc_sinh_lop',
             '*, hoc_sinh(ma, ho_ten, ngay_sinh, hoa_nhap, mien_giam_mon)',
             [['nam_hoc', namNguon]]),
      taiHet('hs_ket_qua', 'hoc_sinh_ma, mon_ma, diem, muc',
             [['nam_hoc', namNguon], ['ky', 'ca_nam']]),
      taiHet('hs_ren_luyen', 'hoc_sinh_ma, muc', [['nam_hoc', namNguon], ['ky', 'ca_nam']]),
      /* Năm đích đã có ai chưa — để KHÔNG đụng vào các em đó */
      taiHet('hoc_sinh_lop', 'id, hoc_sinh_ma, lop, trang_thai', [['nam_hoc', namDich]])
    ]);
    if (mh.error) throw mh.error;

    const mon = (mh.data || []);
    const kieu = {}, tenMon = {};
    mon.forEach(m => { kieu[m.ma] = m.kieu; tenMon[m.ma] = m.ten; });

    const theoEm = {};
    kq.forEach(r => { (theoEm[r.hoc_sinh_ma] = theoEm[r.hoc_sinh_ma] || []).push(r); });
    const rlEm = {};
    rl.forEach(r => { rlEm[r.hoc_sinh_ma] = r.muc; });
    const dichCo = {};
    daCo.forEach(r => { dichCo[r.hoc_sinh_ma] = r; });

    /* Có cột số buổi nghỉ chưa (tệp sql/26). Chưa chạy thì cột không tồn tại
       nên PostgREST không trả về khoá đó. */
    const coCotBn = hsl.length > 0 && Object.prototype.hasOwnProperty.call(hsl[0], 'so_buoi_nghi');

    /* Em bị chính sách bảo mật che thì hoc_sinh là null — bản đầu lặng lẽ bỏ
       qua, con số tổng thiếu mà không ai biết. Nay đếm và báo. */
    const bienMat = hsl.filter(r => !r.hoc_sinh).length;

    const em = [];
    hsl.filter(r => r.hoc_sinh && r.trang_thai === 'dang_hoc' && r.khoi >= 6 && r.khoi <= 9)
      .forEach(r => {
        const ma = r.hoc_sinh_ma;
        const h = r.hoc_sinh;

        /* Môn em đó phải học = toàn bộ môn, trừ môn được miễn giảm */
        const mienText = khongDau(h.mien_giam_mon || '');
        const canDiem = {}, canDat = {};
        mon.forEach(m => {
          if (mienText && mienText.indexOf(khongDau(m.ten)) >= 0) return;
          if (m.kieu === 'diem') canDiem[m.ma] = 1; else canDat[m.ma] = 1;
        });

        const xl = xepLoai(theoEm[ma] || [], canDiem, canDat);
        const rn = rlEm[ma] || '';
        /* Điều kiện (c): nghỉ không quá 45 buổi.
           bn === null nghĩa là CHƯA KIỂM ĐƯỢC (chưa có cột, hoặc chưa nạp sổ),
           KHÔNG có nghĩa là đạt. Vì vậy nó chỉ chặn việc ghi kết luận chứ
           không tự động cho qua — xem kiemDuBa bên dưới. */
        const bn = (r.so_buoi_nghi === undefined || r.so_buoi_nghi === null)
                 ? null : Number(r.so_buoi_nghi);
        const quaNghi = bn != null && bn > 45;

        const thieu = [];
        if (!xl) thieu.push('chưa đủ điểm cả năm');
        if (!rn) thieu.push('chưa có mức rèn luyện');
        if (bn == null) thieu.push('chưa có số buổi nghỉ');

        const hoaNhap = !!h.hoa_nhap;
        /* Đủ HAI điều kiện kiểm được (a) và (b), và không quá 45 buổi nếu biết */
        const datHai = !!(xl && rn && DAT[xl] && DAT[rn]) && !quaNghi;
        /* Kiểm được ĐỦ BA điều kiện — chỉ khi đó mới dám ghi kết luận len_lop */
        const kiemDuBa = !!(xl && rn && bn != null);

        em.push({
          ma: ma, ten: h.ho_ten, lop: String(r.lop || '').toUpperCase(),
          khoi: r.khoi, xl: xl, rl: rn, bn: bn,
          hoaNhap: hoaNhap, thieu: thieu,
          datHai: datHai, kiemDuBa: kiemDuBa,
          /* Đủ điều kiện để tịnh tiến. Học sinh hoà nhập không xét ở đây —
             Thông tư 22 đánh giá các em theo kế hoạch giáo dục cá nhân. */
          du: datHai && !hoaNhap,
          /* Đã có dòng ở năm đích rồi thì tuyệt đối không đụng tới */
          daCoODich: !!dichCo[ma],
          lopODich: dichCo[ma] ? dichCo[ma].lop : ''
        });
      });

    return { em: em, coCotBn: coCotBn, bienMat: bienMat, soODich: daCo.length };
  }

  /* ==========================================================================
     MÀN HÌNH CHỌN NĂM
     ========================================================================== */
  async function mo(hop) {
    HOP = hop || document.getElementById('dbclKhac');
    ve('<div class="tt-canh">Đang đọc danh sách…</div>');

    let cacNam = [];
    try {
      const n = await taiHet('hoc_sinh_lop', 'id, nam_hoc');
      cacNam = Array.from(new Set(n.map(r => r.nam_hoc))).filter(Boolean).sort().reverse();
    } catch (e) {
      ve('<div class="tt-canh tt-do"><b>Không đọc được danh sách.</b><br>' + chan(e.message) + '</div>'
        + nutVe());
      ganVe();
      return;
    }
    if (!cacNam.length) {
      ve('<div class="tt-canh tt-vang"><b>Chưa có danh sách học sinh năm nào.</b><br>'
        + 'Nạp sổ điểm VnEdu hoặc mẫu danh sách trước đã.</div>' + nutVe());
      ganVe();
      return;
    }
    veChon(cacNam);
  }

  /* Năm đích luôn dựng lại theo năm nguồn nên KHÔNG chọn ngược chiều được.
     Chọn ngược là ghi đè cả một năm học có thật. */
  function dsDich(nguon) {
    const g = namSo(nguon), r = [];
    for (let i = 1; i <= 5; i++) r.push((g + i) + '-' + (g + i + 1));
    return r;
  }
  function veODich(nguon) {
    const o = document.getElementById('ttDich');
    if (!o) return;
    const ds = dsDich(nguon);
    o.innerHTML = ds.map(n => '<option value="' + chan(n) + '"'
      + (n === CAU_HINH.NAM_HOC ? ' selected' : '') + '>' + chan(n)
      + (n === CAU_HINH.NAM_HOC ? ' (năm hiện hành)' : '') + '</option>').join('');
    if (!ds.some(n => n === CAU_HINH.NAM_HOC)) o.selectedIndex = 0;
  }

  function veChon(cacNam) {
    /* Mặc định lấy năm gần nhất TRƯỚC năm hiện hành; không có thì lấy năm mới nhất */
    const nguonMac = cacNam.find(n => namSo(n) < namSo(CAU_HINH.NAM_HOC)) || cacNam[0];
    ve('<div class="tt-canh"><b>↗ Tịnh tiến lên lớp</b><br>'
      + 'Khối 6 của năm cũ thành khối 7 của năm mới, 7 thành 8, 8 thành 9. '
      + 'Khối 9 ra trường nên dừng lại. Khối 6 mới là học sinh vừa từ tiểu học lên, '
      + 'không suy ra được từ đâu — phải nhập riêng.<br>'
      + 'Giữ nguyên mã học sinh, số định danh, họ tên, ngày sinh; chỉ thêm một dòng '
      + 'xếp lớp cho năm mới.</div>'
      + '<div class="tt-canh"><div class="tt-chon">'
      + '<label>Lấy từ năm học</label><select id="ttNguon">'
      + cacNam.map(n => '<option value="' + chan(n) + '"' + (n === nguonMac ? ' selected' : '')
          + '>' + chan(n) + '</option>').join('') + '</select>'
      + '<label style="margin-left:10px">Đẩy sang năm học</label>'
      + '<select id="ttDich"></select>'
      + '</div><div class="tt-nho">Năm đích luôn phải sau năm nguồn, nên danh sách bên '
      + 'phải chỉ hiện các năm về sau.</div></div>'
      + '<div class="tt-chon"><button class="btn btn-pri" id="ttDoc">🔎 Đọc và xem trước</button>'
      + nutVe() + '</div>');

    const oN = document.getElementById('ttNguon');
    veODich(oN.value);
    oN.addEventListener('change', () => veODich(oN.value));

    const d = document.getElementById('ttDoc');
    if (d) d.addEventListener('click', async () => {
      const a = oN.value;
      const b = document.getElementById('ttDich').value;
      if (namSo(b) <= namSo(a)) { bao('Năm đích phải sau năm nguồn — chọn lại giúp em.'); return; }
      ve('<div class="tt-canh">Đang đọc và đối chiếu điều kiện lên lớp…</div>');
      try {
        const r = await tai(a, b);
        DL = {
          nguon: a, dich: b, em: r.em, coCotBn: r.coCotBn,
          bienMat: r.bienMat, soODich: r.soODich, anhXa: {}, keoHoaNhap: false
        };
        Array.from(new Set(r.em.filter(e => e.khoi <= 8).map(e => e.lop))).sort().forEach(l => {
          /* Mặc định giữ nguyên chữ cái: 6A → 7A. Trường xếp lại lớp thì sửa. */
          DL.anhXa[l] = (parseInt(l, 10) + 1) + l.replace(/^\d+/, '');
        });
        veXemTruoc();
      } catch (e) {
        ve('<div class="tt-canh tt-do"><b>Không đọc được.</b><br>' + chan(e.message) + '</div>' + nutVe());
        ganVe();
      }
    });
    ganVe();
  }

  /* Danh sách các em sẽ được tạo dòng ở năm đích */
  function dsKeo() {
    return DL.em.filter(e => e.khoi <= 8 && !e.daCoODich
                          && (e.hoaNhap ? DL.keoHoaNhap : e.du));
  }

  /* ==========================================================================
     XEM TRƯỚC
     ========================================================================== */
  function veXemTruoc() {
    const tt = DL.em.filter(e => e.khoi <= 8);          // khối tịnh tiến được
    const k9 = DL.em.filter(e => e.khoi === 9);
    const hoaNhap = tt.filter(e => e.hoaNhap);
    const thuong = tt.filter(e => !e.hoaNhap);
    const du = thuong.filter(e => e.du);
    const thieuDL = thuong.filter(e => !e.du && e.thieu.length);
    const chuaDat = thuong.filter(e => !e.du && !e.thieu.length);
    const lops = Object.keys(DL.anhXa).sort();
    const keo = dsKeo();
    const boQua = tt.filter(e => e.daCoODich && (e.hoaNhap ? DL.keoHoaNhap : e.du));

    let h = '<div class="tt-canh"><b>Năm ' + chan(DL.nguon) + ' → năm ' + chan(DL.dich) + '</b><br>'
      + 'Khối 6, 7, 8 đang học: <b>' + tt.length + '</b> em · '
      + 'đủ điều kiện lên lớp: <b>' + du.length + '</b> · '
      + 'chưa đủ: <b>' + chuaDat.length + '</b> · '
      + 'thiếu dữ liệu chưa kết luận được: <b>' + thieuDL.length + '</b>'
      + (hoaNhap.length ? ' · hoà nhập (xét riêng): <b>' + hoaNhap.length + '</b>' : '')
      + (k9.length ? '<br>Khối 9: <b>' + k9.length + '</b> em — ra trường, không tịnh tiến.' : '')
      + '</div>';

    if (DL.bienMat) {
      h += '<div class="tt-canh tt-vang"><b>' + DL.bienMat + ' dòng xếp lớp không đọc được '
        + 'thông tin học sinh</b> — do phân quyền che, hoặc học sinh đã bị xoá khỏi bảng gốc. '
        + 'Các em này KHÔNG nằm trong con số ở trên và sẽ không được tịnh tiến. '
        + 'Nếu thầy cô đang đăng nhập bằng tài khoản giáo viên thì đăng nhập lại bằng '
        + 'tài khoản quản trị rồi làm lại.</div>';
    }

    /* Điều kiện (c) — đếm theo TỪNG EM chứ không phải "có một em là coi như đủ" */
    const soCoBn = tt.filter(e => e.bn != null).length;
    const duBa = soCoBn === tt.length && tt.length > 0;
    h += '<div class="tt-canh ' + (duBa ? 'tt-ok' : 'tt-vang') + '"><b>'
      + (duBa ? 'Đã kiểm đủ BA điều kiện lên lớp.'
              : 'Chưa kiểm đủ ba điều kiện cho tất cả các em.')
      + '</b><br>Điều 12 khoản 1 Thông tư 22 quy định ba điều kiện:<br>'
      + '· (a) Rèn luyện cả năm từ Đạt trở lên — <b>đã kiểm</b><br>'
      + '· (b) Học tập cả năm từ Đạt trở lên — <b>đã kiểm</b><br>'
      + '· (c) Nghỉ học không quá 45 buổi — '
      + (duBa ? '<b>đã kiểm</b> cho cả ' + tt.length + ' em'
             : '<b>mới có số buổi nghỉ của ' + soCoBn + '/' + tt.length + ' em</b>')
      + '</div>';

    if (!duBa) {
      h += '<div class="tt-canh tt-vang"><b>Hệ quả của việc thiếu số buổi nghỉ:</b><br>'
        + '· Em nào chưa có số buổi nghỉ thì <b>không ghi kết luận lên lớp</b> — cột '
        + 'len_lop để trống, nên CT10 và CT11 chưa có đủ số.<br>'
        + '· Việc tịnh tiến vẫn làm được, nhưng chỉ dựa trên hai điều kiện (a) và (b); '
        + 'điều kiện (c) nhà trường soát tay.<br>'
        + (DL.coCotBn
            ? '<span class="tt-nho">Bảng đã có chỗ lưu rồi — chỉ cần nạp lại sổ điểm VnEdu '
              + 'học kì II là có số buổi nghỉ.</span>'
            : '<span class="tt-nho">Chạy tệp sql/26 rồi nạp lại sổ điểm VnEdu học kì II '
              + 'là kiểm được cả ba.</span>')
        + '</div>';
    }

    h += '<div style="margin-top:14px"><b>Lớp nào lên lớp nào</b> — sửa được nếu trường xếp lại lớp:</div>'
      + '<div class="tbl-wrap"><table class="tt-bang"><thead><tr>'
      + '<th style="width:110px">Lớp cũ</th><th style="width:130px">Lớp mới</th>'
      + '<th style="width:110px">Đủ điều kiện</th><th style="width:120px">Chưa đủ</th>'
      + '<th>Thiếu dữ liệu</th></tr></thead><tbody>'
      + lops.map(l => {
          const e = thuong.filter(x => x.lop === l);
          const d = e.filter(x => x.du).length;
          const t = e.filter(x => !x.du && x.thieu.length).length;
          const c = e.filter(x => !x.du && !x.thieu.length).length;
          return '<tr><td><b>' + chan(l) + '</b></td>'
            + '<td><input type="text" data-lop="' + chan(l) + '" value="' + chan(DL.anhXa[l]) + '"></td>'
            + '<td>' + d + '</td>'
            + '<td>' + (c ? c + ' em' : '—') + '</td>'
            + '<td>' + (t ? t + ' em' : '—') + '</td></tr>';
        }).join('')
      + '</tbody></table></div>';

    if (hoaNhap.length) {
      h += '<div class="tt-canh tt-vang"><b>' + hoaNhap.length + ' em học hoà nhập — '
        + 'Thông tư 22 đánh giá riêng</b><br>'
        + 'Các em này được đánh giá theo <b>kế hoạch giáo dục cá nhân</b>, phần mềm không '
        + 'có kế hoạch đó nên <b>không xét thay hội đồng</b>. Dù có chọn ô dưới đây, em cũng '
        + 'chỉ tạo dòng xếp lớp cho năm mới chứ <b>không ghi kết luận lên lớp</b>.<br>'
        + hoaNhap.slice(0, 10).map(e => chan('· ' + e.lop + ' · ' + e.ten)).join('<br>')
        + (hoaNhap.length > 10 ? '<br>… và ' + (hoaNhap.length - 10) + ' em nữa.' : '')
        + '<label class="tt-tick"><input type="checkbox" id="ttHn"' + (DL.keoHoaNhap ? ' checked' : '')
        + '><span>Chuyển cả ' + hoaNhap.length + ' em hoà nhập sang năm mới theo bảng lớp ở trên '
        + '(chỉ là việc xếp lớp, không phải kết luận lên lớp)</span></label></div>';
    }

    if (thieuDL.length) {
      h += '<div class="tt-canh tt-vang"><b>' + thieuDL.length
        + ' em THIẾU DỮ LIỆU — chưa kết luận được, sẽ không tạo dòng ở năm mới:</b><br>'
        + thieuDL.slice(0, 15).map(e => chan('· ' + e.lop + ' · ' + e.ten + ' — ' + e.thieu.join(', '))).join('<br>')
        + (thieuDL.length > 15 ? '<br>… và ' + (thieuDL.length - 15) + ' em nữa.' : '')
        + '<br><br><b>Thiếu dữ liệu không phải là lưu ban.</b> Em không ghi kết luận gì cho '
        + 'các em này, để cột lên lớp trống, tránh bị đếm nhầm thành lưu ban trong báo cáo. '
        + 'Nạp đủ dữ liệu rồi chạy lại là các em vào đúng chỗ.</div>';
    }

    if (chuaDat.length) {
      h += '<div class="tt-canh tt-do"><b>' + chuaDat.length
        + ' em chưa đủ điều kiện — sẽ KHÔNG được tạo dòng ở năm mới:</b><br>'
        + chuaDat.slice(0, 15).map(e => chan('· ' + e.lop + ' · ' + e.ten + ' — học tập: '
            + e.xl + ', rèn luyện: ' + e.rl
            + (e.bn != null && e.bn > 45 ? ', nghỉ ' + e.bn + ' buổi (quá 45)' : ''))).join('<br>')
        + (chuaDat.length > 15 ? '<br>… và ' + (chuaDat.length - 15) + ' em nữa.' : '')
        + '<br><br>Điều 13 và 14 Thông tư 22 còn cho <b>rèn luyện lại và kiểm tra lại '
        + 'trong kì nghỉ hè</b>. Đó là việc của hội đồng nhà trường, không phải việc của '
        + 'phần mềm — nên em không tự quyết. Hội đồng xét xong thì thêm tay các em đó.</div>';
    }

    if (DL.soODich) {
      h += '<div class="tt-canh"><b>Năm ' + chan(DL.dich) + ' đã có sẵn ' + DL.soODich
        + ' dòng xếp lớp.</b><br>'
        + 'Em <b>không đụng tới một dòng nào trong số đó</b> — chỉ thêm em nào chưa có. '
        + 'Bấm hai lần cũng không nhân đôi, và lớp đã xếp lại bằng tay vẫn giữ nguyên.'
        + (boQua.length ? '<br>Trong danh sách lần này có <b>' + boQua.length
            + '</b> em đã có dòng ở năm ' + chan(DL.dich) + ' rồi nên sẽ bỏ qua.' : '')
        + '</div>';
    }

    /* Ghi kết luận lên lớp: CHỈ cho em kiểm được đủ ba điều kiện, và không phải hoà nhập */
    const seGhiLen = DL.em.filter(e => !e.hoaNhap && e.kiemDuBa && e.datHai).length;
    const seGhiLai = DL.em.filter(e => !e.hoaNhap && e.kiemDuBa && !e.datHai).length;
    const khongGhi = DL.em.filter(e => e.hoaNhap || !e.kiemDuBa).length;

    h += '<div class="tt-canh"><b>Sẽ ghi những gì:</b><br>'
      + '· Thêm <b>' + keo.length + '</b> dòng xếp lớp cho năm ' + chan(DL.dich)
      + ', khối cộng thêm 1, trạng thái "đang học". Em nào đã có dòng thì bỏ qua, '
      + '<b>không ghi đè</b>.<br>'
      + '· <b>Không</b> sửa, không xoá bất kỳ dòng nào đã có ở năm ' + chan(DL.dich) + '.<br>'
      + '· <b>Không</b> tạo học sinh mới — các em đã có sẵn trong hệ thống, chỉ thêm dòng lớp.<br>'
      + '· Ghi kết luận lên lớp vào năm ' + chan(DL.nguon) + ' cho <b>' + seGhiLen
      + '</b> em lên lớp và <b>' + seGhiLai + '</b> em ở lại — đây là số cho chỉ tiêu '
      + 'CT10 và CT11 của Phụ lục 5, tính cả khối 9.<br>'
      + (khongGhi ? '· <b>' + khongGhi + '</b> em <b>không ghi kết luận</b> (thiếu dữ liệu '
          + 'hoặc học hoà nhập) — để trống chứ không ghi là lưu ban.<br>' : '')
      + '· Kết luận "ở lại" <b>không đè lên</b> kết luận nào hội đồng đã ghi sẵn.</div>';

    h += '<div class="tt-chon">'
      + (keo.length || seGhiLen || seGhiLai
          ? '<button class="btn btn-pri" id="ttGhi">✅ Tịnh tiến ' + keo.length + ' em</button>' : '')
      + '<button class="btn btn-out" id="ttLai">← Chọn lại năm</button>' + nutVe() + '</div>';

    ve(h);
    (HOP || document).querySelectorAll('[data-lop]').forEach(o =>
      o.addEventListener('input', function () {
        DL.anhXa[this.dataset.lop] = this.value.trim().toUpperCase();
      }));
    const hn = document.getElementById('ttHn');
    if (hn) hn.addEventListener('change', function () { DL.keoHoaNhap = this.checked; veXemTruoc(); });
    const g = document.getElementById('ttGhi');
    if (g) g.addEventListener('click', veXacNhan);
    const l = document.getElementById('ttLai');
    if (l) l.addEventListener('click', () => mo(HOP));
    ganVe();
  }

  /* ==========================================================================
     XÁC NHẬN — một bước nữa trước khi động vào cơ sở dữ liệu
     ========================================================================== */
  function veXacNhan() {
    const keo = dsKeo();
    const seGhiLen = DL.em.filter(e => !e.hoaNhap && e.kiemDuBa && e.datHai).length;
    const seGhiLai = DL.em.filter(e => !e.hoaNhap && e.kiemDuBa && !e.datHai).length;
    ve('<div class="tt-canh tt-vang"><b>Xác nhận trước khi ghi</b><br>'
      + 'Thầy cô đọc lại một lượt rồi hãy bấm:<br><br>'
      + '· Lấy danh sách từ năm <b>' + chan(DL.nguon) + '</b><br>'
      + '· Đẩy sang năm <b>' + chan(DL.dich) + '</b><br>'
      + '· Thêm mới <b>' + keo.length + '</b> dòng xếp lớp<br>'
      + '· Ghi kết luận lên lớp cho <b>' + (seGhiLen + seGhiLai) + '</b> em vào năm '
      + chan(DL.nguon) + '<br><br>'
      + 'Không dòng nào đã có bị sửa hay xoá.</div>'
      + '<div class="tt-chon">'
      + '<button class="btn btn-pri" id="ttThat">✅ Đúng rồi, ghi vào cơ sở dữ liệu</button>'
      + '<button class="btn btn-out" id="ttHuy">← Xem lại</button>' + nutVe() + '</div>');
    const t = document.getElementById('ttThat');
    if (t) t.addEventListener('click', ghi);
    const h = document.getElementById('ttHuy');
    if (h) h.addEventListener('click', veXemTruoc);
    ganVe();
  }

  /* ==========================================================================
     GHI
     ========================================================================== */
  async function ghi() {
    const s = sb();
    const nut = document.getElementById('ttThat');
    if (nut) { nut.disabled = true; nut.textContent = 'Đang ghi…'; }

    const loiLop = [];
    const keo = dsKeo();
    const hl = [];
    keo.forEach(e => {
      const moi = (DL.anhXa[e.lop] || '').trim().toUpperCase();
      if (!/^\d{1,2}[A-ZÀ-Ỹ]\d*$/.test(moi)) { loiLop.push(e.lop + ' → "' + moi + '"'); return; }
      const khoi = parseInt(moi, 10);
      if (!(khoi >= 6 && khoi <= 9)) { loiLop.push(e.lop + ' → "' + moi + '" ngoài khối 6–9'); return; }
      hl.push({ hoc_sinh_ma: e.ma, nam_hoc: DL.dich, lop: moi, khoi: khoi, trang_thai: 'dang_hoc' });
    });

    if (loiLop.length) {
      ve('<div class="tt-canh tt-do"><b>Tên lớp mới không hợp lệ, chưa ghi gì cả:</b><br>'
        + Array.from(new Set(loiLop)).slice(0, 10).map(chan).join('<br>')
        + '<br>Tên lớp phải dạng 7A, 8B, 9C.</div>'
        + '<div class="tt-chon"><button class="btn btn-out" id="ttLai2">← Sửa lại</button>'
        + nutVe() + '</div>');
      const l2 = document.getElementById('ttLai2');
      if (l2) l2.addEventListener('click', veXemTruoc);
      ganVe();
      return;
    }

    const y = [];
    /* ignoreDuplicates: ON CONFLICT DO NOTHING. Em nào đã có dòng ở năm đích thì
       giữ nguyên tất cả — trạng thái, lớp đã xếp lại bằng tay, mọi thứ. Bấm hai
       lần cũng không nhân đôi mà cũng không đè. */
    let daThem = 0;
    for (let i = 0; i < hl.length; i += 400) {
      if (nut) nut.textContent = 'Đang ghi… ' + Math.min(i + 400, hl.length) + '/' + hl.length;
      const r = await s.from('hoc_sinh_lop')
        .upsert(hl.slice(i, i + 400), { onConflict: 'hoc_sinh_ma,nam_hoc', ignoreDuplicates: true })
        .select('id');
      if (r.error) {
        const cau = window.hsLoiTiengViet ? window.hsLoiTiengViet(r.error, 'xếp lớp')
                                          : r.error.message;
        xong(['✖ Dừng lại sau khi đã thêm ' + daThem + ' em. ' + cau], false);
        return;
      }
      daThem += (r.data || []).length;
    }
    y.push('Đã tịnh tiến ' + daThem + ' em sang năm học ' + DL.dich + '.');
    if (hl.length - daThem > 0) {
      y.push((hl.length - daThem) + ' em đã có dòng ở năm ' + DL.dich + ' từ trước — giữ nguyên, không đụng.');
    }

    /* ------------------------------------------------------------------------
       GHI KẾT LUẬN LÊN LỚP VÀO NĂM NGUỒN

       Cột len_lop chảy thẳng vào CT10 (lên lớp) và CT11 (bỏ học, lưu ban) của
       Phụ lục 5 gửi Sở. Nên chỉ ghi khi kiểm được ĐỦ BA điều kiện. Thiếu bất
       kỳ điều nào — kể cả chỉ thiếu số buổi nghỉ — thì để trống, vì "chưa biết"
       mà ghi thành false là biến em đó thành số liệu lưu ban trong báo cáo.

       Học sinh hoà nhập không ghi: Thông tư 22 đánh giá theo kế hoạch giáo dục
       cá nhân, phần mềm không có kế hoạch đó.

       Khối 9 CÓ ghi — các em không tịnh tiến nhưng vẫn cần kết luận cuối cấp,
       và CT10/CT11 tính cả khối 9.

       Mỗi mẻ 200 mã vì danh sách mã đi trong ĐƯỜNG DẪN chứ không trong thân.
       ------------------------------------------------------------------------ */
    const len  = DL.em.filter(e => !e.hoaNhap && e.kiemDuBa && e.datHai).map(e => e.ma);
    const oLai = DL.em.filter(e => !e.hoaNhap && e.kiemDuBa && !e.datHai).map(e => e.ma);
    let loiLen = '', ghiLen = 0, ghiLai = 0;

    for (let i = 0; i < len.length && !loiLen; i += 200) {
      const r = await s.from('hoc_sinh_lop').update({ len_lop: true })
        .eq('nam_hoc', DL.nguon).in('hoc_sinh_ma', len.slice(i, i + 200)).select('id');
      if (r.error) loiLen = r.error.message; else ghiLen += (r.data || []).length;
    }
    /* Kết luận "ở lại" chỉ ghi vào ô CÒN TRỐNG. Hội đồng xét lại hè, đặt tay
       cho em nào lên lớp thì quyết định đó phải được giữ. */
    for (let i = 0; i < oLai.length && !loiLen; i += 200) {
      const r = await s.from('hoc_sinh_lop').update({ len_lop: false })
        .eq('nam_hoc', DL.nguon).is('len_lop', null)
        .in('hoc_sinh_ma', oLai.slice(i, i + 200)).select('id');
      if (r.error) loiLen = r.error.message; else ghiLai += (r.data || []).length;
    }

    const khongGhi = DL.em.filter(e => e.hoaNhap || !e.kiemDuBa).length;
    if (loiLen) {
      y.push('⚠ Chưa ghi được kết luận lên lớp vào năm ' + DL.nguon + ': ' + loiLen);
    } else if (!len.length && !oLai.length) {
      y.push('Chưa ghi kết luận lên lớp cho em nào, vì chưa em nào kiểm đủ ba điều kiện '
           + '(còn thiếu số buổi nghỉ). CT10 và CT11 vì vậy chưa có số.');
    } else {
      y.push('Đã ghi kết luận vào năm ' + DL.nguon + ': ' + ghiLen + ' em lên lớp, '
           + ghiLai + ' em ở lại. Đây là số cho chỉ tiêu CT10 và CT11.');
      if (oLai.length - ghiLai > 0) {
        y.push((oLai.length - ghiLai) + ' em đã có sẵn kết luận của hội đồng — em giữ nguyên, không đè.');
      }
      if (khongGhi) {
        y.push(khongGhi + ' em để trống kết luận (thiếu dữ liệu hoặc học hoà nhập) — '
             + 'không ghi là lưu ban.');
      }
    }

    xong(y, true);
  }

  function xong(y, ok) {
    ve('<div class="tt-canh ' + (ok ? 'tt-ok' : 'tt-do') + '"><b>'
      + (ok ? '✅ ĐÃ LƯU VÀO CƠ SỞ DỮ LIỆU.' : 'Dừng giữa chừng.') + '</b><br>'
      + y.map(chan).join('<br>')
      + (ok ? '<br><br><b>Việc còn lại:</b> nhập danh sách <b>khối 6 mới</b> — các em vừa từ '
            + 'tiểu học lên, không suy ra được từ dữ liệu cũ. Dùng nút "Tải mẫu danh sách".<br>'
            + 'Sau đó bấm <b>"Tính lại 33 chỉ tiêu"</b> cho năm ' + chan(DL.nguon)
            + ' để CT10 và CT11 có số.' : '')
      + '</div>' + '<div class="tt-chon">' + nutVe() + '</div>');
    if (ok && typeof window.hocSinhNoiLai === 'function') {
      window.hocSinhNoiLai().catch(e => console.error(e));
    }
    ganVe();
  }

  function nutVe() {
    return '<button class="btn btn-out" id="ttVe">← Về màn hình học sinh</button>';
  }
  function ganVe() {
    const v = document.getElementById('ttVe');
    if (v) v.addEventListener('click', () => { DL = null; if (window.hsVeLai) window.hsVeLai(HOP); });
  }
  function ve(html) {
    const h = HOP || document.getElementById('dbclKhac');
    if (h) { h.innerHTML = html; h.scrollTop = 0; }
  }

  window.tinhTienLop = mo;
})();
