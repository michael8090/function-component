import {init, updateComponents} from './updateComponents';

const itemsCount = 50000;
const n = 100;

init(itemsCount);

const t0 = Date.now();

let count = n;
while(count--) {
    updateComponents();
}

// tslint:disable-next-line:no-console
console.log(`update ${itemsCount * 2} components for ${n} times: ${Date.now() - t0}`);
