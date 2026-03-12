import { UploadedVideoLibrary } from '@src/_common/bunny/bunny.type';
import {
  Column,
  CreatedAt,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript';

@Table
export class Collection extends Model {
  @PrimaryKey
  @Column
  id: string;

  @Default(false)
  @Column({ type: DataType.BOOLEAN })
  hasReference: boolean;

  @Column
  name: string;

  @Column
  userId: string;

  @Column
  type: UploadedVideoLibrary;

  @CreatedAt
  createdAt: Date;
}
