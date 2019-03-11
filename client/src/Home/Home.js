import React, { Component } from 'react';

class Home extends Component {

    constructor(props) {
        super(props);
        this.state = {
            members: [{
                id: 0
            }]
        };
    }

    login() {
        this.props.auth.login();
    }
    render() {
        const { isAuthenticated } = this.props.auth;
        return (
            <div className="container">
              {
                  isAuthenticated() && (
                      <div>
                        <h4>
                          You are logged in!
                        </h4>
                        <ul>
                          { this.state.members.map(
                              ({ id }) => (<li key={id.toString()}>{id.toString()}</li>)
                          )}
                        </ul>
                      </div>
                  )
              }
              {
              !isAuthenticated() && (
                  <h4>
                    You are not logged in! Please{' '}
                    <a
                      style={{ cursor: 'pointer' }}
                      onClick={this.login.bind(this)}
                    >
                      Log In
                    </a>
                    {' '}to continue.
                  </h4>
              )
              }
            </div>
        );
    }
}

export default Home;
