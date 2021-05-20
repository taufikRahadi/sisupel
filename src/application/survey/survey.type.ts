import { ArgsType, Field, Float, InputType, ObjectType } from "@nestjs/graphql";
import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { SurveyAnswer } from "src/model/survey-answer.model";
import { SurveyQuestion } from "src/model/survey-question.model";

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
}

@ArgsType()
export class CreateSurveyPayload {
  @Field(type => [SurveyBodyPayload])
  @IsArray()
  @ArrayMinSize(10)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => SurveyBodyPayload)
  body: SurveyBodyPayload[];
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