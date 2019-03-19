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

          {
          !isAuthenticated() && (
              <span id='header-btns'>
                <button
                  id="qsLoginBtn"
                  className="header-btn"
                  onClick={() => { login(); }}
                >
                  Log In
                </button>
              </span>
          )}
          {
              isAuthenticated() && (
                  <span id='header-btns'>
                    <button
                      className="header-btn"
                      onClick={() => { goTo('home'); }}
                    >
                      Home
                    </button>
                    <button
                      className='header-btn'
                      id='btn-nav-members'
                      onClick={() => {
                          loadMembers();
                          goTo('members');
                      }}
                    >
                      Members
                    </button>
                    <button
                      className='header-btn'
                      id='btn-nav-committees'
                      onClick={() => {
                          loadCommittees();
                          goTo('committees');
                      }}
                    >
                      Committees
                    </button>
                    <button
                      className='header-btn'
                      id='btn-nav-meetings'
                      onClick={() => {
                          loadMeetings();
                          loadCommittees();
                          goTo('meetings');
                      }}
                    >
                      Meetings
                    </button>
                    <button
                      className='header-btn'
                      id="qsLogoutBtn"
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
