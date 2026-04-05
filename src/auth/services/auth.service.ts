import { Injectable, BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private refreshTokenRepository: RefreshTokenRepository,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    const { email, name, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email đã được đăng ký');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await this.userRepository.createUser(email, name, hashedPassword, 'user');

    return {
      message: 'Đăng ký thành công, vui lòng đăng nhập',
    };
  }

  async registerAdmin(registerDto: RegisterDto): Promise<{ message: string }> {
    const { email, name, password } = registerDto;

    // Check if admin already exists
    const adminCount = await this.userRepository.countAdmins();
    if (adminCount > 0) {
      throw new ForbiddenException('Admin đã tồn tại, không thể tạo admin thứ 2');
    }

    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email đã được đăng ký');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    await this.userRepository.createUser(email, name, hashedPassword, 'admin');

    return {
      message: 'Đăng ký admin thành công, vui lòng đăng nhập',
    };
  }

  async createClubLeader(email: string, name: string, password: string, adminId: string): Promise<{ message: string }> {
    // Verify admin
    const admin = await this.userRepository.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      throw new ForbiddenException('Chỉ admin mới có quyền tạo club leader');
    }

    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email đã được đăng ký');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create club leader user
    await this.userRepository.createUser(email, name, hashedPassword, 'club_leader');

    return {
      message: 'Tạo club leader thành công',
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    // Revoke all old tokens
    await this.refreshTokenRepository.revokeAllUserTokens(user.id);

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user.id, user.email, user.role);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      accessToken,
      refreshToken,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    // Find refresh token
    const tokenRecord = await this.refreshTokenRepository.findByToken(refreshToken);
    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    // Check if token expired
    if (new Date() > tokenRecord.expiresAt) {
      throw new UnauthorizedException('Refresh token đã hết hạn');
    }

    // Get user from token record (already loaded via relations)
    const user = tokenRecord.user;
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    // Generate new access token
    const accessToken = this.jwtService.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return { accessToken };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokenRepository.revokeToken(refreshToken);
  }

  async validateUser(id: string): Promise<any> {
    return this.userRepository.findById(id);
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const jti = require('crypto').randomUUID();

    const accessToken = this.jwtService.sign(
      {
        id: userId,
        email,
        role,
        jti,
      },
      { expiresIn: '5m' },
    );

    const refreshTokenPayload = this.jwtService.sign(
      {
        id: userId,
        email,
        role,
        jti,
      },
      { expiresIn: '7d' },
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenRepository.createRefreshToken(userId, refreshTokenPayload, expiresAt);

    return { accessToken, refreshToken: refreshTokenPayload };
  }
}
