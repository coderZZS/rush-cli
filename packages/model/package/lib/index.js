const path = require('path')
const npminstall = require('npminstall')
const axios = require('axios')
const urljoin = require('url-join')
const fse = require('fs-extra')
const ejs = require('ejs')
const { loading } = require('@rush-cli/util')
const DEFAULT_REGISTRY = 'https://registry.npmjs.org'
module.exports = class Package {
    constructor ({ name = '', targetPath = '', storePath = '', rootPath = '', type = 'project', registry = '' }) {
        this.projectName = name
        this.rootPath = rootPath || process.env.CLI_HOME_TEMPLATE
        this.storePath = storePath || process.env.CLI_HOME_TEMPLATE_CATCH
        this.targetPath = targetPath || process.cwd()
        this.npmRegistry = registry || DEFAULT_REGISTRY
        this.catchFilePrefix = this.projectName.replace('/', '_')
        this.exec()
    }
    async exec() {
        let runner
        try {
            runner = loading('正在初始化模板...')
            await this.install()
            await this.copyFile()
            runner.succeed('模板初始化完成')
        } catch (error) {
            runner.fail('模板初始化失败')
            console.log(error, '----');
        }
        
    }
    async install () {
        return npminstall({
            pkgs: [
                {
                    name: this.projectName,
                    version: 'latest'
                }
            ],
            registry: this.npmRegistry,
            root: this.rootPath,
            storeDir: this.storePath
        })
    }
    async copyFile () {
        const filePath = path.resolve(this.catchFilePath(), 'template')
        fse.copySync(filePath, this.targetPath)
        await this.ejsRender({})
    }
    async ejsRender({ ignore }) {
        if (!ignore || !ignore.length) {
            ignore = ['**/noode_modules/**', '**.png']
        }
        const name = process.env.CLI_PROJECT_NAME
        const version = '1.0.0'
        const projectInfo = {
            name,
            version
        }
        return new Promise((resolve, reject) => {
            require('glob')('**', {
                cwd: this.targetPath,
                ignore,
                nodir: true,
            }, (err, files) => {
                if (err) {
                    reject(err)
                }
                Promise.all(files.map(file => {
                    const filePath = path.join(this.targetPath, file)
                    return new Promise((resolve1, reject1) => {
                        ejs.renderFile(filePath, projectInfo, {}, (err, ret) => {
                            if (err) {
                                reject1(err)
                            } else {
                                fse.writeFileSync(filePath, ret)
                                resolve1(ret)
                            }
                        })
                    })
                })).then(() => {
                    resolve()
                }).catch(err => {
                    reject(err)
                })
            })
        })
    }
    async getPackageVersions () {
        const requestUrl = urljoin(this.npmRegistry, 'axios')
        const { versions } = await axios.get(requestUrl)
        return Object.keys(versions)
    }
    async getPackageLatestVersion () {
        const versions = await this.getPackageVersions()
        return versions[versions.length - 1]
    }
    catchFilePath () {
        return path.resolve(this.storePath, this.projectName)
    }
}