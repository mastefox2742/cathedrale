import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { createEventSchema, type CreateEventInput } from "@csc/shared";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import type { AuthenticatedUser } from "@csc/shared";
import { EventsService } from "./events.service";

@Controller("events")
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /** Accessible sans compte (cahier des charges 2.1) - JwtAuthGuard global bypasse via @Public(). */
  @Public()
  @Get("public")
  listPublic() {
    return this.eventsService.listPublic();
  }

  @RequirePermission("event", "create")
  @Post()
  create(
    @Body(new ZodValidationPipe(createEventSchema)) body: CreateEventInput,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventsService.create(body, user.id);
  }

  @RequirePermission("event", "publish")
  @Patch(":id/publish")
  publish(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.publish(id, user.id);
  }
}
