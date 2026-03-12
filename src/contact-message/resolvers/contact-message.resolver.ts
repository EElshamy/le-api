import { UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver
} from '@nestjs/graphql';
import { IDataLoaders } from '@src/_common/dataloader/dataloader.interface';
import { GqlBooleanResponse } from '@src/_common/graphql/graphql-response.type';
import { Timestamp } from '@src/_common/graphql/timestamp.scalar';
import { NullablePaginatorInput } from '@src/_common/paginator/paginator.input';
import { CurrentUser } from '@src/auth/auth-user.decorator';
import { AuthGuard } from '@src/auth/auth.guard';
import { HasPermission, HasRole } from '@src/auth/auth.metadata';
import { ReportSortArgs } from '@src/report/interfaces/report-sort.input';
import { ContactMessagePermissionsEnum, InboxPermissionsEnum } from '@src/security-group/security-group-permissions';
import { User } from '@src/user/models/user.model';
import { Transactional } from 'sequelize-transactional-typescript';
import { ContactMessageInput } from '../inputs/contact-message.input';
import { ContactMessageFilterInput } from '../inputs/contact-messages-filter.input';
import { CreateContactMessageInput } from '../inputs/create-contact-message.input';
import { DeleteContactMessageInput } from '../inputs/delete-contact-message.input';
import { UpdateContactMessageInput } from '../inputs/update-contact-message.input';
import { ContactMessage } from '../models/contact-message.model';
import { ContactMessageService } from '../services/contact-message.service';
import {
  GqlContactMessageResponse,
  GqlContactMessagesResponse
} from '../types/contact-message.response';
import { UserRoleEnum } from '@src/user/user.enum';
import { Throttle } from '@nestjs/throttler';

@Resolver(of => ContactMessage)
export class ContactMessageResolver {
  constructor(private readonly contactMessageService: ContactMessageService) {}

  //**  ---------------------- MUTATIONS ------------------------- */

  // RequireAppCheck()
  @Throttle({
    default: { limit: 10, ttl: 60 * 1000, blockDuration: 60 * 60 * 1000 }
  }) // 10 requests per min or block for 1 hour
  @Mutation(returns => GqlContactMessageResponse)
  @Transactional()
  async sendContactMessage(
    @Args('input') input: CreateContactMessageInput,
    @CurrentUser() user: User
  ) {
    return await this.contactMessageService.createContactMessage(input, user);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Mutation(returns => GqlContactMessageResponse)
  @Transactional()
  async resolveOrUnResolveContactMessageBoard(
    @Args() input: UpdateContactMessageInput
  ) {
    return await this.contactMessageService.resolveOrUnResolveContactMessageBoard(
      input
    );
  }

  
  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(InboxPermissionsEnum.DELETE_INBOX)
  @Mutation(returns => GqlBooleanResponse)
  @Transactional()
  async deleteContactMessageBoard(@Args() input: DeleteContactMessageInput) {
    return await this.contactMessageService.deleteContactMessageBoard(input);
  }

  //**  ---------------------- QUERIES ------------------------- */

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Query(returns => GqlContactMessageResponse)
  async contactMessageBoard(@Args() input: ContactMessageInput) {
    return await this.contactMessageService.contactMessageOrError(
      input.contactMessageId
    );
  }

  @UseGuards(AuthGuard)
  @HasPermission(InboxPermissionsEnum.READ_INBOX)
  @Query(returns => GqlContactMessagesResponse)
  async inboxBoard(
    @Args() filter: ContactMessageFilterInput,
    @Args() paginate: NullablePaginatorInput,
    @Args() sort: ReportSortArgs
  ) {
    return await this.contactMessageService.contactMessagesBoard(
      filter.filter,
      sort.sort,
      paginate.paginate
    );
  }

  //** ------------------ RESOLVE FIELDS ------------------ */

  @ResolveField(type => Timestamp)
  createdAt(@Parent() contactMessage: ContactMessage) {
    return new Date(contactMessage.createdAt).valueOf();
  }

  @ResolveField(type => Timestamp, { nullable: true })
  resolvedAt(@Parent() contactMessage) {
    if (!contactMessage.resolvedAt) return null;
    return new Date(contactMessage.resolvedAt).valueOf();
  }

  // ****************** DataLoader ******************* //

  @ResolveField(() => User)
  async user(
    @Parent() contactMessage: ContactMessage,
    @Context('loaders') loaders: IDataLoaders
  ): Promise<User> {
    if (!contactMessage.userId) return null;
    return loaders.userLoader.load(contactMessage.userId);
  }
}
