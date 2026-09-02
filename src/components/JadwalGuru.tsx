import { useState, useEffect, FormEvent } from "react";
import { 
  Calendar, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Clock, 
  AlertTriangle, 
  Users,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  GraduationCap,
  Layers,
  Building,
  CheckCircle2,
  FileText,
  Sparkles,
  Check,
  X,
  Filter,
  Eye,
  Loader2,
  RotateCcw,
  SlidersHorizontal,
  ExternalLink
} from "lucide-react";
import { callGas, callMock, getStorageKey, setStorage, getStorage, extractArrayData } from "../lib/gasApi";
import { ScheduleLessonItem, JamPelajaranItem, AbsensiMengajarItem, TeacherItem } from "../types";

interface ExtendedTeacherItem {
  id_guru: string;
  nama_guru: string;
  nip_nuptk: string;
}

const HARI_LIST = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const DEFAULT_MAPEL_LIST = [
  "Matematika",
  "Bahasa Indonesia",
  "Bahasa Inggris",
  "Pemrograman Web & Perangkat Bergerak",
  "Basis Data",
  "Pemrograman Berorientasi Objek",
  "Informatika / KKPI",
  "Pendidikan Agama",
  "Pancasila / PKn",
  "PJOK / Olahraga",
  "Fisika",
  "Kimia",
  "Biologi",
  "Sejarah Indonesia",
  "Seni Budaya",
  "Kewirausahaan (PKK)"
];

export default function JadwalGuru({ session }: { session?: any }) {
  const [activeTab, setActiveTab] = useState<"jadwal_pelajaran" | "absensi_mengajar" | "jadwal_khusus">("jadwal_pelajaran");

  // User session & role check
  const [currentUser, setCurrentUser] = useState<any>(null);
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

  // Filter for Tab 2 (Presensi Mengajar Guru) - Only today & Filter Jam
  const [filterJamMengajar, setFilterJamMengajar] = useState<string>("Semua");

  // Main Data States
  const [lessonSchedules, setLessonSchedules] = useState<ScheduleLessonItem[]>([]);
  const [jamSlots, setJamSlots] = useState<JamPelajaranItem[]>([]);
  const [teachers, setTeachers] = useState<ExtendedTeacherItem[]>([]);
  const [classList, setClassList] = useState<string[]>([]);
  const [absensiLogs, setAbsensiLogs] = useState<AbsensiMengajarItem[]>([]);

  // Flex schedules (legacy special entry/exit limit per teacher)
  const [flexSchedules, setFlexSchedules] = useState<any[]>([]);

  // Settings for Schedule Restriction & Tolerances
  const [batasiJamJadwal, setBatasiJamJadwal] = useState<boolean>(true);
  const [toleransiAwal, setToleransiAwal] = useState<number>(15);
  const [toleransiAkhir, setToleransiAkhir] = useState<number>(30);
  const [toleransiGuru, setToleransiGuru] = useState<number>(15);

  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters for Schedule Matrix/Table
  const [selectedHariFilter, setSelectedHariFilter] = useState("Semua");
  const [selectedKelasFilter, setSelectedKelasFilter] = useState("Semua");
  const [selectedGuruFilter, setSelectedGuruFilter] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination for Schedule Table
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal: Add/Edit Schedule Lesson
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editScheduleId, setEditScheduleId] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    hari: "Senin",
    kelas: "X RPL 1",
    jam_ke: 1,
    mode_durasi: "single" as "single" | "multi",
    jam_ke_mulai: 1,
    durasi_jam: 2, // 2, 3, 4, 5, 6 jam
    id_jam: "",
    mapel: "Matematika",
    id_guru: "",
    ruangan: "Kelas Utama"
  });

  // Modal: Teacher Class Attendance Form
  const [showAbsensiModal, setShowAbsensiModal] = useState(false);
  const [absensiForm, setAbsensiForm] = useState({
    tanggal: new Date().toISOString().split("T")[0],
    waktu_absen: new Date().toTimeString().slice(0, 5),
    hari: "Senin",
    id_guru: "",
    kelas: "XI RPL 1",
    mapel: "Matematika",
    jam_ke: 1,
    jam_mulai_jadwal: "07:00",
    jam_selesai_jadwal: "07:45",
    status: "Hadir Tepat Waktu" as "Hadir Tepat Waktu" | "Terlambat Masuk Kelas" | "Izin" | "Sakit" | "Tugas Luar",
    catatan_materi: ""
  });

  // Flex Teacher Limits (Jadwal Fleksibel Khusus Guru)
  const [showFlexModal, setShowFlexModal] = useState(false);
  const [showTopFlexForm, setShowTopFlexForm] = useState(false);
  const [editFlexId, setEditFlexId] = useState<string | null>(null);
  const [flexFilterGuru, setFlexFilterGuru] = useState<string>("Semua");
  const [flexFilterHari, setFlexFilterHari] = useState<string>("Semua");
  const [flexSearchQuery, setFlexSearchQuery] = useState<string>("");
  const [flexCurrentPage, setFlexCurrentPage] = useState<number>(1);
  const [flexItemsPerPage, setFlexItemsPerPage] = useState<number>(10);
  const [flexForm, setFlexForm] = useState({
    id_jadwal: "",
    id_guru: "",
    hari: "Senin",
    jam_masuk_mulai: "06:00",
    jam_masuk_batas: "07:15",
    jam_pulang_mulai: "15:30"
  });

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Jam Pelajaran Slots
      const resJam = await callGas("getJamPelajaran");
      const jamData = extractArrayData(resJam);
      setJamSlots(jamData);
      if (jamData.length > 0) {
        setStorage("jam_pelajaran", jamData);
      }

      // 2. Fetch Lesson Schedules
      const resSchedules = await callGas("getJadwalPelajaranSemua");
      const schedData = extractArrayData(resSchedules);
      setLessonSchedules(schedData);
      if (schedData.length > 0) {
        setStorage("jadwal_pelajaran", schedData);
      }

      // 3. Fetch Teachers Master Data
      const resTeachers = await callGas("getDataMaster", ["Guru"]);
      let tData = extractArrayData(resTeachers);
      if (!tData || tData.length === 0) {
        const resG = await callGas("getDataGuru");
        tData = extractArrayData(resG);
      }
      setTeachers(tData);
      if (tData.length > 0 && !scheduleForm.id_guru) {
        setScheduleForm(prev => ({ ...prev, id_guru: tData[0].id_guru || tData[0].id }));
        setAbsensiForm(prev => ({ ...prev, id_guru: tData[0].id_guru || tData[0].id }));
      }

      // 4. Fetch Classes Master Data
      let parsedKelas: string[] = [];
      try {
        const resKelas = await callGas("getKelasSemua");
        const kList = extractArrayData(resKelas);
        parsedKelas = kList.map((item: any) => typeof item === 'string' ? item : (item.nama_kelas || item.kelas || String(item))).filter(Boolean);
      } catch (e) {
        console.error("Fetch classes error", e);
      }
      if (!parsedKelas || parsedKelas.length === 0) {
        const stored = getStorage("data_kelas") || [];
        parsedKelas = stored.map((item: any) => typeof item === 'string' ? item : (item.nama_kelas || item.kelas || String(item))).filter(Boolean);
      }
      if (!parsedKelas || parsedKelas.length === 0) {
        parsedKelas = ["X RPL 1", "X RPL 2", "XI RPL 1", "XI RPL 2", "XII RPL 1"];
      }
      setClassList(parsedKelas);
      if (parsedKelas.length > 0) {
        setScheduleForm(prev => ({ ...prev, kelas: prev.kelas || parsedKelas[0] }));
      }

      // 5. Fetch Absensi Mengajar Guru
      const resAbs = await callGas("getAbsensiMengajarGuru");
      const absData = extractArrayData(resAbs);
      setAbsensiLogs(absData);

      // 6. Fetch Flex Special Schedules
      const resFlex = await callGas("getJadwalGuruSemua");
      const flexData = extractArrayData(resFlex);
      setFlexSchedules(flexData);

      // 7. Fetch Toleransi & Pembatasan Jam Presensi Guru
      try {
        const resCfg = await callGas("getPengaturanSemua");
        const cfg = resCfg?.data || resCfg;
        if (cfg && typeof cfg === "object") {
          if (cfg.batasi_jam_jadwal !== undefined) setBatasiJamJadwal(Boolean(cfg.batasi_jam_jadwal));
          if (cfg.toleransi_awal_menit !== undefined) setToleransiAwal(Number(cfg.toleransi_awal_menit) || 15);
          if (cfg.toleransi_akhir_menit !== undefined) setToleransiAkhir(Number(cfg.toleransi_akhir_menit) || 30);
          const val = Number(cfg.toleransi_guru ?? cfg.toleransi_mengajar_guru);
          if (!isNaN(val) && val >= 0) {
            setToleransiGuru(val);
          }
        }
      } catch (e) {}
    } catch (err: any) {
      setError("Gagal memuat data: " + err.toString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Set today's day name in Indonesian
  const getHariIniStr = () => {
    const dayIndex = new Date().getDay();
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    return days[dayIndex];
  };

  // Find active lesson slot based on current time
  const getActiveSlotNow = () => {
    const nowStr = new Date().toTimeString().slice(0, 5); // HH:mm
    return jamSlots.find(s => nowStr >= s.jam_mulai && nowStr <= s.jam_selesai);
  };

  // Auto-fill jam slot time when jam_ke changes in Schedule Form
  const handleScheduleJamKeChange = (jamKeNum: number) => {
    const slot = jamSlots.find(j => Number(j.jam_ke) === Number(jamKeNum));
    setScheduleForm(prev => ({
      ...prev,
      jam_ke: jamKeNum,
      id_jam: slot ? slot.id_jam : ""
    }));
  };

  // Save Lesson Schedule (Add/Edit)
  const handleSaveSchedule = async (e: FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.id_guru) {
      alert("Silakan pilih guru pengampu terlebih dahulu!");
      return;
    }
    const selectedTeacher = teachers.find(t => t.id_guru === scheduleForm.id_guru);

    try {
      setLoading(true);
      setLoadingAction(editScheduleId ? "Sedang memperbarui jadwal pelajaran..." : "Sedang menyimpan jadwal pelajaran baru...");
      let res;

      if (!editScheduleId && scheduleForm.mode_durasi === "multi" && scheduleForm.durasi_jam > 1) {
        // Multi-hour block creation (e.g. 2, 3, 4, 5, or 6 hours in 1 block)
        const startJam = Number(scheduleForm.jam_ke_mulai || scheduleForm.jam_ke || 1);
        const durasi = Number(scheduleForm.durasi_jam || 2);
        const endJam = startJam + durasi - 1;
        let createdCount = 0;

        for (let i = 0; i < durasi; i++) {
          const currentJam = startJam + i;
          const slot = jamSlots.find(j => Number(j.jam_ke) === Number(currentJam));

          const payload = {
            hari: scheduleForm.hari,
            kelas: scheduleForm.kelas,
            jam_ke: currentJam,
            jam_ke_mulai: startJam,
            jam_ke_selesai: endJam,
            is_block: true,
            total_jam_block: durasi,
            id_jam: slot ? slot.id_jam : `JP-${currentJam}`,
            jam_mulai: slot ? slot.jam_mulai : "07:00",
            jam_selesai: slot ? slot.jam_selesai : "07:45",
            mapel: scheduleForm.mapel,
            id_guru: scheduleForm.id_guru,
            nama_guru: selectedTeacher ? selectedTeacher.nama_guru : "",
            ruangan: scheduleForm.ruangan || "Kelas Utama"
          };

          const r = await callGas("tambahJadwalPelajaran", [payload]);
          if (r && r.success !== false) createdCount++;
        }

        setShowScheduleModal(false);
        alert(`Berhasil menambahkan jadwal untuk blok ${createdCount} jam pelajaran sekaligus (Jam ke-${startJam} s/d Jam ke-${endJam})!\n\nGuru cukup melakukan 1x scan QR Code untuk seluruh blok jam ini.`);
        fetchAllData();
        return;
      }

      // Single hour or editing existing schedule item
      const slot = jamSlots.find(j => j.jam_ke === Number(scheduleForm.jam_ke));
      const payload = {
        hari: scheduleForm.hari,
        kelas: scheduleForm.kelas,
        jam_ke: Number(scheduleForm.jam_ke),
        jam_ke_mulai: Number(scheduleForm.jam_ke_mulai || scheduleForm.jam_ke),
        jam_ke_selesai: Number(scheduleForm.jam_ke),
        is_block: scheduleForm.mode_durasi === "multi",
        total_jam_block: scheduleForm.mode_durasi === "multi" ? Number(scheduleForm.durasi_jam) : 1,
        id_jam: slot ? slot.id_jam : `JP-${scheduleForm.jam_ke}`,
        jam_mulai: slot ? slot.jam_mulai : "07:00",
        jam_selesai: slot ? slot.jam_selesai : "07:45",
        mapel: scheduleForm.mapel,
        id_guru: scheduleForm.id_guru,
        nama_guru: selectedTeacher ? selectedTeacher.nama_guru : "",
        ruangan: scheduleForm.ruangan || "Kelas Utama"
      };

      if (editScheduleId) {
        res = await callGas("editJadwalPelajaran", [editScheduleId, payload]);
      } else {
        res = await callGas("tambahJadwalPelajaran", [payload]);
      }

      if (res && res.success) {
        setShowScheduleModal(false);
        alert(res.message || "Jadwal pelajaran berhasil disimpan!");
        fetchAllData();
      } else {
        alert(res?.message || "Gagal menyimpan jadwal pelajaran.");
      }
    } catch (err: any) {
      alert("Kesalahan koneksi: " + err.toString());
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  };

  const handleDeleteSchedule = async (idJadwal: string, mapel: string, kelas: string) => {
    if (confirm(`Hapus jadwal pelajaran ${mapel} di kelas ${kelas}?`)) {
      try {
        const res = await callGas("hapusJadwalPelajaran", [idJadwal]);
        if (res && res.success) {
          alert("Jadwal pelajaran berhasil dihapus.");
          fetchAllData();
        } else {
          alert(res?.message || "Gagal menghapus.");
        }
      } catch (err: any) {
        alert("Kesalahan: " + err.toString());
      }
    }
  };

  // Handle Save Absensi Mengajar Guru (Teacher Class Attendance)
  const handleSaveAbsensiMengajar = async (e: FormEvent) => {
    e.preventDefault();
    if (!absensiForm.id_guru) {
      alert("Pilih guru terlebih dahulu!");
      return;
    }

    // Validate Schedule Time Window if restricted
    if (batasiJamJadwal && absensiForm.jam_mulai_jadwal && absensiForm.jam_mulai_jadwal !== "-" && absensiForm.jam_selesai_jadwal && absensiForm.jam_selesai_jadwal !== "-") {
      const [hM, mM] = absensiForm.jam_mulai_jadwal.split(":").map(Number);
      const [hS, mS] = absensiForm.jam_selesai_jadwal.split(":").map(Number);
      const [hN, mN] = absensiForm.waktu_absen.split(":").map(Number);
      if (!isNaN(hM) && !isNaN(mM) && !isNaN(hS) && !isNaN(mS) && !isNaN(hN) && !isNaN(mN)) {
        const startMin = hM * 60 + mM;
        const endMin = hS * 60 + mS;
        const nowMin = hN * 60 + mN;

        if (nowMin < startMin - toleransiAwal) {
          alert(`Gagal: Belum waktunya absen untuk jadwal ini. Jam pelajaran ${absensiForm.mapel} (${absensiForm.kelas}) dimulai pukul ${absensiForm.jam_mulai_jadwal}. Saat ini jam ${absensiForm.waktu_absen}.`);
          return;
        }
        if (nowMin > endMin + toleransiAkhir) {
          alert(`Gagal: Presensi mengajar ditolak. Waktu absen (${absensiForm.waktu_absen}) di luar jam jadwal pelajaran (${absensiForm.jam_mulai_jadwal} - ${absensiForm.jam_selesai_jadwal}).`);
          return;
        }
      }
    }

    const selectedTeacher = teachers.find(t => t.id_guru === absensiForm.id_guru);

    const payload = {
      tanggal: absensiForm.tanggal,
      waktu_absen: absensiForm.waktu_absen,
      hari: absensiForm.hari,
      id_guru: absensiForm.id_guru,
      nama_guru: selectedTeacher ? selectedTeacher.nama_guru : "Guru",
      kelas: absensiForm.kelas,
      mapel: absensiForm.mapel,
      jam_ke: Number(absensiForm.jam_ke),
      jam_mulai_jadwal: absensiForm.jam_mulai_jadwal,
      jam_selesai_jadwal: absensiForm.jam_selesai_jadwal,
      status: absensiForm.status,
      catatan_materi: absensiForm.catatan_materi || "-"
    };

    try {
      setLoading(true);
      const res = await callGas("simpanAbsensiMengajarGuru", [payload]);
      if (res && res.success) {
        setShowAbsensiModal(false);
        alert(res.message || "Presensi mengajar berhasil dicatat!");
        fetchAllData();
      } else {
        alert(res?.message || "Gagal mencatat presensi.");
        setLoading(false);
      }
    } catch (err: any) {
      alert("Error: " + err.toString());
      setLoading(false);
    }
  };

  const handleDeleteAbsensiMengajar = async (idLog: string) => {
    if (confirm("Hapus catatan presensi mengajar ini?")) {
      try {
        const res = await callGas("hapusAbsensiMengajarGuru", [idLog]);
        if (res && res.success) {
          alert("Riwayat presensi mengajar berhasil dihapus.");
          fetchAllData();
        }
      } catch (err: any) {
        alert("Error: " + err.toString());
      }
    }
  };

  // Quick action: Open Absensi Modal prefilled from a schedule item
  const openAbsensiFromSchedule = (sch: ScheduleLessonItem) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const timeNow = new Date().toTimeString().slice(0, 5);
    const slot = jamSlots.find(j => Number(j.jam_ke) === Number(sch.jam_ke));
    const jamMulai = slot ? slot.jam_mulai : (sch.jam_mulai || "07:00");
    const jamSelesai = slot ? slot.jam_selesai : (sch.jam_selesai || "07:45");

    // Check Schedule Time restriction if enabled
    if (batasiJamJadwal && jamMulai && jamMulai !== "-" && jamSelesai && jamSelesai !== "-") {
      const [hM, mM] = jamMulai.split(":").map(Number);
      const [hS, mS] = jamSelesai.split(":").map(Number);
      const [hN, mN] = timeNow.split(":").map(Number);
      if (!isNaN(hM) && !isNaN(mM) && !isNaN(hS) && !isNaN(mS) && !isNaN(hN) && !isNaN(mN)) {
        const startMin = hM * 60 + mM;
        const endMin = hS * 60 + mS;
        const nowMin = hN * 60 + mN;

        if (nowMin < startMin - toleransiAwal) {
          alert(`Presensi mengajar belum dibuka! Jam pelajaran ${sch.mapel} (${sch.kelas}) dimulai pukul ${jamMulai} (toleransi awal ${toleransiAwal} menit). Saat ini pukul ${timeNow}.`);
          return;
        }
        if (nowMin > endMin + toleransiAkhir) {
          alert(`Presensi mengajar ditolak! Jadwal pelajaran ${sch.mapel} (${sch.kelas}) telah selesai pada pukul ${jamSelesai} (toleransi akhir ${toleransiAkhir} menit). Saat ini pukul ${timeNow}.`);
          return;
        }
      }
    }

    // Check if late (more than toleransiGuru mins after start time)
    let autoStatus: "Hadir Tepat Waktu" | "Terlambat Masuk Kelas" = "Hadir Tepat Waktu";
    if (jamMulai && jamMulai !== "-") {
      const [hM, mM] = jamMulai.split(":").map(Number);
      const [hN, mN] = timeNow.split(":").map(Number);
      const startMin = hM * 60 + mM;
      const nowMin = hN * 60 + mN;
      if (nowMin > startMin + toleransiGuru) {
        autoStatus = "Terlambat Masuk Kelas";
      }
    }

    setAbsensiForm({
      tanggal: todayStr,
      waktu_absen: timeNow,
      hari: sch.hari,
      id_guru: sch.id_guru,
      kelas: sch.kelas,
      mapel: sch.mapel,
      jam_ke: sch.jam_ke,
      jam_mulai_jadwal: jamMulai,
      jam_selesai_jadwal: jamSelesai,
      status: autoStatus,
      catatan_materi: ""
    });
    setShowAbsensiModal(true);
  };

  // Handlers for Flex Schedules (Jadwal Fleksibel Khusus Guru)
  const handleOpenAddFlex = () => {
    setEditFlexId(null);
    setFlexForm({
      id_jadwal: "",
      id_guru: teachers[0]?.id_guru || "",
      hari: "Senin",
      jam_masuk_mulai: "06:00",
      jam_masuk_batas: "07:15",
      jam_pulang_mulai: "15:30"
    });
    setShowTopFlexForm(true);
  };

  const handleOpenEditFlex = (item: any) => {
    setEditFlexId(item.id_jadwal);
    setFlexForm({
      id_jadwal: item.id_jadwal,
      id_guru: item.id_guru,
      hari: item.hari,
      jam_masuk_mulai: item.jam_masuk_mulai || "06:00",
      jam_masuk_batas: item.jam_masuk_batas || "07:15",
      jam_pulang_mulai: item.jam_pulang_mulai || "15:30"
    });
    setShowTopFlexForm(true);
  };

  const handleSaveFlexSchedule = async (e: FormEvent) => {
    e.preventDefault();
    setLoadingAction(editFlexId ? "Mengupdate jadwal fleksibel guru..." : "Menyimpan jadwal fleksibel guru...");
    try {
      const teacher = teachers.find(t => t.id_guru === flexForm.id_guru);
      const payload = {
        id_jadwal: editFlexId || flexForm.id_jadwal || "",
        id_guru: flexForm.id_guru,
        nama_guru: teacher ? teacher.nama_guru : "",
        hari: flexForm.hari,
        jam_masuk_mulai: flexForm.jam_masuk_mulai,
        jam_masuk_batas: flexForm.jam_masuk_batas,
        jam_pulang_mulai: flexForm.jam_pulang_mulai
      };
      const res = await callGas("tambahJadwalGuru", [payload]);
      if (res && res.success) {
        setShowTopFlexForm(false);
        setShowFlexModal(false);
        setEditFlexId(null);
        await fetchAllData();
      } else {
        alert(res?.message || "Gagal menyimpan jadwal fleksibel.");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.toString());
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeleteFlexSchedule = async (idJadwal: string, namaGuru: string, hari: string) => {
    if (confirm(`Hapus jadwal fleksibel ${namaGuru} untuk hari ${hari}?`)) {
      setLoadingAction("Menghapus jadwal fleksibel...");
      try {
        const res = await callGas("hapusJadwalGuru", [idJadwal]);
        if (res && res.success) {
          await fetchAllData();
        } else {
          alert(res?.message || "Gagal menghapus jadwal fleksibel.");
        }
      } catch (e: any) {
        alert("Terjadi kesalahan: " + e.toString());
      } finally {
        setLoadingAction(null);
      }
    }
  };

  // Filtered schedule list
  const filteredSchedules = lessonSchedules.filter(item => {
    const matchHari = selectedHariFilter === "Semua" || item.hari === selectedHariFilter;
    const matchKelas = selectedKelasFilter === "Semua" || item.kelas === selectedKelasFilter;
    const matchGuru = selectedGuruFilter === "Semua" || item.id_guru === selectedGuruFilter;
    const matchSearch = item.mapel.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        item.nama_guru.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.kelas.toLowerCase().includes(searchQuery.toLowerCase());
    return matchHari && matchKelas && matchGuru && matchSearch;
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSchedules = filteredSchedules.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);

  // Filtered & Paginated Flex Schedules (Tab Jadwal Khusus Guru)
  const filteredFlexSchedules = flexSchedules.filter((item) => {
    const matchGuru = flexFilterGuru === "Semua" || 
      String(item.id_guru || "").toLowerCase() === flexFilterGuru.toLowerCase() ||
      String(item.nama_guru || "").toLowerCase() === flexFilterGuru.toLowerCase();
    
    const matchHari = flexFilterHari === "Semua" ||
      String(item.hari || "").toLowerCase().trim() === flexFilterHari.toLowerCase().trim();

    const q = flexSearchQuery.toLowerCase().trim();
    const matchSearch = !q || 
      String(item.nama_guru || "").toLowerCase().includes(q) ||
      String(item.id_guru || "").toLowerCase().includes(q) ||
      String(item.hari || "").toLowerCase().includes(q) ||
      String(item.jam_masuk_mulai || "").includes(q) ||
      String(item.jam_masuk_batas || "").includes(q) ||
      String(item.jam_pulang_mulai || "").includes(q);

    return matchGuru && matchHari && matchSearch;
  });

  const totalFlexPages = Math.max(1, Math.ceil(filteredFlexSchedules.length / flexItemsPerPage));
  const flexStartIndex = (flexCurrentPage - 1) * flexItemsPerPage;
  const paginatedFlexSchedules = filteredFlexSchedules.slice(flexStartIndex, flexStartIndex + flexItemsPerPage);

  const activeSlot = getActiveSlotNow();
  const todayHari = getHariIniStr();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 opacity-15 pointer-events-none">
          <Calendar className="w-56 h-56" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Sistem Jadwal & Presensi Mengajar Integrasi
            </div>
            <h2 className="text-2xl font-black tracking-tight">Jadwal Pelajaran & Presensi Guru</h2>
            <p className="text-amber-100 text-xs mt-1 font-medium max-w-xl">
              Kelola jadwal pelajaran lengkap per kelas & jam pelajaran. Catat presensi masuk kelas guru secara real-time setiap masuk jam pelajaran.
            </p>
          </div>

          {!isGuru && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setEditScheduleId(null);
                  setScheduleForm({
                    hari: todayHari !== "Minggu" ? todayHari : "Senin",
                    kelas: classList[0] || "X RPL 1",
                    jam_ke: 1,
                    id_jam: jamSlots[0]?.id_jam || "",
                    mapel: DEFAULT_MAPEL_LIST[0],
                    id_guru: teachers[0]?.id_guru || "",
                    ruangan: "Kelas Utama"
                  });
                  setShowScheduleModal(true);
                }}
                className="bg-white text-amber-900 font-extrabold text-xs px-4 py-2.5 rounded-xl hover:bg-amber-50 transition-all shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                + Jadwal Pelajaran Baru
              </button>

              <button
                onClick={() => {
                  const todayStr = new Date().toISOString().split("T")[0];
                  const timeNow = new Date().toTimeString().slice(0, 5);
                  setAbsensiForm({
                    tanggal: todayStr,
                    waktu_absen: timeNow,
                    hari: todayHari !== "Minggu" ? todayHari : "Senin",
                    id_guru: teachers[0]?.id_guru || "",
                    kelas: classList[0] || "X RPL 1",
                    mapel: DEFAULT_MAPEL_LIST[0],
                    jam_ke: 1,
                    jam_mulai_jadwal: "07:00",
                    jam_selesai_jadwal: "07:45",
                    status: "Hadir Tepat Waktu",
                    catatan_materi: ""
                  });
                  setShowAbsensiModal(true);
                }}
                className="bg-amber-900/40 border border-white/30 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl hover:bg-amber-900/60 transition-all shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Presensi Masuk Pelajaran
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar gap-2">
        <button
          onClick={() => setActiveTab("jadwal_pelajaran")}
          className={`pb-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === "jadwal_pelajaran"
              ? "border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-xl"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Jadwal Pelajaran Kelas
          <span className="ml-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
            {lessonSchedules.length}
          </span>
        </button>

        {!isGuru && (
          <>
            <button
              onClick={() => setActiveTab("absensi_mengajar")}
              className={`pb-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === "absensi_mengajar"
                  ? "border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-xl"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Presensi Mengajar Guru (Hari Ini)
              <span className="ml-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                {absensiLogs.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("jadwal_khusus")}
              className={`pb-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === "jadwal_khusus"
                  ? "border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-xl"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Users className="w-4 h-4" />
              Jadwal Fleksibel Guru (Khusus)
            </button>

            <a
              href="#/settings"
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = "#/settings";
              }}
              className="pb-3 px-4 text-xs font-bold border-b-2 border-transparent text-gray-500 hover:text-amber-700 hover:border-amber-300 whitespace-nowrap transition-all flex items-center gap-1.5 ml-auto"
              title="Pengaturan slot jam pelajaran sekolah kini dikelola di Menu Pengaturan"
            >
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Pengaturan Jam ({jamSlots.length} Slot)</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </a>
          </>
        )}
      </div>

      {/* TAB 1: JADWAL PELAJARAN */}
      {activeTab === "jadwal_pelajaran" && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
              {/* Day Filter */}
              <select
                value={selectedHariFilter}
                onChange={(e) => {
                  setSelectedHariFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:border-amber-500"
              >
                <option value="Semua">Semua Hari</option>
                {HARI_LIST.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>

              {/* Class Filter */}
              <select
                value={selectedKelasFilter}
                onChange={(e) => {
                  setSelectedKelasFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:border-amber-500"
              >
                <option value="Semua">Semua Kelas</option>
                {classList.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>

              {/* Teacher Filter */}
              <select
                value={selectedGuruFilter}
                onChange={(e) => {
                  setSelectedGuruFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:border-amber-500"
              >
                <option value="Semua">Semua Guru Pengampu</option>
                {teachers.map((t) => (
                  <option key={t.id_guru} value={t.id_guru}>{t.nama_guru}</option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Cari mapel, guru, kelas..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-amber-500"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Schedule Table / List */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {loading && lessonSchedules.length === 0 ? (
              <div className="p-12 text-center text-gray-400 font-medium">Memuat jadwal pelajaran...</div>
            ) : filteredSchedules.length === 0 ? (
              <div className="p-12 text-center text-gray-400 font-medium">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-bold text-gray-600">Belum ada jadwal pelajaran untuk kriteria ini</p>
                <p className="text-xs text-gray-400 mt-1">Klik tombol "+ Jadwal Pelajaran Baru" di atas untuk menambahkan jadwal kelas.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        <th className="py-3.5 px-5">Hari</th>
                        <th className="py-3.5 px-5">Jam Ke</th>
                        <th className="py-3.5 px-5">Waktu</th>
                        <th className="py-3.5 px-5">Kelas</th>
                        <th className="py-3.5 px-5">Mata Pelajaran</th>
                        <th className="py-3.5 px-5">Guru Pengampu</th>
                        <th className="py-3.5 px-5">Ruangan</th>
                        <th className="py-3.5 px-5 text-center">Presensi / Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                      {paginatedSchedules.map((item) => {
                        const slot = jamSlots.find(j => Number(j.jam_ke) === Number(item.jam_ke));
                        const jamMulai = slot ? slot.jam_mulai : (item.jam_mulai || "-");
                        const jamSelesai = slot ? slot.jam_selesai : (item.jam_selesai || "-");

                        return (
                          <tr key={item.id_jadwal} className="hover:bg-amber-50/20 transition-all duration-150">
                            <td className="py-3.5 px-5 font-bold">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-100">
                                {item.hari}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 font-mono font-bold text-gray-900">
                              Jam {item.jam_ke}
                            </td>
                            <td className="py-3.5 px-5 font-mono text-gray-600">
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
                                <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                                {jamMulai} - {jamSelesai}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 font-bold text-blue-900">
                              <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-[10px] font-black border border-blue-100">
                                {item.kelas}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 font-extrabold text-gray-900">
                              {item.mapel}
                            </td>
                            <td className="py-3.5 px-5 font-medium text-gray-700">
                              <div className="flex items-center gap-1.5">
                                <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>{item.nama_guru}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-5 text-gray-500 font-mono text-[11px]">
                              {item.ruangan || "Kelas Utama"}
                            </td>
                            <td className="py-3.5 px-5 text-center">
                              {!isGuru ? (
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => openAbsensiFromSchedule(item)}
                                    className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[10px] px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 border border-emerald-200"
                                    title="Catat Presensi Masuk Guru"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    Absen Masuk
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditScheduleId(item.id_jadwal);
                                      setScheduleForm({
                                        hari: item.hari,
                                        kelas: item.kelas,
                                        jam_ke: item.jam_ke,
                                        id_jam: item.id_jam || "",
                                        mapel: item.mapel,
                                        id_guru: item.id_guru,
                                        ruangan: item.ruangan || "Kelas Utama"
                                      });
                                      setShowScheduleModal(true);
                                    }}
                                    className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                    title="Edit Jadwal"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSchedule(item.id_jadwal, item.mapel, item.kelas)}
                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                    title="Hapus Jadwal"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 font-bold text-[10px] px-2.5 py-1 rounded-lg border border-amber-200">
                                  <BookOpen className="w-3 h-3 text-amber-600" /> Jadwal Masuk
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4">
                    <p className="text-xs text-gray-500 font-semibold">
                      Menampilkan <span className="font-bold text-gray-950">{startIndex + 1}</span> -{" "}
                      <span className="font-bold text-gray-950">
                        {Math.min(startIndex + itemsPerPage, filteredSchedules.length)}
                      </span>{" "}
                      dari <span className="font-bold text-gray-950">{filteredSchedules.length}</span> jadwal
                    </p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-xs font-bold rounded-lg border border-gray-200 disabled:opacity-40"
                      >
                        Prev
                      </button>
                      <span className="px-3 py-1 text-xs font-bold text-gray-600">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-xs font-bold rounded-lg border border-gray-200 disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PRESENSI MENGAJAR GURU */}
      {activeTab === "absensi_mengajar" && (
        <div className="space-y-6">
          {/* Active Period / Quick Logger Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
                  <span>Waktu Pembelajaran Aktif</span>
                  <span className="bg-emerald-200 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    Hari {todayHari}
                  </span>
                </h3>
                <p className="text-xs text-emerald-800 font-medium mt-0.5">
                  {activeSlot ? (
                    <span>Sedang berlangsung: <strong>{activeSlot.nama_jam} ({activeSlot.jam_mulai} - {activeSlot.jam_selesai})</strong></span>
                  ) : (
                    <span>Di luar jam pelajaran utama. Pengisian presensi tetap bisa dilakukan secara manual.</span>
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                const todayStr = new Date().toISOString().split("T")[0];
                const timeNow = new Date().toTimeString().slice(0, 5);
                setAbsensiForm({
                  tanggal: todayStr,
                  waktu_absen: timeNow,
                  hari: todayHari !== "Minggu" ? todayHari : "Senin",
                  id_guru: teachers[0]?.id_guru || "",
                  kelas: classList[0] || "X RPL 1",
                  mapel: DEFAULT_MAPEL_LIST[0],
                  jam_ke: activeSlot ? activeSlot.jam_ke : 1,
                  jam_mulai_jadwal: activeSlot ? activeSlot.jam_mulai : "07:00",
                  jam_selesai_jadwal: activeSlot ? activeSlot.jam_selesai : "07:45",
                  status: "Hadir Tepat Waktu",
                  catatan_materi: ""
                });
                setShowAbsensiModal(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-sm transition-all shrink-0 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Catat Presensi Mengajar Sekarang
            </button>
          </div>

          {/* History Log Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                  <span>Laporan Presensi Mengajar Guru Hari Ini</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {new Date().toISOString().split("T")[0]}
                  </span>
                </h3>
                <p className="text-xs text-gray-500 font-medium">Log kehadiran guru di setiap sesi kelas khusus hari ini dengan filter jam</p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-500 shrink-0">Filter Jam:</label>
                <select
                  value={filterJamMengajar}
                  onChange={(e) => setFilterJamMengajar(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Semua">Semua Jam Pelajaran</option>
                  {jamSlots.map((s) => (
                    <option key={s.id_jam} value={s.jam_ke}>
                      Jam ke-{s.jam_ke} ({s.jam_mulai} - {s.jam_selesai})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {(() => {
              const d = new Date();
              const localYear = d.getFullYear();
              const localMonth = String(d.getMonth() + 1).padStart(2, "0");
              const localDay = String(d.getDate()).padStart(2, "0");
              const todayLocalStr = `${localYear}-${localMonth}-${localDay}`;
              const todayIsoStr = d.toISOString().split("T")[0];

              const filteredTodayLogs = absensiLogs.filter(log => {
                const logTgl = String(log.tanggal || "").split("T")[0].trim();
                const isToday = !logTgl || logTgl === todayLocalStr || logTgl === todayIsoStr;
                const matchJam = filterJamMengajar === "Semua" || Number(filterJamMengajar) === Number(log.jam_ke);
                return isToday && matchJam;
              });

              if (filteredTodayLogs.length === 0) {
                return (
                  <div className="p-12 text-center text-gray-400 font-medium">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="font-bold text-gray-600">Belum ada catatan presensi mengajar hari ini</p>
                    <p className="text-xs text-gray-400 mt-1">Presensi guru setiap masuk jam pelajaran hari ini akan tercatat di sini.</p>
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        <th className="py-3.5 px-5">Tanggal & Waktu</th>
                        <th className="py-3.5 px-5">Guru Pengampu</th>
                        <th className="py-3.5 px-5">Kelas & Mapel</th>
                        <th className="py-3.5 px-5">Jam Ke</th>
                        <th className="py-3.5 px-5">Status Presensi</th>
                        <th className="py-3.5 px-5">Jurnal / Catatan Materi</th>
                        <th className="py-3.5 px-5 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                      {filteredTodayLogs.map((log) => (
                        <tr key={log.id_log_mengajar} className="hover:bg-amber-50/20 transition-all">
                          <td className="py-3.5 px-5 font-mono">
                            <div className="font-bold text-gray-900">{log.tanggal}</div>
                            <div className="text-[10px] text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-500" />
                              {log.waktu_absen} WIB ({log.hari})
                            </div>
                          </td>
                          <td className="py-3.5 px-5 font-bold text-gray-900">
                            {log.nama_guru}
                          </td>
                          <td className="py-3.5 px-5">
                            <div className="font-extrabold text-indigo-950">{log.mapel}</div>
                            <div className="text-[11px] font-bold text-blue-600">Kelas: {log.kelas}</div>
                          </td>
                          <td className="py-3.5 px-5 font-mono font-bold">
                            Jam {log.jam_ke}
                            <div className="text-[10px] text-gray-400">{log.jam_mulai_jadwal} - {log.jam_selesai_jadwal}</div>
                          </td>
                          <td className="py-3.5 px-5 font-bold">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                              log.status === "Hadir Tepat Waktu"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : log.status === "Terlambat Masuk Kelas"
                                ? "bg-rose-50 text-rose-800 border-rose-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-gray-600 max-w-xs truncate">
                            {log.catatan_materi || "-"}
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <button
                              onClick={() => handleDeleteAbsensiMengajar(log.id_log_mengajar)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Hapus Log"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB 4: JADWAL KHUSUS GURU (FLEKSIBEL OPERASIONAL HARIAN) */}
      {activeTab === "jadwal_khusus" && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                Jadwal Operasional Harian Khusus Guru (Fleksibel)
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Pengaturan jam masuk, batas toleransi terlambat, dan jam pulang khusus guru per hari (di luar jam default sekolah).
              </p>
            </div>

            <button
              onClick={handleOpenAddFlex}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + Tambah Batas Fleksibel Guru
            </button>
          </div>

          {/* FORM TAMBAH / EDIT JADWAL FLEKSIBEL DI ATAS */}
          {showTopFlexForm && (
            <div className="bg-white rounded-2xl border-2 border-amber-400 shadow-lg p-5 sm:p-6 space-y-4 animate-fade-in">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-900">
                      {editFlexId ? "Edit Jadwal Fleksibel Harian Guru" : "Form Tambah Jadwal Fleksibel Harian Guru (Khusus)"}
                    </h4>
                    <p className="text-xs text-gray-500 font-medium">
                      Atur batas jam datang, toleransi terlambat, dan jam pulang khusus guru terpilih.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowTopFlexForm(false);
                    setEditFlexId(null);
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveFlexSchedule} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="space-y-1 sm:col-span-2 lg:col-span-2">
                    <label className="text-xs font-bold text-gray-700">Pilih Guru</label>
                    <select
                      value={flexForm.id_guru}
                      onChange={(e) => setFlexForm({ ...flexForm, id_guru: e.target.value })}
                      required
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-amber-500 focus:bg-white transition"
                    >
                      <option value="" disabled>-- Pilih Guru --</option>
                      {teachers.map((t) => (
                        <option key={t.id_guru} value={t.id_guru}>
                          {t.nama_guru} ({t.nip_nuptk || "No NIP"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Hari</label>
                    <select
                      value={flexForm.hari}
                      onChange={(e) => setFlexForm({ ...flexForm, hari: e.target.value })}
                      required
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-amber-500 focus:bg-white transition"
                    >
                      {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Jam Masuk Mulai</label>
                    <input
                      type="time"
                      value={flexForm.jam_masuk_mulai}
                      onChange={(e) => setFlexForm({ ...flexForm, jam_masuk_mulai: e.target.value })}
                      required
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2 text-xs text-gray-900 font-mono font-bold focus:outline-none focus:border-amber-500 focus:bg-white transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Batas Masuk (Terlambat)</label>
                    <input
                      type="time"
                      value={flexForm.jam_masuk_batas}
                      onChange={(e) => setFlexForm({ ...flexForm, jam_masuk_batas: e.target.value })}
                      required
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2 text-xs text-rose-600 font-mono font-bold focus:outline-none focus:border-amber-500 focus:bg-white transition"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                    <label className="text-xs font-bold text-gray-700">Jam Pulang Mulai</label>
                    <input
                      type="time"
                      value={flexForm.jam_pulang_mulai}
                      onChange={(e) => setFlexForm({ ...flexForm, jam_pulang_mulai: e.target.value })}
                      required
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2 text-xs text-emerald-600 font-mono font-bold focus:outline-none focus:border-amber-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTopFlexForm(false);
                      setEditFlexId(null);
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Batal / Tutup
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    {editFlexId ? "Update Jadwal Fleksibel" : "Simpan Jadwal Fleksibel"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* FILTER BAR: FILTER GURU, HARI, DAN PENCARIAN */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto flex-1">
                {/* Search Filter */}
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Cari guru / NIP / jam..."
                    value={flexSearchQuery}
                    onChange={(e) => {
                      setFlexSearchQuery(e.target.value);
                      setFlexCurrentPage(1);
                    }}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-amber-500 focus:bg-white transition"
                  />
                </div>

                {/* Guru Filter */}
                <div className="relative">
                  <Users className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <select
                    value={flexFilterGuru}
                    onChange={(e) => {
                      setFlexFilterGuru(e.target.value);
                      setFlexCurrentPage(1);
                    }}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-amber-500 focus:bg-white transition"
                  >
                    <option value="Semua">Semua Guru ({teachers.length})</option>
                    {teachers.map((t) => (
                      <option key={t.id_guru} value={t.id_guru}>
                        {t.nama_guru}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Hari Filter */}
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <select
                    value={flexFilterHari}
                    onChange={(e) => {
                      setFlexFilterHari(e.target.value);
                      setFlexCurrentPage(1);
                    }}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-amber-500 focus:bg-white transition"
                  >
                    <option value="Semua">Semua Hari</option>
                    {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].map((h) => (
                      <option key={h} value={h}>
                        Hari {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reset & Status Info */}
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                {(flexFilterGuru !== "Semua" || flexFilterHari !== "Semua" || flexSearchQuery) && (
                  <button
                    onClick={() => {
                      setFlexFilterGuru("Semua");
                      setFlexFilterHari("Semua");
                      setFlexSearchQuery("");
                      setFlexCurrentPage(1);
                    }}
                    className="px-3 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Filter
                  </button>
                )}
                <span className="text-xs font-semibold text-gray-500 px-2.5 py-1 bg-gray-100 rounded-lg">
                  Total: <strong className="text-gray-900">{filteredFlexSchedules.length}</strong> jadwal
                </span>
              </div>
            </div>
          </div>

          {/* TABEL DATA & PAGINASI */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {filteredFlexSchedules.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-gray-700">Tidak ada jadwal fleksibel yang cocok</p>
                <p className="text-xs text-gray-400">
                  {flexSchedules.length === 0 
                    ? "Belum ada batasan jadwal fleksibel harian khusus guru. Semua guru mengikuti jam operasional default sekolah."
                    : "Coba ubah kata kunci pencarian atau filter hari / guru."}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-100 font-bold text-gray-500 uppercase tracking-wider">
                        <th className="py-3.5 px-4 w-12 text-center">No</th>
                        <th className="py-3.5 px-4">Nama Guru</th>
                        <th className="py-3.5 px-4">Hari</th>
                        <th className="py-3.5 px-4">Jam Masuk Mulai</th>
                        <th className="py-3.5 px-4">Batas Terlambat</th>
                        <th className="py-3.5 px-4">Jam Pulang Mulai</th>
                        <th className="py-3.5 px-4 text-center w-28">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedFlexSchedules.map((item, idx) => (
                        <tr key={item.id_jadwal || idx} className="hover:bg-amber-50/30 transition">
                          <td className="py-3.5 px-4 text-center font-mono text-gray-400 font-bold">
                            {flexStartIndex + idx + 1}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-extrabold text-gray-900">{item.nama_guru}</div>
                            <div className="text-[10px] text-gray-400 font-mono">ID: {item.id_guru}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-lg bg-amber-100/70 text-amber-900 font-extrabold text-[11px] border border-amber-200/60">
                              {item.hari}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-gray-700">
                            {item.jam_masuk_mulai || "-"}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-rose-600">
                            {item.jam_masuk_batas || "-"}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                            {item.jam_pulang_mulai || "-"}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                title="Edit Jadwal"
                                onClick={() => handleOpenEditFlex(item)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                title="Hapus Jadwal"
                                onClick={() => handleDeleteFlexSchedule(item.id_jadwal, item.nama_guru, item.hari)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION CONTROLS */}
                <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-gray-500 font-medium">
                    <span>Baris per halaman:</span>
                    <select
                      value={flexItemsPerPage}
                      onChange={(e) => {
                        setFlexItemsPerPage(Number(e.target.value));
                        setFlexCurrentPage(1);
                      }}
                      className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 font-bold text-gray-800 focus:outline-none focus:border-amber-500"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                    <span>
                      ({flexStartIndex + 1} - {Math.min(flexStartIndex + flexItemsPerPage, filteredFlexSchedules.length)} dari <strong>{filteredFlexSchedules.length}</strong>)
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={flexCurrentPage === 1}
                      onClick={() => setFlexCurrentPage((p) => Math.max(1, p - 1))}
                      className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {Array.from({ length: totalFlexPages }, (_, i) => i + 1).map((pageNum) => {
                      if (
                        pageNum === 1 || 
                        pageNum === totalFlexPages || 
                        (pageNum >= flexCurrentPage - 1 && pageNum <= flexCurrentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setFlexCurrentPage(pageNum)}
                            className={`w-8 h-8 rounded-xl font-bold text-xs transition cursor-pointer ${
                              flexCurrentPage === pageNum
                                ? "bg-amber-600 text-white shadow-sm"
                                : "text-gray-600 hover:bg-gray-100 border border-gray-200"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (
                        pageNum === flexCurrentPage - 2 || 
                        pageNum === flexCurrentPage + 2
                      ) {
                        return <span key={pageNum} className="px-1 text-gray-400 font-bold">...</span>;
                      }
                      return null;
                    })}

                    <button
                      type="button"
                      disabled={flexCurrentPage === totalFlexPages}
                      onClick={() => setFlexCurrentPage((p) => Math.min(totalFlexPages, p + 1))}
                      className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT LESSON SCHEDULE */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-4 sm:p-6 pt-4 sm:pt-10 overflow-y-auto z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-lg w-full overflow-hidden my-auto sm:my-0">
            <div className="p-5 bg-amber-500 text-white flex justify-between items-center">
              <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-2">
                <BookOpen className="w-4.5 h-4.5" />
                {editScheduleId ? "Edit Jadwal Pelajaran" : "Tambah Jadwal Pelajaran Baru"}
              </h3>
              <button 
                onClick={() => setShowScheduleModal(false)}
                className="text-white/80 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Hari</label>
                  <select
                    value={scheduleForm.hari}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, hari: e.target.value })}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:border-amber-500"
                  >
                    {HARI_LIST.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Kelas Target</label>
                  <select
                    value={scheduleForm.kelas}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, kelas: e.target.value })}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:border-amber-500"
                  >
                    {classList.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Mode Pengaturan Jam Pelajaran</span>
                  </label>
                  <span className="text-[10px] font-black text-amber-800 bg-white px-2 py-0.5 rounded-full border border-amber-300">
                    Cukup 1x Scan QR
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setScheduleForm({ ...scheduleForm, mode_durasi: "single" })}
                    className={`py-2 text-xs font-extrabold rounded-lg border transition-all cursor-pointer ${
                      scheduleForm.mode_durasi === "single"
                        ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    1 Jam Pelajaran (Single)
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleForm({ ...scheduleForm, mode_durasi: "multi" })}
                    className={`py-2 text-xs font-extrabold rounded-lg border transition-all cursor-pointer ${
                      scheduleForm.mode_durasi === "multi"
                        ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    Blok Multi-Jam (2 - 6 Jam)
                  </button>
                </div>
              </div>

              {scheduleForm.mode_durasi === "single" ? (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Jam Pelajaran (Slot)</label>
                  <select
                    value={scheduleForm.jam_ke}
                    onChange={(e) => handleScheduleJamKeChange(Number(e.target.value))}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:border-amber-500"
                  >
                    {jamSlots.map((slot) => (
                      <option key={slot.id_jam} value={slot.jam_ke}>
                        {slot.nama_jam} ({slot.jam_mulai} - {slot.jam_selesai}) - {slot.tipe}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Jam Ke- Awal (Mulai)</label>
                      <select
                        value={scheduleForm.jam_ke_mulai}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setScheduleForm({ ...scheduleForm, jam_ke_mulai: val, jam_ke: val });
                        }}
                        required
                        className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs text-gray-800 font-bold focus:outline-none focus:border-amber-500"
                      >
                        {jamSlots.map((slot) => (
                          <option key={slot.id_jam} value={slot.jam_ke}>
                            Jam ke-{slot.jam_ke} ({slot.jam_mulai})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Durasi Blok Jam</label>
                      <select
                        value={scheduleForm.durasi_jam}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, durasi_jam: Number(e.target.value) })}
                        required
                        className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs text-gray-800 font-bold focus:outline-none focus:border-amber-500"
                      >
                        <option value={2}>2 Jam Pelajaran Langsung (Misal: Jam 1-2)</option>
                        <option value={3}>3 Jam Pelajaran Langsung (Misal: Jam 1-3)</option>
                        <option value={4}>4 Jam Pelajaran Langsung (Misal: Jam 1-4)</option>
                        <option value={5}>5 Jam Pelajaran Langsung (Misal: Jam 1-5)</option>
                        <option value={6}>6 Jam Pelajaran Langsung (Misal: Jam 1-6)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-2.5 bg-amber-100/70 border border-amber-200 rounded-lg text-[11px] text-amber-900 font-medium">
                    ⚡ <strong>Rentang Blok:</strong> Jam ke-{scheduleForm.jam_ke_mulai} s/d Jam ke-{Number(scheduleForm.jam_ke_mulai) + Number(scheduleForm.durasi_jam) - 1} ({scheduleForm.durasi_jam} Jam Pelajaran). Guru pengampu <strong>cukup 1x scan QR Code</strong> untuk presensi seluruh blok jam ini.
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Mata Pelajaran</label>
                <input
                  type="text"
                  list="mapel-suggestions"
                  placeholder="Ketik atau pilih nama mata pelajaran"
                  value={scheduleForm.mapel}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, mapel: e.target.value })}
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-amber-500"
                />
                <datalist id="mapel-suggestions">
                  {DEFAULT_MAPEL_LIST.map((m, idx) => (
                    <option key={idx} value={m} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Guru Pengampu</label>
                <select
                  value={scheduleForm.id_guru}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, id_guru: e.target.value })}
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="" disabled>-- Pilih Guru --</option>
                  {teachers.map((t) => (
                    <option key={t.id_guru} value={t.id_guru}>
                      {t.nama_guru} ({t.nip_nuptk || "No NIP"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Ruangan / Lab</label>
                <input
                  type="text"
                  placeholder="Contoh: Lab Komputer 1, R. Class"
                  value={scheduleForm.ruangan}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, ruangan: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-sm"
                >
                  Simpan Jadwal Pelajaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TEACHER CLASS ATTENDANCE FORM */}
      {showAbsensiModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-4 sm:p-6 pt-4 sm:pt-10 overflow-y-auto z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-lg w-full overflow-hidden my-auto sm:my-0">
            <div className="p-5 bg-emerald-600 text-white flex justify-between items-center">
              <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-2">
                <CheckCircle2 className="w-4.5 h-4.5" />
                Catat Presensi Masuk Pelajaran Guru
              </h3>
              <button 
                onClick={() => setShowAbsensiModal(false)}
                className="text-white/80 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveAbsensiMengajar} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Tanggal Presensi</label>
                  <input
                    type="date"
                    value={absensiForm.tanggal}
                    onChange={(e) => setAbsensiForm({ ...absensiForm, tanggal: e.target.value })}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Waktu Masuk (Jam:Menit)</label>
                  <input
                    type="time"
                    value={absensiForm.waktu_absen}
                    onChange={(e) => setAbsensiForm({ ...absensiForm, waktu_absen: e.target.value })}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Guru Pengampu</label>
                <select
                  value={absensiForm.id_guru}
                  onChange={(e) => setAbsensiForm({ ...absensiForm, id_guru: e.target.value })}
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value="" disabled>-- Pilih Guru --</option>
                  {teachers.map((t) => (
                    <option key={t.id_guru} value={t.id_guru}>
                      {t.nama_guru}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Kelas</label>
                  <select
                    value={absensiForm.kelas}
                    onChange={(e) => setAbsensiForm({ ...absensiForm, kelas: e.target.value })}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:border-emerald-500"
                  >
                    {classList.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Jam Pelajaran Ke-</label>
                  <select
                    value={absensiForm.jam_ke}
                    onChange={(e) => {
                      const jNum = Number(e.target.value);
                      const slot = jamSlots.find(j => Number(j.jam_ke) === Number(jNum));
                      setAbsensiForm({
                        ...absensiForm,
                        jam_ke: jNum,
                        jam_mulai_jadwal: slot ? slot.jam_mulai : "07:00",
                        jam_selesai_jadwal: slot ? slot.jam_selesai : "07:45"
                      });
                    }}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:border-emerald-500"
                  >
                    {jamSlots.map((slot) => (
                      <option key={slot.id_jam} value={slot.jam_ke}>
                        Jam {slot.jam_ke} ({slot.jam_mulai} - {slot.jam_selesai})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Mata Pelajaran</label>
                <input
                  type="text"
                  list="mapel-list-2"
                  value={absensiForm.mapel}
                  onChange={(e) => setAbsensiForm({ ...absensiForm, mapel: e.target.value })}
                  required
                  placeholder="Nama mata pelajaran"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-emerald-500"
                />
                <datalist id="mapel-list-2">
                  {DEFAULT_MAPEL_LIST.map((m, idx) => (
                    <option key={idx} value={m} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Status Kehadiran Masuk Kelas</label>
                <select
                  value={absensiForm.status}
                  onChange={(e) => setAbsensiForm({ ...absensiForm, status: e.target.value as any })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 font-extrabold focus:outline-none focus:border-emerald-500"
                >
                  <option value="Hadir Tepat Waktu">Hadir Tepat Waktu</option>
                  <option value="Terlambat Masuk Kelas">Terlambat Masuk Kelas</option>
                  <option value="Izin">Izin</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Tugas Luar">Tugas Luar / Dinas</option>
                  <option value="Tidak Hadir">Tidak Hadir</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Jurnal / Catatan Pembelajaran</label>
                <textarea
                  rows={2}
                  placeholder="Materi yang diajarkan, catatan ketertiban kelas, atau rangkuman jam ke-N..."
                  value={absensiForm.catatan_materi}
                  onChange={(e) => setAbsensiForm({ ...absensiForm, catatan_materi: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAbsensiModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm"
                >
                  Simpan Presensi Mengajar
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
              <div className="absolute inset-0 rounded-full border-4 border-amber-100 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full border-t-4 border-amber-600 animate-spin"></div>
              <Loader2 className="w-6 h-6 text-amber-600 animate-spin relative z-10" />
            </div>
            <div>
              <h4 className="font-bold text-gray-800 text-sm">{loadingAction}</h4>
              <p className="text-xs text-gray-400 mt-1">Mohon tunggu sebentar, memproses data jadwal...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
