"use client";
export default function PrintButton() {
  return <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>Télécharger en PDF</button>;
}
