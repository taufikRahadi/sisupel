import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Survey, SurveyDocument } from "src/model/survey.model";
import { Unit, UnitDocument } from "src/model/unit.model";
import { CalculateAverage, CalculateAverageUnitGlobal, CalculateEssayResponse, SurveyBody, SurveyBodyPayload } from "./survey.type";

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
      console.log(essays.map(val => val.question.length > 0).length)
      console.log(essayYesterday.map(val => val.question.length > 0).length)
      console.log(essayToday.map(val => val.question.length > 0).length)

      return {
        total: essays.map(val => val.question.length > 0).length,
        todayTotal: essayToday.map(val => val.question.length > 0).length,
        yesterdayTotal: essayToday.map(val => val.question.length > 0).length
      }
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

  async calculateEssayUnit(unitId: string) {
    
  }

  async getMySurvey(user: string, limit: number | undefined) {
    try {
      const surveys = await this.surveyModel
        .find({
          user
        }).populate([
          {
            path: 'answer',
            model: 'SurveyAnswer'
          },
          {
            path: 'question',
            model: 'SurveyQuestion'
          }
        ])
        .sort({ 'createdAt': 'asc' })
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

}
