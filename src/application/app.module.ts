import { BullModule } from '@nestjs/bull';
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

@Module({
  imports: [
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
      uploads: true
    }),
    MongooseModule.forRootAsync({
      useFactory: (env: ConfigService) => ({
        uri: env.get<string>('MONGODB_URI'),
        useFindAndModify: true,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        loggerLevel: 'debug'
      }),
      inject: [ConfigService]
    }),
    AuthenticationModule, UserModule, RoleModule, UnitModule, SurveyModule,
    SurveyAnswerModule, SurveyQuestionModule, Upload
  ],
})
export class AppModule {}
