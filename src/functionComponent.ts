import { BiDirectionLinkedList, BiDirectionLinkedListNode } from './BiDirectionLinkedList';
import { CrossList as CL, CrossListNode } from './CrossLinkedList';
import { MemoryPool } from './MemoryPool';

// accessing a Module Symbol has overhead
const CrossList = CL;

const addCrossListNode = CrossList.add;
const walkCrossListNode = CrossList.walk;

export interface ViewGenerator<TData extends any[] = any[], TView = {}> {
    create?(data: TData, parent: TView): TView | undefined;
    update?(data: TData, view: TView): TView | undefined;
    dispose?(view: TView): void;
    render?(data: TData): void;
}

interface IFunctionComponent<TData extends any[] = any[], TView = {}> {
    (...data: TData): void;
    vg: ViewGenerator<TData, TView>;
}

interface StackNode extends CrossListNode, BiDirectionLinkedListNode {
    f: IFunctionComponent;
    /**
     * isUpdated
     */
    // u?: boolean;
    /**
     * view generated by ViewGenerator
     */
    v?: any;
}

function disposeNode(node: StackNode) {
    // if (node.u !== true) {
    if (node.f.vg.dispose !== undefined) {
        node.f.vg.dispose(node.v);
    }
    // }
    // node.c = undefined;
    // node.nS = undefined;
    // node.u = false;
    // node.v = undefined;
    context!.memoryPool.put(node);
}

function removeFromLastListAndDispose(node: StackNode) {
    context!.lastList!.delete(node);
    disposeNode(node);
}

interface Context {
    // the variables shared by all function calls of a root
    /**
     * lastCallStack
     */
    lastCallStack: StackNode | undefined;
    /**
     * lastList
     */
    lastList: BiDirectionLinkedList<StackNode>;
    /**
     * currentCallStack
     */
    currentCallStack: StackNode | undefined;
    /**
     * currentList
     */
    currentList: BiDirectionLinkedList<StackNode>;

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

// // the variables shared by all function calls of a root
// let lastCallStack: StackNode | undefined;
// let lastList: BiDirectionLinkedList<StackNode> | undefined;
// let currentCallStack: StackNode | undefined;
// let currentList: BiDirectionLinkedList<StackNode> | undefined;

// let memoryPool: MemoryPool;

// let isInRoot = false;
// // root variables definition end

// // the variables shared inside a layer of a subtree
// let parentView: any | undefined;

// let parentInCurrentCallStack: StackNode | undefined;

// let preSiblingInCurrentCallStack: StackNode | undefined;

// let lastNode: StackNode | undefined;
// // subtree layer variables definition end

export function toFunctionComponent<TData extends any[], TView = {}>(vg: ViewGenerator<TData, TView>): (...data: TData) => void {
    function functionComponent() {
        const data = arguments as any as TData;
        // avoid accessing closure
        const currentContext = context;
        if (currentContext === undefined) {
            throw new Error(
                `A function component should be wrapped inside a Root (use getRoot())`
            );
        }
        const currentFn = functionComponent as IFunctionComponent<TData, TView>;
        let currentNode: StackNode;

        let lastFn: IFunctionComponent;
        let lastNodeNextSibling: StackNode | undefined;
        let lastNodeChild: StackNode | undefined;

        const {lastNode} = currentContext;
        if (lastNode !== undefined) {
            lastFn = lastNode.f;
            lastNodeNextSibling = lastNode.nS;
            lastNodeChild = lastNode.c;

            currentNode = lastNode;
        } else {
            currentNode = currentContext.memoryPool.get();
        }

        let isLastNodeDestroyed = false;

        if (lastFn! === currentFn) {
            // update
            if (vg.update !== undefined) {
                const view = vg.update(data, lastNode!.v);
                if (view !== currentNode.v) {
                    currentNode.v = view;
                }
            }
            // mark the node is updated, so don't dispose the view when tearing down the tree
            currentContext.lastList!.delete(lastNode!);
        } else if (lastFn! === undefined) {
            // create current view
            if (vg.create !== undefined) {
                currentNode.v = vg.create(data, currentContext.parentView);
            }
            currentNode.f = currentFn;
        } else {
            // dispose last view and create current view
            if (lastFn!.vg.dispose !== undefined) {
                walkCrossListNode(lastNode!, removeFromLastListAndDispose);
                // the node is completely gone and we'll take it never existed before
                isLastNodeDestroyed = true;
            }

            // create current view
            if (vg.create !== undefined) {
                currentNode.v = vg.create(data, currentContext.parentView);
            }
            currentNode.f = currentFn;
        }
        
        if (currentContext.currentCallStack !== undefined) {
            // add the currentNode to the currentCallStack
            addCrossListNode(currentNode, currentContext.parentInCurrentCallStack!, currentContext.preSiblingInCurrentCallStack);
        } else {
            // create currentStack
            currentContext.currentCallStack = currentNode;
        }

        currentContext.currentList!.add(currentNode);

        /** set the layer variables */
        // tell the next sibling, the pre sibling is me
        currentContext.preSiblingInCurrentCallStack = currentNode;
        currentContext.lastNode = lastNodeNextSibling;
        /** done setting the layer variables */

        // done with the node, now for the children

        if (currentFn.vg.render !== undefined) {
            const parentViewBackup = currentContext.parentView;
            const parentInCurrentCallStackBackup = currentContext.parentInCurrentCallStack;
            const preSiblingInCurrentCallStackBackup = currentContext.preSiblingInCurrentCallStack;
            const lastNodeBackup = currentContext.lastNode;
    
            const view = currentNode.v;
            if (view !== undefined) {
                currentContext.parentView = view;
            }
    
            currentContext.parentInCurrentCallStack = currentNode;
            
            currentContext.preSiblingInCurrentCallStack = undefined;

            if (isLastNodeDestroyed === true) {
                currentContext.lastNode = undefined;
            } else {
                currentContext.lastNode = lastNodeChild;
            }
    
            // !!!children enter!!!
            currentFn.vg.render(data);
            // !!!children done!!!
            
            if (currentContext.preSiblingInCurrentCallStack !== undefined) {
                currentContext.preSiblingInCurrentCallStack!.nS = undefined;
            }

            currentContext.parentView = parentViewBackup;
            currentContext.parentInCurrentCallStack = parentInCurrentCallStackBackup;
            currentContext.preSiblingInCurrentCallStack = preSiblingInCurrentCallStackBackup;
            currentContext.lastNode = lastNodeBackup;
        } else {
            currentNode.c = undefined;
        }
    }

    const f = functionComponent as IFunctionComponent<TData, TView>;
    f.vg = vg;
    return f;
}

function createStackNode() {
    return ({
        //
    });
}

export function getRoot<T>(rootView: T) {
    // let cachedLastStack: StackNode | undefined;
    // let cachedLastList = new BiDirectionLinkedList<StackNode>();
    // let cachedCurrentStack: StackNode | undefined;
    // let cachedCurrentList = new BiDirectionLinkedList<StackNode>();
    const cachedMemoryPool = new MemoryPool(createStackNode);

    const cachedContext: Context = {
        lastCallStack: undefined,
        lastList: new BiDirectionLinkedList<StackNode>(),
        currentCallStack: undefined,
        currentList: new BiDirectionLinkedList<StackNode>(),
    
        memoryPool: new MemoryPool(createStackNode),
    
        // isInRoot: false,
        // root variables definition end
    
        // the variables shared inside a layer of a subtree
        parentView: undefined,
    
        parentInCurrentCallStack: undefined,
    
        preSiblingInCurrentCallStack: undefined,
    
        lastNode: undefined,
    }

    return function Root(child: Function) {
        // lastCallStack = cachedLastStack;
        // lastNode = lastCallStack;
        // lastList = cachedLastList;

        // currentCallStack = cachedCurrentStack;
        // currentList = cachedCurrentList;
        // currentList.reset();
        // parentInCurrentCallStack = undefined;
        // preSiblingInCurrentCallStack = undefined;

        // parentView = rootView;

        // memoryPool = cachedMemoryPool;
        
        cachedContext.lastNode = cachedContext.lastCallStack;
        cachedContext.parentInCurrentCallStack = undefined;
        cachedContext.preSiblingInCurrentCallStack = undefined;
        cachedContext.parentView = rootView;

        context = cachedContext;

        child();
        
        if (cachedContext.preSiblingInCurrentCallStack !== undefined) {
            cachedContext.preSiblingInCurrentCallStack!.nS = undefined;
        }

        cachedContext.lastList.walk(disposeNode);

        context = undefined;
                
        // lastCallStack = undefined;

        // swap the two list
        // cachedCurrentStack = lastCallStack;
        // cachedLastStack = currentCallStack;

        cachedContext.lastCallStack = cachedContext.currentCallStack;
        cachedContext.currentCallStack = undefined;
        
        // swap the two list
        const lastList = cachedContext.lastList;
        cachedContext.lastList = cachedContext.currentList;
        cachedContext.currentList = lastList;
        cachedContext.currentList.reset();
    };
}
