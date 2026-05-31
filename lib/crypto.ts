import { webcrypto } from 'crypto';
// @ts-ignore: Mengabaikan ketiadaan file deklarasi (types) bawaan library
import secrets from 'secrets.js-grempe';

// Mendefinisikan alias tipe agar kompatibel dengan Node16
type CryptoKey = webcrypto.CryptoKey;

/**
 * 1. Generate Master Key (AES-256-GCM)
 */
export async function generateMasterKey(): Promise<CryptoKey> {
    return (await webcrypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true, // extractable
        ['encrypt', 'decrypt']
    )) as CryptoKey;
}

/**
 * 2. Enkripsi Dokumen
 */
export async function encryptDocument(data: Buffer, key: CryptoKey) {
    const iv = webcrypto.getRandomValues(new Uint8Array(12));
    
    // Konversi eksplisit Buffer ke Uint8Array untuk Web Crypto API
    const dataArray = new Uint8Array(data); 
    
    const ciphertextBuffer = await webcrypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        dataArray
    );

    return {
        ciphertext: Buffer.from(ciphertextBuffer),
        iv: Buffer.from(iv)
    };
}

/**
 * 3. Dekripsi Dokumen
 */
export async function decryptDocument(ciphertext: Buffer, key: CryptoKey, iv: Buffer): Promise<Buffer> {
    const ciphertextArray = new Uint8Array(ciphertext);
    const ivArray = new Uint8Array(iv);

    const decryptedBuffer = await webcrypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivArray },
        key,
        ciphertextArray
    );
    return Buffer.from(decryptedBuffer);
}

/**
 * 4. Pemecahan Kunci (Shamir's Secret Sharing)
 */
export async function splitMasterKey(key: CryptoKey, totalShares: number, threshold: number): Promise<string[]> {
    const exportedKey = await webcrypto.subtle.exportKey('raw', key);
    const hexKey = Buffer.from(exportedKey).toString('hex');
    
    return secrets.share(hexKey, totalShares, threshold);
}

/**
 * 5. Rekonstruksi Kunci dari Pecahan (Shares)
 */
export async function reconstructMasterKey(shares: string[]): Promise<CryptoKey> {
    const hexKey = secrets.combine(shares);
    const keyBuffer = Buffer.from(hexKey, 'hex');
    const keyArray = new Uint8Array(keyBuffer);

    return (await webcrypto.subtle.importKey(
        'raw',
        keyArray,
        { name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt']
    )) as CryptoKey;
}