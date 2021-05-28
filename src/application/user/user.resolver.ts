import { BadRequestException, UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Parent, Query, ResolveField, Resolver } from "@nestjs/graphql";
import { PrivilegesGuard } from "src/infrastructure/privileges.guard";
import { UserGuard } from "src/infrastructure/user.guard";
import { User } from "src/model/user.model";
import { IsAllowTo } from "src/utils/decorators/privileges.decorator";
import { UserService } from "./user.service";
import { CreateUserPayload } from "./user.type";
import { GraphQLUpload } from 'apollo-server-express'
import { FileUpload } from 'graphql-upload'
import { createWriteStream } from "fs";

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

  @UseGuards(UserGuard, PrivilegesGuard)
  @Mutation(returns => Boolean)
  async changeProfilePhoto(
    @Context('user') { _id }: User,
    @Args('picture', { name: 'picture', type: () => GraphQLUpload, nullable: false }) { createReadStream, filename, mimetype }: FileUpload
  ) {
    const fName = `${Date.now()}-profile.${mimetype.split('/')[1]}`
    const upload = new Promise((resolve, reject) => createReadStream()
      .pipe(createWriteStream('public/photo-profile/' + fName))
      .on('finish', async () => {
        resolve(true)        
      })
      .on('error', (err) => {
        reject(err)
      })
    )

    try {
      await upload
      await this.userService.changeProfilePicture(_id, fName)
      return true
    } catch (error) {
      throw new BadRequestException(error)
    }
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

  @ResolveField('photo', returns => String)
  async getPhoto(
    @Parent() { photo }: User
  ) {
    return `/photo-profile/${photo}`
  }

}
