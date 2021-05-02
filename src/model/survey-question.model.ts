import { Field, ObjectType } from "@nestjs/graphql";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as schema } from "mongoose";
import { BaseModel } from "./base.model";

export type SurveyQuestionDocument = SurveyQuestion & Document

@Schema({
  timestamps: true
})
@ObjectType()
export class SurveyQuestion extends BaseModel {
  @Prop({
    type: String,
    required: true,
  })
  @Field(type => String)
  question: string;

  @Prop({
    type: schema.Types.ObjectId,
    ref: 'User'
  })
  lastModifiedBy: string;
}

export const SurveyQuestionModel = SchemaFactory.createForClass(SurveyQuestion)
