interface ListNode {
    child?: ListNode;
    nextSibling?: ListNode;
}


const CrossList = {
    remove(node: ListNode, parent: ListNode, preSibling?: ListNode) {
        if (preSibling === undefined) {
            parent.child = node.nextSibling;
        } else {
            preSibling.nextSibling = node.nextSibling;
        }
    },

    add(node: ListNode, parent: ListNode, preSibling?: ListNode) {
        if (preSibling === undefined) {
            parent.child = node;
        } else {
            node.nextSibling = preSibling.nextSibling;
            preSibling.nextSibling = node;
        }
    },
    /**
     * walk inside the root, fn is called against every child of root, but not root itself
     * @param root 
     * @param fn 
     */
    walk(root: ListNode, fn: (node: ListNode, parent: ListNode, preSibling?: ListNode) => void) {
        let parent = root;
        let preSibling: ListNode | undefined;
        let node = root.child;
        while (node) {
            // fn may change the node, backup first to ensure the visiting is stable
            const {nextSibling, child} = node;
            fn(node, parent, preSibling);
            if (nextSibling !== undefined) {
                preSibling = node;
                node = nextSibling;
            } else {
                preSibling = undefined;
                parent = node;
                node = child;
            }
        }
    }
}

export {ListNode, CrossList};
