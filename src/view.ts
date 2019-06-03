export class View {
    parent: View | undefined;
    children: View[] = [];
    append(child: View) {
        child.parent = this;
        this.children.push(child);
    }
    removeChild(child: View) {
        const i = this.children.indexOf(child);
        if (i !== -1) {
            this.children.splice(i, 1);
        }
    }
    dispose() {
        this.children.forEach(c => c.dispose());
        this.children = [];
        if (this.parent) {
            this.parent.removeChild(this);
        }
    }
}

type NullableView = View | undefined;

export interface ViewGenerator<TData> {
    create?(data: TData): NullableView;
    update?(data: TData, view: NullableView): NullableView;
    dispose?(view: NullableView): void;
    render?(data: TData): void;
}

interface IFunctionComponent<T = {}> {
    (data: T): void;
    vg: ViewGenerator<any>;
}

interface StackNode {
    fn: IFunctionComponent;
    view?: View;
}

interface StackRecord {
    [id: string]: StackNode | undefined;
}

class IdGenerator {
    stackLength = 0;
    indexInLayer = {};

    getId() {
        const { stackLength, indexInLayer: iIL } = this;
        let indexInLayer: number = iIL[stackLength];
        if (indexInLayer === undefined) {
            indexInLayer = 1;
        } else {
            indexInLayer++;
        }
        iIL[stackLength] = indexInLayer;
        //   return indexInLayer + ':' + stackLength
        // at most 1024 layers deep
        //   tslint:disable-next-line:no-bitwise
        return (indexInLayer << 10) + stackLength;
    }
    reset() {
        this.indexInLayer = {};
        this.stackLength = 0;
    }
}

const idGenerator = new IdGenerator();

let parentView: View | undefined;
let currentStackRecord: StackRecord | undefined;
let lastStackRecord: StackRecord | undefined;
export function toFunctionComponent<T extends Function>(fn: {
    (onCreate: Handler, onUpdate: Handler, onDispose: Handler): T;
}): T;
export function toFunctionComponent<T>(vg: ViewGenerator<T>): (data: T) => void;
export function toFunctionComponent<T>(input: any) {
    if (typeof input === 'function') {
        return markAsFunctionComponent(input);
    }
    const vg = input as ViewGenerator<T>;
    function f(data: T) {
        if (!currentStackRecord || !lastStackRecord) {
            throw new Error(
                `A function component should be wrapped inside a Root (use getRoot())`
            );
        }
        const currentFn = f as IFunctionComponent<T>;
        idGenerator.stackLength++;
        const id = idGenerator.getId();
        // = (currentStackRecord[id] = {
        //     fn: currentFn
        // });
        const lastNode = lastStackRecord[id];
        const lastFn = lastNode && lastNode.fn;

        let currentNode: StackNode;

        // for less GC
        if (lastNode) {
            currentNode = lastNode;
        }

        let view: NullableView;
        let needsAppend = false;

        if (lastFn === currentFn) {
            if (vg.update) {
                view = vg.update(data, lastNode!.view);
            }
            lastStackRecord[id] = undefined;
        } else if (!lastFn) {
            // create
            currentNode = {
                fn: currentFn
            };
            if (vg.create) {
                view = vg.create(data);
                needsAppend = true;
            }
        } else {
            // dipose last view and create current view
            if (lastFn.vg.dispose) {
                lastFn.vg.dispose(lastNode!.view);
            }

            if (vg.create) {
                view = vg.create(data);
                needsAppend = true;
            }

            lastStackRecord[id] = undefined;
        }

        currentStackRecord[id] = currentNode!;
        currentNode!.view = view;
        currentNode!.fn = currentFn;

        const parentBackup = parentView;
        if (view) {
            if (needsAppend && parentView) {
                parentView.append(view);
            }
            parentView = view;
        }

        if (currentFn.vg.render) {
            currentFn.vg.render(data);
        }

        parentView = parentBackup;

        idGenerator.stackLength--;
    }
    f.vg = vg;
    return f;
}

interface DummyFunction {
    (): undefined;
}

interface Handler {
    (handler: DummyFunction): void;
}

function markAsFunctionComponent<T extends Function>(fn: {
    (onCreate: Handler, onUpdate: Handler, onDispose: Handler): T;
}): T {
    let onCreate: DummyFunction | undefined;
    let onUpdate: DummyFunction | undefined;
    let onDispose: DummyFunction | undefined;
    const Component = fn(
        f => (onCreate = f),
        f => (onUpdate = f),
        f => (onDispose = f)
    );
    const Generator: ViewGenerator<any> = {
        render(data) {
            Component.apply(null, data);
        }
    };
    if (onCreate) {
        Generator.create = onCreate;
    }
    if (onUpdate) {
        Generator.update = onUpdate;
    }
    if (onDispose) {
        Generator.dispose = onDispose;
    }
    const FunctionComponent = toFunctionComponent(Generator);
    return (function() {
        FunctionComponent.apply(null, arguments);
    } as any) as T;
}

export function getRoot() {
    let cachedLastStackRecord: StackRecord = {};
    let cachedCurrentStackRecord: StackRecord = {};
    const rootView = new View();

    return function Root() {
        idGenerator.reset();
        lastStackRecord = cachedLastStackRecord;
        currentStackRecord = cachedCurrentStackRecord;
        parentView = rootView;
        for (let i = 0, l = arguments.length; i < l; i++) {
            arguments[i]();
        }
        cachedLastStackRecord = currentStackRecord;
        // tslint:disable-next-line:forin
        for (const key in lastStackRecord) {
            const lastNode = lastStackRecord[key];
            if (lastNode && lastNode.fn.vg.dispose) {
                lastNode.fn.vg.dispose(lastNode.view);
            }
        }

        lastStackRecord = {};
        cachedCurrentStackRecord = lastStackRecord;
        lastStackRecord = undefined;
        currentStackRecord = undefined;
        return rootView;
    } as { (...args: any[]): View };
}
