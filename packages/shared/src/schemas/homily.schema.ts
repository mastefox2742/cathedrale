import { z } from "zod";
import { ContentStatus, HomilyContentType, Visibility } from "../enums";

export const createHomilySchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    contentType: z.nativeEnum(HomilyContentType).default(HomilyContentType.TEXT),
    text: z.string().trim().min(1).max(50_000).optional(),
    mediaUrl: z.string().url().max(2048).optional(),
    thumbnailUrl: z.string().url().max(2048).optional(),
    celebrant: z.string().trim().min(2).max(160),
    celebration: z.string().trim().max(160).optional(),
    date: z.coerce.date(),
    durationSeconds: z.coerce.number().int().positive().max(36_000).optional(),
    summary: z.string().trim().max(500).optional(),
    keywords: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
    transcript: z.string().trim().max(20_000).optional(),
    downloadable: z.boolean().default(false),
    visibility: z.nativeEnum(Visibility).default(Visibility.PUBLIC),
    usageRights: z.string().trim().max(500).optional(),
  })
  .refine((data) => data.contentType !== HomilyContentType.TEXT || !!data.text, {
    message: "text est requis quand contentType = 'text'",
    path: ["text"],
  })
  .refine((data) => data.contentType === HomilyContentType.TEXT || !!data.mediaUrl, {
    message: "mediaUrl est requis quand contentType = 'audio' ou 'video'",
    path: ["mediaUrl"],
  });
export type CreateHomilyInput = z.infer<typeof createHomilySchema>;

export const updateHomilyStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.nativeEnum(ContentStatus),
});
export type UpdateHomilyStatusInput = z.infer<typeof updateHomilyStatusSchema>;
