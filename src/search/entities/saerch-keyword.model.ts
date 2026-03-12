import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from 'sequelize-typescript';

@ObjectType()
@Table({
  tableName: 'SearchKeywords'
})
export class SearchKeyword extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @Column({ allowNull: false })
  @Field()
  arText: string;

  @Column({ allowNull: false })
  @Field()
  enText: string;

  @CreatedAt
  @Field(() => Date)
  createdAt: Date;

  @UpdatedAt
  @Field(() => Date)
  updatedAt: Date;
}
