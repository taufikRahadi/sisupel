import { ArgsType, Field, ObjectType } from "@nestjs/graphql";
import { IsBoolean, IsEmail, IsNotEmpty, IsNumberString, IsOptional, IsString, MinLength } from "class-validator";
import { Match } from 'src/utils/decorators/match.decorator'

@ArgsType()
export class SignInPayload {

  @IsEmail()
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
export class RegisterUserPayload {

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @Field(type => String)
  firstname: string;

  @IsOptional()
  @IsString()
  @Field(type => String, { nullable: true })
  lastname?: string;

  @IsEmail()
  @IsNotEmpty()
  @Field(type => String)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Field(type => String)
  password: string;

  @IsString()
  @Match('password')
  @Field(type => String)
  passwordConfirmation: string;

  @IsNumberString()
  @IsNotEmpty()
  @MinLength(10)
  @Field(type => String)
  phonenumber: string;

  @IsOptional()
  @IsNumberString()
  @Field(type => String, { nullable: true })
  nim: string;

  isAdmin: boolean;

}

@ObjectType()
export class SignInResponse {

  @Field(type => String)
  accessToken: string;

  @Field(type => String)
  refreshToken: string;

}
