// Auth-related action creators which don't cleanly fit into other ducks.

export const login = () => (dispatch, getState, { auth }) => {
    return auth.login();
};

export const logout = () => (dispatch, getState, { auth }) => {
    return auth.logout();
};

export const isAuthenticated = () => (dispatch, getState, { auth }) => {
    return auth.isAuthenticated();
};
