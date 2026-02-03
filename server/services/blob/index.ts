
export interface IBlobStorage {
    put(filename: string, data: Buffer | Blob | string, options?: any): Promise<string>;
    delete(url: string): Promise<void>;
}
