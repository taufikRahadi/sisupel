import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthenticationModule } from "../authentication/authentication.module";
import { SurveyResolver } from "./survey.resolver";
import { SurveyService } from "./survey.service";

@Module({
  imports: [
    AuthenticationModule.use(),
    MongooseModule.forFeature([

    ])
  ],
  providers: [
    SurveyService, SurveyResolver
  ]
})
export class SurveyModule {}
