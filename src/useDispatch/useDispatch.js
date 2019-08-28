import { useContext, useCallback } from 'react';
import _get from 'lodash/get';
import { ReactReduxContext } from 'react-redux';
import CLEAR from '../prefixes/CLEAR';

export default function useDispatch() {
  const contextValue = useContext(ReactReduxContext);
  if (!contextValue) {
    // TODO: add docs link
    throw new Error(
      '[useDispatch] Could not find the respective context. In order to `useDispatch` you must add the respective provider.',
    );
  }
  const { store } = contextValue;

  if (process.env.NODE_ENV === 'production') return store.dispatch;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(
    action => {
      const isFetchInstance = _get(action, ['meta', 'type']) === 'FETCH_INSTANCE';
      const isFetchFactory = _get(action, ['meta', 'type']) === 'FETCH_INSTANCE_FACTORY';
      const isClearAction = _get(action, ['type'], '').startsWith(CLEAR);

      if (isFetchInstance && !isClearAction) {
        // TODO: add docs for this
        throw new Error(
          "[useDispatch] You dispatched a fetch instance without calling it when you should've dispatched a request.",
        );
      }
      if (isFetchFactory) {
        throw new Error(
          // TODO: add docs for this
          "[useDispatch] You dispatched a fetch factory when you should've dispatched a request.",
        );
      }

      return store.dispatch(action);
    },
    [store],
  );
}
