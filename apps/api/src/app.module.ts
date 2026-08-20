import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { validateEnv, type EnvConfig } from "./config/env.validation";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { AuditLogModule } from "./modules/audit-log/audit-log.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { AnnouncementsModule } from "./modules/announcements/announcements.module";
import { MassSchedulesModule } from "./modules/mass-schedules/mass-schedules.module";
import { HomiliesModule } from "./modules/homilies/homilies.module";
import { FormationsModule } from "./modules/formations/formations.module";
import { EventsModule } from "./modules/events/events.module";
import { HealthModule } from "./modules/health/health.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { PermissionsGuard } from "./common/guards/permissions.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: [".env.local", ".env"],
    }),

    // Rate limiting global (checklist "Rate limiting differencie par endpoint").
    // Limite par defaut ici ; des limites plus strictes sont surchargees au
    // niveau des routes sensibles avec @Throttle() (voir AuthController).
    // NOTE: stockage in-memory par defaut -> pour un deploiement multi-instance,
    // brancher un ThrottlerStorage Redis (ex: @nest-lab/throttler-storage-redis).
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvConfig, true>) => ({
        throttlers: [
          {
            ttl: config.get("THROTTLE_TTL_MS", { infer: true }),
            limit: config.get("THROTTLE_LIMIT_DEFAULT", { infer: true }),
          },
        ],
      }),
    }),

    PrismaModule,
    RedisModule,
    AuditLogModule,
    AuthModule,
    UsersModule,
    AnnouncementsModule,
    MassSchedulesModule,
    HomiliesModule,
    FormationsModule,
    EventsModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },

    // Ordre d'execution: Throttler -> Auth (JWT) -> Permissions (RBAC).
    // "Secure by default": toute route est protegee sauf @Public() explicite.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
