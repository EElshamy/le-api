import { UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver
} from '@nestjs/graphql';
import { countries } from '@src/_common/country/countries';
import { GqlBooleanResponse } from '@src/_common/graphql/graphql-response.type';
import { MoneyScalar } from '@src/_common/graphql/money.scaler';
import { Timestamp } from '@src/_common/graphql/timestamp.scalar';
import { NullablePaginatorInput } from '@src/_common/paginator/paginator.input';
import { PaginationRes } from '@src/_common/paginator/paginator.types';
import { AuthGuard } from '@src/auth/auth.guard';
import { HasPermission, HasRole } from '@src/auth/auth.metadata';
import { Cart } from '@src/cart/models/cart.model';
import { Purchase } from '@src/cart/models/purchase.model';
import { CartService } from '@src/cart/services/cart.service';
import { PurchaseService } from '@src/cart/services/purchase.service';
import { CertificationService } from '@src/certification/certification.service';
import { UserCourseProgress } from '@src/course/interfaces/course.type';
import { Review } from '@src/reviews/review.model';
import { ReviewService } from '@src/reviews/review.service';
import { RevenueShareService } from '@src/payment/services/revenue.service';
import {
  AdministratorPermissionsEnum,
  UserPermissionsEnum
} from '@src/security-group/security-group-permissions';
import { SecurityGroup } from '@src/security-group/security-group.model';
import { format } from 'date-fns';
import { IDataLoaders } from '../../_common/dataloader/dataloader.interface';
import { CurrentUser } from '../../auth/auth-user.decorator';
import { Lecturer } from '../../lecturer/models/lecturer.model';
import { Revenue } from '../../payment/interfaces/user-profit.interface';
import { NullableAdministratorBoardFilter } from '../inputs/administrator-board-filter.input';
import { nullableAdministratorBoardSort } from '../inputs/administrator-board-sort.input';
import {
  ChangePasswordBoardInput,
  ChangePasswordInput
} from '../inputs/change-password.input';
import { CreateAdministratorBoardInput } from '../inputs/create-administrator.input';
import { CreateUserBoardInput } from '../inputs/create-user-board.input';
import { UpdateAdminProfileInput } from '../inputs/update-admin-profile.input';
import { UpdateAdministratorBoardInput } from '../inputs/update-administrator-board.input';
import { UpdateUserBoardInput } from '../inputs/update-user-board.input';
import {
  UpdatePhone,
  updateProfilePicture,
  UpdateUserProfileInput
} from '../inputs/update-user-profile.input';
import {
  UserBoardInput,
  UserInput,
  UsersBoardInput
} from '../inputs/users-board.filter';
import { UsersBoardSortInput } from '../inputs/users-board.sort.input';
import { User } from '../models/user.model';
import { UserService } from '../services/user.service';
import { LangEnum, UserRoleEnum } from '../user.enum';
import { GqlUserResponse, GqlUsersResponse } from '../user.response';
import { CountryType } from '../user.type';
import { GqlSiteMapResponse } from '@src/_common/graphql/site-map.resoponse';

@Resolver(() => User)
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    private readonly reviewService: ReviewService,
    private readonly purchaseService: PurchaseService,
    private readonly cartService: CartService,
    private readonly certificationService: CertificationService,
    private readonly revenueShareService: RevenueShareService
  ) {}

  //** --------------------- QUERIES --------------------- */

  @HasPermission(UserPermissionsEnum.READ_USERS)
  @UseGuards(AuthGuard)
  @Query(() => GqlUsersResponse)
  async usersBoard(
    @Args() filter: UsersBoardInput,
    @Args() paginate: NullablePaginatorInput,
    @Args() sort: UsersBoardSortInput,
    @CurrentUser('id') currentUserId: string
  ): Promise<PaginationRes<User>> {
    return await this.userService.usersBoard(
      currentUserId,
      filter.filter,
      paginate.paginate,
      sort.sort
    );
  }

  @HasPermission(AdministratorPermissionsEnum.READ_ADMINISTRATORS)
  @UseGuards(AuthGuard)
  @Query(() => GqlUsersResponse)
  async administratorsBoard(
    @Args() filter: NullableAdministratorBoardFilter,
    @Args() paginate: NullablePaginatorInput,
    @Args() sort: nullableAdministratorBoardSort,
    @CurrentUser('id') currentUserId: string
  ): Promise<PaginationRes<User>> {
    return await this.userService.administratorsBoard(
      currentUserId,
      filter.filter,
      paginate.paginate,
      sort.sort
    );
  }

  @HasPermission(UserPermissionsEnum.READ_USERS)
  @UseGuards(AuthGuard)
  @Query(() => GqlUserResponse)
  async userBoard(@Args() input: UserBoardInput): Promise<User> {
    return await this.userService.userOrError(input);
  }

  @HasPermission(AdministratorPermissionsEnum.READ_ADMINISTRATORS)
  @UseGuards(AuthGuard)
  @Query(() => GqlUserResponse)
  async administratorBoard(@Args() input: UserBoardInput): Promise<User> {
    return await this.userService.administratorOrError(input);
  }

  @Query(() => GqlSiteMapResponse)
  async lecturersForSiteMap() {
    return await this.userService.usersWithLecturerRoleForSiteMap();
  }

  @Query(() => GqlBooleanResponse)
  async seedInitialPasswordHistory(): Promise<boolean> {
    return await this.userService.seedInitialPasswordHistory();
  }
  //** --------------------- MUTATIONS --------------------- */

  @Mutation(() => GqlBooleanResponse)
  async seedAdmin(): Promise<boolean> {
    return await this.userService.seedAdmin();
  }

  @HasRole(UserRoleEnum.USER)
  @UseGuards(AuthGuard)
  @Mutation(() => GqlUserResponse)
  async updateUserProfile(
    @Args('input') input: UpdateUserProfileInput,
    @CurrentUser('id') currentUserId: string
  ): Promise<User> {
    const user = await this.userService.updateUserProfile(input, currentUserId);
    // await this.certificationService.deleteCertificateForUser(user);
    // await this.certificationService.createCertificationsForUser(user);
    return user;
  }

  @HasRole(UserRoleEnum.ADMIN)
  @UseGuards(AuthGuard)
  @Mutation(() => GqlUserResponse)
  async updateAdminProfile(
    @Args('input') input: UpdateAdminProfileInput,
    @CurrentUser('id') currentUserId: string
  ): Promise<User> {
    return await this.userService.updateAdminProfile(input, currentUserId);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => GqlUserResponse)
  @HasRole(UserRoleEnum.USER)
  async changePassword(
    @Args('input') input: ChangePasswordInput,
    @CurrentUser('id') currentUserId: string
  ): Promise<User> {
    return await this.userService.changePassword(input, currentUserId);
  }
  @UseGuards(AuthGuard)
  @Mutation(() => GqlUserResponse)
  @HasRole(UserRoleEnum.ADMIN, UserRoleEnum.LECTURER)
  async changePasswordBoard(
    @Args('input') input: ChangePasswordBoardInput,
    @CurrentUser('id') currentUserId: string
  ): Promise<User> {
    return await this.userService.changePasswordBoard(input, currentUserId);
  }

  @HasPermission(UserPermissionsEnum.DELETE_USERS)
  @UseGuards(AuthGuard)
  @Mutation(() => GqlBooleanResponse)
  async deleteUserBoard(@Args() { userId }: UserInput): Promise<boolean> {
    return await this.userService.deleteUserBoard(userId);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => GqlBooleanResponse)
  async deleteAccount(@CurrentUser('id') userId: string): Promise<boolean> {
    return await this.userService.deleteUserBoard(userId);
  }

  @HasPermission(AdministratorPermissionsEnum.DELETE_ADMINISTRATORS)
  @UseGuards(AuthGuard)
  @Mutation(() => GqlBooleanResponse)
  async deleteAdministratorBoard(
    @Args() { userId }: UserInput,
    @CurrentUser('id') currentUserId: string
  ): Promise<boolean> {
    return await this.userService.deleteAdministratorBoard(
      userId,
      currentUserId
    );
  }

  @UseGuards(AuthGuard)
  @Mutation(() => GqlUserResponse)
  @HasPermission(UserPermissionsEnum.UPDATE_USERS)
  async updateUserBoard(
    @Args('input') input: UpdateUserBoardInput
  ): Promise<User> {
    return await this.userService.updateUserBoard(input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => GqlUserResponse)
  @HasPermission(AdministratorPermissionsEnum.UPDATE_ADMINISTRATORS)
  async updateAdministratorBoard(
    @Args('input') input: UpdateAdministratorBoardInput
  ): Promise<User> {
    return await this.userService.updateAdministratorBoard(input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => GqlUserResponse)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(UserPermissionsEnum.CREATE_USERS)
  async createUserBoard(
    @Args('input') input: CreateUserBoardInput
  ): Promise<User> {
    return await this.userService.createUserBoard(input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => GqlUserResponse)
  @HasPermission(AdministratorPermissionsEnum.CREATE_ADMINISTRATORS)
  async createAdministratorBoard(
    @Args('input') input: CreateAdministratorBoardInput
  ): Promise<User> {
    return await this.userService.createAdministratorBoard(input);
  }

  @HasPermission(UserPermissionsEnum.UPDATE_USERS)
  @UseGuards(AuthGuard)
  @Mutation(() => GqlBooleanResponse)
  async blockUnblockUserBoard(
    @Args() input: UserInput,
    @CurrentUser('id') currentUserId: string
  ): Promise<boolean> {
    return await this.userService.toggleBlockUserBoard(
      input.userId,
      currentUserId
    );
  }

  @HasPermission(AdministratorPermissionsEnum.UPDATE_ADMINISTRATORS)
  @UseGuards(AuthGuard)
  @Mutation(() => GqlBooleanResponse)
  async blockUnblockAdministratorBoard(
    @Args() input: UserInput,
    @CurrentUser('id') currentUserId: string
  ): Promise<boolean> {
    return await this.userService.toggleBlockUserBoard(
      input.userId,
      currentUserId
    );
  }

  @UseGuards(AuthGuard)
  @Mutation(() => GqlUserResponse)
  async updatePhone(
    @Args('input') input: UpdatePhone,
    @CurrentUser('id') currentUserId: string
  ): Promise<User> {
    return await this.userService.updatePhone(input, currentUserId);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => GqlUserResponse)
  async updateProfilePicture(
    @Args('input') input: updateProfilePicture,
    @CurrentUser('id') currentUserId: string
  ): Promise<User> {
    return await this.userService.updateUserProfilePicture(
      input,
      currentUserId
    );
  }

  @UseGuards(AuthGuard)
  @Mutation(() => GqlBooleanResponse)
  async deleteProfilePicture(
    @CurrentUser('id') currentUserId: string
  ): Promise<boolean> {
    return await this.userService.deleteUserProfilePicture(currentUserId);
  }
  //** ------------------ RESOLVE FIELDS ------------------ */

  @ResolveField(() => Timestamp)
  createdAt(user: User): number {
    return new Date(user.createdAt).valueOf();
  }

  @ResolveField(() => String)
  readablecreatedAt(user: User): string {
    return format(new Date(user.createdAt), 'yyyy/MM/dd h:m:s');
  }

  @ResolveField(() => Timestamp)
  updatedAt(user: User): number {
    return new Date(user.updatedAt).valueOf();
  }

  @ResolveField(() => String)
  readableUpdatedAt(user: User): string {
    return format(new Date(user.updatedAt), 'yyyy/MM/dd h:m:s');
  }

  @ResolveField(() => CountryType, { nullable: true })
  country(@Parent() user: User, @Context('lang') lang: LangEnum): CountryType {
    if (!user.country) return null;
    return {
      isoCode: user.country,
      name: countries[user.country][lang]
    };
  }
  @ResolveField(() => CountryType, { nullable: true })
  nationality(
    @Parent() user: User,
    @Context('lang') lang: LangEnum
  ): CountryType {
    if (!user.nationality) return null;
    return {
      isoCode: user.nationality,
      name: countries[user.nationality][lang]
    };
  }

  @ResolveField(() => String, { nullable: true })
  fullName(@Parent() user: User, @Context('lang') lang: LangEnum): string {
    if (lang === LangEnum.EN) {
      return user[`enFullName`];
    } else if (lang === LangEnum.AR) {
      const arFullName = user[`arFullName`];
      return arFullName === 'undefined undefined' ?
          user[`enFullName`]
        : arFullName;
    }
  }

  @ResolveField(() => String, { nullable: true })
  arFullName(@Parent() user: User): string {
    return user[`arFullName`] === 'undefined undefined' ?
        user[`enFullName`]
      : user[`arFullName`];
  }

  @ResolveField(() => UserCourseProgress, { nullable: true })
  async courseProgress(
    @Parent() user: User,
    @Args('courseId', { type: () => ID, nullable: true }) courseId: string
  ): Promise<UserCourseProgress> {
    // Call the service to get the user's course progress
    return await this.userService.getUserCourseProgress(user.id, courseId);
  }

  @ResolveField(() => Revenue, { nullable: true })
  async profit(
    @Parent() user: User,
    @Args('learningProgramId', { type: () => ID, nullable: true })
    learningProgramId: string
  ): Promise<Revenue> {
    return await this.revenueShareService.getUserProfitsForLearningProgram(
      user.id,
      learningProgramId
    );
  }

  @ResolveField(() => MoneyScalar)
  async purchaseAmount(@Parent() user: User): Promise<number> {
    return await this.revenueShareService.getUserTotalPurchaseAmount(user.id);
  }

  @ResolveField(() => Review, { nullable: true })
  async review(
    @Parent() user: User,
    @CurrentUser() currentUser: User,
    @Args('courseId', { type: () => ID }) courseId: string
  ): Promise<Review> {
    return await this.reviewService.review(user.id, courseId);
  }

  //** --------------------- DATALOADER --------------------- */

  @ResolveField(() => SecurityGroup, { nullable: true })
  async securityGroup(
    @Parent() user: User,
    @Context('loaders') loaders: IDataLoaders
  ): Promise<SecurityGroup> {
    if (!user.securityGroupId) return null;
    return await loaders.securityGroupLoader.load(user.securityGroupId);
  }

  @ResolveField(() => Lecturer, { nullable: true })
  async lecturer(
    @Parent() user: User,
    @Context('loaders') loaders: IDataLoaders
  ): Promise<Lecturer | null> {
    // if (!user?.id) return null;
    return await loaders.lecturerLoader.load(user.id);
  }
  @ResolveField(() => Cart, { nullable: true, complexity: 3 })
  async cart(@Parent() user: User): Promise<Cart> {
    return this.cartService.getCart(user);
  }
  @ResolveField(() => [Purchase], { nullable: true, complexity: 3 })
  async purchases(@Parent() user: User): Promise<Purchase[]> {
    return this.purchaseService.getPurchase(user.id);
  }

  @ResolveField(() => Number, { nullable: true })
  async notificationsCount(@Parent() user: User): Promise<number> {
    return this.userService.getNotificationsCount(user.id);
  }

  @ResolveField(() => Number, { nullable: true })
  async cartItemsCount(@Parent() user: User): Promise<number> {
    return this.userService.getCartItemsCount(user.id);
  }

  @ResolveField(() => String, { nullable: true })
  async email(
    @Parent() user: User,
    @CurrentUser() currentUser: User
  ): Promise<string | null> {
    //  Prevent accessing properties of null user
    if (!user || !currentUser) return null;
    if (!user.email) return null;

    //  Check if current user is the owner or admin
    if (user.id === currentUser.id || currentUser.role === UserRoleEnum.ADMIN)
      return user.email;
    else return '************';
  }

  @ResolveField(() => String, { nullable: true })
  async phone(
    @Parent() user: User,
    @CurrentUser() currentUser: User
  ): Promise<string | null> {
    //  Prevent accessing properties of null user
    if (!user || !currentUser) return null;
    if (!user.phone) return null;

    //  Check if current user is the owner or admin
    if (user.id === currentUser.id || currentUser.role === UserRoleEnum.ADMIN)
      return user.phone;
    else return '************';
  }
}
