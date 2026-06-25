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
import { User } from '../../users/entities/user.entity';
import { Baseline } from '../../baseline/entities/baseline.entity';

export enum ControlObjectType {
  REQUEST = 'request',
  SPRINT = 'sprint',
  DELIVERY = 'delivery',
  TASK_POOL = 'task_pool',
}

@Entity('control_objects')
export class ControlObject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  projectId: string;

  @Column({ nullable: true })
  responsibleId: string;

  @Column({ type: 'enum', enum: ControlObjectType, default: ControlObjectType.SPRINT })
  type: ControlObjectType;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ type: 'date', nullable: true })
  startDate: string;

  @Column({ type: 'date', nullable: true })
  plannedEndDate: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'responsibleId' })
  responsible: User;

  @OneToMany(() => Baseline, (b) => b.controlObject, { cascade: true })
  baselines: Baseline[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
