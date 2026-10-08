// packages/core-work/workService.ts — Service cho Work Domain (V2-15).
import type { Pool } from 'pg'
import { randomUUID } from 'node:crypto'
import { withTransaction } from '@dhcb/core-db/transaction'
import { NotFoundError } from '@dhcb/core-errors/appError'
import {
  WorkProjectSchema,
  WorkTaskSchema,
  WorkMeetingSchema,
  WorkDocumentSchema,
  WORK_SCHEMA_VERSION,
  type WorkProject,
  type WorkTask,
  type WorkMeeting,
  type WorkDocument,
  type WorkProjectStatusSchema,
  type WorkTaskPrioritySchema,
  type WorkTaskStatusSchema,
  type WorkDocumentTypeSchema,
} from '@dhcb/core-contracts/work'
import type { z } from 'zod'

export type WorkProjectStatus = z.infer<typeof WorkProjectStatusSchema>
export type WorkTaskPriority = z.infer<typeof WorkTaskPrioritySchema>
export type WorkTaskStatus = z.infer<typeof WorkTaskStatusSchema>
export type WorkDocumentType = z.infer<typeof WorkDocumentTypeSchema>

export interface CreateProjectInput {
  name: string
  description?: string
  deadline?: string
}

export interface CreateTaskInput {
  projectId?: string
  title: string
  priority: WorkTaskPriority
  dueAt?: string
}

export interface RecordMeetingInput {
  title: string
  scheduledAt: string
  durationMinutes?: number
  summary?: string
  actionItems?: string[]
}

export interface CreateDocumentInput {
  projectId?: string
  title: string
  documentType: WorkDocumentType
  summary: string
  contentUri?: string
}

interface ProjectRow {
  id: string
  person_id: string
  name: string
  description: string | null
  status: string
  deadline: Date | null
  version: number
  created_at: Date
  updated_at: Date
}

interface TaskRow {
  id: string
  person_id: string
  project_id: string | null
  title: string
  priority: string
  status: string
  due_at: Date | null
  version: number
  created_at: Date
  updated_at: Date
}

interface MeetingRow {
  id: string
  person_id: string
  title: string
  scheduled_at: Date
  duration_minutes: number
  summary: string | null
  action_items: unknown
  created_at: Date
}

interface DocumentRow {
  id: string
  person_id: string
  project_id: string | null
  title: string
  document_type: string
  summary: string
  content_uri: string | null
  version: number
  created_at: Date
  updated_at: Date
}

function parseJsonArray(val: unknown): string[] {
  if (Array.isArray(val)) return val as string[]
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val)
      if (Array.isArray(parsed)) return parsed as string[]
    } catch {
      return []
    }
  }
  return []
}

function toWorkProject(row: ProjectRow): WorkProject {
  return WorkProjectSchema.parse({
    id: row.id,
    personId: row.person_id,
    name: row.name,
    ...(row.description ? { description: row.description } : {}),
    status: row.status,
    ...(row.deadline ? { deadline: row.deadline.toISOString() } : {}),
    version: row.version,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    schemaVersion: WORK_SCHEMA_VERSION,
  })
}

function toWorkTask(row: TaskRow): WorkTask {
  return WorkTaskSchema.parse({
    id: row.id,
    personId: row.person_id,
    ...(row.project_id ? { projectId: row.project_id } : {}),
    title: row.title,
    priority: row.priority,
    status: row.status,
    ...(row.due_at ? { dueAt: row.due_at.toISOString() } : {}),
    version: row.version,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    schemaVersion: WORK_SCHEMA_VERSION,
  })
}

function toWorkMeeting(row: MeetingRow): WorkMeeting {
  return WorkMeetingSchema.parse({
    id: row.id,
    personId: row.person_id,
    title: row.title,
    scheduledAt: row.scheduled_at.toISOString(),
    durationMinutes: row.duration_minutes,
    ...(row.summary ? { summary: row.summary } : {}),
    actionItems: parseJsonArray(row.action_items),
    createdAt: row.created_at.toISOString(),
    schemaVersion: WORK_SCHEMA_VERSION,
  })
}

function toWorkDocument(row: DocumentRow): WorkDocument {
  return WorkDocumentSchema.parse({
    id: row.id,
    personId: row.person_id,
    ...(row.project_id ? { projectId: row.project_id } : {}),
    title: row.title,
    documentType: row.document_type,
    summary: row.summary,
    ...(row.content_uri ? { contentUri: row.content_uri } : {}),
    version: row.version,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    schemaVersion: WORK_SCHEMA_VERSION,
  })
}

/**
 * Creates a work project.
 */
export async function createWorkProject(
  pool: Pool,
  personId: string,
  input: CreateProjectInput,
): Promise<WorkProject> {
  const id = randomUUID()
  const res = await pool.query<ProjectRow>(
    `insert into worklife.projects
      (id, person_id, name, description, status, deadline, version)
     values ($1, $2, $3, $4, 'active', $5, 1)
     returning *`,
    [id, personId, input.name, input.description ?? null, input.deadline ?? null],
  )
  return toWorkProject(res.rows[0]!)
}

/**
 * Lists work projects.
 */
export async function listWorkProjects(
  pool: Pool,
  personId: string,
  status?: string,
): Promise<WorkProject[]> {
  const params: unknown[] = [personId]
  let query = `select * from worklife.projects where person_id = $1`
  if (status) {
    params.push(status)
    query += ` and status = $2`
  }
  query += ` order by created_at desc`
  const res = await pool.query<ProjectRow>(query, params)
  return res.rows.map(toWorkProject)
}

/**
 * Updates a work project status or fields.
 */
export async function updateWorkProject(
  pool: Pool,
  personId: string,
  projectId: string,
  updates: { name?: string; description?: string; status?: WorkProjectStatus; deadline?: string },
): Promise<WorkProject> {
  return await withTransaction(pool, async (client) => {
    const existing = await client.query<ProjectRow>(
      `select * from worklife.projects where id = $1 and person_id = $2`,
      [projectId, personId],
    )
    if (!existing.rows[0]) throw new NotFoundError('Không tìm thấy WorkProject')

    const res = await client.query<ProjectRow>(
      `update worklife.projects
       set name = coalesce($1, name),
           description = coalesce($2, description),
           status = coalesce($3, status),
           deadline = coalesce($4, deadline),
           version = version + 1,
           updated_at = now()
       where id = $5 and person_id = $6
       returning *`,
      [
        updates.name ?? null,
        updates.description ?? null,
        updates.status ?? null,
        updates.deadline ?? null,
        projectId,
        personId,
      ],
    )
    return toWorkProject(res.rows[0]!)
  })
}

/**
 * Creates a work task.
 */
export async function createWorkTask(
  pool: Pool,
  personId: string,
  input: CreateTaskInput,
): Promise<WorkTask> {
  const id = randomUUID()
  // projectId (nếu có) PHẢI là dự án của chính person — kiểm ngay trong câu insert (một câu, không
  // race). Thiếu điều kiện này thì gắn được task vào dự án của người khác chỉ cần biết UUID.
  const res = await pool.query<TaskRow>(
    `insert into worklife.tasks
      (id, person_id, project_id, title, priority, status, due_at, version)
     select $1, $2, $3::uuid, $4, $5, 'todo', $6, 1
      where $3::uuid is null or exists (
        select 1 from worklife.projects
         where id = $3 and person_id = $2)
     returning *`,
    [id, personId, input.projectId ?? null, input.title, input.priority, input.dueAt ?? null],
  )
  const row = res.rows[0]
  if (!row) throw new NotFoundError('Không tìm thấy WorkProject')
  return toWorkTask(row)
}

/**
 * Lists work tasks.
 */
export async function listWorkTasks(
  pool: Pool,
  personId: string,
  status?: string,
  projectId?: string,
): Promise<WorkTask[]> {
  const params: unknown[] = [personId]
  let query = `select * from worklife.tasks where person_id = $1`
  if (status) {
    params.push(status)
    query += ` and status = $${params.length}`
  }
  if (projectId) {
    params.push(projectId)
    query += ` and project_id = $${params.length}`
  }
  query += ` order by created_at desc`
  const res = await pool.query<TaskRow>(query, params)
  return res.rows.map(toWorkTask)
}

/**
 * Updates a work task.
 */
export async function updateWorkTask(
  pool: Pool,
  personId: string,
  taskId: string,
  updates: { title?: string; priority?: WorkTaskPriority; status?: WorkTaskStatus; dueAt?: string },
): Promise<WorkTask> {
  return await withTransaction(pool, async (client) => {
    const existing = await client.query<TaskRow>(
      `select * from worklife.tasks where id = $1 and person_id = $2`,
      [taskId, personId],
    )
    if (!existing.rows[0]) throw new NotFoundError('Không tìm thấy WorkTask')

    const res = await client.query<TaskRow>(
      `update worklife.tasks
       set title = coalesce($1, title),
           priority = coalesce($2, priority),
           status = coalesce($3, status),
           due_at = coalesce($4, due_at),
           version = version + 1,
           updated_at = now()
       where id = $5 and person_id = $6
       returning *`,
      [
        updates.title ?? null,
        updates.priority ?? null,
        updates.status ?? null,
        updates.dueAt ?? null,
        taskId,
        personId,
      ],
    )
    return toWorkTask(res.rows[0]!)
  })
}

/**
 * Records a meeting.
 */
export async function recordWorkMeeting(
  pool: Pool,
  personId: string,
  input: RecordMeetingInput,
): Promise<WorkMeeting> {
  const id = randomUUID()
  const actionsJson = JSON.stringify(input.actionItems ?? [])
  const res = await pool.query<MeetingRow>(
    `insert into worklife.meetings
      (id, person_id, title, scheduled_at, duration_minutes, summary, action_items)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning *`,
    [
      id,
      personId,
      input.title,
      input.scheduledAt,
      input.durationMinutes ?? 30,
      input.summary ?? null,
      actionsJson,
    ],
  )
  return toWorkMeeting(res.rows[0]!)
}

/**
 * Lists work meetings.
 */
export async function listWorkMeetings(pool: Pool, personId: string): Promise<WorkMeeting[]> {
  const res = await pool.query<MeetingRow>(
    `select * from worklife.meetings where person_id = $1 order by scheduled_at desc`,
    [personId],
  )
  return res.rows.map(toWorkMeeting)
}

/**
 * Creates a work document.
 */
export async function createWorkDocument(
  pool: Pool,
  personId: string,
  input: CreateDocumentInput,
): Promise<WorkDocument> {
  const id = randomUUID()
  // Cùng luật với createWorkTask: projectId chỉ được trỏ tới dự án của chính person.
  const res = await pool.query<DocumentRow>(
    `insert into worklife.documents
      (id, person_id, project_id, title, document_type, summary, content_uri, version)
     select $1, $2, $3::uuid, $4, $5, $6, $7, 1
      where $3::uuid is null or exists (
        select 1 from worklife.projects
         where id = $3 and person_id = $2)
     returning *`,
    [
      id,
      personId,
      input.projectId ?? null,
      input.title,
      input.documentType,
      input.summary,
      input.contentUri ?? null,
    ],
  )
  const row = res.rows[0]
  if (!row) throw new NotFoundError('Không tìm thấy WorkProject')
  return toWorkDocument(row)
}

/**
 * Lists work documents.
 */
export async function listWorkDocuments(
  pool: Pool,
  personId: string,
  projectId?: string,
): Promise<WorkDocument[]> {
  const params: unknown[] = [personId]
  let query = `select * from worklife.documents where person_id = $1`
  if (projectId) {
    params.push(projectId)
    query += ` and project_id = $2`
  }
  query += ` order by created_at desc`
  const res = await pool.query<DocumentRow>(query, params)
  return res.rows.map(toWorkDocument)
}
