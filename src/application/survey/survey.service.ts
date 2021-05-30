import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Survey, SurveyDocument } from "src/model/survey.model";
import { Unit, UnitDocument } from "src/model/unit.model";
import { DateRange } from "src/utils/types/date-range.type";
import { Types } from 'mongoose'
import { CalculateAverage, CalculateAverageUnitGlobal, CalculateEssayResponse, SurveyBody, SurveyBodyPayload } from "./survey.type";

const ObjectId = Types.ObjectId
// const ISODate = Types.Is
@Injectable()
export class SurveyService {

  constructor(
    @InjectModel(Survey.name) private readonly surveyModel: Model<SurveyDocument>,
    @InjectModel(Unit.name) private readonly unitModel: Model<UnitDocument>,
  ) {}

  async create(survey: Survey): Promise<Survey> {
    try {
      return await this.surveyModel.create(survey)
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

  async calculateEssayUnit(unitId: string) {
    try {
      const today = new Date()
      const essays = await this.surveyModel.aggregate([
        {
          $lookup: {
            from: 'surveyquestions',
            let: { 'question': '$_id' },
            as: 'question',
            pipeline: [
              {
                $match: {
                  'type': 'ESSAY'
                }
              }
            ]
          }
        },
        {
          $unwind: "$user"
        }
      ])

      const essayToday = await this.surveyModel.aggregate([
        {
          $lookup: {
            from: 'surveyquestions',
            let: { 'question': '$_id' },
            as: 'question',
            pipeline: [
              {
                $match: {
                  'type': 'ESSAY'
                }
              }
            ]
          }
        },
        {
          $match: {
            $expr: {
              $eq: [{'$dayOfMonth': '$createdAt'}, today.getDate()]
            }
          }
        }
      ])

      const essayYesterday = await this.surveyModel.aggregate([
        {
          $lookup: {
            from: 'surveyquestions',
            let: { 'question': '$_id' },
            as: 'question',
            pipeline: [
              {
                $match: {
                  'type': 'ESSAY'
                }
              }
            ]
          }
        },
        {
          $match: {
            $expr: {
              $eq: [{'$dayOfMonth': '$createdAt'}, today.getDate()]
            }
          }
        }
      ])

      return {
        total: essays.map(val => val.question.length > 0).length,
        todayTotal: essayToday.map(val => val.question.length > 0).length,
        yesterdayTotal: essayYesterday.map(val => val.question.length > 0).length
      }
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

  async calculateEssayGlobal(): Promise<CalculateEssayResponse> {
    try {
      const today = new Date()
      const essays = await this.surveyModel.aggregate([
        {
          $lookup: {
            from: 'surveyquestions',
            let: { 'question': '$_id' },
            as: 'question',
            pipeline: [
              {
                $match: {
                  'type': 'ESSAY'
                }
              }
            ]
          }
        },
      ])

      const essayToday = await this.surveyModel.aggregate([
        {
          $lookup: {
            from: 'surveyquestions',
            let: { 'question': '$_id' },
            as: 'question',
            pipeline: [
              {
                $match: {
                  'type': 'ESSAY',
                }
              }
            ]
          }
        },
        {
          $match: {
            'createdAt': new Date(new Date(today.getFullYear(), today.getMonth(), today.getDate()))
          }
        }
      ])

      const essayYesterday = await this.surveyModel.aggregate([
        {
          $lookup: {
            from: 'surveyquestions',
            let: { 'question': '$_id' },
            as: 'question',
            pipeline: [
              {
                $match: {
                  'type': 'ESSAY',
                }
              }
            ]
          }
        },
        {
          $match: {
            'createdAt': new Date(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1))
          }
        }
      ])
      return {
        total: essays.map(val => val.question.length > 0).length,
        todayTotal: essayToday.map(val => val.question.length > 0).length,
        yesterdayTotal: essayYesterday.map(val => val.question.length > 0).length
      }
    } catch (error) {
      throw new InternalServerErrorException(error)
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
          $match: { createdAt: { $gte: range.from, $lte: range.to } }
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
            { createdAt: { $gte: String(range.from), $lte: String(range.to) } }
          ] 
        })
        .sort({ 'createdAt': sort })
        .limit(limit)
      return surveys
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

  async calculateAverage(user?: string, includeData: boolean = false): Promise<CalculateAverage> {
    try {
      const survey = await this.surveyModel.find({
        user
      }).populate([{
        path: 'body.answer',
        model: 'SurveyAnswer'
      }, {
        path: 'body.question',
        model: 'SurveyQuestion'
      }]).select(['body']);

      let total: number[] = []
      const average = survey.map(s => {
        const body: SurveyBody[] = s.body;
        // console.log(body)
        return body;
      }).forEach((survey: any[]) => {
        let surveyTotal = 0
        survey.forEach(s => {
          surveyTotal += s.answer.value;
        })
        total.push(surveyTotal / (survey.length - 1))
      })
      
      if (total.length > 0) {
        return {
          totalSurvey: total.length,
          average: total.reduce((x, y) => (x + y) / total.length)
        }
      }
      throw new BadRequestException('Kamu belum memiliki survey penilaian')
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

  async calculateAverageUnit(user?: any, unit?: any, all: boolean = false) {
    const findUnit = await this.unitModel.findOne({
      name: unit
    });

    const present_survey = await this.surveyModel.aggregate([
      {
        "$lookup": {
          "from": "users",
          "localField": "user",
          "foreignField": "_id",
          "as": "user"
        }
      },
      {
        "$unwind": "$user"
      },
      {
        "$match": {
          "user.unit": findUnit._id,
          "createdAt": {
            "$lte": new Date(`${new Date().getFullYear()}-${new Date().getMonth()+1}-${new Date().getDate()+1} 00:00:00`),
            "$gte": new Date(`${new Date().getFullYear()}-${new Date().getMonth()+1}-${new Date().getDate()} 00:00:00`)
          }
        }
      },
      {
        "$unwind": "$body",
      },
      {
        "$lookup": {
          "from": "surveyquestions",
          "localField": "body.question",
          "foreignField": "_id",
          "as": "question"
        }
      },
      {
        "$lookup": {
          "from": "surveyanswers",
          "localField": "body.answer",
          "foreignField": "_id",
          "as": "answer"
        }
      },
      {
        "$unwind": "$question"
      },
      {
        "$unwind": "$answer"
      },
      {
        "$match": {
          "question.type": {
            "$eq": "KUESIONER"
          }
        }
      },
      {
        "$group": {
          "_id": "$question.question",
          "averageAnswer": {
            "$avg": "$answer.value"
          },
          "count": {
            "$sum": 1
          }
        }
      },
      {
        "$project": {
          "_id": 0,
          "surveyQuestion": "$_id",
          "averageAnswer": "$averageAnswer",
          "sum": 1,
          "count": 1
        }
      }
    ]);

    const yesterday_survey = await this.surveyModel.aggregate([
      {
        "$lookup": {
          "from": "users",
          "localField": "user",
          "foreignField": "_id",
          "as": "user"
        }
      },
      {
        "$unwind": "$user"
      },
      {
        "$match": {
          "user.unit": findUnit._id,
          "createdAt": {
            "$lte": new Date(`${new Date().getFullYear()}-${new Date().getMonth()+1}-${new Date().getDate()} 00:00:00`),
            "$gte": new Date(`${new Date().getFullYear()}-${new Date().getMonth()+1}-${new Date().getDate()-1} 00:00:00`)
          }
        }
      },
      {
        "$unwind": "$body",
      },
      {
        "$lookup": {
          "from": "surveyquestions",
          "localField": "body.question",
          "foreignField": "_id",
          "as": "question"
        }
      },
      {
        "$lookup": {
          "from": "surveyanswers",
          "localField": "body.answer",
          "foreignField": "_id",
          "as": "answer"
        }
      },
      {
        "$unwind": "$question"
      },
      {
        "$unwind": "$answer"
      },
      {
        "$match": {
          "question.type": {
            "$eq": "KUESIONER"
          }
        }
      },
      {
        "$group": {
          "_id": "$question.question",
          "averageAnswer": {
            "$avg": "$answer.value"
          },
          "count": {
            "$sum": 1
          }
        }
      },
      {
        "$project": {
          "_id": 0,
          "surveyQuestion": "$_id",
          "averageAnswer": "$averageAnswer",
          "sum": 1,
          "count": 1
        }
      }
    ]);

    if (all) {
      let total_average = {
        present: 0,
        past: 0
      }
      present_survey.forEach((value) => {
        total_average.present += value.averageAnswer
      });

      yesterday_survey.forEach((value) => {
        total_average.past += value.averageAnswer
      })

      const result: CalculateAverageUnitGlobal = {
        unitName: unit,
        data: {
          present: [
            {
              averageAnswer: present_survey.length != 0 ? total_average.present / present_survey.length : 0
            }
          ],
          yesterday: [
            {
              averageAnswer: yesterday_survey.length != 0 ? total_average.past / yesterday_survey.length : 0
            }
          ]
        }
      };

      return result
    }

    const result: CalculateAverageUnitGlobal = {
      unitName: unit,
      data: {
        present: present_survey,
        yesterday: yesterday_survey
      }
    };

    return result

  }

  async calculateAverageGlobal(all: boolean =  false) {
    
    const present_survey = await this.surveyModel.aggregate([
      {
        "$lookup": {
          "from": "users",
          "localField": "user",
          "foreignField": "_id",
          "as": "user"
        }
      },
      {
        "$unwind": "$user"
      },
      {
        "$match": {
          "createdAt": {
            "$lte": new Date(`${new Date().getFullYear()}-${new Date().getMonth()+1}-${new Date().getDate()+1} 00:00:00`),
            "$gte": new Date(`${new Date().getFullYear()}-${new Date().getMonth()+1}-${new Date().getDate()} 00:00:00`)
          }
        }
      },
      {
        "$unwind": "$body",
      },
      {
        "$lookup": {
          "from": "surveyquestions",
          "localField": "body.question",
          "foreignField": "_id",
          "as": "question"
        }
      },
      {
        "$lookup": {
          "from": "surveyanswers",
          "localField": "body.answer",
          "foreignField": "_id",
          "as": "answer"
        }
      },
      {
        "$unwind": "$question"
      },
      {
        "$unwind": "$answer"
      },
      {
        "$match": {
          "question.type": {
            "$eq": "KUESIONER"
          }
        }
      },
      {
        "$group": {
          "_id": "$question.question",
          "averageAnswer": {
            "$avg": "$answer.value"
          },
          "count": {
            "$sum": 1
          }
        }
      },
      {
        "$project": {
          "_id": 0,
          "surveyQuestion": "$_id",
          "averageAnswer": "$averageAnswer",
          "sum": 1,
          "count": 1
        }
      }
    ]);

    const yesterday_survey = await this.surveyModel.aggregate([
      {
        "$lookup": {
          "from": "users",
          "localField": "user",
          "foreignField": "_id",
          "as": "user"
        }
      },
      {
        "$unwind": "$user"
      },
      {
        "$match": {
          "createdAt": {
            "$lte": new Date(`${new Date().getFullYear()}-${new Date().getMonth()+1}-${new Date().getDate()} 00:00:00`),
            "$gte": new Date(`${new Date().getFullYear()}-${new Date().getMonth()+1}-${new Date().getDate()-1} 00:00:00`)
          }
        }
      },
      {
        "$unwind": "$body",
      },
      {
        "$lookup": {
          "from": "surveyquestions",
          "localField": "body.question",
          "foreignField": "_id",
          "as": "question"
        }
      },
      {
        "$lookup": {
          "from": "surveyanswers",
          "localField": "body.answer",
          "foreignField": "_id",
          "as": "answer"
        }
      },
      {
        "$unwind": "$question"
      },
      {
        "$unwind": "$answer"
      },
      {
        "$match": {
          "question.type": {
            "$eq": "KUESIONER"
          }
        }
      },
      {
        "$group": {
          "_id": "$question.question",
          "averageAnswer": {
            "$avg": "$answer.value"
          },
          "count": {
            "$sum": 1
          }
        }
      },
      {
        "$project": {
          "_id": 0,
          "surveyQuestion": "$_id",
          "averageAnswer": "$averageAnswer",
          "sum": 1,
          "count": 1
        }
      }
    ]);

    if (all) {
      let total_average = {
        present: 0,
        past: 0
      }
      present_survey.forEach((value) => {
        total_average.present += value.averageAnswer
      });

      yesterday_survey.forEach((value) => {
        total_average.past += value.averageAnswer
      })

      const result: CalculateAverageUnitGlobal = {
        data: {
          present: [
            {
              averageAnswer: present_survey.length != 0 ? total_average.present / present_survey.length : 0
            }
          ],
          yesterday: [
            {
              averageAnswer: yesterday_survey.length != 0 ? total_average.past / yesterday_survey.length : 0
            }
          ]
        }
      };

      return result
    }

    const result: CalculateAverageUnitGlobal = {
      data: {
        present: present_survey,
        yesterday: yesterday_survey
      }
    };

    return result

  }

  async getBestUnit(limit: number, sort: number = 0) {
    try {
      sort = sort == 0 ? 1 : -1

      const surveys = await this.surveyModel.aggregate(
        [{
          $lookup: {
              from: 'users',
              let: {
                  "user": "$_id"
              },
              as: "user",
              pipeline: [{
                  $project: {
                      "_id": 0,
                      "password": 0
                  }
              }]
          }
      }, {
          $unwind: {
              path: "$user",
          }
      }, {
          $lookup: {
              from: 'units',
              localField: 'user.unit',
              foreignField: '_id',
              as: 'unit'
          }
      }, {
          $unwind: {
              path: "$unit",
          }
      }, {
          $match: {
              "$expr": {
                  "$eq": [{
                      "$month": "$createdAt"
                  }, new Date().getMonth() + 1]
              }
          }
      }, {
          $lookup: {
              "from": "roles",
              "localField": "user.role",
              "foreignField": "_id",
              "as": "role"
          }
      }, {
          $unwind: {
              path: "$role",
          }
      }, {
          $match: {
              "role.name": "FRONT DESK"
          }
      }, {
          $unwind: {
              path: "$body"
          }
      }, {
          $lookup: {
              "from": "surveyquestions",
              "localField": "body.question",
              "foreignField": "_id",
              "as": "question"
          }
      }, {
          $lookup: {
              "from": "surveyanswers",
              "localField": "body.answer",
              "foreignField": "_id",
              "as": "answer"
          }
      }, {
          $unwind: {
              path: "$answer",
          }
      }, {
          $group: {
              "_id": "$user",
              "averageAnswer": {
                  "$avg": "$answer.value"
              },
              "unit": {
                  "$first": "$unit"
              },
              "count": {
                  "$sum": 1
              }
          }
      }, {
        $sort: {
          "averageAnswer": sort
        }
      }, {
          $project: {
              "_id": 0,
              "unit": {
                  "name": "$unit.name",
              },
              "averageAnswer": "$averageAnswer",
              "count": 1,
          }
      }, {
          $limit: limit
      }]
      )

      return surveys
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

  async getBestFrontDeskScores(sortBy: number) {
    try {
      const sort = sortBy == 0 ? -1 : sortBy;
    
      const current_month_data = await this.surveyModel.aggregate([
        {
          "$lookup": {
            "from": "users",
            "let": {
              "user": "$_id"
            },
            "pipeline": [
              {
                "$project": {
                  "_id": 0,
                  "password": 0
                }
              }
            ],
            "as": "user"
          }
        },
        {
          "$lookup": {
            "from": "units",
            "localField": "user.unit",
            "foreignField": "_id",
            "as": "unit"
          }
        },
        {
          "$match": {
            "$expr": {
              "$eq": [{ "$month": "$createdAt" },new Date().getMonth()+1]
            }
          }
        },
        {
          "$unwind": "$user"
        },
        {
          "$unwind": "$unit"
        },
        {
          "$lookup": {
            "from": "roles",
            "localField": "user.role",
            "foreignField": "_id",
            "as": "role"
          }
        },
        {
          "$unwind": "$role"
        },
        {
          "$match": {
            "role.name": "FRONT DESK"
          }
        },
        {
          "$unwind": "$body",
        },
        {
          "$lookup": {
            "from": "surveyquestions",
            "localField": "body.question",
            "foreignField": "_id",
            "as": "question"
          }
        },
        {
          "$lookup": {
            "from": "surveyanswers",
            "localField": "body.answer",
            "foreignField": "_id",
            "as": "answer"
          }
        },
        {
          "$unwind": "$answer"
        },
        {
          "$match": {
            "question.type": {
              "$eq": "KUESIONER"
            }
          }
        },
        {
          "$group": {
            "_id": "$user",
            "averageAnswer": {
              "$avg": "$answer.value"
            },
            "unit": {
              "$first": "$unit"
            },
            "count": {
              "$sum": 1
            }
          }
        },
        {
          "$sort": {
            "averageAnswer": sort
          }
        },
        {
          "$project": {
            "_id": 0,
            "user": {
              "fullname": "$_id.fullname",
              "unit": {
                "name": "$unit.name",
              },
              "email": "$_id.email"
            },
            "averageAnswer": "$averageAnswer",
            "count": 1,
          }
        },
        {
          "$limit": 1,
        },
      ]);

      return current_month_data[0];
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

}
