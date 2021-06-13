import { BadRequestException, Logger, ValidationError, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { graphqlUploadExpress } from 'graphql-upload';
import { AppModule } from './application/app.module';

const logger = new Logger("Main Application")

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

  app.useStaticAssets('public')

  await app.listen(process.env.PORT);
  logger.log(`application is running on port ${process.env.PORT}`)
}
bootstrap();
