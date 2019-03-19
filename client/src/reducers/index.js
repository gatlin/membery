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

import roles_perms, {
    initialState as RPinitialState
} from '../services/roles_perms';

export const default_state = {
    members: membersInitialState,
    committees: commInitialState,
    meetings: meetingsInitialState,
    roles_perms: RPinitialState
};

export default combineReducers({
    members,
    committees,
    meetings,
    roles_perms
});
