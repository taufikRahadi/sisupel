import { DynamicModule, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { RolePrivilege, RolePrivilegeModel } from "src/model/role-privileges.model";
import { Role, RoleModel } from "src/model/role.model";
import { Unit, UnitModel } from "src/model/unit.model";
import { User, UserSchema } from "src/model/user.model";
import { UserService } from "../user/user.service";
import { AuthenticationResolver } from "./authentication.resolver";
import { AuthenticationService } from "./authentication.service";

@Module({
  imports: [
    MongooseModule.forFeature([{
      name: User.name,
      schema: UserSchema
    }]),
    MongooseModule.forFeature([{
      name: Role.name,
      schema: RoleModel
    }]),
    MongooseModule.forFeature([{
      name: RolePrivilege.name,
      schema: RolePrivilegeModel
    }]),
    MongooseModule.forFeature([{
      name: Unit.name,
      schema: UnitModel
    }]),
  ],
  providers: [
    UserService, AuthenticationService, AuthenticationResolver, ConfigService
  ]
})
export class AuthenticationModule {

  static use(): DynamicModule {
    return {
      module: AuthenticationModule,
      providers: [
        UserService, AuthenticationService, ConfigService
      ],
      exports: [
        MongooseModule.forFeature([{
          name: User.name,
          schema: UserSchema
        }]),
        MongooseModule.forFeature([{
          name: Role.name,
          schema: RoleModel
        }]),
        MongooseModule.forFeature([{
          name: RolePrivilege.name,
          schema: RolePrivilegeModel
        }]),
        MongooseModule.forFeature([{
          name: Unit.name,
          schema: UnitModel
        }]),
        UserService, AuthenticationService,
      ]
    }
  }

}
