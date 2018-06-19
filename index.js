#!/usr/bin/env node

const path = require("path");
const fs = require('fs');
const fsExtra = require('fs-extra');

const os = require('os');
const inquirer = require('inquirer');
const Spinner = require('cli-spinner').Spinner;
const execa = require('execa');
const yargs = require('yargs').argv;

const scripts = {
  "build-css": "node-sass-chokidar --include-path ./src --include-path ./node_modules src/ -o src/",
  "watch-css": "npm run build-css && node-sass-chokidar --include-path ./src --include-path ./node_modules src/ -o src/ --watch --recursive",
  "start-js": "react-scripts start",
  "start": "npm-run-all -p watch-css start-js",
  "build-js": "react-scripts build",
  "build": "npm-run-all build-css build-js",
  "test": "react-scripts test --env=jsdom",
  "eject": "react-scripts eject"
};


const tmpLocationOfGitoRepo = path.join(os.tmpdir(), "chillisaucefrontmodules");

const cfmGit = "git@github.com:BlueChilli/ChilliSource.Front.Modules.git";
const currentDir = process.cwd();
const templateDir = path.join(currentDir, "templates");

var spinner = new Spinner('%s');
spinner.setSpinnerString('|/-\\');

const mkDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
};

async function getSelectedModules(csRepo) {
  const dirs = p => fs.readdirSync(p).filter(f => fs.statSync(path.join(p, f)).isDirectory()).filter(f => !f.startsWith("."));
  mkDir(tmpLocationOfGitoRepo);
  const simpleGit = require('simple-git/promise')(tmpLocationOfGitoRepo);
  const isRepo = await simpleGit.checkIsRepo();
  spinner.start();
  if (isRepo) {
    //await simpleGit.pull();
  } else {
    await simpleGit.clone(csRepo, tmpLocationOfGitoRepo);
  }
  spinner.stop();
  const frontEndModules = await dirs(tmpLocationOfGitoRepo);

  const selected = await inquirer.prompt([
    {
      "message": "select modules to install",
      "type": "checkbox",
      choices: frontEndModules,
      name: "selectedModules"
    }
  ]);

  return selected['selectedModules'];
}

////////////////////////////////////////////////////////////////////////


async function installReactAppWithChilliFront(destinationDir) {
  // ****** Install react-react-app
  console.log("Running create-react-app, please wait a bit.");
  execa.sync("npx", ['create-react-app', destinationDir]);

  // ****** change shell context to new dir
  process.chdir(destinationDir);

  // ****** Install Chillisource.Front Core
  console.log("Installing Chillisource.Front Core");
  const runAddCS = await execa("yarn", ['add', 'git+ssh://git@github.com:BlueChilli/ChilliSource.Front.git']);
  console.log(runAddCS.stdout);

  // ***** Copy template dir to new app
  fsExtra.copySync(templateDir, destinationDir);

  // ***** Update Package.json for node-sass-chokidar
  const existingPackageJson = require(destinationDir + "/package.json");
  existingPackageJson.scripts = scripts;
  fs.writeFileSync(destinationDir + "/package.json", JSON.stringify(existingPackageJson));

  // ***** Install node-sass-chokidar

  const runAddchokidar = await execa("yarn", ['add', 'npm-run-all', 'node-sass-chokidar', '-D']);
  console.log(runAddchokidar.stdout);

}

if (yargs.install) {
  FreclDirDest = yargs.install;
  mkDir(yargs.install);
  console.log("Installing React with ChilliFront at", path.resolve(yargs.install));
  installReactAppWithChilliFront(path.resolve(yargs.install));
}

if (yargs.getMods) {

  if (fs.existsSync("node_modules")
    && fs.existsSync("src")
    && fs.existsSync("public")
  ) {

    getSelectedModules(cfmGit).then(modules => {
      mkDir("./src/modules");
      modules.forEach(mod => {
        console.log("Installing", path.join("./src/modules", mod));
        fsExtra.copySync(path.join(tmpLocationOfGitoRepo, mod), path.join("./src/modules", mod));
      })
    });
  } else {
    console.error("This does not look like a react-creat-app project");
  }

}





