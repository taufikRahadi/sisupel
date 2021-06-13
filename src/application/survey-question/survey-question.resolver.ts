import { InternalServerErrorException, UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { InjectModel } from "@nestjs/mongoose";
import { Model, ObjectId, Types } from "mongoose";
import { PrivilegesGuard } from "src/infrastructure/privileges.guard";
import { UserGuard } from "src/infrastructure/user.guard";
import { SurveyQuestion, SurveyQuestionDocument } from "src/model/survey-question.model";
import { User } from "src/model/user.model";
import { IsAllowTo } from "src/utils/decorators/privileges.decorator";
import { SurveyQuestionPayload } from "./survey-question.type";

const ObjectIdTypes = Types.ObjectId;

@Resolver(of => SurveyQuestion)
export class SurveyQuestionResolver {

  constructor(
    @InjectModel(SurveyQuestion.name) private readonly surveyQuestionModel: Model<SurveyQuestionDocument>
  ) {}

  @Query(returns => [SurveyQuestion])
  @UseGuards(UserGuard)
  async getQuestion(
    @Args('limit', { type: () => Number, defaultValue: 10 }) limit: number
  ) {
    try {
      return await this.surveyQuestionModel.find({
        isActive: true
      }).limit(limit).sort({
        order: 1
      })
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

  @Mutation(returns => [SurveyQuestion])
  @UseGuards(UserGuard)
  async updateQuestionOrder(
    @Args() payload: SurveyQuestionPayload
  ) {
    try {
      const data = await Promise.all(payload.body.map(async (value) => {
          await this.surveyQuestionModel.findOneAndUpdate({
            _id: value._id
          }, value, { useFindAndModify: false });
        }))
        .then(async () => {
          const find: SurveyQuestion[] = await this.surveyQuestionModel.find({
            isActive: true
          }).sort({
            order: 1
          });

          return find
        });
      
      return data;
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

  @Mutation(returns => Boolean)
  @UseGuards(UserGuard, PrivilegesGuard)
  @IsAllowTo('create-question')
  async createQuestion(
    @Args('question', { type: () => String, nullable: false }) question: string,
    @Args('type', { type: () => String, nullable: false, defaultValue: 'KUESIONER' }) type: 'KUESIONER' | 'ESSAY',
    @Args('order', { type: () => Number, nullable: false }) order: number,
    @Context('user') { _id }: User
  ) {
    try {
      await this.surveyQuestionModel.create({ question, type ,lastModifiedBy: _id, order })
      return true
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

  @Mutation(returns => Boolean)
  @UseGuards(UserGuard, PrivilegesGuard)
  // @IsAllowTo()
  async changeIsActiveQuestion(
    @Args('question', { type: () => String, nullable: false }) question: string,
    @Args('isActive', { type: () => Boolean, nullable: false }) isActive: boolean,
    @Context('user') { _id }: User
  ) {
    try {
      await this.surveyQuestionModel.findByIdAndUpdate(question, {
        isActive,
        lastModifiedBy: _id
      })

      return true
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

}
