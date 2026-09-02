/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, FormEvent, useMemo } from "react";
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
  Activity
} from "lucide-react";
import { callGas, getStorageKey, setStorage, getStorage, extractArrayData, getSchoolProfile, parseTimeToMinutes } from "../lib/gasApi";

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
  // Scanner Hardware listener
  const [barcodeInput, setBarcodeInput] = useState("");
  const [autoFocusLock, setAutoFocusLock] = useState(true);
  const barcodeRef = useRef<HTMLInputElement | null>(null);

  // Queue Architecture for high burst
  const [scanQueue, setScanQueue] = useState<QueueItem[]>([]);
  const isProcessingQueueRef = useRef<boolean>(false);
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
    mengajarRecord: 0
  });

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
      const text = `${cleanName}. ${mode}. ${status}.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "id-ID";
      utterance.rate = 1.15;
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  };

  // Focus lock
  useEffect(() => {
    if (autoFocusLock) {
      const timer = setInterval(() => {
        if (barcodeRef.current && document.activeElement !== barcodeRef.current) {
          barcodeRef.current.focus();
        }
      }, 300);
      return () => clearInterval(timer);
    }
  }, [autoFocusLock]);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Process incoming barcode
  const processBarcodeScan = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;

    const now = Date.now();
    if (recentScannedCodesRef.current[code] && (now - recentScannedCodesRef.current[code]) < 1500) {
      return;
    }
    recentScannedCodesRef.current[code] = now;

    setBarcodeInput("");
    if (barcodeRef.current) barcodeRef.current.focus();

    const queueId = Math.random().toString(36).substring(2, 9);
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const newQueueItem: QueueItem = {
      queueId,
      rawCode: code,
      enqueuedAt: timeStr,
      status: "processing"
    };

    setScanQueue(prev => [newQueueItem, ...prev.slice(0, 7)]);

    try {
      // Auto switch mode based on hour
      const currentHour = new Date().getHours();
      const modeStr = currentHour < 12 ? "Masuk" : "Pulang";
      const todayStr = new Date().toISOString().split("T")[0];

      // Auto Scanner Dispatch via GAS
      const res = await callGas("prosesScanQR", [code, "Siswa", modeStr, todayStr]);

      if (res && res.success !== false) {
        const row = res.data || {};
        const isSiswa = res.role === "Siswa" || Boolean(row.id_siswa || row.nama_siswa);
        const name = row.nama_siswa || row.nama_guru || res.name || code;
        const sub = row.kelas_jurusan || row.kelas || (isSiswa ? "Siswa" : "Guru");
        const status = row.status_masuk || row.status_pulang || row.status || "Tepat Waktu";

        const scanRes: AutoScanResult = {
          id: code,
          name,
          role: isSiswa ? "Siswa" : "Guru",
          subDetail: sub,
          mode: modeStr,
          status,
          timestamp: timeStr,
          dateStr: todayStr,
          success: true,
          message: `Presensi ${modeStr} Berhasil`
        };

        setLastResult(scanRes);
        setRecentLogs(prev => [scanRes, ...prev.slice(0, 19)]);
        playBeep(true);
        speakGreeting(name, isSiswa ? "Siswa" : "Guru", modeStr, status);

        // Update stats
        if (isSiswa) setStats(s => ({ ...s, siswaMasuk: s.siswaMasuk + 1 }));
        else setStats(s => ({ ...s, guruMasuk: s.guruMasuk + 1 }));

        setScanQueue(prev => prev.map(q => q.queueId === queueId ? { ...q, status: "completed", result: scanRes } : q));
      } else {
        const errMsg = res?.message || `Data tidak ditemukan: ${code}`;
        const errRes: AutoScanResult = {
          id: code,
          name: code,
          role: "Siswa",
          subDetail: "Tidak Terdaftar",
          mode: modeStr,
          status: "Ditolak",
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
        name: code,
        role: "Siswa",
        subDetail: "Server Error",
        mode: "Masuk",
        status: "Gagal",
        timestamp: timeStr,
        dateStr: new Date().toISOString().split("T")[0],
        success: false,
        message: err.toString()
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
    <div className={`min-h-full space-y-6 ${isFullscreen ? "fixed inset-0 z-50 bg-slate-950 p-6 overflow-y-auto text-white" : ""}`}>
      
      {/* 1. KIOSK TOP BOARD HEADER */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/20">
            <ScanQrCode className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight">Auto Scanner Gerbang & Kiosk</h2>
              <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                LIVE AKTIF
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {getSchoolProfile().namaSekolah} — Scan kartu barcode/QR tanpa henti.
            </p>
          </div>
        </div>

        {/* Realtime Big Clock & Fullscreen Controls */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl md:text-3xl font-mono font-black text-indigo-400 tracking-wider">
              {currentTimeStr}
            </div>
            <div className="text-[11px] text-slate-400 font-semibold">
              {currentDateStr}
            </div>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
            <button
              onClick={() => setAudioMuted(!audioMuted)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                audioMuted ? "bg-slate-800 text-slate-500 border-slate-700" : "bg-indigo-600 text-white border-indigo-500 shadow-md"
              }`}
            >
              {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setSpeechEnabled(!speechEnabled)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                speechEnabled ? "bg-emerald-600 text-white border-emerald-500 shadow-md" : "bg-slate-800 text-slate-500 border-slate-700"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. HIDDEN AUTOMATIC SCANNER LISTENER */}
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={barcodeRef}
          type="text"
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
          placeholder="Hardware scanner aktif otomatis (klik di sini jika perlu)..."
          className="w-full bg-slate-900 border-2 border-indigo-500/40 focus:border-indigo-500 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
        />
        <Usb className="w-5 h-5 text-indigo-400 absolute left-4 top-4" />
      </form>

      {/* 3. HERO STATUS BOARD & LIVE SCAN LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: HUGE RESULT FEEDBACK CARD (6 COLS) */}
        <div className="lg:col-span-6 space-y-4">
          <div className={`p-8 rounded-3xl border transition-all duration-200 min-h-[340px] flex flex-col justify-between relative overflow-hidden shadow-xl ${
            !lastResult
              ? "bg-slate-900 border-slate-800 text-slate-400"
              : lastResult.success
              ? "bg-emerald-950/80 border-emerald-500 text-emerald-100 shadow-emerald-900/20"
              : "bg-rose-950/80 border-rose-500 text-rose-100 shadow-rose-900/20"
          }`}>
            
            {/* Background decorative watermark */}
            <div className="absolute right-4 bottom-4 opacity-5 pointer-events-none">
              <ScanQrCode className="w-48 h-48" />
            </div>

            {!lastResult ? (
              <div className="my-auto text-center space-y-3">
                <div className="w-20 h-20 bg-slate-800/80 rounded-full flex items-center justify-center mx-auto text-slate-500">
                  <ScanQrCode className="w-10 h-10 animate-pulse" />
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">SIAP MENERIMA SCAN</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Dekatkan kartu ID siswa atau guru ke barcode/QR scanner untuk mencatat presensi secara otomatis.
                </p>
              </div>
            ) : (
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    lastResult.success ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                  }`}>
                    {lastResult.message}
                  </span>
                  <span className="font-mono text-xs opacity-75">
                    {lastResult.timestamp}
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white mt-2">
                    {lastResult.name}
                  </h2>
                  <p className="text-sm font-semibold opacity-90 mt-1">
                    {lastResult.subDetail} • Mode: {lastResult.mode}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs font-bold opacity-75">Status Absensi</span>
                  <span className={`text-base font-black ${lastResult.success ? "text-emerald-400" : "text-rose-400"}`}>
                    {lastResult.status}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: LIVE STREAM FEED (6 COLS) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                Riwayat Presensi Masuk Cepat
              </h3>
              <span className="text-xs font-bold text-slate-400">
                {recentLogs.length} Terproses
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {recentLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Belum ada presensi yang diproses dalam sesi ini.
                </div>
              ) : (
                recentLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-xs text-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        log.success ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                      }`}>
                        {log.role === "Siswa" ? "S" : "G"}
                      </div>
                      <div>
                        <h4 className="font-bold">{log.name}</h4>
                        <p className="text-[11px] text-slate-400">{log.subDetail}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-[10px] text-slate-400 block">{log.timestamp}</span>
                      <span className={`text-[11px] font-extrabold ${log.success ? "text-emerald-400" : "text-rose-400"}`}>
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
