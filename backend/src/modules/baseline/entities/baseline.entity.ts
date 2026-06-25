import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { ControlObject } from '../../control-objects/entities/control-object.entity';
import { EstimateTask } from './estimate-task.entity';

@Entity('baselines')
export class Baseline {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  controlObjectId: string;

  @Column({ nullable: true })
  sourceFileName: string;

  /** Суммарные плановые часы (computed = Σ задач оценки). */
  @Column({ type: 'float', default: 0 })
  totalHours: number;

  /** Контрольная сумма из строки «ИТОГО» файла (для сверки). */
  @Column({ type: 'float', nullable: true })
  declaredTotalHours: number;

  /** Активный baseline объекта контроля. Повторная загрузка — явное действие (FR-02). */
  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => ControlObject, (c) => c.baselines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'controlObjectId' })
  controlObject: ControlObject;

  @OneToMany(() => EstimateTask, (t) => t.baseline, { cascade: true })
  estimateTasks: EstimateTask[];

  @CreateDateColumn()
  uploadedAt: Date;
}
