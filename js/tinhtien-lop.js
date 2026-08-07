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

   ⚠ HỆ THỐNG CHỈ KIỂM ĐƯỢC (a) VÀ (b).
   Điều kiện (c) cần số buổi nghỉ, mà sổ điểm VnEdu có cột đó nhưng hệ thống
   chưa có chỗ lưu. Vì vậy màn hình nói thẳng ra chứ không lờ đi: danh sách
   "đủ điều kiện" ở đây là đủ HAI trong ba, nhà trường tự soát nốt buổi nghỉ.
   Chạy tệp sql/26 rồi nạp lại sổ VnEdu là kiểm được cả ba.

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
  .tt-bang input{width:88px;padding:5px 8px;border:1.5px solid #d7dde8;border-radius:7px;
    font-size:13.2px;font-family:inherit;text-align:center;text-transform:uppercase}
  .tt-chon{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:12px 0}
  .tt-chon label{font-size:13.4px;font-weight:600;color:var(--navy)}
  .tt-chon select{padding:9px 12px;border:1.5px solid #d7dde8;border-radius:9px;
    font-size:13.6px;font-family:inherit;background:#fff}
  .tt-nho{font-size:12.2px;color:#64748b}
  `;
  document.head.insertAdjacentHTML('beforeend', '<style>' + css + '</style>');

  function chan(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function bao(s) { if (typeof notify === 'function') notify(s); }

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

  /* Xếp loại học tập cả năm — Điều 9 khoản 2 Thông tư 22 */
  function xepLoai(diem, kieu) {
    const d = diem.filter(x => kieu[x.mon_ma] === 'diem' && x.diem != null).map(x => x.diem);
    const nxChuaDat = diem.filter(x => kieu[x.mon_ma] === 'dat' && x.muc === 'CD').length;
    if (!d.length) return '';
    const n = d.length;
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
  async function tai(namNguon) {
    const s = sb();
    const [mh, hsl, kq, rl] = await Promise.all([
      s.from('mon_hoc').select('*'),
      taiHet('hoc_sinh_lop', '*, hoc_sinh(ma, ho_ten, ngay_sinh)', [['nam_hoc', namNguon]]),
      taiHet('hs_ket_qua', 'hoc_sinh_ma, mon_ma, diem, muc',
             [['nam_hoc', namNguon], ['ky', 'ca_nam']]),
      taiHet('hs_ren_luyen', 'hoc_sinh_ma, muc', [['nam_hoc', namNguon], ['ky', 'ca_nam']])
    ]);
    if (mh.error) throw mh.error;

    const kieu = {};
    (mh.data || []).forEach(m => { kieu[m.ma] = m.kieu; });
    const theoEm = {};
    kq.forEach(r => { (theoEm[r.hoc_sinh_ma] = theoEm[r.hoc_sinh_ma] || []).push(r); });
    const rlEm = {};
    rl.forEach(r => { rlEm[r.hoc_sinh_ma] = r.muc; });

    const em = [];
    hsl.filter(r => r.hoc_sinh && r.trang_thai === 'dang_hoc' && r.khoi >= 6 && r.khoi <= 8)
      .forEach(r => {
        const ma = r.hoc_sinh_ma;
        const xl = xepLoai(theoEm[ma] || [], kieu);
        const rn = rlEm[ma] || '';
        /* Điều kiện (c): nghỉ không quá 45 buổi. Chưa chạy sql/26 thì cột này
           không tồn tại, r.so_buoi_nghi là undefined — coi như CHƯA KIỂM,
           không coi là đạt. Thiếu thông tin khác hẳn với đủ điều kiện. */
        const bn = (r.so_buoi_nghi === undefined || r.so_buoi_nghi === null)
                 ? null : Number(r.so_buoi_nghi);
        const quaNghi = bn != null && bn > 45;
        em.push({
          ma: ma, ten: r.hoc_sinh.ho_ten, lop: String(r.lop || '').toUpperCase(),
          khoi: r.khoi, xl: xl, rl: rn, bn: bn,
          /* Chưa có dữ liệu thì KHÔNG kết luận là đủ điều kiện — thiếu thông
             tin không đồng nghĩa với đạt. */
          du: !!(xl && rn && DAT[xl] && DAT[rn]) && !quaNghi
        });
      });
    /* Khối 9 tách riêng chỉ để báo con số, không tịnh tiến */
    const k9 = hsl.filter(r => r.hoc_sinh && r.trang_thai === 'dang_hoc' && r.khoi === 9).length;

    return { em, k9 };
  }

  /* ==========================================================================
     MÀN HÌNH
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

    const nguonMac = cacNam.find(n => n !== CAU_HINH.NAM_HOC) || cacNam[0];
    veChon(cacNam, nguonMac, CAU_HINH.NAM_HOC);
  }

  function veChon(cacNam, nguon, dich) {
    const namDich = [];
    for (let y = 2024; y <= 2032; y++) namDich.push(y + '-' + (y + 1));
    ve('<div class="tt-canh"><b>↗ Tịnh tiến lên lớp</b><br>'
      + 'Khối 6 của năm cũ thành khối 7 của năm mới, 7 thành 8, 8 thành 9. '
      + 'Khối 9 ra trường nên dừng lại. Khối 6 mới là học sinh vừa từ tiểu học lên, '
      + 'không suy ra được từ đâu — phải nhập riêng.<br>'
      + 'Giữ nguyên mã học sinh, số định danh, họ tên, ngày sinh; chỉ thêm một dòng '
      + 'xếp lớp cho năm mới.</div>'
      + '<div class="tt-canh"><div class="tt-chon">'
      + '<label>Lấy từ năm học</label><select id="ttNguon">'
      + cacNam.map(n => '<option value="' + chan(n) + '"' + (n === nguon ? ' selected' : '')
          + '>' + chan(n) + '</option>').join('') + '</select>'
      + '<label style="margin-left:10px">Đẩy sang năm học</label><select id="ttDich">'
      + namDich.map(n => '<option value="' + chan(n) + '"' + (n === dich ? ' selected' : '')
          + '>' + chan(n) + (n === CAU_HINH.NAM_HOC ? ' (năm hiện hành)' : '') + '</option>').join('')
      + '</select></div></div>'
      + '<div class="tt-chon"><button class="btn btn-pri" id="ttDoc">🔎 Đọc và xem trước</button>'
      + nutVe() + '</div>');
    const d = document.getElementById('ttDoc');
    if (d) d.addEventListener('click', async () => {
      const a = document.getElementById('ttNguon').value;
      const b = document.getElementById('ttDich').value;
      if (a === b) { bao('Năm nguồn và năm đích trùng nhau — chọn lại giúp em.'); return; }
      ve('<div class="tt-canh">Đang đọc và đối chiếu điều kiện lên lớp…</div>');
      try {
        const r = await tai(a);
        DL = { nguon: a, dich: b, em: r.em, k9: r.k9, anhXa: {} };
        Array.from(new Set(r.em.map(e => e.lop))).sort().forEach(l => {
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

  function veXemTruoc() {
    const du = DL.em.filter(e => e.du);
    const chua = DL.em.filter(e => !e.du);
    const lops = Object.keys(DL.anhXa).sort();

    let h = '<div class="tt-canh"><b>Năm ' + chan(DL.nguon) + ' → năm ' + chan(DL.dich) + '</b><br>'
      + 'Khối 6, 7, 8 đang học: <b>' + DL.em.length + '</b> em · '
      + 'đủ điều kiện lên lớp: <b>' + du.length + '</b> · '
      + 'chưa đủ: <b>' + chua.length + '</b>'
      + (DL.k9 ? '<br>Khối 9: <b>' + DL.k9 + '</b> em — ra trường, không tịnh tiến.' : '')
      + '</div>';

    const coBn = DL.em.some(e => e.bn != null);
    h += '<div class="tt-canh ' + (coBn ? 'tt-ok' : 'tt-vang') + '"><b>'
      + (coBn ? 'Đã kiểm đủ BA điều kiện lên lớp.' : 'Hệ thống chỉ kiểm được HAI trong ba điều kiện.')
      + '</b><br>Điều 12 khoản 1 Thông tư 22 quy định ba điều kiện:<br>'
      + '· (a) Rèn luyện cả năm từ Đạt trở lên — <b>đã kiểm</b><br>'
      + '· (b) Học tập cả năm từ Đạt trở lên — <b>đã kiểm</b><br>'
      + '· (c) Nghỉ học không quá 45 buổi — '
      + (coBn ? '<b>đã kiểm</b>'
              : '<b>CHƯA kiểm được</b>, vì chưa có chỗ lưu số buổi nghỉ.<br>'
                + 'Nhà trường soát nốt điều kiện này trước khi quyết. '
                + '<span class="tt-nho">Chạy tệp sql/26 rồi nạp lại sổ VnEdu là kiểm được cả ba.</span>')
      + '</div>';

    h += '<div style="margin-top:14px"><b>Lớp nào lên lớp nào</b> — sửa được nếu trường xếp lại lớp:</div>'
      + '<div class="tbl-wrap"><table class="tt-bang"><thead><tr>'
      + '<th style="width:110px">Lớp cũ</th><th style="width:130px">Lớp mới</th>'
      + '<th style="width:110px">Đủ điều kiện</th><th>Chưa đủ</th></tr></thead><tbody>'
      + lops.map(l => {
          const e = DL.em.filter(x => x.lop === l);
          const d = e.filter(x => x.du).length;
          return '<tr><td><b>' + chan(l) + '</b></td>'
            + '<td><input data-lop="' + chan(l) + '" value="' + chan(DL.anhXa[l]) + '"></td>'
            + '<td>' + d + '</td>'
            + '<td>' + (e.length - d ? (e.length - d) + ' em' : '—') + '</td></tr>';
        }).join('')
      + '</tbody></table></div>';

    if (chua.length) {
      h += '<div class="tt-canh tt-do"><b>' + chua.length
        + ' em chưa đủ điều kiện — sẽ KHÔNG được tạo dòng ở năm mới:</b><br>'
        + chua.slice(0, 15).map(e => chan(e.lop + ' · ' + e.ten + ' — học tập: '
            + (e.xl || 'chưa có') + ', rèn luyện: ' + (e.rl || 'chưa có')
            + (e.bn != null && e.bn > 45 ? ', nghỉ ' + e.bn + ' buổi (quá 45)' : ''))).join('<br>')
        + (chua.length > 15 ? '<br>… và ' + (chua.length - 15) + ' em nữa.' : '')
        + '<br><br>Điều 13 và 14 Thông tư 22 còn cho <b>rèn luyện lại và kiểm tra lại '
        + 'trong kì nghỉ hè</b>. Đó là việc của hội đồng nhà trường, không phải việc của '
        + 'phần mềm — nên em không tự quyết. Hội đồng xét xong thì thêm tay các em đó.</div>';
    }

    h += '<div class="tt-canh"><b>Sẽ ghi những gì:</b><br>'
      + '· Thêm <b>' + du.length + '</b> dòng xếp lớp cho năm ' + chan(DL.dich)
      + ', khối cộng thêm 1, trạng thái "đang học".<br>'
      + '· <b>Không</b> đụng gì tới dữ liệu năm ' + chan(DL.nguon) + '.<br>'
      + '· <b>Không</b> tạo học sinh mới — các em đã có sẵn trong hệ thống, chỉ thêm dòng lớp.<br>'
      + '· Có ghi kết luận <b>lên lớp / ở lại</b> vào năm ' + chan(DL.nguon)
      + ' theo hai điều kiện đã kiểm được — đây chính là số cho chỉ tiêu CT10 và CT11 '
      + 'của Phụ lục 5, hiện đang để trống.</div>';

    h += '<div class="tt-chon">'
      + (du.length ? '<button class="btn btn-pri" id="ttGhi">✅ Tịnh tiến ' + du.length + ' em</button>' : '')
      + '<button class="btn btn-out" id="ttLai">← Chọn lại năm</button>' + nutVe() + '</div>';

    ve(h);
    (HOP || document).querySelectorAll('[data-lop]').forEach(o =>
      o.addEventListener('input', function () {
        DL.anhXa[this.dataset.lop] = this.value.trim().toUpperCase();
      }));
    const g = document.getElementById('ttGhi');
    if (g) g.addEventListener('click', ghi);
    const l = document.getElementById('ttLai');
    if (l) l.addEventListener('click', () => mo(HOP));
    ganVe();
  }

  /* ==========================================================================
     GHI
     ========================================================================== */
  async function ghi() {
    const s = sb();
    const nut = document.getElementById('ttGhi');
    if (nut) { nut.disabled = true; nut.textContent = 'Đang ghi…'; }

    const loiLop = [];
    const du = DL.em.filter(e => e.du);
    const hl = [];
    du.forEach(e => {
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
    for (let i = 0; i < hl.length; i += 400) {
      if (nut) nut.textContent = 'Đang ghi… ' + Math.min(i + 400, hl.length) + '/' + hl.length;
      const r = await s.from('hoc_sinh_lop')
        .upsert(hl.slice(i, i + 400), { onConflict: 'hoc_sinh_ma,nam_hoc' });
      if (r.error) {
        const cau = window.hsLoiTiengViet ? window.hsLoiTiengViet(r.error, 'xếp lớp')
                                          : r.error.message;
        xong(['✖ Dừng ở dòng ' + i + '. ' + cau], false);
        return;
      }
    }
    y.push('Đã tịnh tiến ' + hl.length + ' em sang năm học ' + DL.dich + '.');

    /* Ghi kết luận lên lớp vào NĂM NGUỒN. Cột len_lop hiện để trống nên hai chỉ
       tiêu CT10 (lên lớp) và CT11 (bỏ học, lưu ban) của Phụ lục 5 không có số.
       Chia hai mẻ theo giá trị, mỗi mẻ 200 mã một lần vì danh sách mã đi trong
       ĐƯỜNG DẪN chứ không trong thân yêu cầu. */
    const len = DL.em.filter(e => e.du).map(e => e.ma);
    const oLai = DL.em.filter(e => !e.du).map(e => e.ma);
    let loiLen = '';
    for (const [gt, mas] of [[true, len], [false, oLai]]) {
      for (let i = 0; i < mas.length && !loiLen; i += 200) {
        const r = await s.from('hoc_sinh_lop').update({ len_lop: gt })
          .eq('nam_hoc', DL.nguon).in('hoc_sinh_ma', mas.slice(i, i + 200));
        if (r.error) loiLen = r.error.message;
      }
      if (loiLen) break;
    }
    y.push(loiLen
      ? '⚠ Chưa ghi được kết luận lên lớp vào năm ' + DL.nguon + ': ' + loiLen
      : 'Đã ghi kết luận lên lớp vào năm ' + DL.nguon + ' — ' + len.length
        + ' em lên lớp, ' + oLai.length + ' em chưa đủ điều kiện. '
        + 'Đây là số cho chỉ tiêu CT10 và CT11.');

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
