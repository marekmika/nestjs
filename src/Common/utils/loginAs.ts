import graphqlSupertest, { AppContext } from './graphqlSupertest'

const loginAs =
  (context: AppContext, email: string, password: string) =>
  async (): Promise<void> => {
    await graphqlSupertest(context.app, {
      query: /* GraphQL */ `
      query {
        login(email: "${email}", password: "${password}") {
          token
        }
      }
    `,
    }).expect((res) => {
      expect(res.body.errors).toBeFalsy()
      expect(res.body.data.login?.token).toBeTruthy()
      context.userToken = res.body.data.login.token
    })
  }

export default loginAs
