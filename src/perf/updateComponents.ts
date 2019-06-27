import {Component, Components, getRoot, toFunctionComponent} from '../functionComponent';
import { View } from "../view";

const {MapItems} = Components;

const rootView = new View();

const Root = getRoot(rootView);

const Dummy = toFunctionComponent(class extends Component<[Function?], undefined> {
    componentWillMount() {
        //
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

createData(50000);

Root(UpdateItemsWithMapItems);
// Root(UpdateItems);

export function createData(n: number) {
    data = new Array(n).fill(undefined).map(() => ({}));
}

export function updateComponents() {
    Root(UpdateItemsWithMapItems);
    // Root(UpdateItems);
}
