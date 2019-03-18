// Actions

export const CLEAR_MEETINGS = 'membery/meetings/clear_meetings';
export const SET_MEETINGS = 'membery/meetings/set_meetings';
export const SET_MEETING_DATA = 'membery/commitees/set_meeting_data';
export const RM_MEETING = 'membery/meetings/rm_meeting';

// Reducer

export const initialState = {
    updated: Date.now().toString(),
    data: {}
};

export default function(state = initialState, action) {
    switch (action.type) {
    case CLEAR_MEETINGS:
        return { ...initialState, updated: Date.now().toSTring() };

    case SET_MEETINGS: {
        const data = {};
        const updated = Date.now().toString();
        action.data.forEach(meeting => {
            data[meeting.id.toString()] = {
                ...meeting
            };
        });
        return {
            ...state,
            updated,
            data
        };
    }

    case SET_MEETING_DATA: {
        const { id } = action.data;
        const data = { ...state.data };
        data[id ] = { ...action.data };
        return {
            ...state,
            data
        };
    }

    case RM_MEETING: {
        const data = { ...state.data };
        const meeting_id = action.data;
        delete data[meeting_id];
        return { ...state, data };
    }
    default:
        return state;
    }
}

// Action creators

export const loadMeetings = () => (dispatch, getState, { auth }) => {
    return auth.authFetch('/meetings')
        .then(response => response.json())
        .then(({ data }) => {
            dispatch({
                type: SET_MEETINGS,
                data
            });
        });
};

export const updateMeeting = (
    data,
    newMeeting = false
) => (dispatch, getState, { auth }) => {
    let req;
    if (newMeeting) { // create new meeting
        delete data['id'];
        req = auth.authFetch('/meetings', {
            method: 'POST',
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(({ data }) => data);
    }
    else { // Update existing member
        req = auth.authFetch(`/meetings/${data['id']}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        })
            .then(() => {
                return data;
            });
    }

    return req.then(response => {
        dispatch({
            type: SET_MEETING_DATA,
            data: response
        });
        return response;
    });
};

export const deleteMeeting = (
    meeting_id
) => (dispatch, getState, { auth }) => {
    return auth.authFetch(`/meetings/${meeting_id}`, {
        method: 'DELETE'
    })
        .then(() => {
            dispatch({
                type: RM_MEETING,
                data: meeting_id
            });
        });
};
