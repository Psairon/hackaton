import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { ControlObject } from '../../control-objects/entities/control-object.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { JiraTask } from './jira-task.entity';

export enum WorklogMatch {
  DIRECT = 'direct', // по ключу задачи
  PARENT = 'parent', // по ключу родителя
  EPIC = 'epic', // по ссылке на эпик (синтетическая задача)
}

/** Запись трудозатрат (FR-09). Удаляется и пересоздаётся при повторном импорте. */
@Entity('jira_worklogs')
@Index(['controlObjectId'])
export class JiraWorklog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  controlObjectId: string;

  @Column()
  jiraTaskId: string;

  /** Исходный ключ задачи из строки worklog (до резолва на task). */
  @Column({ nullable: true })
  sourceTaskKey: string;

  @Column({ type: 'float', default: 0 })
  hours: number;

  @Column({ nullable: true })
  assigneeLogin: string;

  @Column({ nullable: true })
  assigneeRaw: string;

  @Column({ nullable: true })
  employeeId: string;

  @Column({ nullable: true })
  taskType: string;

  @Column({ nullable: true })
  parentKey: string;

  @Column({ nullable: true })
  epicLink: string;

  @Column({ type: 'date', nullable: true })
  workDate: string;

  @Column({ type: 'enum', enum: WorklogMatch })
  matchedBy: WorklogMatch;

  @ManyToOne(() => ControlObject, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'controlObjectId' })
  controlObject: ControlObject;

  @ManyToOne(() => JiraTask, (t) => t.worklogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jiraTaskId' })
  task: JiraTask;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @CreateDateColumn()
  createdAt: Date;
}
