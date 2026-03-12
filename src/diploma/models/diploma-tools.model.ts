import { Tool } from '@src/course-specs/tool/models/tool.model';
import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table
} from 'sequelize-typescript';
import { Diploma } from './diploma.model';

@Table({ timestamps: false })
export class DiplomaTools extends Model {
  @AllowNull(false)
  @ForeignKey(() => Diploma)
  @Column({ onDelete: 'CASCADE', type: DataType.UUID })
  diplomaId: string;

  @BelongsTo(() => Diploma, 'diplomaId')
  diploma: Diploma;

  @ForeignKey(() => Tool)
  @AllowNull(false)
  @Column({ type: DataType.INTEGER, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  toolId: number;

  @BelongsTo(() => Tool, 'toolId')
  Tool: Tool;
}
