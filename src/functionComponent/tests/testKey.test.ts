import {Components} from '../Components';
import {Component, getRoot, toFunctionComponent} from '../functionComponent';

const {Null, MapItems} =Components;
it('test react liked lifecycle hooks', function() {
    const Root = getRoot({});
    type Props = [number];
    const A = toFunctionComponent(class extends Component<Props> {
        private key: number;
        componentWillMount([key]: Props) {
            this.key = key;
        }
        componentWillUpdate([key]: Props) {
            if (key !== this.key) {
                throw new Error('key changed');
            }
        }
    })
    const data = [1, 2, 3];

    Root(() => {
        MapItems(data, key => key, key => {
            A(key);
        });
    });

    data.unshift(0);
    Root(() => {
        MapItems(data, key => key, key => {
            A(key);
        });
    });
    expect(1).toBe(1);
});
