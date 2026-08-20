import { z } from "zod";

export const listAuditLogSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  resource: z.string().trim().min(1).max(60).optional(),
  action: z.string().trim().min(1).max(120).optional(),
  actorId: z.string().uuid().optional(),
});
export type ListAuditLogQuery = z.infer<typeof listAuditLogSchema>;
