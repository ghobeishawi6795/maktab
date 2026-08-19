import { Env } from '../types';
import { getR2 } from '../database/client';
import { v4 as uuidv4 } from 'uuid';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp',
  'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm',
  'video/mp4', 'video/webm',
  'application/pdf',
];

export class FileService {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  async uploadFile(file: File, folder: string = 'general') {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('حجم فایل بیشتر از حد مجاز است (حداکثر ۱۵ مگابایت)');
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('نوع فایل مجاز نیست');
    }

    const bucket = getR2(this.env);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `${folder}/${uuidv4()}-${safeName}`;
    const arrayBuffer = await file.arrayBuffer();

    await bucket.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
        contentDisposition: `inline; filename="${safeName}"`,
      },
    });

    return {
      key,
      name: file.name,
      size: file.size,
      type: file.type,
      url: `/api/files/${key}`,
    };
  }

  async getFile(key: string) {
    const bucket = getR2(this.env);
    const object = await bucket.get(key);

    if (!object) return null;

    const headers = new Headers();
    if (object.httpMetadata?.contentType) {
      headers.set('Content-Type', object.httpMetadata.contentType);
    }
    if (object.httpMetadata?.contentDisposition) {
      headers.set('Content-Disposition', object.httpMetadata.contentDisposition);
    }

    return { body: object.body, headers };
  }

  async deleteFile(key: string) {
    const bucket = getR2(this.env);
    await bucket.delete(key);
    return true;
  }
}
