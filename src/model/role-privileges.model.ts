import { Field, ObjectType } from "@nestjs/graphql";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as schema } from "mongoose";
import { BaseModel } from "./base.model";

export type RolePrivilegeDocument = RolePrivilege & Document;

@Schema({
  timestamps: true
})
@ObjectType()
export class RolePrivilege extends BaseModel {
  @Prop({
    type: String,
    required: true
  })
  @Field(type => String)
  name: string;

  @Prop({
    type: schema.Types.ObjectId,
    required: true,
    ref: 'User'
  })
  @Field(type => String)
  lastModifiedBy: string;
}

export const RolePrivilegeModel = SchemaFactory.createForClass(RolePrivilege);
