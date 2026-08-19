import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

/**
 * Marque un endpoint comme accessible sans authentification (ex: consultation
 * des horaires, des annonces publiques). Explicite et oppose au comportement
 * par defaut (JwtAuthGuard applique globalement, cf app.module.ts) - on
 * choisit deliberement d'ouvrir une route plutot que d'oublier de la proteger.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
