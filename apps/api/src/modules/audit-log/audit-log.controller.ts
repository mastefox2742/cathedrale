import { Controller, Get, Query } from "@nestjs/common";
import { listAuditLogSchema, type ListAuditLogQuery } from "@csc/shared";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuditLogService } from "./audit-log.service";

@Controller("audit-log")
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  /** Reserve aux administrateurs (cahier des charges 6 et 11 "Journaux d'audit"). */
  @RequirePermission("audit_log", "view")
  @Get()
  list(@Query(new ZodValidationPipe(listAuditLogSchema)) query: ListAuditLogQuery) {
    return this.auditLogService.list(query);
  }
}
