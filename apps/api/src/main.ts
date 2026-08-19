import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { parseCorsOrigins } from "./config/configuration";
import type { EnvConfig } from "./config/env.validation";
import { PrismaService } from "./prisma/prisma.service";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Message d'erreur de demarrage NestJS peut contenir des details de config -
    // garde le logger par defaut en dev, bufferise en prod pour laisser pino prendre le relais.
    bufferLogs: process.env.NODE_ENV === "production",
  });

  const config = app.get(ConfigService<EnvConfig, true>);
  const isProd = config.get("NODE_ENV", { infer: true }) === "production";

  // Necessaire derriere un reverse proxy (Nginx/Cloudflare) pour que
  // req.ip / rate limiting par IP refletent le vrai client, pas le proxy.
  app.set("trust proxy", 1);

  // --- Couche 01/02 : headers de securite HTTP (checklist "Headers de securite complets") ---
  app.use(
    helmet({
      contentSecurityPolicy: isProd
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'"],
              imgSrc: ["'self'", "data:", "https:"],
              connectSrc: ["'self'"],
              objectSrc: ["'none'"],
              frameAncestors: ["'none'"],
              baseUri: ["'self'"],
              upgradeInsecureRequests: [],
            },
          }
        : false, // desactive en dev pour ne pas gener les outils locaux (Swagger, etc.)
      crossOriginResourcePolicy: { policy: "same-site" },
      hsts: isProd ? { maxAge: 15_552_000, includeSubDomains: true, preload: true } : false,
    }),
  );

  app.use(cookieParser());

  // --- CORS : liste blanche explicite, jamais '*' (checklist reseau) ---
  const corsOrigins = parseCorsOrigins(config.get("CORS_ORIGINS", { infer: true }));
  app.enableCors({
    origin: corsOrigins,
    credentials: true, // requis pour envoyer le cookie refresh token
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // --- Validation globale (defense en profondeur en plus de ZodValidationPipe par route) ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // supprime les champs non declares
      forbidNonWhitelisted: true, // rejette si des champs inattendus sont presents
      transform: true,
      // Les messages de validation restent utiles au client (ex: "email invalide").
      // Ce ne sont pas des details internes - la protection contre la fuite de
      // stack trace / detail technique est geree par AllExceptionsFilter.
      disableErrorMessages: false,
    }),
  );

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
  app.setGlobalPrefix("api", { exclude: ["health", "health/ready"] });

  const prismaService = app.get(PrismaService);
  prismaService.enableShutdownHooks(app);

  const port = config.get("PORT", { infer: true });
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API demarree sur le port ${port} (env: ${config.get("NODE_ENV", { infer: true })})`);
}

bootstrap().catch((error) => {
   
  console.error("Echec du demarrage de l'application", error);
  process.exit(1);
});
