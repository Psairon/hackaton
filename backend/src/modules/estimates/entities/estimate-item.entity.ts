import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Estimate } from './estimate.entity';

export enum Department {
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  QA = 'qa',
  DEVOPS = 'devops',
  ANALYTICS = 'analytics',
  TECHWRITER = 'techwriter',
  PROJECT = 'project',
  OTHER = 'other',
}

@Entity('estimate_items')
export class EstimateItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  estimateId: string;

  @Column()
  title: string;

  @Column({ type: 'float' })
  estimatedHours: number;

  @Column({ type: 'enum', enum: Department, default: Department.OTHER })
  department: Department;

  @Column({ nullable: true })
  linkedTaskId: string;

  @ManyToOne(() => Estimate, (e) => e.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'estimateId' })
  estimate: Estimate;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
