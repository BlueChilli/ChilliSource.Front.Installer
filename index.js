#!/usr/bin/env node

/** Libraries */
const path = require('path');
const os = require('os');
const commandArguments = require('yargs').argv;

const {
	createReactAppWithChilliSourceFrontEndAt,
	installModulesAndTheirDependencies,
	generateDirectory,
} = require('./helpers');

if (commandArguments.install) {
	// Get target location
	const destinationDirectory = commandArguments.install;

	// Generate a directory at target location
	generateDirectory(commandArguments.install);

	// Start the process
	console.log('Installing React with ChilliFront at ', path.resolve(destinationDirectory));
	const templateDirectory = path.join(__dirname, 'templates');
	createReactAppWithChilliSourceFrontEndAt(templateDirectory, path.resolve(destinationDirectory));
}

if (commandArguments.getMods) {
	const tempLocationOfGitRepoModules = path.join(os.tmpdir(), 'pashisajedi');
	const CSFrontModulesUrl = 'git@github.com:BlueChilli/ChilliSource.Front.Modules.git';
	installModulesAndTheirDependencies(CSFrontModulesUrl, tempLocationOfGitRepoModules);
}
