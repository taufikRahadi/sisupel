import { BadRequestException, InternalServerErrorException, UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { UserGuard } from "src/infrastructure/user.guard";
import { User } from "src/model/user.model";
import { UserService } from "../user/user.service";
import { AuthenticationService } from "./authentication.service";
import { SignInPayload, SignInResponse } from "./authentication.type";
import { sign, verify, decode } from 'jsonwebtoken'
import { ConfigService } from "@nestjs/config";

@Resolver()
export class AuthenticationResolver {

  constructor(
    private readonly authService: AuthenticationService,
    private readonly userService: UserService,
    private readonly configService: ConfigService
  ) {}

  @Mutation(returns => SignInResponse)
  async signIn(
    @Args() payload: SignInPayload
  ): Promise<SignInResponse> {
    const user = await this.userService.findByUsername(payload.username)
    if (!this.userService.comparePassword(payload.password, user.password))
      throw new BadRequestException('Kata sandi salah')

    const accessTokenExpiration = payload.rememberMe ? Math.floor(Date.now() / 1000) + (60 * 60) * 24 : Math.floor(Date.now() / 1000) + (60 * 60) // default 1 hour, remember me 1 day
    const refreshTokenExpiration = payload.rememberMe ? Math.floor(Date.now() / 1000) + (60 * 60) * 24 * 30 : Math.floor(Date.now() / 1000) + (60 * 60) * 24 // 1 day, remember me 31 day

    const accessToken = sign({
      exp: accessTokenExpiration,
      data: user.username,
    }, this.configService.get<string>('JWT_SECRET'))

    const refreshToken = sign({
      exp: refreshTokenExpiration,
      data: user.username,
      rememberMe: payload.rememberMe
    }, `${this.configService.get<string>('JWT_SECRET')}-refresh`)

    return { accessToken, refreshToken }
  }

  @Mutation(returns => SignInResponse)
  async refreshSession(
    @Args('refreshToken', { type: () => String }) token: string
  ): Promise<SignInResponse> {
    try {
      const verifyToken = verify(token, this.configService.get<string>('JWT_SECRET') + '-refresh')
      const { data, rememberMe }: any = decode(token)
      
      const accessTokenExpiration = rememberMe ? Math.floor(Date.now() / 1000) + (60 * 60) * 24 : Math.floor(Date.now() / 1000) + (60 * 60) // default 1 hour, remember me 1 day
      const refreshTokenExpiration = rememberMe ? Math.floor(Date.now() / 1000) + (60 * 60) * 24 * 30 : Math.floor(Date.now() / 1000) + (60 * 60) * 24 // 1 day, remember me 31 day


      const accessToken = sign({
        exp: accessTokenExpiration,
        data
      }, this.configService.get<string>('JWT_SECRET'))
  
      const refreshToken = sign({
        exp: refreshTokenExpiration,
        data,
        rememberMe
      }, `${this.configService.get<string>('JWT_SECRET')}-refresh`)

      return { accessToken, refreshToken }
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

}
