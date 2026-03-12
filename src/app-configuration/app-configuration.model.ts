import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  AllowNull,
  Column,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
  Unique
} from 'sequelize-typescript';

@Table({ tableName: 'AppConfigurations', paranoid: true, timestamps: true })
@ObjectType()
export class AppConfiguration extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @Unique
  @AllowNull(false)
  @Column
  @Field()
  key: string;

  @AllowNull(false)
  @Column({ type: DataType.TEXT })
  @Field()
  value: string;

  @AllowNull(false)
  @Column
  @Field()
  displayAs: string;
}
