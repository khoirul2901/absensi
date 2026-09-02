/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  CreditCard, 
  Palette, 
  Layout, 
  Type, 
  Save, 
  RotateCcw, 
  Printer, 
  Eye, 
  Sliders, 
  Building2, 
  QrCode, 
  User, 
  CheckCircle2
} from "lucide-react";
import { getStorage, setStorage, callGas, extractArrayData } from "../lib/gasApi";

export interface CardDesignConfig {
  orientation: "landscape" | "portrait";
  targetType: "Siswa" | "Guru";
  widthMm: number;
  heightMm: number;
  
  headerTitle: string;
  headerSubTitle: string;
  headerBgColor: string;
  headerTextColor: string;
  showLogo: boolean;
  logoUrl: string;
  logoPosition: "left" | "center" | "right";
  
  cardBgType: "solid" | "gradient";
  cardBgColor1: string;
  cardBgColor2: string;
  cardBorderColor: string;
  cardBorderRadius: number;
  
  titleTextColor: string;
  bodyTextColor: string;
  labelTextColor: string;
  fontSizeName: number;
  fontSizeDetail: number;
  
  showPhoto: boolean;
  photoBorderColor: string;
  photoShape: "rounded" | "circle" | "square";
  
  showQrBarcode: boolean;
  qrType: "QR" | "BARCODE";
  qrPosition: "bottom-right" | "bottom-left" | "top-right";
  
  showFooter: boolean;
  footerText: string;
  footerBgColor: string;
  footerTextColor: string;
  
  showSignature: boolean;
  signatureTitle: string;
  signatureName: string;
  signatureNip: string;
  
  paddingPx: number;
  layoutAlign: "left" | "center";
}

export const DEFAULT_SISWA_CARD_CONFIG: CardDesignConfig = {
  orientation: "landscape",
  targetType: "Siswa",
  widthMm: 85.6,
  heightMm: 54,
  
  headerTitle: "SMK AL-HIKAM BANGKALAN",
  headerSubTitle: "KARTU TANDA ANGGOTA SISWA",
  headerBgColor: "#0f172a",
  headerTextColor: "#ffffff",
  showLogo: true,
  logoUrl: "",
  logoPosition: "left",
  
  cardBgType: "gradient",
  cardBgColor1: "#ffffff",
  cardBgColor2: "#f8fafc",
  cardBorderColor: "#cbd5e1",
  cardBorderRadius: 12,
  
  titleTextColor: "#0f172a",
  bodyTextColor: "#1e293b",
  labelTextColor: "#64748b",
  fontSizeName: 14,
  fontSizeDetail: 11,
  
  showPhoto: true,
  photoBorderColor: "#e2e8f0",
  photoShape: "rounded",
  
  showQrBarcode: true,
  qrType: "QR",
  qrPosition: "bottom-right",
  
  showFooter: true,
  footerText: "Kartu ini wajib dibawa selama kegiatan sekolah",
  footerBgColor: "#0284c7",
  footerTextColor: "#ffffff",
  
  showSignature: true,
  signatureTitle: "Kepala Sekolah,",
  signatureName: "Drs. H. Syamsul Arifin",
  signatureNip: "NIP. 197505122005011002",
  
  paddingPx: 12,
  layoutAlign: "left"
};

export const DEFAULT_GURU_CARD_CONFIG: CardDesignConfig = {
  ...DEFAULT_SISWA_CARD_CONFIG,
  targetType: "Guru",
  headerSubTitle: "KARTU IDENTITAS GURU & TENDIK",
  headerBgColor: "#1e1b4b",
  footerBgColor: "#4f46e5",
  cardBgColor1: "#ffffff",
  cardBgColor2: "#f5f3ff"
};

export default function DesainKartu() {
  const [activeTab, setActiveTab] = useState<"Siswa" | "Guru">("Siswa");
  const [config, setConfig] = useState<CardDesignConfig>(DEFAULT_SISWA_CARD_CONFIG);
  const [activeSection, setActiveSection] = useState<"layout" | "header" | "colors" | "typography" | "signature">("layout");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [sampleList, setSampleList] = useState<any[]>([]);
  const [selectedSampleIndex, setSelectedSampleIndex] = useState(0);

  useEffect(() => {
    const savedKey = activeTab === "Siswa" ? "config_kartu_siswa" : "config_kartu_guru";
    const saved = getStorage(savedKey);
    if (saved) {
      setConfig({ ... (activeTab === "Siswa" ? DEFAULT_SISWA_CARD_CONFIG : DEFAULT_GURU_CARD_CONFIG), ...saved });
    } else {
      setConfig(activeTab === "Siswa" ? DEFAULT_SISWA_CARD_CONFIG : DEFAULT_GURU_CARD_CONFIG);
    }
  }, [activeTab]);

  useEffect(() => {
    const loadSample = async () => {
      try {
        const res = await callGas("getDataMaster", [activeTab]);
        const data = extractArrayData(res);
        if (data && data.length > 0) {
          setSampleList(data);
        } else {
          setSampleList(activeTab === "Siswa" ? [
            {
              id_siswa: "S-1001",
              nisn: "0051234567",
              nama_siswa: "MUHAMMAD RIZKY PRATAMA",
              kelas: "XI RPL 1",
              jenis_kelamin: "Laki-laki"
            },
            {
              id_siswa: "S-1002",
              nisn: "0057654321",
              nama_siswa: "SITI NUR HALIZA",
              kelas: "X TKJ 2",
              jenis_kelamin: "Perempuan"
            }
          ] : [
            {
              id_guru: "G-001",
              nip_nuptk: "198203152010011005",
              nama_guru: "AHMAD FAUZI, S.Kom.",
              jabatan_tugas: "Guru Pemrograman Web",
              jenis_kelamin: "Laki-laki"
            }
          ]);
        }
      } catch (e) {
        setSampleList([]);
      }
    };
    loadSample();
  }, [activeTab]);

  const handleSaveConfig = () => {
    const savedKey = activeTab === "Siswa" ? "config_kartu_siswa" : "config_kartu_guru";
    setStorage(savedKey, config);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleResetConfig = () => {
    if (confirm("Reset desain ke tampilan standar default?")) {
      const defaultConfig = activeTab === "Siswa" ? DEFAULT_SISWA_CARD_CONFIG : DEFAULT_GURU_CARD_CONFIG;
      setConfig(defaultConfig);
      const savedKey = activeTab === "Siswa" ? "config_kartu_siswa" : "config_kartu_guru";
      setStorage(savedKey, defaultConfig);
    }
  };

  const currentSample = sampleList[selectedSampleIndex] || (activeTab === "Siswa" ? {
    id_siswa: "S-1001",
    nisn: "0051234567",
    nama_siswa: "NAMA SISWA CONTOH",
    kelas: "XI RPL 1",
    jenis_kelamin: "Laki-laki"
  } : {
    id_guru: "G-001",
    nip_nuptk: "198203152010011005",
    nama_guru: "NAMA GURU CONTOH, M.Pd",
    jabatan_tugas: "Guru Mata Pelajaran",
    jenis_kelamin: "Laki-laki"
  });

  const sampleName = currentSample.nama_siswa || currentSample.nama_guru || "NAMA LENGKAP";
  const sampleId = currentSample.id_siswa || currentSample.id_guru || "ID-12345";
  const sampleSub = currentSample.nisn || currentSample.nip_nuptk || "123456789";
  const sampleClass = currentSample.kelas || currentSample.jabatan_tugas || "Kelas / Jabatan";

  const handlePrintPreview = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const isLandscape = config.orientation === "landscape";
    const widthCss = isLandscape ? "85.6mm" : "54mm";
    const heightCss = isLandscape ? "54mm" : "85.6mm";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cetak Preview Kartu ${activeTab}</title>
          <style>
            @page { size: ${widthCss} ${heightCss}; margin: 0; }
            body { margin: 0; padding: 0; font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #e2e8f0; }
            .card-wrapper { width: ${widthCss}; height: ${heightCss}; box-sizing: border-box; overflow: hidden; background: white; border: 1px solid ${config.cardBorderColor}; border-radius: ${config.cardBorderRadius}px; position: relative; }
            @media print {
              body { background: transparent; }
              .card-wrapper { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="card-wrapper">
            ${document.getElementById("card-preview-container")?.innerHTML || ""}
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl shadow-md shadow-indigo-500/20">
            <CreditCard className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              Desain & Custom Kartu ID
              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                Visual Studio
              </span>
            </h1>
            <p className="text-xs text-gray-500">
              Atur tata letak, warna, ukuran tulisan, dan elemen cetak kartu Siswa & Guru secara fleksibel
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={handleResetConfig}
            className="px-3.5 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Default
          </button>

          <button
            onClick={handlePrintPreview}
            className="px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Preview
          </button>

          <button
            onClick={handleSaveConfig}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
          >
            {saveSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            <span>{saveSuccess ? "Tersimpan!" : "Simpan Desain"}</span>
          </button>
        </div>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 max-w-md mx-auto sm:mx-0">
        <button
          onClick={() => setActiveTab("Siswa")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "Siswa" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <User className="w-4 h-4" />
          Desain Kartu Siswa
        </button>

        <button
          onClick={() => setActiveTab("Guru")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "Guru" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Desain Kartu Guru
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-white">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold">Pratinjau Hasil Kartu ({activeTab})</span>
              </div>

              {sampleList.length > 0 && (
                <select
                  value={selectedSampleIndex}
                  onChange={(e) => setSelectedSampleIndex(Number(e.target.value))}
                  className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-2 py-1 focus:outline-none"
                >
                  {sampleList.map((s, idx) => (
                    <option key={idx} value={idx}>
                      Contoh #{idx + 1}: {s.nama_siswa || s.nama_guru}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center justify-center py-8 bg-slate-950/60 rounded-2xl border border-slate-800/80 min-h-[320px] overflow-x-auto">
              <div
                id="card-preview-container"
                style={{
                  width: config.orientation === "landscape" ? "330px" : "210px",
                  height: config.orientation === "landscape" ? "210px" : "330px",
                  borderRadius: `${config.cardBorderRadius}px`,
                  borderColor: config.cardBorderColor,
                  background: config.cardBgType === "gradient" 
                    ? `linear-gradient(135deg, ${config.cardBgColor1}, ${config.cardBgColor2})` 
                    : config.cardBgColor1,
                }}
                className="relative overflow-hidden border shadow-2xl transition-all duration-200 flex flex-col justify-between shrink-0 select-none"
              >
                <div
                  style={{
                    backgroundColor: config.headerBgColor,
                    color: config.headerTextColor,
                    padding: `${config.paddingPx / 1.5}px`
                  }}
                  className="flex items-center justify-between border-b border-white/10 shrink-0"
                >
                  {config.showLogo && (
                    <div className="w-7 h-7 rounded-full bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
                      {config.logoUrl ? (
                        <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain rounded-full" />
                      ) : (
                        <Building2 className="w-4 h-4 text-white" />
                      )}
                    </div>
                  )}

                  <div className={`flex-1 px-2 ${config.logoPosition === "center" ? "text-center" : "text-left"}`}>
                    <h3 className="text-[10px] font-black uppercase tracking-wider leading-none">
                      {config.headerTitle}
                    </h3>
                    <p className="text-[8px] font-semibold opacity-80 mt-0.5 tracking-tight">
                      {config.headerSubTitle}
                    </p>
                  </div>
                </div>

                <div 
                  style={{ padding: `${config.paddingPx}px` }}
                  className="flex-1 flex items-center gap-3 relative z-10"
                >
                  {config.showPhoto && (
                    <div className="shrink-0 flex flex-col items-center">
                      <div 
                        style={{ borderColor: config.photoBorderColor }}
                        className={`w-16 h-20 bg-slate-200 border-2 overflow-hidden flex items-center justify-center shadow-sm ${
                          config.photoShape === "circle" ? "rounded-full w-16 h-16" : config.photoShape === "square" ? "rounded-none" : "rounded-xl"
                        }`}
                      >
                        <User className="w-10 h-10 text-slate-400" />
                      </div>
                    </div>
                  )}

                  <div className={`flex-1 space-y-1 ${config.layoutAlign === "center" ? "text-center" : "text-left"}`}>
                    <div>
                      <span 
                        style={{ color: config.labelTextColor }} 
                        className="text-[8px] font-bold uppercase tracking-wider block"
                      >
                        {activeTab === "Siswa" ? "NAMA SISWA" : "NAMA GURU"}
                      </span>
                      <h4 
                        style={{ color: config.titleTextColor, fontSize: `${config.fontSizeName}px` }}
                        className="font-black tracking-tight leading-tight uppercase line-clamp-2"
                      >
                        {sampleName}
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-1 pt-0.5">
                      <div>
                        <span style={{ color: config.labelTextColor }} className="text-[7px] font-semibold block">
                          {activeTab === "Siswa" ? "NISN / ID" : "NIP / ID"}
                        </span>
                        <span style={{ color: config.bodyTextColor, fontSize: `${config.fontSizeDetail}px` }} className="font-bold font-mono block">
                          {sampleSub}
                        </span>
                      </div>

                      <div>
                        <span style={{ color: config.labelTextColor }} className="text-[7px] font-semibold block">
                          {activeTab === "Siswa" ? "KELAS" : "JABATAN"}
                        </span>
                        <span style={{ color: config.bodyTextColor, fontSize: `${config.fontSizeDetail}px` }} className="font-bold block">
                          {sampleClass}
                        </span>
                      </div>
                    </div>
                  </div>

                  {config.showQrBarcode && (
                    <div className="absolute bottom-2 right-2 p-1 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col items-center">
                      <QrCode className="w-8 h-8 text-gray-900" />
                      <span className="text-[6px] font-mono font-bold text-gray-600 mt-0.5">{sampleId}</span>
                    </div>
                  )}
                </div>

                {config.showSignature && (
                  <div className="px-3 pb-1 flex justify-end text-[7px] leading-none text-right">
                    <div className="space-y-0.5">
                      <span style={{ color: config.labelTextColor }} className="block font-medium">{config.signatureTitle}</span>
                      <div className="h-3 italic text-gray-400 text-[6px] flex items-center justify-end font-serif">
                        [ Tanda Tangan ]
                      </div>
                      <span style={{ color: config.titleTextColor }} className="block font-bold uppercase">{config.signatureName}</span>
                    </div>
                  </div>
                )}

                {config.showFooter && (
                  <div
                    style={{
                      backgroundColor: config.footerBgColor,
                      color: config.footerTextColor
                    }}
                    className="py-1 px-2 text-center text-[7px] font-bold tracking-tight uppercase border-t border-white/10 shrink-0"
                  >
                    {config.footerText}
                  </div>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center italic">
              Ukuran cetak standar ID Card (CR80): 85.6mm x 54mm (300 DPI)
            </p>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex border-b border-gray-100 gap-2 overflow-x-auto pb-2">
            {[
              { id: "layout", label: "Orientasi & Layout", icon: Layout },
              { id: "header", label: "Header & Logo", icon: Building2 },
              { id: "colors", label: "Warna & Background", icon: Palette },
              { id: "typography", label: "Teks & Ukuran", icon: Type },
              { id: "signature", label: "Stempel & Footer", icon: Sliders }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeSection === tab.id 
                      ? "bg-indigo-600 text-white shadow-sm" 
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeSection === "layout" && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                <Layout className="w-4 h-4 text-indigo-500" />
                Pengaturan Orientasi & Posisi Kartu
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setConfig({ ...config, orientation: "landscape" })}
                  className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer ${
                    config.orientation === "landscape" 
                      ? "border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold" 
                      : "border-gray-200 hover:border-gray-300 text-gray-600"
                  }`}
                >
                  <div className="w-12 h-8 bg-indigo-200 border border-indigo-400 rounded-md mb-2"></div>
                  <div className="text-xs font-extrabold">Lanskap (Mendatar)</div>
                  <div className="text-[10px] text-gray-500">85.6mm x 54mm (Standar ID)</div>
                </button>

                <button
                  onClick={() => setConfig({ ...config, orientation: "portrait" })}
                  className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer ${
                    config.orientation === "portrait" 
                      ? "border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold" 
                      : "border-gray-200 hover:border-gray-300 text-gray-600"
                  }`}
                >
                  <div className="w-8 h-12 bg-indigo-200 border border-indigo-400 rounded-md mb-2"></div>
                  <div className="text-xs font-extrabold">Potret (Tegak)</div>
                  <div className="text-[10px] text-gray-500">54mm x 85.6mm</div>
                </button>
              </div>

              <div className="space-y-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-xs font-bold text-gray-800">Tampilkan Foto Diri</span>
                  <input
                    type="checkbox"
                    checked={config.showPhoto}
                    onChange={(e) => setConfig({ ...config, showPhoto: e.target.checked })}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>

                {config.showPhoto && (
                  <div className="grid grid-cols-2 gap-3 pl-4">
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Bentuk Foto:</label>
                      <select
                        value={config.photoShape}
                        onChange={(e) => setConfig({ ...config, photoShape: e.target.value as any })}
                        className="w-full bg-white border border-gray-200 text-xs font-bold rounded-xl p-2"
                      >
                        <option value="rounded">Sudut Melengkung</option>
                        <option value="circle">Lingkaran (Circle)</option>
                        <option value="square">Persegi (Square)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Warna Bingkai Foto:</label>
                      <input
                        type="color"
                        value={config.photoBorderColor}
                        onChange={(e) => setConfig({ ...config, photoBorderColor: e.target.value })}
                        className="w-full h-8 rounded-xl cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-xs font-bold text-gray-800">Tampilkan Kode QR / Barcode Scan</span>
                  <input
                    type="checkbox"
                    checked={config.showQrBarcode}
                    onChange={(e) => setConfig({ ...config, showQrBarcode: e.target.checked })}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === "header" && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-500" />
                Pengaturan Header & Identitas Lembaga
              </h3>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Nama Lembaga / Sekolah (Judul Utama):</label>
                <input
                  type="text"
                  value={config.headerTitle}
                  onChange={(e) => setConfig({ ...config, headerTitle: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Sub Judul Kartu (e.g. KARTU ANGGOTA SISWA):</label>
                <input
                  type="text"
                  value={config.headerSubTitle}
                  onChange={(e) => setConfig({ ...config, headerSubTitle: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Warna Background Header:</label>
                  <input
                    type="color"
                    value={config.headerBgColor}
                    onChange={(e) => setConfig({ ...config, headerBgColor: e.target.value })}
                    className="w-full h-9 rounded-xl cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Warna Tulisan Header:</label>
                  <input
                    type="color"
                    value={config.headerTextColor}
                    onChange={(e) => setConfig({ ...config, headerTextColor: e.target.value })}
                    className="w-full h-9 rounded-xl cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">URL / Link Gambar Logo (Opsional):</label>
                <input
                  type="text"
                  placeholder="https://.../logo.png"
                  value={config.logoUrl}
                  onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-mono text-gray-800"
                />
              </div>
            </div>
          )}

          {activeSection === "colors" && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-500" />
                Pengaturan Warna Kartu & Gradasi
              </h3>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Tipe Background Kartu:</label>
                <select
                  value={config.cardBgType}
                  onChange={(e) => setConfig({ ...config, cardBgType: e.target.value as any })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold"
                >
                  <option value="solid">Warna Solid Sederhana</option>
                  <option value="gradient">Warna Gradasi Modern</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Warna Kartu Utama (Sisi Kiri):</label>
                  <input
                    type="color"
                    value={config.cardBgColor1}
                    onChange={(e) => setConfig({ ...config, cardBgColor1: e.target.value })}
                    className="w-full h-9 rounded-xl cursor-pointer"
                  />
                </div>

                {config.cardBgType === "gradient" && (
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Warna Gradasi (Sisi Kanan):</label>
                    <input
                      type="color"
                      value={config.cardBgColor2}
                      onChange={(e) => setConfig({ ...config, cardBgColor2: e.target.value })}
                      className="w-full h-9 rounded-xl cursor-pointer"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Warna Garis Pinggir (Border):</label>
                  <input
                    type="color"
                    value={config.cardBorderColor}
                    onChange={(e) => setConfig({ ...config, cardBorderColor: e.target.value })}
                    className="w-full h-9 rounded-xl cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Kelengkungan Sudut (Radius):</label>
                  <input
                    type="range"
                    min="0"
                    max="24"
                    value={config.cardBorderRadius}
                    onChange={(e) => setConfig({ ...config, cardBorderRadius: Number(e.target.value) })}
                    className="w-full accent-indigo-600 mt-2"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === "typography" && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                <Type className="w-4 h-4 text-indigo-500" />
                Ukuran & Warna Tulisan Identitas
              </h3>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Warna Nama:</label>
                  <input
                    type="color"
                    value={config.titleTextColor}
                    onChange={(e) => setConfig({ ...config, titleTextColor: e.target.value })}
                    className="w-full h-9 rounded-xl cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Warna Isi Data:</label>
                  <input
                    type="color"
                    value={config.bodyTextColor}
                    onChange={(e) => setConfig({ ...config, bodyTextColor: e.target.value })}
                    className="w-full h-9 rounded-xl cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Warna Label Data:</label>
                  <input
                    type="color"
                    value={config.labelTextColor}
                    onChange={(e) => setConfig({ ...config, labelTextColor: e.target.value })}
                    className="w-full h-9 rounded-xl cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                  <span>Ukuran Tulisan Nama Lengkap:</span>
                  <span className="text-indigo-600">{config.fontSizeName}px</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="20"
                  value={config.fontSizeName}
                  onChange={(e) => setConfig({ ...config, fontSizeName: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                  <span>Ukuran Tulisan Detail (NISN/Kelas):</span>
                  <span className="text-indigo-600">{config.fontSizeDetail}px</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="14"
                  value={config.fontSizeDetail}
                  onChange={(e) => setConfig({ ...config, fontSizeDetail: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>
          )}

          {activeSection === "signature" && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-500" />
                Pengaturan Tanda Tangan, Stempel & Footer
              </h3>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-xs font-bold text-gray-800">Tampilkan Tanda Tangan Kepala Sekolah</span>
                <input
                  type="checkbox"
                  checked={config.showSignature}
                  onChange={(e) => setConfig({ ...config, showSignature: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              </div>

              {config.showSignature && (
                <div className="space-y-3 pl-2">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Jabatan Penandatangan:</label>
                    <input
                      type="text"
                      value={config.signatureTitle}
                      onChange={(e) => setConfig({ ...config, signatureTitle: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Nama Pejabat:</label>
                    <input
                      type="text"
                      value={config.signatureName}
                      onChange={(e) => setConfig({ ...config, signatureName: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs font-bold"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-xs font-bold text-gray-800">Tampilkan Banner Footer</span>
                <input
                  type="checkbox"
                  checked={config.showFooter}
                  onChange={(e) => setConfig({ ...config, showFooter: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              </div>

              {config.showFooter && (
                <div className="space-y-3 pl-2">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Teks Catatan Footer:</label>
                    <input
                      type="text"
                      value={config.footerText}
                      onChange={(e) => setConfig({ ...config, footerText: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Warna Bg Footer:</label>
                      <input
                        type="color"
                        value={config.footerBgColor}
                        onChange={(e) => setConfig({ ...config, footerBgColor: e.target.value })}
                        className="w-full h-8 rounded-xl cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Warna Teks Footer:</label>
                      <input
                        type="color"
                        value={config.footerTextColor}
                        onChange={(e) => setConfig({ ...config, footerTextColor: e.target.value })}
                        className="w-full h-8 rounded-xl cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
