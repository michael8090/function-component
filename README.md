# function-component
Function as component

Performance
react demo：https://codesandbox.io/s/zealous-framework-m6gwg  (toggle the checkbox to stop threejs updating，and type in `100000` to see how the perf goes with 100000 components)

FunctionComponent：https://github.com/michael8090/function-component  (yarn start，type `doBenchmark()` in the console，or tick() to use chrome developer tool to analyse the performance)


|                   | updating components | duration | GC                          |
|-------------------|---------------------|----------|-----------------------------|
| React             | 100,000             | 70ms     | frequent major and minor GC |
| FunctionComponent | 100,000             | 4.6ms    | almost no GC                |
|                   |                     |          |                             |

TODO:

- [x] forceUpdate
- [x] shouldComponentUpdate
- [x] Keyed Component
- [x] batchedUpdates


Won't DO:

- [ ] remove `componentWillUpdate` and `componentWillMount`


Why

At first I want a really fast virtual DOM implementation to drive a webGL based CAD program our team write. So I keep digging and get a fascinating idea: I can use the call stack which is a tree to describe the virtual tree, and as the calling goes on, I diff the old tree and the new one on the fly. Here we can see, in React, we always need to create a new tree to diff it with the old one, while in this library, we don't need to create a new node to do the diff, as when we do a function call, we have all the information we need: the type of the current function, the props(the input arguments), and the corresponding old node. So I successfully avoid the overhead of creating new node for component updating ( but for component creating, I still need to create a new virtual node to insert it to the old virtual tree), and gain a satisfying performance improvement.

But latter on, as I review how a user can write his code with the library, I find the lifecycle hooks he writes always get executed when doing the diff. It's true that I can make the diff very fast, but I cannot control the complexity of the lifecycle hooks, and the hooks lie on the hot execution path unfortunately, which in the end defeats the whole purpose of creating a performant virtual DOM driven program. Briefly speaking, no matter how fast I can make the virtual DOM diffing algorithm, the codes by the users lying on the hot executing path will make the whole program slow. 

So I let it go and decide we should not write a program that has user writing codes lying on the hot execution path. In other words, we need to shift from the React paradigm to the one that can keep the high performance of the whole program. Currently we're happy with a reactive programming approach.

Having that said, the idea behind the library is still enlightening to me, and it can make a function aware of its execution state (such as how many times it gets called and at which position it gets called). I'll keep it in mind and see how it fits other situations.
