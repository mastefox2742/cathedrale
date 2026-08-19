import { z } from "zod";
import { CelebrationType, ContentStatus } from "../enums";

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format attendu HH:mm (ex: 09:30)");

export const createMassScheduleSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    celebrationType: z.nativeEnum(CelebrationType).default(CelebrationType.MASS),
    date: z.coerce.date().optional(),
    startTime: timeSchema,
    endTime: timeSchema.optional(),
    location: z.string().trim().max(160).optional(),
    language: z.string().trim().min(2).max(40).default("fr"),
    recurrence: z.string().trim().max(160).optional(),
    note: z.string().trim().max(2000).optional(),
  })
  .refine((data) => !data.endTime || data.endTime > data.startTime, {
    message: "endTime doit etre posterieur a startTime",
    path: ["endTime"],
  });
export type CreateMassScheduleInput = z.infer<typeof createMassScheduleSchema>;

export const updateMassScheduleStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.nativeEnum(ContentStatus),
});
export type UpdateMassScheduleStatusInput = z.infer<typeof updateMassScheduleStatusSchema>;
