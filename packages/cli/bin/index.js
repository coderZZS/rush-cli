#! /usr/bin/env node
const importLocal = require('import-local')
const log = require('@rush-cli/log')
if (importLocal(__dirname)) {
    log.success('正在使用本地的脚手架')
    require('../lib/index')(process.argv.slice(2))
} else {
    require('../lib/index')()
}