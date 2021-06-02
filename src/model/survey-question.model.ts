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
    type: Boolean,
    required: true,
    default: true
  })
  @Field(type => Boolean)
  isActive?: boolean;

  @Prop({
    type: String,
    enum: ['KUESIONER', 'ESSAY'],
    default: 'KUESIONER'
  })
  @Field(type => String)
  type?: string;

  @Prop({
    type: schema.Types.ObjectId,
    ref: 'User'
  })
  lastModifiedBy: string;

  @Prop({
    type: Number,
    required: true,
    unique: true,
  })
  order?: number;
}

export const SurveyQuestionModel = SchemaFactory.createForClass(SurveyQuestion)
