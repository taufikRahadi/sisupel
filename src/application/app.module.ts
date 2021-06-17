import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { MongooseModule } from '@nestjs/mongoose';
import { join } from 'path';
import { Upload } from 'src/utils/types/upload.scalar';
import { AuthenticationModule } from './authentication/authentication.module';
import { RoleModule } from './role/role.module';
import { SurveyAnswerModule } from './survey-answer/survey-answer.module';
import { SurveyQuestionModule } from './survey-question/survey-question.module';
import { SurveyModule } from './survey/survey.module';
import { UnitModule } from './unit/unit.module';
import { UserModule } from './user/user.module';
import { HandlebarsAdapter } from "@nestjs-modules/mailer/dist/adapters/handlebars.adapter";

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: (env: ConfigService) => ({
        transport: {
          host: env.get<string>('SMTP_HOST'),
          port: env.get<number>('SMTP_PORT'),
          secure: false, // true for 465, false for other ports
          auth: {
            user: env.get<string>('SMTP_AUTH_USERNAME'), // generated ethereal user
            pass: env.get<string>('SMTP_AUTH_PASS') // generated ethereal password
          }
        },
        template: {
          dir: join(process.cwd(), 'src/resources/email-template'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true
          }
        }
      }),
      inject: [ConfigService]
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    GraphQLModule.forRoot({
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      debug: false,
      context: ({ req }) => ({ headers: req.headers }),
      playground: true,
      introspection: true,
      uploads: true,
      cors: "*"
    }),
    MongooseModule.forRootAsync({
      useFactory: (env: ConfigService) => ({
        uri: env.get<string>('MONGODB_URI'),
        useFindAndModify: true,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
      }),
      inject: [ConfigService]
    }),
    AuthenticationModule, UserModule, RoleModule, UnitModule, SurveyModule,
    SurveyAnswerModule, SurveyQuestionModule, Upload
  ],
})
export class AppModule {}
