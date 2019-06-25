import {createData, updateComponents} from './updateComponents';

const t0 = Date.now();
const itemsCount = 500000;
let n = 100;

createData(itemsCount);

while(n--) {
    updateComponents();
}

// tslint:disable-next-line:no-console
console.log(`update ${itemsCount * 2} components for ${n} times: ${Date.now() - t0}`);
