import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class BaseModel {
  @Field(type => String)
  _id?: string;

  @Field(type => String)
  createdAt?: string;

  @Field(type => String)
  updatedAt?: string;
}
