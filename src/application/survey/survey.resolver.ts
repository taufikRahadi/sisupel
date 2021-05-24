import { InternalServerErrorException, UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { PrivilegesGuard } from "src/infrastructure/privileges.guard";
import { UserGuard } from "src/infrastructure/user.guard";
import { User } from "src/model/user.model";
import { IsAllowTo } from "src/utils/decorators/privileges.decorator";
import { SurveyService } from "./survey.service";
import { CalculateAverage, CalculateAverageUnit, CreateSurveyPayload } from "./survey.type";

@Resolver()
export class SurveyResolver {

  constructor(
    private readonly surveyService: SurveyService
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

  @Query(returns => CalculateAverage)
  @UseGuards(UserGuard, PrivilegesGuard)
  @IsAllowTo('calculate-self-survey')
  async calculateSelfSurvey(
    @Context('user') { _id }: User
  ) {
    return await this.surveyService.calculateAverage(_id)
  }

  @Query(returns => CalculateAverageUnit)
  @UseGuards(UserGuard, PrivilegesGuard)
  @IsAllowTo('calculate-unit-survey')
  async calculateUnitSurvey(
    @Context('user') { _id } : User,
    @Args('unit', { type: () => String }) unit: string,
  ) {
    try {
      return this.surveyService.calculateAverageUnit(_id, unit);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  @Query(returns => CalculateAverage)
  @UseGuards(UserGuard, PrivilegesGuard)
  @IsAllowTo('calculate-global-survey')
  async calculateGlobalSurvey() {
    try {
      return this.surveyService.calculateAverageGlobal();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

}
