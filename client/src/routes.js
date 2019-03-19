import React from 'react';
import { Route, Router } from 'react-router-dom';
import App from './App';
import Home from './containers/Home';
import { MembersPage } from './containers/Members';
import { CommitteesPage } from './containers/Committees';
import { MeetingsPage } from './containers/Meetings';
import { RolesPermsPage } from './containers/RolesPerms';
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
          <Route path="/members" render={(props) => (<MembersPage
                                                       {...props}/>)}></Route>
          <Route path='/committees' render={(props) => (
              <CommitteesPage { ...props }/>
          )}></Route>
          <Route path='/meetings' render={(props) => (
              <MeetingsPage { ...props }/>
          )}></Route>
          <Route path='/roles-perms' render={(props) => (
              <RolesPermsPage { ...props }/>
          )}/>
          <Route path="/callback" render={(props) => {
              handleAuthentication({ ...props, auth });
              return (<Callback {...props} />);
          }}/>

        </div>
      </Router>
  );
};
