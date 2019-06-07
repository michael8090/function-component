import { toFunctionComponent } from 'src/functionComponent';
import { ObjectView } from './JsonView';

const Property = toFunctionComponent<[string | number, any, Function?], ObjectView<string | number, any>>({
    create([propName, value], parent) {
        if (typeof value === 'function') {
            value = value();
        }
        const node = new ObjectView(propName, value);
        parent.add(node);
        return node;
    },
    update([propName, value], node) {
        const parent = node.parent!;

        const {propName: oldPropName, value: oldValue} = node;
        if (typeof value === 'function') {
            value = oldValue;
        }
        if (value !== oldValue) {
            node.value = value;
            parent.set(propName, value);
        }
        return node;
    },
    dispose(node) {
        const parent = node.parent!;
        const i = parent.children.indexOf(node);
        parent.remove(i);
    },
    render([propName, value, child]) {
        if (child) {
            child();
        }
    }
})

const JsonComponents = {
    Property,
};

export {JsonComponents};