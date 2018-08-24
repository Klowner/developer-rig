import { connect, Dispatch } from 'react-redux';
import { GlobalState } from '../core/models/global-state';
import { getUserSession } from '../core/state/session';
import { ReduxStateProps, RigNavComponent } from './component';
import * as rigActions from '../core/actions/rig';
import { mockApiEnabled } from '../core/state/rig';

function mapStateToProps(state: GlobalState): ReduxStateProps {
  return {
    session: getUserSession(state),
    mockApiEnabled: mockApiEnabled(state),
  };
}

export const RigNav = connect<ReduxStateProps>(mapStateToProps)(RigNavComponent);
