import {Queue, QueueNode} from './Queue';

interface CrossListNode extends QueueNode {
    /**
     * child
     */
    c?: this;
    /**
     * nextSibling
     */
    nS?: this;
}


const queue: Queue<CrossListNode> = new Queue();
const CrossList = {
    remove(node: CrossListNode, parent: CrossListNode, preSibling: CrossListNode | undefined) {
        if (preSibling === undefined) {
            parent.c = node.nS;
        } else {
            preSibling.nS = node.nS;
        }
    },

    add(node: CrossListNode, parent: CrossListNode, preSibling: CrossListNode | undefined) {
        if (preSibling === undefined) {
            parent.c = node;
        } else {
            // node.nS = preSibling.nS;
            preSibling.nS = node;
        }
    },
    /**
     * walk inside the root, fn is called against root itself and every child of root
     * @param root 
     * @param fn 
     */
    walk(root: CrossListNode, fn: (node: CrossListNode) => void) {
        queue.push(root);
        while(queue.isEmpty() !== true) {
            let node = queue.shift();
            while(node !== undefined) {
                const {nS: nextSibling, c: child} = node;
                fn(node);
                if (child !== undefined) {
                    queue.push(child);
                }
                node = nextSibling;
            }
        }
    },

    /**
     * walk inside the root, fn is called against root itself and every child of root
     * @param root 
     * @param fn 
     */
    walkAlongModifiedList(root: CrossListNode, fn: (node: CrossListNode) => void) {
        queue.push(root);
        while(queue.isEmpty() !== true) {
            let node = queue.shift();
            while(node !== undefined) {
                fn(node);
                const {c: child} = node;
                if (child !== undefined) {
                    queue.push(child);
                }
                node = node.nS;
            }
        }
    }
}

export {CrossListNode, CrossList};
