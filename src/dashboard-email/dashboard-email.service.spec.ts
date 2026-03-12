import { Test, TestingModule } from '@nestjs/testing';
import { DashboardEmailService } from './dashboard-email.service';

describe('DashboardEmailService', () => {
  let service: DashboardEmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DashboardEmailService],
    }).compile();

    service = module.get<DashboardEmailService>(DashboardEmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
