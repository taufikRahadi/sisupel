import { ArgsType, Field, InputType } from "@nestjs/graphql";
import { Transform } from "class-transformer";
import { Types } from "mongoose";

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