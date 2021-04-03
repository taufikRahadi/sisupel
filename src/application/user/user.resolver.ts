import { UseGuards } from "@nestjs/common";
import { Context, Query, Resolver } from "@nestjs/graphql";
import { UserGuard } from "src/infrastructure/user.guard";
import { User } from "src/model/user.model";

@Resolver(of => User)
export class UserResolver {

  @UseGuards(UserGuard)
  @Query(returns => User)
  public async userProfile(
    @Context('user') user: User
  ) {
    return user
  }

}
