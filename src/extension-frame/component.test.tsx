import { setupShallowTest } from '../tests/enzyme-util/shallow';
import { setupMountTest } from '../tests/enzyme-util/mount';
import { createExtensionForTest } from '../tests/constants/extension';
import { ExtensionFrame } from './component';
import { ExtensionViewType, ExtensionAnchor, ExtensionMode } from '../constants/extension-coordinator';

const defaultPropGenerator = () => ({
  className: 'view',
  frameId: '0',
  installationAbilities: {
    isChatEnabled: true,
  },
  extension: createExtensionForTest(),
  type: ExtensionAnchor.Panel,
  mode: ExtensionMode.Viewer,
  iframe: '',
  bindIframeToParent: jest.fn(),
});

const setupShallow = setupShallowTest(ExtensionFrame, defaultPropGenerator);
const setupMount = setupMountTest(ExtensionFrame, defaultPropGenerator);

describe('<ExtensionFrame />', () => {
  it('onload postMessages data correctly', () => {
    const { wrapper } = setupMount();

    const mockIframeRef: any = {
      contentWindow: {
        postMessage: jest.fn(),
      },
    };

    const instance = wrapper.instance() as ExtensionFrame;
    instance.iframe = mockIframeRef;
    instance.extensionFrameInit();
    expect(mockIframeRef.contentWindow.postMessage).toHaveBeenCalledWith({
      action: 'extension-frame-init',
      channelId: process.env.EXT_CHANNEL_ID,
      extension: {
        anchor: 'panel',
        channelId: NaN,
        extension: {
          authorName: 'test',
          clientId: 'mockClientId',
          bitsEnabled: false,
          description: 'description',
          iconUrl: 'icon_url',
          id: 'id',
          name: 'name',
          requestIdentityLink: false,
          sku: 'sku',
          summary: 'summary',
          token: 'token',
          vendorCode: 'vendorCode',
          version: '0.1',
          state: 'Released',
          views: {
            config: {
              canLinkExternalContent: false,
              viewerUrl: 'test',
            },
            component: {
              aspectHeight: 3000,
              aspectWidth: 2500,
              canLinkExternalContent: false,
              viewerUrl: 'test',
              zoom: false,
              zoomPixels: 100,
            },
            liveConfig: {
              canLinkExternalContent: false,
              viewerUrl: 'test',
            },
            mobile: {
              viewerUrl: 'test',
            },
            panel: {
              canLinkExternalContent: false,
              height: 300,
              viewerUrl: 'test',
            },
            videoOverlay: {
              canLinkExternalContent: false,
              viewerUrl: 'test',
            },
          },
          whitelistedConfigUrls: ['foo'],
          whitelistedPanelUrls: ['bar'],
        },
        iframeClassName: 'extension-frame',
        installationAbilities: {
          isChatEnabled: true,
        },
        loginId: null,
        mode: 'viewer',
        platform: 'web',
        trackingProperties: {}
      },
      frameId: '0'
    }, '*');
  });

  it('onload postMessages data correctly when platform is mobile', () => {
    const { wrapper } = setupMount({
      type: ExtensionViewType.Mobile
    });

    const mockIframeRef: any = {
      contentWindow: {
        postMessage: jest.fn(),
      },
    };

    const instance = wrapper.instance() as ExtensionFrame;
    instance.iframe = mockIframeRef;
    instance.extensionFrameInit();
    expect(mockIframeRef.contentWindow.postMessage).toHaveBeenCalledWith({
      action: 'extension-frame-init',
      channelId: process.env.EXT_CHANNEL_ID,
      extension: {
        anchor: 'mobile',
        channelId: NaN,
        extension: {
          authorName: 'test',
          clientId: 'mockClientId',
          bitsEnabled: false,
          description: 'description',
          iconUrl: 'icon_url',
          id: 'id',
          name: 'name',
          requestIdentityLink: false,
          sku: 'sku',
          summary: 'summary',
          token: 'token',
          vendorCode: 'vendorCode',
          version: '0.1',
          state: 'Released',
          views: {
            config: {
              canLinkExternalContent: false,
              viewerUrl: 'test',
            },
            component: {
              aspectHeight: 3000,
              aspectWidth: 2500,
              canLinkExternalContent: false,
              viewerUrl: 'test',
              zoom: false,
              zoomPixels: 100,
            },
            liveConfig: {
              canLinkExternalContent: false,
              viewerUrl: 'test',
            },
            mobile: {
              viewerUrl: 'test',
            },
            panel: {
              canLinkExternalContent: false,
              height: 300,
              viewerUrl: 'test',
            },
            videoOverlay: {
              canLinkExternalContent: false,
              viewerUrl: 'test',
            },
          },
          whitelistedConfigUrls: ['foo'],
          whitelistedPanelUrls: ['bar'],
        },
        iframeClassName: 'extension-frame',
        installationAbilities: {
          isChatEnabled: true,
        },
        loginId: null,
        mode: 'viewer',
        platform: 'mobile',
        trackingProperties: {}
      },
      frameId: '0'
    }, '*');
  });

  describe('when in live config mode', () => {
    it('renders correctly', () => {
      const { wrapper } = setupShallow({
        type: ExtensionViewType.LiveConfig,
        mode: ExtensionMode.Dashboard,
      });
      expect(wrapper).toMatchSnapshot();
    });
  });

  describe('when in live config mode', () => {
    it('renders correctly', () => {
      const { wrapper } = setupShallow({
        type: ExtensionViewType.LiveConfig,
        mode: ExtensionMode.Dashboard,
      });
      expect(wrapper).toMatchSnapshot();
    });
  });

  describe('when in config mode', () => {
    it('renders correctly', () => {
      const { wrapper } = setupShallow({
        type: ExtensionViewType.Config,
        mode: ExtensionMode.Config,
      });
      expect(wrapper).toMatchSnapshot();
    });
  });

  describe('when in panel mode', () => {
    it('renders correctly', () => {
      const { wrapper } = setupShallow({
        type: ExtensionAnchor.Panel,
        mode: ExtensionMode.Viewer,
      });
      expect(wrapper).toMatchSnapshot();
    });
  });

  describe('when in video overlay mode', () => {
    it('renders correctly', () => {
      const { wrapper } = setupShallow({
        type: ExtensionAnchor.Overlay,
        mode: ExtensionMode.Viewer,
      });
      expect(wrapper).toMatchSnapshot();
    });
  });

  describe('when in video overlay mode', () => {
    it('renders correctly', () => {
      const { wrapper } = setupShallow({
        type: ExtensionAnchor.Overlay,
        mode: ExtensionMode.Viewer,
      });
      expect(wrapper).toMatchSnapshot();
    });
  });
});
