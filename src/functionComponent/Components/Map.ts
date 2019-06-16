import { Component, toFunctionComponent } from "../functionComponent";
import { Null } from './Null';

type Props<T> = [T[], {(item: T, index: number): string | number}, (item: T, key: string | number) => void];

let MapItems = function<T>(...data: Props<T>) {
    //
}

// todo: TS the generic here is gone and we got an 'unknown'
// tslint:disable-next-line:no-shadowed-variable
MapItems = toFunctionComponent(class MapItems<T> extends Component<Props<T>> {
    lastKeyIndexMap: { [key: string]: number} = {};
    lastCallList: Array<string | number | undefined> = [];
    nextCallList: Array<string | number | undefined> = [];
    keysNeedToAppend: Array<string | number> = [];
    keyItemMap:  { [key: string]: T} = {};
    render([items, getKey, map]: Props<T>) {
        const {lastKeyIndexMap, lastCallList, nextCallList, keysNeedToAppend, keyItemMap} = this;
        const itemsLength = items.length;
        for (let i = 0; i < itemsLength; i++) {
            nextCallList[i] = undefined;
        }
        for (let i = 0; i < itemsLength; i++) {
            const item = items[i];
            const key = getKey(item, i);
            keyItemMap[key] = item;
            const lastIndex = lastKeyIndexMap[key];
            if (lastIndex !== undefined) {
                nextCallList[lastIndex] = key;
            } else {
                keysNeedToAppend.push(key);
            }
        }
        for (let i = 0, blankHoleIndex = -1, l = keysNeedToAppend.length; i < l; i++) {
            const nextCallListLength = nextCallList.length;
            for (let j = blankHoleIndex + 1; j < nextCallListLength; j++) {
                if (nextCallList[j] === undefined) {
                    blankHoleIndex = j;
                    break;
                }
            }
            nextCallList[blankHoleIndex] = keysNeedToAppend[i];
        }
        const keyIndexMap = {};
        for (let i = 0, l = nextCallList.length; i < l; i++) {
            const key = nextCallList[i];
            if (key === undefined) {
                Null();
            } else {
                keyIndexMap[key] = i;
                map(keyItemMap[key]!, key);
            }
        }
        this.lastKeyIndexMap = keyIndexMap;
        const tmp = lastCallList;
        this.lastCallList = this.nextCallList;
        this.nextCallList = tmp;
        this.nextCallList.length = 0;
        keysNeedToAppend.length = 0;
        this.keyItemMap = {};
    }
}) as any;

export {MapItems}

// const items: number[] = [];

// MapItems(items, (item, i) => item, (item) => {
//     // Child();
// })

/**
 * [1, 3]
 * call {1, 2, 3}
 * [1, 3, 2], newly added, and not holes found, just append to the end
 * call {2, 3}
 * [, 3, 2], got a missing call, leave a hole
 * call {3}
 * [, 3], safely remove the following holes
 * call {2, 3}
 * [2, 3], append it to the hole first to reduce the count of holes
 * 
 * Summery:
 * lastCallList: Array<key | undefined>
 * lastCallListIndex: Map<key, number | undefined>
 * 
 * let newCallList = Array(items.length).fill(undefined)
 * for every {fn, key} where newCallList[lastCallListIndex[key]] exists:
 *     newCallList[lastCallListIndex[key]] = fn
 * for every {fn, key} where lastCallListIndex[key] is undefined:
 *     if there is a hole in newCallList in index i:
 *         newCallList[i] = key;
 *         
 *              
 */ 

// type key = undefined | number;

// const lastCallList: Array<key | undefined>
// const lastCallListIndex: Map<key, number | undefined>


