import { faker } from '@faker-js/faker'
import { User } from './schema'

export const users: User[] = Array.from({ length: 20 }, () => {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    emailVerified: faker.datatype.boolean(),
    image: faker.image.avatar(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
  }
})