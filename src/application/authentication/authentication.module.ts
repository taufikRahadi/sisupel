import { DynamicModule, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "src/model/user.model";
import { UserService } from "../user/user.service";
import { AuthenticationResolver } from "./authentication.resolver";
import { AuthenticationService } from "./authentication.service";

@Module({
  imports: [
    MongooseModule.forFeature([{
      name: User.name,
      schema: UserSchema
    }])
  ],
  providers: [
    UserService, AuthenticationService, AuthenticationResolver
  ]
})
export class AuthenticationModule {

  static use(): DynamicModule {
    return {
      module: AuthenticationModule,
      providers: [

      ],
      exports: []
    }
  }

}
