import { ArgsType, Field, Float, InputType, ObjectType } from "@nestjs/graphql";
import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { SurveyAnswer } from "src/model/survey-answer.model";
import { SurveyQuestion } from "src/model/survey-question.model";
import { Survey } from "src/model/survey.model";

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

}
