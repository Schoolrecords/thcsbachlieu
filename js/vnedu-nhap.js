/* ============================================================================
   NẠP THẲNG SỔ ĐIỂM VnEdu

   Trường tải từ VnEdu về bốn tệp "so_diem_tong_ket_khoi_*.xls", mỗi tệp một
   khối, mỗi TRANG TÍNH một lớp. Tệp đó đã có sẵn đủ mọi thứ hệ thống cần:
   mã học sinh, số định danh, họ tên, ngày sinh, điểm 12 môn và kết quả rèn
   luyện. Trước đây ban giám hiệu phải chép sang mẫu của hệ thống — vừa mất
   công vừa có chỗ cho lỗi chép nhầm. Nay thả thẳng tệp gốc vào.

   BỐ CỤC TỆP VnEdu (đã đối chiếu tệp thật của trường, HK2 2025-2026)

     dòng 0  ô 7   BẢNG TỔNG HỢP KẾT QUẢ GIÁO DỤC HỌC KỲ 2, …
     dòng 1  ô 7   Khối 6 - Lớp 6A - (Học kỳ 2)
     dòng 5        STT · Mã học sinh · Số định danh cá nhân · Họ và tên ·
                   Ngày sinh · 8 môn tính điểm · 4 môn nhận xét ·
                   Kết quả học tập · Kết quả rèn luyện · Buổi nghỉ · Ghi chú
     dòng 6        dòng phụ: (HS 1) · (N.xét) · (Học kỳ 2) · P/K/Tổng
     dòng 7+       dữ liệu

   HAI ĐIỀU KHÔNG ĐOÁN, PHẢI HỎI NGƯỜI DÙNG

   1. VnEdu ghi "Học kỳ 2", mà hệ thống chỉ có hai kỳ: Học kì I và Cả năm
      (theo Thông tư 22, kết quả cả năm mới là cái đi vào báo cáo). Không có
      chỗ nào nói chắc HK2 của VnEdu là cả năm hay chỉ nửa sau. Nên màn hình
      HỎI LẠI, không tự quy đổi.

   2. Cột "Kết quả học tập" của VnEdu KHÔNG nạp vào. Hệ thống tự xếp loại từ
      điểm theo Điều 9 Thông tư 22 — nạp thêm bản của VnEdu là có hai nguồn
      cho một con số, lệch nhau thì không biết tin bên nào. Nhưng vẫn ĐỌC để
      đối chiếu và báo chỗ vênh, đó mới là chỗ đáng giá.
   ============================================================================ */

(function () {
  'use strict';

  if (typeof CAU_HINH === 'undefined' || !CAU_HINH.DA_NOI) return;

  const sb = () => window.sbClient;
  let HOP = null, KQ = null;   // KQ = kết quả đọc được, chờ duyệt

  const css = `
  .vn-canh{background:#eef4ff;border:1px solid #cfe0ff;color:#1d4ed8;border-radius:10px;
    padding:12px 15px;font-size:13.6px;margin:11px 0;line-height:1.65}
  .vn-do{background:#fdf3f2;border-color:#f3c9c5;color:#8a3428}
  .vn-vang{background:#fff8e8;border-color:#f0d089;color:#7a5410}
  .vn-ok{background:#f2fdf6;border-color:#bfe8cd;color:#1a6437}
  .vn-bang{width:100%;border-collapse:collapse;font-size:13.4px;margin-top:8px}
  .vn-bang th{background:#eef3fb;color:#14306b;font-weight:700;padding:8px 9px;
    border:1px solid #dbe3ef;font-size:12.5px;text-align:left;white-space:nowrap}
  .vn-bang td{border:1px solid #e4e9f2;padding:6px 9px}
  .vn-chon{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:12px 0}
  .vn-chon label{font-size:13.4px;font-weight:600;color:var(--navy)}
  .vn-chon select{padding:9px 12px;border:1.5px solid #d7dde8;border-radius:9px;
    font-size:13.6px;font-family:inherit;background:#fff}
  .vn-nho{font-size:12.2px;color:#64748b}
  `;
  document.head.insertAdjacentHTML('beforeend', '<style>' + css + '</style>');

  function chan(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function bao(s) { if (typeof notify === 'function') notify(s); }
  function khongDau(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  /* Tên cột môn trong sổ VnEdu → mã môn trong danh mục Chương trình GDPT 2018 */
  const MON_VNEDU = {
    'toan': 'TOAN', 'ls&dl': 'LSDL', 'lich su & dia li': 'LSDL', 'khtn': 'KHTN',
    'tin': 'TIN', 'tin hoc': 'TIN', 'van': 'NV', 'ngu van': 'NV',
    'ng.ngu': 'NN1', 'ngoai ngu': 'NN1', 'tieng anh': 'NN1',
    'gdcd': 'GDCD', 'c.nghe': 'CN', 'cong nghe': 'CN', 'gdtc': 'GDTC',
    'nghe thuat': 'NT', 'ndgdcdp': 'GDDP', 'hdtn&hn': 'TNHN'
  };

  /* ==========================================================================
     ĐỌC MỘT TRANG TÍNH = MỘT LỚP
     ========================================================================== */
  function docTrang(ws, tenTrang, MON) {
    const hang = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });

    /* Dòng tiêu đề: SO KHỚP CHÍNH XÁC từng ô và đòi hai cột cùng lúc. Dò chuỗi
       con thì câu "BẢNG TỔNG HỢP KẾT QUẢ…" cũng lọt — đúng lỗi đã chặn cả
       module học sinh suốt một phiên. */
    let iTd = -1;
    for (let i = 0; i < Math.min(hang.length, 20); i++) {
      const d = (hang[i] || []).map(x => String(x).trim().toLowerCase());
      if (d.indexOf('mã học sinh') >= 0 && d.indexOf('họ và tên') >= 0) { iTd = i; break; }
    }
    if (iTd < 0) return { bo: true, ly: 'không tìm thấy dòng tiêu đề' };

    const td = (hang[iTd] || []).map(x => String(x).trim());
    const chiSo = t => td.findIndex(x => x.toLowerCase() === t);
    const iMa = chiSo('mã học sinh');
    const iTen = chiSo('họ và tên');
    const iDd = chiSo('số định danh cá nhân');
    const iNs = chiSo('ngày sinh');
    const iRl = td.findIndex(x => khongDau(x) === 'ket qua ren luyen');
    const iHt = td.findIndex(x => khongDau(x) === 'ket qua hoc tap');

    /* Cột môn — bỏ qua mọi cột không phải môn (Kết quả…, Buổi nghỉ, Ghi chú) */
    const cotMon = [];
    td.forEach((t, i) => {
      const ma = MON_VNEDU[khongDau(t)];
      if (!ma) return;
      const m = MON.find(x => x.ma === ma);
      if (m) cotMon.push({ mon: m, i: i });
    });

    /* Lớp: lấy từ TÊN TRANG TÍNH ('6a' → '6A'), đối chiếu với dòng tiêu đề
       "Khối 6 - Lớp 6A - (Học kỳ 2)" ở đầu tệp cho chắc. */
    let lop = String(tenTrang || '').trim().toUpperCase();
    let lopTd = '';
    hang.slice(0, 5).forEach(r => (r || []).forEach(o => {
      const m = String(o).match(/L[ớo]p\s+(\d{1,2}\s*[A-Za-zÀ-ỹ])/i);
      if (m) lopTd = m[1].replace(/\s+/g, '').toUpperCase();
    }));
    if (lopTd) lop = lopTd;
    if (!/^\d{1,2}[A-ZÀ-Ỹ]$/.test(lop)) return { bo: true, ly: 'không đọc được tên lớp' };
    const khoi = parseInt(lop, 10);
    if (!(khoi >= 6 && khoi <= 9)) return { bo: true, ly: 'lớp ' + lop + ' ngoài khối 6–9' };

    /* Kỳ ghi trong tệp — chỉ để hiện ra cho người dùng đối chiếu, KHÔNG tự
       quy đổi sang kỳ của hệ thống. */
    let kyTep = '', namTep = '';
    hang.slice(0, 5).forEach(r => (r || []).forEach(o => {
      const t = String(o);
      const m = t.match(/\(?\s*H[oọ]c\s*k[yỳì]\s*([12I]{1,2})\s*\)?/i);
      if (m && !kyTep) kyTep = 'Học kỳ ' + m[1];
      /* NĂM HỌC ghi ngay trên đầu tệp: "…, NĂM HỌC 2025 - 2026".
         Phải dò cho bằng được. Tệp của trường là kết quả năm 2025-2026, mà ô
         chọn năm học lại mặc định năm hiện hành — nạp nhầm là điểm năm ngoái
         đè lên năm nay, sai toàn bộ Phụ lục 5 gửi Sở mà không dấu hiệu gì. */
      const n = t.match(/N[ĂA]M\s*H[OỌ]C\s*(\d{4})\s*[-–]\s*(\d{4})/i);
      if (n && !namTep) namTep = n[1] + '-' + n[2];
    }));

    const em = [], oLoi = [], venhXl = [];
    for (let r = iTd + 2; r < hang.length; r++) {   // +2: bỏ dòng phụ (HS 1)/(N.xét)
      const d = hang[r] || [];
      const ma = String(d[iMa] == null ? '' : d[iMa]).trim();
      const ten = String(d[iTen] == null ? '' : d[iTen]).trim();
      if (!ma || !ten) continue;

      const ns = window.hsChuanNgay(iNs >= 0 ? d[iNs] : '');
      if (!ns.ok) {
        oLoi.push(lop + ' · ' + ten + ': ngày sinh "' + String(d[iNs]) + '" không đọc được');
        continue;
      }
      const dd = iDd >= 0 ? String(d[iDd] == null ? '' : d[iDd]).trim() : '';

      const diem = [];
      cotMon.forEach(x => {
        const v = String(d[x.i] == null ? '' : d[x.i]).trim();
        if (!v || v === '-') return;
        if (x.mon.kieu === 'diem') {
          const n = parseFloat(v.replace(',', '.'));
          if (isNaN(n) || n < 0 || n > 10) {
            oLoi.push(lop + ' · ' + ten + ' · ' + x.mon.ten + ': "' + v + '"');
            return;
          }
          diem.push({ mon_ma: x.mon.ma, diem: n, muc: null });
        } else {
          const m = /^(đ|d|đạt|dat)$/i.test(v) ? 'D'
                  : /^(cđ|cd|chưa đạt|chua dat)$/i.test(v) ? 'CD' : null;
          if (!m) { oLoi.push(lop + ' · ' + ten + ' · ' + x.mon.ten + ': "' + v + '"'); return; }
          diem.push({ mon_ma: x.mon.ma, diem: null, muc: m });
        }
      });

      let rl = '';
      if (iRl >= 0) {
        const v = String(d[iRl] == null ? '' : d[iRl]).trim();
        if (['Tốt', 'Khá', 'Đạt', 'Chưa đạt'].indexOf(v) >= 0) rl = v;
      }
      const xlVnEdu = iHt >= 0 ? String(d[iHt] == null ? '' : d[iHt]).trim() : '';

      em.push({ ma, ten, dd: dd || null, ns: ns.gt, lop, khoi, diem, rl, xlVnEdu });
    }

    return { bo: false, lop, khoi, kyTep, namTep, em, oLoi, cotMon: cotMon.length, venhXl };
  }

  /* ==========================================================================
     CHỌN TỆP
     ========================================================================== */
  function chonTep(hop) {
    HOP = hop || document.getElementById('dbclKhac');
    if (typeof XLSX === 'undefined') {
      bao('Chưa nạp được thư viện đọc Excel. Thầy cô kiểm tra mạng rồi tải lại trang.');
      return;
    }
    let inp = document.getElementById('vnTep');
    if (!inp) {
      inp = document.createElement('input');
      inp.type = 'file'; inp.id = 'vnTep'; inp.accept = '.xls,.xlsx';
      inp.multiple = true; inp.style.display = 'none';
      document.body.appendChild(inp);
      inp.addEventListener('change', function () {
        if (this.files && this.files.length) doc(Array.from(this.files));
      });
    }
    inp.value = '';
    inp.click();
  }

  async function doc(teps) {
    const s = sb();
    const mh = await s.from('mon_hoc').select('*').order('so_tt');
    if (mh.error) { bao('Không đọc được danh mục môn: ' + mh.error.message); return; }
    const MON = mh.data || [];
    if (!MON.length) { bao('Cơ sở dữ liệu chưa có danh mục môn học. Kiểm tra đã chạy sql/17 chưa.'); return; }

    const lops = [], loiTep = [], oLoi = [];
    const kyTep = {}, namTep = {};
    for (const t of teps) {
      let wb;
      try { wb = XLSX.read(await t.arrayBuffer(), { type: 'array' }); }
      catch (e) { loiTep.push(t.name + ': không đọc được — ' + e.message); continue; }
      wb.SheetNames.forEach(tn => {
        const r = docTrang(wb.Sheets[tn], tn, MON);
        if (r.bo) { loiTep.push(t.name + ' › trang "' + tn + '": ' + r.ly); return; }
        if (r.kyTep) kyTep[r.kyTep] = true;
        if (r.namTep) namTep[r.namTep] = true;
        lops.push(r);
        r.oLoi.forEach(x => oLoi.push(x));
      });
    }

    if (!lops.length) {
      veKq('<div class="vn-canh vn-do"><b>Không đọc được lớp nào.</b><br>'
        + (loiTep.length ? loiTep.slice(0, 8).map(chan).join('<br>')
                         : 'Thầy cô kiểm tra lại có đúng tệp sổ điểm tải từ VnEdu không.')
        + '</div>');
      return;
    }

    /* Mã học sinh trùng nhau giữa các lớp là dấu hiệu tệp bị lặp — phải chặn,
       không thì cùng một em vào hai lớp và mọi tỉ lệ sai theo. */
    const theoMa = {}, maTrung = [];
    lops.forEach(l => l.em.forEach(e => {
      if (theoMa[e.ma] && theoMa[e.ma] !== e.lop) maTrung.push(e.ma + ' (' + theoMa[e.ma] + ' và ' + e.lop + ')');
      theoMa[e.ma] = e.lop;
    }));

    KQ = { lops, MON, oLoi, loiTep, maTrung,
           kyTep: Object.keys(kyTep), namTep: Object.keys(namTep) };
    veXemTruoc();
  }

  /* ==========================================================================
     XEM TRƯỚC — duyệt rồi mới ghi
     ========================================================================== */
  function veXemTruoc() {
    const soEm = KQ.lops.reduce((a, l) => a + l.em.length, 0);
    const soO = KQ.lops.reduce((a, l) => a + l.em.reduce((b, e) => b + e.diem.length, 0), 0);
    const soRl = KQ.lops.reduce((a, l) => a + l.em.filter(e => e.rl).length, 0);
    const kyTep = KQ.kyTep.join(', ') || 'không ghi';
    const namTep = KQ.namTep.join(', ') || '';
    /* Năm học lấy từ chính tệp, không lấy năm hiện hành */
    const namMac = KQ.namTep.length === 1 ? KQ.namTep[0] : (CAU_HINH.NAM_HOC || '');

    let h = '<div class="vn-canh"><b>Đọc xong ' + KQ.lops.length + ' lớp</b> — <b>'
      + soEm + '</b> học sinh · <b>' + soO + '</b> ô điểm · <b>' + soRl
      + '</b> mức rèn luyện.<br>Tệp ghi: <b>' + chan(kyTep) + '</b>'
      + (namTep ? ', năm học <b>' + chan(namTep) + '</b>' : '') + '.</div>';

    if (KQ.namTep.length > 1) {
      h += '<div class="vn-canh vn-do"><b>✖ Các tệp ghi HAI năm học khác nhau: '
        + chan(namTep) + '</b><br>Nạp một lúc là trộn hai năm vào nhau. '
        + 'Thầy cô tách ra nạp từng năm một.</div>';
    } else if (namMac && namMac !== CAU_HINH.NAM_HOC) {
      h += '<div class="vn-canh vn-vang"><b>Tệp này là kết quả năm học '
        + chan(namMac) + ', không phải năm hiện hành ' + chan(CAU_HINH.NAM_HOC) + '.</b><br>'
        + 'Em đã chọn sẵn đúng năm của tệp ở ô bên dưới. Nạp vào năm hiện hành là '
        + 'điểm năm cũ đè lên năm nay, sai toàn bộ Phụ lục 5 gửi Sở mà không dấu hiệu gì.</div>';
    }

    if (KQ.loiTep.length) {
      h += '<div class="vn-canh vn-vang"><b>' + KQ.loiTep.length + ' trang tính bỏ qua:</b><br>'
        + KQ.loiTep.slice(0, 8).map(chan).join('<br>')
        + (KQ.loiTep.length > 8 ? '<br>…' : '') + '</div>';
    }
    if (KQ.maTrung.length) {
      h += '<div class="vn-canh vn-do"><b>✖ ' + KQ.maTrung.length
        + ' mã học sinh xuất hiện ở hai lớp khác nhau — chưa ghi được:</b><br>'
        + KQ.maTrung.slice(0, 8).map(chan).join('<br>')
        + '<br>Thầy cô kiểm lại có chọn nhầm tệp trùng nhau không.</div>';
    }
    if (KQ.oLoi.length) {
      h += '<div class="vn-canh vn-vang"><b>' + KQ.oLoi.length
        + ' ô không đọc được, sẽ để trống:</b><br>'
        + KQ.oLoi.slice(0, 6).map(chan).join('<br>')
        + (KQ.oLoi.length > 6 ? '<br>… và ' + (KQ.oLoi.length - 6) + ' ô nữa.' : '') + '</div>';
    }

    /* ---- Kỳ: KHÔNG tự quy đổi, và CHẶN HẲN nếu là học kỳ II ----

       Điều 9 khoản 1 Thông tư 22/2021/TT-BGDĐT:
             ĐTBmcn = (ĐTBmhkI + 2 × ĐTBmhkII) / 3
       Điểm cả năm là trung bình CÓ TRỌNG SỐ, học kỳ II tính hệ số 2. Vậy
       bảng tổng hợp học kỳ II của VnEdu KHÔNG phải kết quả cả năm — chép
       thẳng vào ô "cả năm" là sai công thức của Bộ, mà con số đó đi vào
       Phụ lục 5 gửi Sở. Thà chặn còn hơn ghi một con số sai không ai biết. */
    const laHk2 = KQ.kyTep.some(k => /2/.test(k));
    if (laHk2) {
      h += '<div class="vn-canh vn-do">'
        + '<b>✖ Tệp này là kết quả HỌC KỲ II — chưa nạp được.</b><br><br>'
        + 'Điều 9 khoản 1 Thông tư 22/2021/TT-BGDĐT quy định điểm cả năm là '
        + 'trung bình <b>có trọng số</b>, học kỳ II tính hệ số 2:<br>'
        + '<code style="display:inline-block;background:#fff;border:1px solid #f0c0ba;'
        + 'border-radius:6px;padding:4px 10px;margin:6px 0;font-size:13px">'
        + 'ĐTBmcn = (ĐTBmhkI + 2 × ĐTBmhkII) / 3</code><br>'
        + 'Nghĩa là <b>bảng học kỳ II KHÔNG phải kết quả cả năm</b>. Ghi vào ô '
        + '"cả năm" là sai công thức của Bộ, mà con số đó đi thẳng vào Phụ lục 5 '
        + 'gửi Sở — sai mà không có dấu hiệu gì.<br><br>'
        + '<b>Hai đường đi đúng:</b><br>'
        + '· Xuất từ VnEdu bảng <b>tổng hợp kết quả giáo dục CẢ NĂM</b> rồi nạp bảng đó.<br>'
        + '· Hoặc báo để hệ thống nhận thêm bảng học kỳ II và <b>tự tính điểm cả năm</b> '
        + 'theo đúng công thức trên, từ hai bảng HK I và HK II.'
        + '</div>';
    }
    h += '<div class="vn-canh vn-vang"><b>Tệp VnEdu ghi "' + chan(kyTep)
      + '", còn hệ thống chỉ có hai kỳ: Học kì I và Cả năm.</b><br>'
      + 'Em không tự quy đổi — thầy cô chọn giúp tệp này ghi vào kỳ nào.'
      + '<div class="vn-chon"><label>Ghi vào kỳ</label>'
      + '<select id="vnKy">'
      + '<option value="ca_nam">Cả năm học</option>'
      + '<option value="hoc_ki_1">Học kì I</option></select>'
      + '<label style="margin-left:12px">Năm học</label>'
      + '<select id="vnNam">'
      + nam().map(n => '<option value="' + n + '"' + (n === namMac ? ' selected' : '')
          + '>' + n + (n === namMac && KQ.namTep.length === 1 ? ' (tệp ghi năm này)' : '')
          + '</option>').join('')
      + '</select></div></div>';

    h += '<div class="tbl-wrap"><table class="vn-bang"><thead><tr>'
      + '<th>Lớp</th><th>Số học sinh</th><th>Ô điểm</th><th>Rèn luyện</th>'
      + '<th>Cột môn đọc được</th></tr></thead><tbody>'
      + KQ.lops.map(l => '<tr><td><b>' + chan(l.lop) + '</b></td><td>' + l.em.length + '</td>'
          + '<td>' + l.em.reduce((a, e) => a + e.diem.length, 0) + '</td>'
          + '<td>' + l.em.filter(e => e.rl).length + '</td>'
          + '<td>' + l.cotMon + '/' + KQ.MON.length + '</td></tr>').join('')
      + '</tbody></table></div>';

    h += '<div class="vn-canh"><b>Sẽ ghi những gì:</b><br>'
      + '· <b>Danh sách học sinh</b> — em nào đã có thì cập nhật tên, ngày sinh, số định danh, lớp.<br>'
      + '· <b>Điểm từng môn</b> và <b>mức rèn luyện</b> của kỳ đã chọn.<br>'
      + '· <b>KHÔNG</b> ghi cột "Kết quả học tập" của VnEdu — hệ thống tự xếp loại từ điểm '
      + 'theo Điều 9 Thông tư 22. Hai nguồn cho một con số, lệch nhau thì không biết tin bên nào. '
      + 'Nạp xong bấm <b>"Tính lại 33 chỉ tiêu"</b> là ra xếp loại của hệ thống, '
      + 'đối chiếu với sổ VnEdu được ngay.</div>';

    const chan_ghi = KQ.maTrung.length || KQ.namTep.length > 1 || laHk2;
    h += '<div class="vn-chon">'
      + (chan_ghi ? ''
         : '<button class="btn btn-pri" id="vnGhi">✅ Ghi ' + soEm + ' học sinh và ' + soO + ' ô điểm</button>')
      + '<button class="btn btn-out" id="vnHuy">Huỷ</button></div>';

    veKq(h);
    const g = document.getElementById('vnGhi');
    if (g) g.addEventListener('click', ghi);
    const hy = document.getElementById('vnHuy');
    if (hy) hy.addEventListener('click', () => { KQ = null; if (window.hsVeLai) window.hsVeLai(); });
  }

  function nam() {
    const r = [];
    for (let y = 2024; y <= 2030; y++) r.push(y + '-' + (y + 1));
    return r;
  }
  function veKq(html) {
    const h = HOP || document.getElementById('dbclKhac');
    if (h) { h.innerHTML = html; h.scrollTop = 0; }
  }

  /* ==========================================================================
     GHI XUỐNG CƠ SỞ DỮ LIỆU

     Chia mẻ 400 dòng: trường 636 em × 12 môn ≈ 7.600 dòng kết quả, gửi một
     lần là quá nặng và chỉ cần rớt mạng giữa chừng là ghi được nửa chừng.
     ========================================================================== */
  async function ghi() {
    const s = sb();
    const ky = document.getElementById('vnKy').value;
    const namHoc = document.getElementById('vnNam').value;
    const nut = document.getElementById('vnGhi');
    if (nut) { nut.disabled = true; nut.textContent = 'Đang ghi…'; }

    /* KHÔNG ghi hoa_nhap và trang_thai. Sổ điểm VnEdu không có hai cột đó,
       mà bản đầu lại đặt cứng hoa_nhap: false và trang_thai: 'dang_hoc' —
       đúng hai lỗi mất dữ liệu mà màn hình học sinh đã phải vá một lần:
         · Bốn em khuyết tật học hoà nhập của trường mất diện, kéo theo mẫu số
           của MỌI tỉ lệ tính sai theo Thông tư 22.
         · Em chuyển đi, bảo lưu, thôi học bị kéo hết về "đang học".
       Dòng mới thì cơ sở dữ liệu tự đặt mặc định (false / 'dang_hoc'), dòng
       đã có thì giữ nguyên — đúng nguyên tắc "tệp không có cột thì không đụng". */
    const hs = [], hl = [], kq = [], rl = [];
    KQ.lops.forEach(l => l.em.forEach(e => {
      hs.push({ ma: e.ma, ho_ten: e.ten, ngay_sinh: e.ns, so_dinh_danh: e.dd });
      hl.push({ hoc_sinh_ma: e.ma, nam_hoc: namHoc, lop: e.lop, khoi: e.khoi });
      e.diem.forEach(x => kq.push({
        nam_hoc: namHoc, ky: ky, hoc_sinh_ma: e.ma,
        mon_ma: x.mon_ma, diem: x.diem, muc: x.muc
      }));
      if (e.rl) rl.push({ nam_hoc: namHoc, ky: ky, hoc_sinh_ma: e.ma, muc: e.rl });
    }));

    const y = [];
    async function meGhi(bang, ds, khoa, ten) {
      for (let i = 0; i < ds.length; i += 400) {
        const r = await s.from(bang).upsert(ds.slice(i, i + 400), { onConflict: khoa });
        if (r.error) {
          const cau = window.hsLoiTiengViet
            ? window.hsLoiTiengViet(r.error, ten.toLowerCase())
            : (ten + ': ' + r.error.message);
          y.push('✖ ' + ten + ' dừng ở dòng ' + i + '. ' + cau);
          return false;
        }
      }
      return true;
    }

    /* Thứ tự bắt buộc: học sinh trước, vì ba bảng sau đều có khoá ngoại trỏ về.
       Hỏng ở bước nào thì DỪNG, không ghi tiếp — ghi tiếp là dữ liệu nửa vời. */
    if (!await meGhi('hoc_sinh', hs, 'ma', 'Danh sách học sinh')) return xong(y);
    y.push('Đã ghi ' + hs.length + ' học sinh.');

    if (!await meGhi('hoc_sinh_lop', hl, 'hoc_sinh_ma,nam_hoc', 'Xếp lớp')) return xong(y);
    y.push('Đã xếp lớp cho ' + hl.length + ' em, năm học ' + namHoc + '.');

    if (kq.length && !await meGhi('hs_ket_qua', kq, 'nam_hoc,ky,hoc_sinh_ma,mon_ma', 'Điểm từng môn')) return xong(y);
    y.push('Đã ghi ' + kq.length + ' ô điểm ('
      + (ky === 'ca_nam' ? 'Cả năm' : 'Học kì I') + ').');

    if (rl.length) {
      if (!await meGhi('hs_ren_luyen', rl, 'nam_hoc,ky,hoc_sinh_ma', 'Mức rèn luyện')) return xong(y);
      y.push('Đã ghi ' + rl.length + ' mức rèn luyện.');
    }
    xong(y, true);
  }

  function xong(y, ok) {
    veKq('<div class="vn-canh ' + (ok ? 'vn-ok' : 'vn-do') + '"><b>'
      + (ok ? 'Xong.' : 'Dừng giữa chừng — đọc kỹ dòng báo lỗi bên dưới.') + '</b><br>'
      + y.map(chan).join('<br>')
      + (ok ? '<br><br>Bước tiếp: bấm <b>"Tính lại 33 chỉ tiêu"</b> để hệ thống xếp loại '
            + 'theo Thông tư 22 và đổ số vào Phụ lục 5.' : '')
      + '</div><div class="vn-chon"><button class="btn btn-pri" id="vnVe">← Về màn hình học sinh</button></div>');
    const v = document.getElementById('vnVe');
    if (v) v.addEventListener('click', () => { KQ = null; if (window.hsVeLai) window.hsVeLai(); });
  }

  window.vneduChonTep = chonTep;
})();
