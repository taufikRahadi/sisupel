import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UserService } from "src/application/user/user.service";
import { RolePrivilege } from "src/model/role-privileges.model";
import { Role, RoleDocument } from "src/model/role.model";
import { User, UserDocument } from "src/model/user.model";

@Injectable()
export class PrivilegesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    // @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const privilege = this.reflector.get<string>('privilege', context.getHandler())
      const { user } = context.getArgs()[2]
      if (!privilege)
        return true

      this.matchRoles(user.role.privileges, privilege)

      return true
    } catch (error) {
      throw new UnauthorizedException(error)
    }
  }

  matchRoles(userPrivileges: RolePrivilege[], privilege: string) {
    const findIt = userPrivileges.filter(v => v.name === privilege)
    if (findIt.length < 1)
      throw new UnauthorizedException('Anda tidak memiliki akses')
  }
}
