const ora = require('ora')
function loading (text = '加载中') {
    const spinner = ora(text).start()
    return spinner
}

module.exports = {
    loading
}