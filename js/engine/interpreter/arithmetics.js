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
            case 'And': {
                return Arithmetics.and(leftSideResult, rightSideResult)
            }
            case 'Or': {
                return Arithmetics.or(leftSideResult, rightSideResult)
            }
            default: {
                throw {error: 'Unknown arithmetic operation:', token: arithmeticToken.token}
            }
        }
    }

    static plus(leftSideResult, rightSideResult) {
        if (leftSideResult === undefined) {
            if (rightSideResult.type == Constant.Type.Number) {
                return rightSideResult
            }
        }
        else if (leftSideResult.type == Constant.Type.Number && rightSideResult.type == Constant.Type.Number) {
            return new Constant(leftSideResult.value() + rightSideResult.value())
        }
        else if ((leftSideResult.type == Constant.Type.String || leftSideResult.type == Constant.Type.Number || leftSideResult.type == Constant.Type.Boolean) &&
            (rightSideResult.type == Constant.Type.String || rightSideResult.type == Constant.Type.Number || rightSideResult.type == Constant.Type.Boolean)) {
            return new Constant('"' + leftSideResult.value() + rightSideResult.value() + '"')
        }
        throw {error: 'Cannot add expression'}
    }

    static minus(leftSideResult, rightSideResult) {
        if (leftSideResult === undefined) {
            if (rightSideResult.type == Constant.Type.Number) {
                return new Constant(-rightSideResult.value())
            }
        }
        else if (leftSideResult.type == Constant.Type.Number && rightSideResult.type == Constant.Type.Number) {
            return new Constant(leftSideResult.value() - rightSideResult.value())
        }
        throw {error: 'Cannot minus expression'}
    }

    static multiply(leftSideResult, rightSideResult) {
        if (leftSideResult === undefined) {
            throw {error: 'Left side of multiply must be defined'}
        }
        if (leftSideResult.type == Constant.Type.Number && rightSideResult.type == Constant.Type.Number) {
            return new Constant(leftSideResult.value() * rightSideResult.value())
        }
        throw {error: 'Cannot multiply expression'}
    }

    static divide(leftSideResult, rightSideResult) {
        if (leftSideResult === undefined) {
            throw {error: 'Left side of division must be defined'}
        }
        if (leftSideResult.type == Constant.Type.Number && rightSideResult.type == Constant.Type.Number) {
            if (rightSideResult.value() == 0) {
                throw {error: 'Division by zero error'}
            }
            return new Constant(leftSideResult.value() / rightSideResult.value())
        }
        throw {error: 'Cannot divide expression'}
    }

    static equals(leftSideResult, rightSideResult) {
        if (leftSideResult === undefined) {
            throw {error: 'Left side of comparison must be defined'}
        }
        return new Constant(leftSideResult.value() == rightSideResult.value())
    }

    static notEquals(leftSideResult, rightSideResult) {
        if (leftSideResult === undefined) {
            throw {error: 'Left side of comparison must be defined'}
        }
        return new Constant(leftSideResult.value() != rightSideResult.value())
    }

    static lessThan(leftSideResult, rightSideResult) {
        if (leftSideResult === undefined) {
            throw {error: 'Left side of comparison must be defined'}
        }
        if (leftSideResult.type == Constant.Type.Number && rightSideResult.type == Constant.Type.Number) {
            return new Constant(leftSideResult.value() < rightSideResult.value())
        }
        throw {error: 'Cannot compare expression'}
    }

    static lessThanOrEqual(leftSideResult, rightSideResult) {
        if (leftSideResult === undefined) {
            throw {error: 'Left side of comparison must be defined'}
        }
        if (leftSideResult.type == Constant.Type.Number && rightSideResult.type == Constant.Type.Number) {
            return new Constant(leftSideResult.value() <= rightSideResult.value())
        }
        throw {error: 'Cannot compare expression'}
    }

    static greaterThan(leftSideResult, rightSideResult) {
        if (leftSideResult === undefined) {
            throw {error: 'Left side of comparison must be defined'}
        }
        if (leftSideResult.type == Constant.Type.Number && rightSideResult.type == Constant.Type.Number) {
            return new Constant(leftSideResult.value() > rightSideResult.value())
        }
        throw {error: 'Cannot compare expression'}
    }

    static greaterThanOrEqual(leftSideResult, rightSideResult) {
        if (leftSideResult === undefined) {
            throw {error: 'Left side of comparison must be defined'}
        }
        if (leftSideResult.type == Constant.Type.Number && rightSideResult.type == Constant.Type.Number) {
            return new Constant(leftSideResult.value() >= rightSideResult.value())
        }
        throw {error: 'Cannot compare expression'}
    }

    static and(leftSideResult, rightSideResult) {
        if (leftSideResult === undefined) {
            throw {error: 'Left side of binary operator must be defined'}
        }
        if (leftSideResult.type == Constant.Type.Boolean && rightSideResult.type == Constant.Type.Boolean) {
            return new Constant(leftSideResult.value() && rightSideResult.value())
        }
        throw {error: 'Cannot compare expression'}
    }

    static or(leftSideResult, rightSideResult) {
        if (leftSideResult === undefined) {
            throw {error: 'Left side of binary operator must be defined'}
        }
        if (leftSideResult.type == Constant.Type.Boolean && rightSideResult.type == Constant.Type.Boolean) {
            return new Constant(leftSideResult.value() || rightSideResult.value())
        }
        throw {error: 'Cannot compare expression'}
    }
}
