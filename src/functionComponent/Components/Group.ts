import { Component, toFunctionComponent } from "../functionComponent";

// tslint:disable-next-line:no-shadowed-variable
const Group = toFunctionComponent(class Group extends Component<[Function?]> {
    render(child: Function | undefined) {
        if (child !== undefined) {
            child();
        }
    }
});

export {Group};
