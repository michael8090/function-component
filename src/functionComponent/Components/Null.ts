import { Component, toFunctionComponent } from "../functionComponent";

// tslint:disable-next-line:no-shadowed-variable
const Null = toFunctionComponent(class Null extends Component<[Function?]> {
    //
});

export {Null};
