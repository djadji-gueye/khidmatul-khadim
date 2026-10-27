import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException, createParamDecorator } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

// Le jeton d'invitation du membre sert de Bearer (comme l'ancien cookie).
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(protected db: PrismaService) {}
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const t = String(req.headers.authorization || "").replace(/^Bearer /, "");
    const m = t ? await this.db.member.findUnique({ where: { inviteToken: t } }) : null;
    if (!m) throw new UnauthorizedException();
    req.member = m;
    return true;
  }
}

@Injectable()
export class AdminGuard extends AuthGuard {
  async canActivate(ctx: ExecutionContext) {
    await super.canActivate(ctx);
    if (!ctx.switchToHttp().getRequest().member.isAdmin) throw new ForbiddenException();
    return true;
  }
}

export const Me = createParamDecorator((_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().member);
