import { ArgsType, Field } from "@nestjs/graphql";
import { IsNumber, IsString, Max, Min, MinLength } from "class-validator";

@ArgsType()
export class CreateSurveyAnswerPayload {

  @Field(type => String)
  @IsString()
  @MinLength(3)
  title: string;

  @Field(type => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  value: number;

}
