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
import { User } from '../../users/entities/user.entity';

export enum TaskType {
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  QA = 'qa',
  DEVOPS = 'devops',
  ANALYTICS = 'analytics',
  TECHWRITER = 'techwriter',
  PROJECT = 'project',
  OTHER = 'other',
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
  BLOCKED = 'blocked',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sprintId: string;

  @Column({ nullable: true })
  parentId: string;

  @Column({ nullable: true })
  externalId: string;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: TaskType, default: TaskType.OTHER })
  type: TaskType;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.TODO })
  status: TaskStatus;

  @Column({ nullable: true })
  assigneeId: string;

  @Column({ type: 'float', nullable: true })
  estimatedHours: number;

  @Column({ type: 'float', nullable: true })
  actualHours: number;

  @ManyToOne(() => Sprint, (s) => s.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sprintId' })
  sprint: Sprint;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigneeId' })
  assignee: User;

  @ManyToOne(() => Task, (t) => t.children, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent: Task;

  @OneToMany(() => Task, (t) => t.parent)
  children: Task[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
