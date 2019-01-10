import Filter from '../Filter';

export default class ArrayFilter<V> implements Filter<V[]> {
    constructor(private filter: Filter<V>) {
    }

    doFilter(array: V[]): Promise<V[]> {
        return Promise.all(array.map(item => this.filter.doFilter(item)));
    }
}
