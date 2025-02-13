import {Queue} from './Queue';
export class MemoryPool {
    private pool = new Queue();
    constructor(private create: () => any) {}
    put(item: any) {
        this.pool.push(item);
    } 
    get() {
        const item = this.pool.shift();
        if (item === undefined) {
            return this.create();
        }
        return item;
    }
    clear() {
        this.pool.reset();
    }
}