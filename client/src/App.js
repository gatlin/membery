import React from 'react';
import { connect } from 'react-redux';
import * as authActions from './Auth';
import * as membersActions from './services/members';
import * as committeesActions from './services/committees';
import * as meetingsActions from './services/meetings';
import './App.css';

const App = ({
    login,
    logout,
    goTo,
    loadMembers,
    loadCommittees,
    loadMeetings,
    isAuthenticated
})=> (
    <div>
      <nav>
        <header>
          <div>
            <a href="#">Membery</a>
          </div>
          <button
            className="btn-margin"
            onClick={() => { goTo('home'); }}
          >
            Home
          </button>
          {
          !isAuthenticated() && (
              <span id='main-btns'>
                <button
                  id="qsLoginBtn"
                  className="btn-margin"
                  onClick={() => { login(); }}
                >
                  Log In
                </button>
              </span>
          )
          }
          {
              isAuthenticated() && (
                  <span id='main-btns'>
                    <button
                      id='btn-nav-members'
                      onClick={() => {
                          loadMembers();
                          goTo('members');
                      }}
                    >
                      Members
                    </button>
                    <button
                      id='btn-nav-committees'
                      onClick={() => {
                          loadCommittees();
                          goTo('committees');
                      }}
                    >
                      Committees
                    </button>
                    <button
                      id='btn-nav-meetings'
                      onClick={() => {
                          loadMeetings();
                          goTo('meetings');
                      }}
                    >
                      Meetings
                    </button>
                    <button
                      id="qsLogoutBtn"
                      className="btn-margin"
                      onClick={() => { logout(); }}
                    >
                      Log Out
                    </button>
                  </span>
              )
          }
        </header>
      </nav>
    </div>
);

export default connect(
    state => state,
    dispatch => ({
        login: () => dispatch(authActions.login()),
        logout: () => dispatch(authActions.logout()),
        isAuthenticated: () => dispatch(authActions.isAuthenticated()),
        loadMembers: () => dispatch(membersActions.loadMembers()),
        loadCommittees: () => dispatch(committeesActions.loadCommittees()),
        loadMeetings: () => dispatch(meetingsActions.loadMeetings())
    })
)(App);
