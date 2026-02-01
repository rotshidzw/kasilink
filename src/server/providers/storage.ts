import { promises as fs } from "fs";
import path from "path";

export interface StorageProvider {
  upload(params: { fileName: string; data: Buffer }): Promise<string>;
}

export class LocalStorageProvider implements StorageProvider {
  constructor(private basePath: string = path.join(process.cwd(), "public", "uploads")) {}

  async upload({ fileName, data }: { fileName: string; data: Buffer }) {
    await fs.mkdir(this.basePath, { recursive: true });
    const filePath = path.join(this.basePath, fileName);
    await fs.writeFile(filePath, data);
    return `/uploads/${fileName}`;
  }
}

export class HuaweiOBSProvider implements StorageProvider {
  async upload({ fileName }: { fileName: string; data: Buffer }) {
    // TODO: Initialize Huawei OBS client with credentials.
    // TODO: Upload fileName + data to bucket.
    // TODO: Return public URL from OBS.
    return `/uploads/${fileName}`;
  }
}

export const storageProvider = new LocalStorageProvider();
