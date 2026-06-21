/**
 * Planes y límites técnicos para SmarterBot QR
 * 
 * Estos límites se aplican por tenant (RUT)
 */

export type PlanId = "starter" | "growth" | "pro"

export interface PlanLimits {
  flujos: number // -1 = ilimitado
  devices: number // -1 = ilimitado
  scansMes: number // -1 = ilimitado
  flujosPersonalizados: boolean
  integracionOdoo: "basica" | "completa" | "avanzada"
  integracionChatwoot: boolean
  historialCliente: boolean
  reglasAutomatizadas: boolean
  multiSucursal: boolean
  nfcSupport: boolean
  wifiLogin: boolean
  clusterDistribuido: boolean
  iaPersonalizada: boolean
  dashboardOperativo: boolean
  slaSoporte: boolean
}

export interface Plan {
  id: PlanId
  name: string
  tagline: string
  target: string
  price: {
    setup: number // CLP
    monthly: number // CLP
  }
  limits: PlanLimits
  features: string[]
}

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    tagline: "QR inteligente",
    target: "Pymes / Restaurantes chicos",
    price: {
      setup: 30000,
      monthly: 25000,
    },
    limits: {
      flujos: 1,
      devices: 2,
      scansMes: 1000,
      flujosPersonalizados: false,
      integracionOdoo: "basica",
      integracionChatwoot: false,
      historialCliente: false,
      reglasAutomatizadas: false,
      multiSucursal: false,
      nfcSupport: false,
      wifiLogin: false,
      clusterDistribuido: false,
      iaPersonalizada: false,
      dashboardOperativo: false,
      slaSoporte: false,
    },
    features: [
      "QR dinámico (qr.smarterbot.store)",
      "1 flujo (menú o contacto)",
      "1 tenant (RUT)",
      "Hasta 2 dispositivos",
      "Integración básica con Odoo (leads)",
      "Chatbot simple (Telegram)",
    ],
  },
  growth: {
    id: "growth",
    name: "Growth",
    tagline: "Automatización comercial",
    target: "Negocios en operación",
    price: {
      setup: 80000,
      monthly: 59000,
    },
    limits: {
      flujos: 5,
      devices: 5,
      scansMes: 10000,
      flujosPersonalizados: true,
      integracionOdoo: "completa",
      integracionChatwoot: true,
      historialCliente: true,
      reglasAutomatizadas: true,
      multiSucursal: false,
      nfcSupport: false,
      wifiLogin: false,
      clusterDistribuido: false,
      iaPersonalizada: false,
      dashboardOperativo: true,
      slaSoporte: false,
    },
    features: [
      "Todo Starter +",
      "Múltiples flujos (menú + soporte + pago)",
      "Integración completa Odoo (ventas) + Chatwoot",
      "Hasta 5 dispositivos",
      "Historial cliente (Redis)",
      "Reglas automatizadas del SaaS",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "SmarterOS completo",
    target: "Cadenas / Retail / Turismo",
    price: {
      setup: 200000,
      monthly: 180000,
    },
    limits: {
      flujos: -1,
      devices: -1,
      scansMes: -1,
      flujosPersonalizados: true,
      integracionOdoo: "avanzada",
      integracionChatwoot: true,
      historialCliente: true,
      reglasAutomatizadas: true,
      multiSucursal: true,
      nfcSupport: true,
      wifiLogin: true,
      clusterDistribuido: true,
      iaPersonalizada: true,
      dashboardOperativo: true,
      slaSoporte: true,
    },
    features: [
      "Todo Growth +",
      "Multi-sucursal",
      "NFC + QR + WiFi login",
      "Cluster distribuido (OpenClaw nodes)",
      "IA personalizada (Ollama + RAG)",
      "Dashboard operativo",
      "SLA + soporte prioritario",
    ],
  },
}

/**
 * Verifica si un plan tiene una feature específica
 */
export function hasFeature(planId: PlanId, feature: keyof PlanLimits): boolean {
  const plan = PLANS[planId]
  if (!plan) return false

  const value = plan.limits[feature]
  
  // Para valores numéricos, verificar si es > 0 o -1 (ilimitado)
  if (typeof value === "number") {
    return value > 0 || value === -1
  }
  
  // Para booleanos
  return Boolean(value)
}

/**
 * Verifica si un tenant puede realizar una acción basada en sus límites
 */
export function canPerformAction(
  currentUsage: {
    flujos: number
    devices: number
    scansMes: number
  },
  planId: PlanId,
  action: "create_flujo" | "add_device" | "scan"
): boolean {
  const plan = PLANS[planId]
  if (!plan) return false

  switch (action) {
    case "create_flujo":
      return plan.limits.flujos === -1 || currentUsage.flujos < plan.limits.flujos
    case "add_device":
      return plan.limits.devices === -1 || currentUsage.devices < plan.limits.devices
    case "scan":
      return plan.limits.scansMes === -1 || currentUsage.scansMes < plan.limits.scansMes
    default:
      return false
  }
}

/**
 * Obtiene el límite de un plan para una feature específica
 * Retorna null si es ilimitado
 */
export function getLimit(planId: PlanId, feature: "flujos" | "devices" | "scansMes"): number | null {
  const plan = PLANS[planId]
  if (!plan) return null

  const limit = plan.limits[feature]
  return limit === -1 ? null : limit
}

/**
 * Calcula el porcentaje de uso de un límite
 */
export function getUsagePercentage(current: number, limit: number | null): number {
  if (limit === null) return 0 // Ilimitado
  if (limit === 0) return 100
  return Math.min(100, Math.round((current / limit) * 100))
}

export default PLANS
