import * as React from 'react';
import * as classNames from 'classnames';
import { Labels } from '../constants/nav-items';
import { UserDropdown } from '../user-dropdown';
import { LoginButton } from '../login-button';
import { UserSession } from '../core/models/user-session';
import { ExtensionManifest } from '../core/models/manifest';
import './component.sass';
import { MockApiDropdown } from './mock-api-dropdown';

export interface PublicProps {
  viewerHandler: Function,
  selectedView: string,
  error: string,
}

export interface ReduxStateProps {
  session?: UserSession,
  manifest?: ExtensionManifest,
  mockApiEnabled?: boolean,
}

type Props = PublicProps & ReduxStateProps;

export class RigNavComponent extends React.Component<Props> {
  private openProductManagementHandler = (): void => {
    const { session, manifest, viewerHandler } = this.props;
    if ((session && session.login) && (manifest && manifest.bitsEnabled)) {
      viewerHandler(Labels.ProductManagement);
    }
  }

  public render() {
    const { session, manifest, selectedView } = this.props;
    const projectOverviewClass = classNames({
      'offset': true,
      'top-nav-item': true,
      'top-nav-item__selected': selectedView === Labels.ProjectOverview,
    });
    const extensionViewsClass = classNames({
      'offset': true,
      'top-nav-item': true,
      'top-nav-item__selected': selectedView === Labels.ExtensionViews,
    });
    const productManagementClass = classNames({
      'top-nav-item': true,
      'top-nav-item__selected': selectedView === Labels.ProductManagement,
      'top-nav-item__disabled': !(session && session.login) || !(manifest && manifest.bitsEnabled),
    });

    if (this.props.error) {
      return (
        <div className='top-nav-error'>
          <a> {this.props.error} </a>
        </div>
      );
    } else {
      return (
        <div className='top-nav'>
          <div className='personal-bar'>
            <MockApiDropdown />
            {manifest && <div className='personal-bar__ext-name'>
              <span>{manifest.name}</span>
            </div>}
            <div className='top-nav-item__login'>
              {(session && session.login) ? <UserDropdown session={session} /> : <LoginButton />}
            </div>
          </div>
          <div className='top-nav__item-container'>
            <a className={projectOverviewClass} onClick={(event) => this.props.viewerHandler(Labels.ProjectOverview)}>
              Project Overview
            </a>
            <a className={extensionViewsClass} onClick={(event) => this.props.viewerHandler(Labels.ExtensionViews)}>
              Extension Views
            </a>
            <a className={productManagementClass} onClick={(event) => this.openProductManagementHandler()}>
              Manage Bits Products
            </a>
          </div>
        </div>
      );
    }
  }
}
