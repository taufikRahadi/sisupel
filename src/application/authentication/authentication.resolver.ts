import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { AuthenticationService } from "./authentication.service";
import { SignInPayload, SignInResponse } from "./authentication.type";

@Resolver()
export class AuthenticationResolver {

  constructor(private readonly authService: AuthenticationService) {}

  @Mutation(returns => SignInResponse)
  public async signInUser(
    @Args() user: SignInPayload
  ): Promise<SignInResponse> {
    return await this.authService.signIn(user)
  }

  @Query(returns => String)
  public async hello() {
    return 'hello'
  }

  // @Mutation(returns => Boolean)
  // public async registerUser() {}

}
