import { Component, toFunctionComponent } from "../functionComponent";

// tslint:disable-next-line:no-shadowed-variable
const Group = toFunctionComponent(class Group extends Component<[Function?]> {
    render([child]: [Function?]) {
        if (child) {
            child();
        }
    }
});

export {Group};
