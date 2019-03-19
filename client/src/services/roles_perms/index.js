// Actions
export const SET_ROLES = 'membery/roles_perms/set_roles';
export const RM_ROLE = 'membery/roles_perms/rm_role';
export const RM_PERM = 'membery/roles_perms/rm_perm';
export const SET_PERMS = 'membery/roles_perms/set_perms';
export const SET_ROLE_DATA = 'membery/roles_perms/set_role_data';
export const SET_PERM_DATA = 'membery/roles_perms/set_perm_data';

// Reducer

export const initialState = {
    updated: Date.now().toString(),
    roles: {},
    permissions: {}
};

export default function(state = initialState, action) {
    switch (action.type) {
    case SET_ROLES: {
        const roles = {};
        const updated = Date.now().toString();
        action.data.forEach(role => {
            roles[role.id.toString()] = {
                ...role
            };
        });
        return {
            ...state,
            updated,
            roles
        };
    }

    case SET_ROLE_DATA: {
        const { id } = action.data;
        const roles = { ...state.roles };
        roles[id] = { ...action.data };
        return { ...state, roles };
    }

    case RM_ROLE: {
        const roles = { ...state.roles };
        const role_id = action.data;
        delete roles[role_id];
        return { ...state, roles };
    }

    case SET_PERMS: {
        const perms = {};
        const updated = Date.now().toString();
        action.data.forEach(perm => {
            perms[perm.name] = {
                ...perm
            };
        });
        return {
            ...state,
            updated,
            perms
        };
    }

    case SET_PERM_DATA: {
        const { name } = action.data;
        const perms = { ...state.perms };
        perms[name] = { ...action.data };
        return { ...state, perms };
    }

    case RM_PERM: {
        const perms = { ...state.perms };
        const perm = action.data;
        delete perms[perm];
        return { ...state, perms };
    }

    default:
        return state;
    }
}

// Action creators
export const loadRoles = () => (dispatch, getState, { auth }) => {
    return auth.authFetch('/roles')
        .then(response => response.json())
        .then(({ data }) => {
            dispatch({
                type: SET_ROLES,
                data
            });
        });
};

export const updateRole = (
    data,
    newRole = false
) => (dispatch, getState, { auth }) => {
    let req;
    const body = JSON.stringify(data);
    if (newRole) {
        delete data['id'];
        req = auth.authFetch('/roles', {
            method: 'POST',
            body
        })
            .then(response => response.json())
            .then(({ data }) => data);
    }
    else {
        req = auth.authFetch(`/roles/${data['id']}`, {
            method: 'PUT',
            body
        })
            .then(() => {
                return data;
            });
    }

    return req.then(response => {
        dispatch({
            type: SET_ROLE_DATA,
            data: response
        });
        return response;
    });
};

export const deleteRole = (role_id) => (dispatch, getState, { auth }) => {
    return auth.authFetch(`/roles/${role_id}`, {
        method: 'DELETE'
    })
        .then(() => {
            dispatch({
                type: RM_ROLE,
                data: role_id
            });
        });
};

export const createPerm = (name) => (dispatch, getState, { auth }) => {
    const body = JSON.stringify({ name });
    return auth.authFetch('/permissions', {
        method: 'POST',
        body
    })
        .then(response => response.json())
        .then(() => {
            dispatch({
                type: SET_PERM_DATA,
                data: { name }
            });
        });
};

export const loadPerms = () => (dispatch, getState, { auth }) => {
    return auth.authFetch('/permissions')
        .then(response => response.json())
        .then(({ data }) => {
            dispatch({
                type: SET_PERMS,
                data
            });
        });
};

export const deletePerm = (name) => (dispatch, getState, { auth }) => {
    return auth.authFetch(`/permissions/${name}`, {
        method: 'DELETE'
    })
        .then(() => {
            dispatch({
                type: RM_PERM,
                data: name
            });
        });
};
