import { User } from '@src/user/models/user.model';
import DataLoader from 'dataloader';
export interface NestDataLoader {
  /**
   * Should return a new instance of dataloader each time
   */
  generateDataLoader(currentUser?: User): DataLoader<any, any>;
}
