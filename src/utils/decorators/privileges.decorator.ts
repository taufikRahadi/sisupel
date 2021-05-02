import { SetMetadata } from "@nestjs/common";

export const IsAllowTo = (privilege: string) => SetMetadata('privilege', privilege)