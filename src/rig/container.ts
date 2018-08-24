import { connect, Dispatch } from 'react-redux';
import { RigComponent, ReduxDispatchProps, ReduxStateProps } from './component';
import * as userActions from '../core/actions/user-session';
import { GlobalState } from '../core/models/global-state';
import { getUserSession } from '../core/state/session';

function mapStateToProps(state: GlobalState): ReduxStateProps {
  return {
    session: getUserSession(state),
  }
}

function mapDispatchToProps(dispatch: Dispatch<GlobalState>): ReduxDispatchProps {
  return {
    userLogin: userSession => dispatch(userActions.userLogin(userSession))
  };
}

export const Rig = connect<ReduxStateProps, ReduxDispatchProps>(mapStateToProps, mapDispatchToProps)(RigComponent);
