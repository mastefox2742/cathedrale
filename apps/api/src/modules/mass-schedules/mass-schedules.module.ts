import { Module } from "@nestjs/common";
import { MassSchedulesController } from "./mass-schedules.controller";
import { MassSchedulesService } from "./mass-schedules.service";

@Module({
  controllers: [MassSchedulesController],
  providers: [MassSchedulesService],
})
export class MassSchedulesModule {}
