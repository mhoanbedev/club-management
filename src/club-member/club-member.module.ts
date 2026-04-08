import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClubMemberEntity } from '../entities/club-member.entity';
import { ClubMemberController } from './controllers/club-member.controller';
import { ClubMemberService } from './services/club-member.service';
import { ClubMemberRepository } from './repositories/club-member.repository';
import { ClubRepository } from '../club/repositories/club.repository';
import { ClubEntity } from '../entities/club.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClubMemberEntity, ClubEntity])],
  controllers: [ClubMemberController],
  providers: [ClubMemberService, ClubMemberRepository, ClubRepository],
  exports: [ClubMemberService, ClubMemberRepository],
})
export class ClubMemberModule {}
