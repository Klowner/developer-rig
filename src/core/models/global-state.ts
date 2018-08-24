import { RigState } from '../state/rig';
import { SessionState } from '../state/session';
import { ProductState } from '../state/products';

export interface GlobalState {
  rig: RigState;
  session: SessionState;
  products: ProductState;
}
