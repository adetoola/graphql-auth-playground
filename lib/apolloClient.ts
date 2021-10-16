// import { concatPagination } from '@apollo/client/utilities'
import merge from 'deepmerge';
import { IncomingHttpHeaders } from 'http';
import fetch from 'isomorphic-unfetch';
import isEqual from 'lodash/isEqual';
import router from 'next/router';
import { useMemo } from 'react';

import { ApolloClient, from, HttpLink, InMemoryCache, NormalizedCacheObject } from '@apollo/client';
import { onError } from '@apollo/client/link/error';

export const APOLLO_STATE_PROP_NAME = "__APOLLO_STATE__";

let apolloClient: ApolloClient<NormalizedCacheObject>;

interface IApolloStateProps {
  [APOLLO_STATE_PROP_NAME]?: NormalizedCacheObject;
}

const errorLink = onError((errors) => {
  if (errors.graphQLErrors && errors.graphQLErrors[0].extensions?.code === "UNAUTHENTICATED" && errors.response) {
    errors.response.errors = undefined;
    router.replace("/login");
  }
});

function createApolloClient(headers: IncomingHttpHeaders | null = null) {
  const enhancedFetch = (uri: RequestInfo, init: RequestInit) => {
    return fetch(uri, {
      ...init,
      headers: {
        ...init.headers,
        // "Access-Control-Allow-Origin": "http://localhost:4000",
        Cookie: headers?.cookie ?? "",
      },
    });
  };

  const httpLink = new HttpLink({
    uri: "http://localhost:4000/graphql",
    // TODO: Fix this
    // uri: process.env.NEXT_PUBLIC_API_URL, // Server URL (must be absolute)
    fetch: enhancedFetch,
  });

  return new ApolloClient({
    ssrMode: typeof window === "undefined",
    link: from([errorLink, httpLink]),
    credentials: "include",
    cache: new InMemoryCache(),
  });
}

export function initializeApollo(
  {
    headers,
    initialState,
  }: {
    headers?: IncomingHttpHeaders | null;
    initialState?: NormalizedCacheObject | null;
  } = { headers: null, initialState: null }
) {
  const _apolloClient = apolloClient ?? createApolloClient(headers);

  // If your page has Next.js data fetching methods that use Apollo Client, the initial state
  // gets hydrated here
  if (initialState) {
    // Get existing cache, loaded during client side data fetching
    const existingCache = _apolloClient.extract();

    // Merge the existing cache into data passed from getStaticProps/getServerSideProps
    const data = merge(initialState, existingCache, {
      // combine arrays using object equality (like in sets)
      arrayMerge: (destinationArray, sourceArray) => [
        ...sourceArray,
        ...destinationArray.filter((d) => sourceArray.every((s) => !isEqual(d, s))),
      ],
    });

    // Restore the cache with the merged data
    _apolloClient.cache.restore(data);
  }
  // For SSG and SSR always create a new Apollo Client
  if (typeof window === "undefined") return _apolloClient;
  // Create the Apollo Client once in the client
  if (!apolloClient) apolloClient = _apolloClient;

  return _apolloClient;
}

export function addApolloState(client: ApolloClient<NormalizedCacheObject>, pageProps: { props: IApolloStateProps }) {
  if (pageProps?.props) {
    pageProps.props[APOLLO_STATE_PROP_NAME] = client.cache.extract();
  }

  return pageProps;
}

export function useApollo(pageProps: IApolloStateProps) {
  const state = pageProps[APOLLO_STATE_PROP_NAME];
  const store = useMemo(() => initializeApollo({ initialState: state }), [state]);
  return store;
}
