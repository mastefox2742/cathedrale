import { z } from "zod";
import { ContentStatus, EventType, Visibility } from "../enums";

export const createEventSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    type: z.nativeEnum(EventType).default(EventType.MEETING),
    description: z.string().trim().min(1).max(5000),
    date: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    location: z.string().trim().max(160).optional(),
    responsible: z.string().trim().max(160).optional(),
    imageUrl: z.string().url().max(2048).optional(),
    documentUrls: z.array(z.string().url().max(2048)).max(20).default([]),
    registrationEnabled: z.boolean().default(false),
    maxParticipants: z.coerce.number().int().positive().max(100_000).optional(),
    liveUrl: z.string().url().max(2048).optional(),
    replayUrl: z.string().url().max(2048).optional(),
    visibility: z.nativeEnum(Visibility).default(Visibility.PUBLIC),
  })
  .refine((data) => !data.endDate || data.endDate >= data.date, {
    message: "endDate doit etre posterieur ou egal a date",
    path: ["endDate"],
  });
export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.nativeEnum(ContentStatus),
});
export type UpdateEventStatusInput = z.infer<typeof updateEventStatusSchema>;
