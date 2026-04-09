import { Injectable } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

/**
 * AuthService — stub implementation.
 * All methods return placeholder responses.
 * Replace internals when DB + JWT is wired up.
 */
@Injectable()
export class AuthService {
  register(dto: RegisterDto) {
    // TODO: hash password, persist user, return created user + token
    return {
      message: 'User registered successfully',
      stub: true,
      data: { ...dto, password: '[HASHED]', id: 'stub-id' },
    };
  }

  login(dto: LoginDto) {
    // TODO: verify credentials, generate JWT access + refresh tokens
    return {
      message: 'Login successful',
      stub: true,
      data: {
        accessToken: 'stub-access-token',
        refreshToken: 'stub-refresh-token',
        user: { email: dto.email, role: 'stub-role' },
      },
    };
  }

  logout() {
    // TODO: blacklist token / clear refresh token from DB
    return { message: 'Logged out successfully', stub: true };
  }

  refresh() {
    // TODO: validate refresh token, issue new access token
    return {
      message: 'Token refreshed',
      stub: true,
      data: { accessToken: 'new-stub-access-token' },
    };
  }

  changePassword(id: string, dto: ChangePasswordDto) {
    // TODO: verify current password, hash new password, update DB
    return { message: `Password changed for user ${id}`, stub: true };
  }

  forgotPassword(email: string) {
    // TODO: generate reset token, send email via mail service
    return {
      message: `Password reset link sent to ${email}`,
      stub: true,
    };
  }

  resetPassword(token: string, newPassword: string) {
    // TODO: validate reset token, hash + persist new password
    return { message: 'Password reset successful', stub: true };
  }
}
