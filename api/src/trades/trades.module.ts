import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxModule } from '../outbox/outbox.module';
import { Trade } from './trade.entity';
import { TradesService } from './trades.service';

@Module({
  imports: [TypeOrmModule.forFeature([Trade]), OutboxModule],
  providers: [TradesService],
  exports: [TradesService],
})
export class TradesModule {}
