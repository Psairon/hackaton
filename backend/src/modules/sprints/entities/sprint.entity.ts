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
import { Project } from '../../projects/entities/project.entity';
import { Task } from '../../tasks/entities/task.entity';
import { Estimate } from '../../estimates/entities/estimate.entity';

export enum SprintStatus {
  PLANNED = 'planned',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

@Entity('sprints')
export class Sprint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  projectId: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: SprintStatus, default: SprintStatus.PLANNED })
  status: SprintStatus;

  @Column({ type: 'date', nullable: true })
  startDate: string;

  @Column({ type: 'date', nullable: true })
  endDate: string;

  @ManyToOne(() => Project, (p) => p.sprints, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @OneToMany(() => Task, (t) => t.sprint, { cascade: true })
  tasks: Task[];

  @OneToMany(() => Estimate, (e) => e.sprint, { cascade: true })
  estimates: Estimate[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
