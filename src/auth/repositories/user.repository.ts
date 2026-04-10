import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { UserEntity } from '../../entities/user.entity';

@Injectable()
export class UserRepository extends Repository<UserEntity> {
  constructor(private dataSource: DataSource) {
    super(UserEntity, dataSource.createEntityManager());
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.findOne({ where: { email } });
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.findOne({ where: { id } });
  }

  async createUser(email: string, name: string, hashedPassword: string, role: 'admin' | 'user' | 'club_leader' = 'user'): Promise<UserEntity> {
    const user = this.create({
      email,
      name,
      password: hashedPassword,
      role,
    });
    return this.save(user);
  }

  async countAdmins(): Promise<number> {
    return this.count({ where: { role: 'admin' } });
  }

  async findByRole(role: 'admin' | 'user' | 'club_leader'): Promise<UserEntity[]> {
    return this.find({ where: { role } });
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<UserEntity | null> {
    await this.update(userId, { avatarUrl });
    return this.findById(userId);
  }
}
