import { resetStores } from '@/test/stores';

// Before each test rather than after: a screen still mounted would re-render outside act().
beforeEach(resetStores);
