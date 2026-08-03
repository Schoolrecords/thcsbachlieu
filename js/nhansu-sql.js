/* ============================================================================
   HỒ SƠ CBGV-NV — ĐỌC DANH SÁCH THẬT TỪ CƠ SỞ DỮ LIỆU

   Thay danh sách nhân sự gõ cứng trong trang bằng 38 CBGVNV thật trong bảng
   moi_tai_khoan (nhập từ "DANH SÁCH GMAIL TOÀN TRƯỜNG ĐANG SỬ DỤNG.xlsx").

   Cách làm giống hoso-sql.js: không sửa index.html — sau khi đăng nhập xong,
   tệp này tải danh sách về, đổ vào mảng NHAN_SU có sẵn rồi gọi lại hàm vẽ.
   Hai hàm hiển thị thẻ người được vẽ lại vì thẻ mẫu có ngày sinh, trình độ,
   SĐT — những thông tin nhà trường KHÔNG đưa lên hệ thống (Nghị định 13/2023).

   Cần chạy trước: sql/05-mo-doc-danh-sach-cbgv.sql (mở quyền đọc danh sách).
   ============================================================================ */

(function () {
  'use strict';

  if (typeof CAU_HINH === 'undefined' || !CAU_HINH.DA_NOI) return;

  /* Xếp mỗi người vào một nhóm thẻ trên màn hình */
  function xepNhom(nguoi) {
    if (nguoi.chuc_vu === 'Hiệu trưởng' || nguoi.chuc_vu === 'Phó Hiệu trưởng') return 'bgh';
    if (nguoi.vai_tro === 'nhan_vien') return 'nv';
    return 'gv';
  }

  /* Dòng mô tả dưới tên: "Giáo viên Toán", "Tổ trưởng chuyên môn — Toán"… */
  function moTa(nguoi) {
    if (nguoi.vai_tro === 'to_truong') return 'Tổ trưởng chuyên môn — ' + (nguoi.to_chuyen_mon || '');
    if (nguoi.to_chuyen_mon) return 'Giáo viên ' + nguoi.to_chuyen_mon;
    return nguoi.chuc_vu || '';
  }

  /* Sắp theo tên gọi (chữ cuối) như danh sách nhà trường quen dùng */
  function tenGoi(hoTen) {
    const tu = String(hoTen).trim().split(/\s+/);
    return tu[tu.length - 1];
  }

  async function taiNhanSu() {
    const sb = window.sbClient;
    if (!sb) return;

    const { data, error } = await sb.from('moi_tai_khoan')
      .select('email, ho_ten, chuc_vu, to_chuyen_mon, vai_tro, ghi_chu');

    if (error || !data || !data.length) {
      console.error('[Nhân sự] Không tải được danh sách:', error);
      if (typeof notify === 'function') {
        notify('Không tải được danh sách CBGVNV — màn hình đang hiển thị dữ liệu mẫu. '
          + 'Kiểm tra đã chạy tệp 05-mo-doc-danh-sach-cbgv.sql chưa.');
      }
      return;
    }

    /* Bỏ tài khoản quản trị kỹ thuật — không thuộc đội ngũ nhà trường */
    const ds = data.filter(n => n.vai_tro !== 'admin');

    /* Hiệu trưởng đứng trước Phó Hiệu trưởng, còn lại xếp theo tên gọi */
    ds.sort((a, b) => {
      if (a.chuc_vu === 'Hiệu trưởng') return -1;
      if (b.chuc_vu === 'Hiệu trưởng') return 1;
      return tenGoi(a.ho_ten).localeCompare(tenGoi(b.ho_ten), 'vi');
    });

    /* Đổ vào mảng NHAN_SU có sẵn: [nhóm, họ tên, mô tả, email, phụ trách hộp] */
    NHAN_SU.length = 0;
    ds.forEach(n => NHAN_SU.push([xepNhom(n), n.ho_ten, moTa(n), n.email, n.ghi_chu || '']));

    /* Cập nhật dòng mô tả nhóm nhân viên cho khớp thực tế */
    const nhomNv = NHOM_NS.find(x => x.id === 'nv');
    if (nhomNv) nhomNv.role = 'Kế toán · Thư viện · Thiết bị · Y tế';

    renderTeam();
    if (typeof notify === 'function') {
      notify('Đã tải danh sách ' + ds.length + ' cán bộ, giáo viên, nhân viên của trường.');
    }
  }

  /* ==========================================================================
     VẼ LẠI THẺ NGƯỜI — thay chỗ ngày sinh bằng thư điện tử
     Ghi đè hàm cùng tên trong index.html, không sửa tệp đó.
     ========================================================================== */
  window.showTeam = function (id, scroll) {
    const n = NHOM_NS.find(x => x.id === id);
    const ds = NHAN_SU.filter(p => p[0] === id);
    document.getElementById('teamList').innerHTML = `
    <div class="group-banner">
      <div class="ic">${n.ico}</div>
      <div><b>${n.name}</b><span>${n.role} · ${ds.length} thành viên</span></div>
    </div>
    <div class="people">
      ${ds.map((p, i) => `
        <div class="person" onclick="showPerson('${id}',${i})">
          <div class="person-top">
            <div class="ini">${initials(p[1])}</div>
          </div>
          <div class="person-body">
            <b>${p[1]}</b>
            <div class="pr">${p[2]}</div>
            <span class="dob">✉ ${p[3]}</span>
            <div class="pbtn">📂 Hồ sơ cá nhân</div>
          </div>
        </div>`).join('')}
    </div>`;
    if (scroll !== false) document.getElementById('teamList').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  window.showPerson = function (id, idx) {
    const p = NHAN_SU.filter(x => x[0] === id)[idx];
    if (!p) return;
    const nhan = id === 'bgh' ? 'Ban giám hiệu' : (id === 'gv' ? 'Giáo viên' : 'Nhân viên');
    document.getElementById('pBox').innerHTML = `
    <div class="pmodal">
      <div class="pm-top">
        <span class="pm-tag">${nhan}</span>
        <button class="pm-x" onclick="closePerson()">✕</button>
        <div class="pm-av">${initials(p[1])}</div>
        <b>${p[1]}</b>
        <span>${p[2]}</span>
      </div>
      <div class="pm-body">
        <div class="pm-row"><div class="pm-ic">✉</div><div><div class="lb">Thư điện tử (đăng nhập hệ thống)</div><div class="vl" style="font-size:13px">${p[3]}</div></div></div>
        ${p[4] ? `<div class="pm-row"><div class="pm-ic">🗂</div><div><div class="lb">Phân công hồ sơ</div><div class="vl">${p[4]}</div></div></div>` : ''}
        <button class="pm-btn" onclick="openDrive('Hồ sơ cá nhân — ${String(p[1]).replace(/'/g, '')}');closePerson()">📂 Mở hồ sơ cá nhân trên Drive</button>
        <div class="pm-note">Hệ thống không lưu ngày sinh, số điện thoại hay thông tin cá nhân khác của thầy cô — chỉ dùng thư điện tử để đăng nhập, theo Nghị định 13/2023/NĐ-CP.</div>
      </div>
    </div>`;
    document.getElementById('pOverlay').classList.add('on');
    document.body.style.overflow = 'hidden';
  };

  /* Khởi động sau khi đăng nhập xong */
  document.addEventListener('dangnhap-xong', taiNhanSu);
})();
