/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, useMemo, FormEvent } from "react";
import { 
  Scan, 
  UserCheck, 
  Clock, 
  Volume2, 
  VolumeX, 
  Camera, 
  CameraOff, 
  UserPlus, 
  Users, 
  AlertCircle,
  Search,
  Filter,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Usb,
  Keyboard,
  Zap,
  HelpCircle,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Info,
  Calendar,
  Edit3,
  BookOpen,
  Plus,
  Trash2,
  FileText,
  Check,
  Layers,
  GraduationCap,
  ArrowRight,
  SlidersHorizontal,
  Maximize2
} from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { callGas, getStorageKey, setStorage, getStorage, extractArrayData, isInvalidWali, parseTimeToMinutes } from "../lib/gasApi";
import { LiveAbsen, ScheduleLessonItem, AbsensiMengajarItem, JamPelajaranItem } from "../types";

const HARI_MAP_INDEX: Record<number, string> = {
  0: "Minggu",
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu"
};

export default function AbsensiScanner({ session }: { session?: any }) {
  // Main Attendance Tab: "harian" (Arrival/Departure) vs "mengajar" (Teaching Schedule Attendance)
  const [attendanceType, setAttendanceType] = useState<"harian" | "mengajar">("harian");

  const [kategori, setKategori] = useState<"Siswa" | "Guru">("Siswa");
  const [mode, setMode] = useState<"Masuk" | "Pulang">(() => {
    const hour = new Date().getHours();
    return hour < 12 ? "Masuk" : "Pulang";
  });
  
  // Loading & Processing Indicators
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  
  // Speed & Turbo Scan States
  const [fastMode, setFastMode] = useState<"normal" | "express" | "turbo">("turbo");
  const [autoTimeSwitch, setAutoTimeSwitch] = useState<boolean>(true);
  const [screenFlash, setScreenFlash] = useState<"success" | "error" | null>(null);
  const [scanQueue, setScanQueue] = useState<Array<{
    id: string;
    code: string;
    name?: string;
    role?: string;
    subDetail?: string;
    statusText?: string;
    timestamp: string;
    status: "pending" | "success" | "error";
    message?: string;
  }>>([]);
  const [recentScanTimes, setRecentScanTimes] = useState<number[]>([]);

  // Scanner Type: "hardware" (USB/Bluetooth Scanner / HID) vs "camera"
  const [scanMethod, setScanMethod] = useState<"hardware" | "camera">("hardware");

  // Hardware Scanner Input
  const [barcodeInput, setBarcodeInput] = useState("");
  const [autoFocusLock, setAutoFocusLock] = useState(true);
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);

  // Camera Scanner States
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");

  // Sound & Speech Feedback States
  const [audioMuted, setAudioMuted] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  // Logs & Table States (Harian)
  const [recentLogs, setRecentLogs] = useState<LiveAbsen[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKelas, setFilterKelas] = useState("Semua");
  const [filterHariGuru, setFilterHariGuru] = useState<string>("Sesuai Tanggal");
  const [classList, setClassList] = useState<string[]>([]);
  const [filterTanggal, setFilterTanggal] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Manual Dialog States (Harian)
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualTarget, setManualTarget] = useState<string>("");
  const [manualStatus, setManualStatus] = useState<string>("Hadir (Auto)");
  const [manualJam, setManualJam] = useState<string>("07:00");
  const [manualKet, setManualKet] = useState<string>("");
  const [manualEditOriginalDate, setManualEditOriginalDate] = useState<string | null>(null);
  const [entitiesList, setEntitiesList] = useState<any[]>([]);
  const [searchManualQuery, setSearchManualQuery] = useState("");

  // Presensi Mengajar Guru States
  const [lessonSchedules, setLessonSchedules] = useState<ScheduleLessonItem[]>([]);
  const [absensiMengajarLogs, setAbsensiMengajarLogs] = useState<AbsensiMengajarItem[]>([]);
  const [itemsPerPageMengajar, setItemsPerPageMengajar] = useState<number>(10);
  const [currentPageMengajar, setCurrentPageMengajar] = useState<number>(1);
  const [itemsPerPageJadwal, setItemsPerPageJadwal] = useState<number>(6);
  const [currentPageJadwal, setCurrentPageJadwal] = useState<number>(1);
  const [jamSlots, setJamSlots] = useState<JamPelajaranItem[]>([]);
  const [batasiJamJadwal, setBatasiJamJadwal] = useState<boolean>(true);
  const [toleransiAwal, setToleransiAwal] = useState<number>(15);
  const [toleransiAkhir, setToleransiAkhir] = useState<number>(30);
  const [toleransiGuru, setToleransiGuru] = useState<number>(15);
  const [isLoadingMengajar, setIsLoadingMengajar] = useState(false);

  const getTodayHari = () => {
    const idx = new Date().getDay();
    return HARI_MAP_INDEX[idx] || "Senin";
  };

  const [selectedDay, setSelectedDay] = useState<string>(getTodayHari());
  const [filterMengajarKelas, setFilterMengajarKelas] = useState<string>("Semua");
  const [filterMengajarGuru, setFilterMengajarGuru] = useState<string>("Semua");
  const [filterMengajarSearch, setFilterMengajarSearch] = useState<string>("");

  // Mengajar Modal Dialog State
  const [showMengajarModal, setShowMengajarModal] = useState(false);
  const [, setSelectedScheduleForAbsen] = useState<ScheduleLessonItem | null>(null);
  const [mengajarForm, setMengajarForm] = useState({
    id_guru: "",
    nama_guru: "",
    kelas: "",
    mapel: "",
    jam_ke: 1,
    jam_mulai_jadwal: "-",
    jam_selesai_jadwal: "-",
    hari: "Senin",
    tanggal: new Date().toISOString().split("T")[0],
    waktu_absen: new Date().toTimeString().slice(0, 5),
    status: "Hadir Tepat Waktu",
    catatan_materi: ""
  });
  const [isSubmittingMengajar, setIsSubmittingMengajar] = useState(false);

  // Guide Toggle
  const [showGuide, setShowGuide] = useState(false);

  // Toast / Status Hero State
  const [scanStatus, setScanStatus] = useState<{ 
    type: "success" | "error" | "info" | null; 
    msg: string | null;
    targetName?: string;
    role?: string;
    details?: string;
    timestamp?: string;
  }>({ type: null, msg: null });

  // User session & roles
  const [currentUser, setCurrentUser] = useState<any>(null);

  const qrReaderRef = useRef<Html5Qrcode | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const lastScanTextRef = useRef<string>("");

  useEffect(() => {
    const saved = localStorage.getItem(getStorageKey("SIAS_SESSION"));
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const activeRole = session?.role || currentUser?.role;
  const isGuru = activeRole === "Guru";

  useEffect(() => {
    if (isGuru) {
      setKategori("Siswa");
      setScanMethod("hardware");
    }
  }, [isGuru]);

  useEffect(() => {
    if (filterTanggal) {
      const d = new Date(filterTanggal + "T00:00:00");
      if (!isNaN(d.getTime())) {
        const dayIdx = d.getDay();
        const dayName = HARI_MAP_INDEX[dayIdx] || "Senin";
        setSelectedDay(dayName);
      }
    }
  }, [filterTanggal]);

  // Audio Beep generator using Web Audio API for zero latency
  const playBeep = (isSuccess = true) => {
    if (audioMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = isSuccess ? "sine" : "triangle";
      osc.frequency.setValueAtTime(isSuccess ? 960 : 260, audioCtx.currentTime);
      if (isSuccess) {
        osc.frequency.setValueAtTime(1280, audioCtx.currentTime + 0.08);
      }
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + (isSuccess ? 0.22 : 0.35));

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + (isSuccess ? 0.22 : 0.35));
    } catch (e) {
      // Audio fallback
    }
  };

  // Text-To-Speech confirmation
  const speakText = (text: string) => {
    if (!speechEnabled || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "id-ID";
      utterance.rate = 1.15;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      // Speech fallback
    }
  };

  // Load Classes
  useEffect(() => {
    async function fetchClasses() {
      try {
        const res = await callGas("getKelasSemua");
        const list = extractArrayData(res);
        let parsed = list.map((item: any) => typeof item === 'string' ? item : (item.nama_kelas || item.kelas || String(item))).filter(Boolean);
        if (!parsed || parsed.length === 0) {
          const stored = getStorage("data_kelas") || [];
          parsed = stored.map((item: any) => typeof item === 'string' ? item : (item.nama_kelas || item.kelas || String(item))).filter(Boolean);
        }
        if (!parsed || parsed.length === 0) {
          parsed = ["X RPL 1", "X RPL 2", "XI RPL 1", "XI RPL 2", "XII RPL 1"];
        }
        setClassList(parsed);

        if (currentUser) {
          const uName = (currentUser.nama_guru || currentUser.username || currentUser.nama || "").toLowerCase();
          const uTargetId = (currentUser.target_id || currentUser.id_guru || "").toLowerCase();
          
          const storedKelas = getStorage("data_kelas") || [];
          const myClass = storedKelas.find((c: any) => {
            const w = (c.wali_kelas || c.wali || c.waliKelas || c.guru_wali || c.nama_guru || "").toLowerCase();
            if (!w || isInvalidWali(w)) return false;
            return (uName && w.includes(uName)) || (uTargetId && w.includes(uTargetId));
          });

          if (myClass && myClass.nama_kelas) {
            setFilterKelas(myClass.nama_kelas);
          } else if (currentUser.role === "Wali Kelas" && currentUser.target_id && currentUser.target_id !== "-") {
            const targetClass = parsed.find((c: string) => c.toLowerCase().replace(/[\s-]+/g, "") === currentUser.target_id.toLowerCase().replace(/[\s-]+/g, ""));
            if (targetClass) {
              setFilterKelas(targetClass);
            }
          }
        }
      } catch (e) {
        const stored = getStorage("data_kelas") || [];
        let parsed = stored.map((item: any) => typeof item === 'string' ? item : (item.nama_kelas || item.kelas || String(item))).filter(Boolean);
        if (!parsed || parsed.length === 0) {
          parsed = ["X RPL 1", "X RPL 2", "XI RPL 1", "XI RPL 2", "XII RPL 1"];
        }
        setClassList(parsed);
      }
    }
    fetchClasses();
  }, [currentUser]);

  // Load live logs based on selected date, category, class filter
  const loadLiveLogs = async (targetDate = filterTanggal, currentKelas = filterKelas, currentHariGuru = filterHariGuru) => {
    setIsLoadingLogs(true);
    try {
      let masterData: any[] = [];
      const masterRes = await callGas("getDataMaster", [kategori]);
      if (masterRes && masterRes.success && Array.isArray(masterRes.data)) {
        masterData = masterRes.data;
      } else if (Array.isArray(masterRes)) {
        masterData = masterRes;
      }

      if (masterData.length > 0) {
        const storageKey = kategori === "Siswa" ? "data_siswa" : "data_guru";
        setStorage(storageKey, masterData);
      }

      const dObj = new Date(targetDate + "T00:00:00");
      const dateDayName = !isNaN(dObj.getTime()) ? (HARI_MAP_INDEX[dObj.getDay()] || "Senin") : "Senin";
      const targetDayGuru = (currentHariGuru && currentHariGuru !== "Sesuai Tanggal") ? currentHariGuru : dateDayName;

      let scheduledTeacherIds = new Set<string>();
      let scheduledTeacherNames = new Set<string>();
      const flexInfoMap = new Map<string, any>();
      let flexList: any[] = [];

      if (kategori === "Guru") {
        const flexRes = await callGas("getJadwalGuruSemua");
        flexList = extractArrayData(flexRes);
        if (!flexList || flexList.length === 0) {
          flexList = getStorage("jadwal_guru") || [];
        }

        const dayFlexList = targetDayGuru === "Semua" 
          ? flexList 
          : flexList.filter((f: any) => String(f.hari || "").trim().toLowerCase() === targetDayGuru.trim().toLowerCase());

        dayFlexList.forEach((f: any) => {
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

      const res = await callGas("getLiveAbsenHariIni", [kategori, targetDate, currentKelas, targetDayGuru]);
      let list = Array.isArray(res) 
        ? res 
        : (res && Array.isArray(res.data) ? res.data : (res?.data || []));

      if (masterData.length > 0) {
        const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
        const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";

        let filteredMaster = masterData;
        if (kategori === "Siswa" && currentKelas && currentKelas !== "Semua") {
          const kFilter = String(currentKelas).toLowerCase().replace(/[\s-]+/g, "");
          filteredMaster = masterData.filter((m: any) => {
            const kVal = String(m.kelas || "").toLowerCase().replace(/[\s-]+/g, "");
            const jVal = String(m.jurusan || "").toLowerCase().replace(/[\s-]+/g, "");
            const kjVal = String(m.kelas_jurusan || "").toLowerCase().replace(/[\s-]+/g, "");
            const combined = `${kVal}${jVal}`;
            return kjVal.includes(kFilter) || kFilter.includes(kjVal) || kVal.includes(kFilter) || kFilter.includes(kVal) || combined.includes(kFilter) || kFilter.includes(combined);
          });
        } else if (kategori === "Guru") {
          if (scheduledTeacherIds.size > 0 || scheduledTeacherNames.size > 0) {
            filteredMaster = masterData.filter((m: any) => {
              const gId = String(m[idKey] || m.id || m.nip_nuptk || "").trim().toLowerCase();
              const gNip = String(m.nip_nuptk || "").trim().toLowerCase();
              const gName = String(m[nameKey] || m.nama || m.name || "").trim().toLowerCase();
              return scheduledTeacherIds.has(gId) || scheduledTeacherIds.has(gNip) || scheduledTeacherNames.has(gName);
            });
          } else if (targetDayGuru !== "Semua" && flexList.length > 0) {
            filteredMaster = [];
          }
        }

        const logMap = new Map<string, any>();
        if (Array.isArray(list)) {
          for (const item of list) {
            const itemKey = String(item.id_target || item.id_siswa || item.id_guru || "").trim().toLowerCase();
            if (itemKey) logMap.set(itemKey, item);
          }
        }

        const reportsKey = kategori === "Siswa" ? "laporan_siswa" : "laporan_guru";
        const localReports = getStorage(reportsKey) || [];
        if (Array.isArray(localReports)) {
          for (const r of localReports) {
            if (String(r.tanggal || "").split("T")[0] === targetDate) {
              const rId = String(r[idKey] || r.id_siswa || r.id_guru || r.id_target || "").trim().toLowerCase();
              if (rId && !logMap.has(rId)) {
                logMap.set(rId, r);
              }
            }
          }
        }

        const mergedList = filteredMaster.map((m: any) => {
          const idTarget = String(m[idKey] || m.id || m.nisn || m.nip_nuptk || "").trim();
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
            const flexObj = flexInfoMap.get(idTarget.toLowerCase()) || flexInfoMap.get(namaTarget.toLowerCase());
            if (flexObj) {
              kelasStr = `Piket: ${flexObj.jam_masuk_mulai || "06:00"}-${flexObj.jam_pulang_mulai || "15:30"}`;
            }
          }

          const existingLog = logMap.get(idTarget.toLowerCase());

          if (existingLog && ((existingLog.jam_masuk && existingLog.jam_masuk !== "-") || (existingLog.status_masuk && existingLog.status_masuk !== "-" && existingLog.status_masuk !== "Belum Absen") || (existingLog.jam_pulang && existingLog.jam_pulang !== "-"))) {
            return {
              ...existingLog,
              id_target: existingLog.id_target || idTarget,
              nama_target: existingLog.nama_target || namaTarget,
              kelas_jurusan: existingLog.kelas_jurusan && existingLog.kelas_jurusan !== "-" ? existingLog.kelas_jurusan : kelasStr,
              tanggal: targetDate,
              status_masuk: existingLog.status_masuk && existingLog.status_masuk !== "-" ? existingLog.status_masuk : "Belum Absen",
              status_pulang: existingLog.status_pulang && existingLog.status_pulang !== "-" ? existingLog.status_pulang : "-"
            };
          }

          return {
            id_target: idTarget,
            nama_target: namaTarget,
            kelas_jurusan: kelasStr,
            tanggal: targetDate,
            jam_masuk: "-",
            status_masuk: "Belum Absen",
            jam_pulang: "-",
            status_pulang: "-",
            no_hp_ortu: m.no_hp_ortu || m.no_hp || "-",
            kategori: kategori,
            ket: "-"
          };
        });

        if (Array.isArray(list)) {
          const matchedIds = new Set(filteredMaster.map((m: any) => String(m[idKey] || m.id || m.nisn || m.nip_nuptk || "").trim().toLowerCase()));
          for (const item of list) {
            const itemKey = String(item.id_target || item.id_siswa || item.id_guru || "").trim().toLowerCase();
            const hasAttended = (item.jam_masuk && item.jam_masuk !== "-") || 
                                (item.status_masuk && item.status_masuk !== "-" && item.status_masuk !== "Belum Absen") || 
                                (item.jam_pulang && item.jam_pulang !== "-");
            if (itemKey && !matchedIds.has(itemKey) && hasAttended) {
              mergedList.push({
                ...item,
                tanggal: targetDate,
                status_masuk: item.status_masuk && item.status_masuk !== "-" ? item.status_masuk : "Belum Absen"
              });
            }
          }
        }

        list = mergedList;
      }

      setRecentLogs(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const getJamSlotTime = (jamKeNum: number, fallbackMulai?: string, fallbackSelesai?: string) => {
    const slot = jamSlots.find(j => Number(j.jam_ke) === Number(jamKeNum));
    const mulai = slot ? slot.jam_mulai : (fallbackMulai && fallbackMulai !== "-" ? fallbackMulai : "-");
    const selesai = slot ? slot.jam_selesai : (fallbackSelesai && fallbackSelesai !== "-" ? fallbackSelesai : "-");
    return { mulai, selesai };
  };

  const fetchMengajarData = async () => {
    setIsLoadingMengajar(true);
    try {
      const [resSchedules, resLogs, , resJam] = await Promise.all([
        callGas("getJadwalPelajaranSemua"),
        callGas("getAbsensiMengajarGuru"),
        callGas("getDataMaster", ["Guru"]),
        callGas("getJamPelajaran")
      ]);

      const scheds = Array.isArray(resSchedules)
        ? resSchedules
        : (resSchedules && Array.isArray(resSchedules.data) ? resSchedules.data : (resSchedules?.data || []));
      setLessonSchedules(scheds);

      const logs = Array.isArray(resLogs)
        ? resLogs
        : (resLogs && Array.isArray(resLogs.data) ? resLogs.data : (resLogs?.data || []));
      setAbsensiMengajarLogs(logs);

      const jams = Array.isArray(resJam)
        ? resJam
        : (resJam && Array.isArray(resJam.data) ? resJam.data : (resJam?.data || []));
      setJamSlots(jams);

      try {
        const resCfg = await callGas("getPengaturanSemua");
        const cfg = resCfg?.data || resCfg;
        if (cfg && typeof cfg === "object") {
          if (cfg.batasi_jam_jadwal !== undefined) setBatasiJamJadwal(Boolean(cfg.batasi_jam_jadwal));
          if (cfg.toleransi_awal_menit !== undefined) setToleransiAwal(Number(cfg.toleransi_awal_menit) || 15);
          if (cfg.toleransi_akhir_menit !== undefined) setToleransiAkhir(Number(cfg.toleransi_akhir_menit) || 30);
          const val = Number(cfg.toleransi_guru ?? cfg.toleransi_mengajar_guru);
          if (!isNaN(val) && val >= 0) setToleransiGuru(val);
        }
      } catch (e) {}
    } catch (err) {
      console.error("Gagal memuat data presensi mengajar:", err);
    } finally {
      setIsLoadingMengajar(false);
    }
  };

  useEffect(() => {
    loadLiveLogs(filterTanggal, filterKelas, filterHariGuru);
  }, [kategori, filterTanggal, filterKelas, filterHariGuru, selectedDay]);

  useEffect(() => {
    fetchMengajarData();
  }, [filterTanggal, selectedDay]);

  const openModalForSchedule = (sched: ScheduleLessonItem, existingLog?: AbsensiMengajarItem) => {
    setSelectedScheduleForAbsen(sched);
    const nowTime = new Date().toTimeString().slice(0, 5);
    const todayStr = filterTanggal || new Date().toISOString().split("T")[0];
    const { mulai: slotMulai, selesai: slotSelesai } = getJamSlotTime(sched.jam_ke, sched.jam_mulai, sched.jam_selesai);

    if (existingLog) {
      setMengajarForm({
        id_guru: existingLog.id_guru || sched.id_guru || "",
        nama_guru: existingLog.nama_guru || sched.nama_guru || "",
        kelas: existingLog.kelas || sched.kelas || "",
        mapel: existingLog.mapel || sched.mapel || "",
        jam_ke: Number(existingLog.jam_ke || sched.jam_ke || 1),
        jam_mulai_jadwal: (existingLog.jam_mulai_jadwal && existingLog.jam_mulai_jadwal !== "-") ? existingLog.jam_mulai_jadwal : slotMulai,
        jam_selesai_jadwal: (existingLog.jam_selesai_jadwal && existingLog.jam_selesai_jadwal !== "-") ? existingLog.jam_selesai_jadwal : slotSelesai,
        hari: existingLog.hari || sched.hari || selectedDay,
        tanggal: existingLog.tanggal || todayStr,
        waktu_absen: existingLog.waktu_absen || nowTime,
        status: (existingLog.status as any) || "Hadir Tepat Waktu",
        catatan_materi: existingLog.catatan_materi || ""
      });
    } else {
      let autoStatus = "Hadir Tepat Waktu";
      if (slotMulai && slotMulai !== "-") {
        const [hM, mM] = slotMulai.split(":").map(Number);
        const [hN, mN] = nowTime.split(":").map(Number);
        if (!isNaN(hM) && !isNaN(mM) && !isNaN(hN) && !isNaN(mN)) {
          const startMin = hM * 60 + mM;
          const nowMin = hN * 60 + mN;
          if (nowMin > startMin + toleransiGuru) {
            autoStatus = "Terlambat Masuk Kelas";
          }
        }
      }

      setMengajarForm({
        id_guru: sched.id_guru || "",
        nama_guru: sched.nama_guru || "",
        kelas: sched.kelas || "",
        mapel: sched.mapel || "",
        jam_ke: Number(sched.jam_ke || 1),
        jam_mulai_jadwal: slotMulai,
        jam_selesai_jadwal: slotSelesai,
        hari: sched.hari || selectedDay,
        tanggal: todayStr,
        waktu_absen: nowTime,
        status: autoStatus,
        catatan_materi: ""
      });
    }
    setShowMengajarModal(true);
  };

  const handleSaveMengajar = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!mengajarForm.nama_guru || !mengajarForm.kelas) {
      alert("Nama guru dan kelas harus terisi.");
      return;
    }

    if (batasiJamJadwal && mengajarForm.jam_mulai_jadwal && mengajarForm.jam_mulai_jadwal !== "-" && mengajarForm.jam_selesai_jadwal && mengajarForm.jam_selesai_jadwal !== "-") {
      const [hM, mM] = mengajarForm.jam_mulai_jadwal.split(":").map(Number);
      const [hS, mS] = mengajarForm.jam_selesai_jadwal.split(":").map(Number);
      const [hN, mN] = mengajarForm.waktu_absen.split(":").map(Number);
      if (!isNaN(hM) && !isNaN(mM) && !isNaN(hS) && !isNaN(mS) && !isNaN(hN) && !isNaN(mN)) {
        const startMin = hM * 60 + mM;
        const endMin = hS * 60 + mS;
        const nowMin = hN * 60 + mN;

        if (nowMin < startMin - toleransiAwal) {
          alert(`Gagal: Belum waktunya presensi untuk jadwal ini. Jam pelajaran dimulai pukul ${mengajarForm.jam_mulai_jadwal}. Saat ini jam ${mengajarForm.waktu_absen}.`);
          return;
        }
        if (nowMin > endMin + toleransiAkhir) {
          alert(`Gagal: Presensi mengajar ditolak. Waktu absen (${mengajarForm.waktu_absen}) di luar jam jadwal pelajaran (${mengajarForm.jam_mulai_jadwal} - ${mengajarForm.jam_selesai_jadwal}).`);
          return;
        }
      }
    }

    setIsSubmittingMengajar(true);
    try {
      const activeDay = mengajarForm.hari || selectedDay;
      const matchingSchedules = lessonSchedules.filter(s =>
        (s.hari || "").toLowerCase() === activeDay.toLowerCase() &&
        (s.id_guru === mengajarForm.id_guru || (s.nama_guru && s.nama_guru.toLowerCase().includes(mengajarForm.nama_guru.toLowerCase()))) &&
        s.kelas.toLowerCase() === mengajarForm.kelas.toLowerCase() &&
        s.mapel.toLowerCase() === mengajarForm.mapel.toLowerCase()
      );

      let savedCount = 0;

      if (matchingSchedules.length > 1) {
        for (const schedItem of matchingSchedules) {
          const { mulai: slotMulai, selesai: slotSelesai } = getJamSlotTime(schedItem.jam_ke, schedItem.jam_mulai, schedItem.jam_selesai);

          const itemPayload = {
            ...mengajarForm,
            jam_ke: Number(schedItem.jam_ke),
            jam_mulai_jadwal: slotMulai !== "-" ? slotMulai : mengajarForm.jam_mulai_jadwal,
            jam_selesai_jadwal: slotSelesai !== "-" ? slotSelesai : mengajarForm.jam_selesai_jadwal
          };
          const res = await callGas("simpanAbsensiMengajarGuru", [itemPayload]);
          if (res && res.success !== false) savedCount++;
        }
      } else {
        const { mulai: slotMulai, selesai: slotSelesai } = getJamSlotTime(mengajarForm.jam_ke, mengajarForm.jam_mulai, mengajarForm.jam_selesai_jadwal);
        const payload = {
          ...mengajarForm,
          jam_mulai_jadwal: slotMulai !== "-" ? slotMulai : mengajarForm.jam_mulai_jadwal,
          jam_selesai_jadwal: slotSelesai !== "-" ? slotSelesai : mengajarForm.jam_selesai_jadwal
        };
        const res = await callGas("simpanAbsensiMengajarGuru", [payload]);
        if (res && res.success !== false) savedCount = 1;
      }

      const jamNumbers = matchingSchedules.map(s => Number(s.jam_ke)).sort((a, b) => a - b);
      const minJam = jamNumbers.length > 0 ? jamNumbers[0] : mengajarForm.jam_ke;
      const maxJam = jamNumbers.length > 0 ? jamNumbers[jamNumbers.length - 1] : mengajarForm.jam_ke;
      const jamLabel = savedCount > 1
        ? `Blok ${savedCount} Jam Pelajaran (Jam ke-${minJam} s/d Jam ke-${maxJam})`
        : `Jam Ke-${mengajarForm.jam_ke}`;

      setScanStatus({
        type: "success",
        msg: `Presensi Mengajar Berhasil!`,
        targetName: mengajarForm.nama_guru,
        role: "Guru",
        details: `Kelas ${mengajarForm.kelas} • ${mengajarForm.mapel} • ${jamLabel}`,
        timestamp: new Date().toLocaleTimeString("id-ID")
      });
      playBeep(true);
      triggerFlash("success");
      if (speechEnabled) speakText("Presensi mengajar tersimpan.");

      setShowMengajarModal(false);
      setSelectedScheduleForAbsen(null);
      await fetchMengajarData();
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.toString());
    } finally {
      setIsSubmittingMengajar(false);
    }
  };

  const handleDeleteMengajar = async (idLog: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus catatan presensi mengajar ini?")) return;
    try {
      const res = await callGas("hapusAbsensiMengajarGuru", [idLog]);
      if (res && res.success) {
        setScanStatus({ type: "success", msg: "Data presensi mengajar berhasil dihapus" });
        await fetchMengajarData();
      } else {
        alert(res?.message || "Gagal menghapus data");
      }
    } catch (err: any) {
      alert("Error: " + err.toString());
    }
  };

  const detectCameras = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(device => device.kind === "videoinput")
        .map((device, index) => ({
          id: device.deviceId,
          label: device.label || `Kamera ${index + 1}`
        }));
      setAvailableCameras(videoDevices);
      if (videoDevices.length > 0 && !selectedCameraId) {
        setSelectedCameraId(videoDevices[0].id);
      }
    } catch (e) {
      console.error("Gagal mendeteksi kamera:", e);
    }
  };

  useEffect(() => {
    detectCameras();
  }, []);

  // Hardware Scanner Focus Manager
  useEffect(() => {
    if (scanMethod === "hardware" && autoFocusLock) {
      const timer = setTimeout(() => {
        if (barcodeInputRef.current && document.activeElement !== barcodeInputRef.current) {
          barcodeInputRef.current.focus();
        }
      }, 80);

      const handleGlobalKeyDown = (e: KeyboardEvent) => {
        // If pressing Enter inside an active modal or textarea, don't hijack
        const target = e.target as HTMLElement;
        if (target && (target.tagName === "TEXTAREA" || target.getAttribute("contenteditable") === "true")) {
          return;
        }

        // Global hotkey: Press Space or Slash or Escape to focus scanner input
        if (e.key === "/" && document.activeElement !== barcodeInputRef.current) {
          e.preventDefault();
          barcodeInputRef.current?.focus();
        }
      };

      window.addEventListener("keydown", handleGlobalKeyDown);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("keydown", handleGlobalKeyDown);
      };
    }
  }, [scanMethod, autoFocusLock, attendanceType]);

  const triggerFlash = (type: "success" | "error") => {
    setScreenFlash(type);
    setTimeout(() => {
      setScreenFlash(null);
    }, 400);
  };

  const scansPerMinute = recentScanTimes.filter(t => Date.now() - t < 60000).length;

  // Process Unified Fast Scan Logic
  const processScanCode = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;

    let activeMode = mode;
    if (autoTimeSwitch) {
      const hour = new Date().getHours();
      activeMode = hour < 12 ? "Masuk" : "Pulang";
      if (activeMode !== mode) setMode(activeMode);
    }

    const now = Date.now();
    const debounceMs = fastMode === "turbo" ? 600 : fastMode === "express" ? 1200 : 2500;

    if (code === lastScanTextRef.current && (now - lastScanTimeRef.current) < debounceMs) {
      setScanStatus({ 
        type: "info", 
        msg: `Scan duplikat dicegah (${code})`,
        details: "Mohon tunggu sejenak untuk scan ID yang sama." 
      });
      playBeep(false);
      return;
    }

    lastScanTextRef.current = code;
    lastScanTimeRef.current = now;
    setRecentScanTimes(prev => [...prev.filter(t => now - t < 60000), now]);

    // Fast reset input field immediately
    setBarcodeInput("");
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
    setIsProcessingScan(true);

    const queueId = Math.random().toString(36).substring(2, 9);
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setScanQueue(prev => [
      { id: queueId, code, timestamp: timeStr, status: "pending", message: "Memproses..." },
      ...prev.slice(0, 9)
    ]);

    try {
      // Smart Backend Dispatch: prosesScanQR handles Auto-detection across Siswa, Guru, and Mengajar
      const scanDate = filterTanggal || new Date().toISOString().split("T")[0];
      const effectiveCategory = attendanceType === "mengajar" ? "Guru" : kategori;
      
      const res = await callGas("prosesScanQR", [code, effectiveCategory, activeMode, scanDate]);

      if (res && res.success !== false) {
        const rowData = res.data || {};
        const isSiswa = res.role === "Siswa" || Boolean(rowData.id_siswa || rowData.nama_siswa);
        const targetName = rowData.nama_siswa || rowData.nama_guru || res.name || code;
        const targetClass = rowData.kelas_jurusan || rowData.kelas || (isSiswa ? "Siswa" : "Guru");
        const statusRecorded = rowData.status_masuk || rowData.status_pulang || rowData.status || "Tepat Waktu";
        const detailsNote = rowData.ket ? `${targetClass} • ${rowData.ket}` : targetClass;

        playBeep(true);
        triggerFlash("success");

        setScanStatus({
          type: "success",
          msg: `Presensi ${activeMode} Berhasil!`,
          targetName,
          role: isSiswa ? "Siswa" : "Guru",
          details: `${targetClass} • Status: ${statusRecorded}`,
          timestamp: timeStr
        });

        if (speechEnabled) {
          speakText(`${targetName}. ${activeMode}.`);
        }

        setScanQueue(prev => prev.map(item =>
          item.id === queueId 
            ? { 
                ...item, 
                status: "success", 
                name: targetName, 
                role: isSiswa ? "Siswa" : "Guru",
                subDetail: targetClass,
                statusText: statusRecorded,
                message: `OK: ${statusRecorded}` 
              } 
            : item
        ));

        // Refresh logs in background
        loadLiveLogs(scanDate, filterKelas, filterHariGuru);
        if (attendanceType === "mengajar") {
          fetchMengajarData();
        }
      } else {
        const errorMsg = res?.message || `Data tidak ditemukan untuk kode: ${code}`;
        playBeep(false);
        triggerFlash("error");

        setScanStatus({
          type: "error",
          msg: `Presensi Ditolak!`,
          targetName: code,
          details: errorMsg,
          timestamp: timeStr
        });

        if (speechEnabled) {
          speakText("Presensi ditolak.");
        }

        setScanQueue(prev => prev.map(item =>
          item.id === queueId ? { ...item, status: "error", message: errorMsg } : item
        ));
      }
    } catch (err: any) {
      playBeep(false);
      triggerFlash("error");
      setScanStatus({
        type: "error",
        msg: "Kesalahan Jaringan / Server",
        details: err.toString(),
        timestamp: timeStr
      });
    } finally {
      setIsProcessingScan(false);
    }
  };

  // Start / Stop Camera Scanner
  const startCameraScanner = async () => {
    setCameraError(null);
    try {
      const html5QrCode = new Html5Qrcode("qr-scanner-frame", {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_39
        ],
        verbose: false
      });
      qrReaderRef.current = html5QrCode;

      const cameraIdOrConfig = selectedCameraId 
        ? { deviceId: { exact: selectedCameraId } }
        : { facingMode: "environment" };

      await html5QrCode.start(
        cameraIdOrConfig,
        {
          fps: 20,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          processScanCode(decodedText);
        },
        () => {}
      );
      setCameraActive(true);
    } catch (err: any) {
      console.error(err);
      setCameraError("Gagal mengaktifkan kamera. Pastikan izin kamera telah diberikan.");
      setCameraActive(false);
    }
  };

  const stopCameraScanner = async () => {
    if (qrReaderRef.current && cameraActive) {
      try {
        await qrReaderRef.current.stop();
        qrReaderRef.current.clear();
      } catch (e) {}
      setCameraActive(false);
    }
  };

  useEffect(() => {
    if (scanMethod === "camera") {
      startCameraScanner();
    } else {
      stopCameraScanner();
    }
    return () => {
      stopCameraScanner();
    };
  }, [scanMethod, selectedCameraId]);

  // Handle Hardware Form Submit
  const handleHardwareSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      processScanCode(barcodeInput.trim());
    }
  };

  // Filter & Pagination Calculations for Logs
  const filteredLogs = useMemo(() => {
    return recentLogs.filter(log => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        (log.nama_target && log.nama_target.toLowerCase().includes(q)) ||
        (log.id_target && log.id_target.toLowerCase().includes(q)) ||
        (log.kelas_jurusan && log.kelas_jurusan.toLowerCase().includes(q)) ||
        (log.status_masuk && log.status_masuk.toLowerCase().includes(q)) ||
        (log.status_pulang && log.status_pulang.toLowerCase().includes(q));

      const matchClass = filterKelas === "Semua" || !log.kelas_jurusan || 
        log.kelas_jurusan.toLowerCase().includes(filterKelas.toLowerCase());

      return matchSearch && matchClass;
    });
  }, [recentLogs, searchQuery, filterKelas]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  // Filter & Pagination for Mengajar Schedule
  const filteredMengajarSchedules = useMemo(() => {
    return lessonSchedules.filter(s => {
      const matchDay = !selectedDay || selectedDay === "Semua" || (s.hari || "").toLowerCase() === selectedDay.toLowerCase();
      const matchKelas = filterMengajarKelas === "Semua" || (s.kelas || "").toLowerCase() === filterMengajarKelas.toLowerCase();
      const matchGuru = filterMengajarGuru === "Semua" || (s.nama_guru || "").toLowerCase() === filterMengajarGuru.toLowerCase();
      const q = filterMengajarSearch.toLowerCase().trim();
      const matchSearch = !q || 
        (s.nama_guru && s.nama_guru.toLowerCase().includes(q)) ||
        (s.mapel && s.mapel.toLowerCase().includes(q)) ||
        (s.kelas && s.kelas.toLowerCase().includes(q));

      return matchDay && matchKelas && matchGuru && matchSearch;
    });
  }, [lessonSchedules, selectedDay, filterMengajarKelas, filterMengajarGuru, filterMengajarSearch]);

  const totalPagesJadwal = Math.ceil(filteredMengajarSchedules.length / itemsPerPageJadwal) || 1;
  const paginatedSchedules = useMemo(() => {
    const start = (currentPageJadwal - 1) * itemsPerPageJadwal;
    return filteredMengajarSchedules.slice(start, start + itemsPerPageJadwal);
  }, [filteredMengajarSchedules, currentPageJadwal, itemsPerPageJadwal]);

  // Statistics Summary
  const statsHarian = useMemo(() => {
    let hadir = 0;
    let terlambat = 0;
    let pulang = 0;
    let belum = 0;

    recentLogs.forEach(l => {
      const sm = (l.status_masuk || "").toLowerCase();
      const sp = (l.status_pulang || "").toLowerCase();

      if (sm.includes("tepat") || sm.includes("hadir")) hadir++;
      else if (sm.includes("terlambat")) terlambat++;
      else belum++;

      if (sp.includes("tepat") || (l.jam_pulang && l.jam_pulang !== "-")) pulang++;
    });

    return { total: recentLogs.length, hadir, terlambat, pulang, belum };
  }, [recentLogs]);

  // Open Manual Attendance modal with loaded entities
  const handleOpenManualModal = async () => {
    setShowManualModal(true);
    try {
      const res = await callGas("getDataMaster", [kategori]);
      const list = extractArrayData(res);
      setEntitiesList(list);
    } catch (e) {
      setEntitiesList(getStorage(kategori === "Siswa" ? "data_siswa" : "data_guru") || []);
    }
  };

  // Submit Manual Single Attendance
  const handleSaveManual = async (e: FormEvent) => {
    e.preventDefault();
    if (!manualTarget) {
      alert("Silakan pilih target presensi.");
      return;
    }

    setIsSubmittingManual(true);
    try {
      const res = await callGas("simpanManualPresensi", [
        kategori,
        manualTarget,
        mode,
        manualStatus,
        manualJam,
        manualKet,
        filterTanggal
      ]);

      if (res && res.success !== false) {
        setScanStatus({
          type: "success",
          msg: `Presensi Manual Berhasil Disimpan!`,
          targetName: manualTarget,
          role: kategori,
          details: `Mode ${mode} • Status: ${manualStatus} • Jam: ${manualJam}`,
          timestamp: new Date().toLocaleTimeString("id-ID")
        });
        playBeep(true);
        setShowManualModal(false);
        setManualTarget("");
        setManualKet("");
        loadLiveLogs(filterTanggal, filterKelas, filterHariGuru);
      } else {
        alert(res?.message || "Gagal menyimpan presensi manual");
      }
    } catch (err: any) {
      alert("Error: " + err.toString());
    } finally {
      setIsSubmittingManual(false);
    }
  };

  return (
    <div className={`space-y-6 animate-fade-in relative ${screenFlash === "success" ? "bg-emerald-500/10" : screenFlash === "error" ? "bg-rose-500/10" : ""} transition-colors duration-300 rounded-3xl p-1`}>
      
      {/* 1. TOP STATS & QUICK CONTROL BAR */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 md:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Left: Mode Title & Attendance Type Switch */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setAttendanceType("harian")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                attendanceType === "harian"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Presensi Harian
            </button>
            <button
              onClick={() => setAttendanceType("mengajar")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                attendanceType === "mengajar"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Presensi Mengajar Guru
            </button>
          </div>

          {attendanceType === "harian" && (
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setKategori("Siswa")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  kategori === "Siswa" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Siswa
              </button>
              {!isGuru && (
                <button
                  onClick={() => setKategori("Guru")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    kategori === "Guru" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Guru / Staf
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: Live Clock, Speed Throttle & Audio Toggles */}
        <div className="flex flex-wrap items-center gap-2.5 ml-auto">
          
          {/* Fast Mode Selector */}
          <div className="flex items-center bg-slate-100 px-2 py-1 rounded-xl border border-slate-200 text-xs">
            <span className="text-[11px] font-semibold text-slate-500 mr-1.5 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              Kecepatan:
            </span>
            <select
              value={fastMode}
              onChange={(e) => setFastMode(e.target.value as any)}
              className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
            >
              <option value="turbo">⚡ Turbo (0.6s)</option>
              <option value="express">🚀 Express (1.2s)</option>
              <option value="normal">⏱ Normal (2.5s)</option>
            </select>
          </div>

          {/* Throughput Counter */}
          {scansPerMinute > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>{scansPerMinute} scan/menit</span>
            </div>
          )}

          {/* Audio & Speech Buttons */}
          <button
            onClick={() => setAudioMuted(!audioMuted)}
            title={audioMuted ? "Aktifkan Bunyi Beep" : "Bisukan Bunyi Beep"}
            className={`p-2 rounded-xl border text-xs font-bold transition-all ${
              audioMuted 
                ? "bg-slate-100 text-slate-400 border-slate-200" 
                : "bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100"
            }`}
          >
            {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setSpeechEnabled(!speechEnabled)}
            title={speechEnabled ? "Nonaktifkan Suara Pembaca Nama (TTS)" : "Aktifkan Suara Pembaca Nama (TTS)"}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              speechEnabled
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-100 text-slate-400 border-slate-200"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{speechEnabled ? "Voice ON" : "Voice OFF"}</span>
          </button>
        </div>
      </div>

      {/* 2. SCANNER CORE ENGINE (HARDWARE BARCODE / CAMERA VIEW) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: SCANNER INPUT & LIVE RESULT HERO (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* SCANNER CONTROLLER CARD */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4 relative overflow-hidden">
            
            {/* Mode Banner & Switch (Masuk vs Pulang) */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Target Presensi</span>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Scan className="w-4 h-4 text-indigo-600" />
                  {attendanceType === "mengajar" ? "Presensi Mengajar Guru" : `Presensi ${kategori}`}
                </h3>
              </div>

              {attendanceType === "harian" && (
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => { setMode("Masuk"); setAutoTimeSwitch(false); }}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
                      mode === "Masuk"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Masuk
                  </button>
                  <button
                    onClick={() => { setMode("Pulang"); setAutoTimeSwitch(false); }}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
                      mode === "Pulang"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Pulang
                  </button>
                </div>
              )}
            </div>

            {/* Input Method Switch (Hardware Gun vs Camera) */}
            <div className="flex gap-2">
              <button
                onClick={() => setScanMethod("hardware")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold border transition-all ${
                  scanMethod === "hardware"
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Usb className="w-4 h-4 text-emerald-400" />
                Barcode Gun / USB
              </button>
              <button
                onClick={() => setScanMethod("camera")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold border transition-all ${
                  scanMethod === "camera"
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Camera className="w-4 h-4 text-blue-400" />
                Kamera QR
              </button>
            </div>

            {/* HARDWARE SCANNER INPUT BOX */}
            {scanMethod === "hardware" ? (
              <form onSubmit={handleHardwareSubmit} className="space-y-3">
                <div className="relative">
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Arahkan barcode scanner / ketik ID lalu tekan Enter..."
                    disabled={isProcessingScan && fastMode === "normal"}
                    className="w-full bg-slate-50 border-2 border-indigo-500/30 focus:border-indigo-600 rounded-xl py-3 pl-11 pr-24 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                  <Keyboard className="w-5 h-5 text-indigo-600 absolute left-3.5 top-3.5" />
                  
                  <div className="absolute right-2.5 top-2 flex items-center gap-1.5">
                    {isProcessingScan ? (
                      <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-md animate-pulse">
                        Memproses...
                      </span>
                    ) : (
                      <button
                        type="submit"
                        disabled={!barcodeInput.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs"
                      >
                        Enter
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                  <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    Scanner Siap Digunakan (Auto-Focus Aktif)
                  </span>
                  <button
                    type="button"
                    onClick={() => barcodeInputRef.current?.focus()}
                    className="text-indigo-600 hover:underline font-bold"
                  >
                    Fokus Input
                  </button>
                </div>
              </form>
            ) : (
              /* CAMERA VIEWFINDER */
              <div className="space-y-3">
                {availableCameras.length > 1 && (
                  <select
                    value={selectedCameraId}
                    onChange={(e) => setSelectedCameraId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    {availableCameras.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                )}

                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-square max-h-64 flex items-center justify-center">
                  <div id="qr-scanner-frame" className="w-full h-full"></div>
                  
                  {/* Laser Scan line overlay */}
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan-laser pointer-events-none"></div>

                  {cameraError && (
                    <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center text-rose-400 text-xs">
                      <AlertCircle className="w-8 h-8 mb-2" />
                      <p>{cameraError}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* QUICK MANUAL ACTION BUTTONS */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleOpenManualModal}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <UserPlus className="w-3.5 h-3.5 text-slate-600" />
                Input Manual
              </button>

              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2.5 rounded-xl transition-all"
                title="Petunjuk Penggunaan"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* REALTIME SCAN STATUS HERO CARD */}
          {scanStatus.type && (
            <div className={`p-4 rounded-2xl border transition-all animate-pop-in ${
              scanStatus.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                : scanStatus.type === "error"
                ? "bg-rose-50 border-rose-200 text-rose-950"
                : "bg-blue-50 border-blue-200 text-blue-950"
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl shrink-0 ${
                  scanStatus.type === "success"
                    ? "bg-emerald-500 text-white"
                    : scanStatus.type === "error"
                    ? "bg-rose-500 text-white"
                    : "bg-blue-500 text-white"
                }`}>
                  {scanStatus.type === "success" ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : scanStatus.type === "error" ? (
                    <XCircle className="w-5 h-5" />
                  ) : (
                    <Info className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-75">
                      {scanStatus.msg}
                    </span>
                    {scanStatus.timestamp && (
                      <span className="text-[10px] font-mono opacity-60">
                        {scanStatus.timestamp}
                      </span>
                    )}
                  </div>
                  
                  {scanStatus.targetName && (
                    <h4 className="text-base font-extrabold tracking-tight truncate mt-0.5">
                      {scanStatus.targetName}
                    </h4>
                  )}
                  
                  {scanStatus.details && (
                    <p className="text-xs opacity-90 mt-0.5 font-medium">
                      {scanStatus.details}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* LIVE BURST QUEUE FEED */}
          {scanQueue.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 pb-1 border-b border-slate-100">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  Antrean Scan Terakhir
                </span>
                <button
                  onClick={() => setScanQueue([])}
                  className="text-[10px] text-slate-400 hover:text-slate-600"
                >
                  Bersihkan
                </button>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {scanQueue.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        item.status === "success"
                          ? "bg-emerald-500"
                          : item.status === "error"
                          ? "bg-rose-500"
                          : "bg-amber-500 animate-pulse"
                      }`}></span>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate">
                          {item.name || item.code}
                        </p>
                        {item.subDetail && (
                          <p className="text-[10px] text-slate-500 truncate">
                            {item.subDetail}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <span className="font-mono text-[10px] text-slate-400 block">
                        {item.timestamp}
                      </span>
                      <span className={`text-[10px] font-bold ${
                        item.status === "success" ? "text-emerald-600" : item.status === "error" ? "text-rose-600" : "text-amber-600"
                      }`}>
                        {item.message}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: LIVE ATTENDANCE TABLE & SCHEDULES (7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* HARIAN TABLE VIEW */}
          {attendanceType === "harian" ? (
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
              
              {/* Header Filter Bar */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Log Presensi Hari Ini ({filteredLogs.length} Data)
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  {/* Class Filter */}
                  {kategori === "Siswa" && (
                    <select
                      value={filterKelas}
                      onChange={(e) => setFilterKelas(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="Semua">Semua Kelas</option>
                      {classList.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  )}

                  {/* Date Filter */}
                  <input
                    type="date"
                    value={filterTanggal}
                    onChange={(e) => setFilterTanggal(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
                  />

                  {/* Refresh Button */}
                  <button
                    onClick={() => loadLiveLogs(filterTanggal, filterKelas, filterHariGuru)}
                    disabled={isLoadingLogs}
                    className="p-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 transition-all"
                    title="Refresh Data"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="px-4 py-2.5 border-b border-slate-100 bg-white">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama, NISN/NIP, kelas, atau status..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Table Data */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Nama / Target</th>
                      <th className="py-3 px-3">Kelas / Detail</th>
                      <th className="py-3 px-3">Masuk</th>
                      <th className="py-3 px-3">Pulang</th>
                      <th className="py-3 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {isLoadingLogs ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                          Memuat data presensi...
                        </td>
                      </tr>
                    ) : paginatedLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          Tidak ada data presensi yang sesuai.
                        </td>
                      </tr>
                    ) : (
                      paginatedLogs.map((log, idx) => (
                        <tr key={log.id_target || idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-4 font-bold text-slate-900">
                            {log.nama_target || "Tanpa Nama"}
                            <span className="block text-[10px] font-mono text-slate-400 font-normal">
                              {log.id_target}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-medium">
                            {log.kelas_jurusan || "-"}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-mono font-semibold text-slate-800">
                              {log.jam_masuk || "-"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-mono font-semibold text-slate-800">
                              {log.jam_pulang || "-"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              (log.status_masuk || "").includes("Tepat")
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : (log.status_masuk || "").includes("Terlambat")
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : (log.status_masuk || "").includes("Izin") || (log.status_masuk || "").includes("Sakit")
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : (log.status_masuk || "").includes("Alfa")
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-slate-100 text-slate-600"
                            }`}>
                              {log.status_masuk || "Belum Absen"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* PRESENSI MENGAJAR GURU VIEW */
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden space-y-4 p-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    Jadwal Mengajar ({selectedDay})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Klik pada jadwal guru untuk mencatat presensi mengajar 1x Scan multi-jam.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800"
                  >
                    {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grid of Schedules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {paginatedSchedules.map((sched) => {
                  const existingLog = absensiMengajarLogs.find(l => 
                    l.tanggal === filterTanggal &&
                    l.id_guru === sched.id_guru &&
                    l.kelas === sched.kelas &&
                    Number(l.jam_ke) === Number(sched.jam_ke)
                  );

                  return (
                    <div
                      key={sched.id_jadwal}
                      className={`p-3.5 rounded-xl border transition-all ${
                        existingLog
                          ? "bg-emerald-50/50 border-emerald-200"
                          : "bg-slate-50 border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="inline-block bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md mb-1">
                            Jam Ke-{sched.jam_ke} • {sched.kelas}
                          </span>
                          <h4 className="text-xs font-extrabold text-slate-900">{sched.mapel}</h4>
                          <p className="text-[11px] text-slate-600 mt-0.5">{sched.nama_guru}</p>
                        </div>

                        {existingLog ? (
                          <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" /> Hadir
                          </span>
                        ) : (
                          <button
                            onClick={() => openModalForSchedule(sched)}
                            className="bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-lg transition-all"
                          >
                            Absen
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. MODAL INPUT MANUAL (SINGLE & BULK) */}
      {showManualModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-pop-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-600" />
                Input Presensi Manual ({kategori})
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManual} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Pilih {kategori}</label>
                <input
                  type="text"
                  placeholder="Ketik nama atau NISN/NIP..."
                  value={searchManualQuery}
                  onChange={(e) => setSearchManualQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium mb-1.5 focus:outline-none"
                />

                <select
                  value={manualTarget}
                  onChange={(e) => setManualTarget(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="">-- Pilih dari daftar --</option>
                  {entitiesList
                    .filter(item => {
                      const q = searchManualQuery.toLowerCase();
                      const name = (item.nama_siswa || item.nama_guru || "").toLowerCase();
                      const id = (item.id_siswa || item.id_guru || item.nisn || item.nip_nuptk || "").toLowerCase();
                      return !q || name.includes(q) || id.includes(q);
                    })
                    .map(item => (
                      <option key={item.id_siswa || item.id_guru} value={item.id_siswa || item.id_guru}>
                        {item.nama_siswa || item.nama_guru} ({item.kelas || item.nip_nuptk || item.id_siswa || item.id_guru})
                      </option>
                    ))
                  }
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status Masuk</label>
                  <select
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800"
                  >
                    <option value="Hadir (Auto)">Hadir Tepat Waktu</option>
                    <option value="Terlambat">Terlambat</option>
                    <option value="Izin">Izin</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Dispensasi">Dispensasi</option>
                    <option value="Alfa">Alfa</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Waktu Presensi</label>
                  <input
                    type="time"
                    value={manualJam}
                    onChange={(e) => setManualJam(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Keterangan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Surat dokter, dispensasi lomba..."
                  value={manualKet}
                  onChange={(e) => setManualKet(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManual}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-xs"
                >
                  {isSubmittingManual ? "Menyimpan..." : "Simpan Presensi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL PRESENSI MENGAJAR GURU */}
      {showMengajarModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-pop-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Presensi Mengajar: {mengajarForm.nama_guru}
              </h3>
              <button
                onClick={() => setShowMengajarModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMengajar} className="space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                <p className="font-bold text-slate-800">
                  {mengajarForm.mapel} — Kelas {mengajarForm.kelas}
                </p>
                <p className="text-slate-500 text-[11px]">
                  Jam Ke-{mengajarForm.jam_ke} ({mengajarForm.jam_mulai_jadwal} - {mengajarForm.jam_selesai_jadwal})
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Status Kehadiran</label>
                <select
                  value={mengajarForm.status}
                  onChange={(e) => setMengajarForm({ ...mengajarForm, status: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                >
                  <option value="Hadir Tepat Waktu">Hadir Tepat Waktu</option>
                  <option value="Terlambat Masuk Kelas">Terlambat Masuk Kelas</option>
                  <option value="Izin">Izin</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Tugas Luar">Tugas Luar</option>
                  <option value="Tidak Hadir (Alfa)">Tidak Hadir (Alfa)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan Materi / Jurnal</label>
                <textarea
                  rows={2}
                  placeholder="Materi yang diajarkan hari ini..."
                  value={mengajarForm.catatan_materi}
                  onChange={(e) => setMengajarForm({ ...mengajarForm, catatan_materi: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMengajarModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMengajar}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-xs"
                >
                  {isSubmittingMengajar ? "Menyimpan..." : "Simpan Presensi Mengajar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
