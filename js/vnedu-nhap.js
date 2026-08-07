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

   BA NGUYÊN TẮC, ĐỀU TRA TỪ VĂN BẢN CHỨ KHÔNG ĐOÁN

   1. HỌC KỲ II KHÔNG PHẢI CẢ NĂM.
      Điều 9 khoản 1 Thông tư 22/2021/TT-BGDĐT:
            ĐTBmcn = (ĐTBmhkI + 2 × ĐTBmhkII) / 3
      Điểm cả năm là trung bình CÓ TRỌNG SỐ, học kỳ II hệ số 2. Vì vậy:
        · Chỉ có sổ học kỳ II  → CHẶN, không cho ghi. Không có cách nào tính
          ra con số đúng khi thiếu học kỳ I.
        · Có đủ hai kỳ         → hệ thống TỰ TÍNH điểm cả năm theo công thức
          trên, lấy một chữ số thập phân.
      Môn đánh giá bằng nhận xét: cả năm lấy theo học kỳ II (cùng khoản).
      Rèn luyện cả năm: ghép hai kỳ theo bảng ở Điều 8 khoản 2.

   2. LƯỢC ĐỒ CHỈ CÓ HAI Ô: 'hoc_ki_1' và 'ca_nam'. Điểm học kỳ II không ghi
      riêng — cái đi vào báo cáo gửi Sở là điểm cả năm đã tính.

   3. CỘT "KẾT QUẢ HỌC TẬP" CỦA VnEdu KHÔNG NẠP VÀO, nhưng có ĐỌC để đối
      chiếu. Hệ thống tự xếp loại từ điểm theo Điều 9 khoản 2 rồi so với sổ
      VnEdu, lệch chỗ nào thì chỉ ra chỗ ấy. Hai bên tính độc lập nên khớp
      nhau là bằng chứng số liệu đúng, lệch nhau là dấu hiệu có chuyện.

   ĐÃ CHẠY THỬ TRÊN DỮ LIỆU THẬT (HK1 + HK2 năm 2025-2026, 4+4 tệp):
      16 lớp mỗi kỳ · 607 em cả hai kỳ, không em nào lệch
      7.284 ô điểm cả năm tính được · 607 mức rèn luyện
      0 em vênh xếp loại so với sổ VnEdu
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
    let kyTep = '', kySo = 0, namTep = '';
    hang.slice(0, 5).forEach(r => (r || []).forEach(o => {
      const t = String(o);
      const m = t.match(/\(?\s*H[oọ]c\s*k[yỳì]\s*(II|I|2|1)\s*\)?/i);
      /* Chuẩn hoá về SỐ ngay tại đây. Trước đây giữ nguyên chữ rồi mới dò
         chữ "2" ở nơi khác — VnEdu ghi "Học kỳ II" bằng số La Mã là dò trượt,
         và điểm học kỳ II lọt thẳng vào ô "cả năm". */
      if (m && !kySo) {
        kySo = /^(II|2)$/i.test(m[1]) ? 2 : 1;
        kyTep = 'Học kỳ ' + kySo;
      }
      /* NĂM HỌC ghi ngay trên đầu tệp: "…, NĂM HỌC 2025 - 2026".
         Phải dò cho bằng được. Tệp của trường là kết quả năm 2025-2026, mà ô
         chọn năm học lại mặc định năm hiện hành — nạp nhầm là điểm năm ngoái
         đè lên năm nay, sai toàn bộ Phụ lục 5 gửi Sở mà không dấu hiệu gì. */
      const n = t.match(/N[ĂA]M\s*H[OỌ]C\s*(\d{4})\s*[-–]\s*(\d{4})/i);
      if (n && !namTep) namTep = n[1] + '-' + n[2];
    }));

    const em = [], oLoi = [];
    /* Bắt đầu ngay từ dòng SAU tiêu đề. Dòng phụ "(HS 1)/(N.xét)" có ô Mã và
       ô Họ tên đều rỗng nên bị chính bộ lọc bên dưới loại — khỏi cần nhảy cóc
       hai dòng. Nhảy cóc thì trang nào không có dòng phụ là mất em đầu tiên,
       lặng lẽ. Đã đối chiếu: cả hai cách cho cùng 607 em trên dữ liệu thật. */
    for (let r = iTd + 1; r < hang.length; r++) {
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

    return { bo: false, lop, khoi, kyTep, kySo, namTep, em, oLoi, cotMon: cotMon.length };
  }

  /* ==========================================================================
     CHỌN TỆP
     ========================================================================== */
  /* Danh sách tệp đang gom, KHÔNG đọc ngay.
     Học kỳ I và học kỳ II nằm ở HAI thư mục khác nhau, mà hộp chọn tệp của
     trình duyệt chỉ mở được một thư mục mỗi lần — không có cách nào chọn cả
     8 tệp trong một lượt. Nên gom dần: chọn 4 tệp thư mục này, bấm thêm, chọn
     4 tệp thư mục kia, rồi mới đọc. Kéo thả cả thư mục vào cũng được. */
  let DS_TEP = [];

  function chonTep(hop) {
    HOP = hop || document.getElementById('dbclKhac');
    if (typeof XLSX === 'undefined') {
      bao('Chưa nạp được thư viện đọc Excel. Thầy cô kiểm tra mạng rồi tải lại trang.');
      return;
    }
    DS_TEP = [];
    veChonTep();
  }

  function moHopChon() {
    let inp = document.getElementById('vnTep');
    if (!inp) {
      inp = document.createElement('input');
      inp.type = 'file'; inp.id = 'vnTep'; inp.accept = '.xls,.xlsx';
      inp.multiple = true; inp.style.display = 'none';
      document.body.appendChild(inp);
      inp.addEventListener('change', function () {
        if (this.files && this.files.length) themTep(Array.from(this.files));
      });
    }
    inp.value = '';
    inp.click();
  }

  function themTep(ts) {
    let trung = 0;
    ts.forEach(t => {
      if (!/\.xlsx?$/i.test(t.name)) return;
      /* Cùng tên và cùng cỡ thì coi như đã có — thầy cô hay bấm nhầm hai lần */
      if (DS_TEP.some(x => x.name === t.name && x.size === t.size)) { trung++; return; }
      DS_TEP.push(t);
    });
    veChonTep(trung);
  }

  function veChonTep(trung) {
    let h = '<div class="vn-canh"><b>📥 Nạp thẳng sổ điểm VnEdu</b><br>'
      + 'Học kỳ I và học kỳ II nằm ở hai thư mục khác nhau, mà hộp chọn tệp của máy '
      + 'chỉ mở được một thư mục mỗi lần. Nên thầy cô làm hai lượt:<br>'
      + '<b>1.</b> Bấm "Chọn tệp", vào thư mục <b>HK1</b>, bấm Ctrl+A rồi Open.<br>'
      + '<b>2.</b> Bấm "Chọn tệp" lần nữa, vào thư mục <b>HK2</b>, Ctrl+A rồi Open.<br>'
      + '<b>3.</b> Bấm "Đọc và xem trước".<br>'
      + '<span class="vn-nho">Hoặc kéo thẳng các tệp từ File Explorer thả vào khung bên dưới.</span>'
      + '</div>';

    if (trung) {
      h += '<div class="vn-canh vn-vang">Đã bỏ ' + trung + ' tệp trùng tên với tệp đã chọn.</div>';
    }

    h += '<div id="vnTha" style="border:2px dashed #b9cbe8;border-radius:14px;'
      + 'padding:26px 18px;text-align:center;background:#f7faff;margin:12px 0;'
      + 'font-size:14px;color:#3b5fa8">'
      + '⬇ Kéo tệp từ File Explorer thả vào đây<br>'
      + '<span class="vn-nho">hoặc dùng nút bên dưới</span></div>';

    if (DS_TEP.length) {
      h += '<div class="vn-canh vn-ok"><b>Đã chọn ' + DS_TEP.length + ' tệp:</b><br>'
        + DS_TEP.map((t, i) => '· ' + chan(t.name)
            + ' <button class="vn-bo" data-bo="' + i + '" style="border:0;background:none;'
            + 'color:#b3261e;cursor:pointer;font-size:12.5px">✕ bỏ</button>').join('<br>')
        + '</div>';
    }

    h += '<div class="vn-chon">'
      + '<button class="btn btn-out" id="vnChon">📂 Chọn tệp' + (DS_TEP.length ? ' (thêm nữa)' : '') + '</button>'
      + (DS_TEP.length ? '<button class="btn btn-pri" id="vnDoc">🔎 Đọc và xem trước '
          + DS_TEP.length + ' tệp</button>' : '')
      + (DS_TEP.length ? '<button class="btn btn-out" id="vnXoaHet">Bỏ hết</button>' : '')
      + '<button class="btn btn-out" id="vnThoat">Quay lại</button></div>';

    veKq(h);

    const g = id => document.getElementById(id);
    if (g('vnChon')) g('vnChon').addEventListener('click', moHopChon);
    if (g('vnDoc')) g('vnDoc').addEventListener('click', () => doc(DS_TEP));
    if (g('vnXoaHet')) g('vnXoaHet').addEventListener('click', () => { DS_TEP = []; veChonTep(); });
    if (g('vnThoat')) g('vnThoat').addEventListener('click', () => {
      DS_TEP = []; if (window.hsVeLai) window.hsVeLai(HOP);
    });
    (HOP || document).querySelectorAll('[data-bo]').forEach(b =>
      b.addEventListener('click', () => { DS_TEP.splice(+b.dataset.bo, 1); veChonTep(); }));

    const tha = g('vnTha');
    if (tha) {
      ['dragenter', 'dragover'].forEach(e => tha.addEventListener(e, ev => {
        ev.preventDefault(); ev.stopPropagation();
        tha.style.borderColor = '#1d4ed8'; tha.style.background = '#e8f0fe';
      }));
      ['dragleave', 'drop'].forEach(e => tha.addEventListener(e, ev => {
        ev.preventDefault(); ev.stopPropagation();
        tha.style.borderColor = '#b9cbe8'; tha.style.background = '#f7faff';
      }));
      tha.addEventListener('drop', ev => {
        const ts = ev.dataTransfer && ev.dataTransfer.files;
        if (ts && ts.length) themTep(Array.from(ts));
      });
    }
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

    /* Mã học sinh lặp là dấu hiệu tệp bị chọn trùng — phải chặn, không thì
       hai dòng cùng khoá trong một mẻ ghi làm máy chủ từ chối cả mẻ.
       Kiểm TRONG TỪNG KỲ, và bắt cả trùng trong cùng một lớp: bản đầu chỉ
       báo khi khác lớp nên chọn nhầm hai lần cùng một tệp là lọt hết. */
    const maTrung = [];
    [1, 2].forEach(k => {
      const thay = {};
      lops.filter(l => l.kySo === k).forEach(l => l.em.forEach(e => {
        if (thay[e.ma]) {
          maTrung.push(e.ma + ' — học kỳ ' + k + ', ' + thay[e.ma]
            + (thay[e.ma] === e.lop ? ' (lặp trong cùng lớp)' : ' và ' + e.lop));
        }
        thay[e.ma] = e.lop;
      }));
    });

    KQ = { lops, MON, oLoi, loiTep, maTrung,
           kyTep: Object.keys(kyTep), namTep: Object.keys(namTep),
           coHk1: lops.some(l => l.kySo === 1),
           coHk2: lops.some(l => l.kySo === 2) };
    veXemTruoc();
  }

  /* ==========================================================================
     TÍNH KẾT QUẢ CẢ NĂM TỪ HAI HỌC KỲ — theo Thông tư 22/2021/TT-BGDĐT

     Điều 9 khoản 1:
       · Môn tính điểm:  ĐTBmcn = (ĐTBmhkI + 2 × ĐTBmhkII) / 3
                          lấy đến chữ số thập phân thứ nhất sau khi làm tròn.
       · Môn nhận xét:   cả năm lấy theo kết quả HỌC KỲ II.

     Điều 8 khoản 2 — rèn luyện cả năm:
       Tốt : HK II Tốt  và HK I từ Khá trở lên
       Khá : HK II Khá  và HK I từ Đạt trở lên
             HK II Đạt  và HK I Tốt
             HK II Tốt  và HK I Đạt hoặc Chưa đạt
       Đạt : HK II Đạt  và HK I Khá, Đạt hoặc Chưa đạt
             HK II Khá  và HK I Chưa đạt
       Chưa đạt: các trường hợp còn lại
     ========================================================================== */
  const BAC = { 'Tốt': 3, 'Khá': 2, 'Đạt': 1, 'Chưa đạt': 0 };

  /* Xếp loại học tập theo Điều 9 khoản 2 Thông tư 22 — dùng để ĐỐI CHIẾU với
     cột "Kết quả học tập" của VnEdu, không ghi vào cơ sở dữ liệu.
     Đây là chỗ đáng giá nhất của việc nạp thẳng: hai bên tính độc lập, lệch
     nhau ở đâu là biết ngay chỗ đó có chuyện. */
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

  function renLuyenCaNam(hk1, hk2) {
    if (!hk1 || !hk2) return '';
    const a = BAC[hk1], b = BAC[hk2];
    if (a === undefined || b === undefined) return '';
    if (b === 3 && a >= 2) return 'Tốt';
    if (b === 2 && a >= 1) return 'Khá';
    if (b === 1 && a === 3) return 'Khá';
    if (b === 3 && a <= 1) return 'Khá';
    if (b === 1 && a <= 2) return 'Đạt';
    if (b === 2 && a === 0) return 'Đạt';
    return 'Chưa đạt';
  }

  /* Gộp hai kỳ thành kết quả cả năm. Trả về mảng em kèm điểm đã tính. */
  function ghepCaNam(MON) {
    const kieu = {};
    MON.forEach(m => { kieu[m.ma] = m.kieu; });

    const hk = { 1: {}, 2: {} };
    KQ.lops.forEach(l => l.em.forEach(e => { hk[l.kySo][e.ma] = e; }));

    const ra = [], thieuHk1 = [], thieuHk2 = [], venh = [];
    Object.keys(hk[2]).forEach(ma => {
      const e2 = hk[2][ma], e1 = hk[1][ma];
      if (!e1) { thieuHk1.push(e2.lop + ' · ' + e2.ten); return; }

      const d1 = {}; e1.diem.forEach(x => { d1[x.mon_ma] = x; });
      const diem = [];
      e2.diem.forEach(x => {
        if (kieu[x.mon_ma] === 'dat') {
          /* Môn nhận xét: cả năm lấy theo học kỳ II */
          diem.push({ mon_ma: x.mon_ma, diem: null, muc: x.muc });
          return;
        }
        const a = d1[x.mon_ma];
        if (!a || a.diem == null || x.diem == null) return;   // thiếu một kỳ thì bỏ
        const cn = Math.round(((a.diem + 2 * x.diem) / 3) * 10) / 10;
        diem.push({ mon_ma: x.mon_ma, diem: cn, muc: null });
      });

      ra.push({
        ma: ma, ten: e2.ten, dd: e2.dd, ns: e2.ns, lop: e2.lop, khoi: e2.khoi,
        diem: diem, rl: renLuyenCaNam(e1.rl, e2.rl)
      });

      /* Đối chiếu xếp loại HỌC KỲ II: hệ thống tính từ điểm theo Điều 9, VnEdu
         có sẵn cột "Kết quả học tập". Lệch nhau là dấu hiệu một bên nhập sai
         hoặc thiếu điểm môn nào đó — chỉ ra để nhà trường soát trước khi số
         ấy đi vào báo cáo gửi Sở. */
      if (e2.xlVnEdu) {
        const ta = xepLoai(e2.diem, kieu);
        if (ta && ta !== e2.xlVnEdu) {
          venh.push(e2.lop + ' · ' + e2.ten + ': VnEdu ghi "' + e2.xlVnEdu
            + '", hệ thống tính ra "' + ta + '"');
        }
      }
    });
    Object.keys(hk[1]).forEach(ma => {
      if (!hk[2][ma]) thieuHk2.push(hk[1][ma].lop + ' · ' + hk[1][ma].ten);
    });
    return { ra, thieuHk1, thieuHk2, venh };
  }

  /* ==========================================================================
     XEM TRƯỚC — duyệt rồi mới ghi
     ========================================================================== */
  function veXemTruoc() {
    const hk1 = KQ.lops.filter(l => l.kySo === 1);
    const hk2 = KQ.lops.filter(l => l.kySo === 2);
    const dem = ls => ({
      lop: ls.length,
      em: ls.reduce((a, l) => a + l.em.length, 0),
      o: ls.reduce((a, l) => a + l.em.reduce((b, e) => b + e.diem.length, 0), 0)
    });
    const d1 = dem(hk1), d2 = dem(hk2);
    const namTep = KQ.namTep.join(', ') || '';
    const namMac = KQ.namTep.length === 1 ? KQ.namTep[0] : (CAU_HINH.NAM_HOC || '');
    const duHaiKy = KQ.coHk1 && KQ.coHk2;

    let h = '<div class="vn-canh"><b>Doc xong ' + KQ.lops.length + ' trang tinh</b>'
      + (namTep ? ' \u2014 nam hoc <b>' + chan(namTep) + '</b>' : '') + '.<br>'
      + (KQ.coHk1 ? '\u00b7 <b>H\u1ecdc k\u1ef3 I</b>: ' + d1.lop + ' l\u1edbp \u00b7 ' + d1.em + ' h\u1ecdc sinh \u00b7 ' + d1.o + ' \u00f4 \u0111i\u1ec3m<br>' : '')
      + (KQ.coHk2 ? '\u00b7 <b>H\u1ecdc k\u1ef3 II</b>: ' + d2.lop + ' l\u1edbp \u00b7 ' + d2.em + ' h\u1ecdc sinh \u00b7 ' + d2.o + ' \u00f4 \u0111i\u1ec3m' : '')
      + '</div>';

    if (KQ.loiTep.length) {
      h += '<div class="vn-canh vn-vang"><b>' + KQ.loiTep.length + ' trang t\u00ednh b\u1ecf qua:</b><br>'
        + KQ.loiTep.slice(0, 8).map(chan).join('<br>')
        + (KQ.loiTep.length > 8 ? '<br>\u2026' : '') + '</div>';
    }
    if (KQ.maTrung.length) {
      h += '<div class="vn-canh vn-do"><b>\u2716 ' + KQ.maTrung.length
        + ' m\u00e3 h\u1ecdc sinh b\u1ecb l\u1eb7p \u2014 ch\u01b0a ghi \u0111\u01b0\u1ee3c:</b><br>'
        + KQ.maTrung.slice(0, 8).map(chan).join('<br>')
        + (KQ.maTrung.length > 8 ? '<br>\u2026' : '')
        + '<br>Th\u1ea7y c\u00f4 ki\u1ec3m l\u1ea1i c\u00f3 ch\u1ecdn nh\u1ea7m hai l\u1ea7n c\u00f9ng m\u1ed9t t\u1ec7p kh\u00f4ng.</div>';
    }
    if (KQ.namTep.length > 1) {
      h += '<div class="vn-canh vn-do"><b>\u2716 C\u00e1c t\u1ec7p ghi HAI n\u0103m h\u1ecdc kh\u00e1c nhau: '
        + chan(namTep) + '</b><br>N\u1ea1p m\u1ed9t l\u00fac l\u00e0 tr\u1ed9n hai n\u0103m v\u00e0o nhau. '
        + 'Th\u1ea7y c\u00f4 t\u00e1ch ra n\u1ea1p t\u1eebng n\u0103m m\u1ed9t.</div>';
    } else if (namMac && namMac !== CAU_HINH.NAM_HOC) {
      h += '<div class="vn-canh vn-vang"><b>T\u1ec7p n\u00e0y l\u00e0 n\u0103m h\u1ecdc ' + chan(namMac)
        + ', kh\u00f4ng ph\u1ea3i n\u0103m hi\u1ec7n h\u00e0nh ' + chan(CAU_HINH.NAM_HOC) + '.</b><br>'
        + 'Em \u0111\u00e3 ch\u1ecdn s\u1eb5n \u0111\u00fang n\u0103m c\u1ee7a t\u1ec7p \u1edf \u00f4 b\u00ean d\u01b0\u1edbi.</div>';
    }
    if (KQ.oLoi.length) {
      h += '<div class="vn-canh vn-vang"><b>' + KQ.oLoi.length
        + ' \u00f4 kh\u00f4ng \u0111\u1ecdc \u0111\u01b0\u1ee3c, s\u1ebd \u0111\u1ec3 tr\u1ed1ng:</b><br>'
        + KQ.oLoi.slice(0, 6).map(chan).join('<br>')
        + (KQ.oLoi.length > 6 ? '<br>\u2026 v\u00e0 ' + (KQ.oLoi.length - 6) + ' \u00f4 n\u1eefa.' : '') + '</div>';
    }

    let gop = null;
    if (duHaiKy) {
      gop = ghepCaNam(KQ.MON);
      h += '<div class="vn-canh vn-ok"><b>C\u00f3 \u0111\u1ee7 c\u1ea3 hai h\u1ecdc k\u1ef3 \u2014 h\u1ec7 th\u1ed1ng t\u1ef1 t\u00ednh k\u1ebft qu\u1ea3 C\u1ea2 N\u0102M '
        + 'theo Th\u00f4ng t\u01b0 22/2021/TT-BGD\u0110T.</b><br>'
        + '<code style="display:inline-block;background:#fff;border:1px solid #bfe8cd;'
        + 'border-radius:6px;padding:4px 10px;margin:5px 0;font-size:13px">'
        + '\u0110TBmcn = (\u0110TBmhkI + 2 \u00d7 \u0110TBmhkII) / 3</code><br>'
        + '\u00b7 M\u00f4n t\u00ednh \u0111i\u1ec3m: theo c\u00f4ng th\u1ee9c tr\u00ean, l\u1ea5y m\u1ed9t ch\u1eef s\u1ed1 th\u1eadp ph\u00e2n (\u0110i\u1ec1u 9 kho\u1ea3n 1).<br>'
        + '\u00b7 M\u00f4n nh\u1eadn x\u00e9t: l\u1ea5y theo k\u1ebft qu\u1ea3 <b>h\u1ecdc k\u1ef3 II</b> (\u0110i\u1ec1u 9 kho\u1ea3n 1).<br>'
        + '\u00b7 R\u00e8n luy\u1ec7n c\u1ea3 n\u0103m: gh\u00e9p hai k\u1ef3 theo b\u1ea3ng \u1edf \u0110i\u1ec1u 8 kho\u1ea3n 2.<br><br>'
        + 'S\u1ebd ghi <b>ba</b> b\u1ed9 s\u1ed1: \u0111i\u1ec3m h\u1ecdc k\u1ef3 I \u00b7 \u0111i\u1ec3m c\u1ea3 n\u0103m \u0111\u00e3 t\u00ednh \u00b7 r\u00e8n luy\u1ec7n c\u1ea3 n\u0103m. '
        + 'T\u00ednh \u0111\u01b0\u1ee3c cho <b>' + gop.ra.length + '</b> em.</div>';

      if (gop.thieuHk1.length) {
        h += '<div class="vn-canh vn-vang"><b>' + gop.thieuHk1.length
          + ' em c\u00f3 \u1edf h\u1ecdc k\u1ef3 II nh\u01b0ng KH\u00d4NG c\u00f3 \u1edf h\u1ecdc k\u1ef3 I</b> \u2014 ch\u01b0a t\u00ednh \u0111\u01b0\u1ee3c c\u1ea3 n\u0103m:<br>'
          + gop.thieuHk1.slice(0, 6).map(chan).join(' \u00b7 ')
          + (gop.thieuHk1.length > 6 ? ' \u2026' : '') + '</div>';
      }
      if (gop.venh && gop.venh.length) {
        h += '<div class="vn-canh vn-vang"><b>⚠ ' + gop.venh.length
          + ' em có xếp loại học kỳ II VÊNH giữa sổ VnEdu và cách tính của hệ thống:</b><br>'
          + gop.venh.slice(0, 8).map(chan).join('<br>')
          + (gop.venh.length > 8 ? '<br>… và ' + (gop.venh.length - 8) + ' em nữa.' : '')
          + '<br><span class="vn-nho">Hệ thống xếp loại theo Điều 9 khoản 2 Thông tư 22 '
          + 'từ chính các cột điểm trong tệp này. Vênh nhau thường là do thiếu điểm một môn, '
          + 'hoặc một bên nhập sai. Nhà trường soát lại trước khi số ấy đi vào báo cáo.</span></div>';
      } else if (gop.ra.length) {
        h += '<div class="vn-canh vn-ok">✅ <b>Xếp loại học kỳ II khớp hoàn toàn</b> giữa sổ VnEdu '
          + 'và cách tính của hệ thống theo Điều 9 Thông tư 22 — số liệu nhất quán.</div>';
      }
      if (gop.thieuHk2.length) {
        h += '<div class="vn-canh vn-vang"><b>' + gop.thieuHk2.length
          + ' em c\u00f3 \u1edf h\u1ecdc k\u1ef3 I nh\u01b0ng KH\u00d4NG c\u00f3 \u1edf h\u1ecdc k\u1ef3 II</b> (chuy\u1ec3n \u0111i gi\u1eefa n\u0103m?) \u2014 '
          + 'ch\u1ec9 ghi \u0111i\u1ec3m h\u1ecdc k\u1ef3 I:<br>'
          + gop.thieuHk2.slice(0, 6).map(chan).join(' \u00b7 ')
          + (gop.thieuHk2.length > 6 ? ' \u2026' : '') + '</div>';
      }
    } else if (KQ.coHk2) {
      h += '<div class="vn-canh vn-do">'
        + '<b>\u2716 Ch\u1ec9 c\u00f3 h\u1ecdc k\u1ef3 II \u2014 ch\u01b0a ghi \u0111\u01b0\u1ee3c.</b><br><br>'
        + '\u0110i\u1ec1u 9 kho\u1ea3n 1 Th\u00f4ng t\u01b0 22/2021/TT-BGD\u0110T quy \u0111\u1ecbnh \u0111i\u1ec3m c\u1ea3 n\u0103m l\u00e0 trung b\u00ecnh '
        + '<b>c\u00f3 tr\u1ecdng s\u1ed1</b>, h\u1ecdc k\u1ef3 II t\u00ednh h\u1ec7 s\u1ed1 2:<br>'
        + '<code style="display:inline-block;background:#fff;border:1px solid #f0c0ba;'
        + 'border-radius:6px;padding:4px 10px;margin:6px 0;font-size:13px">'
        + '\u0110TBmcn = (\u0110TBmhkI + 2 \u00d7 \u0110TBmhkII) / 3</code><br>'
        + 'Ngh\u0129a l\u00e0 <b>b\u1ea3ng h\u1ecdc k\u1ef3 II KH\u00d4NG ph\u1ea3i k\u1ebft qu\u1ea3 c\u1ea3 n\u0103m</b> \u2014 thi\u1ebfu h\u1ecdc k\u1ef3 I th\u00ec '
        + 'kh\u00f4ng c\u00f3 c\u00e1ch n\u00e0o t\u00ednh ra con s\u1ed1 \u0111\u00fang.<br><br>'
        + '<b>Th\u1ea7y c\u00f4 ch\u1ecdn th\u00eam t\u1ec7p s\u1ed5 \u0111i\u1ec3m H\u1eccC K\u1ef2 I c\u1ee7a c\u00f9ng n\u0103m h\u1ecdc r\u1ed3i n\u1ea1p m\u1ed9t l\u01b0\u1ee3t</b> \u2014 '
        + 'h\u1ec7 th\u1ed1ng t\u1ef1 t\u00ednh v\u00e0 ghi lu\u00f4n k\u1ebft qu\u1ea3 c\u1ea3 n\u0103m.</div>';
    } else {
      h += '<div class="vn-canh vn-tin"><b>Ch\u1ec9 c\u00f3 h\u1ecdc k\u1ef3 I.</b> S\u1ebd ghi v\u00e0o \u00f4 '
        + '<b>H\u1ecdc k\u00ec I</b>. Khi n\u00e0o c\u00f3 s\u1ed5 h\u1ecdc k\u1ef3 II, n\u1ea1p c\u1ea3 hai m\u1ed9t l\u01b0\u1ee3t l\u00e0 h\u1ec7 th\u1ed1ng '
        + 't\u1ef1 t\u00ednh k\u1ebft qu\u1ea3 c\u1ea3 n\u0103m.</div>';
    }

    h += '<div class="vn-canh"><div class="vn-chon"><label>N\u0103m h\u1ecdc</label>'
      + '<select id="vnNam">'
      + nam().map(n => '<option value="' + n + '"' + (n === namMac ? ' selected' : '') + '>'
          + n + (n === namMac && KQ.namTep.length === 1 ? ' (t\u1ec7p ghi n\u0103m n\u00e0y)' : '')
          + '</option>').join('')
      + '</select></div></div>';

    h += '<div class="tbl-wrap"><table class="vn-bang"><thead><tr>'
      + '<th>L\u1edbp</th><th>K\u1ef3</th><th>S\u1ed1 h\u1ecdc sinh</th><th>\u00d4 \u0111i\u1ec3m</th><th>R\u00e8n luy\u1ec7n</th>'
      + '<th>C\u1ed9t m\u00f4n</th></tr></thead><tbody>'
      + KQ.lops.map(l => '<tr><td><b>' + chan(l.lop) + '</b></td>'
          + '<td>' + (l.kySo === 1 ? 'HK I' : 'HK II') + '</td>'
          + '<td>' + l.em.length + '</td>'
          + '<td>' + l.em.reduce((a, e) => a + e.diem.length, 0) + '</td>'
          + '<td>' + l.em.filter(e => e.rl).length + '</td>'
          + '<td>' + l.cotMon + '/' + KQ.MON.length + '</td></tr>').join('')
      + '</tbody></table></div>';

    h += '<div class="vn-canh"><b>M\u1ed9t \u0111i\u1ec1u n\u1eefa:</b> h\u1ec7 th\u1ed1ng <b>kh\u00f4ng</b> n\u1ea1p c\u1ed9t '
      + '"K\u1ebft qu\u1ea3 h\u1ecdc t\u1eadp" c\u1ee7a VnEdu \u2014 n\u00f3 t\u1ef1 x\u1ebfp lo\u1ea1i t\u1eeb \u0111i\u1ec3m theo \u0110i\u1ec1u 9 Th\u00f4ng t\u01b0 22. '
      + 'Hai ngu\u1ed3n cho m\u1ed9t con s\u1ed1, l\u1ec7ch nhau th\u00ec kh\u00f4ng bi\u1ebft tin b\u00ean n\u00e0o. '
      + 'N\u1ea1p xong b\u1ea5m <b>"T\u00ednh l\u1ea1i 33 ch\u1ec9 ti\u00eau"</b> l\u00e0 ra x\u1ebfp lo\u1ea1i c\u1ee7a h\u1ec7 th\u1ed1ng, '
      + '\u0111\u1ed1i chi\u1ebfu v\u1edbi s\u1ed5 VnEdu \u0111\u01b0\u1ee3c ngay.</div>';

    const chanGhi = KQ.maTrung.length || KQ.namTep.length > 1 || (KQ.coHk2 && !KQ.coHk1);
    KQ.gop = gop;
    h += '<div class="vn-chon">'
      + (chanGhi ? '' : '<button class="btn btn-pri" id="vnGhi">\u2705 Ghi v\u00e0o c\u01a1 s\u1edf d\u1eef li\u1ec7u</button>')
      + '<button class="btn btn-out" id="vnHuy">Hu\u1ef7</button></div>';

    veKq(h);
    const g = document.getElementById('vnGhi');
    if (g) g.addEventListener('click', ghi);
    const hy = document.getElementById('vnHuy');
    if (hy) hy.addEventListener('click', () => { KQ = null; if (window.hsVeLai) window.hsVeLai(HOP); });
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
    const namHoc = document.getElementById('vnNam').value;
    const nut = document.getElementById('vnGhi');
    if (nut) { nut.disabled = true; nut.textContent = 'Đang ghi…'; }
    const doiNhan = t => { if (nut) nut.textContent = t; };

    /* KHÔNG ghi hoa_nhap và trang_thai. Sổ điểm VnEdu không có hai cột đó,
       mà bản đầu lại đặt cứng hoa_nhap: false và trang_thai: 'dang_hoc' —
       đúng hai lỗi mất dữ liệu mà màn hình học sinh đã phải vá một lần:
         · Bốn em khuyết tật học hoà nhập của trường mất diện, kéo theo mẫu số
           của MỌI tỉ lệ tính sai theo Thông tư 22.
         · Em chuyển đi, bảo lưu, thôi học bị kéo hết về "đang học".
       Dòng mới thì cơ sở dữ liệu tự đặt mặc định (false / 'dang_hoc'), dòng
       đã có thì giữ nguyên — đúng nguyên tắc "tệp không có cột thì không đụng". */
    const hs = {}, hl = {}, kq = [], rl = [];
    /* Danh sách học sinh và xếp lớp gom theo MÃ để không có hai dòng cùng khoá
       trong một mẻ ghi — nạp cả hai kỳ thì mỗi em xuất hiện hai lần. */
    function ghiEm(e) {
      hs[e.ma] = { ma: e.ma, ho_ten: e.ten, ngay_sinh: e.ns, so_dinh_danh: e.dd };
      hl[e.ma] = { hoc_sinh_ma: e.ma, nam_hoc: namHoc, lop: e.lop, khoi: e.khoi };
    }
    function ghiDiem(e, ky) {
      e.diem.forEach(x => kq.push({
        nam_hoc: namHoc, ky: ky, hoc_sinh_ma: e.ma,
        mon_ma: x.mon_ma, diem: x.diem, muc: x.muc
      }));
      if (e.rl) rl.push({ nam_hoc: namHoc, ky: ky, hoc_sinh_ma: e.ma, muc: e.rl });
    }

    /* Học kỳ I ghi nguyên vào ô 'hoc_ki_1'. Học kỳ II KHÔNG ghi riêng — lược
       đồ chỉ có hai ô, và theo Điều 9 khoản 1 thì cái đi vào báo cáo là điểm
       CẢ NĂM đã tính từ hai kỳ, chứ không phải điểm học kỳ II. */
    KQ.lops.filter(l => l.kySo === 1).forEach(l => l.em.forEach(e => {
      ghiEm(e); ghiDiem(e, 'hoc_ki_1');
    }));
    KQ.lops.filter(l => l.kySo === 2).forEach(l => l.em.forEach(ghiEm));
    if (KQ.gop) KQ.gop.ra.forEach(e => { ghiEm(e); ghiDiem(e, 'ca_nam'); });

    const y = [];
    /* Mẻ 200 cho bảng hoc_sinh vì bảng đó có trigger ghi nhật ký chạy TỪNG
       DÒNG — 400 dòng là 400 lần trigger trong một câu lệnh. Các bảng khác
       không có trigger nên 400 thoải mái. */
    async function meGhi(bang, ds, khoa, ten, buoc) {
      const B = buoc || 400;
      for (let i = 0; i < ds.length; i += B) {
        doiNhan('Đang ghi ' + ten.toLowerCase() + '… ' + Math.min(i + B, ds.length)
          + '/' + ds.length);
        const r = await s.from(bang).upsert(ds.slice(i, i + B), { onConflict: khoa });
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
    const dsHs = Object.keys(hs).map(k => hs[k]);
    const dsHl = Object.keys(hl).map(k => hl[k]);

    if (!await meGhi('hoc_sinh', dsHs, 'ma', 'Danh sách học sinh', 200)) return xong(y);
    y.push('Đã ghi ' + dsHs.length + ' học sinh.');

    if (!await meGhi('hoc_sinh_lop', dsHl, 'hoc_sinh_ma,nam_hoc', 'Xếp lớp')) return xong(y);
    y.push('Đã xếp lớp cho ' + dsHl.length + ' em, năm học ' + namHoc + '.');

    if (kq.length) {
      if (!await meGhi('hs_ket_qua', kq, 'nam_hoc,ky,hoc_sinh_ma,mon_ma', 'Điểm từng môn')) return xong(y);
      const soHk1 = kq.filter(x => x.ky === 'hoc_ki_1').length;
      const soCn = kq.length - soHk1;
      y.push('Đã ghi ' + kq.length + ' ô điểm'
        + (soHk1 && soCn ? ' — ' + soHk1 + ' ô học kỳ I và ' + soCn + ' ô cả năm đã tính'
           : soCn ? ' (cả năm)' : ' (học kỳ I)') + '.');
    }

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
            + 'theo Thông tư 22 và đổ số vào Phụ lục 5.'
            : '<br><br>Sửa xong nguyên nhân rồi <b>nạp lại chính những tệp này</b> — '
            + 'mọi bước đều ghi theo khoá duy nhất nên dữ liệu không bị nhân đôi, '
            + 'phần đã ghi được sẽ được cập nhật lại chứ không thêm mới.')
      + '</div><div class="vn-chon"><button class="btn btn-pri" id="vnVe">← Về màn hình học sinh</button></div>');
    const v = document.getElementById('vnVe');
    if (v) v.addEventListener('click', () => { KQ = null; if (window.hsVeLai) window.hsVeLai(); });
  }

  window.vneduChonTep = chonTep;
})();
