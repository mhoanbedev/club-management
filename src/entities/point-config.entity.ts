import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ClubEntity } from './club.entity';

@Entity('point_configs')
@Unique(['clubId'])
export class PointConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  clubId: string;

  @Column('integer', { default: 10 })
  leaderPoints: number;

  @Column('integer', { default: 5 })
  memberPoints: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => ClubEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clubId' })
  club: ClubEntity;
}
