import { Module } from '@nestjs/common';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { JournalCsvAdapter } from './adapters/journal-csv.adapter';
import { TradesModule } from '../trades/trades.module';

@Module({
  imports: [TradesModule],
  controllers: [ImportController],
  exports: [],
  providers: [ImportService, JournalCsvAdapter],
})
export class ImportModule {}
