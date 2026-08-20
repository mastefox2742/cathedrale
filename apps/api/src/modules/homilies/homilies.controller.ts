import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { createHomilySchema, type CreateHomilyInput } from "@csc/shared";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import type { AuthenticatedUser } from "@csc/shared";
import { HomiliesService } from "./homilies.service";

@Controller("homilies")
export class HomiliesController {
  constructor(private readonly homiliesService: HomiliesService) {}

  /** Accessible sans compte (cahier des charges 2.1) - JwtAuthGuard global bypasse via @Public(). */
  @Public()
  @Get("public")
  listPublic() {
    return this.homiliesService.listPublic();
  }

  @RequirePermission("homily", "create")
  @Post()
  create(
    @Body(new ZodValidationPipe(createHomilySchema)) body: CreateHomilyInput,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.homiliesService.create(body, user.id);
  }

  @RequirePermission("homily", "publish")
  @Patch(":id/publish")
  publish(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.homiliesService.publish(id, user.id);
  }
}
