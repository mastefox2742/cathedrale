import { Inject, Injectable } from "@nestjs/common";
import type Redis from "ioredis";
import { REDIS_CLIENT } from "../../redis/redis.module";

/**
 * Blacklist des sessions revoquees (logout, changement de mot de passe,
 * compromission detectee). Les access tokens JWT sont stateless et valides
 * seulement 15 min (cf SECURITY.md) - cette blacklist couvre la fenetre
 * residuelle pour un logout immediat, comme demande par la checklist
 * ("Session invalidee completement au logout").
 */
@Injectable()
export class TokenBlacklistService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  private key(sessionId: string): string {
    return `auth:blacklist:${sessionId}`;
  }

  /** @param ttlSeconds duree residuelle de l'access token au moment de la revocation */
  async blacklist(sessionId: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) return;
    await this.redis.set(this.key(sessionId), "1", "EX", ttlSeconds);
  }

  async isBlacklisted(sessionId: string): Promise<boolean> {
    const value = await this.redis.get(this.key(sessionId));
    return value !== null;
  }
}
