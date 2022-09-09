import { JwtPayload } from 'jsonwebtoken'

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'
import { PrismaService } from '@src/prisma.service'
import { user as User } from '@prisma/client'
import * as jwt from 'jsonwebtoken'

export type ContextUser = User

// TODO: to env config
export const secret = 'jwtSecret'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context).getContext()
    if (!ctx.req.headers.authorization) {
      return false
    }
    const userFromToken = await this.verifyToken(ctx.req.headers.authorization)
    const user = await this.findUserFromDb(userFromToken?.id)
    ctx.user = user

    return true
  }

  private async verifyToken(auth: string): Promise<JwtPayload> {
    if (auth.split(' ')[0] !== 'Bearer') {
      throw new HttpException('Invalid token format', HttpStatus.UNAUTHORIZED)
    }
    const token = auth.split(' ')[1]

    try {
      const decoded = jwt.verify(token, secret)
      if (typeof decoded !== 'object') {
        throw new Error('Bad token contents, string instead of object.')
      }
      return decoded
    } catch (err) {
      const message = `Token error: ${err.message || err.name}`
      throw new HttpException(message, HttpStatus.UNAUTHORIZED)
    }
  }

  private async findUserFromDb(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    })

    if (!user) throw new Error(`Could not found user (id: ${id}) in database.`)
    return user
  }
}
