import { combineReducers } from 'redux';

import members, { initialState as membersInitialState } from '../members';

export const default_state = {
    members: membersInitialState
};

export default combineReducers({
    members
});
