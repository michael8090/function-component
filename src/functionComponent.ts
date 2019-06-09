import { BiDirectionLinkedList, BiDirectionLinkedListNode } from './BiDirectionLinkedList';
import { CrossList as CL, CrossListNode } from './CrossLinkedList';
import { MemoryPool } from './MemoryPool';

// accessing a Module Symbol has overhead
const CrossList = CL;

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
    memoryPool.put(node);
}

function removeFromLastListAndDispose(node: StackNode) {
    lastList!.delete(node);
    disposeNode(node);
}

// the variables shared by all function calls of a root
let lastCallStack: StackNode | undefined;
let lastList: BiDirectionLinkedList<StackNode> | undefined;
let currentCallStack: StackNode | undefined;
let currentList: BiDirectionLinkedList<StackNode> | undefined;

let memoryPool: MemoryPool;

let isInRoot = false;
// root variables definition end

// the variables shared inside a layer of a subtree
let parentView: any | undefined;

let parentInLastCallStack: StackNode | undefined;
let parentInCurrentCallStack: StackNode | undefined;

let preSiblingInLastCallStack: StackNode | undefined;
let preSiblingInCurrentCallStack: StackNode | undefined;

/**
 * 在当前层，上一个兄弟节点是否需要被回收
 * presibling 改变时，旧的值不会再被访问了，所以这时回收它是安全的
 */
let preSiblingNeedToBeRecycled: boolean = false;
// subtree layer variables definition end

export function toFunctionComponent<TData extends any[], TView = {}>(vg: ViewGenerator<TData, TView>): (...data: TData) => void {
    function functionComponent() {
        const data = arguments as any as TData;
        if (isInRoot === undefined) {
            throw new Error(
                `A function component should be wrapped inside a Root (use getRoot())`
            );
        }
        const currentFn = functionComponent as IFunctionComponent<TData, TView>;

        // create first, as memory pool will recycle lastNode latter
        const currentNode: StackNode = memoryPool.get();
        currentNode.c = undefined;
        currentNode.nS = undefined;
        // currentNode.u = false;
        currentNode.v = undefined;
        currentNode.f = currentFn;
        currentNode.bn = undefined;
        currentNode.bp = undefined;

        currentList!.add(currentNode);

        let lastNode: StackNode | undefined;
        let lastNodeShouldBeRecycled = false;

        if (currentCallStack !== undefined) {
            // navigating in the lastCallStack: if we already visited a node of last tree in the same layer, just visit the right node of the last visited node
            if (preSiblingInLastCallStack !== undefined) {
                lastNode = preSiblingInLastCallStack.nS;
            } else {
                // navigating in the lastCallStack: if it's the first time we visit the layer, we need to visit the first child of the layer parent
                if (parentInLastCallStack !== undefined) {
                    lastNode = parentInLastCallStack.c;
                }
            }

            // add the currentNode to the currentCallStack
            CrossList.add(currentNode, parentInCurrentCallStack!, preSiblingInCurrentCallStack);
        } else {
            // navigating in the lastCallStack: if it's the first visit, just use the root of last tree
            lastNode = lastCallStack;

            // create currentStack
            currentCallStack = currentNode;
        }

        let lastFn: IFunctionComponent;

        if (lastNode !== undefined) {
            lastFn = lastNode.f;
        }

        let view: any;

        if (lastFn! === currentFn) {
            // update
            if (vg.update !== undefined) {
                view = vg.update(data, lastNode!.v);
            } else {
                view = lastNode!.v;
            }
            // mark the node is updated, so don't dispose the view when tearing down the tree
            lastList!.delete(lastNode!);
            // we should not recycle the node now, as we may need to visit the children and nextSiblings in the future
            // we'll leave the siblings to do the job (or the parent)
            lastNodeShouldBeRecycled = true;
        } else if (lastFn! === undefined) {
            // create current view
            if (vg.create !== undefined) {
                view = vg.create(data, parentView);
            }
        } else {
            // dispose last view and create current view
            if (lastFn!.vg.dispose !== undefined) {
                if (parentInLastCallStack !== undefined) {
                    CrossList.remove(lastNode!, parentInLastCallStack, preSiblingInLastCallStack);
                }
                CrossList.walk(lastNode!, removeFromLastListAndDispose);
                // the node is completely gone and we'll take it never existed before
                lastNode = undefined;
            }

            // create current view
            if (vg.create !== undefined) {
                view = vg.create(data, parentView);
            }
        }
        

        currentNode.v = view;

        if (lastNode !== undefined) {
            // preSibling is about to move, we can recycle safely it now
            if (preSiblingNeedToBeRecycled === true) {
                memoryPool.put(preSiblingInLastCallStack);
                // no need to change it now
                // preSiblingNeedToBeRecycled = false;
            }

            // tell the next sibling call that the last visited sibling is me
            preSiblingInLastCallStack = lastNode;
            preSiblingNeedToBeRecycled = lastNodeShouldBeRecycled;
        }

        // tell the next sibling, the pre sibling is me
        preSiblingInCurrentCallStack = currentNode;

        // done with the node, now for the children

        if (currentFn.vg.render !== undefined) {
            const parentViewBackup = parentView;

            const parentInLastCallStackBackup = parentInLastCallStack;
            const preSiblingInLastCallStackBackup = preSiblingInLastCallStack;
            const preSiblingNeedToBeRecycledBackup = preSiblingNeedToBeRecycled;
    
            const parentInCurrentCallStackBackup = parentInCurrentCallStack;
            const preSiblingInCurrentCallStackBackup = preSiblingInCurrentCallStack;
    
            parentInLastCallStack = lastNode;
            preSiblingInLastCallStack = undefined;
            preSiblingNeedToBeRecycled = false;
    
            parentInCurrentCallStack = currentNode;
            preSiblingInCurrentCallStack = undefined;
    
            if (view !== undefined) {
                parentView = view;
            }

            // !!!children enter!!!
            currentFn.vg.render(data);
            // !!!children done!!!

            if (preSiblingNeedToBeRecycled as boolean === true) {
                // not child takes over it
                // the parent (me) should do the job
                memoryPool.put(preSiblingInLastCallStack);
            }

            parentView = parentViewBackup;

            parentInLastCallStack = parentInLastCallStackBackup;
            preSiblingInLastCallStack = preSiblingInLastCallStackBackup;
            preSiblingNeedToBeRecycled = preSiblingNeedToBeRecycledBackup;

    
            parentInCurrentCallStack = parentInCurrentCallStackBackup;
            preSiblingInCurrentCallStack = preSiblingInCurrentCallStackBackup;
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
    let cachedLastStack: StackNode | undefined;
    let cachedLastList = new BiDirectionLinkedList<StackNode>();
    let cachedCurrentStack: StackNode | undefined;
    let cachedCurrentList = new BiDirectionLinkedList<StackNode>();
    const cachedMemoryPool = new MemoryPool(createStackNode);

    return function Root(child: Function) {
        lastCallStack = cachedLastStack;
        lastList = cachedLastList;
        parentInLastCallStack = undefined;
        preSiblingInLastCallStack = undefined;
        preSiblingNeedToBeRecycled = false;

        currentCallStack = cachedCurrentStack;
        currentList = cachedCurrentList;
        currentList.reset();
        parentInCurrentCallStack = undefined;
        preSiblingInCurrentCallStack = undefined;

        parentView = rootView;

        memoryPool = cachedMemoryPool;
        
        isInRoot = true;
        child();
        isInRoot = false;

        if (preSiblingNeedToBeRecycled as boolean === true) {
            // not child takes over it
            // the parent (me) should do the job
            memoryPool.put(preSiblingInLastCallStack);
        }

        lastList.walk(disposeNode);
                
        lastCallStack = undefined;

        // swap the two list
        cachedCurrentStack = lastCallStack;
        cachedLastStack = currentCallStack;
        
        // swap the two list
        cachedCurrentList = lastList;
        cachedLastList = currentList;

        parentView = undefined;
    };
}
