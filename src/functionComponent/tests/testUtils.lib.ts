import {Component, toFunctionComponent} from '../functionComponent';

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

export const logger = new Logger();

type WithChild = [Function?];

export function getLoggerFunctionComponent(name: string) {
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