import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Estimate } from './entities/estimate.entity';
import { EstimateItem } from './entities/estimate-item.entity';

@Injectable()
export class EstimatesRepository {
  constructor(
    @InjectRepository(Estimate)
    private readonly estimates: Repository<Estimate>,
    @InjectRepository(EstimateItem)
    private readonly items: Repository<EstimateItem>,
  ) {}

  async findBySprint(sprintId: string): Promise<Estimate[]> {
    return this.estimates.find({ where: { sprintId } });
  }

  async findById(id: string): Promise<Estimate | null> {
    return this.estimates.findOne({ where: { id }, relations: ['items'] });
  }

  async findItemById(id: string): Promise<EstimateItem | null> {
    return this.items.findOne({ where: { id } });
  }

  async updateItem(id: string, data: Partial<EstimateItem>): Promise<void> {
    await this.items.update(id, data);
  }

  async findAllItemsBySprint(sprintId: string): Promise<EstimateItem[]> {
    return this.items
      .createQueryBuilder('i')
      .innerJoin('i.estimate', 'e')
      .where('e.sprintId = :sprintId', { sprintId })
      .getMany();
  }
}
