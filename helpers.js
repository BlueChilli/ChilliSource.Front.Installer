/** Libraries */
const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const gitPromise = require('simple-git/promise');
const Spinner = require('cli-spinner').Spinner;
const inquirer = require('inquirer');
const execa = require('execa');

/** Constants */
const { prettier, scripts } = require('./constants');

/** Initialisation */
const spinner = new Spinner('%s');
spinner.setSpinnerString('|/-\\');

/**
 *
 * @param {string} path The path at which to create a new directory
 */
const generateDirectory = directoryPath => {
	if (!fs.existsSync(directoryPath)) {
		fs.mkdirSync(directoryPath);
	}
};

/**
 *
 * @param {string} rootPath
 */
const getDirectories = rootPath =>
	fs
		.readdirSync(rootPath)
		.filter(directoryPath => {
			if (fs.statSync(path.join(rootPath, directoryPath)).isDirectory()) {
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

/**
 *
 * @param {*} directory
 * @param {*} fileList
 */
const getPackagesFileList = (directory, fileList) => {
	if (directory[directory.length - 1] !== '/') {
		directory = directory.concat('/');
	}

	const files = fs.readdirSync(directory);
	let newFileList = fileList || [];

	files.forEach(file => {
		if (fs.statSync(directory + file).isDirectory()) {
			newFileList = getPackagesFileList(directory + file + '/', newFileList);
		} else {
			newFileList.push(directory + file);
		}
	});

	return newFileList;
};

/**
 *
 * @param {string} gitRepoLocation The path to where to copy contents from
 */
const installStyleHelpers = gitRepoLocation => {
	// Make a directory for style-helpers
	generateDirectory('./src/style-helpers');

	// Copy directory to destination
	return fsExtra.copy(
		path.join(gitRepoLocation, 'style-helpers'),
		path.join('./src/style-helpers')
	);
};

/**
 *
 * @param {string} gitRepoLocation The path to where to copy contents from
 */
async function installUserSelectedModules(gitRepoLocation) {
	// Make a directory for modules
	generateDirectory('./src/modules');

	// Stop spinner
	spinner.stop();

	// Deal with CS.Front.Modules
	const chilliSourceFrontModuleList = await getDirectories(gitRepoLocation + '/modules');

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
	console.log(modules);

	if (modules.length > 0) {
		// Make directory
		generateDirectory('./src/modules');

		// Install each module selected by user
		modules.forEach(module => {
			console.log('Installing ', path.join('./src/modules', module));

			fsExtra.copySync(
				path.join(gitRepoLocation, 'modules', module),
				path.join('./src/modules', module)
			);
		});

		// Install dependencies
		console.log('\n\nLooking for dependencies...');
		const dependencyList = getDependenciesForPackages('./src/modules');

		console.log('\n\nInstalling dependencies...');
		dependencyList.unshift('add');
		const installStatus = await execa('yarn', dependencyList);
		console.log(`\n\n${installStatus.stdout}`);
	}
}

/**
 *
 * @param {string} repositoryUrl The URL of the repository
 * @param {string} gitRepoLocation The location on the local machine where to install
 */
async function installModulesAndTheirDependencies(repositoryUrl, gitRepoLocation) {
	console.log(repositoryUrl, gitRepoLocation);
	if (fs.existsSync('node_modules')) {
		// Start spinner
		spinner.start();

		// Check if directory is a repo or not
		const gitRepo = gitPromise(gitRepoLocation);
		const directoryIsRepository = await gitRepo.checkIsRepo();

		// Put Git Repo contents into the local gitRepo directory
		if (directoryIsRepository) {
			await gitRepo.pull();
		} else {
			await gitRepo.clone(repositoryUrl, gitRepoLocation);
		}

		// Copy styles & modules
		installStyleHelpers(gitRepoLocation).then(data => installUserSelectedModules(gitRepoLocation));
	} else {
		console.log("\n\nThis does not look like a 'create-react-app' project");
	}
}

const getDependenciesForPackages = moduleDirectory => {
	const fileList = getPackagesFileList(moduleDirectory);
	const packageLocations = fileList.filter(fileLocation => fileLocation.endsWith('.packages'));

	const filteredLocations = packageLocations
		.map(packageLocation => {
			return fs.readFileSync(packageLocation, 'utf8').split(/[\r\n]+/);
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
	console.log('\n\nRunning create-react-app. Please wait...\n');

	// Run npx script at the target location
	execa.sync('npx', ['create-react-app', destinationDirectory]);

	// Change context to the target location
	process.chdir(destinationDirectory);

	// Install CS.Front.Core
	console.log('\n---- Installing ChilliSource.Front.Core');
	const installCSFrontCore = await execa('yarn', ['add', 'chillifront']);
	console.log(`\n-------- ${installCSFrontCore.stdout}`);

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
	fs.writeFileSync(destinationDirectory + '/package.json', JSON.stringify(existingPackageJSON));

	// Install node-sass-chokidar
	const installNodeSass = await execa('yarn', ['add', 'npm-run-all', 'node-sass-chokidar', '-D']);
	console.log(`\n\n ${installNodeSass.stdout}`);
}

module.exports = {
	createReactAppWithChilliSourceFrontEndAt,
	installModulesAndTheirDependencies,
	generateDirectory,
};
