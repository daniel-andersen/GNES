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
}

Variable.Type = {
    Unknown: -1,
    Constant: 0,
    ObjectReference: 1
}


export class Constant {
    constructor(value) {
        this.rawValue = value

        if (!isNaN(this.rawValue)) {
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
}

Constant.Type = {
    Unknown: -1,
    Number: 0,
    String: 1,
    Variable: 2
}
