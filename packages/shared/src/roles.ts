/**
 * Roles et permissions - source unique de verite partagee entre apps/web et apps/api.
 *
 * IMPORTANT (regle de securite #1 du projet) : ce fichier sert a piloter l'UI
 * (afficher/masquer des actions) mais NE remplace JAMAIS la verification cote
 * serveur. apps/api doit revalider `hasPermission(...)` dans chaque guard/service
 * avant toute action sensible. L'interface n'est jamais le seul mecanisme de
 * securite (cf. cahier des charges section 6 et SECURITY.md).
 */

export const ROLES = [
  "visitor",
  "member",
  "parent",
  "young_member",
  "catechist",
  "youth_animator",
  "group_manager",
  "priest",
  "pastoral_manager",
  "moderator",
  "safeguarding_officer",
  "admin",
  "super_admin",
] as const;

export type Role = (typeof ROLES)[number];

/** Un utilisateur peut cumuler plusieurs roles (ex: parent + catechiste). */
export type RoleSet = readonly Role[];

export const RESOURCES = [
  "mass_schedule",
  "announcement",
  "homily",
  "formation",
  "catechism",
  "youth_content",
  "group",
  "event",
  "livestream",
  "media",
  "notification",
  "prayer_request",
  "pastoral_request",
  "donation",
  "user",
  "role_assignment",
  "safeguarding_report",
  "audit_log",
  "settings",
] as const;

export type Resource = (typeof RESOURCES)[number];

export const ACTIONS = [
  "view",
  "view_public",
  "create",
  "edit",
  "submit_for_review",
  "publish",
  "archive",
  "delete",
  "moderate",
  "manage_members",
  "manage",
] as const;

export type Action = (typeof ACTIONS)[number];

export interface PermissionRule {
  resource: Resource;
  action: Action;
  /** Roles autorises a effectuer cette action. Verifie cote serveur en priorite. */
  allowedRoles: Role[];
  description?: string;
}

/**
 * Matrice de permissions par defaut, derivee du cahier des charges
 * (section 2.3 "Tableau d'acces" et section 6 "Roles et permissions").
 * A etendre au fur et a mesure de l'implementation de chaque module -
 * ne jamais elargir un `allowedRoles` sans revue explicite.
 */
export const PERMISSIONS: PermissionRule[] = [
  { resource: "mass_schedule", action: "view_public", allowedRoles: [...ROLES] },
  { resource: "mass_schedule", action: "manage", allowedRoles: ["pastoral_manager", "priest", "admin", "super_admin"] },

  { resource: "announcement", action: "view_public", allowedRoles: [...ROLES] },
  { resource: "announcement", action: "create", allowedRoles: ["group_manager", "catechist", "youth_animator", "pastoral_manager", "priest", "admin", "super_admin"] },
  { resource: "announcement", action: "publish", allowedRoles: ["pastoral_manager", "priest", "admin", "super_admin"] },

  { resource: "homily", action: "view_public", allowedRoles: [...ROLES] },
  { resource: "homily", action: "publish", allowedRoles: ["priest", "pastoral_manager", "admin", "super_admin"] },

  { resource: "formation", action: "view", allowedRoles: ["member", "parent", "young_member", "catechist", "youth_animator", "group_manager", "priest", "pastoral_manager", "moderator", "safeguarding_officer", "admin", "super_admin"] },
  { resource: "formation", action: "create", allowedRoles: ["pastoral_manager", "priest", "admin", "super_admin"] },
  { resource: "formation", action: "publish", allowedRoles: ["pastoral_manager", "priest", "admin", "super_admin"] },

  { resource: "catechism", action: "manage", allowedRoles: ["catechist", "pastoral_manager", "admin", "super_admin"] },
  { resource: "catechism", action: "view", allowedRoles: ["parent", "catechist", "pastoral_manager", "admin", "super_admin"] },

  { resource: "group", action: "manage_members", allowedRoles: ["group_manager", "pastoral_manager", "admin", "super_admin"] },
  { resource: "group", action: "create", allowedRoles: ["pastoral_manager", "priest", "admin", "super_admin"] },

  { resource: "event", action: "view_public", allowedRoles: [...ROLES] },
  { resource: "event", action: "create", allowedRoles: ["group_manager", "youth_animator", "catechist", "pastoral_manager", "priest", "admin", "super_admin"] },

  { resource: "prayer_request", action: "create", allowedRoles: ["member", "parent", "young_member", "catechist", "youth_animator", "group_manager", "priest", "pastoral_manager", "admin", "super_admin"] },
  { resource: "prayer_request", action: "view", allowedRoles: ["pastoral_manager", "priest", "admin", "super_admin"], description: "Donnees sensibles - acces restreint aux responsables habilites uniquement" },

  { resource: "pastoral_request", action: "view", allowedRoles: ["pastoral_manager", "priest", "admin", "super_admin"] },

  { resource: "donation", action: "view", allowedRoles: ["admin", "super_admin", "pastoral_manager"] },

  { resource: "user", action: "manage", allowedRoles: ["admin", "super_admin"] },
  { resource: "role_assignment", action: "manage", allowedRoles: ["super_admin"], description: "Attribution de roles = action la plus sensible, reservee au super_admin" },

  { resource: "safeguarding_report", action: "view", allowedRoles: ["safeguarding_officer", "super_admin"], description: "Signalements protection des mineurs - perimetre tres restreint" },
  { resource: "safeguarding_report", action: "moderate", allowedRoles: ["safeguarding_officer", "moderator", "super_admin"] },

  { resource: "audit_log", action: "view", allowedRoles: ["admin", "super_admin"] },

  { resource: "settings", action: "manage", allowedRoles: ["super_admin"] },
];

/**
 * Verifie si au moins un des roles de l'utilisateur autorise l'action sur la ressource.
 * Utiliser cette meme fonction cote UI (apps/web) ET cote serveur (guards NestJS)
 * pour eviter toute divergence entre ce qui est affiche et ce qui est reellement autorise.
 */
export function hasPermission(userRoles: RoleSet, resource: Resource, action: Action): boolean {
  if (userRoles.includes("super_admin")) return true;
  const rule = PERMISSIONS.find((p) => p.resource === resource && p.action === action);
  if (!rule) return false;
  return rule.allowedRoles.some((role) => userRoles.includes(role));
}

/** Roles consideres comme "responsables" ayant acces a une partie de l'administration. */
export const STAFF_ROLES: Role[] = [
  "catechist",
  "youth_animator",
  "group_manager",
  "priest",
  "pastoral_manager",
  "moderator",
  "safeguarding_officer",
  "admin",
  "super_admin",
];

export function isStaff(userRoles: RoleSet): boolean {
  return userRoles.some((role) => STAFF_ROLES.includes(role));
}
