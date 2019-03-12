import React from 'react';
import { connect } from 'react-redux';
// Actions

export const CLEAR_MEMBERS = 'membery/members/clear_members';
export const SET_MEMBERS = 'membery/members/set_members';
export const SET_MEMBER_DATA = 'membery/members/set_member_data';

// Reducer

// The keys will be member IDs
// The values will be member objects from the API.
export const initialState = {
    updated: Date.now().toString(),
    data: {}
};

export default function(state = initialState, action) {
    switch (action.type) {
    case CLEAR_MEMBERS:
        return { ...initialState };
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

    case SET_MEMBER_DATA: {
        const { id } = action.data;
        const data = { ...state.data };
        data[id] = { ...action.data };
        return {
            ...state,
            data
        };
    };

    default:
        return state;
    }
}

// Action creators

export const loadMembers = () => (dispatch, getState, { auth }) => {
    auth.authFetch('/members').
        then(response => response.json()).
        then(({ data }) => {
            dispatch({
                type: SET_MEMBERS,
                data
            });
        }).
        catch(e => {
            console.error('Error', e);
        });
};

export const updateMember = (data) => (dispatch, getState, { auth }) => {
    const { id } = data;
    return auth.authFetch(`/members/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }).
         then(() => {
            dispatch({
                type: SET_MEMBER_DATA,
                data
            });
            return;
        });
};
