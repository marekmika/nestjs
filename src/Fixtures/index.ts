import * as Fixtures from 'node-mongodb-fixtures'
const uri = 'mongodb://localhost/mydb'
const options = null

// Dir has absolute path because of position of package.json - yarn fixtures:load
const fixtures = new Fixtures({
  dir: './src/Fixtures',
  filter: '^(?!.*index).*',
})

fixtures
  .connect(process.env.DATABASE_URL)
  .then(() => fixtures.unload())
  .then(() => fixtures.load())
  .catch((e) => console.error(e))
  .finally(() => fixtures.disconnect())
