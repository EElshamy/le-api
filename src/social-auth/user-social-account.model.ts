import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  Unique,
  ForeignKey,
  CreatedAt,
  UpdatedAt,
  AllowNull,
  BelongsTo
} from 'sequelize-typescript';
import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../user/models/user.model';
import { getColumnEnum } from '../_common/utils/columnEnum';
import { SocialProvidersEnum } from './social-auth.enum';

@Table({ omitNull: true, timestamps: true })
@ObjectType()
export class UserSocialAccount extends Model {
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  userId: string;

  @BelongsTo(() => User)
  user: User;

  @AllowNull(false)
  @Default(SocialProvidersEnum.FACEBOOK)
  @Column({ type: getColumnEnum(SocialProvidersEnum) })
  @Field(type => SocialProvidersEnum)
  provider: SocialProvidersEnum;

  @AllowNull(false)
  @Unique
  @Column({ type: DataType.TEXT })
  @Field()
  providerId: string;

  @Field({
    defaultValue: false,
    description: 'returns valid data only in the context of "mySocialAccounts" Query'
  })
  allowDisconnect: boolean;

  @CreatedAt
  @Column
  createdAt: Date;

  @UpdatedAt
  @Column
  updatedAt: Date;
}
