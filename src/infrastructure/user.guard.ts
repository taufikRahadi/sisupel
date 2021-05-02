import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GqlExecutionContext } from "@nestjs/graphql";
import { verify, decode } from 'jsonwebtoken';
import { UserService } from "src/application/user/user.service";

@Injectable()
export class UserGuard implements CanActivate {

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const ctx = GqlExecutionContext.create(context).getContext();
      const authorization = ctx.headers.authorization;
      
      if (!authorization) throw new UnauthorizedException('anda tidak memiliki akses, silahkan login terlebih dahulu')

      const [ type, token ] = authorization.split(' ');
      if (type !== 'Bearer' || !token) throw new UnauthorizedException('token tidak valid')

      if (!verify(token, this.configService.get<string>('JWT_SECRET'))) throw new UnauthorizedException('token tidak valid')

      const { data }: any = decode(token);

      ctx['user'] = await this.userService.findByUsername(data, [
        {
          path: 'role',
          populate: {
            path: 'privileges',
            model: 'RolePrivilege'
          }
        },
        {
          path: 'unit'
        }
      ]);

      return true;
    } catch (error) {
      console.log(error);
      
      throw new UnauthorizedException('anda tidak memiliki akses, silahkan login terlebih dahulu')
    }
  }
}
