import { Resend } from 'resend'

// Lazily instantiated so missing key at build time doesn't crash module load
let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY!)
  return _resend
}

const FROM = process.env.RESEND_FROM_EMAIL ?? 'Carelink <noreply@carelinkaustralia.com.au>'
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://carelinkaustralia.com.au'

// ─── Base layout ──────────────────────────────────────────────────────────────

function base(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Carelink</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

      <!-- Header -->
      <tr>
        <td style="background:#0d1b2a;padding:24px 32px;border-radius:12px 12px 0 0;">
          <span style="font-size:20px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
            <span style="color:#00c9a7;">✦</span> Carelink
          </span>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="background:#ffffff;padding:32px;border-left:1px solid #e8ecf0;border-right:1px solid #e8ecf0;">
          ${body}
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f8f9fb;padding:20px 32px;border:1px solid #e8ecf0;border-top:none;border-radius:0 0 12px 12px;">
          <p style="margin:0;font-size:12px;color:#9aa3ad;line-height:1.6;">
            Carelink · Victoria, Australia · Aged Care Act 2024 compliant<br/>
            AHPRA-verified workforce · <a href="${SITE}" style="color:#00c9a7;text-decoration:none;">carelinkaustralia.com.au</a>
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

function btn(text: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:#00c9a7;color:#0d1b2a;font-weight:800;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;margin-top:8px;">${text}</a>`
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 8px;font-size:24px;font-weight:900;color:#0d1b2a;letter-spacing:-0.5px;">${text}</h1>`
}

function p(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:#4a5568;line-height:1.65;">${text}</p>`
}

function detail(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 14px;font-size:13px;font-weight:600;color:#9aa3ad;white-space:nowrap;border-bottom:1px solid #f1f5f9;">${label}</td>
    <td style="padding:10px 14px;font-size:13px;color:#0d1b2a;font-weight:600;border-bottom:1px solid #f1f5f9;">${value}</td>
  </tr>`
}

function detailTable(...rows: [string, string][]): string {
  return `<table cellpadding="0" cellspacing="0" width="100%" style="background:#f8f9fb;border:1px solid #e8ecf0;border-radius:10px;margin:20px 0;overflow:hidden;">
    ${rows.map(([l, v]) => detail(l, v)).join('')}
  </table>`
}

// ─── Core send ────────────────────────────────────────────────────────────────

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  try {
    await getResend().emails.send({ from: FROM, to, subject, html })
  } catch (err) {
    // Never throw — email is non-critical, log and continue
    console.error('[email] send failed:', (err as Error).message, { to, subject })
  }
}

// ─── Worker emails ────────────────────────────────────────────────────────────

export async function emailWorkerShiftMatched(opts: {
  workerEmail: string
  workerName: string
  facilityName: string
  facilityAddress: string
  role: string
  date: string
  startTime: string
  endTime: string
}) {
  const html = base(`
    ${h1('You\'ve been matched for a shift! 🎉')}
    ${p(`Hi ${opts.workerName}, your shift has been confirmed. Here are the details:`)}
    ${detailTable(
      ['Facility', opts.facilityName],
      ['Address', opts.facilityAddress],
      ['Role', opts.role],
      ['Date', opts.date],
      ['Start', opts.startTime],
      ['Finish', opts.endTime],
    )}
    ${p('Clock in from the Carelink app when you arrive. Make sure you\'re on time — the facility is counting on you.')}
    ${btn('View My Shifts', `${SITE}/worker/my-shifts`)}
  `)
  await sendEmail(opts.workerEmail, `Shift confirmed — ${opts.facilityName} on ${opts.date}`, html)
}

export async function emailWorkerShiftCancelled(opts: {
  workerEmail: string
  workerName: string
  facilityName: string
  date: string
  reason?: string
}) {
  const html = base(`
    ${h1('Your shift has been cancelled')}
    ${p(`Hi ${opts.workerName}, unfortunately the following shift has been cancelled:`)}
    ${detailTable(
      ['Facility', opts.facilityName],
      ['Date', opts.date],
      ...(opts.reason ? [['Reason', opts.reason] as [string, string]] : []),
    )}
    ${p('We\'re sorry for the inconvenience. Browse available shifts to find another one.')}
    ${btn('Browse Available Shifts', `${SITE}/worker`)}
  `)
  await sendEmail(opts.workerEmail, `Shift cancelled — ${opts.facilityName} on ${opts.date}`, html)
}

export async function emailWorkerShiftAssigned(opts: {
  workerEmail: string
  workerName: string
  facilityName: string
  facilityAddress: string
  role: string
  date: string
  startTime: string
  endTime: string
}) {
  const html = base(`
    ${h1('You\'ve been assigned a shift')}
    ${p(`Hi ${opts.workerName}, the Carelink team has assigned you to the following shift:`)}
    ${detailTable(
      ['Facility', opts.facilityName],
      ['Address', opts.facilityAddress],
      ['Role', opts.role],
      ['Date', opts.date],
      ['Start', opts.startTime],
      ['Finish', opts.endTime],
    )}
    ${p('Clock in from your phone when you arrive. If you can\'t make this shift, please contact us immediately.')}
    ${btn('View My Shifts', `${SITE}/worker/my-shifts`)}
  `)
  await sendEmail(opts.workerEmail, `Shift assigned — ${opts.facilityName} on ${opts.date}`, html)
}

export async function emailWorkerDocReviewed(opts: {
  workerEmail: string
  workerName: string
  docType: string
  status: 'APPROVED' | 'REJECTED'
  reviewNote?: string | null
  isNowCompliant: boolean
}) {
  const approved = opts.status === 'APPROVED'
  const docLabel = opts.docType.replace(/_/g, ' ')
  const html = base(`
    ${h1(approved ? `Document approved ✅` : `Document rejected ⚠️`)}
    ${p(`Hi ${opts.workerName}, your <strong>${docLabel}</strong> has been ${approved ? 'approved' : 'rejected'}.`)}
    ${opts.reviewNote ? p(`<strong>Note from reviewer:</strong> ${opts.reviewNote}`) : ''}
    ${opts.isNowCompliant && approved
      ? `<div style="background:#ebfbf8;border:1px solid #00c9a7;border-radius:10px;padding:16px 20px;margin:16px 0;">
          <p style="margin:0;font-size:15px;font-weight:800;color:#0d1b2a;">🎉 You're fully compliant!</p>
          <p style="margin:6px 0 0;font-size:13px;color:#4a5568;">All required documents have been approved. You can now browse and accept shifts.</p>
        </div>`
      : approved
        ? p('Keep uploading any remaining required documents to become fully compliant.')
        : p('Please re-upload a valid copy of this document from your profile page.')
    }
    ${btn(approved ? 'Browse Shifts' : 'Update Documents', approved ? `${SITE}/worker` : `${SITE}/worker/profile`)}
  `)
  const subject = approved
    ? `Document approved — ${docLabel}`
    : `Action required — ${docLabel} rejected`
  await sendEmail(opts.workerEmail, subject, html)
}

export async function emailWorkerShiftCompleted(opts: {
  workerEmail: string
  workerName: string
  facilityName: string
  date: string
  hours: number
}) {
  const html = base(`
    ${h1('Shift completed — great work!')}
    ${p(`Hi ${opts.workerName}, your shift at ${opts.facilityName} on ${opts.date} has been marked as completed.`)}
    ${detailTable(
      ['Facility', opts.facilityName],
      ['Date', opts.date],
      ['Hours worked', `${opts.hours.toFixed(1)} hrs`],
    )}
    ${p('Your earnings will be reflected in your pay summary once the timesheet is approved.')}
    ${btn('View Pay Summary', `${SITE}/worker/pay`)}
  `)
  await sendEmail(opts.workerEmail, `Shift completed — ${opts.facilityName}`, html)
}

// ─── Facility emails ──────────────────────────────────────────────────────────

export async function emailFacilityShiftFilled(opts: {
  facilityEmail: string
  facilityName: string
  workerName: string
  workerRole: string
  date: string
  startTime: string
  endTime: string
}) {
  const html = base(`
    ${h1('Your shift has been filled ✅')}
    ${p(`Great news — a verified ${opts.workerRole} has accepted your shift.`)}
    ${detailTable(
      ['Worker', opts.workerName],
      ['Role', opts.workerRole],
      ['Date', opts.date],
      ['Start', opts.startTime],
      ['Finish', opts.endTime],
    )}
    ${p('The worker will clock in on arrival. You can view live roster status from your facility dashboard.')}
    ${btn('View Live Roster', `${SITE}/facility?tab=roster`)}
  `)
  await sendEmail(opts.facilityEmail, `Shift filled — ${opts.workerRole} confirmed for ${opts.date}`, html)
}

export async function emailFacilityWorkerCancelledShift(opts: {
  facilityEmail: string
  facilityName: string
  workerName: string
  role: string
  date: string
  startTime: string
}) {
  const html = base(`
    ${h1('A worker has cancelled their shift ⚠️')}
    ${p(`${opts.workerName} has cancelled their ${opts.role} shift at ${opts.facilityName}. The shift is now open again.`)}
    ${detailTable(
      ['Date', opts.date],
      ['Start time', opts.startTime],
      ['Role needed', opts.role],
    )}
    ${p('The shift has been re-posted automatically. Carelink will match a replacement worker as quickly as possible.')}
    ${btn('View Open Shifts', `${SITE}/facility`)}
  `)
  await sendEmail(opts.facilityEmail, `Worker cancelled — ${opts.role} shift on ${opts.date} is now open`, html)
}

export async function emailFacilityShiftCompleted(opts: {
  facilityEmail: string
  facilityName: string
  workerName: string
  role: string
  date: string
  hours: number
}) {
  const html = base(`
    ${h1('Shift completed')}
    ${p(`${opts.workerName} has clocked out and completed their ${opts.role} shift at ${opts.facilityName}.`)}
    ${detailTable(
      ['Worker', opts.workerName],
      ['Role', opts.role],
      ['Date', opts.date],
      ['Hours logged', `${opts.hours.toFixed(1)} hrs`],
    )}
    ${p('Please review and approve the timesheet from your facility dashboard.')}
    ${btn('Review Timesheet', `${SITE}/facility?tab=history`)}
  `)
  await sendEmail(opts.facilityEmail, `Shift completed — ${opts.workerName} clocked out`, html)
}

// ─── Admin emails ─────────────────────────────────────────────────────────────

export async function emailAdminNewWorker(opts: {
  workerName: string
  workerEmail: string
  workerRole: string
}) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) return
  const html = base(`
    ${h1('New worker registration')}
    ${p('A new healthcare worker has registered on Carelink and is awaiting document review.')}
    ${detailTable(
      ['Name', opts.workerName],
      ['Email', opts.workerEmail],
      ['Role', opts.workerRole],
      ['Status', 'Pending approval'],
    )}
    ${p('Review their compliance documents and approve their profile to allow them to start accepting shifts.')}
    ${btn('Review in Dashboard', `${SITE}/dashboard`)}
  `)
  await sendEmail(adminEmail, `New ${opts.workerRole} registered — ${opts.workerName}`, html)
}

export async function emailAdminDocUploaded(opts: {
  workerName: string
  workerEmail: string
  docType: string
}) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) return
  const docLabel = opts.docType.replace(/_/g, ' ')
  const html = base(`
    ${h1('Compliance document uploaded')}
    ${p(`A worker has uploaded a new document that requires your review.`)}
    ${detailTable(
      ['Worker', opts.workerName],
      ['Email', opts.workerEmail],
      ['Document', docLabel],
      ['Action needed', 'Approve or reject'],
    )}
    ${btn('Review Document', `${SITE}/dashboard`)}
  `)
  await sendEmail(adminEmail, `Document pending review — ${docLabel} from ${opts.workerName}`, html)
}
