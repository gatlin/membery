import { connect } from 'react-redux';
import * as actions from '../Auth';
import { Home } from '../components/Home';

export default connect(
    (state) => (state),
    dispatch => ({
        login: () => dispatch(actions.login()),
        isAuthenticated: () => dispatch(actions.isAuthenticated())
    })
)(Home);
