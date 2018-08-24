import { setupShallowTest } from '../tests/enzyme-util/shallow';
import { ManifestForTest } from '../tests/constants/extension';
import { CreateProjectDialog } from './component';

describe('<CreateProjectDialog />', () => {
  const setupShallow = setupShallowTest(CreateProjectDialog, () => ({
    isLocal: false,
    closeHandler: jest.fn(),
    saveHandler: jest.fn()
  }));

  it('renders correctly', () => {
    const { wrapper } = setupShallow();
    expect(wrapper).toMatchSnapshot();
  });

  it('expects label-only content', () => {
    const { wrapper } = setupShallow({ isLocal: true });
    expect(wrapper.find('.project-dialog__content').text().trim()).toBe('Is Local  Name  Owner Name  Client ID  Version  Front-end Directory  Back-end File  Secret  Manifest');
  });

  it('fires closeHandler when top exit button is clicked', () => {
    const { wrapper } = setupShallow();
    wrapper.find('.top-bar-container__escape').simulate('click');
    expect(wrapper.instance().props.closeHandler).toHaveBeenCalled();
  });

  it('fires closeHandler when cancel button is clicked', () => {
    const { wrapper } = setupShallow();
    wrapper.find('.bottom-bar__cancel').simulate('click');
    expect(wrapper.instance().props.closeHandler).toHaveBeenCalled();
  });

  it('fires saveHandler when save button is clicked', () => {
    const { wrapper } = setupShallow();
    const value = 'value';
    ['clientId', 'name', 'ownerName', 'secret', 'version'].forEach((name: string) => {
      wrapper.find('input[name="' + name + '"]').simulate('change', { currentTarget: { name, value } });
    })
    const manifest = ManifestForTest;
    wrapper.find('textarea').simulate('change', { currentTarget: { name: 'manifest', value: JSON.stringify(manifest) } });
    wrapper.find('.bottom-bar__save').simulate('click');
    expect(wrapper.instance().props.saveHandler).toHaveBeenCalledWith({
      isLocal: false,
      name: value,
      frontend: '',
      backend: '',
      manifest,
      ownerName: value,
      version: value,
      clientId: value,
      secret: value,
    });
  });

  it('does not invoke saveHandler when save button is clicked', () => {
    const { wrapper } = setupShallow();
    wrapper.find('.bottom-bar__save').simulate('click');
    expect(wrapper.instance().props.saveHandler).not.toHaveBeenCalled();
  });
});
