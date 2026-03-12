import { Injectable, OnModuleInit } from '@nestjs/common';
import { CronJob } from 'cron';
import { SchedulerRegistry } from '@nestjs/schedule';
import { WalletService } from '../services/wallet.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WalletsCron implements OnModuleInit {
  constructor(
    private readonly walletService: WalletService,
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry
  ) {}

  onModuleInit() {
    const nodeEnv = this.configService.get<string>('NODE_ENV') || 'development';

    const walletCrons = {
      pendingLecturerWallets:
        nodeEnv !== 'production' ? '*/2 * * * *' : '0 1 * * *',
      pendingPayoutWallets:
        nodeEnv !== 'production' ? '*/3 * * * *' : '0 3 1 * *'
    };

    const job1 = new CronJob(walletCrons.pendingLecturerWallets, async () => {
      await this.handleInstructorWalletsCron();
    });

    const job2 = new CronJob(walletCrons.pendingPayoutWallets, async () => {
      await this.handlePendingPayoutWalletsCron();
    });

    this.schedulerRegistry.addCronJob('pendingLecturerWallets', job1);
    this.schedulerRegistry.addCronJob('pendingPayoutWallets', job2);

    job1.start();
    job2.start();
  }
  async handleInstructorWalletsCron(): Promise<void> {
    // console.log('⏰ Running: transferFromPendingLecturerWalletsToLecturerWallets');
    await this.walletService.transferFromPendingLecturerWalletsToLecturerWallets();
  }

  async handlePendingPayoutWalletsCron(): Promise<void> {
    // console.log('⏰⏰ Running: transferFromLecturerWalletsToPendingPayoutWallets');
    await this.walletService.transferFromLecturerWalletsToPendingPayoutWallets();
  }
}
