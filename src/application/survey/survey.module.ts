import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { RedisModule, RedisModuleOptions } from "nestjs-redis";
import { SurveyAnswer, SurveyAnswerModel } from "src/model/survey-answer.model";
import { SurveyQuestion, SurveyQuestionModel } from "src/model/survey-question.model";
import { Survey, SurveyModel } from "src/model/survey.model";
import { AuthenticationModule } from "../authentication/authentication.module";
import { SurveyBodyResolver, SurveyResolver } from "./survey.resolver";
import { SurveyService } from "./survey.service";

@Module({
  imports: [
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (env: ConfigService): Promise<RedisModuleOptions> => ({
        host: env.get<string>('REDIS_HOST'),
        port: env.get<number>('REDIS_PORT')
      })
    }),
    AuthenticationModule.use(),
    MongooseModule.forFeature([
      {
        name: Survey.name,
        schema: SurveyModel,
      },
      {
        name: SurveyQuestion.name,
        schema: SurveyQuestionModel
      },
      {
        name: SurveyAnswer.name,
        schema: SurveyAnswerModel
      }
    ])
  ],
  providers: [
    SurveyService, SurveyResolver, SurveyBodyResolver
  ]
})
export class SurveyModule {}
