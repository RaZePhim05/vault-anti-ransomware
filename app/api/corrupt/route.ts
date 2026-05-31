// app/api/corrupt/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST() {
    try {
        // 1. Baca semua folder (berdasarkan ID Dokumen) di dalam bucket node-local
        const { data: folders, error: listError } = await supabase.storage.from('node-local').list();
        
        if (listError) throw listError;

        if (folders && folders.length > 0) {
            // 2. Kumpulkan path file spesifik yang akan dihapus (mensimulasikan enkripsi/penghapusan Ransomware)
            const filesToDelete = folders.map(folder => `${folder.name}/vault.json`);
            
            // 3. Eksekusi penghapusan massal di Node Lokal
            const { error: deleteError } = await supabase.storage.from('node-local').remove(filesToDelete);
            if (deleteError) throw deleteError;
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Ransomware berhasil dieksekusi. Node Lokal hancur.' 
        }, { status: 200 });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}