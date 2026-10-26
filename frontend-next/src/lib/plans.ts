export type PlanTier = "free" | "tuition" | "academy";

export interface PlanConfig {
  id: PlanTier;
  name: string;
  priceMonthly: number; // PKR
  priceAnnualMonthly: number; // PKR
  maxStudents: number;
  maxTeachers: number;
  maxCourses: number;
  badge: string;
}

export const ACADEMY_PLANS: Record<PlanTier, PlanConfig> = {
  free: {
    id: "free",
    name: "Free Starter Plan",
    priceMonthly: 0,
    priceAnnualMonthly: 0,
    maxStudents: 10,
    maxTeachers: 1,
    maxCourses: 1,
    badge: "Solo Tutor & Friends",
  },
  tuition: {
    id: "tuition",
    name: "Tuition Center Plan",
    priceMonthly: 1999,
    priceAnnualMonthly: 1499,
    maxStudents: 40,
    maxTeachers: 2,
    maxCourses: 5,
    badge: "Standard Tuition Center",
  },
  academy: {
    id: "academy",
    name: "Academy Pro Plan",
    priceMonthly: 4499,
    priceAnnualMonthly: 3499,
    maxStudents: 150,
    maxTeachers: 6,
    maxCourses: 999,
    badge: "Academy Scale",
  },
};

const PLAN_STORAGE_KEY = "learnsphere_academy_plan";

export function getActivePlanTier(): PlanTier {
  if (typeof window === "undefined") return "tuition";
  const stored = localStorage.getItem(PLAN_STORAGE_KEY) as PlanTier | null;
  if (stored && ACADEMY_PLANS[stored]) {
    return stored;
  }
  // Default to tuition center so users test the full 40-student experience
  return "tuition";
}

export function setActivePlanTier(tier: PlanTier) {
  if (typeof window !== "undefined") {
    localStorage.setItem(PLAN_STORAGE_KEY, tier);
    window.dispatchEvent(new Event("academy-plan-changed"));
  }
}

export function getActivePlanConfig(): PlanConfig {
  return ACADEMY_PLANS[getActivePlanTier()];
}
