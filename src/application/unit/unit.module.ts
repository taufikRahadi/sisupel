import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Unit, UnitModel } from "src/model/unit.model";
import { UnitResolver } from "./unit.resolver";

@Module({
  imports: [
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
