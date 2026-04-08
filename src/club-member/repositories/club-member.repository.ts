import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClubMemberEntity } from '../../entities/club-member.entity';

@Injectable()
export class ClubMemberRepository {
  constructor(
    @InjectRepository(ClubMemberEntity)
    private repository: Repository<ClubMemberEntity>,
  ) {}

  async createMember(
    clubId: string,
    userId: string,
    role: 'leader' | 'member',
    status: 'pending' | 'active' = 'pending',
    queryRunner?: any,
  ): Promise<ClubMemberEntity> {
    const member = this.repository.create({
      clubId,
      userId,
      role,
      status,
    });

    if (queryRunner) {
      return queryRunner.manager.save(member);
    }
    
    return this.repository.save(member);
  }

  async findByClubAndUser(clubId: string, userId: string): Promise<ClubMemberEntity | null> {
    return this.repository.findOne({
      where: { clubId, userId },
    });
  }

  async findByClubAndUserAndStatus(
    clubId: string,
    userId: string,
    status: 'pending' | 'active' | 'rejected' | 'inactive',
  ): Promise<ClubMemberEntity | null> {
    return this.repository.findOne({
      where: { clubId, userId, status },
    });
  }

  async findPendingByClubAndUser(clubId: string, userId: string): Promise<ClubMemberEntity | null> {
    return this.repository.findOne({
      where: { clubId, userId, status: 'pending' },
    });
  }

  async findActiveByClubAndUser(clubId: string, userId: string): Promise<ClubMemberEntity | null> {
    return this.repository.findOne({
      where: { clubId, userId, status: 'active' },
    });
  }

  async findById(id: string, queryRunner?: any): Promise<ClubMemberEntity | null> {
    if (queryRunner) {
      return queryRunner.manager.findOne(ClubMemberEntity, { where: { id } });
    }
    return this.repository.findOne({ where: { id } });
  }

  async updateStatus(
    id: string,
    status: 'pending' | 'active' | 'rejected' | 'inactive',
    queryRunner?: any,
  ): Promise<ClubMemberEntity | null> {
    const updateData: any = { status };

    if (status === 'active') {
      updateData.approvedAt = new Date();
    } else if (status === 'rejected') {
      updateData.rejectedAt = new Date();
    }

    if (queryRunner) {
      await queryRunner.manager.update(ClubMemberEntity, id, updateData);
      return this.findById(id, queryRunner);
    } else {
      await this.repository.update(id, updateData);
      return this.findById(id);
    }
  }

  async countLeadersByClub(clubId: string): Promise<number> {
    return this.repository.count({
      where: { clubId, role: 'leader', status: 'active' },
    });
  }

  async findPendingByClub(clubId: string): Promise<ClubMemberEntity[]> {
    return this.repository.find({
      where: { clubId, status: 'pending' },
      order: { joinedAt: 'DESC' },
    });
  }

  async deleteMember(id: string, queryRunner?: any): Promise<void> {
    if (queryRunner) {
      await queryRunner.manager.delete(ClubMemberEntity, id);
    } else {
      await this.repository.delete(id);
    }
  }

  async findActiveByClubId(clubId: string): Promise<ClubMemberEntity[]> {
    return this.repository.find({
      where: { clubId, status: 'active' },
      relations: ['user', 'club'],
      order: { joinedAt: 'DESC' },
    });
  }

  async findByClubAndUserId(clubId: string, userId: string): Promise<ClubMemberEntity | null> {
    return this.repository.findOne({
      where: { clubId, userId },
      relations: ['user', 'club'],
    });
  }

  async findByIdWithUser(id: string, queryRunner?: any): Promise<ClubMemberEntity | null> {
    if (queryRunner) {
      return queryRunner.manager.findOne(ClubMemberEntity, {
        where: { id },
        relations: ['user'],
      });
    }
    return this.repository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async findAllByClubWithFilter(
    clubId: string,
    status?: 'pending' | 'active' | 'rejected' | 'inactive',
    skip: number = 0,
    take: number = 10,
  ): Promise<[ClubMemberEntity[], number]> {
    const query = this.repository
      .createQueryBuilder('member')
      .where('member.clubId = :clubId', { clubId })
      .leftJoinAndSelect('member.user', 'user')
      .leftJoinAndSelect('member.club', 'club')
      .orderBy('member.joinedAt', 'DESC');

    if (status) {
      query.andWhere('member.status = :status', { status });
    }

    return query.skip(skip).take(take).getManyAndCount();
  }

  async hardDeleteMember(id: string, queryRunner?: any): Promise<void> {
    if (queryRunner) {
      await queryRunner.manager.delete(ClubMemberEntity, id);
    } else {
      await this.repository.delete(id);
    }
  }

  async updateRole(
    id: string,
    role: 'leader' | 'member',
    queryRunner?: any,
  ): Promise<ClubMemberEntity | null> {
    if (queryRunner) {
      await queryRunner.manager.update(ClubMemberEntity, id, { role });
      return this.findById(id, queryRunner);
    } else {
      await this.repository.update(id, { role });
      return this.findById(id);
    }
  }

  async softDeleteMember(
    id: string,
    queryRunner?: any,
  ): Promise<ClubMemberEntity | null> {
    if (queryRunner) {
      await queryRunner.manager.update(ClubMemberEntity, id, { status: 'inactive' });
      return this.findById(id, queryRunner);
    } else {
      await this.repository.update(id, { status: 'inactive' });
      return this.findById(id);
    }
  }
}
