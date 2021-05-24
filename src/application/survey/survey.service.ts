import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Survey, SurveyDocument } from "src/model/survey.model";
import { Unit, UnitDocument } from "src/model/unit.model";
import { CalculateAverage, CalculateAverageUnit, SurveyBody, SurveyBodyPayload } from "./survey.type";

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
      }]).select(['body'])

      const mapped: SurveyBody[][] = survey.map(s => s.body)
      let total: number[] = []
      const average = survey.map(s => {
        const body: SurveyBody[] = s.body;

        return body;
      }).forEach((survey: any[]) => {
        let surveyTotal = 0
        survey.forEach(s => {
          surveyTotal += s.answer.value;
        })
        total.push(surveyTotal / survey.length)
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

  async calculateAverageUnit(user?: any, unit?: any) {
    const findUnit = await this.unitModel.findOne({
      name: unit
    });

    const survey = await this.surveyModel.aggregate([
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
          "user.unit": findUnit._id
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
          "answer.value": {
            "$ne": 0
          }
        }
      }
    ]);

    let total_answer: number = 0;
    survey.forEach((value) => {
      total_answer += value.answer.value
    });

    const result: CalculateAverageUnit = {
      unitName: unit,
      average: total_answer/survey.length,
      totalSurvey: survey.length
    };

    return result

  }

  async calculateAverageGlobal() {
    
    const survey = await this.surveyModel.aggregate([
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
          "answer.value": {
            "$ne": 0
          }
        }
      }
    ]);

    let total_answer: number = 0;
    survey.forEach((value) => {
      total_answer += value.answer.value
    });

    const result: CalculateAverage = {
      average: total_answer/survey.length,
      totalSurvey: survey.length
    };

    return result

  }

}
