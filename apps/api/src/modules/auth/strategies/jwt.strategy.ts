import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { AccessTokenPayload, AuthenticatedUser } from "@csc/shared";
import { PrismaService } from "../../../prisma/prisma.service";
import type { EnvConfig } from "../../../config/env.validation";
import { TokenBlacklistService } from "../token-blacklist.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    config: ConfigService<EnvConfig, true>,
    private readonly prisma: PrismaService,
    private readonly tokenBlacklist: TokenBlacklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get("JWT_ACCESS_SECRET", { infer: true }),
      issuer: config.get("JWT_ISSUER", { infer: true }),
    });
  }

  async validate(payload: AccessTokenPayload): Promise<AuthenticatedUser> {
    const blacklisted = await this.tokenBlacklist.isBlacklisted(payload.sid);
    if (blacklisted) {
      throw new UnauthorizedException("Session revoquee, merci de te reconnecter");
    }

    // Re-verification en base (isActive + roles a jour) : evite qu'un compte
    // desactive ou un role retire reste exploitable jusqu'a expiration du token.
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Compte inactif ou introuvable");
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      roles: user.roles,
    };
  }
}
