const cp = require('child_process')
const path = require('path')
const colors = require('colors')
const pathExists = require('path-exists').sync
const log = require('@rush-cli/log')
module.exports = function exec () {
    const COMMAND_PROJECT_NAME = {
        init: '@rush-cli/init'
    }
    const commandObj = arguments[arguments.length - 1]
    const commandName = commandObj.name()
    let projectPath = path.resolve(__dirname, '../../command', commandName)
    projectPath = projectPath.replace(/\\/g, '/')

    if (!pathExists(projectPath)) {
        throw new Error('命令文件查找失败, 请务必保证在command文件夹下进行注册')
    }
    const args = Array.from(arguments)
    args[args.length - 1] = null

    const codeStr = `require('${projectPath}')(${JSON.stringify(args)})`
    console.log(codeStr)
    const child = spawn('node', ['-e', codeStr], {
        cwd: process.cwd(),
        stdio: 'inherit'
    })

    child.on('error', e => {
        log.error(e.message)
        process.exit(1)
    })

    child.on('exit', e => {
        log.success(`${commandName}命令执行结束`, e)
        process.exit(e)
    })

    function spawn (command, args, options = {}) {
        const isWindow = process.platform === 'win32'
        const cmd = isWindow ? 'cmd' : command
        const cmdArgs = isWindow ? ['/c'].concat(command, args) : args
        return cp.spawn(cmd, cmdArgs, options)
    }
    console.log(colors.magenta(commandName), projectPath)
}