import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { ControlObject } from '../../control-objects/entities/control-object.entity';
import { EstimateTask } from '../../baseline/entities/estimate-task.entity';
import { JiraTask } from './jira-task.entity';

export enum EpicLinkSource {
  MANUAL = 'manual',
  AUTO = 'auto',
  NONE = 'none',
}

@Entity('jira_epics')
@Index(['controlObjectId', 'jiraKey'], { unique: true })
export class JiraEpic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  controlObjectId: string;

  @Column()
  jiraKey: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  priority: string;

  @Column({ type: 'date', nullable: true })
  dueDate: string;

  /** Связка с задачей оценки baseline (FR-10). */
  @Column({ nullable: true })
  estimateTaskId: string;

  @Column({ type: 'enum', enum: EpicLinkSource, default: EpicLinkSource.NONE })
  linkSource: EpicLinkSource;

  @ManyToOne(() => ControlObject, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'controlObjectId' })
  controlObject: ControlObject;

  @ManyToOne(() => EstimateTask, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'estimateTaskId' })
  estimateTask: EstimateTask;

  @OneToMany(() => JiraTask, (t) => t.epic)
  tasks: JiraTask[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
