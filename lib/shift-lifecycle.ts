export function canCancelShift(status: string): boolean {
  return status === 'PENDING' || status === 'MATCHED'
}

export function shouldNotifyWorkerAboutCancellation(status: string, workerId?: string | null): boolean {
  return Boolean(workerId) && status === 'MATCHED'
}
