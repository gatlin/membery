// Actions

// Reducer

export const initialState = {
    updated: Date.now().toString(),
    roles: {},
    permissions: {}
};

export default function(state = initialState, action) {
    switch (action.type) {
    default:
        return state;
    }
}

// Action creators
