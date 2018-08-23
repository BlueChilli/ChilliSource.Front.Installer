/** Libraries */
import chillifront from 'chillifront';

/** Components */
import Entry from './Entry';

/** Helpers */
import configureStore from '../store';

/** App */
const App = chillifront(
	[
		/* Mods go here */
	],
	configureStore
)(Entry);

export default App;
