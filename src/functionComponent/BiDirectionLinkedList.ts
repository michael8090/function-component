export interface BiDirectionLinkedListNode {
    /**
     * next node in a bi directional list 
     */
    bn?: BiDirectionLinkedListNode;
    /**
     * previous node in a bi directional list 
     */
    bp?: BiDirectionLinkedListNode;
}

export class BiDirectionLinkedList<T extends BiDirectionLinkedListNode> {
    private head: BiDirectionLinkedListNode | undefined;
    private tail: BiDirectionLinkedListNode | undefined;

    reset() {
        this.head = undefined;
        this.tail = undefined;
    }

    /**
     * assume that the node is not connected to any other linked list
     * @param v 
     */
    add(value: T) {
        if (this.head === undefined) {
            this.head = this.tail = value;
        } else {
            value.bp = this.tail;
            this.tail!.bn = value;
            this.tail = value;
        }
    }
    delete(node: T) {
        const p = node.bp;
        const next = node.bn;
        const {head, tail} = this;
        if (head === tail) {
            if (node !== this.head) {
                throw new Error('node is not inside the list');
            }
            this.head = this.tail = undefined;
            return;
        }
        if (head === node) {
            this.head = next;
            return;
        }
        if (tail === node) {
            this.tail = p;
            return;
        }
        p!.bn = next;
        next!.bp = p;
    }

    walk(cb: (value: T) => void) {
        let {head} = this;
        if (head === undefined) {
            return;
        }
        const {tail} = this;
        while(head !== tail) {
            const next: BiDirectionLinkedListNode | undefined = head!.bn;
            // cb may delete `head.bn`
            // we take head as immutable when iterating
            cb(head as T);
            head = next;
        }
        if (tail) {
            cb(tail as T);
        }
    }
}