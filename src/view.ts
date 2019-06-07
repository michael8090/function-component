export class View<TChild extends View<any, any>, TParent extends View<any, any>> {
    parent: TParent | undefined;
    children: TChild[] = [];
    add(child: TChild) {
        child.parent = this;
        this.children.push(child);
    }
    remove(i: number) {
        if (i !== -1) {
            const child = this.children[i];
            child.parent = undefined;
            this.children.splice(i, 1);
        }
    }
    /**
     * do the cleaning work here
     */
    dispose() {
        for (let l = this.children.length - 1, i = l; i > 0; i--) {
            const c = this.children[i];
            c.dispose();
            this.remove(i);
        }

        this.children = [];
    }
}
