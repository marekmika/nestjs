import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { user } from '@prisma/client'
import { UserRole } from '../User/Domain/userRole'

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly requiredRoles: UserRole[] = []

  constructor(...requiredRoles: UserRole[]) {
    this.requiredRoles = requiredRoles
  }

  canActivate(context: ExecutionContext): boolean {
    const ctxUser: user | undefined = context.getArgs()[2]?.user
    if (!ctxUser) throw new Error('Cannot find context user.')
    if (this.requiredRoles.length < 1) {
      return true
    }

    // TODO: Add role to user
    // if (!this.requiredRoles.some((role) => role === ctxUser.role)) {
    //   throw new HttpException(
    //     'You do not have enough privileges.',
    //     HttpStatus.UNAUTHORIZED,
    //   )
    // }
    return true
  }
}
