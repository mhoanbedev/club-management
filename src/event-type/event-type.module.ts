import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventTypeEntity } from '../entities/event-type.entity';
import { EventTypeRepository } from './repositories/event-type.repository';
import { EventTypeService } from './services/event-type.service';
import { EventTypeController } from './controllers/event-type.controller';
import { ClubModule } from '../club/club.module';
import { ClubMemberModule } from '../club-member/club-member.module';

@Module({
  imports: [TypeOrmModule.forFeature([EventTypeEntity]), ClubModule, ClubMemberModule],
  providers: [EventTypeRepository, EventTypeService],
  controllers: [EventTypeController],
  exports: [EventTypeRepository],
})
export class EventTypeModule {}
