import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as authActions from './Auth';
import * as membersActions from './members';
import './App.css';

const App = ({
    login,
    logout,
    goTo,
    loadMembers,
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
        loadMembers: () => dispatch(membersActions.loadMembers())
    })
)(App);
