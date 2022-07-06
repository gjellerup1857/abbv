const { CLIEngine } = require('eslint')

const cli = new CLIEngine({})

module.exports = {
  'adblock-betafish/**/*.js': files =>
    ['eslint --fix --max-warnings=0 ' + files.filter(file => !cli.isPathIgnored(file)).join(' '), 'git add *'],
  'adblock-betafish/**/*.{css,json,html}': files =>
    ['prettier --write ' + files.join(' '), 'git add *']
}
