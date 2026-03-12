import { Test, TestingModule } from '@nestjs/testing';
import { BunnyService } from '@src/_common/bunny/bunny-service';
import { HelperService } from '@src/_common/utils/helper.service';
import { Category } from '@src/course-specs/category/category.model';
import { CategoryService } from '@src/course-specs/category/category.service';
import { SkillService } from '@src/course-specs/skill/skill.service';
import { ToolService } from '@src/course-specs/tool/tool.service';
import { DiplomaService } from '@src/diploma/diploma.service';
import {
  CreateDiplomaInput,
  CreateDraftedDiplomaInput
} from '@src/diploma/inputs/create-diploma.input';
import { Sequelize } from 'sequelize';
import { SEQUELIZE_INSTANCE_NEST_DI_TOKEN } from 'sequelize-transactional-typescript';

describe('DiplomaService', () => {
  let diplomaService: DiplomaService;
  let categoryService: jest.Mocked<CategoryService>;
  let sequelize: jest.Mocked<Sequelize>;
  let helperService: jest.Mocked<HelperService>;
  let bunnyService: jest.Mocked<BunnyService>;
  let toolService: jest.Mocked<ToolService>;
  let skillService: jest.Mocked<SkillService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiplomaService,
        {
          provide: CategoryService,
          useValue: { activeCategoryOrError: jest.fn() }
        },
        { provide: Sequelize, useValue: { transaction: jest.fn() } },
        {
          provide: HelperService,
          useValue: { generateModelCodeWithPrefix: jest.fn() }
        },
        {
          provide: BunnyService,
          useValue: { updateCollectionName: jest.fn() }
        },
        { provide: ToolService, useValue: { setTools: jest.fn() } },
        { provide: SkillService, useValue: { setSkills: jest.fn() } },
        {
          provide: 'SEQUELIZE_INSTANCE_NEST_DI_TOKEN',
          useValue: SEQUELIZE_INSTANCE_NEST_DI_TOKEN
        }
      ]
    }).compile();
    diplomaService = module.get<DiplomaService>(DiplomaService);
    categoryService = module.get(CategoryService);
    sequelize = module.get(Sequelize);
    helperService = module.get(HelperService);
    bunnyService = module.get(BunnyService);
    toolService = module.get(ToolService);
    skillService = module.get(SkillService);
  });

  it('should create a diploma successfully with valid input', async () => {
    const input = {};

    const diplomaRepo = {
      createOne: jest.fn(),
      updateOneFromExistingModel: jest.fn()
    };
    const collectionRepo = {
      findOne: jest.fn(),
      updateOneFromExistingModel: jest.fn()
    };
    // Mock dependencies
    categoryService.activeCategoryOrError.mockResolvedValue(new Category());
    collectionRepo.findOne.mockResolvedValue(new Category());

    helperService.generateModelCodeWithPrefix.mockResolvedValue('DIP-001');
    diplomaRepo.createOne.mockResolvedValue({ id: 'new-diploma-id', ...input });

    // Act
    const result = await diplomaService.createDiploma(
      input as CreateDraftedDiplomaInput
    );

    // Assert
    expect(categoryService.activeCategoryOrError).toHaveBeenCalledWith(
      'valid-category'
    );
    expect(collectionRepo.findOne).toHaveBeenCalledWith({
      id: 'valid-collection'
    });
    expect(sequelize.transaction).toHaveBeenCalled();
    expect(helperService.generateModelCodeWithPrefix).toHaveBeenCalled();
    expect(diplomaRepo.createOne).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        code: 'DIP-001',
        ...input
      }),
      expect.any(Object)
    );
    expect(result).toEqual(expect.objectContaining({ id: 'new-diploma-id' }));
  });

  it('should throw an error if collectionId is invalid', async () => {
    const input = {
      collectionId: 'invalid-collection',
      originalPrice: 100,
      priceAfterDiscount: 80
    };
    const collectionRepo = {
      findOne: jest.fn()
    };
    collectionRepo.findOne.mockResolvedValue(null);

    await expect(diplomaService.createDiploma(input)).rejects.toThrowError(
      'COLLECTION_NOT_EXISTS'
    );
  });

  // Add more tests for other scenarios
});
