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
import { Direction, Role } from '../../../common/enums/reference.enum';
import { ControlObject } from '../../control-objects/entities/control-object.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { JiraEpic } from './jira-epic.entity';
import { JiraWorklog } from './jira-worklog.entity';

export enum JiraTaskSource {
  STRUCTURE = 'structure',
  WORKLOG = 'worklog',
}

@Entity('jira_tasks')
@Index(['controlObjectId', 'jiraKey'], { unique: true })
export class JiraTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  controlObjectId: string;

  @Column()
  jiraKey: string;

  @Column({ nullable: true })
  title: string;

  /** Тип задачи (file1 «Иерархия» / file2 «Тип задачи»): Задача бэкенда, Ошибка … */
  @Column({ nullable: true })
  taskType: string;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  priority: string;

  @Column({ type: 'date', nullable: true })
  dueDate: string;

  @Column({ nullable: true })
  epicId: string;

  @Column({ nullable: true })
  epicKey: string;

  @Column({ nullable: true })
  parentKey: string;

  /** «Полное имя» из выгрузки (с возможными пометками [X]). */
  @Column({ nullable: true })
  assigneeRaw: string;

  /** «Имя пользователя» (логин) — основной ключ матчинга со справочником. */
  @Column({ nullable: true })
  assigneeLogin: string;

  @Column({ nullable: true })
  employeeId: string;

  /** Резолв направления/роли через справочник сотрудников (FR-09). */
  @Column({ type: 'enum', enum: Direction, nullable: true })
  direction: Direction;

  @Column({ type: 'enum', enum: Role, nullable: true })
  role: Role;

  @Column({ type: 'float', default: 0 })
  actualHours: number;

  /** Создана из worklog (подзадача, отсутствующая в структуре) — FR-08/09. */
  @Column({ default: false })
  isSynthetic: boolean;

  @Column({ type: 'enum', enum: JiraTaskSource, default: JiraTaskSource.STRUCTURE })
  source: JiraTaskSource;

  /** Причины «требует проверки» (FR-12). */
  @Column({ type: 'jsonb', nullable: true })
  dataQualityFlags: string[];

  @ManyToOne(() => ControlObject, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'controlObjectId' })
  controlObject: ControlObject;

  @ManyToOne(() => JiraEpic, (e) => e.tasks, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'epicId' })
  epic: JiraEpic;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @OneToMany(() => JiraWorklog, (w) => w.task)
  worklogs: JiraWorklog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
