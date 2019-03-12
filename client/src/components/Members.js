import React, { Component } from 'react';

export class MembersTableRow extends Component {
    constructor(props) {
        super(props);
        this.state = {
            editing: false,
            editingData: {}
        };
    }

    setEditing = () => {
        const {
            first_name,
            last_name,
            email,
            active,
            notes,
            roles
        } = { ...this.props };
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

    save = () => {
        const { id } = this.props;
        const { first_name, last_name, email,
                notes, active, roles } = this.state.editingData;
        this.props.save({
            id, first_name, last_name, email, notes, active, roles
        }).
            then(() => {
                this.setState({
                    editing: false,
                    editingData: {}
                });
            });
    };

    renderEditing() {
        const { id } = this.props;
        const { first_name, last_name, email,
                active, notes } = this.state.editingData;
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

              <td><button
                    onClick={ () => { this.save(); } }
                  >
                    Save
                  </button></td>
            </tr>
        );
    }

    renderNormal() {
        const {
            id,
            first_name,
            last_name,
            email,
            notes,
            roles
        } = this.props;

        return (
            <tr>
              <td>{ first_name }</td>
              <td>{ last_name }</td>
              <td>{ email } </td>
              <td>{ notes }</td>
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

export const MembersTable = ({
    members,
    updateMember
}) => (
    <div id='members'>
      <table>
        <thead>
          <tr>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Email</th>
            <th>Notes</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          { Object.keys(members).map((pk, i) => (
              <MembersTableRow
                save={ d => { return updateMember(d); } }
                key={`members-table-row-${i}`}
                { ...members[pk] }
              />
          ))}
        </tbody>
      </table>
    </div>
);
