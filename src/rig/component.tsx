import * as React from 'react';
import './component.sass';
import { RigNav } from '../rig-nav';
import { ExtensionViewContainer } from '../extension-view-container';
import { Console } from '../console';
import { ExtensionViewDialog, ExtensionViewDialogState } from '../extension-view-dialog';
import { EditViewDialog, EditViewProps } from '../edit-view-dialog';
import { ProductManagementViewContainer } from '../product-management-container';
import { fetchUserInfo } from '../util/api';
import { Labels } from '../constants/nav-items'
import { OverlaySizes } from '../constants/overlay-sizes';
import { IdentityOptions } from '../constants/identity-options';
import { MobileSizes } from '../constants/mobile';
import { RigProject, RigExtensionView, RigExtensionSpec, RigExtension, createRigExtension } from '../core/models/rig';
import { ExtensionManifest } from '../core/models/manifest';
import { UserSession } from '../core/models/user-session';
import { SignInDialog } from '../sign-in-dialog';
import { ExtensionMode, ExtensionViewType } from '../constants/extension-coordinator';
import { ProjectView } from '../project-view/component';
import { CreateProjectDialog } from '../create-project-dialog';

export interface ReduxStateProps {
  session: UserSession;
}

export interface ReduxDispatchProps {
  userLogin: (userSession: UserSession) => void;
}

interface State {
  ownerName: string;
  projects: RigProject[],
  currentProject?: RigProject,
  extensionViews: RigExtensionView[],
  manifest: ExtensionManifest;
  showExtensionsView: boolean;
  showEditView: boolean;
  idToEdit: string;
  selectedView: string;
  error?: string;
}

type Props = ReduxDispatchProps & ReduxStateProps;

const defaultChannelId = `RIG${process.env.EXT_OWNER_NAME}`;

export class RigComponent extends React.Component<Props, State> {
  public state: State = {
    ownerName: process.env.EXT_OWNER_NAME,
    projects: [],
    extensionViews: [],
    manifest: {} as ExtensionManifest,
    showExtensionsView: false,
    showEditView: false,
    idToEdit: '0',
    selectedView: Labels.ExtensionViews,
  }

  constructor(props: Props) {
    super(props);
    this.setLogin();
  }

  public componentDidMount() {
    this.loadProjects();
    this.loadExtensionViews();
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

  public viewerHandler = (selectedView: string) => {
    this.setState({ selectedView });
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
    const extensionViews = this.getExtensionViews();
    const mode = extensionViewDialogState.extensionViewType === ExtensionMode.Config ? ExtensionMode.Config :
      extensionViewDialogState.extensionViewType === ExtensionMode.Dashboard ? ExtensionMode.Dashboard : ExtensionMode.Viewer;
    const linked = extensionViewDialogState.identityOption === IdentityOptions.Linked ||
      extensionViewDialogState.extensionViewType === ExtensionMode.Config ||
      extensionViewDialogState.extensionViewType === ExtensionMode.Dashboard;
    const nextExtensionViewId = extensionViews.reduce((a: number, b: RigExtensionView) => Math.max(a, parseInt(b.id, 10)), 0) + 1;
    const rigExtensionSpec: RigExtensionSpec = {
      manifest: this.state.currentProject.manifest,
      index: nextExtensionViewId.toString(),
      role: extensionViewDialogState.viewerType,
      isLinked: linked,
      ownerName: this.state.ownerName,
      channelId: extensionViewDialogState.channelId,
      secret: this.state.currentProject.secret,
      opaqueId: extensionViewDialogState.opaqueId,
    };
    extensionViews.push({
      id: nextExtensionViewId.toString(),
      type: extensionViewDialogState.extensionViewType,
      extension: createRigExtension(rigExtensionSpec),
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
    const views = this.getExtensionViews();
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

  private updateProject = (project: RigProject) => {
    this.setState((previousState: State) => {
      if (previousState.currentProject) {
        const currentProject = Object.assign(previousState.currentProject, project);
        const projects = previousState.projects;
        localStorage.setItem('projects', JSON.stringify(projects));
        return { currentProject, projects };
      } else {
        const projects = [project];
        localStorage.setItem('projects', JSON.stringify(projects));
        localStorage.setItem('currentProjectIndex', '0');
        return { currentProject: project, projects };
      }
    });
  }

  public render() {
    const currentProject = this.state.currentProject || { isLocal: true} as RigProject;
    const view = this.state.selectedView === Labels.ProductManagement ? (
      <ProductManagementViewContainer clientId={currentProject.clientId} />
    ) : this.state.selectedView === Labels.ProjectOverview ? (
        <div>
          {currentProject && <ProjectView
            isLocal={currentProject.isLocal}
            name={currentProject.name}
            projectFolderRoot={currentProject.projectFolderRoot}
            backend={currentProject.backend}
            manifest={currentProject.manifest}
            ownerName={currentProject.ownerName}
            clientId={currentProject.clientId}
            secret={currentProject.secret}
            version={currentProject.version}
            edit={this.editProject}
          />}
          {!this.state.currentProject && <CreateProjectDialog
            isLocal={currentProject.isLocal}
            name={currentProject.name}
            projectFolderRoot={currentProject.projectFolderRoot}
            backend={currentProject.backend}
            manifest={currentProject.manifest}
            ownerName={currentProject.ownerName || this.state.ownerName}
            clientId={currentProject.clientId}
            secret={currentProject.secret}
            version={currentProject.version}
            mustSave={!this.state.currentProject}
            closeHandler={this.closeProjectDialog}
            saveHandler={this.updateProject}
          />}
          {!this.props.session && <SignInDialog />}
        </div>
    ) : (
      <div>
        <ExtensionViewContainer
          extensionViews={this.state.extensionViews}
          deleteExtensionViewHandler={this.deleteExtensionView}
          openExtensionViewHandler={this.openExtensionViewHandler}
          openEditViewHandler={this.openEditViewHandler} />
        {this.state.showExtensionsView &&
          <ExtensionViewDialog
            channelId={defaultChannelId}
            extensionViews={currentProject.manifest.views}
            show={this.state.showExtensionsView}
            closeHandler={this.closeExtensionViewDialog}
            saveHandler={this.createExtensionView} />}
        {this.state.showEditView &&
          <EditViewDialog
            idToEdit={this.state.idToEdit}
            show={this.state.showEditView}
            views={this.getExtensionViews()}
            closeHandler={this.closeEditViewHandler}
            saveViewHandler={this.editViewHandler}
          />}
        {!this.props.session && <SignInDialog />}
        <Console />
      </div>
    );

    return (
      <div className="rig-container">
        <RigNav
          selectedView={this.state.selectedView}
          viewerHandler={this.viewerHandler}
          error={this.state.error} />
        {view}
      </div>
    );
  }

  public getExtensionViews() {
    const extensionViewsValue = localStorage.getItem("extensionViews");
    return extensionViewsValue ? JSON.parse(extensionViewsValue) : extensionViewsValue;
  }

  public pushExtensionViews(newViews: RigExtensionView[]) {
    localStorage.setItem("extensionViews", JSON.stringify(newViews));
    this.setState({
      extensionViews: newViews,
    });
  }

  private loadProjects() {
    const projectsValue = localStorage.getItem('projects');
    if (projectsValue) {
      const projects = JSON.parse(projectsValue);
      const currentProject = projects[Number(localStorage.getItem('currentProjectIndex') || '0')];
      this.setState({ currentProject, projects });
    } else {
      this.setState({ selectedView: Labels.ProjectOverview });
    }
  }

  private loadExtensionViews() {
    const extensionViewsValue = localStorage.getItem("extensionViews");
    if (extensionViewsValue) {
      const extensionViews = JSON.parse(extensionViewsValue);
      extensionViews.forEach((view: RigExtensionView, index: number) => view.id = (index + 1).toString());
      this.setState({ extensionViews });
    } else {
      localStorage.setItem("extensionViews", JSON.stringify([]));
    }
  }

  private setLogin() {
    const windowHash = window.location.hash;
    const rigLogin = localStorage.getItem('rigLogin');
    if (windowHash.includes('access_token')) {
      const accessTokenKey = 'access_token=';
      const accessTokenIndex = windowHash.indexOf(accessTokenKey);
      const ampersandIndex = windowHash.indexOf('&');
      const accessToken = windowHash.substring(accessTokenIndex + accessTokenKey.length, ampersandIndex);
      fetchUserInfo(accessToken)
        .then(resp => {
          const userSess = {
            login: resp.login,
            authToken: accessToken,
            profileImageUrl: resp.profile_image_url,
          }
          this.state.ownerName = resp.login;
          this.props.userLogin(userSess);
          localStorage.setItem('rigLogin', JSON.stringify(userSess));
          window.location.assign('/');
        })
        .catch(error => {
          this.setState({
            error,
          });
        });
    } else if (rigLogin) {
      const login = JSON.parse(rigLogin);
      this.state.ownerName = login.login;
      this.props.userLogin({
        login: login.login,
        authToken: login.authToken,
        profileImageUrl: login.profileImageUrl,
      });
    }
  }
}
