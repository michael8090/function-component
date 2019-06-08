import {getRoot, toFunctionComponent,} from '../functionComponent';
import {JsonComponents} from './JsonComponents';
import { ObjectView, PrimitiveView } from './JsonView';

const {Property} = JsonComponents;

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



const report: Report = {
    male: 0,
    // tslint:disable-next-line:object-literal-sort-keys
    female: 0,
    people: [],
    zone: 'north',
}

const rootNode = new ObjectView('', report);

const Root = getRoot(rootNode);


const sampleArea: Area = {
    zipCode: 0.6,
    people: [
        {
            name: 'ella',
            age: 20,
            sex: 'female',
        }
    ]
};

const source: RawData = (new Array(100000)).fill(sampleArea);

class PrimitiveViewWithCachedData<TPropertyName extends string | number | symbol,
TPropertyValue extends (string | number)> extends PrimitiveView<TPropertyName, TPropertyValue> {
    cachedData: any;
}

const AgeRange = toFunctionComponent<[string, number], PrimitiveViewWithCachedData<string | number, 'child' | 'young' | 'old'>>({
    create([parentPropertyName, age], parent) {
        const p = parent as any as ObjectView<any, {[k: string]: 'child' | 'young' | 'old'}>
        const view = new PrimitiveViewWithCachedData(parentPropertyName, ageToRange(age));
        p.add(view as any);
        view.cachedData = age;
        return view;
    },
    update([parentPropertyName, age], view) {
        if (view.cachedData !== age) {
            view.value = ageToRange(age);
        }
        return view;
    },
    dispose(view) {
        view.parent!.remove(view as any);
        view.dispose();
    }
})

const RPeople = toFunctionComponent<[string, People], ObjectView<string, ReportPeople>>({
    create([parentPropertyName, people], parent) {
        const view = new ObjectView(parentPropertyName, Object.assign({}, people, {range: 'child'}) as ReportPeople);
        parent.add(view as any);
        return view;
    },
    update([parentPropertyName, people], view) {
        const {value} = view;
        if (value.sex !== people.sex) {
            value.sex = people.sex
        }
        if (value.name !== people.name) {
            value.name = people.name;
        }
        return view;
    },
    dispose(view) {
        view.parent!.remove(view as any);
        view.dispose();
    },
    render([parentPropertyName, people]) {
        AgeRange('range', people.age);
    }
})

function transform() {

    Root(() => {
        Property('people', () => [], () => {
            let i = 0;
            source.forEach(area => {
                area.people.forEach(people => {
                    i++;
                    RPeople(i.toString(), people);
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
    // console.log(report);
}

function reGenerateJson() {
    const people: ReportPeople[] = []
    source.forEach(area => {
        area.people.forEach(p => {
            people.push({
                name: p.name,
                sex: p.sex,
                range: ageToRange(p.age)
            })
        })
    })
    return ({
        people,
        female: people.reduce((pre, p) => {
            if (p.sex === 'female') {
                pre ++;
            }
            return pre;
        }, 0),
        male: report.people.reduce((pre, p) => {
            if (p.sex === 'female') {
                pre ++;
            }
            return pre;
        }, 0),
        zone: source.reduce((pre, area) => {
            if (area.zipCode > 0.5) {
                pre ++;
            }
            return pre;
        }, 0) > 0.5 * source.length ? 'south' : 'north'
    }) as Report;
}

function animate() {
    // transform();
    reGenerateJson();
    requestAnimationFrame(animate);
}

animate();

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
