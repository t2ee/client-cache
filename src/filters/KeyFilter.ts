import * as _ from 'lodash';
import Filter from '../Filter';

export default class KeyFilter<V, R> implements Filter<V, R> {
    constructor(private pattern: string) {
    }

    doFilter(item: V): Promise<R> {
        return Promise.resolve(_.get(item, this.pattern) as R);
    }
}
