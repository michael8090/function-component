export class View {
    parent: View | undefined;
    children: View[] = [];
    add(child: View) {
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
