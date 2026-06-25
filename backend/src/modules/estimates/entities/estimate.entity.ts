import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Sprint } from '../../sprints/entities/sprint.entity';
import { EstimateItem } from './estimate-item.entity';

@Entity('estimates')
export class Estimate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sprintId: string;

  @Column()
  title: string;

  @Column({ type: 'float', default: 0 })
  totalHours: number;

  @Column({ type: 'float', default: 0 })
  frontendHours: number;

  @Column({ type: 'float', default: 0 })
  backendHours: number;

  @Column({ type: 'float', default: 0 })
  qaHours: number;

  @Column({ type: 'float', default: 0 })
  devopsHours: number;

  @Column({ type: 'float', default: 0 })
  analyticsHours: number;

  @Column({ type: 'float', default: 0 })
  techwriterHours: number;

  @Column({ type: 'float', default: 0 })
  projectHours: number;

  @Column({ type: 'float', default: 0 })
  otherHours: number;

  @ManyToOne(() => Sprint, (s) => s.estimates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sprintId' })
  sprint: Sprint;

  @OneToMany(() => EstimateItem, (item) => item.estimate, { cascade: true })
  items: EstimateItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
