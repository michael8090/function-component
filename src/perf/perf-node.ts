import {createData, updateComponents} from './updateComponents';

const t0 = Date.now();
const itemsCount = 500000;
const n = 100;
let count = 100;

createData(itemsCount);

while(count--) {
    updateComponents();
}

// tslint:disable-next-line:no-console
console.log(`update ${itemsCount * 2} components for ${n} times: ${Date.now() - t0}`);
