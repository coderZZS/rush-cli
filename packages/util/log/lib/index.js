const log = require('npmlog')

log.level = process.env.LOG_LEVEL || 'info'
log.heading = 'rush-cli'
log.headingStyle = { fg: 'magenta' }
log.addLevel('success', 2000, { fg: 'blue', bold: true })

module.exports = log