/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT BACKEND (Kode.gs) - VERSION 3.0 (FULL SYNC)
 * SISTEM INFORMASI PRESENSI & JADWAL PELAJARAN SEKOLAH (SIAS)
 * ==============================================================================
 *
 * FITUR DATABASE UNGGULAN:
 * 1. Otomatis Deteksi & Dukung Data Lama (Flexibility mapping kolom & sheet)
 * 2. Sinkronisasi Data Master (Siswa, Guru, User, Kelas, Hari Libur)
 * 3. Absensi Real-Time (QR Code, Manual, Bulk, & Log Mengajar)
 * 4. Rekap Laporan & Dashboard Metrics Serba Otomatis
 *
 * CARA PENGGUNAAN / DEPLOYMENT:
 * 1. Buka Google Spreadsheet Anda.
 * 2. Klik "Ekstensi" -> "Apps Script".
 * 3. Hapus seluruh kode lama di Kode.gs, lalu paste seluruh isi file ini.
 * 4. Klik "Simpan" (Ctrl+S).
 * 5. Klik "Terapkan" -> "Penerapan Baru" (Web App).
 *    - Jalankan sebagai: "Saya" (Me)
 *    - Yang memiliki akses: "Siapa Saja" (Anyone)
 * 6. Klik "Terapkan", berikan Izin Akses (Grant Permission), lalu salin URL Web App.
 * 7. Tempelkan URL tersebut pada menu "Pengaturan" di aplikasi SIAS.
 * ==============================================================================
 */

function doGet(e) {
  return responseJSON({
    status: "ok",
    message: "Google Apps Script Backend SIAS v3.0 Berjalan Aktif",
    timestamp: new Date().toISOString()
  });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responseJSON({ success: false, message: "Request body kosong." });
    }

    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const args = data.args || [];

    // Inisialisasi otomatis tab & header spreadsheet jika belum ada
    initSheets();

    let result = { success: false, message: "Action '" + action + "' tidak dikenal." };

    switch (action) {
      // ----------------------------------------------------
      // 1. DATA MASTER (Siswa, Guru, Users)
      // ----------------------------------------------------
      case "getDataMaster":
        result = getDataMaster(args[0]);
        break;
      case "tambahDataMaster":
        result = tambahDataMaster(args[0], args[1]);
        break;
      case "editDataMaster":
        result = editDataMaster(args[0], args[1], args[2]);
        break;
      case "hapusDataMaster":
        result = hapusDataMaster(args[0], args[1]);
        break;
      case "importDataMassal":
        result = importDataMassal(args[0], args[1]);
        break;
      case "getSiswa":
        result = getDataMaster("Siswa");
        break;
      case "getGuru":
        result = getDataMaster("Guru");
        break;

      // ----------------------------------------------------
      // 2. ABSENSI REAL-TIME & KOREKSI MANUAL
      // ----------------------------------------------------
      case "prosesScanQR":
        result = prosesScanQR(args[0], args[1], args[2], args[3]);
        break;
      case "simpanAbsenManual":
        result = simpanAbsenManual(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
        break;
      case "simpanBulkAbsenManual":
        result = simpanBulkAbsenManual(args[0], args[1], args[2], args[3], args[4], args[5]);
        break;
      case "simpanKoreksiManual":
      case "editKehadiran":
      case "editKehadiranFull":
        result = editKehadiran(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
        break;
      case "editKehadiranBulk":
        result = editKehadiranBulk(args[0], args[1], args[2]);
        break;
      case "hapusKehadiran":
      case "hapusLogKehadiran":
      case "hapusAbsensi":
      case "hapusAbsen":
      case "deleteKehadiran":
        result = hapusKehadiran(args[0], args[1], args[2]);
        break;
      case "getLiveAbsenHariIni":
        result = getLiveAbsenHariIni(args[0], args[1], args[2]);
        break;

      // ----------------------------------------------------
      // 3. LAPORAN, REKAP & DASHBOARD
      // ----------------------------------------------------
      case "getLaporanPresensi":
      case "getLaporanFilter":
        result = getLaporanFilter(args[0], args[1], args[2], args[3], args[4], args[5]);
        break;
      case "hitungRekapPersentase":
        result = hitungRekapPersentase(args[0], args[1], args[2], args[3], args[4], args[5]);
        break;
      case "getDashboardMetrics":
        result = getDashboardMetrics();
        break;

      // ----------------------------------------------------
      // 4. SLOT JAM PELAJARAN (JamPelajaran)
      // ----------------------------------------------------
      case "getJamPelajaran":
        result = getJamPelajaran();
        break;
      case "simpanJamPelajaran":
      case "tambahJamPelajaran":
      case "editJamPelajaran":
        result = simpanJamPelajaran(args[0], args[1]);
        break;
      case "hapusJamPelajaran":
        result = hapusRowByColumn("JamPelajaran", ["id_jam"], args[0]);
        break;

      // ----------------------------------------------------
      // 5. JADWAL PELAJARAN (JadwalPelajaran)
      // ----------------------------------------------------
      case "getJadwalPelajaranSemua":
        result = getSheetDataObj("JadwalPelajaran");
        break;
      case "tambahJadwalPelajaran":
      case "editJadwalPelajaran":
      case "simpanJadwalPelajaran":
        result = simpanJadwalPelajaran(args[0], args[1]);
        break;
      case "hapusJadwalPelajaran":
        result = hapusRowByColumn("JadwalPelajaran", ["id_jadwal"], args[0]);
        break;

      // ----------------------------------------------------
      // 6. ABSENSI MENGAJAR GURU (AbsensiMengajar)
      // ----------------------------------------------------
      case "getAbsensiMengajarGuru":
        result = getSheetDataObj("AbsensiMengajar");
        break;
      case "simpanAbsensiMengajarGuru":
      case "tambahAbsensiMengajarGuru":
        result = simpanAbsensiMengajarGuru(args[0]);
        break;
      case "hapusAbsensiMengajarGuru":
        result = hapusRowByColumn("AbsensiMengajar", ["id_log_mengajar"], args[0]);
        break;

      // ----------------------------------------------------
      // 7. JADWAL FLEXIBLE GURU (JadwalGuru)
      // ----------------------------------------------------
      case "getJadwalGuruSemua":
        result = getSheetDataObj("JadwalGuru");
        break;
      case "tambahJadwalGuru":
      case "editJadwalGuru":
        result = simpanJadwalGuru(args[0], args[1]);
        break;
      case "hapusJadwalGuru":
        result = hapusRowByColumn("JadwalGuru", ["id_jadwal"], args[0]);
        break;

      // ----------------------------------------------------
      // 8. DATA KELAS & HARI LIBUR & PENGATURAN
      // ----------------------------------------------------
      case "getKelasSemua":
        result = getKelasSemua();
        break;
      case "tambahKelas":
        result = simpanKelas(args[0], args[1], args[2], args[3]);
        break;
      case "editKelas":
        result = editKelas(args[0], args[1], args[2], args[3], args[4]);
        break;
      case "simpanWaliKelas":
        result = simpanWaliKelas(args[0], args[1], args[2], args[3]);
        break;
      case "hapusKelas":
        result = hapusRowByColumn("Kelas", ["nama_kelas", "id_kelas"], args[0]);
        break;

      case "getHariLiburSemua":
        result = getSheetDataObj("HariLibur");
        break;
      case "tambahHariLibur":
      case "simpanHariLibur":
        result = simpanHariLibur(args[0], args[1]);
        break;
      case "hapusHariLibur":
        result = hapusRowByColumn("HariLibur", ["tanggal"], args[0]);
        break;

      case "getPengaturanSemua":
      case "getKonfigurasiJam":
        result = getPengaturan();
        break;
      case "simpanKonfigurasiJam":
      case "simpanPengaturan":
        result = simpanPengaturan(args[0], args[1], args[2]);
        break;
      case "simpanPengaturanCustom":
        result = simpanPengaturanCustom(args[0]);
        break;

      // ----------------------------------------------------
      // 9. AUTHENTICATION & USERS
      // ----------------------------------------------------
      case "verifikasiLogin":
        result = verifikasiLogin(args[0], args[1]);
        break;
      case "ubahPasswordUser":
        result = ubahPasswordUser(args[0], args[1], args[2]);
        break;
      case "getUsersSemua":
      case "getUsers":
        result = getSheetDataObj("Users");
        break;
      case "tambahUserData":
        result = simpanUser(args[0], null);
        break;
      case "editUserData":
        result = simpanUser(args[1], args[0]);
        break;
      case "hapusUserData":
        result = hapusRowByColumn("Users", ["username"], args[0]);
        break;

      default:
        result = { success: false, message: "Action '" + action + "' tidak dikenali di Kode.gs." };
    }

    return responseJSON(result);
  } catch (err) {
    return responseJSON({ success: false, message: "Exception Error: " + err.toString() });
  }
}

function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==============================================================================
// INISIALISASI & HELPER DATABASE SPREADSHEET
// ==============================================================================

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Mencari Sheet berdasarkan beberapa pilihan nama agar kompatibel dengan spreadsheet lama
 */
function findSheetByName(possibleNames) {
  const ss = getSpreadsheet();
  if (typeof possibleNames === "string") possibleNames = [possibleNames];
  for (let i = 0; i < possibleNames.length; i++) {
    const sheet = ss.getSheetByName(possibleNames[i]);
    if (sheet) return sheet;
  }
  return null;
}

/**
 * Mengambil atau membuat sheet baru dengan header standar jika belum ada
 */
function getOrCreateSheet(primaryName, headers, aliases) {
  let sheet = findSheetByName([primaryName].concat(aliases || []));
  if (!sheet) {
    sheet = getSpreadsheet().insertSheet(primaryName);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f4f6");
  } else {
    // Pastikan header ada di baris pertama jika sheet masih kosong
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f4f6");
    }
  }
  return sheet;
}

/**
 * Inisialisasi struktur sheet standar tanpa menghapus data lama
 */
function initSheets() {
  getOrCreateSheet("Siswa", ["id_siswa", "nisn", "nama_siswa", "jenis_kelamin", "kelas", "jurusan", "no_hp_ortu", "qr_content"], ["DataSiswa", "Data_Siswa"]);
  getOrCreateSheet("Guru", ["id_guru", "nip_nuptk", "nama_guru", "jenis_kelamin", "jabatan_tugas", "no_hp", "qr_content", "password"], ["DataGuru", "Data_Guru"]);
  getOrCreateSheet("PresensiSiswa", ["id_log_siswa", "tanggal", "id_siswa", "nama_siswa", "kelas_jurusan", "jam_masuk", "status_masuk", "jam_pulang", "status_pulang", "ket"], ["LaporanSiswa"]);
  getOrCreateSheet("PresensiGuru", ["id_log_guru", "tanggal", "id_guru", "nama_guru", "jam_masuk", "status_masuk", "jam_pulang", "status_pulang", "ket"], ["LaporanGuru"]);
  getOrCreateSheet("JamPelajaran", ["id_jam", "jam_ke", "nama_jam", "jam_mulai", "jam_selesai", "tipe"]);
  getOrCreateSheet("JadwalPelajaran", ["id_jadwal", "hari", "kelas", "jam_ke", "id_jam", "jam_mulai", "jam_selesai", "mapel", "id_guru", "nama_guru", "ruangan"]);
  getOrCreateSheet("AbsensiMengajar", ["id_log_mengajar", "tanggal", "waktu_absen", "hari", "id_guru", "nama_guru", "kelas", "mapel", "jam_ke", "jam_mulai_jadwal", "jam_selesai_jadwal", "status", "catatan_materi"]);
  getOrCreateSheet("JadwalGuru", ["id_jadwal", "id_guru", "nama_guru", "hari", "jam_masuk_mulai", "jam_masuk_batas", "jam_pulang_mulai"]);
  getOrCreateSheet("Kelas", ["id_kelas", "nama_kelas", "id_guru", "wali_kelas"], ["DATA_KELAS", "DataKelas"]);
  getOrCreateSheet("HariLibur", ["tanggal", "keterangan"]);
  getOrCreateSheet("Pengaturan", ["key", "value"]);
  getOrCreateSheet("Users", ["username", "password", "role", "target_id"]);
}

/**
 * Membaca sheet sebagai Array of Objects dengan toleransi variasi nama kolom
 */
function formatJamHM(val) {
  if (!val || val === "-") return "-";
  if (val instanceof Date) {
    try {
      return Utilities.formatDate(val, Session.getScriptTimeZone() || "GMT+7", "HH:mm");
    } catch (e) {}
  }
  const str = String(val).trim();
  if (!str) return "-";
  if (str.indexOf("T") !== -1 || str.indexOf("1899") !== -1 || str.indexOf("1900") !== -1) {
    try {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        return Utilities.formatDate(d, Session.getScriptTimeZone() || "GMT+7", "HH:mm");
      }
    } catch (e) {}
  }
  if (/^\d{1,2}:\d{2}/.test(str)) {
    return str.substring(0, 5);
  }
  return str;
}

function formatTanggalYMD(val) {
  if (!val || val === "-") return "";
  const tz = Session.getScriptTimeZone() || "GMT+7";
  const todayStr = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");

  if (val instanceof Date) {
    try {
      if (val.getFullYear() <= 1900) {
        return todayStr;
      }
      return Utilities.formatDate(val, tz, "yyyy-MM-dd");
    } catch (e) {
      return todayStr;
    }
  }

  const str = String(val).trim();
  if (!str) return "";

  if (str.indexOf("1899") !== -1 || str.indexOf("1900") !== -1) {
    return todayStr;
  }

  if (str.indexOf("T") !== -1) {
    const parts = str.split("T");
    if (parts[0].indexOf("1899") !== -1 || parts[0].indexOf("1900") !== -1) {
      return todayStr;
    }
    return parts[0];
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    if (str.startsWith("1899") || str.startsWith("1900")) {
      return todayStr;
    }
    return str.substring(0, 10);
  }

  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      if (d.getFullYear() <= 1900) {
        return todayStr;
      }
      return Utilities.formatDate(d, tz, "yyyy-MM-dd");
    }
  } catch (e) {}

  return str;
}

function getSheetDataObj(sheetPrimaryName, aliases) {
  const sheet = findSheetByName([sheetPrimaryName].concat(aliases || []));
  if (!sheet) return { success: true, data: [] };
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };

  const rawHeaders = data[0].map(h => String(h).trim());
  const rows = [];

  for (let i = 1; i < data.length; i++) {
    let row = {};
    let empty = true;
    for (let j = 0; j < rawHeaders.length; j++) {
      let val = data[i][j];
      if (val !== "" && val !== null && val !== undefined) empty = false;
      const key = rawHeaders[j];
      if (key) {
        const keyLower = key.toLowerCase();
        if (keyLower === "tanggal" || keyLower.indexOf("tanggal") !== -1) {
          row[key] = formatTanggalYMD(val);
        } else if (keyLower.indexOf("jam") !== -1 || keyLower.indexOf("waktu") !== -1) {
          row[key] = formatJamHM(val);
        } else if (val instanceof Date) {
          if (val.getFullYear() <= 1900) {
            row[key] = formatJamHM(val);
          } else {
            row[key] = Utilities.formatDate(val, Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd HH:mm:ss");
          }
        } else if (typeof val === "string" && (val.indexOf("1899") !== -1 || val.indexOf("1900") !== -1)) {
          if (keyLower.indexOf("jam") !== -1 || keyLower.indexOf("waktu") !== -1) {
            row[key] = formatJamHM(val);
          } else {
            row[key] = formatTanggalYMD(val);
          }
        } else {
          row[key] = val;
        }
      }
    }
    if (!empty) rows.push(row);
  }
  return { success: true, data: rows };
}

// ==============================================================================
// HANDLER DATA MASTER (Siswa, Guru, Users)
// ==============================================================================

function getDataMaster(kategori) {
  const isSiswa = kategori === "Siswa";
  const primarySheet = isSiswa ? "Siswa" : "Guru";
  const aliases = isSiswa ? ["DataSiswa", "Data_Siswa"] : ["DataGuru", "Data_Guru"];
  const res = getSheetDataObj(primarySheet, aliases);

  if (!res.data) return { success: true, data: [] };

  const idKey = isSiswa ? "id_siswa" : "id_guru";
  const nameKey = isSiswa ? "nama_siswa" : "nama_guru";
  const idNumKey = isSiswa ? "nisn" : "nip_nuptk";

  // Normalisasi kolom agar konsisten dengan frontend
  const normalized = res.data.map((item, idx) => {
    const idVal = item[idKey] || item.id || (isSiswa ? "S-" + (1000 + idx) : "G-" + (1000 + idx));
    const nameVal = item[nameKey] || item.nama || item.nama_lengkap || "-";
    const idNumVal = item[idNumKey] || item.nis || item.nip || item.nuptk || "-";
    const qrVal = item.qr_content || (idVal + "_" + idNumVal + "_" + String(nameVal).replace(/\s+/g, '-'));

    if (isSiswa) {
      return {
        id_siswa: String(idVal),
        nisn: String(idNumVal),
        nama_siswa: String(nameVal),
        jenis_kelamin: String(item.jenis_kelamin || item.jk || "L"),
        kelas: String(item.kelas || "-"),
        jurusan: String(item.jurusan || "-"),
        no_hp_ortu: String(item.no_hp_ortu || item.hp_ortu || item.no_hp || "-"),
        qr_content: String(qrVal)
      };
    } else {
      return {
        id_guru: String(idVal),
        nip_nuptk: String(idNumVal),
        nama_guru: String(nameVal),
        jenis_kelamin: String(item.jenis_kelamin || item.jk || "L"),
        jabatan_tugas: String(item.jabatan_tugas || item.jabatan || item.mapel || "Guru"),
        no_hp: String(item.no_hp || item.hp || "-"),
        qr_content: String(qrVal),
        password: String(item.password || "guru123")
      };
    }
  });

  return { success: true, data: normalized };
}

function tambahDataMaster(kategori, dataObj) {
  if (!dataObj) return { success: false, message: "Data tidak valid." };
  const isSiswa = kategori === "Siswa";
  const sheet = getOrCreateSheet(isSiswa ? "Siswa" : "Guru", isSiswa ?
    ["id_siswa", "nisn", "nama_siswa", "jenis_kelamin", "kelas", "jurusan", "no_hp_ortu", "qr_content"] :
    ["id_guru", "nip_nuptk", "nama_guru", "jenis_kelamin", "jabatan_tugas", "no_hp", "qr_content", "password"]
  );

  const prefix = isSiswa ? "S-" : "G-";
  const newId = prefix + Date.now();
  const qrContent = "QR-" + newId;

  if (isSiswa) {
    sheet.appendRow([
      newId,
      dataObj.nisn || "-",
      dataObj.nama_siswa || "-",
      dataObj.jenis_kelamin || "L",
      dataObj.kelas || "-",
      dataObj.jurusan || "-",
      dataObj.no_hp_ortu || "-",
      qrContent
    ]);
  } else {
    sheet.appendRow([
      newId,
      dataObj.nip_nuptk || "-",
      dataObj.nama_guru || "-",
      dataObj.jenis_kelamin || "L",
      dataObj.jabatan_tugas || "-",
      dataObj.no_hp || "-",
      qrContent,
      dataObj.password || "guru123"
    ]);
  }

  return { success: true, message: "Berhasil menambahkan " + kategori + " baru!" };
}

function editDataMaster(kategori, idTarget, dataObj) {
  const isSiswa = kategori === "Siswa";
  const primarySheet = isSiswa ? "Siswa" : "Guru";
  const aliases = isSiswa ? ["DataSiswa"] : ["DataGuru"];
  const sheet = findSheetByName([primarySheet].concat(aliases));
  if (!sheet) return { success: false, message: "Sheet tidak ditemukan." };

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: false, message: "Data kosong." };

  const headers = data[0].map(h => String(h).trim());
  const idColIdx = findHeaderIndex(headers, isSiswa ? ["id_siswa", "id"] : ["id_guru", "id"]);

  if (idColIdx === -1) return { success: false, message: "Kolom ID tidak ditemukan." };

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idColIdx]) === String(idTarget)) {
      if (isSiswa) {
        setRowValueByHeader(sheet, i + 1, headers, "nisn", dataObj.nisn);
        setRowValueByHeader(sheet, i + 1, headers, "nama_siswa", dataObj.nama_siswa);
        setRowValueByHeader(sheet, i + 1, headers, "jenis_kelamin", dataObj.jenis_kelamin);
        setRowValueByHeader(sheet, i + 1, headers, "kelas", dataObj.kelas);
        setRowValueByHeader(sheet, i + 1, headers, "jurusan", dataObj.jurusan);
        setRowValueByHeader(sheet, i + 1, headers, "no_hp_ortu", dataObj.no_hp_ortu);
      } else {
        setRowValueByHeader(sheet, i + 1, headers, "nip_nuptk", dataObj.nip_nuptk);
        setRowValueByHeader(sheet, i + 1, headers, "nama_guru", dataObj.nama_guru);
        setRowValueByHeader(sheet, i + 1, headers, "jenis_kelamin", dataObj.jenis_kelamin);
        setRowValueByHeader(sheet, i + 1, headers, "jabatan_tugas", dataObj.jabatan_tugas);
        setRowValueByHeader(sheet, i + 1, headers, "no_hp", dataObj.no_hp);
        if (dataObj.password) setRowValueByHeader(sheet, i + 1, headers, "password", dataObj.password);
      }
      return { success: true, message: "Data " + kategori + " berhasil diperbarui!" };
    }
  }

  return { success: false, message: "ID target tidak ditemukan." };
}

function hapusDataMaster(kategori, idTarget) {
  const isSiswa = kategori === "Siswa";
  return hapusRowByColumn(isSiswa ? "Siswa" : "Guru", isSiswa ? ["id_siswa", "id"] : ["id_guru", "id"], idTarget);
}

function importDataMassal(kategori, arrayData) {
  if (!arrayData || !arrayData.length) return { success: false, message: "Tidak ada data impor." };
  let successCount = 0;
  arrayData.forEach(item => {
    tambahDataMaster(kategori, item);
    successCount++;
  });
  return { success: true, message: "Berhasil mengimpor " + successCount + " data " + kategori + "!" };
}

// ==============================================================================
// HANDLER ABSENSI REAL-TIME & MANUAL
// ==============================================================================

function prosesScanQR(qrContent, kategori, mode, tanggal) {
  const masterRes = getDataMaster(kategori);
  if (!masterRes.data || !masterRes.data.length) return { success: false, message: "Data master kosong." };

  const user = masterRes.data.find(x => x.qr_content === qrContent || x.id_siswa === qrContent || x.id_guru === qrContent);
  if (!user) return { success: false, message: "QR Code tidak valid atau pengguna belum terdaftar!" };

  const tgl = tanggal || new Date().toISOString().split("T")[0];
  const jamNow = new Date().toTimeString().slice(0, 5);
  const isSiswa = kategori === "Siswa";
  const idTarget = isSiswa ? user.id_siswa : user.id_guru;
  const namaTarget = isSiswa ? user.nama_siswa : user.nama_guru;
  const classKey = isSiswa ? (user.kelas + " " + user.jurusan).trim() : "-";

  const cfg = getPengaturan().data || { jam_masuk_mulai: "06:00", jam_masuk_batas: "07:15", jam_pulang_mulai: "15:30" };
  const sheetName = isSiswa ? "PresensiSiswa" : "PresensiGuru";
  const sheet = getOrCreateSheet(sheetName, isSiswa ?
    ["id_log_siswa", "tanggal", "id_siswa", "nama_siswa", "kelas_jurusan", "jam_masuk", "status_masuk", "jam_pulang", "status_pulang", "ket"] :
    ["id_log_guru", "tanggal", "id_guru", "nama_guru", "jam_masuk", "status_masuk", "jam_pulang", "status_pulang", "ket"]
  );

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  const idColIdx = findHeaderIndex(headers, [isSiswa ? "id_siswa" : "id_guru", "id_target"]);
  const tglColIdx = findHeaderIndex(headers, ["tanggal"]);

  let foundRowIdx = -1;
  let existingRowData = null;

  if (idColIdx !== -1 && tglColIdx !== -1) {
    for (let i = 1; i < data.length; i++) {
      const rowTgl = formatTanggalYMD(data[i][tglColIdx]);
      if (rowTgl === tgl && String(data[i][idColIdx]) === String(idTarget)) {
        foundRowIdx = i + 1;
        existingRowData = data[i];
        break;
      }
    }
  }

  if (mode === "Masuk") {
    if (foundRowIdx > 0 && existingRowData) {
      const jamMskIdx = findHeaderIndex(headers, ["jam_masuk"]);
      if (jamMskIdx !== -1 && existingRowData[jamMskIdx] !== "-" && existingRowData[jamMskIdx] !== "") {
        return { success: false, message: namaTarget + " sudah melakukan scan masuk hari ini!" };
      }
    }

    if (jamNow < (cfg.jam_masuk_mulai || "06:00")) {
      return { success: false, message: "Absen masuk belum dibuka (Mulai jam " + cfg.jam_masuk_mulai + ")" };
    }

    const statusMasuk = (jamNow <= (cfg.jam_masuk_batas || "07:15")) ? "Tepat Waktu" : "Terlambat";
    const logId = (isSiswa ? "LOG-S-" : "LOG-G-") + Date.now();

    if (foundRowIdx > 0) {
      setRowValueByHeader(sheet, foundRowIdx, headers, "jam_masuk", jamNow);
      setRowValueByHeader(sheet, foundRowIdx, headers, "status_masuk", statusMasuk);
    } else {
      if (isSiswa) {
        sheet.appendRow([logId, tgl, idTarget, namaTarget, classKey, jamNow, statusMasuk, "-", "-", "-"]);
      } else {
        sheet.appendRow([logId, tgl, idTarget, namaTarget, jamNow, statusMasuk, "-", "-", "-"]);
      }
    }

    return { success: true, message: "Absen Masuk Berhasil!\nNama: " + namaTarget + "\nStatus: " + statusMasuk + "\nJam: " + jamNow };
  } else {
    // Mode Pulang
    if (jamNow < (cfg.jam_pulang_mulai || "15:30")) {
      return { success: false, message: "Absen pulang belum dibuka (Mulai jam " + cfg.jam_pulang_mulai + ")" };
    }

    if (foundRowIdx > 0) {
      const jamPlgIdx = findHeaderIndex(headers, ["jam_pulang"]);
      if (jamPlgIdx !== -1 && existingRowData[jamPlgIdx] !== "-" && existingRowData[jamPlgIdx] !== "") {
        return { success: false, message: namaTarget + " sudah melakukan scan pulang hari ini!" };
      }
      setRowValueByHeader(sheet, foundRowIdx, headers, "jam_pulang", jamNow);
      setRowValueByHeader(sheet, foundRowIdx, headers, "status_pulang", "Tepat Waktu");
      return { success: true, message: "Absen Pulang Berhasil!\nNama: " + namaTarget + "\nJam: " + jamNow };
    } else {
      const logId = (isSiswa ? "LOG-S-" : "LOG-G-") + Date.now();
      if (isSiswa) {
        sheet.appendRow([logId, tgl, idTarget, namaTarget, classKey, "-", "Lupa Scan Masuk", jamNow, "Tepat Waktu", "-"]);
      } else {
        sheet.appendRow([logId, tgl, idTarget, namaTarget, "-", "Lupa Scan Masuk", jamNow, "Tepat Waktu", "-"]);
      }
      return { success: true, message: "Absen Pulang Berhasil!\nCatatan: Lupa scan masuk.\nNama: " + namaTarget };
    }
  }
}

function simpanAbsenManual(idTarget, kategori, mode, tanggal, status, keterangan, jamCustom) {
  const isSiswa = kategori === "Siswa";
  const tgl = tanggal || new Date().toISOString().split("T")[0];
  const isAbsentStatus = status === "Sakit" || status === "Izin" || status === "Alfa" || status === "Alpha";
  const jamDefault = mode === "Masuk" ? "07:00" : "15:30";
  const jam = isAbsentStatus ? "-" : (jamCustom && jamCustom !== "-" ? jamCustom : jamDefault);

  const sheetName = isSiswa ? "PresensiSiswa" : "PresensiGuru";
  const sheet = getOrCreateSheet(sheetName, isSiswa ?
    ["id_log_siswa", "tanggal", "id_siswa", "nama_siswa", "kelas_jurusan", "jam_masuk", "status_masuk", "jam_pulang", "status_pulang", "ket"] :
    ["id_log_guru", "tanggal", "id_guru", "nama_guru", "jam_masuk", "status_masuk", "jam_pulang", "status_pulang", "ket"]
  );

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  const idColIdx = findHeaderIndex(headers, [isSiswa ? "id_siswa" : "id_guru", "id_target"]);
  const tglColIdx = findHeaderIndex(headers, ["tanggal"]);

  let foundRowIdx = -1;
  if (idColIdx !== -1 && tglColIdx !== -1) {
    for (let i = 1; i < data.length; i++) {
      const rowTgl = formatTanggalYMD(data[i][tglColIdx]);
      if (rowTgl === tgl && String(data[i][idColIdx]) === String(idTarget)) {
        foundRowIdx = i + 1;
        break;
      }
    }
  }

  if (foundRowIdx > 0) {
    if (isAbsentStatus) {
      setRowValueByHeader(sheet, foundRowIdx, headers, "status_masuk", status);
      setRowValueByHeader(sheet, foundRowIdx, headers, "status_pulang", status);
      setRowValueByHeader(sheet, foundRowIdx, headers, "jam_masuk", "-");
      setRowValueByHeader(sheet, foundRowIdx, headers, "jam_pulang", "-");
    } else {
      if (mode === "Masuk") {
        setRowValueByHeader(sheet, foundRowIdx, headers, "jam_masuk", jam);
        setRowValueByHeader(sheet, foundRowIdx, headers, "status_masuk", status);
      } else {
        setRowValueByHeader(sheet, foundRowIdx, headers, "jam_pulang", jam);
        setRowValueByHeader(sheet, foundRowIdx, headers, "status_pulang", status);
      }
    }
    setRowValueByHeader(sheet, foundRowIdx, headers, "ket", keterangan || "-");
  } else {
    const masterRes = getDataMaster(kategori);
    const user = (masterRes.data || []).find(x => x.id_siswa === idTarget || x.id_guru === idTarget);
    const namaTarget = user ? (isSiswa ? user.nama_siswa : user.nama_guru) : "Siswa/Guru";
    const classKey = user && isSiswa ? (user.kelas + " " + user.jurusan).trim() : "-";
    const logId = "LOG-" + Date.now();

    const statusMasuk = isAbsentStatus ? status : (mode === "Masuk" ? status : "-");
    const statusPulang = isAbsentStatus ? status : (mode === "Pulang" ? status : "-");
    const jamMasuk = isAbsentStatus ? "-" : (mode === "Masuk" ? jam : "-");
    const jamPulang = isAbsentStatus ? "-" : (mode === "Pulang" ? jam : "-");

    if (isSiswa) {
      sheet.appendRow([logId, tgl, idTarget, namaTarget, classKey, jamMasuk, statusMasuk, jamPulang, statusPulang, keterangan || "-"]);
    } else {
      sheet.appendRow([logId, tgl, idTarget, namaTarget, jamMasuk, statusMasuk, jamPulang, statusPulang, keterangan || "-"]);
    }
  }

  return { success: true, message: "Koreksi presensi manual berhasil disimpan!" };
}

function simpanBulkAbsenManual(ids, kategori, mode, tanggal, status, keterangan) {
  if (!ids || !ids.length) return { success: false, message: "Pilih minimal 1 data." };
  let count = 0;
  ids.forEach(idTarget => {
    simpanAbsenManual(idTarget, kategori, mode, tanggal, status, keterangan, "-");
    count++;
  });
  return { success: true, message: "Berhasil memperbarui " + count + " data presensi!" };
}

function editKehadiran(idTarget, kategori, tanggal, arg3, arg4, arg5, arg6, arg7) {
  const dataObj = typeof arg3 === "object" && arg3 !== null ? arg3 : {
    jam_masuk: arg3 || "-",
    status_masuk: arg4 || "-",
    jam_pulang: arg5 || "-",
    status_pulang: arg6 || "-",
    ket: arg7 || "-"
  };

  const isSiswa = kategori === "Siswa";
  const tgl = tanggal || new Date().toISOString().split("T")[0];
  const sheetName = isSiswa ? "PresensiSiswa" : "PresensiGuru";
  const sheet = getOrCreateSheet(sheetName, isSiswa ?
    ["id_log_siswa", "tanggal", "id_siswa", "nama_siswa", "kelas_jurusan", "jam_masuk", "status_masuk", "jam_pulang", "status_pulang", "ket"] :
    ["id_log_guru", "tanggal", "id_guru", "nama_guru", "jam_masuk", "status_masuk", "jam_pulang", "status_pulang", "ket"]
  );

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  const idColIdx = findHeaderIndex(headers, [isSiswa ? "id_siswa" : "id_guru", "id_target"]);
  const tglColIdx = findHeaderIndex(headers, ["tanggal"]);

  let foundRowIdx = -1;
  if (idColIdx !== -1 && tglColIdx !== -1) {
    for (let i = 1; i < data.length; i++) {
      const rowTgl = formatTanggalYMD(data[i][tglColIdx]);
      if (rowTgl === tgl && String(data[i][idColIdx]) === String(idTarget)) {
        foundRowIdx = i + 1;
        break;
      }
    }
  }

  const isAllEmpty = (!dataObj.jam_masuk || dataObj.jam_masuk === "-") &&
                     (!dataObj.status_masuk || dataObj.status_masuk === "-") &&
                     (!dataObj.jam_pulang || dataObj.jam_pulang === "-") &&
                     (!dataObj.status_pulang || dataObj.status_pulang === "-") &&
                     (!dataObj.ket || dataObj.ket === "-");

  if (foundRowIdx > 0) {
    if (isAllEmpty) {
      sheet.deleteRow(foundRowIdx);
    } else {
      if (dataObj.jam_masuk !== undefined) setRowValueByHeader(sheet, foundRowIdx, headers, "jam_masuk", dataObj.jam_masuk);
      if (dataObj.status_masuk !== undefined) setRowValueByHeader(sheet, foundRowIdx, headers, "status_masuk", dataObj.status_masuk);
      if (dataObj.jam_pulang !== undefined) setRowValueByHeader(sheet, foundRowIdx, headers, "jam_pulang", dataObj.jam_pulang);
      if (dataObj.status_pulang !== undefined) setRowValueByHeader(sheet, foundRowIdx, headers, "status_pulang", dataObj.status_pulang);
      if (dataObj.ket !== undefined) setRowValueByHeader(sheet, foundRowIdx, headers, "ket", dataObj.ket);
    }
  } else if (!isAllEmpty) {
    const masterRes = getDataMaster(kategori);
    const user = (masterRes.data || []).find(x => x.id_siswa === idTarget || x.id_guru === idTarget);
    const namaTarget = user ? (isSiswa ? user.nama_siswa : user.nama_guru) : "Target";
    const classKey = user && isSiswa ? (user.kelas + " " + user.jurusan).trim() : "-";
    const logId = "LOG-" + Date.now();

    if (isSiswa) {
      sheet.appendRow([logId, tgl, idTarget, namaTarget, classKey, dataObj.jam_masuk || "-", dataObj.status_masuk || "-", dataObj.jam_pulang || "-", dataObj.status_pulang || "-", dataObj.ket || "-"]);
    } else {
      sheet.appendRow([logId, tgl, idTarget, namaTarget, dataObj.jam_masuk || "-", dataObj.status_masuk || "-", dataObj.jam_pulang || "-", dataObj.status_pulang || "-", dataObj.ket || "-"]);
    }
  }

  return { success: true, message: "Koreksi kehadiran " + kategori + " berhasil diperbarui!" };
}

function editKehadiranBulk(rows, kategori, tanggal) {
  if (!rows || !rows.length) return { success: false, message: "Data tidak boleh kosong." };
  let count = 0;
  rows.forEach(item => {
    if (item.id_target) {
      editKehadiran(item.id_target, kategori, tanggal, item.jam_masuk, item.status_masuk, item.jam_pulang, item.status_pulang, item.ket);
      count++;
    }
  });
  return { success: true, message: "Berhasil memperbarui " + count + " baris kehadiran!" };
}

function hapusKehadiran(idTarget, kategori, tanggal) {
  const isSiswa = kategori === "Siswa";
  const sheetName = isSiswa ? "PresensiSiswa" : "PresensiGuru";
  const sheet = findSheetByName([sheetName, "Presensi"]);
  if (!sheet) return { success: true };

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true };

  const headers = data[0].map(h => String(h).trim());
  const idColIdx = findHeaderIndex(headers, [isSiswa ? "id_siswa" : "id_guru", "id_target"]);
  const tglColIdx = findHeaderIndex(headers, ["tanggal"]);

  if (idColIdx === -1 || tglColIdx === -1) return { success: true };

  for (let i = data.length - 1; i >= 1; i--) {
    const rowTgl = formatTanggalYMD(data[i][tglColIdx]);
    if (rowTgl === tanggal && String(data[i][idColIdx]) === String(idTarget)) {
      sheet.deleteRow(i + 1);
    }
  }

  return { success: true, message: "Presensi berhasil dihapus!" };
}

function getLiveAbsenHariIni(kategori, tanggal, filterKelas) {
  const tgl = tanggal || new Date().toISOString().split("T")[0];
  const isSiswa = kategori === "Siswa";
  const masterRes = getDataMaster(kategori);
  const masterData = masterRes.data || [];

  const sheetName = isSiswa ? "PresensiSiswa" : "PresensiGuru";
  const aliases = isSiswa ? ["DataPresensiSiswa", "Presensi_Siswa", "LaporanSiswa", "Laporan_Siswa", "Presensi"] : ["DataPresensiGuru", "Presensi_Guru", "LaporanGuru", "Laporan_Guru", "Presensi"];
  const rptRes = getSheetDataObj(sheetName, aliases);
  const rptData = rptRes.data || [];

  const idKey = isSiswa ? "id_siswa" : "id_guru";
  const nameKey = isSiswa ? "nama_siswa" : "nama_guru";

  const result = masterData.map(m => {
    const idVal = m[idKey];
    const rep = rptData.find(r => {
      const rTgl = formatTanggalYMD(r.tanggal);
      const rId = String(r[idKey] || r.id_target || r.id_siswa || r.id_guru || "").trim();
      const rNama = String(r.nama_siswa || r.nama_guru || r.nama || "").trim();
      const matchId = idVal && rId && rId === String(idVal).trim();
      const matchNama = m[nameKey] && rNama && rNama.toLowerCase() === String(m[nameKey]).trim().toLowerCase();
      return rTgl === tgl && (matchId || matchNama);
    }) || {};

    const classKey = isSiswa ? (m.kelas + " " + m.jurusan).trim() : "-";

    return {
      id_target: idVal,
      nama_target: m[nameKey] || "-",
      kelas_jurusan: classKey,
      tanggal: tgl,
      jam_masuk: rep.jam_masuk || "-",
      status_masuk: rep.status_masuk || "-",
      jam_pulang: rep.jam_pulang || "-",
      status_pulang: rep.status_pulang || "-",
      ket: rep.ket || "-"
    };
  });

  const filtered = result.filter(item => {
    if (isSiswa && filterKelas && filterKelas !== "Semua") {
      const cleanKelas = String(filterKelas).replace(/[\s-]+/g, " ").toLowerCase();
      const cleanItem = String(item.kelas_jurusan || "").replace(/[\s-]+/g, " ").toLowerCase();
      return cleanItem.indexOf(cleanKelas) !== -1 || cleanKelas.indexOf(cleanItem) !== -1;
    }
    return true;
  });

  return { success: true, data: filtered };
}

// ==============================================================================
// HANDLER LAPORAN, REKAP & DASHBOARD METRICS
// ==============================================================================

function getLaporanFilter(kategori, kelas, jenisFilter, tanggalMulai, tanggalSelesai, bulanMinta) {
  const isSiswa = kategori === "Siswa";
  const sheetName = isSiswa ? "PresensiSiswa" : "PresensiGuru";
  const aliases = isSiswa ? ["DataPresensiSiswa", "Presensi_Siswa", "LaporanSiswa", "Laporan_Siswa", "Presensi"] : ["DataPresensiGuru", "Presensi_Guru", "LaporanGuru", "Laporan_Guru", "Presensi"];
  const res = getSheetDataObj(sheetName, aliases);
  const data = res.data || [];

  const filtered = data.filter(row => {
    const rowTgl = formatTanggalYMD(row.tanggal);
    if (!rowTgl) return false;

    if (jenisFilter === "rentang" && tanggalMulai && tanggalSelesai) {
      if (rowTgl < tanggalMulai || rowTgl > tanggalSelesai) return false;
    } else if (jenisFilter === "bulan" && bulanMinta) {
      if (rowTgl.indexOf(bulanMinta) !== 0) return false;
    }

    if (isSiswa && kelas && kelas !== "Semua") {
      const kJur = String(row.kelas_jurusan || row.kelas || "").replace(/[\s-]+/g, " ").toLowerCase();
      const cleanKelas = String(kelas).replace(/[\s-]+/g, " ").toLowerCase();
      if (kJur.indexOf(cleanKelas) === -1 && cleanKelas.indexOf(kJur) === -1) return false;
    }

    return true;
  });

  return { success: true, data: filtered };
}

function hitungRekapPersentase(kategori, kelas, jenisFilter, tanggalMulai, tanggalSelesai, bulanMinta) {
  const isSiswa = kategori === "Siswa";
  const masterRes = getDataMaster(kategori);
  let masterData = masterRes.data || [];

  if (isSiswa && kelas && kelas !== "Semua") {
    const cleanKelas = String(kelas).replace(/[\s-]+/g, " ").toLowerCase();
    masterData = masterData.filter(m => {
      const kJur = (String(m.kelas || "") + " " + String(m.jurusan || "")).replace(/[\s-]+/g, " ").toLowerCase();
      return kJur.indexOf(cleanKelas) !== -1 || cleanKelas.indexOf(kJur) !== -1;
    });
  }

  const rptRes = getLaporanFilter(kategori, kelas, jenisFilter, tanggalMulai, tanggalSelesai, bulanMinta);
  const rptData = rptRes.data || [];
  const idKey = isSiswa ? "id_siswa" : "id_guru";
  const nameKey = isSiswa ? "nama_siswa" : "nama_guru";

  const rekap = masterData.map(m => {
    const idVal = String(m[idKey] || "").trim();
    const namaVal = String(m[nameKey] || "").trim();

    const userRpts = rptData.filter(r => {
      const rId = String(r[idKey] || r.id_target || r.id_siswa || r.id_guru || "").trim();
      const rNama = String(r.nama_siswa || r.nama_guru || r.nama || "").trim();
      if (idVal && rId && rId === idVal) return true;
      if (namaVal && rNama && rNama.toLowerCase() === namaVal.toLowerCase()) return true;
      return false;
    });

    let hadir = 0, sakit = 0, izin = 0, alfa = 0;
    const jamMasuks = [];
    const jamPulangs = [];

    userRpts.forEach(r => {
      const sm = String(r.status_masuk || "").toLowerCase();
      if (sm.indexOf("tepat") !== -1 || sm.indexOf("terlambat") !== -1 || sm.indexOf("lupa") !== -1 || sm.indexOf("hadir") !== -1) {
        hadir++;
      } else if (sm.indexOf("sakit") !== -1) {
        sakit++;
      } else if (sm.indexOf("izin") !== -1) {
        izin++;
      } else if (sm.indexOf("alfa") !== -1 || sm.indexOf("alpha") !== -1) {
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
      id: idVal,
      nama: namaVal,
      hadir: hadir,
      sakit: sakit,
      izin: izin,
      alfa: alfa,
      persentase: persentase,
      jam_masuk: jamMasuks.length > 0 ? jamMasuks.join(", ") : "-",
      jam_pulang: jamPulangs.length > 0 ? jamPulangs.join(", ") : "-"
    };
  });

  return { success: true, data: rekap };
}

function getDashboardMetrics() {
  const siswaData = (getDataMaster("Siswa").data) || [];
  const guruData = (getDataMaster("Guru").data) || [];
  const tgl = new Date().toISOString().split("T")[0];

  const aliasesSiswa = ["DataPresensiSiswa", "Presensi_Siswa", "LaporanSiswa", "Laporan_Siswa", "Presensi"];
  const aliasesGuru = ["DataPresensiGuru", "Presensi_Guru", "LaporanGuru", "Laporan_Guru", "Presensi"];
  const rptSiswa = (getSheetDataObj("PresensiSiswa", aliasesSiswa).data) || [];
  const rptGuru = (getSheetDataObj("PresensiGuru", aliasesGuru).data) || [];

  function calcStats(masterList, rptList, idKey) {
    let hadirMasuk = 0;
    let hadirPulang = 0;
    let totalTepat = 0;
    let rawAlfa = 0;

    const todayRpts = rptList.filter(r => formatTanggalYMD(r.tanggal) === tgl);

    todayRpts.forEach(r => {
      const sm = String(r.status_masuk || "").toLowerCase();
      const sp = String(r.status_pulang || "").toLowerCase();

      if (sm.indexOf("tepat") !== -1 || sm.indexOf("terlambat") !== -1 || sm.indexOf("lupa") !== -1 || sm.indexOf("hadir") !== -1) {
        hadirMasuk++;
        if (sm.indexOf("tepat") !== -1) totalTepat++;
      } else if (sm.indexOf("alfa") !== -1 || sm.indexOf("alpha") !== -1) {
        rawAlfa++;
      }

      if (sp.indexOf("tepat") !== -1 || sp.indexOf("terlambat") !== -1 || sp.indexOf("lupa") !== -1 || sp.indexOf("hadir") !== -1) {
        hadirPulang++;
      }
    });

    const persentaseTepatInt = hadirMasuk > 0 ? Math.round((totalTepat / hadirMasuk) * 100) : 0;
    const pAlfa = masterList.length > 0 ? Math.round((rawAlfa / masterList.length) * 100) : 0;
    const pPulang = masterList.length > 0 ? Math.round((hadirPulang / masterList.length) * 100) : 0;

    return { hadirMasuk, hadirPulang, persentaseTepat: persentaseTepatInt + "%", persentaseTepatInt, pAlfa, pPulang };
  }

  const sStat = calcStats(siswaData, rptSiswa, "id_siswa");
  const gStat = calcStats(guruData, rptGuru, "id_guru");

  const chartLabels = [];
  const chartData = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agus", "Sep", "Okt", "Nov", "Des"];
    const dayLabel = d.getDate() + " " + monthNames[d.getMonth()];
    chartLabels.push(dayLabel);

    const count = rptSiswa.filter(r => {
      const rTgl = String(r.tanggal || "").split("T")[0];
      const sm = String(r.status_masuk || "").toLowerCase();
      return rTgl === dateStr && (sm.indexOf("tepat") !== -1 || sm.indexOf("terlambat") !== -1 || sm.indexOf("lupa") !== -1 || sm.indexOf("hadir") !== -1);
    }).length;
    chartData.push(count);
  }

  return {
    success: true,
    data: {
      totalSiswa: siswaData.length,
      siswaMasuk: sStat.hadirMasuk,
      siswaPulang: sStat.hadirPulang,
      siswaTepat: sStat.persentaseTepat,
      siswaTepatInt: sStat.persentaseTepatInt,
      siswaPulangPersenInt: sStat.pPulang,
      siswaAlfaInt: sStat.pAlfa,

      totalGuru: guruData.length,
      guruMasuk: gStat.hadirMasuk,
      guruPulang: gStat.hadirPulang,
      guruTepat: gStat.persentaseTepat,
      guruTepatInt: gStat.persentaseTepatInt,
      guruPulangPersenInt: gStat.pPulang,
      guruAlfaInt: gStat.pAlfa,

      chartLabels: chartLabels,
      chartData: chartData
    }
  };
}

// ==============================================================================
// HANDLER JADWAL PELAJARAN, JAM & ABSENSI MENGAJAR GURU
// ==============================================================================

function getJamPelajaran() {
  const res = getSheetDataObj("JamPelajaran");
  const data = res.data || [];
  data.sort((a, b) => String(a.jam_mulai || "").localeCompare(String(b.jam_mulai || "")));
  return { success: true, data: data };
}

function simpanJamPelajaran(param1, param2) {
  const payload = (typeof param1 === 'object' && param1 !== null) ? param1 : param2;
  if (!payload) return { success: false, message: "Payload jam pelajaran tidak valid." };

  const sheet = getOrCreateSheet("JamPelajaran", ["id_jam", "jam_ke", "nama_jam", "jam_mulai", "jam_selesai", "tipe"]);
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  const idJam = payload.id_jam || ("JP-" + Date.now());

  const idColIdx = findHeaderIndex(headers, ["id_jam"]);
  let foundRowIdx = -1;

  if (idColIdx !== -1) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idColIdx]) === String(idJam)) {
        foundRowIdx = i + 1;
        break;
      }
    }
  }

  const newRow = [
    idJam,
    payload.jam_ke || 1,
    payload.nama_jam || ("Jam ke-" + (payload.jam_ke || 1)),
    payload.jam_mulai || "07:00",
    payload.jam_selesai || "07:45",
    payload.tipe || "Pelajaran"
  ];

  if (foundRowIdx > 0) {
    sheet.getRange(foundRowIdx, 1, 1, newRow.length).setValues([newRow]);
  } else {
    sheet.appendRow(newRow);
  }

  return { success: true, message: "Slot Jam Pelajaran berhasil disimpan!" };
}

function simpanJadwalPelajaran(param1, param2) {
  const payload = (typeof param1 === 'object' && param1 !== null) ? param1 : param2;
  if (!payload) return { success: false, message: "Payload jadwal tidak valid." };

  const sheet = getOrCreateSheet("JadwalPelajaran", ["id_jadwal", "hari", "kelas", "jam_ke", "id_jam", "jam_mulai", "jam_selesai", "mapel", "id_guru", "nama_guru", "ruangan"]);
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());

  const idJadwal = payload.id_jadwal || ("JPEL-" + Math.floor(Math.random() * 100000));
  const idColIdx = findHeaderIndex(headers, ["id_jadwal"]);
  let foundRowIdx = -1;

  if (idColIdx !== -1) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idColIdx]) === String(idJadwal)) {
        foundRowIdx = i + 1;
        break;
      }
    }
  }

  const newRow = [
    idJadwal,
    payload.hari || "Senin",
    payload.kelas || "",
    payload.jam_ke || 1,
    payload.id_jam || ("JP-" + payload.jam_ke),
    payload.jam_mulai || "-",
    payload.jam_selesai || "-",
    payload.mapel || "",
    payload.id_guru || "",
    payload.nama_guru || "",
    payload.ruangan || "Kelas Utama"
  ];

  if (foundRowIdx > 0) {
    sheet.getRange(foundRowIdx, 1, 1, newRow.length).setValues([newRow]);
  } else {
    sheet.appendRow(newRow);
  }

  return { success: true, message: "Jadwal Pelajaran berhasil disimpan!" };
}

function simpanAbsensiMengajarGuru(payload) {
  if (!payload) return { success: false, message: "Payload absensi mengajar tidak valid." };
  const sheet = getOrCreateSheet("AbsensiMengajar", ["id_log_mengajar", "tanggal", "waktu_absen", "hari", "id_guru", "nama_guru", "kelas", "mapel", "jam_ke", "jam_mulai_jadwal", "jam_selesai_jadwal", "status", "catatan_materi"]);

  const idLog = payload.id_log_mengajar || ("LOG-MENG-" + Date.now());
  sheet.appendRow([
    idLog,
    payload.tanggal || new Date().toISOString().split("T")[0],
    payload.waktu_absen || new Date().toTimeString().slice(0, 5),
    payload.hari || "Senin",
    payload.id_guru || "",
    payload.nama_guru || "",
    payload.kelas || "",
    payload.mapel || "",
    payload.jam_ke || 1,
    payload.jam_mulai_jadwal || "-",
    payload.jam_selesai_jadwal || "-",
    payload.status || "Hadir Tepat Waktu",
    payload.catatan_materi || "-"
  ]);

  return { success: true, message: "Presensi Mengajar Guru berhasil dicatat!" };
}

function simpanJadwalGuru(param1, param2) {
  const payload = (typeof param1 === 'object' && param1 !== null) ? param1 : param2;
  if (!payload) return { success: false, message: "Payload jadwal guru tidak valid." };

  const sheet = getOrCreateSheet("JadwalGuru", ["id_jadwal", "id_guru", "nama_guru", "hari", "jam_masuk_mulai", "jam_masuk_batas", "jam_pulang_mulai"]);
  const idJadwal = payload.id_jadwal || ("J-" + Math.floor(Math.random() * 10000));

  sheet.appendRow([
    idJadwal,
    payload.id_guru || "",
    payload.nama_guru || "",
    payload.hari || "Senin",
    payload.jam_masuk_mulai || "06:00",
    payload.jam_masuk_batas || "07:15",
    payload.jam_pulang_mulai || "15:30"
  ]);

  return { success: true, message: "Jadwal guru berhasil disimpan!" };
}

// ==============================================================================
// HANDLER KELAS & HARI LIBUR & PENGATURAN
// ==============================================================================

function getKelasSemua() {
  const sheet = findSheetByName(["Kelas", "DATA_KELAS", "DataKelas"]);
  if (!sheet) return { success: true, data: [] };
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };

  const headers = data[0].map(h => String(h).toLowerCase().trim());
  let colNama = headers.indexOf("nama_kelas") !== -1 ? headers.indexOf("nama_kelas") : (headers.indexOf("kelas") !== -1 ? headers.indexOf("kelas") : 1);
  let colIdGuru = headers.indexOf("id_guru") !== -1 ? headers.indexOf("id_guru") : (headers.indexOf("id_wali") !== -1 ? headers.indexOf("id_wali") : -1);
  let colWali = headers.indexOf("wali_kelas") !== -1 ? headers.indexOf("wali_kelas") : (headers.indexOf("wali") !== -1 ? headers.indexOf("wali") : 2);

  if (colNama === -1) colNama = 0;

  const list = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const namaKls = String(row[colNama] !== undefined ? row[colNama] : "").trim();
    if (!namaKls) continue;
    const idG = (colIdGuru !== -1 && colIdGuru < row.length) ? String(row[colIdGuru] || "-").trim() : "-";
    const wKls = (colWali !== -1 && colWali < row.length) ? String(row[colWali] || "-").trim() : "-";
    list.push({
      nama_kelas: namaKls,
      id_guru: idG || "-",
      wali_kelas: wKls || "-"
    });
  }
  return { success: true, data: list };
}

function simpanKelas(arg0, arg1, arg2, arg3) {
  let payloadObj = typeof arg3 === "object" ? arg3 : (typeof arg2 === "object" ? arg2 : (typeof arg1 === "object" ? arg1 : (typeof arg0 === "object" ? arg0 : {})));
  const namaKelas = typeof arg0 === "string" ? arg0 : (payloadObj.nama_kelas || payloadObj.kelas || "");
  const waliKelas = typeof arg1 === "string" ? arg1 : (payloadObj.wali_kelas || payloadObj.wali || payloadObj.nama_guru || "-");
  const idGuru = typeof arg2 === "string" ? arg2 : (payloadObj.id_guru || payloadObj.idGuru || payloadObj.id_wali || "-");

  if (!namaKelas) return { success: false, message: "Nama kelas tidak boleh kosong." };
  
  const sheet = getOrCreateSheet("Kelas", ["id_kelas", "nama_kelas", "id_guru", "wali_kelas"], ["DATA_KELAS", "DataKelas"]);
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).toLowerCase().trim());
  let colNama = headers.indexOf("nama_kelas") !== -1 ? headers.indexOf("nama_kelas") : (headers.indexOf("kelas") !== -1 ? headers.indexOf("kelas") : 1);
  let colIdGuru = headers.indexOf("id_guru") !== -1 ? headers.indexOf("id_guru") : (headers.indexOf("id_wali") !== -1 ? headers.indexOf("id_wali") : 2);
  let colWali = headers.indexOf("wali_kelas") !== -1 ? headers.indexOf("wali_kelas") : (headers.indexOf("wali") !== -1 ? headers.indexOf("wali") : 3);

  if (colNama === -1) colNama = 1;

  let foundRow = -1;
  for (let r = 1; r < data.length; r++) {
    if (String(data[r][colNama]).trim().toLowerCase() === String(namaKelas).trim().toLowerCase()) {
      foundRow = r + 1;
      break;
    }
  }

  if (foundRow !== -1) {
    if (colIdGuru !== -1) sheet.getRange(foundRow, colIdGuru + 1).setValue(idGuru || "-");
    if (colWali !== -1) sheet.getRange(foundRow, colWali + 1).setValue(waliKelas || "-");
    return { success: true, message: "Kelas '" + namaKelas + "' berhasil diperbarui!" };
  } else {
    const klsId = "KLS-" + Date.now();
    const newRow = [];
    const maxCol = Math.max(0, colNama, colIdGuru, colWali);
    for (let c = 0; c <= maxCol; c++) newRow.push("-");
    newRow[0] = klsId;
    if (colNama !== -1) newRow[colNama] = namaKelas;
    if (colIdGuru !== -1) newRow[colIdGuru] = idGuru || "-";
    if (colWali !== -1) newRow[colWali] = waliKelas || "-";
    sheet.appendRow(newRow);
    return { success: true, message: "Kelas '" + namaKelas + "' berhasil ditambahkan!" };
  }
}

function editKelas(arg0, arg1, arg2, arg3, arg4) {
  let payloadObj = typeof arg4 === "object" ? arg4 : (typeof arg3 === "object" ? arg3 : (typeof arg2 === "object" ? arg2 : (typeof arg1 === "object" ? arg1 : {})));
  const kelasLama = typeof arg0 === "string" ? arg0 : (payloadObj.kelasLama || "");
  const kelasBaru = typeof arg1 === "string" ? arg1 : (payloadObj.kelasBaru || payloadObj.nama_kelas || kelasLama);
  const waliBaru = typeof arg2 === "string" ? arg2 : (payloadObj.wali_kelas || payloadObj.wali || "-");
  const idGBaru = typeof arg3 === "string" ? arg3 : (payloadObj.id_guru || payloadObj.idGuru || "-");

  const sheet = findSheetByName(["Kelas", "DATA_KELAS", "DataKelas"]);
  if (!sheet) return { success: false, message: "Sheet Kelas tidak ditemukan." };
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).toLowerCase().trim());
  let colNama = headers.indexOf("nama_kelas") !== -1 ? headers.indexOf("nama_kelas") : (headers.indexOf("kelas") !== -1 ? headers.indexOf("kelas") : 1);
  let colIdGuru = headers.indexOf("id_guru") !== -1 ? headers.indexOf("id_guru") : (headers.indexOf("id_wali") !== -1 ? headers.indexOf("id_wali") : 2);
  let colWali = headers.indexOf("wali_kelas") !== -1 ? headers.indexOf("wali_kelas") : (headers.indexOf("wali") !== -1 ? headers.indexOf("wali") : 3);

  if (colNama === -1) colNama = 1;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][colNama]).trim().toLowerCase() === String(kelasLama).trim().toLowerCase() || String(data[i][0]).trim().toLowerCase() === String(kelasLama).trim().toLowerCase()) {
      if (colNama !== -1) sheet.getRange(i + 1, colNama + 1).setValue(kelasBaru);
      if (colIdGuru !== -1) sheet.getRange(i + 1, colIdGuru + 1).setValue(idGBaru || "-");
      if (colWali !== -1) sheet.getRange(i + 1, colWali + 1).setValue(waliBaru || "-");
      return { success: true, message: "Kelas berhasil diperbarui dari '" + kelasLama + "' ke '" + kelasBaru + "'!" };
    }
  }

  return simpanKelas(kelasBaru, waliBaru, idGBaru, payloadObj);
}

function simpanWaliKelas(arg0, arg1, arg2, arg3) {
  return simpanKelas(arg0, arg1, arg2, arg3);
}

function simpanHariLibur(param1, param2) {
  const tgl = (typeof param1 === 'string') ? param1 : (param1.tanggal || "");
  const ket = param2 || (typeof param1 === 'object' ? param1.keterangan : "Libur Sekolah");
  if (!tgl) return { success: false, message: "Tanggal libur tidak valid." };
  const sheet = getOrCreateSheet("HariLibur", ["tanggal", "keterangan"]);
  sheet.appendRow([tgl, ket]);
  return { success: true, message: "Hari Libur berhasil disimpan!" };
}

function getPengaturan() {
  const sheet = findSheetByName(["Pengaturan"]);
  if (!sheet) return { success: true, data: { jam_masuk_mulai: "06:00", jam_masuk_batas: "07:15", jam_pulang_mulai: "15:30" } };
  const data = sheet.getDataRange().getValues();
  let cfg = { jam_masuk_mulai: "06:00", jam_masuk_batas: "07:15", jam_pulang_mulai: "15:30" };
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      cfg[String(data[i][0])] = data[i][1];
    }
  }
  return { success: true, data: cfg };
}

function simpanPengaturan(jMulai, jBatas, jPulang) {
  const sheet = getOrCreateSheet("Pengaturan", ["key", "value"]);
  sheet.clearContents();
  sheet.appendRow(["key", "value"]);
  sheet.appendRow(["jam_masuk_mulai", jMulai || "06:00"]);
  sheet.appendRow(["jam_masuk_batas", jBatas || "07:15"]);
  sheet.appendRow(["jam_pulang_mulai", jPulang || "15:30"]);
  return { success: true, message: "Pengaturan operasional berhasil disimpan!" };
}

function simpanPengaturanCustom(configObj) {
  if (!configObj) return { success: false, message: "Pengaturan tidak valid." };
  const sheet = getOrCreateSheet("Pengaturan", ["key", "value"]);
  sheet.clearContents();
  sheet.appendRow(["key", "value"]);

  Object.keys(configObj).forEach(k => {
    sheet.appendRow([k, configObj[k]]);
  });

  return { success: true, message: "Pengaturan kustom berhasil disimpan!" };
}

// ==============================================================================
// HANDLER AUTHENTICATION & USERS
// ==============================================================================

function verifikasiLogin(username, password) {
  const sheet = getOrCreateSheet("Users", ["username", "password", "role", "target_id"]);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === String(username).toLowerCase() && String(data[i][1]) === String(password)) {
      return {
        success: true,
        role: data[i][2] || "Admin",
        target_id: data[i][3] || "-",
        username: data[i][0],
        message: "Login Berhasil!"
      };
    }
  }

  // Fallback cek data guru jika username menggunakan nama guru
  const guruRes = getDataMaster("Guru");
  const guruMatch = (guruRes.data || []).find(g => {
    const uNameLower = String(username).replace(/\s+/g, "").toLowerCase();
    const gNameLower = String(g.nama_guru || "").replace(/\s+/g, "").toLowerCase();
    return uNameLower === gNameLower && String(password) === String(g.password || "guru123");
  });

  if (guruMatch) {
    return {
      success: true,
      role: "Guru",
      target_id: guruMatch.id_guru,
      username: guruMatch.nama_guru,
      message: "Login Berhasil (Otomatis Guru)!"
    };
  }

  return { success: false, message: "Username atau Password salah!" };
}

function ubahPasswordUser(username, passwordLama, passwordBaru) {
  const sheet = findSheetByName(["Users"]);
  if (sheet) {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase() === String(username).toLowerCase() && String(data[i][1]) === String(passwordLama)) {
        sheet.getRange(i + 1, 2).setValue(passwordBaru);
        return { success: true, message: "Password berhasil diperbarui!" };
      }
    }
  }

  // Cek guru
  const gSheet = findSheetByName(["Guru", "DataGuru"]);
  if (gSheet) {
    const data = gSheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim());
    const passIdx = findHeaderIndex(headers, ["password"]);
    const nameIdx = findHeaderIndex(headers, ["nama_guru", "nama"]);

    if (passIdx !== -1 && nameIdx !== -1) {
      for (let i = 1; i < data.length; i++) {
        const gNameLower = String(data[i][nameIdx]).replace(/\s+/g, "").toLowerCase();
        const uLower = String(username).replace(/\s+/g, "").toLowerCase();
        if (gNameLower === uLower && String(data[i][passIdx] || "guru123") === String(passwordLama)) {
          sheet.getRange(i + 1, passIdx + 1).setValue(passwordBaru);
          return { success: true, message: "Password Guru berhasil diperbarui!" };
        }
      }
    }
  }

  return { success: false, message: "Password lama tidak sesuai." };
}

function simpanUser(userObj, oldUsername) {
  if (!userObj || !userObj.username) return { success: false, message: "Data user tidak valid." };
  const sheet = getOrCreateSheet("Users", ["username", "password", "role", "target_id"]);
  const data = sheet.getDataRange().getValues();

  if (oldUsername) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase() === String(oldUsername).toLowerCase()) {
        sheet.getRange(i + 1, 1).setValue(userObj.username);
        sheet.getRange(i + 1, 2).setValue(userObj.password || "123456");
        sheet.getRange(i + 1, 3).setValue(userObj.role || "TU");
        sheet.getRange(i + 1, 4).setValue(userObj.target_id || "-");
        return { success: true, message: "User berhasil diperbarui!" };
      }
    }
  }

  sheet.appendRow([userObj.username, userObj.password || "123456", userObj.role || "TU", userObj.target_id || "-"]);
  return { success: true, message: "User baru berhasil ditambahkan!" };
}

// ==============================================================================
// UTILITY HELPERS
// ==============================================================================

function findHeaderIndex(headers, possibleKeys) {
  for (let i = 0; i < possibleKeys.length; i++) {
    const key = possibleKeys[i].toLowerCase();
    for (let j = 0; j < headers.length; j++) {
      if (headers[j].toLowerCase() === key) return j;
    }
  }
  return -1;
}

function setRowValueByHeader(sheet, rowNum, headers, targetHeader, value) {
  const idx = findHeaderIndex(headers, [targetHeader]);
  if (idx !== -1) {
    sheet.getRange(rowNum, idx + 1).setValue(value);
  }
}

function hapusRowByColumn(sheetPrimaryName, possibleColHeaders, value) {
  const sheet = findSheetByName([sheetPrimaryName]);
  if (!sheet) return { success: true, message: "Sheet tidak ditemukan." };
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, message: "Data kosong." };

  const headers = data[0].map(h => String(h).trim());
  const colIdx = findHeaderIndex(headers, possibleColHeaders);
  if (colIdx === -1) return { success: false, message: "Kolom kunci tidak ditemukan." };

  let deletedCount = 0;
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][colIdx]) === String(value)) {
      sheet.deleteRow(i + 1);
      deletedCount++;
    }
  }
  return { success: true, message: deletedCount + " baris berhasil dihapus dari Spreadsheet!" };
}
