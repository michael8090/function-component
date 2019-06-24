export interface HashObject {
    [k: string]: any;
}

let id = 0;
export default class EnhancedWeakMap<K extends object, V> {
    private id = '_' + (id++);
  /**
   * EnhancedWeakMap类，Api与JS内置的`WeakMap`类保持兼容，但[性能提升一倍](@see https://jsperf.com/myweakmap-vs-weakmap/1)
   * 不过不能传入frozen object（被`Object.freeze`作用过的)作为key，因为内部实现是将value附加到当前的object上
   */
    constructor() {
      //
    }
    set(obj: K, value: V) {
      // (obj as HashObject)[this.id] = value;
      (obj as HashObject)._em = value;
      return this;
    }
    get(obj: K) {
      return (obj as HashObject)._em;
    }
    has(obj: K) {
      return (obj as HashObject)._em !== undefined;
    }
    delete(obj: K) {
        const has = this.has(obj);
        (obj as HashObject)._em= undefined;
        return has;
    }
  }
