import { UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { UserGuard } from "src/infrastructure/user.guard";
import { User } from "src/model/user.model";
import { UserService } from "../user/user.service";
import { AuthenticationService } from "./authentication.service";
import { RegisterUserPayload, SignInPayload, SignInResponse } from "./authentication.type";

@Resolver()
export class AuthenticationResolver {

  constructor(
    private readonly authService: AuthenticationService,
    private readonly userService: UserService
  ) {}

  @Mutation(returns => SignInResponse)
  public async signInUser(
    @Args() user: SignInPayload
  ): Promise<SignInResponse> {
    return await this.authService.signIn(user)
  }

  @Mutation(returns => User)
  public async registerUser(
    @Args() payload: RegisterUserPayload
  ): Promise<User> {
    const createUser = await this.userService.create(payload)

    return createUser;
  }

}
