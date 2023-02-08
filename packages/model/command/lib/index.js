const semver = require('semver')
const log = require('@rush-cli/log')
const LOWEST_NODE_VERSION = '12.0.0'
module.exports = class Command {
    constructor (args) {
        if (!args) {
            throw new Error('参数不能为空')
        }
        if (!Array.isArray(args)) {
            throw new Error('参数必须是array类型')
        }
        this._argv = args // 初始化参数
        this._cmd = args[1]
        this.runner()
    }
    runner () {
        let chain = Promise.resolve()
        chain = chain.then(() => this.checkNodeVersion())
        chain = chain.then(() => this.init())
        chain = chain.then(() => this.exec())
        chain.catch((e) => {
            log.error(e)
        })
    }
    init () {
        throw new Error('init方法需要实现')
    }
    exec () {
        throw new Error('exec方法需要实现')
    }
    checkNodeVersion () {
        const currentNodeVersion = process.version
        if (!semver.gte(currentNodeVersion, LOWEST_NODE_VERSION)) {
            throw new Error(`最低的node版本为：${LOWEST_NODE_VERSION}，当前的node版本为：${LOWEST_NODE_VERSION}`)
        }
    }

}