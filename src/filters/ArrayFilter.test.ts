import { expect } from 'chai';
import ArrayFilter from './ArrayFilter';
import FilterFunction from '../FilterFunction';

describe('ArrayFilter', () => {
    describe('#doFilter()', () => {
        it('should return each items in array by +1', async () => {
            const filter = new ArrayFilter(FilterFunction(async (n: number) => n + 1));
            const result = await filter.doFilter([1, 2, 3, 4]);
            expect(result).to.have.lengthOf(4);
            expect(result).to.eql([2, 3, 4, 5]);
        });
    });
});
