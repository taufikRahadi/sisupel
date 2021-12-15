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

@Module({})
export class AuthenticationModule {

  static use(): DynamicModule {
    return {
      module: AuthenticationModule,
      imports: [
        MongooseModule.forFeature([{
          name: User.name,
          schema: UserSchema
        }, {
          name: Role.name,
          schema: RoleModel
        }, {
          name: RolePrivilege.name,
          schema: RolePrivilegeModel
        }, {
          name: Unit.name,
          schema: UnitModel
        }])
      ],
      providers: [
        UserService, AuthenticationService, ConfigService
      ],
      exports: [
        MongooseModule.forFeature([{
          name: User.name,
          schema: UserSchema
        }, {
          name: Role.name,
          schema: RoleModel
        }, {
          name: RolePrivilege.name,
          schema: RolePrivilegeModel
        }, {
          name: Unit.name,
          schema: UnitModel
        }]),
        UserService, AuthenticationService,
      ]
    }
  }

}
