/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from "react";
import { 
  LayoutDashboard, 
  ScanQrCode, 
  Database, 
  FilePieChart, 
  Settings as SettingsIcon, 
  LogOut, 
  GraduationCap, 
  AlertTriangle, 
  Menu, 
  X,
  Lock,
  User,
  ExternalLink,
  Calendar,
  ScanLine,
  CreditCard,
  Zap,
  Clock,
  Sparkles,
  ShieldCheck
} from "lucide-react";
import { callGas, isUsingMock, getGasUrl, getStorageKey, extractArrayData, getStorage, isInvalidWali, getSchoolProfile } from "./lib/gasApi";
import { User as UserType } from "./types";

// Component imports
import Dashboard from "./components/Dashboard";
import AbsensiScanner from "./components/AbsensiScanner";
import AutoScannerBoard from "./components/AutoScannerBoard";
import DesainKartu from "./components/DesainKartu";
import DataMaster from "./components/DataMaster";
import Laporan from "./components/Laporan";
import Settings from "./components/Settings";
import JadwalGuru from "./components/JadwalGuru";

type TabType = "dashboard" | "absensi" | "scanner_auto" | "desain_kartu" | "data_master" | "jadwal_guru" | "laporan" | "settings";

export default function App() {
  const [session, setSession] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usingMock, setUsingMock] = useState(isUsingMock());
  const [currentTime, setCurrentTime] = useState("");

  // Login Form States
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Clock Ticker in Top Bar
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Global Keyboard Shortcuts (e.g. F2 or Shift+S to jump to Scan)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        setActiveTab("absensi");
      } else if (e.key === "F3") {
        e.preventDefault();
        setActiveTab("scanner_auto");
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Sync mock mode status when settings might have saved new GAS URL
  useEffect(() => {
    const handleUrlCheck = () => {
      setUsingMock(isUsingMock());
    };
    const interval = setInterval(handleUrlCheck, 2000);
    return () => clearInterval(interval);
  }, []);

  // Check saved session
  useEffect(() => {
    const saved = localStorage.getItem(getStorageKey("SIAS_SESSION"));
    if (saved) {
      try {
        setSession(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem(getStorageKey("SIAS_SESSION"));
      }
    }
  }, []);

  // Sync card settings from spreadsheet to localStorage when user is logged in
  useEffect(() => {
    if (session) {
      callGas("getPengaturanSemua")
        .then((res) => {
          if (res && res.success !== false) {
            const keys = [
              'cardSchoolName',
              'cardSchoolAddress',
              'cardPrincipalName',
              'cardSignatureUrl',
              'cardLogoLeftUrl',
              'cardLogoRightUrl'
            ];
            keys.forEach((key) => {
              if (res[key] !== undefined) {
                localStorage.setItem(getStorageKey(key), res[key]);
              }
            });
          }
        })
        .catch((err) => {
          console.error("Gagal sinkronisasi kartu pengaturan:", err);
        });
    }
  }, [session]);

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoading(true);

    try {
      const res = await callGas("verifikasiLogin", [username, password]);
      if (res && res.success) {
        const userSession: UserType = {
          username: res.username || username,
          role: res.role || "Admin",
          target_id: res.target_id || "-"
        };
        setSession(userSession);
        localStorage.setItem(getStorageKey("SIAS_SESSION"), JSON.stringify(userSession));
      } else {
        setLoginError(res?.message || "Username atau password salah!");
      }
    } catch (err: any) {
      setLoginError("Error server: " + err.toString());
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm("Apakah Anda yakin ingin keluar dari sistem?")) {
      setSession(null);
      localStorage.removeItem(getStorageKey("SIAS_SESSION"));
      setActiveTab("dashboard");
    }
  };

  const isGuru = session?.role === "Guru" || session?.role === "Wali Kelas";
  const isAdmin = session?.role === "Admin" || session?.role === "Administrator" || (!isGuru && session?.role !== "TU");
  const [isWaliKelas, setIsWaliKelas] = useState<boolean>(false);

  useEffect(() => {
    if (session && (session.role === "Guru" || session.role === "Wali Kelas")) {
      if (session.role === "Wali Kelas") {
        setIsWaliKelas(true);
        return;
      }
      Promise.all([
        callGas("getKelasSemua"),
        callGas("getDataMaster", ["Guru"])
      ]).then(([resKelas, resGuru]) => {
        let kelasData = extractArrayData(resKelas);
        if (!kelasData || kelasData.length === 0) {
          kelasData = getStorage("data_kelas") || [];
        }
        const guruData = extractArrayData(resGuru);
        
        const currentGuru = guruData.find((g: any) => 
          g.id_guru === session.target_id || 
          g.nama_guru?.toLowerCase() === session.username?.toLowerCase() ||
          session.username?.toLowerCase().includes(g.nama_guru?.toLowerCase())
        );
        
        const namaGuruLoggedIn = currentGuru?.nama_guru || session.username || "";
        const targetIdLoggedIn = currentGuru?.id_guru || session.target_id || "";
        
        const matchedWali = kelasData.some((k: any) => {
          const wk = typeof k === 'object' ? (k.wali_kelas || k.wali || k.waliKelas || k.guru_wali || k.nama_guru || k["Wali Kelas"] || "") : "";
          if (!wk || isInvalidWali(wk)) return false;
          return wk.toLowerCase().includes(namaGuruLoggedIn.toLowerCase()) || 
                 (targetIdLoggedIn && wk.toLowerCase().includes(targetIdLoggedIn.toLowerCase()));
        });
        
        setIsWaliKelas(matchedWali);
      }).catch(err => {
        console.error("Error checking wali kelas:", err);
        const storedKelas = getStorage("data_kelas") || [];
        const matchedWali = storedKelas.some((k: any) => {
          const wk = typeof k === 'object' ? (k.wali_kelas || k.wali || k.waliKelas || k.guru_wali || k.nama_guru || k["Wali Kelas"] || "") : "";
          if (!wk || isInvalidWali(wk)) return false;
          return wk.toLowerCase().includes((session.username || "").toLowerCase());
        });
        setIsWaliKelas(matchedWali);
      });
    } else {
      setIsWaliKelas(false);
    }
  }, [session]);

  // Render sub-views dynamically
  const renderView = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "absensi":
        return <AbsensiScanner session={session} />;
      case "scanner_auto":
        return <AutoScannerBoard session={session} />;
      case "desain_kartu":
        if (!isAdmin) return <Dashboard />;
        return <DesainKartu />;
      case "data_master":
        if (isGuru) return <Dashboard />;
        return <DataMaster />;
      case "jadwal_guru":
        return <JadwalGuru session={session} />;
      case "laporan":
        if (isGuru && !isWaliKelas) return <Dashboard />;
        return <Laporan />;
      case "settings":
        if (session?.role === "TU") return <Dashboard />;
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  const allNavItems = [
    { id: "dashboard" as TabType, label: "Dashboard", icon: LayoutDashboard },
    { id: "absensi" as TabType, label: "Presensi Scanner", icon: ScanQrCode, badge: "Cepat" },
    { id: "scanner_auto" as TabType, label: "Auto Kiosk Board", icon: ScanLine, badge: "Auto" },
    { id: "desain_kartu" as TabType, label: "Desain & Cetak Kartu", icon: CreditCard },
    { id: "data_master" as TabType, label: "Data Master", icon: Database },
    { id: "jadwal_guru" as TabType, label: "Jadwal Guru & Piket", icon: Calendar },
    { id: "laporan" as TabType, label: "Laporan & Rekap", icon: FilePieChart },
    { id: "settings" as TabType, label: "Pengaturan", icon: SettingsIcon },
  ];

  const navItems = allNavItems.filter((item) => {
    if (item.id === "desain_kartu") return isAdmin;
    if (isGuru) {
      if (item.id === "laporan") {
        return isWaliKelas;
      }
      return item.id === "dashboard" || item.id === "absensi" || item.id === "scanner_auto" || item.id === "jadwal_guru" || item.id === "settings";
    }
    if (session?.role === "TU") {
      return item.id !== "settings";
    }
    return true;
  }).map((item) => {
    if (isGuru && item.id === "settings") {
      return { ...item, label: "Ubah Password" };
    }
    return item;
  });

  if (!session) {
    /* LOGIN PANEL */
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 selection:bg-indigo-600 selection:text-white relative overflow-hidden">
        
        {/* Subtle glow effect */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="absolute top-4 right-4 bg-slate-900 border border-slate-800 text-slate-400 text-xs px-3 py-1.5 rounded-full flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${usingMock ? "bg-amber-500" : "bg-emerald-500 animate-pulse"}`}></span>
          {usingMock ? "Database Simulasi Offline" : "Google Sheets GAS Terkoneksi"}
        </div>

        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-600/20 mx-auto mb-4">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">SIAS {getSchoolProfile().namaSekolah}</h1>
            <p className="text-xs text-slate-400 font-medium">Sistem Informasi Absensi Sekolah Modern & Presensi Cepat</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-2xl text-xs flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{loginError}</span>
                </div>
                {(loginError.includes("Failed to fetch") || !usingMock) && (
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem("SIAS_GAS_URL");
                      setUsingMock(true);
                      setLoginError(null);
                      setUsername("admin");
                      setPassword("admin123");
                      window.location.reload();
                    }}
                    className="w-full mt-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-1.5 px-3 rounded-xl text-[11px] transition-all"
                  >
                    Beralih ke Mode Simulasi Offline (Bisa Langsung Masuk)
                  </button>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Username</label>
              <div className="relative">
                <input 
                  type="text"
                  required
                  placeholder="Masukkan username..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-4 text-xs font-medium text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Password</label>
              <div className="relative">
                <input 
                  type="password"
                  required
                  placeholder="Masukkan password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-4 text-xs font-medium text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              {loading ? "Memverifikasi..." : "Masuk ke Sistem SIAS"}
            </button>
          </form>

          {usingMock && (
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center">
              <p className="text-[11px] text-slate-500">
                💡 Mode simulasi aktif. Akun default: <br />
                <span className="font-mono text-indigo-400 font-bold">admin</span> / <span className="font-mono text-indigo-400 font-bold">admin123</span>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row print:block">
      
      {/* SIDEBAR NAVIGATION (Desktop) */}
      <aside className="hidden md:flex print:hidden flex-col w-64 bg-slate-950 border-r border-slate-800 text-slate-400 p-4 shrink-0 justify-between">
        <div className="space-y-6">
          {/* Logo Brand */}
          <div className="flex items-center gap-3 px-2 py-2 border-b border-slate-800/80">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-600/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-extrabold text-white tracking-tight uppercase truncate">
                {getSchoolProfile().namaSekolah}
              </h2>
              <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">SIAS Pro 2026</span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive 
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                      isActive ? "bg-white/20 text-white" : "bg-indigo-500/20 text-indigo-400"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Session Footer */}
        <div className="border-t border-slate-800/80 pt-4 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 border border-slate-700">
              {session.username.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate leading-none mb-1">{session.username}</p>
              <span className="text-[10px] text-slate-500 font-semibold uppercase">{session.role}</span>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-all"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            Keluar Sistem
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex flex-col flex-grow min-h-screen overflow-hidden print:overflow-visible">
        
        {/* TOP APP HEADER */}
        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-3.5 flex items-center justify-between print:hidden">
          
          {/* Mobile Menu Button & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span className="font-bold text-slate-900">{getSchoolProfile().namaSekolah}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">{getSchoolProfile().alamatSekolah}</span>
            </div>
          </div>

          {/* Quick Action: Fast Scan Jump & Clock */}
          <div className="flex items-center gap-3">
            
            {/* Quick Scan Button */}
            <button
              onClick={() => setActiveTab("absensi")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === "absensi"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Scan Kilat</span>
              <kbd className="hidden lg:inline bg-indigo-200/50 px-1 rounded text-[10px] font-mono">F2</kbd>
            </button>

            {/* Realtime Clock Badge */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-700">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{currentTime}</span>
            </div>

            {/* Sync Badge */}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold ${
              usingMock ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${usingMock ? "bg-amber-500" : "bg-emerald-500 animate-pulse"}`}></span>
              <span className="hidden md:inline">{usingMock ? "Mode Offline" : "Google Sheets Sync"}</span>
            </span>
          </div>
        </header>

        {/* MOBILE DRAWER */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 md:hidden" onClick={() => setSidebarOpen(false)}>
            <div className="bg-slate-950 border-r border-slate-800 w-64 h-full p-4 flex flex-col justify-between" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-6">
                <div className="flex items-center gap-3 px-2 py-2 border-b border-slate-800">
                  <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xs font-extrabold text-white uppercase">{getSchoolProfile().namaSekolah}</h2>
                    <span className="text-[10px] text-indigo-400 font-semibold">SIAS Pro 2026</span>
                  </div>
                </div>

                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isActive ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-slate-800 pt-4 space-y-3">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    {session.username.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-none mb-1">{session.username}</p>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">{session.role}</span>
                  </div>
                </div>
                <button 
                  onClick={() => { handleLogout(); setSidebarOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/30"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  Keluar Sistem
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MAIN BODY AREA */}
        <main className="flex-grow p-4 md:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {renderView()}
        </main>
      </div>

    </div>
  );
}
