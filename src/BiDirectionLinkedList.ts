type BiDirectionLinkedListNode<T> = T & {
    n?: BiDirectionLinkedListNode<T>;
    p?: BiDirectionLinkedListNode<T>;
}

class BiDirectionLinkedList<T> {
    private head: BiDirectionLinkedListNode<T> | undefined;
    private tail: BiDirectionLinkedListNode<T> | undefined;

    reset() {
        this.head = undefined;
        this.tail = undefined;
    }

    /**
     * assume that the node is not connected to any other linked list
     * @param v 
     */
    add(v: T) {
        const value = v as T & BiDirectionLinkedListNode<T>;
        if (this.head === undefined) {
            this.head = this.tail = value;
        } else {
            value.p = this.tail;
            this.tail!.n = value;
            this.tail = value;
        }
    }
    delete(node: BiDirectionLinkedListNode<T>) {
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
        let head: BiDirectionLinkedListNode<T> | undefined = this.head;
        while(head !== undefined) {
            const next = head.n;
            // cb may delete `head.n`
            // we take head as immutable when iterating
            cb(head as T);
            head = next;
        }
    }
}