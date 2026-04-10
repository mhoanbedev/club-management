import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberPointEntity } from '../entities/member-point.entity';
import { PointHistoryEntity } from '../entities/point-history.entity';
import { PointConfigEntity } from '../entities/point-config.entity';
import { MemberPointRepository } from './repositories/member-point.repository';
import { PointHistoryRepository } from './repositories/point-history.repository';
import { MemberPointService } from './services/member-point.service';
import { MemberPointController, AdminPointConfigController } from './controllers/member-point.controller';
import { EventAttendanceModule } from '../event-attendance/event-attendance.module';
import { ClubMemberModule } from '../club-member/club-member.module';
import { EventModule } from '../event/event.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MemberPointEntity, PointHistoryEntity, PointConfigEntity]),
    forwardRef(() => EventAttendanceModule),
    ClubMemberModule,
    EventModule,
  ],
  providers: [MemberPointRepository, PointHistoryRepository, MemberPointService],
  controllers: [MemberPointController, AdminPointConfigController],
  exports: [MemberPointService, MemberPointRepository],
})
export class MemberPointModule {}
