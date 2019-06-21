import {Components} from '../Components';
import {Component, getRoot, toFunctionComponent} from '../functionComponent';
import {logger} from './testUtils.lib';
const {MapItems} =Components;
it('test react liked lifecycle hooks', function() {
    const Root = getRoot({});
    type Props = [{key: number}];
    const A = toFunctionComponent(class extends Component<Props> {
        private key: {key: number};
        componentWillMount([key]: Props) {
            this.key = key;
            logger.log(`${key.key}: componentWillMount`);
        }
        componentWillUpdate([key]: Props) {
            if (key !== this.key) {
                throw new Error('key changed');
            }
            logger.log(`${key.key}: componentWillUpdate`);
        }
    })
    const data = [{key: 1}, {key: 2}];

    logger.clear();
    Root(() => {
        MapItems(data, d => {
            A(d);
        });
    });
    expect(logger.equals([
        '1: componentWillMount',
        '2: componentWillMount'
    ])).toBeTruthy();

    data.unshift({key: 0});

    logger.clear();
    Root(() => {
        MapItems(data, key => {
            A(key);
        });
    });
    expect(logger.equals([
        '1: componentWillUpdate',
        '2: componentWillUpdate',
        '0: componentWillMount'
    ])).toBeTruthy();
});
