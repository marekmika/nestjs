import { Module } from '@nestjs/common'
import { PrismaService } from '@src/prisma.service'

import { UserService } from './Domain/user.service'
import { UserResolver } from './Application/user.resolver'

@Module({
  providers: [UserService, UserResolver, PrismaService],
  exports: [UserService],
})
export class UserModule {}
