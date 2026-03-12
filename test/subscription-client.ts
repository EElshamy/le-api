import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as WebSocket from 'ws';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { Client, createClient } from 'graphql-ws';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';

const env = dotenv.parse(fs.readFileSync(path.join(process.cwd(), '.env')));

export let networkInterfaceInstance: Client;

const networkInterface = (auth?: string) => {
  if (!networkInterfaceInstance) {
    networkInterfaceInstance = createClient({
      url: env.API_SUBSCRIPTION_BASE,

      ...(auth && { connectionParams: () => ({ Authorization: `Bearer ${auth}` }) }),
      webSocketImpl: WebSocket
    });
  }
  return networkInterfaceInstance;
};

export const apollo = (auth?: string) =>
  new ApolloClient({
    link: new GraphQLWsLink(networkInterface(auth)),
    cache: new InMemoryCache()
  });
