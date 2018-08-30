import * as React from 'react';
import './component.sass';
import { ExtensionPlatform, ExtensionViewType} from '../constants/extension-coordinator';

const IFRAME_CLASS = 'extension-frame';
const EXTENSION_FRAME_INIT_ACTION = 'extension-frame-init';

export interface PublicProps {
  className: string;
  frameId: string;
  extension: ExtensionCoordinator.ExtensionObject;
  installationAbilities: ExtensionCoordinator.ExtensionInstallationAbilities;
  type: string;
  mode: string;
  bindIframeToParent: (iframe: HTMLIFrameElement) => void;
}

type Props = PublicProps;

export class ExtensionFrame extends React.Component<Props> {
  public iframe: HTMLIFrameElement;

  public componentDidMount() {
    if (this.iframe) {
      this.iframe.onload = this.extensionFrameInit;
    }
  }

  public render() {
    return (
      <iframe
        ref={this.bindIframeRef}
        src={process.env.PUBLIC_URL + '/extension-frame.html'}
        frameBorder={0}
        className={`rig-frame ${IFRAME_CLASS}`}
        title={this.props.frameId}
      />
    );
  }

  private bindIframeRef = (iframe: HTMLIFrameElement) => {
    this.iframe = iframe;
    this.props.bindIframeToParent(iframe);
  }

  public extensionFrameInit = () => {
    const extensionFrameParams: ExtensionCoordinator.ExtensionFrameParams = {
      anchor: this.props.type as ExtensionCoordinator.ExtensionAnchor,
      channelId: parseInt(process.env.EXT_CHANNEL_ID, 0),
      extension: this.props.extension,
      iframeClassName: IFRAME_CLASS,
      installationAbilities: this.props.installationAbilities,
      loginId: null,
      mode: this.props.mode as ExtensionCoordinator.ExtensionMode,
      platform: (this.props.type === ExtensionViewType.Mobile) ? ExtensionPlatform.Mobile : ExtensionPlatform.Web,
      trackingProperties: {},
    }

    const data = {
      action: EXTENSION_FRAME_INIT_ACTION,
      extension: extensionFrameParams,
      channelId: process.env.EXT_CHANNEL_ID,
      frameId: this.props.frameId,
    };

    this.iframe.contentWindow.postMessage(data, '*');
  }
}
