import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventRegistrationEntity } from '../entities/event-registration.entity';
import { EventRegistrationController } from './controllers/event-registration.controller';
import { EventRegistrationService } from './services/event-registration.service';
import { EventRegistrationRepository } from './repositories/event-registration.repository';
import { EventModule } from '../event/event.module';
import { ClubMemberModule } from '../club-member/club-member.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventRegistrationEntity]),
    EventModule,
    ClubMemberModule,
  ],
  controllers: [EventRegistrationController],
  providers: [EventRegistrationService, EventRegistrationRepository],
  exports: [EventRegistrationService, EventRegistrationRepository],
})
export class EventRegistrationModule {}
