
import { Field, ObjectType } from "@nestjs/graphql";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type UserDocument = User & Document;

@Schema()
@ObjectType()
export class User {

  @Prop({
    type: String,
    required: true,
    minlength: 3
  })
  @Field(type => String)
  firstname: string;

  @Prop({
    type: String,
    required: false,
  })
  @Field(type => String)
  lastname?: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    maxlength: 30
  })
  @Field(type => String)
  email: string;

  @Prop({
    type: String,
    required: true,
    minlength: 6
  })
  password: string;

  @Prop({
    type: String,
    required: false,
  })
  @Field(type => String)
  nim: string;

  @Prop({
    type: Boolean,
    required: true,
    default: false
  })
  @Field(type => Boolean)
  isAdmin?: boolean;

}

export const UserSchema = SchemaFactory.createForClass(User);
