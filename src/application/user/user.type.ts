import { ArgsType, Field, ObjectType } from "@nestjs/graphql";
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { User } from "src/model/user.model";
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

}

@ArgsType()
export class UpdateUserPayload extends CreateUserPayload {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @Field(type => String, { nullable: true })
  fullname: string;

  @IsString()
  @IsOptional()
  @Field(type => String, { nullable: true })
  unit: string;

  @IsString()
  @IsOptional()
  @Field(type => String, { nullable: true })
  role: string;

  @IsEmail()
  @IsOptional()
  @Field(type => String, { nullable: true })
  email: string;

  @IsString()
  @IsOptional()
  @MinLength(8)
  @Field(type => String, { nullable: true })
  password: string;

  @IsString()
  @IsOptional()
  @Match('password')
  @Field(type => String, { nullable: true })
  passwordConfirmation: string;

  @IsBoolean()
  @IsOptional()
  @Field(type => Boolean, { nullable: true })
  isActive: boolean;
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

@ObjectType()
export class UserResponse {

  @Field(type => Number)
  currentPage: number;

  @Field(type => Number)
  totalItems: number;

  @Field(type => [User])
  users: User[];

}

@ArgsType()
export class GetAllUsersArgs {
  @Field(type => Number, { defaultValue: 10 })
  limit: number;

  @Field(type => Number, { defaultValue: 1 })
  page: number;

  @Field(type => String, { nullable: true })
  query: string;
}
