import { expect } from 'chai';
import WaitGroup from './WaitGroup';

describe('WaitGroup', () => {
    describe('#count()', () => {
        it('shuold return count', () => {
            const wg = new WaitGroup(10);
            expect(wg.count).to.equal(10);
        });
    });

    describe('#count()', () => {
        it('shuold return correct count after addition', () => {
            const wg = new WaitGroup(10);
            wg.add(1);
            expect(wg.count).to.equal(11);
            wg.add(10);
            expect(wg.count).to.equal(21);
        });
    });

    describe('#done()', () => {
        it('shuold correctly minus count', () => {
            const wg = new WaitGroup(10);
            wg.done(1);
            expect(wg.count).to.equal(9);
        });
        it('shuold stop at 0', () => {
            const wg = new WaitGroup(1);
            wg.done(1);
            expect(wg.count).to.equal(0);
            wg.done(1);
            expect(wg.count).to.equal(0);
        });
    });

    describe('#wait()', () => {
        it('shuold be resolved immedialtely if no jobs present', async () => {
            const wg = new WaitGroup();
            await wg.wait();
        });

        it('shuold be resolved once all jobs done', async () => {
            const wg = new WaitGroup(5);
            setTimeout(
                () => {
                    wg.done();
                    wg.done();
                    wg.done();
                    wg.done();
                    wg.done();
                },
                100);
            await wg.wait();
        });
    });

    describe('#finish()', () => {
        it('shuold resolve all jobs ', async () => {
            const wg = new WaitGroup(5);
            setTimeout(() => wg.finish(), 100);
            await wg.wait();
        });
    });
});
