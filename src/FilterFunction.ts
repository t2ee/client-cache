import Filter from './Filter';

class FilterWrapper<V> implements Filter<V> {
    constructor(public doFilter: (item: V) => Promise<V>) {
    }
}

// tslint:disable-next-line:function-name
export default function FilterFunction<V>(func: (item: V) => Promise<V>): Filter<V> {
    return new FilterWrapper(func);
}