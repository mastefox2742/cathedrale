import { z } from "zod";
import { ContentStatus, FormationAudience, Visibility } from "../enums";

export const createFormationSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(1).max(5000),
  audience: z.nativeEnum(FormationAudience).default(FormationAudience.ALL),
  ageRange: z.string().trim().max(40).optional(),
  moduleCount: z.coerce.number().int().nonnegative().max(1000).optional(),
  color: z.string().trim().max(40).optional(),
  icon: z.string().trim().max(40).optional(),
  prerequisites: z.string().trim().max(1000).optional(),
  openAccess: z.boolean().default(false),
  visibility: z.nativeEnum(Visibility).default(Visibility.PUBLIC),
});
export type CreateFormationInput = z.infer<typeof createFormationSchema>;

export const updateFormationStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.nativeEnum(ContentStatus),
});
export type UpdateFormationStatusInput = z.infer<typeof updateFormationStatusSchema>;
