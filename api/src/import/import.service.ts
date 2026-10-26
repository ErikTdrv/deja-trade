import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';
import busboy from 'busboy';
import { parse } from 'csv-parse';
import type { Request } from 'express';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

@Injectable()
export class ImportService {
  processCSVImport(req: Request): Promise<{ rows: number }> {
    return new Promise((resolve, reject) => {
      const bb = busboy({
        headers: req.headers,
        limits: { files: 1, fileSize: MAX_FILE_SIZE },
      });
      let gotFile = false;

      bb.on('file', async (_fieldName, fileStream) => {
        gotFile = true;
        const parser = parse({ columns: true, trim: true });

        // busboy truncates silently on overflow; turn it into an error.
        // Destroy the parser, not the file: .pipe() doesn't forward errors,
        // so the for-await below would hang forever.
        fileStream.on('limit', () => {
          parser.destroy(new PayloadTooLargeException('File exceeds 5 MB'));
        });

        try {
          let rows = 0;
          for await (const row of fileStream.pipe(parser)) {
            console.log(row);
            rows++;
          }
          resolve({ rows });
        } catch (err) {
          reject(err);
        }
      });

      // 'close' = whole request parsed. Only an error if no file part came.
      bb.on('close', () => {
        if (!gotFile) reject(new BadRequestException('No file uploaded'));
      });
      bb.on('error', reject);

      req.pipe(bb);
    });
  }
}
