import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; // Sesuaikan path dengan lokasi file supabaseClient Anda

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { filename, uploader_name, ciphertext, shares } = body;

        // Validasi input dasar
        if (!ciphertext || !shares || shares.length !== 3) {
            return NextResponse.json({ error: 'Data tidak lengkap atau jumlah share tidak sesuai.' }, { status: 400 });
        }

        // 1. Simpan Metadata ke Database
        const { data: docData, error: dbError } = await supabase
            .from('documents')
            .insert([{ filename, uploader_name }])
            .select()
            .single();

        if (dbError) throw new Error(`Database Error: ${dbError.message}`);
        const documentId = docData.id;

        // 2. Distribusi ke 3 Node (Storage Buckets)
        const nodes = ['node-local', 'node-pdn', 'node-cloud'];
        
        // Kita bungkus ciphertext dan 1 share spesifik ke dalam satu file JSON untuk tiap node
        const uploadPromises = nodes.map((node, index) => {
            const payload = JSON.stringify({
                ciphertext: ciphertext,
                share: shares[index]
            });
            
            return supabase.storage
                .from(node)
                .upload(`${documentId}/vault.json`, payload, {
                    contentType: 'application/json',
                    upsert: false
                });
        });

        // Eksekusi upload ke 3 node secara paralel (bersamaan) untuk performa
        const uploadResults = await Promise.all(uploadPromises);

        // Cek jika ada node yang gagal upload
        const failedUploads = uploadResults.filter(res => res.error);
        if (failedUploads.length > 0) {
             throw new Error('Gagal mendistribusikan data ke salah satu atau lebih Node.');
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Dokumen berhasil diamankan dan didistribusikan',
            documentId: documentId 
        }, { status: 201 });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Gagal memproses data';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}