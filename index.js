#!/usr/bin/env node

/** Libraries */
const commander = require('commander');
const chalk = require('chalk');
const os = require('os');
const packageJson = require('./package.json');
const path = require('path');

/** Helpers */
const {
	createReactAppWithChilliSourceFrontEndAt,
	installModulesAndTheirDependencies,
	generateDirectory,
	installStyleHelpers,
	temporarilyCloneGitRepo,
	installComponentsAndTheirDependencies,
} = require('./helpers');

/** Variables */
let targetDirectory;

/** Feed the command into the Commander */
const program = new commander.Command(packageJson.name)
	.version(packageJson.version)
	.description(
		'A simple command line utility to generate a ready-to-run ChilliFront React App(CRA)'
	)
	.arguments('<project-directory>')
	.usage(`${chalk.green('<project-directory>')}`)
	.option('-m, --only-modules', 'Install modules only')
	.option('-s, --only-styles', 'Install style-helpers only')
	.option('-c, --only-components', 'Install components only')
	.action(projectDirectory => {
		targetDirectory = projectDirectory;
	})
	.parse(process.argv);

/** If no target directory specified, throw error */
if (typeof targetDirectory === 'undefined') {
	console.log();
	console.error('Please specify the project directory:');
	console.log(`  ${chalk.cyan(program.name())} ${chalk.green('<project-directory>')}`);
	console.log();
	console.log('For example:');
	console.log(`  ${chalk.cyan(program.name())} ${chalk.green('my-app')}`);
	console.log();
	console.log(`Run ${chalk.cyan(`${program.name()} --help`)} to see all options.`);
	process.exit(1);
}

/** User has now specified the directory, so off we go! */

// Generate directory, if not there
generateDirectory(targetDirectory);

/** Constants */
const CSFrontModulesUrl = 'git@github.com:BlueChilli/ChilliSource.Front.Modules.git';
const tempLocationOfGitRepoModules = path.join(os.tmpdir(), 'pashisajedi');

const installModules = () =>
	installModulesAndTheirDependencies(targetDirectory, tempLocationOfGitRepoModules);

const installStyles = () => installStyleHelpers(targetDirectory, tempLocationOfGitRepoModules);

const installComponents = () =>
	installComponentsAndTheirDependencies(targetDirectory, tempLocationOfGitRepoModules);

const cloneRepo = () => temporarilyCloneGitRepo(CSFrontModulesUrl, tempLocationOfGitRepoModules);

/** If modules flag provided, install modules */
if (program.onlyModules) {
	cloneRepo().then(installModules);
}

/** If components flag provided, install components */
if (program.onlyComponents) {
	cloneRepo().then(installComponents);
}

/** If styles flag provided, install styles */
if (program.onlyStyles) {
	cloneRepo().then(installStyles);
}

/** If no flag, then create a starter app */
if (!program.onlyModules && !program.onlyStyles) {
	// Inform the user
	console.log('');
	console.log(
		`Creating a new ChilliFront React App(CRA) in ${chalk.bold.greenBright(targetDirectory)}.`
	);
	console.log('');

	// Start the process
	createReactAppWithChilliSourceFrontEndAt(
		path.join(__dirname, 'templates'),
		path.resolve(targetDirectory)
	)
		.then(cloneRepo)
		.then(installStyles)
		.then(installModules);
}
