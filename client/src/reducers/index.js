import { combineReducers } from 'redux';

import members, {
    initialState as membersInitialState
} from '../services/members';
import committees, {
    initialState as commInitialState
} from '../services/committees';
import meetings, {
    initialState as meetingsInitialState
} from '../services/meetings';

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
