export type IOperator = (...params: (boolean | 0 | 1)[]) => boolean[]

export const INV: IOperator = (a) => [!a]

export const AND: IOperator = (a, b) => [!!a && !!b]

export const NAND: IOperator = (a, b) => INV(...AND(a, b))

export const OR: IOperator = (a, b) => NAND(...INV(a), ...INV(b))
