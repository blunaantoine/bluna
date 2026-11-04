import path from "node:path";

/** Les images ajoutées depuis l'admin sont stockées hors du dossier public (qui est figé au build). */
export const uploadDir = () => path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "data", "uploads"));
