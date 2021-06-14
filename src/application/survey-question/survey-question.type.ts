import { ArgsType, Field, Float, InputType, ObjectType } from "@nestjs/graphql";
import { Transform } from "class-transformer";
import { Types } from "mongoose";
import { SurveyQuestion } from "src/model/survey-question.model";

@InputType()
export class SurveyQuestionInput {
  
  @Field(type => String, { nullable: false })
  _id: string | Types.ObjectId;

  @Field(type => String, { nullable: true })
  question?: string;

  @Field(type => Number, { nullable: true })
  order?: number;

  @Field(type => String, { nullable: true })
  type?: string;

  @Field(type => Boolean, { nullable: true })
  isActive?: boolean;

}

@ArgsType()
export class SurveyQuestionPayload {

  @Field(type => [SurveyQuestionInput])
  body: SurveyQuestionInput[];

}

@ObjectType()
export class SurveyQuestionResponse extends SurveyQuestion {
  
  @Field(type => Float, { nullable: true })
  rating: number;

}
