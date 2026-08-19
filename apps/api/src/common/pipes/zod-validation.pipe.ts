import type { PipeTransform } from "@nestjs/common";
import { BadRequestException } from "@nestjs/common";
import type { ZodSchema } from "zod";

/**
 * Valide le body/params/query avec un schema Zod partage depuis @csc/shared -
 * exactement le meme schema que celui utilise cote formulaire dans apps/web.
 * Rejette avec 400 et un message explicite (jamais silencieusement corrige).
 *
 * Usage: @Body(new ZodValidationPipe(createAnnouncementSchema)) body: CreateAnnouncementInput
 */
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: "Donnees invalides",
        issues: result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }
    return result.data;
  }
}
