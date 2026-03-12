import { Test, TestingModule } from '@nestjs/testing';
import { DashboardEmailResolver } from './dashboard-email.resolver';
import { DashboardEmailService } from './dashboard-email.service';

describe('DashboardEmailResolver', () => {
  let resolver: DashboardEmailResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DashboardEmailResolver, DashboardEmailService],
    }).compile();

    resolver = module.get<DashboardEmailResolver>(DashboardEmailResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
