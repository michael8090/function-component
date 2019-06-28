import {Component, Components, getRoot, toFunctionComponent} from '../functionComponent';
import { View } from "../view";

const {MapItems} = Components;

const rootView = new View();

const {Root, batchedUpdates} = getRoot(rootView);

const instances: Array<Component<any, any>> = [];

const Dummy = toFunctionComponent(class extends Component<[Function?], undefined> {
    index: number;
    componentWillMount() {
        this.index = instances.length;
        instances.push(this);
    }
    componentWillUpdate(args: Function | undefined) {
        //
    }
    componentWillUnmount() {
        //
    }
    render(child: Function | undefined) {
        if (child !== undefined) {
            child(undefined);
        }
    }

});

let data: Array<{}>;

function UpdateItems() {
    for (let i = 0, l = data.length; i < l; i++) {
        Dummy(Dummy);
    }
}

function getKey(_: any, i: number) {
    return i;
}

function renderDummy() {
    Dummy(Dummy);
}

function UpdateItemsWithMapItems() {
    MapItems(
        //
        data,
        //
        getKey,
        //
        renderDummy
    );
}

function UpdateItemsWithBatchedUpdates() {
    batchedUpdates(() => {
        for (let i = 0, l = instances.length; i < l; i++) {
            instances[i].forceUpdate();
        }
    });
}

function createData(n: number) {
    data = new Array(n).fill(undefined).map(() => ({}));
}

export function init(n: number) {
    createData(n);
    // Root(UpdateItemsWithMapItems);
    Root(UpdateItems);
}

export function updateComponents() {
    // Root(UpdateItemsWithMapItems);
    // Root(UpdateItems);
    UpdateItemsWithBatchedUpdates();
}
