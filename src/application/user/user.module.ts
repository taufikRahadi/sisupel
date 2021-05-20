import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Unit, UnitModel } from "src/model/unit.model";
import { User, UserSchema } from "src/model/user.model";
import { AuthenticationModule } from "../authentication/authentication.module";
import { UserResolver } from "./user.resolver";
import { UserService } from "./user.service";

@Module({
  imports: [
    AuthenticationModule.use(),
    MongooseModule.forFeature([{
      name: User.name,
      schema: UserSchema
    }]),
    MongooseModule.forFeature([{
      name: Unit.name,
      schema: UnitModel
    }])
  ],
  providers: [
    UserService, UserResolver
  ],
})
export class UserModule {}
