import graphqlSupertest, {
  createBeforeAll,
  closeAfterAll,
  AppContext,
} from '@Common/utils/graphqlSupertest'
import loginAs from '@Common/utils/loginAs'
import { faker } from '@faker-js/faker'

const testE2EUserPassword = 'Test1234'

describe('User Resolver (e2e)', () => {
  const context: AppContext = {}

  beforeAll(createBeforeAll(context))

  beforeAll(loginAs(context, 'test-e2e@gmail.com', testE2EUserPassword)) // <- this user with have password changed during tests!

  afterAll(closeAfterAll(context))

  describe('User login', () => {
    it('should not get me', async () => {
      await graphqlSupertest(context.app, {
        query: /* GraphQL */ `
          query {
            findMe {
              id
              email
            }
          }
        `,
      }).expect((res) => {
        expect(res.body.errors).toHaveLength(1)
        expect(res.body.errors[0].message).toEqual('Forbidden resource')
      })
    })

    it('should get me', async () => {
      let token
      let id: string
      await graphqlSupertest(context.app, {
        query: /* GraphQL */ `
          query {
            login(email: "test-e2e@gmail.com", password: "${testE2EUserPassword}") {
              id
              token
            }
          }
        `,
      }).expect((res) => {
        expect(res.body.data.login?.token).toBeTruthy()
        token = res.body.data.login.token
        context.userToken = token
        id = res.body.data.login.id
      })

      await graphqlSupertest(context.app, {
        query: /* GraphQL */ `
          query {
            findMe {
              id
              email
            }
          }
        `,
      })
        .set('Authorization', `Bearer ${token}`)
        .expect((res) => {
          expect(res.body.data.findMe.id).toEqual(id)
        })
    })
  })

  describe('User update', () => {
    it('should update me', async () => {
      const firstName = faker.name.firstName()
      const lastName = faker.name.lastName()

      await graphqlSupertest(context.app, {
        query: /* GraphQL */ `
        mutation { 
          updatedMe(data: {
            firstName: "${firstName}",
            lastName: "${lastName}",
          }) {
            id
            email
            passwordHash
            firstName
            lastName
            createdAt
            updatedAt
          }
        }
        `,
      })
        .set('Authorization', `Bearer ${context.userToken}`)
        .expect((res) => {
          expect(res.body.data.updatedMe.firstName).toEqual(firstName)
          expect(res.body.data.updatedMe.lastName).toEqual(lastName)
        })
    })
  })

  describe('User change password', () => {
    it('should not change password - invalid password', async () => {
      const updatePasswordInput = {
        password: 'wrong-password',
        newPassword: 'Test12345',
        newPasswordConfirmation: 'Test12345',
      }

      await graphqlSupertest(context.app, {
        query: /* GraphQL */ `
        mutation { 
          changePassword(
            password: "${updatePasswordInput.password}"
            newPassword: "${updatePasswordInput.newPassword}"
            newPasswordConfirmation: "${updatePasswordInput.newPasswordConfirmation}"
          )
        }
        `,
      })
        .set('Authorization', `Bearer ${context.userToken}`)
        .expect((res) => {
          expect(res.body.errors).toHaveLength(1)
          expect(res.body.errors[0].message).toEqual('Invalid password')
        })
    })

    it('should not change password - passwords does not match', async () => {
      const updatePasswordInput = {
        password: testE2EUserPassword,
        newPassword: 'Test1234',
        newPasswordConfirmation: 'TestTest1234',
      }

      await graphqlSupertest(context.app, {
        query: /* GraphQL */ `
        mutation { 
          changePassword(
            password: "${updatePasswordInput.password}"
            newPassword: "${updatePasswordInput.newPassword}"
            newPasswordConfirmation: "${updatePasswordInput.newPasswordConfirmation}"
          )
        }
        `,
      })
        .set('Authorization', `Bearer ${context.userToken}`)
        .expect((res) => {
          expect(res.body.errors).toHaveLength(1)
          expect(res.body.errors[0].message).toEqual(
            "New password and password confirmation doesn't match",
          )
        })
    })

    it('should change password', async () => {
      const updatePasswordInput = {
        password: testE2EUserPassword,
        newPassword: 'Test12345',
        newPasswordConfirmation: 'Test12345',
      }

      await graphqlSupertest(context.app, {
        query: /* GraphQL */ `
        mutation { 
          changePassword(
            password: "${updatePasswordInput.password}"
            newPassword: "${updatePasswordInput.newPassword}"
            newPasswordConfirmation: "${updatePasswordInput.newPasswordConfirmation}"
          )
        }
        `,
      })
        .set('Authorization', `Bearer ${context.userToken}`)
        .expect((res) => {
          expect(res.body.data.changePassword).toBeTruthy()
        })
    })
  })
})
