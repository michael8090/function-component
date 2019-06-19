import {Component, getRoot, toFunctionComponent} from '../functionComponent';

class Logger {
    msg: string[] = [];
    log(m: string) {
        this.msg.push(m);
    }
    clear() {
        this.msg = [];
    }
    equals(strs: string[]) {
        return strs.join('\n') === strs.join('\n');
    }
}

const logger = new Logger();

type WithChild = [Function?];

function getLoggerFunctionComponent(name: string) {
    return toFunctionComponent(class extends Component<WithChild> {
        componentWillMount() {
            logger.log(`${name}: componentWillMount`);
        }
        componentWillUnmount() {
            logger.log(`${name}: componentWillUnmount`);

        }
        componentWillUpdate() {
            logger.log(`${name}: componentWillUpdate`);
        }
        render([child]: WithChild) {
            if (child !== undefined) {
                child();
            }
        }
    })
}

describe('test react liked lifecycle hooks', function() {
    const Root = getRoot({});
    const A = getLoggerFunctionComponent('A');
    const B = getLoggerFunctionComponent('B');
    Root(() => {
        //
    });
    it('componentWillMount - componentWillUpdate - componentWillUnmount', () => {
        logger.clear();
        Root(A)
        expect(logger.equals([
            'A: componentWillMount'
        ])).toBeTruthy();
        Root(A);
        expect(logger.equals([
            'A: componentWillMount',
            'A: componentWillUpdate'
        ])).toBeTruthy();
        Root(() => {
            //
        });
        expect(logger.equals([
            'A: componentWillMount',
            'A: componentWillUpdate',
            'A: componentWillUnmount',
        ])).toBeTruthy();
    });
});

  