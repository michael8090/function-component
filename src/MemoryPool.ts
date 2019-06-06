export class MemoryPool {
    private pool: any[] = [];
    constructor(private create: () => any) {}
    put(item: any) {
        // if (this.pool.includes(item)) {
        //     // tslint:disable-next-line:no-debugger
        //     debugger;
        // }
        this.pool.push(item);
    } 
    get() {
        const item = this.pool.pop();
        if (item === undefined) {
            return this.create();
        }
        return item;
    }
    clear() {
        this.pool = [];
    }
}