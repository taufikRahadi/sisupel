import { UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Parent, Query, ResolveField, Resolver } from "@nestjs/graphql";
import { PrivilegesGuard } from "src/infrastructure/privileges.guard";
import { UserGuard } from "src/infrastructure/user.guard";
import { User } from "src/model/user.model";
import { IsAllowTo } from "src/utils/decorators/privileges.decorator";
import { UserService } from "./user.service";
import { CreateUserPayload } from "./user.type";

@Resolver(of => User)
export class UserResolver {

  constructor(private readonly userService: UserService) {}

  @UseGuards(UserGuard, PrivilegesGuard)
  @Query(returns => User)
  public async userProfile(
    @Context('user') user: User
  ) {
    return user
  }

  @Mutation(returns => Boolean)
  @UseGuards(UserGuard, PrivilegesGuard)
  @IsAllowTo('create-user')
  async createUser(
    @Args() payload: CreateUserPayload
  ) {
    await this.userService.create(payload);
    return true;
  }

  @ResolveField('lastModifiedBy', returns => User)
  async getLastModifiedBy(
    @Parent() { lastModifiedBy }: User
  ) {
    
  }

}
