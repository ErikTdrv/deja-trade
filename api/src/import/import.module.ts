import { Module } from "@nestjs/common";
import { ImportController } from "./import.controller";
import { ImportService } from "./import.service";

@Module({
    controllers: [ImportController],
    exports: [], 
    providers: [ImportService]
})
export class ImportModule {}