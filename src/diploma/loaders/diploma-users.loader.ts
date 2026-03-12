import { tr } from '@faker-js/faker';
import { Inject, Injectable } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { NestDataLoader } from '@src/_common/types/loader.interface';
import { UsersAssignment } from '@src/course/models/user-assignments.model';
import { User } from '@src/user/models/user.model';
import * as DataLoader from 'dataloader';
import { DiplomaService } from '../diploma.service';
@Injectable()
export class DiplomaUsersLoader implements NestDataLoader {
  constructor(
    @Inject(Repositories.UsersAssignmentsRepository)
    private readonly userAssignmentsRepo: IRepository<UsersAssignment>,
    private readonly diplomaService: DiplomaService
  ) {}
  generateDataLoader(currentUser?: User): DataLoader<any, any> {
    return new DataLoader(async (diplomaIds: string[]) => {
      return this.usersByDiplomasIds(diplomaIds);
    });
  }

  async usersByDiplomasIds(diplomasIds: string[]) {
    let diplomasUsers = await this.userAssignmentsRepo.findAll(
      {
        diplomaId: diplomasIds
      },
      [{ model: User }],
      [],
      ['diplomaId', 'userId']
    );
    diplomasUsers = diplomasUsers.reduce((acc, curr) => {
      const exists = acc.some(
        item => item.userId === curr.userId && item.diplomaId === curr.diplomaId
      );
      if (!exists) {
        acc.push(curr);
      }
      return acc;
    }, []);

    const diplomasUsersProgress = await Promise.all(
      diplomasUsers.map(async diplomaUser => {
        const { completedLessons, totalLessons } =
          await this.diplomaService.getUserCompletedLessonsForDiploma(
            diplomaUser.diplomaId,
            diplomaUser.userId
          );
        return {
          ...diplomaUser.dataValues,
          user: {
            ...diplomaUser.user.dataValues,
            completedLessonsInDiploma: completedLessons,
            totalLessonsInDiploma: totalLessons
          }
        };
      })
    );
    const mappedDiplomasUsers = diplomasIds.map(dId =>
      diplomasUsersProgress.filter(dip => dip.diplomaId === dId)
    );

    return mappedDiplomasUsers.map(mdu => mdu.map(d => d.user));
  }
}

//     const sql = `
// SELECT  distinct *
// FROM public."UsersAssignments" ua
// LEFT JOIN public."Users" u ON ua."userId" = u.id
// `;
//     const diplomasUsers = (await this.sequelize.query(sql, {
//       replacements: { diplomasIds },
//       type: QueryTypes.SELECT
//     })) as UsersAssignment[];
