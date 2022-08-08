import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { PrismaService } from './prisma.service'

const port = process.env.BE_URL_PORT || 4000

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const prismaService = app.get(PrismaService)
  await prismaService.enableShutdownHooks(app)

  if (process.env.APP_ENV === 'develop') app.enableCors()

  await app.listen(process.env.BE_URL_PORT || 4000)
  console.log(`> App started http://localhost:${port}`)
}
bootstrap()
