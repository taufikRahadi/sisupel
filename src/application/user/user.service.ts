import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "src/model/user.model";
import { compareSync, genSaltSync, hashSync } from 'bcrypt';

@Injectable()
export class UserService {

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) {}

  async findUserByEmail(email: string) {
    try {
      const user = await this.userModel.findOne({
        email
      });

      // if (!user) throw new BadRequestException(`user dengan email ${email} tidak ditemukan`)

      return user;
    } catch (error) {      
      throw new InternalServerErrorException('terjadi masalah pada server')
    }
  }

  async comparePassword(password: string, hashed: string) {
    return compareSync(password, hashed);
  }

  async hashPassword(password: string) {
    return hashSync(password, genSaltSync(12));
  }

}
