import { expect } from 'chai';
import KeyFilter from './KeyFilter';
import ArrayFilter from './ArrayFilter';

describe('KeyFilter', () => {
    describe('#doFilter()', () => {
        it('should return plucked value', async () => {
            const filter = new KeyFilter('key');
            const result = await filter.doFilter({ key: 'a', value: 'vA' });
            expect(result).to.equal('a');
        });
        it('should return plucked values of each item in array', async () => {
            const filter = new ArrayFilter(new KeyFilter('key'));
            const result = await filter.doFilter([{ key: 'a', value: 'vA' }, { key: 'b', value: 'vB' }]);
            expect(result).to.have.lengthOf(2);
            expect(result).to.eql(['a', 'b']);
        });
    });
});
