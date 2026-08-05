import {
  createHbceDeliveryRecord,
  createHbceDeliveryAttemptRecord,
  toHbcePublicDeliveryProjection,
  getHbceDeliveryAttemptUniquenessKey,
  assertHbceDeliveryRuntimeBinding,
  HBCE_LEVEL_10_D001_BOUNDARY,
} from "../hbce-level10-delivery-domain";

describe("HBCE Runtime Level 10 D001 Delivery Domain", () => {

  test("creates canonical delivery", () => {

    const delivery = createHbceDeliveryRecord({
      deliveryId: "DELIVERY-1",
      operationId: "OP-1",
      outboxId: "OUTBOX-1",

      tenantId: "HBCE-TENANT-SELF-PILOT",
      workspaceId: "HBCE-WORKSPACE-RND",

      subjectIpr: "IPR-TEST",

      idempotencyKey: "KEY-1",

      destinationType: "HBCE_INTERNAL_OPERATION_DELIVERY",
      destinationRef: "operation:OP-1",
    });

    expect(delivery.status).toBe("PENDING");
    expect(delivery.attemptCount).toBe(0);

    expect(delivery.lastAttemptAt).toBeNull();
    expect(delivery.deliveredAt).toBeNull();

  });

  test("creates canonical delivery attempt", () => {

    const attempt = createHbceDeliveryAttemptRecord({

      attemptId: "ATTEMPT-1",

      deliveryId: "DELIVERY-1",

      attemptNumber: 1,

      workerId: "WORKER-A",

      leaseToken: "LEASE-1",

    });

    expect(attempt.attemptNumber).toBe(1);

    expect(attempt.deliveryId).toBe("DELIVERY-1");

  });

  test("creates public projection", () => {

    const delivery = createHbceDeliveryRecord({

      deliveryId: "DELIVERY-1",

      operationId: "OP-1",

      outboxId: "OUTBOX-1",

      tenantId: "HBCE-TENANT-SELF-PILOT",

      workspaceId: "HBCE-WORKSPACE-RND",

      subjectIpr: "IPR-TEST",

      idempotencyKey: "KEY-1",

      destinationType: "HBCE_INTERNAL_OPERATION_DELIVERY",

      destinationRef: "operation:OP-1",

    });

    const projection = toHbcePublicDeliveryProjection(delivery);

    expect(projection.deliveryId).toBe("DELIVERY-1");

    expect(projection.status).toBe("PENDING");

    expect(projection.attemptCount).toBe(0);

    expect((projection as any).leaseToken).toBeUndefined();

  });

  test("creates uniqueness key", () => {

    const key = getHbceDeliveryAttemptUniquenessKey(

      "DELIVERY-1",

      2,

    );

    expect(key).toBe("DELIVERY-1:2");

  });

  test("runtime binding succeeds", () => {

    const delivery = createHbceDeliveryRecord({

      deliveryId: "DELIVERY-1",

      operationId: "OP-1",

      outboxId: "OUTBOX-1",

      tenantId: "HBCE-TENANT-SELF-PILOT",

      workspaceId: "HBCE-WORKSPACE-RND",

      subjectIpr: "IPR-TEST",

      idempotencyKey: "KEY-1",

      destinationType: "HBCE_INTERNAL_OPERATION_DELIVERY",

      destinationRef: "operation:OP-1",

    });

    expect(() =>

      assertHbceDeliveryRuntimeBinding(delivery, {

        tenantId: "HBCE-TENANT-SELF-PILOT",

        workspaceId: "HBCE-WORKSPACE-RND",

        subjectIpr: "IPR-TEST",

        idempotencyKey: "KEY-1",

      }),

    ).not.toThrow();

  });

  test("boundary remains level10 d001", () => {

    expect(

      HBCE_LEVEL_10_D001_BOUNDARY.workerImplemented,

    ).toBe(false);

    expect(

      HBCE_LEVEL_10_D001_BOUNDARY.retryImplemented,

    ).toBe(false);

    expect(

      HBCE_LEVEL_10_D001_BOUNDARY.webhookImplemented,

    ).toBe(false);

    expect(

      HBCE_LEVEL_10_D001_BOUNDARY.realExternalDelivery,

    ).toBe(false);

    expect(

      HBCE_LEVEL_10_D001_BOUNDARY.legalCertification,

    ).toBe(false);

  });

});
