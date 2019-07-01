import {Component, getRoot, toFunctionComponent} from '../functionComponent';
import {logger} from './testUtils.lib';

it('test forceUpdate', function() {
    const {Root} = getRoot({});
    interface GetRef {
        (ref: Component): void;
    }
    const NeverUpdate = toFunctionComponent(class extends Component<[GetRef]> {
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
    });
    // tslint:disable-next-line:no-shadowed-variable
    const AlwaysUpdate = toFunctionComponent(class AlwaysUpdate extends Component<[GetRef]> {
        componentWillUpdate(getRef: GetRef) {
            logger.log('AlwaysUpdate: componentWillUpdate');
        }
        componentWillMount(getRef: GetRef) {
            getRef(this);
        }
    });

    let iAU: Component;
    function setIAU(ref: Component) {
        iAU = ref;
    }
    let iNU: Component;
    function setINU(ref: Component) {
        iNU = ref;
    }
    
    logger.clear();
    Root(() => {
        AlwaysUpdate(setIAU);
        NeverUpdate(setINU);
    });
    expect(
        logger.equals([])
    ).toBeTruthy();

    logger.clear();
    Root(() => {
        AlwaysUpdate(setIAU);
        NeverUpdate(setINU);
    });
    expect(
        logger.equals([
            'AlwaysUpdate: componentWillUpdate'
        ])
    ).toBeTruthy();

    logger.clear();
    iAU!.forceUpdate();
    expect(
        logger.equals([
            'AlwaysUpdate: componentWillUpdate'
        ])
    ).toBeTruthy();

    logger.clear();
    Root(() => {
        //
    });
    // tslint:disable-next-line:no-console
    const oldConsoleError = console.error;
    // tslint:disable-next-line:no-console
    console.error = (msg: string) => {
        logger.log(msg);
    }
    iAU!.forceUpdate();
    expect(
        logger.equals([
            'trying to update an unmounted component: AlwaysUpdate'
        ])
    ).toBeTruthy();
    // tslint:disable-next-line:no-console
    console.error = oldConsoleError;

    logger.clear();
    Root(() => NeverUpdate(setINU));
    expect(
        logger.equals([])
    ).toBeTruthy();

    logger.clear();
    iNU!.forceUpdate();
    expect(
        logger.equals([
            'NeverUpdate: componentWillUpdate'
        ])
    ).toBeTruthy();

    logger.clear();
    Root(() => {
        //
    });
    expect(
        logger.equals([
            'NeverUpdate: componentWillUnmount'
        ])
    ).toBeTruthy();
});
