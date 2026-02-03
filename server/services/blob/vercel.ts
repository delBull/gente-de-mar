
import { put, del } from '@vercel/blob';
import { IBlobStorage } from './index.js';

export class VercelBlobStorage implements IBlobStorage {
    async put(filename: string, data: Buffer | Blob | string, options?: any): Promise<string> {
        const { url } = await put(filename, data, { access: 'public', ...options });
        return url;
    }

    async delete(url: string): Promise<void> {
        await del(url);
    }
}

export const blobStorage = new VercelBlobStorage();
