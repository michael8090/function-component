import { CrossList as CL, CrossListNode } from './CrossLinkedList';
import { MemoryPool } from './MemoryPool';

// accessing a Module Symbol has overhead
const CrossList = CL;

const addCrossListNode = CrossList.add;
const walkCrossListNode = CrossList.walk;
const removeCrossListNode = CrossList.remove;

interface ConstructorOf<T> {new (...args: any[]): T}

export class Component<TData extends any[] = any[], TView = {}> {
    view: TView | undefined;
    componentWillMount?(data: TData, parent: TView): void;
    componentWillUpdate?(data: TData): void;
    componentWillUnmount?(): void;
    render?(data: TData): void;
}

interface StackNode extends CrossListNode {
    C: ConstructorOf<Component<any, any>>;
    /**
     * component instance
     */
    i?: Component<any, any>;
}

function disposeNode(node: StackNode) {
    const instance = node.i;
    if (instance !== undefined) {
        if (instance.componentWillUnmount !== undefined) {
            instance.componentWillUnmount();
        }
        node.i = undefined;
    }

    // node.c = undefined;
    // node.nS = undefined;
    context!.memoryPool.put(node);
}

interface Context {
    // the variables shared by all function calls of a root
    /**
     * lastCallStack
     */
    lastCallStack: StackNode | undefined;

    /**
     * memoryPool
     */
    memoryPool: MemoryPool;
    // root variables definition end

    // the variables shared inside a layer of a subtree
    /**
     * parentView
     */
    parentView: any | undefined;

    /**
     * parentInCurrentCallStack
     */
    parentInCurrentCallStack: StackNode | undefined;

    /**
     * preSiblingInCurrentCallStack
     */
    preSiblingInCurrentCallStack: StackNode | undefined;

    /**
     * lastNode
     */
    lastNode: StackNode | undefined;
    // subtree layer variables definition end
}

let context: Context | undefined;

export function toFunctionComponent<TData extends any[], TView = {}>(vg: ConstructorOf<Component<TData, TView>>): (...data: TData) => void {
    // const {componentWillMount: componentWillMount, componentWillUpdate: componentWillUpdate, render} = vg;
    const Cls = vg;
    return function functionComponent() {
        const data = arguments as any as TData;
        // avoid accessing closure
        const currentContext = context;
        if (currentContext === undefined) {
            throw new Error(
                `A function component should be wrapped inside a Root (use getRoot())`
            );
        }
        const currentCls = Cls;
        let currentNode: StackNode;

        let lastCls: ConstructorOf<Component<any, any>>;
        let lastNodeNextSibling: StackNode | undefined;

        const {lastNode} = currentContext;
        if (lastNode !== undefined) {
            lastCls = lastNode.C;
            lastNodeNextSibling = lastNode.nS;

            currentNode = lastNode;
        } else {
            currentNode = currentContext.memoryPool.get();
        }

        let isCreate = false;

        if (lastCls! === currentCls) {
            // update
            const instance = currentNode.i;
            if (instance!.componentWillUpdate !== undefined) {
                instance!.componentWillUpdate(data);
            }
        } else if (lastCls! === undefined) {
            isCreate = true;
        } else {
            // dispose last view and create current view
            removeCrossListNode(lastNode!, currentContext.parentInCurrentCallStack!, currentContext.preSiblingInCurrentCallStack);
            const lastNodeChild = lastNode!.c;
            lastNode!.c = undefined;
            if (lastNodeChild !== undefined) {
                walkCrossListNode(lastNodeChild, disposeNode);
            }
            // the node is completely gone and we'll not visit its child


            isCreate = true;
        }

        if (currentContext.lastCallStack === undefined) {
            // create currentStack
            currentContext.lastCallStack = currentNode;
        }

        if (isCreate === true) {
            // create current view
            const instance = new Cls(data);
            if (instance.componentWillMount !== undefined) {
                instance.componentWillMount(data, currentContext.parentView);
            }
            currentNode.i = instance;
            currentNode.C = currentCls;
            currentNode.nS = undefined;
            currentNode.c = undefined;

            if (currentContext.parentInCurrentCallStack !== undefined) {
                // add the currentNode to the currentCallStack
                addCrossListNode(currentNode, currentContext.parentInCurrentCallStack, currentContext.preSiblingInCurrentCallStack);
            }
        }

        /** set the layer variables */
        // tell the next sibling, the pre sibling is me
        currentContext.preSiblingInCurrentCallStack = currentNode;
        currentContext.lastNode = lastNodeNextSibling;
        /** done setting the layer variables */


        // done with the node, now for the children

        const currentInstance = currentNode.i!;

        if (currentInstance.render !== undefined) {
            const parentViewBackup = currentContext.parentView;
            const parentInCurrentCallStackBackup = currentContext.parentInCurrentCallStack;
            const preSiblingInCurrentCallStackBackup = currentContext.preSiblingInCurrentCallStack;
            const lastNodeBackup = currentContext.lastNode;
    
            const view = currentInstance.view;
            if (view !== undefined) {
                currentContext.parentView = view;
            }
    
            currentContext.parentInCurrentCallStack = currentNode;
            
            currentContext.preSiblingInCurrentCallStack = undefined;

            // const lastNodeChild = lastNode && lastNode.c;
            // it's the same as above one
            const lastNodeChild = currentNode.c;

            currentContext.lastNode = lastNodeChild;
    
            // !!!children enter!!!
            currentInstance.render(data);
            // !!!children done!!!
            
            const preSiblingInCurrentCallStack = currentContext.preSiblingInCurrentCallStack as StackNode | undefined;
            if (preSiblingInCurrentCallStack !== undefined) {
                const nodeToBeDisposed = preSiblingInCurrentCallStack.nS;
                if (nodeToBeDisposed !== undefined) {
                    walkCrossListNode(nodeToBeDisposed, disposeNode);
                    preSiblingInCurrentCallStack.nS = undefined;
                }
            } else if (lastNodeChild !== undefined) {
                lastNode!.c = undefined;
                walkCrossListNode(lastNodeChild, disposeNode);
            }

            currentContext.parentView = parentViewBackup;
            currentContext.parentInCurrentCallStack = parentInCurrentCallStackBackup;
            currentContext.preSiblingInCurrentCallStack = preSiblingInCurrentCallStackBackup;
            currentContext.lastNode = lastNodeBackup;
        }
    }
}

function createStackNode() {
    return ({
        //
    });
}

const Root = toFunctionComponent(class extends Component<[Function]> {
    render([child]: [Function]) {
        child();
    }
})

export function getRoot<T>(rootView: T) {
    const cachedMemoryPool = new MemoryPool(createStackNode);

    const cachedContext: Context = {
        // the variables shared by all function calls of a root

        lastCallStack: undefined,
        memoryPool: new MemoryPool(createStackNode),
    
        // root variables definition end
    
        // the variables shared inside a layer of a subtree
        parentView: undefined,
    
        parentInCurrentCallStack: undefined,
    
        preSiblingInCurrentCallStack: undefined,
    
        lastNode: undefined,
    }

    return function (child: Function) {
        cachedContext.lastNode = cachedContext.lastCallStack;
        cachedContext.parentInCurrentCallStack = undefined;
        cachedContext.preSiblingInCurrentCallStack = undefined;
        cachedContext.parentView = rootView;

        context = cachedContext;

        Root(child);

        context = undefined;
    };
}
