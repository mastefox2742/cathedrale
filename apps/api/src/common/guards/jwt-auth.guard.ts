import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

/**
 * Applique globalement (voir app.module.ts APP_GUARD) : toute route est
 * protegee par defaut. Seules les routes explicitement marquees @Public()
 * (horaires, annonces publiques, login...) sont accessibles sans token.
 *
 * Principe "secure by default" : un developpeur qui oublie d'annoter une
 * nouvelle route obtient une 401, jamais une fuite de donnees.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
