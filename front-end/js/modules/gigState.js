import {
	applications,
	tasks,
	users,
	persistApplications,
	saveTasks
} from '../data/mockData.js';
import { generateId, getInitials } from '../utils/helpers.js';
import { get, set } from '../utils/storage.js';

const STORAGE_KEY = 'gig_workflow_state';
const CURRENT_VERSION = 1;

function nowIso() {
	return new Date().toISOString();
}

function toNumber(value, fallback = 0) {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function mapRequestStatus(status) {
	if (status === 'pending') return 'pending';
	if (status === 'shortlisted') return 'accepted';
	if (status === 'rejected') return 'declined';
	return 'pending';
}

function mapTaskStatus(status) {
	return status === 'completed' ? 'completed' : 'active';
}

function emptyRoot() {
	return {
		version: CURRENT_VERSION,
		gigs: {}
	};
}

function getClientDetails(clientId) {
	const client = users.find((user) => user.id === clientId);
	if (!client) {
		return {
			clientId: null,
			clientName: 'Client',
			clientInitials: 'CL'
		};
	}

	const displayName = client.company || client.name;
	return {
		clientId: client.id,
		clientName: displayName,
		clientInitials: getInitials(displayName)
	};
}

function inferTaskProgress(task, index = 0) {
	if (task.status === 'completed') return 100;

	const createdTime = new Date(task.createdAt || Date.now()).getTime();
	const deadlineTime = new Date(task.deadline || Date.now()).getTime();
	const totalMs = Math.max(1, deadlineTime - createdTime);
	const elapsedMs = Math.max(0, Date.now() - createdTime);
	const ratio = Math.min(0.9, elapsedMs / totalMs);
	const inferred = Math.round(20 + ratio * 70 + (index % 3) * 5);

	return Math.max(15, Math.min(95, inferred));
}

function sortByCreatedAtDesc(items) {
	return [...items].sort((a, b) => {
		const aTime = new Date(a.createdAt || 0).getTime();
		const bTime = new Date(b.createdAt || 0).getTime();
		return bTime - aTime;
	});
}

function dedupeById(items) {
	const map = new Map();
	items.forEach((item) => {
		if (item && item.id) map.set(item.id, item);
	});
	return [...map.values()];
}

function syncAcceptedRequestToCollections(gigId, request) {
	if (!request?.sourceTaskId) return;

	const sourceTask = tasks.find((task) => task.id === request.sourceTaskId);
	if (sourceTask) {
		sourceTask.assignedTo = gigId;
		sourceTask.status = 'in_progress';
		sourceTask.updatedAt = nowIso();
		saveTasks();
	}

	const matchingApplication = applications.find(
		(application) => application.taskId === request.sourceTaskId && application.gigId === gigId
	);
	if (matchingApplication) {
		matchingApplication.status = 'shortlisted';
	}

	applications
		.filter(
			(application) =>
				application.taskId === request.sourceTaskId &&
				application.gigId !== gigId &&
				application.status === 'pending'
		)
		.forEach((application) => {
			application.status = 'rejected';
		});

	persistApplications();
}

function syncDeclinedRequestToCollections(gigId, request) {
	if (!request?.sourceTaskId) return;

	const matchingApplication = applications.find(
		(application) => application.taskId === request.sourceTaskId && application.gigId === gigId
	);
	if (matchingApplication) {
		matchingApplication.status = 'rejected';
		persistApplications();
	}
}

function syncCompletedTaskToCollections(gigId, task) {
	if (!task?.sourceTaskId) return;

	const sourceTask = tasks.find((item) => item.id === task.sourceTaskId);
	if (!sourceTask) return;

	sourceTask.assignedTo = gigId;
	sourceTask.status = 'completed';
	sourceTask.updatedAt = nowIso();
	sourceTask.completedAt = nowIso();
	saveTasks();
}

function normalizeGigState(gigState) {
	if (!gigState.requests) gigState.requests = [];
	if (!gigState.tasks) gigState.tasks = [];

	gigState.requests = dedupeById(gigState.requests);
	gigState.tasks = dedupeById(gigState.tasks);

	// Keep request acceptance in sync with tasks.
	gigState.tasks.forEach((task) => {
		if (!task.requestId) return;
		const request = gigState.requests.find((item) => item.id === task.requestId);
		if (!request) return;
		if (task.status === 'active' || task.status === 'completed') {
			request.status = 'accepted';
			request.updatedAt = nowIso();
		}
	});

	// Ensure every accepted request has a task.
	gigState.requests
		.filter((request) => request.status === 'accepted')
		.forEach((request) => {
			const existingTask = gigState.tasks.find((task) => task.requestId === request.id);
			if (existingTask) return;

			gigState.tasks.push({
				id: generateId('gt'),
				requestId: request.id,
				sourceTaskId: request.sourceTaskId,
				title: request.title,
				description: request.description,
				budget: request.budget,
				deadline: request.deadline,
				clientId: request.clientId,
				clientName: request.clientName,
				clientInitials: request.clientInitials,
				status: 'active',
				progress: 20,
				createdAt: request.acceptedAt || request.updatedAt || nowIso(),
				updatedAt: nowIso(),
				completedAt: null,
				rating: null
			});
		});

	gigState.requests = sortByCreatedAtDesc(gigState.requests);
	gigState.tasks = sortByCreatedAtDesc(gigState.tasks);
}

function seedGigState(gigId) {
	const createdAt = nowIso();

	const seededRequests = applications
		.filter((app) => app.gigId === gigId)
		.map((app) => {
			const relatedTask = tasks.find((task) => task.id === app.taskId);
			const clientInfo = getClientDetails(relatedTask?.clientId || null);

			return {
				id: app.id,
				sourceTaskId: relatedTask?.id || app.taskId,
				title: relatedTask?.title || 'Untitled Request',
				description: relatedTask?.description || app.coverLetter || 'No description available.',
				budget: toNumber(app.proposedBudget, toNumber(relatedTask?.budget, 0)),
				deadline: relatedTask?.deadline || nowIso(),
				clientId: clientInfo.clientId,
				clientName: clientInfo.clientName,
				clientInitials: clientInfo.clientInitials,
				status: mapRequestStatus(app.status),
				createdAt: app.createdAt || relatedTask?.createdAt || createdAt,
				updatedAt: nowIso(),
				acceptedAt: app.status === 'shortlisted' ? nowIso() : null,
				declinedAt: app.status === 'rejected' ? nowIso() : null
			};
		});

	const seededTasks = tasks
		.filter((task) => task.assignedTo === gigId && ['in_progress', 'completed'].includes(task.status))
		.map((task, index) => {
			const clientInfo = getClientDetails(task.clientId);
			const linkedRequest = seededRequests.find((request) => request.sourceTaskId === task.id) || null;

			return {
				id: task.id,
				requestId: linkedRequest?.id || null,
				sourceTaskId: task.id,
				title: task.title,
				description: task.description || 'No description available.',
				budget: toNumber(task.budget, 0),
				deadline: task.deadline || nowIso(),
				clientId: clientInfo.clientId,
				clientName: clientInfo.clientName,
				clientInitials: clientInfo.clientInitials,
				status: mapTaskStatus(task.status),
				progress: task.status === 'completed' ? 100 : inferTaskProgress(task, index),
				createdAt: task.createdAt || createdAt,
				updatedAt: nowIso(),
				completedAt: task.status === 'completed' ? (task.deadline || nowIso()) : null,
				rating: task.status === 'completed' ? 5 : null
			};
		});

	const seeded = {
		requests: seededRequests,
		tasks: seededTasks,
		updatedAt: nowIso()
	};

	normalizeGigState(seeded);
	return seeded;
}

function readRoot() {
	const raw = get(STORAGE_KEY);
	if (!raw || typeof raw !== 'object') return emptyRoot();

	if (raw.version !== CURRENT_VERSION || !raw.gigs || typeof raw.gigs !== 'object') {
		return emptyRoot();
	}

	return raw;
}

function writeRoot(root) {
	set(STORAGE_KEY, root);
}

function ensureGigState(root, gigId) {
	if (!root.gigs[gigId]) {
		root.gigs[gigId] = seedGigState(gigId);
	}
	normalizeGigState(root.gigs[gigId]);
	return root.gigs[gigId];
}

function mutateGigState(gigId, mutator) {
	const root = readRoot();
	const gigState = ensureGigState(root, gigId);
	const result = mutator(gigState);
	gigState.updatedAt = nowIso();
	normalizeGigState(gigState);
	writeRoot(root);
	return result;
}

export function getGigState(gigId) {
	const root = readRoot();
	const gigState = ensureGigState(root, gigId);
	writeRoot(root);
	return {
		requests: [...gigState.requests],
		tasks: [...gigState.tasks],
		updatedAt: gigState.updatedAt
	};
}

export function getGigDashboardSummary(gigId) {
	const state = getGigState(gigId);
	const activeTasks = state.tasks.filter((task) => task.status === 'active');
	const completedTasks = state.tasks.filter((task) => task.status === 'completed');
	const pendingRequests = state.requests.filter((request) => request.status === 'pending');
	const declinedRequests = state.requests.filter((request) => request.status === 'declined');
	const totalEarnings = completedTasks.reduce((sum, task) => sum + toNumber(task.budget, 0), 0);

	return {
		activeTasks,
		completedTasks,
		pendingRequests,
		declinedRequests,
		totalEarnings,
		requests: state.requests,
		tasks: state.tasks
	};
}

export function getGigRequestById(gigId, requestId) {
	const state = getGigState(gigId);
	return state.requests.find((request) => request.id === requestId) || null;
}

export function getGigTaskById(gigId, taskId) {
	const state = getGigState(gigId);
	return state.tasks.find((task) => task.id === taskId) || null;
}

export function acceptGigRequest(gigId, requestId) {
	return mutateGigState(gigId, (gigState) => {
		const request = gigState.requests.find((item) => item.id === requestId);
		if (!request || request.status !== 'pending') return null;

		request.status = 'accepted';
		request.acceptedAt = nowIso();
		request.updatedAt = nowIso();

		const existingTask = gigState.tasks.find((task) => task.requestId === request.id);
		if (existingTask) {
			existingTask.status = 'active';
			existingTask.progress = Math.max(20, toNumber(existingTask.progress, 20));
			existingTask.updatedAt = nowIso();
			syncAcceptedRequestToCollections(gigId, request);
			return existingTask;
		}

		const newTask = {
			id: generateId('gt'),
			requestId: request.id,
			sourceTaskId: request.sourceTaskId,
			title: request.title,
			description: request.description,
			budget: request.budget,
			deadline: request.deadline,
			clientId: request.clientId,
			clientName: request.clientName,
			clientInitials: request.clientInitials,
			status: 'active',
			progress: 20,
			createdAt: nowIso(),
			updatedAt: nowIso(),
			completedAt: null,
			rating: null
		};

		gigState.tasks.push(newTask);
		syncAcceptedRequestToCollections(gigId, request);
		return newTask;
	});
}

export function declineGigRequest(gigId, requestId, options = {}) {
	const remove = options.remove === true;

	return mutateGigState(gigId, (gigState) => {
		const requestIndex = gigState.requests.findIndex((item) => item.id === requestId);
		if (requestIndex === -1) return false;

		if (remove) {
			gigState.requests.splice(requestIndex, 1);
			return true;
		}

		const request = gigState.requests[requestIndex];
		request.status = 'declined';
		request.declinedAt = nowIso();
		request.updatedAt = nowIso();
		syncDeclinedRequestToCollections(gigId, request);
		return true;
	});
}

export function markGigTaskComplete(gigId, taskId) {
	return mutateGigState(gigId, (gigState) => {
		const task = gigState.tasks.find((item) => item.id === taskId);
		if (!task || task.status !== 'active') return null;

		task.status = 'completed';
		task.progress = 100;
		task.completedAt = nowIso();
		task.updatedAt = nowIso();
		task.rating = task.rating || 5;

		if (task.requestId) {
			const request = gigState.requests.find((item) => item.id === task.requestId);
			if (request) {
				request.status = 'accepted';
				request.updatedAt = nowIso();
			}
		}

		syncCompletedTaskToCollections(gigId, task);

		return task;
	});
}

export function upsertGigRequestFromTask(gigId, taskLike) {
	if (!taskLike || !taskLike.id) return null;

	return mutateGigState(gigId, (gigState) => {
		const existing = gigState.requests.find((request) => request.sourceTaskId === taskLike.id);
		if (existing) return existing;

		const clientInfo = getClientDetails(taskLike.clientId || null);
		const newRequest = {
			id: generateId('gr'),
			sourceTaskId: taskLike.id,
			title: taskLike.title || 'Untitled Request',
			description: taskLike.description || 'No description available.',
			budget: toNumber(taskLike.budget, 0),
			deadline: taskLike.deadline || nowIso(),
			clientId: clientInfo.clientId,
			clientName: clientInfo.clientName,
			clientInitials: clientInfo.clientInitials,
			status: 'pending',
			createdAt: nowIso(),
			updatedAt: nowIso(),
			acceptedAt: null,
			declinedAt: null
		};

		gigState.requests.push(newRequest);
		return newRequest;
	});
}

export function getProjectDetailRecord(gigId, queryString) {
	const params = new URLSearchParams(queryString || '');
	const requestId = params.get('requestId');
	const taskId = params.get('taskId');
	const state = getGigState(gigId);

	if (requestId) {
		const request = state.requests.find((item) => item.id === requestId) || null;
		const task = request ? state.tasks.find((item) => item.requestId === request.id) || null : null;
		return { request, task, requestId, taskId: task?.id || null };
	}

	if (taskId) {
		const task = state.tasks.find((item) => item.id === taskId) || null;
		if (task) {
			const request = task.requestId
				? state.requests.find((item) => item.id === task.requestId) || null
				: null;
			return { request, task, requestId: request?.id || null, taskId };
		}

		const requestFromSourceTask = state.requests.find((item) => item.sourceTaskId === taskId) || null;
		if (requestFromSourceTask) {
			const linkedTask = state.tasks.find((item) => item.requestId === requestFromSourceTask.id) || null;
			return {
				request: requestFromSourceTask,
				task: linkedTask,
				requestId: requestFromSourceTask.id,
				taskId: linkedTask?.id || null
			};
		}
	}

	const fallbackPending = state.requests.find((item) => item.status === 'pending') || null;
	if (fallbackPending) {
		return { request: fallbackPending, task: null, requestId: fallbackPending.id, taskId: null };
	}

	const fallbackTask = state.tasks[0] || null;
	if (fallbackTask) {
		const fallbackRequest = fallbackTask.requestId
			? state.requests.find((item) => item.id === fallbackTask.requestId) || null
			: null;
		return {
			request: fallbackRequest,
			task: fallbackTask,
			requestId: fallbackRequest?.id || null,
			taskId: fallbackTask.id
		};
	}

	return {
		request: null,
		task: null,
		requestId: null,
		taskId: null
	};
}
