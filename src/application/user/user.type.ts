import { ArgsType, Field } from "@nestjs/graphql";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";
import { Match } from "src/utils/decorators/match.decorator";

@ArgsType()
export class CreateUserPayload {

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @Field(type => String)
  fullname: string;

  @IsString()
  @IsNotEmpty()
  @Field(type => String)
  unit: string;

  @IsString()
  @IsNotEmpty()
  @Field(type => String)
  role: string;

  @IsString()
  @IsNotEmpty()
  @Field(type => String)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Field(type => String)
  password: string;

  @IsString()
  @Match('password')
  @Field(type => String)
  passwordConfirmation: string;

}