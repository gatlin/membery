import React, { Component } from 'react';

export const TabContext = React.createContext({
    currentTab: 0,
    selectTab: () => {}
});

export class Tabs extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentTab: 0
        };
    }

    selectTab = (currentTab) => {
        this.setState({ currentTab });
    };

    render () {
        return (
            <section className='tab-container'>
              <TabContext.Provider
                value={{
                    currentTab: this.state.currentTab,
                    selectTab: this.selectTab
                }}
                >
                { this.props.children }
              </TabContext.Provider>
            </section>
        );
    }
}

export const TabList = props => (
    <div
      className={'tab-list ' + (props.className || '')}
      id={props.id || ''}
      >
      <TabContext.Consumer>
        { ({ currentTab, selectTab }) => (
            React.Children.map(
                props.children, (child, i) => (
                    React.cloneElement(child, {
                        selected: i === currentTab,
                        selectTab: () => {
                            selectTab(i);
                        }
                    })
                )
            )
        )}
      </TabContext.Consumer>
    </div>
);

export const Tab = props => (
    <div
      className={'tab ' + (props.className || '') +
                 (props.selected ? ' tab-selected' : '')
      }
      id={props.id || ''}
      onClick={ () => props.selectTab() }
      >
      { props.children }
    </div>
);

export const TabContent = props => (
    <section
      id={props.id || ''}
      className={'tab-panels ' + (props.className || '')}
      >
      <div className='tab-panels-inner'>
        <TabContext.Consumer>
          { ({ currentTab }) => (
              React.Children.map(props.children, (child, i) => (
                  React.cloneElement(child, {
                      selected: i === currentTab
                  })
              ))
          )}
        </TabContext.Consumer>
      </div>
    </section>
);

export const TabPanel = ({ selected, children }) => !selected ? null : (
    <span>
      { children }
    </span>
);
