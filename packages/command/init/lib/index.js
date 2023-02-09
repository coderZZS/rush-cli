const path = require("path");
const colors = require("colors");
const pathExists = require("path-exists").sync;
const inquirer = require("inquirer");
const { Listr } = require("listr2");
const fse = require("fs-extra");
const Command = require("@rush-cli/command");
const Package = require('@rush-cli/package')
const log = require("@rush-cli/log");
const { request } = require("@rush-cli/request");

const CHECK_TYPE = [
  {
    name: "重命名安装",
    value: "rename",
    async handle(name) {
      let rename;
      while (!rename || rename === name) {
        rename = (
          await inquirer.prompt([
            {
              name: "rename",
              message: "请输入新的项目名",
              type: "input",
            },
          ])
        ).rename;
      }
      return rename;
    },
  },
  {
    name: "覆盖安装",
    value: "cover",
    async handle(name) {
      const isCover = (
        await inquirer.prompt([
          {
            name: "isCover",
            message: "确定要覆盖安装吗？",
            type: "confirm",
          },
        ])
      ).isCover;
      if (isCover) return name;
      throw new Error("取消覆盖安装");
    },
  },
];

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || "my-project";
    this.projectHome = process.cwd();
    this.projectPath = null; // 项目地址
    this.package = null
  }
  async exec() {
    await this.prepare();
    const type = await this.selectInitType();
    const templates = await this.getTemplate(type);
    const project = await this.selectProject(templates);
    this.package = new Package({
      name: project.project_name,
      rootPath: process.env.CLI_HOME_TEMPLATE,
      storePath: process.env.CLI_HOME_TEMPLATE_CATCH,
      targetPath: this.projectPath
    })
  }
  async prepare() {
    try {
      await this.checkCreateDir();
      const projectPath = path.resolve(this.projectHome, this.projectName);
      process.env.CLI_PROJECK_NAME = this.projectName
      await fse.emptyDir(projectPath);
      this.projectPath = projectPath;
    } catch (error) {
      log.error(error.message);
    }
  }
  async checkCreateDir() {
    const isCountinue = (
      await inquirer.prompt([
        {
          name: "isCountinue",
          message: "当前目录已存在同名目录，是否继续初始化？",
          type: "list",
          choices: [
            {
              name: "继续",
              value: true,
            },
            {
              name: "取消",
              value: false,
            },
          ],
        },
      ])
    ).isCountinue;
    if (!isCountinue) {
      log.success("结束进程");
      process.exit(0);
    }
    const checkType = (
      await inquirer.prompt([
        {
          name: "checkType",
          message: "请选择初始化方式",
          type: "list",
          choices: CHECK_TYPE.map(({ name, value }) => ({ name, value })),
        },
      ])
    ).checkType;
    const handle = CHECK_TYPE.find(({ value }) => value === checkType).handle;
    this.projectName = await handle(this.projectName);
  }
  async selectInitType() {
    const { initType } = await inquirer.prompt([
      {
        name: "initType",
        message: "请选择初始化类型",
        type: "list",
        choices: [
          {
            name: "项目",
            value: "project",
          },
          {
            name: "组件",
            value: "component",
          },
        ],
      },
    ]);
  }
  async getTemplate(type = "project") {
    const res = await request.get("/npm");
    return res.filter((project) => project.type === type);
  }
  async selectProject(templates = []) {
    const { projectName } = await inquirer.prompt([
      {
        name: "projectName",
        message: "请选择初始化类型",
        type: "list",
        choices: templates.map(({ projectName, description }) => ({
          name: description,
          value: projectName,
        })),
      },
    ]);
    return templates.find((template) => projectName === template.projectName);
  }
}
module.exports = function init(argv) {
  return new InitCommand(argv);
};
