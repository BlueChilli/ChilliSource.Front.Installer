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
} = require('./helpers');

/** Variables */
let targetDirectory;

/** Feed the command into the Commander */
const program = new commander.Command(packageJson.name)
	.version(packageJson.version)
	.arguments('<project-directory>')
	.usage(`${chalk.green('<project-directory>')}`)
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

// Inform the user
console.log('');
console.log(`Creating a new ChilliFront React app in ${chalk.green(targetDirectory)}.`);
console.log('');

// Start the process
createReactAppWithChilliSourceFrontEndAt(
	path.join(__dirname, 'templates'),
	path.resolve(targetDirectory)
).then(data => {
	const tempLocationOfGitRepoModules = path.join(os.tmpdir(), 'pashisajedi');
	const CSFrontModulesUrl = 'git@github.com:BlueChilli/ChilliSource.Front.Modules.git';
	installModulesAndTheirDependencies(CSFrontModulesUrl, tempLocationOfGitRepoModules);
});
