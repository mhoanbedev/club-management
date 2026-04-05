import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { RefreshTokenEntity } from '../../entities/refresh-token.entity';

@Injectable()
export class RefreshTokenRepository extends Repository<RefreshTokenEntity> {
  constructor(private dataSource: DataSource) {
    super(RefreshTokenEntity, dataSource.createEntityManager());
  }

  async createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<RefreshTokenEntity> {
    const refreshToken = this.create({
      userId,
      token,
      expiresAt,
    });
    return this.save(refreshToken);
  }

  async findByToken(token: string): Promise<RefreshTokenEntity | null> {
    return this.findOne({
      where: { token, isRevoked: false },
      relations: ['user'],
    });
  }

  async revokeToken(token: string): Promise<void> {
    await this.update({ token }, { isRevoked: true });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.update({ userId }, { isRevoked: true });
  }
}
