import { Controller, Post, Body, Patch, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   * Register a new user (client, gig_professional, manager, super_admin)
   */
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * POST /auth/login
   * Authenticate and receive a session token (JWT to be added later)
   */
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * POST /auth/logout
   * Invalidate the current session (stub — stateless for now)
   */
  @Post('logout')
  logout() {
    return this.authService.logout();
  }

  /**
   * POST /auth/refresh
   * Refresh access token using refresh token (JWT refresh flow)
   */
  @Post('refresh')
  refresh() {
    return this.authService.refresh();
  }

  /**
   * PATCH /auth/change-password/:id
   * Change password for authenticated user
   */
  @Patch('change-password/:id')
  changePassword(@Param('id') id: string, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(id, dto);
  }

  /**
   * POST /auth/forgot-password
   * Trigger password reset flow (email stub)
   */
  @Post('forgot-password')
  forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  /**
   * POST /auth/reset-password
   * Reset password with a reset token
   */
  @Post('reset-password')
  resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.authService.resetPassword(token, newPassword);
  }
}
