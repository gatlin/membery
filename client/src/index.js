import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware  } from 'redux';
import thunk from 'redux-thunk';
import Membery, { default_state } from './reducers';
import Auth from './Auth/Auth';

import * as membersActions from './members';
import * as commActions from './committees';
import * as meetingsActions from './meetings';

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

store.dispatch(membersActions.loadMembers());
store.dispatch(commActions.loadCommittees());
store.dispatch(meetingsActions.loadMeetings());
