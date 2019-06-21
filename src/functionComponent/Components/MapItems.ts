import { BiDirectionLinkedList, BiDirectionLinkedListNode } from "../BiDirectionLinkedList";
import EnhancedWeakMap from '../EWeakMap';
import { Component, toFunctionComponent } from "../functionComponent";
import { Null as NullModule } from './Null';

const Null = NullModule;

type Props<T> = [T[], (item: T) => void];

let MapItems = function<T>(...data: Props<T>) {
    //
}

interface ItemRecord extends BiDirectionLinkedListNode {
    index: number;
    g: number;
    data: any;
}

const NullData = Symbol('NullData');

// todo: TS the generic here is gone and we got an 'unknown'
// tslint:disable-next-line:no-shadowed-variable
MapItems = toFunctionComponent(class MapItems<T extends Object> extends Component<Props<T>> {
    lastKeyRecordMap = new EnhancedWeakMap<T, ItemRecord>();
    lastCallList: Array<T | Symbol> = [];
    generation = 0;
    keys = new BiDirectionLinkedList<ItemRecord>();

    render([items, map]: Props<T>) {
        this.generation ++;
        const {lastCallList, lastKeyRecordMap, generation, keys} = this;
        const itemsLength = items.length;
        for (let i = 0, blankHoleIndex = -1; i < itemsLength; i++) {
            const data = items[i];
            const record = lastKeyRecordMap.get(data);
            if (record === undefined) {
                const newRecord = {
                    index: i,
                    g: generation,
                    data
                };
                lastKeyRecordMap.set(data, newRecord);
                keys.add(newRecord);
                const callListLength = lastCallList.length;
                for (blankHoleIndex = blankHoleIndex + 1; blankHoleIndex < callListLength; blankHoleIndex++) {
                    if (lastCallList[blankHoleIndex] === undefined) {
                        break;
                    }
                }
                lastCallList[blankHoleIndex] = data;
            } else {
                record.g = generation;
                lastCallList[record.index] = data;
            }
        }
        keys.walk(this.removeOutDated);

        for (let i = 0, l = lastCallList.length; i < l; i++) {
            const data = lastCallList[i];
            if (data === NullData) {
                Null();
            } else {
                map(data as T);
            }
        }
    }

    private removeOutDated = (record: ItemRecord) => {
        if (record.g !== this.generation) {
            this.lastCallList[record.index] = NullData;
            this.lastKeyRecordMap.delete(record.data);
            this.keys.delete(record);
        }
    }
}) as any;

export {MapItems}

/**
 * CallList: Data[]
 * Item {key, data, index?}
 * Set1{i1, i2, i3}
 * Set2{i2, i3, i4}
 * RemoveSet = Set1 - Set2
 * AddSet = Set2 - Set1
 * for {index} of RemoveSet {
 *      CallList[index] = undefined;
 *      delete Set1[key];
 * }
 * 
 * for {key, data} of AddSet {
 *      let holeIndex = findHoleIndex(CallList) || CallList.length;
 *      CallList[holeIndex] = data;
 *      Set1[key] = {key, data, index: holeIndex};
 * }
 * for data of CallList {
 *      data === undefined ? Null() : map(data)
 * }
 */

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


