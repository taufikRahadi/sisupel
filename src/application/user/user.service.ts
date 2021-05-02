import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "src/model/user.model";
import { compareSync, genSaltSync, hashSync } from 'bcrypt';
import { Role, RoleDocument } from "src/model/role.model";
import { RolePrivilege, RolePrivilegeDocument } from "src/model/role-privileges.model";
import { Unit, UnitDocument } from "src/model/unit.model";

@Injectable()
export class UserService {

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(RolePrivilege.name) private rolePrivilege: Model<RolePrivilegeDocument>,
    @InjectModel(Unit.name) private readonly unitModel: Model<UnitDocument>,
  ) {}

  async findByUsername(username: string, populate?: string[] | object[]) {
    try {
      return await this.userModel.findOne({
        username
      }).populate(populate)
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

  async findById(id: string) {
    try {
      return await this.userModel.findById(id)
    } catch (error) {
      throw new InternalServerErrorException(error)
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
      if (error.code == 11000) throw new BadRequestException(`User dengan username '${user.username}' sudah di gunakan`)

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
