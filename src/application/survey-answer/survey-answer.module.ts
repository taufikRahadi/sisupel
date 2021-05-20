import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SurveyAnswer, SurveyAnswerModel } from "src/model/survey-answer.model";
import { AuthenticationModule } from "../authentication/authentication.module";
import { SurveyAnswerResolver } from "./survey-answer.resolver";

@Module({
  imports: [
    AuthenticationModule.use(),
    MongooseModule.forFeature([
      {
        name: SurveyAnswer.name,
        schema: SurveyAnswerModel
      }
    ])
  ],
  providers: [
    SurveyAnswerResolver
  ]
})
export class SurveyAnswerModule {}
