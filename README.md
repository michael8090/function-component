# function-component
Function as component

Performance
react demo：https://codesandbox.io/s/zealous-framework-m6gwg （toggle the checkbox to stop threejs updating，and type in `100000` to see how the perf goes with 100000 components）

FunctionComponent：https://github.com/michael8090/function-component（yarn start，type `doBenchmark()` in the console，or tick() to use chrome developer tool to analyse the performance)


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

- [ ] remove `componentWillUpdate`

