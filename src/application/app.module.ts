import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { MongooseModule } from '@nestjs/mongoose';
import { join } from 'path';
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
      introspection: true
    }),
    MongooseModule.forRootAsync({
      useFactory: (env: ConfigService) => ({
        uri: env.get<string>('MONGODB_URI'),
        useFindAndModify: true,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true
      }),
      inject: [ConfigService]
    }),
    AuthenticationModule, UserModule, RoleModule, UnitModule, SurveyModule,
    SurveyAnswerModule, SurveyQuestionModule
  ],
})
export class AppModule {}
