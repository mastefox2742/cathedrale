import { Injectable, Logger } from "@nestjs/common";
import type { AuditLog } from "@prisma/client";
import type { ListAuditLogQuery, Paginated } from "@csc/shared";
import { PrismaService } from "../../prisma/prisma.service";

export interface AuditLogEntry {
  actorId: string | null;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Service unique d'ecriture du journal d'audit (cahier des charges section 6:
 * "Toutes les actions sensibles doivent etre journalisees"). Utilise par les
 * modules pour tracer : publication de contenu, changement de role, acces a
 * un signalement, connexion admin, export de donnees, etc.
 *
 * Ne jamais ecrire de PII/secret dans `metadata` (memes regles que les logs
 * applicatifs, voir LoggingInterceptor).
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: entry.actorId,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId,
          metadata: entry.metadata as never,
          ipAddress: entry.ipAddress,
        },
      });
    } catch (error) {
      // L'audit ne doit jamais faire echouer l'action metier elle-meme, mais
      // une erreur d'ecriture d'audit doit etre visible en monitoring (alerte).
      this.logger.error(`Echec ecriture audit log: ${entry.action}/${entry.resource}`, error as Error);
    }
  }

  /**
   * Lecture reservee aux administrateurs (permission "audit_log:view" - voir
   * packages/shared/src/roles.ts). Filtrage optionnel par ressource/action/
   * auteur, tri du plus recent au plus ancien.
   */
  async list(query: ListAuditLogQuery): Promise<Paginated<AuditLog>> {
    const { page, pageSize, resource, action, actorId } = query;
    const where = {
      ...(resource ? { resource } : {}),
      ...(action ? { action } : {}),
      ...(actorId ? { actorId } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }
}
