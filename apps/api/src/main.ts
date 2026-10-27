import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

// Pas de CORS : seul le serveur Next.js (Vercel) appelle cette API.
NestFactory.create(AppModule).then((app) => app.listen(process.env.PORT || 3001, "0.0.0.0"));
