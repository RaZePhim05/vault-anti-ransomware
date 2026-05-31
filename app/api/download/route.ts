import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// 1. Definisikan antarmuka tipe data secara eksplisit
interface VaultPayload {
    ciphertext: string; // Atau format array/buffer yang sudah di-serialize
    share: string;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const documentId = searchParams.get('id');

        if (!documentId) {
            return NextResponse.json({ error: 'ID Dokumen tidak disertakan' }, { status: 400 });
        }

        const nodes = ['node-local', 'node-pdn', 'node-cloud'];

        const fetchPromises = nodes.map(async (node) => {
            const { data, error } = await supabase.storage
                .from(node)
                .download(`${documentId}/vault.json`);
                
            if (error) throw new Error(`Gagal akses ${node}`);
            
            const text = await data.text();
            // 2. Casting hasil parse JSON menjadi tipe VaultPayload
            return JSON.parse(text) as VaultPayload;
        });

        const results = await Promise.allSettled(fetchPromises);

        // 3. Gunakan VaultPayload sebagai pengganti <any>
        const successfulNodes = results
            .filter((r): r is PromiseFulfilledResult<VaultPayload> => r.status === 'fulfilled')
            .map(r => r.value);

        if (successfulNodes.length < 2) {
            return NextResponse.json({ 
                error: 'Sistem Kritis: Gagal memenuhi threshold. Kurang dari 2 node yang merespons.' 
            }, { status: 500 });
        }

        const ciphertext = successfulNodes[0].ciphertext;
        const survivingShares = successfulNodes.map(node => node.share).slice(0, 2);

        return NextResponse.json({ 
            success: true,
            status: `Berhasil merespons dari ${successfulNodes.length}/3 Node`,
            ciphertext: ciphertext,
            shares: survivingShares
        }, { status: 200 });

    // 4. Gunakan tipe 'unknown' untuk menangani error secara aman
    } catch (error: unknown) { 
        const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server yang tidak diketahui';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}