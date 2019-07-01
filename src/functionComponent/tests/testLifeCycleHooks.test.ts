import { Components } from "../Components";
import { getRoot } from "../functionComponent";
import { getLoggerFunctionComponent, logger } from "./testUtils.lib";

const { Null } = Components;

const {Root} = getRoot({});
const A = getLoggerFunctionComponent("A");
const B = getLoggerFunctionComponent("B");

describe("test react liked lifecycle hooks", function() {
    Root(Null);
    it("basic: componentWillMount - componentWillUpdate - componentWillUnmount", () => {
        logger.clear();
        Root(A);
        expect(logger.equals([
            "A: componentWillMount",
            "A: componentDidMount",
        ])).toBeTruthy();
        Root(A);

        logger.clear();
        expect(
            logger.equals([
                "A: componentWillUpdate",
            ])
        ).toBeTruthy();

        logger.clear();
        Root(Null);
        expect(
            logger.equals([
                "A: componentWillUnmount"
            ])
        ).toBeTruthy();
    });

    it("Component type change should cause an unmount and mount", () => {
        logger.clear();
        Root(Null);
        Root(A);
        expect(logger.equals([
            "A: componentWillMount",
            "A: componentDidMount",
        ])).toBeTruthy();

        logger.clear();
        Root(B);
        expect(
            logger.equals([
                "A: componentWillUnmount",
                "B: componentWillMount",
                "B: componentDidMount",
            ])
        ).toBeTruthy();
    });

    it("simple nested components", () => {
        logger.clear();
        Root(Null);
        Root(A);
        expect(logger.equals([
            "A: componentWillMount",
            "A: componentDidMount",
        ])).toBeTruthy();

        logger.clear();
        Root(() => {
            A(() => {
                B();
            });
        });
        expect(
            logger.equals([
                "A: componentWillUpdate",
                "A: componentDidUpdate",
                "B: componentWillMount",
                "B: componentDidMount",
            ])
        ).toBeTruthy();

        logger.clear();
        Root(() => {
            A();
        });
        expect(
            logger.equals([
                "A: componentWillUpdate",
                "A: componentDidUpdate",
                "B: componentWillUnmount"
            ])
        ).toBeTruthy();
    });

    it("two nested components", () => {
        logger.clear();
        Root(Null);
        Root(() => {
            A(() => {
                B();
            });
        });
        expect(
            logger.equals([
                "A: componentWillMount",
                "A: componentDidMount",
                "B: componentWillMount",
                "B: componentDidMount",
            ])
        ).toBeTruthy();
        logger.clear();
        Root(() => {
            A(() => {
                A();
                B();
            });
        });
        expect(
            logger.equals([
                "A: componentWillUpdate",
                "A: componentDidUpdate",
                "B: componentWillUnmount",
                "A: componentWillMount",
                "A: componentDidMount",
                "B: componentWillMount",
                "B: componentDidMount",
            ])
        ).toBeTruthy();

        logger.clear();
        Root(() => {
            A(() => {
                A();
                B();
            });
            A(() => {
                A();
                B();
            });
        });
        expect(
            logger.equals([
                "A: componentWillUpdate",
                "A: componentDidUpdate",
                "A: componentWillUpdate",
                "A: componentDidUpdate",
                "B: componentWillUpdate",
                "B: componentDidUpdate",
                "A: componentWillMount",
                "A: componentDidMount",
                "A: componentWillMount",
                "A: componentDidMount",
                "B: componentWillMount",
                "B: componentDidMount",
            ])
        ).toBeTruthy();

        logger.clear();
        Root(() => {
            A(() => {
                A();
                B();
            });
            A(() => {
                A();
                B();
            });
        });
        expect(
            logger.equals([
                "A: componentWillUpdate",
                "A: componentDidUpdate",
                "A: componentWillUpdate",
                "A: componentDidUpdate",
                "B: componentWillUpdate",
                "B: componentDidUpdate",
                "A: componentWillUpdate",
                "A: componentDidUpdate",
                "A: componentWillUpdate",
                "A: componentDidUpdate",
                "B: componentWillUpdate",
                "B: componentDidUpdate",
            ])
        ).toBeTruthy();

        logger.clear();
        Root(() => {
            A(() => {
                A();
                B();
            });
        });
        expect(
            logger.equals([
                "A: componentWillUpdate",
                "A: componentDidUpdate",
                "A: componentWillUpdate",
                "A: componentDidUpdate",
                "B: componentWillUpdate",
                "B: componentDidUpdate",
                "A: componentWillUnmount",
                "A: componentWillUnmount",
                "B: componentWillUnmount"
            ])
        ).toBeTruthy();
    });

    it("1 - 2 - 1 - 2 - 1", function() {
        logger.clear();
        Root(() => {
            A(() => {
                A();
            });
        });
        expect(
            logger.equals([
                "A: componentWillMount",
                "A: componentDidMount",
                "A: componentWillMount",
                "A: componentDidMount",
            ])
        ).toBeTruthy();

        logger.clear();
        Root(() => {
            A(() => {
                A();
                A();
            });
        });
        expect(
            logger.equals([
                "A: componentWillUpdate",
                "A: componentDidUpdate",
                "A: componentWillUpdate",
                "A: componentDidUpdate",
                "A: componentWillMount",
                "A: componentDidMount",
            ])
        ).toBeTruthy();

        logger.clear();
        Root(() => {
            A(() => {
                A();
            });
        });
        expect(
            logger.equals([
                "A: componentWillUpdate",
                "A: componentDidUpdate",
                "A: componentWillUpdate",
                "A: componentDidUpdate",
                "A: componentWillUnmount"
            ])
        ).toBeTruthy();

        logger.clear();
        Root(() => {
            A(() => {
                A();
                A();
            });
        });
        expect(
            logger.equals([
                "A: componentWillUpdate",
                "A: componentDidUpdate",
                "A: componentWillUpdate",
                "A: componentDidUpdate",
                "A: componentWillMount",
                "A: componentDidMount",
            ])
        ).toBeTruthy();

        logger.clear();
        Root(() => {
            A(() => {
                A();
            });
        });
        expect(
            logger.equals([
                "A: componentWillUpdate",
                "A: componentDidUpdate",
                "A: componentWillUpdate",
                "A: componentDidUpdate",
                "A: componentWillUnmount"
            ])
        ).toBeTruthy();
    });
});
