import {Queue} from './Queue';
export class MemoryPool {
    private pool = new Queue();
    constructor(private create: () => any) {}
    put(item: any) {
        this.pool.push(item);
    } 
    get() {
        const item = this.pool.shift();
        if (item !== undefined) {
            return item;
        }
        return this.create();
    }
    clear() {
        this.pool.reset();
    }
}