FROM node:14.16.1-alpine3.13 as development-stage
WORKDIR /app

COPY package*.json /app
COPY yarn.lock /app
RUN yarn install
COPY . .

ENV PORT 8080
ENV MONGODB_URI "mongodb+srv://s1SuP3LuT:gzMkPksMJgRbSe8N@sisupel.xqms0.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
ENV JWT_SECRET "2GTPpGy6qGoR"

EXPOSE 8080

CMD [ "yarn", "start:dev" ]

FROM development-stage as build-stage
RUN yarn build

FROM build-stage as production-stage
COPY --from=build-stage /app/dist /usr/app
EXPOSE 8080

CMD [ "yarn", "start:prod" ]
