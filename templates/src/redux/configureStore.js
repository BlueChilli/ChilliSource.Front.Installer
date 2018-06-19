import {createStore, applyMiddleware} from 'redux';
import {composeWithDevTools} from 'redux-devtools-extension';
import {combineReducers} from "redux";

// Optional Middleware
const middleware = [];

export default function configureStore(initialState, modReducers = {}, modMiddleware = [], modStoreEnhancers = []) {
  const composedEnhancers = composeWithDevTools(
    applyMiddleware(...modMiddleware.concat(middleware)),
    ...modStoreEnhancers
  );

  const rootReducer = combineReducers(modReducers);
  return createStore(rootReducer, initialState, composedEnhancers);
}