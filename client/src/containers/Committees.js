import React from 'react';
import { connect } from 'react-redux';
import { CommitteesTable as CT } from '../components/Committees';
import * as actions from '../services/committees';

/**
 * Connected components
 */

export const CommitteesTable = connect(
    ({ committees }) => ({ committees: committees.data }),
    dispatch => ({
        updateCommittee: (d,b) => dispatch(actions.updateCommittee(d,b)),
        deleteCommittee: (d) => dispatch(actions.deleteCommittee(d))
    })
)(CT);


export const CommitteesPage = props => (
    <div id='committees-page'>
      <CommitteesTable />
    </div>
);
