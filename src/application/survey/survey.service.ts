import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Survey, SurveyDocument } from "src/model/survey.model";
import { Unit, UnitDocument } from "src/model/unit.model";
import { DateRange } from "src/utils/types/date-range.type";
import { Types } from 'mongoose'
import { CalculateAverage, CalculateAverageUnitGlobal, CalculateEssayResponse, SurveyBody, SurveyBodyPayload, SurveyLinkStatusResponse } from "./survey.type";
import { RedisService } from "nestjs-redis";

const ObjectId = Types.ObjectId
// const ISODate = Types.Is
@Injectable()
export class SurveyService {

  constructor(
    @InjectModel(Survey.name) private readonly surveyModel: Model<SurveyDocument>,
    @InjectModel(Unit.name) private readonly unitModel: Model<UnitDocument>,
    private readonly redisService: RedisService
  ) {}

  private redisClient = this.redisService.getClient()

  async create(survey: Survey): Promise<Survey> {
    try {
      // const surveys = await this.

      return await this.surveyModel.create(survey)
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

  async countEssayUnit(id: string) {
    try {
      const today = new Date();
      const essays = await this.surveyModel.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $match: {
            body: {
              $elemMatch: {
                text: { $exists: true }
              }
            }
          }
        },
        {
          $unwind: "$user"
        },
        {
          $lookup: {
            from: "units",
            localField: "user.unit",
            foreignField: "_id",
            as: "unit"
          }
        },
        {
          $unwind: "$unit"
        },
        {
          $match: {
            "unit._id": ObjectId(id),
            // "role.name": "FRONT DESK"
          }
        }
      ]);

      const todayTotal = await this.surveyModel.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $match: {
            body: {
              $elemMatch: {
                text: { $exists: true }
              }
            },
            $expr: {
              $eq: [{'$dayOfMonth': '$createdAt'}, today.getDate()]
            }
          }
        },
        {
          $unwind: "$user"
        },
        {
          $lookup: {
            from: "units",
            localField: "user.unit",
            foreignField: "_id",
            as: "unit"
          }
        },
        {
          $unwind: "$unit"
        },
        {
          $match: {
            "unit._id": ObjectId(id),
          }
        }
      ]);

      const yesterdayTotal = await this.surveyModel.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $match: {
            body: {
              $elemMatch: {
                text: { $exists: true }
              }
            },
            $expr: {
              $eq: [{'$dayOfMonth': '$createdAt'}, today.getDate() - 1]
            }
          }
        },
        {
          $unwind: "$user"
        },
        {
          $lookup: {
            from: "units",
            localField: "user.unit",
            foreignField: "_id",
            as: "unit"
          }
        },
        {
          $unwind: "$unit"
        },
        {
          $match: {
            "unit._id": ObjectId(id),
          }
        }
      ]);

      return {
        total: essays.length,
        yesterdayTotal: yesterdayTotal.length,
        todayTotal: todayTotal.length
      }

    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

  async checkNoAntrianRedis(noAntrian: string) {
    const key = await this.redisClient.get(noAntrian)

    if (!key)
      throw new BadRequestException('Link tidak ditemukan')
    
    return true
  }

  async removeNoAntrianFromRedis(key: string) {
    try {
      await this.redisClient.set(key, 'false')
      return true
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

  async getNoAntrianStatus(): Promise<SurveyLinkStatusResponse[]> {
    try {
      const date = new Date()
      const dateString = `/${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}/`

      let checker: boolean = true
      let num = 1
      const noAntrianArray: Array<SurveyLinkStatusResponse> = []
      while (checker) {
        const surveyLinkOnRedis = await this.redisClient.get(dateString + num)
        
        if (surveyLinkOnRedis === null) {
          checker = false
        } else {
          noAntrianArray.push({ link: dateString + num, status: Boolean(JSON.parse(surveyLinkOnRedis)) ? true : Boolean(JSON.parse(surveyLinkOnRedis)) })
          num++
        }
      }

      return noAntrianArray
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

  async getNoAntrian(unit: string) {
    const date = new Date()
    try {
      const surveys = await this.surveyModel.aggregate([{
        $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'user'
        }
      }, {
          $unwind: {
              path: "$user",
          }
      }, {
          $match: {
              "user.unit": ObjectId(unit),
              "createdAt": {
                  $gt: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 8, 0)
              }
          }
      }])

      const dateString = `/${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}/`
      let length = surveys.length + 1
      let checker = true
      while (checker) {
        if (await this.redisClient.get(dateString + length)) {
          length++
        } else {
          checker = false
          break
        }
      }

      const link = dateString + length
      await this.redisClient.set(
        link, 
        String(
          Math.floor(
            Number(new Date()) / 1000
          )
        )
      )
      return link
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

  async countEssayGlobal(): Promise<CalculateEssayResponse> {
    try {
      const today = new Date();
      const essays = await this.surveyModel.aggregate([
        {
          $match: {
            body: {
              $elemMatch: {
                text: { $exists: true }
              }
            }
          }
        }
      ]);

      const todayTotal = await this.surveyModel.aggregate([
        {
          $match: {
            body: {
              $elemMatch: {
                text: { $exists: true }
              }
            },
            $expr: {
              $eq: [{'$dayOfMonth': '$createdAt'}, today.getDate()]
            }
          }
        }
      ]);

      const yesterdayTotal = await this.surveyModel.aggregate([
        {
          $match: {
            body: {
              $elemMatch: {
                text: { $exists: true }
              }
            },
            $expr: {
              $eq: [{'$dayOfMonth': '$createdAt'}, today.getDate() - 1]
            }
          }
        }
      ]);

      return {
        total: essays.length,
        yesterdayTotal: yesterdayTotal.length,
        todayTotal: todayTotal.length
      }

    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

  async countEssayFrontdeskHaloUT(id: string, role: 'HALO UT' | 'FRONT DESK' ) {
    try {
      const today = new Date();
      const essays = await this.surveyModel.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $match: {
            body: {
              $elemMatch: {
                text: { $exists: true }
              }
            }
          }
        },
        {
          $unwind: "$user"
        },
        {
          $lookup: {
            from: "roles",
            localField: "user.role",
            foreignField: "_id",
            as: "role"
          }
        },
        {
          $unwind: "$role"
        },
        {
          $lookup: {
            from: "units",
            localField: "user.unit",
            foreignField: "_id",
            as: "unit"
          }
        },
        {
          $unwind: "$unit"
        },
        {
          $match: {
            "user._id": ObjectId(id),
            "role.name": role
          }
        }
      ]);

      const todayTotal = await this.surveyModel.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $match: {
            body: {
              $elemMatch: {
                text: { $exists: true }
              }
            },
            $expr: {
              $eq: [{'$dayOfMonth': '$createdAt'}, today.getDate()]
            }
          }
        },
        {
          $unwind: "$user"
        },
        {
          $lookup: {
            from: "roles",
            localField: "user.role",
            foreignField: "_id",
            as: "role"
          }
        },
        {
          $unwind: "$role"
        },
        {
          $lookup: {
            from: "units",
            localField: "user.unit",
            foreignField: "_id",
            as: "unit"
          }
        },
        {
          $unwind: "$unit"
        },
        {
          $match: {
            "user._id": ObjectId(id),
            "role.name": role
          }
        }
      ]);

      const yesterdayTotal = await this.surveyModel.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $match: {
            body: {
              $elemMatch: {
                text: { $exists: true }
              }
            },
            $expr: {
              $eq: [{'$dayOfMonth': '$createdAt'}, today.getDate() - 1]
            }
          }
        },
        {
          $unwind: "$user"
        },
        {
          $lookup: {
            from: "roles",
            localField: "user.role",
            foreignField: "_id",
            as: "role"
          }
        },
        {
          $unwind: "$role"
        },
        {
          $lookup: {
            from: "units",
            localField: "user.unit",
            foreignField: "_id",
            as: "unit"
          }
        },
        {
          $unwind: "$unit"
        },
        {
          $match: {
            "user._id": ObjectId(id),
            "role.name": role
          }
        }
      ]);

      return {
        total: essays.length,
        yesterdayTotal: yesterdayTotal.length,
        todayTotal: todayTotal.length
      }

    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async getSurveys(
    sort: string, limit: number, range: DateRange, unit?: string,
  ) {
    let pipeline: any[] = [];
    if (unit) {
      pipeline = [
        {
          $match: {
            unit: ObjectId(unit)
          }
        },
        {
          $lookup: {
            from: 'units',
            localField: 'unit',
            foreignField: '_id',
            as: 'unit'
          }
        },
        {
          $unwind: '$unit'
        }
      ]
    } else {
      pipeline = [
        {
          $lookup: {
            from: 'units',
            localField: 'unit',
            foreignField: '_id',
            as: 'unit'
          }
        },
        {
          $unwind: '$unit'
        },
      ]
    }

    try {
      const surveys = await this.surveyModel.aggregate([
        {
          $lookup: {
            from: 'users',
            let: { 'user': '$_id' },
            as: 'user',
            pipeline
          }
        },
        {
          $unwind: '$user'
        },
        {
          $match: {
            createdAt: {
              $gte: new Date(`${new Date(range.from.setDate(range.from.getDate()-1)).toISOString().replace('T00','T17')}`),
              $lte: new Date(`${new Date(range.to.setDate(range.to.getDate())).toISOString().replace('T00','T17')}`)
            }
          }
        },
      ])
      .sort({ createdAt: sort })

      console.log(surveys)

      return surveys
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

  async getMySurvey(user: string, sort: 'asc' | 'desc' | string = 'asc', limit: number | undefined, range: DateRange) {
    try {
      const surveys = await this.surveyModel
        .find({
          $and: [
            { "user": user },
            { 
              createdAt: {
                $gte: new Date(`${new Date(range.from.setDate(range.from.getDate()-1)).toISOString().replace('T00','T17')}`),
                $lte: new Date(`${new Date(range.to.setDate(range.to.getDate())).toISOString().replace('T00','T17')}`)
              }
            }
          ] 
        })
        .sort({ 'createdAt': sort })
        .limit(limit)
      return surveys
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

  async calculateAverageFrontdeskHaloUT(user?: string, range?: DateRange) {
    try {
      if (!range) {
        const questionnares_mean = await this.surveyModel.aggregate([
          {
            $lookup: {
              from: "users",
              localField: "user",
              foreignField: "_id",
              as: "user"
            }
          },
          {
            $unwind: "$user"
          },
          {
            $match: {
              "user._id": ObjectId(user)
            }
          },
          {
            $unwind: "$body",
          },
          {
            $group: {
              _id: {
                _id: "$body.question",
                user: "$user"
              },
              answers: {
                $push: "$body.answer"
              },
              total: {
                $sum: 1
              }
            }
          },
          {
            $unwind: "$answers"
          },
          {
            $lookup: {
              from: "surveyquestions",
              localField: "_id._id",
              foreignField: "_id",
              as: "question"
            }
          },
          {
            $match: {
              "question.type": {
                $eq: "KUESIONER"
              }
            }
          },
          {
            $lookup: {
              from: "surveyanswers",
              localField: "answers",
              foreignField: "_id",
              as: "answers"
            }
          },
          {
            $unwind: "$answers"
          },
          {
            $group: {
              _id: {
                _id: "$_id",
                total: "$total",
                user: "$user"
              },
              averageAnswer: {
                $avg: "$answers.value"
              },
              question: {
                $first: "$question.question"
              },
              order: {
                $first: "$question.order"
              }
            }
          },
          {
            $sort: {
              order: 1
            }
          },
          {
            $project: {
              _id: 0,
              count: "$_id.total",
              user: "$_id._id.user",
              surveyQuestion: {
                $first: "$question"
              },
              order: {
                $first: "$order"
              },
              averageAnswer: 1
            }
          }
        ]);
        
        return questionnares_mean;
      }

      const questionnares_mean = await this.surveyModel.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(`${new Date(range.from.setDate(range.from.getDate()-1)).toISOString().replace('T00','T17')}`),
              $lte: new Date(`${new Date(range.to.setDate(range.to.getDate())).toISOString().replace('T00','T17')}`)
            }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $unwind: "$user"
        },
        {
          $match: {
            "user._id": ObjectId(user)
          }
        },
        {
          $unwind: "$body",
        },
        {
          $group: {
            _id: {
              _id: "$body.question",
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
              year: { $year: "$createdAt" },
              user: "$user"
            },
            answers: {
              $push: "$body.answer"
            },
            total: {
              $sum: 1
            }
          }
        },
        {
          $unwind: "$answers"
        },
        {
          $lookup: {
            from: "surveyquestions",
            localField: "_id._id",
            foreignField: "_id",
            as: "question"
          }
        },
        {
          $match: {
            "question.type": {
              $eq: "KUESIONER"
            }
          }
        },
        {
          $lookup: {
            from: "surveyanswers",
            localField: "answers",
            foreignField: "_id",
            as: "answers"
          }
        },
        {
          $unwind: "$answers"
        },
        {
          $group: {
            _id: {
              _id: "$_id",
              total: "$total",
              month: "$month",
              day: "$day",
              year: "$year",
              user: "$user"
            },
            averageAnswer: {
              $avg: "$answers.value"
            },
            question: {
              $first: "$question.question"
            },
            order: {
              $first: "$question.order",
            }
          }
        },
        {
          $project: {
            _id: 0,
            count: "$_id.total",
            surveyQuestion: {
              $first: "$question"
            },
            date: {
              $dateFromString: {
                dateString: {
                  $concat: [
                    {
                      $toString: "$_id._id.year"
                    }, 
                    "-", 
                    {
                      $toString: "$_id._id.month"
                    },
                    "-", 
                    {
                      $toString: "$_id._id.day"
                    },
                  ]
                }
              }
            },
            user: "$_id._id.user",
            averageAnswer: 1,
            order: {
              $first: "$order"
            }
          },
        },
        {
          $sort: {
            date: 1,
            order: 1
          }
        },
        {
          $project: {
            averageAnswer: 1,
            count: 1,
            surveyQuestion: 1,
            order: 1,
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$date" }
            },
            user: 1
          }
        }
      ]);

      return questionnares_mean;
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

  async calculateAverageFrontdeskHaloUTAccumulative(user?: string, range?: DateRange) {
    try {
      if (!range) {
        const questionnares_mean = await this.surveyModel.aggregate([
          {
            $lookup: {
              from: "users",
              localField: "user",
              foreignField: "_id",
              as: "user"
            }
          },
          {
            $unwind: "$user"
          },
          {
            $match: {
              "user._id": ObjectId(user)
            }
          },
          {
            $unwind: "$body",
          },
          {
            $group: {
              _id: {
                _id: "$body.question",
                user: "$user"
              },
              answers: {
                $push: "$body.answer"
              },
              total: {
                $sum: 1
              }
            }
          },
          {
            $unwind: "$answers"
          },
          {
            $lookup: {
              from: "surveyquestions",
              localField: "_id._id",
              foreignField: "_id",
              as: "question"
            }
          },
          {
            $match: {
              "question.type": {
                $eq: "KUESIONER"
              }
            }
          },
          {
            $lookup: {
              from: "surveyanswers",
              localField: "answers",
              foreignField: "_id",
              as: "answers"
            }
          },
          {
            $unwind: "$answers"
          },
          {
            $group: {
              _id: {
                _id: "$_id",
                total: "$total",
                user: "$user"
              },
              averageAnswer: {
                $avg: "$answers.value"
              },
              question: {
                $first: "$question.question"
              }
            }
          },
          {
            $project: {
              _id: 0,
              count: "$_id.total",
              user: "$_id._id.user",
              surveyQuestion: {
                $first: "$question"
              },
              averageAnswer: 1
            }
          },
          {
            $group: {
              _id: "$user",
              questionCount: {
                $sum: "$count"
              },
              totalQuestions: {
                $sum: 1
              },
              averageAnswer: {
                $avg: "$averageAnswer"
              },
              questions: {
                $push: "$surveyQuestion"
              },
            }
          },
          {
            $project: {
              _id: 0,
              user: "$_id",
              count: {
                $divide: [ "$questionCount", "$totalQuestions" ]
              },
              averageAnswer: 1
            }
          }
        ]);
        
        return questionnares_mean;
      }

      const questionnares_mean = await this.surveyModel.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(`${new Date(range.from.setDate(range.from.getDate()-1)).toISOString().replace('T00','T17')}`),
              $lte: new Date(`${new Date(range.to.setDate(range.to.getDate())).toISOString().replace('T00','T17')}`)
            }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $unwind: "$user"
        },
        {
          $match: {
            "user._id": ObjectId(user)
          }
        },
        {
          $unwind: "$body",
        },
        {
          $group: {
            _id: {
              _id: "$body.question",
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
              year: { $year: "$createdAt" },
              user: "$user"
            },
            answers: {
              $push: "$body.answer"
            },
            total: {
              $sum: 1
            }
          }
        },
        {
          $unwind: "$answers"
        },
        {
          $lookup: {
            from: "surveyquestions",
            localField: "_id._id",
            foreignField: "_id",
            as: "question"
          }
        },
        {
          $match: {
            "question.type": {
              $eq: "KUESIONER"
            }
          }
        },
        {
          $lookup: {
            from: "surveyanswers",
            localField: "answers",
            foreignField: "_id",
            as: "answers"
          }
        },
        {
          $unwind: "$answers"
        },
        {
          $group: {
            _id: {
              _id: "$_id",
              total: "$total",
              month: "$month",
              day: "$day",
              year: "$year",
              user: "$user"
            },
            averageAnswer: {
              $avg: "$answers.value"
            },
            question: {
              $first: "$question.question"
            }
          }
        },
        {
          $project: {
            _id: 0,
            count: "$_id.total",
            surveyQuestion: {
              $first: "$question"
            },
            date: {
              $concat: [
                {
                  $toString: "$_id._id.year"
                }, 
                "-", 
                {
                  $toString: "$_id._id.month"
                },
                "-", 
                {
                  $toString: "$_id._id.day"
                },
              ]
            },
            user: "$_id._id.user",
            averageAnswer: 1
          }
        },
        {
          $group: {
            _id: "$date",
            questionCount: {
              $sum: "$count"
            },
            totalQuestions: {
              $sum: 1
            },
            averageAnswer: {
              $avg: "$averageAnswer"
            },
            questions: {
              $push: "$surveyQuestion"
            },
            user: {
              $first: "$user"
            },
          }
        },
        {
          $project: {
            _id: 0,
            date: {
              $dateFromString: {
                dateString: "$_id"
              }
            },
            count: {
              $divide: [ "$questionCount", "$totalQuestions" ]
            },
            averageAnswer: 1,
            user: 1
          }
        },
        {
          $sort: {
            date: 1
          }
        },
        {
          $project: {
            averageAnswer: 1,
            user: 1,
            count: 1,
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$date" }
            }
          }
        }
      ]);

      return questionnares_mean;
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

  async calculateQuestionnareGlobal(range?: DateRange) {
    try {
      if (!range) {
        const questionnares_mean = await this.surveyModel.aggregate([
          {
            $unwind: "$body",
          },
          {
            $group: {
              _id: "$body.question",
              answers: {
                $push: "$body.answer"
              },
              total: {
                $sum: 1
              }
            }
          },
          {
            $unwind: "$answers"
          },
          {
            $lookup: {
              from: "surveyquestions",
              localField: "_id",
              foreignField: "_id",
              as: "question"
            }
          },
          {
            $match: {
              "question.type": {
                $eq: "KUESIONER"
              }
            }
          },
          {
            $lookup: {
              from: "surveyanswers",
              localField: "answers",
              foreignField: "_id",
              as: "answers"
            }
          },
          {
            $unwind: "$answers"
          },
          {
            $group: {
              _id: {
                _id: "$_id",
                total: "$total"
              },
              averageAnswer: {
                $avg: "$answers.value"
              },
              question: {
                $first: "$question.question"
              },
              order: {
                $first: "$question.order"
              }
            }
          },
          {
            $sort: {
              order: 1
            }
          },
          {
            $project: {
              _id: 0,
              count: "$_id.total",
              surveyQuestion: {
                $first: "$question"
              },
              averageAnswer: 1,
              order: {
                $first: "$order"
              }
            }
          }
        ]);
        
        return questionnares_mean;
      }

      const questionnares_mean = await this.surveyModel.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(`${new Date(range.from.setDate(range.from.getDate()-1)).toISOString().replace('T00','T17')}`),
              $lte: new Date(`${new Date(range.to.setDate(range.to.getDate())).toISOString().replace('T00','T17')}`)
            }
          }
        },
        {
          $unwind: "$body",
        },
        {
          $group: {
            _id: {
              _id: "$body.question",
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
              year: { $year: "$createdAt" }
            },
            answers: {
              $push: "$body.answer"
            },
            total: {
              $sum: 1
            }
          }
        },
        {
          $unwind: "$answers"
        },
        {
          $lookup: {
            from: "surveyquestions",
            localField: "_id._id",
            foreignField: "_id",
            as: "question"
          }
        },
        {
          $match: {
            "question.type": {
              $eq: "KUESIONER"
            }
          }
        },
        {
          $lookup: {
            from: "surveyanswers",
            localField: "answers",
            foreignField: "_id",
            as: "answers"
          }
        },
        {
          $unwind: "$answers"
        },
        {
          $group: {
            _id: {
              _id: "$_id",
              total: "$total",
              month: "$month",
              day: "$day",
              year: "$year"
            },
            averageAnswer: {
              $avg: "$answers.value"
            },
            question: {
              $first: "$question.question"
            },
            order: {
              $first: "$question.order",
            }
          }
        },
        {
          $project: {
            _id: 0,
            count: "$_id.total",
            surveyQuestion: {
              $first: "$question"
            },
            date: {
              $dateFromString: {
                dateString: {
                  $concat: [
                    {
                      $toString: "$_id._id.year"
                    }, 
                    "-", 
                    {
                      $toString: "$_id._id.month"
                    },
                    "-", 
                    {
                      $toString: "$_id._id.day"
                    },
                  ]
                }
              }
            },
            averageAnswer: 1,
            order: {
              $first: "$order"
            }
          }
        },
        {
          $sort: {
            date: 1,
            order: 1
          }
        },
        {
          $project: {
            averageAnswer: 1,
            count: 1,
            surveyQuestion: 1,
            order: 1,
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$date" }
            },
          }
        }
      ]);

      return questionnares_mean;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async calculateQuestionnareGlobalAccumulative(range?: DateRange) {
    try {
      if (!range) {
        const questionnares_mean = await this.surveyModel.aggregate([
          {
            $unwind: "$body",
          },
          {
            $group: {
              _id: {
                _id: "$body.question",
              },
              answers: {
                $push: "$body.answer"
              },
              total: {
                $sum: 1
              }
            }
          },
          {
            $unwind: "$answers"
          },
          {
            $lookup: {
              from: "surveyquestions",
              localField: "_id._id",
              foreignField: "_id",
              as: "question"
            }
          },
          {
            $match: {
              "question.type": {
                $eq: "KUESIONER"
              }
            }
          },
          {
            $lookup: {
              from: "surveyanswers",
              localField: "answers",
              foreignField: "_id",
              as: "answers"
            }
          },
          {
            $unwind: "$answers"
          },
          {
            $group: {
              _id: {
                _id: "$_id",
                total: "$total",
              },
              averageAnswer: {
                $avg: "$answers.value"
              },
              question: {
                $first: "$question.question"
              }
            }
          },
          {
            $project: {
              _id: 0,
              count: "$_id.total",
              surveyQuestion: {
                $first: "$question"
              },
              averageAnswer: 1
            }
          },
          {
            $group: {
              _id: "$count",
              averageAnswer: {
                $avg: "$averageAnswer"
              },
              questions: {
                $push: "$surveyQuestion"
              },
            }
          },
          {
            $project: {
              _id: 0,
              count: "$_id",
              averageAnswer: 1
            }
          }
        ]);
        
        return questionnares_mean;
      }

      const questionnares_mean = await this.surveyModel.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(`${new Date(range.from.setDate(range.from.getDate()-1)).toISOString().replace('T00','T17')}`),
              $lte: new Date(`${new Date(range.to.setDate(range.to.getDate())).toISOString().replace('T00','T17')}`)
            }
          }
        },
        {
          $unwind: "$body",
        },
        {
          $group: {
            _id: {
              _id: "$body.question",
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
              year: { $year: "$createdAt" },
            },
            answers: {
              $push: "$body.answer"
            },
            total: {
              $sum: 1
            }
          }
        },
        {
          $unwind: "$answers"
        },
        {
          $lookup: {
            from: "surveyquestions",
            localField: "_id._id",
            foreignField: "_id",
            as: "question"
          }
        },
        {
          $match: {
            "question.type": {
              $eq: "KUESIONER"
            }
          }
        },
        {
          $lookup: {
            from: "surveyanswers",
            localField: "answers",
            foreignField: "_id",
            as: "answers"
          }
        },
        {
          $unwind: "$answers"
        },
        {
          $group: {
            _id: {
              _id: "$_id",
              total: "$total",
              month: "$month",
              day: "$day",
              year: "$year",
            },
            averageAnswer: {
              $avg: "$answers.value"
            },
            question: {
              $first: "$question.question"
            }
          }
        },
        {
          $project: {
            _id: 0,
            count: "$_id.total",
            surveyQuestion: {
              $first: "$question"
            },
            date: {
              $concat: [
                {
                  $toString: "$_id._id.year"
                }, 
                "-", 
                {
                  $toString: "$_id._id.month"
                },
                "-", 
                {
                  $toString: "$_id._id.day"
                },
              ]
            },
            averageAnswer: 1
          }
        },
        {
          $group: {
            _id: "$date",
            questionCount: {
              $sum: "$count"
            },
            totalQuestions: {
              $sum: 1
            },
            averageAnswer: {
              $avg: "$averageAnswer"
            },
            questions: {
              $push: "$surveyQuestion"
            },
          }
        },
        {
          $project: {
            _id: 0,
            date: {
              $dateFromString: {
                dateString: "$_id"
              }
            },
            count: {
              $divide: [ "$questionCount", "$totalQuestions" ]
            },
            averageAnswer: 1,
          }
        },
        {
          $sort: {
            date: 1
          }
        },
        {
          $project: {
            averageAnswer: 1,
            count: 1,
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$date" }
            }
          }
        }
      ]);
      
      return questionnares_mean;
    } catch (error) {
      
    }
  }

  async calculateQuestionnareUnit(unit?: string, range?: DateRange) {
    try {
      if (!range) {
        const questionnares_mean = await this.surveyModel.aggregate([
          {
            $lookup: {
              from: "users",
              localField: "user",
              foreignField: "_id",
              as: "user"
            }
          },
          {
            $unwind: "$user"
          },
          {
            $match: {
              "user.unit": ObjectId(unit)
            }
          },
          {
            $lookup: {
              from: "units",
              localField: "user.unit",
              foreignField: "_id",
              as: "unit"
            }
          },
          {
            $unwind: "$unit"
          },
          {
            $unwind: "$body",
          },
          {
            $group: {
              _id: {
                _id: "$body.question",
                unit: "$unit.name"
              },
              answers: {
                $push: "$body.answer"
              },
              total: {
                $sum: 1
              }
            }
          },
          {
            $unwind: "$answers"
          },
          {
            $lookup: {
              from: "surveyquestions",
              localField: "_id._id",
              foreignField: "_id",
              as: "question"
            }
          },
          {
            $match: {
              "question.type": {
                $eq: "KUESIONER"
              }
            }
          },
          {
            $lookup: {
              from: "surveyanswers",
              localField: "answers",
              foreignField: "_id",
              as: "answers"
            }
          },
          {
            $unwind: "$answers"
          },
          {
            $group: {
              _id: {
                _id: "$_id",
                total: "$total",
                unit: "$unit"
              },
              averageAnswer: {
                $avg: "$answers.value"
              },
              question: {
                $first: "$question.question"
              },
              order: {
                $first: "$question.order"
              }
            }
          },
          {
            $sort: {
              order: 1
            }
          },
          {
            $project: {
              _id: 0,
              count: "$_id.total",
              unit: "$_id._id.unit",
              surveyQuestion: {
                $first: "$question"
              },
              averageAnswer: 1,
              order: {
                $first: "$order"
              }
            }
          }
        ]);
        
        return questionnares_mean;
      }

      const questionnares_mean = await this.surveyModel.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(`${new Date(range.from.setDate(range.from.getDate()-1)).toISOString().replace('T00','T17')}`),
              $lte: new Date(`${new Date(range.to.setDate(range.to.getDate())).toISOString().replace('T00','T17')}`)
            }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $unwind: "$user"
        },
        {
          $match: {
            "user.unit": ObjectId(unit)
          }
        },
        {
          $lookup: {
            from: "units",
            localField: "user.unit",
            foreignField: "_id",
            as: "unit"
          }
        },
        {
          $unwind: "$unit"
        },
        {
          $unwind: "$body",
        },
        {
          $group: {
            _id: {
              _id: "$body.question",
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
              year: { $year: "$createdAt" },
              unit: "$unit.name"
            },
            answers: {
              $push: "$body.answer"
            },
            total: {
              $sum: 1
            }
          }
        },
        {
          $unwind: "$answers"
        },
        {
          $lookup: {
            from: "surveyquestions",
            localField: "_id._id",
            foreignField: "_id",
            as: "question"
          }
        },
        {
          $match: {
            "question.type": {
              $eq: "KUESIONER"
            }
          }
        },
        {
          $lookup: {
            from: "surveyanswers",
            localField: "answers",
            foreignField: "_id",
            as: "answers"
          }
        },
        {
          $unwind: "$answers"
        },
        {
          $group: {
            _id: {
              _id: "$_id",
              total: "$total",
              month: "$month",
              day: "$day",
              year: "$year",
              unit: "$unit"
            },
            averageAnswer: {
              $avg: "$answers.value"
            },
            question: {
              $first: "$question.question"
            },
            order: {
              $first: "$question.order"
            }
          }
        },
        {
          $project: {
            _id: 0,
            count: "$_id.total",
            surveyQuestion: {
              $first: "$question"
            },
            order: {
              $first: "$order"
            },
            date: {
              $dateFromString: {
                dateString: {
                  $concat: [
                    {
                      $toString: "$_id._id.year"
                    }, 
                    "-", 
                    {
                      $toString: "$_id._id.month"
                    },
                    "-", 
                    {
                      $toString: "$_id._id.day"
                    },
                  ]
                }
              }
            },
            unit: "$_id._id.unit",
            averageAnswer: 1
          }
        },
        {
          $sort: {
            date: 1,
            order: 1
          }
        },
        {
          $project: {
            averageAnswer: 1,
            count: 1,
            surveyQuestion: 1,
            order: 1,
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$date" }
            },
            unit: 1
          }
        }
      ]);

      return questionnares_mean;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async calculateQuestionnareUnitAccumulative(unit?: string, range?: DateRange) {
    try {
      if (!range) {
        const questionnares_mean = await this.surveyModel.aggregate([
          {
            $lookup: {
              from: "users",
              localField: "user",
              foreignField: "_id",
              as: "user"
            }
          },
          {
            $unwind: "$user"
          },
          {
            $match: {
              "user.unit": ObjectId(unit)
            }
          },
          {
            $lookup: {
              from: "units",
              localField: "user.unit",
              foreignField: "_id",
              as: "unit"
            }
          },
          {
            $unwind: "$unit"
          },
          {
            $unwind: "$body",
          },
          {
            $group: {
              _id: {
                _id: "$body.question",
                unit: "$unit.name"
              },
              answers: {
                $push: "$body.answer"
              },
              total: {
                $sum: 1
              }
            }
          },
          {
            $unwind: "$answers"
          },
          {
            $lookup: {
              from: "surveyquestions",
              localField: "_id._id",
              foreignField: "_id",
              as: "question"
            }
          },
          {
            $match: {
              "question.type": {
                $eq: "KUESIONER"
              }
            }
          },
          {
            $lookup: {
              from: "surveyanswers",
              localField: "answers",
              foreignField: "_id",
              as: "answers"
            }
          },
          {
            $unwind: "$answers"
          },
          {
            $group: {
              _id: {
                _id: "$_id",
                total: "$total",
                unit: "$unit"
              },
              averageAnswer: {
                $avg: "$answers.value"
              },
              question: {
                $first: "$question.question"
              }
            }
          },
          {
            $project: {
              _id: 0,
              count: "$_id.total",
              unit: "$_id._id.unit",
              surveyQuestion: {
                $first: "$question"
              },
              averageAnswer: 1
            }
          },
          {
            $group: {
              _id: "$unit",
              questionCount: {
                $sum: "$count"
              },
              totalQuestions: {
                $sum: 1
              },
              averageAnswer: {
                $avg: "$averageAnswer"
              },
              questions: {
                $push: "$surveyQuestion"
              },
            }
          },
          {
            $project: {
              _id: 0,
              unit: "$_id",
              count: {
                $divide: [ "$questionCount", "$totalQuestions" ]
              },
              averageAnswer: 1
            }
          }
        ]);
        
        return questionnares_mean;
      }

      const questionnares_mean = await this.surveyModel.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(`${new Date(range.from.setDate(range.from.getDate()-1)).toISOString().replace('T00','T17')}`),
              $lte: new Date(`${new Date(range.to.setDate(range.to.getDate())).toISOString().replace('T00','T17')}`)
            }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $unwind: "$user"
        },
        {
          $match: {
            "user.unit": ObjectId(unit)
          }
        },
        {
          $lookup: {
            from: "units",
            localField: "user.unit",
            foreignField: "_id",
            as: "unit"
          }
        },
        {
          $unwind: "$unit"
        },
        {
          $unwind: "$body",
        },
        {
          $group: {
            _id: {
              _id: "$body.question",
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
              year: { $year: "$createdAt" },
              unit: "$unit.name"
            },
            answers: {
              $push: "$body.answer"
            },
            total: {
              $sum: 1
            }
          }
        },
        {
          $unwind: "$answers"
        },
        {
          $lookup: {
            from: "surveyquestions",
            localField: "_id._id",
            foreignField: "_id",
            as: "question"
          }
        },
        {
          $match: {
            "question.type": {
              $eq: "KUESIONER"
            }
          }
        },
        {
          $lookup: {
            from: "surveyanswers",
            localField: "answers",
            foreignField: "_id",
            as: "answers"
          }
        },
        {
          $unwind: "$answers"
        },
        {
          $group: {
            _id: {
              _id: "$_id",
              total: "$total",
              month: "$month",
              day: "$day",
              year: "$year",
              unit: "$unit"
            },
            averageAnswer: {
              $avg: "$answers.value"
            },
            question: {
              $first: "$question.question"
            }
          }
        },
        {
          $project: {
            _id: 0,
            count: "$_id.total",
            surveyQuestion: {
              $first: "$question"
            },
            date: {
              $concat: [
                {
                  $toString: "$_id._id.year"
                }, 
                "-", 
                {
                  $toString: "$_id._id.month"
                },
                "-", 
                {
                  $toString: "$_id._id.day"
                },
              ]
            },
            unit: "$_id._id.unit",
            averageAnswer: 1
          }
        },
        {
          $group: {
            _id: "$date",
            questionCount: {
              $sum: "$count"
            },
            totalQuestions: {
              $sum: 1
            },
            averageAnswer: {
              $avg: "$averageAnswer"
            },
            questions: {
              $push: "$surveyQuestion"
            },
            unit: {
              $first: "$unit"
            },
          }
        },
        {
          $project: {
            _id: 0,
            date: {
              $dateFromString: {
                dateString: "$_id"
              }
            },
            count: {
              $divide: [ "$questionCount", "$totalQuestions" ]
            },
            averageAnswer: 1,
            unit: 1
          }
        },
        {
          $sort: {
            date: 1
          }
        },
        {
          $project: {
            averageAnswer: 1,
            unit: 1,
            count: 1,
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$date" }
            }
          }
        }
      ]);
      
      return questionnares_mean;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async getBestUnit(limit: number, sort: number = 0, range: DateRange) {
    // console.log({$gte: new Date(range.from),
    //             $lte: new Date(range.from.setDate(range.from.getDate() + 1))})
    try {

      const surveys = await this.surveyModel.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(`${new Date(range.from.setDate(range.from.getDate()-1)).toISOString().replace('T00','T17')}`),
              $lte: new Date(`${new Date(range.to.setDate(range.to.getDate())).toISOString().replace('T00','T17')}`)
            }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $unwind: "$user"
        },
        {
          $lookup: {
            from: "units",
            localField: "user.unit",
            foreignField: "_id",
            as: "unit"
          }
        },
        {
          $unwind: "$unit"
        },
        {
          $unwind: "$body"
        },
        {
          $group: {
            _id: {
              _id: "$body.question",
              unit: "$unit",
            },
            answers: {
              $push: "$body.answer"
            },
          }
        },
        {
          $unwind: "$answers"
        },
        {
          $lookup: {
            from: "surveyquestions",
            localField: "_id._id",
            foreignField: "_id",
            as: "question"
          }
        },
        {
          $match: {
            "question.type": {
              $eq: "KUESIONER"
            }
          }
        },
        {
          $lookup: {
            from: "surveyanswers",
            localField: "answers",
            foreignField: "_id",
            as: "answers"
          }
        },
        {
          $unwind: "$answers"
        },
        {
          $group: {
            _id: "$_id.unit",
            averageAnswer: {
              $avg: "$answers.value"
            },
            total: {
              $sum: 1
            }
          }
        },
        {
          $project: {
            _id: 0,
            unit: "$_id",
            averageAnswer: 1,
            count: {
              $ceil: { $divide: [ "$total", 7 ] }
            }
          }
        },
        {
          $sort: {
            averageAnswer: sort == 0 ? -1 : sort
          }
        },
        {
          $limit: limit
        }
      ]);

      return surveys;
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

  async getBestFrontDeskScores() {
    try {
    
      const current_month_data = await this.surveyModel.aggregate([
        {
          $match: {
            $expr: {
              $eq: [{ $month: "$createdAt" },new Date().getMonth()+1]
            }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $lookup: {
            from: "units",
            localField: "user.unit",
            foreignField: "_id",
            as: "unit"
          }
        },
        {
          $unwind: "$user"
        },
        {
          $unwind: "$unit"
        },
        {
          $lookup: {
            from: "roles",
            localField: "user.role",
            foreignField: "_id",
            as: "role"
          }
        },
        {
          $unwind: "$role"
        },
        {
          $match: {
            "role.name": "FRONT DESK"
          }
        },
        {
          $unwind: "$body"
        },
        {
          $group: {
            _id: {
              _id: "$body.question",
              user: "$user",
              unit: "$unit._id",
            },
            answers: {
              $push: "$body.answer"
            },
            total: {
              $sum: 1
            }
          }
        },
        {
          $unwind: "$answers"
        },
        {
          $lookup: {
            from: "surveyquestions",
            localField: "_id._id",
            foreignField: "_id",
            as: "question"
          }
        },
        {
          $match: {
            "question.type": {
              $eq: "KUESIONER"
            }
          }
        },
        {
          $lookup: {
            from: "surveyanswers",
            localField: "answers",
            foreignField: "_id",
            as: "answers"
          }
        },
        {
          $unwind: "$answers"
        },
        {
          $group: {
            _id: {
              user: "$_id.user",
              unit: "$_id.unit"
            },
            averageAnswer: {
              $avg: "$answers.value"
            },
            total: {
              $sum: 1
            }
          }
        },
        {
          $project: {
            _id: 0,
            count: {
              $ceil: { $divide: [ "$total", 7 ] }
            },
            user: {
              fullname: "$_id.user.fullname",
              email: "$_id.user.email",
              photo: "$_id.user.photo",
              unit: "$_id.unit"
            },
            averageAnswer: 1
          }
        },
        {
          $sort: {
            averageAnswer: 1
          }
        },
        {
          $limit: 1
        }
      ]);

      return current_month_data;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async getEssayAnswers(sort?: number, limit?: number) {
    try {

      const essays = await this.surveyModel.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $lookup: {
            from: "units",
            localField: "user.unit",
            foreignField: "_id",
            as: "unit"
          }
        },
        {
          $match: {
            body: {
              $elemMatch: {
                text: { $exists: true }
              }
            }
          }
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [ { $arrayElemAt: [ "$user", 0 ] }, "$$ROOT" ]
            }
          }
        },
        {
          $unwind: '$user'
        }
        // {
        //   $project: {
        //     user: 0
        //   }
        // }
      ])
      .sort({
        createdAt: sort == 0 ? -1 : sort
      })
      .limit(limit);

      console.log(essays)
      return essays
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async getEssayAnswersByFrontdesk(id?: string, limit?: number) {
    try {
      return await this.surveyModel.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $match: {
            body: {
              $elemMatch: {
                text: { $exists: true }
              }
            }
          }
        },
        {
          $unwind: "$user"
        },
        {
          $lookup: {
            from: "roles",
            localField: "user.role",
            foreignField: "_id",
            as: "role"
          }
        },
        {
          $unwind: "$role"
        },
        {
          $lookup: {
            from: "units",
            localField: "user.unit",
            foreignField: "_id",
            as: "unit"
          }
        },
        {
          $unwind: "$unit"
        },
        {
          $match: {
            "user._id": ObjectId(id),
            "role.name": "FRONT DESK"
          }
        }
      ])
      .sort({
        createdAt: 1
      })
      .limit(limit && limit > 0 ? limit : 10);
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

  async getEssayAnswersByUnit(id?: string, limit?: number) {
    try {
      return await this.surveyModel.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $match: {
            body: {
              $elemMatch: {
                text: { $exists: true }
              }
            }
          }
        },
        {
          $unwind: "$user"
        },
        {
          $lookup: {
            from: "roles",
            localField: "user.role",
            foreignField: "_id",
            as: "role"
          }
        },
        {
          $unwind: "$role"
        },
        {
          $match: {
            "user.unit": ObjectId(id),
            "role.name": "FRONT DESK"
          }
        },
        {
          $lookup: {
            from: "units",
            localField: "user.unit",
            foreignField: "_id",
            as: "unit"
          }
        },
        {
          $unwind: "$unit"
        }
      ])
      .sort({
        createdAt: 1
      })
      .limit(limit && limit > 0 ? limit: 10);
    } catch (error) {
      
    }
  }

}
