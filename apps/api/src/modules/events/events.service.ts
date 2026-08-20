import { Injectable, NotFoundException } from "@nestjs/common";
import { ContentStatus, Visibility, type CreateEventInput } from "@csc/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogService } from "../audit-log/audit-log.service";

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  /** Liste publique : evenements publies et visibles de tous, les plus proches en premier. */
  async listPublic() {
    return this.prisma.event.findMany({
      where: { status: ContentStatus.PUBLISHED, visibility: Visibility.PUBLIC },
      orderBy: { date: "asc" },
    });
  }

  async create(input: CreateEventInput, authorId: string) {
    const event = await this.prisma.event.create({
      data: {
        ...input,
        status: ContentStatus.DRAFT,
        createdBy: authorId,
        updatedBy: authorId,
      },
    });

    await this.auditLog.record({
      actorId: authorId,
      action: "event.create",
      resource: "event",
      resourceId: event.id,
    });

    return event;
  }

  async publish(id: string, publishedBy: string) {
    const existing = await this.prisma.event.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Evenement introuvable");

    const event = await this.prisma.event.update({
      where: { id },
      data: {
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
        updatedBy: publishedBy,
      },
    });

    await this.auditLog.record({
      actorId: publishedBy,
      action: "event.publish",
      resource: "event",
      resourceId: id,
    });

    return event;
  }
}
