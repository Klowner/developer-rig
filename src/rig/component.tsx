import * as React from 'react';
import './component.sass';
import { RigNav } from '../rig-nav';
import { ExtensionViewContainer } from '../extension-view-container';
import { Console } from '../console';
import { ExtensionViewDialog, ExtensionViewDialogState } from '../extension-view-dialog';
import { RigConfigurationsDialog } from '../rig-configurations-dialog';
import { EditViewDialog, EditViewProps } from '../edit-view-dialog';
import { ProductManagementViewContainer } from '../product-management-container';
import { createExtensionObject, convertViews } from '../util/extension';
import { fetchManifest, fetchUserInfo } from '../util/api';
import { NavItem } from '../constants/nav-items'
import { OverlaySizes } from '../constants/overlay-sizes';
import { IdentityOptions } from '../constants/identity-options';
import { MobileSizes } from '../constants/mobile';
import { RigExtensionView } from '../core/models/rig';
import { ExtensionManifest } from '../core/models/manifest';
import { UserSession } from '../core/models/user-session';
import { SignInDialog } from '../sign-in-dialog';
import { ExtensionMode, ExtensionViewType } from '../constants/extension-coordinator';

enum LocalStorageKeys {
  RigExtensionViews = 'extensionViews',
  RigLogin = 'login',
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
  userId: string;
  error: string;
}

type Props = ReduxDispatchProps & ReduxStateProps;

export class RigComponent extends React.Component<Props, State> {
  public state: State = {
    apiHost: process.env.API_HOST || 'api.twitch.tv',
    clientId: process.env.EXT_CLIENT_ID,
    secret: process.env.EXT_SECRET,
    version: process.env.EXT_VERSION,
    channelId: process.env.EXT_CHANNEL_ID,
    ownerName: this.props.session ? this.props.session.login : process.env.EXT_OWNER_NAME,
    extensionViews: [],
    manifest: {} as ExtensionManifest,
    showExtensionsView: false,
    showConfigurations: false,
    showEditView: false,
    idToEdit: '0',
    selectedView: NavItem.ExtensionViews,
    userId: '',
    error: '',
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
    if (this.state.error === '') {
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

  public onConfigurationSuccess = ({ manifest }: { manifest: ExtensionManifest }) => {
    this.props.saveManifest(manifest);
    this.setState({ manifest: manifest });
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

    let mode = ExtensionMode.Viewer;
    if (extensionViewDialogState.extensionViewType === ExtensionMode.Config) {
      mode = ExtensionMode.Config;
    } else if (extensionViewDialogState.extensionViewType === ExtensionMode.Dashboard) {
      mode = ExtensionMode.Dashboard;
    }

    const linked = (
      extensionViewDialogState.identityOption === IdentityOptions.Linked ||
      extensionViewDialogState.extensionViewType === ExtensionMode.Config ||
      extensionViewDialogState.extensionViewType === ExtensionMode.Dashboard
    );

    const nextExtensionViewId = 1 + extensionViews.reduce((reduced: number, current: RigExtensionView) => {
      return Math.max(reduced, parseInt(current.id, 10));
    }, 0);


    extensionViews.push({
      id: nextExtensionViewId.toString(),
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
        this.state.channelId,
        this.state.secret,
        extensionViewDialogState.opaqueId,
      ),
      linked,
      mode,
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
    views.forEach((element: RigExtensionView)=> {
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
    let view: JSX.Element | null = null;
    if (this.state.error) {
      view = <label>Something went wrong: {this.state.error}</label>
    } else if (this.state.selectedView === NavItem.ProductManagement) {
      view = <ProductManagementViewContainer clientId={this.state.clientId} />
    } else {
      view = (
        <div>
          <ExtensionViewContainer
            deleteExtensionViewHandler={this.deleteExtensionView}
            extensionViews={this.state.extensionViews}
            openEditViewHandler={this.openEditViewHandler}
            openExtensionViewHandler={this.openExtensionViewHandler}
          />
          {this.state.showExtensionsView && (
            <ExtensionViewDialog
              extensionViews={convertViews(this.state.manifest.views)}
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
      );
    }

    return (
      <div className="rig-container">
        <RigNav
          selectedView={this.state.selectedView}
          viewerHandler={this.viewerHandler}
          openConfigurationsHandler={this.openConfigurationsHandler}
          openProductManagementHandler={this.openProductManagementHandler}
          error={this.state.error} />
        {view}
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
    if (this.state.ownerName) {
      fetchManifest(
        this.state.apiHost,
        this.state.clientId,
        this.state.ownerName,
        this.state.version,
        this.state.channelId,
        this.state.secret
      )
        .then(this.onConfigurationSuccess)
        .catch(this.onConfigurationError);
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
    const rigLogin = localStorage.getItem(LocalStorageKeys.RigLogin);
    if (windowHash.includes('access_token')) {
      const accessTokenKey = 'access_token=';
      const accessTokenIndex = windowHash.indexOf(accessTokenKey);
      const ampersandIndex = windowHash.indexOf('&');
      const accessToken = windowHash.substring(accessTokenIndex + accessTokenKey.length, ampersandIndex);

      try {
        const response = await fetchUserInfo(accessToken)
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
      } catch(error) {
        this.setState({ error: error });
      }
    } else if (rigLogin) {
      const userSession = JSON.parse(rigLogin) as UserSession;
      this.props.userLogin(userSession);
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
