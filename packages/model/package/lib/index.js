module.exports = class Package {
    constructor ({ name= '', targetPath = '' }) {
        this.projectName = name
        this.targetPath = targetPath || process.cwd()
    }
}