# function-component
Function as component

TODO:

- [ ] 通知树里的某一个FunctionComponent更新：Root提供一个forceUpdate(fn: Function, x: number, y: number)函数，通过指定x和y来调用该函数
- [ ] 实现shouldUpdate(data: any, view: any): boolean，以允许组件跳过自己及子节点的调用：需要将内部的lastList和currentList实现为二维链表{parent, preSibling, nextSibling, childrenHead}, 这样一个子树就可以由一个节点来表示，当shouldUpdate为false时，用lastList里的节点来充当currentList的子树，并跳过FunctionComponent的生命周期函数。
