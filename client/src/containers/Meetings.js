import React from 'react';
import { connect } from 'react-redux';
import { MeetingsTable as CT } from '../components/Meetings';
import * as actions from '../services/meetings';

/**
 * Connected components
 */

export const MeetingsTable = connect(
    ({ meetings, committees }) => ({
        meetings: meetings.data,
        committees: committees.data
    }),
    dispatch => ({
        updateMeeting: (d,b) => dispatch(actions.updateMeeting(d,b)),
        deleteMeeting: (d) => dispatch(actions.deleteMeeting(d))
    })
)(CT);


export const MeetingsPage = props => (
    <div id='meetings-page'>
      <MeetingsTable />
    </div>
);
