import * as _ from "lodash";
import * as process from "process";
import {Component, Components, getRoot, toFunctionComponent} from './functionComponent';
import { View } from "./view";

const {MapItems} = Components;

const rootView = new View();

const Root = getRoot(rootView);

const Dummy = toFunctionComponent(class extends Component<[Function?], undefined> {
    componentWillMount() {
        //
    }
    componentWillUpdate(args: [Function?]) {
        //
    }
    componentWillUnmount() {
        //
    }
    render([child]: [Function?]) {
        if (child !== undefined) {
            child();
        }
    }

});

let data: undefined[] = new Array(50000);

function UpdateItems() {
    for (let i = 0, l = data.length; i < l; i++) {
        Dummy(Dummy);
    }
}

function UpdateItemsWithMapItems() {
    MapItems(
        //
        data,
        //
        (box, i) => i,
        //
        () => {
            Dummy(Dummy)
        }
    );
}

Root(UpdateItemsWithMapItems);
// Root(UpdateItems);

function updateComponents() {
    Root(UpdateItemsWithMapItems);
    // Root(UpdateItems);
}

function tick() {
    updateComponents();
    requestAnimationFrame(tick);
}

tick();

function doBenchmark() {
    const n = 50000;
    const suite = Benchmark.Suite();
    data = new Array(n);
    updateComponents();
    const title = `update ${n} components`;
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

// doBenchmark();
