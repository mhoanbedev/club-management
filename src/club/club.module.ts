import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClubEntity } from '../entities/club.entity';
import { ClubController } from './controllers/club.controller';
import { ClubService } from './services/club.service';
import { ClubRepository } from './repositories/club.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ClubEntity])],
  controllers: [ClubController],
  providers: [ClubService, ClubRepository],
  exports: [ClubService, ClubRepository],
})
export class ClubModule {}
