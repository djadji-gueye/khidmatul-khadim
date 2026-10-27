import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AdminGuard, AuthGuard, Me } from "./auth";
import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private s: AppService) {}

  @Get("health") health() { return { ok: true }; }
  @Get("auth/join/:token") join(@Param("token") t: string) { return this.s.join(t); }

  @UseGuards(AuthGuard) @Get("me") me(@Me() m: any) { return { id: m.id, name: m.name, isAdmin: m.isAdmin }; }
  @UseGuards(AuthGuard) @Get("cycle") cycle(@Me() m: any) { return this.s.cycle(m.id); }
  @UseGuards(AuthGuard) @Patch("statuses/:id") setStatus(@Me() m: any, @Param("id") id: string, @Body() b: any) { return this.s.setStatus(m.id, id, b.state, b.excuse); }
  @UseGuards(AuthGuard) @Post("push") push(@Me() m: any, @Body() sub: object) { return this.s.savePush(m.id, sub); }
}

@UseGuards(AdminGuard)
@Controller("admin")
export class AdminController {
  constructor(private s: AppService) {}

  @Get("overview") overview() { return this.s.overview(); }
  @Get("members") members() { return this.s.members(); }
  @Post("members") addMember(@Body() b: any) { return this.s.addMember(b.name, b.phone, b.isAdmin); }
  @Post("cycles") openCycle(@Body() b: any) { return this.s.openCycle(b.message); }
  @Post("remind") remind(@Body() b: any) { return this.s.remind(b.message); }
  @Post("assignments") assign(@Body() b: any) { return this.s.assign(Number(b.juz), b.memberId); }
  @Patch("members/:id") editMember(@Param("id") id: string, @Body() b: any) { return this.s.editMember(id, b); }
  @Patch("statuses/:id") adminStatus(@Param("id") id: string, @Body() b: any) { return this.s.adminSetStatus(id, b.state, b.excuse); }
  @Post("members/:id/deactivate") deactivate(@Me() m: any, @Param("id") id: string, @Body() b: any) { return this.s.deactivateMember(m.id, id, b?.giveTo); }
  @Post("members/:id/reactivate") reactivate(@Param("id") id: string) { return this.s.reactivateMember(id); }
  @Post("reset") reset() { return this.s.resetCycle(); }
}
