import { Status } from "../lib/data";

interface BadgeProps { status: Status; }

export function Badge({ status }: BadgeProps) {
  if (!status) return <span className="badge-grey">—</span>;
  return <span className={`badge-${status}`}>{status === "ok" ? "OK" : status === "warn" ? "Let op" : "NOK"}</span>;
}
