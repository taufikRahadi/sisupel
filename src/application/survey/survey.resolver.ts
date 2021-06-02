import { InternalServerErrorException, UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Parent, Query, ResolveField, Resolver } from "@nestjs/graphql";
import { InjectModel } from "@nestjs/mongoose";
import { SSL_OP_CRYPTOPRO_TLSEXT_BUG } from "constants";
import { Model } from "mongoose";
import { PrivilegesGuard } from "src/infrastructure/privileges.guard";
import { UserGuard } from "src/infrastructure/user.guard";
import { SurveyAnswer, SurveyAnswerDocument } from "src/model/survey-answer.model";
import { SurveyQuestion, SurveyQuestionDocument, SurveyQuestionModel } from "src/model/survey-question.model";
import { Survey } from "src/model/survey.model";
import { Unit } from "src/model/unit.model";
import { User } from "src/model/user.model";
import { IsAllowTo } from "src/utils/decorators/privileges.decorator";
import { DateRange } from "src/utils/types/date-range.type";
import { Sort } from "src/utils/types/sort.enum";
import { AuthenticationResolver } from "../authentication/authentication.resolver";
import { UserService } from "../user/user.service";
import { SurveyService } from "./survey.service";
import { CalculateAverage, CreateSurveyPayload, SurveyResponse, CalculateAverageUnitGlobal, CalculateEssayResponse, SurveyBodyResponse, AverageType, SortByEnum, AverageTypeUnit } from "./survey.type";

const today = new Date()

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
  @IsAllowTo('read-self-survey')
  async getMySurvey(
    @Args('limit', { type: () => Number, nullable: true }) limit: number,
    @Context('user') { _id, unit }: User,
    @Args('range', { type: () => DateRange, nullable: false }) range: DateRange,
    @Args('sort', { type: () => Sort, defaultValue: Sort['asc'] }) sort: Sort
  ) {
    const surveys = await this.surveyService.getMySurvey(_id, Sort[sort], limit, range)
    return surveys
  }

  @Query(returns => [SurveyResponse])
  @UseGuards(UserGuard, PrivilegesGuard)
  @IsAllowTo('calculate-unit-survey')
  async getMyUnitSurveys(
    @Args('limit', { type: () => Number, nullable: true }) limit: number,
    @Context('user') { _id, unit }: User,
    @Args('range', { type: () => DateRange, nullable: false }) range: DateRange,
    @Args('sort', { type: () => Sort, defaultValue: Sort['asc'] }) sort: Sort
  ) {
    const from = new Date(range.from)
    const to = new Date(range.to)
    range = {
      from: from,
      to: new Date(to.setDate(to.getDate() + 1)) 
    }

    const userUnit: any = unit

    return await this.surveyService.getSurveys(Sort[sort], limit, range, userUnit._id)
  }

  @Query(returns => [SurveyResponse])
  @UseGuards(UserGuard, PrivilegesGuard)
  @IsAllowTo('read-global-survey')
  async getSurveys(
    @Context('user') user: User,
    @Args('limit', { type: () => Number, nullable: true, defaultValue: 10 }) limit: number,
    @Args('range', { type: () => DateRange, nullable: false }) range: DateRange,
    @Args('sort', { type: () => Sort, defaultValue: Sort['asc'] }) sort: Sort,
    @Args('unit', { type: () => String, nullable: true }) unit: string
  ) {
    const from = new Date(range.from)
    const to = new Date(range.to)
    range = {
      from: from,
      to: new Date(to.setDate(to.getDate() + 1)) 
    }
    return await this.surveyService.getSurveys(Sort[sort], limit, range, unit)
  }

  @Query(returns => CalculateEssayResponse)
  @UseGuards(UserGuard, PrivilegesGuard)
  // @IsAllowTo('calculate-unit-survey')
  async calculateEssayGlobal() {
    return await this.surveyService.calculateEssayGlobal()
  }

  @Query(returns => CalculateEssayResponse)
  @UseGuards(UserGuard, PrivilegesGuard)
  async calculateEssayUnit(
    @Context('user') { unit }: User
  ) {
    // return await this.surveyService
    const unitId: any = unit
    return await this.surveyService.calculateEssayUnit(unitId._id)
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
  async calculateUnitQuestionnare(
    @Args('id', { type: () => String }) id: string,
    @Args('range', { type: () => DateRange, nullable: true }) range: DateRange,
    @Args('isAccumulative', { type: () => Boolean, defaultValue: false }) isAccumulative: boolean,
  ) {
    try {
      const data = await this.surveyService.calculateAverageUnitGlobal(id, range);

      if (!range) {
        if (isAccumulative) {
          let total_average: number = 0;

          data.forEach((value) => {
            total_average += value.averageAnswer
          });

          const response: CalculateAverageUnitGlobal = {
            unitName: "Contoh",
            data: [
              {
                averageAnswer: data.length != 0 ? total_average / data.length : 0
              }
            ]
          }

          return response;
        }

        const response: CalculateAverageUnitGlobal = {
          unitName: "Contoh",
          data
        }

        return response;
      }

      if(isAccumulative) {
        let response_obj: object = {};

        data.forEach((value) => {
          if (value.date) {
            if(!(value.date in response_obj)) {
              response_obj[value.date] = [value.averageAnswer];
            }
            response_obj[value.date].push(value.averageAnswer);
          }
        });

        Object.keys(response_obj).forEach((e) => {
          let sum = 0;
          response_obj[e].forEach((v) => {
            sum += v
          });
          response_obj[e] = sum / response_obj[e].length
        });
        
        let response: CalculateAverageUnitGlobal = {
          unitName: "contoh",
          data: []
        };

        Object.keys(response_obj).forEach((e) => {
          response.data.push({
            date: e,
            averageAnswer: response_obj[e]
          })
        });

        return response;
      }

      const response: CalculateAverageUnitGlobal = {
        unitName: "Contoh",
        data: data
      }
      return response
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  @Query(returns => CalculateAverageUnitGlobal)
  @UseGuards(UserGuard, PrivilegesGuard)
  @IsAllowTo('calculate-global-survey')
  async calculateGlobalQuestionnare(
    @Args('range', { type: () => DateRange, nullable: true }) range: DateRange,
    @Args('isAccumulative', { type: () => Boolean, defaultValue: false }) isAccumulative: boolean,
  ) {
    try {
      return this.surveyService.calculateAverageUnitGlobal(null, range);
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
    // @Args('sortBy', { type: () => SortByEnum, defaultValue: 0 }) sortBy: SortByEnum,
  ) {
    try {
      const data: AverageType = await this.surveyService.getBestFrontDeskScores();
    
      return data
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  @Query(returns => [AverageTypeUnit])
  @UseGuards(UserGuard)
  async getBestUnit(
    @Args('sort', { type: () => Sort, defaultValue: 0 }) sort: Sort,
    @Args('limit', { type: () => Number, defaultValue: 5 }) limit: number,
    @Args('range', { type: () => DateRange, defaultValue: { from: new Date(today.setMonth(today.getMonth()) - 1), to: today } }) range: DateRange
  ) {
    return await this.surveyService.getBestUnit(limit, sort, range)
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
