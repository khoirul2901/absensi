/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useRef, useMemo } from "react";
import { 
  Users, 
  GraduationCap, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  LogOut, 
  TrendingUp,
  CalendarDays,
  Printer,
  Download,
  CreditCard,
  Loader2,
  PieChart as PieIcon,
  BarChart2,
  Activity,
  Check,
  XCircle,
  UserCheck,
  Building2,
  LayoutGrid,
  Table as TableIcon,
  Search,
  RotateCcw,
  Sparkles,
  Info
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { toPng } from "html-to-image";
import { callGas, callMock, getStorageKey, extractArrayData, getStorage, isInvalidWali } from "../lib/gasApi";
import { DashboardMetrics, AutoAlfaResult } from "../types";
import { IdCard } from "./IdCard";

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [guruData, setGuruData] = useState<any>(null);
  const [loadingGuru, setLoadingGuru] = useState(false);

  // Auto-Alfa System Status
  const [autoAlfaInfo, setAutoAlfaInfo] = useState<AutoAlfaResult | null>(null);
  const [syncingAlfa, setSyncingAlfa] = useState(false);
  const [alfaNotification, setAlfaNotification] = useState<string | null>(null);

  // Student class breakdown states
  const [siswaMasterList, setSiswaMasterList] = useState<any[]>([]);
  const [kelasMasterList, setKelasMasterList] = useState<any[]>([]);
  const [guruMasterList, setGuruMasterList] = useState<any[]>([]);
  const [loadingBreakdown, setLoadingBreakdown] = useState<boolean>(true);
  const [classGenderSearch, setClassGenderSearch] = useState<string>("");
  const [classGenderViewMode, setClassGenderViewMode] = useState<"grid" | "table" | "chart">("grid");

  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);
  const [downloadingFront, setDownloadingFront] = useState(false);
  const [downloadingBack, setDownloadingBack] = useState(false);

  const downloadCardPng = async (side: "front" | "back") => {
    const ref = side === "front" ? frontCardRef : backCardRef;
    if (!ref.current) return;
    
    try {
      if (side === "front") setDownloadingFront(true);
      else setDownloadingBack(true);
      
      // Give browser brief moment to render
      await new Promise((resolve) => setTimeout(resolve, 250));
      
      const dataUrl = await toPng(ref.current, {
        cacheBust: true,
        pixelRatio: 3, // Premium high-resolution export
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        },
      });
      
      const link = document.createElement("a");
      link.download = `Kartu_Pegawai_${side === "front" ? "Depan" : "Belakang"}_${(guruData?.nama_guru || "Guru").replace(/\s+/g, "_")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Gagal mengekspor kartu ke PNG:", err);
      alert("Gagal mengunduh kartu. Silakan coba lagi.");
    } finally {
      if (side === "front") setDownloadingFront(false);
      else setDownloadingBack(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem(getStorageKey("SIAS_SESSION"));
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const isGuru = currentUser?.role === "Guru";

  // Load teacher master data to show their custom ID Card if logged in as Guru
  useEffect(() => {
    if (currentUser && currentUser.role === "Guru") {
      async function loadMyProfile() {
        try {
          setLoadingGuru(true);
          const res = await callGas("getDataMaster", ["Guru"]);
          if (res && res.success) {
            const list = res.data || [];
            // Find teacher where id_guru === target_id OR nama_guru matches username
            const found = list.find((g: any) => 
              (g.id_guru && g.id_guru === currentUser.target_id) || 
              (g.nama_guru && g.nama_guru.replace(/\s+/g, "").toLowerCase() === currentUser.username.replace(/\s+/g, "").toLowerCase())
            );
            
            if (found) {
              setGuruData(found);
            } else {
              // Fallback if not found in sheet
              setGuruData({
                id_guru: currentUser.target_id || "G-123456",
                nama_guru: currentUser.username,
                nip_nuptk: "-",
                jabatan_tugas: "Guru",
                qr_content: (currentUser.target_id || "G-123456") + "_-_" + currentUser.username.replace(/\s+/g, '-')
              });
            }
          } else {
            // Fallback for simulation / mock data
            setGuruData({
              id_guru: currentUser.target_id || "G-123456",
              nama_guru: currentUser.username,
              nip_nuptk: "-",
              jabatan_tugas: "Guru",
              qr_content: (currentUser.target_id || "G-123456") + "_-_" + currentUser.username.replace(/\s+/g, '-')
            });
          }
        } catch (err) {
          console.error("Gagal memuat profil guru:", err);
          setGuruData({
            id_guru: currentUser.target_id || "G-123456",
            nama_guru: currentUser.username,
            nip_nuptk: "-",
            jabatan_tugas: "Guru",
            qr_content: (currentUser.target_id || "G-123456") + "_-_" + currentUser.username.replace(/\s+/g, '-')
          });
        } finally {
          setLoadingGuru(false);
        }
      }
      loadMyProfile();
    }
  }, [currentUser]);

  const handleTriggerAutoAlfa = async (force: boolean = false) => {
    try {
      setSyncingAlfa(true);
      const res = await callGas("jalankanAutoAlfaSistem", [undefined, force]);
      if (res && res.success && res.data) {
        setAutoAlfaInfo(res.data);
        if (res.data.executed) {
          const totalNew = (res.data.siswa_alfa_baru || 0) + (res.data.guru_alfa_baru || 0);
          if (totalNew > 0) {
            setAlfaNotification(`Sistem Auto-Alfa mencatat ${res.data.siswa_alfa_baru} siswa & ${res.data.guru_alfa_baru} guru berjadwal sebagai Alfa.`);
          } else {
            setAlfaNotification(`Sinkronisasi Auto-Alfa selesai: Semua siswa & guru berjadwal telah terverifikasi.`);
          }
        }
      }
      // Refresh metrics
      const mRes = await callGas("getDashboardMetrics");
      if (mRes && mRes.success) {
        setMetrics(mRes.data);
      }
    } catch (err: any) {
      console.error("Gagal menjalankan Auto-Alfa:", err);
    } finally {
      setSyncingAlfa(false);
    }
  };

  useEffect(() => {
    // 1. Instant Cache Render (Stale-While-Revalidate): render immediately from local cache so UI appears in 0ms
    try {
      const cached = callMock("getDashboardMetrics", []);
      if (cached && cached.success && cached.data) {
        setMetrics(cached.data);
        setLoading(false);
      }
    } catch (e) {}

    async function loadMetrics() {
      try {
        // Run auto-alfa check non-blockingly
        callGas("jalankanAutoAlfaSistem", [undefined, false]).then((autoRes) => {
          if (autoRes && autoRes.success && autoRes.data) {
            setAutoAlfaInfo(autoRes.data);
          }
        }).catch(() => {});

        const res = await callGas("getDashboardMetrics");
        if (res && res.success && res.data) {
          setMetrics(res.data);
          setError(null);
        } else if (!metrics) {
          const fallback = callMock("getDashboardMetrics", []);
          if (fallback && fallback.success) {
            setMetrics(fallback.data);
          } else {
            setError(res?.message || "Gagal memuat metrik dashboard");
          }
        }
      } catch (err: any) {
        if (!metrics) {
          const fallback = callMock("getDashboardMetrics", []);
          if (fallback && fallback.success) {
            setMetrics(fallback.data);
          } else {
            setError(err.toString());
          }
        }
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();

    // Periodic check every 2 minutes
    const interval = setInterval(() => {
      handleTriggerAutoAlfa(false);
    }, 120000);

    return () => clearInterval(interval);
  }, []);

  // Fetch Master Data Siswa, Kelas & Guru for student distribution breakdown
  useEffect(() => {
    // Instant cache population for breakdown cards
    const localS = getStorage("data_siswa") || [];
    const localK = getStorage("data_kelas") || [];
    const localG = getStorage("data_guru") || [];
    if (localS.length > 0 || localK.length > 0 || localG.length > 0) {
      setSiswaMasterList(localS);
      setKelasMasterList(localK);
      setGuruMasterList(localG);
      setLoadingBreakdown(false);
    }

    async function loadMasterBreakdown() {
      try {
        if (localS.length === 0 && localK.length === 0) {
          setLoadingBreakdown(true);
        }
        const [resSiswa, resKelas, resGuru] = await Promise.all([
          callGas("getDataMaster", ["Siswa"]),
          callGas("getKelasSemua"),
          callGas("getDataMaster", ["Guru"])
        ]);

        let sList = extractArrayData(resSiswa);
        let kList = extractArrayData(resKelas);
        let gList = extractArrayData(resGuru);

        if (!sList || sList.length === 0) sList = getStorage("data_siswa") || [];
        if (!kList || kList.length === 0) kList = getStorage("data_kelas") || [];
        if (!gList || gList.length === 0) gList = getStorage("data_guru") || [];

        setSiswaMasterList(sList);
        setKelasMasterList(kList);
        setGuruMasterList(gList);
      } catch (err) {
        console.error("Gagal memuat rincian siswa per kelas:", err);
        setSiswaMasterList(getStorage("data_siswa") || []);
        setKelasMasterList(getStorage("data_kelas") || []);
        setGuruMasterList(getStorage("data_guru") || []);
      } finally {
        setLoadingBreakdown(false);
      }
    }

    loadMasterBreakdown();
  }, []);

  // Calculate student distribution per class & gender (must be declared before any conditional returns)
  const { classSummaries, totalSiswaMaster, totalLakiMaster, totalPerempuanMaster, totalKelasMaster } = useMemo(() => {
    const rawSiswa = siswaMasterList || [];
    const rawKelas = kelasMasterList || [];
    const rawGuru = guruMasterList || [];

    // Map wali kelas for each class
    const waliMap = new Map<string, string>();
    rawKelas.forEach((k: any) => {
      const kName = String(typeof k === "string" ? k : (k.nama_kelas || k.kelas || "")).trim();
      const rawWali = typeof k === "object" && k ? (k.wali_kelas || k.wali || k.waliKelas || k.guru_wali || k.nama_guru || "-") : "-";
      let cleanWali = isInvalidWali(rawWali) ? "-" : String(rawWali).trim();
      if (cleanWali.startsWith("G-")) {
        const foundG = rawGuru.find((g: any) => g.id_guru === cleanWali);
        if (foundG && foundG.nama_guru) cleanWali = foundG.nama_guru;
      }
      if (kName) {
        waliMap.set(kName.toLowerCase(), cleanWali);
      }
    });

    // Extract all defined/known classes
    const knownClassSet = new Set<string>();
    rawKelas.forEach((k: any) => {
      const kName = String(typeof k === "string" ? k : (k.nama_kelas || k.kelas || "")).trim();
      if (kName) knownClassSet.add(kName);
    });

    const countMap = new Map<string, { laki: number; perempuan: number; total: number }>();
    let totalLaki = 0;
    let totalPerempuan = 0;
    let validStudentCount = 0;

    rawSiswa.forEach((s: any) => {
      if (!s || typeof s !== "object") return;
      const name = String(s.nama_siswa || s.nama || "").trim();
      const nisn = String(s.nisn || "").trim();
      if (!name && !nisn) return;

      validStudentCount++;

      // Gender check
      const jkRaw = String(s.jenis_kelamin || s.jk || s.gender || "").trim().toLowerCase();
      const isMale = jkRaw.startsWith("l") || jkRaw === "pria" || jkRaw === "male";
      const isFemale = jkRaw.startsWith("p") || jkRaw === "wanita" || jkRaw === "female" || jkRaw === "perempuan";

      if (isMale) totalLaki++;
      else if (isFemale) totalPerempuan++;
      else totalLaki++;

      // Class name
      const rawKelas = String(s.kelas || "").trim();
      const rawJurusan = String(s.jurusan || "").trim();
      const rawCombined = String(s.kelas_jurusan || "").trim();

      let cand = "";
      if (rawCombined) {
        cand = rawCombined;
      } else if (rawKelas && rawJurusan) {
        if (rawKelas.toLowerCase().includes(rawJurusan.toLowerCase())) {
          cand = rawKelas;
        } else {
          cand = `${rawKelas} ${rawJurusan}`;
        }
      } else if (rawKelas) {
        cand = rawKelas;
      } else if (rawJurusan) {
        cand = rawJurusan;
      } else {
        cand = "Tanpa Kelas";
      }

      // Try matching known classes
      const cleanCand = cand.replace(/[\s-]+/g, "").toLowerCase();
      const matched = Array.from(knownClassSet).find(c => {
        const cleanC = c.replace(/[\s-]+/g, "").toLowerCase();
        return cleanC === cleanCand || cleanCand.includes(cleanC) || cleanC.includes(cleanCand);
      });

      const finalClass = matched || cand;

      if (!countMap.has(finalClass)) {
        countMap.set(finalClass, { laki: 0, perempuan: 0, total: 0 });
      }
      const cur = countMap.get(finalClass)!;
      if (isMale) cur.laki++;
      else if (isFemale) cur.perempuan++;
      else cur.laki++;
      cur.total++;
    });

    // Ensure all registered classes exist even if 0 students
    knownClassSet.forEach((kName) => {
      if (!countMap.has(kName)) {
        countMap.set(kName, { laki: 0, perempuan: 0, total: 0 });
      }
    });

    const summaries = Array.from(countMap.entries()).map(([kName, counts]) => {
      const wali = waliMap.get(kName.toLowerCase()) || "-";
      const total = counts.total;
      const persen_laki = total > 0 ? Math.round((counts.laki / total) * 100) : 0;
      const persen_perempuan = total > 0 ? Math.round((counts.perempuan / total) * 100) : 0;
      return {
        nama_kelas: kName,
        wali_kelas: wali,
        laki_laki: counts.laki,
        perempuan: counts.perempuan,
        total,
        persen_laki,
        persen_perempuan
      };
    });

    // Natural sort: X RPL 1, X RPL 2, XI RPL 1, etc.
    summaries.sort((a, b) => a.nama_kelas.localeCompare(b.nama_kelas, undefined, { numeric: true, sensitivity: 'base' }));

    return {
      classSummaries: summaries,
      totalSiswaMaster: validStudentCount,
      totalLakiMaster: totalLaki,
      totalPerempuanMaster: totalPerempuan,
      totalKelasMaster: summaries.length
    };
  }, [siswaMasterList, kelasMasterList, guruMasterList]);

  // Filtered summaries by search query
  const filteredClassSummaries = useMemo(() => {
    if (!classGenderSearch.trim()) return classSummaries;
    const q = classGenderSearch.toLowerCase().trim();
    return classSummaries.filter(c => 
      c.nama_kelas.toLowerCase().includes(q) || 
      c.wali_kelas.toLowerCase().includes(q)
    );
  }, [classSummaries, classGenderSearch]);

  // Chart data for class gender comparison
  const classGenderChartData = useMemo(() => {
    return filteredClassSummaries.map(c => ({
      name: c.nama_kelas,
      "Laki-laki": c.laki_laki,
      "Perempuan": c.perempuan,
      "Total": c.total
    }));
  }, [filteredClassSummaries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative w-12 h-12">
          <div className="absolute w-12 h-12 rounded-full border-4 border-blue-100 animate-pulse"></div>
          <div className="absolute w-12 h-12 rounded-full border-t-4 border-blue-600 animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    const isFetchError = error.includes("Failed to fetch") || error.includes("Gagal menghubungkan");
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-2xl space-y-4 shadow-sm max-w-2xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-extrabold text-base text-rose-950">Gagal Menghubungkan ke Google Apps Script</h4>
            <p className="text-xs text-rose-700 font-mono bg-rose-100/50 p-2 rounded-lg border border-rose-200/50 break-all">{error}</p>
          </div>
        </div>

        {isFetchError && (
          <div className="bg-white rounded-xl p-4 border border-rose-100 text-xs text-gray-700 space-y-2">
            <h5 className="font-bold text-amber-700 flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Panduan Solusi (Cara Memperbaiki):
            </h5>
            <ol className="list-decimal pl-4 space-y-1.5 text-gray-600">
              <li>
                <strong>Atur Akses ke "Anyone" (Siapa saja):</strong> Di halaman editor Google Apps Script Anda, klik tombol biru <strong>Terapkan (Deploy) &gt; Kelola penerapan (Manage deployments)</strong>. Edit penerapan aktif, lalu pastikan kolom <strong>Siapa yang memiliki akses (Who has access)</strong> diatur ke <strong>"Siapa saja" (Anyone)</strong>, bukan "Hanya saya". Ini adalah penyebab paling sering!
              </li>
              <li>
                <strong>Gunakan URL /exec yang benar:</strong> Pastikan URL yang disimpan berakhiran dengan <code>/exec</code>, bukan <code>/edit</code>. Contoh format yang benar: <br />
                <code className="text-blue-600 select-all font-mono break-all text-[10px]">https://script.google.com/macros/s/.../exec</code>
              </li>
              <li>
                <strong>Deploy Ulang (Versi Baru):</strong> Setiap kali Anda mengubah kode Google Apps Script di Google Sheets, Anda harus membuat penerapan baru (New deployment) agar perubahan kodenya aktif.
              </li>
            </ol>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => {
              localStorage.removeItem("SIAS_GAS_URL");
              window.location.reload();
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            Beralih ke Mode Simulasi Offline (Bisa Dicoba Langsung)
          </button>
          <span className="text-xs text-gray-500">
            atau klik menu <strong>Pengaturan</strong> di sidebar kiri untuk mengecek URL Anda.
          </span>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  // Transform chart data for Recharts
  const chartData = metrics.chartLabels.map((label, index) => ({
    name: label,
    "Hadir Masuk": metrics.chartData[index] || 0,
  }));

  // Donut Chart Data for Siswa Status
  const exactSiswaTepat = metrics.siswaTepatInt ? Math.round((metrics.siswaTepatInt * metrics.siswaMasuk) / 100) : metrics.siswaMasuk;
  const exactSiswaTelat = Math.max(0, metrics.siswaMasuk - exactSiswaTepat);
  const exactSiswaAlfa = Math.max(0, metrics.totalSiswa - metrics.siswaMasuk);

  const siswaPieData = [
    { name: "Tepat Waktu", value: exactSiswaTepat, color: "#10b981" },
    { name: "Terlambat", value: exactSiswaTelat, color: "#f59e0b" },
    { name: "Absen / Alpha", value: exactSiswaAlfa, color: "#f43f5e" }
  ].filter(d => d.value > 0);

  // Donut Chart Data for Guru Status
  const exactGuruTepat = metrics.guruTepatInt ? Math.round((metrics.guruTepatInt * metrics.guruMasuk) / 100) : metrics.guruMasuk;
  const exactGuruTelat = Math.max(0, metrics.guruMasuk - exactGuruTepat);
  const exactGuruAbsen = Math.max(0, metrics.totalGuru - metrics.guruMasuk);

  const guruPieData = [
    { name: "Tepat Waktu", value: exactGuruTepat, color: "#6366f1" },
    { name: "Terlambat", value: exactGuruTelat, color: "#f97316" },
    { name: "Belum Absen", value: exactGuruAbsen, color: "#a855f7" }
  ].filter(d => d.value > 0);

  // Comparison Bar Chart Data
  const comparisonBarData = [
    { category: "Total Data", Siswa: metrics.totalSiswa, Guru: metrics.totalGuru },
    { category: "Total Hadir", Siswa: metrics.siswaMasuk, Guru: metrics.guruMasuk },
    { category: "Tepat Waktu", Siswa: exactSiswaTepat, Guru: exactGuruTepat },
    { category: "Absen/Alpha", Siswa: exactSiswaAlfa, Guru: exactGuruAbsen }
  ];

  const cardsSiswa = [
    {
      title: "Total Siswa",
      value: metrics.totalSiswa,
      icon: GraduationCap,
      color: "bg-blue-500 text-white",
      bgLight: "bg-blue-50/50 border-blue-100",
      textCol: "text-blue-900"
    },
    {
      title: "Siswa Hadir",
      value: metrics.siswaMasuk,
      subtitle: `${metrics.siswaMasuk} dari ${metrics.totalSiswa} siswa`,
      icon: CheckCircle,
      color: "bg-emerald-500 text-white",
      bgLight: "bg-emerald-50/50 border-emerald-100",
      textCol: "text-emerald-900"
    },
    {
      title: "Persentase Tepat Waktu",
      value: metrics.siswaTepat,
      subtitle: "Dari total siswa masuk",
      icon: Clock,
      color: "bg-amber-500 text-white",
      bgLight: "bg-amber-50/50 border-amber-100",
      textCol: "text-amber-900"
    },
    {
      title: "Siswa Absen/Alpha",
      value: metrics.totalSiswa - metrics.siswaMasuk,
      subtitle: `${metrics.siswaAlfaInt}% Tingkat Alfa hari ini`,
      icon: AlertTriangle,
      color: "bg-rose-500 text-white",
      bgLight: "bg-rose-50/50 border-rose-100",
      textCol: "text-rose-900"
    },
  ];

  const cardsGuru = [
    {
      title: "Total Guru",
      value: metrics.totalGuru,
      icon: Users,
      color: "bg-indigo-500 text-white",
      bgLight: "bg-indigo-50/50 border-indigo-100",
      textCol: "text-indigo-900"
    },
    {
      title: "Guru Hadir",
      value: metrics.guruMasuk,
      subtitle: `${metrics.guruMasuk} dari ${metrics.totalGuru} guru`,
      icon: CheckCircle,
      color: "bg-teal-500 text-white",
      bgLight: "bg-teal-50/50 border-teal-100",
      textCol: "text-teal-900"
    },
    {
      title: "Guru Tepat Waktu",
      value: metrics.guruTepat,
      subtitle: "Dari total guru masuk",
      icon: Clock,
      color: "bg-orange-500 text-white",
      bgLight: "bg-orange-50/50 border-orange-100",
      textCol: "text-orange-900"
    },
    {
      title: "Guru Absen",
      value: metrics.totalGuru - metrics.guruMasuk,
      subtitle: "Tidak melakukan scan masuk",
      icon: LogOut,
      color: "bg-purple-500 text-white",
      bgLight: "bg-purple-50/50 border-purple-100",
      textCol: "text-purple-900"
    },
  ];

  return (
    <>
      <div className="space-y-8 animate-fade-in print:hidden">
        {/* Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-6 md:p-8 shadow-md border border-indigo-900">
          <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-10">
            <GraduationCap className="w-80 h-80" />
          </div>
          <div className="relative z-10 space-y-2 max-w-xl">
            <span className="bg-indigo-800/60 text-indigo-200 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Monitoring Real-Time
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">SIAS SMK Al-Hikam</h1>
            <p className="text-blue-100/80 text-sm md:text-base leading-relaxed">
              Sistem Informasi Absensi Sekolah modern yang terintegrasi langsung dengan database Google Spreadsheet. Pantau kehadiran siswa dan guru hari ini.
            </p>
          </div>
        </div>

        {/* Auto-Alfa System Status Information Banner */}
        <div className="bg-gradient-to-r from-amber-50 via-orange-50/70 to-rose-50 border border-amber-200/80 rounded-2xl p-4 sm:p-5 shadow-xs transition-all">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-amber-500/10 text-amber-700 rounded-xl border border-amber-300/50 shrink-0 mt-0.5">
              <Clock className="w-5 h-5" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-extrabold text-sm text-gray-900 tracking-tight">
                  Pemberitahuan: Otomatisasi Status Alfa (Batas Jam 18:00 WIB)
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  autoAlfaInfo?.is_after_cutoff || new Date().getHours() >= 18
                    ? "bg-rose-100 text-rose-800 border-rose-200"
                    : "bg-emerald-100 text-emerald-800 border-emerald-200"
                }`}>
                  {autoAlfaInfo?.is_after_cutoff || new Date().getHours() >= 18
                    ? "Batas 18:00 WIB Tercapai • Auto-Alfa Aktif"
                    : "Menunggu Batas 18:00 WIB • Standby Otomatis"}
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Siswa dan guru yang memiliki jadwal (mengajar/fleksibel) dan belum melakukan absensi sampai pukul <strong>18:00 WIB</strong> di hari yang sama akan secara otomatis dicatat oleh sistem sebagai <strong>Alfa (Tidak Hadir)</strong>.
              </p>
              {alfaNotification && (
                <p className="text-xs font-semibold text-amber-800 bg-amber-100/60 px-2.5 py-1 rounded-lg border border-amber-200/60 inline-block mt-1">
                  ✨ {alfaNotification}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section Layouts */}
        {isGuru ? (
          /* Splitted layout for GURU role (Absensi Siswa on Left, My Card on Right) */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Side: Ringkasan Absensi Siswa */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                <h2 className="text-lg font-bold text-gray-800 tracking-tight">Ringkasan Absensi Siswa</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cardsSiswa.map((card, idx) => (
                  <div key={idx} className={`bg-white rounded-xl border p-5 flex items-start justify-between shadow-sm hover:shadow-md transition-all duration-200 ${card.bgLight}`}>
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{card.title}</p>
                      <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">{card.value}</h3>
                      {card.subtitle && (
                        <p className="text-xs text-gray-600 font-medium flex items-center gap-1">
                          {card.title.includes("Persentase") && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                          {card.subtitle}
                        </p>
                      )}
                    </div>
                    <div className={`p-3 rounded-lg ${card.color}`}>
                      <card.icon className="w-5 h-5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side: Kartu Pegawai Saya */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-extrabold text-gray-800 text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  KARTU PEGAWAI SAYA
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Lihat, unduh atau cetak kartu identitas resmi Anda</p>
              </div>

              {loadingGuru ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="w-8 h-8 rounded-full border-2 border-blue-100 border-t-blue-600 animate-spin"></div>
                  <span className="text-[11px] text-gray-400 mt-2">Memuat profil kartu...</span>
                </div>
              ) : guruData ? (
                <div className="space-y-4">
                  {/* Card scale container */}
                  <div className="flex justify-center border border-gray-100 p-2.5 rounded-xl bg-gray-50/50 overflow-hidden relative">
                    <div className="scale-[0.8] sm:scale-[0.82] lg:scale-[0.72] xl:scale-[0.85] origin-top my-[-15px]">
                      <IdCard item={guruData} kategori="Guru" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => downloadCardPng("front")}
                        disabled={downloadingFront || downloadingBack}
                        className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white font-extrabold text-[11px] py-2.5 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        {downloadingFront ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        Unduh Depan
                      </button>
                      <button
                        onClick={() => downloadCardPng("back")}
                        disabled={downloadingFront || downloadingBack}
                        className="bg-slate-800 hover:bg-slate-700 disabled:bg-slate-600 text-white font-extrabold text-[11px] py-2.5 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        {downloadingBack ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        Unduh Belakang
                      </button>
                    </div>

                    <button
                      onClick={() => window.print()}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-gray-200/50"
                    >
                      <Printer className="w-4 h-4 text-gray-500" />
                      Cetak Kartu Pegawai (PDF/Print)
                    </button>
                    
                    <button
                      onClick={() => {
                        const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(guruData.qr_content)}`;
                        const link = document.createElement("a");
                        link.href = url;
                        link.target = "_blank";
                        link.download = `QR_Guru_${guruData.id_guru}.png`;
                        link.click();
                      }}
                      className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-[11px] py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-gray-400" />
                      Unduh QR Code Saja
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-gray-400">
                  Data kartu tidak ditemukan.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Normal layout for ADMIN or TU role */
          <>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                <h2 className="text-lg font-bold text-gray-800 tracking-tight">Ringkasan Absensi Siswa</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cardsSiswa.map((card, idx) => (
                  <div key={idx} className={`bg-white rounded-xl border p-5 flex items-start justify-between shadow-sm hover:shadow-md transition-all duration-200 ${card.bgLight}`}>
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{card.title}</p>
                      <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">{card.value}</h3>
                      {card.subtitle && (
                        <p className="text-xs text-gray-600 font-medium flex items-center gap-1">
                          {card.title.includes("Persentase") && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                          {card.subtitle}
                        </p>
                      )}
                    </div>
                    <div className={`p-3 rounded-lg ${card.color}`}>
                      <card.icon className="w-5 h-5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
                <h2 className="text-lg font-bold text-gray-800 tracking-tight">Ringkasan Absensi Guru</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cardsGuru.map((card, idx) => (
                  <div key={idx} className={`bg-white rounded-xl border p-5 flex items-start justify-between shadow-sm hover:shadow-md transition-all duration-200 ${card.bgLight}`}>
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{card.title}</p>
                      <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">{card.value}</h3>
                      {card.subtitle && (
                        <p className="text-xs text-gray-600 font-medium flex items-center gap-1">
                          {card.subtitle}
                        </p>
                      )}
                    </div>
                    <div className={`p-3 rounded-lg ${card.color}`}>
                      <card.icon className="w-5 h-5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* SECTION: RINGKASAN JUMLAH SISWA PER KELAS (LAKI-LAKI & PEREMPUAN) */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-6 bg-sky-600 rounded-full"></span>
              <div>
                <h2 className="text-lg font-bold text-gray-800 tracking-tight flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-sky-600" />
                  Ringkasan Jumlah Siswa per Kelas
                </h2>
                <p className="text-xs text-gray-500">
                  Distribusi dan proporsi murid berdasarkan kelas dan jenis kelamin (Laki-laki & Perempuan)
                </p>
              </div>
            </div>

            {/* View Mode & Search Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari kelas / wali..."
                  value={classGenderSearch}
                  onChange={(e) => setClassGenderSearch(e.target.value)}
                  className="bg-white border border-gray-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-sky-500 w-44 sm:w-52 shadow-xs font-medium"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                {classGenderSearch && (
                  <button
                    onClick={() => setClassGenderSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* View Mode Tabs */}
              <div className="flex bg-gray-100 p-0.5 rounded-xl border border-gray-200 text-xs font-bold">
                <button
                  onClick={() => setClassGenderViewMode("grid")}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    classGenderViewMode === "grid"
                      ? "bg-white text-sky-700 shadow-xs"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                  title="Tampilan Grid Kartu"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  onClick={() => setClassGenderViewMode("table")}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    classGenderViewMode === "table"
                      ? "bg-white text-sky-700 shadow-xs"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                  title="Tampilan Tabel Rinci"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tabel</span>
                </button>
                <button
                  onClick={() => setClassGenderViewMode("chart")}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    classGenderViewMode === "chart"
                      ? "bg-white text-sky-700 shadow-xs"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                  title="Tampilan Grafik Batang"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Grafik</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4 Mini Summary Stats Header Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total Siswa Master */}
            <div className="bg-white rounded-xl border border-blue-100 p-3.5 flex items-center justify-between shadow-xs bg-blue-50/30">
              <div className="space-y-0.5">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Siswa Terdata</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-blue-950">{totalSiswaMaster}</span>
                  <span className="text-[11px] text-gray-500 font-medium">siswa</span>
                </div>
              </div>
              <div className="p-2.5 bg-blue-500 text-white rounded-xl shadow-xs">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>

            {/* Siswa Laki-laki */}
            <div className="bg-white rounded-xl border border-sky-100 p-3.5 flex items-center justify-between shadow-xs bg-sky-50/30">
              <div className="space-y-0.5">
                <p className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">Laki-laki (L)</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-sky-950">{totalLakiMaster}</span>
                  <span className="text-[11px] font-bold text-sky-600 bg-sky-100 px-1.5 py-0.5 rounded-md">
                    {totalSiswaMaster > 0 ? Math.round((totalLakiMaster / totalSiswaMaster) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div className="p-2.5 bg-sky-600 text-white rounded-xl shadow-xs">
                <Users className="w-5 h-5" />
              </div>
            </div>

            {/* Siswa Perempuan */}
            <div className="bg-white rounded-xl border border-rose-100 p-3.5 flex items-center justify-between shadow-xs bg-rose-50/30">
              <div className="space-y-0.5">
                <p className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Perempuan (P)</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-rose-950">{totalPerempuanMaster}</span>
                  <span className="text-[11px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded-md">
                    {totalSiswaMaster > 0 ? Math.round((totalPerempuanMaster / totalSiswaMaster) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div className="p-2.5 bg-rose-500 text-white rounded-xl shadow-xs">
                <Users className="w-5 h-5" />
              </div>
            </div>

            {/* Total Rombel Kelas */}
            <div className="bg-white rounded-xl border border-emerald-100 p-3.5 flex items-center justify-between shadow-xs bg-emerald-50/30">
              <div className="space-y-0.5">
                <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Total Rombel Kelas</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-emerald-950">{totalKelasMaster}</span>
                  <span className="text-[11px] text-gray-500 font-medium">kelas</span>
                </div>
              </div>
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Main View Area */}
          {loadingBreakdown ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col items-center justify-center space-y-2 shadow-xs">
              <Loader2 className="w-6 h-6 text-sky-600 animate-spin" />
              <p className="text-xs text-gray-500 font-medium">Memuat data rincian siswa per kelas...</p>
            </div>
          ) : filteredClassSummaries.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-2 shadow-xs">
              <Info className="w-8 h-8 text-gray-400 mx-auto" />
              <p className="text-xs font-bold text-gray-700">Tidak ada kelas yang sesuai dengan kata kunci pencarian.</p>
              {classGenderSearch && (
                <button
                  onClick={() => setClassGenderSearch("")}
                  className="text-xs text-sky-600 font-bold hover:underline cursor-pointer"
                >
                  Reset Pencarian
                </button>
              )}
            </div>
          ) : classGenderViewMode === "grid" ? (
            /* VIEW 1: GRID CARDS */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredClassSummaries.map((cls, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all duration-200 p-4 space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-gray-900 bg-sky-50 text-sky-800 border border-sky-200/60 px-2.5 py-1 rounded-lg">
                          {cls.nama_kelas}
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                        {cls.total} Siswa
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-500 mt-2 truncate">
                      <strong className="text-gray-600">Wali:</strong> {cls.wali_kelas || "-"}
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {/* 2 Gender Count Boxes */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-sky-50/70 border border-sky-100/80 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] font-bold text-sky-700 uppercase tracking-tight">Laki-laki</p>
                        <div className="text-base font-extrabold text-sky-950 mt-0.5">{cls.laki_laki}</div>
                        <span className="text-[10px] font-bold text-sky-600 bg-sky-100/80 px-1.5 py-0.5 rounded inline-block mt-0.5">
                          {cls.persen_laki}%
                        </span>
                      </div>

                      <div className="bg-rose-50/70 border border-rose-100/80 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] font-bold text-rose-700 uppercase tracking-tight">Perempuan</p>
                        <div className="text-base font-extrabold text-rose-950 mt-0.5">{cls.perempuan}</div>
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-100/80 px-1.5 py-0.5 rounded inline-block mt-0.5">
                          {cls.persen_perempuan}%
                        </span>
                      </div>
                    </div>

                    {/* Proportion Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                        <div
                          className="bg-sky-500 h-full transition-all duration-300"
                          style={{ width: `${cls.persen_laki}%` }}
                          title={`Laki-laki: ${cls.laki_laki} (${cls.persen_laki}%)`}
                        ></div>
                        <div
                          className="bg-rose-500 h-full transition-all duration-300"
                          style={{ width: `${cls.persen_perempuan}%` }}
                          title={`Perempuan: ${cls.perempuan} (${cls.persen_perempuan}%)`}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400 font-medium px-0.5">
                        <span className="text-sky-700 font-semibold">{cls.laki_laki} L</span>
                        <span className="text-rose-700 font-semibold">{cls.perempuan} P</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : classGenderViewMode === "table" ? (
            /* VIEW 2: TABEL RINCI */
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="py-3 px-4 w-12 text-center">No</th>
                      <th className="py-3 px-4">Nama Kelas</th>
                      <th className="py-3 px-4">Wali Kelas</th>
                      <th className="py-3 px-4 text-center text-sky-800">Laki-laki (L)</th>
                      <th className="py-3 px-4 text-center text-rose-800">Perempuan (P)</th>
                      <th className="py-3 px-4 text-center">Total Siswa</th>
                      <th className="py-3 px-4 w-48 text-center">Proporsi Gender (L / P)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredClassSummaries.map((cls, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-4 text-center font-bold text-gray-400">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <span className="font-extrabold text-gray-900 bg-sky-50 text-sky-800 border border-sky-100 px-2 py-0.5 rounded-md">
                            {cls.nama_kelas}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 font-medium">{cls.wali_kelas || "-"}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-extrabold text-sky-950">{cls.laki_laki}</span>
                          <span className="text-[10px] text-sky-600 font-bold ml-1">({cls.persen_laki}%)</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-extrabold text-rose-950">{cls.perempuan}</span>
                          <span className="text-[10px] text-rose-600 font-bold ml-1">({cls.persen_perempuan}%)</span>
                        </td>
                        <td className="py-3 px-4 text-center font-extrabold text-gray-900">
                          {cls.total}
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                              <div
                                className="bg-sky-500 h-full"
                                style={{ width: `${cls.persen_laki}%` }}
                              ></div>
                              <div
                                className="bg-rose-500 h-full"
                                style={{ width: `${cls.persen_perempuan}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-[9px] text-gray-400 font-semibold px-0.5">
                              <span className="text-sky-600">{cls.persen_laki}% L</span>
                              <span className="text-rose-600">{cls.persen_perempuan}% P</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-200 text-xs font-extrabold text-slate-800">
                      <td colSpan={3} className="py-3.5 px-4 text-right uppercase tracking-wider">
                        Total Keseluruhan ({filteredClassSummaries.length} Kelas):
                      </td>
                      <td className="py-3.5 px-4 text-center text-sky-900">
                        {filteredClassSummaries.reduce((sum, c) => sum + c.laki_laki, 0)}
                      </td>
                      <td className="py-3.5 px-4 text-center text-rose-900">
                        {filteredClassSummaries.reduce((sum, c) => sum + c.perempuan, 0)}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-900">
                        {filteredClassSummaries.reduce((sum, c) => sum + c.total, 0)}
                      </td>
                      <td className="py-3.5 px-4 text-center text-[11px] text-slate-500">
                        {totalSiswaMaster > 0
                          ? `${Math.round((totalLakiMaster / totalSiswaMaster) * 100)}% L • ${Math.round((totalPerempuanMaster / totalSiswaMaster) * 100)}% P`
                          : "-"}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            /* VIEW 3: GRAFIK BATANG KOMPARASI GENDER */
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-gray-800 text-sm flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-sky-600" />
                    Grafik Komparasi Siswa Laki-laki vs Perempuan per Rombel
                  </h3>
                  <p className="text-xs text-gray-500">Visualisasi komparatif jumlah siswa laki-laki dan perempuan pada setiap rombel kelas</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <div className="flex items-center gap-1.5 text-sky-700">
                    <span className="w-3 h-3 bg-sky-500 rounded-sm"></span>
                    Laki-laki (L)
                  </div>
                  <div className="flex items-center gap-1.5 text-rose-700">
                    <span className="w-3 h-3 bg-rose-500 rounded-sm"></span>
                    Perempuan (P)
                  </div>
                </div>
              </div>

              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={classGenderChartData}
                    margin={{ top: 15, right: 15, left: -20, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderRadius: "12px",
                        color: "#fff",
                        border: "none",
                        fontSize: "12px",
                        padding: "8px 12px"
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    <Bar dataKey="Laki-laki" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Perempuan" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Section Diagram / Charts Interactive */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-800 tracking-tight">Diagram Visualisasi Data Absensi</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Donut Chart: Komposisi Kehadiran Siswa */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Diagram Status Siswa
                  </h3>
                  <span className="text-[11px] font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">Hari Ini</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">Proporsi ketepatan waktu & alpha siswa</p>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={siswaPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {siswaPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#1e293b", borderRadius: "10px", color: "#fff", border: "none", fontSize: "12px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 pt-2 border-t border-gray-100 text-center">
                <div>
                  <div className="text-[10px] text-gray-400 font-medium">Tepat</div>
                  <div className="text-sm font-extrabold text-emerald-600">{exactSiswaTepat}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-medium">Terlambat</div>
                  <div className="text-sm font-extrabold text-amber-600">{exactSiswaTelat}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-medium">Alpha</div>
                  <div className="text-sm font-extrabold text-rose-600">{exactSiswaAlfa}</div>
                </div>
              </div>
            </div>

            {/* Donut Chart: Komposisi Kehadiran Guru */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    Diagram Status Guru
                  </h3>
                  <span className="text-[11px] font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">Hari Ini</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">Proporsi ketepatan waktu & absen guru</p>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={guruPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {guruPieData.map((entry, index) => (
                          <Cell key={`cell-guru-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#1e293b", borderRadius: "10px", color: "#fff", border: "none", fontSize: "12px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 pt-2 border-t border-gray-100 text-center">
                <div>
                  <div className="text-[10px] text-gray-400 font-medium">Tepat</div>
                  <div className="text-sm font-extrabold text-indigo-600">{exactGuruTepat}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-medium">Terlambat</div>
                  <div className="text-sm font-extrabold text-orange-600">{exactGuruTelat}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-medium">Absen</div>
                  <div className="text-sm font-extrabold text-purple-600">{exactGuruAbsen}</div>
                </div>
              </div>
            </div>

            {/* Bar Chart: Komparasi Siswa vs Guru */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between md:col-span-2 lg:col-span-1">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                    <BarChart2 className="w-4 h-4 text-blue-600" />
                    Komparasi Siswa & Guru
                  </h3>
                  <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">Matriks</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">Diagram perbandingan data keseluruhan</p>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonBarData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="category" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderRadius: "10px", color: "#fff", border: "none", fontSize: "11px" }} />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Bar dataKey="Siswa" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Guru" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="text-[11px] text-gray-500 text-center pt-2 border-t border-gray-100">
                Visualisasi komparatif antara jumlah siswa dan guru.
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Chart & Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Area: Tren Kehadiran */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Diagram Tren Kehadiran Siswa
                </h3>
                <p className="text-xs text-gray-500">Fluktuasi siswa hadir masuk dalam 6 hari belajar terakhir</p>
              </div>
              <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                6 Hari Terakhir
              </span>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e293b", borderColor: "#1e293b", borderRadius: "12px", color: "#fff" }}
                    labelStyle={{ fontWeight: "bold" }}
                  />
                  <Area type="monotone" dataKey="Hadir Masuk" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorHadir)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Info/Warning Panel */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 text-lg">Indikator Disiplin</h3>
              <p className="text-xs text-gray-500">Analisis disiplin waktu berdasarkan tingkat keterlambatan</p>
              
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-gray-700">
                    <span>Kehadiran Tepat Waktu (Siswa)</span>
                    <span>{metrics.siswaTepat}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${metrics.siswaTepatInt}%` }}></div>
                  </div>
                </div>

                {!isGuru && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-gray-700">
                      <span>Kehadiran Tepat Waktu (Guru)</span>
                      <span>{metrics.guruTepat}</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${metrics.guruTepatInt}%` }}></div>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-gray-700">
                    <span>Rata-rata Kehadiran Keseluruhan</span>
                    <span>
                      {isGuru 
                        ? `${Math.round((metrics.siswaMasuk / Math.max(1, metrics.totalSiswa)) * 100)}%`
                        : `${Math.round(((metrics.siswaMasuk + metrics.guruMasuk) / Math.max(1, metrics.totalSiswa + metrics.totalGuru)) * 100)}%`
                      }
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ 
                      width: isGuru 
                        ? `${Math.round((metrics.siswaMasuk / Math.max(1, metrics.totalSiswa)) * 100)}%`
                        : `${Math.round(((metrics.siswaMasuk + metrics.guruMasuk) / Math.max(1, metrics.totalSiswa + metrics.totalGuru)) * 100)}%`
                    }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs text-slate-600 leading-relaxed">
              💡 <strong>Saran Disiplin:</strong> Dorong guru dan siswa untuk selalu melakukan scan masuk sebelum <strong>07:15 WIB</strong> untuk meningkatkan rasio kehadiran tepat waktu.
            </div>
          </div>
        </div>
      </div>

      {/* Off-screen elements for high-resolution PNG rendering */}
      {isGuru && guruData && (
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
          <div ref={frontCardRef} style={{ width: "325px", height: "204px" }}>
            <IdCard item={guruData} kategori="Guru" side="front" />
          </div>
          <div ref={backCardRef} style={{ width: "325px", height: "204px" }}>
            <IdCard item={guruData} kategori="Guru" side="back" />
          </div>
        </div>
      )}

      {/* Full scale render strictly for standard window.print() output when Guru prints card on A4 */}
      {isGuru && guruData && (
        <div className="hidden print:block w-full">
          <div className="print-a4-page">
            <IdCard item={guruData} kategori="Guru" />
          </div>
        </div>
      )}
    </>
  );
}
