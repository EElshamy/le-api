import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table
} from 'sequelize-typescript';
import { Course } from '../../../course/models/course.model';
import { Tool } from './tool.model';

@Table({ timestamps: false })
export class CourseTool extends Model {
  @AllowNull(false)
  @ForeignKey(() => Course)
  @Column({ onDelete: 'CASCADE', type: DataType.UUID })
  courseId: string;

  @BelongsTo(() => Course, 'courseId')
  course: Course;

  @ForeignKey(() => Tool)
  @AllowNull(false)
  @Column({ type: DataType.INTEGER, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  toolId: number;

  @BelongsTo(() => Tool, 'toolId')
  tool: Tool;
}
