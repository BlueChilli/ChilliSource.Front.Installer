/** Libraries */
const fsExtra = require('fs-extra');
const path = require('path');
const gitPromise = require('simple-git/promise');
const Spinner = require('cli-spinner').Spinner;
const inquirer = require('inquirer');
const execa = require('execa');
const chalk = require('chalk');
const name = require('./package.json').name;

/** Constants */
const { prettier, scripts } = require('./constants');

/** Initialisation */
const spinner = new Spinner('%s');
spinner.setSpinnerString(`${chalk.yellow('|/-\\')}`);

/**
 * Creates a directory at the specified path
 * if it doesn't exist
 * @param {string} path The path at which to create a new directory
 */
const generateDirectory = directoryPath => {
	if (!fsExtra.existsSync(directoryPath)) {
		fsExtra.mkdirSync(directoryPath);
	}
};

/**
 * Retrieves all directories and sub-directories
 * starting at the path provided.
 * @param {string} rootPath
 *
 * @returns {string[]}
 */
const getDirectories = rootPath => {
	return fsExtra
		.readdirSync(rootPath)
		.filter(directoryPath => {
			if (fsExtra.statSync(path.join(rootPath, directoryPath)).isDirectory()) {
				return true;
			}

			return false;
		})
		.filter(directoryPath => {
			if (!directoryPath.startsWith('.')) {
				return true;
			}

			return false;
		});
};

/**
 * Iterates over the provided directory and its sub-
 * directories, goes through each `.packages` file
 * and compiles a list of `.packages` files
 * @param {*} directory
 * @param {*} fileList
 *
 * @returns {string[]}
 */
const getPackagesFileList = (directory, fileList) => {
	if (directory[directory.length - 1] !== '/') {
		directory = directory.concat('/');
	}

	const files = fsExtra.readdirSync(directory);
	let newFileList = fileList || [];

	files.forEach(file => {
		if (fsExtra.statSync(directory + file).isDirectory()) {
			newFileList = getPackagesFileList(directory + file + '/', newFileList);
		} else {
			newFileList.push(directory + file);
		}
	});

	return newFileList;
};

/**
 * Copies the 'style-helpers' folder over from
 * CS.Front.Modules to the target directory
 * @param {string} destinationDirectory The target directory where to install the modules
 * @param {string} gitRepoLocation The path to where to copy contents from
 *
 * @returns {Promise}
 */
const installStyleHelpers = (destinationDirectory, gitRepoLocation) => {
	console.log('');
	console.log(`Installing ${chalk.bold.greenBright('Styling Helpers')}`);

	// Change context to the target location, if not already
	ensureProcessIsRunningInTheCorrectDirectory(destinationDirectory);

	// Only install if base CRA & ChilliFront App has been setup
	if (fsExtra.existsSync('node_modules')) {
		// Make a directory for style-helpers
		generateDirectory('./src/style-helpers');

		// Copy directory to destination
		return fsExtra.copy(
			path.join(gitRepoLocation, 'style-helpers'),
			path.join('./src/style-helpers')
		);
	} else {
		console.log(
			`The current directory does not look like a ${chalk.bold.red('create-react-app')} project.`
		);
		console.log('You can start over by deleting this directory and running the following command:');
		console.log();
		console.log(`${chalk.cyan(`npx ${name} <project-directory>`)}`);
		process.exit(1);
	}
};

/**
 * Temporarily clones the repo if not existing in the temp directory
 * or if it does exist, then just does a pull and updates it.
 * @param {string} repositoryUrl The URL of the repository
 * @param {string} gitRepoLocation The location on the local machine where to install
 */
async function temporarilyCloneGitRepo(repositoryUrl, gitRepoLocation) {
	// Start spinner
	spinner.start();

	// Check temp directory exists
	generateDirectory(gitRepoLocation);

	// Check if directory is a repo or not
	const gitRepo = gitPromise(gitRepoLocation);
	const directoryIsRepository = await gitRepo.checkIsRepo();

	// Put Git Repo contents into the local gitRepo directory
	if (directoryIsRepository) {
		await gitRepo.pull();
	} else {
		fsExtra.emptyDirSync(gitRepoLocation);
		await gitRepo.clone(repositoryUrl, gitRepoLocation);
	}

	// Stop spinner
	spinner.stop();
}

/**
 * Installs the `Mod`s selected by the user into
 * the target directory
 * @param {string} gitRepoLocation The path to where to copy contents from
 */
async function installUserSelectedModules(gitRepoLocation) {
	// Make a directory for modules
	generateDirectory('./src/modules');
	console.log('');
	// Deal with CS.Front.Modules
	console.log(`${chalk.yellow('Time to select your modules. Fetching the latest list...')}`);
	const chilliSourceFrontModuleList = await getDirectories(gitRepoLocation + '/modules');

	console.log('');
	const userSelection = await inquirer.prompt([
		{
			message: 'Select modules to import',
			type: 'checkbox',
			choices: chilliSourceFrontModuleList,
			name: 'userSelectedModules',
		},
	]);

	// Get user selected modules
	const modules = userSelection['userSelectedModules'];

	if (modules.length > 0) {
		console.log('');
		console.log(`You've ${chalk.green('selected')} the following modules:`);
		modules.forEach(module => {
			console.log(`--- ${chalk.cyan(module)}`);
		});

		// Make directory
		generateDirectory('./src/modules');

		// Install each module selected by user
		console.log('');
		console.log(`Installing modules:`);
		modules.forEach(module => {
			fsExtra.copySync(
				path.join(gitRepoLocation, 'modules', module),
				path.join('./src/modules', module)
			);

			console.log(`--- ${chalk.bold.cyan(module)} : Done`);
		});

		// Install dependencies
		console.log('');
		console.log(`Installing dependencies for selected modules...`);
		console.log('');
		const dependencyList = getDependenciesForPackages('./src/modules');

		dependencyList.unshift('add');
		const installStatus = await execa('yarn', dependencyList);
		console.log(`--- ${installStatus.stdout}`);
		console.log('');
		console.log(`${chalk.cyan(`npx ${name} --only-modules`)}`);
		console.log('');
		console.log('Happy coding!');
		console.log('|‾‾‾‾‾‾‾‾‾‾‾‾|');
		console.log('| BLUECHILLI |');
		console.log('|____________|');
		console.log('(__/) || ');
		console.log('(•ㅅ•) || ');
		console.log('/ 　 づ');
		console.log('');
	} else {
		console.log('');
		console.log(
			`You ${chalk.bold.red(
				"haven't"
			)} installed any modules at this time. You can do so later by running the following command:`
		);
		console.log('');
		console.log(`${chalk.cyan(`npx ${name} --only-modules`)}`);
		console.log('');
		console.log('Happy coding!');
		console.log('|‾‾‾‾‾‾‾‾‾‾‾‾|');
		console.log('| BLUECHILLI |');
		console.log('|____________|');
		console.log('(__/) || ');
		console.log('(•ㅅ•) || ');
		console.log('/ 　 づ');
		console.log('');
	}
}

/**
 * Shows the user a prompt with all available modules and then installs the modules
 * which the user has selected.
 * @param {string} destinationDirectory The target directory where to install the modules
 * @param {string} gitRepoLocation The location on the local machine where to install
 */
async function installModulesAndTheirDependencies(destinationDirectory, gitRepoLocation) {
	// Change context to the target location, if not already
	ensureProcessIsRunningInTheCorrectDirectory(destinationDirectory);

	// Only install if base CRA & ChilliFront App has been setup
	if (fsExtra.existsSync('node_modules')) {
		// Copy styles & modules
		return installUserSelectedModules(gitRepoLocation);
	} else {
		console.log(
			`The current directory does not look like a ${chalk.bold.red('create-react-app')} project.`
		);
		console.log('You can start over by deleting this directory and running the following command:');
		console.log();
		console.log(`${chalk.cyan(`npx ${name} <project-directory>`)}`);
		process.exit(1);
	}
}

/**
 * Shows the user a prompt with all available modules and then installs the modules
 * which the user has selected.
 * @param {string} destinationDirectory The target directory where to install the modules
 * @param {string} gitRepoLocation The location on the local machine where to install
 */
async function installComponentsAndTheirDependencies(destinationDirectory, gitRepoLocation) {
	// Change context to the target location, if not already
	ensureProcessIsRunningInTheCorrectDirectory(destinationDirectory);

	// Only install if ChilliFront App has been setup
	if (fsExtra.existsSync('node_modules')) {
		// Copy styles & modules
		installUserSelectedComponents(gitRepoLocation);
	} else {
		console.log(
			`The current directory does not look like a ${chalk.bold.red('create-react-app')} project.`
		);
		console.log('You can start over by deleting this directory and running the following command:');
		console.log();
		console.log(`${chalk.cyan(`npx ${name} <project-directory>`)}`);
		process.exit(1);
	}
}

/**
 * Installs the components selected by the user into
 * the target directory
 * @param {string} gitRepoLocation The path to where to copy contents from
 */
async function installUserSelectedComponents(gitRepoLocation) {
	// Make a directory for modules
	generateDirectory('./src/components');
	console.log('');
	// Deal with CS.Front.Modules
	console.log(`${chalk.yellow('Select your components. Fetching the latest list...')}`);
	const chilliSourceFrontComponentList = await getDirectories(gitRepoLocation + '/components');

	console.log('');
	const userSelection = await inquirer.prompt([
		{
			message: 'Select modules to import',
			type: 'checkbox',
			choices: chilliSourceFrontComponentList,
			name: 'userSelectedComponents',
		},
	]);

	// Get user selected modules
	const components = userSelection['userSelectedComponents'];

	if (components.length > 0) {
		console.log('');
		console.log(`You've ${chalk.green('selected')} the following components:`);
		components.forEach(component => {
			console.log(`--- ${chalk.cyan(component)}`);
		});

		// Install each component selected by user
		console.log('');
		console.log(`Installing components:`);
		components.forEach(component => {
			fsExtra.copySync(
				path.join(gitRepoLocation, 'components', component),
				path.join('./src/components', component)
			);

			console.log(`--- ${chalk.bold.cyan(component)} : Done`);
		});

		// Install dependencies
		console.log('');
		console.log(`Installing dependencies for selected components...`);
		console.log('');
		const dependencyList = getDependenciesForPackages('./src/components');

		dependencyList.unshift('add');
		const installStatus = await execa('yarn', dependencyList);
		console.log(`--- ${installStatus.stdout}`);
		console.log('');
		console.log(`${chalk.cyan(`npx ${name} --only-components`)}`);
		console.log('');
		console.log('Happy coding!');
		console.log('|‾‾‾‾‾‾‾‾‾‾‾‾|');
		console.log('| BLUECHILLI |');
		console.log('|____________|');
		console.log('(__/) || ');
		console.log('(•ㅅ•) || ');
		console.log('/ 　 づ');
		console.log('');
	} else {
		console.log('');
		console.log(
			`You ${chalk.bold.red(
				"haven't"
			)} installed any components at this time. You can do so later by running the following command:`
		);
		console.log('');
		console.log(`${chalk.cyan(`npx ${name} --only-components`)}`);
		console.log('');
		console.log('Happy coding!');
		console.log('|‾‾‾‾‾‾‾‾‾‾‾‾|');
		console.log('| BLUECHILLI |');
		console.log('|____________|');
		console.log('(__/) || ');
		console.log('(•ㅅ•) || ');
		console.log('/ 　 づ');
		console.log('');
	}
}

/**
 * Goes recursively through all the directory root provided
 * and all its children to generate a list of all the dependencies
 * via their '.packages' file.
 * @param {*} moduleDirectory
 *
 * @returns {string[]}
 */
const getDependenciesForPackages = moduleDirectory => {
	const fileList = getPackagesFileList(moduleDirectory);
	const packageLocations = fileList.filter(fileLocation => fileLocation.endsWith('.packages'));

	const filteredLocations = packageLocations
		.map(packageLocation => {
			return fsExtra.readFileSync(packageLocation, 'utf8').split(/[\r\n]+/);
		})
		.reduce((reduction, dependency) => {
			return reduction.concat(dependency);
		}, [])
		.sort()
		.filter((dependency, index, dependencyList) => {
			return dependencyList.indexOf(dependency) === index;
		});

	return filteredLocations;
};

async function createReactAppWithChilliSourceFrontEndAt(templateDirectory, destinationDirectory) {
	console.log(`Running ${chalk.bold.cyan('create-react-app')}. Please wait...`);

	// Run npx script at the target location
	execa.sync('npx', ['create-react-app', destinationDirectory]);

	// Change context to the target location, if not already
	if (!process.cwd().includes(destinationDirectory)) {
		process.chdir(destinationDirectory);
	}

	// Install CS.Front.Core
	console.log('');
	console.log(`Installing ${chalk.bold.cyan('CS.Front.Core')}`);
	const installCSFrontCore = await execa('yarn', ['add', 'chillifront']);
	console.log(`--- ${installCSFrontCore.stdout}`);

	// Clear the contents of the 'src' directory before copying our stuff in
	fsExtra.removeSync('./src/App.css');
	fsExtra.removeSync('./src/App.js');
	fsExtra.removeSync('./src/App.test.js');
	fsExtra.removeSync('./src/index.css');
	fsExtra.removeSync('./src/logo.svg');
	fsExtra.removeSync('./src/registerServiceWorker.js');

	// Copy template directory to new app
	fsExtra.copySync(templateDirectory, destinationDirectory);

	// Update package.json
	const existingPackageJSON = require(destinationDirectory + '/package.json');
	existingPackageJSON.scripts = scripts;
	existingPackageJSON.prettier = prettier;
	existingPackageJSON.devDependencies = {
		...existingPackageJSON.devDependencies,
		'env-cmd': '^8.0.2',
	};
	fsExtra.writeFileSync(
		destinationDirectory + '/package.json',
		JSON.stringify(existingPackageJSON)
	);

	// Install node-sass-chokidar
	console.log('');
	console.log(`Installing ${chalk.bold.cyan('SASS')}`);
	const installNodeSass = await execa('yarn', ['add', 'npm-run-all', 'node-sass-chokidar', '-D']);
	console.log(`--- ${installNodeSass.stdout}`);
}

/**
 * Ensures the process always runs in the correct directory
 * @param {string} destinationDirectory The target directory where to install the modules
 */
const ensureProcessIsRunningInTheCorrectDirectory = destinationDirectory => {
	// Ensure the process is running in the correct directory
	const formattedDestinationDirectory = destinationDirectory.slice(2);
	if (!process.cwd().includes(formattedDestinationDirectory)) {
		process.chdir(formattedDestinationDirectory);
	}
};

module.exports = {
	createReactAppWithChilliSourceFrontEndAt,
	installModulesAndTheirDependencies,
	generateDirectory,
	installStyleHelpers,
	temporarilyCloneGitRepo,
	installComponentsAndTheirDependencies,
};
