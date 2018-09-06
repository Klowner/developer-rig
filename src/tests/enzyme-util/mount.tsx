import * as React from 'react';
import { mount, MountRendererProps } from 'enzyme';

/**
 * Builds the mount wrapper for a component given defaults set in a test suite, and allowing overrides for each case.
 * @param {*} Component
 * @param {*} generator
 * @param {*} mountOptions
 */
export function setupMountTest<Props>(Component: React.ComponentClass<Props>, generator: () => Props, mountOptions?: MountRendererProps) {
  return (propOverrides?: Partial<Props>) => {
    const combinedProps = Object.assign({}, generator(), propOverrides);
    return {
      props: combinedProps,
      wrapper: mount((<Component {...combinedProps} />), mountOptions),
    }
  }
}
