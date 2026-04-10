import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEntity } from '../entities/event.entity';
import { EventController } from './controllers/event.controller';
import { EventService } from './services/event.service';
import { EventCronService } from './services/event-cron.service';
import { EventRepository } from './repositories/event.repository';
import { ClubMemberModule } from '../club-member/club-member.module';
import { ClubModule } from '../club/club.module';
import { EventTypeModule } from '../event-type/event-type.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventEntity]),
    ClubMemberModule,
    ClubModule,
    EventTypeModule,
    UploadModule,
  ],
  controllers: [EventController],
  providers: [EventService, EventCronService, EventRepository],
  exports: [EventService, EventRepository],
})
export class EventModule {}
