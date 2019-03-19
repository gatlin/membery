import React, { Component } from 'react';
import Select from 'react-select';

import './AdminTable.css';

// Converts a role object into the form we want for `react-select`
function make_role_option({ id, name }) {
    return ({
        value: id,
        label: name
    });
}

/**
 * A row in the members table that supports inline editing.
 *
 * props:
 * - member : object = the member record in question
 * - newMember : boolean = whether this represents a new member (and thus
 *      wouldn't have an ID yet)
 * - save : fn = a function to send the updated member data to
 */
export class MembersTableRow extends Component {
    constructor(props) {
        super(props);
        this.state = {
            editing: props.newMember || false,
            editingData: {} // copy of member data while editing
        };
    }

    // Puts the component in editing mode.
    setEditing = () => {
        const {
            first_name,
            last_name,
            email,
            active,
            notes,
            roles
        } = { ...this.props.member };
        this.setState({
            editing: true,
            editingData: {
                first_name,
                last_name,
                email,
                notes,
                active,
                roles
            }
        });
    };

    // Saves member data and takes us back to non-editing mode on success.
    save = () => {
        const id = this.props.member.id ? this.props.member.id : null;
        const { first_name, last_name, email,
                notes, active, roles } = this.state.editingData;


        this.props.save({
            id, first_name, last_name, email, notes, active, roles
        }, this.props.newMember)
            .then(() => {
                this.setState({
                    editing: false,
                    editingData: {}
                });
            });
    };

    renderEditing() {
        const { id } = this.props.member;
        const { first_name, last_name, email,
                /* active, */ notes, roles } = this.state.editingData;

        const roles_options = this.props.roles
              ? Object.keys(this.props.roles)
              .map(role_id => this.props.roles[role_id])
              .map(make_role_option)
              : [];

        return (
            <tr>
              <td><input
                    type='text'
                    value={first_name}
                    onChange={ evt => {
                        this.setState({
                            editingData: {
                                ...this.state.editingData,
                                first_name: evt.target.value
                            }
                        });
                    }}
                  >
                  </input></td>
              <td><input
                    type='text'
                    value={last_name}
                    onChange={ evt => {
                        this.setState({
                            editingData: {
                                ...this.state.editingData,
                                last_name: evt.target.value
                            }
                        });
                    }}>
                  </input></td>
              <td><input
                    type='text'
                    value={email || ''}
                    onChange={ evt => {
                        this.setState({
                            editingData: {
                                ...this.state.editingData,
                                email: evt.target.value
                            }
                        });
                    }}>
                  </input></td>
              <td><input
                    type='text'
                    value={notes}
                    onChange={ evt => {
                        this.setState({
                            editingData: {
                                ...this.state.editingData,
                                notes: evt.target.value
                            }
                        });
                    }}>
                  </input></td>
              <td>
                <Select
                  isMulti
                  value={(roles ? roles : []).map(role_id => {
                      const role = this.props.roles[role_id.toString()];
                      return make_role_option(role);
                  })}
                  options={roles_options}
                  onChange={ selected_roles => {
                      const member_roles = selected_roles.map(({ value }) =>
                                                              value);
                      this.setState({
                          editingData: {
                              ...this.state.editingData,
                              roles: member_roles
                          }
                      });
                  }}
                >
                </Select>
              </td>

              <td>
                <button
                  onClick={ () => { this.save(); } }
                >
                  Save
                </button>
                { !this.props.newMember && (
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
            first_name,
            last_name,
            email,
            notes,
            roles
        } = this.props.member;

        if (!this.props.roles) { return null; }

        const roles_names = this.props.roles && roles
              ? (roles.map(id => {
                  if (this.props.roles[id.toString()]) {
                      return this.props.roles[id.toString()].name;
                  }
                  return '';
              }).join(','))
              : '';

        return (
            <tr>
              <td>{ first_name }</td>
              <td>{ last_name }</td>
              <td>{ email } </td>
              <td>{ notes }</td>
              <td>{ roles_names }</td>
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
        if (this.state.editing) {
            return this.renderEditing();
        }
        else {
            return this.renderNormal();
        }
    }
}

/**
 * A simple table of members that permits inline editing.
 */
export class MembersTable extends Component {

    constructor(props) {
        super(props);
        this.state = {
            creatingNewMember: props.creatingNewMember || false
        };
    }

    createNewMember = (creatingNewMember) => {
        this.setState({
            creatingNewMember
        });
    };

    renderNewMemberRow = () => {
        return (
            <MembersTableRow
              save = { (d,b) => {
                  if (b) {
                      this.createNewMember(false);
                  }
                  return this.props.updateMember(d,b);
              }}
              key={'members-table-row-new'}
              newMember
              member={{
                  first_name: '',
                  last_name: '',
                  email: '',
                  notes: '',
                  active: true
              }}
            />
        );
    };

    render () {
        const {
            members,
            updateMember,
            deleteMember,
            roles,
            perms
        } = this.props;
        return (
            <div id='members'>
              <table className='admin-table'>
                <caption>Members</caption>
                <thead>
                  <tr>
                    <th>
                      <button
                        onClick={() => {
                            this.createNewMember(!this.state.creatingNewMember);
                        }}>
                        { this.state.creatingNewMember ? 'Cancel' : 'New Member' }
                      </button>
                    </th>
                  </tr>
                  <tr>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Email</th>
                    <th>Notes</th>
                    <th>Roles</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  { this.state.creatingNewMember && this.renderNewMemberRow() }
                  { Object.keys(members).map((pk, i) => (
                      <MembersTableRow
                        save={ (d,b) => { return updateMember(d,b); } }
                        del={ (d) => { return deleteMember(d); } }
                        key={`members-table-row-${i}`}
                        member={ { ...members[pk] } }
                        roles={roles}
                      />
                  ))}
                </tbody>
              </table>
            </div>
        );
    }
}
