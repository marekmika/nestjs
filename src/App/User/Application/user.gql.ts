import {
  Field,
  InputType,
  ObjectType,
  OmitType,
  PartialType,
  PickType,
} from '@nestjs/graphql'
import { NonEmptyStringResolver } from 'graphql-scalars'

@ObjectType()
export class User {
  @Field(() => NonEmptyStringResolver)
  id: string

  @Field(() => NonEmptyStringResolver)
  email: string

  @Field(() => NonEmptyStringResolver)
  passwordHash: string

  @Field(() => NonEmptyStringResolver)
  firstName: string

  @Field(() => NonEmptyStringResolver)
  lastName: string

  @Field(() => Date)
  createdAt: Date

  @Field(() => Date)
  updatedAt: Date
}

@ObjectType()
export class UserLogin extends PartialType(PickType(User, ['id', 'email'])) {
  @Field(() => String)
  token: string
}

@InputType()
export class UserRegisterInput extends OmitType(
  User,
  ['id', 'createdAt', 'updatedAt', 'passwordHash'] as const,
  InputType,
) {
  @Field(() => String)
  password: string
}

@InputType()
export class UserMeUpdateData extends PartialType(
  OmitType(
    User,
    ['id', 'createdAt', 'updatedAt', 'passwordHash'] as const,
    InputType,
  ),
) {}
