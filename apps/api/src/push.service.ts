import { Injectable } from "@nestjs/common";
import webpush from "web-push";
import { PrismaService } from "./prisma.service";

@Injectable()
export class PushService {
  private ready = false;
  constructor(private db: PrismaService) {}

  private init() {
    if (this.ready) return true;
    const pub = process.env.VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
    if (!pub || !priv) return false;
    webpush.setVapidDetails(`mailto:${process.env.VAPID_CONTACT || "contact@khidmatulkhadim.local"}`, pub, priv);
    return (this.ready = true);
  }

  // Canal unique d'envoi : brancher WhatsApp Business ici plus tard
  async notify(members: { id: string; pushSub: string | null }[], title: string, body: string) {
    if (!this.init()) return 0;
    let sent = 0;
    for (const m of members) {
      if (!m.pushSub) continue;
      try {
        await webpush.sendNotification(JSON.parse(m.pushSub), JSON.stringify({ title, body }));
        sent++;
      } catch (e: any) {
        if (e.statusCode === 404 || e.statusCode === 410) await this.db.member.update({ where: { id: m.id }, data: { pushSub: null } });
      }
    }
    return sent;
  }
}
