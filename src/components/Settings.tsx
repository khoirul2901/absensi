/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import * as XLSX from "xlsx";
import { 
  Building2, 
  Clock, 
  Calendar, 
  FolderLock, 
  Trash2, 
  Plus, 
  Save, 
  Database,
  CheckCircle,
  AlertTriangle,
  Image as ImageIcon,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  HardDrive,
  Download,
  Upload,
  Cloud,
  FileJson,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Loader2,
  Code,
  FileSpreadsheet,
  Layers,
  CheckCircle2,
  ExternalLink,
  Edit2,
  BookOpen,
  SlidersHorizontal,
  X
} from "lucide-react";
import { callGas, getStorageKey, setStorage, getStorage, extractArrayData, cleanTimeHHMM, getSchoolProfile, setSchoolProfile } from "../lib/gasApi";
import { ConfigJam, HariLibur, JamPelajaranItem } from "../types";

export default function Settings() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"profil" | "jam" | "keamanan" | "spreadsheet" | "backup">("profil");
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(getStorageKey("SIAS_SESSION"));
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Password Change State
  const [passLama, setPassLama] = useState("");
  const [passBaru, setPassBaru] = useState("");
  const [passKonfirm, setPassKonfirm] = useState("");
  const [passStatus, setPassStatus] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  // Card & Identity Settings State
  const schoolProf = getSchoolProfile();
  const [cardConfig, setCardConfig] = useState({
    schoolName: localStorage.getItem(getStorageKey('cardSchoolName')) || schoolProf.namaSekolah || 'AL-HIKAM SCHOOL',
    schoolAddress: localStorage.getItem(getStorageKey('cardSchoolAddress')) || schoolProf.alamatSekolah || 'SENDANG AGUNG',
    principalName: localStorage.getItem(getStorageKey('cardPrincipalName')) || 'Fulan, S.Pd',
    signatureUrl: localStorage.getItem(getStorageKey('cardSignatureUrl')) || '',
    logoLeftUrl: localStorage.getItem(getStorageKey('cardLogoLeftUrl')) || '',
    logoRightUrl: localStorage.getItem(getStorageKey('cardLogoRightUrl')) || ''
  });

  // Operational Hours State
  const [configJam, setConfigJam] = useState<ConfigJam>(() => {
    try {
      const localCfg = JSON.parse(localStorage.getItem(getStorageKey("MOCK_pengaturan_jam")) || localStorage.getItem(getStorageKey("pengaturan_jam")) || "{}");
      return {
        jam_masuk_mulai: cleanTimeHHMM(localCfg.jam_masuk_mulai || localCfg.jamMasukMulai) || "06:00",
        jam_masuk_batas: cleanTimeHHMM(localCfg.jam_masuk_batas || localCfg.jamMasukBatas) || "07:15",
        jam_pulang_mulai: cleanTimeHHMM(localCfg.jam_pulang_mulai || localCfg.jamPulangMulai) || "15:30"
      };
    } catch (e) {
      return {
        jam_masuk_mulai: "06:00",
        jam_masuk_batas: "07:15",
        jam_pulang_mulai: "15:30"
      };
    }
  });

  // Holidays State
  const [liburList, setLiburList] = useState<HariLibur[]>([]);
  const [newLiburTgl, setNewLiburTgl] = useState("");
  const [newLiburKet, setNewLiburKet] = useState("");

  // Jam Pelajaran Slots State
  const [jamSlots, setJamSlots] = useState<JamPelajaranItem[]>([]);
  const [showJamModal, setShowJamModal] = useState(false);
  const [editJamId, setEditJamId] = useState<string | null>(null);
  const [jamForm, setJamForm] = useState({
    jam_ke: 1,
    nama_jam: "Jam ke-1",
    jam_mulai: "07:00",
    jam_selesai: "07:45",
    tipe: "Pelajaran" as "Pelajaran" | "Istirahat" | "Upacara"
  });

  // Settings for Schedule Restriction & Tolerances
  const [batasiJamJadwal, setBatasiJamJadwal] = useState<boolean>(true);
  const [toleransiAwal, setToleransiAwal] = useState<number>(15);
  const [toleransiAkhir, setToleransiAkhir] = useState<number>(30);
  const [toleransiGuruInput, setToleransiGuruInput] = useState<number>(15);
  const [savingToleransi, setSavingToleransi] = useState<boolean>(false);

  // Token API State
  const [apiToken, setApiToken] = useState<string>(() => {
    return localStorage.getItem(getStorageKey("GAS_TOKEN")) || localStorage.getItem(getStorageKey("apiToken")) || "sias_token_smkalhikam_2026";
  });
  const [showToken, setShowToken] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Backup & Restore State
  const [backupMode, setBackupMode] = useState<"manual" | "otomatis">("manual");
  const [backupFrekuensi, setBackupFrekuensi] = useState<"harian" | "mingguan" | "bulanan">("harian");
  const [backupJam, setBackupJam] = useState("00:00");
  const [driveFolderId, setDriveFolderId] = useState("");
  const [lastBackupTime, setLastBackupTime] = useState<string>(() => {
    return localStorage.getItem(getStorageKey("lastBackupTime")) || "Belum pernah backup";
  });

  const getRawGithubUrl = (url: string): string => {
    if (!url) return "";
    let cleanUrl = url.trim();
    if (cleanUrl.includes("github.com") && !cleanUrl.includes("raw.githubusercontent.com")) {
      cleanUrl = cleanUrl
        .replace("github.com", "raw.githubusercontent.com")
        .replace("/blob/", "/")
        .replace("/raw/", "/");
    }
    return cleanUrl;
  };

  // Centralized Save Function: Merges all settings so nothing gets wiped
  const saveFullConfig = async (partialUpdates: Partial<typeof cardConfig & ConfigJam & { apiToken: string; backupMode: string; backupFrekuensi: string; backupJam: string; driveFolderId: string; lastBackupTime: string }> = {}) => {
    const cleanSignature = getRawGithubUrl(partialUpdates.signatureUrl !== undefined ? partialUpdates.signatureUrl : cardConfig.signatureUrl);
    const cleanLogoLeft = getRawGithubUrl(partialUpdates.logoLeftUrl !== undefined ? partialUpdates.logoLeftUrl : cardConfig.logoLeftUrl);
    const cleanLogoRight = getRawGithubUrl(partialUpdates.logoRightUrl !== undefined ? partialUpdates.logoRightUrl : cardConfig.logoRightUrl);

    const fullObj = {
      cardSchoolName: partialUpdates.schoolName !== undefined ? partialUpdates.schoolName : cardConfig.schoolName,
      cardSchoolAddress: partialUpdates.schoolAddress !== undefined ? partialUpdates.schoolAddress : cardConfig.schoolAddress,
      cardPrincipalName: partialUpdates.principalName !== undefined ? partialUpdates.principalName : cardConfig.principalName,
      cardSignatureUrl: cleanSignature,
      cardLogoLeftUrl: cleanLogoLeft,
      cardLogoRightUrl: cleanLogoRight,
      jam_masuk_mulai: cleanTimeHHMM(partialUpdates.jam_masuk_mulai !== undefined ? partialUpdates.jam_masuk_mulai : configJam.jam_masuk_mulai) || "06:00",
      jam_masuk_batas: cleanTimeHHMM(partialUpdates.jam_masuk_batas !== undefined ? partialUpdates.jam_masuk_batas : configJam.jam_masuk_batas) || "07:15",
      jam_pulang_mulai: cleanTimeHHMM(partialUpdates.jam_pulang_mulai !== undefined ? partialUpdates.jam_pulang_mulai : configJam.jam_pulang_mulai) || "15:30",
      apiToken: partialUpdates.apiToken !== undefined ? partialUpdates.apiToken : apiToken,
      backupMode: partialUpdates.backupMode !== undefined ? partialUpdates.backupMode : backupMode,
      backupFrekuensi: partialUpdates.backupFrekuensi !== undefined ? partialUpdates.backupFrekuensi : backupFrekuensi,
      backupJam: cleanTimeHHMM(partialUpdates.backupJam !== undefined ? partialUpdates.backupJam : backupJam) || "18:00",
      driveFolderId: partialUpdates.driveFolderId !== undefined ? partialUpdates.driveFolderId : driveFolderId,
      lastBackupTime: partialUpdates.lastBackupTime !== undefined ? partialUpdates.lastBackupTime : lastBackupTime
    };

    // Update Local States
    setCardConfig({
      schoolName: fullObj.cardSchoolName,
      schoolAddress: fullObj.cardSchoolAddress,
      principalName: fullObj.cardPrincipalName,
      signatureUrl: fullObj.cardSignatureUrl,
      logoLeftUrl: fullObj.cardLogoLeftUrl,
      logoRightUrl: fullObj.cardLogoRightUrl
    });

    setConfigJam({
      jam_masuk_mulai: fullObj.jam_masuk_mulai,
      jam_masuk_batas: fullObj.jam_masuk_batas,
      jam_pulang_mulai: fullObj.jam_pulang_mulai
    });

    if (partialUpdates.apiToken !== undefined) setApiToken(fullObj.apiToken);
    if (partialUpdates.backupMode !== undefined) setBackupMode(fullObj.backupMode as any);
    if (partialUpdates.backupFrekuensi !== undefined) setBackupFrekuensi(fullObj.backupFrekuensi as any);
    if (partialUpdates.backupJam !== undefined) setBackupJam(fullObj.backupJam);
    if (partialUpdates.driveFolderId !== undefined) setDriveFolderId(fullObj.driveFolderId);
    if (partialUpdates.lastBackupTime !== undefined) setLastBackupTime(fullObj.lastBackupTime);

    // Persist each key in LocalStorage
    localStorage.setItem(getStorageKey('cardSchoolName'), fullObj.cardSchoolName);
    localStorage.setItem(getStorageKey('cardSchoolAddress'), fullObj.cardSchoolAddress);
    localStorage.setItem(getStorageKey('cardPrincipalName'), fullObj.cardPrincipalName);
    localStorage.setItem(getStorageKey('cardSignatureUrl'), fullObj.cardSignatureUrl);
    localStorage.setItem(getStorageKey('cardLogoLeftUrl'), fullObj.cardLogoLeftUrl);
    localStorage.setItem(getStorageKey('cardLogoRightUrl'), fullObj.cardLogoRightUrl);
    localStorage.setItem(getStorageKey('MOCK_pengaturan_jam'), JSON.stringify(fullObj));
    localStorage.setItem(getStorageKey('pengaturan_jam'), JSON.stringify(fullObj));
    localStorage.setItem(getStorageKey('GAS_TOKEN'), fullObj.apiToken);
    localStorage.setItem(getStorageKey('lastBackupTime'), fullObj.lastBackupTime);

    try {
      setLoading(true);
      setLoadingAction("Sedang menyimpan konfigurasi ke database...");
      const res = await callGas("simpanPengaturanCustom", [fullObj]);
      await callGas("simpanPengaturanJam", [fullObj]);
      return res;
    } catch (err) {
      console.error("saveFullConfig Error:", err);
      return { success: false, message: String(err) };
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  };

  // Load Jam Pelajaran Slots
  const loadJamSlots = async () => {
    try {
      const resJam = await callGas("getJamPelajaran");
      const jamData = extractArrayData(resJam);
      setJamSlots(jamData);
      if (jamData.length > 0) {
        setStorage("jam_pelajaran", jamData);
      }
    } catch (e) {
      const stored = getStorage("jam_pelajaran") || [];
      setJamSlots(stored);
    }
  };

  // Load Config on Mount
  const loadConfig = async () => {
    try {
      setLoading(true);
      let res = await callGas("getPengaturanSemua");
      const data = res?.data || res || {};

      if (data && typeof data === "object") {
        if (data.cardSchoolName) setCardConfig(prev => ({ ...prev, schoolName: data.cardSchoolName }));
        if (data.cardSchoolAddress) setCardConfig(prev => ({ ...prev, schoolAddress: data.cardSchoolAddress }));
        if (data.cardPrincipalName) setCardConfig(prev => ({ ...prev, principalName: data.cardPrincipalName }));
        if (data.cardSignatureUrl) setCardConfig(prev => ({ ...prev, signatureUrl: data.cardSignatureUrl }));
        if (data.cardLogoLeftUrl) setCardConfig(prev => ({ ...prev, logoLeftUrl: data.cardLogoLeftUrl }));
        if (data.cardLogoRightUrl) setCardConfig(prev => ({ ...prev, logoRightUrl: data.cardLogoRightUrl }));

        if (data.jam_masuk_mulai) setConfigJam(prev => ({ ...prev, jam_masuk_mulai: cleanTimeHHMM(data.jam_masuk_mulai) || prev.jam_masuk_mulai }));
        if (data.jam_masuk_batas) setConfigJam(prev => ({ ...prev, jam_masuk_batas: cleanTimeHHMM(data.jam_masuk_batas) || prev.jam_masuk_batas }));
        if (data.jam_pulang_mulai) setConfigJam(prev => ({ ...prev, jam_pulang_mulai: cleanTimeHHMM(data.jam_pulang_mulai) || prev.jam_pulang_mulai }));

        if (data.batasi_jam_jadwal !== undefined) setBatasiJamJadwal(Boolean(data.batasi_jam_jadwal));
        if (data.toleransi_awal_menit !== undefined) setToleransiAwal(Number(data.toleransi_awal_menit) || 15);
        if (data.toleransi_akhir_menit !== undefined) setToleransiAkhir(Number(data.toleransi_akhir_menit) || 30);
        const val = Number(data.toleransi_guru ?? data.toleransi_mengajar_guru);
        if (!isNaN(val) && val >= 0) {
          setToleransiGuruInput(val);
        }

        if (data.apiToken) setApiToken(data.apiToken);
        if (data.backupMode) setBackupMode(data.backupMode);
        if (data.backupFrekuensi) setBackupFrekuensi(data.backupFrekuensi);
        if (data.backupJam) setBackupJam(data.backupJam);
        if (data.driveFolderId) setDriveFolderId(data.driveFolderId);
        if (data.lastBackupTime) setLastBackupTime(data.lastBackupTime);
      }

      // Load Holidays
      const liburRes = await callGas("getHariLiburSemua");
      const libList = Array.isArray(liburRes)
        ? liburRes
        : (liburRes?.data && Array.isArray(liburRes.data) ? liburRes.data : []);
      setLiburList(libList);

      // Load Jam Pelajaran
      await loadJamSlots();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  // Save Toleransi & Batasan Presensi Guru
  const handleSaveToleransi = async (e: FormEvent) => {
    e.preventDefault();
    setSavingToleransi(true);
    setLoadingAction("Menyimpan aturan jam & toleransi...");
    try {
      const payload = {
        batasi_jam_jadwal: batasiJamJadwal,
        toleransi_awal_menit: toleransiAwal,
        toleransi_akhir_menit: toleransiAkhir,
        toleransi_guru: toleransiGuruInput,
        toleransi_mengajar_guru: toleransiGuruInput
      };
      const res = await callGas("simpanPengaturan", [payload]);
      if (res && res.success !== false) {
        alert("Pengaturan toleransi presensi guru & batasan jam berhasil disimpan!");
      } else {
        alert(res?.message || "Pengaturan disimpan secara lokal.");
      }
    } catch (err: any) {
      alert("Gagal menyimpan toleransi: " + err.toString());
    } finally {
      setSavingToleransi(false);
      setLoadingAction(null);
    }
  };

  // Save Jam Pelajaran Slot
  const handleSaveJamSlot = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      id_jam: editJamId || `JP-${Date.now()}`,
      jam_ke: Number(jamForm.jam_ke),
      nama_jam: jamForm.nama_jam || `Jam ke-${jamForm.jam_ke}`,
      jam_mulai: jamForm.jam_mulai,
      jam_selesai: jamForm.jam_selesai,
      tipe: jamForm.tipe
    };

    try {
      setLoading(true);
      setLoadingAction(editJamId ? "Mengupdate slot jam pelajaran..." : "Menambah slot jam pelajaran...");
      let res;
      if (editJamId) {
        res = await callGas("editJamPelajaran", [editJamId, payload]);
      } else {
        res = await callGas("tambahJamPelajaran", [payload]);
      }

      if (res && res.success !== false) {
        setShowJamModal(false);
        setEditJamId(null);
        await loadJamSlots();
        alert(res?.message || "Slot jam pelajaran berhasil disimpan!");
      } else {
        alert(res?.message || "Gagal menyimpan slot jam pelajaran.");
      }
    } catch (err: any) {
      alert("Kesalahan: " + err.toString());
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  };

  // Delete Jam Pelajaran Slot
  const handleDeleteJamSlot = async (idJam: string, namaJam: string) => {
    if (confirm(`Hapus slot ${namaJam}?`)) {
      try {
        setLoading(true);
        setLoadingAction("Menghapus slot jam...");
        const res = await callGas("hapusJamPelajaran", [idJam]);
        if (res && res.success !== false) {
          await loadJamSlots();
          alert("Slot jam berhasil dihapus.");
        } else {
          alert(res?.message || "Gagal menghapus slot jam.");
        }
      } catch (err: any) {
        alert("Kesalahan: " + err.toString());
      } finally {
        setLoading(false);
        setLoadingAction(null);
      }
    }
  };

  // Save Card & Profile Settings
  const handleSaveCardConfig = async (e: FormEvent) => {
    e.preventDefault();
    const res = await saveFullConfig();
    if (res && res.success !== false) {
      alert("Profil Sekolah & Kartu berhasil disimpan dan disinkronkan ke database!");
    } else {
      alert("Profil disimpan secara lokal, namun gagal disinkronkan ke cloud: " + (res?.message || ""));
    }
  };

  // Save Operational Hours
  const handleSaveHours = async (e: FormEvent) => {
    e.preventDefault();
    const res = await saveFullConfig({
      jam_masuk_mulai: configJam.jam_masuk_mulai,
      jam_masuk_batas: configJam.jam_masuk_batas,
      jam_pulang_mulai: configJam.jam_pulang_mulai
    });
    if (res && res.success !== false) {
      alert("Jam operasional presensi berhasil disimpan!");
    } else {
      alert("Jam operasional disimpan secara lokal.");
    }
  };

  // Save Token
  const handleSaveToken = async (e: FormEvent) => {
    e.preventDefault();
    if (!apiToken.trim()) {
      alert("Token API tidak boleh kosong!");
      return;
    }
    const res = await saveFullConfig({ apiToken: apiToken.trim() });
    alert("Token Keamanan Database berhasil disimpan!");
  };

  // Regenerate Token
  const handleRegenerateToken = () => {
    if (!confirm("Buat token keamanan baru? Aplikasi dan API client akan membutuhkan token baru ini.")) return;
    const newToken = "sias_token_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now().toString(36);
    setApiToken(newToken);
    saveFullConfig({ apiToken: newToken });
  };

  // Add Holiday
  const handleAddHoliday = async (e: FormEvent) => {
    e.preventDefault();
    if (!newLiburTgl || !newLiburKet.trim()) {
      alert("Lengkapi tanggal dan keterangan libur.");
      return;
    }
    try {
      setLoading(true);
      const res = await callGas("tambahHariLibur", [newLiburTgl, newLiburKet.trim()]);
      if (res && res.success) {
        setNewLiburTgl("");
        setNewLiburKet("");
        const liburRes = await callGas("getHariLiburSemua");
        const libList = Array.isArray(liburRes)
          ? liburRes
          : (liburRes?.data && Array.isArray(liburRes.data) ? liburRes.data : []);
        setLiburList(libList);
      } else {
        alert(res?.message || "Gagal menambah hari libur");
      }
    } catch (err: any) {
      alert("Error: " + err.toString());
    } finally {
      setLoading(false);
    }
  };

  // Delete Holiday
  const handleDeleteHoliday = async (tgl: string) => {
    if (!confirm(`Hapus libur pada tanggal ${tgl}?`)) return;
    try {
      setLoading(true);
      const res = await callGas("hapusHariLibur", [tgl]);
      if (res && res.success) {
        const liburRes = await callGas("getHariLiburSemua");
        const libList = Array.isArray(liburRes)
          ? liburRes
          : (liburRes?.data && Array.isArray(liburRes.data) ? liburRes.data : []);
        setLiburList(libList);
      } else {
        alert(res?.message || "Gagal menghapus hari libur");
      }
    } catch (err: any) {
      alert("Error: " + err.toString());
    } finally {
      setLoading(false);
    }
  };

  // Password Change Handler
  const handleUbahPassword = async (e: FormEvent) => {
    e.preventDefault();
    setPassStatus(null);
    setPassError(null);

    if (passBaru !== passKonfirm) {
      setPassError("Konfirmasi password baru tidak cocok.");
      return;
    }
    if (!passBaru.trim()) {
      setPassError("Password baru tidak boleh kosong.");
      return;
    }

    try {
      setLoading(true);
      const res = await callGas("ubahPasswordUser", [currentUser.username, passLama, passBaru]);
      if (res && res.success) {
        setPassStatus("Password berhasil diperbarui!");
        setPassLama("");
        setPassBaru("");
        setPassKonfirm("");
      } else {
        setPassError(res?.message || "Gagal mengubah password.");
      }
    } catch (err: any) {
      setPassError("Error: " + err.toString());
    } finally {
      setLoading(false);
    }
  };

  // Backup & Restore Handlers
  const handleSaveBackupConfig = async (e: FormEvent) => {
    e.preventDefault();
    const res = await saveFullConfig({
      backupMode,
      backupFrekuensi,
      backupJam,
      driveFolderId: driveFolderId.trim()
    });
    alert("Pengaturan mode backup berhasil disimpan!");
  };

  const fetchFullDatabaseBundle = async () => {
    const [resUsers, resSiswa, resGuru, resKelas, resJam, resJadwal, resJadwalGuru, resLaporanSiswa, resLaporanGuru, resMengajar, resHariLibur, resPengaturan] = await Promise.all([
      callGas("getUsersSemua"),
      callGas("getDataMaster", ["Siswa"]),
      callGas("getDataMaster", ["Guru"]),
      callGas("getKelasSemua"),
      callGas("getJamPelajaranSemua"),
      callGas("getJadwalPelajaranSemua"),
      callGas("getJadwalGuruSemua"),
      callGas("getLaporanAbsensiSiswaSemua"),
      callGas("getLaporanAbsensiGuruSemua"),
      callGas("getAbsensiMengajarGuru"),
      callGas("getHariLiburSemua"),
      callGas("getPengaturanSemua")
    ]);

    const usersData = extractArrayData(resUsers).length ? extractArrayData(resUsers) : getStorage("users");
    const siswaData = extractArrayData(resSiswa).length ? extractArrayData(resSiswa) : getStorage("data_siswa");
    const guruData = extractArrayData(resGuru).length ? extractArrayData(resGuru) : getStorage("data_guru");
    const kelasData = extractArrayData(resKelas).length ? extractArrayData(resKelas) : getStorage("data_kelas");
    const jamData = extractArrayData(resJam).length ? extractArrayData(resJam) : getStorage("jam_pelajaran");
    const jadwalPelajaranData = extractArrayData(resJadwal).length ? extractArrayData(resJadwal) : getStorage("jadwal_pelajaran");
    const jadwalGuruData = extractArrayData(resJadwalGuru).length ? extractArrayData(resJadwalGuru) : (getStorage("jadwal_guru") || []);
    const presensiSiswaData = extractArrayData(resLaporanSiswa).length ? extractArrayData(resLaporanSiswa) : getStorage("laporan_siswa");
    const presensiGuruData = extractArrayData(resLaporanGuru).length ? extractArrayData(resLaporanGuru) : getStorage("laporan_guru");
    const absensiMengajarData = extractArrayData(resMengajar).length ? extractArrayData(resMengajar) : (getStorage("absensi_mengajar_guru") || []);
    const hariLiburData = extractArrayData(resHariLibur).length ? extractArrayData(resHariLibur) : getStorage("hari_libur");
    const rawPengaturan = resPengaturan?.data || resPengaturan || {};

    return {
      usersData,
      siswaData,
      guruData,
      kelasData,
      jamData,
      jadwalPelajaranData,
      jadwalGuruData,
      presensiSiswaData,
      presensiGuruData,
      absensiMengajarData,
      hariLiburData,
      rawPengaturan
    };
  };

  // 1. EXPORT DATABASE VERSI SPREADSHEET EXCEL (.xlsx)
  const handleExportDatabaseSpreadsheet = async () => {
    try {
      setLoading(true);
      const data = await fetchFullDatabaseBundle();
      const wb = XLSX.utils.book_new();

      // Helper to append sheet safely
      const appendJsonSheet = (sheetData: any[], sheetName: string) => {
        const ws = XLSX.utils.json_to_sheet(sheetData.length > 0 ? sheetData : [{}]);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      };

      // Transform Pengaturan to key-value rows
      const pengaturanRows: { kunci: string; nilai: string }[] = [];
      const currentFullConfig = {
        ...cardConfig,
        ...configJam,
        apiToken,
        backupMode,
        backupFrekuensi,
        backupJam,
        driveFolderId,
        lastBackupTime,
        ...(typeof data.rawPengaturan === "object" ? data.rawPengaturan : {})
      };

      Object.entries(currentFullConfig).forEach(([k, v]) => {
        if (typeof v !== "object" && v !== undefined && v !== null) {
          pengaturanRows.push({ kunci: k, nilai: String(v) });
        }
      });

      // Append all sheets matching SIAS master structure
      appendJsonSheet(data.siswaData, "DataSiswa");
      appendJsonSheet(data.guruData, "DataGuru");
      appendJsonSheet(data.kelasData, "DataKelas");
      appendJsonSheet(data.jadwalGuruData, "JadwalGuru");
      appendJsonSheet(data.jadwalPelajaranData, "JadwalPelajaran");
      appendJsonSheet(data.jamData, "JamPelajaran");
      appendJsonSheet(data.presensiSiswaData, "PresensiSiswa");
      appendJsonSheet(data.presensiGuruData, "PresensiGuru");
      appendJsonSheet(data.absensiMengajarData, "AbsensiMengajar");
      appendJsonSheet(data.hariLiburData, "HariLibur");
      appendJsonSheet(pengaturanRows, "Pengaturan");
      appendJsonSheet(data.usersData, "Users");

      const dateStr = new Date().toISOString().split("T")[0];
      const fileName = `backup_database_sias_spreadsheet_${dateStr}.xlsx`;
      XLSX.writeFile(wb, fileName);

      const nowStr = new Date().toLocaleString("id-ID");
      setLastBackupTime(nowStr);
      await saveFullConfig({ lastBackupTime: nowStr });
      alert(`File Spreadsheet Excel (${fileName}) dengan 12 sheet lengkap berhasil diunduh!`);
    } catch (err: any) {
      alert("Gagal mengekspor spreadsheet: " + err.toString());
    } finally {
      setLoading(false);
    }
  };

  // 2. BACKUP SPREADSHEET KE GOOGLE DRIVE (GAS CLONE)
  const handleBackupSpreadsheetToDrive = async () => {
    try {
      setLoading(true);
      const res = await callGas("backupSpreadsheetToDrive", [driveFolderId]);
      const nowStr = new Date().toLocaleString("id-ID");
      setLastBackupTime(nowStr);
      await saveFullConfig({ lastBackupTime: nowStr });
      alert(res?.message || "Backup Spreadsheet database ke Google Drive berhasil dibuat!");
    } catch (err: any) {
      alert("Gagal membuat backup Spreadsheet ke Drive: " + err.toString());
    } finally {
      setLoading(false);
    }
  };

  // 3. RESTORE DATABASE DARI FILE SPREADSHEET EXCEL (.xlsx / .xls)
  const handleRestoreSpreadsheetFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const wb = XLSX.read(new Uint8Array(buffer), { type: "array" });

        if (!wb || !wb.SheetNames || wb.SheetNames.length === 0) {
          alert("File spreadsheet tidak memiliki lembar kerja (sheet) yang valid.");
          return;
        }

        const extractedSheets: Record<string, any[]> = {};
        wb.SheetNames.forEach((sheetName) => {
          const ws = wb.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
          extractedSheets[sheetName] = json;
        });

        const sheetNamesList = Object.keys(extractedSheets).join(", ");
        const confirmMsg = `PERINGATAN RESTORE SPREADSHEET:\n` +
          `File Excel berisi sheet: [${sheetNamesList}].\n\n` +
          `Memulihkan database akan memperbarui seluruh tabel database saat ini sesuai isi sheet di atas. Apakah Anda yakin ingin melanjutkan?`;

        if (!confirm(confirmMsg)) return;

        setLoading(true);
        const res = await callGas("restoreDatabaseSpreadsheet", [extractedSheets]);
        if (res && res.success) {
          alert("Restore database dari Spreadsheet Excel berhasil diselesaikan! Halaman akan dimuat ulang.");
          window.location.reload();
        } else {
          alert(res?.message || "Restore database gagal.");
        }
      } catch (err: any) {
        alert("Gagal membaca file spreadsheet: " + err.toString());
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // 4. EXPORT DATABASE JSON
  const handleExportDatabaseJSON = async () => {
    try {
      setLoading(true);
      const data = await fetchFullDatabaseBundle();

      const fullBundle = {
        timestamp: new Date().toISOString(),
        school: cardConfig.schoolName,
        users: data.usersData,
        data_siswa: data.siswaData,
        data_guru: data.guruData,
        data_kelas: data.kelasData,
        jam_pelajaran: data.jamData,
        jadwal_pelajaran: data.jadwalPelajaranData,
        jadwal_guru: data.jadwalGuruData,
        laporan_siswa: data.presensiSiswaData,
        laporan_guru: data.presensiGuruData,
        absensi_mengajar_guru: data.absensiMengajarData,
        hari_libur: data.hariLiburData,
        pengaturan: data.rawPengaturan
      };

      const blob = new Blob([JSON.stringify(fullBundle, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      link.href = url;
      link.download = `backup_database_sias_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const nowStr = new Date().toLocaleString("id-ID");
      setLastBackupTime(nowStr);
      await saveFullConfig({ lastBackupTime: nowStr });
      alert("File backup JSON database berhasil diunduh!");
    } catch (err: any) {
      alert("Gagal mengekspor backup JSON: " + err.toString());
    } finally {
      setLoading(false);
    }
  };

  // 5. BACKUP DATABASE JSON KE DRIVE
  const handleBackupToDrive = async () => {
    try {
      setLoading(true);
      const res = await callGas("backupDatabaseToDrive", [driveFolderId]);
      const nowStr = new Date().toLocaleString("id-ID");
      setLastBackupTime(nowStr);
      await saveFullConfig({ lastBackupTime: nowStr });
      alert(res?.message || "Backup database ke Google Drive berhasil!");
    } catch (err: any) {
      alert("Gagal melakukan backup ke Drive: " + err.toString());
    } finally {
      setLoading(false);
    }
  };

  // 6. RESTORE DATABASE JSON
  const handleRestoreJSONFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (!confirm("PERINGATAN: Memulihkan database akan menimpa seluruh data sistem saat ini dengan isi file backup. Apakah Anda yakin?")) return;

        setLoading(true);
        const res = await callGas("restoreDatabaseJSON", [parsed]);
        if (res && res.success) {
          alert("Restore database berhasil diselesaikan! Halaman akan dimuat ulang.");
          window.location.reload();
        } else {
          alert(res?.message || "Restore database gagal.");
        }
      } catch (err: any) {
        alert("File JSON tidak valid: " + err.toString());
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2 backdrop-blur-sm border border-blue-400/30">
              <FolderLock className="w-3.5 h-3.5" />
              <span>Sistem Manajemen Sekolah SIAS v3.0</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Pengaturan & Konfigurasi</h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-xl">
              Kelola profil sekolah, jam operasional presensi, token keamanan database, serta backup otomatis ke Google Drive.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div className="text-left">
              <p className="text-[10px] text-slate-300 font-semibold uppercase">Status Database</p>
              <p className="text-xs font-bold text-emerald-300">Terhubung & Terproteksi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
        <button
          onClick={() => setActiveTab("profil")}
          className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === "profil"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Profil & Kartu</span>
        </button>

        <button
          onClick={() => setActiveTab("jam")}
          className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === "jam"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Jam & Hari Libur</span>
        </button>

        <button
          onClick={() => setActiveTab("keamanan")}
          className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === "keamanan"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Keamanan & Token</span>
        </button>

        <button
          onClick={() => setActiveTab("spreadsheet")}
          className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === "spreadsheet"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Struktur Sheet & GAS</span>
        </button>

        <button
          onClick={() => setActiveTab("backup")}
          className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === "backup"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Backup Database (Drive)</span>
        </button>
      </div>

      {/* TAB 1: PROFIL & KARTU SEKOLAH */}
      {activeTab === "profil" && (
        <div className="space-y-6">
          <form onSubmit={handleSaveCardConfig} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-gray-900">Identitas Sekolah & Cetak Kartu</h2>
                <p className="text-xs text-gray-500">Konfigurasi nama instansi, logo, dan tanda tangan cetak kartu QR siswa/guru</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Nama Sekolah / Instansi</label>
                <input
                  type="text"
                  required
                  value={cardConfig.schoolName}
                  onChange={(e) => setCardConfig({ ...cardConfig, schoolName: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 font-bold focus:outline-none focus:border-blue-500"
                  placeholder="Contoh: SMK AL-HIKAM KREJENGAN"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Nama Kepala Sekolah</label>
                <input
                  type="text"
                  required
                  value={cardConfig.principalName}
                  onChange={(e) => setCardConfig({ ...cardConfig, principalName: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 font-bold focus:outline-none focus:border-blue-500"
                  placeholder="Contoh: Fulan, S.Pd"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-gray-700">Alamat Lengkap Sekolah</label>
                <input
                  type="text"
                  required
                  value={cardConfig.schoolAddress}
                  onChange={(e) => setCardConfig({ ...cardConfig, schoolAddress: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                  placeholder="Krejengan Kec. Krejengan Kab. Probolinggo"
                />
              </div>

              {/* Logo Left */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                  URL Logo Sekolah Kiri (Instansi)
                </label>
                <input
                  type="url"
                  value={cardConfig.logoLeftUrl}
                  onChange={(e) => setCardConfig({ ...cardConfig, logoLeftUrl: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-800 font-mono focus:outline-none focus:border-blue-500"
                  placeholder="https://... / logo_kiri.png"
                />
                {cardConfig.logoLeftUrl && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                    <img src={getRawGithubUrl(cardConfig.logoLeftUrl)} alt="Logo Left Preview" className="h-10 w-10 object-contain rounded-lg bg-white p-1 border border-gray-200" />
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Pratinjau Logo Kiri Ok
                    </span>
                  </div>
                )}
              </div>

              {/* Logo Right */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                  URL Logo Kanan (Tut Wuri / Kemendikbud)
                </label>
                <input
                  type="url"
                  value={cardConfig.logoRightUrl}
                  onChange={(e) => setCardConfig({ ...cardConfig, logoRightUrl: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-800 font-mono focus:outline-none focus:border-blue-500"
                  placeholder="https://... / logo_kanan.png"
                />
                {cardConfig.logoRightUrl && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                    <img src={getRawGithubUrl(cardConfig.logoRightUrl)} alt="Logo Right Preview" className="h-10 w-10 object-contain rounded-lg bg-white p-1 border border-gray-200" />
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Pratinjau Logo Kanan Ok
                    </span>
                  </div>
                )}
              </div>

              {/* Signature */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                  URL Gambar Tanda Tangan & Stempel Digital
                </label>
                <input
                  type="url"
                  value={cardConfig.signatureUrl}
                  onChange={(e) => setCardConfig({ ...cardConfig, signatureUrl: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-800 font-mono focus:outline-none focus:border-blue-500"
                  placeholder="https://raw.githubusercontent.com/.../signature.png"
                />
                {cardConfig.signatureUrl && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                    <img src={getRawGithubUrl(cardConfig.signatureUrl)} alt="Signature Preview" className="h-12 w-auto max-w-[150px] object-contain rounded-lg bg-white p-1 border border-gray-200" />
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Tanda Tangan Digital Siap Digunakan
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-5">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Profil & Pengaturan Kartu</span>
              </button>
            </div>
          </form>

          {/* Helper Card for Kelas & Wali Kelas Location */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-emerald-900">Manajemen Kelas & Wali Kelas</h3>
                <p className="text-[11px] text-emerald-700 mt-0.5">Pengelolaan data kelas dan penetapan wali kelas sekarang dipusatkan secara efisien di menu Data Master.</p>
              </div>
            </div>
            <a
              href="#/data-master"
              onClick={() => {
                window.location.hash = "#/data-master";
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              <span>Buka Data Master Kelas</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* TAB 2: JAM OPERASIONAL, SLOT JAM PELAJARAN, & HARI LIBUR */}
      {activeTab === "jam" && (
        <div className="space-y-6">
          {/* Form Jam Operasional */}
          <form onSubmit={handleSaveHours} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-gray-900">Jam Operasional Presensi Harian</h2>
                <p className="text-xs text-gray-500">Tentukan batas waktu hadir umum siswa/guru dan jam pulang otomatis</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Jam Masuk Mulai</label>
                <input
                  type="time"
                  required
                  value={configJam.jam_masuk_mulai}
                  onChange={(e) => setConfigJam({ ...configJam, jam_masuk_mulai: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 font-mono font-bold focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-gray-400">Scan sebelum jam ini dicatat sebagai jam awal masuk.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 text-rose-700">Batas Terlambat (Jam Masuk)</label>
                <input
                  type="time"
                  required
                  value={configJam.jam_masuk_batas}
                  onChange={(e) => setConfigJam({ ...configJam, jam_masuk_batas: e.target.value })}
                  className="w-full bg-rose-50/50 border border-rose-200 rounded-xl p-3 text-xs text-rose-900 font-mono font-bold focus:outline-none focus:border-rose-500"
                />
                <p className="text-[10px] text-rose-500">Scan melewati waktu ini otomatis berstatus "Terlambat".</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Jam Pulang Mulai</label>
                <input
                  type="time"
                  required
                  value={configJam.jam_pulang_mulai}
                  onChange={(e) => setConfigJam({ ...configJam, jam_pulang_mulai: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 font-mono font-bold focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-gray-400">Batas awal diperbolehkan melakukan scan pulang.</p>
              </div>
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-5">
              <button
                type="submit"
                disabled={loading}
                className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Jam Operasional</span>
              </button>
            </div>
          </form>

          {/* Pengaturan Slot Jam Pelajaran (Jam ke-1, Jam ke-2, dll) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-gray-900">Pengaturan Slot Jam Pelajaran</h2>
                  <p className="text-xs text-gray-500">Konfigurasi daftar jam ke-1, ke-2, istirahat, hingga pulang beserta rentang waktunya</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditJamId(null);
                  const nextNum = jamSlots.length > 0 ? Math.max(...jamSlots.map(j => Number(j.jam_ke) || 0)) + 1 : 1;
                  setJamForm({
                    jam_ke: nextNum,
                    nama_jam: `Jam ke-${nextNum}`,
                    jam_mulai: "07:00",
                    jam_selesai: "07:45",
                    tipe: "Pelajaran"
                  });
                  setShowJamModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Slot Jam Pelajaran</span>
              </button>
            </div>

            {jamSlots.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
                <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-semibold">Belum ada slot jam pelajaran yang dibuat.</p>
                <p className="text-[11px] text-gray-400 mt-1">Klik tombol di atas untuk menambahkan jam pelajaran sekolah.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {jamSlots
                  .slice()
                  .sort((a, b) => Number(a.jam_ke) - Number(b.jam_ke))
                  .map((slot) => (
                    <div
                      key={slot.id_jam}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        slot.tipe === "Istirahat"
                          ? "bg-amber-50/50 border-amber-200"
                          : slot.tipe === "Upacara"
                          ? "bg-purple-50/50 border-purple-200"
                          : "bg-gray-50/70 border-gray-200/80 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-white shadow-xs border border-gray-200 flex items-center justify-center text-xs font-black text-gray-800">
                              {slot.jam_ke}
                            </span>
                            <span className="font-extrabold text-sm text-gray-900">{slot.nama_jam}</span>
                          </div>
                          <div className="mt-2.5 flex items-center gap-2 font-mono font-bold text-xs text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-100 shadow-2xs w-fit">
                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                            {slot.jam_mulai} - {slot.jam_selesai}
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                            slot.tipe === "Istirahat"
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : slot.tipe === "Upacara"
                              ? "bg-purple-100 text-purple-800 border-purple-300"
                              : "bg-emerald-100 text-emerald-800 border-emerald-300"
                          }`}
                        >
                          {slot.tipe || "Pelajaran"}
                        </span>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditJamId(slot.id_jam);
                            setJamForm({
                              jam_ke: Number(slot.jam_ke) || 1,
                              nama_jam: slot.nama_jam || `Jam ke-${slot.jam_ke}`,
                              jam_mulai: slot.jam_mulai || "07:00",
                              jam_selesai: slot.jam_selesai || "07:45",
                              tipe: (slot.tipe as any) || "Pelajaran"
                            });
                            setShowJamModal(true);
                          }}
                          className="px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteJamSlot(slot.id_jam, slot.nama_jam)}
                          className="px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Pengaturan Batasan & Toleransi Presensi Mengajar Guru */}
          <form onSubmit={handleSaveToleransi} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-gray-900">Aturan & Toleransi Presensi Mengajar Guru</h2>
                <p className="text-xs text-gray-500">Atur validasi jam masuk kelas, batas toleransi awal dan akhir scan presensi mengajar</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Toggle Batasi Presensi Sesuai Jam Pelajaran */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <h4 className="text-xs font-bold text-gray-800">Batasi Presensi Mengajar Sesuai Jam Pelajaran</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Guru hanya diperbolehkan melakukan absensi mengajar saat masuk rentang jam pelajaran yang sesuai jadwal
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={batasiJamJadwal} 
                    onChange={(e) => setBatasiJamJadwal(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700">Toleransi Akses Awal (Menit)</label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={toleransiAwal}
                    onChange={(e) => setToleransiAwal(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 font-bold focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-gray-400">Boleh absen sekian menit sebelum jam mulai pelajaran.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700">Toleransi Batas Akhir (Menit)</label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={toleransiAkhir}
                    onChange={(e) => setToleransiAkhir(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 font-bold focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-gray-400">Batas akhir boleh absen sekian menit setelah jam selesai pelajaran.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 text-rose-700">Batas Toleransi Terlambat Guru (Menit)</label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={toleransiGuruInput}
                    onChange={(e) => setToleransiGuruInput(Number(e.target.value))}
                    className="w-full bg-rose-50/50 border border-rose-200 rounded-xl p-3 text-xs text-rose-900 font-bold focus:outline-none focus:border-rose-500"
                  />
                  <p className="text-[10px] text-rose-500">Lewat dari sekian menit setelah jam mulai, guru dicatat "Terlambat Masuk Kelas".</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-5">
              <button
                type="submit"
                disabled={savingToleransi || loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingToleransi ? "Menyimpan..." : "Simpan Aturan Presensi Guru"}</span>
              </button>
            </div>
          </form>

          {/* Konfigurasi & Uji Sistem Otomatisasi Alfa (Jam 18:00 WIB) */}
          <div className="bg-white rounded-2xl border border-amber-200/80 shadow-sm p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-amber-50 rounded-xl text-amber-700 border border-amber-200">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-gray-900">Sistem Otomatisasi Alfa (Batas Jam 18:00 WIB)</h2>
                <p className="text-xs text-gray-500">Mencatat otomatis status Alfa bagi Guru & Siswa berjadwal yang tidak hadir</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-50 to-orange-50/50 p-4 rounded-xl border border-amber-200/70 text-xs text-gray-700 space-y-3">
              <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Aturan Otomasi SIAS:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
                <li>
                  <strong>Siswa:</strong> Setiap siswa yang tidak memiliki log absensi masuk pada hari aktif sekolah (bukan hari libur) hingga pukul <strong>18:00 WIB</strong> otomatis dicatat berstatus <strong>Alfa</strong>.
                </li>
                <li>
                  <strong>Guru (Jadwal Fleksibel & Mengajar):</strong> Setiap guru yang memiliki jadwal mengajar atau jadwal fleksibel pada hari tersebut namun belum melakukan absensi masuk hingga pukul <strong>18:00 WIB</strong> otomatis dicatat berstatus <strong>Alfa</strong> pada laporan guru dan log mengajar.
                </li>
                <li>
                  <strong>Hari Libur:</strong> Sistem otomatis mendeteksi kalender hari libur dan hari Minggu sehingga tidak akan menandai alfa pada tanggal libur.
                </li>
              </ul>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={loading}
                  onClick={async () => {
                    try {
                      setLoading(true);
                      setLoadingAction("Menjalankan pemeriksaan Auto-Alfa...");
                      const res = await callGas("jalankanAutoAlfaSistem", [undefined, true]);
                      if (res && res.success) {
                        const d = res.data;
                        alert(`Hasil Eksekusi Auto-Alfa:\n- Siswa Baru Alfa: ${d?.siswa_alfa_baru || 0}\n- Guru Baru Alfa: ${d?.guru_alfa_baru || 0}\n- Log Mengajar Alfa: ${d?.guru_mengajar_alfa_baru || 0}\n- Keterangan: ${res.message || 'Sukses'}`);
                      } else {
                        alert(res?.message || "Gagal menjalankan Auto-Alfa");
                      }
                    } catch (e: any) {
                      alert("Error: " + e.toString());
                    } finally {
                      setLoading(false);
                      setLoadingAction(null);
                    }
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Uji / Jalankan Auto-Alfa Sekarang</span>
                </button>
                <span className="text-[11px] text-gray-500 font-medium">
                  Sistem juga otomatis mengeksekusi pemeriksaan ini setiap kali Dashboard dibuka dan setiap interval berkala.
                </span>
              </div>
            </div>
          </div>

          {/* Kelola Hari Libur */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-gray-900">Kelola Kalender Hari Libur Sekolah</h2>
                <p className="text-xs text-gray-500">Presensi tidak dihitung terlambat / alfa pada tanggal libur resmi</p>
              </div>
            </div>

            <form onSubmit={handleAddHoliday} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-purple-50/50 p-4 rounded-xl border border-purple-100">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-purple-900">Tanggal Libur</label>
                <input
                  type="date"
                  required
                  value={newLiburTgl}
                  onChange={(e) => setNewLiburTgl(e.target.value)}
                  className="w-full bg-white border border-purple-200 rounded-xl p-2.5 text-xs text-gray-900 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-purple-900">Keterangan / Nama Libur</label>
                <input
                  type="text"
                  required
                  value={newLiburKet}
                  onChange={(e) => setNewLiburKet(e.target.value)}
                  className="w-full bg-white border border-purple-200 rounded-xl p-2.5 text-xs text-gray-900 font-medium"
                  placeholder="Misal: Idul Fitri / Libur Semester"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Hari Libur</span>
              </button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Tanggal Libur</th>
                    <th className="py-3 px-4">Keterangan</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                  {liburList.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-gray-400 font-medium">Belum ada daftar hari libur ditambahkan</td>
                    </tr>
                  ) : (
                    liburList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/80">
                        <td className="py-3 px-4 font-mono font-bold text-purple-700">{item.tanggal}</td>
                        <td className="py-3 px-4 font-semibold text-gray-800">{item.keterangan}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteHoliday(item.tanggal)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Hapus Hari Libur"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KEAMANAN & TOKEN API */}
      {activeTab === "keamanan" && (
        <div className="space-y-6">
          {/* Form Token API */}
          <form onSubmit={handleSaveToken} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-gray-900">Token Keamanan API & Database</h2>
                <p className="text-xs text-gray-500">Token autentikasi rahasia untuk memproteksi akses endpoint database SIAS</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Security Token Key</label>
                <div className="relative">
                  <input
                    type={showToken ? "text" : "password"}
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pr-28 text-xs text-gray-900 font-mono font-bold focus:outline-none focus:border-emerald-500"
                    placeholder="Masukkan token rahasia..."
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-all"
                      title={showToken ? "Sembunyikan Token" : "Tampilkan Token"}
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(apiToken);
                        setCopiedToken(true);
                        setTimeout(() => setCopiedToken(false), 2000);
                      }}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                      title="Salin Token"
                    >
                      {copiedToken ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {copiedToken && <p className="text-[10px] text-emerald-600 font-bold">Token berhasil disalin ke clipboard!</p>}
              </div>

              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-900">Token digunakan untuk memvalidasi permintaan API dari Google Sheets / Client App</span>
                </div>
                <button
                  type="button"
                  onClick={handleRegenerateToken}
                  className="bg-white hover:bg-gray-50 text-emerald-700 font-bold text-xs px-3.5 py-2 rounded-lg border border-emerald-200 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Generate Token Baru</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-5">
              <button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Token API</span>
              </button>
            </div>
          </form>

          {/* Form Ubah Password User */}
          <form onSubmit={handleUbahPassword} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                <FolderLock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-gray-900">Ubah Password Akun ({currentUser?.username || "Admin"})</h2>
                <p className="text-xs text-gray-500">Perbarui kata sandi masuk untuk keamanan akun login Anda</p>
              </div>
            </div>

            {passStatus && (
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-100">
                <CheckCircle className="w-4 h-4" />
                <span>{passStatus}</span>
              </div>
            )}

            {passError && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2 border border-rose-100">
                <AlertTriangle className="w-4 h-4" />
                <span>{passError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Password Saat Ini</label>
                <input
                  type="password"
                  required
                  value={passLama}
                  onChange={(e) => setPassLama(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Password Baru</label>
                <input
                  type="password"
                  required
                  value={passBaru}
                  onChange={(e) => setPassBaru(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  required
                  value={passKonfirm}
                  onChange={(e) => setPassKonfirm(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-5">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Perbarui Password</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB: STRUKTUR SPREADSHEET & APPS SCRIPT */}
      {activeTab === "spreadsheet" && (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-gray-900">Struktur Sheet Database Google Spreadsheet</h2>
                <p className="text-xs text-gray-500">Konfigurasi nama sheet dan pemetaan kolom untuk sinkronisasi otomatis presensi dan master data</p>
              </div>
            </div>

            {/* Core Database Sheets Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {/* Sheet 1: JadwalGuru */}
              <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-teal-600 text-white text-[11px] font-black rounded-lg uppercase tracking-wider">
                    Sheet: JadwalGuru
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                </div>
                <h3 className="text-xs font-extrabold text-teal-950">Master Jadwal Fleksibel Guru</h3>
                <p className="text-[11px] text-teal-800 leading-relaxed">
                  Menyimpan konfigurasi jadwal harian/fleksibel guru (hari aktif, jam masuk awal, batas terlambat, dan jam pulang).
                </p>
                <div className="bg-white/80 p-2.5 rounded-xl border border-teal-100 text-[10px] text-teal-900 font-mono space-y-0.5">
                  <p className="font-bold text-teal-950">Kolom Sheet:</p>
                  <p className="break-all text-slate-700">id_jadwal, id_guru, nama_guru, hari, jam_masuk_mulai, jam_masuk_batas, jam_pulang_mulai</p>
                </div>
              </div>

              {/* Sheet 2: JadwalPelajaran */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-amber-600 text-white text-[11px] font-black rounded-lg uppercase tracking-wider">
                    Sheet: JadwalPelajaran
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="text-xs font-extrabold text-amber-950">Master Jadwal Pelajaran Guru</h3>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Menyimpan plot jadwal mengajar guru per hari, jam ke, rentang waktu, kelas, mapel, dan ruangan.
                </p>
                <div className="bg-white/80 p-2.5 rounded-xl border border-amber-100 text-[10px] text-amber-900 font-mono space-y-0.5">
                  <p className="font-bold text-amber-950">Kolom Sheet:</p>
                  <p className="break-all text-slate-700">id_jadwal, hari, id_jam, jam_ke, jam_mulai, jam_selesai, kelas, mapel, id_guru, nama_guru, ruangan</p>
                </div>
              </div>

              {/* Sheet 3: PresensiGuru */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-indigo-600 text-white text-[11px] font-black rounded-lg uppercase tracking-wider">
                    Sheet: PresensiGuru
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="text-xs font-extrabold text-indigo-950">Pencatatan Presensi Guru (Jadwal Fleksibel)</h3>
                <p className="text-[11px] text-indigo-800 leading-relaxed">
                  Menyimpan log kehadiran harian guru berdasarkan jam fleksibel / harian (Masuk & Pulang sekolah).
                </p>
                <div className="bg-white/80 p-2.5 rounded-xl border border-indigo-100 text-[10px] text-indigo-900 font-mono space-y-0.5">
                  <p className="font-bold text-indigo-950">Kolom Sheet:</p>
                  <p className="break-all text-slate-700">id_log_guru, tanggal, id_guru, nama_guru, jam_masuk, status_masuk, jam_pulang, status_pulang, ket</p>
                </div>
              </div>

              {/* Sheet 4: AbsensiMengajar */}
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-purple-600 text-white text-[11px] font-black rounded-lg uppercase tracking-wider">
                    Sheet: AbsensiMengajar
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="text-xs font-extrabold text-purple-950">Pencatatan Absensi Guru (Jadwal Pelajaran)</h3>
                <p className="text-[11px] text-purple-800 leading-relaxed">
                  Menyimpan jurnal & presensi mengajar guru per jam pelajaran di kelas sesuai jadwal pelajaran aktif.
                </p>
                <div className="bg-white/80 p-2.5 rounded-xl border border-purple-100 text-[10px] text-purple-900 font-mono space-y-0.5">
                  <p className="font-bold text-purple-950">Kolom Sheet:</p>
                  <p className="break-all text-slate-700">id_log_mengajar, tanggal, waktu_absen, hari, id_guru, nama_guru, kelas, mapel, jam_ke, jam_mulai_jadwal, jam_selesai_jadwal, status, catatan_materi</p>
                </div>
              </div>
            </div>

            {/* Additional Sheets Summary */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 mt-4">
              <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-600" />
                <span>Sheet Database Lainnya pada Google Spreadsheet:</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-[11px]">
                <div className="bg-white p-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-700 text-center">PresensiSiswa</div>
                <div className="bg-white p-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-700 text-center">DataSiswa</div>
                <div className="bg-white p-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-700 text-center">DataGuru</div>
                <div className="bg-white p-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-700 text-center">DataKelas</div>
                <div className="bg-white p-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-700 text-center">JamPelajaran</div>
                <div className="bg-white p-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-700 text-center">Pengaturan</div>
              </div>
            </div>
          </div>

          {/* Apps Script Helper Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 space-y-4 shadow-xl border border-slate-800">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Code className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-extrabold text-white">Kode Google Apps Script (GAS) SIAS</h3>
                  <p className="text-xs text-slate-400">Salin skrip berikut ke menu <b>Ekstensi &gt; Apps Script</b> pada Google Spreadsheet Anda</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const gasCodeText = `/**
 * SIAS (Sistem Informasi Absensi Sekolah) - Google Apps Script Backend Web App
 * Target Database Sheets:
 * 1. Pengaturan      -> Kunci & Nilai Konfigurasi Sekolah & Jam [kunci, nilai]
 * 2. JadwalGuru      -> Jadwal Fleksibel Guru [id_jadwal, id_guru, nama_guru, hari, jam_masuk_mulai, jam_masuk_batas, jam_pulang_mulai]
 * 3. JadwalPelajaran -> Jadwal Pelajaran Guru [id_jadwal, hari, id_jam, jam_ke, jam_mulai, jam_selesai, kelas, mapel, id_guru, nama_guru, ruangan]
 * 4. JamPelajaran    -> Master Jam Pelajaran [id_jam, nama_sesi, jam_ke, jam_mulai, jam_selesai, keterangan]
 * 5. PresensiGuru    -> Pencatatan Presensi Guru Fleksibel [id_log_guru, tanggal, id_guru, nama_guru, jam_masuk, status_masuk, jam_pulang, status_pulang, ket]
 * 6. AbsensiMengajar -> Pencatatan Presensi Guru Jadwal Mengajar [id_log_mengajar, tanggal, waktu_absen, hari, id_guru, nama_guru, kelas, mapel, jam_ke, jam_mulai_jadwal, jam_selesai_jadwal, status, catatan_materi]
 * 7. PresensiSiswa   -> Presensi Harian Siswa [id_log_siswa, tanggal, id_siswa, nama_siswa, kelas_jurusan, jam_masuk, status_masuk, jam_pulang, status_pulang, ket]
 * 8. DataGuru, DataSiswa, DataKelas, HariLibur
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000);
  try {
    var rawData = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    var action = rawData.action || "";
    var targetSheet = rawData.target_sheet || rawData.sheet_name || rawData.targetSheet || "";
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var tz = ss.getSpreadsheetTimeZone() || "Asia/Jakarta";
    
    function getOrMakeSheet(name, headers) {
      var s = ss.getSheetByName(name);
      if (!s) {
        s = ss.insertSheet(name);
        if (headers && headers.length > 0) s.appendRow(headers);
      }
      return s;
    }

    // 0. Pengaturan (Settings & Operational Hours)
    if (action === "getPengaturanSemua" || action === "getPengaturan" || action === "getPengaturanJam" || action === "getKonfigurasiJam") {
      var s = getOrMakeSheet("Pengaturan", ["kunci", "nilai"]);
      var rawList = getSheetObjects(s);
      var configObj = {};
      for (var i = 0; i < rawList.length; i++) {
        var k = String(rawList[i].kunci || rawList[i].key || "").trim();
        var v = rawList[i].nilai !== undefined ? rawList[i].nilai : rawList[i].value;
        if (k) configObj[k] = v;
      }
      return jsonResponse({ success: true, data: configObj, ...configObj });
    }
    if (action === "simpanPengaturanCustom" || action === "simpanPengaturanJam" || action === "simpanPengaturan" || action === "simpanKonfigurasiJam") {
      var s = getOrMakeSheet("Pengaturan", ["kunci", "nilai"]);
      var payload = rawData.args && rawData.args[0] && typeof rawData.args[0] === "object" ? rawData.args[0] : rawData;
      upsertPengaturan(s, payload, tz);
      return jsonResponse({ success: true, message: "Pengaturan berhasil disimpan!", data: payload });
    }

    // 1. JadwalGuru (Jadwal Fleksibel Guru)
    if (action === "getJadwalGuruSemua" || action === "getJadwalGuru") {
      var s = getOrMakeSheet("JadwalGuru", ["id_jadwal", "id_guru", "nama_guru", "hari", "jam_masuk_mulai", "jam_masuk_batas", "jam_pulang_mulai"]);
      var data = getSheetObjects(s);
      return jsonResponse({ success: true, data: data, JadwalGuru: data });
    }
    if (action === "tambahJadwalGuru" || action === "simpanJadwalGuru") {
      var s = getOrMakeSheet("JadwalGuru", ["id_jadwal", "id_guru", "nama_guru", "hari", "jam_masuk_mulai", "jam_masuk_batas", "jam_pulang_mulai"]);
      var p = rawData;
      s.appendRow([
        p.id_jadwal || ("J-" + Date.now()),
        p.id_guru || "",
        p.nama_guru || "",
        p.hari || "",
        cleanTimeStr(p.jam_masuk_mulai, "06:00"),
        cleanTimeStr(p.jam_masuk_batas, "07:15"),
        cleanTimeStr(p.jam_pulang_mulai, "15:30")
      ]);
      return jsonResponse({ success: true, message: "Jadwal guru berhasil disimpan!" });
    }

    // 2. JadwalPelajaran (Jadwal Pelajaran Guru)
    if (action === "getJadwalPelajaranSemua" || action === "getJadwalPelajaran" || action === "getJadwalSemua") {
      var s = getOrMakeSheet("JadwalPelajaran", ["id_jadwal", "hari", "id_jam", "jam_ke", "jam_mulai", "jam_selesai", "kelas", "mapel", "id_guru", "nama_guru", "ruangan"]);
      var data = getSheetObjects(s);
      return jsonResponse({ success: true, data: data, JadwalPelajaran: data });
    }
    if (action === "tambahJadwalPelajaran" || action === "simpanJadwalPelajaran") {
      var s = getOrMakeSheet("JadwalPelajaran", ["id_jadwal", "hari", "id_jam", "jam_ke", "jam_mulai", "jam_selesai", "kelas", "mapel", "id_guru", "nama_guru", "ruangan"]);
      var p = rawData;
      s.appendRow([
        p.id_jadwal || ("JPEL-" + Date.now()),
        p.hari || "",
        p.id_jam || "",
        p.jam_ke || 1,
        cleanTimeStr(p.jam_mulai, ""),
        cleanTimeStr(p.jam_selesai, ""),
        p.kelas || "",
        p.mapel || "",
        p.id_guru || "",
        p.nama_guru || "",
        p.ruangan || "-"
      ]);
      return jsonResponse({ success: true, message: "Jadwal pelajaran berhasil disimpan!" });
    }

    // 3. JamPelajaran (Master Jam Pelajaran)
    if (action === "getJamPelajaran" || action === "getJamPelajaranSemua") {
      var s = getOrMakeSheet("JamPelajaran", ["id_jam", "nama_sesi", "jam_ke", "jam_mulai", "jam_selesai", "keterangan"]);
      var data = getSheetObjects(s);
      return jsonResponse({ success: true, data: data, JamPelajaran: data });
    }

    // 4. PresensiGuru (Presensi Guru Fleksibel / Harian)
    if (action === "getPresensiGuru" || action === "getLaporanGuru") {
      var s = getOrMakeSheet("PresensiGuru", ["id_log_guru", "tanggal", "id_guru", "nama_guru", "jam_masuk", "status_masuk", "jam_pulang", "status_pulang", "ket"]);
      var data = getSheetObjects(s);
      return jsonResponse({ success: true, data: data, PresensiGuru: data });
    }
    if (action === "catatAbsensiGuru" || (action === "simpanAbsenManual" && rawData.kategori === "Guru") || (action === "prosesScanQR" && targetSheet === "PresensiGuru")) {
      var s = getOrMakeSheet("PresensiGuru", ["id_log_guru", "tanggal", "id_guru", "nama_guru", "jam_masuk", "status_masuk", "jam_pulang", "status_pulang", "ket"]);
      var p = rawData;
      upsertPresensiGuru(s, p, tz);
      return jsonResponse({ success: true, message: "Presensi guru berhasil dicatat di PresensiGuru!" });
    }
    
    // 5. AbsensiMengajar (Presensi Guru Berdasarkan Jadwal Pelajaran)
    if (action === "getAbsensiMengajarGuru" || action === "getAbsensiMengajar") {
      var s = getOrMakeSheet("AbsensiMengajar", ["id_log_mengajar", "tanggal", "waktu_absen", "hari", "id_guru", "nama_guru", "kelas", "mapel", "jam_ke", "jam_mulai_jadwal", "jam_selesai_jadwal", "status", "catatan_materi"]);
      var data = getSheetObjects(s);
      return jsonResponse({ success: true, data: data, AbsensiMengajar: data });
    }
    if (action === "simpanAbsensiMengajar" || action === "simpanAbsensiMengajarGuru" || action === "catatAbsensiMengajar" || (action === "prosesScanQR" && targetSheet === "AbsensiMengajar")) {
      var s = getOrMakeSheet("AbsensiMengajar", ["id_log_mengajar", "tanggal", "waktu_absen", "hari", "id_guru", "nama_guru", "kelas", "mapel", "jam_ke", "jam_mulai_jadwal", "jam_selesai_jadwal", "status", "catatan_materi"]);
      var p = rawData;
      upsertAbsensiMengajar(s, p, tz);
      return jsonResponse({ success: true, message: "Presensi mengajar guru berhasil dicatat di AbsensiMengajar!" });
    }

    // 6. PresensiSiswa (Presensi Siswa Harian)
    if (action === "getPresensiSiswa" || action === "getLaporanSiswa") {
      var s = getOrMakeSheet("PresensiSiswa", ["id_log_siswa", "tanggal", "id_siswa", "nama_siswa", "kelas_jurusan", "jam_masuk", "status_masuk", "jam_pulang", "status_pulang", "ket"]);
      var data = getSheetObjects(s);
      return jsonResponse({ success: true, data: data, PresensiSiswa: data });
    }
    if (action === "catatAbsensiSiswa" || (action === "simpanAbsenManual" && rawData.kategori === "Siswa") || (action === "prosesScanQR" && targetSheet === "PresensiSiswa")) {
      var s = getOrMakeSheet("PresensiSiswa", ["id_log_siswa", "tanggal", "id_siswa", "nama_siswa", "kelas_jurusan", "jam_masuk", "status_masuk", "jam_pulang", "status_pulang", "ket"]);
      var p = rawData;
      upsertPresensiSiswa(s, p, tz);
      return jsonResponse({ success: true, message: "Presensi siswa berhasil dicatat di PresensiSiswa!" });
    }

    // 7. Backup & Restore Spreadsheet ke Google Drive
    if (action === "backupSpreadsheetToDrive" || action === "backupSpreadsheetGoogleDrive" || action === "duplikasiSpreadsheet") {
      var folderId = rawData.args && rawData.args[0] ? String(rawData.args[0]).trim() : (rawData.driveFolderId || "");
      var targetFolder = folderId ? DriveApp.getFolderById(folderId) : DriveApp.getRootFolder();
      var fileId = ss.getId();
      var file = DriveApp.getFileById(fileId);
      var dateStr = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd_HH-mm");
      var backupFileName = "Backup_Spreadsheet_SIAS_" + dateStr;
      var copyFile = file.makeCopy(backupFileName, targetFolder);
      return jsonResponse({
        success: true,
        message: "Backup file Spreadsheet (" + backupFileName + ") berhasil dibuat di Google Drive!",
        fileId: copyFile.getId(),
        fileUrl: copyFile.getUrl(),
        fileName: backupFileName
      });
    }

    if (action === "backupDatabaseToDrive") {
      var folderId = rawData.args && rawData.args[0] ? String(rawData.args[0]).trim() : (rawData.driveFolderId || "");
      var targetFolder = folderId ? DriveApp.getFolderById(folderId) : DriveApp.getRootFolder();
      var dateStr = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd_HH-mm");
      var backupFileName = "Backup_Database_SIAS_" + dateStr + ".json";
      var fullData = {
        timestamp: Utilities.formatDate(new Date(), tz, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        JadwalGuru: getSheetObjects(getOrMakeSheet("JadwalGuru")),
        JadwalPelajaran: getSheetObjects(getOrMakeSheet("JadwalPelajaran")),
        JamPelajaran: getSheetObjects(getOrMakeSheet("JamPelajaran")),
        PresensiGuru: getSheetObjects(getOrMakeSheet("PresensiGuru")),
        AbsensiMengajar: getSheetObjects(getOrMakeSheet("AbsensiMengajar")),
        PresensiSiswa: getSheetObjects(getOrMakeSheet("PresensiSiswa")),
        DataSiswa: getSheetObjects(getOrMakeSheet("DataSiswa")),
        DataGuru: getSheetObjects(getOrMakeSheet("DataGuru")),
        DataKelas: getSheetObjects(getOrMakeSheet("DataKelas")),
        HariLibur: getSheetObjects(getOrMakeSheet("HariLibur")),
        Pengaturan: getSheetObjects(getOrMakeSheet("Pengaturan"))
      };
      var jsonFile = targetFolder.createFile(backupFileName, JSON.stringify(fullData, null, 2), "application/json");
      return jsonResponse({
        success: true,
        message: "Backup JSON Database (" + backupFileName + ") berhasil disimpan di Google Drive!",
        fileId: jsonFile.getId(),
        fileUrl: jsonFile.getUrl(),
        fileName: backupFileName
      });
    }
    
    return jsonResponse({ success: true, message: "OK" });
  } catch (err) {
    return jsonResponse({ success: false, message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function cleanTimeStr(val, defaultVal) {
  if (val === null || val === undefined || val === "") return defaultVal !== undefined ? defaultVal : "";
  if (val instanceof Date) {
    return Utilities.formatDate(val, "Asia/Jakarta", "HH:mm");
  }
  var str = String(val).trim();
  if (str.indexOf("T") !== -1) {
    try {
      var d = new Date(str);
      if (!isNaN(d.getTime())) {
        return Utilities.formatDate(d, "Asia/Jakarta", "HH:mm");
      }
    } catch(e) {}
    var timePart = str.split("T")[1];
    if (timePart) str = timePart;
  }
  str = str.replace(/\\./g, ":");
  var match = str.match(/(\\d{1,2}):(\\d{1,2})/);
  if (match) {
    var h = parseInt(match[1], 10);
    var m = parseInt(match[2], 10);
    if (!isNaN(h) && !isNaN(m)) {
      return (h < 10 ? "0" + h : "" + h) + ":" + (m < 10 ? "0" + m : "" + m);
    }
  }
  return defaultVal !== undefined ? defaultVal : str;
}

function upsertPengaturan(sheet, obj, tz) {
  var data = sheet.getDataRange().getValues();
  var keyMap = {};
  for (var i = 1; i < data.length; i++) {
    var k = String(data[i][0] || "").trim();
    if (k) keyMap[k] = i + 1; // row number
  }

  for (var key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    var val = obj[key];
    if (typeof val === "object" && val !== null) continue;
    var cleanVal = String(val !== undefined ? val : "");
    if (key.indexOf("jam_") === 0 || key.indexOf("backupJam") === 0) {
      cleanVal = cleanTimeStr(cleanVal, cleanVal);
    }
    if (keyMap[key]) {
      sheet.getRange(keyMap[key], 2).setValue(cleanVal);
    } else {
      sheet.appendRow([key, cleanVal]);
    }
  }
}

function upsertAbsensiMengajar(sheet, p, tz) {
  var data = sheet.getDataRange().getValues();
  var tgl = p.tanggal || Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
  var waktuAbsen = cleanTimeStr(p.waktu_absen, Utilities.formatDate(new Date(), tz, "HH:mm"));
  var idGuru = String(p.id_guru || "").trim().toLowerCase();
  var kelas = String(p.kelas || "").trim().toLowerCase();
  var jamKe = Number(p.jam_ke || 1);

  for (var i = 1; i < data.length; i++) {
    var rowTgl = String(data[i][1]);
    var rowGuru = String(data[i][4]).trim().toLowerCase();
    var rowKelas = String(data[i][6]).trim().toLowerCase();
    var rowJamKe = Number(data[i][8]);

    if (rowTgl.indexOf(tgl) !== -1 && rowGuru === idGuru && rowKelas === kelas && rowJamKe === jamKe) {
      sheet.getRange(i + 1, 3).setValue(waktuAbsen);
      sheet.getRange(i + 1, 12).setValue(p.status || "Hadir Tepat Waktu");
      if (p.catatan_materi) sheet.getRange(i + 1, 13).setValue(p.catatan_materi);
      return;
    }
  }

  sheet.appendRow([
    p.id_log_mengajar || ("LOG-MENG-" + Date.now()),
    tgl,
    waktuAbsen,
    p.hari || "Senin",
    p.id_guru || "",
    p.nama_guru || "",
    p.kelas || "-",
    p.mapel || "-",
    jamKe,
    cleanTimeStr(p.jam_mulai_jadwal, "07:00"),
    cleanTimeStr(p.jam_selesai_jadwal, "07:45"),
    p.status || "Hadir Tepat Waktu",
    p.catatan_materi || "Presensi Barcode/QR"
  ]);
}

function upsertPresensiGuru(sheet, p, tz) {
  var data = sheet.getDataRange().getValues();
  var tgl = p.tanggal || Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
  var idGuru = String(p.id_guru || p.id_target || "").trim().toLowerCase();

  for (var i = 1; i < data.length; i++) {
    var rowTgl = String(data[i][1]);
    var rowGuru = String(data[i][2]).trim().toLowerCase();

    if (rowTgl.indexOf(tgl) !== -1 && rowGuru === idGuru) {
      if (p.jam_masuk && p.jam_masuk !== "-") {
        sheet.getRange(i + 1, 5).setValue(cleanTimeStr(p.jam_masuk, "07:00"));
        sheet.getRange(i + 1, 6).setValue(p.status_masuk || "Tepat Waktu");
      }
      if (p.jam_pulang && p.jam_pulang !== "-") {
        sheet.getRange(i + 1, 7).setValue(cleanTimeStr(p.jam_pulang, "15:30"));
        sheet.getRange(i + 1, 8).setValue(p.status_pulang || "Sudah Pulang");
      }
      if (p.ket) sheet.getRange(i + 1, 9).setValue(p.ket);
      return;
    }
  }

  sheet.appendRow([
    p.id_log_guru || ("LOG-G-" + Date.now()),
    tgl,
    p.id_guru || p.id_target || "",
    p.nama_guru || "",
    cleanTimeStr(p.jam_masuk, "-"),
    p.status_masuk || "Tepat Waktu",
    cleanTimeStr(p.jam_pulang, "-"),
    p.status_pulang || "-",
    p.ket || "Scan Auto Board"
  ]);
}

function upsertPresensiSiswa(sheet, p, tz) {
  var data = sheet.getDataRange().getValues();
  var tgl = p.tanggal || Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
  var idSiswa = String(p.id_siswa || p.id_target || "").trim().toLowerCase();

  for (var i = 1; i < data.length; i++) {
    var rowTgl = String(data[i][1]);
    var rowSiswa = String(data[i][2]).trim().toLowerCase();

    if (rowTgl.indexOf(tgl) !== -1 && rowSiswa === idSiswa) {
      if (p.jam_masuk && p.jam_masuk !== "-") {
        sheet.getRange(i + 1, 6).setValue(cleanTimeStr(p.jam_masuk, "07:00"));
        sheet.getRange(i + 1, 7).setValue(p.status_masuk || "Tepat Waktu");
      }
      if (p.jam_pulang && p.jam_pulang !== "-") {
        sheet.getRange(i + 1, 8).setValue(cleanTimeStr(p.jam_pulang, "15:30"));
        sheet.getRange(i + 1, 9).setValue(p.status_pulang || "Sudah Pulang");
      }
      if (p.ket) sheet.getRange(i + 1, 10).setValue(p.ket);
      return;
    }
  }

  sheet.appendRow([
    p.id_log_siswa || ("LOG-S-" + Date.now()),
    tgl,
    p.id_siswa || p.id_target || "",
    p.nama_siswa || "",
    p.kelas_jurusan || "-",
    cleanTimeStr(p.jam_masuk, "-"),
    p.status_masuk || "Tepat Waktu",
    cleanTimeStr(p.jam_pulang, "-"),
    p.status_pulang || "-",
    p.ket || "Scan Auto Board"
  ]);
}

function getSheetObjects(sheet) {
  var values = sheet.getDataRange().getValues();
  var dispValues = sheet.getDataRange().getDisplayValues();
  if (values.length <= 1) return [];
  var headers = values[0];
  var result = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var dispRow = dispValues[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var headerName = String(headers[j] || "").trim();
      var val = row[j];
      var dispVal = dispRow ? dispRow[j] : "";
      
      if (val instanceof Date) {
        if (val.getFullYear() <= 1900 || headerName.indexOf("jam") !== -1 || headerName.indexOf("waktu") !== -1) {
          obj[headerName] = Utilities.formatDate(val, "Asia/Jakarta", "HH:mm");
        } else if (headerName.indexOf("tanggal") !== -1 || headerName.indexOf("tgl") !== -1) {
          obj[headerName] = Utilities.formatDate(val, "Asia/Jakarta", "yyyy-MM-dd");
        } else {
          obj[headerName] = dispVal || Utilities.formatDate(val, "Asia/Jakarta", "yyyy-MM-dd HH:mm");
        }
      } else if (typeof val === "string" && (val.indexOf("1899-") !== -1 || val.indexOf("1900-") !== -1)) {
        obj[headerName] = cleanTimeStr(val, dispVal || val);
      } else {
        obj[headerName] = val;
      }
    }
    result.push(obj);
  }
  return result;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}`;
                  navigator.clipboard.writeText(gasCodeText);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2500);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {copiedCode ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? "Skrip Disalin!" : "Salin Skrip Apps Script"}</span>
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto max-h-60 border border-slate-800">
              <pre>
{`// Target Database Sheets SIAS:
// 1. JadwalGuru      -> [id_jadwal, id_guru, nama_guru, hari, jam_masuk_mulai, jam_masuk_batas, jam_pulang_mulai]
// 2. JadwalPelajaran -> [id_jadwal, hari, id_jam, jam_ke, jam_mulai, jam_selesai, kelas, mapel, id_guru, nama_guru, ruangan]
// 3. PresensiGuru    -> [id_log_guru, tanggal, id_guru, nama_guru, jam_masuk, status_masuk, jam_pulang, status_pulang, ket]
// 4. AbsensiMengajar -> [id_log_mengajar, tanggal, waktu_absen, hari, id_guru, nama_guru, kelas, mapel, jam_ke, jam_mulai_jadwal, jam_selesai_jadwal, status, catatan_materi]
// 5. PresensiSiswa   -> [id_log_siswa, tanggal, id_siswa, nama_siswa, kelas_jurusan, jam_masuk, status_masuk, jam_pulang, status_pulang, ket]`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BACKUP & RESTORE DATABASE (DRIVE & SPREADSHEET) */}
      {activeTab === "backup" && (
        <div className="space-y-6">
          {/* Status & Overview Bar */}
          <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-indigo-950 rounded-2xl p-5 md:p-6 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-emerald-500/20">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-400/30 text-emerald-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-white">Pusat Cadangan & Pemulihan Database</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    v3.0 Multi-Format
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Mendukung format <b>Spreadsheet Excel (.xlsx)</b>, <b>Snapshot Google Spreadsheet Drive</b>, dan <b>File JSON</b>
                </p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-4 py-2 rounded-xl border border-white/10 text-right self-stretch sm:self-auto flex sm:flex-col justify-between items-center sm:items-end">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300">Terakhir Cadangan</span>
              <span className="text-xs font-mono font-extrabold text-emerald-300">{lastBackupTime}</span>
            </div>
          </div>

          {/* Dual Action Cards: Spreadsheet vs JSON */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. KARTU CADANGAN SPREADSHEET EXCEL (.XLSX) & GOOGLE DRIVE */}
            <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6 md:p-7 space-y-5 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-0 pointer-events-none opacity-60"></div>
              
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                        <span>Cadangan Spreadsheet (Excel / Sheets)</span>
                      </h3>
                      <p className="text-[11px] text-emerald-600 font-semibold">Format Buku Kerja Multi-Sheet (.xlsx) & Drive</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                    Direkomendasikan
                  </span>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">
                  Ekspor dan pulihkan seluruh basis data SIAS ke file Spreadsheet Excel multi-sheet terstruktur lengkap (<b>DataSiswa, DataGuru, DataKelas, JadwalGuru, JadwalPelajaran, JamPelajaran, PresensiSiswa, PresensiGuru, AbsensiMengajar, HariLibur, Pengaturan, Users</b>) atau sinkronkan salinan ke Google Drive.
                </p>

                {/* Badges of included sheets */}
                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/80 space-y-1.5">
                  <div className="text-[10px] font-bold text-emerald-900 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>12 Lembar Kerja (Sheets) Lengkap Terintegrasi:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {["DataSiswa", "DataGuru", "DataKelas", "JadwalGuru", "JadwalPelajaran", "JamPelajaran", "PresensiSiswa", "PresensiGuru", "AbsensiMengajar", "HariLibur", "Pengaturan", "Users"].map((s) => (
                      <span key={s} className="px-1.5 py-0.5 rounded bg-white text-[10px] font-mono font-medium text-emerald-800 border border-emerald-200/60 shadow-2xs">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative z-10 space-y-2.5 pt-2 border-t border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleExportDatabaseSpreadsheet}
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs px-4 py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Excel (.xlsx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBackupSpreadsheetToDrive}
                    disabled={loading}
                    className="bg-slate-800 hover:bg-slate-900 active:bg-black text-white font-extrabold text-xs px-4 py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Cloud className="w-4 h-4 text-emerald-400" />
                    <span>Salin ke Google Drive</span>
                  </button>
                </div>

                {/* Restore Excel Input */}
                <label className="w-full bg-emerald-50 hover:bg-emerald-100/80 active:bg-emerald-100 text-emerald-900 border border-emerald-300/70 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4 text-emerald-700" />
                  <span>Pulihkan / Restore dari File Excel (.xlsx)</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleRestoreSpreadsheetFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* 2. KARTU CADANGAN JSON (FULL SNAPSHOT) */}
            <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 md:p-7 space-y-5 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-0 pointer-events-none opacity-60"></div>

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                      <FileJson className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-900">Cadangan Full JSON</h3>
                      <p className="text-[11px] text-blue-600 font-semibold">Format Raw Object Snapshot (.json)</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
                    System Raw
                  </span>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">
                  Cadangkan data dalam format JSON standar untuk keperluan backup program, pemindahan antar server, atau restore instan struktur konfigurasi dan log aktivitas lengkap.
                </p>

                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/80 space-y-1">
                  <div className="text-[10px] font-bold text-blue-900 flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-blue-600" />
                    <span>Isi Paket Snapshot JSON:</span>
                  </div>
                  <p className="text-[11px] text-blue-800/80">
                    Seluruh array tabel master, relasi jam, konfigurasi kartu, token otentikasi, dan riwayat presensi harian.
                  </p>
                </div>
              </div>

              <div className="relative z-10 space-y-2.5 pt-2 border-t border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleExportDatabaseJSON}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-xs px-4 py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh File JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBackupToDrive}
                    disabled={loading}
                    className="bg-slate-800 hover:bg-slate-900 active:bg-black text-white font-extrabold text-xs px-4 py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Cloud className="w-4 h-4 text-blue-400" />
                    <span>Simpan JSON ke Drive</span>
                  </button>
                </div>

                {/* Restore JSON Input */}
                <label className="w-full bg-blue-50 hover:bg-blue-100/80 active:bg-blue-100 text-blue-900 border border-blue-300/70 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4 text-blue-700" />
                  <span>Pulihkan / Restore dari File JSON (.json)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestoreJSONFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Google Drive Configuration & Auto Schedule Form */}
          <form onSubmit={handleSaveBackupConfig} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-gray-900">Konfigurasi Folder Google Drive & Auto-Backup</h2>
                <p className="text-xs text-gray-500">Tentukan folder tujuan cloud di Google Drive dan atur jadwal pencadangan berkala</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mode Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Mode Pencadangan</label>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setBackupMode("manual")}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                      backupMode === "manual" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    Manual (Tombol)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBackupMode("otomatis")}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                      backupMode === "otomatis" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    Otomatis (Jadwal)
                  </button>
                </div>
              </div>

              {/* Drive Folder ID */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Google Drive Folder ID / URL Folder</label>
                <input
                  type="text"
                  value={driveFolderId}
                  onChange={(e) => setDriveFolderId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 font-mono focus:outline-none focus:border-indigo-500"
                  placeholder="Contoh ID: 1A2b3C4d5E... atau biarkan kosong untuk Root Drive"
                />
                <p className="text-[10px] text-gray-400">Kosongkan jika ingin mencadangkan ke Root Google Drive utama.</p>
              </div>

              {/* Automatic Backup Options */}
              {backupMode === "otomatis" && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700">Frekuensi Auto-Backup</label>
                    <select
                      value={backupFrekuensi}
                      onChange={(e) => setBackupFrekuensi(e.target.value as any)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 font-bold focus:outline-none focus:border-indigo-500"
                    >
                      <option value="harian">Setiap Hari (Harian)</option>
                      <option value="mingguan">Setiap Minggu (Mingguan)</option>
                      <option value="bulanan">Setiap Bulan (Bulanan)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700">Jam Eksekusi Auto-Backup</label>
                    <input
                      type="time"
                      value={backupJam}
                      onChange={(e) => setBackupJam(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 font-mono font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-5">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan Backup & Drive</span>
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Modal Tambah / Edit Slot Jam Pelajaran */}
      {showJamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900">
                    {editJamId ? "Edit Slot Jam Pelajaran" : "Tambah Slot Jam Pelajaran"}
                  </h3>
                  <p className="text-[11px] text-gray-500">Tentukan urutan jam, nama sesi, dan jam mulai - selesai</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowJamModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveJamSlot} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Urutan / Jam Ke</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={jamForm.jam_ke}
                    onChange={(e) => {
                      const num = Number(e.target.value);
                      setJamForm({
                        ...jamForm,
                        jam_ke: num,
                        nama_jam: jamForm.tipe === "Pelajaran" ? `Jam ke-${num}` : jamForm.nama_jam
                      });
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Tipe Slot</label>
                  <select
                    value={jamForm.tipe}
                    onChange={(e) => {
                      const newTipe = e.target.value as any;
                      setJamForm({
                        ...jamForm,
                        tipe: newTipe,
                        nama_jam: newTipe === "Istirahat" ? "Istirahat" : newTipe === "Upacara" ? "Upacara Bendera" : `Jam ke-${jamForm.jam_ke}`
                      });
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-blue-500"
                  >
                    <option value="Pelajaran">Pelajaran</option>
                    <option value="Istirahat">Istirahat</option>
                    <option value="Upacara">Upacara</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Nama / Label Sesi Jam</label>
                <input
                  type="text"
                  required
                  value={jamForm.nama_jam}
                  onChange={(e) => setJamForm({ ...jamForm, nama_jam: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-blue-500"
                  placeholder="Misal: Jam ke-1 / Istirahat Pagi / Upacara"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Jam Mulai</label>
                  <input
                    type="time"
                    required
                    value={jamForm.jam_mulai}
                    onChange={(e) => setJamForm({ ...jamForm, jam_mulai: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Jam Selesai</label>
                  <input
                    type="time"
                    required
                    value={jamForm.jam_selesai}
                    onChange={(e) => setJamForm({ ...jamForm, jam_selesai: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowJamModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-extrabold text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Slot</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Loading Overlay */}
      {loadingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 flex flex-col items-center gap-3 max-w-sm w-full mx-4 text-center">
            <div className="relative flex items-center justify-center w-14 h-14">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full border-t-4 border-indigo-600 animate-spin"></div>
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin relative z-10" />
            </div>
            <div>
              <h4 className="font-bold text-gray-800 text-sm">{loadingAction}</h4>
              <p className="text-xs text-gray-400 mt-1">Mohon tunggu sebentar, sedang menyimpan pengaturan...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
