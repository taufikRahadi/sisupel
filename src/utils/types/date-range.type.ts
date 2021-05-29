import { ArgsType, Field, InputType } from "@nestjs/graphql";

@InputType()
export class DateRange {
  @Field(type => Date, { nullable: false, description: 'YYYY-MM-DD' })
  from: Date;

  @Field(type => Date, { nullable: false, description: 'YYYY-MM-DD' })
  to: Date;
}
