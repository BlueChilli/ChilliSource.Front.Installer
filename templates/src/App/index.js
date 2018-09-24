/** Libraries */
import chillifront from 'chillifront';

/** Components */
import Entry from './Entry';

/** App */
const App = chillifront(
	[
		/* Mods go here */
	],
	{
		useDevTools: true,
		debug: true,
	}
)(Entry);

export default App;
