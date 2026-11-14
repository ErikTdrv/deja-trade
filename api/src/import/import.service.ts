import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';
import busboy from 'busboy';
import { parse } from 'csv-parse';
import type { Request } from 'express';
import type { Readable } from 'node:stream';
import { TradesService } from '../trades/trades.service';
import { JournalCsvAdapter } from './adapters/journal-csv.adapter';
import type { ParsedTrade } from './adapters/types';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const BATCH_SIZE = 200;

export interface ImportSummary {
  inserted: number;
  duplicates: number; // already imported earlier (same Trade #), skipped
  // `row` = row number as seen in the spreadsheet (header is row 1).
  rejected: { row: number; reasons: string[] }[];
}

type ParsedRecord = {
  record: Record<string, string | undefined>;
  info: { records: number };
};

@Injectable()
export class ImportService {
  constructor(
    private readonly adapter: JournalCsvAdapter,
    private readonly tradesService: TradesService,
  ) {}

  processCSVImport(req: Request, userId: string): Promise<ImportSummary> {
    return new Promise((resolve, reject) => {
      const bb = busboy({
        headers: req.headers,
        limits: { files: 1, fileSize: MAX_FILE_SIZE },
      });
      let gotFile = false;

      bb.on('file', (_fieldName, fileStream) => {
        gotFile = true;
        this.consumeFile(fileStream, userId).then(resolve, reject);
      });

      // 'close' = whole request parsed. Only an error if no file part came.
      bb.on('close', () => {
        if (!gotFile) reject(new BadRequestException('No file uploaded'));
      });
      bb.on('error', reject);

      req.pipe(bb);
    });
  }

  private async consumeFile(
    fileStream: Readable,
    userId: string,
  ): Promise<ImportSummary> {
    const parser = parse({
      columns: (headers: string[]) => this.adapter.validateHeaders(headers),
      trim: true,
      info: true, // each item becomes { record, info } so we know the row number
    });

    // busboy truncates silently on overflow; turn it into an error.
    // Destroy the parser, not the file: .pipe() doesn't forward errors,
    // so the for-await below would hang forever.
    fileStream.on('limit', () => {
      parser.destroy(new PayloadTooLargeException('File exceeds 5 MB'));
    });

    const summary: ImportSummary = { inserted: 0, duplicates: 0, rejected: [] };
    let batch: ParsedTrade[] = [];

    const saveBatch = async () => {
      // userId comes from the request, not the file; added here.
      const { inserted, duplicates } = await this.tradesService.insertBatch(
        batch.map((trade) => ({ ...trade, userId })),
      );
      summary.inserted += inserted;
      summary.duplicates += duplicates;
      batch = [];
    };

    const rows = fileStream.pipe(parser) as AsyncIterable<ParsedRecord>;
    for await (const { record, info } of rows) {
      const result = this.adapter.mapRow(record);
      if (!result.ok) {
        summary.rejected.push({
          row: info.records + 1,
          reasons: result.reasons,
        });
        continue;
      }

      batch.push(result.trade);
      // Flush on batch size, not row count: rejected rows don't fill a batch.
      // Awaiting here also pauses reading the file while the DB works (backpressure).
      if (batch.length === BATCH_SIZE) await saveBatch();
    }
    // The last partial batch would otherwise be lost.
    if (batch.length) await saveBatch();

    return summary;
  }
}
