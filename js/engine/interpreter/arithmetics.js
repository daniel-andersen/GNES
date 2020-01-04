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
            default: {
                throw 'Unknown arithmetic operation:', arithmeticToken.token
            }
        }
    }

    static plus(leftSideResult, rightSideResult) {
        if (leftSideResult.type == Constant.Type.Number && rightSideResult.type == Constant.Type.Number) {
            return new Constant(leftSideResult.value() + rightSideResult.value())
        }
        if ((leftSideResult.type == Constant.Type.String || leftSideResult.type == Constant.Type.Number) && (rightSideResult.type == Constant.Type.String || rightSideResult.type == Constant.Type.Number)) {
            return new Constant('"' + leftSideResult.value() + rightSideResult.value() + '"')
        }
        throw 'Cannot add expression'
    }

    static minus(leftSideResult, rightSideResult) {
        if (leftSideResult.type == Constant.Type.Number && rightSideResult.type == Constant.Type.Number) {
            return new Constant(leftSideResult.value() - rightSideResult.value())
        }
        if ((leftSideResult.type == Constant.Type.String || leftSideResult.type == Constant.Type.Number) && (rightSideResult.type == Constant.Type.String || rightSideResult.type == Constant.Type.Number)) {
            throw 'Cannot minus string'
        }
        throw 'Cannot minus expression'
    }

    static multiply(leftSideResult, rightSideResult) {
        if (leftSideResult.type == Constant.Type.Number && rightSideResult.type == Constant.Type.Number) {
            return new Constant(leftSideResult.value() * rightSideResult.value())
        }
        if ((leftSideResult.type == Constant.Type.String || leftSideResult.type == Constant.Type.Number) && (rightSideResult.type == Constant.Type.String || rightSideResult.type == Constant.Type.Number)) {
            throw 'Cannot multiply string'
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
        if ((leftSideResult.type == Constant.Type.String || leftSideResult.type == Constant.Type.Number) && (rightSideResult.type == Constant.Type.String || rightSideResult.type == Constant.Type.Number)) {
            throw 'Cannot divide string'
        }
        throw 'Cannot divide expression'
    }
}
