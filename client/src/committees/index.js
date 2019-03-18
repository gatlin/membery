// Actions

export const CLEAR_COMMITTEES = 'membery/committees/clear_committees';
export const SET_COMMITTEES = 'membery/committees/set_committees';
export const SET_COMMITTEE_DATA = 'membery/commitees/set_committee_data';
export const RM_COMMITTEE = 'membery/committees/rm_committee';

// Reducer

export const initialState = {
    updated: Date.now().toString(),
    data: {}
};

export default function(state = initialState, action) {
    switch (action.type) {
    case CLEAR_COMMITTEES:
        return { ...initialState, updated: Date.now().toSTring() };

    case SET_COMMITTEES: {
        const data = {};
        const updated = Date.now().toString();
        action.data.forEach(committee => {
            data[committee.id.toString()] = {
                ...committee
            };
        });
        return {
            ...state,
            updated,
            data
        };
    }

    case SET_COMMITTEE_DATA: {
        const { id } = action.data;
        const data = { ...state.data };
        data[id ] = { ...action.data };
        return {
            ...state,
            data
        };
    }

    case RM_COMMITTEE: {
        const data = { ...state.data };
        const committee_id = action.data;
        delete data[committee_id];
        return { ...state, data };
    }
    default:
        return state;
    }
}

// Action creators

export const loadCommittees = () => (dispatch, getState, { auth }) => {
    return auth.authFetch('/committees')
        .then(response => response.json())
        .then(({ data }) => {
            dispatch({
                type: SET_COMMITTEES,
                data
            });
        });
};

export const updateCommittee = (
    data,
    newCommittee = false
) => (dispatch, getState, { auth }) => {
    let req;
    if (newCommittee) { // create new committee
        delete data['id'];
        req = auth.authFetch('/committees', {
            method: 'POST',
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(({ data }) => data);
    }
    else { // Update existing member
        req = auth.authFetch(`/committees/${data['id']}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        })
            .then(() => {
                return data;
            });
    }

    return req.then(response => {
        dispatch({
            type: SET_COMMITTEE_DATA,
            data: response
        });
        return response;
    });
};

export const deleteCommittee = (
    committee_id
) => (dispatch, getState, { auth }) => {
    return auth.authFetch(`/committees/${committee_id}`, {
        method: 'DELETE'
    })
        .then(() => {
            dispatch({
                type: RM_COMMITTEE,
                data: committee_id
            });
        });
};
