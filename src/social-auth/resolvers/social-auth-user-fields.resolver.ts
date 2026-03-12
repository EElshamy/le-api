import { Context, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { User } from '../../user/models/user.model';
import { IDataLoaders } from '../../_common/dataloader/dataloader.interface';
import { UserSocialAccount } from '../user-social-account.model';

@Resolver(() => User)
export class SocialAuthUserFieldsResolver {
  @ResolveField(type => [UserSocialAccount], { nullable: true })
  socialAccounts(@Parent() user, @Context('loaders') loaders: IDataLoaders) {
    if (!user.id) return null;
    return loaders.userSocialAccountsLoader.load(user.id);
  }

  @ResolveField(type => Boolean)
  hasPassword(@Parent() user) {
    return !!user.password;
  }
}
