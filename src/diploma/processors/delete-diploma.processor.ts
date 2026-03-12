import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Inject, Logger } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { CartService } from '@src/cart/services/cart.service';
import { Collection } from '@src/course/models/collection.model';
import { DiplomaCourses } from '../models/diploma-course.model';
import { UsersAssignment } from '@src/course/models/user-assignments.model';
import { User } from '@src/user/models/user.model';
import { CartItem } from '@src/cart/models/cart-item.model';
import { Cart } from '@src/cart/models/cart.model';
import { ContentReport } from '@src/report/models/report.model';
import { Notification } from '@src/notification/models/notification.model';
export interface CleanupDiplomaJob {
  diplomaId: string;
  collectionId?: string;
}

export const DIPLOMA_DELETION_QUEUE = 'diplomaDeletion';
export const CLEANUP_DIPLOMA_JOB = 'cleanupDiplomaData';

@Processor(DIPLOMA_DELETION_QUEUE)
export class DiplomaDeletionProcessor {
  private readonly logger = new Logger(DiplomaDeletionProcessor.name);

  constructor(
    @Inject(Repositories.CollectionsRepository)
    private readonly collectionRepo: IRepository<Collection>,
    @Inject(Repositories.DiplomaCoursesRepository)
    private readonly diplomaCoursesRepo: IRepository<DiplomaCourses>,
    @Inject(Repositories.UsersAssignmentsRepository)
    private readonly userAssignmentsRepo: IRepository<UsersAssignment>,
    @Inject(Repositories.UsersRepository)
    private readonly usersRepo: IRepository<User>,
    @Inject(Repositories.CartItemsRepository)
    private readonly cartItemRepo: IRepository<CartItem>,
    @Inject(Repositories.NotificationsRepository)
    private readonly notificationsRepo: IRepository<Notification>,
    @Inject(Repositories.CartsRepository)
    private readonly cartRepo: IRepository<Cart>,
    @Inject(Repositories.ContentReportsRepository)
    private readonly reportRepo: IRepository<ContentReport>,

    private readonly cartService: CartService
  ) {}

  /**
   * Cleans up all related data after diploma deletion
   */
  @Process(CLEANUP_DIPLOMA_JOB)
  async cleanupDiploma(job: Job<CleanupDiplomaJob>) {
    const { diplomaId, collectionId } = job.data;

    this.logger.log(`Starting cleanup for diploma ${diplomaId}`);

    try {
      // 1️) Collection
      if (collectionId) {
        await this.collectionRepo.deleteAll({ id: collectionId });
      }

      // 2️) Diploma courses
      await this.diplomaCoursesRepo.deleteAll({ diplomaId });

      // 3️) User assignments
      await this.userAssignmentsRepo.deleteAll({ diplomaId });

      // 4️) Notifications
      await this.notificationsRepo.deleteAll({ targetId: diplomaId });

      // 5️) Reports
      await this.reportRepo.deleteAll({ targetId: diplomaId });

      // 6️) Cart items cleanup
      const cartItems = await this.cartItemRepo.findAll(
        { learningProgramId: diplomaId },
        [{ model: Cart, required: true }]
      );

      for (const cartItem of cartItems) {
        const cart = await this.cartRepo.findOne({ id: cartItem.cartId });
        if (!cart) continue;

        const user = await this.usersRepo.findOne({ id: cart.userId });
        if (!user) continue;

        await this.cartService.deleteCartItem(user, cartItem.id);
      }

      this.logger.log(`Cleanup finished for diploma ${diplomaId}`);
    } catch (error) {
      this.logger.error(`Cleanup failed for diploma ${diplomaId}`, error.stack);
      throw error; // so Bull can retry
    }
  }
}
