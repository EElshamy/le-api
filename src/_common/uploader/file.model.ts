import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '@src/user/models/user.model';
import {
  AllowNull,
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
import { getColumnEnum } from '../utils/columnEnum';
import { StorageProviderEnum } from './file.enum';
import { ModelWhichUploadedFor } from './uploader.type';

@Table({
  timestamps: true,
  tableName: 'Files',
  indexes: [{ fields: [{ name: 'hasReferenceAtDatabase' }] }],
  paranoid: true
})
@ObjectType()
export class File extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  id: string;

  @AllowNull(false)
  @Column
  @Field()
  relativeDiskDestination: string;

  @AllowNull(false)
  @Column
  @Field()
  name: string;

  @AllowNull(true)
  @Column
  @Field({ nullable: true })
  encoding?: string;

  @AllowNull(false)
  @Column
  @Field({ nullable: true })
  mimetype?: string;

  @AllowNull(true)
  @Column
  videoId?: string;

  @Default(StorageProviderEnum.LOCAL)
  @Column({ type: getColumnEnum(StorageProviderEnum) })
  storageProvider: StorageProviderEnum;

  @AllowNull(true)
  @Column
  sizeInBytes?: number;

  @Default([])
  @AllowNull(false)
  @Column({ type: DataType.ARRAY(DataType.STRING) })
  downloadedByUsersIds?: string[];

  @Default(false)
  @AllowNull(false)
  @Column({ type: DataType.BOOLEAN })
  hasReferenceAtDatabase: boolean;

  @AllowNull(true)
  @Column({ type: DataType.JSONB })
  modelWhichUploadedFor?: ModelWhichUploadedFor;

  @ForeignKey(() => User)
  @AllowNull(true)
  @Column({ onDelete: 'SET NULL', type: DataType.UUID })
  uploadedById?: string;

  @BelongsTo(() => User)
  uploadedBy?: User;

  @CreatedAt
  @Column({ type: DataType.DATE })
  createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  updatedAt: Date;
}
