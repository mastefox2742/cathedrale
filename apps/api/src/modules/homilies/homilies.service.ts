import { Injectable, NotFoundException } from "@nestjs/common";
import { ContentStatus, Visibility, type CreateHomilyInput } from "@csc/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogService } from "../audit-log/audit-log.service";

@Injectable()
export class HomiliesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  /** Liste publique : homelies publiees et visibles de tous, les plus recentes en premier. */
  async listPublic() {
    return this.prisma.homily.findMany({
      where: { status: ContentStatus.PUBLISHED, visibility: Visibility.PUBLIC },
      orderBy: { date: "desc" },
    });
  }

  async create(input: CreateHomilyInput, authorId: string) {
    const homily = await this.prisma.homily.create({
      data: {
        ...input,
        status: ContentStatus.DRAFT,
        createdBy: authorId,
        updatedBy: authorId,
      },
    });

    await this.auditLog.record({
      actorId: authorId,
      action: "homily.create",
      resource: "homily",
      resourceId: homily.id,
    });

    return homily;
  }

  async publish(id: string, publishedBy: string) {
    const existing = await this.prisma.homily.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Homelie introuvable");

    const homily = await this.prisma.homily.update({
      where: { id },
      data: {
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
        updatedBy: publishedBy,
      },
    });

    await this.auditLog.record({
      actorId: publishedBy,
      action: "homily.publish",
      resource: "homily",
      resourceId: id,
    });

    return homily;
  }
}
