const scripts = {
	'build-css': 'node-sass-chokidar --include-path ./src --include-path ./node_modules src/ -o src/',
	'watch-css':
		'npm run build-css && node-sass-chokidar --include-path ./src --include-path ./node_modules src/ -o src/ --watch --recursive',
	'start-js': 'react-scripts start',
	start: 'env-cmd local npm-run-all -p watch-css start-js',
	'build-js': 'react-scripts build',
	build: 'npm-run-all build-css build-js',
	'build:development': 'env-cmd development npm run build',
	'build:staging': 'env-cmd staging npm run build',
	'build:production': 'env-cmd production npm run build',
	test: 'react-scripts test --env=jsdom',
	eject: 'react-scripts eject',
};

const prettier = {
	printWidth: 100,
	noSemi: true,
	trailingComma: 'es5',
	jsxBracketSameLine: true,
	rcVerbose: true,
	useTabs: true,
	tabWidth: 2,
	singleQuote: true,
};

module.exports = { prettier, scripts };
