import { z } from "zod";

/**
 * Regle de securite : ce schema est importe A LA FOIS par apps/web (validation
 * du formulaire, feedback immediat) ET par apps/api (ValidationPipe NestJS,
 * source de verite). Le client affiche, le serveur valide et decide - jamais
 * l'inverse (voir SECURITY.md, couche 01).
 */

// Politique de mot de passe : 12 caracteres min, au moins une minuscule, une
// majuscule, un chiffre. La force reelle vient du hachage Argon2id cote serveur,
// pas de la complexite du mot de passe seule - mais on evite les mots de passe triviaux.
export const passwordSchema = z
  .string()
  .min(12, "Le mot de passe doit contenir au moins 12 caracteres")
  .max(128)
  .regex(/[a-z]/, "Le mot de passe doit contenir une minuscule")
  .regex(/[A-Z]/, "Le mot de passe doit contenir une majuscule")
  .regex(/[0-9]/, "Le mot de passe doit contenir un chiffre");

export const emailSchema = z.string().trim().toLowerCase().email().max(254);

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().trim().min(2).max(80),
  // Collecte minimale (RGPD / principe de minimisation, cahier des charges section 7).
  // Ne JAMAIS ajouter de champ optionnel "au cas ou" sans revue explicite.
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const requestPasswordResetSchema = z.object({
  email: emailSchema,
});
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(512),
  newPassword: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Rattachement enfant -> parent (cahier des charges 5.5).
 * Un profil enfant n'est jamais cree sans identifiant de compte parent/tuteur.
 */
export const createChildProfileSchema = z.object({
  parentUserId: z.string().uuid(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  birthDate: z.coerce.date(),
  catechismLevelId: z.string().uuid().optional(),
});
export type CreateChildProfileInput = z.infer<typeof createChildProfileSchema>;
