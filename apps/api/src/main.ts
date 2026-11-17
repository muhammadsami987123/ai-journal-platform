import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module.js";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter.js";
import { ResponseEnvelopeInterceptor } from "./common/interceptors/response-envelope.interceptor.js";
import { requestIdMiddleware } from "./common/middleware/request-id.middleware.js";
import { env, isProduction } from "./config/env.js";

async function bootstrap(): Promise<void> {
  const logger = new Logger("Bootstrap");

  // bodyParser: false — @thallesp/nestjs-better-auth re-adds JSON parsers so
  // Better Auth can read the raw body on its own routes.
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.setGlobalPrefix("api");
  app.use(requestIdMiddleware);
  app.use(cookieParser());

  app.enableCors({
    origin: env.trustedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["content-type", "authorization", "x-request-id"],
    exposedHeaders: ["x-request-id"],
    maxAge: 600
  });

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
  app.enableShutdownHooks();

  if (!isProduction) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle("AI Journal API")
        .setDescription("Journal, AI and voice endpoints.")
        .setVersion("1.0")
        .addCookieAuth("better-auth.session_token")
        .build(),
      { ignoreGlobalPrefix: false }
    );
    SwaggerModule.setup("api/docs", app, document);
  }

  await app.listen(env.API_PORT);
  logger.log(`API listening on http://localhost:${env.API_PORT}/api`);
  if (!isProduction) logger.log(`API docs at http://localhost:${env.API_PORT}/api/docs`);
}

void bootstrap();
