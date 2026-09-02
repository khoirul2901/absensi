/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, FormEvent } from "react";
import { 
  ScanQrCode, 
  UserCheck, 
  Clock, 
  Volume2, 
  VolumeX, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  BookOpen, 
  GraduationCap, 
  Search, 
  Zap, 
  Usb, 
  Calendar,
  Check,
  Building2,
  RefreshCw,
  Info,
  ListOrdered,
  Layers,
  Loader2,
  ArrowRight,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Activity,
  Camera,
  CameraOff,
  AlertTriangle
} from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { callGas, getStorageKey, setStorage, getStorage, getSchoolProfile, parseTimeToMinutes, cleanTimeHHMM } from "../lib/gasApi";

export interface QueueItem {
  queueId: string;
  rawCode: string;
  enqueuedAt: string;
  previewName?: string;
  previewRole?: "Siswa" | "Guru";
  previewSubDetail?: string;
  status: "pending" | "processing" | "completed" | "error";
  result?: AutoScanResult;
}

export interface AutoScanResult {
  id: string;
  name: string;
  role: "Siswa" | "Guru";
  subDetail: string;
  mode: "Masuk" | "Pulang";
  status: string;
  timestamp: string;
  dateStr: string;
  scheduleDetail?: string;
  success: boolean;
  message: string;
}

export default function AutoScannerBoard({ session }: { session?: any }) {
  // Scanner Mode & Hardware listener
  const [scanMethod, setScanMethod] = useState<"hardware" | "camera">("camera");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [autoFocusLock, setAutoFocusLock] = useState(true);
  const barcodeRef = useRef<HTMLInputElement | null>(null);

  // Camera QR Scanner states
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isCameraScanningRef = useRef<boolean>(false);

  // Auto/Manual Time Mode
  const [modeOption, setModeOption] = useState<"auto" | "Masuk" | "Pulang">("auto");

  // Queue Architecture for high burst & cooldown
  const [scanQueue, setScanQueue] = useState<QueueItem[]>([]);
  const recentScannedCodesRef = useRef<{ [code: string]: number }>({});

  // Audio & Speech
  const [audioMuted, setAudioMuted] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Live Results & Logs
  const [lastResult, setLastResult] = useState<AutoScanResult | null>(null);
  const [recentLogs, setRecentLogs] = useState<AutoScanResult[]>([]);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>("");
  const [currentDateStr, setCurrentDateStr] = useState<string>("");

  // Statistics
  const [stats, setStats] = useState({
    siswaMasuk: 0,
    guruMasuk: 0,
    terlambat: 0,
    tepatWaktu: 0
  });

  // School Operational Hours Cache
  const [opHours, setOpHours] = useState({
    jamMasukBatas: "07:15",
    jamPulangMulai: "15:30",
    toleransiSiswa: 0
  });

  // Load operational config
  const refreshConfig = () => {
    try {
      const cfg = JSON.parse(
        localStorage.getItem(getStorageKey("MOCK_pengaturan_jam")) || 
        localStorage.getItem(getStorageKey("pengaturan_jam")) || 
        "{}"
      );
      setOpHours({
        jamMasukBatas: cleanTimeHHMM(cfg.jam_masuk_batas || cfg.jamMasukBatas) || "07:15",
        jamPulangMulai: cleanTimeHHMM(cfg.jam_pulang_mulai || cfg.jamPulangMulai) || "15:30",
        toleransiSiswa: Number(cfg.toleransi_keterlambatan || cfg.toleransi_siswa || 0)
      });
    } catch (e) {}
  };

  useEffect(() => {
    refreshConfig();
  }, []);

  // Clock Ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setCurrentDateStr(now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Audio Beep
  const playBeep = (isSuccess = true) => {
    if (audioMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = isSuccess ? "sine" : "triangle";
      osc.frequency.setValueAtTime(isSuccess ? 880 : 260, audioCtx.currentTime);
      if (isSuccess) {
        osc.frequency.setValueAtTime(1174, audioCtx.currentTime + 0.08);
      }
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + (isSuccess ? 0.22 : 0.35));

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + (isSuccess ? 0.22 : 0.35));
    } catch (e) {}
  };

  // Text-To-Speech
  const speakGreeting = (name: string, role: string, mode: string, status: string) => {
    if (!speechEnabled || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const cleanName = name.replace(/[,.]/g, " ").replace(/\s+/g, " ").trim();
      const statusSpeech = status.includes("Terlambat") ? "Terlambat" : (status.includes("Tepat") ? "Tepat Waktu" : status);
      const text = `${cleanName}. ${role}. Presensi ${mode}. ${statusSpeech}.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "id-ID";
      utterance.rate = 1.15;
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  };

  // Focus lock for hardware barcode scanner
  useEffect(() => {
    if (autoFocusLock && scanMethod === "hardware") {
      const timer = setInterval(() => {
        if (barcodeRef.current && document.activeElement !== barcodeRef.current) {
          barcodeRef.current.focus();
        }
      }, 400);
      return () => clearInterval(timer);
    }
  }, [autoFocusLock, scanMethod]);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Camera QR Scanner Lifecycle
  useEffect(() => {
    if (scanMethod === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [scanMethod]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch (e) {}
        html5QrCodeRef.current = null;
      }

      const qrScanner = new Html5Qrcode("kiosk-qr-reader", {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13
        ],
        verbose: false
      });

      html5QrCodeRef.current = qrScanner;

      await qrScanner.start(
        { facingMode: "environment" },
        {
          fps: 15,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          if (isCameraScanningRef.current) return;
          processBarcodeScan(decodedText);
        },
        () => {}
      );
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn("Kiosk camera init error:", err);
      setIsCameraActive(false);
      setCameraError(err.message || "Gagal mengaktifkan kamera. Pastikan izin kamera telah diberikan.");
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (e) {}
      html5QrCodeRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Determine Effective Mode (Masuk vs Pulang)
  const getEffectiveMode = (): "Masuk" | "Pulang" => {
    if (modeOption === "Masuk" || modeOption === "Pulang") return modeOption;
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const pulangMin = parseTimeToMinutes(opHours.jamPulangMulai || "15:30");
    // Before 12:00 or before jam_pulang_mulai is Masuk
    if (now.getHours() < 12 && currentMin < pulangMin) return "Masuk";
    if (currentMin >= pulangMin || now.getHours() >= 12) return "Pulang";
    return "Masuk";
  };

  // Helper to accurately lookup person in local cache first
  const lookupPerson = (rawCode: string) => {
    const cleanCode = String(rawCode || "").trim().toLowerCase();
    const cleanWithout = cleanCode.replace(/^(qr|id|s|g|nisn|nip|siswa|guru)[_:\-\s]+/i, '').trim();

    const siswaList = getStorage("data_siswa") || [];
    const guruList = getStorage("data_guru") || [];

    // 1. Try finding in Siswa first
    let sMatch = siswaList.find((s: any) => {
      const qr = String(s.qr_content || s.qr_code || "").trim().toLowerCase();
      const id = String(s.id_siswa || "").trim().toLowerCase();
      const nisn = String(s.nisn || "").trim().toLowerCase();
      const nama = String(s.nama_siswa || s.nama || "").trim().toLowerCase();
      return (qr && qr === cleanCode) || (id && id === cleanCode) || (nisn && nisn === cleanCode) || (nama && nama === cleanCode);
    });

    if (!sMatch && cleanWithout && cleanWithout.length >= 2) {
      sMatch = siswaList.find((s: any) => {
        const qr = String(s.qr_content || s.qr_code || "").trim().toLowerCase().replace(/^(qr|id|s|g|nisn|nip|siswa|guru)[_:\-\s]+/i, '').trim();
        const id = String(s.id_siswa || "").trim().toLowerCase().replace(/^(qr|id|s|g|nisn|nip|siswa|guru)[_:\-\s]+/i, '').trim();
        const nisn = String(s.nisn || "").trim().toLowerCase().replace(/^(qr|id|s|g|nisn|nip|siswa|guru)[_:\-\s]+/i, '').trim();
        return (qr && qr === cleanWithout) || (id && id === cleanWithout) || (nisn && nisn === cleanWithout);
      });
    }

    if (sMatch) {
      return {
        role: "Siswa" as const,
        name: sMatch.nama_siswa || sMatch.nama || rawCode,
        subDetail: [sMatch.kelas, sMatch.jurusan].filter(Boolean).join(" ") || "Siswa",
        raw: sMatch
      };
    }

    // 2. Try finding in Guru
    let gMatch = guruList.find((g: any) => {
      const qr = String(g.qr_content || g.qr_code || "").trim().toLowerCase();
      const id = String(g.id_guru || "").trim().toLowerCase();
      const nip = String(g.nip_nuptk || g.nip || "").trim().toLowerCase();
      const nama = String(g.nama_guru || g.nama || "").trim().toLowerCase();
      return (qr && qr === cleanCode) || (id && id === cleanCode) || (nip && nip === cleanCode) || (nama && nama === cleanCode);
    });

    if (!gMatch && cleanWithout && cleanWithout.length >= 2) {
      gMatch = guruList.find((g: any) => {
        const qr = String(g.qr_content || g.qr_code || "").trim().toLowerCase().replace(/^(qr|id|s|g|nisn|nip|siswa|guru)[_:\-\s]+/i, '').trim();
        const id = String(g.id_guru || "").trim().toLowerCase().replace(/^(qr|id|s|g|nisn|nip|siswa|guru)[_:\-\s]+/i, '').trim();
        const nip = String(g.nip_nuptk || g.nip || "").trim().toLowerCase().replace(/^(qr|id|s|g|nisn|nip|siswa|guru)[_:\-\s]+/i, '').trim();
        return (qr && qr === cleanWithout) || (id && id === cleanWithout) || (nip && nip === cleanWithout);
      });
    }

    if (gMatch) {
      return {
        role: "Guru" as const,
        name: gMatch.nama_guru || gMatch.nama || rawCode,
        subDetail: gMatch.jabatan_tugas || "Guru Pengajar",
        raw: gMatch
      };
    }

    return null;
  };

  // Helper to accurately calculate attendance status (Tepat Waktu vs Terlambat)
  const computeAttendanceStatus = (modeStr: "Masuk" | "Pulang", role: "Siswa" | "Guru") => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const batasMasukMinutes = parseTimeToMinutes(opHours.jamMasukBatas || "07:15");
    const pulangMinutes = parseTimeToMinutes(opHours.jamPulangMulai || "15:30");
    const toleransi = role === "Siswa" ? opHours.toleransiSiswa : 15;

    if (modeStr === "Masuk") {
      if (currentMinutes > (batasMasukMinutes + toleransi)) {
        const lateMins = currentMinutes - batasMasukMinutes;
        return `Terlambat (${lateMins} Menit)`;
      }
      return "Tepat Waktu";
    } else {
      if (currentMinutes < pulangMinutes) {
        return "Pulang Cepat";
      }
      return "Tepat Waktu";
    }
  };

  // Process incoming barcode / QR
  const processBarcodeScan = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;

    // Cooldown check (prevent double scanning within 2 seconds)
    const now = Date.now();
    if (recentScannedCodesRef.current[code] && (now - recentScannedCodesRef.current[code]) < 2000) {
      return;
    }
    recentScannedCodesRef.current[code] = now;
    isCameraScanningRef.current = true;
    setTimeout(() => {
      isCameraScanningRef.current = false;
    }, 2000);

    setBarcodeInput("");
    if (barcodeRef.current) barcodeRef.current.focus();

    const queueId = Math.random().toString(36).substring(2, 9);
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const todayStr = new Date().toISOString().split("T")[0];
    const effectiveMode = getEffectiveMode();

    // 1. Initial Local Lookup for accurate instant role identification
    const localPerson = lookupPerson(code);
    const initialRole = localPerson?.role || "Siswa";
    const initialName = localPerson?.name || code;
    const initialSub = localPerson?.subDetail || (initialRole === "Siswa" ? "Siswa" : "Guru");

    const newQueueItem: QueueItem = {
      queueId,
      rawCode: code,
      enqueuedAt: timeStr,
      previewName: initialName,
      previewRole: initialRole,
      previewSubDetail: initialSub,
      status: "processing"
    };

    setScanQueue(prev => [newQueueItem, ...prev.slice(0, 7)]);

    try {
      // Call backend API / Local Engine with the correct role detected
      const res = await callGas("prosesScanQR", [code, initialRole, effectiveMode, todayStr]);

      if (res && res.success !== false) {
        const row = res.data || {};

        // Strict Role Determination:
        // Prioritize local lookup, then res.role, then row fields
        let detectedRole: "Siswa" | "Guru" = initialRole;
        if (res.role === "Siswa" || res.kategori === "Siswa" || Boolean(row.id_siswa || row.nama_siswa || (row.kelas && row.kelas !== "-"))) {
          detectedRole = "Siswa";
        } else if (res.role === "Guru" || res.kategori === "Guru" || Boolean(row.id_guru || row.nama_guru || row.nip_nuptk || row.jabatan_tugas)) {
          detectedRole = "Guru";
        }

        // Name Determination:
        const detectedName = 
          row.nama_siswa || 
          row.nama_guru || 
          res.name || 
          res.targetName || 
          localPerson?.name || 
          code;

        // Subdetail / Class Determination:
        const detectedSub = 
          row.kelas_jurusan || 
          row.kelas || 
          row.jabatan_tugas || 
          localPerson?.subDetail || 
          (detectedRole === "Siswa" ? "Siswa" : "Guru");

        // Status Determination: Accurate late vs on-time check
        const computedStatus = computeAttendanceStatus(effectiveMode, detectedRole);
        let finalStatus = res.status || row.status_masuk || row.status_pulang || row.status;
        
        // If status from backend is generic or default "Tepat Waktu" but time is late, use computedStatus
        if (!finalStatus || finalStatus === "Tepat Waktu") {
          finalStatus = computedStatus;
        }

        const scanRes: AutoScanResult = {
          id: code,
          name: detectedName,
          role: detectedRole,
          subDetail: detectedSub,
          mode: effectiveMode,
          status: finalStatus,
          timestamp: timeStr,
          dateStr: todayStr,
          success: true,
          message: res.message || `Presensi ${effectiveMode} Berhasil`
        };

        setLastResult(scanRes);
        setRecentLogs(prev => [scanRes, ...prev.slice(0, 24)]);
        playBeep(true);
        speakGreeting(detectedName, detectedRole, effectiveMode, finalStatus);

        // Update statistics
        const isLate = finalStatus.includes("Terlambat");
        setStats(s => ({
          ...s,
          siswaMasuk: detectedRole === "Siswa" ? s.siswaMasuk + 1 : s.siswaMasuk,
          guruMasuk: detectedRole === "Guru" ? s.guruMasuk + 1 : s.guruMasuk,
          terlambat: isLate ? s.terlambat + 1 : s.terlambat,
          tepatWaktu: !isLate ? s.tepatWaktu + 1 : s.tepatWaktu
        }));

        setScanQueue(prev => prev.map(q => q.queueId === queueId ? { ...q, status: "completed", result: scanRes } : q));
      } else {
        const errMsg = res?.message || `ID / Barcode "${code}" belum terdaftar dalam sistem!`;
        const errRes: AutoScanResult = {
          id: code,
          name: localPerson?.name || code,
          role: initialRole,
          subDetail: localPerson?.subDetail || "Belum Terdaftar",
          mode: effectiveMode,
          status: "Ditolak / Belum Terdaftar",
          timestamp: timeStr,
          dateStr: todayStr,
          success: false,
          message: errMsg
        };

        setLastResult(errRes);
        playBeep(false);
        setScanQueue(prev => prev.map(q => q.queueId === queueId ? { ...q, status: "error", result: errRes } : q));
      }
    } catch (err: any) {
      playBeep(false);
      const errRes: AutoScanResult = {
        id: code,
        name: localPerson?.name || code,
        role: initialRole,
        subDetail: "Gagal Proses",
        mode: effectiveMode,
        status: "Gagal",
        timestamp: timeStr,
        dateStr: todayStr,
        success: false,
        message: err?.toString() || "Koneksi terputus saat memproses presensi."
      };
      setLastResult(errRes);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      processBarcodeScan(barcodeInput.trim());
    }
  };

  return (
    <div id="auto-scanner-board-container" className={`min-h-full space-y-6 ${isFullscreen ? "fixed inset-0 z-50 bg-slate-950 p-6 overflow-y-auto text-white" : ""}`}>
      
      {/* 1. KIOSK TOP BOARD HEADER */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/20">
            <ScanQrCode className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight">Auto Scanner Gerbang & Kiosk</h2>
              <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                STANDBY SCAN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {getSchoolProfile().namaSekolah} — Batas Masuk: {opHours.jamMasukBatas} WIB (Toleransi: {opHours.toleransiSiswa} Menit)
            </p>
          </div>
        </div>

        {/* Realtime Big Clock & Fullscreen Controls */}
        <div className="flex flex-wrap items-center justify-end gap-3">
          {/* Mode Selector */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-bold">
            <button
              onClick={() => setModeOption("auto")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                modeOption === "auto" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              Otomatis Jam
            </button>
            <button
              onClick={() => setModeOption("Masuk")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                modeOption === "Masuk" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              Paksa Masuk
            </button>
            <button
              onClick={() => setModeOption("Pulang")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                modeOption === "Pulang" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              Paksa Pulang
            </button>
          </div>

          <div className="text-right pl-2 border-l border-slate-800">
            <div className="text-2xl font-mono font-black text-indigo-400 tracking-wider">
              {currentTimeStr}
            </div>
            <div className="text-[11px] text-slate-400 font-semibold">
              {currentDateStr}
            </div>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
            <button
              id="btn-toggle-sound"
              onClick={() => setAudioMuted(!audioMuted)}
              title={audioMuted ? "Bunyikan Suara Beep" : "Matikan Suara Beep"}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                audioMuted ? "bg-slate-800 text-slate-500 border-slate-700" : "bg-indigo-600 text-white border-indigo-500 shadow-md"
              }`}
            >
              {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              id="btn-toggle-speech"
              onClick={() => setSpeechEnabled(!speechEnabled)}
              title={speechEnabled ? "Matikan Suara Sebut Nama" : "Aktifkan Suara Sebut Nama"}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                speechEnabled ? "bg-emerald-600 text-white border-emerald-500 shadow-md" : "bg-slate-800 text-slate-500 border-slate-700"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
            </button>

            <button
              id="btn-toggle-fullscreen"
              onClick={toggleFullscreen}
              title="Layar Penuh Kiosk"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">Siswa Hadir</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{stats.siswaMasuk}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">Guru Hadir</p>
            <p className="text-2xl font-black text-indigo-400 mt-1">{stats.guruMasuk}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">Tepat Waktu</p>
            <p className="text-2xl font-black text-teal-400 mt-1">{stats.tepatWaktu}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">Terlambat</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{stats.terlambat}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. MAIN SCANNER + LIVE SCANNED RESULT FEEDBACK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: SCANNER VIEWFINDER + DEDICATED SCANNED PERSON BANNER BELOW (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Scanner Device Toggle & Barcode Input Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Metode Pemindaian:
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="btn-switch-camera"
                  onClick={() => setScanMethod("camera")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    scanMethod === "camera"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  Kamera Web / HP
                </button>
                <button
                  id="btn-switch-hardware"
                  onClick={() => setScanMethod("hardware")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    scanMethod === "hardware"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Usb className="w-3.5 h-3.5" />
                  Barcode Scanner USB/BT
                </button>
              </div>
            </div>

            {/* Camera Viewfinder */}
            {scanMethod === "camera" && (
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col items-center justify-center min-h-[280px]">
                <div id="kiosk-qr-reader" className="w-full max-w-sm rounded-xl overflow-hidden" />
                
                {cameraError && (
                  <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <AlertTriangle className="w-10 h-10 text-amber-400" />
                    <p className="text-xs text-slate-300 font-medium">{cameraError}</p>
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Coba Ulang Kamera
                    </button>
                  </div>
                )}

                <div className="absolute bottom-3 px-3 py-1 bg-slate-900/80 backdrop-blur rounded-full border border-slate-700/60 text-[11px] font-bold text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Arahkan QR Code Siswa / Guru ke dalam kotak kamera
                </div>
              </div>
            )}

            {/* Hardware Barcode Scanner Input Form */}
            <form onSubmit={handleSubmit} className="relative">
              <input
                ref={barcodeRef}
                id="kiosk-barcode-input"
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan kartu barcode / ketik ID Siswa atau Guru lalu tekan Enter..."
                className="w-full bg-slate-950 border-2 border-indigo-500/40 focus:border-indigo-500 rounded-2xl py-3.5 pl-12 pr-28 text-sm font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
              />
              <Usb className="w-5 h-5 text-indigo-400 absolute left-4 top-4" />
              <button
                type="submit"
                className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all"
              >
                Scan ID
              </button>
            </form>
          </div>

          {/* DEDICATED SCANNED PERSON DISPLAY: PROMINENTLY BELOW QR SCANNER */}
          <div 
            id="scanned-result-display-panel"
            className={`p-6 md:p-8 rounded-3xl border-2 transition-all duration-300 relative overflow-hidden shadow-2xl ${
              !lastResult
                ? "bg-slate-900/90 border-slate-800 text-slate-400"
                : lastResult.success
                ? lastResult.status.includes("Terlambat")
                  ? "bg-amber-950/80 border-amber-500 text-amber-100 shadow-amber-950/40"
                  : "bg-emerald-950/80 border-emerald-500 text-emerald-100 shadow-emerald-950/40"
                : "bg-rose-950/80 border-rose-500 text-rose-100 shadow-rose-950/40"
            }`}
          >
            {/* Decorative Background Icon */}
            <div className="absolute right-4 bottom-2 opacity-5 pointer-events-none">
              <ScanQrCode className="w-48 h-48" />
            </div>

            {!lastResult ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-16 h-16 bg-slate-800/80 rounded-2xl flex items-center justify-center mx-auto text-slate-500 border border-slate-700">
                  <UserCheck className="w-8 h-8 animate-pulse" />
                </div>
                <h3 className="text-lg font-black text-white tracking-tight">HASIL SCAN AKAN TAMPIL DI SINI</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Nama lengkap siswa atau guru, kelas/jabatan, dan status tepat waktu atau terlambat akan otomatis ditampilkan di sini setelah berhasil scan.
                </p>
              </div>
            ) : (
              <div className="space-y-6 relative z-10">
                {/* Header Status Line */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow ${
                      lastResult.success
                        ? lastResult.status.includes("Terlambat")
                          ? "bg-amber-500 text-slate-950"
                          : "bg-emerald-500 text-white"
                        : "bg-rose-500 text-white"
                    }`}>
                      {lastResult.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {lastResult.message}
                    </span>

                    {/* Role Badge (SISWA vs GURU) */}
                    <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                      lastResult.role === "Siswa"
                        ? "bg-blue-600/30 text-blue-300 border border-blue-500/40"
                        : "bg-purple-600/30 text-purple-300 border border-purple-500/40"
                    }`}>
                      {lastResult.role === "Siswa" ? "SISWA" : "GURU"}
                    </span>
                  </div>

                  <span className="font-mono text-xs font-bold opacity-80 bg-black/30 px-3 py-1 rounded-lg">
                    WAKTU: {lastResult.timestamp} WIB
                  </span>
                </div>

                {/* PROMINENT STUDENT / TEACHER NAME */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-300 block">
                    Nama Siswa / Guru Teridentifikasi:
                  </span>
                  <h2 
                    id="scanned-person-name"
                    className="text-2xl md:text-4xl font-black tracking-tight text-white drop-shadow-sm"
                  >
                    {lastResult.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 text-sm font-semibold opacity-90 pt-1">
                    <span className="bg-white/10 px-3 py-1 rounded-lg">
                      {lastResult.subDetail}
                    </span>
                    <span className="bg-white/10 px-3 py-1 rounded-lg">
                      Mode: Presensi {lastResult.mode}
                    </span>
                  </div>
                </div>

                {/* STATUS KEHADIRAN (TEPAT WAKTU vs TERLAMBAT) */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-300 block">Status Presensi Kehadiran:</span>
                    <span 
                      id="scanned-person-status"
                      className={`text-lg md:text-xl font-black ${
                        lastResult.status.includes("Terlambat")
                          ? "text-amber-400"
                          : lastResult.status.includes("Tepat")
                          ? "text-emerald-400"
                          : "text-white"
                      }`}
                    >
                      {lastResult.status}
                    </span>
                  </div>

                  <div className="text-right sm:border-l sm:border-white/10 sm:pl-4">
                    <span className="text-[11px] font-bold text-slate-300 block">Tanggal:</span>
                    <span className="text-xs font-bold text-white font-mono">{lastResult.dateStr}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: LIVE RECENT ATTENDANCE STREAM (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                Riwayat Presensi Masuk Kiosk
              </h3>
              <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg">
                {recentLogs.length} Terproses
              </span>
            </div>

            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {recentLogs.length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-xs space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-slate-600" />
                  <p>Belum ada presensi yang diproses dalam sesi ini.</p>
                </div>
              ) : (
                recentLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs text-white transition-all ${
                      idx === 0 ? "bg-slate-800/90 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/20" : "bg-slate-800/40 border-slate-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        log.role === "Siswa" 
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" 
                          : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                      }`}>
                        {log.role === "Siswa" ? "S" : "G"}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-white truncate max-w-[150px] md:max-w-[180px]">{log.name}</h4>
                        <p className="text-[11px] text-slate-400 truncate">{log.subDetail}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-[10px] text-slate-400 block">{log.timestamp}</span>
                      <span className={`text-[11px] font-black px-2 py-0.5 rounded-md inline-block mt-0.5 ${
                        log.status.includes("Terlambat")
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : log.status.includes("Tepat")
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-700 text-slate-300"
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
