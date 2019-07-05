import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { ReactReduxContext, Provider } from 'react-redux';
import _get from 'lodash/get';
import createStore from '../createStore';

function ResiftProvider({ children, dataService }) {
  const reduxContextValue = useContext(ReactReduxContext);
  const storeFromReactRedux = _get(reduxContextValue, ['store']);

  if (process.env.NODE_ENV !== 'production') {
    if (dataService && storeFromReactRedux) {
      console.warn(
        "[ResiftProvider] you shouldn't provide the `dataService` prop to the provider if you wrap in the redux `<Provider>`. TODO: make docs for this",
      );
    }

    if (!storeFromReactRedux && !dataService) {
      throw new Error(
        '[ResiftProvider] `dataService` was not passed to `<ResiftProvider />`. TODO: make docs for this',
      );
    }
  }

  const store = useMemo(() => {
    if (storeFromReactRedux) {
      return storeFromReactRedux;
    }

    return createStore(dataService);
  }, [storeFromReactRedux, dataService]);

  // if the store is the storeFromRedux then we don't need to do anything
  if (store === storeFromReactRedux) {
    return children;
  }

  // otherwise wrap in provider
  return <Provider store={store}>{children}</Provider>;
}

ResiftProvider.propTypes = {
  children: PropTypes.node,
  dataService: PropTypes.func,
};

export default ResiftProvider;
