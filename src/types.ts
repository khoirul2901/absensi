/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  username: string;
  role: string;
  target_id: string;
  success?: boolean;
  message?: string;
}

export interface ConfigJam {
  jam_masuk_mulai: string;
  jam_masuk_batas: string;
  jam_pulang_mulai: string;
  error?: string;
}

export interface HariLibur {
  tanggal: string | Date;
  keterangan: string;
}

export interface Siswa {
  id_siswa: string;
  nisn: string;
  nama_siswa: string;
  jenis_kelamin: string;
  kelas: string;
  jurusan: string;
  no_hp_ortu: string;
  qr_content: string;
}

export interface Guru {
  id_guru: string;
  nip_nuptk: string;
  nama_guru: string;
  jenis_kelamin: string;
  jabatan_tugas: string;
  no_hp: string;
  qr_content: string;
  password?: string;
}

export interface LiveAbsen {
  id_target: string;
  nama_target: string;
  kelas_jurusan: string;
  jam_masuk: string;
  status_masuk: string;
  jam_pulang: string;
  status_pulang: string;
  ket?: string;
}

export interface TeacherItem {
  id_guru: string;
  nama_guru: string;
  nip_nuptk: string;
}

export interface KelasItem {
  nama_kelas: string;
  id_guru?: string;
  wali_kelas?: string;
}

export interface LaporanRow {
  id_log_siswa?: string;
  id_log_guru?: string;
  tanggal: string;
  id_siswa?: string;
  id_guru?: string;
  nama_siswa?: string;
  nama_guru?: string;
  kelas_jurusan?: string;
  jam_masuk: string;
  status_masuk: string;
  jam_pulang: string;
  status_pulang: string;
  ket?: string;
}

export interface RekapPersentase {
  id: string;
  nama: string;
  hadir: number;
  sakit: number;
  izin: number;
  alfa: number;
  persentase: string;
  jam_masuk: string;
  jam_pulang: string;
}

export interface DashboardMetrics {
  totalSiswa: number;
  siswaMasuk: number;
  siswaPulang: number;
  siswaTepat: string;
  siswaTepatInt: number;
  siswaPulangPersenInt: number;
  siswaAlfaInt: number;
  
  totalGuru: number;
  guruMasuk: number;
  guruPulang: number;
  guruTepat: string;
  guruTepatInt: number;
  guruPulangPersenInt: number;
  guruAlfaInt: number;
  
  chartLabels: string[];
  chartData: number[];
}

export interface JamPelajaranItem {
  id_jam: string;
  jam_ke: number;
  nama_jam: string;
  jam_mulai: string;
  jam_selesai: string;
  tipe: "Pelajaran" | "Istirahat" | "Upacara";
}

export interface ScheduleLessonItem {
  id_jadwal: string;
  hari: string;
  id_jam: string;
  jam_ke: number;
  jam_ke_mulai?: number;
  jam_ke_selesai?: number;
  is_block?: boolean;
  total_jam_block?: number;
  jam_mulai?: string;
  jam_selesai?: string;
  kelas: string;
  mapel: string;
  id_guru: string;
  nama_guru: string;
  ruangan?: string;
}

export interface AbsensiMengajarItem {
  id_log_mengajar: string;
  tanggal: string;
  waktu_absen: string;
  hari: string;
  id_guru: string;
  nama_guru: string;
  kelas: string;
  mapel: string;
  jam_ke: number;
  jam_mulai_jadwal: string;
  jam_selesai_jadwal: string;
  status: "Hadir Tepat Waktu" | "Terlambat Masuk Kelas" | "Izin" | "Sakit" | "Tugas Luar" | "Tidak Hadir" | string;
  catatan_materi?: string;
}

export interface AutoAlfaResult {
  tanggal: string;
  isPassedCutoff: boolean;
  isHoliday: boolean;
  cutoffTime: string;
  siswaAlfaCount: number;
  guruAlfaCount: number;
  mengajarAlfaCount: number;
  totalUpdated: number;
  message: string;
}

