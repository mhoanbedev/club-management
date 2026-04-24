import { Controller, Post, Body, UseGuards, Get, Request, Patch, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { CreateClubLeaderDto } from '../dto/create-club-leader.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { AdminGuard } from '../guards/admin.guard';
import { UploadService } from '../../upload/upload.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private uploadService: UploadService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 10000, ttl: 900000 } })
  @ApiOperation({ summary: 'Đăng ký tài khoản sinh viên' })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công' })
  @ApiResponse({ status: 400, description: 'Email đã được đăng ký' })
  @ApiResponse({ status: 429, description: 'Quá nhiều yêu cầu' })
  async register(@Body() registerDto: RegisterDto): Promise<{ message: string }> {
    return this.authService.register(registerDto);
  }

  @Post('register-admin')
  @Throttle({ default: { limit: 10000, ttl: 900000 } })
  @ApiOperation({ summary: 'Đăng ký tài khoản admin (chỉ lần đầu)' })
  @ApiResponse({ status: 201, description: 'Đăng ký admin thành công' })
  @ApiResponse({ status: 400, description: 'Email đã được đăng ký' })
  @ApiResponse({ status: 403, description: 'Admin đã tồn tại' })
  @ApiResponse({ status: 429, description: 'Quá nhiều yêu cầu' })
  async registerAdmin(@Body() registerDto: RegisterDto): Promise<{ message: string }> {
    return this.authService.registerAdmin(registerDto);
  }

  @Post('create-club-leader')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo tài khoản club leader (admin only)' })
  @ApiResponse({ status: 201, description: 'Tạo club leader thành công' })
  @ApiResponse({ status: 403, description: 'Chỉ admin mới có quyền' })
  async createClubLeader(@Body() createClubLeaderDto: CreateClubLeaderDto, @Request() req): Promise<{ message: string }> {
    return this.authService.createClubLeader(createClubLeaderDto.email, createClubLeaderDto.name, createClubLeaderDto.password, req.user.id);
  }

  @Post('login')
  @Throttle({ default: { limit: 10000, ttl: 300000 } })
  @ApiOperation({ summary: 'Đăng nhập' })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Thông tin đăng nhập không hợp lệ' })
  @ApiResponse({ status: 429, description: 'Quá nhiều yêu cầu' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @SkipThrottle()
  @ApiOperation({ summary: 'Làm mới access token' })
  @ApiResponse({ status: 200, description: 'Làm mới token thành công' })
  @ApiResponse({ status: 401, description: 'Refresh token không hợp lệ' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<{ accessToken: string }> {
    return this.authService.refreshAccessToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đăng xuất' })
  @ApiResponse({ status: 200, description: 'Đăng xuất thành công' })
  async logout(@Body() refreshTokenDto: RefreshTokenDto): Promise<{ message: string }> {
    await this.authService.logout(refreshTokenDto.refreshToken);
    return { message: 'Đăng xuất thành công' };
  }

  @Get('me')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin người dùng hiện tại' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công', type: UserResponseDto })
  async getMe(@Request() req): Promise<UserResponseDto> {
    const user = req.user;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };
  }

  @Patch('me/avatar')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Ảnh đại diện (jpg, png, gif, webp, max 5MB)',
        },
      },
      required: ['avatar'],
    },
  })
  @ApiOperation({ summary: 'Cập nhật ảnh đại diện' })
  @ApiResponse({ status: 200, description: 'Cập nhật ảnh thành công' })
  async updateAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ): Promise<{ success: boolean; data: UserResponseDto; message: string }> {
    const avatarUrl = await this.uploadService.uploadFile(file, 'club-management/avatars');
    const user = await this.authService.updateUserAvatar(req.user.id, avatarUrl);
    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      message: 'Cập nhật ảnh đại diện thành công',
    };
  }
}

