import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Unit, UnitModel } from "src/model/unit.model";
import { AuthenticationModule } from "../authentication/authentication.module";
import { UnitResolver } from "./unit.resolver";

@Module({
  imports: [
    AuthenticationModule.use(),
    MongooseModule.forFeature([
      {
        name: Unit.name,
        schema: UnitModel
      }
    ])
  ],
  providers: [
    UnitResolver
  ]
})
export class UnitModule {}
