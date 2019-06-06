interface CrossListNode {
    /**
     * child
     */
    c?: this;
    /**
     * nextSibling
     */
    nS?: this;
}


const queue: CrossListNode[] = [];
const CrossList = {
    remove(node: CrossListNode, parent: CrossListNode, preSibling?: CrossListNode) {
        if (preSibling === undefined) {
            parent.c = node.nS;
        } else {
            preSibling.nS = node.nS;
        }
    },

    add(node: CrossListNode, parent: CrossListNode, preSibling?: CrossListNode) {
        if (preSibling === undefined) {
            parent.c = node;
        } else {
            node.nS = preSibling.nS;
            preSibling.nS = node;
        }
    },
    /**
     * walk inside the root, fn is called against root itself and every child of root
     * @param root 
     * @param fn 
     */
    walk(root: CrossListNode, fn: (node: CrossListNode) => void) {
        // todo: if the perf is not good, we can try LinkedList
        queue.push(root);
        while(queue.length !== 0) {
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
    }
}

export {CrossListNode, CrossList};
