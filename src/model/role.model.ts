import { Field, ObjectType } from "@nestjs/graphql";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as schema } from "mongoose";
import { BaseModel } from "./base.model";
import { RolePrivilege } from "./role-privileges.model";

export type RoleDocument = Document & Role;

@Schema({
  timestamps: true
})
@ObjectType()
export class Role extends BaseModel {
  @Prop({
    type: String,
    required: true
  })
  @Field(type => String)
  name: string;

  @Prop([{
    type: schema.Types.ObjectId,
    ref: 'RolePrivilege'
  }])
  @Field(type => [RolePrivilege])
  privileges: string[] | RolePrivilege[];
  // privileges: any;

  @Prop({
    type: schema.Types.ObjectId,
    required: true
  })
  @Field(type => String)
  lastModifiedBy: string;
}

export const RoleModel = SchemaFactory.createForClass(Role)
