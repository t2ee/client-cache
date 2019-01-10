import { expect } from 'chai';
import Filter from './Filter';

describe('Filter', () => {
    class TestFilter implements Filter<number> {
        doFilter(item: number): Promise<number> {
            return Promise.resolve(item);
        }
    }

    describe('#doFilter()', () => {
        it('shuold return the same', async () => {
            const filter = new TestFilter();
            const result = await filter.doFilter(1);
            expect(result).to.equal(1);
        });
    });
});
