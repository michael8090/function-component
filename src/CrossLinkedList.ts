interface CrossListNode {
    child?: this;
    nextSibling?: this;
}


const queue: CrossListNode[] = [];
const CrossList = {
    remove(node: CrossListNode, parent: CrossListNode, preSibling?: CrossListNode) {
        if (preSibling === undefined) {
            parent.child = node.nextSibling;
        } else {
            preSibling.nextSibling = node.nextSibling;
        }
    },

    add(node: CrossListNode, parent: CrossListNode, preSibling?: CrossListNode) {
        if (preSibling === undefined) {
            parent.child = node;
        } else {
            node.nextSibling = preSibling.nextSibling;
            preSibling.nextSibling = node;
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
        while(queue.length) {
            let node = queue.shift();
            while(node) {
                const {nextSibling, child} = node;
                fn(node);
                if (child) {
                    queue.push(child);
                }
                node = nextSibling;
            }
        }
    }
}

export {CrossListNode, CrossList};
