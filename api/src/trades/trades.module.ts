import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trade } from './trade.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Trade])],
})
export class TradesModule {}
