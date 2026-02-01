import { sendWhatsApp } from "./provider";

type StatusUpdateParams = {
  phoneE164: string;
  requestId: string;
  status: string;
};

type DriverAssignedParams = {
  phoneE164: string;
  requestId: string;
  driverName: string;
};

export async function notifyContactRequestStatus({ phoneE164, requestId, status }: StatusUpdateParams) {
  const text = `Update ✅ Your request ${requestId.slice(-6).toUpperCase()} is now ${status}.`;

  await sendWhatsApp({ to: phoneE164, body: text, template: "STATUS_UPDATE", requestId });
}

export async function notifyDriverAssigned({ phoneE164, requestId, driverName }: DriverAssignedParams) {
  const text = `Driver assigned ✅ ${driverName} is on it. Ref: ${requestId.slice(-6).toUpperCase()}.`;

  await sendWhatsApp({ to: phoneE164, body: text, template: "DRIVER_ASSIGNED", requestId });
}
