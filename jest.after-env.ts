import { resetStores } from '@/test/stores';

// A suite's first render loads its modules lazily; on a cold CI cache that alone can pass 5 s.
jest.setTimeout(15_000);

// Before each test rather than after: a screen still mounted would re-render outside act().
beforeEach(resetStores);
