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

}
