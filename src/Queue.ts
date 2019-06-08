export interface QueueNode {
    /**
     * next node
     */
    qn?: QueueNode;
}

export class Queue<T extends QueueNode = {}> {
    private head: QueueNode | undefined;
    private tail: QueueNode | undefined;

    isEmpty() {
        return this.head === undefined;
    }

    push(node: T) {
        if (this.head === undefined) {
            this.head = this.tail = node;
        } else {
            this.tail!.qn = node;
            this.tail = node;
        }
    }

    shift(): T | undefined {
        const {head, tail} = this;
        if (head === tail) {
            const node = tail;
            this.head = this.tail = undefined;
            return node as T | undefined;
        } else {
            const node = head!;
            this.head = head!.qn;
            return node as T;
        }
    }

    reset() {
        this.head = this.tail = undefined;
    }
}
