import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ClubEntity } from './club.entity';
import { UserEntity } from './user.entity';

@Entity('member_points')
export class MemberPointEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  clubId: string;

  @Column('uuid')
  userId: string;

  @Column('integer', { default: 0 })
  totalPoints: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => ClubEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clubId' })
  club: ClubEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;
}
