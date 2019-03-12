import React from 'react';
import { withRouter } from 'react-router';
import { Route, Router } from 'react-router-dom';
import App from './App';
import Home from './Home/Home';
import { MembersPage } from './containers/Members';
import Callback from './Callback/Callback';

import history from './history';

const handleAuthentication = ({ auth, location }) => {
    if (/access_token|id_token|error/.test(location.hash)) {
        auth.handleAuthentication();
    }
};

export const goTo = route => {
    history.replace(`/${route}`);
};

export const makeMainRoutes = (auth) => {
  return (
      <Router history={history}>
        <div>
          <Route path="/" render={(props) => <App goTo={goTo} auth={auth} {...props} />} />
          <Route path="/home" render={
              (props) =><Home auth={auth} goTo={goTo} {...props} />
          } />
          <Route path="/members" render={(props) => (<MembersPage {...props}/>)}></Route>
          <Route path="/callback" render={(props) => {
              handleAuthentication({ ...props, auth });
              return (<Callback {...props} />);
          }}/>
        </div>
      </Router>
  );
};
