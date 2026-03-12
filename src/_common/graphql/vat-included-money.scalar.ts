// import { Inject, OnModuleInit } from '@nestjs/common';
// import { CustomScalar, Scalar } from '@nestjs/graphql';
// import { SystemConfig } from '@src/system-configuration/models/system-config.model';
// import { Kind, ValueNode } from 'graphql';
// import { Repositories } from '../database/database-repository.enum';
// import { IRepository } from '../database/repository.interface';

// @Scalar('VatIncludedMoney')
// export class VatIncludedMoneyScalar
//   implements CustomScalar<number, number>, OnModuleInit
// {
//   description = 'Money with vat custom scalar type (stored in cents)';
//   private vatPercentage: number;
//   constructor(
//     @Inject(Repositories.SystemConfigRepository)
//     private readonly systemConfigsRepository: IRepository<SystemConfig>
//   ) {}

//   async onModuleInit(): Promise<void> {
//     this.vatPercentage =
//       ((await this.systemConfigsRepository.findOne({}))?.vat ?? 14) / 100;
//   }

//   serialize(totalPrice: number): number {
//     return Math.round(totalPrice / 100 / (1 + this.vatPercentage));
//   }

//   parseValue(totalPrice: number): number {
//     //NOTE: flooring the amount to the nearest integer
//     //read this: https://shopify.engineering/eight-tips-for-hanging-pennies
//     return Math.round((totalPrice / (1 + this.vatPercentage)) * 100);
//   }

//   parseLiteral(ast: ValueNode): number {
//     if (ast.kind === Kind.FLOAT || ast.kind === Kind.INT) {
//       return Math.round(
//         (parseFloat(ast.value) / (1 + this.vatPercentage)) * 100
//       );
//     }

//     throw new Error('Invalid value for Vat Money scalar');
//   }
// }

// // @Scalar('VatIncludedMoney')
// // export class VatIncludedMoneyScalar
// //   implements CustomScalar<number, number>, OnModuleInit
// // {
// //   description = 'Money with vat custom scalar type (stored in cents)';
// //   private vatPercentage: number;
// //   constructor(
// //     @Inject(Repositories.SystemConfigRepository)
// //     private readonly systemConfigsRepository: IRepository<SystemConfig>
// //   ) {}

// //   async onModuleInit(): Promise<void> {
// //     this.vatPercentage =
// //       ((await this.systemConfigsRepository.findOne({}))?.vat ?? 14) / 100;
// //   }

// //   serialize(value: number): number {
// //     return Math.round((value * 100) / (1 - this.vatPercentage) / 100) / 100;
// //   }

// //   parseValue(value: number): number {
// //     //NOTE: flooring the amount to the nearest integer
// //     //read this: https://shopify.engineering/eight-tips-for-hanging-pennies
// //     return Math.floor((value - value * this.vatPercentage) * 100);
// //   }

// //   parseLiteral(ast: ValueNode): number {
// //     if (ast.kind === Kind.FLOAT || ast.kind === Kind.INT) {
// //       //NOTE: flooring the amount to the nearest integer
// //       //read this: https://shopify.engineering/eight-tips-for-hanging-pennies
// //       return Math.floor(
// //         (parseFloat(ast.value) - parseFloat(ast.value) * this.vatPercentage) *
// //           100
// //       );
// //     }
// //     throw new Error('Invalid value for Vat Money scalar');
// //   }
// // }
