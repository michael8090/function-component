import { BiDirectionLinkedList, BiDirectionLinkedListNode } from "../BiDirectionLinkedList";
import { Component, toFunctionComponent } from "../functionComponent";
import { Null as NullModule } from './Null';

const Null = NullModule;

type Props<T> = [T[], {(item: T, index: number): string | number}, (item: T) => void];

let MapItems = function<T>(...data: Props<T>) {
    //
}

interface ItemRecord extends BiDirectionLinkedListNode {
    index: number;
    key: string | number;
    // g: number;
}

const NullData = Symbol('NullData');

// todo: TS the generic here is gone and we got an 'unknown'
// tslint:disable-next-line:no-shadowed-variable
MapItems = toFunctionComponent(class MapItems<T> extends Component<Props<T>> {
    lastKeyRecordMap: { [key: string]: ItemRecord} = {};
    lastCallList: Array<T | Symbol> = [];
    keys = new BiDirectionLinkedList<ItemRecord>();
    oldKeys = new BiDirectionLinkedList<ItemRecord>();

    // nextCallList: Array<string | number | undefined> = [];
    // keysNeedToAppend: Array<string | number> = [];
    // keyItemMap:  { [key: string]: T} = {};
    render(items: Props<T>[0], getKey: Props<T>[1], map: Props<T>[2]) {
        const {lastCallList, lastKeyRecordMap, keys, oldKeys} = this;
        const itemsLength = items.length;
        for (let i = 0, blankHoleIndex = -1; i < itemsLength; i++) {
            const data = items[i];
            const key = getKey(data, i);
            const record = lastKeyRecordMap[key];
            if (record === undefined) {
                const newRecord = {
                    key,
                    index: i,
                };
                lastKeyRecordMap[key] = newRecord;
                keys.add(newRecord);
                const callListLength = lastCallList.length;
                for (blankHoleIndex = blankHoleIndex + 1; blankHoleIndex < callListLength; blankHoleIndex++) {
                    if (lastCallList[blankHoleIndex] === NullData) {
                        break;
                    }
                }
                lastCallList[blankHoleIndex] = data;
            } else {
                // todo: the perf here is no optimal, we can see what we can do
                oldKeys.delete(record);
                keys.add(record);

                const {index} = record;
                if (lastCallList[index] !== data) {
                    lastCallList[index] = data;
                }
                // lastCallList[record.index] = data;
            }
        }

        oldKeys.walk(this.removeOutDated);
        oldKeys.reset();

        this.keys = oldKeys;
        this.oldKeys = keys;

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
        this.lastCallList[record.index] = NullData;
        delete this.lastKeyRecordMap[record.key];
    }
}) as any;

export {MapItems}
