import { Course } from '@src/course/models/course.model';
import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table
} from 'sequelize-typescript';
import { Diploma } from '@src/diploma/models/diploma.model';
import { paginate } from '@src/_common/paginator/paginator.service';

@Table({ timestamps: true })
export class DiplomaCourses extends Model {
  @ForeignKey(() => Diploma)
  @Column
  diplomaId: string;

  @BelongsTo(() => Diploma)
  diploma: Diploma;

  @ForeignKey(() => Course)
  @Column
  courseId: string;

  @BelongsTo(() => Course)
  course: Course;

  @AllowNull
  @Column({ type: DataType.FLOAT })
  commissionOfCourseUnderDiploma: number;

  @Column
  priceOfCourseUnderDiploma: number;

  // same as soft delete
  @Column({ defaultValue: false, type: DataType.BOOLEAN })
  keptForOldAssignments: boolean;


  static async paginate(
    filter = {},
    sort = '-createdAt',
    page = 0,
    limit = 15,
    include: any = [],
    attributes: any = [],
    isNestAndRaw: boolean = true
  ) {
    return paginate<DiplomaCourses>(
      this,
      filter,
      sort,
      page,
      limit,
      include,
      attributes,
      isNestAndRaw
    );
  }
}
