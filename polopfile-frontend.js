/* eslint-disable no-plusplus */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/no-var-requires */
const { exec } = require('child_process')
const lodash = require('lodash')

const toPascalCase = (s) => lodash.upperFirst(lodash.camelCase(s))

const lintFix = (file) => () =>
  new Promise((resolve, reject) => {
    exec(`./node_modules/.bin/eslint ${file} --ext .ts,.tsx --fix`, (error) => {
      if (error) return reject(error)
      return resolve(`File ${file} successfully linted.`)
    })
  })

const requireField = (fieldName) => (value) => {
  if (String(value).length === 0) {
    return `Field ${fieldName} is required`
  }
  return true
}

const getDefaultAnswer = (prompt, answer) => {
  if (prompt.type === 'list') {
    const option = prompt.choices.find((choice) => choice.name === answer)
    return option ? option.value : answer
  }
  return answer
}

const dynamicPrompts = async (inquirer, promptQueue, onAnswer) => {
  let answers = {}
  // when we use inquirer on our own, we have to handle default value ourselves
  const execFileIndex = process.argv.findIndex((arg) => arg === 'plopfile.js')
  const defaultAnswers =
    (execFileIndex && process.argv.slice(execFileIndex + 2)) || []

  let index = 0
  while (promptQueue.length > index) {
    const nextPrompt = promptQueue[index]
    const defaultAnswer = defaultAnswers[index]
    const lastAnswer =
      typeof defaultAnswer !== 'undefined'
        ? { [nextPrompt.name]: getDefaultAnswer(nextPrompt, defaultAnswer) }
        : await inquirer.prompt(nextPrompt)
    answers = { ...answers, ...lastAnswer }
    const addAction = onAnswer ? onAnswer(lastAnswer) : undefined
    if (addAction) {
      promptQueue.splice(parseInt(index, 10) + 1, 0, addAction)
    }
    index++
  }
  return answers
}

module.exports = (plop) => {
  plop.setGenerator('component', {
    description: 'Create a component',
    async prompts(inquirer) {
      const basicPrompts = [
        {
          type: 'input',
          name: 'name',
          message: 'What is your component name?',
          validate: requireField('name'),
        },
        {
          type: 'list',
          choices: [
            { name: 'element', value: 'elements' },
            { name: 'block', value: 'blocks' },
            { name: 'page component', value: 'collocated' },
          ],
          name: 'type',
          message: "Choose type (don't know which one? see here: README.md)",
          validate: requireField('type'),
        },
      ]
      const generatorPrompts = [
        {
          type: 'input',
          name: 'childrenComponentName',
          message:
            '(optional) What is your CHILDREN component name (eg. Button)?',
        },
        {
          type: 'list',
          choices: [
            { name: '', value: '' },
            { name: 'element', value: 'elements' },
            { name: 'block', value: 'blocks' },
          ],
          name: 'childrenComponentType',
          message:
            "What is your CHILDREN component type (don't know which one? see here: README.md)",
        },
        {
          type: 'input',
          name: 'childrenJsx',
          message: '(optional) Do you want to add any children JSX?',
        },
      ]
      const promptQueue =
        process.env.APP_ENV === 'generator'
          ? [...basicPrompts, ...generatorPrompts]
          : basicPrompts

      const onAnswer = (lastAnswer) => {
        if (lastAnswer.type === 'collocated') {
          return {
            type: 'input',
            name: 'pageName',
            message: 'What is page name?',
          }
        }
        return null
      }
      const answers = await dynamicPrompts(inquirer, promptQueue, onAnswer)
      return answers
    },
    actions: ({
      type,
      name,
      pageName,
      childrenComponentName,
      childrenComponentType,
      childrenJsx,
    }) => {
      let path = `src/components/${lodash.lowerCase(type)}/${toPascalCase(
        name,
      )}`
      if (type === 'collocated') {
        if (!pageName) throw new Error(`Missing pageName.`)
        path = `src/pages/${toPascalCase(pageName)}/components/${toPascalCase(
          name,
        )}`
      }

      const actions = [
        {
          type: 'add',
          path: `${path}/{{pascalCase name}}.tsx`,
          templateFile: '.plop-templates/Component/Component.hbs',
        },
        {
          type: 'add',
          path: `${path}/index.ts`,
          templateFile: '.plop-templates/Component/Component.index.hbs',
        },
        {
          type: 'modify',
          path: `${path}/{{pascalCase name}}.tsx`,
          pattern: '/* PLOP_INJECT_NEXT_IMPORT */\n',
          template:
            childrenComponentName && childrenComponentType
              ? `import {{childrenComponentName}} from '@components/{{childrenComponentType}}/{{childrenComponentName}}'\n`
              : '',
        },
        {
          type: 'modify',
          path: `${path}/{{pascalCase name}}.tsx`,
          pattern: '/* PLOP_INJECT_CHILDREN */',
          template: childrenComponentName
            ? `<{{pascalCase childrenComponentName}} /> /* PLOP_INJECT_CHILDREN */`
            : '/* PLOP_INJECT_CHILDREN */',
        },
        {
          type: 'modify',
          path: `${path}/{{pascalCase name}}.tsx`,
          pattern: '/* PLOP_INJECT_CHILDREN */',
          template: childrenJsx ? '{{childrenJsx}}' : '',
        },
      ]
      if (type !== 'collocated') {
        actions.push({
          type: 'add',
          path: `${path}/{{pascalCase name}}.stories.tsx`,
          templateFile: '.plop-templates/Component/Component.stories.hbs',
        })
      }
      actions.push(lintFix(`${path}/${toPascalCase(name)}.tsx`))
      return actions
    },
  })

  plop.setGenerator('page', {
    description: 'Create a page',
    prompts: (() => {
      const basicPrompts = [
        {
          type: 'input',
          name: 'name',
          message: 'What is your page name?',
          validate: requireField('name'),
        },
        {
          type: 'input',
          name: 'path',
          default: '/',
          message: 'What is the path?',
          validate: requireField('name'),
        },
        {
          type: 'input',
          name: 'heading',
          message: 'What is your page heading?',
          validate: requireField('heading'),
        },
      ]
      const generatorPrompts = [
        {
          type: 'input',
          name: 'childrenComponentNames',
          message:
            '(optional) What are your CHILDREN components (eg. ["elements/Button"])?',
        },
      ]
      return process.env.APP_ENV === 'generator'
        ? [...basicPrompts, ...generatorPrompts]
        : basicPrompts
    })(),
    actions: ({ name, childrenComponentNames }) => [
      {
        type: 'add',
        path: 'src/pages/{{pascalCase name}}/{{pascalCase name}}.tsx',
        templateFile: '.plop-templates/Page/Page.hbs',
      },
      {
        type: 'add',
        path: 'src/pages/{{pascalCase name}}/{{pascalCase name}}Container.tsx',
        templateFile: '.plop-templates/Page/Page.Container.hbs',
      },
      {
        type: 'add',
        path: 'src/pages/{{pascalCase name}}/index.ts',
        templateFile: '.plop-templates/Page/Page.index.hbs',
      },
      {
        type: 'modify',
        path: 'src/pages/{{pascalCase name}}/{{pascalCase name}}.tsx',
        pattern: '{/* PLOP_HEADING */}',
        template: '{{heading}}',
      },
      {
        type: 'modify',
        path: 'src/pages/{{pascalCase name}}/{{pascalCase name}}.tsx',
        pattern: '/* PLOP_INJECT_NEXT_IMPORT */',
        template: (() => {
          const components =
            childrenComponentNames && JSON.parse(childrenComponentNames)
          if (!components || components.length <= 0)
            return '/* PLOP_INJECT_NEXT_IMPORT */'
          return `${components
            .map(
              (component) =>
                `import ${component.split('/')[2]} from '${component}'`,
            )
            .join('\n')}\n/* PLOP_INJECT_NEXT_IMPORT */`
        })(),
      },
      {
        type: 'modify',
        path: 'src/pages/{{pascalCase name}}/{{pascalCase name}}.tsx',
        pattern: '{/* PLOP_INJECT_CHILDREN */}',
        template: (() => {
          const components =
            childrenComponentNames && JSON.parse(childrenComponentNames)
          if (!components || components.length <= 0)
            return '{/* PLOP_INJECT_CHILDREN */}'
          return `${components
            .map((component) => `<${component.split('/')[2]} />`)
            .join('\n')}\n{/* PLOP_INJECT_CHILDREN */}`
        })(),
      },
      lintFix(`src/pages/${name}/${name}.tsx`),
      {
        type: 'modify',
        path: 'src/pages/index.tsx',
        pattern: '/* PLOP_INJECT_NEXT_IMPORT */',
        template: `const {{pascalCase name}} = loadable(() => import('./{{pascalCase name}}'), {
          fallback: LoadingPage,
        })
        /* PLOP_INJECT_NEXT_IMPORT */`,
      },
      {
        type: 'modify',
        path: 'src/pages/index.tsx',
        pattern: '/* PLOP_INJECT_NEXT_ROUTE */',
        template: `{{pascalCase name}}: createReactRoute('{{path}}', {}, {{pascalCase name}}, { exact: true }),
        /* PLOP_INJECT_NEXT_ROUTE */`,
      },
      lintFix('src/pages/index.tsx'),
    ],
  })

  plop.setGenerator('store', {
    description: 'Create a store ... something',
    prompts: [
      {
        type: 'list',
        choices: [
          { name: 'One liner simple fetch Saga', value: 'fetchSaga' },
          { name: 'One liner simple mutate Saga', value: 'mutateSaga' },
          { name: 'Store module fetch Saga', value: 'moduleSaga' },
          { name: 'A duck (action / selector / reducer)', value: 'duck' },
        ],
        name: 'type',
        message: 'Choose type',
        validate: requireField('name'),
      },
      {
        type: 'input',
        name: 'name',
        message: 'What is store module name?',
        validate: requireField('name'),
      },
    ],
    actions: ({ type }) => {
      let actions = []
      if (type === 'moduleSaga') {
        actions = [
          {
            type: 'add',
            path: 'src/store/{{camelCase name}}/sagas.ts',
            templateFile: '.plop-templates/Store/sagas.hbs',
          },
          {
            type: 'modify',
            path: 'src/store/rootSaga.ts',
            pattern: '/* PLOP_INJECT_NEXT_IMPORT */',
            template: `import {{camelCase name}} from './{{camelCase name}}/sagas'
            /* PLOP_INJECT_NEXT_IMPORT */`,
          },
          {
            type: 'modify',
            path: 'src/store/rootSaga.ts',
            pattern: '/* PLOP_INJECT_NEXT_SAGA */',
            template: '{{camelCase name}}(),\n/* PLOP_INJECT_NEXT_SAGA */',
          },
          lintFix('src/store/rootSaga.ts'),
        ]
        if (process.cwd().includes('grab-a-plate')) {
          // for tests, inside grab-a-plate there is not such dependency
          // on real application bootstrapped from grab-a-plate, there not needed this substitution
          actions.push({
            type: 'modify',
            path: 'src/store/{{camelCase name}}/sagas.ts',
            pattern: '@inventi/keep',
            template: '@packages/keep',
          })
        }
      } else if (type === 'fetchSaga') {
        actions = [
          {
            type: 'modify',
            path: 'src/store/rootSaga.ts',
            pattern: '/* PLOP_INJECT_NEXT_SAGA */',
            template:
              "fetchSaga('{{camelCase name}}'),\n/* PLOP_INJECT_NEXT_SAGA */",
          },
          lintFix('src/store/rootSaga.ts'),
        ]
      } else if (type === 'mutateSaga') {
        actions = [
          {
            type: 'modify',
            path: 'src/store/rootSaga.ts',
            pattern: '/* PLOP_INJECT_NEXT_SAGA */',
            template:
              "mutateSaga('{{camelCase name}}'),\n/* PLOP_INJECT_NEXT_SAGA */",
          },
          lintFix('src/store/rootSaga.ts'),
        ]
      } else if (type === 'duck') {
        actions = [
          {
            type: 'add',
            path: 'src/store/{{camelCase name}}/index.ts',
            templateFile: '.plop-templates/Store/index.hbs',
          },
          {
            type: 'modify',
            path: 'src/store/createReducers.ts',
            pattern: '/* PLOP_INJECT_NEXT_IMPORT */',
            template: `import {{camelCase name}} from './{{camelCase name}}'
            /* PLOP_INJECT_NEXT_IMPORT */`,
          },
          {
            type: 'modify',
            path: 'src/store/createReducers.ts',
            pattern: '/* PLOP_INJECT_NEXT_REDUCER */',
            template: '{{camelCase name}},\n/* PLOP_INJECT_NEXT_REDUCER */',
          },
          lintFix('src/store/createReducers.ts'),
        ]
      }
      return actions
    },
  })
}
