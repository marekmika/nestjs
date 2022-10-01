import { PrismaClient, user } from '@prisma/client'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()
const currentDate = new Date()

const createUsers = async (): Promise<{ count: number }> =>
  prisma.user.createMany({
    data: [
      {
        email: 'user@gmail.com',
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        createdAt: currentDate,
        updatedAt: currentDate,
        passwordHash:
          '$argon2id$v=19$m=4096,t=3,p=1$JG13tGYA6xABemgJ9RxbNg$IchLXcRjahLUE+ZbKvpZo4bemR21rec+q0EtBPmQDno', // Test1234
      },
      {
        email: 'test-e2e@gmail.com',
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        createdAt: currentDate,
        updatedAt: currentDate,
        passwordHash:
          '$argon2id$v=19$m=4096,t=3,p=1$JG13tGYA6xABemgJ9RxbNg$IchLXcRjahLUE+ZbKvpZo4bemR21rec+q0EtBPmQDno', // Test1234
      },
    ],
  })

const main = async (): Promise<string> => {
  await prisma.$connect()

  await createUsers()

  return 'Db has been seeded'
}

main()
  .catch((error) => console.log(error))
  .finally(() => prisma.$disconnect())
