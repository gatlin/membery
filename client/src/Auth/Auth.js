import history from '../history';
import { EventEmitter } from 'events';
import Auth0Lock from 'auth0-lock';
import auth0 from 'auth0-js';
import { AUTH_CONFIG } from './auth0-variables';

export default class Auth /* extends EventEmitter */ {

    auth0 = new auth0.WebAuth({
        domain: AUTH_CONFIG['domain'],
        clientID: AUTH_CONFIG['clientId'],
        redirectUri: AUTH_CONFIG['callbackUrl'],
        responseType: 'token id_token',
        scope: 'openid profile read:members create:members '
            + 'update:members delete:members',
        // Leave this out and we get the wrong kind of token
        audience: AUTH_CONFIG['apiUrl']

    });

    userProfile;

    constructor() {

        // Method bindings, ugh
        this.login = this.login.bind(this);
        this.logout = this.logout.bind(this);
        this.handleAuthentication = this.handleAuthentication.bind(this);
        this.isAuthenticated = this.isAuthenticated.bind(this);
        this.getAccessToken = this.getAccessToken.bind(this);
        this.getIdToken = this.getIdToken.bind(this);
        this.renewSession = this.renewSession.bind(this);
        this.authFetch = this.authFetch.bind(this);
    }

    login() {
        // Call the show method to display the widget.
        this.auth0.authorize();
    }

    handleAuthentication() {
        this.auth0.parseHash((err, authResult) => {
            if (authResult && authResult.accessToken && authResult.idToken) {
                this.setSession(authResult);
            }
            else if (err) {
                history.replace('/home');
                console.log(err);
                alert(`Error: ${err.error}. Check the console for further`
                      + ` details.`);
            }
        });
    }

    setSession(authResult) {
        if (authResult && authResult.accessToken && authResult.idToken) {
            // Set the time that the access token will expire at
            let expiresAt = JSON.stringify(
                authResult.expiresIn * 1000 + new Date().getTime()
            );
            localStorage.setItem('access_token', authResult.accessToken);
            localStorage.setItem('id_token', authResult.idToken);
            localStorage.setItem('expires_at', expiresAt);
            // navigate to the home route
            history.replace('/home');
        }
    }

    getAccessToken() {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
            throw new Error('No access token found');
        }
        return accessToken;
    }

    getIdToken() {
        const idToken = localStorage.getItem('id_token');
        if (!idToken) {
            throw new Error('No ID token found');
        }
        return idToken;
    }

    renewSession() {
        this.auth0.checkSession({}, (err, authResult) => {
            if (authResult && authResult.accessToken && authResult.idToken) {
                this.setSession(authResult);
            } else if (err) {
                this.logout();
                console.log(err);
                alert(`Could not get a new token (${err.error}:`
                      + ` ${err.error_description}).`);
            }
        });
    }

    logout() {
        // Clear access token and ID token from local storage
        localStorage.removeItem('access_token');
        localStorage.removeItem('id_token');
        localStorage.removeItem('expires_at');
        this.userProfile = null;
        // navigate to the home route
        history.replace('/home');
    }

    isAuthenticated() {
        // Check whether the current time is past the
        // access token's expiry time
        let expiresAt = JSON.parse(localStorage.getItem('expires_at'));
        return new Date().getTime() < expiresAt;
    }

    authFetch(url, options) {
        const prefix = `${AUTH_CONFIG.memberyApiUrl}/api/v1`;
        const headers = {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        };

        if (this.isAuthenticated()) {
            headers['Authorization'] = 'Bearer ' + this.getAccessToken();
        }

        return fetch(`${prefix}${url}`, { headers, ...options })
            .then(this.checkStatus);
    }

    checkStatus(response) {
        if (response.status >= 200 && response.status < 300) {
            return response;
        } else {
            let error = new Error(response.statusText);
            error.response = response;
            throw error;
        }
    }
}
