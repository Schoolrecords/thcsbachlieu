/* ============================================================================
   TỰ ĐÁNH GIÁ — ĐỌC VÀ GHI THẬT TỪ CƠ SỞ DỮ LIỆU

   Trước đây màn hình Tự đánh giá chạy bằng dữ liệu gõ sẵn trong trang: bấm
   chọn mức chỉ đổi trên trình duyệt, tắt trang là mất. Tệp này thay bằng
   dữ liệu thật trong Supabase và lưu lại mọi lựa chọn.

   Lấy về ba thứ:
     · tieu_chi     — nguyên văn Mức 1, Mức 2 theo Phụ lục II Thông tư 57
     · tu_danh_gia  — kết quả nhà trường đã chấm cho năm học đang chọn
     · ho_so        — minh chứng thật, lọc theo tiêu chí mà nó phục vụ

   Ghi lại khi:
     · Bấm Đạt / Không đạt cho từng mức
     · Nhập xong ô mô tả hiện trạng (lưu khi rời ô)

   Ai sửa được: quản trị hệ thống, ban giám hiệu và tổ trưởng — đúng như
   hàng rào bảo vệ đã đặt ở máy chủ cho bảng tu_danh_gia. Người khác vẫn
   xem được đầy đủ nhưng không bấm được.
   ============================================================================ */

(function () {
  'use strict';

  if (typeof CAU_HINH === 'undefined' || !CAU_HINH.DA_NOI) return;

  let sb = null;
  let NAM_HOC = (CAU_HINH.NAM_HOC || '2026-2027');
  let TDG = {};          // mã tiêu chí -> bản ghi tu_danh_gia
  let MC_THEO_TC = {};   // mã tiêu chí -> danh sách minh chứng
  let DANG_TAI = false;

  /* ========================================================================
     KIỂU DÁNG
     ======================================================================== */
  const css = `
  .tdg-ht{margin-top:11px}
  .tdg-ht label{display:block;font-size:12.2px;font-weight:600;color:var(--navy);
    margin-bottom:5px;letter-spacing:.02em}
  .tdg-ht textarea{width:100%;min-height:74px;padding:10px 12px;border:1.5px solid #d7dde8;
    border-radius:10px;font-size:14px;font-family:inherit;line-height:1.6;color:#1f2937;
    background:#fff;resize:vertical}
  .tdg-ht textarea:focus{outline:0;border-color:var(--navy-2)}
  .tdg-ht textarea:disabled{background:#f6f8fb;color:#5b6b85}
  .tdg-ht .goi{font-size:11.6px;color:#8a94a6;margin-top:5px;line-height:1.5}
  .tdg-luu{font-size:12px;color:#15803d;font-weight:600;margin-left:8px;opacity:0;transition:.3s}
  .tdg-luu.hien{opacity:1}
  .tdg-nam{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
  .tdg-nam label{font-size:13.2px;font-weight:600;color:var(--muted)}
  .ev-mc{display:inline-flex;align-items:center;gap:5px;cursor:pointer}
  .ev-mc b{color:var(--navy-2)}
  .tdg-chuadu{background:#fdf3f2;border:1px solid #f3c9c5;color:#8a3428;border-radius:9px;
    padding:9px 12px;font-size:13px;margin-top:10px;line-height:1.55}
  `;
  document.head.insertAdjacentHTML('beforeend', '<style>' + css + '</style>');

  function laQuanTri() {
    const u = window.NGUOI_DUNG;
    return !!u && ['admin', 'ban_giam_hieu'].includes(u.vai_tro);
  }
  /* Đúng theo chính sách tdg_sua đặt ở máy chủ */
  function coQuyenCham() {
    const u = window.NGUOI_DUNG;
    return !!u && (laQuanTri() || u.vai_tro === 'to_truong');
  }

  /* ========================================================================
     TẢI DỮ LIỆU
     ======================================================================== */
  async function taiTuDanhGia() {
    if (!sb || DANG_TAI) return;
    DANG_TAI = true;
    try {
      const [tc, tdg, hs] = await Promise.all([
        sb.from('tieu_chi').select('*').order('so_tt'),
        sb.from('tu_danh_gia').select('*').eq('nam_hoc', NAM_HOC),
        sb.from('ho_so').select('ma, ten, tieu_chi, trang_thai, link_drive')
      ]);
      if (tc.error) throw tc.error;
      if (!tc.data || !tc.data.length) {
        throw new Error('Cơ sở dữ liệu chưa có bộ tiêu chí. Kiểm tra đã chạy tệp sql/12 chưa.');
      }

      TDG = {};
      (tdg.data || []).forEach(r => { TDG[r.tieu_chi_ma] = r; });

      MC_THEO_TC = {};
      (hs.data || []).forEach(h => {
        (h.tieu_chi || []).forEach(ma => {
          (MC_THEO_TC[ma] = MC_THEO_TC[ma] || []).push(h);
        });
      });
      Object.keys(MC_THEO_TC).forEach(k =>
        MC_THEO_TC[k].sort((a, b) => String(a.ma).localeCompare(String(b.ma), 'vi')));

      /* TIEU_CHI khai báo bằng const nên thay từng phần tử, không gán đè */
      TIEU_CHI.length = 0;
      tc.data.forEach(t => {
        const r = TDG[t.ma];
        TIEU_CHI.push({
          code: t.ma,
          std: t.tieu_chuan,
          bb: !!t.bat_buoc,
          name: t.ten,
          m1: t.muc_1,
          m2: t.muc_2,
          self: r ? (r.muc_dat || 0) : 0,
          htM1: r ? (r.hien_trang_m1 || '') : '',
          htM2: r ? (r.hien_trang_m2 || '') : '',
          ev: (MC_THEO_TC[t.ma] || []).map(h => h.ma + '. ' + h.ten)
        });
      });

      renderKdcl();
      if (typeof notify === 'function') {
        notify('Đã tải bộ tiêu chí và kết quả tự đánh giá năm học ' + NAM_HOC + '.');
      }
    } catch (e) {
      console.error('[Tự đánh giá] Không tải được:', e);
      if (typeof notify === 'function') notify('Không tải được dữ liệu tự đánh giá: ' + (e.message || e));
    } finally {
      DANG_TAI = false;
    }
  }

  /* ========================================================================
     GHI XUỐNG CƠ SỞ DỮ LIỆU
     ======================================================================== */
  async function luu(maTC, thayDoi) {
    const cu = TDG[maTC] || {};
    const ban = Object.assign({
      nam_hoc: NAM_HOC,
      tieu_chi_ma: maTC,
      dat_m1: cu.dat_m1 || false,
      dat_m2: cu.dat_m2 || false,
      hien_trang_m1: cu.hien_trang_m1 || null,
      hien_trang_m2: cu.hien_trang_m2 || null
    }, thayDoi, {
      cap_nhat_boi: window.NGUOI_DUNG ? window.NGUOI_DUNG.id : null
    });

    const { data, error } = await sb.from('tu_danh_gia')
      .upsert(ban, { onConflict: 'nam_hoc,tieu_chi_ma' })
      .select().single();

    if (error) throw error;
    TDG[maTC] = data;
    return data;
  }

  /* ========================================================================
     VẼ LẠI MÀN HÌNH — ghi đè hàm cùng tên trong index.html
     ======================================================================== */
  function oHienTrang(c, muc) {
    const chamDuoc = coQuyenCham();
    const gt = muc === 1 ? c.htM1 : c.htM2;
    const goi = muc === 1
      ? 'Mô tả nhà trường đã làm được gì so với yêu cầu của Mức 1, kèm mã minh chứng trong ngoặc — ví dụ (MC.1.1.01, MC.1.1.02).'
      : 'Mô tả phần vượt lên so với Mức 1: đã dùng dữ liệu, phản hồi để cải tiến ra sao, kết quả cải tiến thế nào.';
    return `
      <div class="tdg-ht">
        <label>Hiện trạng, kết quả đạt được của Mức ${muc}
          <span class="tdg-luu" id="luu-${c.code}-${muc}">✓ đã lưu</span></label>
        <textarea id="ht-${c.code}-${muc}" ${chamDuoc ? '' : 'disabled'}
          placeholder="${chamDuoc ? 'Nhập mô tả hiện trạng…' : 'Chỉ ban giám hiệu và tổ trưởng nhập được nội dung này'}"
          onblur="luuHienTrang('${c.code}',${muc},this.value)">${gt ? gt.replace(/</g, '&lt;') : ''}</textarea>
        <div class="goi">${goi}</div>
      </div>`;
  }

  window.renderKdcl = function () {
    const oStd = document.getElementById('kdStd');
    const f = oStd ? oStd.value : '';
    const list = TIEU_CHI.filter(c => !f || String(c.std) === f);
    const chamDuoc = coQuyenCham();
    let no = 0;
    TIEU_CHI.forEach(c => { if (!(c.self >= 1)) no++; });

    document.getElementById('kdList').innerHTML = list.map(c => {
      const datM1 = c.self >= 1, datM2 = c.self >= 2;
      const mc = MC_THEO_TC[c.code] || [];
      return `
      <div class="crit">
        <button class="crit-head" onclick="this.parentNode.classList.toggle('open')">
          <span class="crit-code">${c.code}</span>
          <span class="crit-ttl">${c.name}${c.bb ? ' <span class="tc-bb">Bắt buộc</span>' : ''}</span>
          <span class="badge ${datM2 ? 'badge-m2' : (datM1 ? 'badge-m1' : 'badge-no')}">${datM2 ? 'Đạt Mức 2' : (datM1 ? 'Đạt Mức 1' : 'Không đạt Mức 1')}</span>
          <span class="sub-arrow">▶</span>
        </button>
        <div class="crit-body">
          <div class="lv">
            <span class="lv-tag">MỨC 1</span><p>${c.m1}</p>
            <div class="lv-pick">
              <span class="lv-hoi">Nhà trường tự đánh giá Mức 1:</span>
              ${chamDuoc
                ? `<button class="pick${datM1 ? ' on' : ''}" onclick="setMuc('${c.code}',1,true)">Đạt</button>
                   <button class="pick${!datM1 ? ' on' : ''}" onclick="setMuc('${c.code}',1,false)">Không đạt</button>`
                : `<b style="font-size:13.5px;color:${datM1 ? '#15803d' : '#b91c1c'}">${datM1 ? 'Đạt' : 'Không đạt'}</b>`}
            </div>
            ${oHienTrang(c, 1)}
          </div>
          <div class="lv${datM1 ? '' : ' lv-khoa'}">
            <span class="lv-tag m2">MỨC 2</span><p>${c.m2}</p>
            <div class="lv-pick">
              ${!datM1
                ? `<span class="lv-hoi">Chỉ xem xét Mức 2 khi Mức 1 đã được xác định đạt (Biểu 1, Phụ lục V).</span>`
                : (chamDuoc
                  ? `<span class="lv-hoi">Nhà trường tự đánh giá Mức 2:</span>
                     <button class="pick${datM2 ? ' on' : ''}" onclick="setMuc('${c.code}',2,true)">Đạt</button>
                     <button class="pick${!datM2 ? ' on' : ''}" onclick="setMuc('${c.code}',2,false)">Không đạt</button>`
                  : `<b style="font-size:13.5px;color:${datM2 ? '#15803d' : '#b91c1c'}">${datM2 ? 'Đạt' : 'Không đạt'}</b>`)}
            </div>
            ${datM1 ? oHienTrang(c, 2) : ''}
          </div>
          <div class="ev-box">
            <b>📎 Minh chứng trong kho Hồ sơ số (${mc.length})</b>
            ${mc.length ? `<div class="ev-list">
              ${mc.map(h => `<span class="ev ev-mc" title="${String(h.ten).replace(/"/g, '')}"
                    onclick="openDrive('${h.ma}','')"><b>${h.ma}</b> ${cat(h.ten, 46)}</span>`).join('')}
            </div>` : `<div class="tdg-chuadu">Tiêu chí này chưa có minh chứng nào trong danh mục.
              Vào mục <b>Hồ sơ số</b> để gắn tiêu chí cho minh chứng tương ứng.</div>`}
          </div>
        </div>
      </div>`;
    }).join('');

    const kq = xepMucNhaTruong();
    const bbDat2 = TIEU_CHI.filter(c => c.bb && c.self >= 2).length;
    const soBB = TIEU_CHI.filter(c => c.bb).length || 8;
    document.getElementById('kdStats').innerHTML = `
      <div class="stat"><b style="font-size:22px">${kq.ketLuan}</b><span>Mức thực hiện hoạt động đảm bảo chất lượng</span></div>
      <div class="stat ok"><b>${bbDat2}/${soBB}</b><span>tiêu chí bắt buộc đạt Mức 2</span><div class="prog"><i style="width:${Math.round(bbDat2 / soBB * 100)}%"></i></div></div>
      <div class="stat warn"><b>${kq.clM2}/7</b><span>tiêu chí còn lại đạt Mức 2 <i>(cần ≥ 5)</i></span></div>
      <div class="stat miss"><b>${no}</b><span>tiêu chí chưa đạt Mức 1</span></div>`;

    document.getElementById('kdGiaiThich').innerHTML = kq.vi
      ? `<b>Vì sao xếp mức này:</b> ${kq.vi}`
      : `<b>Vì sao xếp mức này:</b> Toàn bộ ${soBB} tiêu chí bắt buộc đạt Mức 2, ${kq.clM2}/7 tiêu chí còn lại đạt Mức 2 và không có tiêu chí nào chưa đạt Mức 1.`;
  };

  function cat(s, n) {
    s = String(s || '');
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  }

  /* ========================================================================
     BẤM ĐẠT / KHÔNG ĐẠT — lưu thật, chấm tuần tự
     ======================================================================== */
  window.setMuc = async function (code, muc, dat) {
    const c = TIEU_CHI.find(x => x.code === code);
    if (!c) return;
    if (!coQuyenCham()) {
      if (typeof notify === 'function') notify('Chỉ ban giám hiệu và tổ trưởng mới chấm được mức tự đánh giá.');
      return;
    }

    /* Bỏ đạt Mức 1 thì Mức 2 cũng không còn — nguyên tắc tuần tự của Biểu 1 */
    const thayDoi = muc === 1
      ? { dat_m1: dat, dat_m2: dat ? (c.self >= 2) : false }
      : { dat_m1: true, dat_m2: dat };

    const mo = [...document.querySelectorAll('#kdList .crit')].map(e => e.classList.contains('open'));
    try {
      const bg = await luu(code, thayDoi);
      c.self = bg.muc_dat || 0;
      renderKdcl();
      [...document.querySelectorAll('#kdList .crit')].forEach((e, i) => { if (mo[i]) e.classList.add('open'); });
      if (typeof notify === 'function') {
        notify('Đã lưu: tiêu chí ' + code + ' — '
          + (bg.muc_dat === 2 ? 'Đạt Mức 2' : bg.muc_dat === 1 ? 'Đạt Mức 1' : 'Không đạt Mức 1')
          + '. Người chấm và thời điểm đã ghi vào nhật ký.');
      }
    } catch (e) {
      console.error('[Tự đánh giá] Không lưu được:', e);
      if (typeof notify === 'function') notify('Không lưu được: ' + (e.message || e));
    }
  };

  /* ========================================================================
     LƯU MÔ TẢ HIỆN TRẠNG — tự lưu khi rời ô
     ======================================================================== */
  window.luuHienTrang = async function (code, muc, giaTri) {
    const c = TIEU_CHI.find(x => x.code === code);
    if (!c || !coQuyenCham()) return;

    const cu = muc === 1 ? (c.htM1 || '') : (c.htM2 || '');
    const moi = String(giaTri || '').trim();
    if (cu === moi) return;                       // không đổi thì khỏi ghi

    try {
      const bg = await luu(code, muc === 1 ? { hien_trang_m1: moi || null }
                                           : { hien_trang_m2: moi || null });
      if (muc === 1) c.htM1 = moi; else c.htM2 = moi;
      const nhan = document.getElementById('luu-' + code + '-' + muc);
      if (nhan) {
        nhan.classList.add('hien');
        setTimeout(function () { nhan.classList.remove('hien'); }, 2200);
      }
      void bg;
    } catch (e) {
      console.error('[Tự đánh giá] Không lưu mô tả:', e);
      if (typeof notify === 'function') notify('Không lưu được mô tả hiện trạng: ' + (e.message || e));
    }
  };

  /* ========================================================================
     CHỌN NĂM HỌC
     ======================================================================== */
  function themChonNamHoc() {
    const tb = document.querySelector('#view-kdcl .toolbar');
    if (!tb || document.getElementById('kdNamHoc')) return;

    const hop = document.createElement('div');
    hop.className = 'tdg-nam';
    hop.innerHTML = '<label for="kdNamHoc">Năm học:</label>';

    const sel = document.createElement('select');
    sel.id = 'kdNamHoc';
    const nay = parseInt(String(NAM_HOC).slice(0, 4), 10) || 2026;
    for (let i = 1; i >= -3; i--) {
      const nh = (nay + i) + '-' + (nay + i + 1);
      const o = document.createElement('option');
      o.value = nh; o.textContent = nh;
      if (nh === NAM_HOC) o.selected = true;
      sel.appendChild(o);
    }
    sel.addEventListener('change', function () {
      NAM_HOC = this.value;
      taiTuDanhGia();
    });
    hop.appendChild(sel);
    tb.insertBefore(hop, tb.firstChild);
  }

  /* ========================================================================
     KHỞI ĐỘNG SAU KHI ĐĂNG NHẬP XONG
     ======================================================================== */
  document.addEventListener('dangnhap-xong', async () => {
    sb = window.sbClient;
    if (!sb) return;
    themChonNamHoc();
    await taiTuDanhGia();
  });
})();
