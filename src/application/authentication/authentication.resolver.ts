import { BadRequestException, InternalServerErrorException, NotFoundException, UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { UserGuard } from "src/infrastructure/user.guard";
import { User } from "src/model/user.model";
import { UserService } from "../user/user.service";
import { AuthenticationService } from "./authentication.service";
import { RequestResetPasswordPayload, ResetPasswordPayload, SignInPayload, SignInResponse } from "./authentication.type";
import { sign, verify, decode } from 'jsonwebtoken'
import { ConfigService } from "@nestjs/config";
import { v4 as uuidv4 } from 'uuid'
import { RedisService } from "nestjs-redis";
import { MailerService } from "@nestjs-modules/mailer";
import { hashSync, genSaltSync } from 'bcrypt'

@Resolver()
export class AuthenticationResolver {

  constructor(
    private readonly authService: AuthenticationService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly mailerService: MailerService
  ) {}

  private redisClient = this.redisService.getClient()

  @Mutation(returns => SignInResponse)
  async signIn(
    @Args() payload: SignInPayload
  ): Promise<SignInResponse> {
    const user = await this.userService.findByUsername(payload.email)
    if (!user)
      throw new BadRequestException(`User dengan email '${payload.email}' tidak ditemukan`)

    else if (!this.userService.comparePassword(payload.password, user.password))
      throw new BadRequestException('Kata sandi salah')

    else if (!user.isActive)
      throw new BadRequestException('Akun anda telah dinonaktifkan, silahkan hubungi Administrator untuk mengaktifkan kembali')

    const accessTokenExpiration = payload.rememberMe ? Math.floor(Date.now() / 1000) + (60 * 60) * 24 : Math.floor(Date.now() / 1000) + (60 * 60) // default 1 hour, remember me 1 day
    const refreshTokenExpiration = payload.rememberMe ? Math.floor(Date.now() / 1000) + (60 * 60) * 24 * 30 : Math.floor(Date.now() / 1000) + (60 * 60) * 24 // 1 day, remember me 31 day

    const accessToken = sign({
      exp: accessTokenExpiration,
      data: user.email,
    }, this.configService.get<string>('JWT_SECRET'))

    const refreshToken = sign({
      exp: refreshTokenExpiration,
      data: user.email,
      rememberMe: payload.rememberMe
    }, `${this.configService.get<string>('JWT_SECRET')}-refresh`)

    this.userService.updateLastLogin(user._id, new Date()).catch((error) => console.log(error))

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

  @Mutation(returns => Boolean)
  async resetPassword(
    @Args() { password, passwordConfirmation, token }: ResetPasswordPayload
  ) {
    try {
      const findToken = await this.redisClient.get(token)
      if (!findToken) throw new BadRequestException('Tautan telah kadaluwarsa atau tautan telah digunakan.')

      const findUser = await this.userService.findByUsername(findToken)
      if (!findUser) throw new BadRequestException(`User dengan email '${findToken}' tidak ditemukan`)

      await this.userService.updateUser(findUser._id, {
        password: hashSync(password, genSaltSync(12))
      })

      await this.redisClient.del(token)

      return true
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

  @Mutation(returns => Boolean)
  async requestResetPasswordLink(
    @Args() { email }: RequestResetPasswordPayload 
  ) {
    try {
      const findUser = await this.userService.findByUsername(email)
      if (!findUser)
       throw new NotFoundException(`User dengan email '${email}' tidak ditemukan`)

      const token = uuidv4() // sign token with uuid v4

      await this.redisClient.set(token, email, 'EX', (60 * 60) * 60)
      await this.mailerService.sendMail({
        from: this.configService.get<string>("SMTP_AUTH_USERNAME"),
        to: email,
        subject: 'ATUR ULANG KATA SANDI',
        template: './reset-password',
        context: {
          name: findUser.fullname,
          url: this.configService.get<string>('FRONTEND_URL') + 'auth/reset-kata-sandi?token=' + token
        }
      })

      return true
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

}
