import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ENV_FILES, validateEnv } from './config/env';
import { DatabaseModule } from './database/database.module';
import { TradesModule } from './trades/trades.module';
import { ImportModule } from './import/import.module';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ENV_FILES,
      validate: validateEnv,
    }),
    DatabaseModule,
    TradesModule,
    ImportModule,
    KafkaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
