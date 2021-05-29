import { ArgsType, Field, Float, InputType, ObjectType, registerEnumType } from "@nestjs/graphql";
import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, IsOptional, IsString, Max, MaxLength, ValidateNested } from "class-validator";
import { SurveyAnswer } from "src/model/survey-answer.model";
import { SurveyQuestion } from "src/model/survey-question.model";
import { Survey } from "src/model/survey.model";
import { User } from "src/model/user.model";

@InputType()
export class SurveyBodyPayload {
  @Field(type => String)
  @IsString()
  @IsNotEmpty()
  question: string;

  @Field(type => String)
  @IsString()
  @IsNotEmpty()
  answer: string;

  @Field(type => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  text: string;
}

@ObjectType()
export class CalculateEssayResponse {
  @Field(type => Number)
  total: number;

  @Field(type => Number)
  yesterdayTotal: number;

  @Field(type => Number)
  todayTotal: number
}

@ArgsType()
export class CreateSurveyPayload {
  @Field(type => [SurveyBodyPayload])
  @IsArray()
  @ArrayMinSize(8)
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => SurveyBodyPayload)
  body: SurveyBodyPayload[];
}

@ObjectType()
export class SurveyResponse extends Survey {
  // @Field(type => )
}

export class SurveyBody {
  question: SurveyQuestion;
  answer: SurveyAnswer;
}

@ObjectType()
export class CalculateAverage {

  @Field(type => Number)
  totalSurvey: number;

  @Field(type => Float)
  average: number;
}

@ObjectType()
export class TimePrepositionType {

  @Field(type => [AverageType])
  present: any;

  @Field(type => [AverageType])
  yesterday: any;

}

@ObjectType()
export class CalculateAverageUnitGlobal {

  @Field(type => String, { nullable: true })
  unitName?: string;

  @Field(type => TimePrepositionType)
  data: TimePrepositionType;

}

@ObjectType()
export class AverageType {

  @Field(type => Number, { nullable: true })
  count?: number;

  @Field(type => String, { nullable: true })
  surveyQuestion?: string;

  @Field(type => Float, { nullable: true })
  averageAnswer?: number;

  @Field(type => User, { nullable: true })
  user?: any;

}

export enum SortByEnum {
  DESC,
  ASC
}

registerEnumType(SortByEnum, {
  name: 'SortByEnum'
});