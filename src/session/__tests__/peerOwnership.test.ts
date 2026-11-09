import { FakeNetwork } from '@/net/fake/FakeNetwork';
import { FakeTransport } from '@/net/fake/FakeTransport';

import { OwnedPeers } from '../peerOwnership';

function setup() {
  const transport = new FakeTransport(new FakeNetwork(10), 'host');
  const disconnect = jest.spyOn(transport, 'disconnect').mockResolvedValue();

  return { transport, disconnect };
}

test('closes a link this session still owns', () => {
  const { transport, disconnect } = setup();
  const owned = new OwnedPeers(transport);
  owned.claim('peer');

  owned.disconnectIfOwned('peer');

  expect(disconnect).toHaveBeenCalledWith('peer');
});

test('leaves a link that a newer session claimed alone', () => {
  const { transport, disconnect } = setup();
  const older = new OwnedPeers(transport);
  older.claim('peer');
  const generation = older.generationOf('peer');
  new OwnedPeers(transport).claim('peer');

  older.disconnectIfOwned('peer', generation);

  expect(disconnect).not.toHaveBeenCalled();
});

test('forgets a gone link, while a close scheduled before still runs', () => {
  const { transport, disconnect } = setup();
  const owned = new OwnedPeers(transport);
  owned.claim('peer');
  const generation = owned.generationOf('peer');

  owned.forget('peer');
  expect(owned.peerIds()).toEqual([]);
  owned.disconnectIfOwned('peer');
  expect(disconnect).not.toHaveBeenCalled();

  owned.disconnectIfOwned('peer', generation);
  expect(disconnect).toHaveBeenCalledWith('peer');
});
