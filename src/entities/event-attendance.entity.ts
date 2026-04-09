import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EventEntity } from './event.entity';
import { UserEntity } from './user.entity';

@Entity('event_attendance')
export class EventAttendanceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  eventId: string;

  @Column('uuid')
  userId: string;

  @Column('varchar', { length: 20 })
  roleAtEvent: 'leader' | 'member';

  @Column('timestamp', { nullable: true })
  checkedInAt: Date;

  @Column('varchar', { length: 20, nullable: true })
  checkInMethod: 'qr' | 'manual';

  @Column('timestamp', { nullable: true })
  checkedOutAt: Date;

  @Column('varchar', { length: 20, nullable: true })
  checkOutMethod: 'qr' | 'manual';

  @Column('varchar', { length: 20, default: 'absent' })
  status: 'present' | 'absent';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => EventEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event: EventEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;
}
