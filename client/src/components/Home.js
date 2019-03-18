import React from 'react';

export const Home = ({
    isAuthenticated,
    login
}) => (
    <div className='container'>
    {
        isAuthenticated() && (
            <div>
              <h4>
                You are logged in!
              </h4>
            </div>
        )
    }
    {
      !isAuthenticated() && (
          <h4>
            You are not logged in! Please{' '}
            <button
              className='link-btn'
              style={{ cursor: 'pointer' }}
              onClick={ () => { login(); }}
            >
              Log In
            </button>
            {' '} to continue.
          </h4>
        )
    }
    </div>
);
