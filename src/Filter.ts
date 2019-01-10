export default interface Filter<V, R = V> {
    doFilter(item: V): Promise<R>;
}
