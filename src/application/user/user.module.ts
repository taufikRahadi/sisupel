import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
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
    }])
  ],
  providers: [
    UserService, UserResolver
  ],
})
export class UserModule {}
