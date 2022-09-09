import { UseGuards } from '@nestjs/common'
import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql'
import { AuthGuard, secret } from '@App/Auth/auth.guard'
import { UserService } from '../Domain/user.service'
import {
  User,
  UserLogin,
  UserMeUpdateData,
  UserRegisterInput,
} from './user.gql'
import * as jwt from 'jsonwebtoken'
import { hashPassword, isPasswordAndHashEqual } from '../Domain/utils/password'

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => UserLogin)
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
  ): Promise<UserLogin> {
    const user = await this.userService.user({ email })
    if (!user) throw new Error('Invalid email or password')
    const { id, email: userEmail, passwordHash } = user

    const isPasswordValid = await isPasswordAndHashEqual(passwordHash, password)
    if (!isPasswordValid) throw new Error(`Invalid email or password`)

    const token = jwt.sign({ id, email }, secret)

    return { id, email: userEmail, token }
  }

  @Mutation(() => User)
  async register(@Args('userData') userData: UserRegisterInput): Promise<User> {
    return this.userService.createUser(userData)
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard)
  async changePassword(
    @Context('user') user: { id: string; passwordHash: string },
    @Args('password') password: string,
    @Args('newPassword') newPassword: string,
    @Args('newPasswordConfirmation') newPasswordConfirmation: string,
  ): Promise<boolean> {
    const { id, passwordHash } = user

    const isPasswordValid = await isPasswordAndHashEqual(passwordHash, password)
    if (!isPasswordValid) throw new Error(`Invalid password`)
    if (newPassword !== newPasswordConfirmation)
      throw new Error("New password and password confirmation doesn't match")

    const newPasswordHash = await hashPassword(newPassword)

    await this.userService.updateUser({
      where: { id },
      data: { passwordHash: newPasswordHash },
    })

    return true
  }

  @Query(() => User)
  @UseGuards(AuthGuard)
  async findMe(@Context('user') user: { id: string; passwordHash: string }) {
    const { id } = user
    return this.userService.user({ id })
  }

  @Mutation(() => User)
  @UseGuards(AuthGuard)
  async updatedMe(
    @Context('user') user: { id: string },
    @Args('data') data: UserMeUpdateData,
  ) {
    const { id } = user
    return this.userService.updateUser({ where: { id }, data })
  }

  @Query(() => [User])
  @UseGuards(AuthGuard)
  async findUsers() {
    return this.userService.users({ skip: 0 })
  }
}
