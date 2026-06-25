import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Direction, Role } from '../../../common/enums/reference.enum';
import { EstimateTask } from './estimate-task.entity';

/**
 * Плановые часы задачи оценки в разрезе направление → роль (FR-04).
 * plannedHours включает «Оценка» + «Оценка на работу с рисками» (риск-часы суммируются).
 */
@Entity('estimate_task_hours')
export class EstimateTaskHours {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  estimateTaskId: string;

  @Column({ type: 'enum', enum: Direction })
  direction: Direction;

  @Column({ type: 'enum', enum: Role })
  role: Role;

  @Column({ type: 'float', default: 0 })
  plannedHours: number;

  @ManyToOne(() => EstimateTask, (t) => t.hours, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'estimateTaskId' })
  estimateTask: EstimateTask;
}
