import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ClubRepository } from '../repositories/club.repository';
import { CreateClubDto } from '../dto/create-club.dto';
import { UpdateClubDto } from '../dto/update-club.dto';
import { ApproveClubDto } from '../dto/approve-club.dto';
import { ClubEntity } from '../../entities/club.entity';

@Injectable()
export class ClubService {
  constructor(
    private clubRepository: ClubRepository,
    private dataSource: DataSource,
  ) {}

  async createClub(createClubDto: CreateClubDto, leaderId: string): Promise<ClubEntity> {
    const { name, description = '' } = createClubDto;
    const existingClub = await this.clubRepository.findByName(name);
    if (existingClub) {
      throw new BadRequestException('Tên câu lạc bộ đã tồn tại');
    }
    const pendingClub = await this.clubRepository.findPendingClubByLeaderId(leaderId);
    if (pendingClub) {
      throw new BadRequestException('Bạn đã có một câu lạc bộ đang chờ duyệt, vui lòng chờ kết quả trước khi tạo câu lạc bộ mới');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const club = await this.clubRepository.createClub(name, description, leaderId, queryRunner);
      await queryRunner.commitTransaction();
      return club;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getClubById(id: string): Promise<ClubEntity> {
    const club = await this.clubRepository.findById(id);
    if (!club) {
      throw new NotFoundException('Câu lạc bộ không tồn tại');
    }
    return club;
  }

  async getActiveClubById(id: string): Promise<ClubEntity> {
    const club = await this.clubRepository.findById(id);
    if (!club || club.status !== 'active') {
      throw new NotFoundException('Câu lạc bộ không tồn tại');
    }
    return club;
  }

  async getAllClubs(): Promise<ClubEntity[]> {
    return this.clubRepository.findAll();
  }

  async getActiveClubs(): Promise<ClubEntity[]> {
    return this.clubRepository.findActiveClubs();
  }

  async getAllClubsForAdmin(status?: 'pending' | 'active' | 'inactive'): Promise<ClubEntity[]> {
    return this.clubRepository.findAllWithFilter(status);
  }

  async getMyClubs(leaderId: string, status?: 'pending' | 'active' | 'inactive'): Promise<ClubEntity[]> {
    return this.clubRepository.findByLeaderIdWithFilter(leaderId, status);
  }

  async updateClub(id: string, updateClubDto: UpdateClubDto, userId: string): Promise<ClubEntity> {
    const club = await this.getClubById(id);
    if (club.leaderId !== userId) {
      throw new ForbiddenException('Chỉ chủ câu lạc bộ mới có quyền cập nhật');
    }

    const { name, description } = updateClubDto;
    if (name && name !== club.name) {
      const existingClub = await this.clubRepository.findByName(name);
      if (existingClub) {
        throw new BadRequestException('Tên câu lạc bộ đã tồn tại');
      }
    }
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const updatedClub = await this.clubRepository.updateClub(id, name, description, queryRunner);
      if (!updatedClub) {
        throw new NotFoundException('Câu lạc bộ không tồn tại');
      }
      await queryRunner.commitTransaction();
      return updatedClub;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteClub(id: string): Promise<void> {
    await this.getClubById(id);

    // Use transaction for critical operation
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.clubRepository.deleteClub(id, queryRunner);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async approveClub(id: string, approveClubDto: ApproveClubDto): Promise<ClubEntity> {
    await this.getClubById(id);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const updatedClub = await this.clubRepository.updateStatus(id, approveClubDto.status, queryRunner);
      if (!updatedClub) {
        throw new NotFoundException('Câu lạc bộ không tồn tại');
      }
      await queryRunner.commitTransaction();
      return updatedClub;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateClubImage(id: string, imageUrl: string, userId: string): Promise<ClubEntity> {
    const club = await this.getClubById(id);
    if (club.leaderId !== userId) {
      throw new ForbiddenException('Chỉ chủ câu lạc bộ mới có quyền cập nhật ảnh');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const updatedClub = await this.clubRepository.updateImage(id, imageUrl, queryRunner);
      if (!updatedClub) {
        throw new NotFoundException('Câu lạc bộ không tồn tại');
      }
      await queryRunner.commitTransaction();
      return updatedClub;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async addGalleryImagesBatch(id: string, imageUrls: string[], userId: string): Promise<ClubEntity> {
    const club = await this.getClubById(id);
    if (club.leaderId !== userId) {
      throw new ForbiddenException('Chỉ chủ câu lạc bộ mới có quyền thêm ảnh vào album');
    }

    const gallery = club.gallery || [];
    const totalImages = gallery.length + imageUrls.length;
    
    if (totalImages > 10) {
      throw new BadRequestException(`Album chỉ còn chỗ cho ${10 - gallery.length} ảnh, nhưng bạn đang cố thêm ${imageUrls.length} ảnh`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      gallery.push(...imageUrls);
      const updatedClub = await this.clubRepository.updateGallery(id, gallery, queryRunner);
      if (!updatedClub) {
        throw new NotFoundException('Câu lạc bộ không tồn tại');
      }
      await queryRunner.commitTransaction();
      return updatedClub;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async removeGalleryImage(id: string, imageUrl: string, userId: string): Promise<ClubEntity> {
    const club = await this.getClubById(id);
    if (club.leaderId !== userId) {
      throw new ForbiddenException('Chỉ chủ câu lạc bộ mới có quyền xóa ảnh khỏi album');
    }

    const gallery = club.gallery || [];
    const index = gallery.indexOf(imageUrl);
    if (index === -1) {
      throw new NotFoundException('Ảnh không tồn tại trong album');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      gallery.splice(index, 1);
      const updatedClub = await this.clubRepository.updateGallery(id, gallery, queryRunner);
      if (!updatedClub) {
        throw new NotFoundException('Câu lạc bộ không tồn tại');
      }
      await queryRunner.commitTransaction();
      return updatedClub;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
