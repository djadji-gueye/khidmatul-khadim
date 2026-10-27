import { Module } from "@nestjs/common";
import { AdminController, AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthGuard, AdminGuard } from "./auth";
import { PrismaService } from "./prisma.service";
import { PushService } from "./push.service";

@Module({
  controllers: [AppController, AdminController],
  providers: [PrismaService, PushService, AppService, AuthGuard, AdminGuard],
})
export class AppModule {}
