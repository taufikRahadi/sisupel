FROM node:12.22.0 as development-stage
WORKDIR /app

COPY package*.json /app
COPY yarn.lock /app
RUN yarn install
COPY . .

ENV PORT 8080
ENV MONGODB_URI "mongodb://sisupel:s3c12ET@172.16.37.145:27017/sisupel?authSource=admin&readPreference=primary&appname=MongoDB%20Compass&ssl=false"
ENV JWT_SECRET "2GTPpGy6qGoR"
ENV REDIS_HOST "172.16.37.145"
ENV REDIS_PORT "6379"
ENV SMTP_HOST smtp.office365.com
ENV SMTP_PORT 587
ENV SMTP_AUTH_USERNAME sandi.agung@ecampus.ut.ac.id
ENV SMTP_AUTH_PASS Yulgang907

ENV FRONTEND_URL http://sisupel.ut.ac.id/

EXPOSE 8080

CMD [ "yarn", "start:dev" ]

FROM development-stage as build-stage
RUN yarn build

FROM build-stage as production-stage
COPY --from=build-stage /app/dist /usr/app
EXPOSE 8080

CMD [ "yarn", "start:prod" ]
