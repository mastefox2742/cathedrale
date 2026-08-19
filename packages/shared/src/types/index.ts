import type { Role } from "../roles";

/** Payload signe dans l'access token JWT. Duree de vie courte (15 min, cf SECURITY.md). */
export interface AccessTokenPayload {
  sub: string; // userId
  roles: Role[];
  /** Identifiant de session, utilise pour la revocation/blacklist au logout. */
  sid: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  roles: Role[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

/** Forme standard des erreurs API - jamais de stack trace ni de detail interne exposes. */
export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  /** Identifiant correlant l'erreur aux logs serveur, sans exposer le detail technique. */
  errorId: string;
  timestamp: string;
  path: string;
}

/** Champs communs a tout contenu administrable (cahier des charges section 9). */
export interface AuditableEntity {
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  archivedAt: string | null;
}
