import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { createHash, randomBytes } from "node:crypto";
import { nanoid } from "nanoid";
import type { AccessTokenPayload, LoginInput, RegisterInput, Role } from "@csc/shared";
import { PrismaService } from "../../prisma/prisma.service";
import type { EnvConfig } from "../../config/env.validation";
import { AuditLogService } from "../audit-log/audit-log.service";
import { TokenBlacklistService } from "./token-blacklist.service";

// Parametres Argon2id recommandes par la checklist securite (>= 64MB memoire).
const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 65_536, // 64 MB
  timeCost: 3,
  parallelism: 4,
};

export interface SessionMeta {
  ip?: string;
  userAgent?: string;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string; // valeur brute, a poser en cookie HttpOnly par le controller
  refreshTokenExpiresAt: Date;
}

@Injectable()
export class AuthService {
  private readonly accessTtl: string;
  private readonly refreshTtlMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<EnvConfig, true>,
    private readonly auditLog: AuditLogService,
    private readonly tokenBlacklist: TokenBlacklistService,
  ) {
    this.accessTtl = this.config.get("JWT_ACCESS_TTL", { infer: true });
    this.refreshTtlMs = this.parseDurationToMs(this.config.get("JWT_REFRESH_TTL", { infer: true }));
  }

  async register(input: RegisterInput, meta: SessionMeta): Promise<IssuedTokens> {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      // Message volontairement generique : ne pas confirmer/infirmer l'existence
      // d'un compte a un attaquant (enumeration d'utilisateurs).
      throw new ConflictException("Impossible de creer ce compte avec ces informations");
    }

    const passwordHash = await argon2.hash(input.password, ARGON2_OPTIONS);
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        displayName: input.displayName,
        roles: ["member"],
      },
    });

    await this.auditLog.record({
      actorId: user.id,
      action: "user.register",
      resource: "user",
      resourceId: user.id,
      ipAddress: meta.ip,
    });

    return this.issueTokens(user.id, user.roles, meta);
  }

  async validateCredentials(input: LoginInput): Promise<{ id: string; roles: Role[] }> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });

    // Timing-safe-ish : on verifie toujours un hash (dummy si user introuvable)
    // pour eviter qu'un attaquant deduise l'existence d'un compte par le temps
    // de reponse (cf OWASP - user enumeration via timing attack).
    const hashToVerify = user?.passwordHash ?? (await this.dummyHash());
    const isValid = await argon2.verify(hashToVerify, input.password).catch(() => false);

    if (!user || !isValid || !user.isActive) {
      throw new UnauthorizedException("Identifiants invalides");
    }

    return { id: user.id, roles: user.roles };
  }

  async login(userId: string, roles: Role[], meta: SessionMeta): Promise<IssuedTokens> {
    await this.prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
    await this.auditLog.record({ actorId: userId, action: "user.login", resource: "user", resourceId: userId, ipAddress: meta.ip });
    return this.issueTokens(userId, roles, meta);
  }

  /**
   * Rotation du refresh token (best practice) : chaque refresh invalide
   * l'ancien token et en emet un nouveau. Permet de detecter le rejeu d'un
   * token vole (s'il est presente une 2e fois, il a deja ete revoque -> alerte).
   */
  async refresh(rawRefreshToken: string, meta: SessionMeta): Promise<IssuedTokens> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      if (stored?.revokedAt) {
        // Rejeu d'un token deja revoque = signal fort de compromission -> on
        // revoque toutes les sessions de l'utilisateur par precaution.
        await this.revokeAllSessions(stored.userId, "refresh_token_reuse_detected");
      }
      throw new UnauthorizedException("Session invalide, merci de te reconnecter");
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(stored.userId, stored.user.roles, meta);
  }

  async logout(rawRefreshToken: string, sessionId: string, accessTokenExpiresAt: number): Promise<void> {
    const tokenHash = this.hashToken(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });

    const ttlSeconds = Math.max(0, Math.floor(accessTokenExpiresAt - Date.now() / 1000));
    await this.tokenBlacklist.blacklist(sessionId, ttlSeconds);
  }

  async revokeAllSessions(userId: string, reason: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.auditLog.record({ actorId: userId, action: `auth.sessions_revoked:${reason}`, resource: "user", resourceId: userId });
  }

  private async issueTokens(userId: string, roles: Role[], meta: SessionMeta): Promise<IssuedTokens> {
    const sessionId = nanoid();
    const payload: AccessTokenPayload = { sub: userId, roles, sid: sessionId };
    const accessToken = await this.jwtService.signAsync(payload, { expiresIn: this.accessTtl });

    const rawRefreshToken = randomBytes(64).toString("hex");
    const refreshTokenExpiresAt = new Date(Date.now() + this.refreshTtlMs);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(rawRefreshToken),
        sessionId,
        expiresAt: refreshTokenExpiresAt,
        createdByIp: meta.ip,
        userAgent: meta.userAgent,
      },
    });

    return { accessToken, refreshToken: rawRefreshToken, refreshTokenExpiresAt };
  }

  private hashToken(raw: string): string {
    // sha256 suffit ici (pas un mot de passe a faible entropie) : le token
    // brut fait 64 octets aleatoires, la resistance a la brute force vient de
    // son entropie, pas du cout du hachage.
    return createHash("sha256").update(raw).digest("hex");
  }

  private async dummyHash(): Promise<string> {
    // Hash fixe precalcule pour egaliser le temps de reponse quand l'utilisateur
    // n'existe pas (evite l'enumeration de comptes par timing attack).
    return argon2.hash("dummy-password-for-timing-safety", ARGON2_OPTIONS);
  }

  private parseDurationToMs(duration: string): number {
    const match = /^(\d+)(ms|s|m|h|d)$/.exec(duration);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // fallback 7j
    const value = Number(match[1]);
    const unit = match[2] as string;
    const factors: Record<string, number> = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    return value * factors[unit]!;
  }
}
