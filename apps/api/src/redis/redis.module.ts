import { Global, Inject, Injectable, Module, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import type { EnvConfig } from "../config/env.validation";

export const REDIS_CLIENT = "REDIS_CLIENT";

/**
 * Le client ioredis est une simple valeur (useFactory), pas une classe Nest -
 * sans ce wrapper, `app.close()` (utilise notamment par les tests e2e) ne
 * ferme jamais la connexion TCP, laissant le processus Node ouvert
 * ("Jest did not exit ... open handles").
 */
@Injectable()
class RedisLifecycle implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}

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
    RedisLifecycle,
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
