import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import type { EnvConfig } from "../config/env.validation";

export const REDIS_CLIENT = "REDIS_CLIENT";

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (config: ConfigService<EnvConfig, true>) => {
        return new Redis(config.get("REDIS_URL", { infer: true }), {
          // Ne jamais logger l'URL (contient le mot de passe) - ioredis ne le
          // fait pas par defaut, on evite juste de le reformater nous-memes.
          lazyConnect: false,
          maxRetriesPerRequest: 3,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
