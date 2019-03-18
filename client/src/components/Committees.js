import React, { Component } from 'react';

import './AdminTable.css';

/**
 * A row in the committees table that supports inline editing.
 *
 * props:
 * - committee : object = the committee record in question
 * - newCommittee : boolean = whether this represents a new committee (and thus
 *      wouldn't have an ID yet)
 * - save : fn = a function to send the updated committee data to
 */
export class CommitteesTableRow extends Component {
    constructor(props) {
        super(props);
        this.state = {
            editing: props.newCommittee || false,
            editingData: {} // copy of data while editing
        };
    }

    // Puts the component in editing mode.
    setEditing = () => {
        const {
            name
        } = { ...this.props.committee };
        this.setState({
            editing: true,
            editingData: {
                name
            }
        });
    };

    // Saves data and takes us back to non-editing mode on success.
    save = () => {
        const id = this.props.committee.id ? this.props.committee.id : null;
        const { name } = this.state.editingData;
        this.props.save({
            id, name
        }, this.props.newCommittee)
            .then(() => {
                this.setState({
                    editing: false,
                    editingData: {}
                });
            });
    };

    renderEditing() {
        const { id } = this.props.committee;
        const { name } = this.state.editingData;
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
                <button
                  onClick={ () => { this.save(); } }
                >
                  Save
                </button>
                { !this.props.newCommittee && (
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
            name
        } = this.props.committee;

        return (
            <tr>
              <td>{ name }</td>
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
 * A simple table of committees that permits inline editing.
 */
export class CommitteesTable extends Component {

    constructor(props) {
        super(props);
        this.state = {
            creatingNewCommittee: props.creatingNewCommittee || false
        };
    }

    createNewCommittee = (creatingNewCommittee) => {
        this.setState({
            creatingNewCommittee
        });
    };

    renderNewCommitteeRow = () => {
        return (
            <CommitteesTableRow
              save = { (d,b) => {
                  if (b) {
                      this.createNewCommittee(false);
                  }
                  return this.props.updateCommittee(d,b);
              }}
              key={'committees-table-row-new'}
              newCommittee
              committee={{
                  name: ''
              }}
            />
        );
    };

    render () {
        const {
            committees,
            updateCommittee,
            deleteCommittee
        } = this.props;
        return (
            <div id='committees'>
              <table className='admin-table'>
                <caption>Committees</caption>
                <thead>
                  <tr>
                    <th>
                      <button
                        onClick={() => {
                            this.createNewCommittee(!this.state.creatingNewCommittee);
                        }}>
                        { this.state.creatingNewCommittee ? 'Cancel' : 'New Committee' }
                      </button>
                    </th>
                  </tr>
                  <tr>
                    <th>Name</th>
                  </tr>
                </thead>
                <tbody>
                  { this.state.creatingNewCommittee && this.renderNewCommitteeRow() }
                  { Object.keys(committees).map((pk, i) => (
                      <CommitteesTableRow
                        save={ (d,b) => { return updateCommittee(d,b); } }
                        del={ (d) => { return deleteCommittee(d); } }
                        key={`committees-table-row-${i}`}
                        committee={ { ...committees[pk] } }
                      />
                  ))}
                </tbody>
              </table>
            </div>
        );
    }
}
