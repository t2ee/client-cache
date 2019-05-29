import { expect } from 'chai';
import Filter from './Filter';
import Cache from './Cache';
import WaitGroup from './WaitGroup';

interface TestData {
    id?: string;
    c?: number;
}

class TestFilter implements Filter<TestData> {
    doFilter(item: TestData): Promise<TestData> {
        item.c ++;
        return Promise.resolve(item);
    }
}

function getId(d: TestData): string {
    return d.id;
}

describe('Cache', () => {
    describe('#filter()', () => {
        it('shuold apply filter', async () => {
            const cache = new Cache(getId, (id: string) => Promise.resolve({ id, c: 1 }));
            cache.addFilter(new TestFilter());
            const a = await cache.get('a');
            expect(a).to.eql({ id: 'a', c: 2 });
        });
    });

    describe('#resolve()', () => {
        it('shuold not resolve id that were not queued', async () => {
            const cache = new Cache(getId, (id: string) => Promise.resolve({ id: 'not exist', c: 1 }));
            cache.get('a');
        });
    });

    describe('#get()', () => {
        it('shuold return the result', async () => {
            const cache = new Cache(getId, (id: string) => Promise.resolve({ id, c: 1 }));
            const a1 = await cache.get('a1');
            const a2 = await cache.get('a2');
            expect(a1).to.eql({ id: 'a1', c: 1 });
            expect(a2).to.eql({ id: 'a2', c: 1 });
        });

        it('shuold catch error and return null', async () => {
            let error = '';
            const cache = new Cache(getId, (id: string) => { throw new Error('test'); });
            cache.setErrorHandler((e: Error) => { error = e.message ; });
            const a = await cache.get('a');
            expect(a).to.equal(null);
            expect(error).to.equal('test');
        });

        it('shuold catch error and skip caching', async () => {
            let error = '';
            const fetch = (id: string) => {
                if (error) {
                    return Promise.resolve({ id });
                }
                throw new Error('test');
            };
            const cache = new Cache(getId, fetch);
            cache.setErrorHandler((e: Error) => { error = e.message ; });
            const a1 = await cache.get('a');
            expect(a1).to.equal(null);
            expect(error).to.equal('test');

            const a2 = await cache.get('a');
            expect(a2).to.eql({ id: 'a' });
        });

        it('shuold return the same result for multile get of same id (async)', async () => {
            let lastValue = 0;
            const fetch = async (id: string) => {
                await new Promise(r => setTimeout(r, 100));
                lastValue = Math.random();
                return { id, c: lastValue };
            };

            const cache = new Cache(getId, fetch);
            const [a1, a2] = await Promise.all([cache.get('a'), cache.get('a')]);
            expect(a1).to.eql({ id: 'a', c: lastValue });
            expect(a2).to.eql({ id: 'a', c: lastValue });
        });

        it('shuold return the same result for multile get of same id (sync)', async () => {
            let lastValue = 0;
            const fetch = async (id: string) => {
                lastValue = Math.random();
                return { id, c: lastValue };
            };

            const cache = new Cache(getId, fetch);
            const a1 = await cache.get('a');
            await new Promise(r => setTimeout(r, 100));
            const a2 = await cache.get('a');

            expect(a1).to.eql({ id: 'a', c: lastValue });
            expect(a2).to.eql({ id: 'a', c: lastValue });
        });

        it('shuold handle concurrent fetch', async () => {
            const wg = new WaitGroup(4);
            const result: TestData[] = [];
            const cache = new Cache(getId, (id: string) => Promise.resolve({ id }));
            for (let i = 0; i < 4; i++) {
                (async (i: number) => {
                    const a = await cache.get(`a${i}`);
                    result.push(a);
                    wg.done(1);
                })(i + 1);
            }
            await wg.wait();
            expect(result).to.eql([{ id: 'a1' }, { id: 'a2' }, { id: 'a3' }, { id: 'a4' }]);
        });
    });

    describe('#batchGet()', () => {
        it('should get bulk list and not call single fetch', async () => {
            let error = '';
            const fetch = async (id: string) => {
                throw new Error('test');
            };

            const bulk = (ids: string[]) => {
                return Promise.resolve(ids.map(id => ({ id })));
            };

            const cache = new Cache(getId, fetch, bulk);
            cache.setErrorHandler((e: Error) => { error = e.message ; });
            const list = await cache.batchGet(['a', 'b']);

            expect(error).to.equal('');
            expect(list).to.eql([{ id: 'a' }, { id: 'b' }]);
        });

        it('should get bulk list with unique keys', async () => {

            const calledKeys: string[] = [];
            const bulk = (ids: string[]) => {
                return Promise.resolve(ids.map((id) => {
                    if (calledKeys.indexOf(id) > -1) {
                        return { id: '' };
                    }
                    calledKeys.push(id);
                    return { id };
                }));
            };

            const cache = new Cache(getId, null , bulk);
            const list = await cache.batchGet(['a', 'a', 'b']);

            expect(list).to.eql([{ id: 'a' }, { id: 'a' }, { id: 'b' }]);
        });

        it('should get bulk list without single cached result 1', async () => {
            const calledKeys: string[] = [];
            const fetch = async (id: string) => {
                calledKeys.push(id);
                return { id: id.repeat(2) };
            };

            const bulk = (ids: string[]) => {
                return Promise.resolve(ids.map((id) => {
                    calledKeys.push(id);
                    return { id };
                }));
            };

            const cache = new Cache(getId, fetch, bulk);
            const a = await cache.get('a');
            expect(a).to.eql({ id: 'aa' });
            const list = await cache.batchGet(['a', 'a', 'b']);

            expect(list).to.eql([{ id: 'aa' }, { id: 'aa' }, { id: 'b' }]);
        });

        it('should get bulk list without single cached result 2', async () => {
            let error = '';
            const fetch = async (id: string) => {
                return { id };
            };

            const bulk = (ids: string[]) => {
                error = 'test';
                return Promise.resolve([]);
            };

            const cache = new Cache(getId, fetch, bulk);
            cache.get('a');
            cache.get('b');
            const list = await cache.batchGet(['a', 'b']);
            expect(error).to.equal('');
            expect(list).to.eql([{ id: 'a' }, { id: 'b' }]);
        });

        it('should get bulk list without single queued result', async () => {
            const calledKeys: string[] = [];
            const fetch = async (id: string) => {
                calledKeys.push(id);
                await new Promise(r => setTimeout(r, 100));
                return Promise.resolve({ id: id.repeat(2) });
            };

            const bulk = (ids: string[]) => {
                return Promise.resolve(ids.map((id) => {
                    if (calledKeys.indexOf(id) > -1) {
                        return { id: '' };
                    }
                    calledKeys.push(id);
                    return { id };
                }));
            };

            const cache = new Cache(getId, fetch, bulk);
            const deferedA = cache.get('a');
            const list = await cache.batchGet(['a', 'a', 'b']);

            const a = await deferedA;
            expect(a).to.eql({ id: 'aa' });

            expect(list).to.eql([{ id: 'b' }, { id: 'aa' }, { id: 'aa' }]);
        });

        it('should ignore invalid result', async () => {
            const bulk = (ids: string[]) => {
                return Promise.resolve(ids.map((id) => {
                    if (id === 'b') return null;
                    return { id };
                }));
            };

            const cache = new Cache(getId, null, bulk);
            const list = await cache.batchGet(['a', 'b', 'c']);

            expect(list).to.eql([{ id: 'a' }, { id: 'c' }, null]);
        });

        it('should cross check multiple bulk requests', async () => {
            const calledKeys: string[] = [];
            const bulk = (ids: string[]) => {
                return Promise.resolve(ids.map((id) => {
                    if (calledKeys.indexOf(id) > -1) {
                        return { id: '' };
                    }
                    calledKeys.push(id);
                    return { id };
                }));
            };

            const cache = new Cache(getId, null , bulk);
            const [list1, list2, list3] = await Promise.all([
                cache.batchGet(['a', 'b', 'c']),
                cache.batchGet(['c']),
                cache.batchGet(['b', 'c', 'd']),
            ]);

            expect(list1).to.eql([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
            expect(list2).to.eql([{ id: 'c' }]);
            expect(list3).to.eql([{ id: 'd' }, { id: 'b' }, { id: 'c' }]);
        });

        it('should call single fetch when bulk fetch is not available', async () => {
            const fetch = async (id: string) => {
                return { id };
            };

            const cache = new Cache(getId, fetch);
            const list = await cache.batchGet(['a', 'b']);

            expect(list).to.eql([{ id: 'a' }, { id: 'b' }]);
        });
    });

    describe('#flush()', () => {
        it('shuold flush all data', async () => {
            function getId(d: TestData): string {
                return d.id;
            }

            let c = 1;
            const cache = new Cache(getId, (id: string) => Promise.resolve({ id, c: c++ }));
            const a1 = await cache.get('a1');
            expect(a1).to.eql({ id: 'a1', c: 1 });
            cache.flush();
            const a12 = await cache.get('a1');
            expect(a12).to.eql({ id: 'a1', c: 2 });
        });
    });

    describe('#add()', () => {
        it('shuold add data to cache and does not request', async () => {
            let lastValue = 0;
            const fetch = async (id: string) => {
                await new Promise(r => setTimeout(r, 100));
                lastValue = Math.random();
                return { id, c: lastValue };
            };

            const cache = new Cache(getId, fetch);
            cache.add({ id: 'a', c: 0 });
            const [a1, a2] = await Promise.all([cache.get('a'), cache.get('a')]);
            expect(a1).to.eql({ id: 'a', c: 0 });
            expect(a2).to.eql({ id: 'a', c: 0 });
        });
    });

    describe('#all()', () => {
        it('shuold return all data in memory and in flight', async () => {
            let lastValue = 0;
            const fetch = async (id: string) => {
                await new Promise(r => setTimeout(r, 100));
                lastValue = Math.random();
                return { id, c: lastValue };
            };

            const cache = new Cache(getId, fetch);
            cache.add({ id: 'b', c: 0 });
            const p = cache.get('a');
            const all = await cache.all();
            const a = all.find(item => item.id === 'a');
            const b = all.find(item => item.id === 'b');
            const a2 = await p;
            expect(a).to.eql({ id: 'a', c: lastValue });
            expect(a).to.eql(a2);
            expect(a2).to.eql({ id: 'a', c: lastValue });
            expect(b).to.eql({ id: 'b', c: 0 });
        });

        it('shuold return all data use fetchAll', async () => {
            const fetchAll = async () => {
                await new Promise(r => setTimeout(r, 10));
                return [{ id: 'a', c: 0 }, { id: 'b', c: 1 }];
            };

            const cache = new Cache(getId, null, null, fetchAll);
            const all = await cache.all();
            expect(all.find(item => item.id === 'a')).to.eql({ id: 'a', c: 0 });
            expect(all.find(item => item.id === 'b')).to.eql({ id: 'b', c: 1 });
            expect(await cache.get('b')).to.eql({ id: 'b', c: 1 });
        });
    });
});
