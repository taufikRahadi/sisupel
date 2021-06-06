import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class BaseModel {
  @Field(type => String)
  _id?: string;

  @Field(type => String)
  createdAt?: Date;

  @Field(type => String)
  updatedAt?: Date;
}
