import * as React from 'react';
import { PositionProperty } from 'csstype';

export interface RigExtensionView {
  x: number;
  y: number;
  orientation: string;
  id: string;
  extension: ExtensionCoordinator.ExtensionObject;
  features: {
    isChatEnabled: boolean;
  };
  type: string;
  mode?: string;
  role: string;
  linked: boolean;
  deleteViewHandler?: (id: string) => void;
  openEditViewHandler?: (id: string) => void;
  frameSize?: FrameSize;
}

export interface ViewStyles extends React.CSSProperties {
  border?: string;
  position?: PositionProperty;
  left?: string;
  right?: string;
  top?: string;
  bottom?: string;
  width?: string;
  height?: string;
  transformOrigin?: string;
  transform?: string;
}

export interface FrameSize {
  height: number;
  width: number;
}
