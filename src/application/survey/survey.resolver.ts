import { InternalServerErrorException, UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Parent, Query, ResolveField, Resolver } from "@nestjs/graphql";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { PrivilegesGuard } from "src/infrastructure/privileges.guard";
import { UserGuard } from "src/infrastructure/user.guard";
import { SurveyAnswer, SurveyAnswerDocument } from "src/model/survey-answer.model";
import { SurveyQuestion, SurveyQuestionDocument, SurveyQuestionModel } from "src/model/survey-question.model";
import { Survey } from "src/model/survey.model";
import { User } from "src/model/user.model";
import { IsAllowTo } from "src/utils/decorators/privileges.decorator";
import { DateRange } from "src/utils/types/date-range.type";
import { Sort } from "src/utils/types/sort.enum";
import { AuthenticationResolver } from "../authentication/authentication.resolver";
import { UserService } from "../user/user.service";
import { SurveyService } from "./survey.service";
import { CalculateAverage, CreateSurveyPayload, SurveyResponse, CalculateAverageUnitGlobal, CalculateEssayResponse, SurveyBodyResponse, AverageType, SortByEnum } from "./survey.type";

@Resolver(of => SurveyResponse)
export class SurveyResolver {

  constructor(
    private readonly surveyService: SurveyService,
    private readonly userService: UserService
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

  @Query(returns => [SurveyResponse])
  @UseGuards(UserGuard, PrivilegesGuard)
  // @IsAllowTo('read-self-survey')
  async getMySurvey(
    @Args('limit', { type: () => Number, nullable: true }) limit: number,
    @Context('user') { _id, unit }: User,
    @Args('range', { type: () => DateRange, nullable: false }) range: DateRange,
    @Args('sort', { type: () => Sort, defaultValue: Sort['asc'] }) sort: Sort
  ) {
    const surveys = await this.surveyService.getMySurvey(_id, Sort[sort], limit, range)
    return surveys
  }

  @Query(returns => CalculateEssayResponse)
  @UseGuards(UserGuard, PrivilegesGuard)
  // @IsAllowTo('calculate-unit-survey')
  async calculateEssayGlobal() {
    return await this.surveyService.calculateEssayGlobal()
  }

  @Query(returns => CalculateEssayResponse)
  @UseGuards(UserGuard, PrivilegesGuard)
  async calculateEssayUnit() {
    
  }

  @Query(returns => CalculateAverage)
  @UseGuards(UserGuard, PrivilegesGuard)
  @IsAllowTo('calculate-self-survey')
  async calculateSelfSurvey(
    @Context('user') { _id }: User
  ) {

    return await this.surveyService.calculateAverage(_id)
  }

  @Query(returns => CalculateAverageUnitGlobal)
  @UseGuards(UserGuard, PrivilegesGuard)
  @IsAllowTo('calculate-unit-survey')
  async calculateUnitSurvey(
    @Context('user') { _id } : User,
    @Args('unit', { type: () => String }) unit: string,
    @Args('all', { type: () => Boolean, defaultValue: false }) all: boolean,
  ) {
    try {
      return this.surveyService.calculateAverageUnit(_id, unit, all);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  @Query(returns => CalculateAverageUnitGlobal)
  @UseGuards(UserGuard, PrivilegesGuard)
  @IsAllowTo('calculate-global-survey')
  async calculateGlobalSurvey(
    @Args('all', { type: () => Boolean, defaultValue: false }) all: boolean,
  ) {
    try {
      return this.surveyService.calculateAverageGlobal(all);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  @ResolveField('user', returns => User, { nullable: false })
  async getUser(@Parent() { user }: SurveyResponse) {
    return await this.userService.findById(user)
  }

  @Query(returns => AverageType)
  @UseGuards(UserGuard, PrivilegesGuard)
  @IsAllowTo('calculate-global-survey')
  async getBestFrontDeskScores(
    @Args('sortBy', { type: () => SortByEnum, defaultValue: 0 }) sortBy: SortByEnum,
  ) {
    try {
      const data: AverageType = await this.surveyService.getBestFrontDeskScores(sortBy);
    
      return data
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

}

@Resolver(of => SurveyBodyResponse)
export class SurveyBodyResolver {

  constructor(
    @InjectModel(SurveyQuestion.name) private readonly questionModel: Model<SurveyQuestionDocument>,
    @InjectModel(SurveyAnswer.name) private readonly answerModel: Model<SurveyAnswerDocument>
  ) {}

  @ResolveField('question', returns => SurveyQuestion, { nullable: false })
  async getQuestion(@Parent() { question }: SurveyBodyResponse) {
    return await this.questionModel.findById(question)
  }

  @ResolveField('answer', returns => SurveyAnswer, { nullable: false })
  async getAnswer(@Parent() { answer }: SurveyBodyResponse) {
    return await this.answerModel.findById(answer)
  }
}
