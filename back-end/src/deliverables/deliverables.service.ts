import { Injectable } from '@nestjs/common';
import { CreateDeliverableDto } from './dto/create-deliverable.dto';
import { UpdateDeliverableDto } from './dto/update-deliverable.dto';
import { DeliverableStatus } from '../common/enums/deliverable-status.enum';

/**
 * DeliverablesService — stub implementation.
 */
@Injectable()
export class DeliverablesService {
  create(dto: CreateDeliverableDto) {
    // TODO: check gig pro is assigned to the task, set task status to UNDER_REVIEW
    return {
      message: 'Deliverable submitted',
      stub: true,
      data: {
        ...dto,
        status: DeliverableStatus.SUBMITTED,
        paymentReleased: false,
        id: 'stub-deliverable-id',
      },
    };
  }

  findAll(filters: {
    taskId?: string;
    submittedBy?: string;
    status?: string;
  }) {
    return { message: 'All deliverables', stub: true, filters, data: [] };
  }

  findOne(id: string) {
    return { message: `Deliverable ${id}`, stub: true, data: { id } };
  }

  approve(id: string) {
    // TODO: set status APPROVED, paymentReleased = true, task = COMPLETED
    return {
      message: `Deliverable ${id} approved — payment released`,
      stub: true,
      data: { status: DeliverableStatus.APPROVED, paymentReleased: true },
    };
  }

  requestRevision(id: string, revisionNote: string) {
    // TODO: set status REVISION_REQUESTED, store note, task back to IN_PROGRESS
    return {
      message: `Revision requested for deliverable ${id}`,
      stub: true,
      data: {
        status: DeliverableStatus.REVISION_REQUESTED,
        revisionNote,
      },
    };
  }

  update(id: string, dto: UpdateDeliverableDto) {
    // TODO: allow re-submit (status back to SUBMITTED)
    return { message: `Deliverable ${id} updated`, stub: true, data: dto };
  }

  remove(id: string) {
    // TODO: guard status not APPROVED, delete record, revert task status
    return { message: `Deliverable ${id} deleted`, stub: true };
  }
}
