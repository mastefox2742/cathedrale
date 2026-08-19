import { ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { hasPermission, type AuthenticatedUser } from "@csc/shared";
import { PERMISSION_KEY, type RequiredPermission } from "../decorators/require-permission.decorator";

/**
 * Verifie la permission declaree via @RequirePermission() sur la ressource/action.
 * S'execute APRES JwtAuthGuard (l'utilisateur doit deja etre authentifie).
 *
 * Rappel de la regle "moindre privilege" (cahier des charges section 6) :
 * un responsable de groupe ne doit voir que les donnees necessaires a son
 * groupe - ce guard verifie le role, le filtrage par perimetre (ex: son
 * propre groupe) reste a la charge du service/repository (WHERE group_id = ...).
 */
@Injectable()
export class PermissionsGuard {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<RequiredPermission | undefined>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) return true; // aucune permission declaree -> laisse passer (route deja authentifiee)

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user) throw new ForbiddenException("Utilisateur non authentifie");

    const allowed = hasPermission(user.roles, required.resource, required.action);
    if (!allowed) {
      throw new ForbiddenException(
        `Role insuffisant pour ${required.action} sur ${required.resource}`,
      );
    }
    return true;
  }
}
