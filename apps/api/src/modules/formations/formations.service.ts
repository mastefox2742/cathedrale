import { Injectable, NotFoundException } from "@nestjs/common";
import { ContentStatus, Visibility, type CreateFormationInput } from "@csc/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogService } from "../audit-log/audit-log.service";

@Injectable()
export class FormationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  /** Liste publique : fiches formation publiees et visibles de tous (cahier des charges 2.1). */
  async listPublic() {
    return this.prisma.formation.findMany({
      where: { status: ContentStatus.PUBLISHED, visibility: Visibility.PUBLIC },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(input: CreateFormationInput, authorId: string) {
    const formation = await this.prisma.formation.create({
      data: {
        ...input,
        status: ContentStatus.DRAFT,
        createdBy: authorId,
        updatedBy: authorId,
      },
    });

    await this.auditLog.record({
      actorId: authorId,
      action: "formation.create",
      resource: "formation",
      resourceId: formation.id,
    });

    return formation;
  }

  async publish(id: string, publishedBy: string) {
    const existing = await this.prisma.formation.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Formation introuvable");

    const formation = await this.prisma.formation.update({
      where: { id },
      data: {
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
        updatedBy: publishedBy,
      },
    });

    await this.auditLog.record({
      actorId: publishedBy,
      action: "formation.publish",
      resource: "formation",
      resourceId: id,
    });

    return formation;
  }
}
