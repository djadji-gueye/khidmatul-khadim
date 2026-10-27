import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { PushService } from "./push.service";

// Dimanche 18h00 (Dakar = UTC)
function nextDeadline() {
  const d = new Date();
  d.setUTCHours(18, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + ((7 - d.getUTCDay()) % 7));
  if (d < new Date()) d.setUTCDate(d.getUTCDate() + 7);
  return d;
}

@Injectable()
export class AppService {
  constructor(private db: PrismaService, private push: PushService) {}

  async join(token: string) {
    if (!(await this.db.member.findUnique({ where: { inviteToken: token } }))) throw new NotFoundException();
    return { ok: true };
  }

  // Dernier cycle ; clôture automatique (sans cron) quand la deadline est passée
  private async latest() {
    const cycle = await this.db.cycle.findFirst({ orderBy: { openedAt: "desc" } });
    if (!cycle) return { cycle: null, open: false };
    const open = !cycle.closedAt && cycle.deadline > new Date();
    if (!open && !cycle.closedAt) await this.db.cycle.update({ where: { id: cycle.id }, data: { closedAt: cycle.deadline } });
    return { cycle, open };
  }
  private openNow() {
    return this.db.cycle.findFirst({ where: { closedAt: null, deadline: { gt: new Date() } }, orderBy: { openedAt: "desc" } });
  }

  async cycle(memberId: string) {
    const { cycle, open } = await this.latest();
    if (!cycle) return { cycle: null, open, cells: Array(30).fill("NONE"), mine: [] };
    const all = await this.db.status.findMany({ where: { cycleId: cycle.id }, include: { assignment: true } });
    return {
      cycle: { message: cycle.message, deadline: cycle.deadline },
      open,
      cells: Array.from({ length: 30 }, (_, i) => all.find((s) => s.assignment.juz === i + 1)?.state || "NONE"),
      mine: all
        .filter((s) => s.assignment.memberId === memberId)
        .map((s) => ({ id: s.id, juz: s.assignment.juz, state: s.state, excuse: s.excuse }))
        .sort((a, b) => a.juz - b.juz),
    };
  }

  private async applyStatus(id: string, state: string, excuse?: string) {
    await this.db.status.update({
      where: { id },
      data: { state, excuse: state === "EXCUSED" ? (excuse || "").trim() || null : null, doneAt: state === "DONE" ? new Date() : null },
    });
    return { ok: true };
  }

  async setStatus(memberId: string, id: string, state: string, excuse?: string) {
    if (!["DONE", "EXCUSED", "PENDING"].includes(state)) throw new BadRequestException();
    const s = await this.db.status.findUnique({ where: { id }, include: { assignment: true, cycle: true } });
    if (!s) throw new NotFoundException();
    if (s.assignment.memberId !== memberId) throw new ForbiddenException();
    if (s.cycle.closedAt || s.cycle.deadline < new Date()) throw new ForbiddenException("Semaine clôturée");
    return this.applyStatus(id, state, excuse);
  }

  // Admin : terminer / excuser / réinitialiser le juz de n'importe quel membre
  async adminSetStatus(id: string, state: string, excuse?: string) {
    if (!["DONE", "EXCUSED", "PENDING"].includes(state)) throw new BadRequestException();
    if (!(await this.db.status.findUnique({ where: { id } }))) throw new NotFoundException();
    return this.applyStatus(id, state, excuse);
  }

  // Admin : remet tous les juz de la semaine ouverte en attente
  async resetCycle() {
    const c = await this.openNow();
    if (!c) return { ok: true, count: 0 };
    const r = await this.db.status.updateMany({ where: { cycleId: c.id }, data: { state: "PENDING", excuse: null, doneAt: null } });
    return { ok: true, count: r.count };
  }

  async savePush(memberId: string, sub: object) {
    await this.db.member.update({ where: { id: memberId }, data: { pushSub: JSON.stringify(sub) } });
    return { ok: true };
  }

  // ---------- admin ----------
  async overview() {
    const { cycle, open } = await this.latest();
    const rows = cycle
      ? await this.db.status.findMany({
          where: { cycleId: cycle.id },
          include: { assignment: { include: { member: { select: { id: true, name: true, phone: true } } } } },
          orderBy: { assignment: { juz: "asc" } },
        })
      : [];
    return { cycle: cycle && { message: cycle.message, deadline: cycle.deadline }, open, rows };
  }

  members() {
    return this.db.member.findMany({
      select: { id: true, name: true, phone: true, isAdmin: true, inviteToken: true, assignments: { select: { juz: true } } },
      orderBy: { name: "asc" },
    });
  }

  async addMember(name: string, phone: string, isAdmin: boolean) {
    if (!name?.trim()) throw new BadRequestException("Nom requis");
    const member = await this.db.member.create({
      data: { name: name.trim(), phone: phone?.trim() || null, isAdmin: !!isAdmin },
      select: { id: true, name: true, phone: true, isAdmin: true, inviteToken: true, assignments: { select: { juz: true } } },
    });
    return { ok: true, member };
  }

  async editMember(id: string, b: { name?: string; phone?: string; isAdmin?: boolean }) {
    const data: { name?: string; phone?: string | null; isAdmin?: boolean } = {};
    if (b.name !== undefined) {
      if (!String(b.name).trim()) throw new BadRequestException("Nom requis");
      data.name = String(b.name).trim();
    }
    if (b.phone !== undefined) data.phone = String(b.phone).trim() || null;
    if (b.isAdmin !== undefined) {
      data.isAdmin = !!b.isAdmin;
      if (!data.isAdmin && !(await this.db.member.count({ where: { isAdmin: true, id: { not: id } } }))) throw new BadRequestException("Il faut au moins un admin");
    }
    if (!(await this.db.member.findUnique({ where: { id } }))) throw new NotFoundException();
    await this.db.member.update({ where: { id }, data });
    return { ok: true };
  }

  async openCycle(message?: string) {
    const text = message?.trim() || "La semaine est ouverte, bonne lecture.";
    await this.db.cycle.updateMany({ where: { closedAt: null }, data: { closedAt: new Date() } });
    const cycle = await this.db.cycle.create({ data: { message: text, deadline: nextDeadline() } });
    const as = await this.db.assignment.findMany();
    await this.db.status.createMany({ data: as.map((a) => ({ cycleId: cycle.id, assignmentId: a.id })) });
    const sent = await this.push.notify(await this.db.member.findMany(), "Khidmatul Khadim", text);
    return { ok: true, sent };
  }

  async remind(message?: string) {
    const c = await this.openNow();
    if (!c) return { ok: true, sent: 0 };
    const pending = await this.db.member.findMany({ where: { assignments: { some: { statuses: { some: { cycleId: c.id, state: "PENDING" } } } } } });
    const sent = await this.push.notify(pending, "Rappel", message?.trim() || "Pense à signaler ta lecture avant dimanche 18h.");
    return { ok: true, sent };
  }

  async assign(juz: number, memberId: string) {
    if (!(juz >= 1 && juz <= 30) || !memberId) throw new BadRequestException();
    const prev = await this.db.assignment.findUnique({ where: { juz } });
    const a = await this.db.assignment.upsert({ where: { juz }, update: { memberId }, create: { juz, memberId } });
    const c = await this.openNow();
    if (c) {
      const changed = !!prev && prev.memberId !== memberId;
      await this.db.status.upsert({
        where: { cycleId_assignmentId: { cycleId: c.id, assignmentId: a.id } },
        update: changed ? { state: "PENDING", excuse: null, doneAt: null } : {},
        create: { cycleId: c.id, assignmentId: a.id },
      });
    }
    return { ok: true };
  }
}
