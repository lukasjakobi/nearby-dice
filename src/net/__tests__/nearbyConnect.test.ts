import NearbyConnections from '@modules/nearby-connections';
import { AbortedError } from '@/lib';

import { NearbyTransport } from '../nearby/NearbyTransport';
import { ConnectFailedError } from '../transport';

jest.mock('@modules/nearby-connections', () => ({
  __esModule: true,
  default: { addListener: jest.fn(), requestConnection: jest.fn(), disconnect: jest.fn() },
}));

const native = jest.mocked(NearbyConnections!);

afterEach(() => jest.clearAllMocks());

test('cancelling a pending connect cancels the native request', async () => {
  let rejectRequest = (_error: Error) => {};

  native.requestConnection.mockReturnValue(new Promise((_, reject) => (rejectRequest = reject)));
  native.disconnect.mockImplementation(async () => rejectRequest(new Error('DISCONNECTED')));
  const controller = new AbortController();

  const connecting = new NearbyTransport().connect('host', controller.signal);
  controller.abort();

  await expect(connecting).rejects.toBeInstanceOf(AbortedError);
  expect(native.disconnect).toHaveBeenCalledWith('host');
});

test('a connection that completes as it is cancelled is closed again', async () => {
  native.requestConnection.mockResolvedValue({ authToken: 'K7M2P' });
  native.disconnect.mockResolvedValue(undefined);
  const controller = new AbortController();

  const connecting = new NearbyTransport().connect('host', controller.signal);
  controller.abort();

  await expect(connecting).rejects.toBeInstanceOf(AbortedError);
  expect(native.disconnect).toHaveBeenCalledWith('host');
});

test('a failed request without cancelling reports the endpoint', async () => {
  native.requestConnection.mockRejectedValue(new Error('CONNECTION_REJECTED'));

  await expect(new NearbyTransport().connect('host')).rejects.toEqual(
    new ConnectFailedError('host'),
  );
  expect(native.disconnect).not.toHaveBeenCalled();
});
