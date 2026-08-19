import { SetMetadata } from "@nestjs/common";
import type { Action, Resource } from "@csc/shared";

export const PERMISSION_KEY = "requiredPermission";

export interface RequiredPermission {
  resource: Resource;
  action: Action;
}

/**
 * Declare la permission requise pour acceder a un endpoint. Verifiee par
 * PermissionsGuard via la meme fonction hasPermission() que le frontend,
 * garantissant que "ce que l'UI autorise" == "ce que le serveur autorise".
 *
 * @example
 * @RequirePermission('announcement', 'publish')
 * @Patch(':id/publish')
 * publish(...) { ... }
 */
export const RequirePermission = (resource: Resource, action: Action) =>
  SetMetadata(PERMISSION_KEY, { resource, action } satisfies RequiredPermission);
