import { Constant } from '../model/variable'

export default class Arithmetics {
    static performOperation(arithmeticToken, leftSideResult, rightSideResult) {
        switch (arithmeticToken.token) {
            case '+': {
                return Arithmetics.plus(leftSideResult, rightSideResult)
            }
            case '-': {
                return Arithmetics.minus(leftSideResult, rightSideResult)
            }
            case '*': {
                return Arithmetics.multiply(leftSideResult, rightSideResult)
            }
            case '/': {
                return Arithmetics.divide(leftSideResult, rightSideResult)
            }
            case '==': {
                return Arithmetics.equals(leftSideResult, rightSideResult)
            }
            case '!=': {
                return Arithmetics.notEquals(leftSideResult, rightSideResult)
            }
            case '<': {
                return Arithmetics.lessThan(leftSideResult, rightSideResult)
            }
            case '<=': {
                return Arithmetics.lessThanOrEqual(leftSideResult, rightSideResult)
            }
            case '>': {
                return Arithmetics.greaterThan(leftSideResult, rightSideResult)
            }
            case '>=': {
                return Arithmetics.greaterThanOrEqual(leftSideResult, rightSideResult)
            }
            default: {
                throw 'Unknown arithmetic operation:', arithmeticToken.token
            }
        }
    }

    static plus(leftSideResult, rightSideResult) {
        if (leftSideResult.type == Constant.Type.Number && rightSideResult.type == Constant.Type.Number) {
            return new Constant(leftSideResult.value() + rightSideResult.value())
        }
        if ((leftSideResult.type == Constant.Type.String || leftSideResult.type == Constant.Type.Number || leftSideResult.type == Constant.Type.Boolean) &&
            (rightSideResult.type == Constant.Type.String || rightSideResult.type == Constant.Type.Number || rightSideResult.type == Constant.Type.Boolean)) {
            return new Constant('"' + leftSideResult.value() + rightSideResult.value() + '"')
        }
        throw 'Cannot add expression'
    }

    static minus(leftSideResult, rightSideResult) {
        if (leftSideResult.type == Constant.Type.Number && rightSideResult.type == Constant.Type.Number) {
            return new Constant(leftSideResult.value() - rightSideResult.value())
        }
        throw 'Cannot minus expression'
    }

    static multiply(leftSideResult, rightSideResult) {
        if (leftSideResult.type == Constant.Type.Number && rightSideResult.type == Constant.Type.Number) {
            return new Constant(leftSideResult.value() * rightSideResult.value())
        }
        throw 'Cannot multiply expression'
    }

    static divide(leftSideResult, rightSideResult) {
        if (leftSideResult.type == Constant.Type.Number && rightSideResult.type == Constant.Type.Number) {
            if (rightSideResult.value() == 0) {
                throw 'Division by zero error'
            }
            return new Constant(leftSideResult.value() / rightSideResult.value())
        }
        throw 'Cannot divide expression'
    }

    static equals(leftSideResult, rightSideResult) {
        return new Constant(leftSideResult.value() == rightSideResult.value())
    }

    static notEquals(leftSideResult, rightSideResult) {
        return new Constant(leftSideResult.value() != rightSideResult.value())
    }

    static lessThan(leftSideResult, rightSideResult) {
        if (leftSideResult.type == Constant.Type.Number && rightSideResult.type == Constant.Type.Number) {
            return new Constant(leftSideResult.value() < rightSideResult.value())
        }
        throw 'Cannot compare expression'
    }

    static lessThanOrEqual(leftSideResult, rightSideResult) {
        if (leftSideResult.type == Constant.Type.Number && rightSideResult.type == Constant.Type.Number) {
            return new Constant(leftSideResult.value() <= rightSideResult.value())
        }
        throw 'Cannot compare expression'
    }

    static greaterThan(leftSideResult, rightSideResult) {
        if (leftSideResult.type == Constant.Type.Number && rightSideResult.type == Constant.Type.Number) {
            return new Constant(leftSideResult.value() > rightSideResult.value())
        }
        throw 'Cannot compare expression'
    }

    static greaterThanOrEqual(leftSideResult, rightSideResult) {
        if (leftSideResult.type == Constant.Type.Number && rightSideResult.type == Constant.Type.Number) {
            return new Constant(leftSideResult.value() >= rightSideResult.value())
        }
        throw 'Cannot compare expression'
    }
}
