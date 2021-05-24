import { InternalServerErrorException, UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { InjectModel } from "@nestjs/mongoose";
import { PrivilegesGuard } from "src/infrastructure/privileges.guard";
import { UserGuard } from "src/infrastructure/user.guard";
import { Survey } from "src/model/survey.model";
import { User } from "src/model/user.model";
import { IsAllowTo } from "src/utils/decorators/privileges.decorator";
import { SurveyService } from "./survey.service";
import { CalculateAverage, CreateSurveyPayload, SurveyResponse } from "./survey.type";

@Resolver(of => SurveyResponse)
export class SurveyResolver {

  constructor(
    private readonly surveyService: SurveyService,
  ) {}

  @Mutation(returns => Boolean)
  @UseGuards(UserGuard, PrivilegesGuard)
  @IsAllowTo('create-survey')
  async createSurvey(
    @Args() payload: CreateSurveyPayload,
    @Context('user') { _id }: User
  ): Promise<Boolean> {
    try {
      const newSurvey = await this.surveyService.create({ 
        body: payload.body,
        user: _id 
      })

      return true
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

  @Query(returns => [Survey])
  @UseGuards(UserGuard, PrivilegesGuard)
  @IsAllowTo('read-self-survey')
  async getMySurvey(
    @Args('limit', { type: () => Number, nullable: true }) limit: number,
    @Context('user') { _id }: User
  ) {
    const surveys = await this.surveyService.getMySurvey(_id, limit)
  }

  @Query(returns => CalculateAverage)
  @UseGuards(UserGuard, PrivilegesGuard)
  @IsAllowTo('calculate-self-survey')
  async calculateSelfSurvey(
    @Context('user') { _id }: User
  ) {

    return await this.surveyService.calculateAverage(_id)
  }

}
