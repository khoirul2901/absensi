/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, FormEvent } from "react";
import { 
  FileText, 
  Search, 
  Calendar, 
  Filter, 
  Download, 
  Printer, 
  Grid, 
  List, 
  CheckCircle, 
  AlertTriangle,
  UserCheck,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Clock,
  Edit3,
  Table,
  Save,
  RefreshCw,
  Sparkles,
  BookOpen,
  Users,
  Loader2,
  XCircle,
  CheckCircle2
} from "lucide-react";
import { callGas, getStorageKey, extractArrayData, formatToIsoDate, getStorage, setStorage, getSchoolProfile } from "../lib/gasApi";
import { LaporanRow, RekapPersentase, AbsensiMengajarItem } from "../types";

export default function Laporan() {
  const [kategori, setKategori] = useState<"Siswa" | "Guru" | "Mengajar">("Siswa");
  const [viewMode, setViewMode] = useState<"detail" | "rekap">("detail");
  const [jenisFilter, setJenisFilter] = useState<"rentang" | "bulan">("bulan");
  
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem(getStorageKey("SIAS_SESSION"));
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const isGuru = currentUser?.role === "Guru";
  const isWaliKelasUser = currentUser?.role === "Wali Kelas";

  useEffect(() => {
    if ((isGuru || isWaliKelasUser) && (kategori === "Guru" || (isWaliKelasUser && kategori === "Mengajar"))) {
      setKategori("Siswa");
    }
  }, [isGuru, isWaliKelasUser, kategori]);
  
  // Filter Fields
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [bulanMinta, setBulanMinta] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("Semua");
  const [selectedGuru, setSelectedGuru] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState<string>("Semua");
  const [classList, setClassList] = useState<string[]>([]);
  const [guruList, setGuruList] = useState<{ id_guru: string; nama_guru: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Loaded Data States
  const [detailLogs, setDetailLogs] = useState<LaporanRow[]>([]);
  const [rekapRows, setRekapRows] = useState<RekapPersentase[]>([]);
  const [mengajarLogs, setMengajarLogs] = useState<AbsensiMengajarItem[]>([]);
  const [rekapMengajarRows, setRekapMengajarRows] = useState<{
    id_guru: string;
    nama_guru: string;
    total: number;
    tepat: number;
    terlambat: number;
    izinSakit: number;
    persentase: string;
  }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pagination States
  const [currentPageDetail, setCurrentPageDetail] = useState(1);
  const [currentPageRekap, setCurrentPageRekap] = useState(1);
  const [perPageOption, setPerPageOption] = useState<string>("10");

  const itemsPerPage = perPageOption === "semua" ? 999999 : (Number(perPageOption) || 10);

  // EDIT KEHADIRAN MODAL STATES
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModeType, setEditModeType] = useState<"bulk" | "single">("bulk");
  const [editKategori, setEditKategori] = useState<"Siswa" | "Guru">("Siswa");
  const [editTanggal, setEditTanggal] = useState<string>(new Date().toISOString().split("T")[0]);
  const [originalTanggal, setOriginalTanggal] = useState<string>("");
  
  // Single edit states
  const [editTargetId, setEditTargetId] = useState<string>("");
  const [editJamMasuk, setEditJamMasuk] = useState<string>("07:00");
  const [editStatusMasuk, setEditStatusMasuk] = useState<string>("Tepat Waktu");
  const [editJamPulang, setEditJamPulang] = useState<string>("15:30");
  const [editStatusPulang, setEditStatusPulang] = useState<string>("Tepat Waktu");
  const [editKet, setEditKet] = useState<string>("");
  const [editSearchQuery, setEditSearchQuery] = useState<string>("");
  const [editEntitiesList, setEditEntitiesList] = useState<any[]>([]);

  // Bulk edit states
  const [bulkFilterKelas, setBulkFilterKelas] = useState<string>("Semua");
  const [bulkSearchQuery, setBulkSearchQuery] = useState<string>("");
  const [bulkTableData, setBulkTableData] = useState<any[]>([]);
  const [loadingBulk, setLoadingBulk] = useState<boolean>(false);
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  useEffect(() => {
    setCurrentPageDetail(1);
    setCurrentPageRekap(1);
  }, [kategori, viewMode, jenisFilter, tanggalMulai, tanggalSelesai, bulanMinta, selectedKelas, selectedGuru, searchQuery, statusFilter]);

  // Set default current month & dates
  useEffect(() => {
    const d = new Date();
    const curMonth = d.toISOString().substring(0, 7); // yyyy-MM
    setBulanMinta(curMonth);
    
    const todayStr = d.toISOString().split("T")[0];
    setTanggalMulai(todayStr);
    setTanggalSelesai(todayStr);
  }, []);

  // Load Classes List & Auto-select Wali Kelas
  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await callGas("getKelasSemua");
        const list = extractArrayData(res);
        let classObjects: { nama_kelas: string; wali_kelas: string }[] = [];

        if (Array.isArray(list) && list.length > 0) {
          classObjects = list.map((item: any) => {
            if (typeof item === "string") {
              return { nama_kelas: item, wali_kelas: "-" };
            }
            return {
              nama_kelas: item.nama_kelas || item.kelas || String(item),
              wali_kelas: item.wali_kelas || item.wali || item.waliKelas || "-"
            };
          }).filter(c => Boolean(c.nama_kelas));
        }

        if (classObjects.length === 0) {
          const stored = getStorage("data_kelas") || [];
          classObjects = stored.map((item: any) => {
            if (typeof item === "string") {
              return { nama_kelas: item, wali_kelas: "-" };
            }
            return {
              nama_kelas: item.nama_kelas || item.kelas || String(item),
              wali_kelas: item.wali_kelas || item.wali || item.waliKelas || "-"
            };
          }).filter((c: any) => Boolean(c.nama_kelas));
        }

        if (classObjects.length === 0) {
          classObjects = [
            { nama_kelas: "X RPL 1", wali_kelas: "-" },
            { nama_kelas: "X RPL 2", wali_kelas: "-" },
            { nama_kelas: "XI RPL 1", wali_kelas: "-" },
            { nama_kelas: "XI RPL 2", wali_kelas: "-" },
            { nama_kelas: "XII RPL 1", wali_kelas: "-" }
          ];
        }

        const names = classObjects.map(c => c.nama_kelas);
        setClassList(names);

        // If current user is a Wali Kelas, auto-select their assigned class
        if (currentUser) {
          const uName = (currentUser.nama_guru || currentUser.username || currentUser.nama || "").toLowerCase();
          const uTargetId = (currentUser.target_id || currentUser.id_guru || "").toLowerCase();

          const myClass = classObjects.find(c => {
            const w = (c.wali_kelas || "").toLowerCase();
            if (!w || w === "-") return false;
            return (uName && w.includes(uName)) || (uTargetId && w.includes(uTargetId));
          });

          if (myClass && myClass.nama_kelas) {
            setSelectedKelas(myClass.nama_kelas);
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
    loadClasses();
  }, [currentUser]);

  // Load Teachers List
  useEffect(() => {
    async function loadGuru() {
      try {
        let res = await callGas("getDataMaster", ["Guru"]);
        let list = (res && res.success && Array.isArray(res.data)) ? res.data : [];
        if (!list || list.length === 0) {
          res = await callGas("getDataGuru");
          list = Array.isArray(res)
            ? res
            : (res && res.success && Array.isArray(res.data) ? res.data : []);
        }
        const parsed = list.map((item: any) => ({
          id_guru: item.id_guru || item.id || "",
          nama_guru: item.nama_guru || item.nama || item.name || String(item)
        })).filter((g: any) => g.nama_guru);
        
        setGuruList(parsed);
      } catch (e) {
        console.error("Gagal memuat data guru:", e);
      }
    }
    loadGuru();
  }, []);

  // Execute query trigger
  const handleQuery = async () => {
    try {
      setLoading(true);
      setLoadingAction(`Memuat rekap laporan ${kategori}...`);
      setError(null);
      
      if (kategori === "Mengajar") {
        let res = await callGas("getAbsensiMengajarGuru");
        let rawLogs: any[] = extractArrayData(res);
        if (!rawLogs || rawLogs.length === 0) {
          const res2 = await callGas("getAbsensiMengajar");
          rawLogs = extractArrayData(res2);
        }
        if (!rawLogs || rawLogs.length === 0) {
          rawLogs = getStorage("absensi_mengajar_guru") || [];
        }

        const normalizedLogs: AbsensiMengajarItem[] = rawLogs.map((item: any) => ({
          id_log_mengajar: String(item.id_log_mengajar || item.id_log || item.id || `LOG-MENG-${Math.random()}`),
          tanggal: formatToIsoDate(item.tanggal || item.Tanggal),
          waktu_absen: String(item.waktu_absen || item.waktu || item.Waktu || item.Jam || "-"),
          hari: String(item.hari || item.Hari || "Senin"),
          id_guru: String(item.id_guru || item.ID_Guru || item.id || "-"),
          nama_guru: String(item.nama_guru || item.Nama_Guru || item.Nama || item.nama || "-"),
          kelas: String(item.kelas || item.Kelas || "-"),
          mapel: String(item.mapel || item.Mapel || "-"),
          jam_ke: Number(item.jam_ke || item.Jam_Ke || item.jam || 1),
          jam_mulai_jadwal: String(item.jam_mulai_jadwal || item.jam_mulai || "-"),
          jam_selesai_jadwal: String(item.jam_selesai_jadwal || item.jam_selesai || "-"),
          status: (item.status || item.Status || "Hadir Tepat Waktu") as any,
          catatan_materi: String(item.catatan_materi || item.Catatan || item.materi || "-")
        }));

        if (normalizedLogs.length > 0) {
          setStorage("absensi_mengajar_guru", normalizedLogs);
        }

        const filtered = normalizedLogs.filter((item) => {
          let matchDate = true;
          const itemDate = formatToIsoDate(item.tanggal);
          if (jenisFilter === "bulan") {
            if (bulanMinta) {
              matchDate = itemDate.startsWith(bulanMinta);
            }
          } else if (jenisFilter === "rentang") {
            if (tanggalMulai && tanggalSelesai) {
              matchDate = itemDate >= tanggalMulai && itemDate <= tanggalSelesai;
            }
          }

          let matchClass = true;
          if (selectedKelas && selectedKelas !== "Semua") {
            const itemK = String(item.kelas || "").toLowerCase().replace(/[\s-]+/g, "");
            const selK = selectedKelas.toLowerCase().replace(/[\s-]+/g, "");
            matchClass = itemK.includes(selK) || selK.includes(itemK);
          }

          let matchGuru = true;
          if (selectedGuru && selectedGuru !== "Semua") {
            const val = selectedGuru.toLowerCase();
            const idG = String(item.id_guru || "").toLowerCase();
            const namaG = String(item.nama_guru || "").toLowerCase();
            matchGuru = idG === val || namaG === val || namaG.includes(val) || val.includes(namaG);
          }

          return matchDate && matchClass && matchGuru;
        });

        setMengajarLogs(filtered);

        // Compute group rekap for Mengajar
        const guruGroup: Record<string, { id_guru: string; nama_guru: string; total: number; tepat: number; terlambat: number; izinSakit: number; tidakHadir: number }> = {};
        filtered.forEach((item) => {
          const key = item.id_guru || item.nama_guru || "GURU";
          if (!guruGroup[key]) {
            guruGroup[key] = {
              id_guru: item.id_guru || "-",
              nama_guru: item.nama_guru || "-",
              total: 0,
              tepat: 0,
              terlambat: 0,
              izinSakit: 0,
              tidakHadir: 0
            };
          }
          guruGroup[key].total += 1;
          const st = String(item.status || "");
          if (st.includes("Tepat")) {
            guruGroup[key].tepat += 1;
          } else if (st.includes("Terlambat")) {
            guruGroup[key].terlambat += 1;
          } else if (st.includes("Tidak Hadir") || st.includes("Alfa")) {
            guruGroup[key].tidakHadir += 1;
          } else {
            guruGroup[key].izinSakit += 1;
          }
        });

        const rekapList = Object.values(guruGroup).map((g) => {
          const totalHadir = g.tepat + g.terlambat;
          const pct = g.total > 0 ? Math.round((totalHadir / g.total) * 100) : 0;
          return {
            ...g,
            persentase: `${pct}%`
          };
        });

        setRekapMengajarRows(rekapList);
      } else {
        // 1. Fetch from getLaporanFilter first
        let hasApiResult = false;
        let rawLogs: any[] = [];

        try {
          const res = await callGas("getLaporanFilter", [
            kategori, 
            selectedKelas, 
            jenisFilter, 
            tanggalMulai, 
            tanggalSelesai, 
            bulanMinta
          ]);
          if (res && res.success !== false) {
            rawLogs = extractArrayData(res);
            hasApiResult = true;
          }
        } catch (e) {
          console.warn("getLaporanFilter error:", e);
        }

        // 2. Multi-fallback logic ONLY if API call failed
        if (!hasApiResult) {
          try {
            const res2 = await callGas(kategori === "Siswa" ? "getPresensiSiswa" : "getPresensiGuru");
            if (res2 && res2.success !== false) {
              rawLogs = extractArrayData(res2);
              hasApiResult = true;
            }
          } catch (e) {}
        }
        if (!hasApiResult) {
          try {
            const res3 = await callGas(kategori === "Siswa" ? "getLaporanSiswa" : "getLaporanGuru");
            if (res3 && res3.success !== false) {
              rawLogs = extractArrayData(res3);
              hasApiResult = true;
            }
          } catch (e) {}
        }
        if (!hasApiResult) {
          rawLogs = getStorage(kategori === "Siswa" ? "laporan_siswa" : "laporan_guru") || [];
        }

        // 3. Normalize raw log items
        const normalizedLogs = rawLogs.map((row: any) => {
          const tgl = formatToIsoDate(row.tanggal || row.Tanggal || row.tgl);
          const idT = String(row.id_siswa || row.id_guru || row.id_target || row.id || row.ID || "");
          const namaT = String(row.nama_siswa || row.nama_guru || row.nama_target || row.nama || row.Nama || "-");
          const kJur = String(row.kelas_jurusan || row.kelas || row.Kelas || "-");
          const jMasuk = String(row.jam_masuk || row.Jam_Masuk || row["Jam Masuk"] || "-");
          const stMasuk = String(row.status_masuk || row.Status_Masuk || row["Status Masuk"] || "-");
          const jPulang = String(row.jam_pulang || row.Jam_Pulang || row["Jam Pulang"] || "-");
          const stPulang = String(row.status_pulang || row.Status_Pulang || row["Status Pulang"] || "-");
          const ket = String(row.ket || row.keterangan || row.Catatan || "-");

          return {
            id_log_siswa: String(row.id_log_siswa || row.id_log || row.id || `LOG-S-${Math.random()}`),
            id_log_guru: String(row.id_log_guru || row.id_log || row.id || `LOG-G-${Math.random()}`),
            tanggal: tgl,
            id_siswa: idT,
            id_guru: idT,
            id_target: idT,
            nama_siswa: namaT,
            nama_guru: namaT,
            nama_target: namaT,
            kelas_jurusan: kJur,
            kelas: kJur,
            jam_masuk: jMasuk,
            status_masuk: stMasuk,
            jam_pulang: jPulang,
            status_pulang: stPulang,
            ket: ket
          };
        }).filter((r: any) => Boolean(r.tanggal));

        if (normalizedLogs.length > 0) {
          setStorage(kategori === "Siswa" ? "laporan_siswa" : "laporan_guru", normalizedLogs);
        }

        // 4. Apply client-side date & class filter
        const filtered = normalizedLogs.filter((row: any) => {
          let matchDate = true;
          if (jenisFilter === "rentang" && tanggalMulai && tanggalSelesai) {
            matchDate = row.tanggal >= tanggalMulai && row.tanggal <= tanggalSelesai;
          } else if (jenisFilter === "bulan" && bulanMinta) {
            matchDate = row.tanggal.startsWith(bulanMinta);
          }

          let matchClass = true;
          if (kategori === "Siswa" && selectedKelas && selectedKelas !== "Semua") {
            const kJurClean = String(row.kelas_jurusan || row.kelas || "").toLowerCase().replace(/[\s-]+/g, "");
            const filterClean = selectedKelas.toLowerCase().replace(/[\s-]+/g, "");
            matchClass = kJurClean.includes(filterClean) || filterClean.includes(kJurClean);
          }

          return matchDate && matchClass;
        });

        if (viewMode === "detail") {
          setDetailLogs(filtered);
        } else {
          // Compute Rekap Persentase
          let masterRes = await callGas("getDataMaster", [kategori]);
          let masterData = extractArrayData(masterRes);
          if (!masterData || masterData.length === 0) {
            masterRes = await callGas(kategori === "Siswa" ? "getDataSiswa" : "getDataGuru");
            masterData = extractArrayData(masterRes);
          }
          if (!masterData || masterData.length === 0) {
            masterData = getStorage(kategori === "Siswa" ? "data_siswa" : "data_guru") || [];
          }

          if (kategori === "Siswa" && selectedKelas && selectedKelas !== "Semua") {
            const cleanKelas = selectedKelas.toLowerCase().replace(/[\s-]+/g, "");
            masterData = masterData.filter((m: any) => {
              const kJur = `${m.kelas || ""} ${m.jurusan || ""}`.toLowerCase().replace(/[\s-]+/g, "");
              return kJur.includes(cleanKelas) || cleanKelas.includes(kJur);
            });
          }

          const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
          const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";

          const rekapList = masterData.map((m: any) => {
            const idTarget = String(m[idKey] || m.id || m.nisn || m.nip_nuptk || "").trim();
            const namaTarget = String(m[nameKey] || m.nama || m.name || "Siswa/Guru").trim();

            const userRpts = filtered.filter((r: any) => {
              const rId = String(r.id_siswa || r.id_guru || r.id_target || "").trim();
              const rNama = String(r.nama_siswa || r.nama_guru || r.nama_target || "").trim();
              if (idTarget && rId && rId === idTarget) return true;
              if (namaTarget && rNama && rNama.toLowerCase() === namaTarget.toLowerCase()) return true;
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
            const pct = totalDays === 0 ? "0%" : `${Math.round((hadir / totalDays) * 100)}%`;

            return {
              id: idTarget,
              nama: namaTarget,
              hadir,
              sakit,
              izin,
              alfa,
              persentase: pct,
              jam_masuk: jamMasuks.length > 0 ? jamMasuks.join(", ") : "-",
              jam_pulang: jamPulangs.length > 0 ? jamPulangs.join(", ") : "-"
            };
          });

          setRekapRows(rekapList);
        }
      }
    } catch (err: any) {
      setError(err.toString());
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  };

  useEffect(() => {
    handleQuery();
  }, [kategori, viewMode, jenisFilter, bulanMinta, tanggalMulai, tanggalSelesai, selectedKelas, selectedGuru]);

  const handleDeleteMengajarLog = async (idLog: string, namaGuru: string) => {
    if (!idLog) return;
    const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus catatan presensi mengajar guru ${namaGuru}?`);
    if (!confirmDelete) return;

    try {
      setLoading(true);
      const res = await callGas("hapusAbsensiMengajarGuru", [idLog]);
      if (res && res.success) {
        alert(res.message || "Riwayat presensi mengajar berhasil dihapus.");
        handleQuery();
      } else {
        alert(res?.message || "Gagal menghapus catatan presensi mengajar.");
      }
    } catch (err: any) {
      alert("Error: " + err.toString());
    } finally {
      setLoading(false);
    }
  };

  // Load master entities for edit dropdown
  const loadMasterForEdit = async (cat: "Siswa" | "Guru") => {
    try {
      const res = await callGas("getDataMaster", [cat]);
      if (res && res.success && Array.isArray(res.data)) {
        setEditEntitiesList(res.data);
      }
    } catch (e) {
      console.error("Gagal memuat master entitas:", e);
    }
  };

  // Load attendance data for bulk edit modal based on selected date
  const loadBulkAttendanceData = async (cat: "Siswa" | "Guru", tgl: string, cls: string) => {
    try {
      setLoadingBulk(true);
      const todayStr = new Date().toISOString().split("T")[0];
      const isToday = tgl === todayStr;

      // 1. Query existing attendance records for exact date from database
      const reportsRes = await callGas("getLaporanFilter", [cat, "Semua", "rentang", tgl, tgl, ""]);
      const existingLogs = (reportsRes && reportsRes.success && Array.isArray(reportsRes.data)) ? reportsRes.data : [];

      // 2. Fetch master entity list
      const masterRes = await callGas("getDataMaster", [cat]);
      const masterList = (masterRes && masterRes.success && Array.isArray(masterRes.data)) ? masterRes.data : [];

      // 3. Fetch live today scans ONLY if selected date is today
      let liveMap: Record<string, any> = {};
      if (isToday) {
        const liveRes = await callGas("getLiveAbsenHariIni", [cat, tgl, "Semua"]);
        if (liveRes && liveRes.success && Array.isArray(liveRes.data)) {
          liveRes.data.forEach((item: any) => {
            if (item.id_target) {
              liveMap[item.id_target] = item;
            }
          });
        }
      }

      const idKey = cat === "Siswa" ? "id_siswa" : "id_guru";
      const nameKey = cat === "Siswa" ? "nama_siswa" : "nama_guru";

      const filteredMaster = masterList.filter((m: any) => {
        if (cat === "Siswa" && cls && cls !== "Semua") {
          const k = `${m.kelas} ${m.jurusan}`;
          return k.toLowerCase().includes(cls.toLowerCase());
        }
        return true;
      });

      const mapped = filteredMaster.map((m: any) => {
        const targetId = m[idKey];
        const log = existingLogs.find((r: any) => (r[idKey] === targetId || r.id_siswa === targetId || r.id_guru === targetId));
        const live = liveMap[targetId];

        return {
          id_target: targetId,
          nama_target: m[nameKey],
          kelas_jurusan: cat === "Siswa" ? `${m.kelas} ${m.jurusan}` : "-",
          jam_masuk: log?.jam_masuk || (isToday && live?.jam_masuk ? live.jam_masuk : "-"),
          status_masuk: log?.status_masuk || (isToday && live?.status_masuk ? live.status_masuk : "-"),
          jam_pulang: log?.jam_pulang || (isToday && live?.jam_pulang ? live.jam_pulang : "-"),
          status_pulang: log?.status_pulang || (isToday && live?.status_pulang ? live.status_pulang : "-"),
          ket: log?.ket && log.ket !== "-" ? log.ket : (isToday && live?.ket && live.ket !== "-" ? live.ket : "-")
        };
      });

      setBulkTableData(mapped);
    } catch (err) {
      console.error("Gagal memuat data presensi massal:", err);
    } finally {
      setLoadingBulk(false);
    }
  };

  const handleOpenEditModal = (row?: LaporanRow, defaultMode?: "bulk" | "single") => {
    const currentCat = isGuru ? "Siswa" : (row ? (row.id_siswa ? "Siswa" : "Guru") : kategori);
    setEditKategori(currentCat);
    loadMasterForEdit(currentCat);

    let defaultDate = new Date().toISOString().split("T")[0];
    if (tanggalMulai) {
      defaultDate = tanggalMulai;
    } else if (jenisFilter === "bulan" && bulanMinta) {
      const todayStr = new Date().toISOString().split("T")[0];
      defaultDate = todayStr.startsWith(bulanMinta) ? todayStr : `${bulanMinta}-01`;
    }

    const initialDate = row ? (row.tanggal || defaultDate) : defaultDate;
    setEditTanggal(initialDate);
    setOriginalTanggal(row?.tanggal || "");

    if (row) {
      setEditModeType("single");
      const targetId = row.id_siswa || row.id_guru || "";
      setEditTargetId(targetId);
      setEditJamMasuk(row.jam_masuk && row.jam_masuk !== "-" ? row.jam_masuk : "07:00");
      setEditStatusMasuk(row.status_masuk && row.status_masuk !== "-" ? row.status_masuk : "Tepat Waktu");
      setEditJamPulang(row.jam_pulang && row.jam_pulang !== "-" ? row.jam_pulang : "15:30");
      setEditStatusPulang(row.status_pulang && row.status_pulang !== "-" ? row.status_pulang : "Tepat Waktu");
      setEditKet(row.ket && row.ket !== "-" ? row.ket : "");
    } else {
      setEditModeType(defaultMode || "bulk");
      setEditTargetId("");
      setEditJamMasuk("07:00");
      setEditStatusMasuk("Tepat Waktu");
      setEditJamPulang("15:30");
      setEditStatusPulang("Tepat Waktu");
      setEditKet("");
      setBulkFilterKelas(selectedKelas || "Semua");
      setBulkSearchQuery("");
      loadBulkAttendanceData(currentCat, initialDate, selectedKelas || "Semua");
    }
    setEditSearchQuery("");
    setShowEditModal(true);
  };

  const handleDeleteKehadiran = async (row?: LaporanRow) => {
    const targetId = row ? (row.id_siswa || row.id_guru || "") : editTargetId;
    const cat = row ? (isGuru ? "Siswa" : (row.id_siswa ? "Siswa" : "Guru")) : editKategori;
    const tgl = row ? row.tanggal : editTanggal;
    const name = row ? (row.nama_siswa || row.nama_guru || "pengguna ini") : "pengguna ini";

    if (!targetId || !tgl) {
      alert("Data presensi tidak valid untuk dihapus.");
      return;
    }

    const confirm = window.confirm(`Apakah Anda yakin ingin menghapus data presensi ${name} pada tanggal ${tgl}?`);
    if (!confirm) return;

    try {
      setLoading(true);

      let res = await callGas("hapusLogKehadiran", [targetId, cat, tgl]);

      if (!res || !res.success) {
        res = await callGas("hapusKehadiran", [targetId, cat, tgl]);
      }
      if (!res || !res.success) {
        res = await callGas("hapusAbsensi", [targetId, cat, tgl]);
      }
      if (!res || !res.success) {
        res = await callGas("hapusAbsen", [targetId, cat, tgl]);
      }
      if (!res || !res.success) {
        res = await callGas("deleteKehadiran", [targetId, cat, tgl]);
      }
      if (!res || !res.success) {
        res = await callGas("simpanKoreksiManual", [targetId, cat, tgl, "-", "-", "-", "-", "-"]);
      }
      if (!res || !res.success) {
        res = await callGas("editKehadiran", [targetId, cat, tgl, "-", "-", "-", "-", "-"]);
      }

      // Cleanup local mock if present
      try {
        const reportsKey = cat === "Siswa" ? "laporan_siswa" : "laporan_guru";
        const key = getStorageKey("MOCK_" + reportsKey);
        const stored = localStorage.getItem(key);
        if (stored) {
          let list = JSON.parse(stored);
          const idKey = cat === "Siswa" ? "id_siswa" : "id_guru";
          list = list.filter((r: any) => !(r.tanggal === tgl && (r[idKey] === targetId || r.id_siswa === targetId || r.id_guru === targetId || r.id_target === targetId)));
          localStorage.setItem(key, JSON.stringify(list));
        }
      } catch (e) {
        // ignore
      }

      alert(`Data presensi ${name} tanggal ${tgl} berhasil dihapus.`);
      setShowEditModal(false);
      handleQuery();
    } catch (err: any) {
      alert("Error menghapus presensi: " + err.toString());
    } finally {
      setLoading(false);
    }
  };

  const handleBulkParamChange = (cat: "Siswa" | "Guru", tgl: string, cls: string) => {
    setEditKategori(cat);
    setEditTanggal(tgl);
    setBulkFilterKelas(cls);
    loadBulkAttendanceData(cat, tgl, cls);
  };

  const handleUpdateBulkCell = (idTarget: string, field: string, value: string) => {
    setBulkTableData((prev) =>
      prev.map((item) => {
        if (item.id_target === idTarget) {
          const updated = { ...item, [field]: value };
          if (field === "status_masuk") {
            if ((value === "Tepat Waktu" || value === "Terlambat") && (item.jam_masuk === "-" || !item.jam_masuk)) {
              updated.jam_masuk = "07:00";
            } else if (value === "Sakit" || value === "Izin" || value === "Alfa" || value === "-") {
              updated.jam_masuk = "-";
            }
          }
          if (field === "status_pulang") {
            if (value === "Tepat Waktu" && (item.jam_pulang === "-" || !item.jam_pulang)) {
              updated.jam_pulang = "15:30";
            } else if (value === "-") {
              updated.jam_pulang = "-";
            }
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleBatchSetStatusMasuk = (val: string) => {
    if (!val) return;
    setBulkTableData((prev) =>
      prev.map((item) => {
        const matchesQuery = !bulkSearchQuery || 
          item.nama_target.toLowerCase().includes(bulkSearchQuery.toLowerCase()) || 
          item.id_target.toLowerCase().includes(bulkSearchQuery.toLowerCase());
        
        if (matchesQuery) {
          let newJam = item.jam_masuk;
          if ((val === "Tepat Waktu" || val === "Terlambat") && (item.jam_masuk === "-" || !item.jam_masuk)) {
            newJam = "07:00";
          } else if (val === "Sakit" || val === "Izin" || val === "Alfa" || val === "-") {
            newJam = "-";
          }
          return { ...item, status_masuk: val, jam_masuk: newJam };
        }
        return item;
      })
    );
  };

  const handleBatchSetStatusPulang = (val: string) => {
    if (!val) return;
    setBulkTableData((prev) =>
      prev.map((item) => {
        const matchesQuery = !bulkSearchQuery || 
          item.nama_target.toLowerCase().includes(bulkSearchQuery.toLowerCase()) || 
          item.id_target.toLowerCase().includes(bulkSearchQuery.toLowerCase());
        
        if (matchesQuery) {
          let newJam = item.jam_pulang;
          if (val === "Tepat Waktu" && (item.jam_pulang === "-" || !item.jam_pulang)) {
            newJam = "15:30";
          } else if (val === "-") {
            newJam = "-";
          }
          return { ...item, status_pulang: val, jam_pulang: newJam };
        }
        return item;
      })
    );
  };

  const handleSaveBulkKehadiran = async () => {
    if (bulkTableData.length === 0) return;
    try {
      setSavingEdit(true);
      let res = await callGas("editKehadiranBulk", [bulkTableData, editKategori, editTanggal]);

      if (res && !res.success && typeof res.message === "string" && res.message.toLowerCase().includes("tidak dikenal")) {
        let successCount = 0;
        for (const item of bulkTableData) {
          if (!item.id_target) continue;
          let itemRes = await callGas("simpanKoreksiManual", [
            item.id_target,
            editKategori,
            editTanggal,
            item.jam_masuk || "-",
            item.status_masuk || "-",
            item.jam_pulang || "-",
            item.status_pulang || "-",
            item.ket || "-"
          ]);

          if (itemRes && !itemRes.success && typeof itemRes.message === "string" && itemRes.message.toLowerCase().includes("tidak dikenal")) {
            itemRes = await callGas("editKehadiran", [
              item.id_target,
              editKategori,
              editTanggal,
              item.jam_masuk || "-",
              item.status_masuk || "-",
              item.jam_pulang || "-",
              item.status_pulang || "-",
              item.ket || "-"
            ]);
          }

          if (itemRes && !itemRes.success && typeof itemRes.message === "string" && itemRes.message.toLowerCase().includes("tidak dikenal")) {
            if (item.status_masuk && item.status_masuk !== "-") {
              itemRes = await callGas("simpanAbsenManual", [item.id_target, editKategori, "Masuk", editTanggal, item.status_masuk, item.ket || "-", item.jam_masuk || "-"]);
            }
            if (item.status_pulang && item.status_pulang !== "-") {
              itemRes = await callGas("simpanAbsenManual", [item.id_target, editKategori, "Pulang", editTanggal, item.status_pulang, item.ket || "-", item.jam_pulang || "-"]);
            }
          }

          if (itemRes && itemRes.success) {
            successCount++;
          }
        }
        res = { success: true, message: `Berhasil memperbarui ${successCount} data presensi tanggal ${editTanggal}!` };
      }

      if (res && res.success) {
        alert(res.message || `Data kehadiran tanggal ${editTanggal} berhasil diperbarui!`);
        if (jenisFilter === "rentang") {
          if (!tanggalMulai || !tanggalSelesai || editTanggal < tanggalMulai || editTanggal > tanggalSelesai) {
            setTanggalMulai(editTanggal);
            setTanggalSelesai(editTanggal);
          }
        } else if (jenisFilter === "bulan") {
          const monthOfEdit = editTanggal.slice(0, 7);
          if (bulanMinta !== monthOfEdit) {
            setBulanMinta(monthOfEdit);
          }
        }
        setShowEditModal(false);
        handleQuery();
      } else {
        alert(res?.message || "Gagal menyimpan perubahan massal.");
      }
    } catch (err: any) {
      alert("Error: " + err.toString());
    } finally {
      setSavingEdit(false);
    }
  };

  const handleTargetOrDateChange = async (targetId: string, tanggalStr: string, cat: "Siswa" | "Guru") => {
    setEditTargetId(targetId);
    setEditTanggal(tanggalStr);

    if (targetId && tanggalStr) {
      try {
        const res = await callGas("getLaporanFilter", [cat, "Semua", "rentang", tanggalStr, tanggalStr, ""]);
        const idKey = cat === "Siswa" ? "id_siswa" : "id_guru";
        const existing = (res && res.success && Array.isArray(res.data))
          ? res.data.find((r: any) => r.tanggal === tanggalStr && (r[idKey] === targetId || r.id_siswa === targetId || r.id_guru === targetId))
          : null;

        if (existing) {
          setEditJamMasuk(existing.jam_masuk && existing.jam_masuk !== "-" ? existing.jam_masuk : "07:00");
          setEditStatusMasuk(existing.status_masuk && existing.status_masuk !== "-" ? existing.status_masuk : "Tepat Waktu");
          setEditJamPulang(existing.jam_pulang && existing.jam_pulang !== "-" ? existing.jam_pulang : "15:30");
          setEditStatusPulang(existing.status_pulang && existing.status_pulang !== "-" ? existing.status_pulang : "Tepat Waktu");
          setEditKet(existing.ket && existing.ket !== "-" ? existing.ket : "");
        } else {
          // If no log recorded on tanggalStr for targetId
          setEditJamMasuk("07:00");
          setEditStatusMasuk("-");
          setEditJamPulang("15:30");
          setEditStatusPulang("-");
          setEditKet("");
        }
      } catch (e) {
        console.error("Gagal memuat data presensi entitas:", e);
      }
    }
  };

  const handleSaveEditKehadiran = async (e: FormEvent) => {
    e.preventDefault();
    if (!editTargetId) {
      alert("Pilih nama / ID entitas terlebih dahulu!");
      return;
    }
    if (!editTanggal) {
      alert("Pilih tanggal absensi!");
      return;
    }

    try {
      setSavingEdit(true);

      // If user changed the date from originalTanggal to editTanggal, delete the old log at originalTanggal first
      if (originalTanggal && originalTanggal !== editTanggal) {
        await callGas("hapusLogKehadiran", [editTargetId, editKategori, originalTanggal]);
      }

      let res = await callGas("simpanKoreksiManual", [
        editTargetId,
        editKategori,
        editTanggal,
        editJamMasuk || "-",
        editStatusMasuk || "-",
        editJamPulang || "-",
        editStatusPulang || "-",
        editKet || "-"
      ]);

      if (res && !res.success && typeof res.message === "string" && res.message.toLowerCase().includes("tidak dikenal")) {
        res = await callGas("editKehadiran", [
          editTargetId,
          editKategori,
          editTanggal,
          editJamMasuk || "-",
          editStatusMasuk || "-",
          editJamPulang || "-",
          editStatusPulang || "-",
          editKet || "-"
        ]);
      }

      if (res && !res.success && typeof res.message === "string" && res.message.toLowerCase().includes("tidak dikenal")) {
        res = await callGas("editKehadiranFull", [
          editTargetId,
          editKategori,
          editTanggal,
          {
            jam_masuk: editJamMasuk || "-",
            status_masuk: editStatusMasuk || "-",
            jam_pulang: editJamPulang || "-",
            status_pulang: editStatusPulang || "-",
            ket: editKet || "-"
          }
        ]);
      }

      if (res && !res.success && typeof res.message === "string" && res.message.toLowerCase().includes("tidak dikenal")) {
        let resMasuk: any = { success: true };
        if (editStatusMasuk && editStatusMasuk !== "-") {
          resMasuk = await callGas("simpanAbsenManual", [
            editTargetId,
            editKategori,
            "Masuk",
            editTanggal,
            editStatusMasuk,
            editKet || "-",
            editJamMasuk || "-"
          ]);
        }
        let resPulang: any = { success: true };
        if (editStatusPulang && editStatusPulang !== "-") {
          resPulang = await callGas("simpanAbsenManual", [
            editTargetId,
            editKategori,
            "Pulang",
            editTanggal,
            editStatusPulang,
            editKet || "-",
            editJamPulang || "-"
          ]);
        }
        res = (resMasuk && resMasuk.success) || (resPulang && resPulang.success)
          ? { success: true, message: `Kehadiran tanggal ${editTanggal} berhasil diperbarui!` }
          : (resMasuk || resPulang);
      }

      if (res && res.success) {
        alert(res.message || `Kehadiran tanggal ${editTanggal} berhasil diperbarui!`);
        if (jenisFilter === "rentang") {
          if (!tanggalMulai || !tanggalSelesai || editTanggal < tanggalMulai || editTanggal > tanggalSelesai) {
            setTanggalMulai(editTanggal);
            setTanggalSelesai(editTanggal);
          }
        } else if (jenisFilter === "bulan") {
          const monthOfEdit = editTanggal.slice(0, 7);
          if (bulanMinta !== monthOfEdit) {
            setBulanMinta(monthOfEdit);
          }
        }
        setShowEditModal(false);
        handleQuery();
      } else {
        alert(res?.message || "Gagal memperbarui kehadiran.");
      }
    } catch (err: any) {
      alert("Error: " + err.toString());
    } finally {
      setSavingEdit(false);
    }
  };

  // Export Filtered data to CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (kategori === "Mengajar") {
      if (viewMode === "detail") {
        if (filteredMengajarLogs.length === 0) return;
        const headers = ["ID Log", "Tanggal", "Hari", "Waktu Absen", "ID Guru", "Nama Guru", "Kelas", "Mapel", "Jam Ke", "Status", "Catatan Materi"];
        csvContent += headers.join(",") + "\n";
        filteredMengajarLogs.forEach(row => {
          const csvRow = [
            row.id_log_mengajar || "-",
            row.tanggal,
            row.hari || "-",
            row.waktu_absen || "-",
            row.id_guru || "-",
            `"${row.nama_guru}"`,
            `"${row.kelas}"`,
            `"${row.mapel}"`,
            `Jam ke-${row.jam_ke}`,
            `"${row.status}"`,
            `"${row.catatan_materi || "-"}"`
          ];
          csvContent += csvRow.join(",") + "\n";
        });
      } else {
        if (filteredRekapMengajarRows.length === 0) return;
        const headers = ["ID Guru", "Nama Guru", "Total Sesi Mengajar", "Hadir Tepat Waktu", "Terlambat", "Izin/Sakit/Tugas", "Persentase Kehadiran"];
        csvContent += headers.join(",") + "\n";
        filteredRekapMengajarRows.forEach(row => {
          const csvRow = [
            row.id_guru,
            `"${row.nama_guru}"`,
            row.total,
            row.tepat,
            row.terlambat,
            row.izinSakit,
            `"${row.persentase}"`
          ];
          csvContent += csvRow.join(",") + "\n";
        });
      }
    } else if (viewMode === "detail") {
      if (detailLogs.length === 0) return;
      const headers = ["ID Log", "Tanggal", "ID", "Nama", "Kelas/Jabatan", "Jam Masuk", "Status Masuk", "Jam Pulang", "Status Pulang", "Keterangan"];
      csvContent += headers.join(",") + "\n";
      
      detailLogs.forEach(row => {
        const id = row.id_siswa || row.id_guru || "-";
        const name = row.nama_siswa || row.nama_guru || "-";
        const position = row.kelas_jurusan || "-";
        const logId = row.id_log_siswa || row.id_log_guru || "-";
        
        const csvRow = [
          logId,
          row.tanggal,
          id,
          `"${name}"`,
          `"${position}"`,
          row.jam_masuk,
          row.status_masuk,
          row.jam_pulang,
          row.status_pulang,
          `"${row.ket || "-"}"`
        ];
        csvContent += csvRow.join(",") + "\n";
      });
    } else {
      if (rekapRows.length === 0) return;
      const headers = ["ID", "Nama", "Hadir", "Sakit", "Izin", "Alfa", "Persentase Kehadiran", "Jam Masuk", "Jam Pulang"];
      csvContent += headers.join(",") + "\n";
      
      rekapRows.forEach(row => {
        const csvRow = [
          row.id,
          `"${row.nama}"`,
          row.hadir,
          row.sakit,
          row.izin,
          row.alfa,
          row.persentase,
          `"${row.jam_masuk}"`,
          `"${row.jam_pulang}"`
        ];
        csvContent += csvRow.join(",") + "\n";
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_${kategori.toLowerCase()}_${viewMode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper: check detail log status matching
  const matchesDetailStatus = (statusMasuk: string, jamMasuk: string, statusPulang?: string) => {
    if (statusFilter === "Semua") return true;
    const sm = String(statusMasuk || "").trim().toLowerCase();
    const jm = String(jamMasuk || "").trim();
    
    const isAlfaOrEmpty = !sm || sm === "-" || sm.includes("alfa") || sm.includes("tidak hadir") || sm.includes("belum") || jm === "-";
    const hasAttended = (jm !== "" && jm !== "-") || (sm !== "" && sm !== "-" && !sm.includes("alfa") && !sm.includes("tidak hadir") && !sm.includes("belum"));

    if (statusFilter === "sudah_absen") {
      return hasAttended;
    }
    if (statusFilter === "belum_absen") {
      return isAlfaOrEmpty;
    }
    if (statusFilter === "tepat_waktu") {
      return sm.includes("tepat");
    }
    if (statusFilter === "terlambat") {
      return sm.includes("terlambat");
    }
    if (statusFilter === "izin_sakit") {
      return sm.includes("izin") || sm.includes("sakit") || sm.includes("dispensasi") || sm.includes("tugas");
    }
    if (statusFilter === "alfa") {
      return sm.includes("alfa") || sm.includes("tidak hadir");
    }
    return true;
  };

  // Helper: check mengajar log status matching
  const matchesMengajarStatus = (status: string, waktuAbsen: string) => {
    if (statusFilter === "Semua") return true;
    const st = String(status || "").trim().toLowerCase();
    const wt = String(waktuAbsen || "").trim();
    
    const isAlfaOrEmpty = !st || st === "-" || st.includes("alfa") || st.includes("tidak hadir") || st.includes("belum") || wt === "-";
    const hasAttended = (wt !== "" && wt !== "-") || (st !== "" && st !== "-" && !st.includes("alfa") && !st.includes("tidak hadir") && !st.includes("belum"));

    if (statusFilter === "sudah_absen") {
      return hasAttended;
    }
    if (statusFilter === "belum_absen") {
      return isAlfaOrEmpty;
    }
    if (statusFilter === "tepat_waktu") {
      return st.includes("tepat");
    }
    if (statusFilter === "terlambat") {
      return st.includes("terlambat");
    }
    if (statusFilter === "izin_sakit") {
      return st.includes("izin") || st.includes("sakit") || st.includes("tugas");
    }
    if (statusFilter === "alfa") {
      return st.includes("alfa") || st.includes("tidak hadir");
    }
    return true;
  };

  // Helper: check rekap % status matching
  const matchesRekapStatus = (row: RekapPersentase) => {
    if (statusFilter === "Semua") return true;
    if (statusFilter === "sudah_absen") {
      return row.hadir > 0;
    }
    if (statusFilter === "belum_absen") {
      return row.hadir === 0 || row.alfa > 0;
    }
    if (statusFilter === "tepat_waktu") {
      return row.hadir > 0;
    }
    if (statusFilter === "terlambat") {
      return row.hadir > 0;
    }
    if (statusFilter === "izin_sakit") {
      return row.izin > 0 || row.sakit > 0;
    }
    if (statusFilter === "alfa") {
      return row.alfa > 0;
    }
    return true;
  };

  // Helper: check rekap mengajar % status matching
  const matchesRekapMengajarStatus = (row: any) => {
    if (statusFilter === "Semua") return true;
    if (statusFilter === "sudah_absen") {
      return (row.tepat + row.terlambat) > 0;
    }
    if (statusFilter === "belum_absen") {
      return (row.tepat + row.terlambat) === 0 || (row.tidakHadir || 0) > 0;
    }
    if (statusFilter === "tepat_waktu") {
      return row.tepat > 0;
    }
    if (statusFilter === "terlambat") {
      return row.terlambat > 0;
    }
    if (statusFilter === "izin_sakit") {
      return row.izinSakit > 0;
    }
    if (statusFilter === "alfa") {
      return (row.tidakHadir || 0) > 0;
    }
    return true;
  };

  // Base filtered logs before status filter (to compute summary badge counts)
  const baseDetailLogs = detailLogs.filter(row => {
    const name = (row.nama_siswa || row.nama_guru || "").toLowerCase();
    const id = (row.id_siswa || row.id_guru || "-").toLowerCase();
    const matchesQuery = name.includes(searchQuery.toLowerCase()) || id.includes(searchQuery.toLowerCase());
    if (kategori === "Guru" && selectedGuru && selectedGuru !== "Semua") {
      const val = selectedGuru.toLowerCase();
      return matchesQuery && (name.includes(val) || val.includes(name) || id === val);
    }
    return matchesQuery;
  });

  const baseRekapRows = rekapRows.filter(row => {
    const name = row.nama.toLowerCase();
    const id = row.id.toLowerCase();
    const matchesQuery = name.includes(searchQuery.toLowerCase()) || id.includes(searchQuery.toLowerCase());
    if (kategori === "Guru" && selectedGuru && selectedGuru !== "Semua") {
      const val = selectedGuru.toLowerCase();
      return matchesQuery && (name.includes(val) || val.includes(name) || id === val);
    }
    return matchesQuery;
  });

  const baseMengajarLogs = mengajarLogs.filter(row => {
    const name = (row.nama_guru || "").toLowerCase();
    const id = (row.id_guru || "").toLowerCase();
    const mapel = (row.mapel || "").toLowerCase();
    const kelas = (row.kelas || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesQuery = name.includes(query) || id.includes(query) || mapel.includes(query) || kelas.includes(query);
    if (selectedGuru && selectedGuru !== "Semua") {
      const val = selectedGuru.toLowerCase();
      return matchesQuery && (name.includes(val) || val.includes(name) || id === val);
    }
    return matchesQuery;
  });

  const baseRekapMengajarRows = rekapMengajarRows.filter(row => {
    const name = row.nama_guru.toLowerCase();
    const id = row.id_guru.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesQuery = name.includes(query) || id.includes(query);
    if (selectedGuru && selectedGuru !== "Semua") {
      const val = selectedGuru.toLowerCase();
      return matchesQuery && (name.includes(val) || val.includes(name) || id === val);
    }
    return matchesQuery;
  });

  // Calculate status summary counts
  const summaryCounts = {
    total: kategori === "Mengajar"
      ? (viewMode === "detail" ? baseMengajarLogs.length : baseRekapMengajarRows.length)
      : (viewMode === "detail" ? baseDetailLogs.length : baseRekapRows.length),
    sudahAbsen: kategori === "Mengajar"
      ? (viewMode === "detail"
          ? baseMengajarLogs.filter(r => {
              const st = String(r.status || "").toLowerCase();
              return st.includes("tepat") || st.includes("terlambat") || (st !== "" && st !== "-" && !st.includes("tidak hadir") && !st.includes("alfa"));
            }).length
          : baseRekapMengajarRows.filter(r => (r.tepat + r.terlambat) > 0).length)
      : (viewMode === "detail"
          ? baseDetailLogs.filter(r => {
              const sm = String(r.status_masuk || "").toLowerCase();
              const jm = String(r.jam_masuk || "").trim();
              return (jm !== "" && jm !== "-") || (sm !== "" && sm !== "-" && !sm.includes("alfa") && !sm.includes("tidak hadir") && !sm.includes("belum"));
            }).length
          : baseRekapRows.filter(r => r.hadir > 0).length),
    belumAbsen: kategori === "Mengajar"
      ? (viewMode === "detail"
          ? baseMengajarLogs.filter(r => {
              const st = String(r.status || "").toLowerCase();
              return !st || st === "-" || st.includes("tidak hadir") || st.includes("alfa") || String(r.waktu_absen || "").trim() === "-";
            }).length
          : baseRekapMengajarRows.filter(r => (r.tepat + r.terlambat) === 0 || (r.tidakHadir || 0) > 0).length)
      : (viewMode === "detail"
          ? baseDetailLogs.filter(r => {
              const sm = String(r.status_masuk || "").toLowerCase();
              const jm = String(r.jam_masuk || "").trim();
              return !sm || sm === "-" || sm.includes("alfa") || sm.includes("tidak hadir") || sm.includes("belum") || jm === "-";
            }).length
          : baseRekapRows.filter(r => r.hadir === 0 || r.alfa > 0).length)
  };

  // Final filtered rows applying status filter
  const filteredDetailLogs = baseDetailLogs.filter(row =>
    matchesDetailStatus(row.status_masuk, row.jam_masuk, row.status_pulang)
  );

  const filteredRekapRows = baseRekapRows.filter(row =>
    matchesRekapStatus(row)
  );

  const filteredMengajarLogs = baseMengajarLogs.filter(row =>
    matchesMengajarStatus(row.status, row.waktu_absen)
  );

  const filteredRekapMengajarRows = baseRekapMengajarRows.filter(row =>
    matchesRekapMengajarStatus(row)
  );

  // Paginated data calculations
  const startIndexDetail = (currentPageDetail - 1) * itemsPerPage;
  const paginatedDetailLogs = filteredDetailLogs.slice(startIndexDetail, startIndexDetail + itemsPerPage);
  const totalPagesDetail = Math.ceil(filteredDetailLogs.length / itemsPerPage);

  const startIndexRekap = (currentPageRekap - 1) * itemsPerPage;
  const paginatedRekapRows = filteredRekapRows.slice(startIndexRekap, startIndexRekap + itemsPerPage);
  const totalPagesRekap = Math.ceil(filteredRekapRows.length / itemsPerPage);

  const paginatedMengajarLogs = filteredMengajarLogs.slice(startIndexDetail, startIndexDetail + itemsPerPage);
  const totalPagesMengajarDetail = Math.ceil(filteredMengajarLogs.length / itemsPerPage);

  const paginatedRekapMengajarRows = filteredRekapMengajarRows.slice(startIndexRekap, startIndexRekap + itemsPerPage);
  const totalPagesMengajarRekap = Math.ceil(filteredRekapMengajarRows.length / itemsPerPage);

  return (
    <div className="space-y-6 animate-fade-in print:bg-white print:p-0">
      
      {/* Page Header (Hidden on print) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Laporan & Rekap Kehadiran</h1>
          <p className="text-xs text-gray-500">Ekstrak logs harian atau rekap persentase presensi untuk wali kelas/kepala sekolah</p>
        </div>

        {/* Categories Selector */}
        <div className="flex flex-wrap bg-gray-50 border border-gray-200 p-1 rounded-xl gap-1">
          <button 
            onClick={() => setKategori("Siswa")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${kategori === "Siswa" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Presensi Siswa</span>
          </button>
          {!isGuru && !isWaliKelasUser && (
            <button 
              onClick={() => setKategori("Guru")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${kategori === "Guru" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Presensi Guru</span>
            </button>
          )}
          {!isWaliKelasUser && (
            <button 
              onClick={() => setKategori("Mengajar")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${kategori === "Mengajar" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>Rekap Presensi Mengajar</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Filter Panel (Hidden on print) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          
          {/* View Mode Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
              <Grid className="w-3.5 h-3.5" />
              Format Tampilan
            </label>
            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
              <button 
                onClick={() => setViewMode("detail")}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1 ${viewMode === "detail" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
              >
                <List className="w-3.5 h-3.5" />
                Detail Log
              </button>
              <button 
                onClick={() => setViewMode("rekap")}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1 ${viewMode === "rekap" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Rekap %
              </button>
            </div>
          </div>

          {/* Status Presensi Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Status Presensi
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPageDetail(1);
                setCurrentPageRekap(1);
              }}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="Semua">Semua Status</option>
              <option value="sudah_absen">✅ Sudah Absen (Hadir)</option>
              <option value="belum_absen">❌ Belum Absen / Alfa</option>
              <option value="tepat_waktu">🟢 Hadir Tepat Waktu</option>
              <option value="terlambat">🟡 Terlambat</option>
              <option value="izin_sakit">🔵 Izin / Sakit / Tugas</option>
              <option value="alfa">🔴 Alfa (Tidak Hadir)</option>
            </select>
          </div>

          {/* Pagination Options */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
              <List className="w-3.5 h-3.5 text-blue-500" />
              Paginasi / Tampilkan
            </label>
            <select
              value={perPageOption}
              onChange={(e) => {
                setPerPageOption(e.target.value);
                setCurrentPageDetail(1);
                setCurrentPageRekap(1);
              }}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="10">10 Data / Hal</option>
              <option value="20">20 Data / Hal</option>
              <option value="50">50 Data / Hal</option>
              <option value="semua">Semua Data (Tanpa Paginasi)</option>
            </select>
          </div>

          {/* Time Filter Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Saringan Waktu
            </label>
            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
              <button 
                onClick={() => setJenisFilter("bulan")}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${jenisFilter === "bulan" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
              >
                Bulan
              </button>
              <button 
                onClick={() => setJenisFilter("rentang")}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${jenisFilter === "rentang" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
              >
                Rentang Hari
              </button>
            </div>
          </div>

          {/* Time Inputs */}
          {jenisFilter === "bulan" ? (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500">Pilih Bulan</label>
              <input 
                type="month"
                value={bulanMinta}
                onChange={(e) => setBulanMinta(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-medium focus:outline-none"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500">Dari Tanggal</label>
                <input 
                  type="date"
                  value={tanggalMulai}
                  onChange={(e) => setTanggalMulai(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs text-gray-800 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500">Ke Tanggal</label>
                <input 
                  type="date"
                  value={tanggalSelesai}
                  onChange={(e) => setTanggalSelesai(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs text-gray-800 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Class Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Saringan Kelas
            </label>
            {kategori === "Siswa" || kategori === "Mengajar" ? (
              <select 
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-semibold focus:outline-none"
              >
                <option value="Semua">Semua Kelas</option>
                {classList.map((kls, idx) => (
                  <option key={idx} value={kls}>{kls}</option>
                ))}
              </select>
            ) : (
              <div className="bg-gray-100 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-400 font-semibold text-center select-none">
                Tidak berlaku untuk Guru
              </div>
            )}
          </div>

          {/* Teacher Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Saringan Guru
            </label>
            {kategori === "Guru" || kategori === "Mengajar" ? (
              <select 
                value={selectedGuru}
                onChange={(e) => setSelectedGuru(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-semibold focus:outline-none"
              >
                <option value="Semua">Semua Guru</option>
                {guruList.map((g, idx) => (
                  <option key={idx} value={g.id_guru || g.nama_guru}>
                    {g.nama_guru} {g.id_guru ? `(${g.id_guru})` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <div className="bg-gray-100 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-400 font-semibold text-center select-none">
                Tidak berlaku untuk Siswa
              </div>
            )}
          </div>
        </div>

        {/* Interactive Quick Status Filter Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-gray-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Filter Cepat:
            </span>
            <button
              type="button"
              onClick={() => setStatusFilter("Semua")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                statusFilter === "Semua"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span>Semua Data</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                statusFilter === "Semua" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
              }`}>
                {summaryCounts.total}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("sudah_absen")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                statusFilter === "sudah_absen"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sudah Absen</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                statusFilter === "sudah_absen" ? "bg-white/20 text-white" : "bg-emerald-200/80 text-emerald-900"
              }`}>
                {summaryCounts.sudahAbsen}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("belum_absen")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                statusFilter === "belum_absen"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60"
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Belum Absen / Alfa</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                statusFilter === "belum_absen" ? "bg-white/20 text-white" : "bg-rose-200/80 text-rose-900"
              }`}>
                {summaryCounts.belumAbsen}
              </span>
            </button>
          </div>

          {statusFilter !== "Semua" && statusFilter !== "sudah_absen" && statusFilter !== "belum_absen" && (
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              Status Filter: {
                statusFilter === "tepat_waktu" ? "Hadir Tepat Waktu" :
                statusFilter === "terlambat" ? "Terlambat" :
                statusFilter === "izin_sakit" ? "Izin / Sakit / Tugas" :
                statusFilter === "alfa" ? "Alfa (Tidak Hadir)" : statusFilter
              }
            </span>
          )}
        </div>

        {/* Search input in panel */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-3 border-t border-gray-50 gap-3">
          <div className="relative w-full sm:max-w-xs">
            <input 
              type="text"
              placeholder="Saring nama / id target / mapel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            {kategori !== "Mengajar" && (
              <button 
                onClick={() => handleOpenEditModal()}
                className="bg-amber-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl hover:bg-amber-600 transition-all duration-150 flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
                Edit Kehadiran
              </button>
            )}
            <button 
              onClick={() => window.print()}
              className="bg-white border border-gray-200 text-gray-700 font-bold text-xs px-4 py-2 rounded-xl hover:bg-gray-50 transition-all duration-150 flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Cetak PDF
            </button>
            <button 
              onClick={handleExportCSV}
              className="bg-blue-600 text-white font-extrabold text-xs px-4 py-2 rounded-xl hover:bg-blue-700 transition-all duration-150 flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Unduh CSV
            </button>
          </div>
        </div>
      </div>

      {/* PRINT-ONLY HEADERS */}
      <div className="hidden print:block space-y-4 mb-6 border-b-[3px] border-slate-900 pb-4 text-center">
        <h2 className="text-2xl font-black text-slate-950 uppercase tracking-wide">{getSchoolProfile().namaSekolah}</h2>
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">{getSchoolProfile().alamatSekolah}</p>
        <h3 className="text-lg font-bold text-slate-800 uppercase tracking-normal">
          LAPORAN REKAP ABSENSI {kategori === "Mengajar" ? "PENGAJARAN GURU" : kategori.toUpperCase()}
        </h3>
        <p className="text-xs text-slate-500 font-semibold">
          {jenisFilter === "bulan" ? `Periode Bulan: ${bulanMinta}` : `Periode Tanggal: ${tanggalMulai} s.d ${tanggalSelesai}`}
          {(kategori === "Siswa" || kategori === "Mengajar") && ` | Kelas: ${selectedKelas}`}
          {(kategori === "Guru" || kategori === "Mengajar") && ` | Guru: ${selectedGuru}`}
          {statusFilter !== "Semua" && ` | Status: ${
            statusFilter === "sudah_absen" ? "Sudah Absen" :
            statusFilter === "belum_absen" ? "Belum Absen / Alfa" :
            statusFilter === "tepat_waktu" ? "Hadir Tepat Waktu" :
            statusFilter === "terlambat" ? "Terlambat" :
            statusFilter === "izin_sakit" ? "Izin / Sakit / Tugas" :
            statusFilter === "alfa" ? "Alfa (Tidak Hadir)" : statusFilter
          }`}
        </p>
      </div>

      {/* Main logs display container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden print:border-none print:shadow-none">
        {loading ? (
          <div className="p-12 text-center text-gray-400 font-medium">Mengambil data dari server...</div>
        ) : error ? (
          <div className="p-12 text-center text-red-500 font-medium">{error}</div>
        ) : kategori === "Mengajar" ? (
          viewMode === "detail" ? (
            /* REKAP MENGAJAR DETAIL LOG VIEW MODE */
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-emerald-50/70 border-b border-gray-100 text-[11px] font-semibold text-emerald-900 uppercase tracking-wider print:bg-slate-100 print:text-black">
                      <th className="py-3.5 px-6">Tanggal & Hari</th>
                      <th className="py-3.5 px-6">Waktu Input</th>
                      <th className="py-3.5 px-6">Guru Pengajar</th>
                      <th className="py-3.5 px-6">Kelas & Mapel</th>
                      <th className="py-3.5 px-6 text-center">Jam Ke</th>
                      <th className="py-3.5 px-6">Status Kehadiran</th>
                      <th className="py-3.5 px-6">Catatan / Ringkasan Materi</th>
                      <th className="py-3.5 px-6 text-center print:hidden">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs text-gray-700 print:divide-slate-300">
                    {filteredMengajarLogs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-gray-400 font-medium">
                          Tidak ada log presensi mengajar guru terekam
                        </td>
                      </tr>
                    ) : (
                      paginatedMengajarLogs.map((row, idx) => {
                        const isTepat = String(row.status || "").includes("Tepat");
                        const isTerlambat = String(row.status || "").includes("Terlambat");
                        const isTidakHadir = String(row.status || "").includes("Tidak Hadir") || String(row.status || "").includes("Alfa");
                        
                        return (
                          <tr key={row.id_log_mengajar || idx} className="hover:bg-slate-50/50 transition-all duration-150">
                            <td className="py-3.5 px-6 font-semibold text-gray-800">
                              <div>{row.tanggal}</div>
                              <div className="text-[10px] text-gray-400 font-normal">{row.hari || "-"}</div>
                            </td>
                            <td className="py-3.5 px-6 font-mono text-gray-500">{row.waktu_absen || "-"}</td>
                            <td className="py-3.5 px-6">
                              <div className="font-bold text-gray-900">{row.nama_guru}</div>
                              <div className="text-[10px] font-mono text-gray-400">{row.id_guru || "-"}</div>
                            </td>
                            <td className="py-3.5 px-6">
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 mr-1.5">{row.kelas}</span>
                              <span className="font-medium text-gray-700">{row.mapel}</span>
                            </td>
                            <td className="py-3.5 px-6 text-center">
                              <span className="bg-gray-100 text-gray-800 font-mono font-bold px-2 py-0.5 rounded-full text-[11px]">
                                Jam ke-{row.jam_ke}
                              </span>
                            </td>
                            <td className="py-3.5 px-6">
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isTepat ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                isTerlambat ? "bg-amber-50 text-amber-700 border border-amber-200" :
                                isTidakHadir ? "bg-rose-50 text-rose-700 border border-rose-200" :
                                "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              }`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-6 text-gray-600 font-medium max-w-xs truncate" title={row.catatan_materi || "-"}>
                              {row.catatan_materi || "-"}
                            </td>
                            <td className="py-3.5 px-6 text-center print:hidden">
                              <button
                                onClick={() => handleDeleteMengajarLog(row.id_log_mengajar || "", row.nama_guru)}
                                className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold px-2.5 py-1 rounded-lg text-[11px] transition-colors cursor-pointer"
                                title="Hapus Log Mengajar"
                              >
                                <Trash2 className="w-3 h-3" />
                                Hapus
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mengajar Detail Pagination */}
              {totalPagesMengajarDetail > 1 && (
                <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4 print:hidden">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      disabled={currentPageDetail === 1}
                      onClick={() => setCurrentPageDetail(p => Math.max(p - 1, 1))}
                      className={`relative inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 ${
                        currentPageDetail === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                      }`}
                    >
                      Sebelumnya
                    </button>
                    <button
                      disabled={currentPageDetail === totalPagesMengajarDetail}
                      onClick={() => setCurrentPageDetail(p => Math.min(p + 1, totalPagesMengajarDetail))}
                      className={`relative ml-3 inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 ${
                        currentPageDetail === totalPagesMengajarDetail ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                      }`}
                    >
                      Selanjutnya
                    </button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">
                        Menampilkan <span className="font-bold text-gray-950">{startIndexDetail + 1}</span> sampai{" "}
                        <span className="font-bold text-gray-950">
                          {Math.min(startIndexDetail + itemsPerPage, filteredMengajarLogs.length)}
                        </span>{" "}
                        dari <span className="font-bold text-gray-950">{filteredMengajarLogs.length}</span> data
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-xl gap-1" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPageDetail(p => Math.max(p - 1, 1))}
                          disabled={currentPageDetail === 1}
                          className={`relative inline-flex items-center rounded-lg px-2.5 py-1.5 text-gray-400 hover:bg-gray-50 ${
                            currentPageDetail === 1 ? "opacity-40 cursor-not-allowed" : ""
                          }`}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        {Array.from({ length: totalPagesMengajarDetail }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPageDetail(page)}
                            className={`relative inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-150 ${
                              currentPageDetail === page
                                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/10"
                                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                          >
                            {page}
                          </button>
                        ))}

                        <button
                          onClick={() => setCurrentPageDetail(p => Math.min(p + 1, totalPagesMengajarDetail))}
                          disabled={currentPageDetail === totalPagesMengajarDetail}
                          className={`relative inline-flex items-center rounded-lg px-2.5 py-1.5 text-gray-400 hover:bg-gray-50 ${
                            currentPageDetail === totalPagesMengajarDetail ? "opacity-40 cursor-not-allowed" : ""
                          }`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* REKAP MENGAJAR PERCENTAGE VIEW MODE */
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-emerald-50/70 border-b border-gray-100 text-[11px] font-semibold text-emerald-900 uppercase tracking-wider print:bg-slate-100 print:text-black">
                      <th className="py-3.5 px-6">ID Guru</th>
                      <th className="py-3.5 px-6">Nama Guru</th>
                      <th className="py-3.5 px-6 text-center">Total Jam Sesi</th>
                      <th className="py-3.5 px-6 text-center">Tepat Waktu</th>
                      <th className="py-3.5 px-6 text-center">Terlambat</th>
                      <th className="py-3.5 px-6 text-center">Izin / Sakit / Tugas</th>
                      <th className="py-3.5 px-6 text-center">Tidak Hadir</th>
                      <th className="py-3.5 px-6 text-right">Persentase Kehadiran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs text-gray-700 print:divide-slate-300">
                    {filteredRekapMengajarRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-gray-400 font-medium">
                          Tidak ada data rekap presensi mengajar
                        </td>
                      </tr>
                    ) : (
                      paginatedRekapMengajarRows.map((row) => {
                        const pctNum = parseFloat(row.persentase);
                        const isHighRisk = pctNum < 75;

                        return (
                          <tr key={row.id_guru} className="hover:bg-slate-50/50 transition-all duration-150">
                            <td className="py-3.5 px-6 font-mono font-bold text-gray-500">{row.id_guru}</td>
                            <td className="py-3.5 px-6 font-bold text-gray-900">{row.nama_guru}</td>
                            <td className="py-3.5 px-6 text-center font-bold text-gray-800">{row.total} Sesi</td>
                            <td className="py-3.5 px-6 text-center">
                              <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-1 rounded-lg border border-emerald-100">{row.tepat}</span>
                            </td>
                            <td className="py-3.5 px-6 text-center">
                              <span className="bg-amber-50 text-amber-800 font-bold px-2 py-1 rounded-lg border border-amber-100">{row.terlambat}</span>
                            </td>
                            <td className="py-3.5 px-6 text-center">
                              <span className="bg-indigo-50 text-indigo-800 font-bold px-2 py-1 rounded-lg border border-indigo-100">{row.izinSakit}</span>
                            </td>
                            <td className="py-3.5 px-6 text-center">
                              <span className="bg-rose-50 text-rose-800 font-bold px-2 py-1 rounded-lg border border-rose-100">{row.tidakHadir || 0}</span>
                            </td>
                            <td className="py-3.5 px-6 text-right font-extrabold text-sm">
                              <div className="flex items-center justify-end gap-1.5">
                                {isHighRisk && <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" title="Kehadiran mengajar di bawah 75%!" />}
                                <span className={isHighRisk ? "text-rose-600" : "text-emerald-600"}>
                                  {row.persentase}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Rekap Mengajar Pagination Controls */}
              {totalPagesMengajarRekap > 1 && (
                <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4 print:hidden">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      disabled={currentPageRekap === 1}
                      onClick={() => setCurrentPageRekap(p => Math.max(p - 1, 1))}
                      className={`relative inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 ${
                        currentPageRekap === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                      }`}
                    >
                      Sebelumnya
                    </button>
                    <button
                      disabled={currentPageRekap === totalPagesMengajarRekap}
                      onClick={() => setCurrentPageRekap(p => Math.min(p + 1, totalPagesMengajarRekap))}
                      className={`relative ml-3 inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 ${
                        currentPageRekap === totalPagesMengajarRekap ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                      }`}
                    >
                      Selanjutnya
                    </button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">
                        Menampilkan <span className="font-bold text-gray-950">{startIndexRekap + 1}</span> sampai{" "}
                        <span className="font-bold text-gray-950">
                          {Math.min(startIndexRekap + itemsPerPage, filteredRekapMengajarRows.length)}
                        </span>{" "}
                        dari <span className="font-bold text-gray-950">{filteredRekapMengajarRows.length}</span> data
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-xl gap-1" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPageRekap(p => Math.max(p - 1, 1))}
                          disabled={currentPageRekap === 1}
                          className={`relative inline-flex items-center rounded-lg px-2.5 py-1.5 text-gray-400 hover:bg-gray-50 ${
                            currentPageRekap === 1 ? "opacity-40 cursor-not-allowed" : ""
                          }`}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        {Array.from({ length: totalPagesMengajarRekap }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPageRekap(page)}
                            className={`relative inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-150 ${
                              currentPageRekap === page
                                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/10"
                                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                          >
                            {page}
                          </button>
                        ))}

                        <button
                          onClick={() => setCurrentPageRekap(p => Math.min(p + 1, totalPagesMengajarRekap))}
                          disabled={currentPageRekap === totalPagesMengajarRekap}
                          className={`relative inline-flex items-center rounded-lg px-2.5 py-1.5 text-gray-400 hover:bg-gray-50 ${
                            currentPageRekap === totalPagesMengajarRekap ? "opacity-40 cursor-not-allowed" : ""
                          }`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          viewMode === "detail" ? (
            /* DETAIL LOG VIEW MODE */
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider print:bg-slate-100 print:text-black">
                      <th className="py-3.5 px-6">Tanggal</th>
                      <th className="py-3.5 px-6">ID</th>
                      <th className="py-3.5 px-6">Nama</th>
                      {kategori === "Siswa" && <th className="py-3.5 px-6">Kelas</th>}
                      <th className="py-3.5 px-6">Jam Masuk</th>
                      <th className="py-3.5 px-6">Status Masuk</th>
                      <th className="py-3.5 px-6">Jam Pulang</th>
                      <th className="py-3.5 px-6">Status Pulang</th>
                      <th className="py-3.5 px-6">Keterangan</th>
                      <th className="py-3.5 px-6 text-center print:hidden">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs text-gray-700 print:divide-slate-300">
                    {filteredDetailLogs.length === 0 ? (
                      <tr>
                        <td colSpan={kategori === "Siswa" ? 10 : 9} className="py-8 text-center text-gray-400 font-medium">
                          Tidak ada log presensi terekam
                        </td>
                      </tr>
                    ) : (
                      paginatedDetailLogs.map((row, idx) => {
                        const id = row.id_siswa || row.id_guru || row.id_target || "-";
                        const name = row.nama_siswa || row.nama_guru || row.nama_target || row.nama || "-";
                        const classFull = row.kelas_jurusan || (row.kelas ? `${row.kelas} ${row.jurusan || ""}`.trim() : "-");
                        const statusMasuk = String(row.status_masuk || "-");
                        const statusPulang = String(row.status_pulang || "-");
                        
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-all duration-150">
                            <td className="py-3.5 px-6 font-semibold text-gray-500">{row.tanggal}</td>
                            <td className="py-3.5 px-6 font-mono text-gray-400">{id}</td>
                            <td className="py-3.5 px-6 font-bold text-gray-900">{name}</td>
                            {kategori === "Siswa" && <td className="py-3.5 px-6 text-gray-600 font-medium">{classFull}</td>}
                            <td className="py-3.5 px-6 font-bold">{row.jam_masuk || "-"}</td>
                            <td className="py-3.5 px-6">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                statusMasuk.includes("Tepat") ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                statusMasuk.includes("Terlambat") ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                statusMasuk.includes("Lupa") ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
                                statusMasuk === "-" ? "text-gray-400" : "bg-rose-50 text-rose-700 border border-rose-100"
                              }`}>
                                {statusMasuk}
                              </span>
                            </td>
                            <td className="py-3.5 px-6 font-bold">{row.jam_pulang || "-"}</td>
                            <td className="py-3.5 px-6">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                statusPulang.includes("Tepat") ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                statusPulang === "-" ? "text-gray-400" : "bg-blue-50 text-blue-700 border border-blue-100"
                              }`}>
                                {statusPulang}
                              </span>
                            </td>
                            <td className="py-3.5 px-6 text-gray-500 font-medium">{row.ket || "-"}</td>
                            <td className="py-3.5 px-6 text-center print:hidden">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenEditModal(row)}
                                  className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 font-bold px-2.5 py-1 rounded-lg text-[11px] transition-colors cursor-pointer"
                                  title="Edit Kehadiran"
                                >
                                  <Pencil className="w-3 h-3" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteKehadiran(row)}
                                  className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold px-2.5 py-1 rounded-lg text-[11px] transition-colors cursor-pointer"
                                  title="Hapus Absensi"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Detail Logs Pagination Controls (Hidden on Print) */}
              {totalPagesDetail > 1 && (
                <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4 print:hidden">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      disabled={currentPageDetail === 1}
                      onClick={() => setCurrentPageDetail(p => Math.max(p - 1, 1))}
                      className={`relative inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 ${
                        currentPageDetail === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                      }`}
                    >
                      Sebelumnya
                    </button>
                    <button
                      disabled={currentPageDetail === totalPagesDetail}
                      onClick={() => setCurrentPageDetail(p => Math.min(p + 1, totalPagesDetail))}
                      className={`relative ml-3 inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 ${
                        currentPageDetail === totalPagesDetail ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                      }`}
                    >
                      Selanjutnya
                    </button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">
                        Menampilkan <span className="font-bold text-gray-950">{startIndexDetail + 1}</span> sampai{" "}
                        <span className="font-bold text-gray-950">
                          {Math.min(startIndexDetail + itemsPerPage, filteredDetailLogs.length)}
                        </span>{" "}
                        dari <span className="font-bold text-gray-950">{filteredDetailLogs.length}</span> data
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-xl gap-1" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPageDetail(p => Math.max(p - 1, 1))}
                          disabled={currentPageDetail === 1}
                          className={`relative inline-flex items-center rounded-lg px-2.5 py-1.5 text-gray-400 hover:bg-gray-50 ${
                            currentPageDetail === 1 ? "opacity-40 cursor-not-allowed" : ""
                          }`}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        {Array.from({ length: totalPagesDetail }, (_, i) => i + 1).map((page) => {
                          if (
                            totalPagesDetail > 7 &&
                            page !== 1 &&
                            page !== totalPagesDetail &&
                            Math.abs(page - currentPageDetail) > 1
                          ) {
                            if (page === 2 || page === totalPagesDetail - 1) {
                              return <span key={page} className="relative inline-flex items-center px-2 py-1 text-xs font-semibold text-gray-400">...</span>;
                            }
                            return null;
                          }

                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPageDetail(page)}
                              className={`relative inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-150 ${
                                currentPageDetail === page
                                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/10"
                                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}

                        <button
                          onClick={() => setCurrentPageDetail(p => Math.min(p + 1, totalPagesDetail))}
                          disabled={currentPageDetail === totalPagesDetail}
                          className={`relative inline-flex items-center rounded-lg px-2.5 py-1.5 text-gray-400 hover:bg-gray-50 ${
                            currentPageDetail === totalPagesDetail ? "opacity-40 cursor-not-allowed" : ""
                          }`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* REKAP PERCENTAGE VIEW MODE */
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider print:bg-slate-100 print:text-black">
                      <th className="py-3.5 px-6">ID</th>
                      <th className="py-3.5 px-6">Nama</th>
                      <th className="py-3.5 px-6 text-center">Hadir</th>
                      <th className="py-3.5 px-6 text-center">Sakit</th>
                      <th className="py-3.5 px-6 text-center">Izin</th>
                      <th className="py-3.5 px-6 text-center">Alfa</th>
                      <th className="py-3.5 px-6 text-center">Sandi Masuk</th>
                      <th className="py-3.5 px-6 text-center">Sandi Pulang</th>
                      <th className="py-3.5 px-6 text-right">Rasio Hadir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs text-gray-700 print:divide-slate-300">
                    {filteredRekapRows.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-gray-400 font-medium">
                          Tidak ada data rekap persentase terekam
                        </td>
                      </tr>
                    ) : (
                      paginatedRekapRows.map((row) => {
                        const isHighRisk = parseFloat(row.persentase) < 75;
                        
                        return (
                          <tr key={row.id} className="hover:bg-slate-50/50 transition-all duration-150">
                            <td className="py-3.5 px-6 font-mono font-bold text-gray-500">{row.id}</td>
                            <td className="py-3.5 px-6 font-bold text-gray-900">{row.nama}</td>
                            <td className="py-3.5 px-6 text-center">
                              <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-1 rounded-lg border border-emerald-100">{row.hadir}</span>
                            </td>
                            <td className="py-3.5 px-6 text-center">
                              <span className="bg-amber-50 text-amber-800 font-bold px-2 py-1 rounded-lg border border-amber-100">{row.sakit}</span>
                            </td>
                            <td className="py-3.5 px-6 text-center">
                              <span className="bg-indigo-50 text-indigo-800 font-bold px-2 py-1 rounded-lg border border-indigo-100">{row.izin}</span>
                            </td>
                            <td className="py-3.5 px-6 text-center">
                              <span className={`px-2 py-1 rounded-lg font-bold ${row.alfa > 0 ? "bg-rose-50 text-rose-800 border border-rose-100" : "bg-gray-50 text-gray-400"}`}>{row.alfa}</span>
                            </td>
                            <td className="py-3.5 px-6 text-center font-mono text-[10px] text-gray-400 max-w-[120px] truncate" title={row.jam_masuk}>{row.jam_masuk}</td>
                            <td className="py-3.5 px-6 text-center font-mono text-[10px] text-gray-400 max-w-[120px] truncate" title={row.jam_pulang}>{row.jam_pulang}</td>
                            <td className="py-3.5 px-6 text-right font-extrabold text-sm">
                              <div className="flex items-center justify-end gap-1.5">
                                {isHighRisk && <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" title="Kehadiran di bawah 75%!" />}
                                <span className={isHighRisk ? "text-rose-600" : "text-emerald-600"}>
                                  {row.persentase}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Rekap Pagination Controls (Hidden on Print) */}
              {totalPagesRekap > 1 && (
                <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4 print:hidden">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      disabled={currentPageRekap === 1}
                      onClick={() => setCurrentPageRekap(p => Math.max(p - 1, 1))}
                      className={`relative inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 ${
                        currentPageRekap === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                      }`}
                    >
                      Sebelumnya
                    </button>
                    <button
                      disabled={currentPageRekap === totalPagesRekap}
                      onClick={() => setCurrentPageRekap(p => Math.min(p + 1, totalPagesRekap))}
                      className={`relative ml-3 inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 ${
                        currentPageRekap === totalPagesRekap ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                      }`}
                    >
                      Selanjutnya
                    </button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">
                        Menampilkan <span className="font-bold text-gray-950">{startIndexRekap + 1}</span> sampai{" "}
                        <span className="font-bold text-gray-950">
                          {Math.min(startIndexRekap + itemsPerPage, filteredRekapRows.length)}
                        </span>{" "}
                        dari <span className="font-bold text-gray-950">{filteredRekapRows.length}</span> data
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-xl gap-1" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPageRekap(p => Math.max(p - 1, 1))}
                          disabled={currentPageRekap === 1}
                          className={`relative inline-flex items-center rounded-lg px-2.5 py-1.5 text-gray-400 hover:bg-gray-50 ${
                            currentPageRekap === 1 ? "opacity-40 cursor-not-allowed" : ""
                          }`}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        {Array.from({ length: totalPagesRekap }, (_, i) => i + 1).map((page) => {
                          if (
                            totalPagesRekap > 7 &&
                            page !== 1 &&
                            page !== totalPagesRekap &&
                            Math.abs(page - currentPageRekap) > 1
                          ) {
                            if (page === 2 || page === totalPagesRekap - 1) {
                              return <span key={page} className="relative inline-flex items-center px-2 py-1 text-xs font-semibold text-gray-400">...</span>;
                            }
                            return null;
                          }

                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPageRekap(page)}
                              className={`relative inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-150 ${
                                currentPageRekap === page
                                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/10"
                                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}

                        <button
                          onClick={() => setCurrentPageRekap(p => Math.min(p + 1, totalPagesRekap))}
                          disabled={currentPageRekap === totalPagesRekap}
                          className={`relative inline-flex items-center rounded-lg px-2.5 py-1.5 text-gray-400 hover:bg-gray-50 ${
                            currentPageRekap === totalPagesRekap ? "opacity-40 cursor-not-allowed" : ""
                          }`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* EDIT KEHADIRAN MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in print:hidden">
          <div className={`bg-white rounded-2xl border border-gray-100 shadow-2xl w-full overflow-hidden transition-all duration-200 ${editModeType === "bulk" ? "max-w-5xl" : "max-w-lg"}`}>
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Pencil className="w-5 h-5 text-amber-100" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Edit / Koreksi Kehadiran</h3>
                  <p className="text-[11px] text-amber-100 font-medium">Perbaiki log presensi langsung banyak atau per siswa</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Mode Switcher Tabs */}
                <div className="bg-amber-700/40 p-1 rounded-xl flex items-center gap-1 border border-amber-400/30">
                  <button
                    type="button"
                    onClick={() => {
                      setEditModeType("bulk");
                      loadBulkAttendanceData(editKategori, editTanggal, bulkFilterKelas);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                      editModeType === "bulk" ? "bg-white text-amber-800 shadow-sm" : "text-amber-100 hover:text-white"
                    }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                    Edit Banyak (Tabel)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditModeType("single")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                      editModeType === "single" ? "bg-white text-amber-800 shadow-sm" : "text-amber-100 hover:text-white"
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Edit 1 Orang
                  </button>
                </div>

                <button 
                  onClick={() => setShowEditModal(false)}
                  className="text-amber-100 hover:text-white text-2xl font-bold leading-none cursor-pointer pl-2"
                >
                  ×
                </button>
              </div>
            </div>

            {/* MODAL BODY */}
            {editModeType === "bulk" ? (
              /* BULK EDIT TABLE MODE */
              <div className="p-4 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
                {/* Filters Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-200/80">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 mb-1 block">Kategori</label>
                    <select
                      value={editKategori}
                      onChange={(e) => handleBulkParamChange(e.target.value as "Siswa" | "Guru", editTanggal, bulkFilterKelas)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs text-gray-800 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="Siswa">Siswa</option>
                      <option value="Guru">Guru / Staf</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-500 mb-1 block">Tanggal Absensi</label>
                    <input
                      type="date"
                      value={editTanggal}
                      onChange={(e) => handleBulkParamChange(editKategori, e.target.value, bulkFilterKelas)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs text-gray-800 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                    />
                  </div>

                  {editKategori === "Siswa" ? (
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 mb-1 block">Filter Kelas</label>
                      <select
                        value={bulkFilterKelas}
                        onChange={(e) => handleBulkParamChange(editKategori, editTanggal, e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs text-gray-800 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="Semua">Semua Kelas</option>
                        {classList.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 mb-1 block">Filter Kelas</label>
                      <div className="bg-gray-100 border border-gray-200 rounded-xl p-2 text-xs text-gray-400 font-medium text-center">
                        Semua Staf / Guru
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-bold text-gray-500 mb-1 block">Cari Nama / ID</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Filter nama..."
                        value={bulkSearchQuery}
                        onChange={(e) => setBulkSearchQuery(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl p-2 pl-7 text-xs text-gray-800 focus:outline-none focus:border-amber-500"
                      />
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-2.5" />
                    </div>
                  </div>
                </div>

                {/* Batch Tools / Quick Actions Bar */}
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="font-extrabold text-amber-900 flex items-center gap-1.5 shrink-0">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    Atur Massal Semua yang Tampil:
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-bold text-amber-800">Masuk:</span>
                      <select
                        onChange={(e) => {
                          handleBatchSetStatusMasuk(e.target.value);
                          e.target.value = "";
                        }}
                        defaultValue=""
                        className="bg-white border border-amber-300 rounded-lg py-1 px-2 text-[11px] font-bold text-amber-900 cursor-pointer shadow-sm"
                      >
                        <option value="" disabled>-- Set Status Masuk --</option>
                        <option value="Tepat Waktu">Tepat Waktu (07:00)</option>
                        <option value="Terlambat">Terlambat (07:00)</option>
                        <option value="Sakit">Sakit (-)</option>
                        <option value="Izin">Izin (-)</option>
                        <option value="Alfa">Alfa (-)</option>
                        <option value="Lupa Scan Masuk">Lupa Scan Masuk</option>
                        <option value="-">- (Kosongkan)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-bold text-amber-800">Pulang:</span>
                      <select
                        onChange={(e) => {
                          handleBatchSetStatusPulang(e.target.value);
                          e.target.value = "";
                        }}
                        defaultValue=""
                        className="bg-white border border-amber-300 rounded-lg py-1 px-2 text-[11px] font-bold text-amber-900 cursor-pointer shadow-sm"
                      >
                        <option value="" disabled>-- Set Status Pulang --</option>
                        <option value="Tepat Waktu">Tepat Waktu (15:30)</option>
                        <option value="Terlambat">Terlambat</option>
                        <option value="Lupa Scan Pulang">Lupa Scan Pulang</option>
                        <option value="-">- (Kosongkan)</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => loadBulkAttendanceData(editKategori, editTanggal, bulkFilterKelas)}
                      className="bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-bold px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                      title="Reset dari server"
                    >
                      <RefreshCw className="w-3 h-3 text-amber-700" />
                      Reset
                    </button>
                  </div>
                </div>

                {/* Editable Table */}
                {loadingBulk ? (
                  <div className="py-12 text-center text-gray-400 font-medium space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500" />
                    <p className="text-xs font-semibold text-gray-500">Memuat daftar {editKategori} & presensi...</p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                    <div className="max-h-[380px] overflow-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-100 text-slate-700 uppercase font-extrabold sticky top-0 z-10 border-b border-gray-200 text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3 w-10 text-center">#</th>
                            <th className="py-2.5 px-3 min-w-[160px]">NIS / Nama {editKategori}</th>
                            {editKategori === "Siswa" && <th className="py-2.5 px-3 min-w-[110px]">Kelas</th>}
                            <th className="py-2.5 px-2 w-24 text-center">Jam Masuk</th>
                            <th className="py-2.5 px-2 min-w-[140px]">Status Masuk</th>
                            <th className="py-2.5 px-2 w-24 text-center">Jam Pulang</th>
                            <th className="py-2.5 px-2 min-w-[140px]">Status Pulang</th>
                            <th className="py-2.5 px-3 min-w-[140px]">Keterangan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs text-gray-800">
                          {bulkTableData
                            .filter((item) => {
                              if (!bulkSearchQuery) return true;
                              return (
                                item.nama_target.toLowerCase().includes(bulkSearchQuery.toLowerCase()) ||
                                item.id_target.toLowerCase().includes(bulkSearchQuery.toLowerCase())
                              );
                            })
                            .map((item, idx) => (
                              <tr key={item.id_target} className="hover:bg-amber-50/40 transition-colors">
                                <td className="py-2 px-3 text-center text-gray-400 font-mono text-[11px]">{idx + 1}</td>
                                <td className="py-2 px-3">
                                  <div className="font-bold text-gray-900 leading-tight">{item.nama_target}</div>
                                  <div className="text-[10px] text-gray-400 font-mono">{item.id_target}</div>
                                </td>
                                {editKategori === "Siswa" && (
                                  <td className="py-2 px-3 font-semibold text-gray-600 text-[11px]">
                                    {item.kelas_jurusan}
                                  </td>
                                )}
                                <td className="py-2 px-1">
                                  <input
                                    type="text"
                                    value={item.jam_masuk}
                                    onChange={(e) => handleUpdateBulkCell(item.id_target, "jam_masuk", e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 focus:border-amber-500 rounded-lg p-1.5 text-center text-xs font-mono font-bold focus:outline-none"
                                  />
                                </td>
                                <td className="py-2 px-1">
                                  <select
                                    value={item.status_masuk}
                                    onChange={(e) => handleUpdateBulkCell(item.id_target, "status_masuk", e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 focus:border-amber-500 rounded-lg p-1.5 text-xs font-bold text-gray-800 focus:outline-none cursor-pointer"
                                  >
                                    <option value="Tepat Waktu">Tepat Waktu</option>
                                    <option value="Terlambat">Terlambat</option>
                                    <option value="Sakit">Sakit</option>
                                    <option value="Izin">Izin</option>
                                    <option value="Alfa">Alfa</option>
                                    <option value="Lupa Scan Masuk">Lupa Scan Masuk</option>
                                    <option value="-">- (Belum Absen)</option>
                                  </select>
                                </td>
                                <td className="py-2 px-1">
                                  <input
                                    type="text"
                                    value={item.jam_pulang}
                                    onChange={(e) => handleUpdateBulkCell(item.id_target, "jam_pulang", e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 focus:border-amber-500 rounded-lg p-1.5 text-center text-xs font-mono font-bold focus:outline-none"
                                  />
                                </td>
                                <td className="py-2 px-1">
                                  <select
                                    value={item.status_pulang}
                                    onChange={(e) => handleUpdateBulkCell(item.id_target, "status_pulang", e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 focus:border-amber-500 rounded-lg p-1.5 text-xs font-bold text-gray-800 focus:outline-none cursor-pointer"
                                  >
                                    <option value="Tepat Waktu">Tepat Waktu</option>
                                    <option value="Terlambat">Terlambat</option>
                                    <option value="Lupa Scan Pulang">Lupa Scan Pulang</option>
                                    <option value="-">- (Belum Pulang)</option>
                                  </select>
                                </td>
                                <td className="py-2 px-2">
                                  <input
                                    type="text"
                                    placeholder="Opsional..."
                                    value={item.ket}
                                    onChange={(e) => handleUpdateBulkCell(item.id_target, "ket", e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 focus:border-amber-500 rounded-lg p-1.5 text-xs focus:outline-none"
                                  />
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500 font-medium">
                    Total <strong>{bulkTableData.length}</strong> {editKategori} pada tanggal <strong>{editTanggal}</strong>
                    {bulkFilterKelas !== "Semua" && ` (Kelas: ${bulkFilterKelas})`}
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="bg-gray-100 text-gray-600 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      disabled={savingEdit || bulkTableData.length === 0}
                      onClick={handleSaveBulkKehadiran}
                      className="bg-amber-500 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl hover:bg-amber-600 transition-all shadow-md shadow-amber-500/10 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      {savingEdit ? "Menyimpan..." : "Simpan Semua Perubahan"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* SINGLE EDIT MODE (EXISTING FORM) */
              <form onSubmit={handleSaveEditKehadiran} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
                {/* Category & Date Selector */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Kategori Entitas</label>
                    <select
                      value={editKategori}
                      onChange={(e) => {
                        const cat = e.target.value as "Siswa" | "Guru";
                        setEditKategori(cat);
                        loadMasterForEdit(cat);
                        setEditTargetId("");
                      }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="Siswa">Siswa</option>
                      <option value="Guru">Guru / Staf</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Tanggal Presensi</label>
                    <input
                      type="date"
                      required
                      value={editTanggal}
                      onChange={(e) => handleTargetOrDateChange(editTargetId, e.target.value, editKategori)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Entity Search & Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 flex justify-between items-center">
                    <span>Pilih {editKategori}</span>
                    {editTargetId && (
                      <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        ID: {editTargetId}
                      </span>
                    )}
                  </label>
                  
                  <div className="relative mb-1">
                    <input 
                      type="text"
                      placeholder={`Cari nama / NIS ${editKategori}...`}
                      value={editSearchQuery}
                      onChange={(e) => setEditSearchQuery(e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-xl py-1.5 pl-8 pr-3 text-xs text-gray-700 w-full focus:outline-none focus:border-amber-500"
                    />
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                  </div>

                  <select 
                    required
                    value={editTargetId}
                    onChange={(e) => handleTargetOrDateChange(e.target.value, editTanggal, editKategori)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Pilih {editKategori === "Siswa" ? "Siswa" : "Guru"} --</option>
                    {editEntitiesList
                      .filter(ent => {
                        const name = ent.nama_siswa || ent.nama_guru || "";
                        const id = ent.id_siswa || ent.id_guru || "";
                        return (
                          name.toLowerCase().includes(editSearchQuery.toLowerCase()) ||
                          id.toLowerCase().includes(editSearchQuery.toLowerCase())
                        );
                      })
                      .map((ent) => {
                        const id = ent.id_siswa || ent.id_guru;
                        const name = ent.nama_siswa || ent.nama_guru;
                        const detail = editKategori === "Siswa" ? ` (${ent.kelas} ${ent.jurusan})` : "";
                        return (
                          <option key={id} value={id}>{id} - {name}{detail}</option>
                        );
                      })}
                  </select>
                </div>

                {/* Attendance Details Grid */}
                <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Rincian Kehadiran Masuk & Pulang
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-gray-600 mb-1 block">Jam Masuk</label>
                      <input
                        type="text"
                        placeholder="07:00 atau -"
                        value={editJamMasuk}
                        onChange={(e) => setEditJamMasuk(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl py-1.5 px-2.5 text-xs text-gray-800 font-mono font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-600 mb-1 block">Status Masuk</label>
                      <select
                        value={editStatusMasuk}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditStatusMasuk(val);
                          if ((val === "Tepat Waktu" || val === "Terlambat" || val === "Lupa Scan Masuk") && (editJamMasuk === "-" || !editJamMasuk)) {
                            setEditJamMasuk("07:00");
                          } else if (val === "Sakit" || val === "Izin" || val === "Alfa" || val === "-") {
                            setEditJamMasuk("-");
                          }
                        }}
                        className="w-full bg-white border border-gray-200 rounded-xl py-1.5 px-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:border-amber-500"
                      >
                        <option value="Tepat Waktu">Tepat Waktu</option>
                        <option value="Terlambat">Terlambat</option>
                        <option value="Sakit">Sakit</option>
                        <option value="Izin">Izin</option>
                        <option value="Alfa">Alfa</option>
                        <option value="Lupa Scan Masuk">Lupa Scan Masuk</option>
                        <option value="-">- (Belum Absen)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200/50">
                    <div>
                      <label className="text-[11px] font-bold text-gray-600 mb-1 block">Jam Pulang</label>
                      <input
                        type="text"
                        placeholder="15:30 atau -"
                        value={editJamPulang}
                        onChange={(e) => setEditJamPulang(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl py-1.5 px-2.5 text-xs text-gray-800 font-mono font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-600 mb-1 block">Status Pulang</label>
                      <select
                        value={editStatusPulang}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditStatusPulang(val);
                          if ((val === "Tepat Waktu" || val === "Terlambat" || val === "Lupa Scan Pulang") && (editJamPulang === "-" || !editJamPulang)) {
                            setEditJamPulang("15:30");
                          } else if (val === "-") {
                            setEditJamPulang("-");
                          }
                        }}
                        className="w-full bg-white border border-gray-200 rounded-xl py-1.5 px-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:border-amber-500"
                      >
                        <option value="Tepat Waktu">Tepat Waktu</option>
                        <option value="Terlambat">Terlambat</option>
                        <option value="Lupa Scan Pulang">Lupa Scan Pulang</option>
                        <option value="-">- (Belum Pulang)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Keterangan */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">Catatan / Keterangan Koreksi</label>
                  <textarea 
                    value={editKet}
                    onChange={(e) => setEditKet(e.target.value)}
                    placeholder="Contoh: Koreksi jam masuk karena gangguan scanner, Izin lomba, dll."
                    rows={2}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-3 border-t border-gray-100 gap-2">
                  <div>
                    {editTargetId && (
                      <button 
                        type="button"
                        disabled={savingEdit}
                        onClick={handleDeleteKehadiran}
                        className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                        title="Hapus record presensi tanggal ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus Presensi
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="bg-gray-100 text-gray-600 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit"
                      disabled={savingEdit || !editTargetId}
                      className="bg-amber-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl hover:bg-amber-600 transition-all shadow-md shadow-amber-500/10 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {savingEdit ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* Global Loading Overlay */}
      {loadingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 flex flex-col items-center gap-3 max-w-sm w-full mx-4 text-center">
            <div className="relative flex items-center justify-center w-14 h-14">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full border-t-4 border-blue-600 animate-spin"></div>
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin relative z-10" />
            </div>
            <div>
              <h4 className="font-bold text-gray-800 text-sm">{loadingAction}</h4>
              <p className="text-xs text-gray-400 mt-1">Mohon tunggu sebentar, sedang memproses rekap laporan...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
