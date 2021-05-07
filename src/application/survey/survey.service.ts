import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Survey, SurveyDocument } from "src/model/survey.model";
import { CalculateAverage, SurveyBody, SurveyBodyPayload } from "./survey.type";

@Injectable()
export class SurveyService {

  constructor(
    @InjectModel(Survey.name) private readonly surveyModel: Model<SurveyDocument>
  ) {}

  async create(survey: Survey): Promise<Survey> {
    try {
      return await this.surveyModel.create(survey)
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

}
