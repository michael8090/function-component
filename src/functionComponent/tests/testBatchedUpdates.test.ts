import {Component, getRoot, toFunctionComponent} from '../functionComponent';
import {logger} from './testUtils.lib';

it('test forceUpdate', function() {
    const {Root, batchedUpdates} = getRoot({});
    interface GetRef {
        (ref: Component): void;
    }
    const NeverUpdate = toFunctionComponent(class extends Component<[GetRef, Function?]> {
        shouldComponentUpdate(getRef: GetRef) {
            return false;
        }
        componentWillUpdate() {
            logger.log('NeverUpdate: componentWillUpdate');
        }
        componentWillUnmount() {
            logger.log('NeverUpdate: componentWillUnmount');
        }
        componentWillMount(getRef: GetRef) {
            getRef(this);
        }
        render(getRef: GetRef, child: Function | undefined) {
            if (child) {
                child();
            }
        }
    });
    const AlwaysUpdate1 = toFunctionComponent(class extends Component<[GetRef, Function?]> {
        componentWillUpdate(getRef: GetRef) {
            logger.log('AlwaysUpdate1: componentWillUpdate');
        }
        componentWillMount(getRef: GetRef) {
            getRef(this);
        }
        render(getRef: GetRef, child: Function | undefined) {
            if (child) {
                child();
            }
        }
    });

    const AlwaysUpdate2 = toFunctionComponent(class extends Component<[GetRef, Function?]> {
        componentWillUpdate(getRef: GetRef) {
            logger.log('AlwaysUpdate2: componentWillUpdate');
        }
        componentWillMount(getRef: GetRef) {
            getRef(this);
        }
        render(getRef: GetRef, child: Function | undefined) {
            if (child) {
                child();
            }
        }
    });

    let c1: Component;
    let c2: Component;
    let c3: Component;
    
    logger.clear();
    Root(() => {
        AlwaysUpdate1(c => c1 = c, () => {
            NeverUpdate(c => c2 = c, () => {
                AlwaysUpdate2(c => c3 = c);
            })
        });
    });
    expect(
        logger.equals([])
    ).toBeTruthy();

    logger.clear();
    batchedUpdates(() => {
        c3.forceUpdate();
        c1.forceUpdate();
    });
    expect(
        logger.equals([
            'AlwaysUpdate1: componentWillUpdate',
            'AlwaysUpdate2: componentWillUpdate',
        ])
    ).toBeTruthy();
});
