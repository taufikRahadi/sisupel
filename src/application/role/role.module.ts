import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { RolePrivilege, RolePrivilegeModel } from "src/model/role-privileges.model";
import { Role, RoleModel } from "src/model/role.model";
import { AuthenticationModule } from "../authentication/authentication.module";
import { RoleResolver } from "./role.resolver";

@Module({
  imports: [
    AuthenticationModule.use(),
    MongooseModule.forFeature([
      {
        name: Role.name,
        schema: RoleModel
      },
      {
        name: RolePrivilege.name,
        schema: RolePrivilegeModel
      }
    ])
  ],
  providers: [
    RoleResolver
  ]
})
export class RoleModule {}
