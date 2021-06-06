import { InternalServerErrorException, UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { PrivilegesGuard } from "src/infrastructure/privileges.guard";
import { UserGuard } from "src/infrastructure/user.guard";
import { Unit, UnitDocument } from "src/model/unit.model";
import { User } from "src/model/user.model";
import { IsAllowTo } from "src/utils/decorators/privileges.decorator";
import { CreateUserPayload } from "../user/user.type";
import { CreateUnitPayload } from "./unit.type";

@Resolver(of => Unit)
export class UnitResolver {

  constructor(
    @InjectModel(Unit.name) private readonly unitModel: Model<UnitDocument>
  ) {}

  @Query(returns => [Unit])
  @UseGuards(UserGuard)
  async getAllUnits() {
    try {
      const units = await this.unitModel.find().sort({ name: 'asc' })

      return units
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

  @Mutation(returns => Boolean)
  @UseGuards(UserGuard, PrivilegesGuard)
  @IsAllowTo('create-unit')
  async createUnit(
    @Args() payload: CreateUnitPayload,
    @Context('user') { _id }: User
  ) {
    try {
      const createUnit = await this.unitModel.create({
        name: payload.name.toUpperCase(),
        lastModifiedBy: _id
      })
      return createUnit
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

}
