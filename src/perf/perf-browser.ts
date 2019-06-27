import * as _ from "lodash";
import * as process from "process";
import {createData, updateComponents} from './updateComponents';

const n = 500000;

createData(n);

function tick() {
    updateComponents();
    requestAnimationFrame(tick);
}

// tick();

function doBenchmark() {
    const suite = Benchmark.Suite();
    createData(n);
    updateComponents();
    const title = `update ${n * 2} components`;
    suite
        .add(title, updateComponents)
        .on("complete", function(this: any) {
            // tslint:disable-next-line:no-console
            console.log(title, this[0].stats);
        })
        .run();
};
// tslint:disable-next-line:no-var-requires
const benchmark = require("benchmark");
const Benchmark = benchmark.runInContext({ _, process });
(global as any).Benchmark = Benchmark;
(global as any).doBenchmark = doBenchmark;
(global as any).tick = tick;