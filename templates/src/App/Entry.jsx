import React, {Fragment} from 'react'
import {Switch} from "react-router";

export default class extends React.Component {
  render() {
    return (
      <Fragment>
        <nav>NavBar Goes Here</nav>
        <Switch>
          {this.props.routes}
        </Switch>
      </Fragment>
    )
  }
}