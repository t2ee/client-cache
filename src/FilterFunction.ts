import Filter from './Filter';

// tslint:disable-next-line:function-name
export default function FilterFunction<V>(doFilter: (item: V) => Promise<V>): Filter<V> {
    return { doFilter };
}