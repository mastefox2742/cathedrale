import { Controller, Get } from "@nestjs/common";
import type { AuthenticatedUser } from "@csc/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("users")
export class UsersController {
  /**
   * Route authentifiee "de base" utilisee par le frontend pour retrouver la
   * session courante au chargement de l'app (voir apps/web/src/lib/auth-context.tsx).
   * Aucune permission particuliere requise au-dela d'etre connecte.
   */
  @Get("me")
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }
}
