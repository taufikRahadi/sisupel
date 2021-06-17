import { ArgsType, Field, ObjectType } from "@nestjs/graphql";
import { IsBoolean, IsEmail, IsNotEmpty, IsNumberString, IsOptional, IsString, IsUUID, MinLength } from "class-validator";
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

@ArgsType()
export class RequestResetPasswordPayload {
  @IsEmail()
  @IsNotEmpty()
  @Field(type => String)
  email: string;
}

@ArgsType()
export class ResetPasswordPayload {
  @IsString()
  @IsNotEmpty()
  @Field(type => String)
  @MinLength(6)
  password: string;

  @Field(type => String)
  @Match('password')
  passwordConfirmation: string;

  @IsUUID('4')
  @Field(type => String)
  @IsNotEmpty()
  token: string;
}

@ObjectType()
export class SignInResponse {

  @Field(type => String)
  accessToken: string;

  @Field(type => String)
  refreshToken: string;

}
