import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClubEntity } from '../entities/club.entity';
import { ClubController } from './controllers/club.controller';
import { ClubService } from './services/club.service';
import { ClubRepository } from './repositories/club.repository';
import { ClubMemberModule } from '../club-member/club-member.module';

@Module({
  imports: [TypeOrmModule.forFeature([ClubEntity]), ClubMemberModule],
  controllers: [ClubController],
  providers: [ClubService, ClubRepository],
  exports: [ClubService, ClubRepository],
})
export class ClubModule {}
