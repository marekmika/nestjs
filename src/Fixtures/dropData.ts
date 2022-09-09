import * as Fixtures from 'node-mongodb-fixtures'
const uri = 'mongodb://localhost/mydb'
const options = null

// Dir has absolute path because of position of package.json - yarn fixtures:dropData
const fixtures = new Fixtures({
  dir: './src/Fixtures',
})

fixtures
  .connect(process.env.DATABASE_URL)
  .then(() => fixtures.unload())
  .finally(() => fixtures.disconnect())
