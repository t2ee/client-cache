import * as Q from 'q';

export default class WaitGroup {
    private defer: Q.Deferred<void>;
    private mCount: number;
    constructor(count: number = 0) {
        this.defer = Q.defer<void>();
        this.mCount = count;
    }

    get count(): number {
        return this.mCount;
    }

    wait(): Promise<void> {
        if (this.mCount === 0) {
            return Promise.resolve();
        }
        return this.defer.promise as any;
    }

    done(count = 1) {
        if (this.mCount > 0) {
            this.mCount -= count;
            if (this.mCount === 0) {
                this.defer.resolve();
                this.defer = Q.defer<void>();
            }
        }
    }

    finish() {
        this.mCount = 0;
        this.defer.resolve();
        this.defer = Q.defer<void>();
    }

    add(count: number) {
        if (count >= 0) {
            this.mCount += count;
        }
    }
}
