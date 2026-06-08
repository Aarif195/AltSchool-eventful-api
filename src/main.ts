import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Set Global API Versioning Prefix
  app.setGlobalPrefix('api/v1', {
  exclude: ['/'], 
});

  // Global Request Validation Engine
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Dynamic CORS Configuration
  const configService = app.get(ConfigService);
  const origins = configService.get<string>('ALLOWED_ORIGINS', '');
  const originArray = origins.split(',').map(o => o.trim());

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || originArray.includes(origin) || originArray.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('Eventful API')
    .setDescription('Event Management API for AltSchool Africa')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      filter: true,
      displayRequestDuration: true,
    },
  });

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);

  console.log(`Swagger docs available at: http://localhost:${port}/api/docs`);


}
bootstrap();
