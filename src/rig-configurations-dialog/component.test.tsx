import { setupShallowTest } from '../tests/enzyme-util/shallow';
import { RigConfigurationsDialog } from './component';
import { createExtensionManifestForTest } from '../tests/constants/extension';

describe('<RigConfigurationsDialog />', () => {
  const setupShallow = setupShallowTest(RigConfigurationsDialog, () => ({
    config: createExtensionManifestForTest(),
    closeConfigurationsHandler: jest.fn(),
    refreshConfigurationsHandler: jest.fn()
  }));

  it('renders correctly', () => {
    const { wrapper } = setupShallow();
    expect(wrapper).toMatchSnapshot();
  });

  it('expect no config', () => {
    const { wrapper } = setupShallow({
      config: undefined,
    });
    expect(wrapper.find('.rig-configurations-view__content').text().trim()).toBe('');
  });

  it('should have some configurations', () => {
    const testConfig = createExtensionManifestForTest();
    const { wrapper } = setupShallow({
      config: testConfig
    });
    expect(JSON.parse(wrapper.find('.rig-configurations-view__content').text().trim())).toEqual(testConfig);
  });

  it('fires closeConfigurationsHandler when top exit button is clicked', () => {
    const { wrapper } = setupShallow();
    wrapper.find('.top-bar-container__escape').simulate('click');
    expect(wrapper.instance().props.closeConfigurationsHandler).toHaveBeenCalled();
  });

  it('fires closeConfigurationsHandler when cancel button is clicked', () => {
    const { wrapper } = setupShallow();
    wrapper.find('.bottom-bar__cancel').simulate('click');
    expect(wrapper.instance().props.closeConfigurationsHandler).toHaveBeenCalled();
  });

  it('fires refreshConfigurationsHandler when refresh button is clicked', () => {
    const { wrapper } = setupShallow();
    wrapper.find('.bottom-bar__refresh').simulate('click');
    expect(wrapper.instance().props.refreshConfigurationsHandler).toHaveBeenCalled();
  });
});
