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
        if (this.head === node) {
            this.head = next;
        }
        if (this.tail === node) {
            this.tail = p;
        }
        if (p !== undefined) {
            p.bn = next;
        }
        if (next !== undefined) {
            next.bp = p;
        }
        node.bp = undefined;
        node.bn = undefined;
    }

    walk(cb: (value: T) => void) {
        let head = this.head;
        while(head !== undefined) {
            const next = head.bn;
            // cb may delete `head.bn`
            // we take head as immutable when iterating
            cb(head as T);
            head = next;
        }
    }
}