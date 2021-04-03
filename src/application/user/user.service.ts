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
      console.log(error);
         
      throw new InternalServerErrorException('terjadi masalah pada server')
    }
  }

  async create(user: User) {
    try {
      user.password = this.hashPassword(user.password);
      const newUser = await this.userModel.create({
        ...user
      });

      return newUser;
    } catch (error) {
      if (error.code == 11000) throw new BadRequestException(`alamat email / no hp sudah digunakan`)

      throw new InternalServerErrorException('terjadi masalah pada server')
    }
  }

  comparePassword(password: string, hashed: string) {
    return compareSync(password, hashed);
  }

  hashPassword(password: string): string {
    return hashSync(password, genSaltSync(12));
  }

}
