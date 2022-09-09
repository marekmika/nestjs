/* eslint-disable @typescript-eslint/ban-types */
import * as request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { AppModule } from '../../app.module'

export interface AppContext {
  app?: INestApplication
  userToken?: string
}

const gqlDefaultEndpoint = '/graphql'

export const createBeforeAll =
  (context: { app?: INestApplication }) => async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()
    const app = moduleFixture.createNestApplication()
    context.app = app
    await app.init()
  }

export const closeAfterAll =
  (context: { app?: INestApplication }) => async () => {
    await context?.app.close()
  }

const graphqlSupertest = (
  app: INestApplication,
  data: string | object,
): request.Test => {
  return request(app.getHttpServer())
    .post(gqlDefaultEndpoint)
    .expect(200)
    .send(data)
}

export default graphqlSupertest
