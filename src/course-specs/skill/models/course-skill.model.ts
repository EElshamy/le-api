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
import { Skill } from './skill.model';

@Table({ timestamps: false })
export class CourseSkill extends Model {
  @AllowNull(false)
  @ForeignKey(() => Course)
  @Column({ onDelete: 'CASCADE', type: DataType.UUID })
  courseId: string;

  @BelongsTo(() => Course, 'courseId')
  course: Course;

  @ForeignKey(() => Skill)
  @AllowNull(false)
  @Column({ type: DataType.INTEGER, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  skillId: number;

  @BelongsTo(() => Skill, 'skillId')
  skill: Skill;
}
