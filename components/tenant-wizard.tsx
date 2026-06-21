"use client";
import React, { useState } from "react";
import { Loader2 } from "lucide-react";

type Step = 1 | 2 | 3;

interface FormState {
  rut: string;
  business_name: string;
  contact_email: string;
  services: {
    crm: boolean;
    bot: boolean;
    erp: boolean;
    workflows: boolean;
    kpi: boolean;
  };
}

const initialState: FormState = {
  rut: "",
  business_name: "",
  contact_email: "",
  services: { crm: true, bot: true, erp: false, workflows: false, kpi: false },
};

function validateRut(rut: string) {
  return /^(\d{7,8}-[\dkK])$/.test(rut.trim());
}

export const TenantWizard: React.FC = () => {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      if (!validateRut(form.rut)) throw new Error("RUT inválido (formato esperado 12345678-9)");
      if (!form.business_name) throw new Error("Nombre requerido");
      if (!form.contact_email) throw new Error("Email de contacto requerido");
      const res = await fetch("/api/tenants/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rut: form.rut,
          business_name: form.business_name,
          contact_email: form.contact_email,
          services_enabled: form.services,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        const details = j?.details && typeof j.details === "object"
          ? Object.values(j.details).flat().filter(Boolean).join(", ")
          : "";
        throw new Error(details || j.error || j.message || "Error creando tenant");
      }
      const data = await res.json();
      setCreatedId(data.tenant?.id || null);
      setStep(3);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold">Nuevo Tenant</h1>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">RUT</label>
            <input
              className="mt-1 w-full rounded border p-2 text-sm"
              value={form.rut}
              onChange={(e) => setForm({ ...form, rut: e.target.value })}
              placeholder="12345678-9"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Nombre Empresa</label>
            <input
              className="mt-1 w-full rounded border p-2 text-sm"
              value={form.business_name}
              onChange={(e) => setForm({ ...form, business_name: e.target.value })}
              placeholder="Mi Empresa SpA"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email de contacto</label>
            <input
              className="mt-1 w-full rounded border p-2 text-sm"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              placeholder="contacto@miempresa.cl"
              type="email"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium">Servicios</h2>
            {Object.entries(form.services).map(([key, val]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={val}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      services: { ...form.services, [key]: e.target.checked },
                    })
                  }
                />
                {key}
              </label>
            ))}
          <div className="flex justify-between gap-2">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded border text-sm"
            >
              Atrás
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm flex items-center gap-2"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}Crear Tenant
            </button>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div className="p-4 rounded border bg-green-50 text-sm">
            Tenant creado exitosamente.
            {createdId && (
              <div className="mt-2">ID: {createdId}</div>
            )}
          </div>
          <a
            href="/workspace"
            className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm inline-block"
          >
            Ir al Workspace
          </a>
        </div>
      )}
    </div>
  );
};

export default TenantWizard;
