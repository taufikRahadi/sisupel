import { Field, ObjectType } from "@nestjs/graphql";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as schema } from "mongoose";
import { BaseModel } from "./base.model";

export type SurveyAnswerDocument = SurveyAnswer & Document;

@Schema({
  timestamps: true
})
@ObjectType()
export class SurveyAnswer extends BaseModel {

  @Prop({
    type: String,
    required: true,
  })
  @Field(type => String)
  title: string;

  @Prop({
    type: Number,
    max: 5,
    min: 0,
    required: true
  })
  @Field(type => Number)
  value: number;

  @Prop({
    type: schema.Types.ObjectId,
    ref: 'User'
  })
  lastModifiedBy: string;

}

export const SurveyAnswerModel = SchemaFactory.createForClass(SurveyAnswer)
