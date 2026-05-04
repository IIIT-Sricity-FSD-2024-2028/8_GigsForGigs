import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../rbac/roles.enum';

type RoleHeaderValue = string | string[] | undefined;

function normalizeRoleHeader(value: RoleHeaderValue): Role {
  if (value === undefined || value === null) {
    throw new ForbiddenException('x-role header is required');
  }

  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    throw new ForbiddenException('x-role header is required');
  }

  const normalized = raw.trim().toUpperCase();
  const allowed = Object.values(Role) as string[];
  if (!allowed.includes(normalized)) {
    throw new ForbiddenException('invalid x-role header');
  }

  return normalized as Role;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, RoleHeaderValue>;
      method?: string;
      url?: string;
      originalUrl?: string;
    }>();

    if (request.method === 'OPTIONS') {
      return true;
    }

    const path = request.originalUrl ?? request.url ?? '';
    // Allow Swagger UI and its assets without RBAC headers.
    if (path.startsWith('/api/docs')) {
      return true;
    }

    const role = normalizeRoleHeader(request.headers['x-role']);

    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If an endpoint doesn't specify roles, default to allowing any valid role.
    const allowedRoles = requiredRoles ?? (Object.values(Role) as Role[]);

    if (!allowedRoles.includes(role)) {
      throw new ForbiddenException('role not allowed');
    }

    return true;
  }
}
