import React from 'react';
import { connect } from 'react-redux';
import { MembersTable as MT } from '../components/Members';
import * as membersActions from '../members';

export const MembersTable = connect(
    ({ members }) => ({ members: members.data }),
    dispatch => ({
        updateMember: d => { return dispatch(membersActions.updateMember(d));}
    })
)(MT);


export const MembersPage = props => (
    <div id='members-page'>
      <MembersTable />
    </div>
);
