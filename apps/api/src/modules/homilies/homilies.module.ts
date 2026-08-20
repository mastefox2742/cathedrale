import { Module } from "@nestjs/common";
import { HomiliesController } from "./homilies.controller";
import { HomiliesService } from "./homilies.service";

@Module({
  controllers: [HomiliesController],
  providers: [HomiliesService],
})
export class HomiliesModule {}
