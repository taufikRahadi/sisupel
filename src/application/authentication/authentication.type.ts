import { ArgsType, Field, ObjectType } from "@nestjs/graphql";
import { IsBoolean, IsEmail, IsNotEmpty, IsNumberString, IsOptional, IsString, MinLength } from "class-validator";
import { Match } from 'src/utils/decorators/match.decorator'

@ArgsType()
export class SignInPayload {

  @IsString()
  @IsNotEmpty()
  @Field(type => String)
  email: string;

  @IsString()
  @IsNotEmpty()
  @Field(type => String)
  password: string;

  @IsBoolean()
  @Field(type => Boolean, { defaultValue: false })
  rememberMe: boolean;

}

@ObjectType()
export class SignInResponse {

  @Field(type => String)
  accessToken: string;

  @Field(type => String)
  refreshToken: string;

}
