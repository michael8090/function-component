import {Components} from '../Components';
import {getRoot} from '../functionComponent';
import { getLoggerFunctionComponent, logger } from './testUtils.lib';

const {Null} =Components;


describe('test react liked lifecycle hooks', function() {
    const Root = getRoot({});
    const A = getLoggerFunctionComponent('A');
    const B = getLoggerFunctionComponent('B');
    Root(Null);
    it('basic: componentWillMount - componentWillUpdate - componentWillUnmount', () => {
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
        Root(Null);
        expect(logger.equals([
            'A: componentWillMount',
            'A: componentWillUpdate',
            'A: componentWillUnmount',
        ])).toBeTruthy();
    });

    it('Component type change should cause an unmount and mount', () =>{
        logger.clear();
        Root(Null);
        Root(A);
        expect(logger.equals([
            'A: componentWillMount'
        ])).toBeTruthy();
        Root(B);
        expect(logger.equals([
            'A: componentWillMount',
            'A: componentWillUnmount',
            'B: componentWillMount',
        ])).toBeTruthy();
    });

    it('simple nested components', () =>{
        logger.clear();
        Root(Null);
        Root(A);
        expect(logger.equals([
            'A: componentWillMount'
        ])).toBeTruthy();
        logger.clear();
        Root(() => {
            A(() => {
                B();
            })
        });
        expect(logger.equals([
            'A: componentWillUpdate',
            'B: componentWillMount',
        ])).toBeTruthy();
        logger.clear();
        Root(() => {
            A();
        });
        expect(logger.equals([
            'A: componentWillUpdate',
            'B: componentWillUnmount',
        ])).toBeTruthy();
    });

    it('two nested components', () =>{
        logger.clear();
        Root(Null);
        Root(() => {
            A(() => {
                B();
            })
        });
        expect(logger.equals([
            'A: componentWillMount',
            'B: componentWillMount',
        ])).toBeTruthy();
        logger.clear();
        Root(() => {
            A(() => {
                A();
                B();
            })
        });
        expect(logger.equals([
            'A: componentWillUpdate',
            'B: componentWillUnmount',
            'A: componentWillMount',
            'B: componentWillMount',
        ])).toBeTruthy();

        logger.clear();
        Root(() => {
            A(() => {
                A();
                B();
            })
            A(() => {
                A();
                B();
            })
        });
        expect(logger.equals([
            'A: componentWillUpdate',
            'A: componentWillUpdate',
            'B: componentWillUpdate',
            'A: componentWillMount',
            'A: componentWillMount',
            'B: componentWillMount',
        ])).toBeTruthy();

        logger.clear();
        Root(() => {
            A(() => {
                A();
                B();
            })
            A(() => {
                A();
                B();
            })
        });
        expect(logger.equals([
            'A: componentWillUpdate',
            'A: componentWillUpdate',
            'B: componentWillUpdate',
            'A: componentWillUpdate',
            'A: componentWillUpdate',
            'B: componentWillUpdate',
        ])).toBeTruthy();

        logger.clear();
        Root(() => {
            A(() => {
                A();
                B();
            })
        });
        expect(logger.equals([
            'A: componentWillUpdate',
            'A: componentWillUpdate',
            'B: componentWillUpdate',
            'A: componentWillUnmount',
            'A: componentWillUnmount',
            'B: componentWillUnmount',
        ])).toBeTruthy();
    });
});

  