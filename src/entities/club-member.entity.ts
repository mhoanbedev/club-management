import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ClubEntity } from './club.entity';
import { UserEntity } from './user.entity';

@Entity('club_members')
@Index(['clubId', 'userId'], { unique: true })
@Index(['clubId', 'status'])
@Index(['userId', 'status'])
export class ClubMemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  clubId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: ['leader', 'member'] })
  role: 'leader' | 'member';

  @Column({
    type: 'enum',
    enum: ['pending', 'active', 'rejected', 'inactive'],
    default: 'pending',
  })
  status: 'pending' | 'active' | 'rejected' | 'inactive';

  @CreateDateColumn()
  joinedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt: Date;

  @ManyToOne(() => ClubEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clubId' })
  club: ClubEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;
}
