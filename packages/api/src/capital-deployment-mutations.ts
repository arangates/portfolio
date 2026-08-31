import "server-only";

import {
  auditEvent,
  capitalAllocationTarget,
  capitalDeploymentPolicy,
  db,
  instrument,
} from "@portfolio/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { deploymentBuckets } from "./capital-deployment-calculations";

const optionalUuid = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? null : value),
  z.uuid().nullable(),
);

export const capitalDeploymentPolicyInput = z
  .object({
    stagingInstrumentId: optionalUuid,
    monthlyDeploymentAmount: z.coerce.number().min(0).max(1_000_000_000_000_000),
    deploymentCurrency: z
      .string()
      .trim()
      .regex(/^[A-Z]{3}$/),
    reserveFloor: z.coerce.number().min(0).max(1_000_000_000_000_000),
    fixedDepositHorizonDays: z.coerce.number().int().min(30).max(3650),
    transferMatchWindowDays: z.coerce.number().int().min(0).max(31),
    transferMatchTolerancePercent: z.coerce.number().min(0).max(100),
    includeBankCash: z.boolean(),
    enabled: z.boolean(),
    targets: z
      .array(
        z
          .object({
            bucket: z.enum(deploymentBuckets),
            targetPercent: z.coerce.number().min(0).max(100),
            minimumPercent: z.coerce.number().min(0).max(100),
            maximumPercent: z.coerce.number().min(0).max(100),
          })
          .refine(
            (value) =>
              value.minimumPercent <= value.targetPercent &&
              value.targetPercent <= value.maximumPercent,
            { message: "Each target must remain within its minimum and maximum range" },
          ),
      )
      .length(deploymentBuckets.length),
  })
  .superRefine((input, context) => {
    const unique = new Set(input.targets.map((target) => target.bucket));
    if (unique.size !== deploymentBuckets.length) {
      context.addIssue({
        code: "custom",
        path: ["targets"],
        message: "Every allocation bucket must appear exactly once",
      });
    }
    const total = input.targets.reduce((sum, target) => sum + target.targetPercent, 0);
    if (Math.abs(total - 100) > 0.01) {
      context.addIssue({
        code: "custom",
        path: ["targets"],
        message: "Target allocation must total 100%",
      });
    }
  });

export async function saveCapitalDeploymentPolicy(userId: string, raw: unknown) {
  const input = capitalDeploymentPolicyInput.parse(raw);
  if (input.stagingInstrumentId) {
    const [ownedInstrument] = await db
      .select({ id: instrument.id })
      .from(instrument)
      .where(and(eq(instrument.id, input.stagingInstrumentId), eq(instrument.userId, userId)))
      .limit(1);
    if (!ownedInstrument) throw new Error("The selected staging instrument was not found");
  }

  await db
    .insert(capitalDeploymentPolicy)
    .values({
      userId,
      stagingInstrumentId: input.stagingInstrumentId,
      monthlyDeploymentAmount: input.monthlyDeploymentAmount.toString(),
      deploymentCurrency: input.deploymentCurrency,
      reserveFloor: input.reserveFloor.toString(),
      fixedDepositHorizonDays: input.fixedDepositHorizonDays,
      transferMatchWindowDays: input.transferMatchWindowDays,
      transferMatchTolerance: (input.transferMatchTolerancePercent / 100).toString(),
      includeBankCash: input.includeBankCash,
      enabled: input.enabled,
    })
    .onConflictDoUpdate({
      target: capitalDeploymentPolicy.userId,
      set: {
        stagingInstrumentId: input.stagingInstrumentId,
        monthlyDeploymentAmount: input.monthlyDeploymentAmount.toString(),
        deploymentCurrency: input.deploymentCurrency,
        reserveFloor: input.reserveFloor.toString(),
        fixedDepositHorizonDays: input.fixedDepositHorizonDays,
        transferMatchWindowDays: input.transferMatchWindowDays,
        transferMatchTolerance: (input.transferMatchTolerancePercent / 100).toString(),
        includeBankCash: input.includeBankCash,
        enabled: input.enabled,
        updatedAt: new Date(),
      },
    });

  await Promise.all(
    input.targets.map((target) =>
      db
        .insert(capitalAllocationTarget)
        .values({
          userId,
          bucket: target.bucket,
          targetWeight: (target.targetPercent / 100).toString(),
          minimumWeight: (target.minimumPercent / 100).toString(),
          maximumWeight: (target.maximumPercent / 100).toString(),
        })
        .onConflictDoUpdate({
          target: [capitalAllocationTarget.userId, capitalAllocationTarget.bucket],
          set: {
            targetWeight: (target.targetPercent / 100).toString(),
            minimumWeight: (target.minimumPercent / 100).toString(),
            maximumWeight: (target.maximumPercent / 100).toString(),
            enabled: true,
            updatedAt: new Date(),
          },
        }),
    ),
  );
  await db.insert(auditEvent).values({
    userId,
    action: "updated",
    entityType: "capital_deployment_policy",
    entityId: userId,
  });
  return { id: userId };
}
