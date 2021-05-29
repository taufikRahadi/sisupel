import { registerEnumType } from "@nestjs/graphql";

export enum Sort {
  asc,
  desc
}

registerEnumType(Sort, {
  name: 'Sort'
})
