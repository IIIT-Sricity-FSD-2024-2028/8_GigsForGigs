import { Injectable } from '@nestjs/common';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ApplicationStatus } from '../common/enums/application-status.enum';

/**
 * ApplicationsService — stub implementation.
 */
@Injectable()
export class ApplicationsService {
  create(dto: CreateApplicationDto) {
    // TODO: check user hasn't already applied, persist to DB
    return {
      message: 'Application submitted',
      stub: true,
      data: { ...dto, status: ApplicationStatus.PENDING, id: 'stub-app-id' },
    };
  }

  findAll(filters: {
    taskId?: string;
    applicantId?: string;
    status?: string;
  }) {
    // TODO: query DB with filters
    return { message: 'All applications', stub: true, filters, data: [] };
  }

  findOne(id: string) {
    return { message: `Application ${id}`, stub: true, data: { id } };
  }

  update(id: string, dto: UpdateApplicationDto) {
    return { message: `Application ${id} updated`, stub: true, data: dto };
  }

  shortlist(id: string) {
    // TODO: DB only has pending, accepted, declined. Mapping shortlist to pending for now.
    return {
      message: `Application ${id} shortlisted`,
      stub: true,
      data: { status: ApplicationStatus.PENDING },
    };
  }

  reject(id: string, note?: string) {
    // TODO: DB uses 'declined'
    return {
      message: `Application ${id} rejected`,
      stub: true,
      data: { status: ApplicationStatus.DECLINED, note },
    };
  }

  hire(id: string) {
    // TODO: set ACCEPTED, update task assignedTo, auto-reject all other pending applications for this task
    return {
      message: `Application ${id} hired — task assigned, others auto-rejected`,
      stub: true,
      data: { status: ApplicationStatus.ACCEPTED },
    };
  }

  accept(id: string) {
    // TODO: gig pro accepts — confirm assignment, set task IN_PROGRESS
    return {
      message: `Application ${id} accepted by gig professional`,
      stub: true,
      data: { status: ApplicationStatus.ACCEPTED },
    };
  }

  decline(id: string) {
    // TODO: gig pro declines — reopen task for other applicants
    return {
      message: `Application ${id} declined by gig professional`,
      stub: true,
      data: { status: ApplicationStatus.DECLINED },
    };
  }

  withdraw(id: string) {
    // TODO: remove application if status is still PENDING
    return { message: `Application ${id} withdrawn`, stub: true };
  }
}
