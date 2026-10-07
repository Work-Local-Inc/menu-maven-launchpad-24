import { buildExport, fetchSubmissionBundle } from "@/lib/submissionBundle";

export const downloadJsonFile = (data: unknown, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadSubmissionJson = async (submissionId: string) => {
  const bundle = await fetchSubmissionBundle(submissionId);
  const name = String(bundle.submission.restaurant_name || "restaurant").replace(/[^a-z0-9]/gi, "_").toLowerCase();
  downloadJsonFile(buildExport(bundle), `${name}_submission.json`);
  return true;
};
