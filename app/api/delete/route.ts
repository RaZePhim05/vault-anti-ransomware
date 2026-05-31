import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
    try {
        const { id, targetNode } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'ID Dokumen tidak disertakan' }, { status: 400 });
        }

        // JIKA MENGHAPUS PARSIAL (Hanya 1 Node Tertentu)
        if (targetNode && targetNode !== 'all') {
            const { error } = await supabase.storage
                .from(targetNode)
                .remove([`${id}/vault.json`]);
                
            if (error) throw new Error(error.message);
            return NextResponse.json({ success: true, message: `Dihapus dari ${targetNode}` }, { status: 200 });
        } 
        // JIKA MENGHAPUS TOTAL (Semua Node + Database)
        else {
            const nodes = ['node-local', 'node-pdn', 'node-cloud'];
            const deletePromises = nodes.map(async (node) => {
                const { error } = await supabase.storage.from(node).remove([`${id}/vault.json`]);
                return error; // Abaikan jika file sudah tidak ada
            });
            await Promise.all(deletePromises);

            // Hapus metadata di database
            const { error: dbError } = await supabase.from('documents').delete().eq('id', id);
            if (dbError) throw new Error(dbError.message);

            return NextResponse.json({ success: true, message: 'Dihapus total' }, { status: 200 });
        }

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}