import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@csc/shared";
import type { EnvConfig } from "../../config/env.validation";
import { Public } from "../../common/decorators/public.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuthService, type IssuedTokens } from "./auth.service";

/**
 * Toutes les routes d'auth sont @Public() (pas de JWT requis pour se
 * connecter, evidemment) mais restent soumises au rate limiting global ET
 * a une limite specifique et plus stricte sur /login (brute force protection,
 * checklist "Rate limiting differencie par endpoint": Login 5/min).
 */
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  @Public()
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body(new ZodValidationPipe(registerSchema)) body: RegisterInput,
    @Ip() ip: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.register(body, { ip, userAgent: req.headers["user-agent"] });
    return this.respondWithTokens(tokens, res);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
    @Ip() ip: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { id, roles } = await this.authService.validateCredentials(body);
    const tokens = await this.authService.login(id, roles, { ip, userAgent: req.headers["user-agent"] });
    return this.respondWithTokens(tokens, res);
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Ip() ip: string, @Res({ passthrough: true }) res: Response) {
    const cookieName = this.config.get("REFRESH_COOKIE_NAME", { infer: true });
    const rawRefreshToken = req.cookies?.[cookieName] as string | undefined;
    if (!rawRefreshToken) throw new UnauthorizedException("Refresh token manquant");

    const tokens = await this.authService.refresh(rawRefreshToken, {
      ip,
      userAgent: req.headers["user-agent"],
    });
    return this.respondWithTokens(tokens, res);
  }

  @Public()
  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookieName = this.config.get("REFRESH_COOKIE_NAME", { infer: true });
    const rawRefreshToken = req.cookies?.[cookieName] as string | undefined;

    if (rawRefreshToken) {
      // sessionId/expiration extraits du token present dans l'Authorization
      // header seraient plus precis ; pour rester simple ici on blackliste
      // via le service qui recalcule a partir du refresh token stocke.
      const authHeader = req.headers.authorization;
      const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
      const decoded = accessToken ? decodeJwtPayloadUnsafe(accessToken) : undefined;
      if (decoded) {
        await this.authService.logout(rawRefreshToken, decoded.sid, decoded.exp);
      }
    }

    res.clearCookie(cookieName, { path: "/auth" });
  }

  private respondWithTokens(tokens: IssuedTokens, res: Response) {
    const cookieName = this.config.get("REFRESH_COOKIE_NAME", { infer: true });
    const isProd = this.config.get("NODE_ENV", { infer: true }) === "production";

    // Refresh token : cookie HttpOnly + Secure + SameSite=Strict (checklist
    // Auth). Jamais accessible en JS -> protege contre le vol par XSS.
    res.cookie(cookieName, tokens.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
      domain: this.config.get("COOKIE_DOMAIN", { infer: true }),
      path: "/auth",
      expires: tokens.refreshTokenExpiresAt,
    });

    // Access token retourne dans le body : le frontend le garde en memoire
    // (jamais en localStorage) - voir apps/web/src/lib/auth.ts.
    return { accessToken: tokens.accessToken };
  }
}

/** Decodage non-verifie du payload JWT, utilise uniquement pour recuperer sid/exp au logout. */
function decodeJwtPayloadUnsafe(token: string): { sid: string; exp: number } | undefined {
  try {
    const [, payloadB64] = token.split(".");
    if (!payloadB64) return undefined;
    const json = Buffer.from(payloadB64, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as { sid: string; exp: number };
    return parsed;
  } catch {
    return undefined;
  }
}
