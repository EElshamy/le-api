import { Field, ID, ObjectType } from '@nestjs/graphql';
import { ValidPermissions } from '@src/_common/custom-validator/valid-permissions';
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
  Unique,
  UpdatedAt
} from 'sequelize-typescript';

@ObjectType()
@Table({ timestamps: true, paranoid: true, tableName: 'SecurityGroups' })
export class SecurityGroup extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @AllowNull(true)
  @Column
  @Field({ nullable: true })
  code: string;

  @Default(true)
  @Column
  @Field()
  isActive: boolean;

  @Unique
  @AllowNull(false)
  @Column
  @Field()
  groupName: string;

  @AllowNull(true)
  @Column({ type: DataType.TEXT })
  @Field({ nullable: true })
  description?: string;

  @ValidPermissions()
  @AllowNull(false)
  @Column({ type: DataType.ARRAY(DataType.STRING) })
  @Field(() => [String])
  permissions: string[];

  @CreatedAt
  @Column({ type: DataType.DATE })
  createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  updatedAt: Date;

  static async paginate(
    filter = {},
    sort = '-createdAt',
    page = 0,
    limit = 15,
    include: any = [],
    attributes: any = [],
    isNestAndRaw: boolean = true
  ): Promise<PaginationRes<SecurityGroup>> {
    return paginate<SecurityGroup>(
      this,
      filter,
      sort,
      page,
      limit,
      include,
      attributes,
      isNestAndRaw
    );
  }
}
