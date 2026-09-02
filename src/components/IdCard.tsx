import React from 'react';
import { Siswa, Guru } from '../types';
import { GraduationCap, BookOpen, Briefcase } from 'lucide-react';
import { getStorageKey, getSchoolProfile } from '../lib/gasApi';

interface IdCardProps {
  item: Siswa | Guru;
  kategori: "Siswa" | "Guru";
  side?: "both" | "front" | "back";
}

export const IdCard: React.FC<IdCardProps> = ({ item, kategori, side = "both" }) => {
  const isSiswa = kategori === "Siswa";
  
  const name = isSiswa ? (item as Siswa).nama_siswa : (item as Guru).nama_guru;
  const id = isSiswa ? (item as Siswa).id_siswa : (item as Guru).id_guru;
  const qrContent = item.qr_content;
  
  const kelas = isSiswa ? (item as Siswa).kelas : "-";
  const identifierLabel = isSiswa ? "NISN" : "NIP/NUPTK";
  const identifierValue = isSiswa ? (item as Siswa).nisn : (item as Guru).nip_nuptk;
  const jabatanLabel = isSiswa ? "Jurusan" : "Jabatan";
  const jabatanValue = isSiswa ? (item as Siswa).jurusan : (item as Guru).jabatan_tugas;

  const prof = getSchoolProfile();
  const schoolName = localStorage.getItem(getStorageKey('cardSchoolName')) || prof.namaSekolah || 'AL-HIKAM SCHOOL';
  const schoolAddress = localStorage.getItem(getStorageKey('cardSchoolAddress')) || prof.alamatSekolah || 'SENDANG AGUNG';
  const principalName = localStorage.getItem(getStorageKey('cardPrincipalName')) || 'Fulan, S.Pd';
  const signatureUrl = localStorage.getItem(getStorageKey('cardSignatureUrl')) || '';
  const logoLeftUrl = localStorage.getItem(getStorageKey('cardLogoLeftUrl')) || '';
  const logoRightUrl = localStorage.getItem(getStorageKey('cardLogoRightUrl')) || '';

  const today = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  if (!isSiswa) {
    const frontCard = (
      <div 
        style={{ width: '85.6mm', height: '53.98mm' }} 
        className="w-[85.6mm] h-[53.98mm] bg-slate-900 rounded-xl overflow-hidden relative flex flex-col shadow-md border border-slate-700 shrink-0 select-none print-card-item"
      >
        {/* Header */}
        <div className="absolute top-0 left-0 w-full h-[55px] bg-slate-800 z-10 flex items-center px-3 border-b border-amber-500/30">
          <div className="absolute top-0 right-0 w-[40%] h-full bg-slate-700 rounded-bl-[100px] opacity-40 z-0"></div>
          
          <div className="relative z-10 w-full flex justify-between items-center">
            {logoLeftUrl ? (
              <img src={logoLeftUrl} alt="Logo" className="w-10 h-10 rounded-full object-cover border border-amber-500 bg-white p-0.5 shadow-sm" referrerPolicy="no-referrer" crossOrigin="anonymous" />
            ) : (
              <div className="w-10 h-10 rounded-full border border-amber-500 bg-slate-700 flex items-center justify-center p-1 shadow-sm">
                <Briefcase className="w-5 h-5 text-amber-500" />
              </div>
            )}
            <div className="text-center flex-grow px-2">
              <h2 className="text-amber-500 font-black text-[13px] leading-none tracking-widest uppercase">ID Card Pegawai</h2>
              <h3 className="text-white font-bold text-[10px] uppercase leading-tight tracking-wider mt-1">{schoolName}</h3>
            </div>
          </div>
        </div>

        {/* Left accent bar */}
        <div className="absolute left-0 top-[55px] bottom-0 w-[4px] bg-amber-500 z-10"></div>

        {/* Content Area */}
        <div className="absolute top-[65px] left-0 w-full px-4 flex gap-3 z-20">
          
          {/* QR Code */}
          <div className="w-[80px] shrink-0 flex flex-col items-center">
            <div className="w-[80px] h-[80px] bg-white rounded-lg p-1 shadow-inner flex items-center justify-center">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrContent)}`} 
                alt="QR Code" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
            </div>
            <span className="text-[8px] font-bold text-amber-500 mt-1.5 uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded-full border border-amber-500/30">
              Scan Absen
            </span>
          </div>

          {/* Biodata */}
          <div className="flex-grow flex flex-col justify-between h-[125px]">
            <div className="space-y-1.5">
              <div>
                <h4 className="text-[8px] text-slate-400 uppercase tracking-wider font-semibold">Nama Lengkap</h4>
                <p className="text-[11px] text-white font-bold leading-tight">{name}</p>
              </div>
              
              <div className="flex gap-2">
                <div className="flex-1">
                  <h4 className="text-[8px] text-slate-400 uppercase tracking-wider font-semibold">{jabatanLabel}</h4>
                  <p className="text-[9px] text-amber-400 font-semibold leading-tight line-clamp-2">{jabatanValue || "-"}</p>
                </div>
                <div className="flex-1">
                  <h4 className="text-[8px] text-slate-400 uppercase tracking-wider font-semibold">{identifierLabel}</h4>
                  <p className="text-[9px] text-white font-medium leading-tight">{identifierValue || "-"}</p>
                </div>
              </div>

              <div>
                <h4 className="text-[8px] text-slate-400 uppercase tracking-wider font-semibold">ID / PIN</h4>
                <p className="text-[10px] text-white font-mono">{id}</p>
              </div>
            </div>

          </div>
        </div>
        
        {/* Signature Absolute */}
        <div className="absolute bottom-2 right-3 text-center text-[7px] text-slate-300 font-medium z-30">
          <p>Probolinggo, {today}</p>
          <div className="mt-0.5 flex justify-center items-center h-[20px]">
            {signatureUrl ? (
              <img src={signatureUrl} alt="Tanda Tangan" className="h-[20px] object-contain invert brightness-0 opacity-80" referrerPolicy="no-referrer" crossOrigin="anonymous" />
            ) : null}
          </div>
          <div className="border-t border-slate-500 pt-[2px] w-[80px] mx-auto text-[7px] font-bold mt-1 text-slate-200">
            {principalName}
          </div>
        </div>
      </div>
    );

    const backCard = (
      <div 
        style={{ width: '85.6mm', height: '53.98mm' }}
        className="w-[85.6mm] h-[53.98mm] bg-slate-900 rounded-xl overflow-hidden relative flex flex-col shadow-md border border-slate-700 shrink-0 select-none print-card-item"
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
          <Briefcase className="w-40 h-40 text-white" />
        </div>
        
        <div className="absolute top-0 left-0 w-full h-[6px] bg-amber-500 z-10"></div>
        <div className="absolute bottom-0 left-0 w-full h-[6px] bg-slate-700 z-10"></div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-6 py-4">
          <h2 className="text-[14px] font-black text-amber-500 tracking-widest mb-4 uppercase border-b border-slate-700 pb-2">Ketentuan Pegawai</h2>
          
          <div className="text-[10px] text-slate-300 leading-relaxed font-medium w-full">
            <ol className="list-decimal pl-4 space-y-2">
              <li>Kartu ini adalah identitas resmi pegawai {schoolName}.</li>
              <li>Wajib dikenakan selama berada di lingkungan sekolah dan saat jam dinas.</li>
              <li>Gunakan QR Code pada bagian depan untuk melakukan absensi kehadiran.</li>
              <li>Kartu ini tidak dapat dipindahtangankan.</li>
            </ol>
          </div>
        </div>
      </div>
    );

    if (side === "front") return frontCard;
    if (side === "back") return backCard;

    return (
      <div className="flex flex-col sm:flex-row gap-4 shrink-0" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        {frontCard}
        {backCard}
      </div>
    );
  }

  // DEFAULT FRONT CARD SISWA
  const studentFrontCard = (
    <div 
      style={{ width: '85.6mm', height: '53.98mm' }}
      className="w-[85.6mm] h-[53.98mm] bg-[#e6e6e6] rounded-xl overflow-hidden relative flex flex-col shadow-md border border-gray-300 shrink-0 select-none print-card-item"
    >
      {/* Background Decorative Elements */}
      {/* Top Header Section */}
      <div className="absolute top-0 left-0 w-full h-[50px] bg-[#1e3a8a] z-10 flex items-center px-2">
        {/* Decorative swoosh on top right */}
        <div className="absolute top-0 right-0 w-[60%] h-full bg-[#3b82f6] rounded-bl-full opacity-60 z-0"></div>
        
        <div className="relative z-10 w-full flex justify-between items-center">
          {logoLeftUrl ? (
            <img src={logoLeftUrl} alt="Logo" className="w-9 h-9 rounded-full object-cover border border-[#d97706] bg-[#1e3a8a] p-0.5 shadow-sm" referrerPolicy="no-referrer" crossOrigin="anonymous" />
          ) : (
            <div className="w-9 h-9 rounded-full border border-[#d97706] bg-[#1e3a8a] flex items-center justify-center p-1 shadow-sm">
              <GraduationCap className="w-5 h-5 text-[#d97706]" />
            </div>
          )}
          <div className="text-center flex-grow">
            <h2 className="text-[#d97706] font-black text-[14px] leading-none tracking-wide">KARTU IDENTITAS</h2>
            <h3 className="text-white font-bold text-[10px] uppercase leading-tight tracking-wider mt-0.5">{schoolName}</h3>
          </div>
          {logoRightUrl ? (
            <img src={logoRightUrl} alt="Logo" className="w-9 h-9 rounded-full object-cover border border-[#d97706] bg-[#1e3a8a] p-0.5 shadow-sm" referrerPolicy="no-referrer" crossOrigin="anonymous" />
          ) : (
            <div className="w-9 h-9 rounded-full border border-[#d97706] bg-[#1e3a8a] flex items-center justify-center p-1 shadow-sm">
              <BookOpen className="w-5 h-5 text-[#3b82f6]" />
            </div>
          )}
        </div>
      </div>

      {/* Address Ribbon */}
      <div className="absolute top-[50px] left-0 w-full h-[14px] bg-[#d97706] z-10 flex items-center justify-center shadow-sm">
        <span className="text-[7px] text-white font-bold uppercase tracking-widest">{schoolAddress}</span>
      </div>

      {/* Footer Decor */}
      <div className="absolute bottom-0 left-0 w-full h-[12px] bg-[#d97706] z-10"></div>
      <div className="absolute bottom-[8px] left-0 w-full h-[18px] bg-[#3b82f6] rounded-t-[100%] z-20"></div>
      <div className="absolute bottom-0 left-0 w-full h-[12px] bg-[#1e3a8a] rounded-t-[100%] z-30"></div>

      {/* Content Area */}
      <div className="absolute top-[72px] left-0 w-full px-3 flex gap-3 z-20">
        
        {/* QR Code Box */}
        <div className="w-[85px] h-[100px] shrink-0 flex flex-col justify-center items-center mt-1 z-20">
             <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrContent)}&bgcolor=e6e6e6`} 
                alt="QR Code" 
                className="w-[70px] h-[70px] object-contain mix-blend-multiply"
               referrerPolicy="no-referrer"
               crossOrigin="anonymous"
             />
             <span className="text-[7px] font-bold text-gray-500 mt-1 uppercase text-center leading-none">QR Absensi</span>
        </div>

        {/* Biodata & Signature */}
        <div className="flex-grow flex flex-col justify-between h-[115px]">
          <table className="text-[9px] text-gray-800 font-semibold leading-[1.25]">
            <tbody>
              <tr>
                <td className="w-11 align-top">Nama</td>
                <td className="px-1 align-top">:</td>
                <td className="font-bold text-[10px] leading-tight align-top">{name}</td>
              </tr>
              <tr>
                <td className="align-top">Kelas</td>
                <td className="px-1 align-top">:</td>
                <td className="align-top">{kelas}</td>
              </tr>
              <tr>
                <td className="align-top">{jabatanLabel}</td>
                <td className="px-1 align-top">:</td>
                <td className="align-top leading-tight">{jabatanValue || "-"}</td>
              </tr>
              <tr>
                <td className="align-top">{identifierLabel}</td>
                <td className="px-1 align-top">:</td>
                <td className="align-top">{identifierValue || "-"}</td>
              </tr>
              <tr>
                <td className="align-top">ID / PIN</td>
                <td className="px-1 align-top">:</td>
                <td className="align-top">{id}</td>
              </tr>
            </tbody>
          </table>

          {/* Signature Area */}
          <div className="self-end text-center text-[7px] text-gray-800 font-medium mr-2">
            <p>Probolinggo, {today}</p>
            <p>Kepala Sekolah</p>
            <div className="mt-1 flex justify-center items-center h-[24px]">
              {signatureUrl ? (
                <img src={signatureUrl} alt="Tanda Tangan" className="h-[24px] object-contain" referrerPolicy="no-referrer" crossOrigin="anonymous" />
              ) : null}
            </div>
            <div className="border-t border-gray-800 pt-[2px] w-[80px] mx-auto text-[7px] font-bold">
              {principalName}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const studentBackCard = (
    <div 
      style={{ width: '85.6mm', height: '53.98mm' }}
      className="w-[85.6mm] h-[53.98mm] bg-[#e6e6e6] rounded-xl overflow-hidden relative flex flex-col shadow-md border border-gray-300 shrink-0 select-none print-card-item"
    >
      {/* Header Decor */}
      <div className="absolute top-0 left-0 w-full h-[12px] bg-[#d97706] z-10"></div>
      <div className="absolute top-[8px] left-0 w-full h-[18px] bg-[#3b82f6] rounded-b-[100%] z-20"></div>
      <div className="absolute top-0 left-0 w-full h-[12px] bg-[#1e3a8a] rounded-b-[100%] z-30"></div>

      {/* Footer Decor */}
      <div className="absolute bottom-0 left-0 w-full h-[12px] bg-[#d97706] z-10"></div>
      <div className="absolute bottom-[8px] left-0 w-full h-[18px] bg-[#3b82f6] rounded-t-[100%] z-20"></div>
      <div className="absolute bottom-0 left-0 w-full h-[12px] bg-[#1e3a8a] rounded-t-[100%] z-30"></div>

      {/* Watermark Icon */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.07] pointer-events-none z-0">
        <GraduationCap className="w-40 h-40 text-black" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-5 py-4 mt-1">
        <h2 className="text-[14px] font-black text-gray-800 tracking-widest mb-3 uppercase">Ketentuan</h2>
        
        <div className="text-[10px] text-gray-800 leading-relaxed font-semibold w-full">
          <ol className="list-decimal pl-4 space-y-1">
            <li>Kartu ini berlaku selama pemilik masih menjadi siswa {schoolName}.</li>
            <li>Kartu ini tidak dapat dipindahtangankan atau digunakan oleh orang lain.</li>
            <li>Apabila Anda kehilangan atau menemukan kartu ini, harap segera menghubungi pihak Tata Usaha Sekolah.</li>
          </ol>
        </div>
      </div>
    </div>
  );

  if (side === "front") return studentFrontCard;
  if (side === "back") return studentBackCard;

  return (
    <div className="flex flex-col sm:flex-row gap-4 shrink-0" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
      {studentFrontCard}
      {studentBackCard}
    </div>
  );
}
