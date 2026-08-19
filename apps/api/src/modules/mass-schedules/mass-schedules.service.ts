import { Injectable, NotFoundException } from "@nestjs/common";
import { ContentStatus, type CreateMassScheduleInput } from "@csc/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogService } from "../audit-log/audit-log.service";

@Injectable()
export class MassSchedulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  /** Liste publique : uniquement les horaires publies. Aucune verification de role necessaire. */
  async listPublic() {
    return this.prisma.massSchedule.findMany({
      where: { status: ContentStatus.PUBLISHED },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });
  }

  async create(input: CreateMassScheduleInput, authorId: string) {
    const massSchedule = await this.prisma.massSchedule.create({
      data: {
        ...input,
        status: ContentStatus.DRAFT,
        createdBy: authorId,
        updatedBy: authorId,
      },
    });

    await this.auditLog.record({
      actorId: authorId,
      action: "mass_schedule.create",
      resource: "mass_schedule",
      resourceId: massSchedule.id,
    });

    return massSchedule;
  }

  async publish(id: string, publishedBy: string) {
    const existing = await this.prisma.massSchedule.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Horaire introuvable");

    const massSchedule = await this.prisma.massSchedule.update({
      where: { id },
      data: {
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
        updatedBy: publishedBy,
      },
    });

    await this.auditLog.record({
      actorId: publishedBy,
      action: "mass_schedule.publish",
      resource: "mass_schedule",
      resourceId: id,
    });

    return massSchedule;
  }
}
