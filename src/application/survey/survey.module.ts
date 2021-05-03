import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SurveyAnswer, SurveyAnswerModel } from "src/model/survey-answer.model";
import { SurveyQuestion, SurveyQuestionModel } from "src/model/survey-question.model";
import { Survey, SurveyModel } from "src/model/survey.model";
import { AuthenticationModule } from "../authentication/authentication.module";
import { SurveyResolver } from "./survey.resolver";
import { SurveyService } from "./survey.service";

@Module({
  imports: [
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
    SurveyService, SurveyResolver
  ]
})
export class SurveyModule {}
