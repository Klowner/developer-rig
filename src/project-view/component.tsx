import * as React from 'react';
import './component.sass';
import { RigProject } from '../core/models/rig';

type ProjectViewProps = RigProject & {
  edit: Function;
};

export class ProjectView extends React.Component<ProjectViewProps> {
  edit = () => {
    this.props.edit();
  }

  public render() {
    return (
      <div className="project-view__content">
        <div className="project-view__state-value">
          <label className="props-value__label"> Is Local </label>
          <input disabled={true} className="props-value__input" type="checkbox" name="isLocal" checked={this.props.isLocal} />
        </div>
        <div className="project-view__state-value">
          <label className="props-value__label"> Name </label>
          <input disabled={true} className="props-value__input" type="text" name="name" value={this.props.name} />
        </div>
        <div className="project-view__state-value">
          <label className="props-value__label"> Owner Name </label>
          <input disabled={true} className="props-value__input" type="text" name="ownerName" value={this.props.ownerName} />
        </div>
        <div className="project-view__state-value">
          <label className="props-value__label"> Client ID </label>
          <input disabled={true} className="props-value__input" type="text" name="clientId" value={this.props.clientId} />
        </div>
        <div className="project-view__state-value">
          <label className="props-value__label"> Version </label>
          <input disabled={true} className="props-value__input" type="text" name="version" value={this.props.version} />
        </div>
        <div className="project-view__state-value">
          <label className="props-value__label"> Front-end Directory </label>
          <input disabled={true} className="props-value__input" type="text" name="frontend" value={this.props.frontend} />
        </div>
        <div className="project-view__state-value">
          <label className="props-value__label"> Back-end File </label>
          <input disabled={true} className="props-value__input" type="text" name="backend" value={this.props.backend} />
        </div>
        <div className="project-view__state-value">
          <label className="props-value__label"> Secret </label>
          <input disabled={true} className="props-value__input" type="text" name="secret" value={this.props.secret} />
        </div>
        <div className="project-view__state-value">
          <label className="props-value__label"> Manifest </label>
          <textarea disabled={true} className="props-value__input" name="manifest" value={JSON.stringify(this.props.manifest)} />
        </div>
        <div className="project-view__state-value">
          <button onClick={this.edit}>Edit</button>
        </div>
      </div>
    );
  }
}
