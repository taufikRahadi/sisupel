import { ArgsType, Field, ObjectType } from "@nestjs/graphql";
import { IsBoolean, IsEmail, IsNotEmpty, IsString } from "class-validator";

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

@ObjectType()
export class SignInResponse {

  @Field(type => String)
  accessToken: string;

  @Field(type => String)
  refreshToken: string;

}
