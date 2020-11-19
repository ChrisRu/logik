export type IOperator = (...params: (boolean | 0 | 1)[]) => boolean[]

export const INV: IOperator = (in1) => [!in1]

export const AND: IOperator = (in1, in2) => [!!in1 && !!in2]

export const NAND: IOperator = (in1, in2) => INV(...AND(in1, in2))

export const OR: IOperator = (in1, in2) => NAND(...INV(in1), ...INV(in2))
