import React, {Fragment} from 'react'
import {Switch, Route} from "react-router";
import Home from "./Home/Home";

export default class Entry extends React.Component {
  render() {
    return (
      <Fragment>
        <nav>NavBar Goes Here</nav>
        <Switch>
          <Route exact path="/" component={Home}/>
          {this.props.routes}
        </Switch>
      </Fragment>
    )
  }
}