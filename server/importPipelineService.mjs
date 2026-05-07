import crypto from 'crypto';
import express from 'express';
import { supabaseAdmin } from './supabaseClient.mjs';
import { requireSupabaseJwt } from './middleware/supabaseJwt.mjs';
import { createAttachUserRole } from './middleware/attachUserRole.mjs';
import { createRequireRbacPermission } from './middleware/requireRbacPermission.mjs';
import { runImportJobCore } from './importWorkerCore.mjs';

const IMPORT_BUCKET = (process.env.IMPORT_UPLOAD_BUCKET || 'organization-imports').trim();
const SIGNED_UPLOAD_TTL_SECONDS = Math.min(
  60 * 60,
  Math.max(60, Number.parseInt(process.env.IMPORT_SIGNED_UPLOAD_TTL_SECONDS || '900', 10) || 900)
);
const IMPORT_WORKER_SECRET = (process.env.IMPORT_WORKER_SECRET || '').trim();

function detectIp(req) {
  const xfwd = req.headers['x-forwarded-for'];
  if (typeof xfwd === 'string' && xfwd.trim()) return xfwd.split(',')[0].trim();
  if (Array.isArray(xfwd) && xfwd.length > 0) return String(xfwd[0]).trim();
  return req.socket?.remoteAddress || null;
}

function toImportKind(value) {
  if (value === 'properties' || value === 'tenants' || value === 'properties_and_tenants') {
    return value;
  }
  return null;
}

function assertWorkerSecret(req, res) {
  if (!IMPORT_WORKER_SECRET) {
    res.status(503).json({ error: 'IMPORT_WORKER_SECRET is not configured.' });
    return true;
  }
  const got =
    req.headers['x-import-worker-secret'] ||
    req.headers['X-Import-Worker-Secret'];
  if (got !== IMPORT_WORKER_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return true;
  }
  return false;
}

async function insertJobEvent({
  jobId,
  eventType,
  actorUserId,
  actorRole,
  requestIp,
  metadata = {},
}) {
  if (!supabaseAdmin) return;
  await supabaseAdmin.from('data_import_job_events').insert({
    job_id: jobId,
    event_type: eventType,
    actor_user_id: actorUserId,
    actor_role: actorRole || null,
    request_ip: requestIp,
    metadata,
  });
}

async function finalizeImportFailure(jobId, reason, workerInstance) {
  await supabaseAdmin.rpc('import_job_finalize', {
    p_job_id: jobId,
    p_status: 'failed',
    p_summary: {
      failed_at: new Date().toISOString(),
      worker_instance: workerInstance,
      reason,
    },
    p_error_report: [{ code: 'WORKER_RUNTIME_ERROR', message: reason }],
  });
}

export function createImportPipelineRouter() {
  const router = express.Router();
  const attachUserRole = createAttachUserRole(supabaseAdmin);

  router.post(
    '/api/imports/jobs',
    requireSupabaseJwt,
    attachUserRole,
    createRequireRbacPermission('properties.write'),
    async (req, res) => {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Supabase service client is not configured' });
      }

      const fileName = String(req.body?.file_name || '').trim();
      const importKind = toImportKind(req.body?.import_kind);
      const organizationId = req.body?.organization_id ? String(req.body.organization_id) : null;
      const totalRows = Math.max(0, Number.parseInt(String(req.body?.total_rows || 0), 10) || 0);
      const sourceColumns = Array.isArray(req.body?.source_columns)
        ? req.body.source_columns.filter((x) => typeof x === 'string').slice(0, 200)
        : [];

      if (!fileName) return res.status(400).json({ error: 'file_name is required' });
      if (!importKind) return res.status(400).json({ error: 'import_kind is invalid' });

      const correlationId = crypto.randomUUID();
      const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 140) || 'import.xlsx';
      const storagePath = `${organizationId || 'unscoped'}/${req.auth.sub}/${correlationId}/${safeName}`;

      const { data: signedData, error: signedErr } = await supabaseAdmin.storage
        .from(IMPORT_BUCKET)
        .createSignedUploadUrl(storagePath, {
          upsert: false,
        });
      if (signedErr || !signedData?.token) {
        return res.status(500).json({ error: signedErr?.message || 'Could not sign upload url' });
      }

      const { data: job, error: jobErr } = await supabaseAdmin
        .from('data_import_jobs')
        .insert({
          created_by: req.auth.sub,
          organization_id: organizationId,
          import_kind: importKind,
          file_name: fileName,
          status: 'draft',
          total_rows: totalRows,
          processed_rows: 0,
          summary: {},
          error_report: [],
          storage_bucket: IMPORT_BUCKET,
          storage_path: storagePath,
          correlation_id: correlationId,
          source_columns: sourceColumns,
        })
        .select(
          'id,created_by,organization_id,import_kind,file_name,status,total_rows,processed_rows,created_at,updated_at,storage_bucket,storage_path,correlation_id'
        )
        .maybeSingle();

      if (jobErr || !job?.id) {
        return res.status(500).json({ error: jobErr?.message || 'Could not create import job' });
      }

      const ip = detectIp(req);
      await insertJobEvent({
        jobId: job.id,
        eventType: 'job_created',
        actorUserId: req.auth.sub,
        actorRole: req.userRole,
        requestIp: ip,
        metadata: { file_name: fileName, total_rows: totalRows, import_kind: importKind },
      });
      await insertJobEvent({
        jobId: job.id,
        eventType: 'upload_signed',
        actorUserId: req.auth.sub,
        actorRole: req.userRole,
        requestIp: ip,
        metadata: {
          storage_bucket: IMPORT_BUCKET,
          storage_path: storagePath,
          expires_in_seconds: SIGNED_UPLOAD_TTL_SECONDS,
        },
      });

      return res.status(201).json({
        job,
        upload: {
          bucket: IMPORT_BUCKET,
          path: storagePath,
          token: signedData.token,
          signedUrl: signedData.signedUrl,
          expiresInSeconds: SIGNED_UPLOAD_TTL_SECONDS,
        },
      });
    }
  );

  router.post(
    '/api/imports/jobs/:jobId/uploaded',
    requireSupabaseJwt,
    attachUserRole,
    createRequireRbacPermission('properties.write'),
    async (req, res) => {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Supabase service client is not configured' });
      }
      const jobId = String(req.params.jobId || '').trim();
      if (!jobId) return res.status(400).json({ error: 'jobId is required' });

      const checksumSha256 =
        typeof req.body?.checksum_sha256 === 'string' ? req.body.checksum_sha256.trim() : null;
      const { data: job, error: jobErr } = await supabaseAdmin
        .from('data_import_jobs')
        .update({
          status: 'uploaded',
          checksum_sha256: checksumSha256 || null,
          uploaded_by_ip: detectIp(req),
        })
        .eq('id', jobId)
        .eq('created_by', req.auth.sub)
        .select(
          'id,created_by,organization_id,import_kind,file_name,status,total_rows,processed_rows,created_at,updated_at,storage_bucket,storage_path,checksum_sha256'
        )
        .maybeSingle();
      if (jobErr || !job) {
        return res.status(404).json({ error: jobErr?.message || 'Import job not found' });
      }

      await insertJobEvent({
        jobId: job.id,
        eventType: 'upload_completed',
        actorUserId: req.auth.sub,
        actorRole: req.userRole,
        requestIp: detectIp(req),
        metadata: {
          checksum_sha256: checksumSha256 || null,
        },
      });

      return res.json({ job });
    }
  );

  router.post(
    '/api/imports/jobs/:jobId/start',
    requireSupabaseJwt,
    attachUserRole,
    createRequireRbacPermission('properties.write'),
    async (req, res) => {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Supabase service client is not configured' });
      }
      const jobId = String(req.params.jobId || '').trim();
      if (!jobId) return res.status(400).json({ error: 'jobId is required' });

      const { data: job, error: jobErr } = await supabaseAdmin
        .from('data_import_jobs')
        .update({
          status: 'queued',
          started_at: new Date().toISOString(),
        })
        .eq('id', jobId)
        .eq('created_by', req.auth.sub)
        .in('status', ['uploaded', 'draft'])
        .select(
          'id,created_by,organization_id,import_kind,file_name,status,total_rows,processed_rows,created_at,updated_at,started_at,storage_bucket,storage_path,checksum_sha256'
        )
        .maybeSingle();
      if (jobErr || !job) {
        return res.status(404).json({ error: jobErr?.message || 'Import job not found or not startable' });
      }

      await insertJobEvent({
        jobId: job.id,
        eventType: 'start_requested',
        actorUserId: req.auth.sub,
        actorRole: req.userRole,
        requestIp: detectIp(req),
        metadata: {},
      });
      await insertJobEvent({
        jobId: job.id,
        eventType: 'queued',
        actorUserId: req.auth.sub,
        actorRole: req.userRole,
        requestIp: detectIp(req),
        metadata: { note: 'Queued for worker processing' },
      });

      return res.json({
        job,
        phase: 'queued',
        message: 'Import job queued for worker processing.',
      });
    }
  );

  router.post('/api/imports/worker/process', async (req, res) => {
    if (assertWorkerSecret(req, res)) return;
    if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase service client is not configured' });

    const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.body?.limit || '10'), 10) || 10));
    const dryRun = req.body?.dry_run !== false;
    const workerInstance =
      (typeof req.body?.worker_instance === 'string' && req.body.worker_instance.trim()) ||
      `import-worker-${process.pid}`;

    let claimed = 0;
    let requeued = 0;
    let failed = 0;
    const jobs = [];

    for (let i = 0; i < limit; i += 1) {
      const { data: claimData, error: claimErr } = await supabaseAdmin.rpc('import_job_claim_next', {
        p_worker_instance: workerInstance,
      });
      if (claimErr) {
        return res.status(500).json({ error: claimErr.message, claimed, requeued, failed, jobs });
      }
      const claimedJob = Array.isArray(claimData) ? claimData[0] : claimData;
      if (!claimedJob?.id) break;

      claimed += 1;
      jobs.push({ id: claimedJob.id, status: claimedJob.status });

      await insertJobEvent({
        jobId: claimedJob.id,
        eventType: 'worker_claimed',
        actorUserId: null,
        actorRole: 'system_worker',
        requestIp: null,
        metadata: { worker_instance: workerInstance, dry_run: dryRun },
      });

      if (dryRun) {
        const { error: requeueErr } = await supabaseAdmin.rpc('import_job_requeue', {
          p_job_id: claimedJob.id,
          p_reason: 'Phase 2 scaffold dry run',
        });
        if (requeueErr) {
          failed += 1;
          await insertJobEvent({
            jobId: claimedJob.id,
            eventType: 'batch_failed',
            actorUserId: null,
            actorRole: 'system_worker',
            requestIp: null,
            metadata: { worker_instance: workerInstance, error: requeueErr.message },
          });
          continue;
        }
        requeued += 1;
        await insertJobEvent({
          jobId: claimedJob.id,
          eventType: 'status_changed',
          actorUserId: null,
          actorRole: 'system_worker',
          requestIp: null,
          metadata: { to_status: 'queued', reason: 'Phase 2 scaffold dry run' },
        });
        continue;
      }
      try {
        const summary = await runImportJobCore({
          job: claimedJob,
          workerInstance,
          insertJobEvent: async (jobId, eventType, metadata) => {
            await insertJobEvent({
              jobId,
              eventType,
              actorUserId: null,
              actorRole: 'system_worker',
              requestIp: null,
              metadata,
            });
          },
        });
        jobs[jobs.length - 1] = { id: claimedJob.id, status: 'completed', summary };
      } catch (e) {
        failed += 1;
        const reason = e instanceof Error ? e.message : String(e);
        await finalizeImportFailure(claimedJob.id, reason, workerInstance);
        await insertJobEvent({
          jobId: claimedJob.id,
          eventType: 'failed',
          actorUserId: null,
          actorRole: 'system_worker',
          requestIp: null,
          metadata: { reason, worker_instance: workerInstance },
        });
      }
    }

    return res.json({
      ok: true,
      worker_instance: workerInstance,
      dry_run: dryRun,
      claimed,
      requeued,
      failed,
      jobs,
    });
  });

  router.get('/api/imports/worker/stats', async (req, res) => {
    if (assertWorkerSecret(req, res)) return;
    if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase service client is not configured' });
    try {
      const statuses = ['draft', 'uploaded', 'validated', 'queued', 'importing', 'completed', 'failed', 'cancelled'];
      const queue = {};
      for (const status of statuses) {
        const { count } = await supabaseAdmin
          .from('data_import_jobs')
          .select('*', { count: 'exact', head: true })
          .eq('status', status);
        queue[status] = count ?? 0;
      }
      return res.json({ ok: true, queue });
    } catch (e) {
      return res.status(500).json({ error: e?.message || 'stats failed' });
    }
  });

  router.get(
    '/api/imports/jobs/:jobId',
    requireSupabaseJwt,
    attachUserRole,
    createRequireRbacPermission('properties.read'),
    async (req, res) => {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Supabase service client is not configured' });
      }
      const jobId = String(req.params.jobId || '').trim();
      if (!jobId) return res.status(400).json({ error: 'jobId is required' });

      const { data: job, error: jobErr } = await supabaseAdmin
        .from('data_import_jobs')
        .select(
          'id,created_by,organization_id,import_kind,file_name,status,total_rows,processed_rows,summary,error_report,created_at,updated_at,started_at,finished_at,storage_bucket,storage_path,checksum_sha256,correlation_id'
        )
        .eq('id', jobId)
        .eq('created_by', req.auth.sub)
        .maybeSingle();
      if (jobErr || !job) return res.status(404).json({ error: jobErr?.message || 'Import job not found' });

      const { data: events, error: eventsErr } = await supabaseAdmin
        .from('data_import_job_events')
        .select('id,event_type,actor_user_id,actor_role,request_ip,metadata,created_at')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (eventsErr) return res.status(500).json({ error: eventsErr.message });

      return res.json({ job, events: events || [] });
    }
  );

  return router;
}
