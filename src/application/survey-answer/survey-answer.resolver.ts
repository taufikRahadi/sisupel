import { InternalServerErrorException, UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { PrivilegesGuard } from "src/infrastructure/privileges.guard";
import { UserGuard } from "src/infrastructure/user.guard";
import { SurveyAnswer, SurveyAnswerDocument } from "src/model/survey-answer.model";
import { User } from "src/model/user.model";
import { IsAllowTo } from "src/utils/decorators/privileges.decorator";
import { CreateSurveyAnswerPayload } from "./survey-answer.type";

@Resolver(of => SurveyAnswer)
export class SurveyAnswerResolver {

  constructor(
    @InjectModel(SurveyAnswer.name) private readonly surveyAnswerModel: Model<SurveyAnswerDocument>
  ) {}

  @Mutation(returns => Boolean)
  @UseGuards(UserGuard, PrivilegesGuard)
  @IsAllowTo('create-answer')
  async createAnswer(
    @Args() payload: CreateSurveyAnswerPayload,
    @Context('user') { _id }: User
  ) {
    try {
      await this.surveyAnswerModel.create({ ...payload, lastModifiedBy: _id })
      return true
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

}
