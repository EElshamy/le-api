import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { paginate } from '@src/_common/paginator/paginator.service';
import { getColumnEnum } from '@src/_common/utils/columnEnum';
import { LearningProgramTypeEnum } from '@src/cart/enums/cart.enums';
import { User } from '@src/user/models/user.model';
import { FindAttributeOptions, GroupOption, Includeable } from 'sequelize';
import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from 'sequelize-typescript';

@Table({
  tableName: 'Reviews',
  indexes: [
    { name: 'idx_reviews_created_at', fields: ['createdAt'] },
    { name: 'idx_reviews_learning_program_created_at', fields: ['learningProgramId', 'createdAt'] },
    { name: 'idx_reviews_user_id', fields: ['userId'] }
  ]
})
@ObjectType()
export class Review extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(() => ID)
  id: string;

  @Column({
    type: DataType.UUID
  })
  @Field()
  learningProgramId: string;

  @Column(getColumnEnum(LearningProgramTypeEnum))
  @Field(() => LearningProgramTypeEnum)
  learningProgramType: LearningProgramTypeEnum;

  @ForeignKey(() => User)
  @Column({ onDelete: 'set null', type: DataType.UUID })
  userId: string;

  @BelongsTo(() => User)
  @Field(() => User, { nullable: true })
  user: User;

  @Column
  @Field()
  review: string;

  @Column
  @Field(() => Int)
  rating: number;

  @CreatedAt
  @Field(() => Date)
  createdAt: Date;

  @UpdatedAt
  @Field(() => Date)
  updatedAt: Date;

  static async paginate(
    filter = {},
    sort = '-createdAt',
    page = 0,
    limit = 15,
    include?: Includeable[],
    attributes?: FindAttributeOptions,
    isNestAndRaw?: boolean,
    subQuery?: boolean,
    group?: GroupOption
  ) {
    return paginate<Review>(
      this,
      filter,
      sort,
      page,
      limit,
      include,
      attributes,
      isNestAndRaw,
      subQuery,
      group
    );
  }
}
