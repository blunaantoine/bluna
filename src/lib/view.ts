import type { Project } from "./projects";

/** Les logos s'affichent en entier sur leur couleur de fond ; photos et captures remplissent le cadre. */
export const fitFor = (p: Pick<Project, "category">, src?: string) =>
  p.category === "identite" && !/branding|carte-visite|casquette/.test(src ?? "") ? "contain" : "cover";
