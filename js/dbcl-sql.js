/* ============================================================================
   ĐẢM BẢO CHẤT LƯỢNG — LÕI SỐ LIỆU VÀ CAM KẾT (PA1)

   Màn hình này thay cho việc gõ tay năm bảng Word gần giống hệt nhau.

   Phụ lục 1, 2, 5, 15, 16 của bộ hồ sơ ĐBCL dùng CHUNG một bộ 33 chỉ tiêu,
   chỉ khác nhau ở chỗ con số đó là gì:
       Thực trạng đầu năm   → Phụ lục 1
       Chuẩn đầu ra         → Phụ lục 2 và Phụ lục 16 (cam kết của Hiệu trưởng)
       Kết quả thực hiện    → Phụ lục 5
   Nhập một lần vào đây, bốn phụ lục tự sinh ra, và máy tự đối chiếu ba cột.

   Cam kết của giáo viên (Phụ lục 15) nằm ở khối riêng phía dưới: mỗi thầy cô
   tự lập cam kết của mình, ban giám hiệu xem được toàn bộ.

   Ai sửa được số liệu: quản trị, ban giám hiệu, tổ trưởng — đúng bằng chính
   sách dbclsl_sua đặt ở máy chủ. Người khác vẫn xem đầy đủ nhưng ô bị khóa.
   Cam kết thì mỗi giáo viên tự sửa bản của mình.
   ============================================================================ */

(function () {
  'use strict';

  if (typeof CAU_HINH === 'undefined' || !CAU_HINH.DA_NOI) return;

  let sb = null;
  let NAM_HOC = CAU_HINH.NAM_HOC || '2026-2027';
  let LOAI = 'chuan_dau_ra';
  let KY = 'ca_nam';

  let CHI_TIEU = [];     // danh mục 33 chỉ tiêu
  let SO_LIEU = {};      // "loai|ky|khoi|ma" -> bản ghi
  let CAM_KET = [];      // danh sách cam kết của năm học đang chọn
  let CK_DONG = {};      // cam_ket_id -> { "khoi|ma": giá trị }
  let DANG_TAI = false;

  const KHOI = [6, 7, 8, 9];

  const TEN_LOAI = {
    thuc_trang:   'Thực trạng đầu năm (Phụ lục 1)',
    chuan_dau_ra: 'Chuẩn đầu ra phấn đấu (Phụ lục 2 và 16)',
    ket_qua:      'Kết quả thực hiện (Phụ lục 5)'
  };

  /* Mỗi phụ lục là một màn hình riêng. Phụ lục 2 và 16 cùng đọc một bảng số
     liệu — tách hai bảng thì thầy cô sẽ nhập hai lần rồi vênh nhau, đúng lỗi
     167/4 với 166/4 trong bộ hồ sơ giấy. Nên hai tab dùng chung dữ liệu và
     có dòng nhắc rõ ràng. */
  const PHU_LUC = [
    { ma: 'vh', loai: null, nhan: 'Vận hành', khac: true,
      ten: 'Vận hành công tác đảm bảo chất lượng',
      mo: 'Vòng Plan – Do – Check – Action và các mốc phải hoàn thành theo Công văn 2180 của Sở.' },
    { ma: 'to', loai: null, nhan: 'Tổ ĐBCL', khac: true,
      ten: 'Tổ đảm bảo chất lượng',
      mo: 'Quyết định thành lập và bảng phân công nhiệm vụ — Phụ lục 10 và 11.' },
    { ma: 'hs', loai: null, nhan: 'Học sinh', khac: true,
      ten: 'Dữ liệu học sinh và kết quả từng môn',
      mo: 'Bảng gốc của cả module. Khai báo danh sách đầu năm, tải kết quả từng kỳ, hệ thống tự tính 33 chỉ tiêu.' },
    { ma: 'pc', loai: null, nhan: 'Phân công', khac: true,
      ten: 'Phân công giảng dạy',
      mo: 'Quyết định ai xem và sửa được dữ liệu lớp nào, môn nào. Nhập thủ công từng dòng hoặc tải Excel hàng loạt.' },
    { ma: 'ck', loai: null, nhan: 'Cam kết HS', khac: true,
      ten: 'Cam kết chuẩn đầu ra tới từng học sinh',
      mo: 'Nội dung Sở kiểm tra: làm rõ thực trạng và chuẩn đầu ra với từng học sinh tương ứng với từng môn học, có xác nhận của học sinh và cha mẹ học sinh.' },
    { ma: '1',  loai: 'thuc_trang',   ten: 'Thực trạng nhà trường',
      mo: 'Số liệu thực tế đầu năm học, làm gốc để xây dựng chuẩn đầu ra.',
      xuat: 'xuatPhuLuc1' },
    { ma: '2',  loai: 'chuan_dau_ra', ten: 'Chuẩn đầu ra chất lượng học tập của học sinh',
      mo: 'Chỉ tiêu Nhà trường phấn đấu đạt được trong năm học.',
      chung: 'Phụ lục 16', xuat: 'xuatPhuLuc2' },
    { ma: '5',  loai: 'ket_qua',      ten: 'Kết quả học tập và rèn luyện',
      mo: 'Số liệu thực hiện được, hệ thống tự đối chiếu với chuẩn đầu ra đã cam kết.',
      xuat: 'xuatPhuLuc5' },
    { ma: '15', loai: null,           ten: 'Bản cam kết của giáo viên với Hiệu trưởng',
      mo: 'Mỗi thầy cô tự lập cam kết cho các lớp mình phụ trách; ban giám hiệu xem và kết xuất toàn bộ.' },
    { ma: '16', loai: 'chuan_dau_ra', ten: 'Bản cam kết chất lượng giáo dục của nhà trường',
      mo: 'Gửi UBND xã Yên Thành và Sở Giáo dục và Đào tạo Nghệ An.',
      chung: 'Phụ lục 2', xuat: 'xuatPhuLuc16' },
    { ma: 'ts', loai: null, nhan: 'Tự soát', khac: true,
      ten: 'Tự soát trước khi Sở kiểm tra',
      mo: '28 nội dung lấy từ Quyết định 1426 và 2616 của Sở, mỗi nội dung gắn với một tiêu chí Thông tư 57.' }
  ];
  let PL = 'vh';

  function plHienTai() { return PHU_LUC.find(p => p.ma === PL) || PHU_LUC[1]; }

  /* ========================================================================
     KIỂU DÁNG
     ======================================================================== */
  const css = `
  .db-bar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px}
  .db-bar label{font-size:13.2px;font-weight:600;color:var(--muted)}
  .db-bar select{padding:8px 11px;border:1.5px solid #d7dde8;border-radius:9px;
    font-size:13.6px;font-family:inherit;color:#1f2937;background:#fff}
  .db-bar select:focus{outline:0;border-color:var(--navy-2)}
  .db-tbl{width:100%;border-collapse:collapse;font-size:13.6px}
  .db-tbl th{background:#eef3fb;color:var(--navy);font-weight:700;padding:9px 8px;
    text-align:center;border:1px solid #dbe3ef;font-size:12.8px;line-height:1.35}
  .db-tbl td{border:1px solid #e4e9f2;padding:4px 6px;vertical-align:middle}
  .db-tbl td.ten{text-align:left;color:#26324a;line-height:1.45;min-width:230px}
  .db-nhom td{background:#f7f9fd;font-weight:700;color:var(--navy);
    padding:7px 9px;font-size:12.6px;letter-spacing:.03em;text-transform:uppercase}
  .db-tbl input{width:100%;padding:6px 8px;border:1px solid #dde3ed;border-radius:7px;
    font-size:13.4px;font-family:inherit;text-align:center;color:#1f2937;background:#fff}
  .db-tbl input:focus{outline:0;border-color:var(--navy-2);background:#fbfcff}
  .db-tbl input:disabled{background:#f4f6fa;color:#9aa4b5;cursor:not-allowed}
  .db-tbl input.vua-luu{border-color:#4ade80;background:#f2fdf6}
  .db-goi{font-size:11.6px;color:#8a94a6;margin:8px 0 0;line-height:1.55}
  .db-canh{background:#fff8ec;border:1px solid #f2ddb4;color:#7a5514;border-radius:10px;
    padding:11px 14px;font-size:13.2px;margin:12px 0;line-height:1.6}
  .db-canh b{color:#5f3f08}
  .db-ok{background:#f2fdf6;border:1px solid #bfe8cd;color:#1a6437}
  .db-ds{border:1px solid #e4e9f2;border-radius:11px;overflow:hidden;margin-top:12px}
  .db-ds-dong{display:flex;gap:10px;align-items:center;padding:10px 13px;
    border-bottom:1px solid #eef1f6;font-size:13.4px}
  .db-ds-dong:last-child{border-bottom:0}
  .db-ds-dong b{color:var(--navy)}
  .db-ds-dong .lech{margin-left:auto;font-weight:700;white-space:nowrap}
  .db-dat{color:#15803d}
  .db-thieu{color:#b45309}
  .db-ck-the{border:1px solid #e4e9f2;border-radius:11px;padding:13px 15px;margin-bottom:9px;
    display:flex;gap:12px;align-items:center;flex-wrap:wrap}
  .db-ck-the b{color:var(--navy);font-size:14.6px}
  .db-ck-the .meta{font-size:12.6px;color:var(--muted)}
  .db-ck-the .cuoi{margin-left:auto;display:flex;gap:7px}
  .db-nhan{font-size:11.6px;font-weight:700;padding:3px 10px;border-radius:999px}
  .db-nhan.ky{background:#e7f7ee;color:#15803d}
  .db-nhan.nhap{background:#fdf4e3;color:#96660f}
  .db-nhanh{background:#f7f9fd;border:1px solid #e0e7f3;border-radius:11px;
    padding:12px 14px;margin-bottom:13px}
  .db-nhanh .hang{display:flex;gap:9px;flex-wrap:wrap;align-items:center}
  .db-nhanh .btn{padding:8px 13px;font-size:13.4px}
  .db-nhanh .goi{font-size:11.8px;color:#8a94a6;margin-top:9px;line-height:1.6}
  .db-nhanh .goi b{color:#5b6b85}
  .db-tab{display:flex;gap:5px;flex-wrap:wrap;border-bottom:2px solid #e2e8f2;
    margin-bottom:16px;padding-bottom:0}
  .db-tab button{padding:11px 17px;font-size:14px;font-weight:600;color:#5b6b85;
    border-radius:10px 10px 0 0;border-bottom:3px solid transparent;margin-bottom:-2px;
    transition:background .15s,color .15s}
  .db-tab button:hover{background:#f0f5fd;color:var(--navy)}
  .db-tab button.on{background:#fff;color:var(--navy);border-bottom-color:var(--navy-2)}
  .db-de{margin-bottom:14px}
  .db-de h3{font-family:var(--serif);font-size:21px;color:var(--navy);margin-bottom:5px}
  .db-de .mo{font-size:13.6px;color:var(--muted);line-height:1.6;margin-bottom:4px}
  .db-de .chung{display:inline-block;background:#eef4ff;border:1px solid #cfe0ff;
    color:#1d4ed8;border-radius:8px;padding:6px 11px;font-size:12.6px;margin-top:7px}
  .db-cong{display:flex;gap:8px;flex-wrap:wrap;margin:13px 0}
  .db-cong .btn{padding:9px 14px;font-size:13.4px}
  `;
  document.head.insertAdjacentHTML('beforeend', '<style>' + css + '</style>');

  function chan(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function laQuanTri() {
    const u = window.NGUOI_DUNG;
    return !!u && ['admin', 'ban_giam_hieu'].includes(u.vai_tro);
  }
  /* Đúng theo chính sách dbclsl_sua đặt ở máy chủ */
  function coQuyenNhap() {
    const u = window.NGUOI_DUNG;
    return !!u && (laQuanTri() || u.vai_tro === 'to_truong');
  }

  /* ========================================================================
     TẢI DỮ LIỆU
     ======================================================================== */
  async function taiDuLieu() {
    if (!sb || DANG_TAI) return;
    DANG_TAI = true;
    try {
      const [ct, sl, ck] = await Promise.all([
        sb.from('dbcl_chi_tieu').select('*').order('so_tt'),
        sb.from('dbcl_so_lieu').select('*').eq('nam_hoc', NAM_HOC),
        sb.from('dbcl_cam_ket').select('*').eq('nam_hoc', NAM_HOC).order('ho_ten')
      ]);
      if (ct.error) throw ct.error;
      if (!ct.data || !ct.data.length) {
        throw new Error('Cơ sở dữ liệu chưa có bộ chỉ tiêu. Kiểm tra đã chạy tệp sql/15 chưa.');
      }
      CHI_TIEU = ct.data;

      SO_LIEU = {};
      (sl.data || []).forEach(r => {
        SO_LIEU[r.loai + '|' + r.ky + '|' + r.khoi + '|' + r.chi_tieu_ma] = r;
      });

      CAM_KET = ck.data || [];
      CK_DONG = {};
      if (CAM_KET.length) {
        const dong = await sb.from('dbcl_cam_ket_dong').select('*')
          .in('cam_ket_id', CAM_KET.map(c => c.id));
        (dong.data || []).forEach(d => {
          (CK_DONG[d.cam_ket_id] = CK_DONG[d.cam_ket_id] || {})[d.khoi + '|' + d.chi_tieu_ma] = d.gia_tri;
        });
      }

      veTatCa();
    } catch (e) {
      const o = document.getElementById('dbclBang');
      if (o) o.innerHTML = '<div class="db-canh">Không tải được số liệu: ' + chan(e.message) + '</div>';
    } finally {
      DANG_TAI = false;
    }
  }

  function o(khoi, ma) {
    return SO_LIEU[LOAI + '|' + KY + '|' + khoi + '|' + ma];
  }

  /* ========================================================================
     BẢNG NHẬP SỐ LIỆU
     ======================================================================== */
  function veBangNhap() {
    const hop = document.getElementById('dbclBang');
    if (!hop) return;
    const sua = coQuyenNhap();

    let html = '<div class="tbl-wrap"><table class="db-tbl"><thead><tr>'
      + '<th style="text-align:left;width:34%">Chỉ tiêu</th>'
      + KHOI.map(k => '<th style="width:13%">Khối ' + k + '</th>').join('')
      + '<th style="width:14%">Đối sánh<br>toàn tỉnh</th></tr></thead><tbody>';

    let nhomHienTai = '';
    CHI_TIEU.forEach(ct => {
      if (ct.nhom !== nhomHienTai) {
        nhomHienTai = ct.nhom;
        html += '<tr class="db-nhom"><td colspan="' + (KHOI.length + 2) + '">'
              + chan(ct.nhom) + '</td></tr>';
      }
      html += '<tr><td class="ten">' + chan(ct.ten)
            + (ct.chi_khoi_9 ? ' <i style="color:#8a94a6;font-size:11.8px">(chỉ khối 9)</i>' : '')
            + '</td>';
      KHOI.forEach(k => {
        const khoa = ct.chi_khoi_9 && k !== 9;
        const r = o(k, ct.ma);
        html += '<td><input data-ma="' + ct.ma + '" data-khoi="' + k + '" data-cot="gia_tri"'
              + ' value="' + chan(r ? r.gia_tri : '') + '"'
              + ' placeholder="' + (khoa ? '—' : chan(goiY(ct))) + '"'
              + (khoa || !sua ? ' disabled' : '') + '></td>';
      });
      const r9 = o(9, ct.ma);
      /* Đối sánh toàn tỉnh lưu chung một giá trị cho cả chỉ tiêu, gắn vào khối 9 */
      html += '<td><input data-ma="' + ct.ma + '" data-khoi="9" data-cot="doi_sanh_tinh"'
            + ' value="' + chan(r9 ? r9.doi_sanh_tinh : '') + '"'
            + ' placeholder="Số của tỉnh"' + (sua ? '' : ' disabled') + '></td></tr>';
    });

    html += '</tbody></table></div>'
      + '<p class="db-goi" id="dbclDem"></p>'
      + '<p class="db-goi">Cách nhập: chỉ tiêu dạng <b>số / tỉ lệ</b> gõ "138/90.8" hoặc "90.8%" · '
      + 'chỉ tiêu <b>điểm</b> gõ "8.86" · chỉ tiêu <b>Đạt</b> gõ "Đ" hoặc "CĐ". '
      + 'Ô tự lưu khi thầy cô bấm ra chỗ khác.'
      + (sua ? '' : ' <b>Tài khoản của thầy cô chỉ xem, không sửa được số liệu này.</b>')
      + '</p>';

    hop.innerHTML = html;
    veBoDem();
    if (sua) {
      hop.querySelectorAll('input').forEach(inp => {
        inp.addEventListener('blur', function () { luuO(this); });
        inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') this.blur(); });
      });
      ganDan(hop);
    }
  }

  /* Cho thầy cô thấy ngay số ô đã lưu vào cơ sở dữ liệu của đúng bảng đang mở.
     Nếu con số này không tăng khi gõ thì biết là chưa lưu được, không phải đoán. */
  function veBoDem() {
    const o1 = document.getElementById('dbclDem');
    if (!o1) return;
    let daNhap = 0, tong = 0;
    CHI_TIEU.forEach(ct => {
      KHOI.forEach(k => {
        if (ct.chi_khoi_9 && k !== 9) return;
        tong++;
        const r = o(k, ct.ma);
        if (r && r.gia_tri && String(r.gia_tri).trim() !== '') daNhap++;
      });
    });
    o1.innerHTML = daNhap
      ? 'Bảng <b>' + chan(TEN_LOAI[LOAI]) + '</b> năm học ' + chan(NAM_HOC)
        + ' đã lưu <b style="color:#15803d">' + daNhap + '/' + tong + ' ô</b>.'
      : 'Bảng <b>' + chan(TEN_LOAI[LOAI]) + '</b> năm học ' + chan(NAM_HOC)
        + ' <b style="color:#b45309">chưa có ô nào</b> — nhập số rồi mới kết xuất được phụ lục.';
  }

  function goiY(ct) {
    if (ct.don_vi === 'diem') return 'vd 8.86';
    if (ct.don_vi === 'dat')  return 'Đ / CĐ';
    if (ct.don_vi === 'text') return 'vd 152/4';
    return 'vd 138/90.8';
  }

  async function luuO(inp) {
    const ma = inp.dataset.ma, khoi = parseInt(inp.dataset.khoi, 10), cot = inp.dataset.cot;
    const key = LOAI + '|' + KY + '|' + khoi + '|' + ma;
    const cu = SO_LIEU[key];
    const giaTri = inp.value.trim();
    if (cu && String(cu[cot] || '') === giaTri) return;   // không đổi thì thôi

    const ban = {
      nam_hoc: NAM_HOC, loai: LOAI, ky: KY, khoi: khoi, chi_tieu_ma: ma,
      gia_tri:       cot === 'gia_tri'       ? (giaTri || null) : (cu ? cu.gia_tri : null),
      doi_sanh_tinh: cot === 'doi_sanh_tinh' ? (giaTri || null) : (cu ? cu.doi_sanh_tinh : null),
      cap_nhat_boi:  window.NGUOI_DUNG ? window.NGUOI_DUNG.id : null,
      cap_nhat_luc:  new Date().toISOString()
    };

    const kq = await sb.from('dbcl_so_lieu')
      .upsert(ban, { onConflict: 'nam_hoc,loai,ky,khoi,chi_tieu_ma' })
      .select().single();

    if (kq.error) {
      if (typeof notify === 'function') notify('Chưa lưu được: ' + kq.error.message);
      return;
    }
    SO_LIEU[key] = kq.data;
    inp.classList.add('vua-luu');
    setTimeout(() => inp.classList.remove('vua-luu'), 900);
    veBoDem();
    veDoiSanh();
  }

  /* ========================================================================
     NHẬP NHANH — ĐỠ PHẢI GÕ TAY 132 Ô

     Ba cách, giải quyết đúng chỗ thầy cô kêu: "gõ tay trên web thì gõ thẳng
     trên Word còn nhanh hơn".

       1. Chép từ bảng Thực trạng sang Chuẩn đầu ra, có mức nâng.
          Căn cứ chính hồ sơ năm 2025-2026 của trường: Phụ lục 2 gần như là
          Phụ lục 1 nâng lên — tỉ lệ +1 điểm phần trăm (92,41 → 93,41), điểm
          trung bình +0,1 (8,76 → 8,86). Nên mức "Nâng vừa" lấy đúng hai con
          số đó làm mặc định.
       2. Lấy số liệu năm học trước của cùng bảng làm nền.
       3. Dán cả vùng ô từ Excel: bôi đen trong bảng tính, bấm vào ô đầu rồi
          Ctrl+V, điền một lúc nhiều dòng nhiều khối.

     Chép và dán đều ghi hàng loạt trong một lượt gọi máy chủ, không phải
     từng ô một.
     ======================================================================== */

  const MUC_NANG = [
    ['0',    'Giữ nguyên, không nâng',                     0,   0],
    ['nhe',  'Nâng nhẹ — tỉ lệ +0,5 · điểm +0,05',       0.5, 0.05],
    ['vua',  'Nâng vừa — tỉ lệ +1 · điểm +0,1',            1,   0.1],
    ['manh', 'Nâng mạnh — tỉ lệ +2 · điểm +0,2',           2,   0.2]
  ];
  let MUC = 'vua';

  function namTruoc(n) {
    const m = String(n).match(/^(\d{4})-(\d{4})$/);
    return m ? (parseInt(m[1], 10) - 1) + '-' + (parseInt(m[2], 10) - 1) : null;
  }

  /* Nâng con số cuối trong ô, giữ nguyên phần chữ và phần số đứng trước.
     Ví dụ "138/90.8" nâng 1 điểm phần trăm thành "138/91.8".
     Chỉ tiêu chiều tốt là 'down' (bỏ học, chưa đạt) thì nâng nghĩa là giảm. */
  /* Sĩ số của một khối, lấy từ ô CT01 dạng "160/4" của chính bảng đích */
  function siSo(khoi) {
    const r = SO_LIEU[LOAI + '|' + KY + '|' + khoi + '|CT01']
           || SO_LIEU['thuc_trang|ca_nam|' + khoi + '|CT01'];
    if (!r || !r.gia_tri) return null;
    const m = String(r.gia_tri).match(/^\s*(\d+)\s*\//);
    return m ? parseInt(m[1], 10) : null;
  }

  function nangGiaTri(ct, giaTri, buocTiLe, buocDiem, khoi) {
    if (ct.don_vi === 'dat' || ct.don_vi === 'text') return giaTri;
    const buoc = ct.don_vi === 'diem' ? buocDiem : buocTiLe;
    if (!buoc) return giaTri;
    const m = String(giaTri).replace(/,/g, '.').match(/^(.*?)([0-9]+\.?[0-9]*)([^0-9]*)$/);
    if (!m) return giaTri;
    let n = parseFloat(m[2]);
    if (isNaN(n)) return giaTri;
    n += (ct.chieu_tot === 'up' ? 1 : -1) * buoc;
    const tran = ct.don_vi === 'diem' ? 10 : 100;
    if (n > tran) n = tran;
    if (n < 0) n = 0;
    n = Math.round(n * 100) / 100;

    /* Ô dạng "138/90.8" nghĩa là 138 em, đạt 90,8%. Nếu chỉ nâng tỉ lệ mà giữ
       nguyên số em thì hai con số trong cùng một ô không còn chia ra nhau —
       đúng loại vênh mà hệ thống này sinh ra để chặn. Nên tính lại số em
       theo sĩ số khối. Không biết sĩ số thì trả về mình tỉ lệ, khỏi bịa. */
    const daySo = /^\s*(\d+)\s*\/\s*$/.exec(m[1]);
    if (ct.don_vi === 'so_ti_le' && daySo) {
      const ss = siSo(khoi);
      if (ss == null) return String(n) + m[3];
      return String(Math.round(ss * n / 100)) + '/' + String(n) + m[3];
    }
    return m[1] + String(n) + m[3];
  }

  /* Ghi hàng loạt rồi nạp lại vào bộ nhớ trong trang */
  async function ghiHangLoat(rows) {
    if (!rows.length) return { loi: null, so: 0 };
    const kq = await sb.from('dbcl_so_lieu')
      .upsert(rows, { onConflict: 'nam_hoc,loai,ky,khoi,chi_tieu_ma' }).select();
    if (kq.error) return { loi: kq.error.message, so: 0 };
    (kq.data || []).forEach(r => {
      SO_LIEU[r.loai + '|' + r.ky + '|' + r.khoi + '|' + r.chi_tieu_ma] = r;
    });
    return { loi: null, so: (kq.data || []).length };
  }

  /* Chép một bảng nguồn vào bảng đang mở */
  async function chepTu(nguonLoai, nguonNam, nguonKy, tenNguon) {
    /* Bảng Thực trạng đầu năm phải là số THỰC TẾ. Nâng số thực trạng lên là
       bịa số liệu gốc, và mọi đối sánh phía sau lệch theo. Nên ép giữ nguyên. */
    const muc = (LOAI === 'thuc_trang')
      ? MUC_NANG[0]
      : (MUC_NANG.find(m => m[0] === MUC) || MUC_NANG[0]);

    /* Nguồn cùng năm thì đã có sẵn, khác năm thì phải hỏi máy chủ */
    let nguon = {};
    if (nguonNam === NAM_HOC) {
      CHI_TIEU.forEach(ct => KHOI.forEach(k => {
        const r = SO_LIEU[nguonLoai + '|' + nguonKy + '|' + k + '|' + ct.ma];
        if (r && r.gia_tri) nguon[k + '|' + ct.ma] = r.gia_tri;
      }));
    } else {
      const kq = await sb.from('dbcl_so_lieu').select('khoi, chi_tieu_ma, gia_tri')
        .eq('nam_hoc', nguonNam).eq('loai', nguonLoai).eq('ky', nguonKy);
      if (kq.error) { notify('Không đọc được số liệu nguồn: ' + kq.error.message); return; }
      (kq.data || []).forEach(r => { if (r.gia_tri) nguon[r.khoi + '|' + r.chi_tieu_ma] = r.gia_tri; });
    }

    const soNguon = Object.keys(nguon).length;
    if (!soNguon) {
      notify('Bảng nguồn "' + tenNguon + '" chưa có ô nào, không có gì để chép.');
      return;
    }

    /* Đếm trước xem sẽ đè lên bao nhiêu ô đang có, rồi mới hỏi */
    let deLen = 0;
    Object.keys(nguon).forEach(kh => {
      const cu = SO_LIEU[LOAI + '|' + KY + '|' + kh];
      if (cu && cu.gia_tri && String(cu.gia_tri).trim() !== '') deLen++;
    });

    const hoi = 'Chép ' + soNguon + ' ô từ "' + tenNguon + '" sang bảng "'
      + TEN_LOAI[LOAI] + '" của năm học ' + NAM_HOC + '.\n\n'
      + 'Mức nâng: ' + muc[1] + '\n'
      + (deLen ? '\n⚠ Sẽ GHI ĐÈ ' + deLen + ' ô đang có số liệu.\n' : '')
      + '\nThầy cô đồng ý chứ?';
    if (!window.confirm(hoi)) return;

    const nguoi = window.NGUOI_DUNG ? window.NGUOI_DUNG.id : null;
    const luc = new Date().toISOString();
    const rows = [];
    CHI_TIEU.forEach(ct => KHOI.forEach(k => {
      if (ct.chi_khoi_9 && k !== 9) return;
      const v = nguon[k + '|' + ct.ma];
      if (v == null || String(v).trim() === '') return;
      const cu = SO_LIEU[LOAI + '|' + KY + '|' + k + '|' + ct.ma];
      rows.push({
        nam_hoc: NAM_HOC, loai: LOAI, ky: KY, khoi: k, chi_tieu_ma: ct.ma,
        gia_tri: nangGiaTri(ct, v, muc[2], muc[3], k),
        doi_sanh_tinh: cu ? cu.doi_sanh_tinh : null,
        cap_nhat_boi: nguoi, cap_nhat_luc: luc
      });
    }));

    const kq = await ghiHangLoat(rows);
    if (kq.loi) { notify('Chưa chép được: ' + kq.loi); return; }
    veBangNhap(); veDoiSanh();
    notify('Đã chép ' + kq.so + ' ô từ "' + tenNguon + '" với mức ' + muc[1].toLowerCase()
      + '. Thầy cô rà lại rồi chỉnh những ô cần khác đi.');
  }

  /* Dán cả vùng ô từ Excel vào bảng */
  async function danVung(oGiaTri, viTri, txt) {
    const bang = txt.replace(/\r/g, '').replace(/\n+$/, '').split('\n').map(d => d.split('\t'));
    const r0 = Math.floor(viTri / KHOI.length), c0 = viTri % KHOI.length;
    const nguoi = window.NGUOI_DUNG ? window.NGUOI_DUNG.id : null;
    const luc = new Date().toISOString();
    const rows = [];
    let boQua = 0;

    bang.forEach((dong, i) => dong.forEach((oVal, j) => {
      const r = r0 + i, c = c0 + j;
      if (r >= CHI_TIEU.length || c >= KHOI.length) { boQua++; return; }
      const ct = CHI_TIEU[r], k = KHOI[c];
      if (ct.chi_khoi_9 && k !== 9) { boQua++; return; }
      const v = String(oVal).trim();
      const cu = SO_LIEU[LOAI + '|' + KY + '|' + k + '|' + ct.ma];
      rows.push({
        nam_hoc: NAM_HOC, loai: LOAI, ky: KY, khoi: k, chi_tieu_ma: ct.ma,
        gia_tri: v || null,
        doi_sanh_tinh: cu ? cu.doi_sanh_tinh : null,
        cap_nhat_boi: nguoi, cap_nhat_luc: luc
      });
    }));

    if (!rows.length) { notify('Không có ô nào dán được vào vị trí này.'); return; }
    const kq = await ghiHangLoat(rows);
    if (kq.loi) { notify('Chưa dán được: ' + kq.loi); return; }
    veBangNhap(); veDoiSanh();
    notify('Đã dán ' + kq.so + ' ô'
      + (boQua ? ', bỏ qua ' + boQua + ' ô vượt ra ngoài bảng hoặc thuộc khối bị khóa' : '') + '.');
  }

  function ganDan(hop) {
    const oGiaTri = Array.from(hop.querySelectorAll('input[data-cot="gia_tri"]'));
    oGiaTri.forEach((inp, idx) => {
      inp.addEventListener('paste', function (e) {
        const dl = e.clipboardData || window.clipboardData;
        const txt = dl ? dl.getData('text') : '';
        /* Dán một ô lẻ thì để trình duyệt tự làm như bình thường */
        if (!txt || !/[\t\n]/.test(txt)) return;
        e.preventDefault();
        danVung(oGiaTri, idx, txt);
      });
    });
  }

  function veNhanh() {
    const hop = document.getElementById('dbclNhanh');
    if (!hop) return;
    if (!coQuyenNhap()) { hop.innerHTML = ''; return; }

    const nt = namTruoc(NAM_HOC);
    const nut = [];
    const laThucTrang = (LOAI === 'thuc_trang');
    if (!laThucTrang) {
      nut.push('<button class="btn btn-pri" id="dbclChepTT">⧉ Chép từ bảng Thực trạng đầu năm</button>');
    }
    if (LOAI === 'ket_qua') {
      nut.push('<button class="btn btn-out" id="dbclChepCDR">⧉ Chép từ Chuẩn đầu ra</button>');
    }
    if (nt) {
      nut.push('<button class="btn btn-out" id="dbclChepNT">↩ Lấy bảng này của năm ' + chan(nt) + '</button>');
    }

    hop.innerHTML = '<div class="db-nhanh">'
      + '<div class="hang">'
      /* Bảng Thực trạng không cho chọn mức nâng — số thực tế thì không nâng */
      + (laThucTrang ? ''
          : '<label style="font-size:13.2px;font-weight:600;color:var(--muted)">Mức nâng khi chép</label>'
            + '<select id="dbclMuc">'
            + MUC_NANG.map(m => '<option value="' + m[0] + '"' + (m[0] === MUC ? ' selected' : '') + '>'
                + chan(m[1]) + '</option>').join('')
            + '</select>')
      + nut.join('')
      + '</div>'
      + (laThucTrang
          ? '<p class="goi"><b>Bảng Thực trạng đầu năm luôn chép nguyên, không nâng</b> — '
            + 'đây phải là số thực tế, nâng lên là bịa số liệu gốc.</p>'
          : '')
      + '<p class="goi"><b>Dán từ Excel:</b> bôi đen vùng ô trong bảng tính, bấm vào ô đầu tiên '
      + 'trong bảng dưới đây rồi Ctrl+V — hệ thống điền một lúc nhiều dòng, nhiều khối. '
      + '<br><b>Mức nâng “vừa”</b> lấy đúng cách Nhà trường đã làm năm 2025-2026: tỉ lệ nâng 1 điểm '
      + 'phần trăm, điểm trung bình nâng 0,1. Chép xong vẫn nên rà lại từng dòng.</p>'
      + '</div>';

    const sel = document.getElementById('dbclMuc');
    if (sel) sel.addEventListener('change', function () { MUC = this.value; });

    const b1 = document.getElementById('dbclChepTT');
    if (b1) b1.addEventListener('click', () =>
      chepTu('thuc_trang', NAM_HOC, 'ca_nam', 'Thực trạng đầu năm ' + NAM_HOC));
    const b2 = document.getElementById('dbclChepCDR');
    if (b2) b2.addEventListener('click', () =>
      chepTu('chuan_dau_ra', NAM_HOC, 'ca_nam', 'Chuẩn đầu ra ' + NAM_HOC));
    const b3 = document.getElementById('dbclChepNT');
    if (b3) b3.addEventListener('click', () =>
      chepTu(LOAI, nt, KY, TEN_LOAI[LOAI] + ' năm ' + nt));
  }

  /* ========================================================================
     ĐỐI SÁNH CHUẨN ĐẦU RA VỚI KẾT QUẢ THỰC HIỆN
     ======================================================================== */
  function so(t) {
    const m = String(t == null ? '' : t).replace(/,/g, '.').match(/([0-9]+\.?[0-9]*)[^0-9]*$/);
    return m ? parseFloat(m[1]) : null;
  }

  function veDoiSanh() {
    const hop = document.getElementById('dbclDoiSanh');
    if (!hop) return;

    /* Soát vênh sĩ số giữa thực trạng và chuẩn đầu ra — lỗi đã có thật trong hồ sơ giấy */
    const venh = [];
    KHOI.forEach(k => {
      const a = SO_LIEU['thuc_trang|ca_nam|' + k + '|CT01'];
      const b = SO_LIEU['chuan_dau_ra|ca_nam|' + k + '|CT01'];
      if (a && b && a.gia_tri && b.gia_tri && a.gia_tri.trim() !== b.gia_tri.trim()) {
        venh.push('khối ' + k + ' ghi <b>' + chan(a.gia_tri) + '</b> ở Phụ lục 1 nhưng <b>'
                + chan(b.gia_tri) + '</b> ở Phụ lục 2 và 16');
      }
    });

    /* Đối chiếu từng chỉ tiêu: kết quả thực hiện so với chuẩn đã cam kết */
    const dong = [];
    let soDat = 0, soHut = 0;
    CHI_TIEU.forEach(ct => {
      if (ct.don_vi === 'text') return;
      KHOI.forEach(k => {
        if (ct.chi_khoi_9 && k !== 9) return;
        const c = SO_LIEU['chuan_dau_ra|ca_nam|' + k + '|' + ct.ma];
        const r = SO_LIEU['ket_qua|' + KY + '|' + k + '|' + ct.ma];
        if (!c || !r || !c.gia_tri || !r.gia_tri) return;
        const nc = so(c.gia_tri), nr = so(r.gia_tri);
        if (nc == null || nr == null) return;
        const dat = ct.chieu_tot === 'up' ? nr >= nc : nr <= nc;
        if (dat) { soDat++; return; }              // chỉ liệt kê chỗ chưa đạt
        soHut++;
        dong.push('<div class="db-ds-dong"><b>Khối ' + k + '</b> · ' + chan(ct.ten)
          + '<span class="lech db-thieu">cam kết ' + chan(c.gia_tri)
          + ' → đạt ' + chan(r.gia_tri) + '</span></div>');
      });
    });

    let html = '';
    if (venh.length) {
      html += '<div class="db-canh"><b>⚠ Số liệu vênh nhau giữa các phụ lục:</b><br>'
            + venh.join('<br>') + '<br><i>Phải sửa cho khớp trước khi ký, vì Phụ lục 16 là bản gửi Sở.</i></div>';
    }
    if (!soDat && !soHut) {
      html += '<div class="db-canh db-ok">Chưa đủ dữ liệu để đối sánh. Cần nhập cả '
            + '<b>Chuẩn đầu ra</b> và <b>Kết quả thực hiện</b> của cùng năm học.</div>';
    } else {
      html += '<div class="db-canh ' + (soHut ? '' : 'db-ok') + '">'
            + '<b>Đối sánh ' + chan(KY === 'ca_nam' ? 'cả năm' : 'học kì I') + ':</b> '
            + soDat + ' chỉ tiêu đạt hoặc vượt cam kết'
            + (soHut ? ', <b>' + soHut + ' chỉ tiêu chưa đạt</b> — liệt kê bên dưới.'
                     : '. Không có chỉ tiêu nào hụt.') + '</div>';
      if (dong.length) html += '<div class="db-ds">' + dong.join('') + '</div>';
    }
    hop.innerHTML = html;
  }

  /* ========================================================================
     CAM KẾT CỦA GIÁO VIÊN — PHỤ LỤC 15
     ======================================================================== */
  function veCamKet() {
    const hop = document.getElementById('dbclCamKet');
    if (!hop) return;
    const u = window.NGUOI_DUNG;
    const cuaToi = u ? CAM_KET.find(c => c.giao_vien_id === u.id) : null;

    let html = '';
    if (u && !cuaToi) {
      html += '<button class="btn btn-pri" id="dbclTaoCK">✍ Lập cam kết của tôi cho năm học '
            + chan(NAM_HOC) + '</button>';
    }
    if (!CAM_KET.length) {
      html += '<div class="db-canh db-ok" style="margin-top:12px">Năm học ' + chan(NAM_HOC)
            + ' chưa có cam kết nào. Mỗi thầy cô tự lập cam kết của mình; '
            + 'ban giám hiệu xem và kết xuất được toàn bộ.</div>';
    } else {
      CAM_KET.forEach(c => {
        const laToi = u && c.giao_vien_id === u.id;
        const soDong = Object.keys(CK_DONG[c.id] || {}).length;
        html += '<div class="db-ck-the"><div>'
          + '<b>' + chan(c.ho_ten) + '</b>' + (laToi ? ' <i style="color:#8a94a6">(của tôi)</i>' : '')
          + '<div class="meta">' + chan(c.mon_day || 'Chưa ghi môn')
          + (c.lop_day ? ' · Lớp dạy: ' + chan(c.lop_day) : '')
          + (c.lop_chu_nhiem ? ' · Chủ nhiệm: ' + chan(c.lop_chu_nhiem) : '')
          + ' · ' + soDong + ' chỉ tiêu đã nhập</div></div>'
          + '<span class="db-nhan ' + (c.trang_thai === 'da_ky' ? 'ky">Đã ký' : 'nhap">Đang nhập')
          + '</span>'
          + '<div class="cuoi">'
          + ((laToi || laQuanTri())
              ? '<button class="btn btn-out" data-sua-ck="' + c.id + '">Sửa</button>' : '')
          + '<button class="btn btn-out" data-xuat-ck="' + c.id + '">Xuất phiếu</button>'
          + '</div></div>';
      });
    }
    hop.innerHTML = html;

    const nut = document.getElementById('dbclTaoCK');
    if (nut) nut.addEventListener('click', taoCamKet);
    hop.querySelectorAll('[data-sua-ck]').forEach(b =>
      b.addEventListener('click', () => moSuaCamKet(parseInt(b.dataset.suaCk, 10))));
    hop.querySelectorAll('[data-xuat-ck]').forEach(b =>
      b.addEventListener('click', () => {
        if (typeof window.xuatPhuLuc15 === 'function')
          window.xuatPhuLuc15(parseInt(b.dataset.xuatCk, 10));
      }));
  }

  async function taoCamKet() {
    const u = window.NGUOI_DUNG;
    if (!u) return;
    const kq = await sb.from('dbcl_cam_ket').insert({
      nam_hoc: NAM_HOC, giao_vien_id: u.id, ho_ten: u.ho_ten,
      mon_day: u.to_chuyen_mon || null, trang_thai: 'nhap',
      cap_nhat_boi: u.id
    }).select().single();
    if (kq.error) {
      if (typeof notify === 'function') notify('Chưa lập được cam kết: ' + kq.error.message);
      return;
    }
    CAM_KET.push(kq.data);
    CAM_KET.sort((a, b) => String(a.ho_ten).localeCompare(String(b.ho_ten), 'vi'));
    veCamKet();
    moSuaCamKet(kq.data.id);
  }

  /* Mở lớp phủ có sẵn của trang để nhập chi tiết cam kết */
  function moSuaCamKet(id) {
    const c = CAM_KET.find(x => x.id === id);
    if (!c) return;
    const dong = CK_DONG[id] || {};
    const sua = laQuanTri() || (window.NGUOI_DUNG && c.giao_vien_id === window.NGUOI_DUNG.id);

    let html = '<div class="db-bar">'
      + '<label>Môn dạy</label><input class="db-ck-in" data-truong="mon_day" value="'
        + chan(c.mon_day) + '" style="padding:8px 11px;border:1.5px solid #d7dde8;border-radius:9px">'
      + '<label>Lớp dạy</label><input class="db-ck-in" data-truong="lop_day" value="'
        + chan(c.lop_day) + '" style="padding:8px 11px;border:1.5px solid #d7dde8;border-radius:9px">'
      + '<label>Chủ nhiệm lớp</label><input class="db-ck-in" data-truong="lop_chu_nhiem" value="'
        + chan(c.lop_chu_nhiem) + '" style="padding:8px 11px;border:1.5px solid #d7dde8;border-radius:9px">'
      + '</div>'
      + '<p class="db-goi">Thầy cô chỉ cần điền những khối mình dạy, để trống các ô còn lại.</p>'
      + '<div class="tbl-wrap"><table class="db-tbl"><thead><tr>'
      + '<th style="text-align:left;width:40%">Chỉ tiêu cam kết</th>'
      + KHOI.map(k => '<th>Lớp ' + k + '</th>').join('') + '</tr></thead><tbody>';

    let nhomHienTai = '';
    CHI_TIEU.forEach(ct => {
      if (ct.don_vi === 'text' || ct.don_vi === 'dat') return;   // cam kết chỉ nhận số
      if (ct.nhom !== nhomHienTai) {
        nhomHienTai = ct.nhom;
        html += '<tr class="db-nhom"><td colspan="5">' + chan(ct.nhom) + '</td></tr>';
      }
      html += '<tr><td class="ten">' + chan(ct.ten) + '</td>';
      KHOI.forEach(k => {
        const khoa = (ct.chi_khoi_9 && k !== 9) || !sua;
        html += '<td><input data-ck-ma="' + ct.ma + '" data-ck-khoi="' + k + '" value="'
              + chan(dong[k + '|' + ct.ma] || '') + '"' + (khoa ? ' disabled' : '') + '></td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';

    if (sua) {
      html += '<div style="display:flex;gap:9px;margin-top:15px">'
        + '<button class="btn btn-pri" id="dbclKyCK">'
        + (c.trang_thai === 'da_ky' ? '↩ Bỏ đánh dấu đã ký' : '✅ Đánh dấu đã ký') + '</button>'
        + '<button class="btn btn-out" id="dbclXuatCK">📄 Xuất phiếu Phụ lục 15</button>'
        + '</div>';
    }

    const tt = document.getElementById('shTitle');
    const ss = document.getElementById('shSub');
    const sb2 = document.getElementById('shBody');
    const ic = document.getElementById('shIc');
    if (!tt || !sb2) return;
    if (ic) ic.textContent = '✍';
    tt.textContent = 'Cam kết chất lượng — ' + c.ho_ten;
    if (ss) ss.textContent = 'Phụ lục 15 · Năm học ' + NAM_HOC;
    sb2.innerHTML = html;
    document.getElementById('sheetOverlay').classList.add('on');

    if (!sua) return;
    sb2.querySelectorAll('.db-ck-in').forEach(inp => {
      inp.addEventListener('blur', async function () {
        const b = {}; b[this.dataset.truong] = this.value.trim() || null;
        b.cap_nhat_luc = new Date().toISOString();
        const kq = await sb.from('dbcl_cam_ket').update(b).eq('id', id).select().single();
        if (!kq.error) { Object.assign(c, kq.data); veCamKet(); }
      });
    });
    sb2.querySelectorAll('[data-ck-ma]').forEach(inp => {
      inp.addEventListener('blur', function () { luuDongCamKet(id, this); });
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') this.blur(); });
    });
    const nutKy = document.getElementById('dbclKyCK');
    if (nutKy) nutKy.addEventListener('click', async () => {
      const moi = c.trang_thai === 'da_ky' ? 'nhap' : 'da_ky';
      const kq = await sb.from('dbcl_cam_ket').update({
        trang_thai: moi,
        ngay_ky: moi === 'da_ky' ? new Date().toISOString().slice(0, 10) : null,
        cap_nhat_luc: new Date().toISOString()
      }).eq('id', id).select().single();
      if (kq.error) {
        if (typeof notify === 'function') notify('Chưa đổi được: ' + kq.error.message);
        return;
      }
      Object.assign(c, kq.data);
      veCamKet();
      moSuaCamKet(id);
    });
    const nutXuat = document.getElementById('dbclXuatCK');
    if (nutXuat) nutXuat.addEventListener('click', () => {
      if (typeof window.xuatPhuLuc15 === 'function') window.xuatPhuLuc15(id);
    });
  }

  async function luuDongCamKet(camKetId, inp) {
    const ma = inp.dataset.ckMa, khoi = parseInt(inp.dataset.ckKhoi, 10);
    const giaTri = inp.value.trim();
    const kho = CK_DONG[camKetId] = CK_DONG[camKetId] || {};
    if (String(kho[khoi + '|' + ma] || '') === giaTri) return;

    const kq = await sb.from('dbcl_cam_ket_dong').upsert({
      cam_ket_id: camKetId, khoi: khoi, chi_tieu_ma: ma, gia_tri: giaTri || null
    }, { onConflict: 'cam_ket_id,khoi,chi_tieu_ma' }).select().single();

    if (kq.error) {
      if (typeof notify === 'function') notify('Chưa lưu được: ' + kq.error.message);
      return;
    }
    kho[khoi + '|' + ma] = giaTri;
    inp.classList.add('vua-luu');
    setTimeout(() => inp.classList.remove('vua-luu'), 900);
    veCamKet();
  }

  /* ========================================================================
     THANH ĐIỀU KHIỂN
     ======================================================================== */
  /* ---------------- Hàng tab: mỗi phụ lục một màn hình ---------------- */
  function veTab() {
    const hop = document.getElementById('dbclTab');
    if (!hop) return;
    hop.innerHTML = '<div class="db-tab">'
      + PHU_LUC.map(p => '<button data-pl="' + p.ma + '"' + (p.ma === PL ? ' class="on"' : '')
          + '>' + chan(p.nhan || ('Phụ lục ' + p.ma)) + '</button>').join('')
      + '</div>';
    hop.querySelectorAll('[data-pl]').forEach(b =>
      b.addEventListener('click', function () {
        PL = this.dataset.pl;
        const p = plHienTai();
        if (p.loai) LOAI = p.loai;
        if (LOAI !== 'ket_qua') KY = 'ca_nam';
        veTatCa();
        hop.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }));
  }

  /* ---------------- Tiêu đề phụ lục và thanh công cụ ---------------- */
  function veDe() {
    const hop = document.getElementById('dbclDe');
    if (!hop) return;
    const p = plHienTai();

    const nut = [];
    if (p.xuat) {
      nut.push('<button class="btn btn-pri" id="dbclTaiWord">📄 Tải bản Word</button>');
      nut.push('<button class="btn btn-out" id="dbclTaiMau">⬇ Tải mẫu Excel</button>');
      nut.push('<button class="btn btn-out" id="dbclTaiLen">⬆ Tải tệp Excel lên</button>');
    }

    hop.innerHTML = '<div class="db-de">'
      + '<h3>' + (p.khac ? '' : 'Phụ lục ' + chan(p.ma) + ' — ') + chan(p.ten) + '</h3>'
      + '<p class="mo">Năm học ' + chan(NAM_HOC)
      + (p.ma === '5' ? ' · ' + (KY === 'hoc_ki_1' ? 'Học kì I' : 'Cả năm học') : '')
      + ' · ' + chan(p.mo) + '</p>'
      + (p.chung
          ? '<div class="chung">Số liệu dùng chung với <b>' + chan(p.chung)
            + '</b> — sửa ở màn hình nào cũng như nhau, không phải nhập hai lần.</div>'
          : '')
      + '</div>'
      + (nut.length ? '<div class="db-cong">' + nut.join('') + '</div>' : '');

    const w = document.getElementById('dbclTaiWord');
    if (w) w.addEventListener('click', () => {
      if (typeof window[p.xuat] === 'function') window[p.xuat]();
      else notify('Chưa nạp được phần kết xuất, thầy cô tải lại trang.');
    });
    const m = document.getElementById('dbclTaiMau');
    if (m) m.addEventListener('click', () => {
      if (typeof window.dbclTaiMauExcel === 'function') window.dbclTaiMauExcel();
      else notify('Chưa nạp được phần Excel, thầy cô tải lại trang.');
    });
    const l = document.getElementById('dbclTaiLen');
    if (l) l.addEventListener('click', () => {
      if (typeof window.dbclChonTepExcel === 'function') window.dbclChonTepExcel();
      else notify('Chưa nạp được phần Excel, thầy cô tải lại trang.');
    });
  }

  function veThanh() {
    const hop = document.getElementById('dbclThanh');
    if (!hop) return;
    const nam = [];
    for (let y = 2024; y <= 2030; y++) nam.push(y + '-' + (y + 1));
    const laKQ = plHienTai().ma === '5';

    hop.innerHTML = ''
      + '<label>Năm học</label><select id="dbclNam">'
      + nam.map(n => '<option value="' + n + '"' + (n === NAM_HOC ? ' selected' : '') + '>'
        + n + '</option>').join('') + '</select>'
      + (laKQ
          ? '<label>Kỳ</label><select id="dbclKy">'
            + '<option value="ca_nam"' + (KY === 'ca_nam' ? ' selected' : '') + '>Cả năm học</option>'
            + '<option value="hoc_ki_1"' + (KY === 'hoc_ki_1' ? ' selected' : '') + '>Học kì I</option>'
            + '</select>'
          : '');

    document.getElementById('dbclNam').addEventListener('change', function () {
      NAM_HOC = this.value; taiDuLieu();
    });
    const ky = document.getElementById('dbclKy');
    if (ky) ky.addEventListener('change', function () {
      KY = this.value; veDe(); veNhanh(); veBangNhap(); veDoiSanh();
    });
  }

  /* Bật tắt từng khối theo tab đang mở.
     Ba loại màn hình: số liệu (Phụ lục 1, 2, 5, 16) · cam kết giáo viên
     (Phụ lục 15) · màn hình vận hành do tệp dbcl-vanhanh.js dựng. */
  function veTatCa() {
    const p = plHienTai();
    const laCamKet = p.ma === '15';
    const laKhac = !!p.khac;
    veTab(); veThanh(); veDe();

    const hien = (id, co) => {
      const o1 = document.getElementById(id);
      if (o1) o1.style.display = co ? '' : 'none';
    };
    ['dbclNhanh', 'dbclBang', 'dbclDoiSanh'].forEach(id =>
      hien(id, !laCamKet && !laKhac));
    hien('dbclCamKet', laCamKet);
    hien('dbclKhac', laKhac);

    if (laKhac) {
      /* Mỗi tệp tự đăng ký màn hình của mình vào window.dbclManHinh */
      const kho = window.dbclManHinh || {};
      if (typeof kho[p.ma] === 'function') {
        kho[p.ma](document.getElementById('dbclKhac'), NAM_HOC);
      } else if (typeof window.dbclVeManHinh === 'function') {
        window.dbclVeManHinh(p.ma, document.getElementById('dbclKhac'), NAM_HOC);
      } else {
        const o1 = document.getElementById('dbclKhac');
        if (o1) o1.innerHTML = '<div class="db-canh">Chưa nạp được phần vận hành. '
          + 'Thầy cô tải lại trang.</div>';
      }
      return;
    }
    if (laCamKet) { veCamKet(); return; }
    veNhanh(); veBangNhap(); veDoiSanh();
  }

  /* ========================================================================
     CỬA CHO TỆP KẾT XUẤT LẤY DỮ LIỆU
     ======================================================================== */
  window.duLieuDBCL = function () {
    return {
      namHoc: NAM_HOC, ky: KY,
      chiTieu: CHI_TIEU,
      khoi: KHOI,
      soLieu: SO_LIEU,
      camKet: CAM_KET,
      camKetDong: CK_DONG,
      lay: function (loai, ky, khoi, ma) {
        const r = SO_LIEU[loai + '|' + ky + '|' + khoi + '|' + ma];
        return r ? r : null;
      }
    };
  };
  window.taiLaiDBCL = taiDuLieu;

  /* Cửa cho phần tải mẫu và đọc tệp Excel */
  window.dbclTrangThai = function () {
    const p = plHienTai();
    return {
      namHoc: NAM_HOC, loai: LOAI, ky: KY,
      maPhuLuc: p.ma, tenPhuLuc: p.ten, tenBang: TEN_LOAI[LOAI],
      chiTieu: CHI_TIEU, khoi: KHOI,
      coQuyen: coQuyenNhap(),
      lay: function (khoi, ma) { return SO_LIEU[LOAI + '|' + KY + '|' + khoi + '|' + ma] || null; }
    };
  };
  /* Ghi hàng loạt từ tệp Excel, dùng lại đúng đường ghi của phần nhập tay */
  window.dbclGhiHangLoat = async function (rows) {
    const kq = await ghiHangLoat(rows);
    if (!kq.loi) { veBangNhap(); veDoiSanh(); }
    return kq;
  };

  /* ========================================================================
     KHỞI ĐỘNG SAU KHI ĐĂNG NHẬP XONG
     ======================================================================== */
  document.addEventListener('dangnhap-xong', async () => {
    sb = window.sbClient;
    if (!sb) return;
    await taiDuLieu();
  });
})();
