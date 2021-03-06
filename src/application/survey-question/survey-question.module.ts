import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SurveyQuestion, SurveyQuestionModel } from "src/model/survey-question.model";
import { Survey, SurveyModel } from "src/model/survey.model";
import { AuthenticationModule } from "../authentication/authentication.module";
import { SurveyQuestionResolver } from "./survey-question.resolver";

@Module({
  imports: [
    AuthenticationModule.use(),
    MongooseModule.forFeature([
      {
        name: SurveyQuestion.name,
        schema: SurveyQuestionModel
      },
      {
        name: Survey.name,
        schema: SurveyModel
      }
    ])
  ],
  providers: [
    SurveyQuestionResolver
  ]
})
export class SurveyQuestionModule {}
