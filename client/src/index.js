import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware  } from 'redux';
import thunk from 'redux-thunk';
import Membery, { default_state } from './reducers';
import Auth from './Auth/Auth';

import { makeMainRoutes } from './routes';

const auth = new Auth();

const store = createStore(
    Membery,
    default_state,
    applyMiddleware(thunk.withExtraArgument({
        auth
    })));

const routes = makeMainRoutes(auth);

ReactDOM.render(
    <Provider store={store}>
      { routes }
    </Provider>,
    document.getElementById('root')
);
