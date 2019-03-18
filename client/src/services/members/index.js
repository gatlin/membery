// Actions

export const CLEAR_MEMBERS = 'membery/members/clear_members';
export const SET_MEMBERS = 'membery/members/set_members';
export const SET_MEMBER_DATA = 'membery/members/set_member_data';
export const RM_MEMBER = 'membery/members/rm_member';

// Reducer

// The keys will be member IDs
// The values will be member objects from the API.
export const initialState = {
    updated: Date.now().toString(), // Freshness
    data: {} // Keys => member IDs, values => member objects
};

export default function(state = initialState, action) {
    switch (action.type) {

    // Clear everything
    case CLEAR_MEMBERS:
        return { ...initialState, updated: Date.now().toString() };

    // Load member data in bulk
    case SET_MEMBERS: {
        const data = {};
        const updated = Date.now().toString();
        action.data.forEach(member => {
            data[member.id.toString()] = {
                ...member
            };
        });
        return {
            ...state,
            updated,
            data
        };
    };

    // Update data for a specific member.
    case SET_MEMBER_DATA: {
        const { id } = action.data;
        const data = { ...state.data };
        data[id] = { ...action.data };
        return {
            ...state,
            data
        };
    };

    case RM_MEMBER: {
        const data = { ...state.data };
        const member_id = action.data;
        delete data[member_id];
        return { ...state, data };
    };

    default:
        return state;
    }
}

// Action creators

export const loadMembers = () => (dispatch, getState, { auth }) => {
    return auth.authFetch('/members')
        .then(response => response.json())
        .then(({ data }) => {
            dispatch({
                type: SET_MEMBERS,
                data
            });
        });
};

export const updateMember = (
    data,
    newMember = false
) => (dispatch, getState, { auth }) => {
    let req;
    if (newMember) { // Create new member
        delete data['id'];
        req = auth.authFetch('/members', {
            method: 'POST',
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(({ data }) => data);
    }
    else { // Update existing member
        req = auth.authFetch(`/members/${data['id']}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        })
            .then(() => {
                return data;
            });
    }

    return req.then(response => {
        dispatch({
            type: SET_MEMBER_DATA,
            data: response
        });
        return response; // The caller may want direct access.
    });
};

export const deleteMember = (member_id) => (dispatch, getState, { auth }) => {
    return auth.authFetch(`/members/${member_id}`, {
        method: 'DELETE'
    })
        .then(() => {
            dispatch({
                type: RM_MEMBER,
                data: member_id
            });
        });
};
