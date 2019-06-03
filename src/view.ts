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
    put(x: number, y: number, v: T) {
        const value = v as T & ListNode<T>;
        let row = this.map[x];
        if (!row) {
            row = {};
            this.map[x] = row;
        }
        if (!row[y]) {
            row[y] = value;
            if (!this.head) {
                value.n = undefined;
                value.p = undefined;
                this.head = this.tail = value;
            } else {
                value.p = this.tail;
                this.tail!.n = value;
                this.tail = value;
            }
        }
    }
    get(x: number, y: number): T | undefined {
        const row = this.map[x];
        return row && row[y];
    }
    delete(x: number, y: number) {
        const row = this.map[x];
        if (row) {
            const value = row[y] as (T & ListNode<T>) | undefined;
            if (value) {
                const node = value;
                const p = node.p;
                const next = node.n;
                if (this.head === node) {
                    this.head = node.n;
                }
                if (this.tail === node) {
                    this.tail = node.p;
                }
                if (p) {
                    p.n = next;
                }
                if (next) {
                    next.p = p;
                }
                row[y] = undefined;
            }
        }
    }
    forEachValue(cb: (value: T) => void) {
        let head: ListNode<T> | undefined = this.head;
        while(head) {
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
        if (!currentStackRecord || !lastStackRecord) {
            throw new Error(
                `A function component should be wrapped inside a Root (use getRoot())`
            );
        }
        const currentFn = f as IFunctionComponent<T>;
        indexManager.stackLength++;
        const stackLength = indexManager.stackLength;
        const indexInLayer = indexManager.getIndexInLayer();
        // const id = idGenerator.getId();
        // = (currentStackRecord[id] = {
        //     fn: currentFn
        // });
        const lastNode = lastStackRecord.get(stackLength, indexInLayer);
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
            lastStackRecord.delete(stackLength, indexInLayer);
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
            // dispose last view and create current view
            if (lastFn.vg.dispose) {
                lastFn.vg.dispose(lastNode!.view);
            }

            if (vg.create) {
                view = vg.create(data);
                needsAppend = true;
            }

            lastStackRecord.delete(stackLength, indexInLayer);
        }

        currentStackRecord.put(stackLength, indexInLayer, currentNode!);
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
        // tslint:disable-next-line:forin
        // for (const key in lastStackRecord) {
        //     const lastNode = lastStackRecord[key];
        //     if (lastNode && lastNode.fn.vg.dispose) {
        //         lastNode.fn.vg.dispose(lastNode.view);
        //     }
        // }
        lastStackRecord.forEachValue(lastNode => {
            if (lastNode.fn.vg.dispose) {
                lastNode.fn.vg.dispose(lastNode.view);
            }
        })

        lastStackRecord = new Record();
        cachedCurrentStackRecord = lastStackRecord;
        lastStackRecord = undefined;
        currentStackRecord = undefined;
        return rootView;
    } as { (...args: any[]): View };
}
