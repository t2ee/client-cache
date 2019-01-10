
<p align="center">
    <a href="https://www.npmjs.com/package/bulkcache">
        <img src="https://badge.fury.io/js/bulkcache.svg">
    </a>
    <a href="https://travis-ci.org/joesonw/bulkcache">
        <img src="https://img.shields.io/travis/joesonw/bulkcache/master.svg?style=flat-square">
    </a>
    <a href="https://coveralls.io/r/joesonw/bulkcache?branch=master">
        <img src="https://img.shields.io/coveralls/joesonw/bulkcache/master.svg?style=flat-square">
    </a>
</p>

## Install

`npm i bulkcache -S`

## Usage

```
import { Cache, FilterFunction } from 'bulkcache';

interface User {
    id: number;
    name: string;
    email: string;
}

function idGetter(user: User) {
    return user.id;
}

async function fetch(id: number) {
    return await YourAPI.fetchUser(id);
}

async function bulkFetch(ids: number[]) {
    return await YourAPI.fetchALotOfUsers(ids);
}

function allIWantIsANameFilter(user: User) {
    return user.name;
}

const cache = new Cache(idGetter, fetch, bulkFetch);
cache.addFilter(FilterFunction(allIWantIsANameFilter));

 // open your Chrome Developer tools, witness miracles!
console.log(await cache.fetch(1)); // this should produce one network request
console.log(await cache.fetch(1)); // this should not produce any network request

cache.fetch(2);// this should produce one network request. NOTICE!!!, we did not wait for its network request to return
console.log(await cache.fetch(2)); // this should not produce any network request

console.log(await cache.batchGet([1, 2])) // this should not produce any network request
console.log(await cache.batchGet([1, 2, 3, 4])) // this should produce one network request with batch requerst for id 3 and 4.
```
