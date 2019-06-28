import {Components} from '../Components';
import {Component, getRoot, toFunctionComponent} from '../functionComponent';
import {logger} from './testUtils.lib';

it('test should component update', function() {
    const Root = getRoot({});
    const NeverUpdate = toFunctionComponent(class extends Component<[]> {
        shouldComponentUpdate() {
            return false;
        }
        componentWillUpdate() {
            throw new Error(`should never update`);
        }
    });
    const AlwaysUpdate = toFunctionComponent(class extends Component<[]> {
        componentWillUpdate() {
            logger.log('AlwaysUpdate: componentWillUpdate');
        }
    });
    
    logger.clear();
    Root(AlwaysUpdate);
    expect(
        logger.equals([])
    ).toBeTruthy();

    logger.clear();
    Root(AlwaysUpdate);
    expect(
        logger.equals([
            'AlwaysUpdate: componentWillUpdate'
        ])
    ).toBeTruthy();

    logger.clear();
    Root(NeverUpdate);
    expect(
        logger.equals([])
    ).toBeTruthy();

    logger.clear();
    Root(NeverUpdate);
});
