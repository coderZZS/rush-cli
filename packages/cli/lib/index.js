const path = require("path");
const userhome = require("user-home");
const log = require("@rush-cli/log");
const pathExists = require("path-exists").sync;
const rootCheck = require("root-check");
const dotenv = require("dotenv");
const colors = require("colors");
const fse = require("fs-extra");
const { Command } = require("commander");
const pkg = require("../package.json");
const { Listr } = require("listr2");
const { loading } = require("@rush-cli/util");

const DEFAULT_CLI_HOME = `.${checkScriptName()}`;
const DEFAULT_REQUEST_URL = "http://127.0.0.1:7001";
const DEFAULT_REQUEST_DIR = ".cli-request";
const DEFAULT_REQUEST_FILE = "._request";
const DEFAULT_TEMPLATE_DIR = ".template";
const DEFAULT_TEMPLATE_CATCH_DIR = "node_modules";
const command = new Command();

async function exec() {
  log.verbose("开始检查脚手架运行环境");
  await prepare();
  log.verbose("开始初始化command");
  initCommand();
}

// 指令环境检查
async function prepare() {
  const runner = loading("prepare");
  try {
    await checkUserhome(); // 检查用户主目录
    await checkRoot(); // root降级
    await checkEnv(); // 初始化环境变量
    await createDefaultCliHome(); // 初始化脚手架缓存文件
    await setRequestUrl(); // 初始化脚手架请求文件
    await checkVersion(); // 检查脚手架版本
    runner.succeed();
  } catch (error) {
    runner.warn(error.message);
  }

  await wellcome(); // 欢迎界面

  // TODO 检查脚手架版本
}

// 检查用户主目录
async function checkUserhome() {
  log.verbose("开始检查用户主目录");
  if (!userhome || !pathExists(userhome)) {
    throw new Error("用户主目录不存在");
  }
}

// root降级
async function checkRoot() {
  log.verbose("正在进行root权限兼容处理");
  rootCheck();
  log.verbose("root权限兼容处理结束");
}

// 初始化环境变量
async function checkEnv() {
  const envPath = path.resolve(userhome, ".env");
  if (pathExists) {
    dotenv.config({
      path: envPath,
    });
  }
}

// 创建默认缓存目录
async function createDefaultCliHome() {
  const cliHome = path.resolve(userhome, DEFAULT_CLI_HOME); // 脚手架主目录
  const cliHomeTemplate = path.resolve(cliHome, DEFAULT_TEMPLATE_DIR); // 脚手架模板目录
  const cliHomeTemplateCatch = path.resolve(cliHomeTemplate, DEFAULT_TEMPLATE_CATCH_DIR); //脚手架模板缓存目录
  const cliRequestFile = path.resolve(
    cliHome,
    DEFAULT_REQUEST_DIR,
    DEFAULT_REQUEST_FILE
  ); // 脚手架请求地址缓存目录

  await fse.ensureDir(cliHome);
  await fse.ensureDir(cliHomeTemplate);
  await fse.ensureDir(cliHomeTemplateCatch);
  await fse.ensureFile(cliRequestFile);

  process.env.CLI_HOME = cliHome;
  process.env.CLI_HOME_TEMPLATE = cliHomeTemplate;
  process.env.CLI_HOME_TEMPLATE_CATCH = cliHomeTemplateCatch;
  process.env.CLI_REQUEST_FILE = cliRequestFile;
}

// 创建默认请求地址缓存
async function setRequestUrl(targetUrl = DEFAULT_REQUEST_URL) {
  const requestUrl = (
    await fse.readFile(process.env.CLI_REQUEST_FILE)
  ).toString();
  if (requestUrl === targetUrl) return false;
  await fse.writeFile(process.env.CLI_REQUEST_FILE, targetUrl);
}

// 检查版本号
async function checkVersion() {
  log.success(`当前${pkg.name}的版本为:`, pkg.version);
}

// 检查项目名称
function checkScriptName() {
  const name = Object.keys(pkg.bin).find((item) => item.includes("cli"));
  if (!name) throw new Error("bin命令名非法，名称需包含cli");
  return name;
}

// 初始化命令
function initCommand() {
  command
    .name(checkScriptName())
    .description("一个不知名的脚手架")
    .usage("<command> [options]")
    .version(pkg.version)
    .option("-d, --debug", "调试模式", false)
    .option("-tp, --targetPath", "指定调试文件")
    .option("-u, --url <url>", "指定请求地址");

  command.option("-h, --help", "帮助文档").action(command.outputHelp);

  command
    .command("init [projectName]")
    .option("-y, --yes", "按照默认配置初始化", false)
    .description("初始化一个项目")
    .action(require("./exec"));

  command
    .command("publish [projectName]")
    .option("-t, --test", "发布到测试环境", false)
    .option("-p, --prod", "发布到正式环境", false)
    .description("发布一个项目")
    .action(require("./exec"));

  command.on("option:debug", function () {
    process.env.LOG_LEVEL = "verbose";
    log.level = process.env.LOG_LEVEL;
    log.verbose("调试模式启动");
  });

  command.on("option:url", async function () {
    if (!process.env.CLI_REQUEST_FILE) {
      await createDefaultCliHome();
    }
    await setRequestUrl(this.opts().url);
  });

  command.on("command:*", function () {
    console.log(colors.red("命令未定义"));
  });

  command.parse(process.argv);
}

function wellcome() {
  const template = (text = "积跬步以至千里，积小流以成江海") => `
                   __._                                   
                  / ___)_                                 
                 (_/Y ===\\                            __ 
                 |||.==. =).                            | 
                 |((| o |p|      |  ${text}
              _./| \\(  /=\\ )     |__                    
            /  |@\\ ||||||||.                             
           /    \\@\\ ||||||||\\                          
          /   \\  \\@\\ ||||||//\\                        
         (     Y  \\@\\|||| // _\\                        
         |    -\\   \\@\\ \\\\//    \\                    
         |     -\\__.-./ //\\.---.^__                        
         | \\    /  |@|__/\\_|@|  |  |                         
         \\__\\      |@||| |||@|     |                    
         <@@@|     |@||| |||@|    /                       
        / ---|     /@||| |||@|   /                                 
       |    /|    /@/ || |||@|  /|                        
       |   //|   /@/  ||_|||@| / |                        
       |  // \\ ||@|   /|=|||@| | |                       
       \\ //   \\||@|  / |/|||@| \\ |                     
       |//     ||@| /  ,/|||@|   |                        
       //      ||@|/  /|/||/@/   |                        
      //|   ,  ||//  /\\|/\\/@/  / /                      
     //\\   /   \\|/  /H\\|/H\\/  /_/                     
    // |\\_/     |__/|H\\|/H|\\_/                         
   |/  |\\        /  |H===H| |                            
       ||\\      /|  |H|||H| |                            
       ||______/ |  |H|||H| |                             
        \\_/ _/  _/  |L|||J| \\_                          
        _/  ___/   ___\\__/___ '-._                       
       /__________/===\\__/===\\---'                      
                                                          
  `;
  console.log(colors.random(template()));
}

module.exports = exec;
