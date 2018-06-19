import chillifront from "chillifront";
import configureStore from "./redux/configureStore";
import Entry from "./App/Entry";
export default chillifront(
  [
    /* Mods go here */
  ],
  configureStore
)(Entry);