import { combineReducers } from 'redux';

import members, { initialState as membersInitialState } from '../members';
import committees, { initialState as commInitialState } from '../committees';
import meetings, { initialState as meetingsInitialState } from '../meetings';

export const default_state = {
    members: membersInitialState,
    committees: commInitialState,
    meetings: meetingsInitialState
};

export default combineReducers({
    members,
    committees,
    meetings
});
