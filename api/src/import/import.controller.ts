import { Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ImportService } from './import.service';

// TODO(auth): take the user from the authenticated request.
const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

@Controller({ path: 'trading-journal/csv-import', version: '1' })
export class ImportController {
  // TO DO: Import business rules(services)
  constructor(private importService: ImportService) {}

  @Post()
  async importJournal(@Req() req: Request) {
    // to do: process stream, do additional checks for the size,
    // magicbytes for security and some other checks, then save each chunk(row)
    // to database, then for description we will store in description column + in the column for kafka, where kafka will take and embed and save in vector database
    return this.importService.processCSVImport(req, DEV_USER_ID);
  }
}
