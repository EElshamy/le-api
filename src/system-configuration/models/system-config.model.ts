import { Field, ID, ObjectType } from '@nestjs/graphql';
import { paginate } from '@src/_common/paginator/paginator.service';
import { PaginationRes } from '@src/_common/paginator/paginator.types';
import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from 'sequelize-typescript';

@Table({ timestamps: true })
@ObjectType()
export class SystemConfig extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @AllowNull(true)
  @Column
  @Field({ nullable: true })
  email: string;

  @AllowNull(true)
  @Column
  @Field({ nullable: true })
  phone: string;

  @AllowNull(true)
  @Column
  @Field({ nullable: true })
  whatsapp: string;

  @AllowNull(true)
  @Column
  @Field({ nullable: true })
  facebook: string;

  @AllowNull(true)
  @Column
  @Field({ nullable: true })
  instagram: string;

  @Column({ type: DataType.FLOAT })
  @Field({ nullable: true })
  vat: number;

  @Column({ type: DataType.FLOAT })
  @Field({ nullable: true })
  paymentGatewayVat: number;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  updatedAt?: Date;

  @CreatedAt
  @Column({ type: DataType.DATE })
  createdAt: Date;

  static async paginate(
    filter = {},
    sort = '-createdAt',
    page = 0,
    limit = 15,
    include = []
  ): Promise<PaginationRes<SystemConfig>> {
    return paginate<SystemConfig>(this, filter, sort, page, limit, include);
  }
}
