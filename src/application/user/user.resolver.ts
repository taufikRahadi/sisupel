import { BadRequestException, InternalServerErrorException, UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Parent, Query, ResolveField, Resolver } from "@nestjs/graphql";
import { PrivilegesGuard } from "src/infrastructure/privileges.guard";
import { UserGuard } from "src/infrastructure/user.guard";
import { User } from "src/model/user.model";
import { IsAllowTo } from "src/utils/decorators/privileges.decorator";
import { UserService } from "./user.service";
import { ChangePasswordArgs, CreateUserPayload, UpdateMyProfile } from "./user.type";
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

  @UseGuards(UserGuard)
  @Mutation(returns => User)
  async updateMyProfile(
    @Context('user') { _id, photo }: User,
    @Args() { fullname }: UpdateMyProfile,
    @Args('picture', { name: 'picture', type: () => GraphQLUpload, nullable: true }) picture: FileUpload
  ) {
    let fName: string;
    if (picture) {
      fName = await this.uploadPhoto(picture)
      this.removeFile(photo)
    }
 
    const updateUser = await this.userService.updateUser(_id, {
      fullname,
      photo: fName
    })

    return await this.userService.findById(_id)
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

  private uploadPhoto({ createReadStream, encoding, filename, mimetype }: FileUpload): Promise<string> {
    const fName = `${Date.now()}-profile.${mimetype.split('/')[1]}`
    const upload: Promise<string> = new Promise((resolve, reject) => createReadStream()
      .pipe(createWriteStream('public/photo-profile/' + fName))
      .on('finish', async () => {
        resolve(fName)        
      })
      .on('error', (err) => {
        reject(err)
      })
    )

    return upload
  }

  private removeFile(userPhoto: string) {
    unlink(join(process.cwd(), 'public/photo-profile/' + userPhoto), (err) => {
      if (err) console.log('error deleting file', err)
    })
  }

  @UseGuards(UserGuard, PrivilegesGuard)
  @Mutation(returns => Boolean)
  async changeProfilePhoto(
    @Context('user') { _id }: User,
    @Args('picture', { name: 'picture', type: () => GraphQLUpload, nullable: false }) picture: FileUpload
  ) {
    try {
      const userPhoto = (await this.userService.findById(_id)).photo
      const fName = await this.uploadPhoto(picture)
      await this.userService.changeProfilePicture(_id, fName)

      this.removeFile(userPhoto)
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

  @Mutation(returns => Boolean)
  @UseGuards(UserGuard)
  async changePassword(
    @Context('user') user: User,
    @Args() payload: ChangePasswordArgs
  ) {
    const userData = await this.userService.findById(user._id)

    if (!this.userService.comparePassword(payload.oldPassword, userData.password)) 
      throw new BadRequestException('Password lama yang anda masukkan salah')

    const newPassword = this.userService.hashPassword(payload.newPassword)
    const userUpdate = await this.userService.updateUser(user._id, {
      password: newPassword
    })

    return true
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
