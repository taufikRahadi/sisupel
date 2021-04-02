import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { MongooseModule } from '@nestjs/mongoose';
import { join } from 'path';
import { AuthenticationModule } from './authentication/authentication.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    GraphQLModule.forRoot({
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      debug: false,
      playground: true
    }),
    MongooseModule.forRootAsync({
      useFactory: (env: ConfigService) => ({
        uri: env.get<string>('MONGODB_URI'),
        useFindAndModify: true,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true
      }),
      inject: [ConfigService]
    }),
    AuthenticationModule
  ],
})
export class AppModule {}
