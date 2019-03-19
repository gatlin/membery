import React from 'react';
import { connect } from 'react-redux';
import { MembersTable as MT } from '../components/Members';
import * as membersActions from '../services/members';

/**
 * Connected components
 */

export const MembersTable = connect(
    ({ members, roles_perms: { roles } }) => ({
        members: members.data,
        roles
    }),
    dispatch => ({
        updateMember: (d,b) => dispatch(membersActions.updateMember(d,b)),
        deleteMember: (d) => dispatch(membersActions.deleteMember(d))
    })
)(MT);


export const MembersPage = props => (
    <div id='members-page'>
      <MembersTable />
    </div>
);
