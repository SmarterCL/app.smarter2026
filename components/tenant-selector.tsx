"use client";
import React, { useEffect, useState } from "react";
import { Tenant } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

interface TenantSelectorProps {
  onChange: (tenant: Tenant | null) => void;
  selectedId?: string;
}

export const TenantSelector: React.FC<TenantSelectorProps> = ({ onChange, selectedId }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/tenants/list");
        if (!res.ok) throw new Error("Failed to load tenants");
        const data = await res.json();
        if (active) setTenants(data.tenants || []);
      } catch (e: any) {
        if (active) setError(e.message || "Error cargando tenants");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Tenant</label>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
        </div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : tenants.length === 0 ? (
        <div className="text-sm text-muted-foreground">Sin tenants. Crea uno.</div>
      ) : (
        <select
          className="w-full rounded border bg-background p-2 text-sm"
          value={selectedId || ""}
          onChange={(e) => {
            const t = tenants.find((x) => x.id === e.target.value) || null;
            onChange(t);
          }}
        >
          <option value="">Selecciona...</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.business_name} ({t.rut})
            </option>
          ))}
        </select>
      )}
      <a
        href="/dashboard/tenant/new"
        className="text-xs underline text-primary hover:text-primary/80"
      >
        Crear nuevo tenant
      </a>
    </div>
  );
};

export default TenantSelector;