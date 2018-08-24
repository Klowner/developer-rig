import { setupShallowTest } from '../tests/enzyme-util/shallow';
import { ProjectView } from './component';

const DeleteButtonSelector = '.view__close_button.visible';

describe('<ProjectView />', () => {
  const setupShallow = setupShallowTest(ProjectView, () => ({
    isLocal: true,
    name: 'test',
    frontend: 'test',
    backend: 'test',
    manifest: 'test',
    ownerName: 'test',
    clientId: 'test',
    secret: 'test',
    version: 'test',
  }));

  describe('config mode views', () => {
    it('renders correctly', () => {
      const { wrapper } = setupShallow();
      expect(wrapper).toMatchSnapshot();
    });
  });
});
