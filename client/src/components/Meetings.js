import React, { Component } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import './AdminTable.css';

function formatDate(date) {
    return `${date.toDateString()} ${date.toTimeString()}`;
}

/**
 * A row in the meetings table that supports inline editing.
 *
 * props:
 * - meeting : object = the meeting record in question
 * - newMeeting : boolean = whether this represents a new meeting (and thus
 *      wouldn't have an ID yet)
 * - save : fn = a function to send the updated meeting data to
 * - del : fn = a function to call to delete the meeting
 */
export class MeetingsTableRow extends Component {
    constructor(props) {
        super(props);
        this.state = {
            editing: props.newMeeting || false,
            editingData: {} // copy of data while editing
        };
    }

    // Puts the component in editing mode.
    setEditing = () => {
        const {
            name,
            committee,
            start_time,
            end_time
        } = { ...this.props.meeting };
        this.setState({
            editing: true,
            editingData: {
                name,
                committee,
                start_time,
                end_time
            }
        });
    };

    // Saves data and takes us back to non-editing mode on success.
    save = () => {
        const id = this.props.meeting.id ? this.props.meeting.id : null;
        const {
            name,
            committee,
            start_time,
            end_time
        } = this.state.editingData;

        if (!name || !committee || !start_time || !end_time) {
            console.log('not yet, captain');
            return;
        }
        console.log('editingData', this.state.editingData);
        this.props.save({
            id, name, committee, start_time, end_time
        }, this.props.newMeeting)
            .then(() => {
                this.setState({
                    editing: false,
                    editingData: {}
                });
            });
    };

    renderEditing() {
        const { id } = this.props.meeting;
        const { committees } = this.props;
        const { name, committee, start_time, end_time } =
              this.state.editingData;

        const start_time_d = start_time ? new Date(start_time) : new Date();
        const end_time_d = end_time ? new Date(end_time) : new Date();

        return (
            <tr>
              <td><input
                    type='text'
                    value={name}
                    onChange={ evt => {
                        this.setState({
                            editingData: {
                                ...this.state.editingData,
                                name: evt.target.value
                            }
                        });
                    }}
                  >
                  </input></td>
              <td>
                <select
                  value={committee}
                  onChange={ evt => {
                      this.setState({
                          editingData: {
                              ...this.state.editingData,
                              committee: evt.target.value
                          }
                      });
                  }}
                > <option value=''>---</option>
                  {
                      Object.keys(committees).map(c_id => {
                          const { id, name } = committees[c_id.toString()];
                          return (
                              <option
                                key={`meetings-committee-option-${id}`}
                                value={id.toString()}>{name}</option>
                          );
                      })
                  }
                </select>
              </td>
              <td>
                <DatePicker
                  selected={start_time_d}
                  dateFormat='MMMM d, yyyy h:mm aa'
                  timeFormat='HH:mm'
                  showTimeSelect
                  onChange={ d => {
                      this.setState({
                          editingData: {
                              ...this.state.editingData,
                              start_time: d.toISOString()
                          }
                      });
                  }}
                />
              </td>
              <td>
                <DatePicker
                  selected={end_time_d}
                  dateFormat='MMMM d, yyyy h:mm aa'
                  timeFormat='HH:mm'
                  showTimeSelect
                  onChange={ d => {
                      this.setState({
                          editingData: {
                              ...this.state.editingData,
                              end_time: d.toISOString()
                          }
                      });
                  }}
                />
              </td>
              <td>
                <button
                  onClick={ () => { this.save(); } }
                >
                  Save
                </button>
                { !this.props.newMeeting && (
                    <button
                      onClick={() => {this.props.del(id);}}
                    >
                      Delete
                    </button>
                )}
              </td>
            </tr>
        );
    }

    renderNormal() {
        const {
            name,
            committee,
            start_time,
            end_time
        } = this.props.meeting;
        const { committees } = this.props;
        const committeeName = committee.toString() in committees
              ? committees[committee.toString()].name
              : 'Unknown';

        return (
            <tr>
              <td>{ name }</td>
              <td>{ committeeName }</td>
              <td>{ formatDate(new Date(start_time)) }</td>
              <td>{ formatDate(new Date(end_time)) }</td>
              <td>
                <button
                  onClick={() => { this.setEditing(); }}
                >
                  Edit
                </button>
              </td>
            </tr>
        );
    }

    render() {
        if (!this.props.committees) {
            return null;
        }
        if (this.state.editing) {
            return this.renderEditing();
        }
        else {
            return this.renderNormal();
        }
    }
}

/**
 * A simple table of meetings that permits inline editing.
 */
export class MeetingsTable extends Component {

    constructor(props) {
        super(props);
        this.state = {
            creatingNewMeeting: props.creatingNewMeeting || false
        };
    }

    createNewMeeting = (creatingNewMeeting) => {
        this.setState({
            creatingNewMeeting
        });
    };

    renderNewMeetingRow = () => {
        const cs = this.props.committees;
        if (!cs) {
            return null;
        }

        return (
            <MeetingsTableRow
              save = { (d,b) => {
                  if (b) {
                      this.createNewMeeting(false);
                  }
                  return this.props.updateMeeting(d,b);
              }}
              key={'meetings-table-row-new'}
              newMeeting
              committees={this.props.committees}
              meeting={{
                  name: '',
                  committee: '0',
                  start_time: (new Date()).toISOString(),
                  end_time: (new Date()).toISOString()
              }}
            />
        );
    };

    render () {
        const {
            meetings,
            committees,
            updateMeeting,
            deleteMeeting
        } = this.props;
        return (
            <div id='meetings'>
              <table className='admin-table'>
                <caption>Meetings</caption>
                <thead>
                  <tr>
                    <th>
                      <button
                        onClick={() => {
                            this.createNewMeeting(!this.state.creatingNewMeeting);
                        }}>
                        { this.state.creatingNewMeeting ? 'Cancel' : 'New Meeting' }
                      </button>
                    </th>
                  </tr>
                  <tr>
                    <th>Name</th>
                    <th>Committee</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                  </tr>
                </thead>
                <tbody>
                  { this.state.creatingNewMeeting && this.renderNewMeetingRow() }
                  { Object.keys(meetings).map((pk, i) => (
                      <MeetingsTableRow
                        save={ (d,b) => { return updateMeeting(d,b); } }
                        del={ (d) => { return deleteMeeting(d); } }
                        key={`meetings-table-row-${i}`}
                        meeting={ { ...meetings[pk] } }
                        committees={committees}
                      />
                  ))}
                </tbody>
              </table>
            </div>
        );
    }
}
