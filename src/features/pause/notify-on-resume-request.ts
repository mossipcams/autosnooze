/**
 * Opt-in notify_on_resume flag for pause service payloads.
 */

export function appendNotifyOnResumeFlag<T extends Record<string, unknown>>(
  request: T,
  notifyOnResume?: boolean,
): T {
  if (!notifyOnResume) {
    return request;
  }

  return {
    ...request,
    notify_on_resume: true,
  };
}
