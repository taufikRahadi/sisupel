import { ArgsType, Field } from "@nestjs/graphql";
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
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

  @IsEmail()
  @IsNotEmpty()
  @Field(type => String)
  email: string;

  // @IsString()
  // @IsNotEmpty()
  // @MinLength(8)
  // @Field(type => String)
  // password: string;

  // @IsString()
  // @Match('password')
  // @Field(type => String)
  // passwordConfirmation: string;

}

@ArgsType()
export class UpdateMyProfile {

   @Field(type => String, { nullable: true })
   @IsString()
   @IsOptional()
   @MinLength(3)
   fullname: string;

}

@ArgsType()
export class ChangePasswordArgs {


  @Field(type => String)
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  oldPassword: string;

  @Field(type => String)
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string

  @Field(type => String)
  @Match('newPassword')
  @IsString()
  newPasswordConfirmation: string;

}
