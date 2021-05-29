
import { Field, ObjectType } from "@nestjs/graphql";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as schema } from "mongoose";
import { BaseModel } from "./base.model";
import { Role } from "./role.model";
import { Unit } from "./unit.model";

export type UserDocument = User & Document;

@Schema({
  timestamps: true
})
@ObjectType()
export class User extends BaseModel {

  @Prop({
    type: String,
    required: true,
    minlength: 3
  })
  @Field(type => String, { nullable: false })
  fullname: string;

  @Prop({
    type: schema.Types.ObjectId,
    ref: 'Unit'
  })
  @Field(type => Unit, { nullable: true })
  unit: Unit | string;

  @Prop({
    type: String,
    unique: true,
    required: true,
    minLength: 6
  })
  @Field(type => String, { nullable: false })
  email: string;

  @Prop({
    type: String,
    required: false,
  })
  @Field(type => String, { nullable: true })
  photo?: string;

  @Prop({
    type: String,
    required: true,
    minLength: 8
  })
  password: string;

  @Prop({
    type: Boolean,
    default: true
  })
  @Field(type => Boolean, { nullable: false })
  isActive?: boolean;

  @Prop({
    type: Date,
    required: false,
  })
  @Field(type => Date, { nullable: true })
  lastLogin?: Date;

  @Prop({
    type: schema.Types.ObjectId,
    ref: 'Role'
  })
  @Field(type => Role, { nullable: false })
  role: Role | string;

  @Prop({
    type: schema.Types.ObjectId,
    ref: 'User'
  })
  lastModifiedBy?: string;

}

export const UserSchema = SchemaFactory.createForClass(User);
