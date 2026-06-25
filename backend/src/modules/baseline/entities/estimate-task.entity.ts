import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Baseline } from './baseline.entity';
import { EstimateTaskHours } from './estimate-task-hours.entity';

/**
 * Задача оценки (крупная работа) из baseline-файла.
 * Одна значимая строка файла = одна задача оценки (FR-03).
 */
@Entity('estimate_tasks')
export class EstimateTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  baselineId: string;

  /** Денормализация для запросов в обход baseline. */
  @Column()
  controlObjectId: string;

  /** № п/п из файла. */
  @Column({ nullable: true })
  externalNumber: string;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  /** Ключ Epic из файла — для авто-связки (FR-11). В шаблоне обычно пуст. */
  @Column({ nullable: true })
  externalEpicKey: string;

  /** Computed = Σ plannedHours по всем парам направление/роль. */
  @Column({ type: 'float', default: 0 })
  totalHours: number;

  /** Значение из колонки «Оценки» (F) для сверки с computed. */
  @Column({ type: 'float', nullable: true })
  declaredHours: number;

  @ManyToOne(() => Baseline, (b) => b.estimateTasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'baselineId' })
  baseline: Baseline;

  @OneToMany(() => EstimateTaskHours, (h) => h.estimateTask, { cascade: true })
  hours: EstimateTaskHours[];

  @CreateDateColumn()
  createdAt: Date;
}
