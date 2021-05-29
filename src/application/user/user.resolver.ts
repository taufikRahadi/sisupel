import { BadRequestException, InternalServerErrorException, UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Parent, Query, ResolveField, Resolver } from "@nestjs/graphql";
import { PrivilegesGuard } from "src/infrastructure/privileges.guard";
import { UserGuard } from "src/infrastructure/user.guard";
import { User } from "src/model/user.model";
import { IsAllowTo } from "src/utils/decorators/privileges.decorator";
import { UserService } from "./user.service";
import { CreateUserPayload } from "./user.type";
import { GraphQLUpload } from 'apollo-server-express'
import { FileUpload } from 'graphql-upload'
import { createWriteStream, unlink } from "fs";
import { join } from "path";
import { Unit, UnitDocument } from "src/model/unit.model";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

@Resolver(of => User)
export class UserResolver {

  constructor(
    private readonly userService: UserService,
    @InjectModel(Unit.name) private readonly unitModel: Model<UnitDocument>
  ) {}

  @UseGuards(UserGuard, PrivilegesGuard)
  @Query(returns => User)
  public async userProfile(
    @Context('user') user: User
  ) {
    return user
  }

  @Mutation(returns => Boolean)
  @UseGuards(UserGuard)
  async resetProfilePhoto(
    @Context('user') { _id }: User
  ) {
    try {
      const userPhoto = (await this.userService.findById(_id)).photo
      await this.userService.changeProfilePicture(_id, '')

      unlink(join(process.cwd(), 'public/photo-profile/' + userPhoto), (err) => {
        if (err) console.log('error deleting file', err)
      })
      return true
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
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
      const userPhoto = (await this.userService.findById(_id)).photo
      await upload
      await this.userService.changeProfilePicture(_id, fName)

      unlink(join(process.cwd(), 'public/photo-profile/' + userPhoto), (err) => {
        if (err) console.log('error deleting file', err)
      })
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

  @ResolveField('unit', returns => Unit)
  async getUnit(@Parent() { unit }: User) {
    return await this.unitModel.findById(unit)
  }

  @ResolveField('photo', returns => String)
  async getPhoto(
    @Parent() { photo }: User
  ) {
    if (photo.length > 1) return `/photo-profile/${photo}`
    return photo
  }

}
