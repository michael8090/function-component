import { View } from '../view';

export class ObjectView<
    TPropertyName extends string | number | symbol,
    TPropertyValue,
    TSelfPropertyName extends keyof TPropertyValue = keyof TPropertyValue
    > extends View<ObjectView<TSelfPropertyName, TPropertyValue[TSelfPropertyName]>, ObjectView<any, {[k in TPropertyName]: TPropertyValue}>> {
    constructor(public propName: TPropertyName, public value: TPropertyValue) {
        super();
    }

    add(child: ObjectView<TSelfPropertyName, TPropertyValue[TSelfPropertyName]>) {
        super.add(child);
        this.set(child.propName, child.value);
    }
    remove(i: number) {
        super.remove(i);
        const child = this.children[i];
        delete this.value[child.propName];
    }
    set(childPropertyName: TSelfPropertyName, childPropertyValue: TPropertyValue[TSelfPropertyName]) {
        this.value[childPropertyName] = childPropertyValue;
    }
    dispose() {
        super.dispose();
    }
}

export class PrimitiveView<
    TPropertyName extends string | number | symbol,
    TPropertyValue extends (string | number),
    > extends View<never, ObjectView<any, {[k in TPropertyName]: TPropertyValue}>> {
    constructor(public propName: TPropertyName, public value: TPropertyValue) {
        super();
    }

    add(child: never) {
        throw new Error('Primitive could not have child');
    }
    remove(i: number) {
        throw new Error('Primitive could not have child');
    }
}
