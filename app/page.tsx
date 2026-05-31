"use client";

import React, { useState, useEffect } from 'react';
import secrets from 'secrets.js-grempe';
import { supabase } from '@/lib/supabaseClient';


interface VaultDocument {
  id: string;
  filename: string;
  uploader_name: string;
  created_at: string;
  size: number; // <--- Tambahkan baris ini
  isLocalSafe?: boolean;
  isPdnSafe?: boolean;
  isCloudSafe?: boolean;
}

// Tambahkan komponen ini di atas fungsi VaultDashboard
const FileIcon = ({ filename }: { filename: string }) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'pdf':
      return <span className="text-red-500 text-xl" title="PDF Document">📄</span>;
    case 'docx':
    case 'doc':
      return <span className="text-blue-500 text-xl" title="Word Document">📘</span>;
    case 'xlsx':
    case 'xls':
      return <span className="text-green-500 text-xl" title="Excel Spreadsheet">📗</span>;
    case 'pptx':
    case 'ppt':
      return <span className="text-orange-500 text-xl" title="PowerPoint">📙</span>;
    case 'png':
    case 'jpg':
    case 'jpeg':
      return <span className="text-purple-500 text-xl" title="Image File">🖼️</span>;
    default:
      return <span className="text-slate-500 text-xl" title="File">📁</span>;
  }
};

interface VaultDocument {
  id: string;
  filename: string;
  uploader_name: string;
  created_at: string;
  isLocalSafe?: boolean;
  isPdnSafe?: boolean;
  isCloudSafe?: boolean;
}

export default function VaultDashboard() {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string>('');
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  
  const [isLocalCorrupted, setIsLocalCorrupted] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [logs, setLogs] = useState<{ time: string; msg: string; type: string }[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vault-logs');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    localStorage.setItem('vault-logs', JSON.stringify(logs));
  }, [logs]);

  const addLog = (msg: string, type: 'INFO' | 'KRITIS' | 'BERHASIL' = 'INFO') => {
    const time = new Date().toLocaleTimeString('id-ID', { hour12: false });
    setLogs(prev => [{ time, msg, type }, ...prev].slice(0, 50));
  };


  const fetchAndVerifyDocuments = async () => {
    const { data: dbDocs } = await supabase.from('documents').select('*');
    if (!dbDocs) return { docs: [], isCorrupted: false };

    const getBucketData = async (bucket: string) => {
      const { data } = await supabase.storage.from(bucket).list();
      return data || [];
    };

    const [local, pdn, cloud] = await Promise.all([
      getBucketData('node-local'),
      getBucketData('node-pdn'),
      getBucketData('node-cloud')
    ]);

    const docsWithIntegrity = dbDocs.map(doc => {
      // CARI DATA DARI SALAH SATU NODE (misal local)
      const fileInBucket = local.find(f => f.name === doc.id);
      
      // Jika metadata.size tidak ada, fallback ke 0 agar tidak menjadi NaN
      const sizeInBytes = fileInBucket?.metadata?.size || 0;

      return {
        ...doc,
        size: sizeInBytes, // Sekarang size pasti angka (0 atau lebih)
        isLocalSafe: local.some(f => f.name === doc.id),
        isPdnSafe: pdn.some(f => f.name === doc.id),
        isCloudSafe: cloud.some(f => f.name === doc.id)
      };
    }).filter(d => d.isLocalSafe || d.isPdnSafe || d.isCloudSafe);

    const isLocalEmpty = docsWithIntegrity.length === 0 || docsWithIntegrity.every(d => !d.isLocalSafe);
    return { docs: docsWithIntegrity, isCorrupted: isLocalEmpty };
  };

  const syncDashboardState = () => {
    fetchAndVerifyDocuments().then(({ docs, isCorrupted }) => {
      setDocuments(docs as VaultDocument[]);
      setIsLocalCorrupted(isCorrupted);
    });
  };

  useEffect(() => {
    syncDashboardState();
    const scanInterval = setInterval(() => { syncDashboardState(); }, 3000); 
    return () => clearInterval(scanInterval);
  }, []);

  const bufferToBase64 = (buffer: ArrayBuffer | Uint8Array) => {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) { binary += String.fromCharCode(bytes[i]); }
    return window.btoa(binary);
  };

  const base64ToBuffer = (base64: string) => {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) { bytes[i] = binaryString.charCodeAt(i); }
    return bytes.buffer;
  };

  const hexToUint8Array = (hex: string) => {
    const bytes = new Uint8Array(Math.ceil(hex.length / 2));
    for (let i = 0; i < bytes.length; i++) { bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16); }
    return bytes;
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadStep('Membaca dokumen PDF...');
      const arrayBuffer = await file.arrayBuffer();

      await new Promise(r => setTimeout(r, 800));
      setUploadStep('Mengenkripsi dokumen dengan AES-256-GCM...');
      const masterKey = await window.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);

      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const ciphertextBuffer = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, masterKey, arrayBuffer);

      const ciphertextBase64 = JSON.stringify({
        iv: bufferToBase64(iv),
        data: bufferToBase64(ciphertextBuffer)
      });

      await new Promise(r => setTimeout(r, 800));
      setUploadStep('Memecah Master Key (Shamir\'s Secret Sharing)...');
      
      const exportedKey = await window.crypto.subtle.exportKey('raw', masterKey);
      const hexKey = Array.from(new Uint8Array(exportedKey)).map(b => b.toString(16).padStart(2, '0')).join('');
      const shares = secrets.share(hexKey, 3, 2); 

      await new Promise(r => setTimeout(r, 800));
      setUploadStep('Mendistribusikan pecahan data ke Server...');

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, uploader_name: 'Admin Instansi', ciphertext: ciphertextBase64, shares })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server menolak data');
      }

      await new Promise(r => setTimeout(r, 500));
      setUploadStep('Sukses! Data diamankan.');
      
      setTimeout(() => {
        setIsUploading(false); setUploadStep(''); setFile(null);
        syncDashboardState();
      }, 1500);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Kesalahan sistem';
      alert(`Terjadi kesalahan: ${errorMessage}`);
      setIsUploading(false);
    }
  };

  const handleDownload = async (documentId: string, originalFilename: string) => {
    try {
      setDownloadingId(documentId);
      
      const response = await fetch(`/api/download?id=${documentId}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);

      const reconstructedHexKey = secrets.combine(data.shares);
      const keyBuffer = hexToUint8Array(reconstructedHexKey);
      
      const masterKey = await window.crypto.subtle.importKey(
        'raw', keyBuffer, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']
      );

      const ciphertextObj = JSON.parse(data.ciphertext);
      const iv = base64ToBuffer(ciphertextObj.iv);
      const ciphertext = base64ToBuffer(ciphertextObj.data);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(iv) }, masterKey, ciphertext
      );

      const blob = new Blob([decryptedBuffer], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AMAN_${originalFilename}`;
      a.click();
      window.URL.revokeObjectURL(url);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Gagal merekonstruksi dokumen:\n${errorMessage}`);
    } finally {
      setDownloadingId(null);
    }
    // Di dalam handleDownload...
addLog(`Dokumen '${originalFilename}' berhasil direkonstruksi.`, 'BERHASIL');
  };

  const simulateRansomware = async () => {
    const confirmAttack = window.confirm("PERINGATAN: Ini akan menghapus seluruh isi Server Lokal Anda. Lanjutkan?");
    if (!confirmAttack) return;

    try {
      setIsLocalCorrupted(true);
      const res = await fetch('/api/corrupt', { method: 'POST' });
      if (!res.ok) throw new Error("Gagal menyerang node.");
      syncDashboardState();
    } catch (error) {
      alert("Simulasi gagal dijalankan.");
      setIsLocalCorrupted(false);
    }
    // Di dalam simulateRansomware...
addLog('Radar mendeteksi hilangnya integritas pada Node Lokal!', 'KRITIS');
  };

  // --- FUNGSI MENGHAPUS YANG SUDAH DIPERBARUI ---
  const handleDeleteDocument = async (documentId: string, targetNode: string, nodeName: string, fileName: string) => {
    // 1. Tentukan Pesan Pop-Up berdasarkan target
    let confirmMessage = "";
    if (targetNode === 'all') {
      confirmMessage = "🚨 PERINGATAN KRITIS 🚨\nApakah Anda yakin ingin memusnahkan dokumen ini secara PERMANEN dari seluruh Jaringan Node dan Database?";
    } else {
      confirmMessage = `Apakah Anda yakin ingin menghapus pecahan file HANYA dari [${nodeName}]?`;
    }

    // 2. Tampilkan Pop-Up Konfirmasi
    const confirmDelete = window.confirm(confirmMessage);
    if (!confirmDelete) {
      setOpenMenuId(null);
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Kirim targetNode ke backend
        body: JSON.stringify({ id: documentId, targetNode }), 
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }
      const statusMsg = targetNode === 'all' ? "Penghapusan Total" : `Penghapusan dari ${nodeName}`;
    addLog(`${statusMsg} untuk dokumen '${fileName}'`, 'BERHASIL'); // <--- Gunakan fileName
    
    syncDashboardState();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Gagal menghapus: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
      setOpenMenuId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-12">
        
        <header className="flex justify-between items-start">
  <div>
    <h1 className="text-3xl font-bold text-white tracking-tight">
      Sistem Arsip Anti-Ransomware <span className="text-emerald-500">Vault</span>
    </h1>
    <p className="text-slate-400 mt-2">Zero-Trust Cryptographic Data Dispersal</p>
  </div>

  {/* PANEL DEMO PENGUJI (Visual Grouping) */}
  <div className="bg-red-950/20 p-4 rounded-lg border border-red-900/50 text-center shadow-lg">
    <h3 className="text-[10px] text-red-400 uppercase font-bold tracking-widest mb-2">Panel Demonstrasi Penguji</h3>
    <button 
      onClick={simulateRansomware}
      disabled={isLocalCorrupted}
      className={`px-4 py-2 rounded text-sm font-bold transition-all ${
        isLocalCorrupted ? 'bg-red-900 text-red-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
      }`}
    >
      ☢️ Simulasikan Ransomware
    </button>
  </div>
</header>

        <section className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold mb-6">Amankan Dokumen Baru</h2>
          <form onSubmit={handleUpload} className="space-y-6">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-slate-700 border-dashed rounded-lg cursor-pointer hover:bg-slate-800/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <p className="mb-2 text-sm text-slate-400"><span className="font-semibold text-emerald-400">Klik</span> atau seret file PDF</p>
                  <p className="text-xs text-slate-500">{file ? file.name : "Maksimal 10MB"}</p>
                </div>
                <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} accept=".pdf,.doc,.docx" />
              </label>
            </div>

            {isUploading && (
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex items-center space-x-4">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-mono text-emerald-400 animate-pulse">{uploadStep}</p>
              </div>
            )}

            <button type="submit" disabled={!file || isUploading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50">
              {isUploading ? 'Memproses Enkripsi Klien...' : 'Unggah & Pecah Data'}
            </button>
          </form>
        </section>

        <section>
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl font-semibold">Dashboard Jaringan Node</h2>
             <span className="text-xs font-mono text-emerald-500 flex items-center">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping mr-2"></span>
                Scanner Aktif (Real-time)
             </span>
          </div>
{/* 1. SEARCH BAR DILETAKKAN DI SINI (Di atas tabel) */}
  <div className="flex justify-between items-center mb-6">
    <div className="relative w-72">
      <input
        type="text"
        placeholder="Cari dokumen..."
        className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <span className="absolute right-3 top-2 text-slate-500">🔍</span>
    </div>
  </div>
          <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-xl">
    <table className="w-full text-sm text-left text-slate-300">
      <thead className="bg-slate-800 uppercase text-xs text-slate-400">
        <tr>
          <th className="px-6 py-4">Nama Dokumen</th>
          <th className="px-6 py-4">Ukuran</th>
          <th className="px-6 py-4">Diunggah</th>
          <th className="px-6 py-4">Status Node</th>
          <th className="px-6 py-4 text-right">Aksi</th>
        </tr>
      </thead>
              <tbody>
                
                {documents.filter((doc) => doc.filename.toLowerCase().includes(searchTerm.toLowerCase())).map((doc) => (
                  
                  <tr key={doc.id} className="bg-slate-900 border-b border-slate-800 hover:bg-slate-800/50">
                    
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                    {/* Perhatikan prop-nya: 'filename' bukan 'name' */}
                    <FileIcon filename={doc.filename} />
                    <span>{doc.filename}</span>
                      </td>
                    {/* --- TAMBAHKAN DUA TD INI DISINI --- */}
                <td className="px-6 py-4 text-slate-500 text-sm">
                {(doc.size / 1024).toFixed(1)} KB
                </td>
                <td className="px-6 py-4 text-slate-500 text-sm">
        {new Date(doc.created_at).toLocaleDateString()}
      </td>
      {/* ------------------------------------- */}
                    <td className="px-6 py-4">
                      <div className="flex space-x-3">
                        <div className="flex items-center space-x-1" title="Node Lokal">
                          <span className={`w-2.5 h-2.5 rounded-full ${doc.isLocalSafe ? 'bg-emerald-500 animate-pulse' : 'bg-red-600 shadow-[0_0_8px_#dc2626]'}`}></span>
                          <span className={`text-xs ${doc.isLocalSafe ? 'text-slate-500' : 'text-red-500 font-bold'}`}>Lokal</span>
                        </div>
                        <div className="flex items-center space-x-1" title="Node PDN">
                          <span className={`w-2.5 h-2.5 rounded-full ${doc.isPdnSafe ? 'bg-emerald-500 animate-pulse' : 'bg-red-600 shadow-[0_0_8px_#dc2626]'}`}></span>
                          <span className={`text-xs ${doc.isPdnSafe ? 'text-slate-500' : 'text-red-500 font-bold'}`}>PDN</span>
                        </div>
                        <div className="flex items-center space-x-1" title="Node Cloud">
                          <span className={`w-2.5 h-2.5 rounded-full ${doc.isCloudSafe ? 'bg-emerald-500 animate-pulse' : 'bg-red-600 shadow-[0_0_8px_#dc2626]'}`}></span>
                          <span className={`text-xs ${doc.isCloudSafe ? 'text-slate-500' : 'text-red-500 font-bold'}`}>Cloud</span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 flex justify-end items-center space-x-4">
                      <button 
                        onClick={() => handleDownload(doc.id, doc.filename)}
                        disabled={downloadingId === doc.id}
                        className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors disabled:text-slate-600"
                      >
                        {downloadingId === doc.id ? 'Merekonstruksi...' : 'Unduh (Reconstruct)'}
                      </button>

                      <div className="relative">
                        <button 
                          onClick={() => setOpenMenuId(openMenuId === doc.id ? null : doc.id)}
                          className="p-1 hover:bg-slate-700 rounded-md transition-colors text-slate-400 hover:text-white"
                          title="Menu Opsi"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                          </svg>
                        </button>

                        {/* MENU DROPDOWN BARU DENGAN OPSI PARSIAL & TOTAL */}
                        {openMenuId === doc.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-slate-800 rounded-md shadow-2xl z-50 border border-slate-700 overflow-hidden text-left">
                            
                            {/* Opsi Hapus Parsial (Ditampilkan abu-abu jika file di node tersebut sudah tidak ada) */}
                            <button
                              onClick={() => handleDeleteDocument(doc.id, 'node-local', 'Node Lokal', doc.filename)}
                              disabled={isDeleting || !doc.isLocalSafe}
                              className="w-full text-left px-4 py-2 text-sm text-yellow-500 hover:bg-slate-700 hover:text-yellow-400 transition-colors flex items-center disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span> Hapus Lokal
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(doc.id, 'node-pdn', 'Node PDN', doc.filename)}
                              disabled={isDeleting || !doc.isPdnSafe}
                              className="w-full text-left px-4 py-2 text-sm text-yellow-500 hover:bg-slate-700 hover:text-yellow-400 transition-colors flex items-center disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span> Hapus PDN
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(doc.id, 'node-cloud', 'Node Cloud', doc.filename)}
                              disabled={isDeleting || !doc.isCloudSafe}
                              className="w-full text-left px-4 py-2 text-sm text-yellow-500 hover:bg-slate-700 hover:text-yellow-400 transition-colors flex items-center disabled:opacity-40 disabled:cursor-not-allowed border-b border-slate-700 pb-3"
                            >
                              <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span> Hapus Cloud
                            </button>

                            {/* Opsi Hapus Total Database */}
                            <button
                              onClick={() => handleDeleteDocument(doc.id, 'all', 'Semua', doc.filename)}
                              disabled={isDeleting}
                              className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-slate-700 hover:text-red-300 font-semibold transition-colors flex items-center disabled:opacity-50 pt-3"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              Hapus Total
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}
                
              </tbody>
            </table>
          </div>
        </section>
<section className="mt-12">
  <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-inner">
    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
      Log Keamanan Sistem (Audit Trail)
    </h3>
    <div className="space-y-2 font-mono text-xs">
      {logs.length === 0 ? (
        <p className="text-slate-600 italic">Menunggu aktivitas sistem...</p>
      ) : (
        logs.map((log, i) => (
          <div key={i} className="flex gap-4 border-l-2 border-slate-800 pl-3 py-1">
            <span className="text-slate-500">[{log.time}]</span>
            <span className={`${
              log.type === 'KRITIS' ? 'text-red-500' : 
              log.type === 'BERHASIL' ? 'text-emerald-400' : 'text-slate-300'
            }`}>
              <span className="font-bold uppercase">{log.type}:</span> {log.msg}
            </span>
          </div>
        ))
      )}
    </div>
  </div>
</section>
      </div>
    </div>
  );
}