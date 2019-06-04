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
    x: number;
    y: number;
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

type ListNode<T> = T & {
    n?: ListNode<T>;
    p?: ListNode<T>;
}

class List<T> {
    private head: ListNode<T> | undefined;
    private tail: ListNode<T> | undefined;

    reset() {
        this.head = undefined;
        this.tail = undefined;
    }

    add(v: T) {
        const value = v as T & ListNode<T>;
        if (this.head === undefined) {
            value.n = undefined;
            value.p = undefined;
            this.head = this.tail = value;
        } else {
            value.p = this.tail;
            this.tail!.n = value;
            this.tail = value;
        }
    }
    delete(node: ListNode<T>) {
        const p = node.p;
        const next = node.n;
        if (this.head === node) {
            this.head = next;
        }
        if (this.tail === node) {
            this.tail = p;
        }
        if (p !== undefined) {
            p.n = next;
        }
        if (next !== undefined) {
            next.p = p;
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

class Record<T extends Object> {
    private map: {
        [x : string]: {
            [y: string]: T | undefined;
        } | undefined;
    } = {};

    reset() {
        this.map = {};
    }
    put(x: number, y: number, v: T) {
        const {map} = this;
        const value = v ;
        let row = map[x];
        if (row === undefined) {
            row = {};
            map[x] = row;
        }
        row[y] = value;
    }
    get(x: number, y: number): T | undefined {
        const row = this.map[x];
        if (row !== undefined) {
            return row[y];
        }
        return undefined;
    }
    delete(x: number, y: number) {
        const row = this.map[x];
        if (row !== undefined) {
            row[y] = undefined;
        }
    }
}

const indexManager = new IndexManager();

let parentView: View | undefined;
let lastStackRecord: Record<StackNode> | undefined;
let lastList: List<StackNode> | undefined;
let currentList: List<StackNode> | undefined;
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
        if (lastStackRecord === undefined) {
            throw new Error(
                `A function component should be wrapped inside a Root (use getRoot())`
            );
        }
        const currentFn = f as IFunctionComponent<T>;
        indexManager.stackLength++;
        const stackLength = indexManager.stackLength;
        const indexInLayer = indexManager.getIndexInLayer()

        const lastNode = lastStackRecord.get(stackLength, indexInLayer);

        let currentNode: StackNode;
        let lastFn: IFunctionComponent;

        // for less GC
        if (lastNode !== undefined) {
            lastFn = lastNode.fn;

            lastList!.delete(lastNode);
            currentNode = lastNode;
            currentNode.fn = currentFn;
        }

        let view: NullableView;
        let needsAppend = false;

        if (lastFn! === currentFn) {
            if (vg.update !== undefined) {
                view = vg.update(data, lastNode!.view);
            }
        } else if (lastFn! === undefined) {
            // create
            currentNode = {
                fn: currentFn,
                x: stackLength,
                y: indexInLayer,
            };
            lastStackRecord.put(stackLength, indexInLayer, currentNode);

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
        }

        currentNode!.view = view;

        currentList!.add(currentNode!);

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
        lastStackRecord!.delete(lastNode.x, lastNode.y);
        lastList!.delete(lastNode);
    }
}
export function getRoot() {
    const cachedLastStackRecord: Record<StackNode> = new Record();
    const rootView = new View();
    let cachedLastList = new List<StackNode>();
    let cachedCurrentList = new List<StackNode>();

    return function Root(child: Function) {
        cachedCurrentList.reset();
        indexManager.reset();
        lastStackRecord = cachedLastStackRecord;
        lastList = cachedLastList;
        currentList = cachedCurrentList;
        parentView = rootView;
        
        child();

        lastList.forEachValue(disposeLeftViews);
        
        lastList.reset();
        
        // swap the two list
        cachedCurrentList = lastList;
        cachedLastList = currentList;

        return rootView;
    } as { (...args: any[]): View };
}
