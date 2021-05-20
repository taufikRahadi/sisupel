import { ArgsType } from "@nestjs/graphql";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

@ArgsType()
export class CreateUnitPayload {

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

}
