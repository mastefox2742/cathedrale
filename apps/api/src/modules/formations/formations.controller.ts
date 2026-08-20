import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { createFormationSchema, type CreateFormationInput } from "@csc/shared";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import type { AuthenticatedUser } from "@csc/shared";
import { FormationsService } from "./formations.service";

@Controller("formations")
export class FormationsController {
  constructor(private readonly formationsService: FormationsService) {}

  /** Accessible sans compte (cahier des charges 2.1) - JwtAuthGuard global bypasse via @Public(). */
  @Public()
  @Get("public")
  listPublic() {
    return this.formationsService.listPublic();
  }

  @RequirePermission("formation", "create")
  @Post()
  create(
    @Body(new ZodValidationPipe(createFormationSchema)) body: CreateFormationInput,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.formationsService.create(body, user.id);
  }

  @RequirePermission("formation", "publish")
  @Patch(":id/publish")
  publish(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.formationsService.publish(id, user.id);
  }
}
