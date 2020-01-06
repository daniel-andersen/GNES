import { Scope } from './scope'
import { Variable, Constant } from './variable'
import * as Node from '../interpreter/nodes'

export class ObjectInstance {
    constructor(classNode) {
        this.classNode = classNode
        this.scope = new Scope(classNode.scope)

        this.populateScope()
    }

    populateScope() {

        // Create variables for properties
        for (let propertyNode of this.classNode.propertyNodes) {
            for (let node of propertyNode.parameterDefinitionsNode.nodes) {
                if (node instanceof Node.ConstantNode) {
                    this.scope.setVariableInOwnScope(new Variable(node.constant.value(), new Constant("")))
                }
                if (node instanceof Node.AssignmentNode) {
                    this.scope.setVariableInOwnScope(new Variable(node.variableName, new Constant("")))
                }
            }
        }
    }
}
