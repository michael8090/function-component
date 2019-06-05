export interface ViewGenerator<TData = {}, TView = {}> {
    create?(data: TData, parent: TView): TView | undefined;
    update?(data: TData, view: TView): TView | undefined;
    dispose?(view: TView): void;
    render?(data: TData): void;
}

interface IFunctionComponent<TData = {}, TView = {}> {
    (data: TData): void;
    vg: ViewGenerator<TData, TView>;
}

interface StackNode {
    fn: IFunctionComponent;
    view?: any;
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

type LinkedListNode<T> = T & {
    n?: LinkedListNode<T>;
    p?: LinkedListNode<T>;
}

class LinkedList<T> {
    private head: LinkedListNode<T> | undefined;
    private tail: LinkedListNode<T> | undefined;

    reset() {
        this.head = undefined;
        this.tail = undefined;
    }

    /**
     * assume that the node is not connected to any other linked list
     * @param v 
     */
    add(v: T) {
        const value = v as T & LinkedListNode<T>;
        if (this.head === undefined) {
            this.head = this.tail = value;
        } else {
            value.p = this.tail;
            this.tail!.n = value;
            this.tail = value;
        }
    }
    delete(node: LinkedListNode<T>) {
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
        node.p = undefined;
        node.n = undefined;
    }

    forEachValue(cb: (value: T) => void) {
        let head: LinkedListNode<T> | undefined = this.head;
        while(head !== undefined) {
            const next = head.n;
            // cb may delete `head.n`
            // we take head as immutable when iterating
            cb(head as T);
            head = next;
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

let parentView: any | undefined;
let lastStackRecord: Record<StackNode> | undefined;
let lastList: LinkedList<StackNode> | undefined;
let currentList: LinkedList<StackNode> | undefined;
export function toFunctionComponent<T extends Function>(fn: {
    (onCreate: Handler, onUpdate: Handler, onDispose: Handler): T;
}): T;
export function toFunctionComponent<TData, TView = {}>(vg: ViewGenerator<TData, TView>): (data: TData) => void;
export function toFunctionComponent<TData, TView>(input: any) {
    if (typeof input === "function") {
        return markAsFunctionComponent(input);
    }
    const vg = input as ViewGenerator<TData, TView>;
    function f(data: TData) {
        if (lastStackRecord === undefined) {
            throw new Error(
                `A function component should be wrapped inside a Root (use getRoot())`
            );
        }
        const currentFn = f as IFunctionComponent<TData, TView>;
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

        let view: any;

        if (lastFn! === currentFn) {
            if (vg.update !== undefined) {
                view = vg.update(data, lastNode!.view);
            } else {
                view = lastNode!.view;
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
                view = vg.create(data, parentView);
            }
        } else {
            // dispose last view and create current view
            if (lastFn!.vg.dispose !== undefined) {
                lastFn!.vg.dispose(lastNode!.view);
                // todo: remove all the nodes beneath it 
            }

            if (vg.create !== undefined) {
                view = vg.create(data, parentView);
            }
        }

        currentNode!.view = view;

        currentList!.add(currentNode!);

        const parentBackup = parentView;
        if (view !== undefined) {
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
        // lastList!.delete(lastNode);
    }
}
export function getRoot<T>(rootView: T) {
    const cachedLastStackRecord: Record<StackNode> = new Record();
    let cachedLastList = new LinkedList<StackNode>();
    let cachedCurrentList = new LinkedList<StackNode>();

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
    };
}
