import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { createMassScheduleSchema, type CreateMassScheduleInput } from "@csc/shared";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import type { AuthenticatedUser } from "@csc/shared";
import { MassSchedulesService } from "./mass-schedules.service";

@Controller("mass-schedules")
export class MassSchedulesController {
  constructor(private readonly massSchedulesService: MassSchedulesService) {}

  /** Accessible sans compte (cahier des charges 2.1) - JwtAuthGuard global bypasse via @Public(). */
  @Public()
  @Get("public")
  listPublic() {
    return this.massSchedulesService.listPublic();
  }

  @RequirePermission("mass_schedule", "manage")
  @Post()
  create(
    @Body(new ZodValidationPipe(createMassScheduleSchema)) body: CreateMassScheduleInput,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.massSchedulesService.create(body, user.id);
  }

  @RequirePermission("mass_schedule", "manage")
  @Patch(":id/publish")
  publish(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.massSchedulesService.publish(id, user.id);
  }
}
