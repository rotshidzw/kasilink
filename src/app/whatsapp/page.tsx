import { SimulatePublicWhatsAppForm } from "./simulate-form";

export default function WhatsAppPublicSimulatorPage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">WhatsApp inbox simulator</h1>
        <p className="text-sm text-slate-600">
          Anyone can send a message here to simulate WhatsApp inbound traffic. This is intended for local development.
        </p>
      </div>
      <SimulatePublicWhatsAppForm />
    </div>
  );
}
