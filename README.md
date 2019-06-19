# function-component
Function as component

TODO:

- [ ] forceUpdate
- [ ] 实现shouldComponentUpdate(data: any, view: any): boolean，以允许组件跳过自己及子节点的调用：需要将内部的lastList和currentList实现为二维链表{parent, preSibling, nextSibling, childrenHead}, 这样一个子树就可以由一个节点来表示，当shouldUpdate为false时，用lastList里的节点来充当currentList的子树，并跳过FunctionComponent的生命周期函数。
- [x] Keyed Component
