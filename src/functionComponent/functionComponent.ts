import { CrossList as CL, CrossListNode } from './CrossLinkedList';
import { MemoryPool } from './MemoryPool';

// accessing a Module Symbol has overhead
const CrossList = CL;

const addCrossListNode = CrossList.add;
const walkCrossListNode = CrossList.walk;
const walkModifiedCrossListNode = CrossList.walkAlongModifiedList;
const removeCrossListNode = CrossList.remove;

interface ConstructorOf<T> {new (...args: any[]): T}

interface StackNode extends CrossListNode {
    C: ConstructorOf<Component<any, any>>;
    /**
     * component instance
     */
    i?: Component<any, any>;
    /**
     * component function
     */
    f?: (...data: any[]) => void;

    /**
     * marked to be force updated
     */
    // fu?: boolean;
}

function disposeNode(node: StackNode) {
    const instance = node.i;
    if (instance !== undefined) {
        instance.__isUnmounted = true;
        instance.cachedArgs = undefined;
        instance.__context = undefined;
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
    isBatchedUpdate: boolean;
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

export class Component<TData extends any[] = any[], TView = {}> {
    // tslint:disable-next-line:variable-name
    __stackNode: StackNode;
    // tslint:disable-next-line:variable-name
    __forcedUpdate: boolean;
    // tslint:disable-next-line:variable-name
    __isUnmounted: boolean;

    // tslint:disable-next-line:variable-name
    __context: Context | undefined;

    cachedArgs: TData = [] as any;
    view: TView | undefined;
    onInit?(parent: TView): void;
    shouldComponentUpdate?(...data: TData): boolean;
    componentWillMount?(...data: TData): void;
    componentWillUpdate?(...data: TData): void;
    componentWillUnmount?(): void;
    render?(...data: TData): void;
    forceUpdate() {
        if (this.__isUnmounted === true) {
            // tslint:disable-next-line:no-console
            console.error(`trying to update an unmounted component: ${this.constructor.name}`);
            return;
        }
        if (context !== undefined && context.isBatchedUpdate === true) {
            this.__forcedUpdate = true;
            return;
        }
        const {cachedArgs, __context} = this;
        context = __context!;

        context.lastNode = this.__stackNode;

        this.__forcedUpdate = true;
        this.__stackNode.f!.apply(null, cachedArgs);
        context = undefined;
    }
}

export function toFunctionComponent<TData extends any[], TView = {}>
    (vg: ConstructorOf<Component<TData, TView>>): (...data: TData) => void {
    // const {componentWillMount: componentWillMount, componentWillUpdate: componentWillUpdate, render} = vg;
    const Cls = vg;
    function functionComponent(MACRO_ARGS: any) {
        // const data = arguments as any as TData;
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

        let isUpdateSkipped = false;

        if (lastCls! === currentCls) {
            // update
            const instance = currentNode.i!;
            if (instance.__forcedUpdate !== true) {
                if (instance.shouldComponentUpdate !== undefined) {
                    isUpdateSkipped = instance.shouldComponentUpdate('MACRO_ARGS') === false;
                }
            } else {
                instance.__forcedUpdate = false;
            }
            if (isUpdateSkipped === false) {
                if (instance.componentWillUpdate !== undefined) {
                    instance.componentWillUpdate('MACRO_ARGS');
                }
            }
        } else {
            let isCreate = false;

            if (lastCls! === undefined) {
                if (currentContext.lastCallStack === undefined) {
                    // create currentStack
                    currentContext.lastCallStack = currentNode;
                }
                isCreate = true;
            } else {
                // dispose last view and create current view
                removeCrossListNode(lastNode!, currentContext.parentInCurrentCallStack!, currentContext.preSiblingInCurrentCallStack);
                const instance = lastNode!.i!;
                instance.__isUnmounted = true;
                instance.cachedArgs = undefined;
                instance.__context = undefined;
                if (instance.componentWillUnmount !== undefined) {
                    instance.componentWillUnmount();
                }
                const lastNodeChild = lastNode!.c;
                lastNode!.c = undefined;
                if (lastNodeChild !== undefined) {
                    walkCrossListNode(lastNodeChild, disposeNode);
                }
                // the node is completely gone and we'll not visit its child
    
    
                isCreate = true;
            }

            if (isCreate === true) {
                // create current view
                // todo: if use currentCls, 3.2ms to 4.8ms
                const instance = new currentCls('MACRO_ARGS');
                instance.__stackNode = currentNode;
                instance.__context = currentContext;
                if (instance.onInit !== undefined) {
                    instance.onInit(currentContext.parentView);
                }
                if (instance.componentWillMount !== undefined) {
                    (instance.componentWillMount as any)('MACRO_ARGS');
                }
                currentNode.i = instance;
                currentNode.C = currentCls;
                currentNode.nS = undefined;
                currentNode.c = undefined;
                currentNode.f = f;
                // currentNode.qn = undefined;
    
                if (currentContext.parentInCurrentCallStack !== undefined) {
                    // add the currentNode to the currentCallStack
                    addCrossListNode(currentNode, currentContext.parentInCurrentCallStack, currentContext.preSiblingInCurrentCallStack);
                }
            }
        }

        const currentInstance = currentNode.i!;
        const cachedArgs = currentInstance.cachedArgs as any[];
        
        // this line will be compiled, don't change any thing inside it.
        // tslint:disable-next-line:no-unused-expression
        'MACRO_CACHED_ARGS';
        // cachedArgs[0] = _0;

        if (isUpdateSkipped === false) {
            // done with the node, now for the children

            if (currentInstance.render !== undefined) {
                const parentViewBackup = currentContext.parentView;
                const parentInCurrentCallStackBackup = currentContext.parentInCurrentCallStack;
        
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
                (currentInstance.render as any)('MACRO_ARGS');
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
            }
        }

        /** set the layer variables */
        // tell the next sibling, the pre sibling is me
        currentContext.preSiblingInCurrentCallStack = currentNode;
        currentContext.lastNode = lastNodeNextSibling;
        /** done setting the layer variables */
    }

    const hooks = [
        'shouldComponentUpdate',
        'componentWillMount',
        'componentWillUpdate',
        'render'
    ];

    const proto = Cls.prototype;
    // let argsString: string = '';
    let argsCount = 0;
    for (let i = 0, hl = hooks.length; i < hl; i++) {
        const hookName = hooks[i];
        const fn = proto[hookName] as Function;
        if (fn !== undefined) {
            // const args = getArguments(fn);
            const count = fn.length;
            if (count > argsCount) {
                argsCount = count;
                // argsString = args;
            }
        }
    }

    // avoid name collision
    const ars: string[] = [];
    const cacheArgs: string[] = [];
    for (let i = 0; i < argsCount; i++) {
        ars.push('_' + i);
        cacheArgs.push(`(cachedArgs[${i}] !== ${'_'+i}) && (cachedArgs[${i}] = ${'_'+i});`);
    }
    const argsString = ars.join(',');
    const cacheArgsString = cacheArgs.join('\n');

    // tslint:disable-next-line:prefer-const
    let f: any;
    const newFunctionString = functionComponent.toString()
        .replace(/('|")MACRO_ARGS('|")/g, argsString)
        .replace(/('|")MACRO_CACHED_ARGS('|")/g, cacheArgsString)
        .replace(new RegExp(functionComponent.name + '.*\\)'), `${Cls.name}FunctionComponent(${argsString})`);
    // tslint:disable-next-line:no-eval
    eval('f = ' + newFunctionString);

    // use the compiled version is 60% faster
    // and I see when use the original function, there are many "Builtins_CallFunction_ReceiverIsNotNullOrUndefined"
    // and when use compiled version, they are gone
    // funny v8...
    // tslint:disable-next-line:no-eval
    // eval('f = ' + functionComponent.toString());
    return f;
    // return functionComponent as any;
}

function createStackNode() {
    return ({
        //
    });
}

const Root = toFunctionComponent(class extends Component<[Function]> {
    render(child: Function) {
        child();
    }
})

export function getRoot<T>(rootView: T) {
    const cachedContext: Context = {
        // the variables shared by all function calls of a root

        lastCallStack: undefined,
        memoryPool: new MemoryPool(createStackNode),
        isBatchedUpdate: false,
    
        // root variables definition end
    
        // the variables shared inside a layer of a subtree
        parentView: undefined,
    
        parentInCurrentCallStack: undefined,
    
        preSiblingInCurrentCallStack: undefined,
    
        lastNode: undefined,
    }

    function forceUpdate(node: StackNode) {
        const instance = node.i!;
        if (instance.__forcedUpdate === true) {
            instance.forceUpdate();
        }
    }

    return ({
        Root(child: Function) {
            cachedContext.lastNode = cachedContext.lastCallStack;
            cachedContext.parentInCurrentCallStack = undefined;
            cachedContext.preSiblingInCurrentCallStack = undefined;
            cachedContext.parentView = rootView;
    
            context = cachedContext;
    
            Root(child);
    
            context = undefined;
        },
        batchedUpdates(fn: Function) {
            context = cachedContext;
            context.isBatchedUpdate = true;
            fn();
            context.isBatchedUpdate = false;
            context = undefined;

            const {lastCallStack} = cachedContext;
            if (lastCallStack !== undefined) {
                walkModifiedCrossListNode(lastCallStack, forceUpdate)
            }
        }
    });
}
