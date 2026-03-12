import { IRepository } from '@src/_common/database/repository.interface';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { PaginatorInput } from '@src/_common/paginator/paginator.input';
import { SortTypeEnum } from '@src/_common/paginator/paginator.types';
import { TransactionStatusEnum } from '@src/payment/enums/transaction-status.enum';
import {
  WalletOwnerTypeEnum,
  WalletSortEnum,
  WalletStatusEnum,
  WalletTypeEnum
} from '@src/payment/enums/wallets.enums';
import {
  WalletFilterInput,
  WalletSortInput
} from '@src/payment/inputs/wallet.inputs';
import { Transaction } from '@src/payment/models/transaction.model';
import { Wallet } from '@src/payment/models/wallet.model';
import { WalletService } from '@src/payment/services/wallet.service';
import { User } from '@src/user/models/user.model';
import { UserRoleEnum } from '@src/user/user.enum';
import { Sequelize } from 'sequelize-typescript';

describe('wallet service', () => {
  it('should return paginated wallets with filter and sort options', async () => {
    const mockWalletsRepository = {
      findPaginated: jest.fn()
    };

    const walletService = new WalletService(
      <IRepository<Wallet>>(<unknown>mockWalletsRepository)
    );

    const filter: WalletFilterInput = {
      owner: {
        id: '123',
        type: WalletOwnerTypeEnum.LECTURER
      },
      status: WalletStatusEnum.ACTIVE,
      type: WalletTypeEnum.LECTURER_WALLET
    };

    const sort: WalletSortInput = {
      sortBy: WalletSortEnum.CREATED_AT,
      sortType: SortTypeEnum.DESC
    };

    const paginate: PaginatorInput = {
      page: 1,
      limit: 10
    };

    const expectedResult = {
      items: [],
      pageInfo: {
        page: 1,
        limit: 10,
        totalCount: 0,
        hasNext: false,
        hasBefore: false
      }
    };

    mockWalletsRepository.findPaginated.mockResolvedValue(expectedResult);

    const result = await walletService.getWallets(filter, sort, paginate);

    expect(mockWalletsRepository.findPaginated).toHaveBeenCalledWith(
      {
        ownerId: '123',
        ownerType: WalletOwnerTypeEnum.LECTURER,
        status: WalletStatusEnum.ACTIVE,
        type: WalletTypeEnum.LECTURER_WALLET
      },
      [
        [
          Sequelize.col(sort?.sortBy || 'createdAt'),
          sort?.sortType || SortTypeEnum.DESC
        ]
      ],
      1,
      10
    );

    expect(result).toEqual(expectedResult);
  });

  // Get wallet by ID returns correct wallet
  it('should return the correct wallet when a valid ID is provided', async () => {
    const mockWalletsRepository = {
      findOne: jest.fn()
    };

    const walletService = new WalletService(
      <IRepository<Wallet>>(<unknown>mockWalletsRepository)
    );

    const walletId = 'wallet-id-123';
    const expectedWallet = {
      id: walletId,
      ownerId: 'owner-id-456',
      ownerType: WalletOwnerTypeEnum.LECTURER,
      type: WalletTypeEnum.LECTURER_WALLET,
      status: WalletStatusEnum.ACTIVE,
      balance: 1000
    };

    mockWalletsRepository.findOne.mockResolvedValue(expectedWallet);

    const result = await walletService.getWallet(walletId);

    expect(mockWalletsRepository.findOne).toHaveBeenCalledWith({
      id: walletId
    });
    expect(result).toEqual(expectedWallet);
  });

  // Get lecturer wallet for valid lecturer user
  it('should return lecturer wallet when user is a valid lecturer', async () => {
    const mockWalletsRepository = {
      findOne: jest.fn()
    };

    const walletService = new WalletService(
      <IRepository<Wallet>>(<unknown>mockWalletsRepository)
    );

    const user: User = {
      id: 'lecturer-id',
      role: UserRoleEnum.LECTURER
    } as User;

    const expectedWallet: Wallet = {
      id: 'wallet-id',
      ownerId: 'lecturer-id',
      ownerType: WalletOwnerTypeEnum.LECTURER
    } as Wallet;

    mockWalletsRepository.findOne.mockResolvedValue(expectedWallet);

    const result = await walletService.getMyWallet(user);

    expect(mockWalletsRepository.findOne).toHaveBeenCalledWith({
      ownerId: 'lecturer-id',
      ownerType: WalletOwnerTypeEnum.LECTURER
    });

    expect(result).toEqual(expectedWallet);
  });

  // Update wallet status from active to suspended
  it('should update wallet status to suspended when wallet is active', async () => {
    const mockWalletsRepository = {
      findOne: jest.fn(),
      updateOneFromExistingModel: jest.fn()
    };

    const walletService = new WalletService(
      <IRepository<Wallet>>(<unknown>mockWalletsRepository)
    );

    const walletId = 'wallet-id-123';
    const activeWallet = {
      id: walletId,
      status: WalletStatusEnum.ACTIVE
    };

    mockWalletsRepository.findOne.mockResolvedValue(activeWallet);
    mockWalletsRepository.updateOneFromExistingModel.mockResolvedValue({
      ...activeWallet,
      status: WalletStatusEnum.SUSPENDED
    });

    const result = await walletService.updateWalletStatus(
      walletId,
      WalletStatusEnum.SUSPENDED
    );

    expect(mockWalletsRepository.findOne).toHaveBeenCalledWith({
      id: walletId
    });
    expect(
      mockWalletsRepository.updateOneFromExistingModel
    ).toHaveBeenCalledWith(activeWallet, {
      status: WalletStatusEnum.SUSPENDED
    });
    expect(result.status).toBe(WalletStatusEnum.SUSPENDED);
  });

  // Transfer balance from instructor wallets to pending payout wallets
  it('should transfer balance from active instructor wallets to pending payout wallets', async () => {
    const mockWalletsRepository = {
      findAll: jest.fn(),
      findOrCreate: jest.fn()
    };

    const walletService = new WalletService(
      <IRepository<Wallet>>(<unknown>mockWalletsRepository)
    );

    const instructorWallets = [
      { ownerId: 'instructor1', balance: 100, save: jest.fn() },
      { ownerId: 'instructor2', balance: 200, save: jest.fn() }
    ];

    const pendingPayoutWallets = [
      { ownerId: 'instructor1', balance: 0, save: jest.fn() },
      { ownerId: 'instructor2', balance: 0, save: jest.fn() }
    ];

    mockWalletsRepository.findAll.mockResolvedValue(instructorWallets);
    mockWalletsRepository.findOrCreate
      .mockResolvedValueOnce(pendingPayoutWallets[0])
      .mockResolvedValueOnce(pendingPayoutWallets[1]);

    await walletService.transferFromInstructorsWalletsToPendingPayoutWallets();

    expect(mockWalletsRepository.findAll).toHaveBeenCalledWith({
      status: WalletStatusEnum.ACTIVE,
      type: WalletTypeEnum.LECTURER_WALLET
    });

    expect(mockWalletsRepository.findOrCreate).toHaveBeenCalledWith(
      {
        ownerId: 'instructor1',
        type: WalletTypeEnum.PENDING_PAYOUT_WALLET
      },
      {
        ownerId: 'instructor1',
        ownerType: WalletOwnerTypeEnum.LECTURER,
        type: WalletTypeEnum.PENDING_PAYOUT_WALLET,
        status: WalletStatusEnum.ACTIVE,
        balance: 0
      }
    );

    expect(mockWalletsRepository.findOrCreate).toHaveBeenCalledWith(
      {
        ownerId: 'instructor2',
        type: WalletTypeEnum.PENDING_PAYOUT_WALLET
      },
      {
        ownerId: 'instructor2',
        ownerType: WalletOwnerTypeEnum.LECTURER,
        type: WalletTypeEnum.PENDING_PAYOUT_WALLET,
        status: WalletStatusEnum.ACTIVE,
        balance: 0
      }
    );

    expect(pendingPayoutWallets[0].balance).toBe(100);
    expect(pendingPayoutWallets[1].balance).toBe(200);
    expect(instructorWallets[0].balance).toBe(0);
    expect(instructorWallets[1].balance).toBe(0);

    expect(pendingPayoutWallets[0].save).toHaveBeenCalled();
    expect(pendingPayoutWallets[1].save).toHaveBeenCalled();
    expect(instructorWallets[0].save).toHaveBeenCalled();
    expect(instructorWallets[1].save).toHaveBeenCalled();
  });

  // Transfer balance from pending instructor wallets to instructor wallets after 48h
  it('should transfer balance from pending instructor wallets to instructor wallets after 48 hours', async () => {
    const mockWalletsRepository = {
      findAll: jest.fn(),
      findOne: jest.fn()
    };

    const walletService = new WalletService(
      <IRepository<Wallet>>(<unknown>mockWalletsRepository)
    );

    const previous48Hours = new Date(
      new Date().getTime() - 2 * 24 * 60 * 60 * 1000
    );

    const pendingInstructorWallets = [
      {
        ownerId: 'instructor1',
        type: WalletTypeEnum.PENDING_LECTURER_WALLET,
        balance: 100,
        updatedAt: new Date(previous48Hours.getTime() - 1000),
        save: jest.fn()
      }
    ];

    const instructorWallet = {
      ownerId: 'instructor1',
      type: WalletTypeEnum.LECTURER_WALLET,
      balance: 50,
      save: jest.fn()
    };

    mockWalletsRepository.findAll.mockResolvedValue(pendingInstructorWallets);
    mockWalletsRepository.findOne.mockResolvedValue(instructorWallet);

    await walletService.transferFromPendingInstructorsWalletsToInstructorWallets();

    expect(mockWalletsRepository.findAll).toHaveBeenCalledWith({
      status: WalletStatusEnum.ACTIVE,
      type: WalletTypeEnum.PENDING_LECTURER_WALLET,
      updatedAt: { $lt: previous48Hours }
    });

    expect(mockWalletsRepository.findOne).toHaveBeenCalledWith({
      ownerId: 'instructor1',
      type: WalletTypeEnum.LECTURER_WALLET
    });

    expect(instructorWallet.balance).toBe(150);
    expect(instructorWallet.save).toHaveBeenCalled();

    expect(pendingInstructorWallets[0].balance).toBe(0);
    expect(pendingInstructorWallets[0].save).toHaveBeenCalled();
  });

  // Update payout wallet state from pending to success
  it('should update payout wallet state to success when wallet type is pending payout', async () => {
    const mockWalletsRepository = {
      findOne: jest.fn(),
      findOrCreate: jest.fn()
    };

    const walletService = new WalletService(
      <IRepository<Wallet>>(<unknown>mockWalletsRepository)
    );

    const pendingPayoutWallet = {
      id: 'wallet123',
      ownerId: 'owner123',
      ownerType: WalletOwnerTypeEnum.LECTURER,
      type: WalletTypeEnum.PENDING_PAYOUT_WALLET,
      status: WalletStatusEnum.ACTIVE,
      balance: 100,
      save: jest.fn()
    };

    const successPayoutWallet = {
      ownerId: 'owner123',
      ownerType: WalletOwnerTypeEnum.LECTURER,
      type: WalletTypeEnum.SUCCESS_PAYOUT_WALLET,
      status: WalletStatusEnum.ACTIVE,
      balance: 0,
      save: jest.fn()
    };

    mockWalletsRepository.findOne.mockResolvedValue(pendingPayoutWallet);
    mockWalletsRepository.findOrCreate.mockResolvedValue(successPayoutWallet);

    const result = await walletService.updatePayoutWalletState(
      'wallet123',
      'success'
    );

    expect(mockWalletsRepository.findOne).toHaveBeenCalledWith({
      id: 'wallet123'
    });
    expect(mockWalletsRepository.findOrCreate).toHaveBeenCalledWith(
      {
        ownerId: 'owner123',
        type: WalletTypeEnum.SUCCESS_PAYOUT_WALLET
      },
      {
        ownerId: 'owner123',
        ownerType: WalletOwnerTypeEnum.LECTURER,
        type: WalletTypeEnum.SUCCESS_PAYOUT_WALLET,
        status: WalletStatusEnum.ACTIVE,
        balance: 0
      }
    );

    expect(successPayoutWallet.balance).toBe(100);
    expect(pendingPayoutWallet.balance).toBe(0);
    expect(successPayoutWallet.save).toHaveBeenCalled();
    expect(pendingPayoutWallet.save).toHaveBeenCalled();
    expect(result).toEqual(pendingPayoutWallet);
  });

  // Update wallet balance on successful transaction based on revenue shares
  it('should update wallet balance correctly on successful transaction', async () => {
    const mockWalletsRepository = {
      findAll: jest.fn(),
      findOrCreate: jest.fn(),
      updateOneFromExistingModel: jest.fn()
    };

    const walletService = new WalletService(
      <IRepository<Wallet>>(<unknown>mockWalletsRepository)
    );

    const transaction = {
      id: 'transaction-id',
      status: TransactionStatusEnum.SUCCESS,
      revenueShares: [
        {
          systemShare: 100,
          vatAmount: 20,
          lecturerShare: 80,
          lecturerId: 'lecturer-id'
        }
      ],
      totalAmount: 200
    };

    const wallet = {
      id: 'wallet-id',
      type: WalletTypeEnum.SYS_WALLET,
      balance: 0,
      transactions: [],
      save: jest.fn()
    };

    mockWalletsRepository.findAll.mockResolvedValue([wallet]);

    await walletService.handleWalletsStateMutations(
      <Transaction>(<unknown>transaction)
    );

    expect(wallet.balance).toBe(100);
    expect(wallet.transactions).toContain(transaction);
    expect(wallet.save).toHaveBeenCalled();
  });

  // Get wallet by non-existent ID throws wallet not found error
  // Throws BaseHttpException with WALLET_NOT_FOUND when wallet ID doesn't exist
  it('should throw BaseHttpException when wallet is not found', async () => {
    const walletsRepository = {
      findOne: jest.fn().mockResolvedValue(null)
    };

    const walletService = new WalletService(
      <IRepository<Wallet>>(<unknown>walletsRepository)
    );

    await expect(walletService.getWallet('invalid-id')).rejects.toThrow(
      new BaseHttpException(ErrorCodeEnum.WALLET_NOT_FOUND)
    );
    expect(walletsRepository.findOne).toHaveBeenCalledWith({
      id: 'invalid-id'
    });
  });

  // Get my wallet for admin/user role throws invalid role error
  it('should throw an error when user role is admin or user', async () => {
    const mockWalletsRepository = {
      findOne: jest.fn()
    };

    const walletService = new WalletService(
      <IRepository<Wallet>>(<unknown>mockWalletsRepository)
    );

    const userAdmin = { id: 'admin-id', role: UserRoleEnum.ADMIN };
    const userUser = { id: 'user-id', role: UserRoleEnum.USER };

    await expect(
      walletService.getMyWallet(<User>(<unknown>userAdmin))
    ).rejects.toThrow('Invalid user role');
    await expect(
      walletService.getMyWallet(<User>(<unknown>userUser))
    ).rejects.toThrow('Invalid user role');
  });

  // Update status for non-existent wallet throws wallet not found error
  it('should throw WALLET_NOT_FOUND error when updating status of a non-existent wallet', async () => {
    const mockWalletsRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      updateOneFromExistingModel: jest.fn()
    };

    const walletService = new WalletService(
      <IRepository<Wallet>>(<unknown>mockWalletsRepository)
    );

    const walletId = 'non-existent-wallet-id';
    const status = WalletStatusEnum.ACTIVE;

    await expect(
      walletService.updateWalletStatus(walletId, status)
    ).rejects.toThrow(new BaseHttpException(ErrorCodeEnum.WALLET_NOT_FOUND));

    expect(mockWalletsRepository.findOne).toHaveBeenCalledWith({
      id: walletId
    });
    expect(
      mockWalletsRepository.updateOneFromExistingModel
    ).not.toHaveBeenCalled();
  });

  // Delete non-existent wallet throws wallet not found error
  it('should throw WALLET_NOT_FOUND error when deleting a non-existent wallet', async () => {
    const mockWalletsRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      updateOneFromExistingModel: jest.fn()
    };

    const walletService = new WalletService(
      <IRepository<Wallet>>(<unknown>mockWalletsRepository)
    );

    await expect(
      walletService.deleteWallet('non-existent-wallet-id')
    ).rejects.toThrow(new BaseHttpException(ErrorCodeEnum.WALLET_NOT_FOUND));

    expect(mockWalletsRepository.findOne).toHaveBeenCalledWith({
      id: 'non-existent-wallet-id'
    });
    expect(
      mockWalletsRepository.updateOneFromExistingModel
    ).not.toHaveBeenCalled();
  });

  // Update invalid payout wallet type throws invalid wallet type error
  it('should throw INVALID_WALLET_TYPE error when updating invalid payout wallet type', async () => {
    const mockWalletsRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'wallet-id',
        type: 'INVALID_WALLET_TYPE'
      })
    };

    const walletService = new WalletService(
      <IRepository<Wallet>>(<unknown>mockWalletsRepository)
    );

    await expect(
      walletService.updatePayoutWalletState('wallet-id', 'success')
    ).rejects.toThrow(new BaseHttpException(ErrorCodeEnum.INVALID_WALLET_TYPE));

    expect(mockWalletsRepository.findOne).toHaveBeenCalledWith({
      id: 'wallet-id'
    });
  });

  // Invalid transaction status throws general invalid transaction status error
  it('should throw GENERAL_INVALID_TRANSACTION_STATUS error when transaction status is invalid', async () => {
    const mockWalletsRepository = {
      findAll: jest.fn()
    };

    const walletService = new WalletService(
      <IRepository<Wallet>>(<unknown>mockWalletsRepository)
    );

    const transaction = {
      id: 'transaction-id',
      status: 'INVALID_STATUS'
    };

    const wallet = {
      id: 'wallet-id',
      ownerId: 'lecturer-id',
      type: WalletTypeEnum.PENDING_LECTURER_WALLET,
      balance: 100,
      transactions: [],
      save: jest.fn()
    };

    mockWalletsRepository.findAll.mockResolvedValue([wallet]);

    await expect(
      walletService.handleWalletsStateMutations(
        <Transaction>(<unknown>transaction)
      )
    ).rejects.toThrow(
      new BaseHttpException(ErrorCodeEnum.GENERAL_INVALID_TRANSACTION_STATUS)
    );

    expect(mockWalletsRepository.findAll).toHaveBeenCalledWith({
      transactions: {
        id: 'transaction-id'
      }
    });
  });

  // Soft delete wallet by setting deletedAt timestamp
  it('should set deletedAt timestamp when deleting a wallet', async () => {
    const mockWalletsRepository = {
      findOne: jest.fn(),
      updateOneFromExistingModel: jest.fn()
    };

    const walletService = new WalletService(
      <IRepository<Wallet>>(<unknown>mockWalletsRepository)
    );

    const walletId = 'wallet-id-123';
    const mockWallet = { id: walletId, balance: 100, transactions: [] };

    mockWalletsRepository.findOne.mockResolvedValue(mockWallet);
    mockWalletsRepository.updateOneFromExistingModel.mockResolvedValue({
      ...mockWallet,
      deletedAt: new Date()
    });

    const result = await walletService.deleteWallet(walletId);

    expect(mockWalletsRepository.findOne).toHaveBeenCalledWith({
      id: walletId
    });
    expect(
      mockWalletsRepository.updateOneFromExistingModel
    ).toHaveBeenCalledWith(mockWallet, {
      deletedAt: expect.any(Date)
    });
    expect(result.deletedAt).toBeInstanceOf(Date);
  });

  // Handle wallet balance mutations for canceled/refunded transactions
  it('should update wallet balances correctly for canceled or refunded transactions', async () => {
    const mockWalletsRepository = {
      findAll: jest.fn(),
      findOrCreate: jest.fn(),
      findOne: jest.fn()
    };

    const walletService = new WalletService(
      <IRepository<Wallet>>(<unknown>mockWalletsRepository)
    );

    const transaction = {
      id: 'transaction-id-canceled',
      status: TransactionStatusEnum.CANCELED,
      totalAmount: 100,
      revenueShares: [
        {
          systemShare: 10,
          vatAmount: 5,
          lecturerShare: 85,
          lecturerId: 'lecturer-id'
        }
      ]
    };

    const wallet = {
      id: 'wallet-id-canceled',
      ownerId: 'lecturer-id',
      type: WalletTypeEnum.PENDING_LECTURER_WALLET,
      balance: 100,
      transactions: [],
      save: jest.fn()
    };

    mockWalletsRepository.findAll.mockResolvedValue([wallet]);
    mockWalletsRepository.findOrCreate.mockResolvedValue(wallet);

    await walletService.handleWalletsStateMutations(
      <Transaction>(<unknown>transaction)
    );

    //this is set to 115 because stripe wallet branching logic
    expect(wallet.balance).toBe(115);
    expect(wallet.transactions).toContain(transaction);
    expect(wallet.save).toHaveBeenCalled();
  });

  // Calculate correct balance changes for different wallet types
  it('should calculate balance changes correctly for different wallet types', async () => {
    const mockWalletsRepository = {
      findOrCreate: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
      updateOneFromExistingModel: jest.fn()
    };

    const walletService = new WalletService(
      <IRepository<Wallet>>(<unknown>mockWalletsRepository)
    );

    const transaction = {
      id: 'transaction-id',
      status: TransactionStatusEnum.SUCCESS,
      revenueShares: [
        {
          systemShare: 100,
          vatAmount: 20,
          lecturerShare: 80,
          lecturerId: 'lecturer-id'
        }
      ],
      totalAmount: 200
    };

    const sysWallet = {
      type: WalletTypeEnum.SYS_WALLET,
      balance: 0,
      transactions: [],
      save: jest.fn()
    };

    const vatWallet = {
      type: WalletTypeEnum.VAT_WALLET,
      balance: 0,
      transactions: [],
      save: jest.fn()
    };

    const pendingLecturerWallet = {
      type: WalletTypeEnum.PENDING_LECTURER_WALLET,
      ownerId: 'lecturer-id',
      balance: 0,
      transactions: [],
      save: jest.fn()
    };

    mockWalletsRepository.findAll.mockResolvedValue([
      sysWallet,
      vatWallet,
      pendingLecturerWallet
    ]);

    await walletService.handleWalletsStateMutations(
      <Transaction>(<unknown>transaction)
    );

    expect(sysWallet.balance).toBe(100);
    expect(vatWallet.balance).toBe(20);
    expect(pendingLecturerWallet.balance).toBe(80);

    expect(sysWallet.save).toHaveBeenCalled();
    expect(vatWallet.save).toHaveBeenCalled();
    expect(pendingLecturerWallet.save).toHaveBeenCalled();
  });
});
