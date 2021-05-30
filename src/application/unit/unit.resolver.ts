import { InternalServerErrorException } from "@nestjs/common";
import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Unit, UnitDocument } from "src/model/unit.model";
import { CreateUserPayload } from "../user/user.type";

@Resolver(of => Unit)
export class UnitResolver {

  constructor(
    @InjectModel(Unit.name) private readonly unitModel: Model<UnitDocument>
  ) {}

  @Mutation(returns => Boolean)
  async createUnit(@Args() payload: CreateUserPayload) {
    try {
      const createUnit = await this.unitModel.create(payload)
      return createUnit
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

}
