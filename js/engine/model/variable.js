export class Variable {
    constructor(name, value) {
        this.name = name
        this.setValue(value)
    }

    setValue(value) {
        this.rawValue = value

        if (this.rawValue instanceof Constant) {
            this.type = Variable.Type.Constant
        }
        else {
            this.type = Variable.Type.ObjectReference
        }
    }

    value() {
        return this.rawValue
    }

    isTrue() {
        if (this.rawValue instanceof Constant) {
            return this.rawValue.isTrue()
        }
        return true
    }

    isFalse() {
        if (this.rawValue instanceof Constant) {
            return this.rawValue.isFalse()
        }
        return false
    }
}

Variable.Type = {
    Unknown: -1,
    Constant: 0,
    ObjectReference: 1
}


export class Constant {
    constructor(value) {
        this.rawValue = value

        if (typeof(this.rawValue) == typeof(true)) {
            this.type = Constant.Type.Boolean
        }
        else if (!isNaN(this.rawValue)) {
            this.type = Constant.Type.Number
            this.rawValue = +this.rawValue  // Convert into number if string
        }
        else if (typeof(this.rawValue) == 'string' && this.rawValue.length > 0 && this.rawValue.charAt(0) == '"') {
            this.type = Constant.Type.String
        }
        else {
            this.type = Constant.Type.Variable
        }
    }

    value() {
        if (this.type == Constant.Type.String) {
            return this.rawValue.slice(1, this.rawValue.length - 1)
        } else {
            return this.rawValue
        }
    }

    isTrue() {
        if (this.type == Constant.Type.Boolean || this.type == Constant.Type.Number) {
            return this.value() == true
        }
        return true
    }

    isFalse() {
        if (this.type == Constant.Type.Boolean || this.type == Constant.Type.Number) {
            return this.value() == false
        }
        return false
    }
}

Constant.Type = {
    Unknown: -1,
    Boolean: 0,
    Number: 1,
    String: 2,
    Variable: 3
}
