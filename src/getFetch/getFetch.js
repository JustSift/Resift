import _get from 'lodash/get';
import _flatten from 'lodash/flatten';
import createStoreKey from '../createStoreKey';
import createShareKey from '../createShareKey';

import isUnknown from '../isUnknown';
import isLoading from '../isLoading';
import isNormal from '../isNormal';
import isError from '../isError';

import UNKNOWN from '../UNKNOWN';
import LOADING from '../LOADING';
import ERROR from '../ERROR';
import NORMAL from '../NORMAL';

// combining shared loading states is a bit different
function combineSharedLoadingStates(...loadingStates) {
  if (loadingStates.every(loadingState => isUnknown(loadingState))) {
    return UNKNOWN;
  }

  const loading = isLoading(...loadingStates) ? LOADING : UNKNOWN;

  const normal = loadingStates.some(loadingState => isNormal(loadingState)) ? NORMAL : UNKNOWN;

  const error = isError(...loadingStates) ? ERROR : UNKNOWN;

  return loading | normal | error;
}

export function getLoadingState(actionState) {
  if (!actionState) return UNKNOWN;

  const { hadSuccess, inflight, error } = actionState;

  const inflightLoadingState = inflight ? LOADING : UNKNOWN;
  const errorLoadingState = error ? ERROR : UNKNOWN;
  const normalLoadingState = hadSuccess && !error ? NORMAL : UNKNOWN;

  return inflightLoadingState | errorLoadingState | normalLoadingState;
}

export function arrayShallowEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const x = a[i];
    const y = b[i];
    if (x !== y) return false;
  }
  return true;
}
export default function getFetch(fetchActionCreator, state, options) {
  if (!fetchActionCreator) throw new Error('first argument, the fetch action, is required');
  if (!state) throw new Error('state is required');
  if (!state.dataService) {
    throw new Error('"dataService" is a required key. pass in the whole store state.');
  }

  const { actionCreatorId, displayName, key, share } = fetchActionCreator.meta;
  const storeKey = createStoreKey(displayName, actionCreatorId);
  if (!key) {
    throw new Error(
      `Could not find any key for action "${displayName}". If you're using or getting a fetch, ensure that you're passing all the correct parameters.`,
    );
  }

  const value = _get(state, ['dataService', 'actions', storeKey, key]);

  if (!share) {
    if (!value) return [null, UNKNOWN];

    const data = value.error ? null : value.payload;
    const loadingState = getLoadingState(value);

    return [data, loadingState];
  }

  const { namespace } = share;
  const shareKey = createShareKey(namespace, key);
  const storeValue = state.dataService.shared[shareKey];
  if (!storeValue) return [null, UNKNOWN];

  const sharedValue = storeValue.data;
  const dataServiceValues = Object.values(storeValue.parentActions).map(
    ({ storeKey, key }) => state.dataService.actions[storeKey][key],
  );
  const sharedLoadingState = combineSharedLoadingStates(...dataServiceValues.map(getLoadingState));

  const isolatedLoadingState = _get(options, ['isolatedLoadingState'], false);

  return [sharedValue, isolatedLoadingState ? getLoadingState(value) : sharedLoadingState];
}
