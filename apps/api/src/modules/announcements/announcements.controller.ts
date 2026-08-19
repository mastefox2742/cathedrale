import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { createAnnouncementSchema, type CreateAnnouncementInput } from "@csc/shared";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import type { AuthenticatedUser } from "@csc/shared";
import { AnnouncementsService } from "./announcements.service";

@Controller("announcements")
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  /** Accessible sans compte (cahier des charges 2.1) - JwtAuthGuard global bypasse via @Public(). */
  @Public()
  @Get("public")
  listPublic() {
    return this.announcementsService.listPublic();
  }

  /** Authentifie + permission "announcement:create" (PermissionsGuard, cf app.module.ts). */
  @RequirePermission("announcement", "create")
  @Post()
  create(
    @Body(new ZodValidationPipe(createAnnouncementSchema)) body: CreateAnnouncementInput,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.announcementsService.create(body, user.id);
  }

  @RequirePermission("announcement", "publish")
  @Patch(":id/publish")
  publish(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.announcementsService.publish(id, user.id);
  }
}
