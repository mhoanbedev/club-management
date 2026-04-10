import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ClubEntity } from './club.entity';
import { UserEntity } from './user.entity';
import { EventEntity } from './event.entity';

@Entity('point_histories')
export class PointHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  clubId: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  eventId: string;

  @Column('integer')
  pointsEarned: number;

  @Column('varchar', { length: 50 })
  reason: 'present_leader' | 'present_member' | 'absent';

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => ClubEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clubId' })
  club: ClubEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ManyToOne(() => EventEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event: EventEntity;
}
