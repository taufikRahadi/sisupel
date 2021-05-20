import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './application/app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // logger: false
  });

  app.useGlobalPipes(new ValidationPipe({
    exceptionFactory: (errors: ValidationError[]) => {
      const messages = errors.map(error => Object.values(error.constraints));
      throw new BadRequestException(messages.join(", "));
    }
  }));

  await app.listen(process.env.PORT);
  console.log(`application is running on port ${process.env.PORT}`)
}
bootstrap();
