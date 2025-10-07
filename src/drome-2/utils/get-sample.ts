import { z } from "zod";

const drumMachineDataSchema = z.object({
  basePath: z.string(),
  slugs: z.record(z.string(), z.array(z.string())),
});

const drumMachineSchema = z.object({
  "9000": drumMachineDataSchema,
  ace: drumMachineDataSchema,
  cr78: drumMachineDataSchema,
  d70: drumMachineDataSchema,
  dmx: drumMachineDataSchema,
  dr550: drumMachineDataSchema,
  hr16: drumMachineDataSchema,
  ms404: drumMachineDataSchema,
  rm50: drumMachineDataSchema,
  tr505: drumMachineDataSchema,
  tr606: drumMachineDataSchema,
  tr626: drumMachineDataSchema,
  tr707: drumMachineDataSchema,
  tr808: drumMachineDataSchema,
  tr909: drumMachineDataSchema,
  loops: drumMachineDataSchema,
});

const modules = import.meta.glob("../dictionaries/samples/drums/*.json", {
  import: "default",
});

const promises = Object.entries(modules).map(async ([path, getter]) => {
  const key = path.split("/").at(-1)?.replace(".json", "") ?? path;
  const data = await getter();
  return [key, data] as const;
});

type DrumMachineData = z.infer<typeof drumMachineDataSchema>;
const drumMachines: Record<string, DrumMachineData> = drumMachineSchema.parse(
  Object.fromEntries(await Promise.all(promises))
);

function getSampleUrl(bank: string, name: string, index: number | string) {
  const data = drumMachines[bank.toLocaleLowerCase()];
  const slugs = data?.slugs[name];
  if (!data || !slugs) return undefined;
  const slug = slugs[toNumber(index) % slugs.length];
  return `${data.basePath}${slug}`;
}

function toNumber(value: number | string): number {
  if (typeof value === "number") {
    return isFinite(value) ? value : 0;
  }

  const parsed = Number(value);
  return isNaN(parsed) || !isFinite(parsed) ? 0 : parsed;
}

export { getSampleUrl, drumMachineSchema };
