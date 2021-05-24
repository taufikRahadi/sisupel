import { Field, ObjectType } from "@nestjs/graphql";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as schema } from "mongoose";
import { BaseModel } from "./base.model";

export type SurveyDocument = Survey & Document;

@Schema({
  timestamps: true
})
@ObjectType()
export class Survey extends BaseModel {

  @Prop({
    type: [{
      question: schema.Types.ObjectId,
      answer: schema.Types.ObjectId
    }]
  })
  body: any[];

  @Prop({
    type: schema.Types.ObjectId,
    ref: 'User'
  })
  user: string;

}

@ObjectType()
export class SurveyBodyType {}

export const SurveyModel = SchemaFactory.createForClass(Survey)
