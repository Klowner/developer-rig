import * as React from 'react';
import './component.sass';
import * as closeButton from '../img/close_icon.png';
import { createSignedToken, TokenSpec } from '../util/token';
import { ExtensionManifest } from '../core/models/manifest';
import { fetchExtensionManifest, fetchUserByName } from '../util/api';
import { RigProject } from '../core/models/rig';
import { RigRole } from '../constants/rig';
import { toCamelCase } from '../util/case';
import { ExtensionViewType } from '../constants/extension-coordinator';

type CreateProjectDialogProps = RigProject & {
  mustSave?: boolean;
  closeHandler: () => void;
  saveHandler: (state: RigProject) => void;
};

type CreateProjectDialogState = RigProject & {
  codeGenerationOptions: string,
  scaffoldingOptions: number,
  [key: string]: boolean | number | string | ExtensionManifest;
};

const CodeGenerationOptions = {
  None: "none",
  Scaffolding: "scaffolding",
  Template: "template",
};

const ScaffoldingOptions = {
  storeConfiguration: 1,
  retrieveOnLoad: 2,
};

const ExtensionTypes = {
  [ExtensionViewType.Panel]: 1,
  [ExtensionViewType.Component]: 2,
  [ExtensionViewType.Mobile]: 4,
  [ExtensionViewType.VideoOverlay]: 8,
};

export class CreateProjectDialog extends React.Component<CreateProjectDialogProps, CreateProjectDialogState> {
  public state: CreateProjectDialogState = {
    codeGenerationOptions: CodeGenerationOptions.None,
    scaffoldingOptions: 0,
    extensionTypes: 0,
    clientId: this.props.clientId || process.env.EXT_CLIENT_ID || '',
    projectFolderRoot: this.props.projectFolderRoot || '',
    isLocal: this.props.isLocal,
    manifest: this.props.manifest || {} as ExtensionManifest,
    name: this.props.name || '',
    ownerName: this.props.ownerName,
    secret: this.props.secret || process.env.EXT_SECRET || '',
    version: this.props.version || process.env.EXT_VERSION || '',
  };

  public onChange = (input: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = input.currentTarget as HTMLInputElement;
    const value = target.type === 'checkbox' ? target.checked :
      target.name === 'manifest' ? this.parseManifest(target.value) :
        target.value;
    this.setState({ [target.name]: value });
  }

  private parseManifest(value: string): ExtensionManifest {
    try {
      return JSON.parse(value);
    } catch (ex) {
      return ex.message as ExtensionManifest;
    }
  }

  private canSave = () => {
    const requiredNames = ['clientId', 'manifest', 'name', 'ownerName', 'secret', 'version'];
    if (requiredNames.every((name: string) => !!String(this.state[name]).trim())) {
      // TODO:  validate the manifest.
      return true;
    }
    return false;
  }

  private saveHandler = () => {
    if (this.canSave()) {
      this.props.saveHandler(this.state);
    }
  }

  private fetchExtensionManifest = () => {
    if (this.state.ownerName) {
      const apiHost = process.env.API_HOST || 'api.twitch.tv';
      fetchUserByName(apiHost, this.state.clientId, this.state.ownerName).then((user) => {
        const tokenSpec: TokenSpec = {
          role: RigRole,
          secret: this.state.secret,
          userId: user['id'],
        };
        const token = createSignedToken(tokenSpec);
        return fetchExtensionManifest(apiHost, this.state.clientId, this.state.version, token);
      })
        .then(this.onSuccess)
        .catch(this.onError);
    }
  }

  private onSuccess = (manifest: ExtensionManifest) => {
    this.setState((previousState: CreateProjectDialogState) => ({
      manifest,
      name: previousState.name || manifest.name,
    }));
  }

  private onError = (message: string) => {
    this.setState({ manifest: message as any as ExtensionManifest });
  }

  public render() {
    const saveClassName = 'bottom-bar__save' + (this.canSave() ? '' : ' disabled');
    return (
      <div className="project-dialog">
        <div className="project-dialog__background" />
        <div className="project-dialog__dialog">
          <div className="dialog__top-bar-container">
            <div className="top-bar-container__title"> Create New Extension Project </div>
            {!this.props.mustSave && <div className="top-bar-container__escape" onClick={this.props.closeHandler}><img alt="Close" src={closeButton} /></div>}
          </div>
          <hr className="dialog__divider" />
          <div className="project-dialog__content left">
            <label className="state-value__label">
              <span> Extension Project Name </span>
              <input className="state-value__input" type="text" name="name" value={this.state.name} onChange={this.onChange} />
            </label>
            <div className="project-dialog__state-value">
              <div> Choose Extension </div>
              <label className="state-value__label">
                <input className="state-value__input" type="radio" name="isLocal" value={1} checked={this.state.isLocal} onChange={this.onChange} />
                <span> Create Local Extension </span>
              </label>
              <label className="state-value__label">
                <input className="state-value__input" type="radio" name="isLocal" value={0} checked={!this.state.isLocal} onChange={this.onChange} />
                <span> Use Already Created Online Extension </span>
                <div>
                  <select></select>
                </div>
              </label>
              <div> Extension Type </div>
              <label className="state-value__label">
                <input className="state-value__input" type="checkbox" name="extensionTypes" value={ExtensionTypes.videoOverlay} checked={Boolean(this.state.extensionTypes & ExtensionTypes.videoOverlay)} onChange={this.onChange} />
                <span> Video Overlay </span>
              </label>
              <label className="state-value__label">
                <input className="state-value__input" type="checkbox" name="extensionTypes" value={ExtensionTypes.panel} checked={Boolean(this.state.extensionTypes & ExtensionTypes.panel)} onChange={this.onChange} />
                <span> Panel </span>
              </label>
              <label className="state-value__label">
                <input className="state-value__input" type="checkbox" name="extensionTypes" value={ExtensionTypes.component} checked={Boolean(this.state.extensionTypes & ExtensionTypes.component)} onChange={this.onChange} />
                <span> Component </span>
              </label>
              <label className="state-value__label">
                <input className="state-value__input" type="checkbox" name="extensionTypes" value={ExtensionTypes.mobile} checked={Boolean(this.state.extensionTypes & ExtensionTypes.mobile)} onChange={this.onChange} />
                <span> Mobile </span>
              </label>
            </div>
            <label className="state-value__label">
              <span> Project Folder Root </span>
              <input className="state-value__input" type="text" name="projectFolderRoot" value={this.state.projectFolderRoot} onChange={this.onChange} />
            </label>
            <div className="project-dialog__state-value">
              <div> Add Code to Project </div>
              <label className="state-value__label">
                <input className="state-value__input" type="radio" name="codeGenerationOptions" value={CodeGenerationOptions.None} checked={this.state.codeGenerationOptions === CodeGenerationOptions.None} onChange={this.onChange} />
                <span> None (Just Create Project Folder) </span>
              </label>
              <label className="state-value__label">
                <input className="state-value__input" type="radio" name="codeGenerationOptions" value={CodeGenerationOptions.Scaffolding} checked={this.state.codeGenerationOptions === CodeGenerationOptions.Scaffolding} onChange={this.onChange} />
                <span> Generate Scaffolding </span>
              </label>
              <label className="state-value__label">
                <input className="state-value__input" type="radio" name="codeGenerationOptions" value={CodeGenerationOptions.Template} checked={this.state.codeGenerationOptions === CodeGenerationOptions.Template} onChange={this.onChange} />
                <span> Use Existing Sample Template </span>
              </label>
            </div>
          </div>
          <div className="project-dialog__vertical-bar" />
          {this.state.codeGenerationOptions === CodeGenerationOptions.Scaffolding ? (
            <div className="project-dialog__content right">
              <div> Tell us more about what your extension will do </div>
              <div> (We’ll automatically provide basic React based scaffolding, but we want to provide extras where useful!) </div>
              <label className="state-value__label">
                <input className="state-value__input" type="checkbox" name="scaffoldingOptions" value={ScaffoldingOptions.storeConfiguration} checked={Boolean(this.state.scaffoldingOptions & ScaffoldingOptions.storeConfiguration)} onChange={this.onChange} />
                <span> Store Broadcaster Configuration </span>
              </label>
              <label className="state-value__label">
                <input className="state-value__input" type="checkbox" name="scaffoldingOptions" value={ScaffoldingOptions.retrieveOnLoad} checked={Boolean(this.state.scaffoldingOptions & ScaffoldingOptions.retrieveOnLoad)} onChange={this.onChange} />
                <span> Retrieve Configuration on Load </span>
              </label>
            </div>
          ) : this.state.codeGenerationOptions === CodeGenerationOptions.Template ? (
            <div className="project-dialog__content right">
            </div>
          ) : (
                <div className="project-dialog__content right">
                  <div> You’re All Set!  Good luck on your extension! </div>
                </div>
              )}
          <hr className="dialog__divider" />
          <div className="dialog_bottom-bar">
            <div className={saveClassName} onClick={this.saveHandler}> Save </div>
            {!this.props.mustSave && (
              <div className="bottom-bar__cancel" onClick={this.props.closeHandler}> Cancel </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
