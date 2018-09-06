import * as React from 'react';
import './component.sass';
import { RigNav } from '../rig-nav';
import { ExtensionViewContainer } from '../extension-view-container';
import { Console } from '../console';
import { ExtensionViewDialog, ExtensionViewDialogState } from '../extension-view-dialog';
import { RigConfigurationsDialog } from '../rig-configurations-dialog';
import { EditViewDialog, EditViewProps } from '../edit-view-dialog';
import { ProductManagementViewContainer } from '../product-management-container';
import { createExtensionObject } from '../util/extension';
import { fetchExtensionManifest, fetchUserByName, fetchUserInfo } from '../util/api';
import { NavItem } from '../constants/nav-items'
import { OverlaySizes } from '../constants/overlay-sizes';
import { IdentityOptions } from '../constants/identity-options';
import { MobileSizes } from '../constants/mobile';
import { RigExtensionView } from '../core/models/rig';
import { ExtensionManifest } from '../core/models/manifest';
import { UserSession } from '../core/models/user-session';
import { SignInDialog } from '../sign-in-dialog';
import { ExtensionMode, ExtensionViewType } from '../constants/extension-coordinator';
import { missingConfigurations } from '../util/errors';
import { TokenSpec, createSignedToken } from '../util/token';
import { RigRole } from '../constants/rig';

enum LocalStorageKeys {
  RigExtensionViews = 'extensionViews',
  RigLogin = 'rigLogin',
}

export interface ReduxStateProps {
  session: UserSession;
}

export interface ReduxDispatchProps {
  saveManifest: (manifest: ExtensionManifest) => void;
  userLogin: (userSession: UserSession) => void;
}

interface State {
  apiHost: string;
  clientId: string;
  secret: string;
  version: string;
  channelId: string;
  extensionViews: RigExtensionView[],
  manifest: ExtensionManifest;
  ownerName: string;
  showExtensionsView: boolean;
  showConfigurations: boolean;
  showEditView: boolean;
  idToEdit: string;
  selectedView: NavItem;
  userId?: string;
  error?: string;
}

type Props = ReduxDispatchProps & ReduxStateProps;

export class RigComponent extends React.Component<Props, State> {
  public state: State = {
    apiHost: process.env.API_HOST || 'api.twitch.tv',
    clientId: process.env.EXT_CLIENT_ID,
    secret: process.env.EXT_SECRET,
    version: process.env.EXT_VERSION,
    channelId: process.env.EXT_CHANNEL_ID || '999999999',
    ownerName: this.props.session ? this.props.session.login : process.env.EXT_OWNER_NAME,
    extensionViews: [],
    manifest: {} as ExtensionManifest,
    showExtensionsView: false,
    showConfigurations: false,
    showEditView: false,
    idToEdit: '0',
    selectedView: NavItem.ExtensionViews,
  }

  constructor(props: Props) {
    super(props);
    this.setLogin();
  }

  public componentDidMount() {
    this.initLocalStorage();
    this.fetchInitialConfiguration();
  }

  public openConfigurationsHandler = () => {
    this.setState({
      showConfigurations: true,
    });
  }

  public closeConfigurationsHandler = () => {
    this.setState({
      showConfigurations: false,
    });
  }

  public openEditViewHandler = (id: string) => {
    this.setState({
      showEditView: true,
      idToEdit: id,
    });
  }

  public closeEditViewHandler = () => {
    this.setState({
      showEditView: false,
      idToEdit: '0',
    });
  }

  public viewerHandler = () => {
    this.setState({ selectedView: NavItem.ExtensionViews });
  }

  private openProductManagementHandler = () => {
    this.setState({ selectedView: NavItem.ProductManagement });
  }

  public openExtensionViewHandler = () => {
    if (!this.state.error) {
      this.setState({
        showExtensionsView: true,
      });
    }
  }

  public closeExtensionViewDialog = () => {
    this.setState({
      showExtensionsView: false
    });
  }

  public onConfigurationSuccess = (manifest: ExtensionManifest) => {
    this.props.saveManifest(manifest);
    this.setState({ manifest });
  }

  public onConfigurationError = (error: Error) => {
    this.setState({ error: error.message });
  }

  public getFrameSizeFromDialog(extensionViewDialogState: ExtensionViewDialogState) {
    if (extensionViewDialogState.frameSize === 'Custom') {
      return {
        width: extensionViewDialogState.width,
        height: extensionViewDialogState.height
      };
    }
    if (extensionViewDialogState.extensionViewType === ExtensionViewType.Mobile) {
      return MobileSizes[extensionViewDialogState.frameSize];
    }

    return OverlaySizes[extensionViewDialogState.frameSize];
  }

  public createExtensionView = (extensionViewDialogState: ExtensionViewDialogState) => {
    const extensionViews = this.getStoredRigExtensionViews();
    const mode = extensionViewDialogState.extensionViewType === ExtensionMode.Config ? ExtensionMode.Config :
      extensionViewDialogState.extensionViewType === ExtensionMode.Dashboard ? ExtensionMode.Dashboard : ExtensionMode.Viewer;
    const linked = extensionViewDialogState.identityOption === IdentityOptions.Linked ||
      extensionViewDialogState.extensionViewType === ExtensionMode.Config ||
      extensionViewDialogState.extensionViewType === ExtensionMode.Dashboard;
    const nextExtensionViewId = 1 + extensionViews.reduce((reduced: number, view: RigExtensionView) => {
      return Math.max(reduced, parseInt(view.id, 10));
    }, 0);
    extensionViews.push({
      id: nextExtensionViewId.toString(),
      channelId: extensionViewDialogState.channelId,
      type: extensionViewDialogState.extensionViewType,
      features: {
        isChatEnabled: extensionViewDialogState.isChatEnabled,
      },
      extension: createExtensionObject(
        this.state.manifest,
        nextExtensionViewId.toString(),
        extensionViewDialogState.viewerType,
        linked,
        this.state.ownerName,
        extensionViewDialogState.channelId,
        this.state.secret,
        extensionViewDialogState.opaqueId,
      ),
      linked,
      mode,
      isPopout: extensionViewDialogState.isPopout,
      role: extensionViewDialogState.viewerType,
      x: extensionViewDialogState.x,
      y: extensionViewDialogState.y,
      orientation: extensionViewDialogState.orientation,
      frameSize: this.getFrameSizeFromDialog(extensionViewDialogState),
    });
    this.pushExtensionViews(extensionViews);
    this.closeExtensionViewDialog();
  }

  public deleteExtensionView = (id: string) => {
    this.pushExtensionViews(this.state.extensionViews.filter(element => element.id !== id));
  }

  public editViewHandler = (newViewState: EditViewProps) => {
    const views = this.getStoredRigExtensionViews();
    views.forEach((element: RigExtensionView) => {
      if (element.id === this.state.idToEdit) {
        element.x = newViewState.x;
        element.y = newViewState.y;
        element.orientation = newViewState.orientation;
      }
    });
    this.pushExtensionViews(views);
    this.closeEditViewHandler();
  }

  public render() {
    return (
      <div className="rig-container">
        <RigNav
          selectedView={this.state.selectedView}
          viewerHandler={this.viewerHandler}
          openConfigurationsHandler={this.openConfigurationsHandler}
          openProductManagementHandler={this.openProductManagementHandler}
          error={this.state.error} />
        {this.state.error ? (
          <label>Something went wrong: {this.state.error}</label>
        ) : this.state.selectedView === NavItem.ProductManagement ? (
          <ProductManagementViewContainer clientId={this.state.clientId} />
        ) : (
              <div>
                <ExtensionViewContainer
                  deleteExtensionViewHandler={this.deleteExtensionView}
                  extensionViews={this.state.extensionViews}
                  openEditViewHandler={this.openEditViewHandler}
                  openExtensionViewHandler={this.openExtensionViewHandler}
                />
                {this.state.showExtensionsView && (
                  <ExtensionViewDialog
                    channelId={this.state.channelId}
                    extensionViews={this.state.manifest.views}
                    show={this.state.showExtensionsView}
                    closeHandler={this.closeExtensionViewDialog}
                    saveHandler={this.createExtensionView}
                  />
                )}
                {this.state.showEditView && (
                  <EditViewDialog
                    idToEdit={this.state.idToEdit}
                    show={this.state.showEditView}
                    views={this.getStoredRigExtensionViews()}
                    closeHandler={this.closeEditViewHandler}
                    saveViewHandler={this.editViewHandler}
                  />
                )}
                {this.state.showConfigurations && (
                  <RigConfigurationsDialog
                    config={this.state.manifest}
                    closeConfigurationsHandler={this.closeConfigurationsHandler}
                    refreshConfigurationsHandler={this.fetchInitialConfiguration}
                  />
                )}
                {!this.props.session && <SignInDialog />}
                <Console />
              </div>
            )}
      </div>
    );
  }

  public pushExtensionViews(newViews: RigExtensionView[]) {
    this.storeExtensionViews(newViews);
    this.setState({
      extensionViews: newViews,
    });
  }

  private fetchInitialConfiguration = () => {
    if (this.state.clientId && this.state.version && this.state.secret) {
      fetchUserByName(this.state.clientId, this.state.ownerName).then((user) => {
        const userId = user.id;
        this.setState({ userId });
        const tokenSpec: TokenSpec = {
          role: RigRole,
          secret: this.state.secret,
          userId,
        };
        const token = createSignedToken(tokenSpec);
        return fetchExtensionManifest(this.state.clientId, this.state.version, token);
      })
        .then(this.onConfigurationSuccess)
        .catch(this.onConfigurationError);
    } else {
      this.onConfigurationError(new Error(missingConfigurations({
        EXT_CLIENT_ID: this.state.clientId,
        EXT_SECRET: this.state.secret,
        EXT_VERSION: this.state.version,
      })));
    }
  }

  private initLocalStorage() {
    const extensionViews = this.getStoredRigExtensionViews();
    if (extensionViews.length) {
      const remapped = extensionViews.map((view, index) => ({
        ...view,
        id: (index + 1).toString(),
      }));

      this.setState({ extensionViews: remapped });
    } else {
      this.storeExtensionViews([]);
    }
  }

  private async setLogin() {
    const windowHash = window.location.hash;
    if (windowHash.includes('access_token')) {
      const accessTokenKey = 'access_token=';
      const accessTokenIndex = windowHash.indexOf(accessTokenKey);
      const ampersandIndex = windowHash.indexOf('&');
      const accessToken = windowHash.substring(accessTokenIndex + accessTokenKey.length, ampersandIndex);

      try {
        const response = await fetchUserInfo(accessToken);
        const userSession = {
          authToken: accessToken,
          displayName: response.display_name,
          id: response.id,
          login: response.login,
          profileImageUrl: response.profile_image_url,
        };

        this.props.userLogin(userSession);
        localStorage.setItem(LocalStorageKeys.RigLogin, JSON.stringify(userSession));
        window.location.assign('/');
      } catch (error) {
        this.setState({ error });
      }
    } else {
      const rigLogin = localStorage.getItem(LocalStorageKeys.RigLogin);
      if (rigLogin) {
        try {
          const userSession = JSON.parse(rigLogin) as UserSession;
          if (userSession && userSession.authToken && userSession.id && userSession.login && userSession.profileImageUrl) {
            this.props.userLogin(userSession);
          } else {
            localStorage.removeItem(LocalStorageKeys.RigLogin);
          }
        } catch (ex) {
          localStorage.removeItem(LocalStorageKeys.RigLogin);
        }
      }
    }
  }

  private getStoredRigExtensionViews(): RigExtensionView[] {
    const stored = localStorage.getItem(LocalStorageKeys.RigExtensionViews);
    if (stored) {
      return JSON.parse(stored) as RigExtensionView[];
    }

    return [];
  }

  private storeExtensionViews(rigExtensionViews: RigExtensionView[]) {
    localStorage.setItem(LocalStorageKeys.RigExtensionViews, JSON.stringify(rigExtensionViews));
  }
}
