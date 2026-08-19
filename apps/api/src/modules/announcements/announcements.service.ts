import { Injectable, NotFoundException } from "@nestjs/common";
import { ContentStatus, type CreateAnnouncementInput } from "@csc/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogService } from "../audit-log/audit-log.service";

/**
 * Module de reference : reproduire ce pattern (service + controller + guards)
 * pour les autres contenus editoriaux (homelies, formations, evenements...)
 * decrits dans le cahier des charges section 5.
 */
@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  /** Liste publique : uniquement les annonces publiees, non expirees. Aucune verification de role necessaire. */
  async listPublic() {
    return this.prisma.announcement.findMany({
      where: {
        status: ContentStatus.PUBLISHED,
        visibility: "public",
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: [{ priority: "desc" }, { publishAt: "desc" }],
    });
  }

  async create(input: CreateAnnouncementInput, authorId: string) {
    const announcement = await this.prisma.announcement.create({
      data: {
        ...input,
        status: ContentStatus.DRAFT,
        createdBy: authorId,
        updatedBy: authorId,
      },
    });

    await this.auditLog.record({
      actorId: authorId,
      action: "announcement.create",
      resource: "announcement",
      resourceId: announcement.id,
    });

    return announcement;
  }

  /**
   * Publication : transition de statut controlee. Le workflow complet
   * (draft -> in_review -> pending_validation -> published) est a affiner
   * selon que la paroisse active ou non le circuit de validation
   * (cahier des charges 5.2 "Validation").
   */
  async publish(id: string, publishedBy: string) {
    const existing = await this.prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Annonce introuvable");

    const announcement = await this.prisma.announcement.update({
      where: { id },
      data: {
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
        updatedBy: publishedBy,
      },
    });

    await this.auditLog.record({
      actorId: publishedBy,
      action: "announcement.publish",
      resource: "announcement",
      resourceId: id,
    });

    return announcement;
  }
}
