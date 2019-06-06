import {getRoot, toFunctionComponent,} from './functionComponent';
import { View } from './view';

class JsonNode extends View {
    constructor(public propName: string | number, public value: any) {
        super();
    }

    add(child: JsonNode) {
        super.add(child);
        this.value[child.propName] = child.value;
    }
    remove(i: number) {
        super.remove(i);
        const child = this.children[i] as JsonNode;
        this.value[child.propName] = undefined;
    }
    dispose() {
        super.dispose();
    }
}

interface People {
    age: number;
    name: string;
    sex: 'male' | 'female';
}

interface Area {
    people: People[];
    zipCode: number; // 0 ~ 1
}

type RawData = Area[];

interface ReportPeople {
    range: 'child' | 'young' | 'old'
    name: string;
    sex: 'male' | 'female'
}

interface Report {
    zone: 'south' | 'north';
    male: number;
    female: number;
    people: ReportPeople[];
}

function ageToRange(age: number) {
    return age < 10 ? 'child' : (age < 50 ? 'young' : 'old');
}

const Property = toFunctionComponent<[string | number, any, Function?], JsonNode>({
    create([propName, value], parent) {
        if (typeof value === 'function') {
            value = value();
        }
        const node = new JsonNode(propName, value);
        parent.add(node);
        return node;
    },
    update([propName, value], node) {
        const parent = (node.parent as JsonNode);
        const {propName: oldPropName, value: oldValue} = node;
        if (typeof value === 'function') {
            value = oldValue;
        }
        if (propName !== oldPropName) {
            const i = parent.children.indexOf(node);
            parent.remove(i);
            const nextNode = new JsonNode(propName, value);
            parent.add(nextNode);
            return nextNode;
        }
        if (value !== oldValue) {
            node.value = value;
            parent.value[propName] = value;
        }
        return node;
    },
    dispose(node) {
        const parent = (node.parent as JsonNode);
        const i = parent.children.indexOf(node);
        parent.remove(i);
    },
    render([propName, value, child]) {
        if (child) {
            child();
        }
    }
})


const report: Report = {
    male: 0,
    // tslint:disable-next-line:object-literal-sort-keys
    female: 0,
    people: [],
    zone: 'north',
}

const rootNode = new JsonNode('', report);

const Root = getRoot(rootNode);


const sampleArea: Area = {
    zipCode: 0.6,
    // tslint:disable-next-line:object-literal-sort-keys
    people: [
        {
            name: 'ella',
            // tslint:disable-next-line:object-literal-sort-keys
            age: 20,
            sex: 'female',
        }
    ]
};

const source: RawData = (new Array(10000)).fill(sampleArea);

function transform() {

    Root(() => {
        Property('people', () => [], () => {
            let i = 0;
            source.forEach(area => {
                area.people.forEach(people => {
                    Property(i++, Object.assign({}, people), () => {
                        Property('age', ageToRange(people.age))
                    })
                })
            })
        });
        Property('male', report.people.reduce((pre, p) => {
            if (p.sex === 'male') {
                pre ++;
            }
            return pre;
        }, 0));
    
        Property('female', report.people.reduce((pre, p) => {
            if (p.sex === 'female') {
                pre ++;
            }
            return pre;
        }, 0));
    
        Property('zone', source.reduce((pre, area) => {
            if (area.zipCode > 0.5) {
                pre ++;
            }
            return pre;
        }, 0) > 0.5 * source.length ? 'south' : 'north');
    });
    
    // tslint:disable-next-line:no-console
    console.log(report);
}

function logTime(name: string, fn: Function) {
    const t0 = performance.now();
    fn();
    // tslint:disable-next-line:no-console
    console.log(`${name}: ${performance.now() - t0}`);
}

const g = window as any;

g.test = () => {
    logTime('transform', () => transform());
} 
