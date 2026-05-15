import { Status } from "../lib/data";

interface BadgeProps {
  status: Status;
}

export function Badge({ status }: BadgeProps) {
  if (!status) return <span className="text-gray-400">—</span>;
  const classes = {
    ok: "bg-[#EAF3DE] text-[#27500A]",
    warn: "bg-[#FAEEDA] text-[#633806]",
    nok: "bg-[#FCEBEB] text-[#791F1F]",
  };
  const labels = { ok: "OK", warn: "Let op", nok: "NOK" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${classes[status]}`}>
      {labels[status]}
    </span>
  );
}
