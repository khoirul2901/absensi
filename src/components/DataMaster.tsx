/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, FormEvent } from "react";
import { 
  Users, 
  GraduationCap, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  QrCode, 
  Download, 
  Upload, 
  X, 
  CheckCircle,
  FileSpreadsheet,
  AlertTriangle,
  Printer,
  ChevronLeft,
  ChevronRight,
  Building2,
  UserCheck,
  Loader2
} from "lucide-react";
import { callGas, getStorageKey, extractArrayData, getStorage, setStorage, isInvalidWali } from "../lib/gasApi";
import { Siswa, Guru } from "../types";
import { IdCard } from "./IdCard";

export default function DataMaster() {
  const [kategori, setKategori] = useState<"Siswa" | "Guru" | "Kelas" | "User">("Siswa");
  const [dataList, setDataList] = useState<any[]>([]);
  const [guruList, setGuruList] = useState<any[]>([]);
  const [siswaList, setSiswaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("Semua");
  const [classList, setClassList] = useState<string[]>([]);
  const [session, setSession] = useState<any>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [kategori, searchQuery, selectedKelas]);

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printSide, setPrintSide] = useState<"both" | "front" | "back">("both");
  const [showQrModal, setShowQrModal] = useState<{ open: boolean; item: any | null }>({ open: false, item: null });
  
  // Form fields
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  // Excel paste import state
  const [pasteData, setPasteData] = useState("");
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Load session info
  useEffect(() => {
    const saved = localStorage.getItem(getStorageKey("SIAS_SESSION"));
    if (saved) {
      try {
        setSession(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Load Classes list
  useEffect(() => {
    async function loadClasses() {
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
  }, []);

  // Fetch Master Data list
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (kategori === "User") {
        const res = await callGas("getUsersSemua");
        if (res && res.success) {
          setDataList(res.data);
        } else {
          setError(res?.message || "Gagal memuat data user");
        }
      } else if (kategori === "Kelas") {
        let [resKelas, resGuru, resSiswa] = await Promise.all([
          callGas("getKelasSemua"),
          callGas("getDataMaster", ["Guru"]),
          callGas("getDataMaster", ["Siswa"])
        ]);
        let kList = extractArrayData(resKelas);
        let gList = extractArrayData(resGuru);
        let sList = extractArrayData(resSiswa);

        if (!kList || kList.length === 0) kList = getStorage("data_kelas") || [];
        if (!gList || gList.length === 0) gList = getStorage("data_guru") || [];
        if (!sList || sList.length === 0) sList = getStorage("data_siswa") || [];

        setGuruList(gList);
        setSiswaList(sList);

        const storedKelas = getStorage("data_kelas") || [];
        const storedMap = new Map<string, string>();
        storedKelas.forEach((sk: any) => {
          if (typeof sk === "object" && sk) {
            const n = String(sk.nama_kelas || sk.kelas || "").trim();
            const w = String(sk.wali_kelas || sk.wali || sk.waliKelas || sk.guru_wali || sk.nama_guru || "").trim();
            if (n && w && !isInvalidWali(w)) storedMap.set(n, w);
          }
        });

        const normalizedKelas = kList.map((item: any) => {
          const name = String(typeof item === "string" ? item : (item.nama_kelas || item.kelas || "")).trim();
          const rawWali = typeof item === "object" && item ? (item.wali_kelas || item.wali || item.waliKelas || item.guru_wali || item.nama_guru || item.wali_kelas_nama || item["Wali Kelas"] || "-") : "-";
          let cleanWali = isInvalidWali(rawWali) ? "-" : String(rawWali).trim();
          if (cleanWali === "-" && storedMap.has(name)) {
            cleanWali = storedMap.get(name)!;
          }
          const rawIdGuru = typeof item === "object" && item ? (item.id_guru || item.id_wali || item.idGuru || "-") : "-";
          let cleanIdGuru = String(rawIdGuru || "-").trim();

          if ((cleanIdGuru === "-" || !cleanIdGuru) && cleanWali !== "-") {
            const foundG = gList.find((g: any) => {
              const gName = (g.nama_guru || g.nama || g.name || "").trim().toLowerCase();
              return gName === cleanWali.toLowerCase() || gName.includes(cleanWali.toLowerCase()) || cleanWali.toLowerCase().includes(gName);
            });
            if (foundG && foundG.id_guru) {
              cleanIdGuru = foundG.id_guru;
            }
          }

          return {
            nama_kelas: name,
            id_guru: cleanIdGuru,
            wali_kelas: cleanWali
          };
        }).filter((k: any) => Boolean(k.nama_kelas));

        setDataList(normalizedKelas);
      } else {
        const res = await callGas("getDataMaster", [kategori]);
        if (res && res.success) {
          const raw = Array.isArray(res.data) ? res.data : [];
          const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";
          const identifierKey = kategori === "Siswa" ? "nisn" : "nip_nuptk";
          const cleanData = raw.filter((item: any) => {
            if (!item || typeof item !== "object") return false;
            const name = String(item[nameKey] || item.nama || item.name || "").trim();
            const identifier = String(item[identifierKey] || "").trim();
            return Boolean((name && name !== "-") || (identifier && identifier !== "-"));
          });
          setDataList(cleanData);
        } else {
          setError(res?.message || "Gagal memuat data master");
        }
      }
    } catch (err: any) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [kategori]);

  // Form Submission
  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const actionText = editId ? `Sedang memperbarui data ${kategori}...` : `Sedang menyimpan data ${kategori} baru...`;
    try {
      setLoading(true);
      setLoadingAction(actionText);
      let res;
      if (kategori === "User") {
        if (editId) {
          res = await callGas("editUserData", [editId, formData]);
        } else {
          res = await callGas("tambahUserData", [formData]);
        }
      } else if (kategori === "Kelas") {
        const namaKls = (formData.nama_kelas || "").trim();
        const rawWali = formData.wali_kelas || "-";
        const cleanWali = isInvalidWali(rawWali) ? "-" : String(rawWali).trim();
        const cleanIdGuru = formData.id_guru || "-";

        const payloadObj = {
          nama_kelas: namaKls,
          kelas: namaKls,
          namaKelas: namaKls,
          id_guru: cleanIdGuru,
          idGuru: cleanIdGuru,
          id_wali: cleanIdGuru,
          wali_kelas: cleanWali,
          wali: cleanWali,
          waliKelas: cleanWali,
          nama_guru: cleanWali,
          guru_wali: cleanWali,
          wali_kelas_nama: cleanWali,
          walikelas: cleanWali,
          guruWali: cleanWali
        };

        if (editId) {
          res = await callGas("editKelas", [editId, namaKls, cleanWali, cleanIdGuru, payloadObj]);
        } else {
          res = await callGas("tambahKelas", [namaKls, cleanWali, cleanIdGuru, payloadObj]);
        }
        // Also call simpanWaliKelas as secondary sync
        callGas("simpanWaliKelas", [namaKls, cleanWali, cleanIdGuru, payloadObj]).catch(() => {});
      } else {
        if (editId) {
          // Edit record
          res = await callGas("editDataMaster", [kategori, editId, formData]);
        } else {
          // Add new record
          res = await callGas("tambahDataMaster", [kategori, formData]);
        }
      }

      if (res && res.success) {
        setShowFormModal(false);
        setFormData({});
        setEditId(null);
        fetchData();
      } else {
        alert(res?.message || "Gagal menyimpan data");
      }
    } catch (err: any) {
      alert("Error: " + err.toString());
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  };

  // Delete Record
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus permanen data: ${name}?`)) return;
    try {
      setLoading(true);
      setLoadingAction(`Sedang menghapus data ${name}...`);
      let res;
      if (kategori === "User") {
        res = await callGas("hapusUserData", [id]);
      } else if (kategori === "Kelas") {
        res = await callGas("hapusKelas", [id, { nama_kelas: id }]);
      } else {
        res = await callGas("hapusDataMaster", [kategori, id]);
      }
      if (res && res.success) {
        fetchData();
      } else {
        alert(res?.message || "Gagal menghapus data");
      }
    } catch (err: any) {
      alert("Error: " + err.toString());
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  };

  // Open Form for editing
  const openEdit = (item: any) => {
    if (kategori === "Kelas") {
      setEditId(item.nama_kelas || item.kelas);
      const rawWali = item.wali_kelas || item.wali || item.waliKelas || item.guru_wali || item.nama_guru || item["Wali Kelas"] || "-";
      const cleanWali = isInvalidWali(rawWali) ? "-" : String(rawWali).trim();
      const rawIdGuru = item.id_guru || item.id_wali || item.idGuru || "-";
      let cleanIdGuru = String(rawIdGuru || "-").trim();
      
      let matchedGuruName = cleanWali;
      if (cleanWali !== "-") {
        const foundG = guruList.find((g: any) => {
          const gName = (g.nama_guru || g.nama || g.name || "").trim().toLowerCase();
          return gName === cleanWali.toLowerCase() || gName.includes(cleanWali.toLowerCase()) || cleanWali.toLowerCase().includes(gName);
        });
        if (foundG) {
          matchedGuruName = (foundG.nama_guru || foundG.nama || foundG.name || "").trim();
          if ((cleanIdGuru === "-" || !cleanIdGuru) && foundG.id_guru) {
            cleanIdGuru = foundG.id_guru;
          }
        }
      }

      setFormData({
        nama_kelas: item.nama_kelas || item.kelas || "",
        id_guru: cleanIdGuru,
        wali_kelas: matchedGuruName
      });
    } else {
      setEditId(kategori === "Siswa" ? item.id_siswa : (kategori === "Guru" ? item.id_guru : item.username));
      setFormData(item);
    }
    setShowFormModal(true);
  };

  // Open Form for creating
  const openAdd = () => {
    setEditId(null);
    if (kategori === "Siswa") {
      setFormData({
        nisn: "",
        nama_siswa: "",
        jenis_kelamin: "Laki-laki",
        kelas: classList[0] || "XI",
        jurusan: "RPL 1",
        no_hp_ortu: ""
      });
    } else if (kategori === "Guru") {
      setFormData({
        nip_nuptk: "",
        nama_guru: "",
        jenis_kelamin: "Laki-laki",
        jabatan_tugas: "Guru Mapel",
        no_hp: "",
        password: "guru123"
      });
    } else if (kategori === "Kelas") {
      setFormData({
        nama_kelas: "",
        id_guru: "-",
        wali_kelas: "-"
      });
    } else {
      setFormData({
        username: "",
        password: "user123",
        role: "TU",
        target_id: "-"
      });
    }
    setShowFormModal(true);
  };

  // Parse Excel / Tabular copied data
  const handleImportSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!pasteData.trim()) return;

    try {
      setImportStatus("Menganalisis baris...");
      const rows = pasteData.trim().split("\n");
      const listParsed: any[] = [];
      
      rows.forEach((row, i) => {
        const cols = row.split("\t"); // Excel copy paste is tab-separated
        if (cols.length < 2) return; // skip junk rows
        
        const idVal = cols[0]?.trim();
        const nameVal = cols[1]?.trim();
        if ((!idVal || idVal === "-") && (!nameVal || nameVal === "-")) return; // skip blank row

        if (kategori === "Siswa") {
          listParsed.push({
            nisn: idVal || "-",
            nama_siswa: nameVal || "-",
            jenis_kelamin: cols[2]?.trim() || "Laki-laki",
            kelas: cols[3]?.trim() || "XI",
            jurusan: cols[4]?.trim() || "RPL 1",
            no_hp_ortu: cols[5]?.trim() || "-"
          });
        } else {
          listParsed.push({
            nip_nuptk: idVal || "-",
            nama_guru: nameVal || "-",
            jenis_kelamin: cols[2]?.trim() || "Laki-laki",
            jabatan_tugas: cols[3]?.trim() || "Guru",
            no_hp: cols[4]?.trim() || "-"
          });
        }
      });

      if (listParsed.length === 0) {
        setImportStatus("Tidak ada data valid yang terdeteksi!");
        return;
      }

      setImportStatus(`Mengunggah ${listParsed.length} data ke spreadsheet...`);
      const res = await callGas("importDataMassal", [kategori, listParsed]);
      if (res && res.success) {
        setImportStatus(null);
        setPasteData("");
        setShowImportModal(false);
        fetchData();
        alert(res.message);
      } else {
        setImportStatus("Gagal: " + (res?.message || "Terjadi kesalahan upload"));
      }
    } catch (err: any) {
      setImportStatus("Error: " + err.toString());
    }
  };

  // Export Data to CSV
  const handleExportCSV = () => {
    if (dataList.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    const headers = kategori === "Siswa" 
      ? ["ID", "NISN", "Nama Siswa", "Jenis Kelamin", "Kelas", "Jurusan", "HP Ortu", "QR Content"]
      : ["ID", "NIP/NUPTK", "Nama Guru", "Jenis Kelamin", "Jabatan", "No HP", "QR Content"];
      
    csvContent += headers.join(",") + "\n";
    
    dataList.forEach(item => {
      const row = kategori === "Siswa" ? [
        item.id_siswa,
        `"${item.nisn}"`,
        `"${item.nama_siswa}"`,
        item.jenis_kelamin,
        item.kelas,
        `"${item.jurusan}"`,
        `"${item.no_hp_ortu}"`,
        item.qr_content
      ] : [
        item.id_guru,
        `"${item.nip_nuptk}"`,
        `"${item.nama_guru}"`,
        item.jenis_kelamin,
        `"${item.jabatan_tugas}"`,
        `"${item.no_hp}"`,
        item.qr_content
      ];
      csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `data_master_${kategori.toLowerCase()}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter lists based on search & class
  const filteredData = dataList.filter(item => {
    const name = (item.nama_siswa || item.nama_guru || item.username || "").toLowerCase();
    const id = (item.id_siswa || item.id_guru || item.username || "").toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase()) || id.includes(searchQuery.toLowerCase());
    
    if (kategori === "Siswa" && selectedKelas !== "Semua") {
      const studentClass = `${item.kelas || ""} ${item.jurusan || ""} ${item.kelas_jurusan || ""}`.replace(/[\s-]+/g, "").toLowerCase();
      const targetClass = selectedKelas.replace(/[\s-]+/g, "").toLowerCase();
      const classMatch = studentClass.includes(targetClass) || targetClass.includes(studentClass);
      return matchesSearch && classMatch;
    }
    return matchesSearch;
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Split filtered data into chunks of 5 items per A4 sheet container
  const printChunkSize = 5;
  const printChunks: any[][] = [];
  for (let i = 0; i < filteredData.length; i += printChunkSize) {
    printChunks.push(filteredData.slice(i, i + printChunkSize));
  }

  return (
    <>
    <div className="space-y-6 animate-fade-in print:hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Data Master Sekolah</h1>
          <p className="text-xs text-gray-500">Kelola master data murid dan guru, serta ekspor/impor data masal</p>
        </div>

        {/* Categories toggler */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-gray-50 border border-gray-200 p-1 rounded-xl">
            <button 
              onClick={() => { setKategori("Siswa"); setSelectedKelas("Semua"); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-150 ${kategori === "Siswa" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
            >
              <GraduationCap className="w-4 h-4" />
              Siswa
            </button>
            <button 
              onClick={() => setKategori("Guru")}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-150 ${kategori === "Guru" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
            >
              <Users className="w-4 h-4" />
              Guru
            </button>
            <button 
              onClick={() => setKategori("Kelas")}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-150 ${kategori === "Kelas" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
            >
              <Building2 className="w-4 h-4 text-emerald-600" />
              Kelas & Wali
            </button>
            <button 
              onClick={() => setKategori("User")}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-150 ${kategori === "User" ? "bg-white text-amber-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
            >
              <Users className="w-4 h-4 text-amber-500" />
              Akun User
            </button>
          </div>

          <button 
            onClick={() => setShowPrintModal(true)}
            disabled={filteredData.length === 0}
            className="bg-white border border-gray-200 text-gray-700 font-bold text-xs px-3.5 py-2.5 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all duration-150 flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            Cetak Kartu A4 (5/Lembar)
          </button>

          <button 
            onClick={() => setShowImportModal(true)}
            className="bg-white border border-gray-200 text-gray-700 font-bold text-xs px-3.5 py-2.5 rounded-xl hover:bg-gray-50 transition-all duration-150 flex items-center gap-1.5 shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Impor Masal
          </button>

          <button 
            onClick={handleExportCSV}
            disabled={filteredData.length === 0}
            className="bg-white border border-gray-200 text-gray-700 font-bold text-xs px-3.5 py-2.5 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all duration-150 flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-4 h-4" />
            Ekspor CSV
          </button>

          <button 
            onClick={openAdd}
            className="bg-blue-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-all duration-150 shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Tambah {kategori}
          </button>
        </div>
      </div>

      {/* Search and class selection filter */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <input 
            type="text"
            placeholder={`Cari nama or ID ${kategori.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>

        {kategori === "Siswa" && (
          <select 
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-500"
          >
            <option value="Semua">Semua Kelas</option>
            {classList.map((kls, idx) => (
              <option key={idx} value={kls}>{kls}</option>
            ))}
          </select>
        )}
      </div>

      {/* Main Table list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 font-medium">Memuat database...</div>
        ) : error ? (
          <div className="p-12 text-center text-red-500 font-medium">{error}</div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-medium">Tidak ada data ditemukan</div>
        ) : (
          <>
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  {kategori === "User" ? (
                    <>
                      <th className="py-3.5 px-6">Username</th>
                      <th className="py-3.5 px-6">Password</th>
                      <th className="py-3.5 px-6">Hak Akses (Role)</th>
                      <th className="py-3.5 px-6">Target ID Guru</th>
                    </>
                  ) : kategori === "Kelas" ? (
                    <>
                      <th className="py-3.5 px-6">Nama Kelas</th>
                      <th className="py-3.5 px-6">ID Guru Wali</th>
                      <th className="py-3.5 px-6">Wali Kelas</th>
                      <th className="py-3.5 px-6">Jumlah Siswa</th>
                      <th className="py-3.5 px-6">Status Wali</th>
                    </>
                  ) : (
                    <>
                      <th className="py-3.5 px-6">ID</th>
                      <th className="py-3.5 px-6">{kategori === "Siswa" ? "NISN" : "NIP / NUPTK"}</th>
                      <th className="py-3.5 px-6">Nama</th>
                      <th className="py-3.5 px-6">JK</th>
                      <th className="py-3.5 px-6">{kategori === "Siswa" ? "Kelas & Jurusan" : "Jabatan"}</th>
                      <th className="py-3.5 px-6">{kategori === "Siswa" ? "HP Wali" : "No HP"}</th>
                      {kategori === "Guru" && <th className="py-3.5 px-6">Password</th>}
                    </>
                  )}
                  <th className="py-3.5 px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                {paginatedData.map((item) => {
                  if (kategori === "User") {
                    return (
                      <tr key={item.username} className="hover:bg-slate-50/80 transition-all duration-150">
                        <td className="py-3.5 px-6 font-bold text-gray-900">{item.username}</td>
                        <td className="py-3.5 px-6 font-mono text-gray-500">{item.password}</td>
                        <td className="py-3.5 px-6">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.role === "Admin" ? "bg-red-50 text-red-800 border border-red-100" :
                            item.role === "TU" ? "bg-amber-50 text-amber-800 border border-amber-100" :
                            "bg-blue-50 text-blue-800 border border-blue-100"
                          }`}>
                            {item.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 font-mono font-bold text-gray-500">{item.target_id || "-"}</td>
                        <td className="py-3.5 px-6 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button 
                              onClick={() => openEdit(item)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-all duration-150"
                              title="Edit User"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(item.username, item.username)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-150"
                              title="Hapus User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  if (kategori === "Kelas") {
                    const studentCount = siswaList.filter((s: any) => {
                      const kls = String(s.kelas || "").trim();
                      const jur = String(s.jurusan || "").trim();
                      const full = `${kls} ${jur}`.trim();
                      return kls === item.nama_kelas || full === item.nama_kelas || jur === item.nama_kelas;
                    }).length;
                    const hasWali = item.wali_kelas && item.wali_kelas !== "-" && !isInvalidWali(item.wali_kelas);

                    return (
                      <tr key={item.nama_kelas} className="hover:bg-slate-50/80 transition-all duration-150">
                        <td className="py-3.5 px-6 font-bold text-gray-900">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-emerald-600" />
                            <span>{item.nama_kelas}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-6 font-mono font-bold text-gray-500">
                          {item.id_guru || "-"}
                        </td>
                        <td className="py-3.5 px-6 font-semibold text-gray-800">
                          {hasWali ? (
                            <span className="flex items-center gap-1.5 text-slate-800">
                              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                              {item.wali_kelas}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Belum Ditentukan</span>
                          )}
                        </td>
                        <td className="py-3.5 px-6">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                            {studentCount} Siswa
                          </span>
                        </td>
                        <td className="py-3.5 px-6">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            hasWali ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}>
                            {hasWali ? "Ada Wali Kelas" : "Belum Ada Wali"}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button 
                              onClick={() => openEdit(item)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-all duration-150"
                              title="Edit Kelas & Wali Kelas"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(item.nama_kelas, item.nama_kelas)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-150"
                              title="Hapus Kelas"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  const id = kategori === "Siswa" ? item.id_siswa : item.id_guru;
                  const primaryId = kategori === "Siswa" ? item.nisn : item.nip_nuptk;
                  const name = kategori === "Siswa" ? item.nama_siswa : item.nama_guru;
                  const position = kategori === "Siswa" ? `${item.kelas} ${item.jurusan}` : item.jabatan_tugas;
                  const phone = kategori === "Siswa" ? item.no_hp_ortu : item.no_hp;
                  
                  return (
                    <tr key={id} className="hover:bg-slate-50/80 transition-all duration-150">
                      <td className="py-3.5 px-6 font-mono font-bold text-gray-500">{id}</td>
                      <td className="py-3.5 px-6 text-gray-600 font-semibold">{primaryId}</td>
                      <td className="py-3.5 px-6 font-bold text-gray-900">{name}</td>
                      <td className="py-3.5 px-6 text-gray-500 font-medium">{item.jenis_kelamin}</td>
                      <td className="py-3.5 px-6 text-gray-600 font-semibold">{position}</td>
                      <td className="py-3.5 px-6 text-gray-500">{phone}</td>
                      {kategori === "Guru" && (
                        <td className="py-3.5 px-6 font-mono text-gray-500">{item.password || "guru123"}</td>
                      )}
                      <td className="py-3.5 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => setShowQrModal({ open: true, item })}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-150"
                            title="Tampilkan QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => openEdit(item)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-all duration-150"
                            title="Edit Data"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(id, name)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-150"
                            title="Hapus Data"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  className={`relative inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 ${
                    currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                  }`}
                >
                  Sebelumnya
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  className={`relative ml-3 inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 ${
                    currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                  }`}
                >
                  Selanjutnya
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-semibold">
                    Menampilkan <span className="font-bold text-gray-950">{startIndex + 1}</span> sampai{" "}
                    <span className="font-bold text-gray-950">
                      {Math.min(startIndex + itemsPerPage, filteredData.length)}
                    </span>{" "}
                    dari <span className="font-bold text-gray-950">{filteredData.length}</span> data
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-xl gap-1" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center rounded-lg px-2.5 py-1.5 text-gray-400 hover:bg-gray-50 ${
                        currentPage === 1 ? "opacity-40 cursor-not-allowed" : ""
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      if (
                        totalPages > 7 &&
                        page !== 1 &&
                        page !== totalPages &&
                        Math.abs(page - currentPage) > 1
                      ) {
                        if (page === 2 || page === totalPages - 1) {
                          return <span key={page} className="relative inline-flex items-center px-2 py-1 text-xs font-semibold text-gray-400">...</span>;
                        }
                        return null;
                      }

                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-150 ${
                            currentPage === page
                              ? "bg-blue-600 text-white shadow-sm shadow-blue-600/10"
                              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center rounded-lg px-2.5 py-1.5 text-gray-400 hover:bg-gray-50 ${
                        currentPage === totalPages ? "opacity-40 cursor-not-allowed" : ""
                      }`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
          </>
        )}
      </div>

      {/* ADD/EDIT MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-extrabold text-gray-900 text-base">
                {editId ? `Edit Data ${kategori}` : `Tambah ${kategori} Baru`}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {kategori === "Siswa" ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">NISN</label>
                    <input 
                      type="text"
                      required
                      value={formData.nisn || ""}
                      onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                      placeholder="Masukkan 10 digit NISN"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">Nama Siswa</label>
                    <input 
                      type="text"
                      required
                      value={formData.nama_siswa || ""}
                      onChange={(e) => setFormData({ ...formData, nama_siswa: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-bold"
                      placeholder="Nama lengkap murid"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">Jenis Kelamin</label>
                      <select 
                        value={formData.jenis_kelamin || "Laki-laki"}
                        onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">Kelas</label>
                      <select 
                        value={formData.kelas || "XI"}
                        onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                      >
                        {classList.map((kls, idx) => (
                          <option key={idx} value={kls}>{kls}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">Jurusan</label>
                      <input 
                        type="text"
                        required
                        value={formData.jurusan || ""}
                        onChange={(e) => setFormData({ ...formData, jurusan: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                        placeholder="Contoh: RPL 1"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">No HP Orang Tua</label>
                      <input 
                        type="text"
                        required
                        value={formData.no_hp_ortu || ""}
                        onChange={(e) => setFormData({ ...formData, no_hp_ortu: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                        placeholder="Contoh: 0857xxx"
                      />
                    </div>
                  </div>
                </>
              ) : kategori === "Guru" ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">NIP / NUPTK</label>
                    <input 
                      type="text"
                      required
                      value={formData.nip_nuptk || ""}
                      onChange={(e) => setFormData({ ...formData, nip_nuptk: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                      placeholder="NIP PNS atau NUPTK Guru"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">Nama Guru</label>
                    <input 
                      type="text"
                      required
                      value={formData.nama_guru || ""}
                      onChange={(e) => setFormData({ ...formData, nama_guru: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-bold"
                      placeholder="Nama lengkap & gelar"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">Jenis Kelamin</label>
                      <select 
                        value={formData.jenis_kelamin || "Laki-laki"}
                        onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">No HP</label>
                      <input 
                        type="text"
                        required
                        value={formData.no_hp || ""}
                        onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                        placeholder="No HP aktif WA"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">Jabatan / Tugas Tambahan</label>
                    <input 
                      type="text"
                      required
                      value={formData.jabatan_tugas || ""}
                      onChange={(e) => setFormData({ ...formData, jabatan_tugas: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                      placeholder="Contoh: Waka Kurikulum, Ka. RPL"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">Password Akun</label>
                    <input 
                      type="text"
                      required
                      value={formData.password || "guru123"}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-mono"
                      placeholder="Sandi login guru (default: guru123)"
                    />
                  </div>
                </>
              ) : kategori === "Kelas" ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">Nama Kelas</label>
                    <input 
                      type="text"
                      required
                      value={formData.nama_kelas || ""}
                      onChange={(e) => setFormData({ ...formData, nama_kelas: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-bold"
                      placeholder="Contoh: X RPL 1, XI TKJ 2"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">Pilih Wali Kelas (Guru)</label>
                    <select 
                      value={formData.id_guru || (formData.wali_kelas ? (guruList.find((g: any) => (g.nama_guru || g.nama || g.name) === formData.wali_kelas)?.id_guru || "-") : "-")}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "-") {
                          setFormData({ ...formData, id_guru: "-", wali_kelas: "-" });
                        } else {
                          const selectedGuru = guruList.find((g: any) => g.id_guru === val || (g.nama_guru || g.nama || g.name) === val);
                          const gName = selectedGuru ? (selectedGuru.nama_guru || selectedGuru.nama || selectedGuru.name) : val;
                          const gId = selectedGuru ? selectedGuru.id_guru : val;
                          setFormData({ ...formData, id_guru: gId, wali_kelas: gName });
                        }
                      }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-semibold"
                    >
                      <option value="-">-- Belum Ada Wali Kelas --</option>
                      {guruList.map((g: any, idx: number) => {
                        const nameG = g.nama_guru || g.nama || g.name;
                        const idG = g.id_guru || `G-${idx + 1}`;
                        return (
                          <option key={idx} value={idG}>
                            [{idG}] {nameG} {g.jabatan_tugas ? `(${g.jabatan_tugas})` : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">ID Guru Wali Kelas</label>
                    <input 
                      type="text"
                      readOnly
                      value={formData.id_guru || "-"}
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-500 font-mono font-bold"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">Username</label>
                    <input 
                      type="text"
                      required
                      disabled={!!editId}
                      value={formData.username || ""}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-bold"
                      placeholder="Masukkan username login"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">Password</label>
                    <input 
                      type="text"
                      required
                      value={formData.password || ""}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-mono font-bold"
                      placeholder="Masukkan password"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">Hak Akses (Role)</label>
                    <select 
                      value={formData.role || "TU"}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-bold"
                    >
                      <option value="Admin">Admin</option>
                      <option value="TU">Akses TU (Tata Usaha)</option>
                      <option value="Guru">Guru</option>
                    </select>
                  </div>
                  {formData.role === "Guru" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">Hubungkan ID Guru (Target ID)</label>
                      <input 
                        type="text"
                        required
                        value={formData.target_id || ""}
                        onChange={(e) => setFormData({ ...formData, target_id: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                        placeholder="Masukkan ID Guru (misal G-001)"
                      />
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="bg-gray-100 text-gray-600 font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-gray-200"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="bg-blue-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-blue-700"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT EXCEL PASTING MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-gray-900 text-base">Impor Data Masal {kategori}</h3>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
            </div>
            
            <form onSubmit={handleImportSubmit} className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl space-y-2 text-xs text-blue-800">
                <h4 className="font-bold">Format Kolom Excel (Copy - Paste):</h4>
                {kategori === "Siswa" ? (
                  <p className="font-mono bg-blue-100/60 p-2 rounded">
                    NISN [tab] Nama Siswa [tab] Jenis Kelamin [tab] Kelas [tab] Jurusan [tab] HP Ortu
                  </p>
                ) : (
                  <p className="font-mono bg-blue-100/60 p-2 rounded">
                    NIP [tab] Nama Guru [tab] Jenis Kelamin [tab] Jabatan [tab] No HP
                  </p>
                )}
                <p className="text-[10px] opacity-80 leading-relaxed">
                  * Tips: Buat kolom di Excel sesuai urutan di atas, copy baris datanya, lalu paste-kan langsung ke kolom teks di bawah ini.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500">Paste Data Tabular Excel</label>
                <textarea 
                  required
                  rows={8}
                  value={pasteData}
                  onChange={(e) => setPasteData(e.target.value)}
                  placeholder="Paste baris data Excel di sini..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-800 font-mono focus:outline-none"
                />
              </div>

              {importStatus && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl flex gap-2 text-xs font-medium">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{importStatus}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="bg-gray-100 text-gray-600 font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-gray-200"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={!pasteData.trim()}
                  className="bg-blue-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50"
                >
                  Unggah Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT SETTINGS MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-5 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-gray-900 text-base">Cetak Kartu {kategori} (A4)</h3>
              </div>
              <button onClick={() => setShowPrintModal(false)} className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer">×</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-xl space-y-1 text-xs text-blue-900">
                <div className="font-bold flex items-center gap-1.5 text-blue-800">
                  <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                  Format Cetak Kertas A4 (Hemat Kertas)
                </div>
                <div className="text-[11px] leading-relaxed text-blue-700/90 pt-1 space-y-0.5">
                  <p>• Ukuran per Kartu: <strong>85,6 mm x 53,98 mm</strong> (Standar KTP)</p>
                  <p>• Dimaksimalkan <strong>5 Kartu per Lembar A4</strong> agar hemat kertas</p>
                  <p>• Total Data: <strong>{filteredData.length} {kategori}</strong> ({printChunks.length} Lembar A4)</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Pilih Sisi Kartu yang Dicetak:</label>
                <div className="grid grid-cols-1 gap-2">
                  <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${printSide === "both" ? "bg-blue-50/70 border-blue-500 text-blue-900 font-bold" : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"}`}>
                    <input 
                      type="radio" 
                      name="printSide" 
                      value="both" 
                      checked={printSide === "both"} 
                      onChange={() => setPrintSide("both")}
                      className="accent-blue-600"
                    />
                    <div>
                      <div className="text-xs font-bold">Depan & Belakang (Berpasangan)</div>
                      <div className="text-[10px] text-gray-500 font-normal">Sisi depan dan belakang berdampingan (5 pasang per A4)</div>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${printSide === "front" ? "bg-blue-50/70 border-blue-500 text-blue-900 font-bold" : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"}`}>
                    <input 
                      type="radio" 
                      name="printSide" 
                      value="front" 
                      checked={printSide === "front"} 
                      onChange={() => setPrintSide("front")}
                      className="accent-blue-600"
                    />
                    <div>
                      <div className="text-xs font-bold">Hanya Sisi Depan</div>
                      <div className="text-[10px] text-gray-500 font-normal">5 kartu depan per lembar A4</div>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${printSide === "back" ? "bg-blue-50/70 border-blue-500 text-blue-900 font-bold" : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"}`}>
                    <input 
                      type="radio" 
                      name="printSide" 
                      value="back" 
                      checked={printSide === "back"} 
                      onChange={() => setPrintSide("back")}
                      className="accent-blue-600"
                    />
                    <div>
                      <div className="text-xs font-bold">Hanya Sisi Belakang</div>
                      <div className="text-[10px] text-gray-500 font-normal">5 kartu belakang per lembar A4</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="bg-gray-100 text-gray-600 font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-gray-200 cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setShowPrintModal(false);
                    setTimeout(() => window.print(), 250);
                  }}
                  className="bg-blue-600 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl hover:bg-blue-700 shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Sekarang ({printChunks.length} Halaman A4)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR MODAL */}
      {showQrModal.open && showQrModal.item && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden p-6 space-y-6 flex flex-col items-center max-w-md w-full">
            <div className="flex justify-between items-center w-full">
              <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Preview Kartu {kategori}
              </span>
              <button 
                onClick={() => setShowQrModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="flex justify-center w-full overflow-x-auto p-2">
              <IdCard item={showQrModal.item} kategori={kategori} />
            </div>

            <div className="grid grid-cols-2 gap-2 w-full">
              <button 
                onClick={() => {
                  setTimeout(() => window.print(), 150);
                }}
                className="bg-blue-600 text-white font-bold text-xs py-2.5 px-3 rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Cetak A4 (KTP)
              </button>

              <button 
                onClick={() => {
                  const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(showQrModal.item.qr_content)}`;
                  const link = document.createElement("a");
                  link.href = url;
                  link.target = "_blank";
                  link.download = `QR_${kategori}_${showQrModal.item.qr_content}.png`;
                  link.click();
                }}
                className="bg-slate-900 text-white font-bold text-xs py-2.5 px-3 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Unduh QR Saja
              </button>
            </div>
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
              <p className="text-xs text-gray-400 mt-1">Mohon tunggu sebentar, sedang memproses ke database...</p>
            </div>
          </div>
        </div>
      )}
    </div>
    
    {/* PRINT CONTAINER FOR A4 PAGES (MAX 5 CARDS PER A4 SHEET) */}
    <div className="hidden print:block w-full">
      {printChunks.map((chunk, pageIndex) => (
        <div key={pageIndex} className="print-a4-page">
          {chunk.map((item, itemIndex) => (
            <IdCard key={itemIndex} item={item} kategori={kategori} side={printSide} />
          ))}
        </div>
      ))}
    </div>
    </>
  );
}
