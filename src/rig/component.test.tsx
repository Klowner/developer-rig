import { setupShallowTest } from '../tests/enzyme-util/shallow';
import { createViewsForTest, ExtensionForTest } from '../tests/constants/extension';
import { mockFetchForManifest, mockFetchForUserInfo } from '../tests/mocks';
import { Labels } from '../constants/nav-items';
import { RigComponent } from './component';
import { ExtensionAnchors } from '../constants/extension-types';
import { ViewerTypes } from '../constants/viewer-types';
import { RigExtensionView } from '../core/models/rig';
import { ExtensionViewDialog, ExtensionViewDialogState } from '../extension-view-dialog';

import { ExtensionAnchor, ExtensionMode, ExtensionViewType } from '../constants/extension-coordinator';

let globalAny = global as any;

describe('<RigComponent />', () => {
  const setupShallow = setupShallowTest(RigComponent, () => ({}));

  function setupViewsForTest(numViews: number) {
    const testViews = createViewsForTest(numViews, ExtensionAnchors[ExtensionAnchor.Panel], ViewerTypes.LoggedOut);
    localStorage.setItem('extensionViews', JSON.stringify(testViews));
  };

  function setupComponentViewsForTest(numViews: number) {
    const testViews = createViewsForTest(numViews, ExtensionAnchors[ExtensionAnchor.Component], ViewerTypes.LoggedOut);
    localStorage.setItem('extensionViews', JSON.stringify(testViews));
  };

  beforeEach(() => {
    globalAny.fetch = jest.fn().mockImplementation(mockFetchForManifest);
  })

  it('renders correctly', () => {
    const { wrapper } = setupShallow();
    expect(wrapper).toMatchSnapshot();
  });

  it('gets extension views from local storage correctly when not in local storage', () => {
    const { wrapper } = setupShallow();
    const instance = wrapper.instance() as RigComponent;
    expect(instance.getExtensionViews()).toEqual([]);
  });

  it('renders extension view correctly', () => {
    localStorage.setItem('projects', JSON.stringify([{}]));
    setupViewsForTest(1);
    const { wrapper } = setupShallow();
    expect(wrapper).toMatchSnapshot();
    expect((wrapper.find('ExtensionViewContainer') as any).props().extensionViews).toHaveLength(1);
  });

  it('gets extension views from local storage correctly', () => {
    setupViewsForTest(1);
    const testViews = createViewsForTest(1, ExtensionAnchors[ExtensionAnchor.Panel], ViewerTypes.LoggedOut);
    const { wrapper } = setupShallow();
    const instance = wrapper.instance() as RigComponent;
    expect(instance.getExtensionViews()).toEqual(testViews);
  });

  it('deletes extension view correctly', () => {
    setupViewsForTest(1);
    const { wrapper } = setupShallow();
    const instance = wrapper.instance() as RigComponent;
    expect((wrapper.find('ExtensionViewContainer') as any).props().extensionViews).toHaveLength(1);

    instance.deleteExtensionView('1');
    wrapper.update();
    expect((wrapper.find('ExtensionViewContainer') as any).props().extensionViews).toHaveLength(0);
  });

  it('toggles state when edit dialog is opened/closed', () => {
    setupComponentViewsForTest(1);
    const { wrapper } = setupShallow();
    const instance = wrapper.instance() as RigComponent;

    instance.openEditViewHandler('1');
    expect(instance.state.showEditView).toBe(true);
    expect(instance.state.idToEdit).toBe('1');

    instance.closeEditViewHandler();
    expect(instance.state.showEditView).toBe(false);
    expect(instance.state.idToEdit).toBe('0');
  });

  it('edit changes the view and sets them correctly', () => {
    setupComponentViewsForTest(1);
    const { wrapper } = setupShallow();
    const instance = wrapper.instance() as RigComponent;

    instance.openEditViewHandler('1');
    expect(instance.state.showEditView).toBe(true);
    expect(instance.state.idToEdit).toBe('1');

    instance.editViewHandler({ x: 25, y: 25 });

    const views = instance.getExtensionViews();
    const editedView = views.filter((element: RigExtensionView) => element.id === '1');
    expect(editedView[0].x).toEqual(25);
    expect(editedView[0].y).toEqual(25);
    expect(instance.state.showEditView).toBe(false);
    expect(instance.state.idToEdit).toBe('0');
  });

  it('correctly toggles state when create extension view is opened/closed', () => {
    localStorage.setItem('projects', JSON.stringify([{ manifest: { views: [{}] } }]));
    setupViewsForTest(1);
    const { wrapper } = setupShallow();
    wrapper.setState({
      manifest: ExtensionForTest,
    })
    const instance = wrapper.instance() as RigComponent;
    instance.openExtensionViewHandler();
    expect(instance.state.showExtensionsView).toBe(true);


    instance.closeExtensionViewDialog();
    expect(instance.state.showExtensionsView).toBe(false);
  });

  it('correctly sets state when viewHandler is invoked', () => {
    setupViewsForTest(1);
    const { wrapper } = setupShallow();
    const instance = wrapper.instance() as RigComponent;

    instance.viewerHandler(Labels.ExtensionViews);
    expect(instance.state.selectedView).toBe(Labels.ExtensionViews);
  });

  it('gets the correct views when getExtensionViews invoked', () => {
    const testViews = createViewsForTest(1, ExtensionAnchors[ExtensionAnchor.Panel], ViewerTypes.LoggedOut);
    setupViewsForTest(1);
    const { wrapper } = setupShallow();
    const instance = wrapper.instance() as RigComponent;

    expect(instance.state.extensionViews).toEqual(testViews);
  });

  it('sets views in local storage correctly when pushExtensionViews invoked', () => {
    const testViews = createViewsForTest(1, ExtensionAnchors[ExtensionAnchor.Panel], ViewerTypes.LoggedOut);
    setupViewsForTest(1);
    const { wrapper } = setupShallow();
    const instance = wrapper.instance() as RigComponent;

    expect(instance.state.extensionViews).toEqual(testViews);

    instance.state.extensionViews.push(createViewsForTest(1,ExtensionAnchors[ExtensionAnchor.Panel], ViewerTypes.LoggedOut)[0] as RigExtensionView);
    instance.pushExtensionViews(instance.state.extensionViews);
  });

  describe('gets frame size from dialog ref correctly', () => {
    it('returns correct data for mobile ', () => {
      const { wrapper } = setupShallow();
      const testDialogState = {
        width: 0,
        height: 0,
        frameSize: 'iPhone X (375x822)',
        extensionViewType: ExtensionViewType.Mobile
      } as ExtensionViewDialogState;
      const expectedMobileFrameSize = {
        width: 375,
        height: 822,
      };
      const instance = wrapper.instance() as RigComponent;

      let frameSize = instance.getFrameSizeFromDialog(testDialogState);
      expect(frameSize).toEqual(expectedMobileFrameSize);
    });

    it('returns correct data for other types', () => {
      const { wrapper } = setupShallow();
      const overlayTestDialogState = {
        width: 0,
        height: 0,
        frameSize: '640x480',
        extensionViewType: ExtensionViewType.VideoOverlay
      } as ExtensionViewDialogState;
      const expectedOverlayFrameSize = {
        width: 640,
        height: 480,
      };
      const instance = wrapper.instance() as RigComponent;
      const frameSize = instance.getFrameSizeFromDialog(overlayTestDialogState);
      expect(frameSize).toEqual(expectedOverlayFrameSize);
    });

    it('returns correct data for custom size', () => {
      const { wrapper } = setupShallow();
      const overlayTestDialogState = {
        width: 100,
        height: 100,
        frameSize: 'Custom',
        extensionViewType: ExtensionViewType.VideoOverlay
      } as ExtensionViewDialogState;
      const expectedOverlayFrameSize = {
        width: 100,
        height: 100,
      };
      const instance = wrapper.instance() as RigComponent;
      const frameSize = instance.getFrameSizeFromDialog(overlayTestDialogState);
      expect(frameSize).toEqual(expectedOverlayFrameSize);
    });

    it('correctly fetches user info if login not in localStorage', () => {
      globalAny.fetch = jest.fn().mockImplementation(mockFetchForUserInfo);
      globalAny.window.location.hash = 'access_token=test&';

      const { wrapper } = setupShallow();
      expect(globalAny.fetch).toHaveBeenCalled();
    });
  });
});
