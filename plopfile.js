/* eslint-disable @typescript-eslint/no-var-requires */
const lodash = require('lodash')

const toPascalCase = (s) => lodash.upperFirst(lodash.camelCase(s))

const requireField = (fieldName) => (value) => {
  if (String(value).length === 0) {
    return `Field ${fieldName} is required`
  }

  return true
}

module.exports = (plop) => {
  plop.setGenerator('appSection', {
    description: 'Create section with application and domain layers',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'What is your section name?',
        validate: requireField('name'),
      },
      {
        type: 'input',
        name: 'shouldCrateE2ETest',
        message: 'Do you want create E2E test file for resolver? [Y/N]',
        validate: requireField('shouldCrateE2ETest'),
      },
    ],
    actions: ({ type, name, shouldCrateE2ETest }) => {
      let path = `src/App/${toPascalCase(name)}`
      if (type === 'collocated') {
        if (!pageName) throw new Error(`Missing pageName.`)
        path = `src/pages/${toPascalCase(pageName)}/components/${toPascalCase(
          name,
        )}`
      }

      const actions = [
        {
          type: 'add',
          path: `${path}/{{camelCase name}}.module.ts`,
          templateFile: '.plop-templates/Module/Module.hbs',
        },
        {
          type: 'add',
          path: `${path}/Domain/{{camelCase name}}.service.ts`,
          templateFile: '.plop-templates/Domain/Service.hbs',
        },
        {
          type: 'add',
          path: `${path}/Application/{{camelCase name}}.resolver.ts`,
          templateFile: '.plop-templates/Application/Resolver.hbs',
        },
        {
          type: 'add',
          path: `${path}/Application/{{camelCase name}}.gql.ts`,
          templateFile: '.plop-templates/Application/Gql.hbs',
        },
      ]

      if (['y', 'Y', 'Yes'].includes(shouldCrateE2ETest)) {
        actions.push({
          type: 'add',
          path: `${path}/Application/{{camelCase name}}.resolver.e2e-spec.ts`,
          templateFile: '.plop-templates/Application/E2ESpec.hbs',
        })
      }

      //   actions.push(lintFix(`${path}/${toPascalCase(name)}.tsx`))
      return actions
    },
  })
}
