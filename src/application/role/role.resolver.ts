import { BadRequestException, InternalServerErrorException, UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { PrivilegesGuard } from "src/infrastructure/privileges.guard";
import { UserGuard } from "src/infrastructure/user.guard";
import { RolePrivilege, RolePrivilegeDocument } from "src/model/role-privileges.model";
import { Role, RoleDocument } from "src/model/role.model";
import { User } from "src/model/user.model";
import { IsAllowTo } from "src/utils/decorators/privileges.decorator";

@Resolver(of => Role)
export class RoleResolver {

  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(RolePrivilege.name) private readonly rolePrivilegeModel: Model<RolePrivilegeDocument>,
  ) {}

  @Mutation(returns => Boolean)
  @UseGuards(UserGuard)
  async createRolePrivilege(
    @Args('name', { type: () => String, nullable: false }) name: string,
    @Context('user') { _id }: User
  ) {
    try {
      await this.rolePrivilegeModel.create({
        name,
        lastModifiedBy: _id
      })
      return true
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

  @Query(returns => [Role])
  async getAllRoles() {
    try {
      const roles = await this.roleModel.find().sort({ name: 'asc' }).populate('privileges')
      
      return roles
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

  @Mutation(returns => Boolean)
  @UseGuards(UserGuard, PrivilegesGuard)
  @IsAllowTo('create-role')
  async createRole(
    @Args('name', { type: () => String }) name: string,
    @Context('user') { _id }: User
  ) {
    try {
      const role = await this.roleModel.create({
        name,
        lastModifiedBy: _id
      })

      return true
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

  @Mutation(returns => Boolean)
  @UseGuards(UserGuard)
  async attachRolePrivilege(
    @Args('role', { type: () => String }) role: string,
    @Args('privilege', { type: () => [String] }) privilege: string[],
    @Context('user') { _id }: User
  ) {
    try {
      const findFirst = await this.roleModel.findOne({
        _id: role,
        privileges: {
          $in: privilege 
        }
      });
      if (findFirst)
        throw new BadRequestException('Role sudah memiliki hak akses')

        const updateRole = await this.roleModel.findOneAndUpdate(
        { _id: role },
        {
          $push: {
            privileges: {
              $each: privilege
            }
          },
          lastModifiedBy: _id
        }
      )

      return true
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

  @Query(returns => [RolePrivilege])
  @UseGuards(UserGuard)
  async getAllPrivileges() {
    try {
      return await this.rolePrivilegeModel.find().sort({ name: 'asc' })
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

}
