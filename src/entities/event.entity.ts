import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ClubEntity } from './club.entity';
import { EventTypeEntity } from './event-type.entity';
import { UserEntity } from './user.entity';

@Entity('events')
export class EventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  clubId: string;

  @Column('uuid')
  typeId: string;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('timestamp')
  startTime: Date;

  @Column('timestamp')
  endTime: Date;

  @Column('varchar', { length: 255 })
  location: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl: string;

  @Column('varchar', { length: 20, default: 'draft' })
  status: 'draft' | 'published' | 'ongoing' | 'finished';

  @Column('timestamp', { nullable: true })
  deletedAt: Date;

  @Column('uuid', { nullable: true })
  deletedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => ClubEntity)
  @JoinColumn({ name: 'clubId' })
  club: ClubEntity;

  @ManyToOne(() => EventTypeEntity)
  @JoinColumn({ name: 'typeId' })
  type: EventTypeEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'deletedBy' })
  deletedByUser: UserEntity;
}
