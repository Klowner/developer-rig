import * as React from 'react';
import { ExtensionManifest } from './manifest';
import { RigRole } from '../../constants/rig';
import { TokenSpec, createSignedToken } from '../../util/token';
import { ViewerTypes } from '../../constants/viewer-types';

export type RigProject = {
  isLocal: boolean;
  name: string;
  projectFolderRoot: string;
  extensionTypes: number;
  manifest: ExtensionManifest;
  ownerName: string;
  clientId: string;
  secret: string;
  version: string;
};

export type RigExtensionView = {
  x: number;
  y: number;
  orientation: string;
  id: string;
  extension: RigExtension;
  type: string;
  mode: string;
  role: string;
  linked: boolean;
  deleteViewHandler: (id: string) => void;
  openEditViewHandler: (id: string) => void;
  position?: Position;
  frameSize?: FrameSize;
};

export type FrameSize = {
  height: number;
  width: number;
};

export type RigExtensionSpec = {
  manifest: ExtensionManifest;
  index: string;
  role: string;
  isLinked: boolean;
  ownerName: string;
  channelId: string;
  secret: string;
  opaqueId: string;
};

export type RigExtension = ExtensionManifest & {
  clientId?: string;
  token: string;
  channelId: string;
};

const idSource: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const idLength: number = 15;

export function createRigExtension(rigExtensionSpec: RigExtensionSpec): RigExtension {
  const { manifest, index, role, isLinked, ownerName, channelId, secret, opaqueId } = rigExtensionSpec;
  const opaqueIdSuffix = opaqueId ||
    Array(idLength).fill(0).map(_ => idSource.charAt(Math.floor(Math.random() * idSource.length))).join('');
  const tokenSpec: TokenSpec = {
    role: RigRole,
    secret,
    channelId,
    opaqueUserId: 'ARIG' + opaqueIdSuffix,
  };
  switch (role) {
    case ViewerTypes.LoggedOut:
      tokenSpec.role = 'viewer';
      break;
    case ViewerTypes.LoggedIn:
      tokenSpec.role = 'viewer';
      tokenSpec.opaqueUserId = 'URIG' + opaqueIdSuffix;
      if (isLinked) {
        tokenSpec.userId = 'RIG' + ownerName;
      }
      break;
    case ViewerTypes.Broadcaster:
      tokenSpec.role = 'broadcaster';
      tokenSpec.opaqueUserId = 'URIG' + opaqueIdSuffix;
      tokenSpec.userId = 'RIG' + ownerName;
      break;
  }
  return {
    ...manifest,
    channelId,
    clientId: manifest.id,
    id: manifest.id + ':' + index,
    token: createSignedToken(tokenSpec),
  };
}
