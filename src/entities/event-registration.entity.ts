import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { EventEntity } from './event.entity';
import { UserEntity } from './user.entity';

@Entity('event_registrations')
export class EventRegistrationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  eventId: string;

  @Column('uuid')
  userId: string;

  @Column('varchar', { length: 20, default: 'pending' })
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';

  @Column('timestamp')
  registeredAt: Date;

  @Column('timestamp', { nullable: true })
  approvedAt: Date;

  @Column('timestamp', { nullable: true })
  rejectedAt: Date;

  @Column('timestamp', { nullable: true })
  cancelledAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => EventEntity)
  @JoinColumn({ name: 'eventId' })
  event: EventEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;
}
