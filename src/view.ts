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

class IndexManager {
    stackLength = 0;
    private indexInLayer = {};

    getIndexInLayer() {
        const { stackLength, indexInLayer: iIL } = this;
        let indexInLayer: number = iIL[stackLength];
        if (indexInLayer === undefined) {
            indexInLayer = 1;
        } else {
            indexInLayer++;
        }
        iIL[stackLength] = indexInLayer;
        return indexInLayer;
    }
    reset() {
        this.indexInLayer = {};
        this.stackLength = 0;
    }
}

interface ListNode<T> {
    n?: ListNode<T>;
    p?: ListNode<T>;
}

class Record<T extends Object> {
    private map: {
        [x : string]: {
            [y: string]: T | undefined;
        } | undefined;
    } = {};
    private head: ListNode<T> | undefined;
    private tail: ListNode<T> | undefined;
    reset() {
        this.map = {};
        this.head = undefined;
        this.tail = undefined;
    }
    put(x: string, y: string, v: T) {
        const {map} = this;
        const value = v as T & ListNode<T>;
        let row = map[x];
        if (row === undefined) {
            row = {};
            map[x] = row;
        }
        // if (!row[y]) {
        row[y] = value;
        if (this.head === undefined) {
            value.n = undefined;
            value.p = undefined;
            this.head = this.tail = value;
        } else {
            value.p = this.tail;
            this.tail!.n = value;
            this.tail = value;
        }
        // }
    }
    get(x: string, y: string): T | undefined {
        const row = this.map[x];
        if (row !== undefined) {
            return row[y];
        }
        return undefined;
    }
    delete(x: string, y: string) {
        const row = this.map[x];
        if (row !== undefined) {
            const value = row[y] as (T & ListNode<T>) | undefined;
            if (value !== undefined) {
                const node = value;
                const p = node.p;
                const next = node.n;
                if (this.head === node) {
                    this.head = node.n;
                }
                if (this.tail === node) {
                    this.tail = node.p;
                }
                if (p !== undefined) {
                    p.n = next;
                }
                if (next !== undefined) {
                    next.p = p;
                }
                row[y] = undefined;
            }
        }
    }
    forEachValue(cb: (value: T) => void) {
        let head: ListNode<T> | undefined = this.head;
        while(head !== undefined) {
            cb(head as T);
            head = head.n;
        }
    }
}

const indexManager = new IndexManager();

let parentView: View | undefined;
let currentStackRecord: Record<StackNode> | undefined;
let lastStackRecord: Record<StackNode> | undefined;
export function toFunctionComponent<T extends Function>(fn: {
    (onCreate: Handler, onUpdate: Handler, onDispose: Handler): T;
}): T;
export function toFunctionComponent<T>(vg: ViewGenerator<T>): (data: T) => void;
export function toFunctionComponent<T>(input: any) {
    if (typeof input === "function") {
        return markAsFunctionComponent(input);
    }
    const vg = input as ViewGenerator<T>;
    function f(data: T) {
        if (currentStackRecord === undefined || lastStackRecord === undefined) {
            throw new Error(
                `A function component should be wrapped inside a Root (use getRoot())`
            );
        }
        const currentFn = f as IFunctionComponent<T>;
        indexManager.stackLength++;
        const stackLength = indexManager.stackLength;
        const indexInLayer = indexManager.getIndexInLayer() as any as string;

        const stackLengthString = stackLength as any as string;

        const lastNode = lastStackRecord.get(stackLengthString, indexInLayer);

        let currentNode: StackNode;
        let lastFn: IFunctionComponent;

        // for less GC
        if (lastNode !== undefined) {
            currentNode = lastNode;
            lastFn = lastNode.fn;
        }

        let view: NullableView;
        let needsAppend = false;

        if (lastFn! === currentFn) {
            if (vg.update !== undefined) {
                view = vg.update(data, lastNode!.view);
            }
            lastStackRecord.delete(stackLengthString, indexInLayer);
        } else if (lastFn! === undefined) {
            // create
            currentNode = {
                fn: currentFn
            };
            if (vg.create !== undefined) {
                view = vg.create(data);
                needsAppend = true;
            }
        } else {
            // dispose last view and create current view
            if (lastFn!.vg.dispose !== undefined) {
                lastFn!.vg.dispose(lastNode!.view);
            }

            if (vg.create !== undefined) {
                view = vg.create(data);
                needsAppend = true;
            }

            lastStackRecord.delete(stackLengthString, indexInLayer);
        }

        currentStackRecord.put(stackLengthString, indexInLayer, currentNode!);
        currentNode!.view = view;
        currentNode!.fn = currentFn;

        const parentBackup = parentView;
        if (view !== undefined) {
            if (needsAppend === true && parentView !== undefined) {
                parentView.append(view);
            }
            parentView = view;
        }

        if (currentFn.vg.render !== undefined) {
            currentFn.vg.render(data);
        }

        parentView = parentBackup;

        indexManager.stackLength--;
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
            Component(data);
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

function disposeLeftViews(lastNode: StackNode) {
    if (lastNode.fn.vg.dispose !== undefined) {
        lastNode.fn.vg.dispose(lastNode.view);
    }
}
export function getRoot() {
    let cachedLastStackRecord: Record<StackNode> = new Record();
    let cachedCurrentStackRecord: Record<StackNode> = new Record();
    const rootView = new View();

    return function Root() {
        indexManager.reset();
        lastStackRecord = cachedLastStackRecord;
        currentStackRecord = cachedCurrentStackRecord;
        parentView = rootView;
        for (let i = 0, l = arguments.length; i < l; i++) {
            arguments[i]();
        }
        cachedLastStackRecord = currentStackRecord;

        lastStackRecord.forEachValue(disposeLeftViews);

        lastStackRecord.reset();
        cachedCurrentStackRecord = lastStackRecord;
        lastStackRecord = undefined;
        currentStackRecord = undefined;
        return rootView;
    } as { (...args: any[]): View };
}
