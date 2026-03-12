import { Skill } from '@src/course-specs/skill/models/skill.model';
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
export class DiplomaSkills extends Model {
  @AllowNull(false)
  @ForeignKey(() => Diploma)
  @Column({ onDelete: 'CASCADE', type: DataType.UUID })
  diplomaId: string;

  @BelongsTo(() => Diploma, 'diplomaId')
  diploma: Diploma;

  @ForeignKey(() => Skill)
  @AllowNull(false)
  @Column({ type: DataType.INTEGER, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  skillId: number;

  @BelongsTo(() => Skill, 'skillId')
  skill: Skill;
}
