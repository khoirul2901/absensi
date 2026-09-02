/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Key for storing the GAS URL
export const GAS_URL_STORAGE_KEY = "SIAS_GAS_URL";
export const GAS_TOKEN_STORAGE_KEY = "SIAS_GAS_TOKEN";

export interface SchoolProfile {
  namaSekolah: string;
  alamatSekolah: string;
  npsn?: string;
  telepon?: string;
}

const HARI_MAP_INDEX: { [key: number]: string } = {
  0: "Minggu",
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu"
};

export const DEFAULT_SCHOOL_PROFILE: SchoolProfile = {
  namaSekolah: "AL-HIKAM SCHOOL",
  alamatSekolah: "SENDANG AGUNG",
  npsn: "20512345",
  telepon: "(031) 8901234"
};

export function getSchoolProfile(): SchoolProfile {
  try {
    const saved = localStorage.getItem("SIAS_SCHOOL_PROFILE");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.namaSekolah) {
        return {
          ...DEFAULT_SCHOOL_PROFILE,
          ...parsed
        };
      }
    }
  } catch (e) {}
  return DEFAULT_SCHOOL_PROFILE;
}

export function setSchoolProfile(profile: SchoolProfile): void {
  try {
    localStorage.setItem("SIAS_SCHOOL_PROFILE", JSON.stringify(profile));
  } catch (e) {}
}

export function getGasUrl(): string {
  try {
    const saved = localStorage.getItem(GAS_URL_STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch (e) {}
  return "https://script.google.com/macros/s/AKfycbylMECIaLndEZdF4agMaTbEqRUwWv-yT6gcQJR6Bm_7cke-vzKCeOaAFa9eYC6joKy-9Q/exec";
}

export function setGasUrl(url: string): void {
  try {
    localStorage.setItem(GAS_URL_STORAGE_KEY, url);
  } catch (e) {}
}

export function getGasToken(): string {
  try {
    const saved = localStorage.getItem(GAS_TOKEN_STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch (e) {}
  return "sias_token_smkalhikam";
}

export function getStorageKey(baseKey: string): string {
  const url = getGasUrl() || "default_gas_url";
  const token = getGasToken() || "default_gas_token";
  const combined = url + "_" + token;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const cleanHash = Math.abs(hash).toString(36);
  return `${baseKey}_${cleanHash}`;
}

export function extractArrayData(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.data && Array.isArray(res.data)) return res.data;
  if (res.result && Array.isArray(res.result)) return res.result;
  if (res.list && Array.isArray(res.list)) return res.list;
  if (res.items && Array.isArray(res.items)) return res.items;
  if (res.rows && Array.isArray(res.rows)) return res.rows;
  if (res.PresensiSiswa && Array.isArray(res.PresensiSiswa)) return res.PresensiSiswa;
  if (res.PresensiGuru && Array.isArray(res.PresensiGuru)) return res.PresensiGuru;
  if (res.AbsensiMengajar && Array.isArray(res.AbsensiMengajar)) return res.AbsensiMengajar;
  if (res.JadwalGuru && Array.isArray(res.JadwalGuru)) return res.JadwalGuru;
  if (res.JadwalPelajaran && Array.isArray(res.JadwalPelajaran)) return res.JadwalPelajaran;
  if (res.presensi_siswa && Array.isArray(res.presensi_siswa)) return res.presensi_siswa;
  if (res.presensi_guru && Array.isArray(res.presensi_guru)) return res.presensi_guru;
  if (res.absensi_mengajar && Array.isArray(res.absensi_mengajar)) return res.absensi_mengajar;
  if (res.absensi_mengajar_guru && Array.isArray(res.absensi_mengajar_guru)) return res.absensi_mengajar_guru;
  if (res.jam_pelajaran && Array.isArray(res.jam_pelajaran)) return res.jam_pelajaran;
  if (res.jadwal_pelajaran && Array.isArray(res.jadwal_pelajaran)) return res.jadwal_pelajaran;
  if (res.jadwal_guru && Array.isArray(res.jadwal_guru)) return res.jadwal_guru;
  if (res.laporan && Array.isArray(res.laporan)) return res.laporan;
  if (res.presensi && Array.isArray(res.presensi)) return res.presensi;
  if (res.absensi && Array.isArray(res.absensi)) return res.absensi;
  if (res.presensiSiswa && Array.isArray(res.presensiSiswa)) return res.presensiSiswa;
  if (res.presensiGuru && Array.isArray(res.presensiGuru)) return res.presensiGuru;
  if (res.absensiMengajar && Array.isArray(res.absensiMengajar)) return res.absensiMengajar;
  if (res.jadwalGuru && Array.isArray(res.jadwalGuru)) return res.jadwalGuru;
  if (res.jadwalPelajaran && Array.isArray(res.jadwalPelajaran)) return res.jadwalPelajaran;
  if (res.laporan_siswa && Array.isArray(res.laporan_siswa)) return res.laporan_siswa;
  if (res.laporan_guru && Array.isArray(res.laporan_guru)) return res.laporan_guru;
  if (res.laporanSiswa && Array.isArray(res.laporanSiswa)) return res.laporanSiswa;
  if (res.laporanGuru && Array.isArray(res.laporanGuru)) return res.laporanGuru;
  return [];
}

export function formatToIsoDate(dStr: any): string {
  if (!dStr) return "";
  const s = String(dStr).trim();
  if (s.includes("T")) return s.split("T")[0];
  if (s.match(/^\d{4}-\d{2}-\d{2}$/)) return s;
  if (s.includes("/") || s.includes("-")) {
    const parts = s.split(/[\/\-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
  }
  const dateObj = new Date(dStr);
  if (!isNaN(dateObj.getTime())) {
    return dateObj.toISOString().split("T")[0];
  }
  return s;
}

export function setGasToken(token: string): void {
  // Nonaktif: pengaturan sekarang di-hardcode di getGasToken()
}

export function isUsingMock(): boolean {
  const url = getGasUrl();
  return !url || url.includes("AKfycbzQ4b8j2R3mXz0YV4X_O");
}

// Ensure mock database exists in localStorage
function initMockDb() {
  const getKey = (k: string) => getStorageKey("MOCK_" + k);

  if (!localStorage.getItem(getKey("users"))) {
    localStorage.setItem(getKey("users"), JSON.stringify([
      { username: "admin", password: "admin123", role: "Admin", target_id: "-" }
    ]));
  }
  if (!localStorage.getItem(getKey("data_siswa"))) {
    localStorage.setItem(getKey("data_siswa"), JSON.stringify([
      { id_siswa: "S-001", nisn: "0081234567", nama_siswa: "Ahmad Dani", jenis_kelamin: "Laki-laki", kelas: "XI", jurusan: "RPL 1", no_hp_ortu: "08571234567", qr_content: "QR-S-001" },
      { id_siswa: "S-002", nisn: "0098765432", nama_siswa: "Siti Aminah", jenis_kelamin: "Perempuan", kelas: "XI", jurusan: "RPL 1", no_hp_ortu: "08129876543", qr_content: "QR-S-002" },
      { id_siswa: "S-003", nisn: "0076543210", nama_siswa: "Rizky Pratama", jenis_kelamin: "Laki-laki", kelas: "X", jurusan: "RPL 1", no_hp_ortu: "08132435465", qr_content: "QR-S-003" },
      { id_siswa: "S-004", nisn: "0076543211", nama_siswa: "Dewi Lestari", jenis_kelamin: "Perempuan", kelas: "X", jurusan: "RPL 1", no_hp_ortu: "08132435466", qr_content: "QR-S-004" },
      { id_siswa: "S-005", nisn: "0076543212", nama_siswa: "Budi Santoso", jenis_kelamin: "Laki-laki", kelas: "X", jurusan: "RPL 2", no_hp_ortu: "08132435467", qr_content: "QR-S-005" },
      { id_siswa: "S-006", nisn: "0076543213", nama_siswa: "Nurlaila Fitri", jenis_kelamin: "Perempuan", kelas: "X", jurusan: "RPL 2", no_hp_ortu: "08132435468", qr_content: "QR-S-006" },
      { id_siswa: "S-007", nisn: "0081234568", nama_siswa: "Fajar Ramadhan", jenis_kelamin: "Laki-laki", kelas: "XI", jurusan: "RPL 2", no_hp_ortu: "08571234568", qr_content: "QR-S-007" },
      { id_siswa: "S-008", nisn: "0081234569", nama_siswa: "Putri Anggraeni", jenis_kelamin: "Perempuan", kelas: "XI", jurusan: "RPL 2", no_hp_ortu: "08571234569", qr_content: "QR-S-008" },
      { id_siswa: "S-009", nisn: "0091234570", nama_siswa: "Dimas Arya", jenis_kelamin: "Laki-laki", kelas: "XII", jurusan: "RPL 1", no_hp_ortu: "08571234570", qr_content: "QR-S-009" },
      { id_siswa: "S-010", nisn: "0091234571", nama_siswa: "Zahra Salsabila", jenis_kelamin: "Perempuan", kelas: "XII", jurusan: "RPL 1", no_hp_ortu: "08571234571", qr_content: "QR-S-010" }
    ]));
  }
  if (!localStorage.getItem(getKey("data_guru"))) {
    localStorage.setItem(getKey("data_guru"), JSON.stringify([
      { id_guru: "G-001", nip_nuptk: "198706122015031002", nama_guru: "Bahrul Ulum, S.Kom", jenis_kelamin: "Laki-laki", jabatan_tugas: "Ka. Komli RPL", no_hp: "08123456789", qr_content: "QR-G-001" },
      { id_guru: "G-002", nip_nuptk: "199201042019082001", nama_guru: "Eka Rahmawati, S.Pd", jenis_kelamin: "Perempuan", jabatan_tugas: "Waka Kurikulum", no_hp: "08198765432", qr_content: "QR-G-002" }
    ]));
  }
  if (!localStorage.getItem(getKey("laporan_siswa"))) {
    localStorage.setItem(getKey("laporan_siswa"), JSON.stringify([]));
  }
  if (!localStorage.getItem(getKey("laporan_guru"))) {
    localStorage.setItem(getKey("laporan_guru"), JSON.stringify([]));
  }
  if (!localStorage.getItem(getKey("pengaturan_jam"))) {
    localStorage.setItem(getKey("pengaturan_jam"), JSON.stringify({
      jam_masuk_mulai: "06:00",
      jam_masuk_batas: "07:15",
      jam_pulang_mulai: "15:30"
    }));
  }
  if (!localStorage.getItem(getKey("hari_libur"))) {
    localStorage.setItem(getKey("hari_libur"), JSON.stringify([
      { tanggal: "2026-08-17", keterangan: "Hari Kemerdekaan RI" }
    ]));
  }
  if (!localStorage.getItem(getKey("data_kelas"))) {
    localStorage.setItem(getKey("data_kelas"), JSON.stringify([
      { nama_kelas: "X RPL 1", id_guru: "G-001", wali_kelas: "Bahrul Ulum, S.Kom" },
      { nama_kelas: "X RPL 2", id_guru: "-", wali_kelas: "-" },
      { nama_kelas: "XI RPL 1", id_guru: "G-002", wali_kelas: "Eka Rahmawati, S.Pd" },
      { nama_kelas: "XI RPL 2", id_guru: "-", wali_kelas: "-" },
      { nama_kelas: "XII RPL 1", id_guru: "-", wali_kelas: "-" }
    ]));
  }
  if (!localStorage.getItem(getKey("jam_pelajaran"))) {
    localStorage.setItem(getKey("jam_pelajaran"), JSON.stringify([
      { id_jam: "JP-1", jam_ke: 1, nama_jam: "Jam ke-1", jam_mulai: "07:00", jam_selesai: "07:45", tipe: "Pelajaran" },
      { id_jam: "JP-2", jam_ke: 2, nama_jam: "Jam ke-2", jam_mulai: "07:45", jam_selesai: "08:30", tipe: "Pelajaran" },
      { id_jam: "JP-3", jam_ke: 3, nama_jam: "Jam ke-3", jam_mulai: "08:30", jam_selesai: "09:15", tipe: "Pelajaran" },
      { id_jam: "JP-IST1", jam_ke: 0, nama_jam: "Istirahat Pertama", jam_mulai: "09:15", jam_selesai: "09:45", tipe: "Istirahat" },
      { id_jam: "JP-4", jam_ke: 4, nama_jam: "Jam ke-4", jam_mulai: "09:45", jam_selesai: "10:30", tipe: "Pelajaran" },
      { id_jam: "JP-5", jam_ke: 5, nama_jam: "Jam ke-5", jam_mulai: "10:30", jam_selesai: "11:15", tipe: "Pelajaran" },
      { id_jam: "JP-6", jam_ke: 6, nama_jam: "Jam ke-6", jam_mulai: "11:15", jam_selesai: "12:00", tipe: "Pelajaran" },
      { id_jam: "JP-IST2", jam_ke: 0, nama_jam: "ISOMA (Istirahat & Sholat)", jam_mulai: "12:00", jam_selesai: "13:00", tipe: "Istirahat" },
      { id_jam: "JP-7", jam_ke: 7, nama_jam: "Jam ke-7", jam_mulai: "13:00", jam_selesai: "13:45", tipe: "Pelajaran" },
      { id_jam: "JP-8", jam_ke: 8, nama_jam: "Jam ke-8", jam_mulai: "13:45", jam_selesai: "14:30", tipe: "Pelajaran" }
    ]));
  }
  if (!localStorage.getItem(getKey("jadwal_pelajaran"))) {
    localStorage.setItem(getKey("jadwal_pelajaran"), JSON.stringify([
      { id_jadwal: "JPEL-101", hari: "Senin", id_jam: "JP-1", jam_ke: 1, jam_mulai: "07:00", jam_selesai: "07:45", kelas: "XI RPL 1", mapel: "Pemrograman Web", id_guru: "G-001", nama_guru: "Bahrul Ulum, S.Kom", ruangan: "Lab Komputer 1" },
      { id_jadwal: "JPEL-102", hari: "Senin", id_jam: "JP-2", jam_ke: 2, jam_mulai: "07:45", jam_selesai: "08:30", kelas: "XI RPL 1", mapel: "Pemrograman Web", id_guru: "G-001", nama_guru: "Bahrul Ulum, S.Kom", ruangan: "Lab Komputer 1" },
      { id_jadwal: "JPEL-103", hari: "Senin", id_jam: "JP-3", jam_ke: 3, jam_mulai: "08:30", jam_selesai: "09:15", kelas: "XI RPL 1", mapel: "Matematika", id_guru: "G-002", nama_guru: "Eka Rahmawati, S.Pd", ruangan: "R. XI RPL 1" },
      { id_jadwal: "JPEL-104", hari: "Selasa", id_jam: "JP-1", jam_ke: 1, jam_mulai: "07:00", jam_selesai: "07:45", kelas: "X RPL 1", mapel: "Informatika", id_guru: "G-001", nama_guru: "Bahrul Ulum, S.Kom", ruangan: "Lab Komputer 2" }
    ]));
  }
  if (!localStorage.getItem(getKey("absensi_mengajar_guru"))) {
    localStorage.setItem(getKey("absensi_mengajar_guru"), JSON.stringify([]));
  }
}

export function getStorage(key: string): any {
  try {
    return JSON.parse(localStorage.getItem(getStorageKey("MOCK_" + key)) || "[]");
  } catch (e) {
    return [];
  }
}

export function setStorage(key: string, val: any): void {
  try {
    localStorage.setItem(getStorageKey("MOCK_" + key), JSON.stringify(val));
  } catch (e) {}
}

export function normalizeTeacherName(str: string): string {
  return String(str || "")
    .toLowerCase()
    .replace(/[,.]/g, " ")
    .replace(/\b(s|m|dr|drs|dra|prof|ir|h|hj)\s*\.?\s*(pd|kom|ag|is|si|se|mm|hum|st|pt|tp|sos|ip|ed|pdi|mat|bio|fis|med)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isTeacherMatchSchedule(scheduleItem: any, teacherObj: any): boolean {
  if (!scheduleItem || !teacherObj) return false;
  const sId = String(scheduleItem.id_guru || "").trim().toLowerCase();
  const sName = String(scheduleItem.nama_guru || "").trim().toLowerCase();
  const tId = String(teacherObj.id_guru || "").trim().toLowerCase();
  const tNip = String(teacherObj.nip_nuptk || teacherObj.nip || "").trim().toLowerCase();
  const tName = String(teacherObj.nama_guru || "").trim().toLowerCase();

  if (sId && tId) {
    if (sId === tId || sId === tNip) return true;
    const sWithout = sId.replace(/^(guru|id|nip|g)[_:\-\s]+/i, '');
    const tWithout = tId.replace(/^(guru|id|nip|g)[_:\-\s]+/i, '');
    if (sWithout && tWithout && sWithout === tWithout) return true;
  }

  if (sName && tName) {
    if (sName === tName || sName.includes(tName) || tName.includes(sName)) return true;
    const n1 = normalizeTeacherName(sName);
    const n2 = normalizeTeacherName(tName);
    if (n1 && n2 && (n1 === n2 || n1.includes(n2) || n2.includes(n1))) return true;
  }
  return false;
}

let lastAutoAlfaRunTime = 0;
let lastAutoAlfaResult: any = null;

/**
 * Otomatisasi Status Alfa:
 * Jika guru atau siswa tidak melakukan absensi di hari guru yang terdapat jadwal
 * baik mengajar maupun fleksibel sampai batas waktu jam 18.00 di hari yang sama
 * maka sistem akan secara otomatis menulis alfa/tidak hadir.
 */
export function jalankanAutoAlfaSistem(tanggalTarget?: string, forceCheck: boolean = false): any {
  initMockDb();
  const todayStr = new Date().toISOString().split("T")[0];
  const targetTgl = tanggalTarget ? formatToIsoDate(tanggalTarget) : todayStr;
  
  if (!forceCheck && !tanggalTarget && lastAutoAlfaResult && (Date.now() - lastAutoAlfaRunTime < 15000)) {
    return lastAutoAlfaResult;
  }

  const cfg = JSON.parse(localStorage.getItem(getStorageKey("MOCK_pengaturan_jam")) || localStorage.getItem(getStorageKey("pengaturan_jam")) || "{}");
  const batasJamAlfa = cfg.jam_batas_alfa || "18:00";
  const nowTime = new Date().toTimeString().slice(0, 5);

  const isToday = (targetTgl === todayStr);
  const isPassedCutoff = !isToday || nowTime >= batasJamAlfa || forceCheck;

  if (!isPassedCutoff) {
    return {
      tanggal: targetTgl,
      isPassedCutoff: false,
      isHoliday: false,
      cutoffTime: batasJamAlfa,
      siswaAlfaCount: 0,
      guruAlfaCount: 0,
      mengajarAlfaCount: 0,
      siswa_alfa_baru: 0,
      guru_alfa_baru: 0,
      guru_mengajar_alfa_baru: 0,
      totalUpdated: 0,
      message: `Batas waktu jam ${batasJamAlfa} WIB belum terlewati (Waktu saat ini: ${nowTime} WIB). Pengecekan otomatis Alfa aktif setelah jam ${batasJamAlfa} WIB.`
    };
  }

  // Parse day name (e.g. Senin, Selasa, dll)
  const dParts = targetTgl.split("-").map(Number);
  const dObj = new Date(dParts[0], (dParts[1] || 1) - 1, dParts[2] || 1);
  const dayOfWeek = dObj.getDay(); // 0 is Minggu
  const hariName = HARI_MAP_INDEX[dayOfWeek] || "Senin";

  // Check holiday
  const liburList = getStorage("hari_libur") || [];
  const isHoliday = (dayOfWeek === 0) || liburList.some((l: any) => formatToIsoDate(l.tanggal) === targetTgl);

  if (isHoliday) {
    return {
      tanggal: targetTgl,
      isPassedCutoff: true,
      isHoliday: true,
      cutoffTime: batasJamAlfa,
      siswaAlfaCount: 0,
      guruAlfaCount: 0,
      mengajarAlfaCount: 0,
      siswa_alfa_baru: 0,
      guru_alfa_baru: 0,
      guru_mengajar_alfa_baru: 0,
      totalUpdated: 0,
      message: `Tanggal ${targetTgl} adalah hari libur (${dayOfWeek === 0 ? "Minggu" : "Libur Sekolah"}), tidak ada pencatatan Alfa otomatis.`
    };
  }

  let siswaAlfaCount = 0;
  let guruAlfaCount = 0;
  let mengajarAlfaCount = 0;

  // -------------------------------------------------------------
  // 1. SISWA: Seluruh siswa di data_siswa yang belum absen pada hari aktif
  // -------------------------------------------------------------
  const dataSiswa = getStorage("data_siswa") || [];
  let laporanSiswa = getStorage("laporan_siswa") || [];

  // Fast Hash Map lookup for existing student reports on target date
  const existingSiswaLogMap = new Map<string, number>();
  laporanSiswa.forEach((r: any, i: number) => {
    if (formatToIsoDate(r.tanggal) === targetTgl) {
      const rId = String(r.id_siswa || r.nisn || r.id_target || "").trim().toLowerCase();
      const rName = String(r.nama_siswa || r.nama || "").trim().toLowerCase();
      if (rId) existingSiswaLogMap.set(rId, i);
      if (rName) existingSiswaLogMap.set(rName, i);
    }
  });

  dataSiswa.forEach((s: any, idx: number) => {
    if (!s || (!s.id_siswa && !s.nama_siswa)) return;
    const sId = String(s.id_siswa || s.nisn || "").trim().toLowerCase();
    const sName = String(s.nama_siswa || "").trim().toLowerCase();

    const existIdx = (sId && existingSiswaLogMap.has(sId))
      ? existingSiswaLogMap.get(sId)!
      : (sName && existingSiswaLogMap.has(sName) ? existingSiswaLogMap.get(sName)! : -1);

    if (existIdx === -1) {
      // Create new absent record
      const idLog = `LOG-S-ALFA-${targetTgl.replace(/-/g, "")}-${s.id_siswa || idx}`;
      const kVal = String(s.kelas || "").trim();
      const jVal = String(s.jurusan || "").trim();
      const classStr = s.kelas_jurusan || (kVal ? `${kVal} ${jVal}`.trim() : "-");
      
      laporanSiswa.push({
        id_log_siswa: idLog,
        tanggal: targetTgl,
        id_siswa: s.id_siswa || `S-${idx}`,
        nama_siswa: s.nama_siswa || "Siswa",
        kelas_jurusan: classStr,
        jam_masuk: "-",
        status_masuk: "Alfa",
        jam_pulang: "-",
        status_pulang: "Alfa",
        ket: "Otomatis Alfa (Batas 18:00 WIB)"
      });
      siswaAlfaCount++;
    } else {
      // Record already exists: check if unmarked / empty / not yet attended
      const r = laporanSiswa[existIdx];
      const sm = String(r.status_masuk || "").toLowerCase();
      const isAttended = sm.includes("tepat") || sm.includes("terlambat") || sm.includes("hadir") || (r.jam_masuk && r.jam_masuk !== "-");
      const isExcused = sm.includes("sakit") || sm.includes("izin") || sm.includes("dispensasi");

      if (!isAttended && !isExcused) {
        if (r.status_masuk !== "Alfa") {
          laporanSiswa[existIdx].status_masuk = "Alfa";
          laporanSiswa[existIdx].status_pulang = "Alfa";
          laporanSiswa[existIdx].jam_masuk = "-";
          laporanSiswa[existIdx].jam_pulang = "-";
          laporanSiswa[existIdx].ket = "Otomatis Alfa (Batas 18:00 WIB)";
          siswaAlfaCount++;
        }
      }
    }
  });
  setStorage("laporan_siswa", laporanSiswa);

  // -------------------------------------------------------------
  // 2. GURU: HANYA GURU YANG MEMILIKI JADWAL MENGAJAR ATAU FLEKSIBEL HARI INI
  // -------------------------------------------------------------
  const dataGuru = getStorage("data_guru") || [];
  const allJadwalPelajaran = getStorage("jadwal_pelajaran") || [];
  const allJadwalGuru = getStorage("jadwal_guru") || [];
  let laporanGuru = getStorage("laporan_guru") || [];
  let absensiMengajar = getStorage("absensi_mengajar_guru") || [];

  // Schedules strictly for target day
  const teachingToday = allJadwalPelajaran.filter((j: any) => String(j.hari || "").trim().toLowerCase() === hariName.toLowerCase());
  const flexToday = allJadwalGuru.filter((j: any) => String(j.hari || "").trim().toLowerCase() === hariName.toLowerCase());

  // Fast Hash Map lookup for existing teacher daily reports
  const existingGuruLogMap = new Map<string, number>();
  laporanGuru.forEach((r: any, i: number) => {
    if (formatToIsoDate(r.tanggal) === targetTgl) {
      const rId = String(r.id_guru || r.nip_nuptk || r.id_target || "").trim().toLowerCase();
      const rName = String(r.nama_guru || r.nama || "").trim().toLowerCase();
      if (rId) existingGuruLogMap.set(rId, i);
      if (rName) existingGuruLogMap.set(rName, i);
    }
  });

  // Fast Set lookup for logged teaching periods
  const loggedMengajarSet = new Set<string>();
  absensiMengajar.forEach((m: any) => {
    if (formatToIsoDate(m.tanggal) === targetTgl) {
      const gId = String(m.id_guru || "").trim().toLowerCase();
      const gN = normalizeTeacherName(m.nama_guru || "");
      const jKe = Number(m.jam_ke || 1);
      const k = String(m.kelas || "").trim().toLowerCase();
      const mp = String(m.mapel || "").trim().toLowerCase();
      if (gId) loggedMengajarSet.add(`${gId}_${jKe}_${k}_${mp}`);
      if (gN) loggedMengajarSet.add(`${gN}_${jKe}_${k}_${mp}`);
    }
  });

  dataGuru.forEach((g: any, idx: number) => {
    if (!g || (!g.id_guru && !g.nama_guru)) return;
    const gId = String(g.id_guru || g.nip_nuptk || "").trim().toLowerCase();
    const gName = String(g.nama_guru || "").trim().toLowerCase();
    const gNorm = normalizeTeacherName(g.nama_guru || "");

    // Check if this teacher has schedule on target day
    const hasFlex = flexToday.some((f: any) => isTeacherMatchSchedule(f, g));
    const myLessons = teachingToday.filter((t: any) => isTeacherMatchSchedule(t, g));
    const hasTeaching = myLessons.length > 0;

    // IF TEACHER HAS NO SCHEDULE AT ALL TODAY (Off / Libur Tugas): Skip!
    if (!hasFlex && !hasTeaching) {
      return;
    }

    // A. Daily Attendance (PresensiGuru / laporan_guru)
    const existIdx = (gId && existingGuruLogMap.has(gId))
      ? existingGuruLogMap.get(gId)!
      : (gName && existingGuruLogMap.has(gName) ? existingGuruLogMap.get(gName)! : -1);

    if (existIdx === -1) {
      const idLog = `LOG-G-ALFA-${targetTgl.replace(/-/g, "")}-${g.id_guru || idx}`;
      laporanGuru.push({
        id_log_guru: idLog,
        tanggal: targetTgl,
        id_guru: g.id_guru || `G-${idx}`,
        nama_guru: g.nama_guru || "Guru",
        jam_masuk: "-",
        status_masuk: "Alfa",
        jam_pulang: "-",
        status_pulang: "Alfa",
        ket: "Otomatis Alfa (Batas 18:00 WIB)"
      });
      guruAlfaCount++;
    } else {
      const r = laporanGuru[existIdx];
      const sm = String(r.status_masuk || "").toLowerCase();
      const isAttended = sm.includes("tepat") || sm.includes("terlambat") || sm.includes("hadir") || (r.jam_masuk && r.jam_masuk !== "-");
      const isExcused = sm.includes("sakit") || sm.includes("izin") || sm.includes("dispensasi");

      if (!isAttended && !isExcused) {
        if (r.status_masuk !== "Alfa") {
          laporanGuru[existIdx].status_masuk = "Alfa";
          laporanGuru[existIdx].status_pulang = "Alfa";
          laporanGuru[existIdx].jam_masuk = "-";
          laporanGuru[existIdx].jam_pulang = "-";
          laporanGuru[existIdx].ket = "Otomatis Alfa (Batas 18:00 WIB)";
          guruAlfaCount++;
        }
      }
    }

    // B. Teaching Schedule Periods (AbsensiMengajar / absensi_mengajar_guru)
    if (hasTeaching) {
      myLessons.forEach((slot: any) => {
        const slotJamKe = Number(slot.jam_ke || 1);
        const slotKelas = String(slot.kelas || "").trim().toLowerCase();
        const slotMapel = String(slot.mapel || "").trim().toLowerCase();

        const key1 = `${gId}_${slotJamKe}_${slotKelas}_${slotMapel}`;
        const key2 = `${gNorm}_${slotJamKe}_${slotKelas}_${slotMapel}`;

        const alreadyLogged = loggedMengajarSet.has(key1) || loggedMengajarSet.has(key2);

        if (!alreadyLogged) {
          const idLogMeng = `LOG-MENG-ALFA-${targetTgl.replace(/-/g, "")}-${g.id_guru || idx}-${slotJamKe}`;
          absensiMengajar.push({
            id_log_mengajar: idLogMeng,
            tanggal: targetTgl,
            waktu_absen: "-",
            hari: hariName,
            id_guru: g.id_guru || `G-${idx}`,
            nama_guru: g.nama_guru || "Guru",
            kelas: slot.kelas || "-",
            mapel: slot.mapel || "-",
            jam_ke: slotJamKe,
            jam_mulai_jadwal: slot.jam_mulai || "-",
            jam_selesai_jadwal: slot.jam_selesai || "-",
            status: "Tidak Hadir (Alfa)",
            catatan_materi: "Otomatis Alfa (Batas 18:00 WIB)"
          });
          loggedMengajarSet.add(key1);
          loggedMengajarSet.add(key2);
          mengajarAlfaCount++;
        }
      });
    }
  });

  setStorage("laporan_guru", laporanGuru);
  setStorage("absensi_mengajar_guru", absensiMengajar);

  const totalUpdated = siswaAlfaCount + guruAlfaCount + mengajarAlfaCount;
  const resultPayload = {
    tanggal: targetTgl,
    isPassedCutoff: true,
    isHoliday: false,
    cutoffTime: batasJamAlfa,
    siswaAlfaCount,
    guruAlfaCount,
    mengajarAlfaCount,
    siswa_alfa_baru: siswaAlfaCount,
    guru_alfa_baru: guruAlfaCount,
    guru_mengajar_alfa_baru: mengajarAlfaCount,
    totalUpdated,
    message: totalUpdated > 0 
      ? `Auto-Alfa Berhasil (${targetTgl}): ${siswaAlfaCount} siswa, ${guruAlfaCount} presensi guru, dan ${mengajarAlfaCount} jam mengajar ditandai Alfa.`
      : `Pengecekan Auto-Alfa selesai (${targetTgl}): Semua siswa dan guru berjadwal telah memiliki data kehadiran valid.`
  };

  lastAutoAlfaRunTime = Date.now();
  lastAutoAlfaResult = resultPayload;

  return resultPayload;
}

export function jalankanAutoAlfaSistemRentang(hariKebelakang: number = 7, forceCheck: boolean = false): any[] {
  const results: any[] = [];
  for (let i = 0; i <= hariKebelakang; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const isToday = (i === 0);
    const res = jalankanAutoAlfaSistem(dateStr, isToday ? forceCheck : true);
    results.push(res);
  }
  return results;
}

// Call local mock APIs
export function callMock(action: string, args: any[] = []): any {
  initMockDb();

  switch (action) {
    case "verifikasiLogin": {
      const [username, password] = args;
      
      // 1. Check mock users first (admin)
      const users = getStorage("users");
      const found = users.find((u: any) => u.username === username && u.password === password);
      if (found) {
        return { success: true, role: found.role, target_id: found.target_id, username: found.username, message: "Login Berhasil (SIMULASI)" };
      }
      
      // 2. Check mock teachers
      const teachers = getStorage("data_guru");
      const foundTeacher = teachers.find((t: any) => {
        const namaGuru = String(t.nama_guru || "").trim();
        const teacherUsername = namaGuru.replace(/\s+/g, "").toLowerCase();
        const inputUserLower = String(username).replace(/\s+/g, "").toLowerCase();
        
        // Match user by teacher's lowercase name without spaces
        const matchUser = (inputUserLower === teacherUsername);
        
        if (matchUser) {
          const inputPass = String(password).trim();
          const dbPass = String(t.password || "guru123").trim();
          return inputPass === dbPass;
        }
        return false;
      });
      
      if (foundTeacher) {
        return {
          success: true,
          role: "Guru",
          target_id: foundTeacher.id_guru,
          username: foundTeacher.nama_guru,
          message: "Login Berhasil (SIMULASI - Otomatis Guru)!"
        };
      }
      
      return { success: false, message: "Kredensial Salah! (Admin: admin / admin123, Guru: Nama tanpa spasi & huruf kecil, password default 'guru123')" };
    }
    
    case "ubahPasswordUser": {
      const [username, passwordLama, passwordBaru] = args;
      
      // Try admin users
      const users = getStorage("users");
      const index = users.findIndex((u: any) => u.username === username && u.password === passwordLama);
      if (index !== -1) {
        users[index].password = passwordBaru;
        setStorage("users", users);
        return { success: true, message: "Password berhasil diperbarui (SIMULASI)!" };
      }
      
      // Try teachers
      const teachers = getStorage("data_guru");
      const idxT = teachers.findIndex((t: any) => {
        const namaGuru = String(t.nama_guru || "").trim();
        const teacherUsername = namaGuru.replace(/\s+/g, "").toLowerCase();
        const inputUserLower = String(username).replace(/\s+/g, "").toLowerCase();
        
        if (inputUserLower === teacherUsername || String(username).toLowerCase().trim() === namaGuru.toLowerCase()) {
          const dbPass = String(t.password || "guru123").trim();
          return passwordLama === dbPass;
        }
        return false;
      });
      
      if (idxT !== -1) {
        teachers[idxT].password = passwordBaru;
        setStorage("data_guru", teachers);
        return { success: true, message: "Password Guru berhasil diperbarui (SIMULASI)!" };
      }
      
      return { success: false, message: "Password lama tidak sesuai / User tidak dikenali." };
    }

    case "getPengaturanSemua":
    case "getPengaturanJam":
    case "getPengaturan":
    case "getKonfigurasiJam": {
      const cfg = JSON.parse(localStorage.getItem(getStorageKey("MOCK_pengaturan_jam")) || "{}");
      return { success: true, data: cfg, ...cfg };
    }

    case "simpanPengaturanCustom": {
      const [customObj] = args;
      const current = JSON.parse(localStorage.getItem(getStorageKey("MOCK_pengaturan_jam")) || "{}");
      const cleanCustom = sanitizeTimeFields(typeof customObj === "object" ? customObj : {});
      const merged = { ...current, ...cleanCustom };
      localStorage.setItem(getStorageKey("MOCK_pengaturan_jam"), JSON.stringify(merged));
      localStorage.setItem(getStorageKey("pengaturan_jam"), JSON.stringify(merged));
      return { success: true, message: "Pengaturan berhasil diperbarui!", data: merged };
    }

    case "simpanKonfigurasiJam":
    case "simpanPengaturanJam":
    case "simpanPengaturan": {
      const [arg1, arg2, arg3] = args;
      let jamMasukMulai = "";
      let jamMasukBatas = "";
      let jamPulangMulai = "";

      if (typeof arg1 === "object" && arg1 !== null) {
        jamMasukMulai = cleanTimeHHMM(arg1.jam_masuk_mulai);
        jamMasukBatas = cleanTimeHHMM(arg1.jam_masuk_batas);
        jamPulangMulai = cleanTimeHHMM(arg1.jam_pulang_mulai);
      } else {
        jamMasukMulai = cleanTimeHHMM(arg1);
        jamMasukBatas = cleanTimeHHMM(arg2);
        jamPulangMulai = cleanTimeHHMM(arg3);
      }

      const current = JSON.parse(localStorage.getItem(getStorageKey("MOCK_pengaturan_jam")) || "{}");
      const merged = {
        ...current,
        jam_masuk_mulai: jamMasukMulai || current.jam_masuk_mulai || "06:00",
        jam_masuk_batas: jamMasukBatas || current.jam_masuk_batas || "07:15",
        jam_pulang_mulai: jamPulangMulai || current.jam_pulang_mulai || "15:30"
      };
      localStorage.setItem(getStorageKey("MOCK_pengaturan_jam"), JSON.stringify(merged));
      localStorage.setItem(getStorageKey("pengaturan_jam"), JSON.stringify(merged));
      return { success: true, message: "Pengaturan Jam Operasional disimpan!", data: merged };
    }

    case "backupDatabaseToDrive": {
      const [folderId] = args;
      const currentConfig = JSON.parse(localStorage.getItem(getStorageKey("MOCK_pengaturan_jam")) || "{}");
      const now = new Date().toISOString();
      const updated = {
        ...currentConfig,
        lastBackupTime: now,
        driveFolderId: folderId || currentConfig.driveFolderId || ""
      };
      localStorage.setItem(getStorageKey("MOCK_pengaturan_jam"), JSON.stringify(updated));
      return { 
        success: true, 
        message: `Backup database berhasil diunggah ke Google Drive (Folder ID: ${folderId || "Utama"})!`,
        lastBackupTime: now
      };
    }

    case "restoreDatabaseJSON": {
      const [jsonData] = args;
      if (!jsonData || typeof jsonData !== "object") {
        return { success: false, message: "Format file JSON backup tidak valid!" };
      }
      try {
        if (jsonData.users && Array.isArray(jsonData.users)) setStorage("users", jsonData.users);
        if (jsonData.data_siswa && Array.isArray(jsonData.data_siswa)) setStorage("data_siswa", jsonData.data_siswa);
        if (jsonData.data_guru && Array.isArray(jsonData.data_guru)) setStorage("data_guru", jsonData.data_guru);
        if (jsonData.data_kelas && Array.isArray(jsonData.data_kelas)) setStorage("data_kelas", jsonData.data_kelas);
        if (jsonData.jam_pelajaran && Array.isArray(jsonData.jam_pelajaran)) setStorage("jam_pelajaran", jsonData.jam_pelajaran);
        if (jsonData.jadwal_pelajaran && Array.isArray(jsonData.jadwal_pelajaran)) setStorage("jadwal_pelajaran", jsonData.jadwal_pelajaran);
        if (jsonData.absensi_mengajar_guru && Array.isArray(jsonData.absensi_mengajar_guru)) setStorage("absensi_mengajar_guru", jsonData.absensi_mengajar_guru);
        if (jsonData.hari_libur && Array.isArray(jsonData.hari_libur)) setStorage("hari_libur", jsonData.hari_libur);
        if (jsonData.pengaturan && typeof jsonData.pengaturan === "object") {
          const current = JSON.parse(localStorage.getItem(getStorageKey("MOCK_pengaturan_jam")) || "{}");
          localStorage.setItem(getStorageKey("MOCK_pengaturan_jam"), JSON.stringify({ ...current, ...jsonData.pengaturan }));
        }
        return { success: true, message: "Restore database dari backup berhasil diselesaikan!" };
      } catch (e: any) {
        return { success: false, message: "Gagal memproses restore: " + e.toString() };
      }
    }

    case "getHariLiburSemua": {
      return getStorage("hari_libur");
    }

    case "tambahHariLibur": {
      const [tanggal, ket] = args;
      const libur = getStorage("hari_libur");
      libur.push({ tanggal, keterangan: ket });
      setStorage("hari_libur", libur);
      return { success: true, message: "Hari libur ditambahkan (SIMULASI)." };
    }

    case "hapusHariLibur": {
      const [tanggal] = args;
      let libur = getStorage("hari_libur");
      libur = libur.filter((l: any) => l.tanggal !== tanggal);
      setStorage("hari_libur", libur);
      return { success: true, message: "Hari libur dihapus (SIMULASI)." };
    }

    case "getKelasSemua": {
      let data = getStorage("data_kelas");
      if (!Array.isArray(data)) data = [];
      const normalized = data.map((item: any) => {
        if (typeof item === "string") {
          return { nama_kelas: item, id_guru: "-", wali_kelas: "-" };
        }
        const rawWali = item.wali_kelas || item.wali || item.waliKelas || item["Wali Kelas"] || item["wali_kelas"] || "-";
        const cleanWali = isInvalidWali(rawWali) ? "-" : String(rawWali).trim();
        const rawId = item.id_guru || item.id_wali || item.idGuru || "-";
        const cleanId = String(rawId || "-").trim();
        return {
          nama_kelas: item.nama_kelas || item.kelas || String(item),
          id_guru: cleanId,
          wali_kelas: cleanWali
        };
      });
      return { success: true, data: normalized };
    }

    case "tambahKelas": {
      const [namaKelas, waliKelas, idGuruParam, payloadObjParam] = args;
      let payloadObj = typeof payloadObjParam === "object" ? payloadObjParam : (typeof idGuruParam === "object" ? idGuruParam : {});
      let kelas = getStorage("data_kelas");
      if (!Array.isArray(kelas)) kelas = [];
      
      const rawWali = typeof waliKelas === "string" ? waliKelas : (payloadObj.wali_kelas || payloadObj.wali || payloadObj.nama_guru || "-");
      const chosenWali = isInvalidWali(rawWali) ? "-" : String(rawWali).trim();
      const chosenIdGuru = payloadObj.id_guru || payloadObj.id_wali || (typeof idGuruParam === "string" ? idGuruParam : "-");

      const idx = kelas.findIndex((k: any) => (typeof k === "string" ? k : (k.nama_kelas || k.kelas)) === namaKelas);
      if (idx === -1) {
        kelas.push({ nama_kelas: namaKelas, id_guru: chosenIdGuru, wali_kelas: chosenWali });
      } else {
        kelas[idx] = { nama_kelas: namaKelas, id_guru: chosenIdGuru, wali_kelas: chosenWali };
      }
      setStorage("data_kelas", kelas);
      return { success: true, message: "Kelas ditambahkan (SIMULASI)." };
    }

    case "hapusKelas": {
      const [namaKelas, payloadObj] = args;
      const nameClean = typeof payloadObj === "object" && payloadObj !== null && payloadObj.nama_kelas ? payloadObj.nama_kelas : (typeof namaKelas === "string" ? namaKelas : "");
      let kelas = getStorage("data_kelas");
      if (Array.isArray(kelas)) {
        kelas = kelas.filter((k: any) => {
          const kName = typeof k === "string" ? k : (k.nama_kelas || k.kelas || "");
          return String(kName).trim() !== String(nameClean).trim();
        });
        setStorage("data_kelas", kelas);
      }
      return { success: true, message: "Kelas berhasil dihapus!" };
    }

    case "editKelas": {
      const [kelasLama, kelasBaru, waliKelasBaru, idGuruParam, payloadObjParam] = args;
      let payloadObj = typeof payloadObjParam === "object" ? payloadObjParam : (typeof idGuruParam === "object" ? idGuruParam : {});
      let kelas = getStorage("data_kelas");
      if (!Array.isArray(kelas)) kelas = [];
      const idx = kelas.findIndex((k: any) => (typeof k === "string" ? k : (k.nama_kelas || k.kelas)) === kelasLama);
      
      const rawWali = typeof waliKelasBaru === "string" ? waliKelasBaru : (payloadObj.wali_kelas || payloadObj.wali || payloadObj.nama_guru || "-");
      const chosenWali = isInvalidWali(rawWali) ? "-" : String(rawWali).trim();
      const chosenIdGuru = payloadObj.id_guru || payloadObj.id_wali || (typeof idGuruParam === "string" ? idGuruParam : "-");

      if (idx !== -1) {
        kelas[idx] = {
          nama_kelas: kelasBaru,
          id_guru: chosenIdGuru,
          wali_kelas: chosenWali
        };
      } else {
        kelas.push({
          nama_kelas: kelasBaru,
          id_guru: chosenIdGuru,
          wali_kelas: chosenWali
        });
      }
      setStorage("data_kelas", kelas);
      return { success: true, message: "Kelas diperbarui (SIMULASI)." };
    }

    case "simpanWaliKelas": {
      const [namaKelas, waliKelas, idGuruParam, payloadObjParam] = args;
      let payloadObj = typeof payloadObjParam === "object" ? payloadObjParam : (typeof idGuruParam === "object" ? idGuruParam : {});
      let kelas = getStorage("data_kelas");
      if (!Array.isArray(kelas)) kelas = [];
      const idx = kelas.findIndex((k: any) => (typeof k === "string" ? k : (k.nama_kelas || k.kelas)) === namaKelas);
      
      const rawWali = typeof waliKelas === "string" ? waliKelas : (payloadObj.wali_kelas || payloadObj.wali || payloadObj.nama_guru || "-");
      const chosenWali = isInvalidWali(rawWali) ? "-" : String(rawWali).trim();
      const chosenIdGuru = payloadObj.id_guru || payloadObj.id_wali || (typeof idGuruParam === "string" ? idGuruParam : "-");

      if (idx !== -1) {
        kelas[idx] = {
          nama_kelas: typeof kelas[idx] === "string" ? kelas[idx] : (kelas[idx].nama_kelas || namaKelas),
          id_guru: chosenIdGuru,
          wali_kelas: chosenWali
        };
      } else {
        kelas.push({ nama_kelas: namaKelas, id_guru: chosenIdGuru, wali_kelas: chosenWali });
      }
      setStorage("data_kelas", kelas);
      return { success: true, message: `Wali kelas untuk ${namaKelas} berhasil disimpan!` };
    }

    case "getDataMaster": {
      const [kategori] = args;
      const key = kategori === "Siswa" ? "data_siswa" : "data_guru";
      let rawData = getStorage(key);
      let changed = false;
      
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      const identifierKey = kategori === "Siswa" ? "nisn" : "nip_nuptk";
      const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";

      // Clean out empty/blank records
      const cleanData = (Array.isArray(rawData) ? rawData : []).filter((item: any) => {
        if (!item || typeof item !== "object") return false;
        const name = String(item[nameKey] || item.nama || item.name || "").trim();
        const identifier = String(item[identifierKey] || "").trim();
        return Boolean((name && name !== "-") || (identifier && identifier !== "-"));
      });

      if (cleanData.length !== rawData.length) {
        changed = true;
      }
      
      const data = cleanData.map((item: any) => {
        let needsSave = false;
        if (!item[idKey]) {
          const prefix = kategori === "Siswa" ? "S-" : "G-";
          item[idKey] = prefix + new Date().getTime().toString() + Math.floor(Math.random() * 1000).toString();
          needsSave = true;
        }
        if (!item.qr_content) {
          const identifier = item[identifierKey] || "";
          const name = item[nameKey] || "";
          item.qr_content = item[idKey] + "_" + identifier + "_" + name.replace(/\s+/g, '-');
          needsSave = true;
        }
        if (needsSave) changed = true;
        return item;
      });
      
      if (changed) {
        setStorage(key, data);
      }
      
      return { success: true, data };
    }

    case "getDataGuru": {
      return { success: true, data: getStorage("data_guru") };
    }

    case "getDataSiswa": {
      return { success: true, data: getStorage("data_siswa") };
    }

    case "tambahDataMaster": {
      const [kategori, dataObj] = args;
      const key = kategori === "Siswa" ? "data_siswa" : "data_guru";
      const list = getStorage(key);
      const prefix = kategori === "Siswa" ? "S-" : "G-";
      const idBaru = prefix + Math.floor(Math.random() * 10000);
      const qrContent = "QR-" + idBaru;
      
      const newRecord = kategori === "Siswa" ? {
        id_siswa: idBaru,
        nisn: dataObj.nisn,
        nama_siswa: dataObj.nama_siswa,
        jenis_kelamin: dataObj.jenis_kelamin,
        kelas: dataObj.kelas,
        jurusan: dataObj.jurusan,
        no_hp_ortu: dataObj.no_hp_ortu,
        qr_content: qrContent
      } : {
        id_guru: idBaru,
        nip_nuptk: dataObj.nip_nuptk,
        nama_guru: dataObj.nama_guru,
        jenis_kelamin: dataObj.jenis_kelamin,
        jabatan_tugas: dataObj.jabatan_tugas,
        no_hp: dataObj.no_hp,
        qr_content: qrContent
      };
      
      list.push(newRecord);
      setStorage(key, list);
      return { success: true, message: `Berhasil menambah ${kategori} baru (SIMULASI)` };
    }

    case "editDataMaster": {
      const [kategori, idTarget, dataObj] = args;
      const key = kategori === "Siswa" ? "data_siswa" : "data_guru";
      const list = getStorage(key);
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      const index = list.findIndex((x: any) => x[idKey] === idTarget);
      if (index !== -1) {
        list[index] = { ...list[index], ...dataObj };
        setStorage(key, list);
        return { success: true, message: "Data berhasil diubah (SIMULASI)." };
      }
      return { success: false, message: "ID tidak ditemukan." };
    }

    case "hapusDataMaster": {
      const [kategori, idTarget] = args;
      const key = kategori === "Siswa" ? "data_siswa" : "data_guru";
      let list = getStorage(key);
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";
      const identifierKey = kategori === "Siswa" ? "nisn" : "nip_nuptk";

      list = list.filter((x: any) => {
        if (!x || typeof x !== "object") return false;
        if (x[idKey] === idTarget) return false;
        const name = String(x[nameKey] || x.nama || x.name || "").trim();
        const identifier = String(x[identifierKey] || "").trim();
        return Boolean((name && name !== "-") || (identifier && identifier !== "-"));
      });
      setStorage(key, list);
      return { success: true, message: "Data terhapus permanen (SIMULASI)." };
    }

    case "importDataMassal": {
      const [kategori, arrayData] = args;
      const key = kategori === "Siswa" ? "data_siswa" : "data_guru";
      const list = getStorage(key);
      
      arrayData.forEach((dataObj: any, index: number) => {
        const prefix = kategori === "Siswa" ? "S-" : "G-";
        const idBaru = prefix + (new Date().getTime().toString().slice(-4)) + index;
        const qrContent = "QR-" + idBaru;
        
        const rec = kategori === "Siswa" ? {
          id_siswa: idBaru,
          nisn: dataObj.nisn || "-",
          nama_siswa: dataObj.nama_siswa || "-",
          jenis_kelamin: dataObj.jenis_kelamin || "-",
          kelas: dataObj.kelas || "-",
          jurusan: dataObj.jurusan || "-",
          no_hp_ortu: dataObj.no_hp_ortu || "-",
          qr_content: qrContent
        } : {
          id_guru: idBaru,
          nip_nuptk: dataObj.nip_nuptk || "-",
          nama_guru: dataObj.nama_guru || "-",
          jenis_kelamin: dataObj.jenis_kelamin || "-",
          jabatan_tugas: dataObj.jabatan_tugas || "-",
          no_hp: dataObj.no_hp || "-",
          qr_content: qrContent
        };
        list.push(rec);
      });
      setStorage(key, list);
      return { success: true, message: `Migrasi sukses. ${arrayData.length} baris dimasukkan (SIMULASI).` };
    }

    case "prosesScanQR": {
      const [qrContent, kategori, mode, tanggal] = args;
      const masterKey = kategori === "Siswa" ? "data_siswa" : "data_guru";
      let master = getStorage(masterKey);
      if (!Array.isArray(master) || master.length === 0) {
        initMockDb();
        master = getStorage(masterKey);
      }
      
      const cleanQr = String(qrContent || "").trim().toLowerCase();
      const cleanWithoutPrefix = cleanQr.replace(/^(qr|id|s|g|nisn|nip|siswa|guru)[_:\-\s]+/i, '').trim();
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";
      const identifierKey = kategori === "Siswa" ? "nisn" : "nip_nuptk";

      // Precise hierarchical lookup:
      // 1. Exact Match on ID, NISN/NIP, or QR Content
      let user = master.find((x: any) => {
        const qr = String(x.qr_content || x.qr_code || "").trim().toLowerCase();
        const id = String(x[idKey] || "").trim().toLowerCase();
        const ident = String(x[identifierKey] || x.nisn || x.nip || x.nip_nuptk || "").trim().toLowerCase();
        return (qr && qr === cleanQr) || (id && id === cleanQr) || (ident && ident === cleanQr);
      });

      // 2. Exact Match without common prefix (e.g. "S-001" vs "001" or "QR-S-001" vs "S-001")
      if (!user && cleanWithoutPrefix && cleanWithoutPrefix.length >= 2) {
        user = master.find((x: any) => {
          const qr = String(x.qr_content || x.qr_code || "").trim().toLowerCase().replace(/^(qr|id|s|g|nisn|nip|siswa|guru)[_:\-\s]+/i, '').trim();
          const id = String(x[idKey] || "").trim().toLowerCase().replace(/^(qr|id|s|g|nisn|nip|siswa|guru)[_:\-\s]+/i, '').trim();
          const ident = String(x[identifierKey] || x.nisn || x.nip || x.nip_nuptk || "").trim().toLowerCase().replace(/^(qr|id|s|g|nisn|nip|siswa|guru)[_:\-\s]+/i, '').trim();
          return (qr && qr === cleanWithoutPrefix) || (id && id === cleanWithoutPrefix) || (ident && ident === cleanWithoutPrefix);
        });
      }

      // 3. Exact Full Name Match
      if (!user) {
        user = master.find((x: any) => {
          const nama = String(x[nameKey] || x.nama || "").trim().toLowerCase();
          return nama && nama === cleanQr;
        });
      }

      // 4. Normalized Full Name Match (only for alphabetic text queries with length >= 4)
      if (!user && /^[a-zA-Z\s.,']+$/.test(cleanQr) && cleanQr.length >= 4) {
        const normalize = (s: string) => s.toLowerCase().replace(/[,.]/g, " ").replace(/\s+/g, " ").trim();
        const targetNorm = normalize(cleanQr);
        user = master.find((x: any) => {
          const n = normalize(String(x[nameKey] || x.nama || ""));
          return n && (n === targetNorm || n.startsWith(targetNorm + " ") || targetNorm.startsWith(n + " "));
        });
      }
      
      if (!user) {
        // Try opposite category if not found
        const altKey = kategori === "Siswa" ? "data_guru" : "data_siswa";
        const altMaster = getStorage(altKey);
        const altIdKey = kategori === "Siswa" ? "id_guru" : "id_siswa";
        const altNameKey = kategori === "Siswa" ? "nama_guru" : "nama_siswa";
        const altIdentKey = kategori === "Siswa" ? "nip_nuptk" : "nisn";
        
        let altUser = altMaster.find((x: any) => {
          const qr = String(x.qr_content || x.qr_code || "").trim().toLowerCase();
          const id = String(x[altIdKey] || "").trim().toLowerCase();
          const ident = String(x[altIdentKey] || x.nisn || x.nip || x.nip_nuptk || "").trim().toLowerCase();
          return (qr && qr === cleanQr) || (id && id === cleanQr) || (ident && ident === cleanQr);
        });

        if (!altUser && cleanWithoutPrefix && cleanWithoutPrefix.length >= 2) {
          altUser = altMaster.find((x: any) => {
            const qr = String(x.qr_content || x.qr_code || "").trim().toLowerCase().replace(/^(qr|id|s|g|nisn|nip|siswa|guru)[_:\-\s]+/i, '').trim();
            const id = String(x[altIdKey] || "").trim().toLowerCase().replace(/^(qr|id|s|g|nisn|nip|siswa|guru)[_:\-\s]+/i, '').trim();
            const ident = String(x[altIdentKey] || x.nisn || x.nip || x.nip_nuptk || "").trim().toLowerCase().replace(/^(qr|id|s|g|nisn|nip|siswa|guru)[_:\-\s]+/i, '').trim();
            return (qr && qr === cleanWithoutPrefix) || (id && id === cleanWithoutPrefix) || (ident && ident === cleanWithoutPrefix);
          });
        }

        if (!altUser) {
          altUser = altMaster.find((x: any) => {
            const nama = String(x[altNameKey] || x.nama || "").trim().toLowerCase();
            return nama && nama === cleanQr;
          });
        }

        if (altUser) {
          user = altUser;
        }
      }

      if (!user) return { success: false, message: `ID / Kartu "${qrContent}" tidak valid atau belum terdaftar!` };
      
      const tgl = tanggal || new Date().toISOString().split("T")[0];
      const jam = new Date().toTimeString().slice(0, 5);
      
      // Strict role identification: check student fields first then teacher fields
      const isSiswaExplicit = Boolean(user.id_siswa || user.nisn || (user.kelas && user.kelas !== "-"));
      const isGuruExplicit = Boolean(user.id_guru || user.nip_nuptk || user.jabatan_tugas);
      const activeKategori = isSiswaExplicit ? "Siswa" : (isGuruExplicit ? "Guru" : (kategori === "Siswa" ? "Siswa" : "Guru"));
      
      const reportsKey = activeKategori === "Siswa" ? "laporan_siswa" : "laporan_guru";
      const reports = getStorage(reportsKey) || [];
      
      const activeIdKey = activeKategori === "Siswa" ? "id_siswa" : "id_guru";
      const idTarget = user[activeIdKey] || user.id_siswa || user.id_guru || qrContent;
      const activeNameKey = activeKategori === "Siswa" ? "nama_siswa" : "nama_guru";
      const nama = user[activeNameKey] || user.nama || qrContent;
      const classKey = activeKategori === "Siswa" ? `${user.kelas || "-"} ${user.jurusan || ""}`.trim() : "-";
      
      // Index in daily attendance report
      const index = reports.findIndex((r: any) => r.tanggal === tgl && (r[activeIdKey] === idTarget || r.id_siswa === idTarget || r.id_guru === idTarget || r.id_target === idTarget));
      const cfg = (() => {
        try {
          return JSON.parse(localStorage.getItem(getStorageKey("MOCK_pengaturan_jam")) || localStorage.getItem(getStorageKey("pengaturan_jam")) || "{}");
        } catch (e) {
          return {};
        }
      })();
      const defaultJamMasukBatas = cleanTimeHHMM(cfg.jam_masuk_batas || cfg.jamMasukBatas) || "07:15";
      const defaultJamPulangMulai = cleanTimeHHMM(cfg.jam_pulang_mulai || cfg.jamPulangMulai) || "15:30";

      const hariList = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const hariIni = hariList[new Date().getDay()];

      // ==========================================
      // 1. MODEL SISWA (Presensi Masuk & Pulang)
      // ==========================================
      if (activeKategori === "Siswa") {
        const nowMinSiswa = parseTimeToMinutes(jam);
        const pulangMinSiswa = parseTimeToMinutes(defaultJamPulangMulai);
        const isTimeForPulang = (mode === "Pulang") || (mode !== "Masuk" && nowMinSiswa >= pulangMinSiswa);

        if (!isTimeForPulang) {
          // Masuk Period for Siswa
          if (index !== -1 && reports[index].jam_masuk && reports[index].jam_masuk !== "-") {
            return { 
              success: true, 
              role: "Siswa",
              kategori: "Siswa",
              name: nama,
              status: reports[index].status_masuk || "Tepat Waktu",
              type: "info",
              message: `${nama} sudah melakukan presensi masuk hari ini (${reports[index].jam_masuk} WIB)! Belum jam pulang sekolah (Pk ${defaultJamPulangMulai} WIB).`, 
              data: {
                ...reports[index],
                role: "Siswa",
                kategori: "Siswa",
                nama_siswa: nama,
                nama: nama,
                status: reports[index].status_masuk || "Tepat Waktu"
              }
            };
          }

          const defaultBatasMin = parseTimeToMinutes(defaultJamMasukBatas || "07:15");
          const toleransiSiswa = Number(cfg.toleransi_keterlambatan || cfg.toleransi_siswa || 0);
          const isLate = nowMinSiswa > (defaultBatasMin + toleransiSiswa);
          const statusMasuk = isLate ? "Terlambat" : "Tepat Waktu";
          const idLog = "LOG-S-" + new Date().getTime();

          if (index !== -1) {
            reports[index].jam_masuk = jam;
            reports[index].status_masuk = statusMasuk;
            setStorage(reportsKey, reports);
            return { 
              success: true, 
              role: "Siswa",
              kategori: "Siswa",
              name: nama,
              status: statusMasuk,
              type: "masuk", 
              message: `Presensi Masuk Berhasil: ${nama} (${statusMasuk})`, 
              data: {
                ...reports[index],
                role: "Siswa",
                kategori: "Siswa",
                nama_siswa: nama,
                nama: nama,
                status: statusMasuk,
                status_masuk: statusMasuk
              } 
            };
          }

          const newRow = {
            id_log_siswa: idLog,
            tanggal: tgl,
            id_siswa: idTarget,
            nama_siswa: nama,
            kelas_jurusan: classKey,
            jam_masuk: jam,
            status_masuk: statusMasuk,
            jam_pulang: "-",
            status_pulang: "-",
            ket: "Scan Otomatis"
          };
          reports.push(newRow);
          setStorage(reportsKey, reports);
          return { 
            success: true, 
            role: "Siswa",
            kategori: "Siswa",
            name: nama,
            status: statusMasuk,
            type: "masuk", 
            message: `Presensi Masuk Berhasil: ${nama} (${statusMasuk})`, 
            data: {
              ...newRow,
              role: "Siswa",
              kategori: "Siswa",
              nama_siswa: nama,
              nama: nama,
              status: statusMasuk,
              status_masuk: statusMasuk
            } 
          };
        } else {
          // Pulang Period for Siswa
          const statusPulang = (nowMinSiswa < pulangMinSiswa) ? "Pulang Cepat" : "Tepat Waktu";
          if (index !== -1) {
            reports[index].jam_pulang = jam;
            reports[index].status_pulang = statusPulang;
            setStorage(reportsKey, reports);
            return { 
              success: true, 
              role: "Siswa",
              kategori: "Siswa",
              name: nama,
              status: statusPulang,
              type: "pulang", 
              message: `Presensi Pulang Berhasil: ${nama} (${statusPulang})`, 
              data: {
                ...reports[index],
                role: "Siswa",
                kategori: "Siswa",
                nama_siswa: nama,
                nama: nama,
                status: statusPulang,
                status_pulang: statusPulang
              } 
            };
          } else {
            const idLog = "LOG-S-" + new Date().getTime();
            const newRow = {
              id_log_siswa: idLog,
              tanggal: tgl,
              id_siswa: idTarget,
              nama_siswa: nama,
              kelas_jurusan: classKey,
              jam_masuk: "-",
              status_masuk: "Lupa Scan Masuk",
              jam_pulang: jam,
              status_pulang: statusPulang,
              ket: "Lupa Scan Masuk"
            };
            reports.push(newRow);
            setStorage(reportsKey, reports);
            return { 
              success: true, 
              role: "Siswa",
              kategori: "Siswa",
              name: nama,
              status: statusPulang,
              type: "pulang", 
              message: `Presensi Pulang Berhasil: ${nama} (${statusPulang})`, 
              data: {
                ...newRow,
                role: "Siswa",
                kategori: "Siswa",
                nama_siswa: nama,
                nama: nama,
                status: statusPulang,
                status_pulang: statusPulang
              } 
            };
          }
        }
      }

      // ==========================================
      // 2. MODEL GURU (Fleksibel & Jadwal Mengajar)
      // ==========================================

      // Helper for fuzzy & title-agnostic teacher name matching
      const normalizeName = (str: string) => {
        return String(str || "")
          .toLowerCase()
          .replace(/[,.]/g, " ")
          .replace(/\b(s|m|dr|drs|dra|prof|ir|h|hj)\s*\.?\s*(pd|kom|ag|is|si|se|mm|hum|st|pt|tp|sos|ip|ed|pdi|mat|bio|fis|med)\b/gi, "")
          .replace(/\s+/g, " ")
          .trim();
      };

      const isTeacherScheduleMatch = (scheduleItem: any) => {
        if (!scheduleItem) return false;
        const sGuruId = String(scheduleItem.id_guru || "").trim().toLowerCase();
        const sGuruName = String(scheduleItem.nama_guru || "").trim();
        const targetIdStr = String(idTarget || "").trim().toLowerCase();
        const targetNipStr = String(user?.nip_nuptk || user?.nip || "").trim().toLowerCase();
        const targetQrStr = String(user?.qr_content || user?.qr_code || "").trim().toLowerCase();
        const targetCleanCode = String(qrContent || "").trim().toLowerCase();

        if (sGuruId) {
          if (sGuruId === targetIdStr || sGuruId === targetNipStr || sGuruId === targetQrStr || sGuruId === targetCleanCode) return true;
          const sWithout = sGuruId.replace(/^(guru|id|nip|g)[_:\-\s]+/i, '');
          const tWithout = targetIdStr.replace(/^(guru|id|nip|g)[_:\-\s]+/i, '');
          if (sWithout && tWithout && sWithout === tWithout) return true;
        }

        if (sGuruName && nama) {
          const n1 = sGuruName.toLowerCase();
          const n2 = String(nama).toLowerCase();
          if (n1 === n2 || n1.includes(n2) || n2.includes(n1)) return true;

          const norm1 = normalizeName(sGuruName);
          const norm2 = normalizeName(nama);
          if (norm1 && norm2 && (norm1 === norm2 || norm1.includes(norm2) || norm2.includes(norm1))) return true;
        }
        return false;
      };

      // 1. Flexible schedule lookup
      const flexList = getStorage("jadwal_guru") || [];
      const allTeacherFlexSchedules = flexList.filter((j: any) => isTeacherScheduleMatch(j));
      const todayFlexSchedule = allTeacherFlexSchedules.find((j: any) => 
        (j.hari || "").trim().toLowerCase() === hariIni.toLowerCase()
      );

      // 2. Teaching schedule lookup
      const allSchedules = getStorage("jadwal_pelajaran") || [];
      const allTeacherTeachingSchedules = allSchedules.filter((s: any) => isTeacherScheduleMatch(s));
      const todayTeachingSchedules = allTeacherTeachingSchedules.filter((s: any) => 
        (s.hari || "").trim().toLowerCase() === hariIni.toLowerCase()
      );

      // =========================================================================
      // PEMBATASAN JADWAL FLEKSIBEL & JADWAL GURU (Strict Schedule Day Restriction)
      // Jika guru terdaftar di Jadwal Fleksibel (Jadwal Guru), guru HANYA boleh absen pada hari yang telah ditentukan!
      // Contoh: Guru A dijadwalkan di hari Selasa, lalu dia scan di hari Senin maka presensi DITOLAK.
      // =========================================================================
      if (allTeacherFlexSchedules.length > 0 && !todayFlexSchedule) {
        // Guru memiliki jadwal fleksibel tetapi BUKAN untuk hari ini
        if (todayTeachingSchedules.length === 0) {
          const validDays = Array.from(new Set(allTeacherFlexSchedules.map((f: any) => f.hari).filter(Boolean))).join(", ");
          return {
            success: false,
            message: `Presensi Ditolak: ${nama} tidak memiliki jadwal presensi di hari ${hariIni}. Jadwal fleksibel terdaftar pada hari: ${validDays}.`
          };
        }
      }

      // Jika guru tidak memiliki jadwal fleksibel, tapi memiliki jadwal mengajar di hari tertentu saja:
      if (allTeacherFlexSchedules.length === 0 && allTeacherTeachingSchedules.length > 0 && todayTeachingSchedules.length === 0) {
        const batasiJadwal = cfg.batasi_jam_jadwal !== false;
        if (batasiJadwal) {
          const validTeachingDays = Array.from(new Set(allTeacherTeachingSchedules.map((s: any) => s.hari).filter(Boolean))).join(", ");
          return {
            success: false,
            message: `Presensi Ditolak: ${nama} tidak memiliki jadwal mengajar di hari ${hariIni}. Jadwal mengajar terdaftar pada hari: ${validTeachingDays}.`
          };
        }
      }

      const flexSchedule = todayFlexSchedule;
      const guruJamMasukMulai = flexSchedule?.jam_masuk_mulai || "06:30";
      const guruJamMasukBatas = flexSchedule?.jam_masuk_batas || defaultJamMasukBatas;
      const guruJamPulangMulai = flexSchedule?.jam_pulang_mulai || defaultJamPulangMulai;

      // Load jam slots for lesson schedule mapping
      const jamSlots = getStorage("jam_pelajaran") || [
        { jam_ke: 1, jam_mulai: "07:00", jam_selesai: "07:45" },
        { jam_ke: 2, jam_mulai: "07:45", jam_selesai: "08:30" },
        { jam_ke: 3, jam_mulai: "08:30", jam_selesai: "09:15" },
        { jam_ke: 4, jam_mulai: "09:45", jam_selesai: "10:30" },
        { jam_ke: 5, jam_mulai: "10:30", jam_selesai: "11:15" },
        { jam_ke: 6, jam_mulai: "11:15", jam_selesai: "12:00" },
        { jam_ke: 7, jam_mulai: "13:00", jam_selesai: "13:45" },
        { jam_ke: 8, jam_mulai: "13:45", jam_selesai: "14:30" }
      ];

      // Filter teaching schedules for this teacher strictly TODAY
      let teacherDaySchedules = todayTeachingSchedules.map((s: any) => {
        const slot = jamSlots.find((j: any) => Number(j.jam_ke) === Number(s.jam_ke));
        const slotMulai = s.jam_mulai || slot?.jam_mulai || "07:00";
        const slotSelesai = s.jam_selesai || slot?.jam_selesai || "07:45";
        return { ...s, slotMulai, slotSelesai };
      }).sort((a: any, b: any) => Number(a.jam_ke || 0) - Number(b.jam_ke || 0));

      const absLogs = getStorage("absensi_mengajar_guru") || [];
      const makeKey = (jKe: any, k: any, m: any) => `${Number(jKe)}_${String(k || "").trim().toLowerCase()}_${String(m || "").trim().toLowerCase()}`;

      const alreadyAttendedTeachingKeys = new Set(
        absLogs.filter((a: any) => a.tanggal === tgl && isTeacherScheduleMatch(a))
               .map((a: any) => makeKey(a.jam_ke, a.kelas, a.mapel))
      );

      const [hN, mN] = jam.split(":").map(Number);
      const nowMin = hN * 60 + mN;
      const [hP, mP] = guruJamPulangMulai.split(":").map(Number);
      const pulangMulaiMin = (!isNaN(hP) && !isNaN(mP)) ? (hP * 60 + mP) : (15 * 60 + 30);

      const toleransiAwalVal = Number(cfg.toleransi_awal_menit || 15);
      const toleransiAkhirVal = Number(cfg.toleransi_akhir_menit || 30);
      const toleransiGuruVal = Number(cfg.toleransi_guru ?? cfg.toleransi_mengajar_guru ?? 15);
      const batasiJamJadwal = cfg.batasi_jam_jadwal !== false;

      // Check flexible schedule morning check-in window
      if (flexSchedule && teacherDaySchedules.length === 0) {
        const [hMulai, mMulai] = guruJamMasukMulai.split(":").map(Number);
        const masukMulaiMin = (!isNaN(hMulai) && !isNaN(mMulai)) ? (hMulai * 60 + mMulai) : (6 * 60 + 30);
        if (mode === "Masuk" && nowMin < masukMulaiMin - toleransiAwalVal) {
          return {
            success: false,
            message: `Presensi Masuk Belum Dibuka: Jam masuk untuk ${nama} hari ${hariIni} dibuka mulai pukul ${guruJamMasukMulai} WIB.`
          };
        }
      }

      // Find the end time of teacher's last class today
      let lastClassEndMin = 0;
      if (teacherDaySchedules.length > 0) {
        const lastSched = teacherDaySchedules[teacherDaySchedules.length - 1];
        if (lastSched.slotSelesai && lastSched.slotSelesai !== "-") {
          const [hE, mE] = lastSched.slotSelesai.split(":").map(Number);
          if (!isNaN(hE) && !isNaN(mE)) lastClassEndMin = hE * 60 + mE;
        }
      }

      // Check if all teaching classes for today have been attended
      const totalTeachingClasses = teacherDaySchedules.length;
      const completedTeachingClasses = teacherDaySchedules.filter((s: any) => 
        alreadyAttendedTeachingKeys.has(makeKey(s.jam_ke, s.kelas, s.mapel))
      ).length;
      const allTeachingClassesDone = totalTeachingClasses > 0 && completedTeachingClasses >= totalTeachingClasses;

      // Allow clocking out if:
      // 1. Current time >= guruJamPulangMulai
      // 2. OR all classes completed AND current time >= lastClassEndMin AND past 12:00
      const isTeacherPulangTime = (nowMin >= pulangMulaiMin) || 
                                  (allTeachingClassesDone && lastClassEndMin > 0 && nowMin >= lastClassEndMin && nowMin >= (12 * 60));

      // -------------------------------------------------------------
      // CASE A: TEACHER CLOCK OUT (PULANG)
      // -------------------------------------------------------------
      if (isTeacherPulangTime && (mode === "Pulang" || allTeachingClassesDone)) {
        if (index !== -1) {
          reports[index].jam_pulang = jam;
          reports[index].status_pulang = "Tepat Waktu";
          setStorage(reportsKey, reports);
          return { 
            success: true, 
            type: "pulang", 
            targetSheet: "PresensiGuru",
            message: `Presensi Pulang Berhasil: ${nama} (${allTeachingClassesDone ? "Seluruh Jam Mengajar Selesai" : "Tepat Waktu"})`, 
            data: reports[index] 
          };
        } else {
          const idLog = "LOG-G-" + new Date().getTime();
          const newRow = {
            id_log_guru: idLog,
            tanggal: tgl,
            id_guru: idTarget,
            nama_guru: nama,
            jam_masuk: "-",
            status_masuk: "Lupa Scan Masuk",
            jam_pulang: jam,
            status_pulang: "Tepat Waktu",
            ket: "Lupa Scan Masuk"
          };
          reports.push(newRow);
          setStorage(reportsKey, reports);
          return { success: true, type: "pulang", targetSheet: "PresensiGuru", message: `Presensi Pulang Berhasil: ${nama} (Lupa Scan Masuk)`, data: newRow };
        }
      }

      if (mode === "Pulang" && !isTeacherPulangTime) {
        return {
          success: false,
          message: `Presensi Pulang Belum Dibuka: Jam pulang untuk ${nama} hari ${hariIni} dibuka mulai pukul ${guruJamPulangMulai} WIB.`
        };
      }

      // -------------------------------------------------------------
      // CASE B: TEACHER HAS TEACHING SCHEDULES TODAY
      // -------------------------------------------------------------
      if (teacherDaySchedules.length > 0) {
        // 1. Check active teaching slot windows based on time restriction
        const activeSchedMatches = teacherDaySchedules.filter((sched: any) => {
          if (!sched.slotMulai || sched.slotMulai === "-" || !sched.slotSelesai || sched.slotSelesai === "-") return true;
          const [hM, mM] = sched.slotMulai.split(":").map(Number);
          const [hS, mS] = sched.slotSelesai.split(":").map(Number);
          if (isNaN(hM) || isNaN(mM) || isNaN(hS) || isNaN(mS)) return true;
          const startMin = hM * 60 + mM;
          const endMin = hS * 60 + mS;
          return nowMin >= startMin - toleransiAwalVal && nowMin <= endMin + toleransiAkhirVal;
        });

        if (batasiJamJadwal && activeSchedMatches.length === 0) {
          const schedListTimes = teacherDaySchedules.map((s: any) => {
            return `Jam ${s.jam_ke} (${s.mapel} ${s.kelas}: ${s.slotMulai} - ${s.slotSelesai})`;
          }).join("; ");

          return {
            success: false,
            message: `Presensi Mengajar Ditolak: Di luar jam jadwal pelajaran. Guru '${nama}' (jam ${jam} WIB) tidak memiliki jadwal aktif saat ini. Jadwal hari ${hariIni}: ${schedListTimes}`
          };
        }

        // 2. Determine target schedule (first unrecorded active slot, or next pending)
        const candidateSchedules = activeSchedMatches.length > 0 ? activeSchedMatches : teacherDaySchedules;
        let activeSlotMatch = candidateSchedules.find((s: any) => 
          !alreadyAttendedTeachingKeys.has(makeKey(s.jam_ke, s.kelas, s.mapel))
        ) || candidateSchedules[0];

        let multiJamBlock: any[] = [];

        for (const sched of teacherDaySchedules) {
          if (sched.slotMulai && sched.slotMulai !== "-" && sched.slotSelesai && sched.slotSelesai !== "-") {
            const [hM, mM] = sched.slotMulai.split(":").map(Number);
            const [hS, mS] = sched.slotSelesai.split(":").map(Number);
            if (!isNaN(hM) && !isNaN(mM) && !isNaN(hS) && !isNaN(mS)) {
              const startMin = hM * 60 + mM;
              const endMin = hS * 60 + mS;
              // Active window: from 15 min before lesson begins up to 25 min after lesson ends
              if (nowMin >= startMin - 15 && nowMin <= endMin + 25) {
                activeSlotMatch = sched;
                break;
              }
            }
          }
        }

        // 2. If not strictly within an active window, find the next unrecorded class schedule today
        if (!activeSlotMatch) {
          const firstUnrecorded = teacherDaySchedules.find((s: any) => 
            !alreadyAttendedTeachingKeys.has(makeKey(s.jam_ke, s.kelas, s.mapel))
          );
          if (firstUnrecorded) {
            activeSlotMatch = firstUnrecorded;
          }
        }

        // 3. If an active or pending class is found that is NOT yet fully logged:
        if (activeSlotMatch && !alreadyAttendedTeachingKeys.has(makeKey(activeSlotMatch.jam_ke, activeSlotMatch.kelas, activeSlotMatch.mapel))) {
          // Find all consecutive hours for the same class and mapel today (1x Scan for multi-jam block)
          multiJamBlock = teacherDaySchedules.filter((s: any) => 
            String(s.kelas).trim().toLowerCase() === String(activeSlotMatch.kelas).trim().toLowerCase() &&
            String(s.mapel).trim().toLowerCase() === String(activeSlotMatch.mapel).trim().toLowerCase()
          );

          if (multiJamBlock.length === 0) multiJamBlock = [activeSlotMatch];

          // Determine attendance status based on schedule start time + tolerance
          const firstSlot = multiJamBlock[0];
          const slotMulaiStr = firstSlot.slotMulai || firstSlot.jam_mulai || "07:00";
          const firstStartMin = parseTimeToMinutes(slotMulaiStr);
          const effectiveStartMin = firstStartMin >= 0 ? firstStartMin : (7 * 60);
          
          const statusMengajar = (nowMin <= effectiveStartMin + toleransiGuruVal) ? "Hadir Tepat Waktu" : "Terlambat Masuk Kelas";

          // Save ALL hours in the multi-jam block into absensi_mengajar_guru (sheet AbsensiMengajar)
          const savedLogItems: any[] = [];
          for (const schedItem of multiJamBlock) {
            const existingIdx = absLogs.findIndex((a: any) => 
              a.tanggal === tgl && 
              isTeacherScheduleMatch(a) &&
              Number(a.jam_ke) === Number(schedItem.jam_ke) &&
              String(a.kelas).trim().toLowerCase() === String(schedItem.kelas).trim().toLowerCase()
            );

            const logItem = {
              id_log_mengajar: existingIdx !== -1 ? absLogs[existingIdx].id_log_mengajar : "LOG-MENG-" + Date.now() + "-" + schedItem.jam_ke,
              tanggal: tgl,
              waktu_absen: jam,
              hari: hariIni !== "Minggu" ? hariIni : (schedItem.hari || "Senin"),
              id_guru: idTarget,
              nama_guru: nama,
              kelas: schedItem.kelas || "-",
              mapel: schedItem.mapel || "-",
              jam_ke: Number(schedItem.jam_ke || 1),
              jam_mulai_jadwal: schedItem.slotMulai || "07:00",
              jam_selesai_jadwal: schedItem.slotSelesai || "07:45",
              status: statusMengajar,
              catatan_materi: "Presensi Otomatis Barcode/QR"
            };

            if (existingIdx !== -1) absLogs[existingIdx] = logItem;
            else absLogs.push(logItem);

            savedLogItems.push(logItem);
          }

          setStorage("absensi_mengajar_guru", absLogs);

          // JIKA GURU MEMILIKI JADWAL FLEKSIBEL (PIKET) DI HARI INI, CATAT JUGA KE SHEET PresensiGuru
          if (flexSchedule) {
            const flexBatasStr = flexSchedule.jam_masuk_batas || defaultJamMasukBatas || "07:15";
            const flexBatasMin = parseTimeToMinutes(flexBatasStr);
            const statusMasukPiket = (nowMin <= (flexBatasMin >= 0 ? flexBatasMin : (7 * 60 + 15)) + toleransiGuruVal) ? "Tepat Waktu" : "Terlambat";
            if (index === -1) {
              const idLog = "LOG-G-" + Date.now();
              const newGuruRow = {
                id_log_guru: idLog,
                tanggal: tgl,
                id_guru: idTarget,
                nama_guru: nama,
                jam_masuk: jam,
                status_masuk: statusMasukPiket,
                jam_pulang: "-",
                status_pulang: "-",
                ket: `Piket & Mengajar: ${activeSlotMatch.mapel} ${activeSlotMatch.kelas}`
              };
              reports.push(newGuruRow);
              setStorage(reportsKey, reports);
            } else if (!reports[index].jam_masuk || reports[index].jam_masuk === "-") {
              reports[index].jam_masuk = jam;
              reports[index].status_masuk = statusMasukPiket;
              reports[index].ket = `Piket & Mengajar: ${activeSlotMatch.mapel} ${activeSlotMatch.kelas}`;
              setStorage(reportsKey, reports);
            }
          }

          const jamNumbers = multiJamBlock.map((s: any) => Number(s.jam_ke)).sort((a: number, b: number) => a - b);
          const jamLabel = jamNumbers.length > 1
            ? `Jam Ke-${jamNumbers[0]} s/d ${jamNumbers[jamNumbers.length - 1]}`
            : `Jam Ke-${jamNumbers[0] || activeSlotMatch.jam_ke}`;

          return {
            success: true,
            role: "Guru",
            kategori: "Guru",
            name: nama,
            status: statusMengajar,
            type: "mengajar",
            targetSheet: "AbsensiMengajar",
            message: `Presensi Mengajar Berhasil: ${nama} (${activeSlotMatch.mapel} - ${activeSlotMatch.kelas}, ${jamLabel})`,
            data: {
              ...activeSlotMatch,
              role: "Guru",
              kategori: "Guru",
              nama_guru: nama,
              nama: nama,
              id_guru: idTarget,
              tanggal: tgl,
              waktu_absen: jam,
              hari: hariIni,
              kelas: activeSlotMatch.kelas || "-",
              mapel: activeSlotMatch.mapel || "-",
              jam_ke: Number(activeSlotMatch.jam_ke || 1),
              status: statusMengajar,
              jam_ke_label: jamLabel,
              id_log_mengajar: savedLogItems[0]?.id_log_mengajar,
              multiJamBlock: savedLogItems
            }
          };
        }

        // 4. If all classes for today are already recorded
        if (allTeachingClassesDone) {
          return {
            success: true,
            role: "Guru",
            kategori: "Guru",
            name: nama,
            status: "Selesai Mengajar",
            type: "info",
            targetSheet: "AbsensiMengajar",
            message: `${nama} sudah menyelesaikan seluruh jadwal mengajar hari ini (${totalTeachingClasses} jam pelajaran). Seluruh presensi telah tercatat di sheet AbsensiMengajar.`,
            data: {
              role: "Guru",
              kategori: "Guru",
              nama_guru: nama,
              nama: nama,
              id_guru: idTarget,
              status: "Selesai Mengajar"
            }
          };
        }

        // 5. If currently scanned class is already recorded, find the next class
        const nextPending = teacherDaySchedules.find((s: any) => 
          !alreadyAttendedTeachingKeys.has(makeKey(s.jam_ke, s.kelas, s.mapel))
        );

        return {
          success: true,
          role: "Guru",
          kategori: "Guru",
          name: nama,
          status: "Tepat Waktu",
          type: "info",
          targetSheet: "AbsensiMengajar",
          message: `${nama} sudah presensi kelas sebelumnya. Jadwal mengajar berikutnya: ${nextPending?.mapel || "Pelajaran"} (${nextPending?.kelas || "-"}) Jam Ke-${nextPending?.jam_ke || "-"} (${nextPending?.slotMulai || ""} WIB).`,
          data: {
            role: "Guru",
            kategori: "Guru",
            nama_guru: nama,
            nama: nama,
            id_guru: idTarget,
            nextSchedule: nextPending
          }
        };
      }

      // -------------------------------------------------------------
      // CASE C: TEACHER WITH NO TEACHING SCHEDULE TODAY (HANYA HARIAN / FLEKSIBEL)
      // -------------------------------------------------------------
      if (index === -1 || !reports[index].jam_masuk || reports[index].jam_masuk === "-") {
        const guruBatasMin = parseTimeToMinutes(guruJamMasukBatas || "07:15");
        const effectiveBatasMin = guruBatasMin >= 0 ? guruBatasMin : (7 * 60 + 15);
        const statusMasuk = (nowMin <= effectiveBatasMin + toleransiGuruVal) ? "Tepat Waktu" : "Terlambat";
        const idLog = "LOG-G-" + new Date().getTime();

        if (index !== -1) {
          reports[index].jam_masuk = jam;
          reports[index].status_masuk = statusMasuk;
          setStorage(reportsKey, reports);
          return { 
            success: true, 
            role: "Guru",
            kategori: "Guru",
            name: nama,
            status: statusMasuk,
            type: "masuk", 
            message: `Presensi Masuk Berhasil: ${nama} (${statusMasuk})`, 
            data: {
              ...reports[index],
              role: "Guru",
              kategori: "Guru",
              nama_guru: nama,
              nama: nama,
              status: statusMasuk,
              status_masuk: statusMasuk
            } 
          };
        }

        const newRow = {
          id_log_guru: idLog,
          tanggal: tgl,
          id_guru: idTarget,
          nama_guru: nama,
          jam_masuk: jam,
          status_masuk: statusMasuk,
          jam_pulang: "-",
          status_pulang: "-",
          ket: flexSchedule ? "Guru Fleksibel" : "Harian"
        };
        reports.push(newRow);
        setStorage(reportsKey, reports);
        return { 
          success: true, 
          role: "Guru",
          kategori: "Guru",
          name: nama,
          status: statusMasuk,
          type: "masuk", 
          message: `Presensi Masuk Berhasil: ${nama} (${statusMasuk})`, 
          data: {
            ...newRow,
            role: "Guru",
            kategori: "Guru",
            nama_guru: nama,
            nama: nama,
            status: statusMasuk,
            status_masuk: statusMasuk
          } 
        };
      }

      // Teacher already clocked in, no teaching schedule, not yet clock-out time
      return {
        success: true,
        role: "Guru",
        kategori: "Guru",
        name: nama,
        status: reports[index].status_masuk || "Tepat Waktu",
        type: "info",
        message: `${nama} sudah presensi masuk (${reports[index].jam_masuk} WIB). Tidak ada jadwal mengajar hari ini. Jam pulang dibuka pk ${guruJamPulangMulai} WIB.`,
        data: {
          ...reports[index],
          role: "Guru",
          kategori: "Guru",
          nama_guru: nama,
          nama: nama,
          status: reports[index].status_masuk || "Tepat Waktu"
        }
      };
    }

    case "catatAbsensiSiswa": {
      const [idTarget, mode, status, keterangan, tanggal, jamCustom, namaSiswa, kelasJurusan] = args;
      const tgl = tanggal || new Date().toISOString().split("T")[0];
      const jam = jamCustom || new Date().toTimeString().slice(0, 5);
      const reports = getStorage("laporan_siswa") || [];
      const master = getStorage("data_siswa") || [];
      
      const sObj = master.find((s: any) => 
        String(s.id_siswa || "").toLowerCase() === String(idTarget || "").toLowerCase() ||
        String(s.nisn || "").toLowerCase() === String(idTarget || "").toLowerCase() ||
        String(s.nama_siswa || "").toLowerCase() === String(namaSiswa || idTarget || "").toLowerCase()
      );
      
      const nama = namaSiswa || sObj?.nama_siswa || sObj?.nama || idTarget;
      const kelas = kelasJurusan || (sObj ? `${sObj.kelas || ""} ${sObj.jurusan || ""}`.trim() : "Siswa");
      const targetId = sObj?.id_siswa || idTarget;

      const idx = reports.findIndex((r: any) => r.tanggal === tgl && (r.id_siswa === targetId || r.id_target === targetId || String(r.nama_siswa || "").toLowerCase() === String(nama).toLowerCase()));
      const statusText = status || (mode === "Masuk" ? "Tepat Waktu" : "Sudah Pulang");

      if (idx !== -1) {
        if (mode === "Masuk") {
          reports[idx].jam_masuk = jam;
          reports[idx].status_masuk = statusText;
        } else {
          reports[idx].jam_pulang = jam;
          reports[idx].status_pulang = statusText;
        }
        if (keterangan) reports[idx].ket = keterangan;
        setStorage("laporan_siswa", reports);
        return { success: true, message: `Presensi Siswa Berhasil: ${nama}`, data: reports[idx] };
      } else {
        const idLog = "LOG-S-" + Date.now();
        const newRow = {
          id_log_siswa: idLog,
          tanggal: tgl,
          id_siswa: targetId,
          nama_siswa: nama,
          kelas_jurusan: kelas,
          jam_masuk: mode === "Masuk" ? jam : "-",
          status_masuk: mode === "Masuk" ? statusText : "Belum Absen",
          jam_pulang: mode === "Pulang" ? jam : "-",
          status_pulang: mode === "Pulang" ? statusText : "-",
          ket: keterangan || "Scan Auto Board"
        };
        reports.push(newRow);
        setStorage("laporan_siswa", reports);
        return { success: true, message: `Presensi Siswa Berhasil: ${nama}`, data: newRow };
      }
    }

    case "catatAbsensiGuru": {
      const [idTarget, mode, status, keterangan, tanggal, jamCustom, namaGuru, nip] = args;
      const tgl = tanggal || new Date().toISOString().split("T")[0];
      const jam = jamCustom || new Date().toTimeString().slice(0, 5);
      const reports = getStorage("laporan_guru") || [];
      const master = getStorage("data_guru") || [];
      
      const gObj = master.find((g: any) => 
        String(g.id_guru || "").toLowerCase() === String(idTarget || "").toLowerCase() ||
        String(g.nip_nuptk || "").toLowerCase() === String(idTarget || "").toLowerCase() ||
        String(g.nama_guru || "").toLowerCase() === String(namaGuru || idTarget || "").toLowerCase()
      );
      
      const nama = namaGuru || gObj?.nama_guru || gObj?.nama || idTarget;
      const targetId = gObj?.id_guru || idTarget;

      const idx = reports.findIndex((r: any) => r.tanggal === tgl && (r.id_guru === targetId || r.id_target === targetId || String(r.nama_guru || "").toLowerCase() === String(nama).toLowerCase()));
      const statusText = status || (mode === "Masuk" ? "Tepat Waktu" : "Sudah Pulang");

      if (idx !== -1) {
        if (mode === "Masuk") {
          reports[idx].jam_masuk = jam;
          reports[idx].status_masuk = statusText;
        } else {
          reports[idx].jam_pulang = jam;
          reports[idx].status_pulang = statusText;
        }
        if (keterangan) reports[idx].ket = keterangan;
        setStorage("laporan_guru", reports);
        return { success: true, message: `Presensi Guru Berhasil: ${nama}`, data: reports[idx] };
      } else {
        const idLog = "LOG-G-" + Date.now();
        const newRow = {
          id_log_guru: idLog,
          tanggal: tgl,
          id_guru: targetId,
          nama_guru: nama,
          jam_masuk: mode === "Masuk" ? jam : "-",
          status_masuk: mode === "Masuk" ? statusText : "Belum Absen",
          jam_pulang: mode === "Pulang" ? jam : "-",
          status_pulang: mode === "Pulang" ? statusText : "-",
          ket: keterangan || "Scan Auto Board"
        };
        reports.push(newRow);
        setStorage("laporan_guru", reports);
        return { success: true, message: `Presensi Guru Berhasil: ${nama}`, data: newRow };
      }
    }

    case "simpanAbsenManual": {
      const [idTarget, kategori, mode, tanggal, status, keterangan, jamCustom] = args;
      const tgl = tanggal || new Date().toISOString().split("T")[0];
      const jamDefault = mode === "Masuk" ? "07:00" : "15:30";
      const isAbsentStatus = status === "Sakit" || status === "Izin" || status === "Alfa" || status === "-";
      const jam = isAbsentStatus ? "-" : (jamCustom && jamCustom !== "-" ? jamCustom : jamDefault);
      const reportsKey = kategori === "Siswa" ? "laporan_siswa" : "laporan_guru";
      const reports = getStorage(reportsKey);
      
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      const index = reports.findIndex((r: any) => r.tanggal === tgl && (r[idKey] === idTarget || r.id_siswa === idTarget || r.id_guru === idTarget || r.id_target === idTarget));
      
      if (index !== -1) {
        reports[index].tanggal = tgl;
        if (isAbsentStatus) {
          reports[index].status_masuk = status;
          reports[index].status_pulang = status;
          reports[index].jam_masuk = "-";
          reports[index].jam_pulang = "-";
        } else {
          if (mode === "Masuk") {
            reports[index].jam_masuk = jam;
            reports[index].status_masuk = status;
          } else {
            reports[index].jam_pulang = jam;
            reports[index].status_pulang = status;
          }
        }
        reports[index].ket = keterangan;
      } else {
        const masterKey = kategori === "Siswa" ? "data_siswa" : "data_guru";
        const mList = getStorage(masterKey);
        const user = mList.find((x: any) => x[idKey] === idTarget || x.id_siswa === idTarget || x.id_guru === idTarget);
        if (user) {
          const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";
          const nama = user[nameKey];
          const classKey = kategori === "Siswa" ? `${user.kelas} ${user.jurusan}` : "-";
          const idLog = "LOG-" + new Date().getTime();
          
          const statusMasuk = isAbsentStatus ? status : (mode === "Masuk" ? status : "-");
          const statusPulang = isAbsentStatus ? status : (mode === "Pulang" ? status : "-");
          const jamMasuk = isAbsentStatus ? "-" : (mode === "Masuk" ? jam : "-");
          const jamPulang = isAbsentStatus ? "-" : (mode === "Pulang" ? jam : "-");

          const newRow = kategori === "Siswa" ? {
            id_log_siswa: idLog,
            tanggal: tgl,
            id_siswa: idTarget,
            nama_siswa: nama,
            kelas_jurusan: classKey,
            jam_masuk: jamMasuk,
            status_masuk: statusMasuk,
            jam_pulang: jamPulang,
            status_pulang: statusPulang,
            ket: keterangan
          } : {
            id_log_guru: idLog,
            tanggal: tgl,
            id_guru: idTarget,
            nama_guru: nama,
            jam_masuk: jamMasuk,
            status_masuk: statusMasuk,
            jam_pulang: jamPulang,
            status_pulang: statusPulang,
            ket: keterangan
          };
          reports.push(newRow);
        }
      }
      
      setStorage(reportsKey, reports);
      return { success: true, message: `Koreksi manual tanggal ${tgl} disimpan!` };
    }

    case "simpanKoreksiManual":
    case "editKehadiran":
    case "editKehadiranFull": {
      const [idTarget, kategori, tanggal, arg3, arg4, arg5, arg6, arg7] = args;
      const tgl = tanggal || new Date().toISOString().split("T")[0];
      const reportsKey = kategori === "Siswa" ? "laporan_siswa" : "laporan_guru";
      const reports = getStorage(reportsKey);
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";

      const dataObj = typeof arg3 === "object" && arg3 !== null ? arg3 : {
        jam_masuk: arg3 || "-",
        status_masuk: arg4 || "-",
        jam_pulang: arg5 || "-",
        status_pulang: arg6 || "-",
        ket: arg7 || "-"
      };
      
      const isAllEmpty = (dataObj.jam_masuk === "-" || !dataObj.jam_masuk) &&
                         (dataObj.status_masuk === "-" || !dataObj.status_masuk) &&
                         (dataObj.jam_pulang === "-" || !dataObj.jam_pulang) &&
                         (dataObj.status_pulang === "-" || !dataObj.status_pulang) &&
                         (dataObj.ket === "-" || !dataObj.ket || dataObj.ket === "");

      const index = reports.findIndex((r: any) => r.tanggal === tgl && (r[idKey] === idTarget || r.id_siswa === idTarget || r.id_guru === idTarget || r.id_target === idTarget));
      
      if (index !== -1) {
        if (isAllEmpty) {
          reports.splice(index, 1);
        } else {
          reports[index].tanggal = tgl;
          if (dataObj.jam_masuk !== undefined) reports[index].jam_masuk = dataObj.jam_masuk;
          if (dataObj.status_masuk !== undefined) reports[index].status_masuk = dataObj.status_masuk;
          if (dataObj.jam_pulang !== undefined) reports[index].jam_pulang = dataObj.jam_pulang;
          if (dataObj.status_pulang !== undefined) reports[index].status_pulang = dataObj.status_pulang;
          if (dataObj.ket !== undefined) reports[index].ket = dataObj.ket;
        }
      } else if (!isAllEmpty) {
        const masterKey = kategori === "Siswa" ? "data_siswa" : "data_guru";
        const mList = getStorage(masterKey);
        const user = mList.find((x: any) => x[idKey] === idTarget || x.id_siswa === idTarget || x.id_guru === idTarget);
        if (user) {
          const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";
          const nama = user[nameKey];
          const classKey = kategori === "Siswa" ? `${user.kelas} ${user.jurusan}` : "-";
          const idLog = "LOG-" + new Date().getTime();
          
          const newRow = kategori === "Siswa" ? {
            id_log_siswa: idLog,
            tanggal: tgl,
            id_siswa: idTarget,
            nama_siswa: nama,
            kelas_jurusan: classKey,
            jam_masuk: dataObj.jam_masuk || "-",
            status_masuk: dataObj.status_masuk || "-",
            jam_pulang: dataObj.jam_pulang || "-",
            status_pulang: dataObj.status_pulang || "-",
            ket: dataObj.ket || "-"
          } : {
            id_log_guru: idLog,
            tanggal: tgl,
            id_guru: idTarget,
            nama_guru: nama,
            jam_masuk: dataObj.jam_masuk || "-",
            status_masuk: dataObj.status_masuk || "-",
            jam_pulang: dataObj.jam_pulang || "-",
            status_pulang: dataObj.status_pulang || "-",
            ket: dataObj.ket || "-"
          };
          reports.push(newRow);
        }
      }
      
      setStorage(reportsKey, reports);
      return { success: true, message: `Kehadiran ${kategori} tanggal ${tgl} berhasil diperbarui!` };
    }

    case "editKehadiranBulk": {
      const [rows, kategori, tanggal] = args;
      const tgl = tanggal || new Date().toISOString().split("T")[0];
      const reportsKey = kategori === "Siswa" ? "laporan_siswa" : "laporan_guru";
      let reports = getStorage(reportsKey);
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      const masterKey = kategori === "Siswa" ? "data_siswa" : "data_guru";
      const mList = getStorage(masterKey);

      rows.forEach((item: any) => {
        const idTarget = item.id_target;
        if (!idTarget) return;

        const index = reports.findIndex((r: any) => r.tanggal === tgl && (r[idKey] === idTarget || r.id_siswa === idTarget || r.id_guru === idTarget || r.id_target === idTarget));
        
        const hasData = (item.jam_masuk && item.jam_masuk !== "-") || 
                        (item.status_masuk && item.status_masuk !== "-") ||
                        (item.jam_pulang && item.jam_pulang !== "-") ||
                        (item.status_pulang && item.status_pulang !== "-") ||
                        (item.ket && item.ket !== "-");

        if (index !== -1) {
          if (hasData) {
            reports[index].jam_masuk = item.jam_masuk || "-";
            reports[index].status_masuk = item.status_masuk || "-";
            reports[index].jam_pulang = item.jam_pulang || "-";
            reports[index].status_pulang = item.status_pulang || "-";
            reports[index].ket = item.ket || "-";
          } else {
            // Remove from reports if all fields set to empty (-)
            reports = reports.filter((_: any, idx: number) => idx !== index);
          }
        } else {
          if (hasData) {
            const user = mList.find((x: any) => x[idKey] === idTarget || x.id_siswa === idTarget || x.id_guru === idTarget);
            if (user) {
              const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";
              const nama = user[nameKey];
              const classKey = kategori === "Siswa" ? `${user.kelas} ${user.jurusan}` : "-";
              const idLog = "LOG-" + new Date().getTime() + "-" + Math.floor(Math.random() * 1000);

              const newRow = kategori === "Siswa" ? {
                id_log_siswa: idLog,
                tanggal: tgl,
                id_siswa: idTarget,
                nama_siswa: nama,
                kelas_jurusan: classKey,
                jam_masuk: item.jam_masuk || "-",
                status_masuk: item.status_masuk || "-",
                jam_pulang: item.jam_pulang || "-",
                status_pulang: item.status_pulang || "-",
                ket: item.ket || "-"
              } : {
                id_log_guru: idLog,
                tanggal: tgl,
                id_guru: idTarget,
                nama_guru: nama,
                jam_masuk: item.jam_masuk || "-",
                status_masuk: item.status_masuk || "-",
                jam_pulang: item.jam_pulang || "-",
                status_pulang: item.status_pulang || "-",
                ket: item.ket || "-"
              };
              reports.push(newRow);
            }
          }
        }
      });

      setStorage(reportsKey, reports);
      return { success: true, message: `Berhasil memperbarui ${rows.length} data kehadiran tanggal ${tgl}!` };
    }

    case "hapusKehadiran":
    case "hapusLogKehadiran":
    case "hapusAbsensi":
    case "hapusAbsen":
    case "deleteKehadiran": {
      const [idTarget, kategori, tanggal] = args;
      const reportsKey = kategori === "Siswa" ? "laporan_siswa" : "laporan_guru";
      let reports = getStorage(reportsKey);
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      
      reports = reports.filter((r: any) => !(r.tanggal === tanggal && (r[idKey] === idTarget || r.id_siswa === idTarget || r.id_guru === idTarget || r.id_target === idTarget)));
      setStorage(reportsKey, reports);
      return { success: true, message: `Data presensi ${kategori} pada tanggal ${tanggal} berhasil dihapus.` };
    }

    case "simpanBulkAbsenManual": {
      const [ids, kategori, mode, tanggal, status, keterangan] = args;
      ids.forEach((idTarget: string) => {
        callMock("simpanAbsenManual", [idTarget, kategori, mode, tanggal, status, keterangan]);
      });
      return { success: true, message: `Berhasil update ${ids.length} data absensi.` };
    }

    case "getLiveAbsenHariIni": {
      const [kategori, tanggal, filterKelas, filterHari] = args;
      const tgl = tanggal || new Date().toISOString().split("T")[0];
      try {
        jalankanAutoAlfaSistem(tgl);
      } catch (e) {}

      const masterKey = kategori === "Siswa" ? "data_siswa" : "data_guru";
      let master = getStorage(masterKey);
      if (!Array.isArray(master) || master.length === 0) {
        initMockDb();
        master = getStorage(masterKey);
      }
      
      const reportsKey = kategori === "Siswa" ? "laporan_siswa" : "laporan_guru";
      const reports = getStorage(reportsKey);
      
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";
      
      // O(1) Lookup Map for reports
      const reportMap = new Map<string, any>();
      if (Array.isArray(reports)) {
        for (const r of reports) {
          if (r.tanggal === tgl) {
            const rId = r[idKey] || r.id_siswa || r.id_guru || r.id_target;
            if (rId) reportMap.set(String(rId), r);
          }
        }
      }

      // Filter guru berdasarkan jadwal fleksibel hari ini
      const scheduledTeacherIds = new Set<string>();
      const scheduledTeacherNames = new Set<string>();
      const flexInfoMap = new Map<string, any>();

      if (kategori === "Guru") {
        const dObj = new Date(tgl + "T00:00:00");
        const dayFromDate = !isNaN(dObj.getTime()) ? (HARI_MAP_INDEX[dObj.getDay()] || "Senin") : "Senin";
        const targetDay = (filterHari && filterHari !== "Semua" && filterHari !== "Sesuai Tanggal") ? filterHari : dayFromDate;

        const flexSchedules = getStorage("jadwal_guru") || [];
        if (Array.isArray(flexSchedules) && flexSchedules.length > 0) {
          const flexForDay = targetDay === "Semua" 
            ? flexSchedules 
            : flexSchedules.filter((f: any) => String(f.hari || "").trim().toLowerCase() === targetDay.trim().toLowerCase());

          flexForDay.forEach((f: any) => {
            const fId = String(f.id_guru || "").trim().toLowerCase();
            const fName = String(f.nama_guru || "").trim().toLowerCase();
            if (fId) {
              scheduledTeacherIds.add(fId);
              flexInfoMap.set(fId, f);
            }
            if (fName) {
              scheduledTeacherNames.add(fName);
              flexInfoMap.set(fName, f);
            }
          });
        }
      }
      
      const result = master.map((m: any) => {
        const idTarget = m[idKey] || m.id || m.nisn || m.nip_nuptk || "";
        const namaTarget = m[nameKey] || m.nama || m.name || "Tanpa Nama";
        
        let kelasStr = "-";
        if (kategori === "Siswa") {
          const kVal = String(m.kelas || "").trim();
          const jVal = String(m.jurusan || "").trim();
          if (m.kelas_jurusan) {
            kelasStr = m.kelas_jurusan;
          } else if (kVal) {
            if (jVal && jVal !== "-" && !kVal.toLowerCase().includes(jVal.toLowerCase())) {
              kelasStr = `${kVal} ${jVal}`;
            } else {
              kelasStr = kVal;
            }
          } else if (jVal) {
            kelasStr = jVal;
          }
        } else {
          const flexObj = flexInfoMap.get(String(idTarget).toLowerCase()) || flexInfoMap.get(String(namaTarget).toLowerCase());
          if (flexObj) {
            kelasStr = `Piket: ${flexObj.jam_masuk_mulai || "06:00"}-${flexObj.jam_pulang_mulai || "15:30"}`;
          }
        }

        const rep = reportMap.get(String(idTarget)) || {};
        
        return {
          id_target: idTarget,
          nama_target: namaTarget,
          kelas_jurusan: kelasStr,
          tanggal: tgl,
          jam_masuk: rep.jam_masuk || "-",
          status_masuk: rep.status_masuk || "-",
          jam_pulang: rep.jam_pulang || "-",
          status_pulang: rep.status_pulang || "-",
          no_hp_ortu: m.no_hp_ortu || m.no_hp || "-",
          kategori: kategori,
          ket: rep.ket || "-"
        };
      });
      
      const filtered = result.filter((item: any) => {
        if (kategori === "Siswa" && filterKelas && filterKelas !== "Semua") {
          const kTarget = String(item.kelas_jurusan || "").toLowerCase().replace(/\s+/g, "");
          const kFilter = String(filterKelas).toLowerCase().replace(/\s+/g, "");
          return kTarget.includes(kFilter) || kFilter.includes(kTarget);
        }
        if (kategori === "Guru" && scheduledTeacherIds.size > 0) {
          const gId = String(item.id_target || "").trim().toLowerCase();
          const gName = String(item.nama_target || "").trim().toLowerCase();
          const isScheduled = scheduledTeacherIds.has(gId) || scheduledTeacherNames.has(gName);
          const hasAttended = (item.jam_masuk && item.jam_masuk !== "-") || 
                              (item.status_masuk && item.status_masuk !== "-" && item.status_masuk !== "Belum Absen") || 
                              (item.jam_pulang && item.jam_pulang !== "-");
          return isScheduled || hasAttended;
        }
        return true;
      });
      
      return { success: true, data: filtered };
    }

    case "getPresensiSiswa":
    case "getLaporanSiswa": {
      try {
        jalankanAutoAlfaSistem();
      } catch (e) {}
      return { success: true, data: getStorage("laporan_siswa") };
    }

    case "getPresensiGuru":
    case "getLaporanGuru": {
      try {
        jalankanAutoAlfaSistem();
      } catch (e) {}
      return { success: true, data: getStorage("laporan_guru") };
    }

    case "getLaporanPresensi":
    case "getLaporanFilter": {
      const [kategori, kelas, jenisFilter, tanggalMulai, tanggalSelesai, bulanMinta] = args;
      try {
        if (jenisFilter === "rentang" && tanggalMulai && tanggalSelesai) {
          jalankanAutoAlfaSistem(tanggalMulai);
          jalankanAutoAlfaSistem(tanggalSelesai);
        } else {
          jalankanAutoAlfaSistem();
        }
      } catch (e) {}

      const reportsKey = kategori === "Siswa" ? "laporan_siswa" : "laporan_guru";
      const reports = getStorage(reportsKey) || [];
      
      const filtered = reports.filter((row: any) => {
        const rowTgl = formatToIsoDate(row.tanggal);
        if (!rowTgl) return false;

        // Date filter
        if (jenisFilter === "rentang" && tanggalMulai && tanggalSelesai) {
          if (rowTgl < tanggalMulai || rowTgl > tanggalSelesai) return false;
        } else if (jenisFilter === "bulan" && bulanMinta) {
          if (!rowTgl.startsWith(bulanMinta)) return false;
        }
        
        // Class filter
        if (kategori === "Siswa" && kelas && kelas !== "Semua") {
          const kJur = String(row.kelas_jurusan || row.kelas || "").replace(/[\s-]+/g, "").toLowerCase();
          const cleanKelas = String(kelas).replace(/[\s-]+/g, "").toLowerCase();
          if (!kJur.includes(cleanKelas) && !cleanKelas.includes(kJur)) return false;
        }
        
        return true;
      });
      
      return { success: true, data: filtered };
    }

    case "hitungRekapPersentase": {
      const [kategori, kelas, jenisFilter, tanggalMulai, tanggalSelesai, bulanMinta] = args;
      let masterData = getStorage(kategori === "Siswa" ? "data_siswa" : "data_guru") || [];
      
      if (kategori === "Siswa" && kelas && kelas !== "Semua") {
        const cleanKelas = String(kelas).replace(/[\s-]+/g, "").toLowerCase();
        masterData = masterData.filter((m: any) => {
          const kJur = `${m.kelas || ""} ${m.jurusan || ""}`.replace(/[\s-]+/g, "").toLowerCase();
          return kJur.includes(cleanKelas) || cleanKelas.includes(kJur);
        });
      }
      
      const rptRes = callMock("getLaporanFilter", [kategori, kelas, jenisFilter, tanggalMulai, tanggalSelesai, bulanMinta]);
      const rptData = extractArrayData(rptRes);
      
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";
      
      const rekap = masterData.map((m: any) => {
        const idTarget = String(m[idKey] || m.id || "").trim();
        const nama = String(m[nameKey] || m.nama || "").trim();
        
        const userRpts = rptData.filter((r: any) => {
          const rId = String(r[idKey] || r.id_target || r.id_siswa || r.id_guru || "").trim();
          const rNama = String(r.nama_siswa || r.nama_guru || r.nama || "").trim();
          if (idTarget && rId && rId === idTarget) return true;
          if (nama && rNama && rNama.toLowerCase() === nama.toLowerCase()) return true;
          return false;
        });
        
        let hadir = 0;
        let sakit = 0;
        let izin = 0;
        let alfa = 0;
        const jamMasuks: string[] = [];
        const jamPulangs: string[] = [];
        
        userRpts.forEach((r: any) => {
          const sm = String(r.status_masuk || "").toLowerCase();
          if (sm.includes("tepat") || sm.includes("terlambat") || sm.includes("lupa") || sm.includes("hadir")) {
            hadir++;
          } else if (sm.includes("sakit")) {
            sakit++;
          } else if (sm.includes("izin")) {
            izin++;
          } else if (sm.includes("alfa") || sm.includes("alpha")) {
            alfa++;
          } else if (r.status_masuk && r.status_masuk !== "-") {
            hadir++;
          }
          
          if (r.jam_masuk && r.jam_masuk !== "-") jamMasuks.push(r.jam_masuk);
          if (r.jam_pulang && r.jam_pulang !== "-") jamPulangs.push(r.jam_pulang);
        });
        
        const totalDays = hadir + sakit + izin + alfa;
        const persentase = totalDays === 0 ? "0%" : ((hadir / totalDays) * 100).toFixed(1) + "%";
        
        return {
          id: idTarget,
          nama: nama,
          hadir,
          sakit,
          izin,
          alfa,
          persentase,
          jam_masuk: jamMasuks.length > 0 ? jamMasuks.join(", ") : "-",
          jam_pulang: jamPulangs.length > 0 ? jamPulangs.join(", ") : "-"
        };
      });
      
      return { success: true, data: rekap };
    }

    case "getDashboardMetrics": {
      // Execute auto-alfa synchronization for today and past recent days
      try {
        jalankanAutoAlfaSistem();
      } catch (e) {}

      const siswaList = getStorage("data_siswa");
      const guruList = getStorage("data_guru");
      const siswaLaporan = getStorage("laporan_siswa");
      const guruLaporan = getStorage("laporan_guru");
      
      const tgl = new Date().toISOString().split("T")[0];
      
      const countStat = (list: any[], reports: any[], idKey: string) => {
        let hadirMasuk = 0;
        let hadirPulang = 0;
        let totalTepat = 0;
        let rawAlfa = 0;
        
        const todayRpts = reports.filter((r: any) => r.tanggal === tgl);
        
        todayRpts.forEach((r: any) => {
          const sm = String(r.status_masuk || "").toLowerCase();
          const sp = String(r.status_pulang || "").toLowerCase();
          
          if (sm.includes("tepat") || sm.includes("terlambat") || sm.includes("lupa") || sm.includes("hadir")) {
            hadirMasuk++;
            if (sm.includes("tepat")) {
              totalTepat++;
            }
          } else if (sm.includes("alfa") || sm.includes("alpha")) {
            rawAlfa++;
          }
          
          if (sp.includes("tepat") || sp.includes("terlambat") || sp.includes("lupa") || sp.includes("hadir") || sp.includes("pulang")) {
            hadirPulang++;
          }
        });
        
        const persentaseTepatInt = hadirMasuk > 0 ? Math.round((totalTepat / hadirMasuk) * 100) : 0;
        const persentaseTepat = persentaseTepatInt + "%";
        
        const pAlfa = list.length > 0 ? Math.round((rawAlfa / list.length) * 100) : 0;
        const pPulang = list.length > 0 ? Math.round((hadirPulang / list.length) * 100) : 0;
        
        return { hadirMasuk, hadirPulang, persentaseTepat, persentaseTepatInt, pAlfa, pPulang, rawAlfa };
      };
      
      const statsSiswa = countStat(siswaList, siswaLaporan, "id_siswa");
      const statsGuru = countStat(guruList, guruLaporan, "id_guru");
      
      const chartLabels: string[] = [];
      const chartData: number[] = [];
      
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const dayLabel = d.toLocaleDateString("id-ID", { month: "short", day: "numeric" });
        chartLabels.push(dayLabel);
        
        const count = siswaLaporan.filter((r: any) => {
          const sm = String(r.status_masuk || "").toLowerCase();
          return r.tanggal === dateStr && (sm.includes("tepat") || sm.includes("terlambat") || sm.includes("lupa") || sm.includes("hadir"));
        }).length;
        chartData.push(count);
      }
      
      return {
        success: true,
        data: {
          totalSiswa: siswaList.length,
          siswaMasuk: statsSiswa.hadirMasuk,
          siswaPulang: statsSiswa.hadirPulang,
          siswaTepat: statsSiswa.persentaseTepat,
          siswaTepatInt: statsSiswa.persentaseTepatInt,
          siswaPulangPersenInt: statsSiswa.pPulang,
          siswaAlfaInt: statsSiswa.pAlfa,
          
          totalGuru: guruList.length,
          guruMasuk: statsGuru.hadirMasuk,
          guruPulang: statsGuru.hadirPulang,
          guruTepat: statsGuru.persentaseTepat,
          guruTepatInt: statsGuru.persentaseTepatInt,
          guruPulangPersenInt: statsGuru.pPulang,
          guruAlfaInt: statsGuru.pAlfa,
          
          chartLabels,
          chartData
        }
      };
    }

    case "jalankanAutoAlfa":
    case "cekAutoAlfa":
    case "jalankanAutoAlfaSistem":
    case "triggerAutoAlfa1800": {
      const [tanggal, forceCheck] = args;
      if (tanggal && String(tanggal).includes("rentang")) {
        const res = jalankanAutoAlfaSistemRentang(7, Boolean(forceCheck));
        return { success: true, data: res, message: "Pengecekan rentang Auto-Alfa berhasil dijalankan." };
      }
      const res = jalankanAutoAlfaSistem(tanggal, forceCheck === true);
      return { success: true, data: res, message: res.message };
    }

    case "getUsersSemua": {
      return { success: true, data: getStorage("users") };
    }

    case "tambahUserData": {
      const [userObj] = args;
      const users = getStorage("users");
      if (users.some((u: any) => u.username.toLowerCase() === userObj.username.toLowerCase())) {
        return { success: false, message: "Username sudah terdaftar!" };
      }
      users.push({
        username: userObj.username,
        password: userObj.password || "123456",
        role: userObj.role || "TU",
        target_id: userObj.target_id || "-"
      });
      setStorage("users", users);
      return { success: true, message: "Berhasil menambahkan akun user baru (SIMULASI)." };
    }

    case "editUserData": {
      const [oldUsername, userObj] = args;
      const users = getStorage("users");
      const idx = users.findIndex((u: any) => u.username.toLowerCase() === oldUsername.toLowerCase());
      if (idx !== -1) {
        users[idx] = {
          username: userObj.username,
          password: userObj.password,
          role: userObj.role,
          target_id: userObj.target_id || "-"
        };
        setStorage("users", users);
        return { success: true, message: "Berhasil memperbarui data user (SIMULASI)." };
      }
      return { success: false, message: "User tidak ditemukan." };
    }

    case "hapusUserData": {
      const [username] = args;
      let users = getStorage("users");
      if (username.toLowerCase() === "admin") {
        return { success: false, message: "Akun admin utama tidak boleh dihapus!" };
      }
      users = users.filter((u: any) => u.username.toLowerCase() !== username.toLowerCase());
      setStorage("users", users);
      return { success: true, message: "User berhasil dihapus secara permanen (SIMULASI)." };
    }

    case "getJadwalGuruSemua": {
      if (!localStorage.getItem("MOCK_jadwal_guru")) {
        localStorage.setItem("MOCK_jadwal_guru", JSON.stringify([]));
      }
      return { success: true, data: getStorage("jadwal_guru") };
    }

    case "tambahJadwalGuru": {
      const [jadwalObj] = args;
      if (!localStorage.getItem("MOCK_jadwal_guru")) {
        localStorage.setItem("MOCK_jadwal_guru", JSON.stringify([]));
      }
      const list = getStorage("jadwal_guru");
      if (list.some((j: any) => j.id_guru === jadwalObj.id_guru && j.hari === jadwalObj.hari)) {
        return { success: false, message: `Jadwal untuk guru tersebut di hari ${jadwalObj.hari} sudah ada!` };
      }
      const idJadwal = "J-" + Math.floor(Math.random() * 10000);
      list.push({
        id_jadwal: idJadwal,
        id_guru: jadwalObj.id_guru,
        nama_guru: jadwalObj.nama_guru,
        hari: jadwalObj.hari,
        jam_masuk_mulai: jadwalObj.jam_masuk_mulai,
        jam_masuk_batas: jadwalObj.jam_masuk_batas,
        jam_pulang_mulai: jadwalObj.jam_pulang_mulai
      });
      setStorage("jadwal_guru", list);
      return { success: true, message: "Jadwal guru berhasil disimpan (SIMULASI)." };
    }

    case "editJadwalGuru": {
      const [idJadwal, jadwalObj] = args;
      const list = getStorage("jadwal_guru");
      const idx = list.findIndex((j: any) => j.id_jadwal === idJadwal);
      if (idx !== -1) {
        list[idx] = {
          id_jadwal: idJadwal,
          id_guru: jadwalObj.id_guru,
          nama_guru: jadwalObj.nama_guru,
          hari: jadwalObj.hari,
          jam_masuk_mulai: jadwalObj.jam_masuk_mulai,
          jam_masuk_batas: jadwalObj.jam_masuk_batas,
          jam_pulang_mulai: jadwalObj.jam_pulang_mulai
        };
        setStorage("jadwal_guru", list);
        return { success: true, message: "Jadwal guru berhasil diperbarui (SIMULASI)." };
      }
      return { success: false, message: "Jadwal tidak ditemukan." };
    }

    case "hapusJadwalGuru": {
      const [idJadwal] = args;
      let list = getStorage("jadwal_guru");
      list = list.filter((j: any) => j.id_jadwal !== idJadwal);
      setStorage("jadwal_guru", list);
      return { success: true, message: "Jadwal guru berhasil dihapus (SIMULASI)." };
    }

    // Jam Pelajaran (Lesson Period Slots)
    case "getJamPelajaran":
    case "getJamPelajaranSemua":
    case "getJamPelajaranList": {
      return { success: true, data: getStorage("jam_pelajaran") };
    }

    case "simpanJamPelajaran":
    case "tambahJamPelajaran":
    case "editJamPelajaran": {
      const [jamObj, optionalPayload] = args;
      const actualObj = (typeof jamObj === "object" && jamObj !== null) ? jamObj : optionalPayload;
      if (!actualObj) return { success: false, message: "Data slot jam pelajaran tidak valid." };

      const list = getStorage("jam_pelajaran");
      const idJam = actualObj.id_jam || "JP-" + Date.now();
      
      const existingIdx = list.findIndex((j: any) => j.id_jam === idJam);
      const newObj = {
        id_jam: idJam,
        jam_ke: Number(actualObj.jam_ke || 0),
        nama_jam: actualObj.nama_jam || `Jam ke-${actualObj.jam_ke}`,
        jam_mulai: actualObj.jam_mulai || "07:00",
        jam_selesai: actualObj.jam_selesai || "07:45",
        tipe: actualObj.tipe || "Pelajaran"
      };

      if (existingIdx !== -1) {
        list[existingIdx] = newObj;
      } else {
        list.push(newObj);
      }
      list.sort((a: any, b: any) => (a.jam_mulai || "").localeCompare(b.jam_mulai || ""));
      setStorage("jam_pelajaran", list);
      return { success: true, message: "Slot jam pelajaran berhasil disimpan!" };
    }

    case "hapusJamPelajaran": {
      const [idJam] = args;
      let list = getStorage("jam_pelajaran");
      list = list.filter((j: any) => j.id_jam !== idJam);
      setStorage("jam_pelajaran", list);
      return { success: true, message: "Slot jam pelajaran berhasil dihapus." };
    }

    // Jadwal Pelajaran (Subject Schedule Matrix)
    case "getJadwalPelajaranSemua":
    case "getJadwalPelajaran":
    case "getJadwalSemua": {
      return { success: true, data: getStorage("jadwal_pelajaran") };
    }

    case "tambahJadwalPelajaran": {
      const [payload] = args;
      const list = getStorage("jadwal_pelajaran");
      const idJadwal = "JPEL-" + Math.floor(Math.random() * 100000);
      const newSchedule = {
        id_jadwal: idJadwal,
        hari: payload.hari,
        id_jam: payload.id_jam || "JP-" + payload.jam_ke,
        jam_ke: Number(payload.jam_ke || 1),
        jam_mulai: payload.jam_mulai || "-",
        jam_selesai: payload.jam_selesai || "-",
        kelas: payload.kelas,
        mapel: payload.mapel,
        id_guru: payload.id_guru,
        nama_guru: payload.nama_guru,
        ruangan: payload.ruangan || "-"
      };
      list.push(newSchedule);
      setStorage("jadwal_pelajaran", list);
      return { success: true, message: "Jadwal pelajaran berhasil ditambahkan (SIMULASI)." };
    }

    case "editJadwalPelajaran": {
      const [idJadwal, payload] = args;
      const list = getStorage("jadwal_pelajaran");
      const idx = list.findIndex((j: any) => j.id_jadwal === idJadwal);
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          hari: payload.hari,
          id_jam: payload.id_jam || list[idx].id_jam,
          jam_ke: Number(payload.jam_ke || list[idx].jam_ke),
          jam_mulai: payload.jam_mulai || list[idx].jam_mulai,
          jam_selesai: payload.jam_selesai || list[idx].jam_selesai,
          kelas: payload.kelas,
          mapel: payload.mapel,
          id_guru: payload.id_guru,
          nama_guru: payload.nama_guru,
          ruangan: payload.ruangan || list[idx].ruangan || "-"
        };
        setStorage("jadwal_pelajaran", list);
        return { success: true, message: "Jadwal pelajaran berhasil diperbarui (SIMULASI)." };
      }
      return { success: false, message: "Jadwal pelajaran tidak ditemukan." };
    }

    case "hapusJadwalPelajaran": {
      const [idJadwal] = args;
      let list = getStorage("jadwal_pelajaran");
      list = list.filter((j: any) => j.id_jadwal !== idJadwal);
      setStorage("jadwal_pelajaran", list);
      return { success: true, message: "Jadwal pelajaran berhasil dihapus (SIMULASI)." };
    }

    // Absensi Mengajar Guru (Teacher Class Attendance per Lesson Period)
    case "getAbsensiMengajarGuru": {
      return { success: true, data: getStorage("absensi_mengajar_guru") };
    }

    case "simpanAbsensiMengajarGuru": {
      const [payload] = args;
      const list = getStorage("absensi_mengajar_guru");
      const jamList = getStorage("jam_pelajaran") || [];
      const idLog = "LOG-MENG-" + Date.now();
      const tgl = payload.tanggal || new Date().toISOString().split("T")[0];
      const timeStr = payload.waktu_absen || new Date().toTimeString().slice(0, 5);
      const jamNum = Number(payload.jam_ke || 1);
      const slot = jamList.find((j: any) => Number(j.jam_ke) === jamNum);

      let startJadwal = payload.jam_mulai_jadwal;
      let endJadwal = payload.jam_selesai_jadwal;
      if ((!startJadwal || startJadwal === "-") && slot) {
        startJadwal = slot.jam_mulai;
      }
      if ((!endJadwal || endJadwal === "-") && slot) {
        endJadwal = slot.jam_selesai;
      }

      // Check Schedule Time Window restriction if enabled
      const savedCfg = JSON.parse(localStorage.getItem(getStorageKey("MOCK_pengaturan_jam")) || "{}");
      const batasiJam = savedCfg.batasi_jam_jadwal !== undefined ? Boolean(savedCfg.batasi_jam_jadwal) : true;
      const tolAwal = Number(savedCfg.toleransi_awal_menit ?? 15);
      const tolAkhir = Number(savedCfg.toleransi_akhir_menit ?? 30);

      if (batasiJam && startJadwal && startJadwal !== "-" && endJadwal && endJadwal !== "-") {
        const [hM, mM] = startJadwal.split(":").map(Number);
        const [hS, mS] = endJadwal.split(":").map(Number);
        const [hN, mN] = timeStr.split(":").map(Number);
        if (!isNaN(hM) && !isNaN(mM) && !isNaN(hS) && !isNaN(mS) && !isNaN(hN) && !isNaN(mN)) {
          const startMin = hM * 60 + mM;
          const endMin = hS * 60 + mS;
          const nowMin = hN * 60 + mN;

          if (nowMin < startMin - tolAwal) {
            return {
              success: false,
              message: `Presensi mengajar ditolak: Belum masuk jam jadwal pelajaran (${payload.mapel || "Pelajaran"} ${payload.kelas || ""}). Jam pelajaran dimulai pukul ${startJadwal}. Saat ini jam ${timeStr}.`
            };
          }
          if (nowMin > endMin + tolAkhir) {
            return {
              success: false,
              message: `Presensi mengajar ditolak: Waktu absen (${timeStr}) berada di luar jam jadwal pelajaran (${startJadwal} - ${endJadwal}).`
            };
          }
        }
      }

      // Check if already logged for same guru, date, kelas, jam_ke
      const existingIdx = list.findIndex(
        (item: any) =>
          item.tanggal === tgl &&
          item.id_guru === payload.id_guru &&
          item.kelas === payload.kelas &&
          Number(item.jam_ke) === jamNum
      );

      const logItem = {
        id_log_mengajar: existingIdx !== -1 ? list[existingIdx].id_log_mengajar : idLog,
        tanggal: tgl,
        waktu_absen: timeStr,
        hari: payload.hari || "Senin",
        id_guru: payload.id_guru,
        nama_guru: payload.nama_guru,
        kelas: payload.kelas,
        mapel: payload.mapel,
        jam_ke: jamNum,
        jam_mulai_jadwal: startJadwal || "-",
        jam_selesai_jadwal: endJadwal || "-",
        status: payload.status || "Hadir Tepat Waktu",
        catatan_materi: payload.catatan_materi || "-"
      };

      if (existingIdx !== -1) {
        list[existingIdx] = logItem;
      } else {
        list.push(logItem);
      }

      setStorage("absensi_mengajar_guru", list);
      return { success: true, message: `Presensi mengajar ${payload.nama_guru} kelas ${payload.kelas} jam ke-${payload.jam_ke} berhasil dicatat!` };
    }

    case "hapusAbsensiMengajarGuru": {
      const [idLog] = args;
      let list = getStorage("absensi_mengajar_guru");
      list = list.filter((item: any) => item.id_log_mengajar !== idLog);
      setStorage("absensi_mengajar_guru", list);
      return { success: true, message: "Riwayat presensi mengajar berhasil dihapus (SIMULASI)." };
    }

    case "buatStrukturDatabaseOtomatis": {
      localStorage.removeItem(getStorageKey("MOCK_users"));
      localStorage.removeItem(getStorageKey("MOCK_data_siswa"));
      localStorage.removeItem(getStorageKey("MOCK_data_guru"));
      localStorage.removeItem(getStorageKey("MOCK_laporan_siswa"));
      localStorage.removeItem(getStorageKey("MOCK_laporan_guru"));
      localStorage.removeItem(getStorageKey("MOCK_pengaturan_jam"));
      localStorage.removeItem(getStorageKey("MOCK_hari_libur"));
      localStorage.removeItem(getStorageKey("MOCK_data_kelas"));
      localStorage.removeItem(getStorageKey("MOCK_jadwal_guru"));
      initMockDb();
      localStorage.setItem(getStorageKey("MOCK_jadwal_guru"), JSON.stringify([]));
      return { success: true, message: "Struktur database berhasil dibuat ulang (SIMULASI)!" };
    }

    case "backupDatabaseToDrive":
    case "backupSpreadsheetToDrive":
    case "backupSpreadsheetGoogleDrive": {
      const [folderId] = args;
      const dateStr = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const isSpreadsheet = action.includes("Spreadsheet");
      const name = isSpreadsheet ? `Backup_Spreadsheet_SIAS_${dateStr}` : `backup_database_sias_${dateStr}.json`;
      return {
        success: true,
        message: `Backup ${isSpreadsheet ? "Spreadsheet Google Sheets" : "Database"} berhasil disimpan ke Google Drive${folderId ? ` (Folder: ${folderId})` : ""}!`,
        fileName: name,
        fileUrl: "https://drive.google.com"
      };
    }

    case "restoreDatabaseJSON":
    case "restoreDatabase": {
      const [payload] = args;
      if (!payload || typeof payload !== "object") {
        return { success: false, message: "Format payload restore tidak valid." };
      }
      if (Array.isArray(payload.data_siswa) || Array.isArray(payload.DataSiswa)) {
        setStorage("data_siswa", payload.data_siswa || payload.DataSiswa);
      }
      if (Array.isArray(payload.data_guru) || Array.isArray(payload.DataGuru)) {
        setStorage("data_guru", payload.data_guru || payload.DataGuru);
      }
      if (Array.isArray(payload.data_kelas) || Array.isArray(payload.DataKelas)) {
        setStorage("data_kelas", payload.data_kelas || payload.DataKelas);
      }
      if (Array.isArray(payload.jam_pelajaran) || Array.isArray(payload.JamPelajaran)) {
        setStorage("jam_pelajaran", payload.jam_pelajaran || payload.JamPelajaran);
      }
      if (Array.isArray(payload.jadwal_pelajaran) || Array.isArray(payload.JadwalPelajaran)) {
        setStorage("jadwal_pelajaran", payload.jadwal_pelajaran || payload.JadwalPelajaran);
      }
      if (Array.isArray(payload.jadwal_guru) || Array.isArray(payload.JadwalGuru)) {
        setStorage("jadwal_guru", payload.jadwal_guru || payload.JadwalGuru);
      }
      if (Array.isArray(payload.laporan_siswa) || Array.isArray(payload.PresensiSiswa)) {
        setStorage("laporan_siswa", payload.laporan_siswa || payload.PresensiSiswa);
      }
      if (Array.isArray(payload.laporan_guru) || Array.isArray(payload.PresensiGuru)) {
        setStorage("laporan_guru", payload.laporan_guru || payload.PresensiGuru);
      }
      if (Array.isArray(payload.absensi_mengajar_guru) || Array.isArray(payload.AbsensiMengajar)) {
        setStorage("absensi_mengajar_guru", payload.absensi_mengajar_guru || payload.AbsensiMengajar);
      }
      if (Array.isArray(payload.hari_libur) || Array.isArray(payload.HariLibur)) {
        setStorage("hari_libur", payload.hari_libur || payload.HariLibur);
      }
      if (Array.isArray(payload.users) || Array.isArray(payload.Users)) {
        setStorage("users", payload.users || payload.Users);
      }
      if (payload.pengaturan && typeof payload.pengaturan === "object") {
        const clean = sanitizeTimeFields(payload.pengaturan);
        localStorage.setItem(getStorageKey("MOCK_pengaturan_jam"), JSON.stringify(clean));
        localStorage.setItem(getStorageKey("pengaturan_jam"), JSON.stringify(clean));
      }
      return { success: true, message: "Database berhasil dipulihkan secara menyeluruh!" };
    }

    case "restoreDatabaseSpreadsheet": {
      const [sheetsObj] = args;
      if (!sheetsObj || typeof sheetsObj !== "object") {
        return { success: false, message: "Data spreadsheet tidak valid." };
      }
      // Process each sheet name
      if (Array.isArray(sheetsObj.DataSiswa || sheetsObj.data_siswa)) {
        setStorage("data_siswa", sheetsObj.DataSiswa || sheetsObj.data_siswa);
      }
      if (Array.isArray(sheetsObj.DataGuru || sheetsObj.data_guru)) {
        setStorage("data_guru", sheetsObj.DataGuru || sheetsObj.data_guru);
      }
      if (Array.isArray(sheetsObj.DataKelas || sheetsObj.data_kelas)) {
        setStorage("data_kelas", sheetsObj.DataKelas || sheetsObj.data_kelas);
      }
      if (Array.isArray(sheetsObj.JadwalGuru || sheetsObj.jadwal_guru)) {
        setStorage("jadwal_guru", sheetsObj.JadwalGuru || sheetsObj.jadwal_guru);
      }
      if (Array.isArray(sheetsObj.JadwalPelajaran || sheetsObj.jadwal_pelajaran)) {
        setStorage("jadwal_pelajaran", sheetsObj.JadwalPelajaran || sheetsObj.jadwal_pelajaran);
      }
      if (Array.isArray(sheetsObj.JamPelajaran || sheetsObj.jam_pelajaran)) {
        setStorage("jam_pelajaran", sheetsObj.JamPelajaran || sheetsObj.jam_pelajaran);
      }
      if (Array.isArray(sheetsObj.PresensiSiswa || sheetsObj.laporan_siswa)) {
        setStorage("laporan_siswa", sheetsObj.PresensiSiswa || sheetsObj.laporan_siswa);
      }
      if (Array.isArray(sheetsObj.PresensiGuru || sheetsObj.laporan_guru)) {
        setStorage("laporan_guru", sheetsObj.PresensiGuru || sheetsObj.laporan_guru);
      }
      if (Array.isArray(sheetsObj.AbsensiMengajar || sheetsObj.absensi_mengajar_guru)) {
        setStorage("absensi_mengajar_guru", sheetsObj.AbsensiMengajar || sheetsObj.absensi_mengajar_guru);
      }
      if (Array.isArray(sheetsObj.HariLibur || sheetsObj.hari_libur)) {
        setStorage("hari_libur", sheetsObj.HariLibur || sheetsObj.hari_libur);
      }
      if (Array.isArray(sheetsObj.Users || sheetsObj.users)) {
        setStorage("users", sheetsObj.Users || sheetsObj.users);
      }
      if (Array.isArray(sheetsObj.Pengaturan)) {
        const conf: any = {};
        sheetsObj.Pengaturan.forEach((item: any) => {
          const k = item.kunci || item.key;
          const v = item.nilai !== undefined ? item.nilai : item.value;
          if (k) conf[k] = v;
        });
        const clean = sanitizeTimeFields(conf);
        localStorage.setItem(getStorageKey("MOCK_pengaturan_jam"), JSON.stringify(clean));
        localStorage.setItem(getStorageKey("pengaturan_jam"), JSON.stringify(clean));
      }
      return { success: true, message: "Database dari file Spreadsheet Excel berhasil dipulihkan!" };
    }

    default:
      return { success: false, message: "Action not simulated: " + action };
  }
}

export function isInvalidWali(s: any): boolean {
  if (!s) return true;
  const str = String(s).trim().toLowerCase();
  return (
    str === "" ||
    str === "-" ||
    str === "null" ||
    str === "undefined" ||
    str === "wali" ||
    str === "wali kelas" ||
    str === "wali_kelas" ||
    str === "walikelas" ||
    str === "pilih wali" ||
    str.includes("pilih wali") ||
    str.includes("-- pilih") ||
    str.includes("belum sesuai") ||
    str.includes("belum ada") ||
    str.includes("belum ditentukan")
  );
}

export function parseTimeToMinutes(val: any): number {
  if (val === null || val === undefined) return -1;
  if (typeof val === "number") {
    // If fractional day (e.g. from Google Sheets / Excel time value: 0.30208333)
    if (val >= 0 && val <= 1) return Math.round(val * 24 * 60);
    return val;
  }
  let str = String(val).trim();
  if (!str || str === "-" || str === "null" || str === "undefined") return -1;

  // Handle ISO Date strings (especially Google Sheets 1899-12-30 epoch dates)
  if (str.includes("T")) {
    try {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        try {
          const formatter = new Intl.DateTimeFormat("en-GB", {
            timeZone: "Asia/Jakarta",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
          });
          const parts = formatter.format(d).split(":");
          const h = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10);
          if (!isNaN(h) && !isNaN(m)) {
            return (h % 24) * 60 + (m % 60);
          }
        } catch (e) {
          // Fallback to local / UTC conversion
          const h = (d.getHours() % 24);
          const m = (d.getMinutes() % 60);
          return h * 60 + m;
        }
      }
    } catch (e) {}
    const timePart = str.split("T")[1];
    if (timePart) str = timePart;
  }

  // Replace dots or other separators with colon (e.g. 07.15 -> 07:15)
  str = str.replace(/\./g, ":");
  const match = str.match(/(\d{1,2}):(\d{1,2})/);
  if (match) {
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    if (!isNaN(h) && !isNaN(m)) {
      return (h % 24) * 60 + (m % 60);
    }
  }
  return -1;
}

export function cleanTimeHHMM(val: any): string {
  if (val === null || val === undefined) return "";
  const min = parseTimeToMinutes(val);
  if (min < 0) {
    // If it's already a simple valid string
    const str = String(val).trim();
    if (/^\d{2}:\d{2}$/.test(str)) return str;
    return "";
  }
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const KNOWN_TIME_KEYS = new Set([
  "jam_masuk_mulai",
  "jam_masuk_batas",
  "jam_pulang_mulai",
  "jam_masuk",
  "jam_pulang",
  "jam_mulai",
  "jam_selesai",
  "waktu_absen",
  "jam_mulai_jadwal",
  "jam_selesai_jadwal",
  "backupJam",
  "jam_batas_alfa",
  "jamMasukMulai",
  "jamMasukBatas",
  "jamPulangMulai"
]);

export function sanitizeTimeFields<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (typeof data !== "object") {
    if (typeof data === "string" && (data.includes("1899-") || data.includes("1900-"))) {
      return (cleanTimeHHMM(data) || data) as any;
    }
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeTimeFields(item)) as any;
  }
  const result: any = { ...(data as any) };
  for (const key of Object.keys(result)) {
    const val = result[key];
    const kLower = key.toLowerCase();
    const isTimeKey =
      KNOWN_TIME_KEYS.has(key) ||
      kLower.startsWith("jam_") ||
      kLower.endsWith("_jam") ||
      kLower.includes("waktu_absen") ||
      kLower.includes("jam_mulai") ||
      kLower.includes("jam_selesai") ||
      kLower.includes("jam_masuk") ||
      kLower.includes("jam_pulang");

    if (isTimeKey && val !== null && val !== undefined) {
      if (typeof val === "string" || typeof val === "number") {
        const cleaned = cleanTimeHHMM(val);
        if (cleaned) {
          result[key] = cleaned;
        }
      }
    } else if (typeof val === "object" && val !== null) {
      result[key] = sanitizeTimeFields(val);
    }
  }
  return result;
}

// Main bridge function to invoke Apps Script Web App actions
export async function callGas(action: string, args: any[] = []): Promise<any> {
  const actLower = String(action || "").toLowerCase();

  // Instant local actions that should execute immediately (< 5ms) without waiting for network roundtrips
  if (
    actLower.includes("autoalfa") ||
    action === "jalankanAutoAlfa" ||
    action === "cekAutoAlfa" ||
    action === "jalankanAutoAlfaSistem" ||
    action === "triggerAutoAlfa1800"
  ) {
    return callMock(action, args);
  }

  if (isUsingMock()) {
    await new Promise((resolve) => setTimeout(resolve, 80));
    return callMock(action, args);
  }
  
  const url = getGasUrl();
  const token = getGasToken();
  const controller = new AbortController();
  // Allow up to 35 seconds for Google Apps Script cold starts and heavy spreadsheet operations
  const timeoutId = setTimeout(() => {
    try {
      controller.abort();
    } catch (e) {}
  }, 35000);

  try {
    const bodyObj: any = { action, args, token };
    if (args && args.length > 0) {
      if (action === "editKelas") {
        const kLama = typeof args[0] === "string" ? args[0] : (args[0]?.nama_kelas || args[0]?.kelas || "");
        const kBaru = typeof args[1] === "string" ? args[1] : (args[1]?.nama_kelas || args[1]?.kelas || kLama);
        const wRaw = typeof args[2] === "string" ? args[2] : (args[2]?.wali_kelas || args[2]?.wali || args[2]?.waliKelas || args[2]?.nama_guru || args[2]?.guru_wali || "-");
        const wVal = isInvalidWali(wRaw) ? "-" : String(wRaw).trim();
        const idG = typeof args[3] === "string" ? args[3] : (args[2]?.id_guru || args[4]?.id_guru || "-");

        bodyObj.kelasLama = kLama;
        bodyObj.kelasBaru = kBaru;
        bodyObj.nama_kelas = kBaru;
        bodyObj.kelas = kBaru;
        bodyObj.namaKelas = kBaru;
        bodyObj.id_guru = idG;
        bodyObj.idGuru = idG;
        bodyObj.id_wali = idG;
        bodyObj.wali_kelas = wVal;
        bodyObj.wali = wVal;
        bodyObj.waliKelas = wVal;
        bodyObj.nama_guru = wVal;
        bodyObj.guru_wali = wVal;
        bodyObj.walikelas = wVal;
        bodyObj.guruWali = wVal;
        bodyObj.wali_kelas_nama = wVal;

        // Synchronize local storage immediately
        let currentK = getStorage("data_kelas") || [];
        if (!Array.isArray(currentK)) currentK = [];
        const idx = currentK.findIndex((k: any) => (typeof k === "string" ? k : (k.nama_kelas || k.kelas)) === kLama);
        if (idx !== -1) {
          currentK[idx] = { nama_kelas: kBaru, id_guru: idG, wali_kelas: wVal };
        } else {
          currentK.push({ nama_kelas: kBaru, id_guru: idG, wali_kelas: wVal });
        }
        setStorage("data_kelas", currentK);
      } else if (action === "simpanWaliKelas" || action === "tambahKelas") {
        const kNama = typeof args[0] === "string" ? args[0] : (args[0]?.nama_kelas || args[0]?.kelas || "");
        const wRaw = typeof args[1] === "string" ? args[1] : (args[1]?.wali_kelas || args[1]?.wali || args[1]?.waliKelas || args[1]?.nama_guru || args[1]?.guru_wali || "-");
        const wVal = isInvalidWali(wRaw) ? "-" : String(wRaw).trim();
        const idG = typeof args[2] === "string" ? args[2] : (args[1]?.id_guru || args[3]?.id_guru || "-");

        bodyObj.nama_kelas = kNama;
        bodyObj.kelas = kNama;
        bodyObj.namaKelas = kNama;
        bodyObj.id_guru = idG;
        bodyObj.idGuru = idG;
        bodyObj.id_wali = idG;
        bodyObj.wali_kelas = wVal;
        bodyObj.wali = wVal;
        bodyObj.waliKelas = wVal;
        bodyObj.nama_guru = wVal;
        bodyObj.guru_wali = wVal;
        bodyObj.walikelas = wVal;
        bodyObj.guruWali = wVal;
        bodyObj.wali_kelas_nama = wVal;

        // Synchronize local storage immediately
        let currentK = getStorage("data_kelas") || [];
        if (!Array.isArray(currentK)) currentK = [];
        const idx = currentK.findIndex((k: any) => (typeof k === "string" ? k : (k.nama_kelas || k.kelas)) === kNama);
        if (idx !== -1) {
          currentK[idx] = { nama_kelas: kNama, id_guru: idG, wali_kelas: wVal };
        } else {
          currentK.push({ nama_kelas: kNama, id_guru: idG, wali_kelas: wVal });
        }
        setStorage("data_kelas", currentK);
      } else if (action === "editDataMaster" || action === "tambahDataMaster") {
        const cat = args[0];
        if (cat === "Kelas") {
          const itemObj = typeof args[1] === "object" ? args[1] : (typeof args[2] === "object" ? args[2] : {});
          const kNama = itemObj.nama_kelas || itemObj.kelas || (typeof args[1] === "string" ? args[1] : "");
          const wRaw = itemObj.wali_kelas || itemObj.wali || itemObj.waliKelas || itemObj.nama_guru || itemObj.guru_wali || "-";
          const wVal = isInvalidWali(wRaw) ? "-" : String(wRaw).trim();
          const idG = itemObj.id_guru || itemObj.idGuru || itemObj.id_wali || "-";

          bodyObj.nama_kelas = kNama;
          bodyObj.kelas = kNama;
          bodyObj.namaKelas = kNama;
          bodyObj.id_guru = idG;
          bodyObj.idGuru = idG;
          bodyObj.id_wali = idG;
          bodyObj.wali_kelas = wVal;
          bodyObj.wali = wVal;
          bodyObj.waliKelas = wVal;
          bodyObj.nama_guru = wVal;
          bodyObj.guru_wali = wVal;
          bodyObj.walikelas = wVal;
          bodyObj.guruWali = wVal;
          bodyObj.wali_kelas_nama = wVal;

          let currentK = getStorage("data_kelas") || [];
          if (!Array.isArray(currentK)) currentK = [];
          const idx = currentK.findIndex((k: any) => (typeof k === "string" ? k : (k.nama_kelas || k.kelas)) === kNama);
          if (idx !== -1) {
            currentK[idx] = { nama_kelas: kNama, id_guru: idG, wali_kelas: wVal };
          } else {
            currentK.push({ nama_kelas: kNama, id_guru: idG, wali_kelas: wVal });
          }
          setStorage("data_kelas", currentK);
        }
      }

      // Explicit sheet destination mapping according to system architecture
      const actLower = String(action || "").toLowerCase();
      const firstArg = typeof args[0] === "string" ? args[0] : "";
      const secondArg = typeof args[1] === "string" ? args[1] : "";
      const thirdArg = typeof args[2] === "string" ? args[2] : "";
      const fifthArg = typeof args[4] === "string" ? args[4] : "";

      let resolvedSheet = "";

      if (
        actLower.includes("absensimengajar") ||
        actLower.includes("jadwalmengajar") ||
        firstArg === "AbsensiMengajar" ||
        secondArg === "AbsensiMengajar" ||
        fifthArg === "AbsensiMengajar"
      ) {
        resolvedSheet = "AbsensiMengajar";
      } else if (
        action === "getPresensiSiswa" ||
        action === "catatAbsensiSiswa" ||
        (actLower.includes("laporan") && (firstArg === "Siswa" || secondArg === "Siswa")) ||
        (action === "simpanAbsenManual" && secondArg === "Siswa") ||
        (action === "prosesScanQR" && (secondArg === "Siswa" || firstArg === "Siswa"))
      ) {
        resolvedSheet = "PresensiSiswa";
      } else if (
        action === "getJadwalPelajaran" ||
        action === "getJadwalPelajaranSemua" ||
        action === "getJadwalSemua" ||
        action === "tambahJadwalPelajaran" ||
        action === "editJadwalPelajaran" ||
        action === "hapusJadwalPelajaran" ||
        action === "simpanJadwalPelajaran" ||
        actLower.includes("jadwalpelajaran")
      ) {
        resolvedSheet = "JadwalPelajaran";
      } else if (
        action === "getJadwalGuru" ||
        action === "getJadwalGuruSemua" ||
        action === "tambahJadwalGuru" ||
        action === "editJadwalGuru" ||
        action === "hapusJadwalGuru" ||
        action === "simpanJadwalGuru" ||
        (actLower.includes("jadwalguru") && !actLower.includes("pelajaran"))
      ) {
        resolvedSheet = "JadwalGuru";
      } else if (
        action === "getPresensiGuru" ||
        action === "catatAbsensiGuru" ||
        (actLower.includes("laporan") && (firstArg === "Guru" || secondArg === "Guru")) ||
        (action === "simpanAbsenManual" && secondArg === "Guru")
      ) {
        resolvedSheet = "PresensiGuru";
      } else if (action === "prosesScanQR") {
        // Smart routing for teacher: Teaching Schedule (AbsensiMengajar) vs Flexible Schedule (PresensiGuru)
        const code = firstArg;
        const role = secondArg;
        if (role === "Guru" || !role) {
          const allTeaching = getStorage("jadwal_pelajaran") || [];
          const dataGuru = getStorage("data_guru") || [];
          const gObj = dataGuru.find((g: any) => 
            String(g.id_guru || "").toLowerCase() === code.toLowerCase() ||
            String(g.nip_nuptk || "").toLowerCase() === code.toLowerCase() ||
            String(g.nama_guru || "").toLowerCase() === code.toLowerCase()
          );
          const gName = (gObj?.nama_guru || code).trim().toLowerCase();
          const gId = (gObj?.id_guru || code).trim().toLowerCase();
          const daysMap: Record<number, string> = { 0: "Minggu", 1: "Senin", 2: "Selasa", 3: "Rabu", 4: "Kamis", 5: "Jumat", 6: "Sabtu" };
          const todayName = daysMap[new Date().getDay()] || "Senin";
          
          const hasTodayTeaching = allTeaching.some((s: any) => {
            const matchName = s.nama_guru && String(s.nama_guru).trim().toLowerCase() === gName;
            const matchId = s.id_guru && String(s.id_guru).trim().toLowerCase() === gId;
            const matchDay = (s.hari || "").trim().toLowerCase() === todayName.toLowerCase();
            return (matchName || matchId) && matchDay;
          });

          if (hasTodayTeaching) {
            resolvedSheet = "AbsensiMengajar";
          } else {
            resolvedSheet = "PresensiGuru";
          }
        }
      }

      if (resolvedSheet) {
        bodyObj.sheet_name = resolvedSheet;
        bodyObj.sheetName = resolvedSheet;
        bodyObj.target_sheet = resolvedSheet;
        bodyObj.targetSheet = resolvedSheet;
      }

      for (const a of args) {
        if (typeof a === "object" && a !== null && !Array.isArray(a)) {
          Object.assign(bodyObj, a);
        }
      }
    }

    const cleanBodyObj = sanitizeTimeFields(bodyObj);

    const response = await fetch(url, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "text/plain",
      },
      body: JSON.stringify(cleanBodyObj),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`GAS HTTP Status: ${response.status} ${response.statusText}, beralih ke cache lokal.`);
      return callMock(action, args);
    }
    
    const responseText = await response.text();
    let rawResult: any;
    try {
      rawResult = JSON.parse(responseText);
    } catch (parseErr) {
      console.warn("GAS Web App returned non-JSON format (kemungkinan butuh otorisasi akun / deployment ulang):", responseText.slice(0, 150));
      return callMock(action, args);
    }

    const result = sanitizeTimeFields(rawResult);

    if (result && result.success === false && result.message && (
      result.message.includes("tidak diizinkan") || 
      result.message.includes("tidak dikenal") ||
      result.message.includes("tidak ditemukan") ||
      result.message.includes("not recognized")
    )) {
      console.warn(`GAS Action '${action}' not recognized by remote Web App endpoint. Falling back to local storage execution.`);
      return callMock(action, args);
    }

    // Auto-sync valid cloud data to local storage for offline & fallback consistency
    if (result && result.success !== false) {
      try {
        if (action.includes("JamPelajaran")) {
          const list = Array.isArray(result) ? result : (Array.isArray(result.data) ? result.data : null);
          if (list) setStorage("jam_pelajaran", list);
        } else if (action.includes("JadwalPelajaran") || action === "getJadwalSemua") {
          const list = Array.isArray(result) ? result : (Array.isArray(result.data) ? result.data : null);
          if (list) setStorage("jadwal_pelajaran", list);
        } else if (action === "getJadwalGuruSemua" || action === "getJadwalGuru") {
          const list = Array.isArray(result) ? result : (Array.isArray(result.data) ? result.data : null);
          if (list) setStorage("jadwal_guru", list);
        } else if (action.includes("Pengaturan") || action.includes("KonfigurasiJam")) {
          let rawObj = result && typeof result === "object" ? (result.data || result) : null;
          let jMulai = "";
          let jBatas = "";
          let jPulang = "";

          if (Array.isArray(rawObj)) {
            for (const item of rawObj) {
              if (typeof item === "object" && item) {
                const k = String(item.kunci || item.key || item.parameter || item.nama || item.kategori || "").toLowerCase();
                const rawV = item.nilai || item.value || item.isi || "";
                const v = cleanTimeHHMM(rawV);
                if (v) {
                  if (k.includes("masuk_mulai") || k.includes("masuk_awal")) jMulai = v;
                  if (k.includes("masuk_batas") || k.includes("terlambat")) jBatas = v;
                  if (k.includes("pulang_mulai") || k.includes("pulang_awal")) jPulang = v;
                }
              }
            }
          } else if (rawObj && typeof rawObj === "object") {
            jMulai = cleanTimeHHMM(rawObj.jam_masuk_mulai || rawObj.jam_masuk);
            jBatas = cleanTimeHHMM(rawObj.jam_masuk_batas || rawObj.jam_batas);
            jPulang = cleanTimeHHMM(rawObj.jam_pulang_mulai || rawObj.jam_pulang);
          }
          if (jMulai || jBatas || jPulang) {
            const savedCfg = {
              jam_masuk_mulai: jMulai || "06:00",
              jam_masuk_batas: jBatas || "07:15",
              jam_pulang_mulai: jPulang || "15:30"
            };
            localStorage.setItem(getStorageKey("MOCK_pengaturan_jam"), JSON.stringify(savedCfg));
            localStorage.setItem(getStorageKey("pengaturan_jam"), JSON.stringify(savedCfg));
          }
        } else if (action === "getDataMaster") {
          const cat = args[0];
          const rawList = Array.isArray(result) ? result : (Array.isArray(result.data) ? result.data : null);
          if (rawList) {
            const nameKey = cat === "Siswa" ? "nama_siswa" : "nama_guru";
            const identifierKey = cat === "Siswa" ? "nisn" : "nip_nuptk";
            const cleanList = rawList.filter((item: any) => {
              if (!item || typeof item !== "object") return false;
              const name = String(item[nameKey] || item.nama || item.name || "").trim();
              const identifier = String(item[identifierKey] || "").trim();
              return Boolean((name && name !== "-") || (identifier && identifier !== "-"));
            });
            setStorage(cat === "Siswa" ? "data_siswa" : "data_guru", cleanList);
          }
        } else if (action === "getKelasSemua") {
          const list = Array.isArray(result) ? result : (Array.isArray(result.data) ? result.data : null);
          if (list) {
            const existing = getStorage("data_kelas") || [];
            const mergedMap = new Map<string, { id_guru: string; wali_kelas: string }>();

            // 1. Add existing local entries
            for (const ex of existing) {
              if (typeof ex === "string") {
                if (!mergedMap.has(ex)) mergedMap.set(ex, { id_guru: "-", wali_kelas: "-" });
              } else if (typeof ex === "object" && ex) {
                const name = String(ex.nama_kelas || ex.kelas || "").trim();
                const wali = String(ex.wali_kelas || ex.wali || ex.waliKelas || ex["Wali Kelas"] || "-").trim();
                const idG = String(ex.id_guru || ex.id_wali || ex.idGuru || "-").trim();
                if (name) {
                  if (!mergedMap.has(name) || (mergedMap.get(name)?.wali_kelas === "-" && wali !== "-")) {
                    mergedMap.set(name, { id_guru: idG, wali_kelas: wali });
                  }
                }
              }
            }

            // 2. Add/merge API list
            for (const item of list) {
              const name = String(typeof item === "string" ? item : (item.nama_kelas || item.kelas || "")).trim();
              const waliFromApi = String(typeof item === "object" && item ? (item.wali_kelas || item.wali || item.waliKelas || item.guru_wali || item.nama_guru || item.wali_kelas_nama || item["Wali Kelas"] || "-") : "-").trim();
              const idGFromApi = String(typeof item === "object" && item ? (item.id_guru || item.id_wali || item.idGuru || "-") : "-").trim();
              if (name) {
                const existingObj = mergedMap.get(name) || { id_guru: "-", wali_kelas: "-" };
                const cleanWaliFromApi = isInvalidWali(waliFromApi) ? "-" : waliFromApi;
                const finalWali = (cleanWaliFromApi && cleanWaliFromApi !== "-") ? cleanWaliFromApi : existingObj.wali_kelas;
                const finalIdG = (idGFromApi && idGFromApi !== "-") ? idGFromApi : existingObj.id_guru;
                mergedMap.set(name, { id_guru: finalIdG, wali_kelas: finalWali });
              }
            }

            const merged = Array.from(mergedMap.entries()).map(([nama_kelas, val]) => ({
              nama_kelas,
              id_guru: val.id_guru,
              wali_kelas: val.wali_kelas
            }));

            setStorage("data_kelas", merged);
          }
        } else if (action === "getHariLiburSemua") {
          const list = Array.isArray(result) ? result : (Array.isArray(result.data) ? result.data : null);
          if (list) setStorage("hari_libur", list);
        } else if (action === "getAbsensiMengajarGuru") {
          const list = Array.isArray(result) ? result : (Array.isArray(result.data) ? result.data : null);
          if (list) setStorage("absensi_mengajar_guru", list);
        } else if (action === "getLaporanFilter" || action === "getLaporanPresensi" || action === "getPresensiSiswa" || action === "getPresensiGuru" || action === "getLaporanSiswa" || action === "getLaporanGuru") {
          const list = Array.isArray(result) ? result : (Array.isArray(result?.data) ? result.data : null);
          if (list && Array.isArray(list)) {
            const isSiswa = args[0] === "Siswa" || action.includes("Siswa");
            setStorage(isSiswa ? "laporan_siswa" : "laporan_guru", list);
          }
        }
      } catch (e) {
        console.warn("Auto storage sync error:", e);
      }
    }

    return result;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === "AbortError" || String(err).includes("abort")) {
      console.warn(`GAS API timeout untuk action '${action}', memuat data dari cache lokal (offline fallback).`);
    } else {
      console.warn(`GAS API network issue untuk action '${action}':`, err?.message || err, "— Menggunakan cache database lokal.");
    }
    return callMock(action, args);
  }
}
