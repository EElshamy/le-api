import { CustomScalar, Scalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('Money')
export class MoneyScalar implements CustomScalar<number, number> {
  description = 'Money custom scalar type (stored in cents)';

  serialize(value: number): number {
    return value / 100;
  }

  parseValue(value: number): number {
    //NOTE: flooring the amount to the nearest integer
    //read this: https://shopify.engineering/eight-tips-for-hanging-pennies
    return Math.round(value * 100); //flour?
  }

  parseLiteral(ast: ValueNode): number {
    if (ast.kind === Kind.FLOAT || ast.kind === Kind.INT) {
      //NOTE: flooring the amount to the nearest integer
      //read this: https://shopify.engineering/eight-tips-for-hanging-pennies
      return Math.round(parseFloat(ast.value) * 100); //flour?
    }
    throw new Error('Invalid value for Money scalar');
  }
}
