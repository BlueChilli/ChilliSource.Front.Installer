import React, {Fragment} from 'react'

export default class Home extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {};
  }

  render() {
    return (
      <Fragment>
        <h1>Hello World</h1>
        <p>Your App is now working</p>
      </Fragment>
    )
  }
}