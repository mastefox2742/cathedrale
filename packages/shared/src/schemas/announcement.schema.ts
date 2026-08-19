import { z } from "zod";
import { AnnouncementPriority, ContentStatus, Visibility } from "../enums";

export const announcementAudienceSchema = z.enum([
  "all",
  "youth",
  "parents",
  "catechists",
  "group",
]);

export const createAnnouncementSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    body: z.string().trim().min(1).max(10_000),
    priority: z.nativeEnum(AnnouncementPriority).default(AnnouncementPriority.NORMAL),
    visibility: z.nativeEnum(Visibility).default(Visibility.PUBLIC),
    audience: announcementAudienceSchema.default("all"),
    groupId: z.string().uuid().optional(),
    imageUrl: z.string().url().max(2048).optional(),
    linkUrl: z.string().url().max(2048).optional(),
    publishAt: z.coerce.date().optional(),
    expiresAt: z.coerce.date().optional(),
  })
  .refine((data) => data.audience !== "group" || !!data.groupId, {
    message: "groupId est requis quand audience = 'group'",
    path: ["groupId"],
  })
  .refine((data) => !data.expiresAt || !data.publishAt || data.expiresAt > data.publishAt, {
    message: "expiresAt doit etre posterieur a publishAt",
    path: ["expiresAt"],
  });
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;

export const updateAnnouncementStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.nativeEnum(ContentStatus),
});
export type UpdateAnnouncementStatusInput = z.infer<typeof updateAnnouncementStatusSchema>;
