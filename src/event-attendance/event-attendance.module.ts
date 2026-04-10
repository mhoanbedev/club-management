import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { EventAttendanceEntity } from '../entities/event-attendance.entity';
import { EventEntity } from '../entities/event.entity';
import { UserEntity } from '../entities/user.entity';
import { ClubMemberEntity } from '../entities/club-member.entity';
import { EventRegistrationEntity } from '../entities/event-registration.entity';
import { EventAttendanceController } from './controllers/event-attendance.controller';
import { EventAttendanceService } from './services/event-attendance.service';
import { EventAttendanceRepository } from './repositories/event-attendance.repository';
import { EventRepository } from '../event/repositories/event.repository';
import { ClubMemberRepository } from '../club-member/repositories/club-member.repository';
import { EventRegistrationRepository } from '../event-registration/repositories/event-registration.repository';
import { UserRepository } from '../auth/repositories/user.repository';
import { MemberPointModule } from '../member-point/member-point.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EventAttendanceEntity,
      EventEntity,
      UserEntity,
      ClubMemberEntity,
      EventRegistrationEntity,
    ]),
    JwtModule,
    forwardRef(() => MemberPointModule),
  ],
  controllers: [EventAttendanceController],
  providers: [
    EventAttendanceService,
    EventAttendanceRepository,
    EventRepository,
    ClubMemberRepository,
    EventRegistrationRepository,
    UserRepository,
  ],
  exports: [EventAttendanceRepository],
})
export class EventAttendanceModule {}
