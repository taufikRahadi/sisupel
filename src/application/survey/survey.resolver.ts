import { Resolver } from "@nestjs/graphql";
import { InjectModel } from "@nestjs/mongoose";

@Resolver()
export class SurveyResolver {

  constructor(
    // @InjectModel()
  ) {}

}
