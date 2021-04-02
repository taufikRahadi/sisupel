import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { User } from "src/model/user.model";
import { UserService } from "../user/user.service";
import { SignInPayload, SignInResponse } from "./authentication.type";
import { sign } from 'jsonwebtoken';
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthenticationService {

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService
  ) {}

  public async signIn(signInPayload: SignInPayload): Promise<SignInResponse> {
    // try {
      const findUser = await this.userService.findUserByEmail(signInPayload.email);

      if (!findUser) throw new BadRequestException(`user dengan email ${signInPayload.email} tidak ditemukan`)

      if (!this.userService.comparePassword(signInPayload.password, findUser.password))
        throw new BadRequestException('password yang anda masukkan salah')

      const accessTokenExpiration = signInPayload.rememberMe ? Math.floor(Date.now() / 1000) + (60 * 60) * 24 : Math.floor(Date.now() / 1000) + (60 * 60) // default 1 hour, remember me 1 day
      const refreshTokenExpiration = signInPayload.rememberMe ? Math.floor(Date.now() / 1000) + (60 * 60) * 24 * 30 : Math.floor(Date.now() / 1000) + (60 * 60) * 24 // 1 day, remember me 31 day

      const accessToken = this.generateToken(findUser.email, accessTokenExpiration)
      const refreshToken = this.generateToken(findUser.email, refreshTokenExpiration, this.configService.get<string>('JWT_SECRET') + '-refresh')

      return { accessToken, refreshToken }
  }

  public generateToken(
    data: any, 
    expirationTime: number, 
    secret: string = this.configService.get<string>('JWT_SECRET')
  ): string {
    return sign({
      exp: expirationTime,
      data: data
    }, secret)
  }

  public async register(user: User) {

  }

}
