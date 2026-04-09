import { Injectable } from '@nestjs/common';
import { CreateManagerDto } from './dto/create-manager.dto';
import { UpdateManagerDto } from './dto/update-manager.dto';
import { UserRole } from '../common/enums/user-role.enum';

/**
 * ManagersService — stub implementation.
 */
@Injectable()
export class ManagersService {
  create(dto: CreateManagerDto) {
    // TODO: check email not in use, create user with role MANAGER, link to client
    return {
      message: 'Manager account created',
      stub: true,
      data: {
        ...dto,
        role: UserRole.MANAGER,
        id: 'stub-manager-id',
      },
    };
  }

  findAll(clientId?: string) {
    // TODO: query users where role = MANAGER AND clientId = clientId
    return { message: 'All managers', stub: true, clientId, data: [] };
  }

  findOne(id: string) {
    return { message: `Manager ${id}`, stub: true, data: { id } };
  }

  getManagerTasks(id: string) {
    // TODO: query tasks of this manager's linked client
    return { message: `Tasks for manager ${id}`, stub: true, data: [] };
  }

  update(id: string, dto: UpdateManagerDto) {
    return { message: `Manager ${id} updated`, stub: true, data: dto };
  }

  remove(id: string) {
    // TODO: delete manager account or unlink from client
    return { message: `Manager ${id} removed`, stub: true };
  }
}
