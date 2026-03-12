import { UpperCaseLearningProgramTypeEnum } from '@src/cart/enums/cart.enums';
import { LearningProgramInput } from '../inputs/learning-program.input';

export class AssignUserToLearningProgramEvent {
  userId: string;
  learningPrograms: LearningProgramInput[];
  diplomaId?: string;
  resetCart?: boolean;
}

export class UnassignUserFromLearningProgramEvent {
  userId: string;
  learningProgramId: string;
  learningProgramType: UpperCaseLearningProgramTypeEnum;
}

export class TransactionRefundedEvent extends AssignUserToLearningProgramEvent {
  transactionId: string;
}

export class PayoutWalletSuccessEvent {
  walletId: string;
}
