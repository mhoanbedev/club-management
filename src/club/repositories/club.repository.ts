import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ClubEntity } from '../../entities/club.entity';

@Injectable()
export class ClubRepository {
  constructor(
    @InjectRepository(ClubEntity)
    private repository: Repository<ClubEntity>,
    private dataSource: DataSource,
  ) {}

  async createClub(
  name: string,
  description: string,
  leaderId: string,
  queryRunner?: any
): Promise<ClubEntity> {
  const normalizedName = name.trim().toLowerCase();

  const existingClub = await this.repository
    .createQueryBuilder('club')
    .where('LOWER(club.name) = :name', { name: normalizedName })
    .getOne();

  if (existingClub) {
    throw new BadRequestException('Tên câu lạc bộ đã tồn tại');
  }

  const club = this.repository.create({
    name,
    description,
    leaderId,
    status: 'pending',
  });

  try {
    if (queryRunner) {
      return await queryRunner.manager.save(club);
    }
    return await this.repository.save(club);
  } catch (error) {
    if (error.code === '23505') {
      throw new BadRequestException('Tên câu lạc bộ đã tồn tại');
    }
    throw error;
  }
}

  async findById(id: string): Promise<ClubEntity | null> {
    return this.repository
      .createQueryBuilder('club')
      .leftJoinAndSelect('club.leader', 'leader')
      .select([
        'club.id',
        'club.name',
        'club.description',
        'club.leaderId',
        'club.status',
        'club.imageUrl',
        'club.gallery',
        'club.createdAt',
        'club.updatedAt',
        'leader.id',
        'leader.name',
        'leader.email',
        'leader.avatarUrl',
      ])
      .where('club.id = :id', { id })
      .getOne();
  }

  async findByName(name: string): Promise<ClubEntity | null> {
    const normalizedName = name.trim().toLowerCase();
    return this.repository
      .createQueryBuilder('club')
      .where('LOWER(club.name) = :name', { name: normalizedName })
      .getOne();
  }

  async findAll(): Promise<ClubEntity[]> {
    return this.repository
      .createQueryBuilder('club')
      .leftJoinAndSelect('club.leader', 'leader')
      .select([
        'club.id',
        'club.name',
        'club.description',
        'club.leaderId',
        'club.status',
        'club.imageUrl',
        'club.gallery',
        'club.createdAt',
        'club.updatedAt',
        'leader.id',
        'leader.name',
        'leader.email',
        'leader.avatarUrl',
      ])
      .orderBy('club.createdAt', 'DESC')
      .getMany();
  }

  async findActiveClubs(): Promise<ClubEntity[]> {
    return this.repository
      .createQueryBuilder('club')
      .leftJoinAndSelect('club.leader', 'leader')
      .select([
        'club.id',
        'club.name',
        'club.description',
        'club.leaderId',
        'club.status',
        'club.imageUrl',
        'club.gallery',
        'club.createdAt',
        'club.updatedAt',
        'leader.id',
        'leader.name',
        'leader.email',
        'leader.avatarUrl',
      ])
      .where('club.status = :status', { status: 'active' })
      .orderBy('club.createdAt', 'DESC')
      .getMany();
  }

  async findByLeaderId(leaderId: string): Promise<ClubEntity[]> {
    return this.repository.find({
      where: { leaderId },
      order: { createdAt: 'DESC' },
    });
  }

  async findPendingClubByLeaderId(leaderId: string): Promise<ClubEntity | null> {
    return this.repository.findOne({
      where: { leaderId, status: 'pending' },
    });
  }

  async findAllWithFilter(status?: 'pending' | 'active' | 'inactive'): Promise<ClubEntity[]> {
    const query = this.repository
      .createQueryBuilder('club')
      .leftJoinAndSelect('club.leader', 'leader')
      .select([
        'club.id',
        'club.name',
        'club.description',
        'club.leaderId',
        'club.status',
        'club.imageUrl',
        'club.gallery',
        'club.createdAt',
        'club.updatedAt',
        'leader.id',
        'leader.name',
        'leader.email',
        'leader.avatarUrl',
      ]);
    
    if (status) {
      query.where('club.status = :status', { status });
    }
    
    return query.orderBy('club.createdAt', 'DESC').getMany();
  }

  async findAllWithFilterAndPagination(status?: 'pending' | 'active' | 'inactive', skip: number = 0, take: number = 10): Promise<[ClubEntity[], number]> {
    const query = this.repository
      .createQueryBuilder('club')
      .leftJoinAndSelect('club.leader', 'leader')
      .select([
        'club.id',
        'club.name',
        'club.description',
        'club.leaderId',
        'club.status',
        'club.imageUrl',
        'club.gallery',
        'club.createdAt',
        'club.updatedAt',
        'leader.id',
        'leader.name',
        'leader.email',
        'leader.avatarUrl',
      ]);
    
    if (status) {
      query.where('club.status = :status', { status });
    }
    
    return query
      .orderBy('club.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();
  }

  async findByLeaderIdWithFilter(leaderId: string, status?: 'pending' | 'active' | 'inactive'): Promise<ClubEntity[]> {
    const query = this.repository
      .createQueryBuilder('club')
      .leftJoinAndSelect('club.leader', 'leader')
      .select([
        'club.id',
        'club.name',
        'club.description',
        'club.leaderId',
        'club.status',
        'club.imageUrl',
        'club.gallery',
        'club.createdAt',
        'club.updatedAt',
        'leader.id',
        'leader.name',
        'leader.email',
        'leader.avatarUrl',
      ])
      .where('club.leaderId = :leaderId', { leaderId });
    
    if (status) {
      query.andWhere('club.status = :status', { status });
    }
    
    return query.orderBy('club.createdAt', 'DESC').getMany();
  }

  async updateClub(id: string, name?: string, description?: string, queryRunner?: any): Promise<ClubEntity | null> {
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    
    if (Object.keys(updateData).length > 0) {
      if (queryRunner) {
        await queryRunner.manager.update(ClubEntity, id, updateData);
      } else {
        await this.repository.update(id, updateData);
      }
    }
    return this.findById(id);
  }

  async updateStatus(id: string, status: 'pending' | 'active' | 'inactive', queryRunner?: any): Promise<ClubEntity | null> {
    if (queryRunner) {
      await queryRunner.manager.update(ClubEntity, id, { status });
    } else {
      await this.repository.update(id, { status });
    }
    return this.findById(id);
  }

  async deleteClub(id: string, queryRunner?: any): Promise<void> {
    if (queryRunner) {
      await queryRunner.manager.delete(ClubEntity, id);
    } else {
      await this.repository.delete(id);
    }
  }

  async updateImage(id: string, imageUrl: string, queryRunner?: any): Promise<ClubEntity | null> {
    if (queryRunner) {
      await queryRunner.manager.update(ClubEntity, id, { imageUrl });
    } else {
      await this.repository.update(id, { imageUrl });
    }
    return this.findById(id);
  }

  async updateGallery(id: string, gallery: string[], queryRunner?: any): Promise<ClubEntity | null> {
    if (queryRunner) {
      await queryRunner.manager.update(ClubEntity, id, { gallery });
    } else {
      await this.repository.update(id, { gallery });
    }
    return this.findById(id);
  }
}
