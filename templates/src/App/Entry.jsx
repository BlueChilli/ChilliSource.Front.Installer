/** Libraries */
import React from 'react';
import { Switch, Route } from 'react-router-dom';

/** Components */
import Home from '../components/Home';

/** Entry */
class Entry extends React.Component {
	render() {
		return (
			<React.Fragment>
				<nav>NavBar Goes Here</nav>
				<Switch>
					<Route exact path="/" component={Home} />
					{/* Add additional routes here */}
				</Switch>
			</React.Fragment>
		);
	}
}

export default Entry;
