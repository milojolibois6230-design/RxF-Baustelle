import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, forwardRef } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Building2,
  Layers,
  MapPin,
  AlertTriangle,
  AlertCircle,
  X,
  Plus,
  Camera,
  User,
  Trash2,
  Save,
  ListChecks,
  Square,
  CheckSquare,
  ImagePlus,
  UploadCloud,
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Ruler,
  Compass,
  Loader2,
  LogIn,
  LogOut,
  UserPlus,
  Pencil,
  Briefcase,
  Lock,
  Check,
  Wrench,
  UserCog,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  Filter,
  Eye,
  EyeOff,
  Cloud,
  CloudOff,
  History,
  FileDown,
  Calendar,
  Link2,
  Unlink2,
  Wifi,
  WifiOff,
  RefreshCw,
  Crosshair,
  Navigation,
  Phone,
  Coffee,
  StickyNote,
  Info,
  PenTool,
  ArrowUpRight,
  Circle,
  Undo2,
  Eraser,
  Mic,
  Star,
  LayoutGrid,
  List,
  Archive,
  ArchiveRestore,
} from "lucide-react";

// ----------------------------------------------------------------------------------
// SUPABASE CLIENT
// ----------------------------------------------------------------------------------
// Beide Werte kommen aus der .env.local (siehe Setup-Anleitung). Vite stellt nur
// Variablen mit dem Prefix VITE_ im Client-Bundle zur Verfügung.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Kein harter Abbruch, damit die App trotzdem lädt und die Fehlerbanner der UI
  // (statt eines weißen Bildschirms) die eigentliche Ursache erklären können.
  console.error(
    "Supabase-Umgebungsvariablen fehlen: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Bitte .env.local prüfen."
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const FLOOR_PLANS_BUCKET = "floor-plans";
const PIN_PHOTOS_BUCKET = "pin-photos";
const PROJECT_COVERS_BUCKET = "project-covers";

// Einheitliche Datum/Uhrzeit-Formatierung — u.a. für die Bearbeitungshistorie
// (Abschnitt 3) im Pin-Modal und im PDF-Export.
function formatDateTime(iso) {
  if (!iso) return "–";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "–";
  return d.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function formatDateOnly(iso) {
  if (!iso) return "–";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "–";
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}
// Kurzform DD.MM.YY — ausschließlich für die Spalte "Aufnahmedatum" im
// Geschoss-Export (Excel & PDF), wie dort explizit vorgegeben.
function formatDateShort(iso) {
  if (!iso) return "–";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "–";
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

// ----------------------------------------------------------------------------------
// GETEILTE STYLING-KONSTANTEN
// ----------------------------------------------------------------------------------
// Fasst Tailwind-Klassenkombinationen zusammen, die wortidentisch an vielen Stellen
// (v.a. in den Modals) vorkommen. Rein deklarativ — ändert am gerenderten Markup
// nichts, reduziert nur die Wiederholung im Quelltext.

// Hintergrund-Overlay aller Modals. Der z-index bleibt bewusst pro Aufrufstelle
// explizit (z.B. öffnet sich TradesAdminModal über einem bereits offenen
// ProjectFormModal und braucht daher einen höheren Wert), daher hier ohne z-Wert.
const MODAL_BACKDROP_BASE = "fixed inset-0 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:items-center sm:p-4";

// Standard-Textfeld (Input/Select ohne Icon-Präfix) in Formularen.
const TEXT_INPUT_CLASS =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none ring-[#FF2A00]/30 placeholder:text-slate-400 focus:border-[#FF2A00] focus:ring-4 disabled:bg-slate-50";

// Kopf-/Fußzeile und Scroll-Body der einheitlichen Modal-Karte (Header mit Titel +
// Schließen-Button, scrollbarer Inhaltsbereich, Footer mit Abbrechen/Speichern).
const MODAL_HEADER_ROW = "flex items-center justify-between border-b border-slate-100 px-5 py-4";
const MODAL_FOOTER_ROW = "flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3.5";
const MODAL_BODY_SCROLL = "flex-1 space-y-4 overflow-y-auto px-5 py-4";
// Kleine, blau hervorgehobene Eyebrow-Zeile über dem eigentlichen Modal-Titel
// (z.B. "Neues Projekt" über "Projekt anlegen").
const MODAL_EYEBROW = "mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#FF2A00]";
// Schließen-Button (X) oben rechts im Modal-Header — zwei Varianten, je nachdem ob
// die jeweilige Stelle während des Speicherns/Löschens deaktiviert werden kann.
const MODAL_CLOSE_BTN = "rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700";
const MODAL_CLOSE_BTN_DISABLED = `${MODAL_CLOSE_BTN} disabled:cursor-not-allowed disabled:opacity-40`;

// Sekundärer ("Abbrechen") und primärer (blauer Submit-)Button in Formular-Footern.
const BTN_SECONDARY = "rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40";
const BTN_PRIMARY =
  "inline-flex items-center gap-1.5 rounded-lg bg-[#FF2A00] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#E02400] disabled:cursor-not-allowed disabled:opacity-60";

// ----------------------------------------------------------------------------------
// STATUS / PRIORITÄT (Mängel-Pins)
// ----------------------------------------------------------------------------------

const STATUS = {
  // Bewusst auf das exakte Markenrot ("REISNER x FRANK") statt auf Tailwinds
  // Standard-Rose-Palette umgestellt — offene Mängel-Pins sind damit farblich
  // exakt an der Corporate Identity ausgerichtet (siehe PinMarker sowie
  // PDF_STATUS_RGB weiter unten für den deckungsgleichen Farbwert im Export).
  offen: { label: "Offen", dot: "bg-[#FF2A00]", text: "text-[#FF2A00]", bg: "bg-red-50", ring: "ring-red-200" },
  bearbeitung: { label: "In Bearbeitung", dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", ring: "ring-amber-200" },
  erledigt: { label: "Erledigt", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", ring: "ring-emerald-200" },
};

// Schnell-Filter-Optionen der Status-Toggle-Leiste in der Planansicht (siehe
// FloorPlanView) — "all" zeigt unabhängig vom Status alle Pins.
const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Alle anzeigen" },
  { value: "offen", label: "Nur Offen" },
  { value: "bearbeitung", label: "In Bearbeitung" },
  { value: "erledigt", label: "Erledigt" },
];

const PRIORITY = {
  niedrig: { label: "Niedrig", text: "text-slate-600", bg: "bg-slate-100", bar: "bg-slate-400" },
  mittel: { label: "Mittel", text: "text-amber-700", bg: "bg-amber-100", bar: "bg-amber-500" },
  hoch: { label: "Hoch", text: "text-red-700", bg: "bg-red-100", bar: "bg-red-600" },
};

// Menschenlesbare Feld-Bezeichnungen für die Bearbeitungshistorie (Abschnitt 3) —
// welche Felder beim Speichern eines Pins geändert wurden, wird darüber zu einem
// lesbaren Satz wie "Aktualisiert: Titel, Beschreibung" zusammengefasst. status ist
// bewusst NICHT enthalten — Statusänderungen bekommen in handleSaveFields einen
// eigenen, prominenteren Verlaufseintrag ("Status: Offen → Erledigt").
const PIN_FIELD_LABELS = {
  title: "Titel",
  description: "Beschreibung",
  priority: "Priorität",
  assigned_to: "Zuständigkeit",
  trade_id: "Gewerk",
  angle: "Blickrichtung",
  due_date: "Frist / Fälligkeitsdatum",
  reference_code: "Anschlussbezeichnung",
  area: "Bereich",
};

// Menschenlesbare Bezeichnungen + Icons für die Aktions-Typen in pin_activity_log —
// verwendet sowohl im Verlauf im Pin-Modal als auch im PDF-Export.
const PIN_ACTIVITY_META = {
  created: { label: "Angelegt", icon: Plus },
  status_changed: { label: "Status geändert", icon: CheckSquare },
  updated: { label: "Aktualisiert", icon: Pencil },
  moved: { label: "Verschoben", icon: MapPin },
  photo_added: { label: "Foto hinzugefügt", icon: Camera },
  photo_removed: { label: "Foto entfernt", icon: Trash2 },
  photo_edited: { label: "Foto bearbeitet", icon: PenTool },
  todo_added: { label: "Aufgabe hinzugefügt", icon: ListChecks },
  todo_completed: { label: "Aufgabe erledigt", icon: CheckSquare },
  todo_reopened: { label: "Aufgabe wieder geöffnet", icon: Square },
  todo_removed: { label: "Aufgabe entfernt", icon: Trash2 },
};

// ----------------------------------------------------------------------------------
// PROJEKT-STATUS
// ----------------------------------------------------------------------------------

const PROJECT_STATUS_OPTIONS = ["Geplant", "In Bearbeitung", "On Hold", "Abgeschlossen"];

const PROJECT_STATUS_META = {
  Geplant: { text: "text-slate-600", bg: "bg-slate-100", dot: "bg-slate-400" },
  "In Bearbeitung": { text: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-500" },
  "On Hold": { text: "text-violet-700", bg: "bg-violet-50", dot: "bg-violet-500" },
  Abgeschlossen: { text: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-500" },
};

// ----------------------------------------------------------------------------------
// PROJEKTSPEZIFISCHE GEWERKE-AUSWAHL (project.selected_trades)
// ----------------------------------------------------------------------------------
// Ein Array von Gewerke-IDs, die für ein konkretes Projekt relevant sind. Es wird
// zwischen "noch nie gesetzt" (null/undefined — Bestandsprojekt von vor diesem
// Feature) und "bewusst leer" ([] — es wurde explizit kein Gewerk ausgewählt)
// unterschieden: nur im ersten Fall gilt in der App weiterhin die alte,
// unbeschränkte Auswahl aller aktiven Gewerke, damit die Migration niemanden
// aussperrt. Sobald einmal über das Projektformular gespeichert wurde, ist die
// Auswahl immer ein (ggf. leeres) Array.
function normalizeSelectedTrades(value) {
  if (value == null) return null;
  if (!Array.isArray(value)) return [];
  return value.map((id) => String(id));
}

// Liefert die relevanten Gewerke-IDs eines Projekts, oder null, wenn für dieses
// Projekt noch nie eine Auswahl gespeichert wurde (siehe Kommentar oben).
function resolveProjectTradeIds(project) {
  if (!project) return null;
  return normalizeSelectedTrades(project.selected_trades);
}

// ----------------------------------------------------------------------------------
// PROJEKTSPEZIFISCHE GEWERKE-CHIPS
// ----------------------------------------------------------------------------------
// Interaktive Chip-Auswahl der für ein Projekt relevanten Gewerke im Projektformular.
// Zeigt grundsätzlich nur aktive Gewerke aus der zentralen Gewerkeverwaltung an —
// eine bereits ausgewählte, inzwischen deaktivierte Zuordnung bleibt aber zusätzlich
// sichtbar (mit "(inaktiv)"-Hinweis), damit sie beim Bearbeiten nicht kommentarlos
// aus der Auswahl verschwindet.
function TradeChipsPicker({ trades, selected, onToggle, disabled = false }) {
  const selectedIds = new Set(selected || []);
  const visibleTrades = (trades || []).filter((t) => t.active || selectedIds.has(t.id));

  if (visibleTrades.length === 0) {
    return <p className="text-xs text-slate-400">Noch keine Gewerke in der Gewerkeverwaltung angelegt.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {visibleTrades.map((t) => {
        const active = selectedIds.has(t.id);
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onToggle(t.id)}
            disabled={disabled}
            aria-pressed={active}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              active
                ? "border-[#FF2A00] bg-[#FF2A00] text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-500 hover:border-red-300 hover:bg-red-50/50"
            }`}
          >
            {active && <Check size={11} strokeWidth={3} />}
            {t.name}
            {!t.active && " (inaktiv)"}
          </button>
        );
      })}
    </div>
  );
}

// Generisches Mehrfachauswahl-Chip-Raster für den PDF-Export-Filter (Etagen, Status,
// Ersteller — Gewerke laufen weiterhin über TradeChipsPicker). Eine leere Auswahl
// bedeutet an jeder Aufrufstelle "keine Einschränkung" (= alle), siehe filterExportPins.
function ExportChipGroup({ options, selected, onToggle, disabled = false, emptyLabel = "Keine Optionen vorhanden." }) {
  if (options.length === 0) {
    return <p className="text-xs text-slate-400">{emptyLabel}</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onToggle(opt.id)}
            disabled={disabled}
            aria-pressed={active}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              active
                ? "border-[#FF2A00] bg-[#FF2A00] text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-500 hover:border-red-300 hover:bg-red-50/50"
            }`}
          >
            {active && <Check size={11} strokeWidth={3} />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ----------------------------------------------------------------------------------
// GEWERKEVERWALTUNG (TRADES) — Standard-Katalog
// ----------------------------------------------------------------------------------
// Gewerke sind NICHT hart codiert: Der folgende Katalog dient ausschließlich als
// Erstbefüllung der Supabase-Tabelle "trades" (siehe seedDefaultTrades() im Data
// Layer weiter unten) und wird beim allerersten Laden automatisch angelegt, falls
// die Tabelle noch leer ist. Danach läuft die Verwaltung (Anlegen/Umbenennen/
// Deaktivieren/Sortieren) ausschließlich über die TradesAdminModal-UI.
const DEFAULT_TRADES = [
  "Architektur",
  "Innenarchitektur",
  "Tragwerksplanung / Statik",
  "Heizung",
  "Lüftung",
  "Sanitär",
  "Kältetechnik",
  "Elektrotechnik",
  "MSR / Gebäudeautomation",
  "Medientechnik",
  "Brandschutz",
  "Sprinklertechnik",
  "Trockenbau",
  "Metallbau",
  "Fassadenbau",
  "Dach",
  "Fenster",
  "Türen",
  "Bodenbeläge",
  "Estrich",
  "Fliesen",
  "Maler",
  "Schreiner",
  "Sicherheitstechnik",
  "Aufzugstechnik",
  "Außenanlagen",
  "Tiefbau",
  "Freianlagen",
  "Sonstiges",
];

// ----------------------------------------------------------------------------------
// BENUTZERVERWALTUNG — Rollen & Berechtigungsstruktur
// ----------------------------------------------------------------------------------
const USER_ROLES = ["Administrator", "Projektleitung", "Bauleitung", "Projektmitarbeiter"];

const USER_STATUS_OPTIONS = ["aktiv", "inaktiv"];

// Beschreibender Berechtigungsrahmen je Rolle — dient aktuell der Anzeige in der
// Benutzerverwaltung (UserFormModal) sowie der canAccessAdmin()-Prüfung unten. Eine
// feingranulare, seitenweise Rechteprüfung je Projekt (project_ids) ist über diese
// Datenstruktur vorbereitet, aber im bestehenden requireAuth()-Modell (siehe App())
// noch nicht überall serverseitig erzwungen — das bleibt bewusst ein nächster
// Ausbauschritt und ist kein Rückschritt gegenüber dem bisherigen Stand.
const ROLE_META = {
  Administrator: {
    label: "Administrator",
    description: "Voller Zugriff auf alle Projekte sowie Gewerke- und Benutzerverwaltung.",
    badgeClass: "bg-purple-50 text-purple-700 ring-purple-200",
  },
  Projektleitung: {
    label: "Projektleitung",
    description: "Voller Bearbeitungszugriff auf zugeordnete Projekte.",
    badgeClass: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  },
  Bauleitung: {
    label: "Bauleitung",
    description: "Bearbeitet Etagen und Pins in zugeordneten Projekten.",
    badgeClass: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  Projektmitarbeiter: {
    label: "Projektmitarbeiter",
    description: "Erfasst und bearbeitet Mängel-Pins in zugeordneten Projekten.",
    badgeClass: "bg-slate-100 text-slate-600 ring-slate-200",
  },
};

// Zentrale Prüfung, ob der aktuell angemeldete Nutzer Zugriff auf die Admin-Bereiche
// (Gewerke- & Benutzerverwaltung) erhält. Ist noch kein app_users-Profil für die
// angemeldete E-Mail-Adresse hinterlegt (z.B. direkt nach der Erstinstallation, bevor
// überhaupt ein Administrator angelegt wurde), bleibt es beim bisherigen Verhalten:
// jeder angemeldete Nutzer hat Zugriff — sonst könnte sich niemand mehr selbst als
// ersten Administrator eintragen. Sobald ein Profil existiert, entscheidet dessen Rolle.
function canAccessAdmin(session, currentAppUser) {
  if (!session) return false;
  if (!currentAppUser) return true;
  return currentAppUser.role === "Administrator";
}

// ----------------------------------------------------------------------------------
// DATEI-ERKENNUNG (Erweiterung + MIME-Type, da .dwg/.dxf oft keinen zuverlässigen
// MIME-Type mitliefern)
// ----------------------------------------------------------------------------------

function getFileInfo(file) {
  if (!file) return null;
  const name = file.name.toLowerCase();
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".") + 1) : "";
  // Explizite Endungsprüfung für CAD-Dateien: Browser können .dwg/.dxf nicht als Bild
  // rendern (kein gültiges Raster-/Vektorformat für <img>), daher müssen sie VOR jedem
  // <img>-Zugriff erkannt und auf einen eigenen Rendering-Pfad (CadBlueprintPlan) umgeleitet
  // werden — sowohl beim Upload (hier) als auch beim späteren Anzeigen der Etage.
  if (name.endsWith(".dwg") || name.endsWith(".dxf")) return { kind: "cad", ext };
  if (name.endsWith(".pdf") || file.type === "application/pdf") return { kind: "pdf", ext: "pdf" };
  // SVG-Grundrisse (Vektor-Rendering, siehe SvgPlanCanvas) MÜSSEN vor der
  // generischen image/*-Prüfung unten erkannt werden — .svg-Dateien liefern im
  // Browser ebenfalls file.type "image/svg+xml" und würden sonst fälschlich als
  // gewöhnliches Raster-Bild eingestuft.
  if (name.endsWith(".svg") || file.type === "image/svg+xml") return { kind: "svg", ext: "svg" };
  if (["png", "jpg", "jpeg", "webp"].includes(ext) || file.type.startsWith("image/")) return { kind: "image", ext: ext || "img" };
  return null;
}

// Die Datenbank speichert zu einer Etage nur image_url + file_type (siehe Schema),
// nicht aber den ursprünglichen Dateinamen. uploadFloorPlan() lädt Dateien deshalb
// unter dem Muster `${uuid}_${originalDateiname}` hoch — UUIDs enthalten keine
// Unterstriche, daher markiert der erste Unterstrich im letzten Pfadsegment
// zuverlässig das Ende des Prefix und wir können den Originalnamen (u.a. für die
// CAD-Blueprint-Anzeige) direkt aus der gespeicherten URL zurückgewinnen.
function deriveFileNameFromUrl(url) {
  if (!url) return "";
  try {
    const lastSegment = decodeURIComponent(url.split("/").pop() || "");
    const underscoreIdx = lastSegment.indexOf("_");
    return underscoreIdx > -1 ? lastSegment.slice(underscoreIdx + 1) : lastSegment;
  } catch {
    return "";
  }
}

function deriveFileExt(fileName) {
  if (!fileName || !fileName.includes(".")) return "";
  return fileName.slice(fileName.lastIndexOf(".") + 1).toLowerCase();
}

// Robuste Typ-Ermittlung für bereits gespeicherte Etagen: nutzt primär file_type aus
// der Datenbank, fällt andernfalls auf eine Dateinamens-Prüfung zurück — verhindert,
// dass eine .dwg/.dxf-Datei versehentlich in einem <img>-Tag landet.
function resolveFloorKind(floor) {
  if (!floor) return "image";
  if (["cad", "pdf", "image", "svg"].includes(floor.file_type)) return floor.file_type;
  const name = deriveFileNameFromUrl(floor.image_url).toLowerCase();
  if (name.endsWith(".dwg") || name.endsWith(".dxf")) return "cad";
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".svg")) return "svg";
  return "image";
}

const FLOOR_UPLOAD_ACCEPT =
  ".png,.jpg,.jpeg,.webp,.svg,.pdf,.dwg,.dxf,image/png,image/jpeg,image/webp,image/svg+xml,application/pdf";
const FLOOR_UPLOAD_HINT = "Grundriss hochladen (SVG, PNG, JPG, PDF, DWG, DXF)";

// ----------------------------------------------------------------------------------
// PLATZHALTER-COVERFOTOS FÜR PROJEKT-KACHELN OHNE EIGENES GRUNDRISSBILD
// ----------------------------------------------------------------------------------
// Feste, kuratierte Auswahl generischer Architektur-/Baustellen-Fotos (Unsplash,
// direkt über CDN-URLs verlinkt) für Projekte, die noch kein eigenes Grundriss-/
// Vorschaubild haben (siehe heroFloor in ProjectOverview). Bewusst NICHT über den
// von Unsplash 2021 angekündigten und inzwischen abgeschalteten Source-Dienst
// (source.unsplash.com) bezogen — der liefert seit der Abschaltung keine Bilder
// mehr — sondern über eine feste, kleine Liste einzelner, direkt referenzierter
// Foto-URLs. Da diese Bilder generische Fremdmotive zeigen und NICHT die tatsächliche
// Baustelle, wird die Kachel zusätzlich mit dem Hinweis "Platzhalterbild"
// gekennzeichnet (siehe ProjectOverview), damit auf der Übersicht nie der Eindruck
// entsteht, es handle sich um ein echtes Foto des jeweiligen Projekts. Ehrlicher
// Hinweis: die Erreichbarkeit einzelner externer Foto-URLs kann sich künftig ändern,
// deshalb hat ProjectCoverImage einen Fallback auf das bisherige neutrale Icon,
// falls ein Foto nicht lädt.
const PROJECT_PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1487958449943-2429e8be8625?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1541976590-713941681591?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1523217582562-09d0def993a6?q=80&w=800&auto=format&fit=crop",
];

// Einfacher, deterministischer String-Hash (djb2-Variante) — wählt für jedes Projekt
// anhand seiner stabilen ID immer denselben Platzhalter aus derselben festen Liste,
// kein Zufall bei jedem Neuladen der Übersicht.
function hashStringToIndex(str, length) {
  let hash = 5381;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 33) ^ s.charCodeAt(i);
  }
  return Math.abs(hash) % length;
}

function getProjectPlaceholderImage(project) {
  return PROJECT_PLACEHOLDER_IMAGES[hashStringToIndex(project?.id, PROJECT_PLACEHOLDER_IMAGES.length)];
}

// Ermittelt das älteste vorhandene Foto aus den Mängel-Pins eines Projekts (über
// alle Etagen/Grundrisskizzen/Pins hinweg) — dient als zweite Priorität für das
// Kachel-Titelbild in ProjectOverview, wenn kein explizites project.cover_image_url
// gesetzt ist (siehe ProjectCoverImage/ProjectFormModal). "Ältestes Foto" statt
// "beliebiges erstes" ist deterministisch und stabil: dieselbe Kachel zeigt nicht
// bei jedem Neuladen ein anderes Foto, nur weil die Server-Reihenfolge variiert.
function resolveProjectPinPhoto(project) {
  const photos = (project?.floors || [])
    .flatMap((f) => f.pins || [])
    .flatMap((p) => p.pin_photos || [])
    .filter((ph) => ph?.photo_url);
  if (photos.length === 0) return null;
  return [...photos].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))[0].photo_url;
}

// ----------------------------------------------------------------------------------
// SUPABASE DATA LAYER
// Alle Netzwerkzugriffe sind hier gebündelt: reine async Funktionen, die entweder
// Daten zurückgeben oder werfen (try/catch passiert jeweils beim Aufrufer in App()).
// Lese-Policies sind öffentlich (auch für Gäste), Schreib-Policies (insert/update/
// delete) sind serverseitig per RLS auf die Rolle "authenticated" beschränkt — siehe
// supabase_schema_v2_auth_and_projects.sql.
// ----------------------------------------------------------------------------------

// Projekte inkl. einer "leichten" Etagen-/Pin-Zusammenfassung laden. Das reicht aus,
// um in der Projektübersicht Vorschaubild, Etagenzahl und offene Pins darzustellen,
// ohne pro Karte einen eigenen Request abzusetzen. priority ist seit dem
// Dringlichkeits-Indikator/der "Nach Dringlichkeit"-Sortierung in ProjectOverview
// (siehe countUrgentPins) mit dabei. pin_photos(photo_url, created_at) ist seit dem
// automatischen Kachel-Titelbild (siehe resolveProjectPinPhoto) zusätzlich mit
// dabei — bewusst NUR die URL-Zeichenkette und den Zeitstempel je Foto, nicht die
// Bilddaten selbst (die liegen ohnehin nur in Supabase Storage, nie in der
// Datenbank), das hält den Mehrverbrauch dieser ohnehin auf jedem App-Start
// geladenen Übersichtsabfrage überschaubar. cover_image_url kommt automatisch über
// das führende "*" auf projects mit, sobald die Spalte existiert (siehe
// supabase_schema_v12_project_cover_images.sql).
async function fetchProjectsWithSummary() {
  const { data, error } = await supabase
    .from("projects")
    .select("*, floors(id, name, image_url, file_type, pins(id, status, priority, pin_photos(photo_url, created_at)))")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// selected_trades wird hier bewusst noch einmal explizit und normalisiert gesetzt
// (nicht nur über den Spread von fields durchgereicht), damit Insert und Update
// unabhängig vom Aufrufer immer ein valides, JSON-kompatibles Array in Supabase
// ablegen und nie undefined oder ein falsch typisiertes Objekt landet.
async function createProject(fields) {
  const payload = {
    ...fields,
    // Beim Anlegen kommt selected_trades immer als (ggf. leeres) Array aus dem
    // Projektformular — ?? [] fängt nur den theoretischen Fall ab, dass das Feld
    // gar nicht mitgeschickt wird.
    selected_trades: normalizeSelectedTrades(fields.selected_trades) ?? [],
  };
  const { data, error } = await supabase.from("projects").insert(payload).select().single();
  if (error) throw error;
  return data;
}

async function updateProject(projectId, fields) {
  // selected_trades wird nur normalisiert, wenn es tatsächlich Teil des Updates ist —
  // sonst würde z.B. ein reines Status-Update die bestehende Gewerke-Auswahl
  // versehentlich auf ein leeres Array zurücksetzen.
  const payload = { ...fields };
  if (Object.prototype.hasOwnProperty.call(fields, "selected_trades")) {
    payload.selected_trades = normalizeSelectedTrades(fields.selected_trades) ?? [];
  }
  const { data, error } = await supabase.from("projects").update(payload).eq("id", projectId).select().single();
  if (error) throw error;
  return data;
}

async function deleteProject(projectId) {
  // floors/pins/pin_todos/pin_photos hängen per ON DELETE CASCADE an projects bzw.
  // aneinander, werden also serverseitig automatisch mitgelöscht. Die zugehörigen
  // Storage-Dateien (Grundrisse, Fotos) bleiben dabei technisch bedingt liegen — das
  // Aufräumen dieser Dateien ist nicht Teil dieses Umbaus.
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw error;
}

// Etagen eines Projekts inkl. leichter Pin-Zusammenfassung (für die Badges in der
// Etagenübersicht) sowie der Anzahl zugehöriger Grundrisskizzen (floor_plans) laden.
// Die Pin-Zusammenfassung läuft weiterhin über pins.floor_id (geschossweite
// Aggregation über ALLE Grundrisskizzen eines Geschosses hinweg) — siehe
// supabase_schema_v7_floor_plans_sketch_level.sql für die Begründung.
async function fetchFloorsWithPinSummary(projectId) {
  const { data, error } = await supabase
    .from("floors")
    .select("*, pins(id, status), floor_plans(id)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// Grundrisskizzen eines Geschosses inkl. leichter Pin-Zusammenfassung (für die
// Badges in der Grundrissskizzen-Übersicht, Ebene 3) laden. Die Pin-Zusammenfassung
// bezieht sich hier strikt auf pins.plan_id — Pins anderer Skizzen desselben
// Geschosses tauchen an dieser Skizze nie auf.
async function fetchFloorPlansWithPinSummary(floorId) {
  const { data, error } = await supabase
    .from("floor_plans")
    .select("*, pins(id, status)")
    .eq("floor_id", floorId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// Pins einer konkreten Grundrissskizze (Ebene 4) inkl. aller zugehörigen To-dos und
// Fotos in einem einzigen Request laden (verschachtelter Supabase-Select über die
// Fremdschlüssel). Strikte Datentrennung: gefiltert wird über plan_id, nicht mehr
// über floor_id — Pins tauchen dadurch garantiert nur auf genau der Grundrissskizze
// auf, der sie zugeordnet wurden.
async function fetchPinsWithDetails(planId) {
  const { data, error } = await supabase
    .from("pins")
    .select("*, pin_todos(*), pin_photos(*), pin_activity_log(*)")
    .eq("plan_id", planId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// Sämtliche Pins EINES Geschosses über ALLE seine Grundrisskizzen hinweg laden
// (inkl. To-dos/Fotos) — bewusst über floor_id statt plan_id gefiltert, für den
// projektweiten PDF-Export (Abschnitt 5, siehe fetchAllPinsForProject unten), der
// geschossweise aggregiert und keine Skizzen-Ebene kennt.
async function fetchPinsForFloor(floorId) {
  const { data, error } = await supabase
    .from("pins")
    .select("*, pin_todos(*), pin_photos(*), pin_activity_log(*)")
    .eq("floor_id", floorId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

// Lädt eine Grundriss-Datei in den Bucket "floor-plans" hoch und liefert die
// öffentliche URL + den erkannten Dateityp zurück.
async function uploadFloorPlan(projectId, file) {
  const info = getFileInfo(file);
  if (!info) throw new Error("Nicht unterstützter Dateityp. Bitte PNG, JPG, WebP, PDF, DWG oder DXF verwenden.");

  const path = `${projectId}/${crypto.randomUUID()}_${sanitizeFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage
    .from(FLOOR_PLANS_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from(FLOOR_PLANS_BUCKET).getPublicUrl(path);
  return { publicUrl: publicUrlData.publicUrl, fileType: info.kind };
}

// Lädt ein Projekt-Titelbild (Gebäudeansicht für die Kachel in der Projektübersicht,
// siehe ProjectFormModal/ProjectCoverImage) in den eigenen Bucket "project-covers"
// hoch — bewusst ein eigener Bucket statt Wiederverwendung von "floor-plans", damit
// echte Grundrisse und reine Gebäudefotos storage-seitig getrennt bleiben. Nimmt
// ausschließlich Bildformate an (kein PDF/DWG/DXF wie bei Grundrissen), da es sich
// um ein Foto, nicht um eine technische Zeichnung handelt.
async function uploadProjectCoverImage(projectId, file) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Bitte nur ein Bildformat (PNG, JPG oder WebP) als Titelbild hochladen.");
  }
  const path = `${projectId}/${crypto.randomUUID()}_${sanitizeFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage
    .from(PROJECT_COVERS_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from(PROJECT_COVERS_BUCKET).getPublicUrl(path);
  return publicUrlData.publicUrl;
}

// Ein Geschoss ist ab sofort ein reiner Namens-Container ohne eigenen Grundriss
// (siehe supabase_schema_v7_floor_plans_sketch_level.sql) — der Grundriss/die
// Grundrisse gehören zur separaten, darunterliegenden Ebene (floor_plans).
async function createFloor(projectId, name) {
  const { data, error } = await supabase.from("floors").insert({ project_id: projectId, name }).select().single();
  if (error) throw error;
  return data;
}

async function updateFloor(floorId, name) {
  const { data, error } = await supabase.from("floors").update({ name }).eq("id", floorId).select().single();
  if (error) throw error;
  return data;
}

// Löscht eine Etage. floor_plans (und darüber pins/pin_todos/pin_photos) sowie die
// direkt an floor_id hängenden Pins hängen per ON DELETE CASCADE an floors, werden
// also serverseitig automatisch mitgelöscht. Die zugehörigen Storage-Dateien
// (Grundrisskizzen, Fotos der enthaltenen Pins) bleiben dabei technisch bedingt
// liegen — siehe deleteProject() oben.
async function deleteFloor(floor) {
  const { error } = await supabase.from("floors").delete().eq("id", floor.id);
  if (error) throw error;
}

// Grundrisskizzen (Ebene 3) — ein Geschoss kann beliebig viele davon enthalten.
// createFloorPlanSketch benötigt zwingend eine Datei (eine Skizze ohne Plan wäre
// nutzlos), updateFloorPlanSketch lässt die Datei wie zuvor bei Etagen optional.
async function createFloorPlanSketch(floorId, projectId, name, file) {
  const { publicUrl, fileType } = await uploadFloorPlan(projectId, file);
  const { data, error } = await supabase
    .from("floor_plans")
    .insert({ floor_id: floorId, name, image_url: publicUrl, file_type: fileType })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Aktualisiert Name und/oder Datei einer bestehenden Grundrisskizze. Die Datei ist
// optional: wird keine neue Datei übergeben, bleiben image_url/file_type unverändert
// und nur der Name wird aktualisiert. Die alte Datei im Storage bleibt beim
// Austausch technisch bedingt liegen (analog zu deleteProject() oben).
async function updateFloorPlanSketch(planId, projectId, name, file) {
  const fields = { name };
  if (file) {
    const { publicUrl, fileType } = await uploadFloorPlan(projectId, file);
    fields.image_url = publicUrl;
    fields.file_type = fileType;
  }
  const { data, error } = await supabase.from("floor_plans").update(fields).eq("id", planId).select().single();
  if (error) throw error;
  return data;
}

// Löscht eine Grundrisskizze. pins (und darüber pin_todos/pin_photos) hängen per ON
// DELETE CASCADE an floor_plans, werden also serverseitig automatisch mitgelöscht.
async function deleteFloorPlanSketch(plan) {
  const { error } = await supabase.from("floor_plans").delete().eq("id", plan.id);
  if (error) throw error;
}

// actor ({ email, name }) stammt aus der angemeldeten Session in App() (siehe
// currentActor) und wird ausschließlich zur automatischen Zeit-/Benutzererfassung
// verwendet (created_by/updated_by-Spalten sowie die Einträge in pin_activity_log,
// siehe logPinActivity weiter unten) — nie zur Autorisierung, die läuft weiterhin
// über RLS auf Supabase-Ebene. Ein Pin ist strikt an genau eine Grundrissskizze
// (planId) gebunden; floor_id wird zusätzlich mitgeschrieben, ausschließlich für die
// geschossweite Kennzahlen-Aggregation in der Geschossübersicht (Ebene 2).
async function createPin(planId, floorId, x, y, actor) {
  const { data, error } = await supabase
    .from("pins")
    .insert({
      plan_id: planId,
      floor_id: floorId,
      title: "Neuer Eintrag",
      description: "",
      status: "offen",
      priority: "mittel",
      assigned_to: "",
      trade_id: null,
      x,
      y,
      angle: 0,
      created_by: actor?.email || null,
      updated_by: actor?.email || null,
    })
    .select()
    .single();
  if (error) throw error;
  return { ...data, pin_todos: [], pin_photos: [], pin_activity_log: [] };
}

async function updatePin(pinId, fields, actor) {
  const payload = { ...fields, updated_by: actor?.email || null, updated_at: new Date().toISOString() };
  const { data, error } = await supabase.from("pins").update(payload).eq("id", pinId).select().single();
  if (error) throw error;
  return data;
}

// Ein Eintrag in der Bearbeitungshistorie eines Pins (Abschnitt 3: automatische
// Zeit-/Benutzererfassung). Bewusst als eigener, expliziter Aufruf statt in
// createPin/updatePin verdrahtet — die Entscheidung, WELCHE menschenlesbare
// Aktion/Detail-Nachricht zu einer Änderung gehört, liegt bei den Aufrufern in
// App() (die dort ohnehin schon den alten Zustand des Pins zum Vergleich kennen).
async function logPinActivity(pinId, action, detail, actor) {
  const { data, error } = await supabase
    .from("pin_activity_log")
    .insert({
      pin_id: pinId,
      action,
      detail: detail || "",
      actor_email: actor?.email || null,
      actor_name: actor?.name || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Löscht einen Pin inkl. aller zugehörigen Fotos im Storage (best effort) — die
// Datenbankzeilen in pin_todos/pin_photos entfernt Postgres selbst über
// ON DELETE CASCADE.
async function deletePin(pin) {
  const photos = pin?.pin_photos || [];
  if (photos.length > 0) {
    const paths = photos.map((p) => extractStoragePath(p.photo_url, PIN_PHOTOS_BUCKET)).filter(Boolean);
    if (paths.length > 0) {
      const { error: removeError } = await supabase.storage.from(PIN_PHOTOS_BUCKET).remove(paths);
      if (removeError) console.error("Fotos konnten nicht aus dem Storage entfernt werden:", removeError);
    }
  }
  const { error } = await supabase.from("pins").delete().eq("id", pin.id);
  if (error) throw error;
}

// ----------------------------------------------------------------------------------
// SKIZZEN-NOTIZEN (PLAN ANNOTATIONS) — reine Text-Marker auf dem Grundriss, ergänzend
// zu den nummerierten Mängel-Pins (siehe supabase_schema_v9_site_onboarding_and_plan_notes.sql).
// Bewusst schlanker gehalten als die Pin-Datenschicht: kein Foto-/Aufgaben-/
// Verlaufs-Anhang, keine Offline-Anlage-Warteschlange (siehe requireOnline-Guards in
// App() bei den zugehörigen Handlern) — Notizen sind ein reines Vor-Ort-
// Orientierungswerkzeug, keine dokumentationspflichtige Mängelerfassung.
// ----------------------------------------------------------------------------------
async function fetchPlanNotes(planId) {
  const { data, error } = await supabase
    .from("plan_notes")
    .select("*")
    .eq("floor_plan_id", planId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function createPlanNote(planId, x, y, actor) {
  const { data, error } = await supabase
    .from("plan_notes")
    .insert({
      floor_plan_id: planId,
      text: "Neue Notiz",
      color: "amber",
      x,
      y,
      created_by: actor?.email || null,
      updated_by: actor?.email || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updatePlanNote(noteId, fields, actor) {
  const payload = { ...fields, updated_by: actor?.email || null, updated_at: new Date().toISOString() };
  const { data, error } = await supabase.from("plan_notes").update(payload).eq("id", noteId).select().single();
  if (error) throw error;
  return data;
}

async function deletePlanNote(noteId) {
  const { error } = await supabase.from("plan_notes").delete().eq("id", noteId);
  if (error) throw error;
}

async function addPinTodo(pinId, text, actor) {
  const { data, error } = await supabase
    .from("pin_todos")
    .insert({ pin_id: pinId, text, completed: false, created_by: actor?.email || null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function togglePinTodo(todoId, completed) {
  const { data, error } = await supabase.from("pin_todos").update({ completed }).eq("id", todoId).select().single();
  if (error) throw error;
  return data;
}

async function deletePinTodo(todoId) {
  const { error } = await supabase.from("pin_todos").delete().eq("id", todoId);
  if (error) throw error;
}

// Rekonstruiert den Storage-Pfad aus einer öffentlichen Supabase-URL, um beim
// Löschen eines Fotos auch das zugehörige Storage-Objekt entfernen zu können.
function extractStoragePath(publicUrl, bucket) {
  if (!publicUrl) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
}

async function uploadPinPhoto(pinId, file, actor) {
  const path = `${pinId}/${crypto.randomUUID()}_${sanitizeFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage
    .from(PIN_PHOTOS_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from(PIN_PHOTOS_BUCKET).getPublicUrl(path);
  const { data, error } = await supabase
    .from("pin_photos")
    .insert({ pin_id: pinId, photo_url: publicUrlData.publicUrl, uploaded_by: actor?.email || null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deletePinPhoto(photo) {
  const { error } = await supabase.from("pin_photos").delete().eq("id", photo.id);
  if (error) throw error;
  const path = extractStoragePath(photo.photo_url, PIN_PHOTOS_BUCKET);
  if (path) {
    // Best effort: Ein fehlgeschlagenes Storage-Cleanup soll den DB-Zustand nicht blockieren.
    const { error: removeError } = await supabase.storage.from(PIN_PHOTOS_BUCKET).remove([path]);
    if (removeError) console.error("Foto konnte nicht aus dem Storage entfernt werden:", removeError);
  }
}

// Ersetzt die Bilddatei eines bereits gespeicherten Fotos durch eine bearbeitete
// Fassung (siehe PhotoMarkupEditor/handleSavePhotoMarkup) — lädt die neue Version
// unter einem eigenen Storage-Pfad hoch (nie ein Überschreiben desselben Pfads, um
// Caching-Altlasten zu vermeiden), aktualisiert photo_url in der DB und entfernt
// anschließend die alte Bilddatei im Storage (best effort, analog zu deletePinPhoto).
async function updatePinPhotoUrl(photo, newDataUrl, actor) {
  const file = dataUrlToFile(newDataUrl, `markup_${photo.id}.jpg`, "image/jpeg");
  const path = `${photo.pin_id}/${crypto.randomUUID()}_${sanitizeFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage
    .from(PIN_PHOTOS_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from(PIN_PHOTOS_BUCKET).getPublicUrl(path);
  const { data, error } = await supabase
    .from("pin_photos")
    .update({ photo_url: publicUrlData.publicUrl, uploaded_by: actor?.email || null })
    .eq("id", photo.id)
    .select()
    .single();
  if (error) throw error;

  const oldPath = extractStoragePath(photo.photo_url, PIN_PHOTOS_BUCKET);
  if (oldPath) {
    const { error: removeError } = await supabase.storage.from(PIN_PHOTOS_BUCKET).remove([oldPath]);
    if (removeError) console.error("Alte Bildversion konnte nicht aus dem Storage entfernt werden:", removeError);
  }
  return data;
}

// ----------------------------------------------------------------------------------
// OFFLINE-FIRST-SPEICHERUNG & SYNCHRONISATIONS-WARTESCHLANGE (Abschnitt/Punkt 15)
// ----------------------------------------------------------------------------------
// Zweck: einmal geladene Projekte/Etagen/Pins bleiben auch ohne Internetverbindung
// nutzbar (Anzeigen, Zoomen/Verschieben, neue Pins setzen, Text/Beschreibung/Gewerk
// erfassen, Status ändern, Fotos aufnehmen UND Pins wieder löschen). Alle drei
// Kern-Datensätze werden nach jedem erfolgreichen Laden UND nach jeder lokalen
// Änderung als einfaches JSON in localStorage gespiegelt (baudoc_offline_cache_v1).
// Offline getätigte Schreibaktionen landen zusätzlich als Eintrag in einer
// geordneten Warteschlange (baudoc_offline_sync_queue_v1, Eintragstypen create_pin/
// update_pin/upload_photo/update_photo/delete_pin) und werden automatisch
// abgearbeitet, sobald wieder eine Verbindung besteht (siehe flushSyncQueue in
// App()). Die eigentlichen Binärdaten (Grundriss-PDFs, Foto-Bilddateien) laufen
// NICHT über diese Warteschlange, sondern über den separaten IndexedDB-Asset-Cache
// weiter unten (siehe ASSET_CACHE_DB_NAME/useOfflineCapableAssetUrl) — dort geht es
// um das reine ANZEIGEN bereits vorhandener Dateien offline, hier um das SCHREIBEN
// neuer/geänderter Daten.
//
// Bewusste Begrenzung des Umfangs: die Aufgabenverwaltung (Pin-Teilaufgaben/Todos)
// sowie das Löschen/Bearbeiten einzelner Fotos bleiben an eine bestehende Verbindung
// gebunden (siehe requireOnline-Guards in den jeweiligen Handlern in App()) — das
// sind seltenere, weniger zeitkritische Baustellen-Aktionen, und ihr Wegfall im
// Offline-Fall hält die Synchronisationslogik überschaubar und nachvollziehbar.
//
// Bekannte, bewusst in Kauf genommene Grenzen (siehe Einordnung in der Auslieferung):
// - localStorage ist auf wenige MB pro Origin begrenzt. Offline aufgenommene Fotos
//   werden als Base64-Data-URL zwischengespeichert — das trägt eine überschaubare
//   Anzahl Fotos pro Offline-Phase, aber keine großen Serien. Für einen produktiven
//   Dauerbetrieb mit vielen/großen Fotos wäre IndexedDB die robustere Wahl.
// - Bricht die Verbindung ERNEUT mitten in der Synchronisation ab, nachdem ein
//   offline angelegter Pin bereits serverseitig existiert, aber bevor alle für
//   diesen Pin noch wartenden Folge-Einträge (Feldänderung, Foto) verarbeitet
//   wurden, merkt sich die App das Mapping lokale-ID → echte ID zusätzlich
//   persistent (baudoc_offline_idmap_v1), damit auch ein späterer, neuer
//   Synchronisationslauf (z.B. nach einem Neuladen der Seite) die richtige Zeile
//   trifft.
const OFFLINE_CACHE_KEY = "baudoc_offline_cache_v1";
const OFFLINE_SYNC_QUEUE_KEY = "baudoc_offline_sync_queue_v1";
const OFFLINE_ID_MAP_KEY = "baudoc_offline_idmap_v1";
const OFFLINE_ID_PREFIX = "offline_";

function readJsonStorage(key, fallback) {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJsonStorage(key, value) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // z.B. QuotaExceededError bei vielen/großen offline aufgenommenen Fotos — die App
    // bleibt trotzdem bedienbar, nur die Offline-Zwischenspeicherung wird lückenhaft.
    console.error(`Konnte "${key}" nicht in localStorage speichern:`, err);
  }
}

function isOnline() {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

function isOfflineId(id) {
  return typeof id === "string" && id.startsWith(OFFLINE_ID_PREFIX);
}

function generateOfflineId() {
  return `${OFFLINE_ID_PREFIX}${crypto.randomUUID()}`;
}

// ----------------------------------------------------------------------------------
// OFFLINE-ANMELDUNG — Fallback für den verpflichtenden Login-Bildschirm (siehe
// LoginScreen/App) ohne Netzverbindung
// ----------------------------------------------------------------------------------
// Auf der Baustelle ist zeitweise kein Netz vorhanden. Ein Passwort lässt sich ohne
// Verbindung nicht gegen Supabase Auth prüfen — deshalb wird bei jeder erfolgreichen
// ONLINE-Anmeldung (siehe handleSignIn in App()) ein gesalzener PBKDF2-Fingerabdruck
// des Passworts (NICHT das Passwort selbst) lokal auf diesem Gerät hinterlegt. Eine
// spätere Anmeldung ohne Netz vergleicht den Fingerabdruck des eingegebenen Passworts
// gegen diesen gespeicherten Wert. Wichtige, bewusste Grenze: das entsperrt
// ausschließlich die Ansicht der App (isAuthenticated) und die bereits offline
// zwischengespeicherten Projektdaten — echte Schreibaktionen (Pin anlegen/verschieben,
// Notiz, Foto, …) bleiben unverändert an eine echte Supabase-Session gebunden (siehe
// requireAuth() in App()), weil Row-Level-Security serverseitig zwingend ein echtes
// Auth-Token voraussetzt. Ohne mindestens eine erfolgreiche Online-Anmeldung auf
// diesem Gerät ist eine Offline-Anmeldung bewusst NICHT möglich — ein Passwort
// vollständig ohne jede vorherige Online-Prüfung "offline zu erfinden" wäre keine
// echte Authentifizierung mehr, sondern eine Sicherheitslücke.
const OFFLINE_AUTH_CACHE_KEY = "baudoc_offline_auth_v1";
const OFFLINE_AUTH_PBKDF2_ITERATIONS = 120000;

function bytesToBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveOfflineCredentialFingerprint(password, saltBytes) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes, iterations: OFFLINE_AUTH_PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return bytesToBase64(new Uint8Array(bits));
}

// Wird nach jeder erfolgreichen ONLINEN Anmeldung aufgerufen (handleSignIn). Bewusst
// ohne Rückgabewert/geworfenen Fehler nach außen — ein Cache-Schreibfehler (z.B. sehr
// alter Browser ohne Web Crypto, voller localStorage) darf die bereits erfolgreiche
// Anmeldung nicht nachträglich als Fehler erscheinen lassen, er verkleinert lediglich
// stillschweigend die Offline-Fallback-Abdeckung.
async function cacheOfflineCredential(email, password) {
  if (typeof crypto === "undefined" || !crypto.subtle) return;
  try {
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const fingerprint = await deriveOfflineCredentialFingerprint(password, saltBytes);
    writeJsonStorage(OFFLINE_AUTH_CACHE_KEY, {
      email: email.trim().toLowerCase(),
      salt: bytesToBase64(saltBytes),
      fingerprint,
      cachedAt: Date.now(),
    });
  } catch (err) {
    console.error("Offline-Zugangsdaten konnten nicht zwischengespeichert werden:", err);
  }
}

async function verifyOfflineCredential(email, password) {
  if (typeof crypto === "undefined" || !crypto.subtle) return false;
  const cached = readJsonStorage(OFFLINE_AUTH_CACHE_KEY, null);
  if (!cached || cached.email !== email.trim().toLowerCase()) return false;
  try {
    const saltBytes = base64ToBytes(cached.salt);
    const fingerprint = await deriveOfflineCredentialFingerprint(password, saltBytes);
    return fingerprint === cached.fingerprint;
  } catch (err) {
    console.error("Offline-Anmeldung konnte nicht geprüft werden:", err);
    return false;
  }
}

// "Angemeldet bleiben" auf diesem Gerät — für den Offline-Anmeldepfad. Der Online-
// Pfad braucht dafür KEINE eigene Logik: Supabase persistiert eine echte Session
// bereits von sich aus in localStorage und stellt sie beim App-Start automatisch
// wieder her (siehe supabase.auth.getSession() in App()) — das funktioniert schon
// heute, auch nach vollständigem Schließen des Browsers/der App. Diese Lücke
// betrifft ausschließlich den Fall, dass sich jemand zuletzt OFFLINE angemeldet
// hat: bislang musste dafür bei jedem Kaltstart erneut das Passwort eingegeben
// werden, obwohl der PBKDF2-Fingerabdruck (siehe verifyOfflineCredential) bereits
// vorlag.
//
// Bewusst NICHT als reines "isLoggedIn: true"-Flag umgesetzt: ein simples,
// ungebundenes Flag ließe sich mit jedem Zugriff auf die Browser-Konsole
// (localStorage.setItem(...)) fälschen und würde die gerade erst eingeführte
// verpflichtende Login-Sperre (siehe LoginScreen) faktisch aushebeln — auch für ein
// Gerät, das nie zuvor echte Zugangsdaten gesehen hat. Stattdessen merkt sich diese
// Funktion nur, WESSEN Anmeldung erinnert werden darf (E-Mail-Adresse) und für wie
// lange; die eigentliche Berechtigung bleibt an den bereits vorhandenen,
// gehashten Fingerabdruck aus cacheOfflineCredential gebunden (siehe
// restoreRememberedOfflineSession in App()) — ein Gerät, das nie erfolgreich
// online angemeldet war, hat gar keinen Fingerabdruck und kommt dadurch so oder so
// nicht hinein.
const OFFLINE_REMEMBER_STORAGE_KEY = "baudoc_offline_remember_v1";
const OFFLINE_REMEMBER_DAYS = 30;

function rememberOfflineSession(email) {
  writeJsonStorage(OFFLINE_REMEMBER_STORAGE_KEY, {
    email: email.trim().toLowerCase(),
    expiresAt: Date.now() + OFFLINE_REMEMBER_DAYS * 24 * 60 * 60 * 1000,
  });
}

function forgetOfflineSession() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(OFFLINE_REMEMBER_STORAGE_KEY);
  } catch (err) {
    console.error(`Konnte "${OFFLINE_REMEMBER_STORAGE_KEY}" nicht aus localStorage entfernen:`, err);
  }
}

// Liefert die E-Mail-Adresse einer noch gültigen, erinnerten Offline-Anmeldung
// zurück — aber NUR, wenn zusätzlich weiterhin ein passender Zugangsdaten-
// Fingerabdruck derselben Adresse in OFFLINE_AUTH_CACHE_KEY vorliegt (siehe
// Erläuterung oben). Beide Bedingungen müssen erfüllt sein, sonst null.
function getRememberedOfflineEmail() {
  const remembered = readJsonStorage(OFFLINE_REMEMBER_STORAGE_KEY, null);
  if (!remembered?.email || !remembered?.expiresAt) return null;
  if (Date.now() > remembered.expiresAt) return null;
  const cached = readJsonStorage(OFFLINE_AUTH_CACHE_KEY, null);
  if (!cached || cached.email !== remembered.email) return null;
  return remembered.email;
}

// Unterscheidet eine echte Verbindungsstörung (→ Offline-Fallback erlaubt) von einer
// aktiven, autoritativen Ablehnung durch Supabase selbst (z.B. falsches Passwort bei
// bestehender Verbindung → Offline-Fallback NICHT erlauben, sonst könnte ein veralteter
// lokaler Fingerabdruck eine inzwischen serverseitig widerrufene Anmeldung übertünchen).
// Heuristik, kein exakter Vertragstest: Netzwerkfehler äußern sich browser- und
// laufzeitübergreifend uneinheitlich (u.a. als TypeError, als Supabase-eigener
// AuthRetryableFetchError, oder — über withTimeout — als eigene Zeitlimit-Meldung).
function isNetworkFailure(err) {
  if (!err) return false;
  if (err.name === "AuthRetryableFetchError") return true;
  if (err instanceof TypeError) return true;
  const msg = String(err?.message || "");
  if (msg.includes("Zeitlimit")) return true;
  if (/failed to fetch|network|internet|Verbindung/i.test(msg)) return true;
  return false;
}

// ---- Lese-Cache (Abschnitt 15.1) --------------------------------------------------

function cacheProjectsOffline(projects) {
  const cache = readJsonStorage(OFFLINE_CACHE_KEY, {});
  writeJsonStorage(OFFLINE_CACHE_KEY, { ...cache, projects });
}
function readCachedProjects() {
  return readJsonStorage(OFFLINE_CACHE_KEY, {}).projects || null;
}
function cacheFloorsOffline(projectId, floors) {
  const cache = readJsonStorage(OFFLINE_CACHE_KEY, {});
  writeJsonStorage(OFFLINE_CACHE_KEY, { ...cache, floorsByProject: { ...(cache.floorsByProject || {}), [projectId]: floors } });
}
function readCachedFloors(projectId) {
  return readJsonStorage(OFFLINE_CACHE_KEY, {}).floorsByProject?.[projectId] || null;
}
function cacheFloorPlansOffline(floorId, plans) {
  const cache = readJsonStorage(OFFLINE_CACHE_KEY, {});
  writeJsonStorage(OFFLINE_CACHE_KEY, { ...cache, plansByFloor: { ...(cache.plansByFloor || {}), [floorId]: plans } });
}
function readCachedFloorPlans(floorId) {
  return readJsonStorage(OFFLINE_CACHE_KEY, {}).plansByFloor?.[floorId] || null;
}
function cachePinsOffline(planId, pins) {
  const cache = readJsonStorage(OFFLINE_CACHE_KEY, {});
  writeJsonStorage(OFFLINE_CACHE_KEY, { ...cache, pinsByPlan: { ...(cache.pinsByPlan || {}), [planId]: pins } });
}
function readCachedPins(planId) {
  return readJsonStorage(OFFLINE_CACHE_KEY, {}).pinsByPlan?.[planId] || null;
}
// Notizen bekommen denselben reinen Lese-Cache wie Pins (siehe cachePinsOffline) —
// Anlegen/Ändern/Löschen bleibt aber, anders als bei Pins, an eine bestehende
// Verbindung gebunden (siehe requireOnline-Guards in App()), es gibt also bewusst
// keine analoge Synchronisations-Warteschlange für Notizen.
function cachePlanNotesOffline(planId, notes) {
  const cache = readJsonStorage(OFFLINE_CACHE_KEY, {});
  writeJsonStorage(OFFLINE_CACHE_KEY, { ...cache, notesByPlan: { ...(cache.notesByPlan || {}), [planId]: notes } });
}
function readCachedPlanNotes(planId) {
  return readJsonStorage(OFFLINE_CACHE_KEY, {}).notesByPlan?.[planId] || null;
}

// ---- Synchronisations-Warteschlange (Abschnitt 15.2/15.3) ------------------------

function readSyncQueue() {
  return readJsonStorage(OFFLINE_SYNC_QUEUE_KEY, []);
}
function writeSyncQueue(queue) {
  writeJsonStorage(OFFLINE_SYNC_QUEUE_KEY, queue);
}
// Reiht eine offline getätigte Änderung ein — die Reihenfolge im Array entspricht
// der Reihenfolge der Aktionen und bleibt beim Abarbeiten (flushSyncQueue in App())
// erhalten, damit z.B. eine Statusänderung nicht vor der zugehörigen Pin-Anlage
// verarbeitet wird.
function enqueueSyncItem(item) {
  const queue = readSyncQueue();
  queue.push({ id: crypto.randomUUID(), queuedAt: new Date().toISOString(), ...item });
  writeSyncQueue(queue);
  return queue;
}

function readOfflineIdMap() {
  return readJsonStorage(OFFLINE_ID_MAP_KEY, {});
}
function rememberSyncedPinId(localId, realId) {
  const map = readOfflineIdMap();
  map[localId] = realId;
  writeJsonStorage(OFFLINE_ID_MAP_KEY, map);
}
// Löst eine (ggf. bereits synchronisierte) lokale Offline-ID über das persistente
// Mapping in die echte Server-ID auf — liefert die ID unverändert zurück, wenn sie
// entweder gar keine Offline-ID ist oder noch nicht synchronisiert wurde.
function resolveOfflineId(id) {
  return readOfflineIdMap()[id] || id;
}

// ---- Foto-Konvertierung für die Offline-Warteschlange -----------------------------
// Offline aufgenommene/ausgewählte Fotos werden als data:-URL (Base64) an einen Pin
// gehängt und in derselben Form in die Warteschlange gelegt. Beim Synchronisieren
// (flushSyncQueue) wird die data:-URL wieder in eine echte Datei zurückverwandelt,
// damit derselbe uploadPinPhoto()-Pfad wie beim Online-Upload verwendet werden kann.

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function dataUrlToFile(dataUrl, fileName, mimeType) {
  const [header, base64] = dataUrl.split(",");
  const mime = mimeType || header.match(/:(.*?);/)?.[1] || "application/octet-stream";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], fileName, { type: mime });
}

// ----------------------------------------------------------------------------------
// OFFLINE-ASSET-CACHE (IndexedDB) — Grundriss-Baupläne (PDF/SVG) & Pin-Fotos
// ----------------------------------------------------------------------------------
// Der obige Lese-Cache (OFFLINE_CACHE_KEY, localStorage) deckt ausschließlich die
// JSON-Metadaten von Projekten/Etagen/Pins ab — die eigentlichen BINÄRDATEN
// (Grundriss-PDFs, Foto-Bilddateien) hängen bislang an Supabase-Storage-URLs, die
// ohne Netzverbindung schlicht nicht laden. IndexedDB ist dafür die richtige Wahl:
// deutlich höheres Speicherlimit als localStorage (typischerweise ein nennenswerter
// Anteil des freien Datenträgerplatzes statt weniger MB) und nativer Blob-Support
// ohne Umweg über Base64-Zeichenketten.
//
// Funktionsweise: jede Ressourcen-URL (ein Grundriss oder ein Foto) wird bei jedem
// erfolgreichen ONLINEN Anzeigen im Hintergrund zusätzlich als Blob unter genau
// dieser URL als Schlüssel abgelegt (siehe cacheAssetForOfflineUseInBackground/
// useOfflineCapableAssetUrl unten) — "best effort", ein Fehlschlag (z.B. Speicher-
// platz voll, IndexedDB im privaten Modus mancher Browser gesperrt) darf die
// eigentliche Anzeige nie blockieren oder abbrechen. Beim OFFLINEN Öffnen wird
// zuerst dieser Cache geprüft; liegt der Plan/das Foto dort bereits vor, wird er
// direkt von dort geladen statt über Supabase. Ehrlicher Hinweis, weil unvermeidbar:
// ein Plan/Foto, das auf diesem Gerät noch nie ONLINE geöffnet wurde, kann naturgemäß
// nicht offline verfügbar sein — das ist keine Lücke dieser Implementierung, sondern
// die Grenze jedes Offline-Caches. Ein offline aufgenommenes/noch unsynchronisiertes
// Foto (data:-URL, siehe fileToDataUrl) ist bereits vollständig lokal und läuft
// bewusst NICHT durch diesen Cache.
const ASSET_CACHE_DB_NAME = "baudoc_asset_cache_v1";
const ASSET_CACHE_STORE = "assets";
const ASSET_CACHE_DB_VERSION = 1;

let assetCacheDbPromise = null;
function openAssetCacheDb() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB ist in dieser Umgebung nicht verfügbar."));
  }
  if (assetCacheDbPromise) return assetCacheDbPromise;
  assetCacheDbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(ASSET_CACHE_DB_NAME, ASSET_CACHE_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ASSET_CACHE_STORE)) {
        db.createObjectStore(ASSET_CACHE_STORE, { keyPath: "url" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      assetCacheDbPromise = null;
      reject(request.error || new Error("IndexedDB konnte nicht geöffnet werden."));
    };
  });
  return assetCacheDbPromise;
}

async function cacheAssetBlob(url, blob) {
  try {
    const db = await openAssetCacheDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(ASSET_CACHE_STORE, "readwrite");
      tx.objectStore(ASSET_CACHE_STORE).put({ url, blob, cachedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    // Best effort — siehe Erläuterung oben (Speicherplatz voll, IndexedDB gesperrt, …).
    console.error(`Offline-Zwischenspeicherung fehlgeschlagen für "${url}":`, err);
  }
}

async function getCachedAssetBlob(url) {
  try {
    const db = await openAssetCacheDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(ASSET_CACHE_STORE, "readonly");
      const req = tx.objectStore(ASSET_CACHE_STORE).get(url);
      req.onsuccess = () => resolve(req.result?.blob || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

// Lädt eine Ressource, die der Browser bereits selbst über <img>/pdf.js anzeigt (und
// damit schon einmal über das Netz geholt hat), ein ZWEITES Mal im Hintergrund nach,
// rein um sie als Blob im Offline-Cache abzulegen — ehrlicher Kompromiss: das kostet
// beim erstmaligen Online-Betrachten eines Plans/Fotos zusätzliches Datenvolumen,
// ist dafür aber die einfachste robuste Lösung, ohne die eigentliche Anzeige (bei
// PDFs inkl. der Lazy-Loading-Range-Requests aus der letzten Anforderung) anzufassen
// oder zu verlangsamen — der Zwischenspeicher-Download läuft komplett unabhängig
// nebenher. inflightAssetCaches verhindert doppelte Parallel-Anfragen für dieselbe
// URL (z.B. Foto gleichzeitig in Galerie UND Lightbox sichtbar).
const inflightAssetCaches = new Set();
function cacheAssetForOfflineUseInBackground(url) {
  if (!url || url.startsWith("data:") || url.startsWith("blob:") || inflightAssetCaches.has(url)) return;
  inflightAssetCaches.add(url);
  fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.blob();
    })
    .then((blob) => cacheAssetBlob(url, blob))
    .catch((err) => console.warn(`Hintergrund-Zwischenspeicherung fehlgeschlagen für "${url}":`, err))
    .finally(() => inflightAssetCaches.delete(url));
}

// Holt den Textinhalt einer Ressource (native .svg-Grundrisse, siehe SvgPlanCanvas)
// — online per direktem fetch() (der dabei ohnehin bereits vorliegende Blob wird
// gleich mit im Cache abgelegt, KEIN zweiter Download nötig), offline zuerst aus dem
// Cache, nur wenn dort nichts vorliegt als letzter, dann typischerweise
// fehlschlagender Versuch wie bisher — kein Verhaltensunterschied gegenüber vorher
// für einen noch nie online geöffneten Plan.
async function fetchAssetTextWithOfflineCache(url) {
  if (isOnline()) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    cacheAssetBlob(url, blob); // best effort, nicht blockierend abgewartet
    return await blob.text();
  }
  const cachedBlob = await getCachedAssetBlob(url);
  if (cachedBlob) return await cachedBlob.text();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

// React-Hook: liefert die tatsächlich zu verwendende Quelle für eine Supabase-
// Storage-URL (Grundriss-PDF oder Pin-Foto). Online unverändert die Original-URL
// (der Browser lädt dort direkt und am schnellsten, inkl. eigenem HTTP-Cache) plus
// ein angestoßener Hintergrund-Download in den Offline-Asset-Cache; offline
// stattdessen, sofern bereits einmal zwischengespeichert, eine lokale object:-URL
// aus genau diesem Cache. data:-URLs (offline aufgenommene, noch nicht
// synchronisierte Fotos) werden unverändert durchgereicht. Reagiert außerdem
// selbstständig auf einen Verbindungswechsel (eigene online/offline-Listener), ohne
// dass online/offline als Prop durch PlanSvgStage/PdfPlanCanvas durchgereicht werden
// müsste.
function useOfflineCapableAssetUrl(url) {
  const [online, setOnline] = useState(() => isOnline());
  const [resolvedUrl, setResolvedUrl] = useState(() => (url && !url.startsWith("data:") && !isOnline() ? null : url));
  const objectUrlRef = useRef(null);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (!url || url.startsWith("data:") || url.startsWith("blob:")) {
      setResolvedUrl(url);
      return undefined;
    }
    if (online) {
      setResolvedUrl(url);
      cacheAssetForOfflineUseInBackground(url);
      return undefined;
    }
    setResolvedUrl(null); // während der Cache-Abfrage nichts (Falsches) anzeigen
    getCachedAssetBlob(url).then((blob) => {
      if (cancelled) return;
      if (blob) {
        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;
        setResolvedUrl(objectUrl);
      } else {
        // Nie online zwischengespeichert — ehrlicher, unveränderter Fallback auf die
        // Original-URL (schlägt offline weiterhin fehl, wie schon vor diesem Cache).
        setResolvedUrl(url);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [url, online]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  return resolvedUrl;
}

// ----------------------------------------------------------------------------------
// DROPBOX-ARCHIVIERUNG — Foto-Sync in ein tagesbezogenes Ordnerschema
// ----------------------------------------------------------------------------------
// Fotos werden weiterhin primär in Supabase Storage abgelegt (siehe uploadPinPhoto
// oben) — das ist die für die App maßgebliche Quelle, an der auch Gewerk-/Etagen-/
// Pin-Zuordnung ausschließlich in Supabase hängt. Dropbox dient hier ausschließlich
// als zusätzliches, "flaches" Archiv derselben Bilddateien nach einem festen
// Tagesordner-Schema, ohne eigene fachliche Struktur.
//
// Die Verbindung läuft über den OAuth-2.0-"Authorization Code Flow mit PKCE" —
// bewusst gewählt, weil dafür KEIN Client-Secret nötig ist (ein Secret ließe sich in
// einer reinen Client-Anwendung ohne eigenes Backend nicht sicher verwahren). Der
// Access-/Refresh-Token wird ausschließlich lokal im Browser (localStorage)
// gespeichert — die Verbindung ist damit bewusst pro Gerät/Browser, nicht geräte-
// übergreifend synchronisiert. Eine geräteübergreifende Verbindung würde einen
// eigenen Backend-Baustein erfordern, der die Tokens sicher (nicht in einer per RLS
// für alle authentifizierten Nutzer lesbaren Tabelle) verwahrt — das ist bewusst
// nicht Teil dieses Umbaus.
//
// WICHTIG: DROPBOX_APP_KEY muss mit einer eigenen, im Dropbox App Console
// (https://www.dropbox.com/developers/apps) registrierten App befüllt werden, und
// die dortige "Redirect URI" muss exakt mit dropboxRedirectUri() übereinstimmen
// (Origin + Pfad der ausgelieferten App, ohne Query-String). Ohne eigenen App Key
// bleibt die Funktion inaktiv (startDropboxConnect() wirft dann bewusst einen
// Fehler, statt eine ungültige Anfrage an Dropbox zu schicken).
const DROPBOX_APP_KEY = ""; // <- eigenen App Key aus dem Dropbox App Console eintragen
const DROPBOX_AUTH_STORAGE_KEY = "baudoc_dropbox_auth";
const DROPBOX_PKCE_SESSION_KEY = "baudoc_dropbox_pkce";

function dropboxRedirectUri() {
  return `${window.location.origin}${window.location.pathname}`;
}

function readDropboxAuth() {
  try {
    const raw = localStorage.getItem(DROPBOX_AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeDropboxAuth(auth) {
  if (!auth) {
    localStorage.removeItem(DROPBOX_AUTH_STORAGE_KEY);
    return;
  }
  localStorage.setItem(DROPBOX_AUTH_STORAGE_KEY, JSON.stringify(auth));
}

function isDropboxConnected() {
  return !!readDropboxAuth()?.refresh_token;
}

function disconnectDropbox() {
  writeDropboxAuth(null);
}

function base64UrlEncode(buffer) {
  let str = "";
  for (const b of new Uint8Array(buffer)) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generateDropboxCodeVerifier() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes.buffer);
}

async function generateDropboxCodeChallenge(verifier) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64UrlEncode(digest);
}

// Startet die Dropbox-Verbindung: leitet den Browser zur Dropbox-Autorisierungsseite
// weiter. Der Rückweg (mit ?code=...) wird beim nächsten Laden der App von
// completeDropboxConnectFromUrl() abgeschlossen.
async function startDropboxConnect() {
  if (!DROPBOX_APP_KEY) {
    throw new Error(
      "Keine Dropbox-App verknüpft: DROPBOX_APP_KEY in App.jsx ist leer. Bitte zuerst eine eigene App im Dropbox App Console anlegen und den App Key eintragen."
    );
  }
  const verifier = generateDropboxCodeVerifier();
  const challenge = await generateDropboxCodeChallenge(verifier);
  const state = generateDropboxCodeVerifier();
  sessionStorage.setItem(DROPBOX_PKCE_SESSION_KEY, JSON.stringify({ verifier, state }));

  const url = new URL("https://www.dropbox.com/oauth2/authorize");
  url.searchParams.set("client_id", DROPBOX_APP_KEY);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("redirect_uri", dropboxRedirectUri());
  url.searchParams.set("token_access_type", "offline"); // liefert zusätzlich einen refresh_token
  url.searchParams.set("state", state);
  window.location.href = url.toString();
}

// Einmalig beim Start der App aufgerufen (siehe useEffect in App()): prüft, ob die
// aktuelle URL von einer Dropbox-Weiterleitung stammt, tauscht den Code gegen
// Access-/Refresh-Token und räumt die URL danach wieder auf (verhindert, dass ein
// Neuladen der Seite denselben, bereits verbrauchten Code erneut einzulösen versucht).
async function completeDropboxConnectFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if (!code) return false;

  const pkceRaw = sessionStorage.getItem(DROPBOX_PKCE_SESSION_KEY);
  sessionStorage.removeItem(DROPBOX_PKCE_SESSION_KEY);
  if (!pkceRaw) return false;
  const { verifier, state } = JSON.parse(pkceRaw);
  if (params.get("state") !== state) {
    throw new Error("Dropbox-Verbindung abgebrochen: der state-Parameter stimmt nicht überein.");
  }

  const res = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      client_id: DROPBOX_APP_KEY,
      redirect_uri: dropboxRedirectUri(),
      code_verifier: verifier,
    }),
  });
  if (!res.ok) throw new Error(`Dropbox-Token-Austausch fehlgeschlagen (HTTP ${res.status}).`);
  const json = await res.json();
  writeDropboxAuth({
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    expires_at: Date.now() + (json.expires_in || 14400) * 1000,
  });

  window.history.replaceState({}, document.title, `${window.location.origin}${window.location.pathname}${window.location.hash}`);
  return true;
}

// Liefert einen gültigen Access Token, erneuert ihn bei Bedarf über den Refresh
// Token (Dropbox-Access-Tokens sind nur einige Stunden gültig, der Refresh Token
// dagegen dauerhaft, bis der Nutzer die Verbindung widerruft).
async function getDropboxAccessToken() {
  const auth = readDropboxAuth();
  if (!auth?.refresh_token) throw new Error("Keine Dropbox-Verbindung aktiv.");
  if (auth.access_token && auth.expires_at && Date.now() < auth.expires_at - 60_000) {
    return auth.access_token;
  }
  const res = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: auth.refresh_token, client_id: DROPBOX_APP_KEY }),
  });
  if (!res.ok) throw new Error(`Dropbox-Token konnte nicht erneuert werden (HTTP ${res.status}).`);
  const json = await res.json();
  const updated = { ...auth, access_token: json.access_token, expires_at: Date.now() + (json.expires_in || 14400) * 1000 };
  writeDropboxAuth(updated);
  return updated.access_token;
}

// Verbindliches Tagesordner-Schema (Abschnitt 4): JJMMTT_Bauüberwachung_Kürzel, z.B.
// "260812_Bauüberwachung_MM" für den 12.08.2026 mit Benutzer-Kürzel "MM". Jahr,
// Monat und Tag jeweils zweistellig, kein zusätzliches Präfix/Suffix.
function buildDropboxFolderName(date, kuerzel) {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}_Bauüberwachung_${kuerzel}`;
}

// Lädt ein Foto zusätzlich zu Supabase Storage unverändert in den heutigen
// Tagesordner des angemeldeten Nutzers auf Dropbox hoch — flach, ohne weitere
// Unterordner. Dropbox legt fehlende Ordner beim Hochladen automatisch an, ein
// separater "Ordner anlegen"-Aufruf ist daher nicht nötig.
async function syncPhotoToDropbox(file, kuerzel, date = new Date()) {
  const accessToken = await getDropboxAccessToken();
  const path = `/${buildDropboxFolderName(date, kuerzel)}/${sanitizeFileName(file.name)}`;
  const res = await fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/octet-stream",
      "Dropbox-API-Arg": JSON.stringify({ path, mode: "add", autorename: true, mute: true }),
    },
    body: file,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Dropbox-Upload fehlgeschlagen (HTTP ${res.status}). ${text}`.trim());
  }
  return res.json();
}

// ----------------------------------------------------------------------------------
// PDF-EXPORT — konfigurierbarer, strukturierter Baudokumentations-Bericht
// ----------------------------------------------------------------------------------
// Analog zu pdf.js (siehe loadPdfJs) wird auch jsPDF bewusst per <script>-Tag von
// einer CDN nachgeladen statt per npm-Import — aus demselben Grund: kein
// bundlerspezifisches Paket-Setup nötig, funktioniert unabhängig von der
// Vite-Konfiguration des Projekts.
const JSPDF_CDN_URL = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
let jsPdfLoadPromise = null;
function loadJsPdf() {
  if (typeof window === "undefined") return Promise.reject(new Error("jsPDF benötigt eine Browser-Umgebung."));
  if (window.jspdf?.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  if (jsPdfLoadPromise) return jsPdfLoadPromise;
  jsPdfLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = JSPDF_CDN_URL;
    script.async = true;
    script.onload = () => {
      if (!window.jspdf?.jsPDF) {
        jsPdfLoadPromise = null;
        reject(new Error("jsPDF-Script wurde geladen, aber window.jspdf.jsPDF ist nicht verfügbar."));
        return;
      }
      resolve(window.jspdf.jsPDF);
    };
    script.onerror = () => {
      jsPdfLoadPromise = null;
      reject(new Error("jsPDF konnte nicht von der CDN geladen werden."));
    };
    document.head.appendChild(script);
  });
  return jsPdfLoadPromise;
}

// Lädt ein Raster-Bild (Foto oder Bild-Grundriss) als data:-URL inkl. Pixelmaßen —
// die Maße werden gebraucht, um das Bild im PDF verzerrungsfrei zu platzieren.
function loadImageAsDataUrl(url) {
  return fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.blob();
    })
    .then(
      (blob) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        })
    )
    .then(
      (dataUrl) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve({ dataUrl, width: img.naturalWidth, height: img.naturalHeight });
          img.onerror = () => reject(new Error("Bild konnte nicht dekodiert werden."));
          img.src = dataUrl;
        })
    );
}

// Rendert Seite 1 eines PDF-Grundrisses für den PDF-Export bewusst weiterhin als
// Raster-Bitmap in ein Offscreen-Canvas (jsPDF/doc.addImage() benötigt zwingend ein
// Bitmap, kein SVG) und liefert dasselbe Format wie loadImageAsDataUrl — wiederverwendet
// dieselbe robuste, mehrstufige pdf.js-Ladefunktion (loadPdfJs/loadPdfDocument, mit
// CDN- und Worker-Fallback) wie die interaktive PdfPlanCanvas, die die Seite seit der
// Umstellung auf natives SVG-Vektor-Rendering nicht mehr rastert. scale=3.75 (statt
// zuvor 2.5) liefert für den Export mehr Quell-Detail, bevor compressImageDataUrl das
// Ergebnis ohnehin auf PDF_PLAN_MAX_WIDTH/-HEIGHT herunterskaliert (siehe dort) — bei
// kleineren/detailärmeren Plänen macht sich das als sichtbarer Schärfegewinn im
// exportierten PDF-Bericht bemerkbar, bei bereits sehr großformatigen Plänen (die
// schon bei 2.5 über diese Obergrenze hinausgehen) ändert sich am Endergebnis nichts,
// da der Kompressionsschritt ohnehin deckelt.
async function renderPdfPlanToDataUrl(url, scale = 3.75) {
  const pdfjsLib = await loadPdfJs();
  const pdf = await loadPdfDocument(pdfjsLib, url);
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
  return { dataUrl: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height };
}

// ---- PDF-Dateigrößen-Optimierung (Downscaling & Komprimierung) --------------------
// Kamerafotos von Baustellen-Smartphones (oft 8–48 Megapixel) und hochauflösend
// gescannte/gerenderte Grundrisse werden von loadImageAsDataUrl/renderPdfPlanToDataUrl
// unverändert in voller Originalauflösung geladen — direkt per doc.addImage() in ein
// PDF eingebettet, lässt das allein schon einen Bericht mit mehreren Dutzend Fotos auf
// weit über 100 MB anwachsen und ist für den mobilen E-Mail-Versand unbrauchbar. Jedes
// Bild wird daher VOR dem Einbetten zusätzlich über ein Offscreen-Canvas auf eine für
// den tatsächlichen Darstellungszweck ausreichende Auflösung herunterskaliert und als
// komprimiertes JPEG re-encodiert. Zielgröße laut Vorgabe: ca. 5–15 MB je Bericht.
const PDF_PHOTO_MAX_WIDTH = 800;
const PDF_PHOTO_MAX_HEIGHT = 600;
const PDF_PHOTO_JPEG_QUALITY = 0.65;
const PDF_PLAN_MAX_WIDTH = 1800;
const PDF_PLAN_MAX_HEIGHT = 1800;
const PDF_PLAN_JPEG_QUALITY = 0.72;

// Skaliert & komprimiert ein bereits geladenes Bild (Data-URL, siehe
// loadImageAsDataUrl/renderPdfPlanToDataUrl) über ein Offscreen-Canvas auf maximal
// maxWidth×maxHeight (Seitenverhältnis bleibt erhalten, es wird nie vergrößert) und
// re-encodiert es verlustbehaftet als JPEG mit der angegebenen Qualität (0–1). Gibt
// dasselbe { dataUrl, width, height }-Format zurück wie die beiden Lade-Funktionen —
// 1:1 austauschbar an jeder addImage()-Aufrufstelle. Für die Vorschaubild-Darstellung
// im Druck UND am Bildschirm ist diese Auflösung völlig ausreichend; die Original-
// Fotos in voller Qualität bleiben unangetastet in Supabase Storage gespeichert und
// über die "Foto-Links"-Spalte des Excel-Exports weiterhin vollständig erreichbar.
function compressImageDataUrl(sourceDataUrl, maxWidth, maxHeight, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, maxWidth / img.naturalWidth, maxHeight / img.naturalHeight);
      const width = Math.max(1, Math.round(img.naturalWidth * ratio));
      const height = Math.max(1, Math.round(img.naturalHeight * ratio));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      // JPEG kennt keine Transparenz — ohne einen weißen Untergrund würden ursprünglich
      // transparente Bereiche (z. B. bei PNG-Grundrissen) sonst schwarz dargestellt.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      resolve({ dataUrl: canvas.toDataURL("image/jpeg", quality), width, height });
    };
    img.onerror = () => reject(new Error("Bild konnte für die PDF-Komprimierung nicht dekodiert werden."));
    img.src = sourceDataUrl;
  });
}

// Schneidet aus einem bereits geladenen Grundriss-Bild (Data-URL) einen quadratischen
// Ausschnitt zentriert auf eine relative Position (centerXRatio/centerYRatio, je 0–1,
// entspricht pin.x/pin.y aus 0–100 umgerechnet) aus und liefert ihn — analog zu
// compressImageDataUrl — direkt als komprimiertes JPEG zurück. Für den
// Einzel-Pin-PDF-Export (siehe generateSinglePinPdf): zeigt einem Nachunternehmer auf
// einen Blick, WO genau am Grundriss sich der Mangel befindet, ohne den kompletten
// (oft sehr viel größeren) Gesamtplan mitschicken zu müssen. cropRatio bestimmt die
// "Zoomstufe" als Anteil der kürzeren Bildseite. Der Ausschnitt wird an den
// Bildrändern automatisch geklemmt (kein Überstand über den Plan hinaus) — der Pin
// landet dadurch nicht zwingend exakt in der Mitte des Ausschnitts; die
// zurückgegebenen pinRatioX/pinRatioY geben seine TATSÄCHLICHE relative Position
// innerhalb des Ausschnitts an, für die exakte Platzierung des Pin-Markers darauf.
function cropImageDataUrl(sourceDataUrl, centerXRatio, centerYRatio, cropRatio, maxOutput = 900, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const srcW = img.naturalWidth;
      const srcH = img.naturalHeight;
      const cropSize = Math.max(40, Math.round(Math.min(srcW, srcH) * cropRatio));
      let sx = Math.round(centerXRatio * srcW - cropSize / 2);
      let sy = Math.round(centerYRatio * srcH - cropSize / 2);
      sx = Math.min(Math.max(0, sx), Math.max(0, srcW - cropSize));
      sy = Math.min(Math.max(0, sy), Math.max(0, srcH - cropSize));
      // Ausgabegröße nie größer als der Ausschnitt selbst (kein Hochskalieren) — deckt
      // sich mit derselben "nie vergrößern"-Regel wie bei compressImageDataUrl.
      const outSize = Math.min(maxOutput, cropSize);
      const canvas = document.createElement("canvas");
      canvas.width = outSize;
      canvas.height = outSize;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, outSize, outSize);
      ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, outSize, outSize);
      resolve({
        dataUrl: canvas.toDataURL("image/jpeg", quality),
        width: outSize,
        height: outSize,
        pinRatioX: (centerXRatio * srcW - sx) / cropSize,
        pinRatioY: (centerYRatio * srcH - sy) / cropSize,
      });
    };
    img.onerror = () => reject(new Error("Grundriss-Ausschnitt konnte nicht erzeugt werden."));
    img.src = sourceDataUrl;
  });
}

// Lädt für eine Liste von Etagen jeweils alle Pins inkl. Fotos/Aufgaben/Verlauf
// (siehe fetchPinsForFloor) und hängt sowohl eine Referenz auf die jeweilige Etage
// als auch auf die konkrete Grundrissskizze (via pin.plan_id) an jeden Pin an —
// vereinfacht Filtern/Sortieren über alle Etagen eines Projekts hinweg UND liefert
// der Planübersicht im PDF-Export (siehe generateProjectReportPdf) das richtige,
// zum jeweiligen Pin passende Skizzenbild statt eines nicht mehr existierenden
// einzelnen Etagen-Grundrisses.
async function fetchAllPinsForProject(floors) {
  const perFloor = await Promise.all(
    floors.map(async (floor) => {
      const [pins, plans] = await Promise.all([fetchPinsForFloor(floor.id), fetchFloorPlansWithPinSummary(floor.id)]);
      const plansById = new Map(plans.map((p) => [p.id, p]));
      return pins.map((pin) => ({ ...pin, floor, plan: pin.plan_id ? plansById.get(pin.plan_id) || null : null }));
    })
  );
  return perFloor.flat();
}

// Wendet die im Export-Filter-Modal gewählten Kriterien (Abschnitt 5.1) auf die
// vollständige Pin-Liste eines Projekts an. Ein leeres/undefiniertes Filter-Array
// bedeutet jeweils "keine Einschränkung" (= alle).
function filterExportPins(pins, filters) {
  return pins.filter((pin) => {
    if (filters.floorIds?.length && !filters.floorIds.includes(pin.floor.id)) return false;
    if (filters.tradeIds?.length && !filters.tradeIds.includes(pin.trade_id)) return false;
    if (filters.statuses?.length && !filters.statuses.includes(pin.status)) return false;
    if (filters.creators?.length && !filters.creators.includes(pin.created_by)) return false;
    if (filters.fromDate && new Date(pin.created_at) < new Date(`${filters.fromDate}T00:00:00`)) return false;
    if (filters.toDate && new Date(pin.created_at) > new Date(`${filters.toDate}T23:59:59`)) return false;
    return true;
  });
}

// RGB-Entsprechungen der App-Statusfarben (Tailwind rose/amber/emerald-500) für die
// Pin-Marker auf der Planübersicht des PDF-Exports.
// offen exakt im Markenrot ("REISNER x FRANK", #FF2A00) — deckungsgleich mit
// STATUS.offen oben, damit Bildschirmdarstellung und PDF-Export farblich exakt
// übereinstimmen.
const PDF_STATUS_RGB = { offen: [255, 42, 0], bearbeitung: [245, 158, 11], erledigt: [16, 185, 129] };

// Zeichnet den Blickrichtungsindikator ("View Cone") eines Pins auf einer
// Planübersicht-Seite im PDF — 1:1 an die interaktive Planansicht angepasst (siehe
// ViewCone-Komponente): dort ist der Indikator ein halbtransparenter Fächer/
// Winkelsektor (SVG-Pfad "M 50 4 L 18 62 A 40 40 0 0 0 82 62 Z"), keine schlichte
// Dreiecksspitze. Hier als echter, vom Pin-Mittelpunkt ausgehender Kreissektor
// nachgebaut: Der Öffnungswinkel (halfSpread) ist exakt aus denselben SVG-Koordinaten
// hergeleitet (die beiden "Ecken" des Original-Pfads liegen bei atan2(32, 58) zur
// Symmetrieachse) und nicht nur grob geschätzt. Da jsPDF keine native gefüllte
// Bogenform kennt, wird die Rundung durch mehrere Bogensegmente angenähert (Fächer aus
// gleichfarbigen Dreiecken vom Pin-Mittelpunkt zu je zwei benachbarten Bogenpunkten —
// bei identischer Füllfarbe entstehen dabei keine sichtbaren Nähte). Rotation exakt
// wie ViewCone UND AngleCompass (dieselbe, dort ausdrücklich dokumentierte Konvention:
// "0° = oben (Norden), im Uhrzeigersinn steigend"). Wird VOR dem eigentlichen
// Pin-Kreis gezeichnet, damit Kreis und Nummer sichtbar darüber liegen — genau wie
// ViewCone im Screen-Rendering hinter MapPin/PinMarker liegt. Von beiden
// PDF-Planübersichten geteilt (generateProjectReportPdf & generateFloorPinsTablePdf)
// UND vom Grundriss-Ausschnitt des Einzel-Pin-Exports (generateSinglePinPdf).
function drawPdfViewCone(doc, px, py, angleDeg, statusRgb) {
  const theta = ((angleDeg || 0) * Math.PI) / 180;
  const halfSpread = Math.atan2(32, 58); // exakter Öffnungswinkel des ViewCone-SVG-Pfads
  const radius = 9;
  const segments = 10;
  const pointAt = (a) => [px + radius * Math.sin(a), py - radius * Math.cos(a)];

  const arcPoints = [];
  for (let i = 0; i <= segments; i++) {
    const a = theta - halfSpread + (i / segments) * (2 * halfSpread);
    arcPoints.push(pointAt(a));
  }

  const light = statusRgb.map((c) => Math.round(c + (255 - c) * 0.6));
  doc.setFillColor(...light);
  for (let i = 0; i < segments; i++) {
    doc.triangle(px, py, arcPoints[i][0], arcPoints[i][1], arcPoints[i + 1][0], arcPoints[i + 1][1], "F");
  }

  // Dünne Kontur entlang des äußeren Randes (zwei Radien + Bogen) — Entsprechung zur
  // zweiten, nur umrandeten SVG-Ebene (stroke, opacity 0.55) im ViewCone-Original.
  doc.setDrawColor(...statusRgb);
  doc.setLineWidth(0.35);
  doc.line(px, py, arcPoints[0][0], arcPoints[0][1]);
  doc.line(px, py, arcPoints[segments][0], arcPoints[segments][1]);
  for (let i = 0; i < segments; i++) {
    doc.line(arcPoints[i][0], arcPoints[i][1], arcPoints[i + 1][0], arcPoints[i + 1][1]);
  }
}

function sanitizeFileNamePart(text) {
  return (text || "").replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+|_+$/g, "") || "Export";
}

// ----------------------------------------------------------------------------------
// BAUSTELLEN-INFO FÜR NACHUNTERNEHMER (SITE ONBOARDING) — vier strukturierte
// Freitextfelder auf Projektebene (siehe supabase_schema_v9_site_onboarding_and_
// plan_notes.sql), die neuen Nachunternehmern die Orientierung vor Ort erleichtern:
// Anfahrt & Parkmöglichkeiten, Zugang & Sicherheit, Ansprechpartner/Bauleitung und
// Verpflegung & Infrastruktur. hasOnboardingInfo/buildOnboardingSections sind die
// gemeinsame Grundlage für die Anzeige im Projekt-Header (siehe FloorOverview) UND
// für die optionale Info-Box/-Leiste auf der ersten Seite der PDF-Exporte.
// ----------------------------------------------------------------------------------
function hasOnboardingInfo(project) {
  if (!project) return false;
  return [project.site_access_info, project.site_safety_info, project.site_contact_name, project.site_contact_phone, project.site_amenities_info].some(
    (v) => (v || "").trim() !== ""
  );
}

function buildOnboardingSections(project) {
  const sections = [];
  if ((project?.site_access_info || "").trim()) {
    sections.push({ label: "Anfahrt & Parkmöglichkeiten", text: project.site_access_info.trim() });
  }
  if ((project?.site_safety_info || "").trim()) {
    sections.push({ label: "Zugang & Sicherheit", text: project.site_safety_info.trim() });
  }
  const contact = [project?.site_contact_name?.trim(), project?.site_contact_phone?.trim()].filter(Boolean).join(" · ");
  if (contact) {
    sections.push({ label: "Ansprechpartner / Bauleitung", text: contact });
  }
  if ((project?.site_amenities_info || "").trim()) {
    sections.push({ label: "Verpflegung & Infrastruktur", text: project.site_amenities_info.trim() });
  }
  return sections;
}

// Vollformat-Info-Box (Deckblatt des projektweiten Berichts, siehe
// generateProjectReportPdf) — misst zuerst den Platzbedarf aller Abschnitte (jsPDF-
// "measure-then-draw"-Muster, siehe drawPdfViewCone/generateSinglePinPdf) und
// springt bei Bedarf auf eine neue Seite, statt die Box mitten im Text abzuschneiden.
// Gibt die y-Position direkt unterhalb der gezeichneten Box zurück.
function drawOnboardingInfoBox(doc, project, margin, startY, contentWidth, pageHeight) {
  const sections = buildOnboardingSections(project);
  if (sections.length === 0) return startY;
  const padX = 4.5;
  const padY = 5;
  const headingH = 7;
  const lineH = 3.8;
  const rowGapH = 3;

  doc.setFontSize(7.8);
  let bodyH = 0;
  const measured = sections.map((s) => {
    const lines = doc.splitTextToSize(s.text, contentWidth - padX * 2);
    const h = 4 + lines.length * lineH + rowGapH;
    bodyH += h;
    return { ...s, lines, h };
  });
  const boxH = padY * 2 + headingH + bodyH;

  let y = startY;
  if (y + boxH > pageHeight - 15) {
    doc.addPage();
    y = 20;
  }

  doc.setDrawColor(253, 186, 116);
  doc.setFillColor(255, 247, 237);
  doc.roundedRect(margin, y, contentWidth, boxH, 2.2, 2.2, "FD");

  let cursorY = y + padY + 3.5;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 42, 0);
  doc.text("Baustellen-Info für Nachunternehmer", margin + padX, cursorY);
  doc.setTextColor(15, 23, 42);
  cursorY += headingH;

  measured.forEach((s) => {
    doc.setFontSize(7.8);
    doc.setFont("helvetica", "bold");
    doc.text(`${s.label}:`, margin + padX, cursorY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.4);
    doc.text(s.lines, margin + padX, cursorY + lineH);
    cursorY += s.h;
  });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  return y + boxH + 6;
}

// Kompakte Leisten-Variante der Info-Box: für Seite 1 des Grundriss-Berichts
// (generateFloorPinsTablePdf), wo der volle Planausschnitt bereits nahezu die
// gesamte Seite beansprucht — die Abschnitte laufen hier nebeneinander in Spalten
// statt untereinander, auf maximal zwei Textzeilen je Spalte begrenzt. Gibt die
// y-Position direkt unterhalb der Leiste zurück (bzw. startY, wenn nichts hinterlegt ist).
function drawOnboardingInfoBar(doc, project, margin, startY, contentWidth) {
  const sections = buildOnboardingSections(project);
  if (sections.length === 0) return startY;
  const barH = 15;
  doc.setDrawColor(253, 186, 116);
  doc.setFillColor(255, 247, 237);
  doc.roundedRect(margin, startY, contentWidth, barH, 1.8, 1.8, "FD");
  const colW = contentWidth / sections.length;
  sections.forEach((s, i) => {
    const x = margin + i * colW + 3.5;
    const colContentW = colW - 6;
    doc.setFontSize(6.6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 42, 0);
    doc.text(s.label.toUpperCase(), x, startY + 4.6, { maxWidth: colContentW });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.4);
    doc.setTextColor(15, 23, 42);
    const lines = doc.splitTextToSize(s.text, colContentW).slice(0, 2);
    doc.text(lines, x, startY + 8.6);
  });
  doc.setTextColor(0, 0, 0);
  return startY + barH + 4;
}

// Baut den vollständigen, drucktauglichen Bericht (Abschnitt 5.2: Deckblatt,
// Planübersicht mit nummerierten Pins, Detaildokumentation je Pin inkl. Fotos und
// Bearbeitungshistorie) und löst am Ende automatisch den Browser-Download aus.
// Fehler beim Laden EINES einzelnen Bilds (Grundriss oder Foto) brechen den
// Gesamt-Export bewusst nicht ab — der Bericht ist auch mit einzelnen fehlenden
// Bildern noch nützlich, ein kompletter Abbruch wäre ärgerlicher als eine Lücke.
async function generateProjectReportPdf({ project, floors, pins, filters, trades, generatedBy, includeOnboarding = false }) {
  const jsPDF = await loadJsPdf();
  // compress: true aktiviert jsPDFs eigene interne Bild-/Stream-Kompression zusätzlich
  // zur bereits vor dem Einbetten durchgeführten Downscaling-Komprimierung der Fotos
  // und Grundrisse (siehe compressImageDataUrl) — beide Maßnahmen zusammen bringen die
  // Dateigröße auf das für den mobilen Versand praxistaugliche Zielmaß.
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const tradesById = new Map((trades || []).map((t) => [t.id, t]));

  const bold = () => doc.setFont("helvetica", "bold");
  const normal = () => doc.setFont("helvetica", "normal");

  // Globale, fortlaufende Nummerierung über alle Etagen hinweg (nach Etagenname,
  // dann Anlagedatum sortiert) — dieselbe Nummer erscheint auf der Planübersicht UND
  // als Überschrift der zugehörigen Detailseite, damit beide Ansichten eindeutig
  // zueinander referenzierbar sind.
  const numberedPins = [...pins]
    .sort((a, b) => (a.floor.id !== b.floor.id ? a.floor.name.localeCompare(b.floor.name) : new Date(a.created_at) - new Date(b.created_at)))
    .map((pin, idx) => ({ ...pin, exportNumber: idx + 1 }));

  // ---- 1. Deckblatt ---------------------------------------------------------------
  doc.setFontSize(20);
  bold();
  doc.text(project.name, margin, 28);
  doc.setFontSize(11);
  let y = 40;
  const coverLine = (label, value) => {
    bold();
    doc.text(`${label}:`, margin, y);
    normal();
    doc.text(String(value || "–"), margin + 42, y, { maxWidth: contentWidth - 42 });
    y += 7;
  };
  coverLine("Projektnummer", project.project_number);
  coverLine("Adresse", project.address);
  coverLine(
    "Zeitraum",
    `${filters.fromDate ? formatDateOnly(filters.fromDate) : "Projektbeginn"} – ${filters.toDate ? formatDateOnly(filters.toDate) : "heute"}`
  );
  coverLine("Exportdatum", formatDateTime(new Date().toISOString()));
  coverLine("Erstellt von", generatedBy);

  y += 3;
  bold();
  doc.text("Angewendete Filter", margin, y);
  normal();
  y += 6;
  [
    `Etagen: ${filters.floorLabel}`,
    `Gewerke: ${filters.tradeLabel}`,
    `Status: ${filters.statusLabel}`,
    `Ersteller: ${filters.creatorLabel}`,
  ].forEach((line) => {
    doc.text(`•  ${line}`, margin, y);
    y += 6;
  });
  y += 3;
  doc.text(`${numberedPins.length} Mängel-Pin(s) in diesem Bericht.`, margin, y);
  y += 10;

  // Baustellen-Info für Nachunternehmer (optional, siehe includeOnboarding-Checkbox
  // im PdfExportModal) — erscheint direkt unterhalb der Filterzusammenfassung auf
  // dem Deckblatt, springt bei Platzmangel automatisch auf eine eigene Seite.
  if (includeOnboarding) {
    y = drawOnboardingInfoBox(doc, project, margin, y, contentWidth, pageHeight);
  }

  // ---- 2. Planübersicht je Grundrissskizze mit nummerierten Pin-Markierungen -------
  // Ein Geschoss kann mehrere Grundrisskizzen enthalten (siehe supabase_schema_v7);
  // jede Skizze bekommt hier eine eigene Übersichtsseite mit IHREM eigenen Bild und
  // NUR den Pins, die tatsächlich an dieser Skizze hängen (pin.plan) — so bleibt die
  // Zuordnung Pin ↔ Position auf dem richtigen Plan eindeutig.
  const plansWithPins = [];
  const seenPlanIds = new Set();
  for (const pin of numberedPins) {
    if (pin.plan && !seenPlanIds.has(pin.plan.id)) {
      seenPlanIds.add(pin.plan.id);
      plansWithPins.push(pin.plan);
    }
  }
  plansWithPins.sort((a, b) => {
    const floorA = floors.find((f) => f.id === a.floor_id)?.name || "";
    const floorB = floors.find((f) => f.id === b.floor_id)?.name || "";
    return floorA !== floorB ? floorA.localeCompare(floorB) : a.name.localeCompare(b.name);
  });

  for (const p of plansWithPins) {
    const parentFloor = floors.find((f) => f.id === p.floor_id);
    doc.addPage();
    doc.setFontSize(14);
    bold();
    doc.text(`${parentFloor?.name ? `${parentFloor.name} — ` : ""}${p.name}`, margin, 20);
    normal();
    doc.setFontSize(10);

    const planPins = numberedPins.filter((pin) => pin.plan?.id === p.id);
    const planKind = resolveFloorKind(p);
    let imgRect = null;
    try {
      let imgData = null;
      if (planKind === "pdf") imgData = await renderPdfPlanToDataUrl(p.image_url);
      // SVG-Grundrisse werden hier wie Raster-Bilder behandelt: loadImageAsDataUrl
      // lädt sie unverändert über Image().naturalWidth/-Height (Browser rastern SVGs
      // beim Dekodieren automatisch anhand ihres viewBox/width/height) — das native
      // Vektor-Rendering (siehe SvgPlanCanvas) gilt ausschließlich für die interaktive
      // Planansicht, PDF-Seiten sind selbst bereits eine feste, gedruckte Auflösung.
      else if (planKind === "image" || planKind === "svg") imgData = await loadImageAsDataUrl(p.image_url);
      if (imgData) {
        // Vor dem Einbetten auf PDF-taugliche Auflösung herunterskalieren & als JPEG
        // komprimieren (siehe compressImageDataUrl) — entscheidend für die Dateigröße.
        imgData = await compressImageDataUrl(imgData.dataUrl, PDF_PLAN_MAX_WIDTH, PDF_PLAN_MAX_HEIGHT, PDF_PLAN_JPEG_QUALITY);
        const availableW = contentWidth;
        const availableH = pageHeight - 35 - margin;
        const ratio = Math.min(availableW / imgData.width, availableH / imgData.height);
        const w = imgData.width * ratio;
        const h = imgData.height * ratio;
        const x = margin + (availableW - w) / 2;
        const imgY = 28;
        doc.addImage(imgData.dataUrl, "JPEG", x, imgY, w, h);
        imgRect = { x, y: imgY, w, h };
      }
    } catch (err) {
      console.error(`Grundrissskizze "${p.name}" konnte nicht in den PDF-Export geladen werden:`, err);
    }

    if (imgRect) {
      planPins.forEach((pin) => {
        const px = imgRect.x + (pin.x / 100) * imgRect.w;
        const py = imgRect.y + (pin.y / 100) * imgRect.h;
        const rgb = PDF_STATUS_RGB[pin.status] || PDF_STATUS_RGB.offen;
        drawPdfViewCone(doc, px, py, pin.angle, rgb);
        doc.setFillColor(...rgb);
        doc.circle(px, py, 3, "F");
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text(String(pin.exportNumber), px, py + 1, { align: "center" });
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
      });
    } else {
      // CAD-Grundriss oder Ladefehler: keine Plandarstellung möglich (siehe
      // CadBlueprintPlan) — stattdessen einfache nummerierte Liste als Fallback.
      doc.text("Grundriss konnte nicht dargestellt werden (CAD-Format oder Ladefehler).", margin, 32);
      let listY = 42;
      planPins.forEach((pin) => {
        doc.text(`${pin.exportNumber}. ${pin.title}`, margin, listY);
        listY += 6;
      });
    }
  }

  // Pins aus Altbeständen ohne zugeordnete Grundrissskizze (vor Einführung von
  // supabase_schema_v7) können nicht visuell auf einem Plan verortet werden, tauchen
  // aber — damit nichts verloren geht — als einfache Liste UND vollständig in der
  // Detaildokumentation (Schritt 3 unten) auf.
  const orphanPins = numberedPins.filter((pin) => !pin.plan);
  if (orphanPins.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    bold();
    doc.text("Pins ohne zugeordnete Grundrissskizze", margin, 20);
    normal();
    doc.setFontSize(9);
    doc.text(
      "Diese Pins stammen aus Altbeständen vor Einführung der Grundrissskizzen-Ebene und sind aktuell keiner Skizze zugeordnet.",
      margin,
      28,
      { maxWidth: contentWidth }
    );
    doc.setFontSize(10);
    let listY = 40;
    orphanPins.forEach((pin) => {
      doc.text(`${pin.exportNumber}. ${pin.title} (${pin.floor?.name || "–"})`, margin, listY);
      listY += 6;
    });
  }

  // ---- 3. Detaildokumentation je Pin ------------------------------------------------
  for (const pin of numberedPins) {
    doc.addPage();
    doc.setFontSize(14);
    bold();
    doc.text(`Pin ${pin.exportNumber} — ${pin.title}`, margin, 20, { maxWidth: contentWidth });
    normal();
    doc.setFontSize(10);

    let dy = 30;
    const field = (label, value) => {
      bold();
      doc.text(`${label}:`, margin, dy);
      normal();
      doc.text(String(value || "–"), margin + 34, dy, { maxWidth: contentWidth - 34 });
      dy += 6;
    };
    field("Etage", pin.floor.name);
    field("Grundrissskizze", pin.plan?.name);
    field("Status", STATUS[pin.status]?.label || pin.status);
    field("Priorität", PRIORITY[pin.priority]?.label || pin.priority);
    field("Gewerk", tradesById.get(pin.trade_id)?.name);
    field("Bereich", pin.area);
    field("Anschlussbezeichnung", pin.reference_code);
    field("Verantwortlicher", pin.assigned_to);
    field("Frist", pin.due_date ? formatDateOnly(pin.due_date) : null);
    field("Ersteller", pin.created_by);
    field("Angelegt am", formatDateTime(pin.created_at));

    dy += 2;
    bold();
    doc.text("Beschreibung:", margin, dy);
    dy += 6;
    normal();
    const descLines = doc.splitTextToSize(pin.description || "–", contentWidth);
    doc.text(descLines, margin, dy);
    dy += descLines.length * 5 + 4;

    // Fotos im Raster (3 Spalten), seitenübergreifend falls nötig
    const photos = pin.pin_photos || [];
    if (photos.length > 0) {
      bold();
      doc.text("Fotos:", margin, dy);
      dy += 6;
      normal();
      const cols = 3;
      const gap = 4;
      const cellW = (contentWidth - gap * (cols - 1)) / cols;
      const cellH = cellW * 0.75;
      let col = 0;
      for (const photo of photos) {
        if (dy + cellH > pageHeight - margin) {
          doc.addPage();
          dy = margin;
          col = 0;
        }
        try {
          const rawImgData = await loadImageAsDataUrl(photo.photo_url);
          // Downscaling & JPEG-Komprimierung vor dem Einbetten (siehe compressImageDataUrl)
          // — Kamerafotos landen sonst in voller Originalauflösung im PDF.
          const imgData = await compressImageDataUrl(rawImgData.dataUrl, PDF_PHOTO_MAX_WIDTH, PDF_PHOTO_MAX_HEIGHT, PDF_PHOTO_JPEG_QUALITY);
          const px = margin + col * (cellW + gap);
          const ratio = Math.min(cellW / imgData.width, cellH / imgData.height);
          const w = imgData.width * ratio;
          const h = imgData.height * ratio;
          doc.addImage(imgData.dataUrl, "JPEG", px + (cellW - w) / 2, dy + (cellH - h) / 2, w, h);
        } catch (err) {
          console.error("Foto konnte nicht in den PDF-Export geladen werden:", err);
        }
        col += 1;
        if (col >= cols) {
          col = 0;
          dy += cellH + gap;
        }
      }
      if (col !== 0) dy += cellH + gap;
      dy += 2;
    }

    // Vollständige Bearbeitungshistorie (Abschnitt 3), chronologisch aufsteigend
    if (dy > pageHeight - 40) {
      doc.addPage();
      dy = margin;
    }
    bold();
    doc.text("Bearbeitungshistorie:", margin, dy);
    dy += 6;
    normal();
    doc.setFontSize(9);
    const history = [...(pin.pin_activity_log || [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    if (history.length === 0) {
      doc.text("Kein Verlauf vorhanden.", margin, dy);
      dy += 5;
    } else {
      history.forEach((entry) => {
        if (dy > pageHeight - margin) {
          doc.addPage();
          dy = margin;
        }
        const label = PIN_ACTIVITY_META[entry.action]?.label || entry.action;
        const lines = doc.splitTextToSize(
          `${formatDateTime(entry.created_at)} · ${entry.actor_name || entry.actor_email || "Unbekannt"} · ${entry.detail || label}`,
          contentWidth
        );
        doc.text(lines, margin, dy);
        dy += lines.length * 4.5;
      });
    }
    doc.setFontSize(10);
  }

  const fileName = `${sanitizeFileNamePart(project.name)}_Baudokumentation_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
  return fileName;
}

// ----------------------------------------------------------------------------------
// GESCHOSS-EXPORT — Pin-Tabelle je Etage (PDF-Tabelle & CSV/Excel)
// ----------------------------------------------------------------------------------
// Eigenständig von generateProjectReportPdf oben: exportiert gezielt EIN Geschoss —
// als visueller Karten-Bericht (PDF, siehe generateFloorPinsTablePdf weiter unten)
// und als vollständige Rohdaten-Tabelle (CSV/Excel, siehe pinsToFloorExportRows).
// Oberste Priorität ist in beiden Fällen Datenvollständigkeit — es wird bewusst
// NIRGENDS Text stillschweigend abgeschnitten, auch nicht bei sehr langen
// Beschreibungen oder vielen Fotos je Pin.

// Baut für einen einzelnen Pin die Anzeige-Werte der elf vorgegebenen Kernfelder
// (Nr. → Aufnahmedatum → Thema → Anschlussbezeichnung → Gewerk → Bereich →
// Geschoss → Status → Kommentar → Erledigt bis → Erledigen durch) — als
// gemeinsame Grundlage sowohl für die Mangel-Karten im PDF-Export als auch für
// eine konsistente Feldbezeichnung im CSV/Excel-Export.
function buildFloorExportRowValues(pin, tradesById, floorName) {
  return {
    number: String(pin.exportNumber),
    recordedDate: formatDateShort(pin.created_at),
    topic: pin.title || "–",
    referenceCode: pin.reference_code || "–",
    trade: tradesById.get(pin.trade_id)?.name || "–",
    area: pin.area || "–",
    floor: floorName || "–",
    status: STATUS[pin.status]?.label || pin.status || "–",
    comment: pin.description || "–",
    dueDate: pin.due_date ? formatDateOnly(pin.due_date) : "–",
    assignedTo: pin.assigned_to || "–",
  };
}

// Erstellt einen professionellen Mängelbericht für GENAU EINE Grundrissskizze — im
// Stil eines Baugutachtens statt einer reinen Datentabelle:
//   Seite 1 (Querformat): Deckblatt + eine hochauflösende Planübersicht mit allen
//     nummerierten Pin-Markierungen — verschafft sofortige visuelle Orientierung
//     über die Gesamtverteilung aller (bzw. aller gefilterten) Mängel auf dem Geschoss.
//   Folgeseiten (Hochformat): kompakte, fließende Mangel-Karten — mehrere Pins pro
//     Seite, ohne festen Seitenumbruch nach jedem einzelnen Pin (siehe
//     "break-inside: avoid"-Äquivalent weiter unten); links Datenfakten inkl.
//     vollständigem, nie gekürztem Kommentar, rechts das eingebettete
//     Foto-Vorschaubild bzw. ein Platzhalter, falls kein Foto hinterlegt ist.
// pins ist die tatsächlich auszugebende (ggf. per Filterleiste eingeschränkte)
// Teilmenge; allPins die VOLLSTÄNDIGE, ungefilterte Pin-Liste der Skizze — wird
// ausschließlich zur Nummernvergabe herangezogen, damit "Nr. X" in einem gefilterten
// Bericht immer mit der auf dem Plan UND im vollständigen Export angezeigten Nummer
// übereinstimmt (identischer Sortierschlüssel wie pinNumberById in FloorPlanView und
// wie im Excel-Export, siehe pinsToFloorExportRows) — 1:1-Match, unabhängig davon, ob
// gerade gefiltert exportiert wird oder nicht. filterSummary (optional) ist ein
// bereits fertig formatierter Text der aktuell aktiven Filterkriterien und wird, falls
// vorhanden, zusätzlich auf dem Deckblatt ausgewiesen. Der Excel-Export bleibt bewusst
// die vollständige, tabellarische Rohdaten-Variante (inkl. Priorität, exakter
// Plan-Position und aller Foto-Links) und daher unabhängig von der Filterleiste; diese
// PDF-Ausgabe ist demgegenüber bewusst ein kuratierter, filterbarer visueller Bericht.
async function generateFloorPinsTablePdf({ project, floor, plan, pins, allPins, trades, generatedBy, filterSummary, includeOnboarding = false }) {
  const jsPDF = await loadJsPdf();
  // compress: true aktiviert jsPDFs eigene interne Bild-/Stream-Kompression zusätzlich
  // zur bereits vor dem Einbetten durchgeführten Downscaling-Komprimierung der Fotos
  // und der Planübersicht (siehe compressImageDataUrl).
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape", compress: true });
  const tradesById = new Map((trades || []).map((t) => [t.id, t]));

  const bold = () => doc.setFont("helvetica", "bold");
  const normal = () => doc.setFont("helvetica", "normal");
  const brandColor = () => doc.setTextColor(255, 42, 0); // #FF2A00, exaktes Markenrot
  const inkColor = () => doc.setTextColor(15, 23, 42); // #0F172A
  const mutedColor = () => doc.setTextColor(100, 116, 139);

  // Nummernvergabe IMMER über die vollständige, ungefilterte Pin-Liste (allPins,
  // fällt auf pins zurück, falls nicht mitgegeben) — siehe Erläuterung oben.
  const numberSource = allPins && allPins.length ? allPins : pins;
  const exportNumberById = new Map(
    [...numberSource].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map((p, idx) => [p.id, idx + 1])
  );
  const numberedPins = [...pins]
    .map((pin) => ({ ...pin, exportNumber: exportNumberById.get(pin.id) ?? 0 }))
    .sort((a, b) => a.exportNumber - b.exportNumber);

  // ---- Seite 1 — Deckblatt & visuelle Planübersicht -------------------------------
  {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;

    doc.setFontSize(16);
    bold();
    inkColor();
    doc.text(`${project.name} — ${floor.name}${plan?.name ? ` — ${plan.name}` : ""}`, margin, margin + 6);
    doc.setFontSize(9);
    normal();
    mutedColor();
    doc.text(
      `Grundrissskizzen-Bericht · Erstellungsdatum: ${formatDateOnly(new Date().toISOString())} · Erstellt von: ${generatedBy || "–"} · ${
        numberedPins.length
      } Mängel-Pin(s)${filterSummary ? " (gefiltert)" : ""}`,
      margin,
      margin + 12
    );
    // Aktive Filterkriterien der Planansicht (Status/Gewerk/Suche) — nur sichtbar,
    // wenn tatsächlich gefiltert wurde; ein ungefilterter Export bleibt unverändert
    // knapp bei der einzeiligen Kopfzeile oben.
    let metaBottom = margin + 12;
    if (filterSummary) {
      doc.setFontSize(8);
      const filterLines = doc.splitTextToSize(`Gefiltert nach: ${filterSummary}`, contentWidth - 55);
      doc.text(filterLines, margin, metaBottom + 4.5);
      metaBottom += 4.5 + (filterLines.length - 1) * 3.8;
    }

    // "REISNER x FRANK"-Branding rechts oben — dieselbe Wortmarke wie im
    // Anwendungs-Header/Splash-Screen, hier als reiner Text nachgebaut, da jsPDF
    // kein Inline-SVG rendern kann.
    doc.setFontSize(12);
    bold();
    brandColor();
    doc.text("REISNER × FRANK", pageWidth - margin, margin + 6, { align: "right" });
    doc.setFontSize(7.5);
    normal();
    mutedColor();
    doc.text("Baustellendokumentation", pageWidth - margin, margin + 11, { align: "right" });

    const headerBottom = Math.max(margin + 17, metaBottom + 4);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, headerBottom, pageWidth - margin, headerBottom);

    // Legende: Statuszahlen der in diesem Bericht tatsächlich enthaltenen Pins — bei
    // aktiver Filterleiste sind das bewusst nur die gefilterten (siehe numberedPins
    // oben), sonst wie gehabt alle Pins der Skizze.
    const legendY = headerBottom + 7;
    let legendX = margin;
    const legendItem = (label, count, rgb) => {
      doc.setFillColor(...rgb);
      doc.circle(legendX + 1.3, legendY - 1.3, 1.3, "F");
      doc.setFontSize(9);
      normal();
      inkColor();
      const text = `${count} ${label}`;
      doc.text(text, legendX + 4.5, legendY);
      legendX += doc.getTextWidth(text) + 10;
    };
    legendItem("offen", numberedPins.filter((p) => p.status === "offen").length, PDF_STATUS_RGB.offen);
    legendItem("in Bearbeitung", numberedPins.filter((p) => p.status === "bearbeitung").length, PDF_STATUS_RGB.bearbeitung);
    legendItem("erledigt", numberedPins.filter((p) => p.status === "erledigt").length, PDF_STATUS_RGB.erledigt);

    // Baustellen-Info für Nachunternehmer (optional) — kompakte Leisten-Variante,
    // da der Planausschnitt hier bereits nahezu die gesamte Seite beansprucht (siehe
    // drawOnboardingInfoBar). Verkleinert availableTop entsprechend um ihre Höhe.
    const infoBarBottom = includeOnboarding ? drawOnboardingInfoBar(doc, project, margin, legendY + 4, contentWidth) : legendY + 8;

    // Planbild mit nummerierten Pin-Markierungen — dieselbe Zeichenlogik (Kreis +
    // weiße Nummer) wie in der Planübersicht des projektweiten PDF-Exports (siehe
    // generateProjectReportPdf), hier hochauflösend über die volle Seitenbreite.
    const availableTop = infoBarBottom;
    const availableW = contentWidth;
    const availableH = pageHeight - availableTop - margin;
    let imgRect = null;
    if (plan?.image_url) {
      try {
        const planKind = resolveFloorKind(plan);
        let imgData = null;
        if (planKind === "pdf") imgData = await renderPdfPlanToDataUrl(plan.image_url);
        else if (planKind === "image" || planKind === "svg") imgData = await loadImageAsDataUrl(plan.image_url);
        if (imgData) {
          // Vor dem Einbetten auf PDF-taugliche Auflösung herunterskalieren & als JPEG
          // komprimieren (siehe compressImageDataUrl) — entscheidend für die Dateigröße.
          imgData = await compressImageDataUrl(imgData.dataUrl, PDF_PLAN_MAX_WIDTH, PDF_PLAN_MAX_HEIGHT, PDF_PLAN_JPEG_QUALITY);
          const ratio = Math.min(availableW / imgData.width, availableH / imgData.height);
          const w = imgData.width * ratio;
          const h = imgData.height * ratio;
          const x = margin + (availableW - w) / 2;
          const imgY = availableTop;
          doc.addImage(imgData.dataUrl, "JPEG", x, imgY, w, h);
          imgRect = { x, y: imgY, w, h };
        }
      } catch (err) {
        console.error(`Grundrissskizze "${plan?.name}" konnte nicht in den PDF-Export geladen werden:`, err);
      }
    }

    if (imgRect) {
      numberedPins.forEach((pin) => {
        const px = imgRect.x + (pin.x / 100) * imgRect.w;
        const py = imgRect.y + (pin.y / 100) * imgRect.h;
        const rgb = PDF_STATUS_RGB[pin.status] || PDF_STATUS_RGB.offen;
        drawPdfViewCone(doc, px, py, pin.angle, rgb);
        doc.setFillColor(...rgb);
        doc.circle(px, py, 3.4, "F");
        doc.setFontSize(7);
        bold();
        doc.setTextColor(255, 255, 255);
        doc.text(String(pin.exportNumber), px, py + 1.1, { align: "center" });
      });
      normal();
      inkColor();
    } else {
      doc.setFontSize(10);
      mutedColor();
      const msg =
        numberedPins.length > 0
          ? "Grundriss konnte nicht dargestellt werden (CAD-Format oder Ladefehler) — alle Mängel sind auf den Folgeseiten vollständig dokumentiert."
          : filterSummary
          ? "Keine Mängel-Pins entsprechen der aktuell gesetzten Filterung dieses Berichts."
          : "Für diese Grundrissskizze sind aktuell keine Mängel-Pins erfasst.";
      doc.text(msg, margin, availableTop + 8, { maxWidth: contentWidth });
      inkColor();
    }
  }

  // ---- Folgeseiten — fließende, kompakte Mangel-Karten ---------------------------
  // Kein fixer Seitenumbruch mehr nach jedem einzelnen Pin: mehrere Karten fließen
  // kontinuierlich untereinander auf derselben Seite. Vor dem Zeichnen jeder Karte
  // wird ihre voraussichtliche Höhe berechnet (Textumbruch via doc.splitTextToSize,
  // das nur MISST und nichts zeichnet) — passt sie nicht mehr vollständig auf die
  // aktuelle Seite, rutscht sie als GANZES auf eine neue Seite (das PDF-Äquivalent zu
  // CSS "break-inside: avoid"), statt mitten im Bild oder Text zerschnitten zu werden.
  // Ohne Pins wird bewusst KEINE zusätzliche leere Seite angehängt — Seite 1 trägt in
  // diesem Fall bereits den entsprechenden Hinweis (siehe Fallback-Text weiter oben).
  if (numberedPins.length > 0) {
    doc.addPage("a4", "portrait");
    let pageWidth = doc.internal.pageSize.getWidth();
    let pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    const colGap = 8;
    const leftW = contentWidth * 0.58;
    const rightW = contentWidth - leftW - colGap;
    const rightX = margin + leftW + colGap;
    const cardBottomGap = 9;
    // Feste, moderate Foto-Boxhöhe statt "füllt die restliche Seite" — im kompakten,
    // fließenden Layout braucht die Karte eine planbare, von der Seitenrestfläche
    // unabhängige Höhe.
    const photoBoxH = Math.min(58, rightW * 1.1);

    let y = margin;

    for (const pin of numberedPins) {
      const rowValues = buildFloorExportRowValues(pin, tradesById, floor.name);

      // ---- Höhe messen (nichts wird hier gezeichnet) ----------------------------
      doc.setFontSize(15);
      bold();
      const themaLines = doc.splitTextToSize(rowValues.topic, contentWidth);
      const headerThemaY = 11.5;
      const headerBottomOffset = headerThemaY + themaLines.length * 6.2 + 3;

      doc.setFontSize(10);
      normal();
      const shortFieldDefs = [
        ["Anschlussbezeichnung", rowValues.referenceCode],
        ["Gewerk", rowValues.trade],
        ["Bereich", rowValues.area],
        ["Erledigen durch", rowValues.assignedTo],
      ];
      const shortFields = shortFieldDefs.map(([label, value]) => {
        const lines = doc.splitTextToSize(String(value ?? "–"), leftW);
        return { label, lines, height: 4.3 + lines.length * 4.6 + 3.6 };
      });
      const shortFieldsHeight = shortFields.reduce((sum, f) => sum + f.height, 0);

      doc.setFontSize(9.5);
      const commentLines = doc.splitTextToSize(rowValues.comment, leftW);
      const commentBlockHeight = 4.3 + commentLines.length * 4.6;

      const contentHeight = Math.max(shortFieldsHeight + commentBlockHeight, photoBoxH);
      const estimatedCardHeight = headerBottomOffset + 6 + contentHeight + cardBottomGap;

      // ---- Seitenumbruch-Entscheidung: Karte als Ganzes auf eine neue Seite, wenn sie
      // hier nicht mehr vollständig Platz findet (y > margin verhindert eine leere
      // Endlosschleife, falls eine einzelne Karte selbst eine ganze Seite sprengt — in
      // dem seltenen Fall greift die Kommentar-Fortsetzungslogik weiter unten). ----
      if (y + estimatedCardHeight > pageHeight - margin && y > margin) {
        doc.addPage("a4", "portrait");
        y = margin;
      }
      const cardTop = y;

      // ---- Kartenkopf zeichnen: Nr. links, Status/Aufnahmedatum/Erledigt bis als
      // kompakte, rechtsbündige Badges auf derselben Zeilen-Ebene, Thema darunter. ----
      doc.setFontSize(10);
      bold();
      brandColor();
      doc.text(`Nr. ${pin.exportNumber}`, margin, cardTop + 4);

      const badgeY = cardTop + 4;
      const drawBadge = (text, rightEdgeX, bg, textColor) => {
        doc.setFontSize(7.2);
        bold();
        const bw = doc.getTextWidth(text) + 5;
        const bx = rightEdgeX - bw;
        doc.setFillColor(...bg);
        doc.roundedRect(bx, badgeY - 3.6, bw, 4.6, 1, 1, "F");
        doc.setTextColor(...textColor);
        doc.text(text, bx + 2.5, badgeY);
        return bx;
      };
      let badgeEdge = pageWidth - margin;
      badgeEdge = drawBadge(`Bis: ${rowValues.dueDate}`, badgeEdge, [241, 245, 249], [71, 85, 105]) - 2.2;
      badgeEdge = drawBadge(`Aufn.: ${rowValues.recordedDate}`, badgeEdge, [241, 245, 249], [71, 85, 105]) - 2.2;
      drawBadge(rowValues.status, badgeEdge, PDF_STATUS_RGB[pin.status] || PDF_STATUS_RGB.offen, [255, 255, 255]);

      doc.setFontSize(15);
      bold();
      inkColor();
      doc.text(themaLines, margin, cardTop + headerThemaY);
      normal();

      const headerBottom = cardTop + headerBottomOffset;
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, headerBottom, pageWidth - margin, headerBottom);

      const columnsStartY = headerBottom + 6;

      // ---- Rechte Spalte — Foto-Nachweis: zuerst gezeichnet, damit sie sicher auf
      // DIESER Karten-Seite landet, bevor ein eventueller Kommentar-Seitenumbruch weiter
      // unten den aktuellen jsPDF-Seitenkontext wechselt. Eingebettetes Vorschaubild des
      // ersten Fotos (weitere Fotos werden gezählt, nicht verworfen — vollständige Liste
      // aller Foto-Links steht im Excel-Export), sonst ein dezenter Platzhalter. ----
      const photos = pin.pin_photos || [];
      doc.setDrawColor(226, 232, 240);
      let photoNoteHeight = 0;
      if (photos.length > 0) {
        try {
          const rawImgData = await loadImageAsDataUrl(photos[0].photo_url);
          // Downscaling & JPEG-Komprimierung vor dem Einbetten (siehe compressImageDataUrl)
          // — Kamerafotos landen sonst in voller Originalauflösung im PDF.
          const imgData = await compressImageDataUrl(rawImgData.dataUrl, PDF_PHOTO_MAX_WIDTH, PDF_PHOTO_MAX_HEIGHT, PDF_PHOTO_JPEG_QUALITY);
          const ratio = Math.min(rightW / imgData.width, photoBoxH / imgData.height);
          const w = imgData.width * ratio;
          const h = imgData.height * ratio;
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(rightX, columnsStartY, rightW, photoBoxH, 2, 2, "FD");
          doc.addImage(imgData.dataUrl, "JPEG", rightX + (rightW - w) / 2, columnsStartY + (photoBoxH - h) / 2, w, h);
        } catch (err) {
          console.error("Foto konnte nicht in den PDF-Export geladen werden:", err);
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(rightX, columnsStartY, rightW, photoBoxH, 2, 2, "FD");
          doc.setFontSize(9);
          mutedColor();
          doc.text("Foto konnte nicht geladen werden", rightX + rightW / 2, columnsStartY + photoBoxH / 2, { align: "center" });
          inkColor();
        }
        if (photos.length > 1) {
          doc.setFontSize(7.5);
          mutedColor();
          doc.text(
            `+ ${photos.length - 1} weitere(s) Foto(s) — vollständige Liste im Excel-Export.`,
            rightX,
            columnsStartY + photoBoxH + 5,
            { maxWidth: rightW }
          );
          inkColor();
          photoNoteHeight = 6;
        }
      } else {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(rightX, columnsStartY, rightW, photoBoxH, 2, 2, "FD");
        doc.setFontSize(9.5);
        mutedColor();
        doc.text("Kein Bild vorhanden", rightX + rightW / 2, columnsStartY + photoBoxH / 2, { align: "center" });
        inkColor();
      }
      const photoColumnBottom = columnsStartY + photoBoxH + photoNoteHeight;

      // ---- Linke Spalte — Datenfakten (Anschlussbezeichnung, Gewerk, Bereich,
      // Erledigen durch — Status/Aufnahmedatum/Erledigt bis sitzen bereits kompakt im
      // Kartenkopf) und vollständiger Kommentar. ----
      let dy = columnsStartY;
      shortFields.forEach(({ label, lines }) => {
        doc.setFontSize(7.5);
        bold();
        mutedColor();
        doc.text(label.toUpperCase(), margin, dy);
        dy += 4.3;
        doc.setFontSize(10);
        normal();
        inkColor();
        doc.text(lines, margin, dy);
        dy += lines.length * 4.6 + 3.6;
      });

      doc.setFontSize(7.5);
      bold();
      mutedColor();
      doc.text("KOMMENTAR", margin, dy);
      dy += 4.3;
      doc.setFontSize(9.5);
      normal();
      inkColor();
      // Vollständiger Kommentartext, ohne jede Kürzung — für sehr lange Kommentare läuft
      // die Karte notfalls über den unteren Seitenrand hinaus in eine direkt
      // anschließende Fortsetzungsseite (bewusst in Kauf genommen: eine Kürzung des
      // Kommentartexts käme für ein Baugutachten nicht infrage). Die rechte Spalte
      // (Foto) ist zu diesem Zeitpunkt bereits vollständig gezeichnet, ein hier
      // eventuell ausgelöster Seitenumbruch kann sie also nicht mehr betreffen.
      let commentY = dy;
      for (const line of commentLines) {
        if (commentY > pageHeight - margin) {
          doc.addPage("a4", "portrait");
          pageWidth = doc.internal.pageSize.getWidth();
          pageHeight = doc.internal.pageSize.getHeight();
          commentY = margin;
        }
        doc.text(line, margin, commentY);
        commentY += 4.6;
      }

      // Nächste Karte setzt direkt unterhalb des tiefsten Punkts dieser Karte fort
      // (Kommentarende ODER Fotospalte, je nachdem was tiefer reicht) — daher der
      // fließende, lückenlose Mehr-Pin-Fluss ohne erzwungene Seitenumbrüche.
      y = Math.max(commentY, photoColumnBottom) + cardBottomGap;
    }
  }

  const fileName = `${sanitizeFileNamePart(project.name)}_${sanitizeFileNamePart(floor.name)}${
    plan?.name ? `_${sanitizeFileNamePart(plan.name)}` : ""
  }_Grundrissbericht_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
  return fileName;
}

// Wandelt die Pins eines Geschosses in flache, für CSV/Excel geeignete Zeilenobjekte
// um — bewusst ALLE Attribute je Pin als eigene Spalte, inkl. voller Beschreibung,
// aller Foto-Links (durch " | " getrennt statt nur der Anzahl) und der Bearbeitungs-
// Metadaten, damit hier garantiert nichts verloren geht.
// Spaltenreihenfolge exakt wie vorgegeben (Nr. … Erledigen durch); danach folgen,
// ausschließlich zur Wahrung der vollständigen Datenintegrität (keine Attribute,
// Fotoverknüpfungen oder Anmerkungen dürfen verloren gehen), ergänzende Spalten, die
// NICHT Teil der vorgegebenen Struktur sind.
function pinsToFloorExportRows(pins, trades, floorName) {
  const tradesById = new Map((trades || []).map((t) => [t.id, t]));
  return [...pins]
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map((pin, idx) => ({
      "Nr.": idx + 1,
      Aufnahmedatum: formatDateShort(pin.created_at),
      Thema: pin.title || "",
      Anschlussbezeichnung: pin.reference_code || "",
      Gewerk: tradesById.get(pin.trade_id)?.name || "",
      Bereich: pin.area || "",
      Geschoss: floorName || "",
      Status: STATUS[pin.status]?.label || pin.status || "",
      Kommentar: pin.description || "",
      "Erledigt bis": pin.due_date ? formatDateOnly(pin.due_date) : "",
      "Erledigen durch": pin.assigned_to || "",
      // ---- Ergänzende, nicht in der vorgegebenen Struktur enthaltene Spalten ----
      Priorität: PRIORITY[pin.priority]?.label || pin.priority || "",
      "Position X (%)": pin.x ?? "",
      "Position Y (%)": pin.y ?? "",
      "Anzahl Fotos": (pin.pin_photos || []).length,
      "Foto-Links": (pin.pin_photos || []).map((p) => p.photo_url).join(" | "),
      Ersteller: pin.created_by || "",
      "Erstellt am (Zeitstempel)": formatDateTime(pin.created_at),
      "Zuletzt bearbeitet von": pin.updated_by || "",
      "Zuletzt bearbeitet am": pin.updated_at && pin.updated_at !== pin.created_at ? formatDateTime(pin.updated_at) : "",
    }));
}

// CSV-Feld-Escaping nach RFC 4180: in Anführungszeichen setzen, sobald das Feld das
// Trennzeichen, Anführungszeichen selbst oder einen Zeilenumbruch enthält (z.B. eine
// mehrzeilige Beschreibung).
function csvEscape(value) {
  const str = String(value ?? "");
  if (/[";\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

// Semikolon statt Komma als Trennzeichen — die in Deutschland/Excel übliche
// Konvention (Komma ist dort der Dezimaltrenner). Ein vorangestelltes BOM sorgt
// dafür, dass Excel die UTF-8-Kodierung (Umlaute, „ “-Anführungszeichen) korrekt
// erkennt, statt sie als Latin-1 misszuinterpretieren.
function buildFloorExportCsv(rows) {
  if (rows.length === 0) return "﻿";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(";"), ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(";"))];
  return "﻿" + lines.join("\r\n");
}

function downloadTextFile(fileName, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportFloorPinsCsv({ project, floor, plan, pins, trades }) {
  const csv = buildFloorExportCsv(pinsToFloorExportRows(pins, trades, floor.name));
  const fileName = `${sanitizeFileNamePart(project.name)}_${sanitizeFileNamePart(floor.name)}${
    plan?.name ? `_${sanitizeFileNamePart(plan.name)}` : ""
  }_Grundrissbericht_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadTextFile(fileName, csv, "text/csv;charset=utf-8;");
  return fileName;
}

// ----------------------------------------------------------------------------------
// EINZEL-PIN-EXPORT — schnelles 1-Seiten-PDF für EINEN Mängel-Pin
// ----------------------------------------------------------------------------------
// Eigenständig von generateFloorPinsTablePdf: statt eines ganzen Geschoss-Berichts
// wird hier gezielt nur EIN Pin mit Stammdaten, Mängelfoto und einem doppelten
// Orientierungssystem aufbereitet (Gesamt-Minimap + Detail-Zoom, siehe unten) —
// gedacht für die schnelle Nachfrage an einen einzelnen Nachunternehmer, ohne den
// kompletten Geschoss-Bericht verschicken zu müssen.
// Anteil der kürzeren Grundriss-Seite, der im Detail-Zoom gezeigt wird — klein genug
// für eine spürbare Zoomwirkung, groß genug, damit die unmittelbare Umgebung des
// Pins (angrenzende Räume/Wände/Achsraster) noch erkennbar bleibt.
const SINGLE_PIN_PLAN_CROP_RATIO = 0.26;
// Maximale Kantenlänge & JPEG-Qualität der kleinen Übersichts-Minimap (zeigt den
// GESAMTEN Grundriss, dient nur der groben Orientierung im Gebäude) — bewusst deutlich
// kleiner/stärker komprimiert als der scharfe Detail-Zoom, da hier keine Details,
// sondern nur die grobe Position im Geschoss erkennbar sein müssen.
const SINGLE_PIN_MINIMAP_MAX_DIM = 500;
const SINGLE_PIN_MINIMAP_QUALITY = 0.6;

async function generateSinglePinPdf({ project, floor, plan, pin, exportNumber, trades, generatedBy }) {
  const jsPDF = await loadJsPdf();
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const tradesById = new Map((trades || []).map((t) => [t.id, t]));

  const bold = () => doc.setFont("helvetica", "bold");
  const normal = () => doc.setFont("helvetica", "normal");
  const brandColor = () => doc.setTextColor(255, 42, 0);
  const inkColor = () => doc.setTextColor(15, 23, 42);
  const mutedColor = () => doc.setTextColor(100, 116, 139);

  const rowValues = buildFloorExportRowValues({ ...pin, exportNumber }, tradesById, floor.name);
  const rgb = PDF_STATUS_RGB[pin.status] || PDF_STATUS_RGB.offen;

  // ---- Kopfzeile: Nr. links, Marke rechts oben, Thema darunter, Status-/Datums-
  // Badges rechtsbündig auf einer eigenen Zeile — dieselbe kompakte Formsprache wie
  // die Mangel-Karten im Geschoss-Export (siehe generateFloorPinsTablePdf). ----
  doc.setFontSize(10);
  bold();
  brandColor();
  doc.text(`Nr. ${exportNumber}`, margin, margin + 4);
  doc.setFontSize(11);
  doc.text("REISNER × FRANK", pageWidth - margin, margin + 4, { align: "right" });
  doc.setFontSize(7);
  normal();
  mutedColor();
  doc.text("Einzel-Export · Baustellendokumentation", pageWidth - margin, margin + 8.5, { align: "right" });

  doc.setFontSize(17);
  bold();
  inkColor();
  const themaLines = doc.splitTextToSize(rowValues.topic, contentWidth);
  doc.text(themaLines, margin, margin + 16);
  normal();
  const themaBottom = margin + 16 + (themaLines.length - 1) * 6.8;

  const badgeY = themaBottom + 6;
  const drawBadge = (text, rightEdgeX, bg, textColor) => {
    doc.setFontSize(7.5);
    bold();
    const bw = doc.getTextWidth(text) + 5;
    const bx = rightEdgeX - bw;
    doc.setFillColor(...bg);
    doc.roundedRect(bx, badgeY - 3.8, bw, 4.9, 1, 1, "F");
    doc.setTextColor(...textColor);
    doc.text(text, bx + 2.5, badgeY);
    return bx;
  };
  let badgeEdge = pageWidth - margin;
  badgeEdge = drawBadge(`Bis: ${rowValues.dueDate}`, badgeEdge, [241, 245, 249], [71, 85, 105]) - 2.2;
  badgeEdge = drawBadge(`Aufn.: ${rowValues.recordedDate}`, badgeEdge, [241, 245, 249], [71, 85, 105]) - 2.2;
  drawBadge(rowValues.status, badgeEdge, rgb, [255, 255, 255]);
  inkColor();

  const headerBottom = badgeY + 5;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, headerBottom, pageWidth - margin, headerBottom);

  const columnsStartY = headerBottom + 7;
  const colGap = 8;
  const leftW = contentWidth * 0.52;
  const rightW = contentWidth - leftW - colGap;
  const rightX = margin + leftW + colGap;

  // ---- Rechte Spalte — doppeltes Orientierungssystem: oben eine kleine Minimap des
  // GESAMTEN Geschoss-Grundrisses (grobe Orientierung im Gebäude), darunter ein
  // größerer, auf den Pin gezoomter Detail-Ausschnitt (siehe cropImageDataUrl) mit
  // demselben Pin-Marker samt Blickrichtungs-Sektor wie auf der vollständigen
  // Planübersicht (drawPdfViewCone, 1:1 dieselbe Rotation wie das Kompass-Feld im
  // Pin-Modal) — zusammen zeigen beide auf einen Blick sowohl WO im Gebäude als auch
  // WO GENAU am Pin sich der Mangel befindet. Beide Ansichten nutzen bewusst dieselbe,
  // einmalig geladene Planquelle (imgData) — spart einen doppelten Ladevorgang. ----
  const minimapBoxH = Math.min(46, rightW * 0.62);
  const minimapCaptionH = 7;
  const detailY = columnsStartY + minimapBoxH + minimapCaptionH;
  const detailBoxH = Math.min(78, rightW * 1.05);

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightX, columnsStartY, rightW, minimapBoxH, 2, 2, "FD");
  doc.roundedRect(rightX, detailY, rightW, detailBoxH, 2, 2, "FD");

  const drawPlanPlaceholder = (message, boxY, boxH) => {
    doc.setFontSize(8.5);
    mutedColor();
    doc.text(message, rightX + rightW / 2, boxY + boxH / 2, { align: "center" });
    inkColor();
  };

  if (plan?.image_url) {
    try {
      const planKind = resolveFloorKind(plan);
      let imgData = null;
      if (planKind === "pdf") imgData = await renderPdfPlanToDataUrl(plan.image_url);
      else if (planKind === "image" || planKind === "svg") imgData = await loadImageAsDataUrl(plan.image_url);
      if (!imgData) throw new Error("Kein Bildmaterial für diese Grundrissskizze verfügbar.");

      // 1. Gesamt-Übersichtsplan (Minimap) — kompletter Grundriss stark verkleinert,
      // mit deutlich hervorgehobenem Pin-Marker (weißer Ring als Kontrast-Halo, damit
      // der Punkt auch auf einem detailreichen Plan sofort auffindbar ist).
      const minimapData = await compressImageDataUrl(imgData.dataUrl, SINGLE_PIN_MINIMAP_MAX_DIM, SINGLE_PIN_MINIMAP_MAX_DIM, SINGLE_PIN_MINIMAP_QUALITY);
      const minimapRatio = Math.min(rightW / minimapData.width, minimapBoxH / minimapData.height);
      const minimapW = minimapData.width * minimapRatio;
      const minimapH = minimapData.height * minimapRatio;
      const minimapImgX = rightX + (rightW - minimapW) / 2;
      const minimapImgY = columnsStartY + (minimapBoxH - minimapH) / 2;
      doc.addImage(minimapData.dataUrl, "JPEG", minimapImgX, minimapImgY, minimapW, minimapH);
      const minimapMarkerX = minimapImgX + ((pin.x ?? 50) / 100) * minimapW;
      const minimapMarkerY = minimapImgY + ((pin.y ?? 50) / 100) * minimapH;
      doc.setFillColor(255, 255, 255);
      doc.circle(minimapMarkerX, minimapMarkerY, 3, "F");
      doc.setFillColor(...rgb);
      doc.circle(minimapMarkerX, minimapMarkerY, 2, "F");

      // 2. Detail-Zoom — gezoomter Ausschnitt (siehe cropImageDataUrl) mit vollem
      // Pin-Marker (Blickrichtungs-Sektor, Kreis, Nummer); zeigt in der Originalauflösung
      // des Grundrisses auch dort vorhandene Raumbeschriftungen/Achsraster.
      const cropped = await cropImageDataUrl(imgData.dataUrl, (pin.x ?? 50) / 100, (pin.y ?? 50) / 100, SINGLE_PIN_PLAN_CROP_RATIO);
      const detailRatio = Math.min(rightW / cropped.width, detailBoxH / cropped.height);
      const detailW = cropped.width * detailRatio;
      const detailH = cropped.height * detailRatio;
      const detailImgX = rightX + (rightW - detailW) / 2;
      const detailImgY = detailY + (detailBoxH - detailH) / 2;
      doc.addImage(cropped.dataUrl, "JPEG", detailImgX, detailImgY, detailW, detailH);
      const markerX = detailImgX + cropped.pinRatioX * detailW;
      const markerY = detailImgY + cropped.pinRatioY * detailH;
      drawPdfViewCone(doc, markerX, markerY, pin.angle, rgb);
      doc.setFillColor(...rgb);
      doc.circle(markerX, markerY, 3, "F");
      doc.setFontSize(7);
      bold();
      doc.setTextColor(255, 255, 255);
      doc.text(String(exportNumber), markerX, markerY + 1, { align: "center" });
      inkColor();
    } catch (err) {
      console.error("Grundriss konnte nicht in den Einzel-PDF-Export geladen werden:", err);
      drawPlanPlaceholder("Grundriss nicht verfügbar", columnsStartY, minimapBoxH);
      drawPlanPlaceholder(["Grundriss konnte nicht geladen werden", "(CAD-Format oder Ladefehler)."], detailY, detailBoxH);
    }
  } else {
    drawPlanPlaceholder("Kein Grundriss zugeordnet.", columnsStartY, minimapBoxH);
    drawPlanPlaceholder("Kein Grundriss zugeordnet.", detailY, detailBoxH);
  }
  doc.setFontSize(7.5);
  mutedColor();
  doc.text(`Übersicht · ${floor?.name || "–"}`, rightX, columnsStartY + minimapBoxH + 4);
  doc.text(`Detail-Zoom · ${plan?.name || "–"}`, rightX, detailY + detailBoxH + 4);
  inkColor();
  const rightColumnBottom = detailY + detailBoxH + 7;

  // ---- Linke Spalte — Stammdaten, vollständiger Kommentar, darunter das Mängelfoto. ----
  let dy = columnsStartY;
  let activePageWidth = pageWidth;
  let activePageHeight = pageHeight;
  const field = (label, value) => {
    doc.setFontSize(7.5);
    bold();
    mutedColor();
    doc.text(label.toUpperCase(), margin, dy);
    dy += 4.3;
    doc.setFontSize(10);
    normal();
    inkColor();
    const lines = doc.splitTextToSize(String(value ?? "–"), leftW);
    doc.text(lines, margin, dy);
    dy += lines.length * 4.6 + 3.6;
  };
  field("Projekt", project?.name);
  field("Etage", floor?.name);
  field("Anschlussbezeichnung", rowValues.referenceCode);
  field("Gewerk", rowValues.trade);
  field("Bereich", rowValues.area);
  field("Erledigen durch", rowValues.assignedTo);

  doc.setFontSize(7.5);
  bold();
  mutedColor();
  doc.text("KOMMENTAR", margin, dy);
  dy += 4.3;
  doc.setFontSize(9.5);
  normal();
  inkColor();
  // Vollständiger Kommentartext ohne Kürzung, mit derselben Fortsetzungsseiten-
  // Sicherung wie im Geschoss-Export (siehe generateFloorPinsTablePdf) — bei einem
  // Einzel-Pin-Schnellexport in der Praxis so gut wie nie relevant, aber auch hier
  // wird bewusst nichts stillschweigend abgeschnitten.
  const commentLines = doc.splitTextToSize(rowValues.comment, leftW);
  let commentY = dy;
  // Merkt sich, ob überhaupt ein Seitenumbruch stattgefunden hat (nur bei einem
  // ungewöhnlich langen Kommentar) — die rechte Spalte (Minimap + Detail-Zoom) wurde
  // bereits vollständig auf SEITE 1 gezeichnet; nach einem Umbruch bezieht sich
  // rightColumnBottom also auf eine andere Seite und darf für die Fußzeilen-Position
  // der AKTUELLEN Seite nicht mehr herangezogen werden (siehe contentBottom unten).
  let pagedBroke = false;
  for (const line of commentLines) {
    if (commentY > activePageHeight - margin) {
      doc.addPage("a4", "portrait");
      activePageWidth = doc.internal.pageSize.getWidth();
      activePageHeight = doc.internal.pageSize.getHeight();
      commentY = margin;
      pagedBroke = true;
    }
    doc.text(line, margin, commentY);
    commentY += 4.6;
  }

  // ---- Mängelfoto — direkt unter dem Kommentar in der linken Spalte (Anforderung:
  // Stammdaten + Foto zusammen linksbündig). Läuft ggf. auf die vom Kommentar bereits
  // begonnene Fortsetzungsseite mit, statt eine eigene neue Seite zu erzwingen — nur
  // wenn selbst auf einer frischen Seite kein Platz mehr wäre, wird zusätzlich
  // umbrochen (bei einem normal langen Kommentar in der Praxis nie der Fall). ----
  const photos = pin.pin_photos || [];
  const photoBoxH = Math.min(58, leftW * 0.5);
  if (commentY + 6 + photoBoxH > activePageHeight - margin && commentY > margin) {
    doc.addPage("a4", "portrait");
    activePageWidth = doc.internal.pageSize.getWidth();
    activePageHeight = doc.internal.pageSize.getHeight();
    commentY = margin;
    pagedBroke = true;
  }
  const photoBoxY = commentY + 6;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, photoBoxY, leftW, photoBoxH, 2, 2, "FD");
  let photoColumnBottom = photoBoxY + photoBoxH;
  if (photos.length > 0) {
    try {
      const rawImgData = await loadImageAsDataUrl(photos[0].photo_url);
      const imgData = await compressImageDataUrl(rawImgData.dataUrl, PDF_PHOTO_MAX_WIDTH, PDF_PHOTO_MAX_HEIGHT, PDF_PHOTO_JPEG_QUALITY);
      const ratio = Math.min(leftW / imgData.width, photoBoxH / imgData.height);
      const w = imgData.width * ratio;
      const h = imgData.height * ratio;
      doc.addImage(imgData.dataUrl, "JPEG", margin + (leftW - w) / 2, photoBoxY + (photoBoxH - h) / 2, w, h);
    } catch (err) {
      console.error("Foto konnte nicht in den Einzel-PDF-Export geladen werden:", err);
      doc.setFontSize(8.5);
      mutedColor();
      doc.text("Foto konnte nicht geladen werden.", margin + leftW / 2, photoBoxY + photoBoxH / 2, { align: "center" });
      inkColor();
    }
    if (photos.length > 1) {
      doc.setFontSize(7.5);
      mutedColor();
      doc.text(`+ ${photos.length - 1} weitere(s) Foto(s) im Pin bzw. Geschoss-Export.`, margin, photoColumnBottom + 4, { maxWidth: leftW });
      inkColor();
      photoColumnBottom += 7;
    }
  } else {
    doc.setFontSize(8.5);
    mutedColor();
    doc.text("Kein Bild vorhanden.", margin + leftW / 2, photoBoxY + photoBoxH / 2, { align: "center" });
    inkColor();
  }

  // ---- Fußzeile — sitzt im Normalfall fest nahe am unteren Seitenrand; rutscht nur
  // nach unten mit, falls der Inhalt (i.d.R. nur bei sehr langem Kommentar) diese
  // Position bereits überschritten hat. rightColumnBottom fließt NUR ein, solange kein
  // Seitenumbruch stattfand — sonst bezieht es sich auf Seite 1, die aktuelle Seite
  // aber ist bereits eine andere (siehe pagedBroke oben). ----
  const contentBottom = pagedBroke ? photoColumnBottom : Math.max(photoColumnBottom, rightColumnBottom);
  const footerLineY = Math.max(contentBottom + 4, activePageHeight - 16);
  if (footerLineY < activePageHeight - 6) {
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, footerLineY, activePageWidth - margin, footerLineY);
    doc.setFontSize(7.5);
    mutedColor();
    doc.text(
      `Einzel-Export erstellt am ${formatDateTime(new Date().toISOString())} von ${generatedBy || "–"} — vollständiger Verlauf, alle Fotos und weitere Mängel dieser Grundrissskizze im Geschoss-Export.`,
      margin,
      footerLineY + 4,
      { maxWidth: activePageWidth - margin * 2 }
    );
    inkColor();
  }

  const fileName = `${sanitizeFileNamePart(project.name)}_Pin${exportNumber}_${sanitizeFileNamePart(rowValues.topic)}_${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`;
  doc.save(fileName);
  return fileName;
}

// ----------------------------------------------------------------------------------
// GEWERKE (TRADES) — Supabase Data Layer
// Setzt eine Tabelle "trades" (id, name, active, sort_order) voraus — siehe
// supabase_schema_v3_trades_and_users.sql. Lese-Policy ist öffentlich (auch für
// Gäste, damit Gewerke-Badges auch ohne Login sichtbar sind), Schreib-Policies sind
// wie beim übrigen Schema auf "authenticated" beschränkt.
// ----------------------------------------------------------------------------------

async function seedDefaultTrades() {
  const payload = DEFAULT_TRADES.map((name, idx) => ({ name, active: true, sort_order: idx }));
  const { data, error } = await supabase.from("trades").insert(payload).select();
  if (error) throw error;
  return data ?? [];
}

// Lädt alle Gewerke sortiert nach sort_order. Ist die Tabelle beim allerersten
// Aufruf noch leer, wird automatisch der Standard-Katalog (DEFAULT_TRADES) angelegt
// — danach läuft die Verwaltung ausschließlich über TradesAdminModal.
async function fetchTrades() {
  const { data, error } = await supabase.from("trades").select("*").order("sort_order", { ascending: true });
  if (error) throw error;
  if ((data ?? []).length === 0) {
    return await seedDefaultTrades();
  }
  return data;
}

async function createTrade(name, sortOrder) {
  const { data, error } = await supabase
    .from("trades")
    .insert({ name, active: true, sort_order: sortOrder })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateTrade(tradeId, fields) {
  const { data, error } = await supabase.from("trades").update(fields).eq("id", tradeId).select().single();
  if (error) throw error;
  return data;
}

// Persistiert eine neue Reihenfolge: orderedTrades muss bereits in der gewünschten
// Zielreihenfolge vorliegen, sort_order wird darauf basierend 0..n-1 neu vergeben.
async function reorderTrades(orderedTrades) {
  const results = await Promise.all(
    orderedTrades.map((t, idx) => supabase.from("trades").update({ sort_order: idx }).eq("id", t.id))
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

// ----------------------------------------------------------------------------------
// BENUTZERVERWALTUNG — Supabase Data Layer
// Setzt eine Tabelle "app_users" voraus — siehe supabase_schema_v3_trades_and_users.sql.
// Bewusst getrennt von Supabase Auth (auth.users): app_users bildet das fachliche
// Benutzerprofil (Name, Kürzel, Rolle, Projektzuordnung) ab und wird über die
// E-Mail-Adresse mit der angemeldeten Supabase-Auth-Session verknüpft (siehe
// currentAppUser in App()). Lese-Policy ist auf "authenticated" beschränkt, da die
// Liste E-Mail-Adressen enthält.
// ----------------------------------------------------------------------------------

async function fetchUsers() {
  const { data, error } = await supabase.from("app_users").select("*").order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function createUser(fields) {
  const payload = {
    name: fields.name,
    kuerzel: fields.kuerzel || "",
    email: fields.email,
    role: fields.role,
    active: fields.active,
    project_ids: fields.project_ids || [],
    permissions: fields.permissions || {},
  };
  const { data, error } = await supabase.from("app_users").insert(payload).select().single();
  if (error) throw error;
  return data;
}

async function updateUser(userId, fields) {
  const { data, error } = await supabase.from("app_users").update(fields).eq("id", userId).select().single();
  if (error) throw error;
  return data;
}

// ----------------------------------------------------------------------------------
// SMALL COMPONENTS
// ----------------------------------------------------------------------------------

// Wiederverwendetes Formular-Feld-Label — spart die andernorts x-fach wiederholte
// Tailwind-Klassenkombination, ohne am gerenderten Markup etwas zu ändern (reines
// Refactoring, identisches <label>-Element mit identischen Klassen wie zuvor inline).
function FieldLabel({ children }) {
  return <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">{children}</label>;
}

function CadBadge({ ext = "dwg", className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-[#FF2A00] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow ${className}`}>
      <Ruler size={11} /> {ext}
    </span>
  );
}

// Kennzeichnet SVG-Grundrisse in der Planansicht als das, was sie technisch sind:
// echtes Vektor-Rendering (siehe SvgPlanCanvas) statt eines Raster-Bilds/-Canvas —
// bleibt bei JEDEM Zoomfaktor mathematisch gestochen scharf.
function VectorPlanBadge({ className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow ${className}`}>
      <ZoomIn size={11} /> Vektor
    </span>
  );
}

function ProjectStatusBadge({ status }) {
  const meta = PROJECT_STATUS_META[status] || PROJECT_STATUS_META["Geplant"];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.bg} ${meta.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} /> {status}
    </span>
  );
}

function TradeBadge({ trade, size = "sm" }) {
  if (!trade) return <span className="text-[11px] text-slate-400">Kein Gewerk zugeordnet</span>;
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${pad} ${
        trade.active ? "bg-red-50 text-[#FF2A00] ring-1 ring-inset ring-red-200" : "bg-slate-100 text-slate-400 ring-1 ring-inset ring-slate-200"
      }`}
    >
      <Wrench size={11} /> {trade.name}
      {!trade.active && " (inaktiv)"}
    </span>
  );
}

function RoleBadge({ role }) {
  const meta = ROLE_META[role] || ROLE_META["Projektmitarbeiter"];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${meta.badgeClass}`}>
      <ShieldCheck size={12} /> {meta.label}
    </span>
  );
}

function ActiveStatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
      }`}
    >
      {active ? <Eye size={12} /> : <EyeOff size={12} />} {active ? "Aktiv" : "Inaktiv"}
    </span>
  );
}

// Vollständige Bearbeitungshistorie eines Pins (Abschnitt 3) — neueste Aktion zuerst.
// Wiederverwendet im Pin-Modal; dieselben Einträge fließen (chronologisch sortiert)
// auch in die Detaildokumentation des PDF-Exports (Abschnitt 5.2).
function PinActivityHistory({ entries }) {
  const sorted = [...(entries || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  if (sorted.length === 0) return <p className="text-xs text-slate-400">Noch kein Verlauf vorhanden.</p>;
  return (
    <ul className="space-y-2.5">
      {sorted.map((entry) => {
        const meta = PIN_ACTIVITY_META[entry.action] || { label: entry.action, icon: History };
        const Icon = meta.icon;
        return (
          <li key={entry.id} className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Icon size={11} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-700">{entry.detail || meta.label}</p>
              <p className="text-[11px] text-slate-400">
                {formatDateTime(entry.created_at)} · {entry.actor_name || entry.actor_email || "Unbekannt"}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function countPins(floors) {
  const all = (floors || []).flatMap((f) => f.pins || []);
  return {
    total: all.length,
    open: all.filter((p) => p.status === "offen").length,
  };
}

// Anzahl der noch offenen, als hoch/dringend eingestuften Mängel-Pins eines Projekts
// (Status "offen" UND Priorität "hoch") — für den Dringlichkeits-Indikator und die
// "Nach Dringlichkeit"-Sortierung in ProjectOverview. Bewusst eine eigene, schmale
// Hilfsfunktion statt einer erneuten Erweiterung von countPins(), die zuletzt bewusst
// wieder auf total/open zurückgesetzt wurde — hier wird ausschließlich diese eine,
// fest definierte Kombination gebraucht.
function countUrgentPins(floors) {
  return (floors || []).flatMap((f) => f.pins || []).filter((p) => p.status === "offen" && p.priority === "hoch").length;
}

function LoadingBlock({ label = "Wird geladen…" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
      <Loader2 size={28} className="animate-spin" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

function ErrorBanner({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-b border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700 sm:px-6">
      <span className="flex items-center gap-2">
        <AlertCircle size={16} className="shrink-0" /> {message}
      </span>
      <button onClick={onClose} className="shrink-0 rounded p-1 text-rose-500 transition hover:bg-rose-100">
        <X size={15} />
      </button>
    </div>
  );
}

// Markentypografie "REISNER x FRANK" — vollständig als Inline-SVG/CSS nachgebaut,
// bewusst OHNE jedes <img src="..."> auf eine externe Bilddatei: ein fehlschlagender
// Bild-Request (falscher Pfad, fehlende Datei im Deployment, Offline-Fall auf der
// Baustelle) kann diese Wortmarke damit grundsätzlich nicht mehr treffen. Wird sowohl
// im Splash Screen (großformatig) als auch im App-Header (kompakt) verwendet — ein
// einziger Bauplan für beide Stellen, siehe tone/size unten.
//
// BrandX: das "x" zwischen REISNER und FRANK als eigenständige, kleine Kreuz-Marke
// aus zwei sich kreuzenden, abgerundeten Balken (SVG, füllt sich über currentColor
// mit derselben Farbe wie der umgebende Text — folgt also automatisch tone).
function BrandX({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="2" y="10.4" width="20" height="3.2" rx="1.6" fill="currentColor" transform="rotate(45 12 12)" />
      <rect x="2" y="10.4" width="20" height="3.2" rx="1.6" fill="currentColor" transform="rotate(-45 12 12)" />
    </svg>
  );
}

// tone 'light' = weiße Schrift/Kreuzmarke (für die rote Splash-Fläche und den
// dunkelroten Header), tone 'brand' = Schrift/Kreuzmarke im exakten Markenrot
// #FF2A00 (für die weiße Splash-Fläche). size steuert ausschließlich die
// Textgröße — Layout, Proportionen und Kreuzmarke bleiben in jeder Größe identisch.
function BrandLogotype({ tone = "light", size = "md" }) {
  const toneClass = tone === "brand" ? "text-[#FF2A00]" : "text-white";
  const sizeClass =
    size === "lg" ? "gap-2.5 text-3xl sm:text-4xl" : size === "sm" ? "gap-1 text-xs" : "gap-1.5 text-sm";
  return (
    <span className={`inline-flex items-center whitespace-nowrap font-black uppercase tracking-wider ${toneClass} ${sizeClass}`}>
      <span>Reisner</span>
      <BrandX className="h-[0.55em] w-[0.55em] shrink-0" />
      <span>Frank</span>
    </span>
  );
}

// Branded Splash Screen ("REISNER x FRANK") — zweiphasiger Logo-Crossfade beim
// App-Start. Vollständig eigenständige Komponente mit eigenem State/Timing,
// damit App() selbst unverändert und übersichtlich bleibt:
//   Phase 1 "red"    (0.0–1.2s): vollflächige Markenrot-Fläche mit weißer
//                     Wortmarke (BrandLogotype tone="light").
//   Phase 2 "white"  (1.2–2.2s): weiches CSS-Crossfade (opacity, 1000ms
//                     ease-in-out) auf eine weiße Fläche mit der Wortmarke in
//                     Markenrot (tone="brand").
//   Phase 3 "fading" (2.2–2.8s): der gesamte Container blendet aus und gibt
//                     Zeigerereignisse sofort frei (pointer-events: none),
//                     damit das Haupt-UI schon während des Ausblendens
//                     bedienbar ist.
//   Phase 4 "hidden": Komponente entfernt sich vollständig aus dem
//                     Rendering-Baum (return null) — kein Rest-DOM, keine
//                     Interaktionsblockade, keine Performance-Last mehr.
// Da beide "Bilder" reines, sofort verfügbares Inline-SVG/CSS sind, entfällt jedes
// Preloading — es gibt keinen Netzwerk-Request, der fehlschlagen oder verzögern könnte.
function SplashScreen({ onFinished }) {
  const [splashState, setSplashState] = useState("red"); // 'red' | 'white' | 'fading' | 'hidden'

  // Zeitachse exakt wie spezifiziert: 1.2s / 2.2s / 2.8s ab Mount. Aufräumen
  // der Timer beim Unmount verhindert setState-Aufrufe auf einer bereits
  // entfernten Komponente (z. B. bei sehr schnellem Reload während des Tests).
  useEffect(() => {
    const toWhite = setTimeout(() => setSplashState("white"), 1200);
    const toFading = setTimeout(() => setSplashState("fading"), 2200);
    const toHidden = setTimeout(() => {
      setSplashState("hidden");
      onFinished?.();
    }, 2800);
    return () => {
      clearTimeout(toWhite);
      clearTimeout(toFading);
      clearTimeout(toHidden);
    };
    // onFinished ist bei jedem Aufrufer stabil (App übergibt keine Prop) —
    // bewusst nur einmalig beim Mounten eingerichtet, damit die Zeitachse
    // nicht durch Re-Renders des Elternteils zurückgesetzt wird.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (splashState === "hidden") return null;

  const isFading = splashState === "fading";
  const showWhite = splashState === "white" || splashState === "fading";

  // WICHTIG gegen Durchschimmern der Hauptanwendung: der äußere Container trägt
  // selbst eine deckende weiße Grundfläche (bg-white), die während der GESAMTEN
  // Phasen 1+2 unverändert 100% blickdicht bleibt — nur ihre eigene, übergeordnete
  // opacity (isFading) blendet in Phase 3 als Ganzes aus. Die rote Ebene liegt
  // darüber und verdeckt diese weiße Grundfläche in Phase 1 vollständig; beim
  // Crossfade in Phase 2 blendet AUSSCHLIESSLICH die rote Ebene aus (opacity
  // 1→0) und gibt dabei stets nur die darunterliegende, selbst undurchsichtige
  // weiße Fläche frei — niemals die dahinterliegende App. So ist zu jedem
  // Zeitpunkt von Phase 1 und 2 lückenlos entweder Rot oder Weiß sichtbar.
  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden bg-white"
      style={{
        opacity: isFading ? 0 : 1,
        pointerEvents: isFading ? "none" : "auto",
        transitionProperty: "opacity",
        transitionDuration: "600ms",
        transitionTimingFunction: "ease-in-out",
      }}
      aria-hidden="true"
    >
      {/* Phase 2 — Wortmarke in Markenrot, blendet auf der (bereits deckend weißen)
          Container-Grundfläche ein; braucht keinen eigenen Hintergrund. */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          opacity: showWhite ? 1 : 0,
          transitionProperty: "opacity",
          transitionDuration: "1000ms",
          transitionTimingFunction: "ease-in-out",
        }}
      >
        <BrandLogotype tone="brand" size="lg" />
      </div>
      {/* Phase 1 — vollflächig deckende Markenrot-Ebene mit weißer Wortmarke, liegt
          über der weißen Grundfläche und der Phase-2-Ebene und verdeckt beide
          vollständig, solange sie selbst opak ist. */}
      <div
        className="absolute inset-0 flex items-center justify-center bg-[#FF2A00]"
        style={{
          opacity: showWhite ? 0 : 1,
          transitionProperty: "opacity",
          transitionDuration: "1000ms",
          transitionTimingFunction: "ease-in-out",
        }}
      >
        <BrandLogotype tone="light" size="lg" />
      </div>
    </div>
  );
}

// Kompakter Verbindungs-/Synchronisations-Status in der Kopfzeile (Abschnitt 15.3):
// grün = online und nichts ausstehend ("Online"), bernstein/orange = offline
// ("Offline (X ausstehend)", Änderungen werden lokal gespeichert), blau-blinkend =
// online, aber die Warteschlange wird gerade aktiv abgearbeitet
// ("Synchronisiere…") bzw. wartet noch auf den nächsten Synchronisationslauf.
// animate-pulse (statt nur des rotierenden Icons) erzeugt das angeforderte
// "blinkende" Erscheinungsbild des gesamten Status-Badges während der Synchronisation.
function OfflineStatusIndicator({ online, pendingCount, syncing }) {
  if (!online) {
    return (
      <span
        title={pendingCount > 0 ? `${pendingCount} Änderung(en) werden lokal gespeichert und automatisch synchronisiert, sobald wieder eine Verbindung besteht.` : "Keine Internetverbindung — Daten werden lokal gespeichert."}
        className="inline-flex items-center gap-1.5 rounded-md bg-amber-900/40 px-2.5 py-1.5 font-semibold text-amber-300"
      >
        <WifiOff size={13} />
        <span className="hidden sm:inline">{pendingCount > 0 ? `Offline (${pendingCount} ausstehend)` : "Offline · wird lokal gespeichert"}</span>
      </span>
    );
  }
  if (syncing || pendingCount > 0) {
    return (
      <span
        title="Offline erfasste Änderungen werden mit der Datenbank synchronisiert."
        className={`inline-flex items-center gap-1.5 rounded-md bg-blue-900/40 px-2.5 py-1.5 font-semibold text-blue-300 ${syncing ? "animate-pulse" : ""}`}
      >
        {syncing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
        <span className="hidden sm:inline">{syncing ? "Synchronisiere…" : `${pendingCount} ausstehend`}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-2.5 py-1.5 font-semibold text-emerald-400">
      <Wifi size={13} />
      <span className="hidden sm:inline">Online</span>
    </span>
  );
}

// ----------------------------------------------------------------------------------
// CAD / DWG / DXF BLUEPRINT-DARSTELLUNG
// ----------------------------------------------------------------------------------
// Echte .dwg/.dxf-Dateien können im Browser nicht nativ gerendert werden (proprietäres
// Binär- bzw. Vektorformat). Für eine produktive Anwendung würde man die Datei serverseitig
// z.B. mit der ODA File Converter API, dem Autodesk Platform Services "Model Derivative"-API
// oder einer Bibliothek wie dxf-parser + eigenem SVG-Renderer in eine anzeigbare Rasterebene
// (PNG/SVG) konvertieren und diese URL statt dieser Platzhalter-Darstellung verwenden.
// Bis dahin zeigen wir eine generierte, technisch anmutende Blueprint-Vorschau, auf der
// Pins exakt wie bei Bild-/PDF-Grundrissen über Prozent-Koordinaten platziert werden können.
const CadBlueprintPlan = forwardRef(function CadBlueprintPlan({ fileName, ext = "dwg" }, ref) {
  return (
    <div
      ref={ref}
      className="relative aspect-[4/3] w-full overflow-hidden bg-[#0b1220] select-none"
      style={{
        backgroundImage:
          "linear-gradient(rgba(56,189,248,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.14) 1px, transparent 1px), linear-gradient(rgba(56,189,248,0.28) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.28) 1px, transparent 1px)",
        backgroundSize: "20px 20px, 20px 20px, 100px 100px, 100px 100px",
      }}
    >
      {/* Vektor-Linien / Wände / Symbole als stilisierte CAD-Zeichnung */}
      <svg viewBox="0 0 400 300" className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <g stroke="#7dd3fc" strokeWidth="1.4" fill="none" opacity="0.9">
          <rect x="30" y="30" width="340" height="240" />
          <line x1="30" y1="150" x2="220" y2="150" />
          <line x1="220" y1="30" x2="220" y2="270" />
          <line x1="130" y1="150" x2="130" y2="270" />
          <line x1="220" y1="90" x2="370" y2="90" />
        </g>
        {/* Türsymbole (Viertelkreis-Bögen) */}
        <g stroke="#38bdf8" strokeWidth="1" fill="none" opacity="0.75">
          <path d="M 130 150 A 30 30 0 0 1 160 180" />
          <path d="M 220 90 A 24 24 0 0 1 244 114" />
          <path d="M 30 150 A 22 22 0 0 0 52 172" />
        </g>
        {/* Bemaßungslinien mit Ticks */}
        <g stroke="#94a3b8" strokeWidth="0.75" opacity="0.6">
          <line x1="30" y1="284" x2="370" y2="284" />
          <line x1="30" y1="279" x2="30" y2="289" />
          <line x1="200" y1="279" x2="200" y2="289" />
          <line x1="370" y1="279" x2="370" y2="289" />
        </g>
        <text x="180" y="298" fill="#64748b" fontSize="8" fontFamily="monospace">
          8,40 m
        </text>
      </svg>

      {/* Kompass / Nordpfeil */}
      <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-sky-400/40 bg-slate-900/70 text-sky-300 shadow-inner">
        <Compass size={18} />
      </div>

      {/* Mittiges CAD-Symbol */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sky-300/80">
        <Ruler size={30} strokeWidth={1.3} />
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300/70">CAD / {ext.toUpperCase()}-Grundriss</span>
      </div>

      {/* Titel-Stempel unten rechts, wie ein CAD-Schriftfeld */}
      <div className="absolute bottom-3 right-3 rounded border border-sky-400/30 bg-slate-950/80 px-2.5 py-1.5 text-right font-mono text-[10px] leading-tight text-sky-300/80">
        <div className="truncate max-w-[160px] font-semibold text-sky-200">{fileName || `unbenannt.${ext}`}</div>
        <div className="text-sky-400/60">CAD-Vorschau · Konvertierung erforderlich</div>
      </div>
    </div>
  );
});

// ----------------------------------------------------------------------------------
// PDF-GRUNDRISS — natives SVG-Vektor-Rendering via pdf.js' SVGGraphics-Backend
// ----------------------------------------------------------------------------------
// <embed type="application/pdf"> überlässt das Rendering dem eingebauten PDF-Viewer
// des Browsers; skaliert man den umgebenden Container per CSS-Transform (unser Zoom),
// wird nur das bereits gerenderte Bild vergrößert — die Schrift wirkt dadurch schnell
// unscharf/verpixelt. Frühere Versionen dieser Komponente haben deshalb mit
// Canvas-Rasterung gearbeitet (einmalige Übersichtsauflösung + nachgerendertem,
// ausschnittsweise hochauflösendem "Schärfe-Layer" nach Zoom-Ende) — das reduzierte
// Unschärfe und Speicherbedarf erheblich, blieb aber technisch ein Bitmap, das
// zwischen zwei Renderschritten kurzzeitig sichtbar gestreckt wurde. Ab hier wird die
// PDF-Seite stattdessen NICHT MEHR gerastert, sondern von pdf.js direkt in eine
// SVG-Baumstruktur (<path>, <text>, <g>, …) umgewandelt und als echtes DOM-<svg>-
// Element eingebettet — exakt wie beim nativen .svg-Grundriss-Upload (siehe
// SvgPlanCanvas weiter unten). Das Zoomen der äußeren "Bühne" (CSS transform:
// scale(...), siehe FloorPlanView) wirkt danach auf echte Vektorpfade statt auf ein
// Bitmap: es gibt zu keinem Zeitpunkt mehr ein Pixel-Raster, das gestreckt werden
// könnte. Linien, Bemaßungen und Texte bleiben dadurch bei JEDEM Zoomfaktor exakt
// scharf, ganz ohne Re-Rendering, Debounce oder Viewport-Cropping — der "White
// Screen"/Memory-Exhaustion-Bug ist damit strukturell ausgeschlossen, nicht nur
// eingedämmt, weil zu keinem Zeitpunkt ein großformatiges Bitmap im Speicher liegt.
//
// Wichtiger Hinweis zur Zukunftssicherheit: pdf.js' SVG-Backend (window.pdfjsLib.
// SVGGraphics) ist in der hier fest eingebundenen Version 3.11.174 (siehe
// PDFJS_VERSION) noch Teil des Browser-Bundles — geprüft direkt am ausgelieferten
// pdf.min.js dieser Version. In neueren pdf.js-Hauptversionen wurde dieses Backend
// entfernt (siehe z. B. mozilla/pdf.js Issue #19417, "SVG backend no longer
// available?"). Ein künftiges Update von PDFJS_VERSION/PDFJS_CDN_SOURCES muss daher
// vorher gegen die SVGGraphics-Verfügbarkeit der neuen Version geprüft werden,
// andernfalls fällt der Renderer auf die <embed>-Darstellung zurück.
// Die Position der Pins ist von alldem unberührt, sie bleiben weiterhin
// ausschließlich über Prozent-Koordinaten relativ zur äußeren "Bühne" verankert
// (siehe FloorPlanView).
//
// pdf.js wird bewusst NICHT als npm-Paket importiert (kein "import pdfjs-dist" bzw.
// "import(...)") — Vite versucht ein solches Modul im eigenen Projekt aufzulösen und
// bricht mit "Failed to resolve import" ab, solange das Paket nicht als Abhängigkeit
// installiert ist. Stattdessen wird die fertig gebündelte Browser-Version per
// <script>-Tag von einer CDN nachgeladen und hängt sich dabei selbst als globale
// Variable window.pdfjsLib ein — funktioniert dadurch unabhängig von der Bundler-
// Konfiguration des Projekts. loadPdfJs() versucht dafür mehrere CDN-Quellen der
// Reihe nach (PDFJS_CDN_SOURCES) — schlägt eine Quelle fehl (Netzwerk, Firewall,
// CDN-Ausfall), wird automatisch die nächste versucht, bevor endgültig aufgegeben
// wird. Schlägt zusätzlich der dedizierte Web-Worker selbst fehl (z. B. weil eine
// restriktive Content-Security-Policy das Laden eines Workers von einer fremden
// Origin blockiert, während das reguläre <script>-Tag durchgelassen wird), fängt
// loadPdfDocument() genau diesen Fall ab und lädt das Dokument ein zweites Mal mit
// disableWorker:true — pdf.js rendert dann synchron im Hauptthread weiter, mit
// identischer Rendering-Pipeline und Bildqualität, nur ohne separaten Worker. Erst
// wenn sämtliche CDN-Quellen UND beide Lademodi fehlschlagen, fällt die Komponente
// auf die bisherige <embed>-Darstellung zurück, damit die Etage trotzdem nutzbar
// bleibt und die App in keinem Fall abstürzt.
const PDFJS_VERSION = "3.11.174";
const PDFJS_CDN_SOURCES = [
  {
    lib: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`,
    worker: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`,
  },
  {
    lib: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.js`,
    worker: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`,
  },
  {
    lib: `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.js`,
    worker: `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`,
  },
];

function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Skript konnte nicht geladen werden: ${src}`));
    document.head.appendChild(script);
  });
}

let pdfjsLoadPromise = null;
function loadPdfJs() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("pdf.js benötigt eine Browser-Umgebung."));
  }
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (pdfjsLoadPromise) return pdfjsLoadPromise;

  pdfjsLoadPromise = (async () => {
    let lastError = null;
    for (const source of PDFJS_CDN_SOURCES) {
      try {
        await loadScriptOnce(source.lib);
        if (!window.pdfjsLib) throw new Error("pdf.js-Script wurde geladen, aber window.pdfjsLib ist nicht verfügbar.");
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = source.worker;
        return window.pdfjsLib;
      } catch (err) {
        lastError = err;
        console.warn(`pdf.js-Quelle fehlgeschlagen (${source.lib}), versuche nächste CDN…`, err);
      }
    }
    pdfjsLoadPromise = null;
    throw lastError || new Error("Alle pdf.js-CDN-Quellen sind fehlgeschlagen.");
  })();

  return pdfjsLoadPromise;
}

// Lädt das PDF-Dokument über den regulären (Web-Worker-basierten) Pfad; schlägt das
// spezifisch am Worker fehl (z. B. CSP-Blockade eines fremden Worker-Origins), wird
// automatisch ein zweiter Versuch ohne dedizierten Worker unternommen (Hauptthread-
// Rendering) — siehe Erläuterung oben.
//
// disableAutoFetch: true + disableStream: false aktivieren pdf.js' progressives
// Nachladen über HTTP-Range-Requests (setzt voraus, dass der Server der PDF-URL
// Range-Requests unterstützt — bei allen über Supabase Storage ausgelieferten
// Grundrissen der Fall, siehe supabase_schema.sql/Bucket "floor-plans"): pdf.js holt
// dadurch bei einem 5-10MB-Plan nicht mehr die komplette Datei auf einmal, sondern
// zunächst nur den für die erste Seite tatsächlich benötigten Byte-Bereich, weitere
// Seiten/Ressourcen erst bei Bedarf. disableAutoFetch verhindert dabei zusätzlich das
// eifrige Vorabladen des GESAMTEN restlichen Dokuments im Hintergrund, das pdf.js mit
// aktiviertem Streaming sonst von sich aus anstoßen würde. Ehrlicher Hinweis: diese
// App zeigt ohnehin ausschließlich Seite 1 eines Plans an (siehe pdf.getPage(1) unten)
// — der Effekt betrifft hier also vor allem den initialen Ladezeitpunkt bei großen,
// mehrseitigen PDFs, nicht ein Nachladen weiterer Seiten zur Laufzeit.
async function loadPdfDocument(pdfjsLib, url) {
  try {
    return await pdfjsLib.getDocument({ url, disableAutoFetch: true, disableStream: false }).promise;
  } catch (err) {
    console.warn("PDF-Laden über Web-Worker fehlgeschlagen, Fallback auf Hauptthread-Rendering (disableWorker):", err);
    return await pdfjsLib.getDocument({ url, disableWorker: true, disableAutoFetch: true, disableStream: false }).promise;
  }
}

// Dreistufiger Absturzschutz für das PDF-Rendering: (1) Vektor via SVGGraphics —
// bevorzugt, mathematisch scharf, minimaler Speicherbedarf; (2) sichere, hart
// begrenzte Raster-Auflösung, falls (1) fehlschlägt, zu lange braucht oder die Seite
// zu komplex für eine sichere Vektor-Konvertierung ist; (3) <embed> als letzter,
// garantiert funktionierender Rückfall. Grund für Stufe 2: ein SVG-Baum ist zwar
// speicherseitig unproblematisch (keine Bitmap-Allokation), kann bei einem extrem
// detailreichen CAD-Export aber zehntausende <path>-Elemente enthalten — das kann den
// Browser beim Aufbau/Layout dieses DOM-Baums für mehrere Sekunden blockieren oder auf
// speicherschwachen Mobilgeräten sogar zum Tab-Absturz führen (derselbe sichtbare
// Effekt wie der frühere Canvas-Speicher-Crash, nur eine andere Ursache). Ein zu
// komplexes PDF bekommt deshalb statt eines potenziell hängenden Vektor-Renderings
// automatisch eine sichere, deutlich günstigere Raster-Darstellung.
const PDF_SVG_MAX_OPERATORS = 40000; // Heuristik, keine belastbare Browser-Spezifikation — bei Bedarf an echten Baustellen-Plänen nachjustieren.
const PDF_SVG_RENDER_TIMEOUT_MS = 6000;
// "Sicherer" Render-Maßstab für die Raster-Fallback-Stufe: an devicePixelRatio
// gekoppelt, aber hart gedeckelt — am Desktop weiterhin bei 3.0 (Fallback-Wert ohne
// bekannten devicePixelRatio: 2), auf Mobilgeräten strenger bei 2.0 (siehe
// getPdfSafeRenderDprCap/PDF_SAFE_RENDER_DPR_CAP_MOBILE unten). Gilt weiterhin nur
// für die Raster-Fallback-Stufe, die ohnehin nur für PDFs greift, bei denen bereits
// die "leichtere" Vektor-Stufe an ihre Grenzen kam (siehe PDF_SVG_MAX_OPERATORS).
const PDF_SAFE_RENDER_DPR_CAP_DESKTOP = 3.0;
// Auf Mobilgeräten (Bildschirmbreite < PDF_MOBILE_RENDER_BREAKPOINT_PX) wird die
// Obergrenze deutlich strenger gezogen als am Desktop: der Canvas-Speicherbedarf
// wächst mit dem QUADRAT des Skalierungsfaktors, ein Cap von 2.0 statt 3.0 senkt ihn
// also um (1 - (2.0/3.0)^2) ≈ 56% — mehr als die geforderten "über 50%". 2.0 ist
// bewusst das obere Ende der angeforderten Spanne von 1.5-2.0 gewählt, nicht das
// untere: es bleibt damit noch klar über der nativen Gerätedichte typischer
// Tablets/Smartphones (meist 2.0-3.0), sodass Baupläne auf dem Bildschirm weiterhin
// scharf wirken, während gleichzeitig der Speicher-/Absturzschutz für genau die
// Geräteklasse greift, auf der ein Tab-Absturz durch Speicherüberlauf am ehesten
// eintritt (siehe PDF_SAFE_MAX_CANVAS_DIM_PX_MOBILE-Kommentar unten zu iPads/Tablets).
const PDF_SAFE_RENDER_DPR_CAP_MOBILE = 2.0;
const PDF_MOBILE_RENDER_BREAKPOINT_PX = 768;

// Liefert die für das aktuelle Gerät geltende DPR-Obergrenze der Raster-Fallback-
// Stufe. window.innerWidth statt eines einmalig beim Laden ermittelten Werts, damit
// z. B. ein zur Laufzeit gedrehtes Tablet (Hoch-/Querformat) oder ein
// Fenster-Resize am Desktop stets die zum aktuellen Layout passende Grenze
// verwendet — wird ohnehin bei jedem Rendering-Aufruf neu ausgewertet, nie gecacht.
function getPdfSafeRenderDprCap() {
  if (typeof window === "undefined") return PDF_SAFE_RENDER_DPR_CAP_DESKTOP;
  return window.innerWidth < PDF_MOBILE_RENDER_BREAKPOINT_PX
    ? PDF_SAFE_RENDER_DPR_CAP_MOBILE
    : PDF_SAFE_RENDER_DPR_CAP_DESKTOP;
}
// Harte Obergrenze für die tatsächliche Canvas-Pixelbreite/-höhe dieser Fallback-
// Stufe — verhindert einen GPU-/RAM-Überlauf bei großformatigen Papiergrößen (A0/A1),
// unabhängig von Gerätedichte.
//
// BUGFIX "weißer Bildschirm beim Zoomen auf Mobilgeräten": 16384px war ursprünglich
// auf ausdrücklichen Wunsch von 8192px angehoben worden — genau das hat sich auf
// Mobilgeräten als Ursache des weißen Bildschirms bestätigt. iOS Safari und mobile
// Chrome-Varianten kappen ein <canvas> bei Überschreiten einer (je nach Gerät/
// Arbeitsspeicher unterschiedlichen, aber verbreitet bei rund 4096×4096px bzw.
// ~16,7 Megapixel Gesamtfläche liegenden) internen Grenze STILLSCHWEIGEND — ohne
// JS-Fehler, ohne Exception, das <canvas>-Element bleibt einfach leer/weiß stehen.
// Bei einem nicht-quadratischen A0/A1-Plan (Seitenverhältnis ca. 1,41:1) konnte die
// bisherige einheitliche 16384px-Grenze auf einem Tablet/Smartphone durchaus
// zusammen mit dem (seit der letzten Anforderung ohnehin schon auf max. 2.0
// begrenzten) mobilen DPR-Cap eine Fläche jenseits dieser gerätetypischen Grenze
// ergeben — genau das führt zum weißen Bildschirm. Die Grenze ist deshalb jetzt
// GERÄTEABHÄNGIG (siehe getPdfSafeMaxCanvasDimPx unten, gleicher Breakpoint wie beim
// DPR-Cap): am Desktop bleibt es bei 16384px (siehe PDF_SAFE_MAX_CANVAS_DIM_PX_DESKTOP,
// dort unproblematisch, siehe Speicherhinweis dort), auf Mobilgeräten strikt bei
// 4096px (PDF_SAFE_MAX_CANVAS_DIM_PX_MOBILE) — exakt der von iOS Safari historisch
// dokumentierten, sicheren Kantenlänge. Wird auf einem Mobilgerät über diese Grenze
// hinaus weitergezoomt, wird das Canvas NICHT weiter physisch vergrößert (siehe
// lastRasterClampedRef in PdfPlanCanvas) — die weitere Vergrößerung übernimmt
// ausschließlich die ohnehin schon vorhandene CSS-transform:scale(...) der äußeren
// "Bühne" (siehe FloorPlanView/contentRef), die für JEDEN Zoomfaktor unabhängig von
// der Canvas-Auflösung funktioniert. Der Plan wirkt jenseits dieser Schwelle beim
// Weiterzoomen dadurch etwas weicher (reines CSS-Hochskalieren statt einer schärferen
// Neuberechnung), bleibt aber sichtbar und stürzt nicht mehr auf Weiß ab — ein
// bewusster, im Bug-Report explizit so verlangter Kompromiss.
const PDF_SAFE_MAX_CANVAS_DIM_PX_DESKTOP = 16384;
// Ehrlicher Speicher-Hinweis nur für die Desktop-Grenze (auf Mobilgeräten greift ab
// sofort ohnehin die deutlich niedrigere PDF_SAFE_MAX_CANVAS_DIM_PX_MOBILE, siehe
// oben): bei einem nicht-quadratischen Plan (z. B. A0/A1 im Format ca. 1,41:1) skaliert
// renderPdfPageToSafeCanvasElement beide Seiten proportional, sodass z. B.
// 16384 × 11585px zusammenkommen können, das sind rund 190 Megapixel bzw. ca. 760 MB
// allein für den rohen RGBA-Pixelpuffer, zusätzlich zum GPU-Texturspeicher — auf
// leistungsstarken Laptops/Desktops unproblematisch.
const PDF_SAFE_MAX_CANVAS_DIM_PX_MOBILE = 4096;

// Liefert die für das aktuelle Gerät geltende maximale Canvas-Kantenlänge der
// Raster-Fallback-Stufe — derselbe Breakpoint wie getPdfSafeRenderDprCap oben, aus
// demselben Grund per window.innerWidth statt gecacht (siehe dortiger Kommentar).
function getPdfSafeMaxCanvasDimPx() {
  if (typeof window === "undefined") return PDF_SAFE_MAX_CANVAS_DIM_PX_DESKTOP;
  return window.innerWidth < PDF_MOBILE_RENDER_BREAKPOINT_PX
    ? PDF_SAFE_MAX_CANVAS_DIM_PX_MOBILE
    : PDF_SAFE_MAX_CANVAS_DIM_PX_DESKTOP;
}

// BUGFIX-NACHSCHÄRFUNG "weißer Bildschirm bleibt trotz Zoomstufen-Deckelung
// bestehen": die vorherige Fassung deckelte nur den ZOOM-ANTEIL (extraScale) VOR der
// Multiplikation mit dem devicePixelRatio-Faktor — der tatsächlich an
// page.getViewport({ scale }) übergebene Wert (safeScale = dprCap × extraScale)
// konnte dadurch selbst bei gedeckeltem extraScale immer noch über die eigentlich
// beabsichtigte Grenze hinausschießen (Beispiel: mobiler DPR-Cap 2.0 × Zoom-Cap 1.5
// = tatsächlicher Render-Scale 3.0). Genau diese Lücke war der wahrscheinlichste
// Grund, warum der weiße Bildschirm trotz der vorherigen Zoomstufen-Grenze weiter
// auftreten konnte. Der Fix deckelt deshalb ab jetzt nicht mehr den Zoom-ANTEIL,
// sondern den TATSÄCHLICHEN, fertig kombinierten scale-Wert selbst, direkt an der
// Stelle, an der er an pdf.js übergeben wird (siehe renderPdfPageToSafeCanvasElement
// unten) — das schließt die Lücke unabhängig davon, wie sich der Wert
// zusammensetzt. RENDER_CAP liegt jetzt exakt bei 2.0, wie angefordert, weiterhin
// nur auf Mobilgeräten (Desktop hat spürbar mehr Speicher-/GPU-Spielraum und war nie
// als betroffen gemeldet — dieselbe Abgrenzung wie beim DPR- und Pixel-Cap oben).
//
// WICHTIG zur eigentlichen Vergrößerung jenseits dieser Schwelle: dafür ist KEIN
// zusätzlicher, separater CSS-transform an dieser Stelle nötig (anders als im
// Auftrag skizziert) — die App verwendet bereits eine gemeinsame "Bühne"
// (transform: translate(...) scale(${scale}) in FloorPlanView, siehe contentRef),
// die Canvas UND Pins/Notizen gemeinsam im selben Koordinatensystem skaliert (siehe
// PlanSvgStage). Ein zweiter, nur auf das Canvas angewendeter Transform würde Canvas
// und Pins bei genau den hier relevanten hohen Zoomstufen gegeneinander verschieben
// — exakt die Pin-Fehlausrichtung, die in einer früheren Anforderung dieser Sitzung
// bereits bewusst vermieden wurde (siehe Kommentar an contentRef/clampTranslateForViewport).
// Aus demselben Grund ist auch an der Klick-/Touch-Koordinatenberechnung für Pins
// (siehe posFromEvent in FloorPlanView) nichts anzupassen: sie arbeitet bereits
// ausschließlich über imgRef.current.getBoundingClientRect() — den TATSÄCHLICHEN,
// bereits transformierten Bildschirmbereich der Bühne — und rechnet die Klick-
// position als reinen Prozentsatz relativ zu dessen Breite/Höhe um. Das ist von
// Natur aus unabhängig davon, WIE der aktuelle Zoom zustande kommt (Canvas-Auflösung,
// CSS-Skalierung oder eine Mischung aus beidem) und funktioniert bereits heute exakt
// so auch bei sehr hohen Zoomstufen (die App erlaubt ohnehin bis zu 2500%, siehe
// FLOORPLAN_MAX_SCALE). Das eingefrorene Canvas wird stattdessen ganz normal über
// dieselbe, bereits vorhandene Bühnen-Skalierung mit hochskaliert (CSS-Auflösung,
// keine neue Canvas-Pixelallokation) — dadurch bleiben Punkt 2 (0 zusätzlicher
// Speicher ab hier) UND Punkt 3 (Pins bleiben exakt verankert) beide gleichzeitig
// erfüllt.
const PDF_RASTER_RENDER_SCALE_CAP_MOBILE = 2.0; // entspricht RENDER_CAP aus der Anforderung

function getPdfRasterRenderScaleCap() {
  if (typeof window === "undefined") return Infinity;
  return window.innerWidth < PDF_MOBILE_RENDER_BREAKPOINT_PX ? PDF_RASTER_RENDER_SCALE_CAP_MOBILE : Infinity;
}
// Nur für die Raster-Fallback-Stufe relevant (die Vektor-Stufe braucht kein
// Re-Rendering, siehe renderPdfPageToSvgElement-Kommentar oben): erst ab dieser
// zusätzlichen Zoomstufe gegenüber der zuletzt gerenderten Auflösung wird die
// Bühne mit höherer Auflösung neu gerendert — verhindert unnötige Neu-Renderings
// bei jeder minimalen Mausrad-/Pinch-Bewegung. 180ms Debounce liegt in der vom
// Auftrag vorgegebenen Spanne von 150-200ms.
const PDF_RASTER_RERENDER_ZOOM_FACTOR = 1.15;
const PDF_RASTER_RERENDER_DEBOUNCE_MS = 180;

// Wartet auf `promise`, bricht aber nach `ms` mit einer Ablehnung ab, falls sie bis
// dahin nicht abgeschlossen ist — verhindert, dass ein hängendes (nicht fehlschlagendes,
// sondern einfach sehr langsames) Vektor-Rendering die Oberfläche dauerhaft blockiert.
// Ehrlichkeitshinweis: JavaScript-Promises lassen sich nicht echt abbrechen — die
// ursprüngliche Berechnung läuft im Hintergrund weiter, ihr Ergebnis wird nach Ablauf
// des Zeitlimits schlicht ignoriert, statt die Oberfläche noch zu aktualisieren.
function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} — Zeitlimit von ${ms}ms überschritten.`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

// Wandelt Seite 1 eines PDF-Dokuments über pdf.js' SVGGraphics-Backend in ein echtes
// SVGElement um (keine Rasterung). scale=1 entspricht der PDF-eigenen Punktgröße
// (72 dpi) — die tatsächliche Darstellungsgröße wird ausschließlich über CSS
// bestimmt (siehe PdfPlanCanvas), der Skalierungswert hier hat auf einen Vektor
// keinen Einfluss auf die Bildqualität, nur auf interne Koordinatenwerte. Wirft
// bewusst frühzeitig (vor dem eigentlichen, potenziell teuren getSVG()-Aufruf), wenn
// operatorList als zu komplex für eine sichere Vektor-Konvertierung eingeschätzt wird
// — siehe PDF_SVG_MAX_OPERATORS.
async function renderPdfPageToSvgElement(pdfjsLib, page, operatorList) {
  if (operatorList.fnArray.length > PDF_SVG_MAX_OPERATORS) {
    throw new Error(`PDF zu detailreich für sicheres Vektor-Rendering (${operatorList.fnArray.length} Zeichenoperationen).`);
  }
  const viewport = page.getViewport({ scale: 1 });
  const svgGfx = new pdfjsLib.SVGGraphics(page.commonObjs, page.objs);
  // embedFonts=false ist pdf.js' Standardwert — Text (Bemaßungen, Raumbezeichnungen)
  // würde ohne eingebettete Schriftdaten im SVG unleserlich oder gar nicht
  // dargestellt. Verifiziert direkt am pdf.js-Quelltext dieser Version (3.11.174).
  svgGfx.embedFonts = true;
  const svgElement = await svgGfx.getSVG(operatorList, viewport);
  // pdf.js liefert bewusst KEIN viewBox mit (nur feste width/height-Attribute in
  // Pixel-Einheiten der PDF-Punktgröße, ebenfalls am Quelltext verifiziert) — ohne
  // viewBox würde eine spätere CSS-Größenänderung (siehe Wrapper-Styling in
  // PdfPlanCanvas) den Inhalt nicht seitenverhältnistreu skalieren, sondern verzerren
  // oder abschneiden. Wird hier deshalb explizit selbst gesetzt, mit denselben
  // Werten, die auch die width/height-Attribute tragen.
  svgElement.setAttribute("viewBox", `0 0 ${viewport.width} ${viewport.height}`);
  svgElement.setAttribute("preserveAspectRatio", "xMidYMid meet");
  return svgElement;
}

// Sichere Raster-Fallback-Stufe (siehe Erläuterung oben) — fester, an devicePixelRatio
// gekoppelter, aber hart gedeckelter Maßstab, zusätzlich hart begrenzte, GERÄTEABHÄNGIGE
// Canvas-Pixelgröße (siehe getPdfSafeMaxCanvasDimPx/Bugfix-Kommentar oben). `extraScale`
// (Standard 1) ist der zusätzliche Zoom-Multiplikator: beim ersten Rendering der Stufe
// ist er 1 (Basisauflösung für die volle Ansicht), bei einem späteren, durch weiteres
// Hineinzoomen ausgelösten Nachladen (siehe PdfPlanCanvas) entspricht er dem aktuellen
// App-Zoomfaktor, sodass die Bühne dann in höherer, dem tatsächlichen Zoom
// entsprechender Auflösung neu gerendert wird — nur begrenzt durch dieselbe harte
// Obergrenze wie beim Erstrendering (Speicher-/GPU-Schutz bleibt in jedem Fall
// bestehen). `renderTaskRef` (optional) hält den zuletzt gestarteten pdf.js-RenderTask
// dieser Stufe fest: zoomt der Nutzer weiter, während ein vorheriges Nachladen noch
// läuft, wird dieses zuerst sauber per renderTask.cancel() abgebrochen, statt zwei
// Render-Durchläufe parallel um dasselbe Canvas konkurrieren zu lassen.
//
// Rückgabewert ist bewusst ein Objekt { canvas, clamped } statt nur des Canvas:
// `clamped` zeigt an, ob entweder der RENDER_CAP-Grenzwert (getPdfRasterRenderScaleCap,
// siehe Bugfix-Kommentar oben) oder die maximale Canvas-Kantenlänge
// (getPdfSafeMaxCanvasDimPx) den tatsächlich verwendeten scale-Wert nach unten
// korrigieren musste (d.h. die volle, dem Zoom entsprechende Auflösung NICHT
// erreicht wurde) — je nachdem, welche der beiden Grenzen zuerst zutrifft.
// PdfPlanCanvas nutzt das, um ab genau diesem Punkt weitere Neu-Renderings bei
// fortgesetztem Zoom zu unterlassen (siehe lastRasterClampedRef dort) — ein
// wiederholtes Neu-Rendern auf exakt dieselbe, bereits gedeckelte Auflösung wäre
// wirkungslos (kein Schärfegewinn) und nur verschwendete Arbeit; die weitere
// Vergrößerung übernimmt stattdessen ausschließlich die CSS-transform:scale(...)
// der äußeren "Bühne".
async function renderPdfPageToSafeCanvasElement(page, extraScale = 1, renderTaskRef = null) {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 2 : 2;
  let safeScale = Math.min(dpr, getPdfSafeRenderDprCap()) * Math.max(1, extraScale);
  let clamped = false;
  // RENDER_CAP (siehe getPdfRasterRenderScaleCap/Bugfix-Kommentar oben): deckelt den
  // TATSÄCHLICHEN, fertig kombinierten scale-Wert direkt hier, an genau der Stelle,
  // an der er gleich an page.getViewport({ scale }) übergeben wird — unabhängig
  // davon, wie er sich aus DPR und Zoomfaktor zusammensetzt. Das ist die entscheidende
  // Korrektur gegenüber der vorherigen Fassung, die nur den Zoom-Anteil VOR der
  // DPR-Multiplikation gedeckelt hatte.
  const renderScaleCap = getPdfRasterRenderScaleCap();
  if (safeScale > renderScaleCap) {
    safeScale = renderScaleCap;
    clamped = true;
  }
  let viewport = page.getViewport({ scale: safeScale });
  const largestDim = Math.max(viewport.width, viewport.height);
  const maxCanvasDimPx = getPdfSafeMaxCanvasDimPx();
  if (largestDim > maxCanvasDimPx) {
    viewport = page.getViewport({ scale: safeScale * (maxCanvasDimPx / largestDim) });
    clamped = true;
  }
  if (renderTaskRef?.current) {
    try {
      renderTaskRef.current.cancel();
    } catch {
      // pdf.js wirft beim Abbrechen eines bereits abgeschlossenen/fehlgeschlagenen
      // Tasks eine RenderingCancelledException — hier unkritisch, da ohnehin sofort
      // ein neues Rendering folgt.
    }
  }
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  // KEIN image-rendering: crisp-edges/pixelated hier (war testweise gesetzt, wieder
  // entfernt): das unterdrückt genau die weiche Kantenglättung, auf die dünne
  // CAD-Linien und feine Grautöne in echten Bauplänen angewiesen sind, um überhaupt
  // sichtbar zu bleiben — mit crisp-edges wirkten sie fast unsichtbar/durchsichtig.
  // Stattdessen wird die Bildglättung des Canvas-Kontexts hier explizit UND in
  // bestmöglicher Qualität aktiviert (Standard von Browsern ist zwar ohnehin "an",
  // explizit gesetzt schließt aber jede abweichende Annahme aus).
  //
  // Context-Optionen (Bugfix-Anforderung "2D-GPU-Beschleunigung"): willReadFrequently:
  // false sagt dem Browser explizit, dass dieser Kontext NICHT wiederholt per
  // getImageData()/toDataURL() ausgelesen wird (er wird nur einmal beschrieben und
  // dann angezeigt) — ohne diesen Hinweis wechseln manche Browser bei häufigem
  // Zeichnen vorsorglich auf eine software-/CPU-basierte Canvas-Implementierung, was
  // auf schwächeren Mobilgeräten spürbar langsamer ist und mehr Hauptspeicher statt
  // GPU-Speicher belegt. alpha: false teilt zusätzlich mit, dass kein Alphakanal
  // gebraucht wird (Baupläne sind vollflächig deckend) — spart dem Browser das
  // Vorhalten/Kompositieren eines Transparenz-Kanals. Beides wirkt sich NICHT auf den
  // separaten PDF-Export-Pfad aus (renderPdfPlanToDataUrl nutzt einen eigenen,
  // unveränderten Canvas).
  const ctx = canvas.getContext("2d", { alpha: false, willReadFrequently: false });
  // Explizites Leeren vor dem Zeichnen (Anforderung "Canvas vor dem Neuzeichnen
  // ordnungsgemäß gecleart"): da hier ohnehin bei JEDEM Aufruf ein frisches
  // <canvas>-Element angelegt wird (siehe document.createElement oben) statt ein
  // bestehendes wiederzuverwenden, ist es technisch bereits leer — dieser Aufruf ist
  // defensiv und macht das explizit, unabhängig von der aktuellen Implementierung.
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const renderTask = page.render({ canvasContext: ctx, viewport });
  if (renderTaskRef) renderTaskRef.current = renderTask;
  await renderTask.promise;
  if (renderTaskRef && renderTaskRef.current === renderTask) renderTaskRef.current = null;
  return { canvas, clamped };
}

// Erkennt pdf.js' eigene RenderingCancelledException — geworfen, wenn ein
// RenderTask.promise abgelehnt wird, WEIL derselbe Task zwischenzeitlich per
// renderTask.cancel() abgebrochen wurde (siehe renderPdfPageToSafeCanvasElement:
// jeder neue Zoom-/Seitenwechsel bricht einen noch laufenden vorherigen Task ab). Das
// ist der ERWARTETE, normale Verlauf bei schnellem Nachzoomen, kein echter Fehler —
// pdf.js benennt die Exception laut eigenem Quelltext (RenderingCancelledException,
// util.js) über .name, nicht über den message-Text, deshalb wird hier gezielt .name
// geprüft. Aufrufer nutzen das, um genau diesen Fall still zu behandeln (weder
// console.error/-warn noch ein Fehler-UI), statt bei jedem raschen Zoom-Schritt
// unnötige, irreführende Konsolenmeldungen zu erzeugen.
function isRenderCancelledError(err) {
  return err?.name === "RenderingCancelledException";
}

const PdfPlanCanvas = forwardRef(function PdfPlanCanvas({ url, zoomScale = 1 }, ref) {
  const hostRef = useRef(null); // DOM-Container, in den je nach Rendering-Stufe entweder das SVG- oder das Canvas-Element eingehängt wird
  const [status, setStatus] = useState("loading"); // "loading" | "ready" | "error"
  // Offline-Asset-Cache (siehe useOfflineCapableAssetUrl oben): online identisch mit
  // url, offline — sofern zuvor mindestens einmal online geöffnet — eine lokale
  // object:-URL aus IndexedDB. pdf.js akzeptiert eine object:-URL an genau derselben
  // Stelle wie eine echte Netz-URL (siehe loadPdfDocument unten), keine Sonderlogik
  // nötig. resolvedUrl ist kurzzeitig null, während offline der Cache abgefragt
  // wird — das eigentliche Laden startet erst, sobald ein Wert feststeht.
  const resolvedUrl = useOfflineCapableAssetUrl(url);

  // Zoomabhängiges Nachladen betrifft ausschließlich die Raster-Fallback-Stufe — die
  // bevorzugte Vektor-Stufe (SVG) ist bei jedem Zoomfaktor bereits mathematisch scharf
  // und braucht dafür kein Re-Rendering (siehe Kommentar an renderPdfPageToSvgElement).
  // tierRef hält fest, welche Stufe aktuell aktiv ist; pageRef die zugehörige pdf.js-
  // Seite, damit ein späteres Nachladen nicht das komplette Dokument erneut anfragen
  // muss. lastRasterScaleRef ist der Zoom-Multiplikator, mit dem die aktuell sichtbare
  // Raster-Auflösung zuletzt gerendert wurde. loadGenerationRef schützt einen bereits
  // laufenden Debounce-Timer davor, nach einem zwischenzeitlichen URL-Wechsel (neuer
  // Plan) noch verspätet auf den nun falschen hostRef/pageRef zuzugreifen.
  const tierRef = useRef(null); // 'vector' | 'raster' | null
  const pageRef = useRef(null);
  const lastRasterScaleRef = useRef(1);
  // BUGFIX "weißer Bildschirm beim Zoomen auf Mobilgeräten": true, sobald ein
  // Raster-Rendering an die geräteabhängige Canvas-Obergrenze gestoßen ist (siehe
  // getPdfSafeMaxCanvasDimPx/clamped-Rückgabewert von renderPdfPageToSafeCanvasElement).
  // Ab dann unterbleibt jedes weitere Neu-Rendering bei fortgesetztem Zoom (siehe
  // Zoom-Effekt unten) — ein erneutes Rendern auf exakt dieselbe, bereits gedeckelte
  // Auflösung brächte keinerlei Schärfegewinn, würde aber unnötig Arbeit/Speicher
  // beanspruchen. Die weitere Vergrößerung übernimmt ab hier ausschließlich die
  // ohnehin vorhandene CSS-transform:scale(...) der äußeren "Bühne" (siehe
  // FloorPlanView/contentRef) — funktioniert unabhängig von der Canvas-Auflösung.
  const lastRasterClampedRef = useRef(false);
  const loadGenerationRef = useRef(0);
  // Zuletzt gestarteter pdf.js-RenderTask der Raster-Fallback-Stufe — wird per
  // renderTask.cancel() sauber abgebrochen, sobald ein neueres Rendering
  // (Zoom-Nachladen oder Komponenten-Unmount) es überholt, siehe
  // renderPdfPageToSafeCanvasElement.
  const renderTaskRef = useRef(null);

  // Lädt Dokument + erste Seite bei jeder neuen PDF-URL neu, versucht zuerst die
  // Vektor-Stufe (mit Zeitlimit) und fällt bei Fehlschlag/Zeitüberschreitung/zu hoher
  // Komplexität automatisch auf die sichere Raster-Stufe zurück (siehe Kommentar oben
  // an renderPdfPageToSvgElement/renderPdfPageToSafeCanvasElement).
  useEffect(() => {
    if (!resolvedUrl) return undefined; // offline: Cache-Abfrage in useOfflineCapableAssetUrl läuft noch
    let cancelled = false;
    loadGenerationRef.current += 1;
    tierRef.current = null;
    pageRef.current = null;
    lastRasterScaleRef.current = 1;
    lastRasterClampedRef.current = false;
    renderTaskRef.current = null;
    setStatus("loading");

    (async () => {
      try {
        const pdfjsLib = await loadPdfJs();
        const pdf = await loadPdfDocument(pdfjsLib, resolvedUrl);
        if (cancelled) return;
        const page = await pdf.getPage(1);
        if (cancelled) return;
        const operatorList = await page.getOperatorList();
        if (cancelled) return;

        let renderedElement = null;
        try {
          renderedElement = await withTimeout(
            renderPdfPageToSvgElement(pdfjsLib, page, operatorList),
            PDF_SVG_RENDER_TIMEOUT_MS,
            "PDF-Vektor-Rendering"
          );
          tierRef.current = "vector";
        } catch (svgErr) {
          console.warn("PDF-Vektor-Rendering nicht möglich/zu langsam, Fallback auf sichere Raster-Auflösung:", svgErr);
          const rasterResult = await renderPdfPageToSafeCanvasElement(page, 1, renderTaskRef);
          renderedElement = rasterResult.canvas;
          tierRef.current = "raster";
          pageRef.current = page;
          lastRasterScaleRef.current = 1;
          lastRasterClampedRef.current = rasterResult.clamped;
        }
        if (cancelled) return;

        const host = hostRef.current;
        if (!host) return;
        host.replaceChildren(renderedElement);
        if (!cancelled) setStatus("ready");
      } catch (err) {
        // Abgebrochene RenderTasks (siehe isRenderCancelledError) sind hier der normale
        // Fall bei einem Komponenten-Unmount/URL-Wechsel WÄHREND das Raster-Fallback
        // noch rendert (siehe Cleanup unten) — kein echter Rendering-Fehler, daher ohne
        // console.error und ohne Fehler-UI (cancelled ist in diesem Fall ohnehin schon
        // true, setStatus("error") würde also sowieso nicht mehr greifen).
        if (!isRenderCancelledError(err)) {
          console.error("PDF-Rendering vollständig fehlgeschlagen (Vektor UND Raster-Fallback), Rückfall auf <embed>:", err);
        }
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // siehe Kommentar an renderPdfPageToSafeCanvasElement — unkritisch.
        }
        renderTaskRef.current = null;
      }
    };
  }, [resolvedUrl]);

  // Zoomabhängiges Nachladen der Raster-Fallback-Stufe: sobald spürbar weiter
  // hineingezoomt wird, als die aktuell sichtbare Auflösung abdeckt, wird nach einer
  // kurzen Zoom-Pause (Debounce) mit höherer, an devicePixelRatio UND aktuellem
  // Zoomfaktor gekoppelter Auflösung neu gerendert (siehe
  // renderPdfPageToSafeCanvasElement). Greift nicht während einer laufenden Zoom-
  // Geste (die kommt über CSS transform: scale(...) der äußeren "Bühne", völlig ohne
  // Neu-Rendering aus), sondern erst kurz nach deren Ende.
  //
  // BUGFIX "weißer Bildschirm beim Zoomen auf Mobilgeräten" (inkl. Nachschärfung:
  // RENDER_CAP deckelt jetzt den tatsächlichen, fertig kombinierten scale-Wert
  // direkt in renderPdfPageToSafeCanvasElement selbst, siehe Bugfix-Kommentar dort —
  // dieser Effekt hier muss den Zoomfaktor deshalb NICHT mehr selbst vorab
  // begrenzen, sondern reicht zoomScale unverändert durch und liest nur noch das
  // Ergebnis `clamped` zurück): lastRasterClampedRef (siehe oben) bricht diesen
  // Effekt frühzeitig ab, sobald entweder RENDER_CAP (getPdfRasterRenderScaleCap)
  // oder die geräteabhängige Canvas-Pixel-Obergrenze (getPdfSafeMaxCanvasDimPx)
  // erreicht ist. Ab dann übernimmt beim Weiterzoomen ausschließlich die ohnehin
  // bereits vorhandene CSS-transform:scale(...) der äußeren "Bühne" die weitere
  // Vergrößerung, ganz ohne erneutes Canvas-Rendering und ohne zusätzlichen
  // Speicherbedarf — genau das verhindert das stillschweigende Kappen des Canvas
  // durch den Browser, das zuvor zum weißen Bildschirm führte.
  useEffect(() => {
    if (tierRef.current !== "raster") return undefined;
    if (!pageRef.current) return undefined;
    if (lastRasterClampedRef.current) return undefined;
    if (zoomScale <= lastRasterScaleRef.current * PDF_RASTER_RERENDER_ZOOM_FACTOR) return undefined;

    const myGeneration = loadGenerationRef.current;
    const timer = setTimeout(async () => {
      if (loadGenerationRef.current !== myGeneration) return; // zwischenzeitlich neuer Plan geladen
      const page = pageRef.current;
      const host = hostRef.current;
      if (!page || !host) return;
      try {
        const { canvas, clamped } = await renderPdfPageToSafeCanvasElement(page, zoomScale, renderTaskRef);
        if (loadGenerationRef.current !== myGeneration) return;
        host.replaceChildren(canvas);
        lastRasterScaleRef.current = zoomScale;
        lastRasterClampedRef.current = clamped;
      } catch (err) {
        // Genau der in isRenderCancelledError beschriebene Normalfall: ein noch
        // schnelleres, weiteres Nachzoomen hat diesen Render-Task bereits wieder per
        // renderTask.cancel() abgebrochen, bevor er fertig wurde (siehe
        // renderPdfPageToSafeCanvasElement) — der jeweils NEUESTE Zoom-Schritt gewinnt
        // ohnehin, dieser hier ist einfach überholt. Kein Konsolenfehler nötig, die
        // bisherige Auflösung bleibt bis zum nächsten erfolgreichen Rendering sichtbar.
        if (!isRenderCancelledError(err)) {
          console.warn("Hochauflösendes Nachladen der PDF-Raster-Fallback-Stufe fehlgeschlagen, bisherige Auflösung bleibt sichtbar:", err);
        }
      }
    }, PDF_RASTER_RERENDER_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [zoomScale]);

  return (
    <div ref={ref} className="relative aspect-[4/3] w-full overflow-hidden bg-white">
      {status === "error" ? (
        <embed src={url} type="application/pdf" className="pointer-events-none h-full w-full" />
      ) : (
        // preserveAspectRatio="xMidYMid meet" (SVG-Stufe, siehe renderPdfPageToSvgElement)
        // bzw. object-contain (Canvas-Fallback-Stufe) übernehmen dieselbe Rolle: der
        // Inhalt wird seitenverhältnistreu und zentriert in die volle Rahmenbox
        // eingepasst, deshalb h-full statt h-auto — h-auto würde stattdessen versuchen,
        // die Rahmenhöhe an den Inhalt anzupassen, was den festen aspect-[4/3]-Rahmen
        // und damit die Pin-/Notiz-Prozentkoordinaten verschieben würde.
        <div
          ref={hostRef}
          className="pointer-events-none block h-full w-full select-none opacity-90 transition-opacity [&>svg]:block [&>svg]:h-full [&>svg]:w-full [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full [&>canvas]:object-contain"
          style={{ opacity: status === "ready" ? 1 : 0 }}
        />
      )}
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <Loader2 className="animate-spin text-slate-400" size={26} />
        </div>
      )}
    </div>
  );
});

// ----------------------------------------------------------------------------------
// SVG-GRUNDRISS — echtes Vektor-Rendering statt Raster-Canvas/-Bild
// ----------------------------------------------------------------------------------
// Für nativ als .svg hochgeladene Grundrisse (im Unterschied zu aus einer PDF-Datei
// von pdf.js erst noch generierten SVG-Pfaden, siehe PdfPlanCanvas oben) wird die
// Datei hier EINMALIG als Rohtext geladen und direkt als echtes <svg>-Element in den
// DOM inline eingebettet (dangerouslySetInnerHTML). Der Zoom (siehe FloorPlanView: transform: scale(...) auf
// der äußeren "Bühne", contentRef) wirkt danach exakt wie bei den absolut
// positionierten Pin-/Notiz-Markern auf einer reinen CSS-Transformation — es gibt zu
// KEINEM Zeitpunkt ein Bitmap im Speicher, das bei starkem Zoom unscharf werden oder
// (siehe frühere "White Screen"-Fehlerklasse) beim Neu-Rendern kurz leerlaufen könnte.
// Linien bleiben dadurch bei jedem Zoomfaktor mathematisch exakt gestochen scharf.
//
// Sicherheit: SVG-Dateien können technisch ausführbares Markup (<script>, "on*"-
// Event-Handler) enthalten. Da Grundrisse ausschließlich von authentifizierten
// Nutzern hochgeladen werden können (siehe RLS-Policy floor_plans_insert_auth),
// ist das primäre Bedrohungsmodell gering — sanitizeSvgMarkup entfernt <script>-Tags
// und "on*"-Attribute trotzdem als zusätzliche Vorsichtsmaßnahme (Defense in Depth),
// bevor die Datei inline eingebettet wird. Das ist bewusst eine einfache, robuste
// Teilsanitisierung und keine vollständige XML-Sicherheitsprüfung.
function sanitizeSvgMarkup(svgText) {
  return svgText
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "");
}

const SvgPlanCanvas = forwardRef(function SvgPlanCanvas({ url }, ref) {
  const [markup, setMarkup] = useState(null);
  const [status, setStatus] = useState("loading"); // 'loading' | 'ready' | 'error'

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setMarkup(null);
    // Offline-Asset-Cache (siehe fetchAssetTextWithOfflineCache oben): online wie
    // bisher ein direkter fetch(), offline — sofern zuvor mindestens einmal online
    // geöffnet — aus IndexedDB statt von Supabase.
    fetchAssetTextWithOfflineCache(url)
      .then((text) => {
        if (cancelled) return;
        setMarkup(sanitizeSvgMarkup(text));
        setStatus("ready");
      })
      .catch((err) => {
        console.error("SVG-Grundriss konnte nicht geladen werden:", err);
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (status === "loading") {
    return (
      <div ref={ref} className="flex aspect-[4/3] w-full items-center justify-center bg-white">
        <Loader2 className="animate-spin text-slate-400" size={26} />
      </div>
    );
  }
  if (status === "error" || !markup) {
    return (
      <div ref={ref} className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-slate-100 px-6 text-center text-slate-400">
        <AlertTriangle size={22} />
        <span className="text-xs">Grundriss (SVG) konnte nicht geladen werden.</span>
      </div>
    );
  }
  return (
    // [&>svg]:… setzt Breite/Höhe/Verhalten des inline eingebetteten <svg>-Wurzel-
    // elements per CSS — überschreibt damit zuverlässig auch fest im Dateiquelltext
    // hinterlegte width/height-Attribute (CSS-Eigenschaften haben stets Vorrang vor
    // Präsentationsattributen), sodass der Plan exakt wie ein <img> auf volle
    // Container-Breite mit proportionaler Höhe skaliert.
    <div
      ref={ref}
      className="pointer-events-none block w-full select-none opacity-90 [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
});

// ----------------------------------------------------------------------------------
// PLAN-SVG-BÜHNE — gemeinsamer SVG-Koordinatenraum für Vektor-Grundriss + Pin-/
// Notiz-Ebene (nur für die beiden echten Vektor-Planarten: PDF via PdfPlanCanvas,
// natives .svg via SvgPlanCanvas)
// ----------------------------------------------------------------------------------
// Mängel-Pins, Blickrichtungs-Fächer und Skizzen-Notizen wurden bisher als separate,
// per CSS-Prozent positionierte HTML-Ebene NEBEN dem Plan gerendert — synchron zum
// Zoom, aber technisch außerhalb des SVG-Baums. PlanSvgStage bettet sie stattdessen
// direkt in dasselbe SVG-Koordinatensystem wie der Vektor-Grundriss ein: ein äußeres
// <svg viewBox="0 0 W H"> (W/H = natürliche, unskalierte Pixelgröße der Bühne, siehe
// ResizeObserver unten) enthält ein <foreignObject>, das exakt die volle W×H-Fläche
// abdeckt — darin liegt eine ganz normale HTML-Ebene, auf der PinMarker/PlanNoteMarker
// UNVERÄNDERT weiterlaufen (gleiche Prozent-Positionierung, gleiche Drag-/Klick-Logik,
// gleiche Gegen-Skalierung). foreignObject ist der spezifikationskonforme Weg, echte
// interaktive HTML-Inhalte (Buttons, Icons, Drag-Handler) innerhalb eines SVG-Baums
// zu verankern — eine Neuimplementierung der Marker als reine SVG-Primitive (<circle>,
// <text> statt React-Komponenten mit Drag/Klick/Badges/Fotos) hätte ein unverhältnis-
// mäßiges Regressionsrisiko für bereits ausgereifte Funktionalität bedeutet, ohne
// einen in der Praxis spürbaren Schärfe- oder Genauigkeitsgewinn gegenüber diesem
// Ansatz. Redlicher Hinweis: foreignObject hat in älteren Safari-/WebKit-Versionen
// vereinzelt dokumentierte Darstellungs-Eigenheiten bei komplexem HTML-Inhalt — sollte
// es auf einem Baustellen-Tablet Auffälligkeiten geben, bitte melden, dann prüfen wir
// gezielt nach.
const PlanSvgStage = forwardRef(function PlanSvgStage({ planKind, url, zoomScale = 1, children }, ref) {
  const measureRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  // Ermittelt die natürliche (unskalierte) Pixelgröße der Bühne über offsetWidth/
  // -Height — diese Werte werden von einer CSS transform:scale(...) auf ANCESTOR-
  // Ebene (siehe FloorPlanView, contentRef) NICHT beeinflusst (Transforms wirken rein
  // visuell/nach dem Layout, nicht auf den layoutwirksamen Kastenwert), liefern also
  // unabhängig vom aktuellen Zoomfaktor stets dieselbe Referenzgröße. Ein
  // ResizeObserver hält diesen Wert bei echten Layout-Änderungen (Fenstergröße,
  // Laden des Plans, Seitenverhältnis-Wechsel bei SvgPlanCanvas) aktuell.
  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const update = () => setStageSize({ width: el.offsetWidth, height: el.offsetHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [url]);

  const setRefs = (node) => {
    measureRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  const hasSize = stageSize.width > 0 && stageSize.height > 0;

  return (
    <div ref={setRefs} className="relative w-full">
      {planKind === "pdf" ? <PdfPlanCanvas url={url} zoomScale={zoomScale} /> : <SvgPlanCanvas url={url} />}
      {hasSize && (
        <svg
          viewBox={`0 0 ${stageSize.width} ${stageSize.height}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
        >
          <foreignObject x="0" y="0" width={stageSize.width} height={stageSize.height} style={{ overflow: "visible" }}>
            <div className="relative h-full w-full">{children}</div>
          </foreignObject>
        </svg>
      )}
    </div>
  );
});

// ----------------------------------------------------------------------------------
// LOGIN-BILDSCHIRM — verpflichtende Anmeldesperre nach dem Intro (siehe isAuthenticated
// in App()): solange isAuthenticated false ist, wird ausschließlich dieser vollflächige
// Bildschirm gerendert, weder Kopfzeile/Navigation noch Projektlisten oder Baupläne
// existieren währenddessen im Rendering-Baum. Eigenständig von AuthModal weiter unten
// (das bleibt der schlanke Inline-Dialog, mit dem ein bereits eingeloggter Betrachter
// innerhalb der App zusätzlich eine Bearbeitungs-Session eröffnet/registriert) — hier
// geht es um den Zugriff auf die App als Ganzes.
// ----------------------------------------------------------------------------------
function LoginScreen({ onLogin, onRegister }) {
  // Registrieren ist bewusst als sekundärer, eingeklappter Link statt eines
  // gleichwertigen zweiten Tabs gestaltet (anders als im internen AuthModal weiter
  // unten) — die Aufgabenstellung beschreibt hier explizit einen Anmelde-Bildschirm.
  // Ganz weglassen ging aber nicht: ohne ihn gäbe es hinter der neuen App-
  // Zugriffssperre keinen Weg mehr, überhaupt ein erstes Konto anzulegen (Supabase-
  // Auth-Zugangsdaten selbst entstehen ausschließlich über signUp, die
  // Benutzerverwaltung im Hauptbereich legt nur das fachliche Profil in app_users an,
  // siehe createUser) — das hätte eine bestehende Kernfunktion faktisch unerreichbar
  // gemacht.
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const switchMode = (next) => {
    setMode(next);
    setError("");
    setInfo("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Bitte E-Mail und Passwort eingeben.");
      return;
    }
    setError("");
    setInfo("");
    setSubmitting(true);
    try {
      if (mode === "login") {
        await onLogin(email.trim(), password);
        // Bei Erfolg übernimmt App() über isAuthenticated den Wechsel zur
        // Hauptanwendung — dieser Bildschirm wird dadurch unmounted, ein
        // Zurücksetzen von submitting hier wäre wirkungslos bzw. würde nur unnötig
        // knapp vor dem Unmount rendern.
      } else {
        await onRegister(email.trim(), password);
        setInfo("Registrierung erfolgreich. Falls eine Bestätigungs-E-Mail erforderlich ist, bitte den Posteingang prüfen und danach anmelden.");
        switchMode("login");
        setSubmitting(false);
      }
    } catch (err) {
      console.error("Anmeldung fehlgeschlagen:", err);
      setError(err?.message || "Anmeldung fehlgeschlagen. Bitte erneut versuchen.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <BrandLogotype tone="brand" size="md" />
          <p className="text-sm text-slate-500">Baustellendokumentation — Anmeldung erforderlich</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FieldLabel>E-Mail</FieldLabel>
            <input
              type="email"
              name="username"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              placeholder="name@firma.de"
              className={TEXT_INPUT_CLASS}
            />
          </div>
          <div>
            <FieldLabel>Passwort</FieldLabel>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                placeholder="••••••••"
                className={`${TEXT_INPUT_CLASS} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                title={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {info && <p className="text-xs font-medium text-emerald-600">{info}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#FF2A00] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#E02400] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : mode === "login" ? (
              <LogIn size={16} />
            ) : (
              <UserPlus size={16} />
            )}
            {mode === "login" ? "Anmelden" : "Registrieren"}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => switchMode(mode === "login" ? "register" : "login")}
            disabled={submitting}
            className="text-xs font-semibold text-slate-500 underline-offset-2 transition hover:text-[#FF2A00] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mode === "login" ? "Noch kein Konto? Registrieren" : "Bereits ein Konto? Anmelden"}
          </button>
        </div>
        <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-400">
          Ohne Netzverbindung ist eine Anmeldung möglich, wenn an diesem Gerät zuvor bereits
          einmal online angemeldet wurde.
        </p>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------------
// AUTH-MODAL — Anmelden / Registrieren (Supabase Auth, E-Mail + Passwort)
// ----------------------------------------------------------------------------------

function AuthModal({ onClose, onSignIn, onSignUp }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const switchMode = (next) => {
    setMode(next);
    setError("");
    setInfo("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!email.trim() || !password) {
      setError("Bitte E-Mail und Passwort eingeben.");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "login") {
        await onSignIn(email.trim(), password);
        onClose();
      } else {
        await onSignUp(email.trim(), password);
        setInfo("Registrierung erfolgreich. Falls eine Bestätigungs-E-Mail erforderlich ist, bitte den Posteingang prüfen und danach anmelden.");
      }
    } catch (err) {
      console.error("Auth-Fehler:", err);
      setError(err?.message || "Anmeldung fehlgeschlagen. Bitte Zugangsdaten prüfen.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`${MODAL_BACKDROP_BASE} z-[70]`}>
      <div className="w-full max-w-sm overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className={MODAL_HEADER_ROW}>
          <h2 className="text-lg font-bold text-slate-900">{mode === "login" ? "Anmelden" : "Konto erstellen"}</h2>
          <button onClick={onClose} className={MODAL_CLOSE_BTN}>
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-slate-100 px-5 pt-3">
          <button
            onClick={() => switchMode("login")}
            className={`flex-1 border-b-2 pb-2 text-sm font-semibold transition ${
              mode === "login" ? "border-[#FF2A00] text-[#FF2A00]" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Anmelden
          </button>
          <button
            onClick={() => switchMode("register")}
            className={`flex-1 border-b-2 pb-2 text-sm font-semibold transition ${
              mode === "register" ? "border-[#FF2A00] text-[#FF2A00]" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Registrieren
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div>
            <FieldLabel>E-Mail</FieldLabel>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              placeholder="name@firma.de"
              className={TEXT_INPUT_CLASS}
            />
          </div>
          <div>
            <FieldLabel>Passwort</FieldLabel>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              placeholder="••••••••"
              className={TEXT_INPUT_CLASS}
            />
          </div>
          {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
          {info && <p className="text-xs font-medium text-emerald-600">{info}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#FF2A00] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#E02400] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : mode === "login" ? <LogIn size={16} /> : <UserPlus size={16} />}
            {mode === "login" ? "Anmelden" : "Registrieren"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------------
// BESTÄTIGUNGSDIALOG (z.B. Projekt löschen)
// ----------------------------------------------------------------------------------

function ConfirmDialog({ title, message, confirmLabel = "Löschen", onConfirm, onCancel, busy }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="mt-1.5 text-sm text-slate-500">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className={BTN_SECONDARY}
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------------
// GEWERKEVERWALTUNG — ADMIN-MODAL (Anlegen, Umbenennen, Deaktivieren, Sortieren)
// ----------------------------------------------------------------------------------

function TradesAdminModal({ trades, onClose, onCreate, onRename, onToggleActive, onReorder }) {
  const [newTradeName, setNewTradeName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [busyId, setBusyId] = useState(null);

  const sorted = [...trades].sort((a, b) => a.sort_order - b.sort_order);

  const handleCreate = async () => {
    if (!newTradeName.trim()) {
      setError("Bitte einen Namen für das Gewerk eingeben.");
      return;
    }
    setError("");
    setCreating(true);
    try {
      await onCreate(newTradeName.trim());
      setNewTradeName("");
    } catch (err) {
      console.error("Gewerk konnte nicht angelegt werden:", err);
      setError(err?.message || "Das Gewerk konnte nicht angelegt werden. Bitte erneut versuchen.");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (trade) => {
    setEditingId(trade.id);
    setEditingName(trade.name);
  };

  const commitEdit = async (trade) => {
    const trimmed = editingName.trim();
    if (!trimmed || trimmed === trade.name) {
      setEditingId(null);
      return;
    }
    setBusyId(trade.id);
    try {
      await onRename(trade.id, trimmed);
      setEditingId(null);
    } catch (err) {
      console.error("Gewerk konnte nicht umbenannt werden:", err);
      setError(err?.message || "Das Gewerk konnte nicht umbenannt werden. Bitte erneut versuchen.");
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = async (trade) => {
    setBusyId(trade.id);
    try {
      await onToggleActive(trade);
    } catch (err) {
      console.error("Status konnte nicht geändert werden:", err);
      setError(err?.message || "Der Status konnte nicht geändert werden. Bitte erneut versuchen.");
    } finally {
      setBusyId(null);
    }
  };

  const move = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    const reordered = [...sorted];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    setBusyId(moved.id);
    try {
      await onReorder(reordered);
    } catch (err) {
      console.error("Reihenfolge konnte nicht gespeichert werden:", err);
      setError(err?.message || "Die Reihenfolge konnte nicht gespeichert werden. Bitte erneut versuchen.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={`${MODAL_BACKDROP_BASE} z-[65]`}>
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[85vh] sm:max-w-xl sm:rounded-2xl">
        <div className={MODAL_HEADER_ROW}>
          <div>
            <p className="mb-0.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#FF2A00]">
              <Wrench size={13} /> Verwaltung
            </p>
            <h2 className="text-lg font-bold text-slate-900">Gewerke</h2>
          </div>
          <button onClick={onClose} className={MODAL_CLOSE_BTN}>
            <X size={20} />
          </button>
        </div>

        <div className={MODAL_BODY_SCROLL}>
          <p className="text-xs text-slate-500">
            Gewerke lassen sich hier umbenennen, deaktivieren und sortieren. Deaktivierte Gewerke bleiben an bereits
            zugeordneten Pins sichtbar, stehen bei neuen Zuordnungen aber nicht mehr zur Auswahl.
          </p>

          <div className="space-y-1.5">
            {sorted.map((trade, index) => (
              <div
                key={trade.id}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 ${
                  trade.active ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50"
                }`}
              >
                <div className="flex shrink-0 flex-col">
                  <button
                    onClick={() => move(index, -1)}
                    disabled={index === 0 || busyId === trade.id}
                    className="rounded p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
                    title="Nach oben"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    onClick={() => move(index, 1)}
                    disabled={index === sorted.length - 1 || busyId === trade.id}
                    className="rounded p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
                    title="Nach unten"
                  >
                    <ArrowDown size={13} />
                  </button>
                </div>

                {editingId === trade.id ? (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && commitEdit(trade)}
                    onBlur={() => commitEdit(trade)}
                    className="flex-1 rounded-md border border-red-300 px-2 py-1 text-sm outline-none ring-[#FF2A00]/30 focus:ring-4"
                  />
                ) : (
                  <button
                    onClick={() => startEdit(trade)}
                    disabled={busyId === trade.id}
                    className={`flex-1 truncate text-left text-sm font-medium ${trade.active ? "text-slate-700" : "text-slate-400"}`}
                    title="Klicken zum Umbenennen"
                  >
                    {trade.name}
                  </button>
                )}

                <button
                  onClick={() => toggleActive(trade)}
                  disabled={busyId === trade.id}
                  className="shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
                  title={trade.active ? "Deaktivieren" : "Aktivieren"}
                >
                  <ActiveStatusBadge active={trade.active} />
                </button>
              </div>
            ))}
            {sorted.length === 0 && <p className="text-xs text-slate-400">Noch keine Gewerke angelegt.</p>}
          </div>

          <div className="flex gap-2 border-t border-slate-100 pt-3.5">
            <input
              value={newTradeName}
              onChange={(e) => setNewTradeName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              disabled={creating}
              placeholder="Neues Gewerk hinzufügen…"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-[#FF2A00]/30 placeholder:text-slate-400 focus:border-[#FF2A00] focus:ring-4 disabled:bg-slate-50"
            />
            <button
              onClick={handleCreate}
              disabled={creating}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF2A00] px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#E02400] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Hinzufügen
            </button>
          </div>
          {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
        </div>

        <div className="flex items-center justify-end border-t border-slate-100 px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100">
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------------
// BENUTZERVERWALTUNG — FORMULAR (Anlegen & Bearbeiten)
// ----------------------------------------------------------------------------------

function UserFormModal({ mode, user, projects, onClose, onSave }) {
  const [name, setName] = useState(user?.name || "");
  const [kuerzel, setKuerzel] = useState(user?.kuerzel || "");
  const [email, setEmail] = useState(user?.email || "");
  const [role, setRole] = useState(user?.role || "Projektmitarbeiter");
  const [active, setActive] = useState(user ? !!user.active : true);
  const [projectIds, setProjectIds] = useState(user?.project_ids || []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const toggleProject = (projectId) => {
    setProjectIds((prev) => (prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Bitte einen Namen vergeben.");
      return;
    }
    if (!email.trim()) {
      setError("Bitte eine E-Mail-Adresse vergeben.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        kuerzel: kuerzel.trim(),
        email: email.trim(),
        role,
        active,
        project_ids: projectIds,
      });
      // Bei Erfolg schließt der Aufrufer (UsersAdminModal) das Formular selbst.
    } catch (err) {
      console.error("Benutzer konnte nicht gespeichert werden:", err);
      setError(err?.message || "Der Benutzer konnte nicht gespeichert werden. Bitte erneut versuchen.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`${MODAL_BACKDROP_BASE} z-[75]`}>
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:max-w-lg sm:rounded-2xl">
        <div className={MODAL_HEADER_ROW}>
          <div>
            <p className={MODAL_EYEBROW}>
              {mode === "create" ? "Neuer Benutzer" : "Benutzer bearbeiten"}
            </p>
            <h2 className="text-lg font-bold text-slate-900">{mode === "create" ? "Benutzer anlegen" : user?.name}</h2>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className={MODAL_CLOSE_BTN_DISABLED}
          >
            <X size={20} />
          </button>
        </div>

        <div className={MODAL_BODY_SCROLL}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Name</FieldLabel>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
                placeholder="Vor- und Nachname"
                className={TEXT_INPUT_CLASS}
              />
            </div>
            <div>
              <FieldLabel>Kürzel</FieldLabel>
              <input
                value={kuerzel}
                onChange={(e) => setKuerzel(e.target.value)}
                disabled={submitting}
                placeholder="z.B. RR"
                maxLength={6}
                className={TEXT_INPUT_CLASS}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>E-Mail / Benutzerkonto</FieldLabel>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                placeholder="name@firma.de"
                className={TEXT_INPUT_CLASS}
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Muss mit der E-Mail-Adresse übereinstimmen, mit der sich diese Person anmeldet.
              </p>
            </div>
            <div>
              <FieldLabel>Rolle</FieldLabel>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={submitting}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none ring-[#FF2A00]/30 focus:border-[#FF2A00] focus:ring-4 disabled:bg-slate-50"
              >
                {USER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-slate-400">{ROLE_META[role]?.description}</p>
            </div>
            <div>
              <FieldLabel>Status</FieldLabel>
              <select
                value={active ? "aktiv" : "inaktiv"}
                onChange={(e) => setActive(e.target.value === "aktiv")}
                disabled={submitting}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none ring-[#FF2A00]/30 focus:border-[#FF2A00] focus:ring-4 disabled:bg-slate-50"
              >
                {USER_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s === "aktiv" ? "Aktiv" : "Inaktiv"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <FieldLabel>Projektzuordnung</FieldLabel>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
              {projects.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={projectIds.includes(p.id)}
                    onChange={() => toggleProject(p.id)}
                    disabled={submitting}
                    className="h-3.5 w-3.5 accent-[#FF2A00]"
                  />
                  {p.name}
                </label>
              ))}
              {projects.length === 0 && <p className="px-2 py-1.5 text-xs text-slate-400">Noch keine Projekte vorhanden.</p>}
            </div>
          </div>

          {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
        </div>

        <div className={MODAL_FOOTER_ROW}>
          <button
            onClick={onClose}
            disabled={submitting}
            className={BTN_SECONDARY}
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={BTN_PRIMARY}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {mode === "create" ? "Benutzer anlegen" : "Änderungen speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------------
// BENUTZERVERWALTUNG — ÜBERSICHT (ADMIN-MODAL)
// ----------------------------------------------------------------------------------

function UsersAdminModal({ users, projects, onClose, onCreateUser, onEditUser, onToggleUserActive }) {
  const [formState, setFormState] = useState(null); // { mode, user }

  return (
    <div className={`${MODAL_BACKDROP_BASE} z-[65]`}>
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[85vh] sm:max-w-2xl sm:rounded-2xl">
        <div className={MODAL_HEADER_ROW}>
          <div>
            <p className="mb-0.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#FF2A00]">
              <UserCog size={13} /> Verwaltung
            </p>
            <h2 className="text-lg font-bold text-slate-900">Benutzer</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFormState({ mode: "create", user: null })}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF2A00] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#E02400]"
            >
              <Plus size={14} /> Neuer Benutzer
            </button>
            <button onClick={onClose} className={MODAL_CLOSE_BTN}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
          {users.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{u.name}</span>
                  {u.kuerzel && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">{u.kuerzel}</span>}
                </div>
                <p className="truncate text-xs text-slate-500">{u.email}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {(u.project_ids || []).length} Projekt{(u.project_ids || []).length !== 1 ? "e" : ""} zugeordnet
                </p>
              </div>
              <RoleBadge role={u.role} />
              <button onClick={() => onToggleUserActive(u)} title={u.active ? "Deaktivieren" : "Aktivieren"}>
                <ActiveStatusBadge active={u.active} />
              </button>
              <button
                onClick={() => setFormState({ mode: "edit", user: u })}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <Pencil size={13} /> Bearbeiten
              </button>
            </div>
          ))}
          {users.length === 0 && <p className="text-xs text-slate-400">Noch keine Benutzer angelegt.</p>}
        </div>

        <div className="flex items-center justify-end border-t border-slate-100 px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100">
            Schließen
          </button>
        </div>
      </div>

      {formState && (
        <UserFormModal
          mode={formState.mode}
          user={formState.user}
          projects={projects}
          onClose={() => setFormState(null)}
          onSave={async (fields) => {
            if (formState.mode === "create") {
              await onCreateUser(fields);
            } else {
              await onEditUser(formState.user.id, fields);
            }
            setFormState(null);
          }}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------------
// DROPBOX-VERBINDUNG — Verbinden/Trennen (Abschnitt 4)
// ----------------------------------------------------------------------------------
function DropboxConnectModal({ connected, kuerzel, onClose, onConnect, onDisconnect }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = async () => {
    setError("");
    setBusy(true);
    try {
      await onConnect(); // leitet bei Erfolg per window.location weiter, kehrt bei Fehler hierher zurück
    } catch (err) {
      console.error("Dropbox-Verbindung konnte nicht gestartet werden:", err);
      setError(err?.message || "Die Dropbox-Verbindung konnte nicht gestartet werden.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${MODAL_BACKDROP_BASE} z-[65]`}>
      <div className="w-full max-w-sm overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className={MODAL_HEADER_ROW}>
          <div>
            <p className={MODAL_EYEBROW}>Foto-Archivierung</p>
            <h2 className="text-lg font-bold text-slate-900">Dropbox-Verbindung</h2>
          </div>
          <button onClick={onClose} className={MODAL_CLOSE_BTN}>
            <X size={20} />
          </button>
        </div>

        <div className={MODAL_BODY_SCROLL}>
          <div className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${connected ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
            {connected ? <Cloud size={18} className="text-emerald-600" /> : <CloudOff size={18} className="text-slate-400" />}
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-semibold ${connected ? "text-emerald-700" : "text-slate-600"}`}>
                {connected ? "Verbunden" : "Nicht verbunden"}
              </p>
              <p className="text-xs text-slate-500">
                {connected
                  ? "Fotos werden zusätzlich zu Supabase in den heutigen Tagesordner archiviert."
                  : "Fotos werden derzeit ausschließlich in Supabase gespeichert."}
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Tagesordner-Schema: <span className="font-mono font-semibold text-slate-700">JJMMTT_Bauüberwachung_{kuerzel || "Kürzel"}</span>
            {!kuerzel && (
              <span className="mt-1 block text-amber-600">
                Für deinen Benutzer ist noch kein Kürzel hinterlegt — bitte in der Benutzerverwaltung ergänzen, sonst kann kein
                Tagesordner gebildet werden.
              </span>
            )}
          </p>

          {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
        </div>

        <div className={MODAL_FOOTER_ROW}>
          <button onClick={onClose} className={BTN_SECONDARY}>
            Schließen
          </button>
          {connected ? (
            <button
              onClick={() => {
                onDisconnect();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3.5 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              <Unlink2 size={15} /> Trennen
            </button>
          ) : (
            <button onClick={handleConnect} disabled={busy} className={BTN_PRIMARY}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />} Mit Dropbox verbinden
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------------
// PDF-EXPORT — Filter-Modal (Abschnitt 5.1)
// Öffnet sich vor der eigentlichen PDF-Erstellung. Jede Auswahl startet bewusst leer
// ("alle") statt vorbelegt — siehe ExportChipGroup/filterExportPins. Projekt selbst ist
// nicht auswählbar (fest vorgegeben durch den Aufrufkontext in FloorOverview).
// ----------------------------------------------------------------------------------
function PdfExportModal({ project, floors, trades, users, generatedBy, onClose }) {
  const [floorIds, setFloorIds] = useState([]);
  const [tradeIds, setTradeIds] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [creators, setCreators] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [includeOnboarding, setIncludeOnboarding] = useState(() => hasOnboardingInfo(project));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const makeToggle = (setter) => (id) => setter((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));

  const floorOptions = (floors || []).map((f) => ({ id: f.id, label: f.name }));
  const statusOptions = Object.entries(STATUS).map(([key, s]) => ({ id: key, label: s.label }));
  const creatorOptions = (users || [])
    .filter((u) => u.email)
    .map((u) => ({ id: u.email, label: u.name || u.email }));

  const handleExport = async () => {
    setError("");
    setBusy(true);
    try {
      const allPins = await fetchAllPinsForProject(floors || []);
      const filters = {
        floorIds,
        tradeIds,
        statuses,
        creators,
        fromDate,
        toDate,
        floorLabel: floorIds.length ? floorOptions.filter((o) => floorIds.includes(o.id)).map((o) => o.label).join(", ") : "Alle Etagen",
        tradeLabel: tradeIds.length ? (trades || []).filter((t) => tradeIds.includes(t.id)).map((t) => t.name).join(", ") : "Alle Gewerke",
        statusLabel: statuses.length ? statuses.map((s) => STATUS[s]?.label || s).join(", ") : "Alle Status",
        creatorLabel: creators.length ? creators.join(", ") : "Alle Ersteller",
      };
      const filteredPins = filterExportPins(allPins, filters);
      await generateProjectReportPdf({
        project,
        floors: floors || [],
        pins: filteredPins,
        filters,
        trades,
        generatedBy,
        includeOnboarding: includeOnboarding && hasOnboardingInfo(project),
      });
      onClose();
    } catch (err) {
      console.error("PDF-Export fehlgeschlagen:", err);
      setError(err?.message || "Der PDF-Export ist fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${MODAL_BACKDROP_BASE} z-50`}>
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:max-w-xl sm:rounded-2xl">
        <div className={MODAL_HEADER_ROW}>
          <div>
            <p className={MODAL_EYEBROW}>PDF-Export</p>
            <h2 className="text-lg font-bold text-slate-900">Baudokumentation exportieren</h2>
          </div>
          <button onClick={onClose} disabled={busy} className={MODAL_CLOSE_BTN_DISABLED}>
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs font-semibold text-slate-500">Projekt</p>
            <p className="text-sm font-semibold text-slate-800">{project?.name}</p>
          </div>

          <div>
            <FieldLabel>Geschoss / Etage</FieldLabel>
            <ExportChipGroup options={floorOptions} selected={floorIds} onToggle={makeToggle(setFloorIds)} disabled={busy} emptyLabel="Keine Etagen vorhanden." />
            <p className="mt-1.5 text-[11px] text-slate-400">Keine Auswahl = alle Etagen.</p>
          </div>

          <div>
            <FieldLabel>Zeitraum</FieldLabel>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  disabled={busy}
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-2 text-sm text-slate-700 outline-none ring-[#FF2A00]/30 focus:border-[#FF2A00] focus:ring-4 disabled:bg-slate-50"
                />
              </div>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  disabled={busy}
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-2 text-sm text-slate-700 outline-none ring-[#FF2A00]/30 focus:border-[#FF2A00] focus:ring-4 disabled:bg-slate-50"
                />
              </div>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">Bezieht sich auf das Anlagedatum der Mängel-Pins. Leer = kein Anfangs-/Endpunkt.</p>
          </div>

          <div>
            <FieldLabel>Gewerk</FieldLabel>
            <TradeChipsPicker trades={trades} selected={tradeIds} onToggle={makeToggle(setTradeIds)} disabled={busy} />
            <p className="mt-1.5 text-[11px] text-slate-400">Keine Auswahl = alle für dieses Projekt relevanten Gewerke.</p>
          </div>

          <div>
            <FieldLabel>Status</FieldLabel>
            <ExportChipGroup options={statusOptions} selected={statuses} onToggle={makeToggle(setStatuses)} disabled={busy} />
            <p className="mt-1.5 text-[11px] text-slate-400">Keine Auswahl = alle Status.</p>
          </div>

          <div>
            <FieldLabel>Ersteller / Benutzer</FieldLabel>
            <ExportChipGroup
              options={creatorOptions}
              selected={creators}
              onToggle={makeToggle(setCreators)}
              disabled={busy}
              emptyLabel="Keine Benutzer verfügbar (nur nach Anmeldung sichtbar)."
            />
            <p className="mt-1.5 text-[11px] text-slate-400">Keine Auswahl = alle Ersteller.</p>
          </div>

          {hasOnboardingInfo(project) && (
            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <input
                type="checkbox"
                checked={includeOnboarding}
                onChange={(e) => setIncludeOnboarding(e.target.checked)}
                disabled={busy}
                className="mt-0.5 accent-[#FF2A00]"
              />
              <span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <Info size={14} className="text-slate-400" /> Baustellen-Info auf Deckblatt einbinden
                </span>
                <span className="text-[11px] text-slate-400">
                  Anfahrt, Zugang &amp; Sicherheit, Ansprechpartner und Verpflegung erscheinen als eigener Abschnitt auf Seite 1.
                </span>
              </span>
            </label>
          )}

          {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
        </div>

        <div className={MODAL_FOOTER_ROW}>
          <button onClick={onClose} disabled={busy} className={BTN_SECONDARY}>
            Abbrechen
          </button>
          <button onClick={handleExport} disabled={busy} className={BTN_PRIMARY}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
            {busy ? "PDF wird erstellt…" : "PDF exportieren"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------------
// PROJEKT-FORMULAR — Anlegen & Bearbeiten
// ----------------------------------------------------------------------------------

function ProjectFormModal({ mode, project, trades = [], onManageTrades, onClose, onSave }) {
  const [name, setName] = useState(project?.name || "");
  const [projectNumber, setProjectNumber] = useState(project?.project_number || "");
  const [address, setAddress] = useState(project?.address || "");
  const [status, setStatus] = useState(project?.status || "Geplant");
  const [projectLeader, setProjectLeader] = useState(project?.project_leader || "");
  // Baustellen-Info für Nachunternehmer (Site Onboarding) — vier strukturierte
  // Freitextfelder, die neuen Nachunternehmern die Orientierung vor Ort erleichtern
  // (siehe hasOnboardingInfo/buildOnboardingSections sowie die Anzeige im
  // Projekt-Header in FloorOverview und die optionale PDF-Einbindung).
  const [siteAccessInfo, setSiteAccessInfo] = useState(project?.site_access_info || "");
  const [siteSafetyInfo, setSiteSafetyInfo] = useState(project?.site_safety_info || "");
  const [siteContactName, setSiteContactName] = useState(project?.site_contact_name || "");
  const [siteContactPhone, setSiteContactPhone] = useState(project?.site_contact_phone || "");
  const [siteAmenitiesInfo, setSiteAmenitiesInfo] = useState(project?.site_amenities_info || "");
  // selectedTrades: Array der ausgewählten Gewerke-IDs für dieses Projekt. Bei einem
  // Bestandsprojekt ohne gespeicherte Auswahl (resolveProjectTradeIds → null) startet
  // die Auswahl bewusst leer — der Hinweistext unten erklärt, was das für den Nutzer
  // bedeutet, statt es stillschweigend so zu belassen.
  const [selectedTrades, setSelectedTrades] = useState(() => resolveProjectTradeIds(project) ?? []);
  // Projekt-Titelbild (Gebäudeansicht für die Kachel, siehe ProjectCoverImage):
  // coverImageFile ist die neu ausgewählte, noch nicht hochgeladene Datei (null,
  // solange nichts Neues gewählt wurde); coverImagePreview ist, was aktuell im
  // Modal zu sehen ist — entweder das bestehende project.cover_image_url, eine
  // lokale Objekt-URL der neu gewählten Datei, oder null; coverImageRemoved hält
  // fest, ob ein vorhandenes Titelbild ausdrücklich entfernt wurde (siehe
  // handleSubmit — dann wird cover_image_url explizit auf null gesetzt).
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(project?.cover_image_url || null);
  const [coverImageRemoved, setCoverImageRemoved] = useState(false);
  const coverImageInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isLegacyTradeSelection = mode === "edit" && resolveProjectTradeIds(project) === null;

  // Zusätzlicher, expliziter Reset bei jedem Öffnen des Modals: greift sowohl beim
  // Anlegen (project ist null, also leeres Array) als auch beim Bearbeiten (project
  // ist gesetzt, also die gespeicherte Auswahl).
  useEffect(() => {
    setSelectedTrades(resolveProjectTradeIds(project) ?? []);
    setSiteAccessInfo(project?.site_access_info || "");
    setSiteSafetyInfo(project?.site_safety_info || "");
    setSiteContactName(project?.site_contact_name || "");
    setSiteContactPhone(project?.site_contact_phone || "");
    setSiteAmenitiesInfo(project?.site_amenities_info || "");
    setCoverImageFile(null);
    setCoverImagePreview(project?.cover_image_url || null);
    setCoverImageRemoved(false);
  }, [project]);

  const handleToggleTrade = (tradeId) => {
    setSelectedTrades((prev) => (prev.includes(tradeId) ? prev.filter((id) => id !== tradeId) : [...prev, tradeId]));
  };

  const handleCoverImagePick = (file) => {
    if (!file || submitting) return;
    if (!file.type.startsWith("image/")) {
      setError("Bitte nur ein Bildformat (PNG, JPG oder WebP) als Titelbild hochladen.");
      return;
    }
    setError("");
    setCoverImageFile(file);
    setCoverImagePreview(URL.createObjectURL(file));
    setCoverImageRemoved(false);
  };

  const handleCoverImageRemove = () => {
    if (submitting) return;
    setCoverImageFile(null);
    setCoverImagePreview(null);
    setCoverImageRemoved(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Bitte einen Projektnamen vergeben.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const fields = {
        name: name.trim(),
        project_number: projectNumber.trim(),
        address: address.trim(),
        status,
        project_leader: projectLeader.trim(),
        selected_trades: selectedTrades,
        site_access_info: siteAccessInfo.trim(),
        site_safety_info: siteSafetyInfo.trim(),
        site_contact_name: siteContactName.trim(),
        site_contact_phone: siteContactPhone.trim(),
        site_amenities_info: siteAmenitiesInfo.trim(),
      };
      // _coverImageFile ist kein echtes Projektfeld, sondern ein Marker für den
      // Aufrufer (App/handleSaveProject): dort wird die Datei erst NACH dem
      // Anlegen/Speichern des Projekts zu Supabase Storage hochgeladen (beim
      // Neuanlegen existiert die für den Storage-Pfad benötigte Projekt-ID vorher
      // noch nicht) und cover_image_url anschließend separat gesetzt.
      if (coverImageFile) {
        fields._coverImageFile = coverImageFile;
      } else if (coverImageRemoved) {
        fields.cover_image_url = null;
      }
      await onSave(fields);
      // Bei Erfolg schließt der Aufrufer (App) das Modal selbst.
    } catch (err) {
      console.error("Projekt konnte nicht gespeichert werden:", err);
      setError(err?.message || "Das Projekt konnte nicht gespeichert werden. Bitte erneut versuchen.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`${MODAL_BACKDROP_BASE} z-50`}>
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:max-w-xl sm:rounded-2xl">
        <div className={MODAL_HEADER_ROW}>
          <div>
            <p className={MODAL_EYEBROW}>
              {mode === "create" ? "Neues Projekt" : "Projekt bearbeiten"}
            </p>
            <h2 className="text-lg font-bold text-slate-900">{mode === "create" ? "Projekt anlegen" : project?.name}</h2>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className={MODAL_CLOSE_BTN_DISABLED}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel>Projektname</FieldLabel>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
                placeholder="z.B. Neubau Wohnpark Süd"
                className={TEXT_INPUT_CLASS}
              />
            </div>
            <div>
              <FieldLabel>Projektnummer</FieldLabel>
              <input
                value={projectNumber}
                onChange={(e) => setProjectNumber(e.target.value)}
                disabled={submitting}
                placeholder="optional, z.B. 2026-014"
                className={TEXT_INPUT_CLASS}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>Adresse / Standort</FieldLabel>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={submitting}
                placeholder="Straße, PLZ, Ort"
                className={TEXT_INPUT_CLASS}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>Projekt-Titelbild / Gebäudeansicht</FieldLabel>
              <input
                ref={coverImageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={submitting}
                onChange={(e) => handleCoverImagePick(e.target.files?.[0])}
              />
              {coverImagePreview ? (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                  <img src={coverImagePreview} alt="Titelbild-Vorschau" className="h-16 w-24 rounded-lg object-cover shadow-sm" />
                  <div className="flex-1 text-xs text-slate-500">
                    {coverImageFile ? "Neu ausgewählt — wird beim Speichern hochgeladen." : "Aktuelles Titelbild dieser Kachel."}
                  </div>
                  <button
                    type="button"
                    onClick={() => coverImageInputRef.current?.click()}
                    disabled={submitting}
                    className="rounded-md px-2 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Ändern
                  </button>
                  <button
                    type="button"
                    onClick={handleCoverImageRemove}
                    disabled={submitting}
                    className="rounded-md px-2 py-1.5 text-xs font-semibold text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Entfernen
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => !submitting && coverImageInputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-[#FF2A00] hover:bg-red-50/50 ${
                    submitting ? "cursor-not-allowed opacity-60" : ""
                  }`}
                >
                  <ImagePlus size={24} className="text-slate-400" />
                  <p className="mt-1.5 text-xs font-medium text-slate-500">
                    Optional — eigenes Foto der Fassade/Baustelle für die Kachel in der Projektübersicht
                  </p>
                </div>
              )}
              <p className="mt-1.5 text-[11px] text-slate-400">
                Ohne eigenes Titelbild zeigt die Kachel automatisch das erste Mängel-Pin-Foto, sonst ein Platzhalterbild.
              </p>
            </div>
            <div>
              <FieldLabel>Projekt-Status</FieldLabel>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={submitting}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none ring-[#FF2A00]/30 focus:border-[#FF2A00] focus:ring-4 disabled:bg-slate-50"
              >
                {PROJECT_STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Zuständiger Projektleiter</FieldLabel>
              <div className="relative">
                <Briefcase className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  value={projectLeader}
                  onChange={(e) => setProjectLeader(e.target.value)}
                  disabled={submitting}
                  placeholder="z.B. Milo"
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none ring-[#FF2A00]/30 placeholder:text-slate-400 focus:border-[#FF2A00] focus:ring-4 disabled:bg-slate-50"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Relevante Gewerke für dieses Projekt
              </label>
              {onManageTrades && (
                <button
                  type="button"
                  onClick={onManageTrades}
                  disabled={submitting}
                  title="Gewerke anlegen, umbenennen, deaktivieren oder sortieren"
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Wrench size={11} /> Gewerke verwalten
                </button>
              )}
            </div>
            {isLegacyTradeSelection && (
              <p className="mb-2 text-xs text-slate-400">
                Für dieses Projekt wurde noch keine Gewerke-Auswahl gespeichert — bislang stehen daher überall alle
                aktiven Gewerke zur Verfügung. Sobald hier gespeichert wird, gilt ausschließlich die unten getroffene
                Auswahl.
              </p>
            )}
            <TradeChipsPicker trades={trades} selected={selectedTrades} onToggle={handleToggleTrade} disabled={submitting} />
          </div>

          {/* Baustellen-Guide / Projekt-Orientierung: strukturierte Infofelder für
              externe Nachunternehmer, die neu auf die Baustelle kommen — prominent im
              Projekt-Header sichtbar (siehe FloorOverview) und optional Bestandteil
              der PDF-Exporte (siehe hasOnboardingInfo/drawOnboardingInfoBox). */}
          <div className="space-y-3.5 rounded-xl border border-amber-200 bg-amber-50/40 p-3.5">
            <div className="flex items-center gap-1.5">
              <Info size={14} className="text-amber-600" />
              <label className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                Baustellen-Guide für Nachunternehmer
              </label>
            </div>
            <p className="-mt-1.5 text-[11px] leading-snug text-amber-700/80">
              Erscheint prominent im Projekt-Header, damit sich neue Nachunternehmer vor Ort sofort orientieren können.
              Alle Felder sind optional.
            </p>
            <div>
              <FieldLabel>Anfahrt &amp; Parkmöglichkeiten</FieldLabel>
              <div className="relative">
                <Navigation className="pointer-events-none absolute left-3 top-2.5 text-slate-400" size={16} />
                <textarea
                  value={siteAccessInfo}
                  onChange={(e) => setSiteAccessInfo(e.target.value)}
                  disabled={submitting}
                  rows={2}
                  placeholder="z.B. Lieferanten-Einfahrt Tor 2, Parken auf Fläche B"
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none ring-[#FF2A00]/30 placeholder:text-slate-400 focus:border-[#FF2A00] focus:ring-4 disabled:bg-slate-50"
                />
              </div>
            </div>
            <div>
              <FieldLabel>Zugang &amp; Sicherheit</FieldLabel>
              <div className="relative">
                <ShieldCheck className="pointer-events-none absolute left-3 top-2.5 text-slate-400" size={16} />
                <textarea
                  value={siteSafetyInfo}
                  onChange={(e) => setSiteSafetyInfo(e.target.value)}
                  disabled={submitting}
                  rows={2}
                  placeholder="z.B. Anmeldung im Baucontainer 1, Helm- und Sicherheitsschuhpflicht"
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none ring-[#FF2A00]/30 placeholder:text-slate-400 focus:border-[#FF2A00] focus:ring-4 disabled:bg-slate-50"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel>Ansprechpartner / Bauleitung</FieldLabel>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    value={siteContactName}
                    onChange={(e) => setSiteContactName(e.target.value)}
                    disabled={submitting}
                    placeholder="Name"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none ring-[#FF2A00]/30 placeholder:text-slate-400 focus:border-[#FF2A00] focus:ring-4 disabled:bg-slate-50"
                  />
                </div>
              </div>
              <div>
                <FieldLabel>Telefonnummer</FieldLabel>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="tel"
                    value={siteContactPhone}
                    onChange={(e) => setSiteContactPhone(e.target.value)}
                    disabled={submitting}
                    placeholder="z.B. 0170 1234567"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none ring-[#FF2A00]/30 placeholder:text-slate-400 focus:border-[#FF2A00] focus:ring-4 disabled:bg-slate-50"
                  />
                </div>
              </div>
            </div>
            <div>
              <FieldLabel>Verpflegung &amp; Infrastruktur</FieldLabel>
              <div className="relative">
                <Coffee className="pointer-events-none absolute left-3 top-2.5 text-slate-400" size={16} />
                <textarea
                  value={siteAmenitiesInfo}
                  onChange={(e) => setSiteAmenitiesInfo(e.target.value)}
                  disabled={submitting}
                  rows={2}
                  placeholder="z.B. Bäckerei / Imbiss 200 m rechts"
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none ring-[#FF2A00]/30 placeholder:text-slate-400 focus:border-[#FF2A00] focus:ring-4 disabled:bg-slate-50"
                />
              </div>
            </div>
          </div>

          {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
        </div>

        <div className={MODAL_FOOTER_ROW}>
          <button
            onClick={onClose}
            disabled={submitting}
            className={BTN_SECONDARY}
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={BTN_PRIMARY}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {mode === "create" ? "Projekt anlegen" : "Änderungen speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------------
// SCREEN 1: PROJECT OVERVIEW
// ----------------------------------------------------------------------------------

// Kleiner, unabhängiger Favoriten-Stern — in Grid- wie Listenansicht identisch, daher
// als eigene Komponente statt doppelt inline formuliert. stopPropagation() ist hier
// zwingend: der Stern sitzt in beiden Ansichten auf/neben einer Fläche, die selbst
// einen Klick zum Öffnen des Projekts auslöst (Karten-Button bzw. Tabellenzeile) — ohne
// stopPropagation würde ein Klick auf den Stern zusätzlich das Projekt öffnen.
function FavoriteStarButton({ active, onToggle, size = 16, className = "" }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      title={active ? "Von Favoriten entfernen" : "Als Favorit markieren"}
      className={`rounded-full p-1 transition hover:scale-110 ${className}`}
    >
      <Star size={size} className={active ? "fill-yellow-400 text-yellow-400" : "fill-transparent text-slate-300"} />
    </button>
  );
}

// Dringlichkeits-Badge (Status "offen" + Priorität "hoch", siehe countUrgentPins) —
// ebenfalls in beiden Ansichten identisch. Rendert nichts, wenn count 0 ist, damit
// Aufrufer nicht jedes Mal selbst darauf prüfen müssen.
function UrgentPinsBadge({ count, compact = false }) {
  if (!count) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-[#FF2A00] font-bold text-white shadow ${
        compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      }`}
      title={`${count} offene(r) Mängel-Pin(s) mit hoher Priorität`}
    >
      <AlertCircle size={compact ? 11 : 12} /> {count} kritisch
    </span>
  );
}

// Bildfläche der Projekt-Kachel (Grid-Ansicht, siehe ProjectOverview): eigenes
// Grundriss-/Vorschaubild, jetzt nach fester Prioritätsreihenfolge: 1) explizit
// hochgeladenes Projekt-Titelbild (project.cover_image_url, siehe
// ProjectFormModal), 2) das älteste vorhandene Mängel-Pin-Foto des Projekts
// (resolveProjectPinPhoto), 3) das bestehende Grundriss-Vorschaubild (heroFloor,
// unverändert gegenüber bisher), erst wenn all das fehlt: das deterministische,
// kuratierte Platzhalterfoto (siehe getProjectPlaceholderImage). Eigene Komponente
// statt Inline-JSX in der .map()-Schleife, weil der Bild-Fallback (Platzhalterfoto
// lädt nicht) einen eigenen useState-Hook braucht — Hooks dürfen nicht innerhalb
// einer Schleife aufgerufen werden.
function ProjectCoverImage({ project, heroFloor, heroKind, pinPhotoUrl }) {
  const [placeholderFailed, setPlaceholderFailed] = useState(false);

  if (project?.cover_image_url) {
    return (
      <img
        src={project.cover_image_url}
        alt=""
        className="h-full w-full object-cover opacity-70 transition duration-300 group-hover:scale-105 group-hover:opacity-80"
      />
    );
  }
  if (pinPhotoUrl) {
    return (
      <img
        src={pinPhotoUrl}
        alt=""
        className="h-full w-full object-cover opacity-70 transition duration-300 group-hover:scale-105 group-hover:opacity-80"
      />
    );
  }
  if (heroKind === "cad") {
    return (
      <div
        className="flex h-full w-full items-center justify-center bg-[#0b1220]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(56,189,248,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.16) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      >
        <Ruler size={26} className="text-sky-300/80" />
      </div>
    );
  }
  if (heroKind === "pdf") {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-800">
        <FileText size={26} className="text-rose-400/80" />
      </div>
    );
  }
  if (heroKind === "image" && heroFloor) {
    // Nur echte Bilddateien werden per <img> gerendert — .dwg/.dxf/.pdf laufen über
    // die Zweige oben, damit kein <img> mit einer falschen Datei fehlschlägt und die
    // Karte leer bleibt.
    return (
      <img
        src={heroFloor.image_url}
        alt=""
        className="h-full w-full object-cover opacity-70 transition duration-300 group-hover:scale-105 group-hover:opacity-80"
      />
    );
  }
  // Kein eigenes Grundriss-/Vorschaubild vorhanden: statt des früher reinen Icon-
  // Platzhalters jetzt ein generisches, aber klar als solches gekennzeichnetes
  // Architektur-/Baustellenfoto (siehe "Platzhalterbild"-Hinweis in ProjectOverview).
  // Schlägt das externe Foto fehl (Netzwerk, Offline, künftig nicht mehr erreichbare
  // URL), fällt die Kachel automatisch auf das bisherige neutrale Icon zurück.
  if (placeholderFailed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-800">
        <Building2 size={26} className="text-slate-500" />
      </div>
    );
  }
  return (
    <img
      src={getProjectPlaceholderImage(project)}
      alt=""
      onError={() => setPlaceholderFailed(true)}
      className="h-full w-full object-cover opacity-70 transition duration-300 group-hover:scale-105 group-hover:opacity-80"
    />
  );
}

function ProjectOverview({
  projects,
  loading,
  onOpenProject,
  onToggleFavorite,
  onArchiveProject,
  query,
  setQuery,
  onCreateProject,
  onEditProject,
  onDeleteProject,
}) {
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'
  const [filterTab, setFilterTab] = useState("all"); // 'all' | 'favorites'
  const [archiveView, setArchiveView] = useState("active"); // 'active' | 'archive'
  const [sortBy, setSortBy] = useState("default"); // 'default' | 'urgency' | 'name'

  // Erste, grobe Weiche: aktive vs. archivierte/abgeschlossene Projekte (siehe
  // "Projekt abschließen"/"Projekt wiederherstellen" in FloorOverview sowie
  // handleToggleProjectArchive). Auf dem Standard-Bildschirm "Aktive Projekte"
  // bleiben abgeschlossene Projekte konsequent ausgeblendet, damit die Übersicht
  // nicht mit erledigten Baustellen zuwächst; im Archiv sieht man ausschließlich sie.
  const archivedCount = projects.filter((p) => p.is_archived).length;
  const scopedByArchive = projects.filter((p) => (archiveView === "archive" ? p.is_archived : !p.is_archived));

  const favoriteCount = scopedByArchive.filter((p) => p.is_favorite).length;

  const searched = scopedByArchive.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.address.toLowerCase().includes(query.toLowerCase())
  );
  const tabFiltered = filterTab === "favorites" ? searched.filter((p) => p.is_favorite) : searched;
  // Array.prototype.sort ist seit ES2019 stabil — bei sortBy "default" bleibt die vom
  // Server gelieferte Reihenfolge (created_at absteigend) exakt erhalten, bei "urgency"
  // dient sie als impliziter, sinnvoller Tiebreaker für gleich dringende Projekte.
  const sorted = [...tabFiltered].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name, "de");
    if (sortBy === "urgency") return countUrgentPins(b.floors) - countUrgentPins(a.floors);
    return 0;
  });

  const emptyMessage =
    projects.length === 0
      ? "Noch keine Projekte vorhanden."
      : archiveView === "archive" && archivedCount === 0
      ? "Noch keine Projekte im Archiv — abgeschlossene Projekte landen hier automatisch."
      : filterTab === "favorites" && favoriteCount === 0
      ? "Noch keine Favoriten markiert — auf den Stern eines Projekts tippen, um es hier anzupinnen."
      : `Kein Projekt gefunden für „${query}“.`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF2A00] text-white shadow-sm">
            <Building2 size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Baustellen-Dokumentation</h1>
            <p className="text-sm text-slate-500">Projekte, Grundrisse &amp; Mängel im Überblick</p>
          </div>
        </div>
        <button
          onClick={onCreateProject}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF2A00] px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#E02400]"
        >
          <Plus size={16} /> Neues Projekt
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Projekt nach Name oder Adresse suchen…"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 shadow-sm outline-none ring-[#FF2A00]/30 placeholder:text-slate-400 focus:border-[#FF2A00] focus:ring-4"
        />
      </div>

      {/* Archiv-Filter: grobe Weiche zwischen aktiven und abgeschlossenen/archivierten
          Projekten, bewusst als eigene Leiste oberhalb der übrigen Steuerung — die
          Alle/Favoriten-Tabs darunter verfeinern jeweils nur innerhalb dieser Auswahl. */}
      <div className="mb-3 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
        <button
          onClick={() => setArchiveView("active")}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
            archiveView === "active" ? "bg-[#FF2A00] text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          Aktive Projekte
        </button>
        <button
          onClick={() => setArchiveView("archive")}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
            archiveView === "archive" ? "bg-[#FF2A00] text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          <Archive size={12} />
          Archiv
          {archivedCount > 0 && (
            <span
              className={`inline-flex min-w-[1.1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                archiveView === "archive" ? "bg-white/25 text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              {archivedCount}
            </span>
          )}
        </button>
      </div>

      {/* Steuerungsleiste: Filter-Tabs links, Sortierung + Ansichts-Toggle rechts. */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setFilterTab("all")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              filterTab === "all" ? "bg-[#FF2A00] text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            Alle Projekte
          </button>
          <button
            onClick={() => setFilterTab("favorites")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              filterTab === "favorites" ? "bg-[#FF2A00] text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            <Star size={12} className={filterTab === "favorites" ? "fill-white" : "fill-slate-400 text-slate-400"} />
            Favoriten
            {favoriteCount > 0 && (
              <span
                className={`inline-flex min-w-[1.1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                  filterTab === "favorites" ? "bg-white/25 text-white" : "bg-slate-200 text-slate-600"
                }`}
              >
                {favoriteCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            title="Sortierung"
            className="rounded-lg border border-slate-200 bg-white py-1.5 pl-2.5 pr-7 text-xs font-semibold text-slate-600 shadow-sm outline-none ring-[#FF2A00]/30 focus:border-[#FF2A00] focus:ring-4"
          >
            <option value="default">Standard</option>
            <option value="urgency">Nach Dringlichkeit</option>
            <option value="name">Name (A-Z)</option>
          </select>
          <div className="inline-flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              title="Kachelansicht"
              className={`flex items-center justify-center p-1.5 transition ${
                viewMode === "grid" ? "bg-[#FF2A00] text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              }`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              title="Listenansicht"
              className={`flex items-center justify-center p-1.5 transition ${
                viewMode === "list" ? "bg-[#FF2A00] text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              }`}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingBlock label="Projekte werden geladen…" />
      ) : sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-sm text-slate-400">{emptyMessage}</div>
      ) : viewMode === "list" ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="w-10 px-3 py-2.5"></th>
                <th className="px-3 py-2.5">Projekt</th>
                <th className="px-3 py-2.5">Adresse / Objekt</th>
                <th className="px-3 py-2.5 text-center">Offene Pins</th>
                <th className="px-3 py-2.5 text-center">Kritische Fristen</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="w-24 px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((project) => {
                const { total, open } = countPins(project.floors);
                const urgent = countUrgentPins(project.floors);
                return (
                  <tr key={project.id} onClick={() => onOpenProject(project.id)} className="cursor-pointer transition hover:bg-slate-50">
                    <td className="px-3 py-2.5">
                      <FavoriteStarButton active={!!project.is_favorite} onToggle={() => onToggleFavorite(project)} />
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-slate-900">{project.name}</td>
                    <td className="max-w-[220px] truncate px-3 py-2.5 text-slate-500">{project.address}</td>
                    <td className="px-3 py-2.5 text-center">
                      {open > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-[#FF2A00]">
                          <AlertTriangle size={11} /> {open}
                        </span>
                      ) : (
                        <span className="text-slate-300">–</span>
                      )}
                      <span className="ml-1.5 text-[11px] text-slate-400">/ {total}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {urgent > 0 ? <UrgentPinsBadge count={urgent} compact /> : <span className="text-slate-300">–</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <ProjectStatusBadge status={project.status} />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Schnelle Reaktivierung direkt aus der Archiv-Liste heraus, ohne
                            das Projekt erst öffnen zu müssen (siehe Anforderung "mit einem
                            Klick sofort wieder reaktivieren"). */}
                        {project.is_archived && onArchiveProject && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onArchiveProject(project);
                            }}
                            title="Projekt wiederherstellen"
                            className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-100"
                          >
                            <ArchiveRestore size={12} /> Wiederherstellen
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenProject(project.id);
                          }}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-[#FF2A00] hover:text-white"
                        >
                          Öffnen <ChevronRight size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((project) => {
            const { total, open } = countPins(project.floors);
            const urgent = countUrgentPins(project.floors);
            // heroFloor.image_url ist nur bei Bestandsprojekten aus der Zeit vor der
            // Grundrisskizzen-Ebene (v7) noch gesetzt — neue Geschosse sind reine
            // Namens-Container ohne eigenen Grundriss (siehe createFloor), daher fällt
            // die Kartenvorschau ohne vorhandenes Bild auf ein generisches Symbol zurück.
            const heroFloor = project.floors?.find((f) => f.image_url);
            const heroKind = heroFloor ? resolveFloorKind(heroFloor) : null;
            const pinPhotoUrl = project.cover_image_url ? null : resolveProjectPinPhoto(project);
            const hasRealCoverPhoto = !!project.cover_image_url || !!pinPhotoUrl || !!heroFloor;
            return (
              <div
                key={project.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md"
              >
                {/* Der Stern liegt als eigenständiges Element ÜBER dem Karten-Button (nicht
                    darin verschachtelt) — ein <button> innerhalb eines <button> wäre
                    ungültiges HTML und würde Klicks unvorhersehbar auflösen. */}
                <FavoriteStarButton
                  active={!!project.is_favorite}
                  onToggle={() => onToggleFavorite(project)}
                  size={17}
                  className="absolute left-2 top-2 z-10 bg-slate-900/40 backdrop-blur-sm hover:bg-slate-900/60"
                />
                <button onClick={() => onOpenProject(project.id)} className="flex flex-col text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FF2A00]/30">
                  <div className="relative h-40 w-full overflow-hidden rounded-t-xl bg-slate-900">
                    <ProjectCoverImage project={project} heroFloor={heroFloor} heroKind={heroKind} pinPhotoUrl={pinPhotoUrl} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/10 to-transparent" />
                    <span className="absolute bottom-2 left-3 text-xs font-semibold uppercase tracking-wider text-white/90">
                      {project.status}
                    </span>
                    {!hasRealCoverPhoto && (
                      <span className="absolute bottom-2 right-3 rounded-full bg-slate-900/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/80 backdrop-blur-sm">
                        Platzhalterbild
                      </span>
                    )}
                    {open > 0 && (
                      <span className="absolute right-3 top-2.5 inline-flex items-center gap-1 rounded-full bg-[#FF2A00] px-2 py-0.5 text-[11px] font-bold text-white shadow">
                        <AlertTriangle size={11} /> {open} offen
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4 pb-2">
                    <h3 className="font-semibold text-slate-900">{project.name}</h3>
                    <p className="text-xs text-slate-500">{project.address}</p>
                    {project.project_leader && (
                      <p className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Briefcase size={13} className="text-slate-400" /> {project.project_leader}
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Layers size={14} className="text-slate-400" /> {(project.floors || []).length} Etagen
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={14} className="text-slate-400" /> {total} Pins
                      </span>
                      {urgent > 0 && <UrgentPinsBadge count={urgent} compact />}
                    </div>
                  </div>
                </button>
                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-2.5">
                  {/* Schnelle Reaktivierung direkt auf der Kachel im Archiv-Filter, ohne das
                      Projekt erst öffnen zu müssen (siehe Anforderung "mit einem Klick sofort
                      wieder reaktivieren"). */}
                  {project.is_archived && onArchiveProject && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchiveProject(project);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-100"
                    >
                      <ArchiveRestore size={13} /> Wiederherstellen
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditProject(project);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <Pencil size={13} /> Bearbeiten
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProject(project);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-rose-500 transition hover:bg-rose-50"
                  >
                    <Trash2 size={13} /> Löschen
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------------
// NEUE ETAGE / GRUNDRISS HOCHLADEN — MODAL
// ----------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------
// NEUES GESCHOSS — reiner Namens-Container (Ebene 2). Ein Geschoss besitzt ab
// sofort selbst keinen Grundriss mehr: Grundrisskizzen werden erst eine Ebene
// tiefer (siehe NewFloorPlanModal/EditFloorPlanModal, Ebene 3) angelegt, ein
// Geschoss kann mehrere davon enthalten.
// ----------------------------------------------------------------------------------

function NewFloorModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Bitte einen Namen für die Etage vergeben.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onSave(name.trim());
      // Bei Erfolg schließt der Aufrufer (App) das Modal selbst.
    } catch (err) {
      console.error("Etage konnte nicht gespeichert werden:", err);
      setError(err?.message || "Die Etage konnte nicht gespeichert werden. Bitte erneut versuchen.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`${MODAL_BACKDROP_BASE} z-50`}>
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[88vh] sm:max-w-md sm:rounded-2xl">
        <div className={MODAL_HEADER_ROW}>
          <div>
            <p className={MODAL_EYEBROW}>Neues Geschoss</p>
            <h2 className="text-lg font-bold text-slate-900">Etage anlegen</h2>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className={MODAL_CLOSE_BTN_DISABLED}
          >
            <X size={20} />
          </button>
        </div>

        <div className={MODAL_BODY_SCROLL}>
          <div>
            <FieldLabel>Name der Etage</FieldLabel>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              placeholder="z.B. 2. Obergeschoss"
              className={TEXT_INPUT_CLASS}
              autoFocus
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Grundrisskizzen (ein oder mehrere Pläne) legst du im nächsten Schritt innerhalb dieses Geschosses an.
            </p>
            {error && <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
          </div>
        </div>

        <div className={MODAL_FOOTER_ROW}>
          <button
            onClick={onClose}
            disabled={submitting}
            className={BTN_SECONDARY}
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={BTN_PRIMARY}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {submitting ? "Wird gespeichert…" : "Etage speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------------
// ETAGE BEARBEITEN — nur noch der Name, da der Grundriss selbst nicht mehr an der
// Etage, sondern an den einzelnen Grundrisskizzen hängt (siehe EditFloorPlanModal).
// ----------------------------------------------------------------------------------

function EditFloorModal({ floor, onClose, onSave }) {
  const [name, setName] = useState(floor?.name || "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Bitte einen Namen für die Etage vergeben.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onSave(name.trim());
      // Bei Erfolg schließt der Aufrufer (App) das Modal selbst.
    } catch (err) {
      console.error("Etage konnte nicht aktualisiert werden:", err);
      setError(err?.message || "Die Etage konnte nicht aktualisiert werden. Bitte erneut versuchen.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`${MODAL_BACKDROP_BASE} z-50`}>
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[88vh] sm:max-w-md sm:rounded-2xl">
        <div className={MODAL_HEADER_ROW}>
          <div>
            <p className={MODAL_EYEBROW}>Etage bearbeiten</p>
            <h2 className="text-lg font-bold text-slate-900">{floor?.name}</h2>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className={MODAL_CLOSE_BTN_DISABLED}
          >
            <X size={20} />
          </button>
        </div>

        <div className={MODAL_BODY_SCROLL}>
          <div>
            <FieldLabel>Name der Etage</FieldLabel>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              placeholder="z.B. 2. Obergeschoss"
              className={TEXT_INPUT_CLASS}
              autoFocus
            />
            {error && <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
          </div>
        </div>

        <div className={MODAL_FOOTER_ROW}>
          <button
            onClick={onClose}
            disabled={submitting}
            className={BTN_SECONDARY}
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={BTN_PRIMARY}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {submitting ? "Wird gespeichert…" : "Änderungen speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------------
// NEUE GRUNDRISSSKIZZE (Ebene 3) — Name + Datei-Upload je Skizze innerhalb eines
// Geschosses. Übernimmt die frühere Datei-Upload-Logik von NewFloorModal 1:1, jetzt
// aber je Grundrissskizze statt je Etage — ein Geschoss kann so beliebig viele
// Skizzen enthalten (z.B. "Grundriss Gesamt", "Bereich A / Nord", "Detailplan
// Haustechnik").
// ----------------------------------------------------------------------------------

function NewFloorPlanModal({ floor, onClose, onSave }) {
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileKind, setFileKind] = useState(null); // "image" | "pdf" | "cad"
  const [fileExt, setFileExt] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  const acceptFile = (f) => {
    if (!f || submitting) return;
    const info = getFileInfo(f);
    if (!info) {
      setError("Bitte nur PNG, JPG, WebP, PDF, DWG oder DXF hochladen.");
      return;
    }
    setError("");
    // Lokale Vorschau ausschließlich für die Anzeige in diesem Modal. Die tatsächlich
    // persistierte URL kommt erst nach dem Upload aus Supabase Storage (onSave -> createFloorPlanSketch).
    const objectUrl = URL.createObjectURL(f);
    setFile(f);
    setPreviewUrl(objectUrl);
    setFileKind(info.kind);
    setFileExt(info.ext);
    if (!name) {
      setName(f.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (submitting) return;
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Bitte einen Namen für die Grundrissskizze vergeben.");
      return;
    }
    if (!file) {
      setError("Bitte eine Grundriss-Datei hochladen.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onSave(name.trim(), file);
      // Bei Erfolg schließt der Aufrufer (App) das Modal selbst.
    } catch (err) {
      console.error("Grundrissskizze konnte nicht gespeichert werden:", err);
      setError(err?.message || "Die Grundrissskizze konnte nicht gespeichert werden. Bitte erneut versuchen.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`${MODAL_BACKDROP_BASE} z-50`}>
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[88vh] sm:max-w-md sm:rounded-2xl">
        <div className={MODAL_HEADER_ROW}>
          <div>
            <p className={MODAL_EYEBROW}>Neue Grundrissskizze{floor?.name ? ` · ${floor.name}` : ""}</p>
            <h2 className="text-lg font-bold text-slate-900">Grundriss hinzufügen</h2>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className={MODAL_CLOSE_BTN_DISABLED}
          >
            <X size={20} />
          </button>
        </div>

        <div className={MODAL_BODY_SCROLL}>
          <div>
            <FieldLabel>Name der Grundrissskizze</FieldLabel>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              placeholder="z.B. Grundriss Gesamt / Bereich A Nord"
              className={TEXT_INPUT_CLASS}
            />
          </div>

          <div>
            <FieldLabel>{FLOOR_UPLOAD_HINT}</FieldLabel>
            <input
              ref={inputRef}
              type="file"
              accept={FLOOR_UPLOAD_ACCEPT}
              className="hidden"
              disabled={submitting}
              onChange={(e) => acceptFile(e.target.files?.[0])}
            />
            <div
              onClick={() => !submitting && inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                if (!submitting) setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
                submitting ? "cursor-not-allowed opacity-60" : ""
              } ${isDragging ? "border-[#FF2A00] bg-red-50" : "border-slate-300 bg-slate-50 hover:border-[#FF2A00] hover:bg-red-50/50"}`}
            >
              {!previewUrl && (
                <>
                  <UploadCloud size={28} className={isDragging ? "text-[#FF2A00]" : "text-slate-400"} />
                  <p className="mt-2 text-sm font-medium text-slate-600">Datei hierher ziehen oder klicken</p>
                  <p className="mt-0.5 text-xs text-slate-400">PNG, JPG, WebP, PDF, DWG oder DXF</p>
                </>
              )}
              {previewUrl && fileKind === "image" && (
                <div className="w-full">
                  <img src={previewUrl} alt="Vorschau" className="mx-auto max-h-40 rounded-lg object-contain shadow-sm" />
                  <p className="mt-2 text-xs font-medium text-slate-500">{file?.name} — klicken zum Ändern</p>
                </div>
              )}
              {previewUrl && fileKind === "pdf" && (
                <div className="w-full">
                  <div className="mx-auto flex h-24 w-20 flex-col items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
                    <FileText size={26} className="text-rose-500" />
                    <span className="mt-1 text-[10px] font-semibold text-slate-500">PDF</span>
                  </div>
                  <p className="mt-2 text-xs font-medium text-slate-500">{file?.name} — klicken zum Ändern</p>
                </div>
              )}
              {previewUrl && fileKind === "cad" && (
                <div className="w-full">
                  <div className="mx-auto flex h-24 w-24 flex-col items-center justify-center rounded-lg bg-[#0b1220] shadow-sm ring-1 ring-sky-400/30">
                    <Ruler size={24} className="text-sky-300" />
                    <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-sky-300">{fileExt}</span>
                  </div>
                  <p className="mt-2 text-xs font-medium text-slate-500">{file?.name} — klicken zum Ändern</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">CAD-Datei erkannt — wird als Blueprint-Vorschau dargestellt.</p>
                </div>
              )}
            </div>
            {error && <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
          </div>
        </div>

        <div className={MODAL_FOOTER_ROW}>
          <button
            onClick={onClose}
            disabled={submitting}
            className={BTN_SECONDARY}
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={BTN_PRIMARY}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {submitting ? "Wird hochgeladen…" : "Grundrissskizze speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------------
// GRUNDRISSSKIZZE BEARBEITEN — Name ändern und/oder Datei austauschen. Analog zu
// NewFloorPlanModal, aber mit vorbefüllten Werten und optionalem Datei-Upload: wird
// keine neue Datei gewählt, bleibt die bisherige Skizzen-Datei unverändert.
// ----------------------------------------------------------------------------------

function EditFloorPlanModal({ plan, onClose, onSave }) {
  const [name, setName] = useState(plan?.name || "");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileKind, setFileKind] = useState(null); // "image" | "pdf" | "cad"
  const [fileExt, setFileExt] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  const existingKind = resolveFloorKind(plan);
  const existingFileName = deriveFileNameFromUrl(plan?.image_url);
  const existingExt = deriveFileExt(existingFileName) || "dwg";

  const acceptFile = (f) => {
    if (!f || submitting) return;
    const info = getFileInfo(f);
    if (!info) {
      setError("Bitte nur PNG, JPG, WebP, PDF, DWG oder DXF hochladen.");
      return;
    }
    setError("");
    // Lokale Vorschau ausschließlich für die Anzeige in diesem Modal. Die tatsächlich
    // persistierte URL kommt erst nach dem Upload aus Supabase Storage (onSave -> updateFloorPlanSketch).
    const objectUrl = URL.createObjectURL(f);
    setFile(f);
    setPreviewUrl(objectUrl);
    setFileKind(info.kind);
    setFileExt(info.ext);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (submitting) return;
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Bitte einen Namen für die Grundrissskizze vergeben.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      // file ist bewusst optional: onSave(name, null) aktualisiert nur den Namen und
      // lässt die bestehende Skizzen-Datei unangetastet.
      await onSave(name.trim(), file);
      // Bei Erfolg schließt der Aufrufer (App) das Modal selbst.
    } catch (err) {
      console.error("Grundrissskizze konnte nicht aktualisiert werden:", err);
      setError(err?.message || "Die Grundrissskizze konnte nicht aktualisiert werden. Bitte erneut versuchen.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`${MODAL_BACKDROP_BASE} z-50`}>
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[88vh] sm:max-w-md sm:rounded-2xl">
        <div className={MODAL_HEADER_ROW}>
          <div>
            <p className={MODAL_EYEBROW}>Grundrissskizze bearbeiten</p>
            <h2 className="text-lg font-bold text-slate-900">{plan?.name}</h2>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className={MODAL_CLOSE_BTN_DISABLED}
          >
            <X size={20} />
          </button>
        </div>

        <div className={MODAL_BODY_SCROLL}>
          <div>
            <FieldLabel>Name der Grundrissskizze</FieldLabel>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              placeholder="z.B. Grundriss Gesamt / Bereich A Nord"
              className={TEXT_INPUT_CLASS}
            />
          </div>

          <div>
            <FieldLabel>
              Grundriss austauschen (optional)
            </FieldLabel>
            <input
              ref={inputRef}
              type="file"
              accept={FLOOR_UPLOAD_ACCEPT}
              className="hidden"
              disabled={submitting}
              onChange={(e) => acceptFile(e.target.files?.[0])}
            />
            <div
              onClick={() => !submitting && inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                if (!submitting) setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
                submitting ? "cursor-not-allowed opacity-60" : ""
              } ${isDragging ? "border-[#FF2A00] bg-red-50" : "border-slate-300 bg-slate-50 hover:border-[#FF2A00] hover:bg-red-50/50"}`}
            >
              {!previewUrl && (
                <>
                  {existingKind === "image" && plan?.image_url ? (
                    <img src={plan.image_url} alt="Aktueller Grundriss" className="mx-auto max-h-32 rounded-lg object-contain shadow-sm" />
                  ) : existingKind === "pdf" ? (
                    <div className="mx-auto flex h-20 w-16 flex-col items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
                      <FileText size={22} className="text-rose-500" />
                      <span className="mt-1 text-[10px] font-semibold text-slate-500">PDF</span>
                    </div>
                  ) : (
                    <div className="mx-auto flex h-20 w-20 flex-col items-center justify-center rounded-lg bg-[#0b1220] shadow-sm ring-1 ring-sky-400/30">
                      <Ruler size={20} className="text-sky-300" />
                      <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-sky-300">{existingExt}</span>
                    </div>
                  )}
                  <p className="mt-2 text-xs font-medium text-slate-500">Aktueller Grundriss — klicken zum Austauschen</p>
                  <p className="mt-0.5 text-xs text-slate-400">PNG, JPG, WebP, PDF, DWG oder DXF</p>
                </>
              )}
              {previewUrl && fileKind === "image" && (
                <div className="w-full">
                  <img src={previewUrl} alt="Neue Vorschau" className="mx-auto max-h-40 rounded-lg object-contain shadow-sm" />
                  <p className="mt-2 text-xs font-medium text-slate-500">{file?.name} — klicken zum Ändern</p>
                </div>
              )}
              {previewUrl && fileKind === "pdf" && (
                <div className="w-full">
                  <div className="mx-auto flex h-24 w-20 flex-col items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
                    <FileText size={26} className="text-rose-500" />
                    <span className="mt-1 text-[10px] font-semibold text-slate-500">PDF</span>
                  </div>
                  <p className="mt-2 text-xs font-medium text-slate-500">{file?.name} — klicken zum Ändern</p>
                </div>
              )}
              {previewUrl && fileKind === "cad" && (
                <div className="w-full">
                  <div className="mx-auto flex h-24 w-24 flex-col items-center justify-center rounded-lg bg-[#0b1220] shadow-sm ring-1 ring-sky-400/30">
                    <Ruler size={24} className="text-sky-300" />
                    <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-sky-300">{fileExt}</span>
                  </div>
                  <p className="mt-2 text-xs font-medium text-slate-500">{file?.name} — klicken zum Ändern</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">CAD-Datei erkannt — wird als Blueprint-Vorschau dargestellt.</p>
                </div>
              )}
            </div>
            {error && <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
          </div>
        </div>

        <div className={MODAL_FOOTER_ROW}>
          <button
            onClick={onClose}
            disabled={submitting}
            className={BTN_SECONDARY}
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={BTN_PRIMARY}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {submitting ? "Wird gespeichert…" : "Änderungen speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------------
// SCREEN 2: FLOOR OVERVIEW
// ----------------------------------------------------------------------------------

// Baustellen-Guide / Projekt-Orientierung (Site Onboarding Info) — zeigt die vier
// strukturierten Infofelder aus dem Projektformular (siehe ProjectFormModal) prominent
// im Projekt-Header an, damit sich neue Nachunternehmer sofort orientieren können.
// Rendert nichts, sobald für das Projekt kein einziges Feld gepflegt ist (siehe
// hasOnboardingInfo) — eine leere Box wäre reine Ablenkung. Standardmäßig
// aufgeklappt ("prominent"), lässt sich aber einklappen, sobald man sich einmal
// orientiert hat.
function SiteOnboardingPanel({ project }) {
  const [open, setOpen] = useState(true);
  const sections = buildOnboardingSections(project);
  if (sections.length === 0) return null;
  const ICONS_BY_LABEL = {
    "Anfahrt & Parkmöglichkeiten": Navigation,
    "Zugang & Sicherheit": ShieldCheck,
    "Ansprechpartner / Bauleitung": Phone,
    "Verpflegung & Infrastruktur": Coffee,
  };
  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-amber-200 bg-amber-50/60 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left transition hover:bg-amber-50"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-amber-800">
          <Info size={16} /> Baustellen-Info für Nachunternehmer
        </span>
        {open ? <ChevronRight size={16} className="rotate-90 text-amber-600 transition" /> : <ChevronRight size={16} className="text-amber-600 transition" />}
      </button>
      {open && (
        <div className="grid grid-cols-1 gap-3 border-t border-amber-200/70 px-4 py-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map((s) => {
            const Icon = ICONS_BY_LABEL[s.label] || Info;
            return (
              <div key={s.label} className="flex items-start gap-2">
                <Icon size={15} className="mt-0.5 shrink-0 text-amber-600" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">{s.label}</p>
                  <p className="whitespace-pre-line text-sm text-slate-700">{s.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FloorOverview({
  project,
  floors,
  trades = [],
  loading,
  onBack,
  onOpenFloor,
  onOpenAddFloor,
  onEditProject,
  onDeleteProject,
  onArchiveProject,
  onEditFloor,
  onDeleteFloor,
  onExportPdf,
  readOnly = false,
}) {
  // Bestandsprojekte ohne gespeicherte Gewerke-Auswahl (siehe resolveProjectTradeIds)
  // zeigen hier weiterhin alle aktiven Gewerke, statt fälschlich "keine Gewerke".
  const projectTradeIds = resolveProjectTradeIds(project);
  const projectTrades =
    projectTradeIds === null ? trades.filter((t) => t.active) : trades.filter((t) => projectTradeIds.includes(t.id));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
      >
        <ChevronLeft size={17} /> Zurück zu allen Projekten
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{project.name}</h1>
            <ProjectStatusBadge status={project.status} />
            {project.project_number && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-500">
                {project.project_number}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">{project.address}</p>
          {project.project_leader && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <Briefcase size={13} className="text-slate-400" /> Projektleitung: {project.project_leader}
            </p>
          )}
          <div className="mt-3 max-w-xl">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Relevante Gewerke</p>
            {projectTrades.length === 0 ? (
              <p className="text-xs text-slate-400">Für dieses Projekt sind noch keine Gewerke hinterlegt.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {projectTrades.map((t) => (
                  <TradeBadge key={t.id} trade={t} />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEditProject(project)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              <Pencil size={15} /> Bearbeiten
            </button>
            <button
              onClick={() => onDeleteProject(project)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-rose-50"
            >
              <Trash2 size={15} /> Löschen
            </button>
            {/* Reversibler Abschluss-Status (siehe handleToggleProjectArchive): schaltet
                zwischen "aktiv" und "abgeschlossen/archiviert" um, ohne dass das Projekt
                dabei je gelöscht wird — daher bewusst zwischen "Löschen" und "PDF-Export"
                platziert und optisch klar von der destruktiven Löschen-Aktion abgesetzt. */}
            {onArchiveProject && (
              <button
                onClick={() => onArchiveProject(project)}
                title={
                  project.is_archived
                    ? "Setzt den Status zurück auf „In Bearbeitung“ und blendet das Projekt wieder bei den aktiven Projekten ein."
                    : "Setzt den Status auf „Abgeschlossen“ und verschiebt das Projekt ins Archiv — jederzeit wieder herstellbar."
                }
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold shadow-sm transition ${
                  project.is_archived
                    ? "border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {project.is_archived ? (
                  <>
                    <ArchiveRestore size={15} /> Projekt wiederherstellen
                  </>
                ) : (
                  <>
                    <Archive size={15} /> Projekt abschließen
                  </>
                )}
              </button>
            )}
            {onExportPdf && (
              <button
                onClick={() => onExportPdf(project)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
              >
                <FileDown size={15} /> PDF-Export
              </button>
            )}
          </div>
          <button
            onClick={onOpenAddFloor}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF2A00] px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#E02400]"
          >
            <Plus size={16} /> Neues Geschoss hinzufügen
          </button>
        </div>
      </div>

      <SiteOnboardingPanel project={project} />

      {loading ? (
        <LoadingBlock label="Etagen werden geladen…" />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {floors.map((floor) => {
            const floorPins = floor.pins || [];
            const open = floorPins.filter((p) => p.status === "offen").length;
            const inProgress = floorPins.filter((p) => p.status === "bearbeitung").length;
            const done = floorPins.filter((p) => p.status === "erledigt").length;
            const sketchCount = (floor.floor_plans || []).length;
            return (
              <div
                key={floor.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md"
              >
                <button
                  onClick={() => onOpenFloor(floor.id)}
                  className="flex flex-col text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FF2A00]/30"
                >
                  <div className="relative flex h-24 w-full flex-col items-center justify-center gap-1 overflow-hidden bg-slate-900 sm:h-28">
                    <Layers size={22} className="text-slate-500" />
                    <span className="text-[10px] font-semibold text-slate-400">
                      {sketchCount} Grundrisskizze{sketchCount !== 1 ? "n" : ""}
                    </span>
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/10" />
                    {open > 0 && (
                      <span className="absolute right-2 top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF2A00] px-1 text-[11px] font-bold text-white shadow">
                        {open}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-slate-900">{floor.name}</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {floorPins.length} Pin{floorPins.length !== 1 ? "s" : ""} erfasst
                    </p>
                    {floorPins.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1 text-[10px] font-semibold">
                        {open > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-1.5 py-0.5 text-red-700 ring-1 ring-inset ring-red-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#FF2A00]" /> {open} offen
                          </span>
                        )}
                        {inProgress > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-amber-700 ring-1 ring-inset ring-amber-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {inProgress} in Arbeit
                          </span>
                        )}
                        {done > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-emerald-700 ring-1 ring-inset ring-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {done} erledigt
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mx-3 mb-3 mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition group-hover:bg-[#FF2A00] group-hover:text-white">
                    Geschoss öffnen <ChevronRight size={13} />
                  </div>
                </button>
                <div className="flex items-center gap-1 border-t border-slate-100 px-2 py-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditFloor(floor);
                    }}
                    title="Etage bearbeiten"
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <Pencil size={12} /> Bearbeiten
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFloor(floor);
                    }}
                    title="Etage löschen"
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold text-rose-500 transition hover:bg-rose-50"
                  >
                    <Trash2 size={12} /> Löschen
                  </button>
                </div>
              </div>
            );
          })}

          <button
            onClick={onOpenAddFloor}
            className="flex min-h-[104px] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-[#FF2A00] hover:bg-red-50/40 hover:text-[#FF2A00] sm:min-h-[120px]"
          >
            <UploadCloud size={22} />
            <span className="text-xs font-semibold">Etage hinzufügen</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------------
// SCREEN 3: GRUNDRISSSKIZZEN-ÜBERSICHT je Geschoss
// Ein Geschoss kann mehrere Grundrisskizzen enthalten (z.B. "Grundriss Gesamt",
// "Bereich A / Nord", "Detailplan Haustechnik") — erst der Klick auf eine konkrete
// Skizze führt zur interaktiven Planansicht (Screen 4) mit den daran gebundenen Pins.
// ----------------------------------------------------------------------------------

function SketchOverview({ floor, plans, loading, onBack, onOpenPlan, onOpenAddPlan, onEditPlan, onDeletePlan, readOnly = false }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
      >
        <ChevronLeft size={17} /> Zurück zur Geschossübersicht
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{floor?.name}</h1>
          <p className="text-sm text-slate-500">
            Grundrisskizzen dieses Geschosses — jede Skizze hat ihre eigenen Pins und Mängel.
          </p>
        </div>
        <button
          onClick={onOpenAddPlan}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF2A00] px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#E02400]"
        >
          <Plus size={16} /> Neue Grundrissskizze hinzufügen
        </button>
      </div>

      {loading ? (
        <LoadingBlock label="Grundrisskizzen werden geladen…" />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {plans.map((plan) => {
            const planPins = plan.pins || [];
            const open = planPins.filter((p) => p.status === "offen").length;
            const inProgress = planPins.filter((p) => p.status === "bearbeitung").length;
            const done = planPins.filter((p) => p.status === "erledigt").length;
            const planKind = resolveFloorKind(plan);
            const isCad = planKind === "cad";
            const isPdf = planKind === "pdf";
            const isSvg = planKind === "svg";
            const fileName = deriveFileNameFromUrl(plan.image_url);
            return (
              <div
                key={plan.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md"
              >
                <button
                  onClick={() => onOpenPlan(plan.id)}
                  className="flex flex-col text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FF2A00]/30"
                >
                  <div className="relative h-24 w-full overflow-hidden bg-slate-900 sm:h-28">
                    {isCad && (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-[#0b1220]" style={{
                        backgroundImage: "linear-gradient(rgba(56,189,248,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.16) 1px, transparent 1px)",
                        backgroundSize: "14px 14px",
                      }}>
                        <Ruler size={20} className="text-sky-300" />
                        <span className="text-[10px] font-semibold text-sky-300/80">CAD-Grundriss</span>
                      </div>
                    )}
                    {isPdf && (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-slate-800">
                        <FileText size={22} className="text-rose-400" />
                        <span className="text-[10px] font-semibold text-slate-300">PDF-Grundriss</span>
                      </div>
                    )}
                    {!isCad && !isPdf && (
                      <img src={plan.image_url} alt="" className="h-full w-full object-cover opacity-80 transition duration-300 group-hover:scale-105" />
                    )}
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/10" />
                    {isCad && <CadBadge ext={deriveFileExt(fileName) || "dwg"} className="absolute left-2 top-2" />}
                    {isSvg && <VectorPlanBadge className="absolute left-2 top-2" />}
                    {open > 0 && (
                      <span className="absolute right-2 top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF2A00] px-1 text-[11px] font-bold text-white shadow">
                        {open}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-slate-900">{plan.name}</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {planPins.length} Pin{planPins.length !== 1 ? "s" : ""} erfasst
                    </p>
                    {planPins.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1 text-[10px] font-semibold">
                        {open > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-1.5 py-0.5 text-red-700 ring-1 ring-inset ring-red-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#FF2A00]" /> {open} offen
                          </span>
                        )}
                        {inProgress > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-amber-700 ring-1 ring-inset ring-amber-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {inProgress} in Arbeit
                          </span>
                        )}
                        {done > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-emerald-700 ring-1 ring-inset ring-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {done} erledigt
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mx-3 mb-3 mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition group-hover:bg-[#FF2A00] group-hover:text-white">
                    Skizze öffnen <ChevronRight size={13} />
                  </div>
                </button>
                <div className="flex items-center gap-1 border-t border-slate-100 px-2 py-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditPlan(plan);
                    }}
                    title="Grundrissskizze bearbeiten"
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <Pencil size={12} /> Bearbeiten
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePlan(plan);
                    }}
                    title="Grundrissskizze löschen"
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold text-rose-500 transition hover:bg-rose-50"
                  >
                    <Trash2 size={12} /> Löschen
                  </button>
                </div>
              </div>
            );
          })}

          <button
            onClick={onOpenAddPlan}
            className="flex min-h-[104px] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-[#FF2A00] hover:bg-red-50/40 hover:text-[#FF2A00] sm:min-h-[120px]"
          >
            <UploadCloud size={22} />
            <span className="text-xs font-semibold">Grundrissskizze hinzufügen</span>
          </button>

          {!loading && plans.length === 0 && (
            <p className="col-span-full text-xs text-slate-400">
              Für dieses Geschoss ist noch keine Grundrissskizze hinterlegt. Füge oben eine erste Skizze hinzu, um Pins setzen zu können.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------------
// SCREEN 4: INTERACTIVE FLOOR PLAN
// ----------------------------------------------------------------------------------

// Sichtfeld-Fächer, der die Blickrichtung/den Aufnahmewinkel eines Pins visualisiert.
// 0° zeigt nach oben (Norden), 90° nach Osten (rechts), 180° nach Süden (unten), 270°
// nach Westen (links) — im Uhrzeigersinn steigend, exakt dieselbe Konvention wie das
// Kompass-Eingabefeld im Pin-Modal (siehe AngleCompass). Die Spitze (schmales Ende)
// sitzt AN der Pin-Position, der Fächer öffnet sich von dort aus in die Blickrichtung
// — dieselbe Lesart wie beim Zeichnen des Blickrichtungsindikators im PDF-Export
// (siehe drawPdfViewCone). Frühere Fassung: Spitze und Drehpunkt lagen oben, der
// sichtbar geöffnete (und damit für das Auge richtungsgebende) Teil des Fächers unten
// — dadurch zeigte der Fächer auf dem Plan bei jedem Winkel exakt 180° entgegengesetzt
// zum im Kompass eingestellten Wert. Pfad und Drehpunkt sind hier deshalb gegenüber der
// ursprünglichen Fassung vertikal gespiegelt (samt entsprechend gespiegeltem
// SVG-Sweep-Flag), NICHT per zusätzlichem Rotations-Offset "korrigiert" — der Fächer
// zeigt dadurch bei jedem Winkel korrekt in dieselbe Richtung wie der Kompass.
function ViewCone({ angle, colorClass }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="pointer-events-none absolute h-14 w-14"
      style={{
        left: "50%",
        bottom: "0px",
        transform: `translate(-50%, 0) rotate(${angle}deg)`,
        transformOrigin: "50% 100%",
      }}
    >
      <path
        d="M 50 96 L 18 38 A 40 40 0 0 1 82 38 Z"
        className={colorClass}
        fill="currentColor"
        opacity="0.22"
      />
      <path d="M 50 96 L 18 38 A 40 40 0 0 1 82 38 Z" className={colorClass} fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.55" />
    </svg>
  );
}

function PinMarker({ pin, number, draggable, isDragging, onClick, onDragStart, viewScale = 1 }) {
  const s = STATUS[pin.status];
  // Gegen-Skalierung: die sichtbare Pin-Größe bleibt unabhängig vom Zoomfaktor der
  // Grundriss-"Bühne" konstant (wie bei Kartenmarkern üblich), während die Position
  // (left/top in %, weiter unten am Button) exakt am Grundriss verankert bleibt — das
  // äußere Button-Element wird NICHT skaliert, nur der innere Inhalt, daher bezieht
  // sich die -50%/-100%-Verschiebung des Buttons weiterhin auf dessen unskalierte,
  // layoutwirksame Originalgröße und bleibt so bei jedem Zoomlevel exakt und stabil.
  const counterScale = 1 / (viewScale || 1);
  return (
    <button
      onPointerDown={(e) => {
        if (!draggable) return;
        e.stopPropagation();
        onDragStart(e);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(pin);
      }}
      style={{ left: `${pin.x}%`, top: `${pin.y}%`, touchAction: draggable ? "none" : undefined }}
      className={`absolute z-10 -translate-x-1/2 -translate-y-full focus:outline-none ${
        draggable ? "cursor-grab active:cursor-grabbing" : ""
      } ${isDragging ? "opacity-70" : ""}`}
      title={`${pin.title} (${pin.angle ?? 0}°)${draggable ? " — ziehen zum Verschieben" : ""}`}
    >
      <span
        className="relative flex flex-col items-center drop-shadow-md"
        style={{ transform: `scale(${counterScale})`, transformOrigin: "50% 100%" }}
      >
        <ViewCone angle={pin.angle ?? 0} colorClass={s.text} />
        {pin.status === "offen" && !isDragging && (
          <span className={`absolute -top-1 h-7 w-7 animate-ping rounded-full ${s.dot} opacity-40`} />
        )}
        {/* Visuelle Pin-Nummerierung: voll deckender, statusfarbener Marker (statt weißer
            Fläche mit dünner Kontur) als Hintergrund für eine fett gedruckte, weiße
            Nummer — zentriert im runden "Kopf" des Icons, für 1:1-Abgleich mit der
            "Nr."-Spalte im Geschoss-Export (siehe pinNumberById in FloorPlanView). */}
        <MapPin
          size={30}
          strokeWidth={1.5}
          className={`${s.text} fill-current transition group-hover:scale-110`}
          style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.35))" }}
        />
        {number != null && (
          <span
            className="pointer-events-none absolute top-[6px] left-1/2 -translate-x-1/2 text-[10px] font-extrabold leading-none text-white"
            style={{ textShadow: "0 1px 1.5px rgba(0,0,0,0.55)" }}
          >
            {number}
          </span>
        )}
      </span>
    </button>
  );
}

// ----------------------------------------------------------------------------------
// SKIZZEN-NOTIZEN (PLAN ANNOTATIONS) — reine Text-Marker auf dem Grundriss, ergänzend
// zu den nummerierten Mängel-Pins (siehe plan_notes-Datenschicht weiter oben). Anders
// als ein Mängel-Pin trägt eine Notiz keine Nummer, keinen Status und kein Foto — sie
// ist ein reines Vor-Ort-Orientierungswerkzeug ("Gefahrenbereich", "Fluchtweg
// freihalten", …), gerendert als stilisiertes Text-Banner direkt auf dem Plan.
// ----------------------------------------------------------------------------------
const PLAN_NOTE_COLORS = {
  amber: { label: "Hinweis", bg: "bg-amber-100", border: "border-amber-400", text: "text-amber-900", dot: "bg-amber-500" },
  rose: { label: "Gefahr / Sperrung", bg: "bg-rose-100", border: "border-rose-400", text: "text-rose-900", dot: "bg-rose-500" },
  sky: { label: "Lager / Info", bg: "bg-sky-100", border: "border-sky-400", text: "text-sky-900", dot: "bg-sky-500" },
  emerald: { label: "Fluchtweg / Freihalten", bg: "bg-emerald-100", border: "border-emerald-400", text: "text-emerald-900", dot: "bg-emerald-500" },
};
const PLAN_NOTE_QUICK_TEXTS = ["Gefahrenbereich", "Lagerfläche Elektro", "Fluchtweg freihalten", "Baustelleneinrichtung"];

function PlanNoteMarker({ note, draggable, isDragging, onClick, onDragStart, viewScale = 1 }) {
  const c = PLAN_NOTE_COLORS[note.color] || PLAN_NOTE_COLORS.amber;
  // Gegen-Skalierung analog zu PinMarker — die Notiz bleibt bei jedem Zoomfaktor
  // gleich groß lesbar, ihre Position (left/top in %) bleibt exakt am Plan verankert.
  const counterScale = 1 / (viewScale || 1);
  return (
    <button
      onPointerDown={(e) => {
        if (!draggable) return;
        e.stopPropagation();
        onDragStart(e);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(note);
      }}
      style={{ left: `${note.x}%`, top: `${note.y}%`, touchAction: draggable ? "none" : undefined }}
      className={`absolute z-[8] -translate-x-1/2 -translate-y-1/2 focus:outline-none ${
        draggable ? "cursor-grab active:cursor-grabbing" : ""
      } ${isDragging ? "opacity-70" : ""}`}
      title={`${note.text}${draggable ? " — ziehen zum Verschieben" : ""}`}
    >
      <span
        className={`flex max-w-[38vw] items-center gap-1.5 rounded-lg border-2 px-2.5 py-1.5 shadow-md sm:max-w-[220px] ${c.bg} ${c.border} ${c.text}`}
        style={{ transform: `scale(${counterScale})`, transformOrigin: "50% 50%" }}
      >
        <StickyNote size={13} className="shrink-0" />
        <span className="truncate text-[11px] font-bold leading-tight">{note.text}</span>
      </span>
    </button>
  );
}

// Gemeinsame Pin-/Notiz-Ebene, unverändert für alle Grundriss-Arten (CAD-Platzhalter,
// Raster-Bild-Fallback, und — seit PlanSvgStage — auch innerhalb des SVG-Koordinaten-
// raums von PDF-/SVG-Vektor-Grundrissen) — vermeidet doppelten JSX-Code an den
// verschiedenen Rendering-Aufrufstellen in FloorPlanView.
function PinsAndNotesLayer({
  visiblePins,
  pinNumberById,
  draggingPinId,
  dragPos,
  session,
  scale,
  startDrag,
  dragMovedRef,
  onPinClick,
  showNotes,
  planNotes,
  draggingNoteId,
  noteDragPos,
  startNoteDrag,
  noteDragMovedRef,
  onNoteClick,
  isEditMode = false,
}) {
  // Drag-&-Drop ist zusätzlich zur Anmeldung (session) an den Bearbeitungs-Modus
  // gekoppelt (siehe isEditMode-Kommentar in FloorPlanView) — ist isEditMode aus,
  // ist canDrag false und PinMarker/PlanNoteMarker brechen jeden Drag-Start bereits
  // in ihrem eigenen onPointerDown-Handler ab (kein stopPropagation, das Event
  // bubblet ungehindert zum Viewport hoch), Tippen/Klicken zum Öffnen bleibt davon
  // unberührt, weil onClick unabhängig vom draggable-Zustand ausgelöst wird.
  const canDrag = !!session && isEditMode;
  return (
    <>
      {visiblePins.map((pin) => (
        <PinMarker
          key={pin.id}
          pin={draggingPinId === pin.id && dragPos ? { ...pin, x: dragPos.x, y: dragPos.y } : pin}
          number={pinNumberById.get(pin.id)}
          draggable={canDrag}
          isDragging={draggingPinId === pin.id}
          viewScale={scale}
          onDragStart={(e) => startDrag(pin, e)}
          onClick={(p) => {
            if (dragMovedRef.current) {
              dragMovedRef.current = false;
              return;
            }
            onPinClick(p);
          }}
        />
      ))}
      {showNotes &&
        planNotes.map((note) => (
          <PlanNoteMarker
            key={note.id}
            note={draggingNoteId === note.id && noteDragPos ? { ...note, x: noteDragPos.x, y: noteDragPos.y } : note}
            draggable={canDrag}
            isDragging={draggingNoteId === note.id}
            viewScale={scale}
            onDragStart={(e) => startNoteDrag(note, e)}
            onClick={(n) => {
              if (noteDragMovedRef.current) {
                noteDragMovedRef.current = false;
                return;
              }
              onNoteClick(n);
            }}
          />
        ))}
    </>
  );
}

// ----------------------------------------------------------------------------------
// STUFENLOSES ZOOM & PAN — Konfiguration für die interaktive Grundriss-Ansicht
// ----------------------------------------------------------------------------------
const FLOORPLAN_MIN_SCALE = 0.5;
const FLOORPLAN_MAX_SCALE = 25.0;
// Dämpfungsfaktor für den Mausrad-/Touchpad-Zoom (siehe handleWheelNative): pro
// Wheel-Event wird der Zoomfaktor aus der tatsächlichen deltaY-Größe abgeleitet
// (newScale = currentScale * (1 - deltaY * FLOORPLAN_WHEEL_DAMPING)) statt eines
// festen Schritts je Ereignis — dadurch reagiert der Zoom proportional auf die vom
// Eingabegerät gelieferte Geschwindigkeit (z. B. schnelles vs. langsames Scrollen
// am Mausrad, feinere Abstufung beim Touchpad-Pinch) und fühlt sich spürbar
// flüssiger/exakter an als ein einheitlicher Sprung pro Ereignis.
const FLOORPLAN_WHEEL_DAMPING = 0.0015;
// Sicherheitsgrenze für den Multiplikator je einzelnem Wheel-Event: manche Trackpads/
// Mäuse liefern bei schnellen Gesten sehr große deltaY-Werte (teils > 1000) — ohne
// diese Kappung könnte die obige Formel rechnerisch auf einen negativen oder
// unsinnig extremen Faktor springen (Plan verschwindet abrupt statt sanft zu
// zoomen). Die Kappung greift nur bei solchen Ausreißern, im normalen
// Scroll-/Pinch-Betrieb bleibt der Faktor deutlich innerhalb dieser Grenzen.
const FLOORPLAN_WHEEL_FACTOR_MIN = 0.4;
const FLOORPLAN_WHEEL_FACTOR_MAX = 2.5;
const FLOORPLAN_PAN_CLICK_THRESHOLD = 5; // px — ab hier zählt eine Interaktion als Verschieben statt als Klick
// Boundary-Clamping fürs Verschieben (Pan): mindestens so viele Pixel des Grundrisses
// müssen an jeder Achse innerhalb des sichtbaren Ausschnitts bleiben — verhindert, dass
// der Plan beim Herauszoomen/Verschieben vollständig aus dem sichtbaren Bereich
// geschoben wird (der Nutzer säße sonst vor einer leeren/"weißen" Fläche, siehe
// clampTranslateForViewport in FloorPlanView).
const FLOORPLAN_PAN_MIN_OVERLAP_PX = 72;

function FloorPlanView({
  floor,
  plan,
  pins,
  planNotes = [],
  loading,
  creatingPin,
  creatingNote,
  session,
  trades = [],
  project,
  generatedBy,
  onBack,
  onPlanClick,
  onPinClick,
  onPinMove,
  onAddNote,
  onNoteClick,
  onNoteMove,
}) {
  const imgRef = useRef(null);
  const viewportRef = useRef(null);
  const contentRef = useRef(null); // die transformierte "Bühne" (translate+scale), siehe clampTranslateForViewport
  const exportMenuRef = useRef(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [exportIncludeOnboarding, setExportIncludeOnboarding] = useState(() => hasOnboardingInfo(project));
  const [draggingPinId, setDraggingPinId] = useState(null);
  const [dragPos, setDragPos] = useState(null);
  const dragMovedRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Bearbeitungs-Modus (Edit Mode): standardmäßig AUS ("Positionen fixiert"), damit
  // Pins/Notizen auf Mobilgeräten beim Zoomen/Verschieben mit zwei Fingern nicht
  // versehentlich gegriffen werden — landet eine der beiden Pinch-Zoom-Berührungen
  // exakt auf einem Pin, würde PinMarker/PlanNoteMarker sie sonst per stopPropagation()
  // abfangen und in ein Pin-Verschieben statt in die Zoom-Geste des Viewports übersetzen
  // (siehe handleViewportPointerDown/Move weiter unten). Erst ein bewusstes Umschalten
  // auf "Pins verschieben" gibt das Drag-&-Drop wieder frei (siehe draggable-Prop in
  // PinsAndNotesLayer). Tippen/Klicken zum Öffnen der Detailkarte bleibt in JEDEM
  // Zustand uneingeschränkt möglich, weil der onClick-Handler unabhängig von draggable
  // ausgelöst wird — nur der onPointerDown-basierte Drag-Start ist an isEditMode
  // gekoppelt. Wird beim Wechsel der Grundrissskizze zurückgesetzt (siehe Effekt bei
  // Zoom/Pan-Reset), damit man nie versehentlich im freigeschalteten Zustand auf einen
  // anderen Plan wechselt.
  const [isEditMode, setIsEditMode] = useState(false);

  // Skizzen-Notizen (Plan Annotations) — eigener, vom Mängel-Pin-Modus getrennter
  // "Werkzeug"-Zustand: solange noteMode aktiv ist, legt ein Tap auf den Plan eine
  // neue Notiz statt eines Pins an (siehe handleViewportPointerUp). showNotes
  // blendet vorhandene Notizen unabhängig davon ein-/aus (Filter-/Menüleiste).
  const [noteMode, setNoteMode] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const [draggingNoteId, setDraggingNoteId] = useState(null);
  const [noteDragPos, setNoteDragPos] = useState(null);
  const noteDragMovedRef = useRef(false);
  const noteDragStartRef = useRef({ x: 0, y: 0 });
  const busyCreating = !!(creatingPin || creatingNote);

  // Zoom- & Pan-Zustand: scale = Zoomfaktor (1 = 100 %, ungezoomt), translate =
  // Verschiebung der Grundriss-"Bühne" in Pixeln relativ zum sichtbaren Ausschnitt.
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanningActive, setIsPanningActive] = useState(false);
  // Filter- & Suchleiste der Planansicht (Status, Gewerke, Volltextsuche) — rein
  // clientseitig, da die Pins der aktuellen Grundrissskizze bereits vollständig
  // geladen sind. Beeinflusst ausschließlich, welche Pins auf dem Plan sichtbar
  // sind (visiblePins weiter unten) — die Pin-Nummerierung (pinNumberById) und der
  // Geschoss-Export bleiben davon unberührt und referenzieren weiterhin
  // ausnahmslos ALLE Pins der Skizze in fester, chronologischer Reihenfolge.
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'offen' | 'bearbeitung' | 'erledigt'
  const [tradeFilterIds, setTradeFilterIds] = useState([]); // leer = alle Gewerke
  const [searchQuery, setSearchQuery] = useState("");
  const toggleTradeFilter = (tradeId) =>
    setTradeFilterIds((prev) => (prev.includes(tradeId) ? prev.filter((id) => id !== tradeId) : [...prev, tradeId]));
  const hasActivePinFilters = statusFilter !== "all" || tradeFilterIds.length > 0 || searchQuery.trim() !== "";
  const resetPinFilters = () => {
    setStatusFilter("all");
    setTradeFilterIds([]);
    setSearchQuery("");
  };

  // Refs mit den jeweils aktuellen Werten, damit der weiter unten manuell (nicht
  // passiv) registrierte Mausrad-Listener immer mit dem aktuellsten Zoom-/Pan-
  // Zustand rechnet, ohne bei jeder Zustandsänderung neu angehängt werden zu müssen.
  const scaleRef = useRef(scale);
  const translateRef = useRef(translate);
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);
  useEffect(() => {
    translateRef.current = translate;
  }, [translate]);

  // Hintergrund-Pointer für Pan/Pinch — bewusst getrennt von draggingPinId/dragPos,
  // die ausschließlich das Verschieben eines bestehenden Pins abbilden.
  const panPointersRef = useRef(new Map());
  const panGestureRef = useRef(null); // { startX, startY, startTranslate, moved }
  const pinchGestureRef = useRef(null); // { startDistance, startScale, startTranslate }

  // Beim Wechsel der Grundrissskizze Zoom/Pan zurücksetzen, damit jede Skizze wieder
  // in der ursprünglichen 100%-Ansicht startet. isEditMode wird bewusst mit
  // zurückgesetzt (immer "Positionen fixiert" beim Öffnen einer Skizze) — sicherer
  // Standardzustand statt eines versehentlich "mitgenommenen" freigeschalteten Modus.
  useEffect(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    setIsEditMode(false);
  }, [plan?.id]);

  // Math.max(..., 0.0001) verhindert rein defensiv eine Division durch 0 in
  // computeZoomAtClientPoint, falls scale je auf anderem Weg als über clampScale
  // gesetzt würde — mit den aktuellen Aufrufstellen kann das nicht vorkommen (jeder
  // setScale-Aufruf läuft durch clampScale bzw. setzt fest 1), ist als zusätzliches
  // Sicherheitsnetz aber praktisch kostenlos.
  const clampScale = (v) => Math.min(FLOORPLAN_MAX_SCALE, Math.max(FLOORPLAN_MIN_SCALE, Math.max(v, 0.0001)));

  // Begrenzt die Verschiebung (translate) so, dass an jeder Achse mindestens
  // FLOORPLAN_PAN_MIN_OVERLAP_PX des Grundrisses innerhalb des sichtbaren Ausschnitts
  // bleiben — verhindert den "White Screen"-Effekt (Plan komplett aus dem sichtbaren
  // Bereich herausgezoomt/-verschoben). Die tatsächliche (unskalierte) Inhaltsgröße
  // wird aus der GERADE gerenderten, noch mit dem alten Zoomfaktor transformierten
  // contentRef-Box zurückgerechnet (Breite/Höhe durch dessen aktuellen Skalierungsfaktor
  // geteilt) — funktioniert dadurch unabhängig davon, ob der Grundriss ein Bild, ein
  // PDF-Canvas oder die CAD-Platzhalteransicht ist, ohne deren Seitenverhältnis vorab
  // kennen zu müssen. currentScale ist der Zoomfaktor, mit dem contentRef GERADE
  // sichtbar gerendert ist (nicht zwingend identisch mit dem neuen Zielwert s).
  const clampTranslateForViewport = (t, s, currentScale) => {
    const viewportEl = viewportRef.current;
    const contentEl = contentRef.current;
    if (!viewportEl || !contentEl) return t;
    const viewportRect = viewportEl.getBoundingClientRect();
    const contentRect = contentEl.getBoundingClientRect();
    const measuredScale = currentScale > 0 ? currentScale : 1;
    const naturalW = contentRect.width / measuredScale;
    const naturalH = contentRect.height / measuredScale;
    const contentW = naturalW * s;
    const contentH = naturalH * s;
    const overlapX = Math.min(FLOORPLAN_PAN_MIN_OVERLAP_PX, contentW / 2, viewportRect.width / 2);
    const overlapY = Math.min(FLOORPLAN_PAN_MIN_OVERLAP_PX, contentH / 2, viewportRect.height / 2);
    return {
      x: Math.min(viewportRect.width - overlapX, Math.max(overlapX - contentW, t.x)),
      y: Math.min(viewportRect.height - overlapY, Math.max(overlapY - contentH, t.y)),
    };
  };

  // Berechnet Zoomfaktor + Verschiebung so, dass der Punkt unter (clientX, clientY)
  // vor und nach der Skalierung an derselben Bildschirmposition bleibt — sorgt für
  // "Zoom zum Cursor/Finger" statt Zoom zur Bildmitte. Die resultierende Verschiebung
  // läuft anschließend IMMER durch clampTranslateForViewport (siehe oben) — jede
  // Zoom-Interaktion (Buttons, Mausrad, Pinch-Geste) ist dadurch automatisch an das
  // Boundary-Clamping gekoppelt, ohne es an jeder Aufrufstelle einzeln wiederholen zu müssen.
  const computeZoomAtClientPoint = (clientX, clientY, targetScale, baseScale, baseTranslate) => {
    const viewportEl = viewportRef.current;
    if (!viewportEl) return { scale: baseScale, translate: baseTranslate };
    const rect = viewportEl.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const newScale = clampScale(targetScale);
    const safeBaseScale = baseScale > 0 ? baseScale : 1;
    const worldX = (localX - baseTranslate.x) / safeBaseScale;
    const worldY = (localY - baseTranslate.y) / safeBaseScale;
    const rawTranslate = {
      x: localX - worldX * newScale,
      y: localY - worldY * newScale,
    };
    return {
      scale: newScale,
      translate: clampTranslateForViewport(rawTranslate, newScale, baseScale),
    };
  };

  const zoomByFactor = (factor) => {
    const viewportEl = viewportRef.current;
    if (!viewportEl) return;
    const rect = viewportEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const next = computeZoomAtClientPoint(centerX, centerY, scale * factor, scale, translate);
    setScale(next.scale);
    setTranslate(next.translate);
  };

  const handleZoomInClick = () => zoomByFactor(1.35);
  const handleZoomOutClick = () => zoomByFactor(1 / 1.35);
  const handleResetViewClick = () => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  };

  // Geschoss-Export: Klick außerhalb des Format-Menüs (PDF/CSV) schließt es wieder.
  useEffect(() => {
    if (!exportMenuOpen) return undefined;
    const handleClickOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [exportMenuOpen]);

  // Grundrissskizzen-Export: erzeugt wahlweise eine PDF-Tabelle oder eine CSV-Datei.
  // PDF: folgt dynamisch der aktuell gesetzten Filter-/Suchleiste (visiblePins/
  // filterSummary, siehe unten) — exportiert also immer genau die Pins, die gerade
  // auch auf dem Plan sichtbar sind. CSV bleibt bewusst die vollständige,
  // ungefilterte Rohdaten-Variante aller Pins dieser Grundrissskizze (siehe
  // Kommentar bei generateFloorPinsTablePdf) — für eine vollständige Weiterverarbeitung
  // in Excel soll dort nie stillschweigend etwas fehlen, das nur aus einer gerade
  // aktiven Bildschirm-Filterung resultiert.
  const handleExportFloor = async (format) => {
    setExportMenuOpen(false);
    setExportError("");
    setExporting(true);
    try {
      if (format === "pdf") {
        await generateFloorPinsTablePdf({
          project,
          floor,
          plan,
          pins: visiblePins,
          allPins: pins,
          trades,
          generatedBy,
          filterSummary,
          includeOnboarding: exportIncludeOnboarding && hasOnboardingInfo(project),
        });
      } else {
        exportFloorPinsCsv({ project, floor, plan, pins, trades });
      }
    } catch (err) {
      console.error("Grundrissskizzen-Export fehlgeschlagen:", err);
      setExportError("Export fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setExporting(false);
    }
  };

  // Mausrad-Zoom: React registriert onWheel intern als passiven Listener (aus
  // Scroll-Performance-Gründen), wodurch preventDefault() dort wirkungslos bliebe.
  // Deshalb wird der Listener hier manuell und explizit nicht-passiv registriert
  // ({ passive: false }), damit sowohl das Scrollen der Seite als auch ein
  // Hochblubbern des Events beim Zoomen über dem Grundriss zuverlässig verhindert
  // werden (preventDefault + stopPropagation).
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return undefined;
    const handleWheelNative = (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Mathematisch geglätteter Zoom-Schritt je Wheel-/Touchpad-Pinch-Ereignis,
      // proportional zur tatsächlichen deltaY-Größe des Eingabegeräts (nicht ein
      // fester Sprung pro Ereignis) — dadurch fühlt sich ein schnelles Scrollen am
      // Mausrad spürbar stärker an als ein langsames, und feine Touchpad-Pinch-Gesten
      // lassen sich entsprechend fein dosieren. Auf FLOORPLAN_WHEEL_FACTOR_MIN/MAX
      // gekappt, damit ein einzelner Ausreißer-Wert (z. B. ein sehr großes deltaY bei
      // manchen Trackpads) nicht zu einem abrupten Extremsprung führt. Zentriert auf
      // den Mauszeiger statt auf die Bildmitte (computeZoomAtClientPoint).
      const rawFactor = 1 - e.deltaY * FLOORPLAN_WHEEL_DAMPING;
      const zoomFactor = Math.min(FLOORPLAN_WHEEL_FACTOR_MAX, Math.max(FLOORPLAN_WHEEL_FACTOR_MIN, rawFactor));
      const next = computeZoomAtClientPoint(
        e.clientX,
        e.clientY,
        scaleRef.current * zoomFactor,
        scaleRef.current,
        translateRef.current
      );
      setScale(next.scale);
      setTranslate(next.translate);
    };
    el.addEventListener("wheel", handleWheelNative, { passive: false });
    return () => el.removeEventListener("wheel", handleWheelNative);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.id]);

  // Reagiert auf Größenänderungen des sichtbaren Ausschnitts (Fenster-Resize,
  // Sidebar-Toggle, Orientierungswechsel) und zieht eine dadurch ggf. ungültig
  // gewordene Verschiebung wieder ins gültige Boundary-Clamping (siehe
  // clampTranslateForViewport) — ohne das würde der Plan nach einer Größenänderung
  // im schlimmsten Fall dauerhaft außerhalb des sichtbaren Bereichs stehen bleiben.
  useEffect(() => {
    const viewportEl = viewportRef.current;
    if (!viewportEl || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(() => {
      setTranslate((prev) => clampTranslateForViewport(prev, scaleRef.current, scaleRef.current));
    });
    observer.observe(viewportEl);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const posFromEvent = (e) => {
    if (!imgRef.current) return null;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x: Math.min(98, Math.max(2, x)), y: Math.min(98, Math.max(2, y)) };
  };

  // -----------------------------------------------------------------------------
  // Pin-Verschieben per Pointer-Drag (nur für angemeldete Nutzer aktiv, siehe
  // "draggable" in PinMarker). Ein kurzer Klick ohne nennenswerte Bewegung öffnet
  // weiterhin ganz normal das Pin-Detail-Modal.
  // -----------------------------------------------------------------------------

  const startDrag = (pin, e) => {
    dragMovedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setDraggingPinId(pin.id);
    setDragPos({ x: pin.x, y: pin.y });
  };

  const endDrag = (e) => {
    if (!draggingPinId) return;
    const pinId = draggingPinId;
    const moved = dragMovedRef.current;
    const finalPos = imgRef.current ? posFromEvent(e) : dragPos;
    setDraggingPinId(null);
    setDragPos(null);
    if (moved && finalPos) {
      onPinMove(pinId, finalPos.x, finalPos.y);
    }
  };

  // Notiz-Verschieben per Pointer-Drag — exakt dasselbe Muster wie startDrag/endDrag
  // oben, nur für planNotes statt pins (eigener, unabhängiger Zustand: draggingNoteId/
  // noteDragPos statt draggingPinId/dragPos).
  const startNoteDrag = (note, e) => {
    noteDragMovedRef.current = false;
    noteDragStartRef.current = { x: e.clientX, y: e.clientY };
    setDraggingNoteId(note.id);
    setNoteDragPos({ x: note.x, y: note.y });
  };

  const endNoteDrag = (e) => {
    if (!draggingNoteId) return;
    const noteId = draggingNoteId;
    const moved = noteDragMovedRef.current;
    const finalPos = imgRef.current ? posFromEvent(e) : noteDragPos;
    setDraggingNoteId(null);
    setNoteDragPos(null);
    if (moved && finalPos) {
      onNoteMove(noteId, finalPos.x, finalPos.y);
    }
  };

  const distanceBetween = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const midpointOf = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  // -----------------------------------------------------------------------------
  // Zentrale Pointer-Verwaltung des Viewports: unterscheidet strikt zwischen (a)
  // dem Verschieben eines bestehenden Pins (draggingPinId gesetzt — hat immer
  // Vorrang), (b) Ein- oder Zwei-Finger-Pan/Pinch-Zoom der Ansicht und (c) einem
  // kurzen Tap/Klick zum Setzen eines neuen Pins. Ein neuer Pin wird ausschließlich
  // dann gesetzt, wenn sich der Pointer beim Loslassen um nicht mehr als
  // FLOORPLAN_PAN_CLICK_THRESHOLD Pixel bewegt hat — bei jeder größeren Verschiebung
  // (Pan) wird bewusst KEIN Pin erstellt.
  // -----------------------------------------------------------------------------

  const handleViewportPointerDown = (e) => {
    // PinMarker/PlanNoteMarker rufen bei eigenem Pointerdown stopPropagation() auf —
    // hier kommen also ausschließlich Pointer an, die den Grundriss selbst
    // (Hintergrund) treffen.
    if (busyCreating) return;
    panPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (panPointersRef.current.size === 1) {
      panGestureRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startTranslate: { ...translate },
        moved: false,
      };
      setIsPanningActive(true);
    } else if (panPointersRef.current.size === 2) {
      const points = Array.from(panPointersRef.current.values());
      pinchGestureRef.current = {
        startDistance: distanceBetween(points[0], points[1]) || 1,
        startScale: scale,
        startTranslate: { ...translate },
      };
      if (panGestureRef.current) panGestureRef.current.moved = true; // Pinch zählt nie als Tap
    }
  };

  const handleViewportPointerMove = (e) => {
    // Pin- bzw. Notiz-Verschieben hat immer Vorrang vor Pan/Zoom der Ansicht.
    if (draggingPinId) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMovedRef.current = true;
      setDragPos(posFromEvent(e));
      return;
    }
    if (draggingNoteId) {
      const dx = e.clientX - noteDragStartRef.current.x;
      const dy = e.clientY - noteDragStartRef.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) noteDragMovedRef.current = true;
      setNoteDragPos(posFromEvent(e));
      return;
    }

    if (!panPointersRef.current.has(e.pointerId)) return;
    panPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (panPointersRef.current.size >= 2 && pinchGestureRef.current) {
      const points = Array.from(panPointersRef.current.values()).slice(0, 2);
      const newDistance = distanceBetween(points[0], points[1]) || 1;
      const mid = midpointOf(points[0], points[1]);
      const targetScale = pinchGestureRef.current.startScale * (newDistance / pinchGestureRef.current.startDistance);
      const next = computeZoomAtClientPoint(
        mid.x,
        mid.y,
        targetScale,
        pinchGestureRef.current.startScale,
        pinchGestureRef.current.startTranslate
      );
      setScale(next.scale);
      setTranslate(next.translate);
      return;
    }

    const gesture = panGestureRef.current;
    if (!gesture) return;
    const dx = e.clientX - gesture.startX;
    const dy = e.clientY - gesture.startY;
    if (!gesture.moved && Math.hypot(dx, dy) > FLOORPLAN_PAN_CLICK_THRESHOLD) {
      gesture.moved = true;
    }
    if (gesture.moved) {
      // Reines Verschieben ohne Zoomänderung — Ziel- und "aktuell gerenderte" Skalierung
      // sind hier identisch (scale), anders als bei den zoombezogenen Aufrufstellen oben.
      setTranslate(clampTranslateForViewport({ x: gesture.startTranslate.x + dx, y: gesture.startTranslate.y + dy }, scale, scale));
    }
  };

  const handleViewportPointerUp = (e) => {
    if (draggingPinId) {
      endDrag(e);
      return;
    }
    if (draggingNoteId) {
      endNoteDrag(e);
      return;
    }

    const wasBackgroundPointer = panPointersRef.current.has(e.pointerId);
    panPointersRef.current.delete(e.pointerId);

    if (panPointersRef.current.size < 2) {
      pinchGestureRef.current = null;
    }

    if (panPointersRef.current.size === 0) {
      setIsPanningActive(false);
      const gesture = panGestureRef.current;
      panGestureRef.current = null;
      if (wasBackgroundPointer && gesture && !gesture.moved && !busyCreating) {
        // Kurzer Tap/Klick ohne nennenswerte Bewegung (≤ 5px): je nach aktivem
        // Werkzeug entweder eine neue Notiz (Notiz-Modus) oder einen neuen Pin an
        // der exakten Position setzen.
        const pos = posFromEvent(e);
        if (pos) {
          if (noteMode) onAddNote(pos.x, pos.y);
          else onPlanClick(pos.x, pos.y);
        }
      }
    }
  };

  const activeTrades = (trades || []).filter((t) => t.active);
  // Fortlaufende Pin-Nummerierung dieser Grundrissskizze: sortiert nach Anlagedatum,
  // exakt wie im Geschoss-Export (siehe generateFloorPinsTablePdf/pinsToFloorExportRows)
  // — GARANTIERT dieselbe Nummer für denselben Pin auf Plan UND in der Export-Tabelle
  // ("Nr."), unabhängig von der aktuell aktiven Filter-/Suchleiste (die nur die
  // Sichtbarkeit auf dem Plan steuert, nie die Nummerierung selbst).
  const pinNumberById = new Map(
    [...pins].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map((p, idx) => [p.id, idx + 1])
  );
  // Dynamische Filter-/Suchleiste (Status-Toggle, Gewerke-Mehrfachauswahl,
  // Volltextsuche) — alle drei Kriterien wirken kombiniert (UND-Verknüpfung) rein
  // clientseitig auf die bereits geladenen Pins dieser Skizze. Die Suche prüft
  // genau die im Auftrag genannten Felder: Pin-Nummer, Thema, Bereich/Raum,
  // Zuständigkeit und Kommentar.
  const searchNormalized = searchQuery.trim().toLowerCase();
  const visiblePins = pins.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (tradeFilterIds.length > 0 && !tradeFilterIds.includes(p.trade_id)) return false;
    if (searchNormalized) {
      const haystack = [String(pinNumberById.get(p.id) || ""), p.title, p.area, p.assigned_to, p.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(searchNormalized)) return false;
    }
    return true;
  });
  // Für den PDF-Export (nicht den Excel-Export, siehe handleExportFloor/
  // generateFloorPinsTablePdf) in Klartext aufbereitete Zusammenfassung der aktuell
  // aktiven Filterkriterien — erscheint sowohl im Export-Menü als auch auf dem
  // Deckblatt des erzeugten Berichts. null, solange kein Filter aktiv ist.
  const activeFilterTradeNames = activeTrades.filter((t) => tradeFilterIds.includes(t.id)).map((t) => t.name);
  const filterSummaryParts = [];
  if (statusFilter !== "all") filterSummaryParts.push(`Status "${STATUS[statusFilter]?.label || statusFilter}"`);
  if (activeFilterTradeNames.length > 0) filterSummaryParts.push(`Gewerk ${activeFilterTradeNames.join(", ")}`);
  if (searchQuery.trim()) filterSummaryParts.push(`Suche "${searchQuery.trim()}"`);
  const filterSummary = filterSummaryParts.length > 0 ? filterSummaryParts.join(" · ") : null;

  // Die drei Status-Zähler zeigen bewusst die Gesamtzahlen ALLER Pins dieser
  // Skizze (unabhängig von der Filter-/Suchleiste) — die gefilterte Trefferzahl
  // wird separat und explizit in der Filterleiste selbst ausgewiesen ("Zeige X
  // von Y Pins"), damit beide Informationen klar auseinandergehalten werden.
  const open = pins.filter((p) => p.status === "offen").length;
  const inProgress = pins.filter((p) => p.status === "bearbeitung").length;
  const done = pins.filter((p) => p.status === "erledigt").length;
  const floorKind = resolveFloorKind(plan);
  const isPdf = floorKind === "pdf";
  const isCad = floorKind === "cad";
  const isSvg = floorKind === "svg";
  const fileName = deriveFileNameFromUrl(plan.image_url);
  const fileExt = deriveFileExt(fileName) || "dwg";

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
      <button
        onClick={onBack}
        className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
      >
        <ChevronLeft size={17} /> Zurück zu den Grundrisskizzen
      </button>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{floor.name}</p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{plan.name}</h1>
            {isCad && <CadBadge ext={fileExt} />}
            {isSvg && <VectorPlanBadge />}
          </div>
          <p className="text-sm text-slate-500">
            {creatingPin
              ? "Pin wird angelegt…"
              : creatingNote
              ? "Notiz wird platziert…"
              : noteMode
              ? `Notiz-Modus aktiv: Auf den Plan tippen, um eine Notiz zu platzieren.${
                  isEditMode ? " Bestehende Notizen lassen sich per Ziehen verschieben." : " Positionen sind fixiert — zum Verschieben bestehender Notizen \"Pins verschieben\" aktivieren."
                }`
              : session
              ? `Auf den Grundriss tippen, um einen neuen Pin zu setzen.${
                  isEditMode
                    ? " Bestehende Pins lassen sich per Ziehen verschieben."
                    : " Positionen sind fixiert — zum Verschieben bestehender Pins \"Pins verschieben\" aktivieren, praktisch beim Zoomen mit zwei Fingern auf dem Handy."
                } Mit dem Mausrad, per Zwei-Finger-Geste oder über die Zoom-Buttons lässt sich der Plan stufenlos vergrößern und verschieben.`
              : "Nur Ansicht — zum Setzen oder Verschieben von Pins bitte anmelden. Zoomen und Verschieben des Grundrisses ist auch ohne Anmeldung möglich."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-red-700 ring-1 ring-inset ring-red-200">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF2A00]" /> {open} offen
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700 ring-1 ring-inset ring-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {inProgress} in Arbeit
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 ring-1 ring-inset ring-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {done} erledigt
          </span>
          {session && (
            <button
              type="button"
              onClick={() => setIsEditMode((v) => !v)}
              title={
                isEditMode
                  ? "Pins/Notizen sind entsperrt — per Ziehen verschiebbar. Klicken, um wieder zu fixieren."
                  : "Pins/Notizen sind fixiert — Zoomen/Verschieben mit zwei Fingern kann sie nicht versehentlich verschieben. Klicken, um das Verschieben freizugeben."
              }
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold shadow-sm transition ${
                isEditMode
                  ? "bg-[#FF2A00] text-white hover:bg-[#E02400]"
                  : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              {isEditMode ? "✏️ Pins verschieben" : "🔒 Positionen fixiert"}
            </button>
          )}
          {session && (
            <button
              type="button"
              onClick={() => setNoteMode((v) => !v)}
              title="Notiz-Modus: nächster Klick auf den Plan platziert eine Notiz statt eines Pins"
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold shadow-sm transition ${
                noteMode ? "bg-amber-500 text-white hover:bg-amber-600" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <StickyNote size={13} /> {noteMode ? "Notiz-Modus aktiv" : "Notiz setzen"}
            </button>
          )}
          {planNotes.length > 0 && (
            <button
              type="button"
              onClick={() => setShowNotes((v) => !v)}
              title={showNotes ? "Notizen auf dem Plan ausblenden" : "Notizen auf dem Plan einblenden"}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              {showNotes ? <Eye size={13} /> : <EyeOff size={13} />} {planNotes.length} Notiz{planNotes.length !== 1 ? "en" : ""}
            </button>
          )}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setExportMenuOpen((v) => !v)}
              disabled={exporting}
              title="Geschoss-Bericht exportieren"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#FF2A00] px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#E02400] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exporting ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
              {hasActivePinFilters ? `PDF-Export (${visiblePins.length} Pins gefiltert)` : "Geschoss-Bericht exportieren"}
            </button>
            {exportMenuOpen && (
              <div className="absolute right-0 top-full z-20 mt-1.5 w-64 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-xs font-medium text-slate-700 shadow-lg">
                <button
                  onClick={() => handleExportFloor("pdf")}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50"
                >
                  <FileText size={14} className="text-slate-400" />
                  {hasActivePinFilters ? `Als PDF (${visiblePins.length} gefilterte Pins)` : "Als PDF-Tabelle"}
                </button>
                <button
                  onClick={() => handleExportFloor("csv")}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50"
                >
                  <FileDown size={14} className="text-slate-400" /> Als CSV (Excel) — alle {pins.length} Pins
                </button>
                {hasActivePinFilters && (
                  <p className="border-t border-slate-100 px-3 pt-1.5 pb-0.5 text-[10px] leading-snug text-slate-400">
                    CSV bleibt immer die vollständige, ungefilterte Rohdaten-Tabelle.
                  </p>
                )}
                {hasOnboardingInfo(project) && (
                  <label className="flex cursor-pointer items-start gap-2 border-t border-slate-100 px-3 py-2 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={exportIncludeOnboarding}
                      onChange={(e) => setExportIncludeOnboarding(e.target.checked)}
                      className="mt-0.5 accent-[#FF2A00]"
                    />
                    <span className="text-[11px] leading-snug text-slate-600">
                      Baustellen-Info auf Seite 1 der PDF einbinden
                    </span>
                  </label>
                )}
              </div>
            )}
            {exportError && (
              <p className="absolute right-0 top-full mt-1.5 w-56 rounded-md bg-rose-50 px-2.5 py-1.5 text-[11px] font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
                {exportError}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Filter- & Suchleiste — direkt oberhalb des Grundriss-Canvas, filtert
          visiblePins (siehe oben) in Echtzeit; die Pin-Nummerierung und der
          Geschoss-Export bleiben davon unberührt (siehe Kommentar bei
          pinNumberById). */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Suche nach Nr., Thema, Bereich, Zuständigkeit, Kommentar…"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none ring-[#FF2A00]/30 placeholder:text-slate-400 focus:border-[#FF2A00] focus:ring-4"
            />
          </div>
          <span className="whitespace-nowrap text-xs font-semibold text-slate-500">
            Zeige {visiblePins.length} von {pins.length} Pin{pins.length !== 1 ? "s" : ""}
          </span>
          {hasActivePinFilters && (
            <button
              onClick={resetPinFilters}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            >
              <X size={11} /> Filter zurücksetzen
            </button>
          )}
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <Filter size={13} className="mr-0.5 shrink-0 text-slate-400" />
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              aria-pressed={statusFilter === opt.value}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                statusFilter === opt.value
                  ? "border-[#FF2A00] bg-[#FF2A00] text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-500 hover:border-red-300 hover:bg-red-50/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
          {activeTrades.length > 0 && (
            <>
              <span className="mx-1 hidden h-4 w-px bg-slate-200 sm:inline-block" />
              {activeTrades.map((t) => {
                const active = tradeFilterIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTradeFilter(t.id)}
                    aria-pressed={active}
                    title="Nach Gewerk filtern"
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                      active
                        ? "border-[#FF2A00] bg-[#FF2A00] text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-500 hover:border-red-300 hover:bg-red-50/50"
                    }`}
                  >
                    {t.name}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-900 shadow-inner">
        {loading ? (
          <LoadingBlock label="Pins werden geladen…" />
        ) : (
          <>
            <div
              ref={viewportRef}
              className="relative h-full w-full touch-none select-none overflow-hidden"
              style={{ cursor: busyCreating ? "wait" : isPanningActive ? "grabbing" : noteMode ? "copy" : "grab" }}
              onPointerDown={handleViewportPointerDown}
              onPointerMove={handleViewportPointerMove}
              onPointerUp={handleViewportPointerUp}
              onPointerLeave={handleViewportPointerUp}
              onPointerCancel={handleViewportPointerUp}
            >
              <div
                ref={contentRef}
                className="relative w-full origin-top-left select-none"
                style={{
                  transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                  ...(isCad
                    ? {}
                    : {
                        backgroundImage:
                          "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
                        backgroundSize: "24px 24px",
                      }),
                }}
              >
                {isCad && (
                  // CAD-Grundriss (.dwg/.dxf): stilisierte Blueprint-Ansicht, siehe CadBlueprintPlan.
                  // Kein echter Vektor-Koordinatenraum vorhanden (reiner Platzhalter ohne
                  // geparste Geometrie) — Pins/Notizen bleiben hier bewusst eine separate,
                  // Prozent-positionierte HTML-Ebene (siehe PinsAndNotesLayer), keine SVG-
                  // Einbettung wie bei PDF/SVG-Grundrissen unten.
                  <>
                    <CadBlueprintPlan ref={imgRef} fileName={fileName} ext={fileExt} />
                    <PinsAndNotesLayer
                      visiblePins={visiblePins}
                      pinNumberById={pinNumberById}
                      draggingPinId={draggingPinId}
                      dragPos={dragPos}
                      session={session}
                      scale={scale}
                      startDrag={startDrag}
                      dragMovedRef={dragMovedRef}
                      onPinClick={onPinClick}
                      showNotes={showNotes}
                      planNotes={planNotes}
                      draggingNoteId={draggingNoteId}
                      noteDragPos={noteDragPos}
                      startNoteDrag={startNoteDrag}
                      noteDragMovedRef={noteDragMovedRef}
                      onNoteClick={onNoteClick}
                      isEditMode={isEditMode}
                    />
                  </>
                )}
                {(isPdf || isSvg) && !isCad && (
                  // PDF- UND native SVG-Grundrisse laufen über PlanSvgStage: ein gemeinsamer
                  // SVG-Koordinatenraum, in dem sowohl der Vektor-Plan selbst (PdfPlanCanvas
                  // via pdf.js' SVGGraphics-Backend, bzw. SvgPlanCanvas für native .svg-
                  // Uploads) als auch die Pin-/Notiz-Ebene als <g>/<foreignObject>-Elemente
                  // eingebettet sind — beide skalieren dadurch über dieselbe SVG-Geometrie,
                  // nicht nur über eine daneben liegende, lediglich synchron transformierte
                  // HTML-Ebene. Details und Abwägungen siehe Kommentar bei PlanSvgStage.
                  <PlanSvgStage ref={imgRef} planKind={isPdf ? "pdf" : "svg"} url={plan.image_url} zoomScale={scale}>
                    <PinsAndNotesLayer
                      visiblePins={visiblePins}
                      pinNumberById={pinNumberById}
                      draggingPinId={draggingPinId}
                      dragPos={dragPos}
                      session={session}
                      scale={scale}
                      startDrag={startDrag}
                      dragMovedRef={dragMovedRef}
                      onPinClick={onPinClick}
                      showNotes={showNotes}
                      planNotes={planNotes}
                      draggingNoteId={draggingNoteId}
                      noteDragPos={noteDragPos}
                      startNoteDrag={startNoteDrag}
                      noteDragMovedRef={noteDragMovedRef}
                      onNoteClick={onNoteClick}
                      isEditMode={isEditMode}
                    />
                  </PlanSvgStage>
                )}
                {!isCad && !isPdf && !isSvg && (
                  <>
                    <img
                      ref={imgRef}
                      src={plan.image_url}
                      alt={plan.name}
                      className="pointer-events-none block w-full select-none opacity-90"
                      draggable={false}
                    />
                    <PinsAndNotesLayer
                      visiblePins={visiblePins}
                      pinNumberById={pinNumberById}
                      draggingPinId={draggingPinId}
                      dragPos={dragPos}
                      session={session}
                      scale={scale}
                      startDrag={startDrag}
                      dragMovedRef={dragMovedRef}
                      onPinClick={onPinClick}
                      showNotes={showNotes}
                      planNotes={planNotes}
                      draggingNoteId={draggingNoteId}
                      noteDragPos={noteDragPos}
                      startNoteDrag={startNoteDrag}
                      noteDragMovedRef={noteDragMovedRef}
                      onNoteClick={onNoteClick}
                      isEditMode={isEditMode}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Zoom-Steuerung: Mausrad, Pinch-Geste (Touch) und diese Buttons sind
                gleichwertige, stufenlose Wege zum Zoomen — alle nutzen dieselbe
                Zoom-zum-Punkt-Berechnung, damit sich der Plan nie "verspringt". */}
            <div className="pointer-events-none absolute bottom-3 right-3 z-20 flex flex-col items-end gap-2">
              <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-900/90 p-1 shadow-lg backdrop-blur">
                <button
                  type="button"
                  onClick={handleZoomOutClick}
                  disabled={scale <= FLOORPLAN_MIN_SCALE}
                  title="Verkleinern"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ZoomOut size={15} />
                </button>
                <span className="w-12 select-none text-center text-[11px] font-semibold tabular-nums text-slate-200">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomInClick}
                  disabled={scale >= FLOORPLAN_MAX_SCALE}
                  title="Vergrößern"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ZoomIn size={15} />
                </button>
              </div>
              <button
                type="button"
                onClick={handleResetViewClick}
                disabled={scale === 1 && translate.x === 0 && translate.y === 0}
                title="Ansicht zurücksetzen"
                className="pointer-events-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/90 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 shadow-lg backdrop-blur transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RotateCcw size={13} /> Reset
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------------
// LIGHTBOX — vergrößerte Fotoansicht
// ----------------------------------------------------------------------------------

function Lightbox({ src, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 p-6"
      onClick={onClose}
    >
      <button onClick={onClose} className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20">
        <X size={22} />
      </button>
      <img src={src} alt="Vergrößerte Ansicht" className="max-h-full max-w-full rounded-lg object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

// ----------------------------------------------------------------------------------
// BLICKRICHTUNG / AUFNAHMEWINKEL — Kompass-Ring + Slider + Schnellauswahl
// ----------------------------------------------------------------------------------

const QUICK_ANGLES = [
  { label: "N", value: 0 },
  { label: "O", value: 90 },
  { label: "S", value: 180 },
  { label: "W", value: 270 },
];

function AngleCompass({ value, onChange, disabled }) {
  const dialRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const angleFromEvent = (e) => {
    const rect = dialRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    // 0° = oben (Norden), im Uhrzeigersinn wachsend — deckungsgleich mit ViewCone-Rotation.
    let deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
    if (deg < 0) deg += 360;
    return Math.round(deg);
  };

  const handlePointerDown = (e) => {
    if (disabled) return;
    setDragging(true);
    onChange(angleFromEvent(e));
  };
  const handlePointerMove = (e) => {
    if (disabled || !dragging) return;
    onChange(angleFromEvent(e));
  };
  const handlePointerUp = () => setDragging(false);

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-5">
      {/* Kompass-Ring mit drehendem Richtungszeiger */}
      <div
        ref={dialRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`relative h-28 w-28 shrink-0 touch-none select-none rounded-full border-2 border-slate-200 bg-slate-50 shadow-inner ${
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        }`}
      >
        {/* Himmelsrichtungs-Labels */}
        <span className="absolute left-1/2 top-1 -translate-x-1/2 text-[10px] font-bold text-slate-400">N</span>
        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">O</span>
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400">S</span>
        <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">W</span>

        {/* Mittelpunkt */}
        <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF2A00]" />

        {/* Richtungszeiger + Sichtfeld-Vorschau, live mitrotierend */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ transform: `rotate(${value}deg)`, transformOrigin: "50% 50%" }}
        >
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
            <path d="M 50 6 L 34 50 A 18 18 0 0 0 66 50 Z" fill="#2563eb" opacity="0.18" />
            <line x1="50" y1="50" x2="50" y2="10" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <div className="flex-1 space-y-2.5">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Blickrichtung</label>
            <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs font-bold text-red-700">{value}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-[#FF2A00] disabled:opacity-60"
          />
        </div>
        <div className="flex gap-1.5">
          {QUICK_ANGLES.map((q) => (
            <button
              key={q.label}
              onClick={() => onChange(q.value)}
              disabled={disabled}
              className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                value === q.value
                  ? "border-transparent bg-[#FF2A00] text-white shadow-sm"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              {q.label} <span className="text-[10px] opacity-70">{q.value}°</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------------
// VOICE-TO-TEXT DIKTIERFUNKTION — Browser Web Speech API
// ----------------------------------------------------------------------------------
// useDictation kapselt EINE Diktier-"Sitzung" für genau ein Textfeld (Thema ODER
// Kommentar bekommen im PinModal jeweils eine eigene, unabhängige Instanz, damit sich
// beide Felder nicht gegenseitig beeinflussen). getBaseText/setText koppeln den Hook
// lose an das jeweilige Formularfeld, ohne dass useDictation selbst irgendetwas vom
// Pin-Datenmodell wissen muss.
//
// Anhänge-Logik ("kein Überschreiben"): beim Start wird der zu diesem Zeitpunkt im
// Feld stehende Text EINMALIG als baseTextRef eingefroren. Während der Aufnahme wird
// bei jedem (auch nur vorläufigen) Zwischenergebnis stets baseText + aktueller
// Erkennungstext neu gesetzt — der ursprüngliche Text bleibt dadurch unangetastet,
// während Zwischen- UND Endergebnisse live sichtbar dahinter weiterlaufen.
function useDictation({ getBaseText, setText }) {
  const recognitionRef = useRef(null);
  const baseTextRef = useRef("");
  const [listening, setListening] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const toastTimerRef = useRef(null);
  const supported = typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const showToast = (message) => {
    setToastMessage(message);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMessage(""), 3200);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  const startListening = () => {
    if (!supported) {
      showToast("Spracherkennung im Browser nicht verfügbar.");
      return;
    }
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "de-DE";
    recognition.continuous = true;
    recognition.interimResults = true;
    baseTextRef.current = getBaseText() || "";
    let finalText = "";

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += transcript;
        else interim += transcript;
      }
      const combined = `${finalText}${interim}`.trim();
      const separator = baseTextRef.current && combined ? " " : "";
      setText(`${baseTextRef.current}${separator}${combined}`);
    };
    recognition.onerror = (event) => {
      console.error("Spracherkennung fehlgeschlagen:", event.error);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        showToast("Mikrofonzugriff wurde nicht erlaubt.");
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        showToast("Spracherkennung im Browser nicht verfügbar.");
      }
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch (err) {
      console.error("Spracherkennung konnte nicht gestartet werden:", err);
      showToast("Spracherkennung im Browser nicht verfügbar.");
      recognitionRef.current = null;
    }
  };

  const toggle = () => {
    if (listening) stopListening();
    else startListening();
  };

  // Sauberes Aufräumen beim Verlassen des Feldes/Schließen des Modals — eine noch
  // laufende Erkennung darf nicht unbemerkt im Hintergrund weiterlauschen.
  useEffect(
    () => () => {
      recognitionRef.current?.stop();
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    },
    []
  );

  return { listening, supported, toggle, toastMessage };
}

// Kompakter Mikrofon-Button für Diktierfelder: pulsiert rot mit "Höre zu…"-Hinweis
// während der Aufnahme, zeigt bei fehlender Browser-Unterstützung oder verweigerter
// Mikrofon-Freigabe eine dezente, selbst verschwindende Hinweis-Toast (siehe
// useDictation/showToast) — die App stürzt in beiden Fällen nicht ab, das Textfeld
// bleibt ganz normal manuell bedienbar.
function DictationButton({ dictation, label }) {
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={dictation.toggle}
        title={dictation.listening ? "Diktat stoppen" : `${label} per Spracheingabe diktieren`}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full border transition ${
          dictation.listening
            ? "animate-pulse border-transparent bg-[#EF4444] text-white shadow-sm"
            : "border-slate-200 bg-white text-slate-400 hover:border-[#FF2A00] hover:text-[#FF2A00]"
        }`}
      >
        <Mic size={14} />
      </button>
      {dictation.listening && (
        <span className="absolute -bottom-5 right-0 z-10 whitespace-nowrap rounded-full bg-[#EF4444] px-2 py-0.5 text-[10px] font-semibold text-white shadow">
          Höre zu…
        </span>
      )}
      {dictation.toastMessage && (
        <span className="absolute -bottom-6 right-0 z-10 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-[10px] font-medium text-white shadow-lg">
          {dictation.toastMessage}
        </span>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------------
// FOTO-MARKUP-EDITOR — Canvas-basiertes Annotationstool für Mängelfotos
// ----------------------------------------------------------------------------------
// Vollflächiges Bearbeitungs-Modal: lädt das Foto EINMALIG über loadImageAsDataUrl
// (Fetch+Blob statt eines cross-origin <img>) auf eine eigene Data-URL herunter, bevor
// es auf den Canvas gezeichnet wird — dadurch bleibt der Canvas garantiert "unbefleckt"
// (kein CORS-Tainted-Canvas), auch wenn das Original in Supabase Storage liegt, und
// canvas.toDataURL() am Ende funktioniert zuverlässig. Undo/Zurücksetzen arbeiten mit
// vollständigen ImageData-Snapshots (siehe pushUndoSnapshot) — bei den hier verwendeten
// Canvas-Auflösungen (siehe MARKUP_MAX_DIM) ein bewusster, einfacher und robuster
// Kompromiss, kein Verlaufsprotokoll einzelner Zeichen-Operationen.
const MARKUP_COLORS = [
  { key: "red", value: "#EF4444", label: "Rot" },
  { key: "brand", value: "#FF2A00", label: "Marken-Orange" },
];
const MARKUP_STROKE_WIDTHS = [
  { key: "thin", value: 3, label: "Dünn" },
  { key: "medium", value: 6, label: "Mittel" },
  { key: "thick", value: 11, label: "Dick" },
];
const MARKUP_TOOLS = [
  { key: "pen", label: "Freihand", icon: Pencil },
  { key: "arrow", label: "Pfeil", icon: ArrowUpRight },
  { key: "circle", label: "Kreis", icon: Circle },
  { key: "rectangle", label: "Rechteck", icon: Square },
];
const MARKUP_MAX_DIM = 1400; // Zeichen-Auflösung — genug Detail zum Einkreisen von Schäden, ohne den Speicher (Undo-Snapshots) unnötig zu belasten.
const MARKUP_UNDO_LIMIT = 15;
const MARKUP_EXPORT_QUALITY = 0.85;

function PhotoMarkupEditor({ photo, onClose, onSave }) {
  const canvasRef = useRef(null);
  const baseImageDataRef = useRef(null); // Zustand des unbearbeiteten Fotos, für "Zurücksetzen"
  const undoStackRef = useRef([]);
  const drawStateRef = useRef(null); // { startX, startY, lastX, lastY } während eines aktiven Zeichenvorgangs
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState(MARKUP_COLORS[0].value);
  const [strokeWidth, setStrokeWidth] = useState(MARKUP_STROKE_WIDTHS[1].value);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [canUndo, setCanUndo] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError("");
      try {
        const { dataUrl } = await loadImageAsDataUrl(photo.photo_url);
        const img = new Image();
        img.onload = () => {
          if (cancelled) return;
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ratio = Math.min(1, MARKUP_MAX_DIM / img.naturalWidth, MARKUP_MAX_DIM / img.naturalHeight);
          canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio));
          canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio));
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          baseImageDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
          undoStackRef.current = [];
          setCanUndo(false);
          setLoading(false);
        };
        img.onerror = () => {
          if (!cancelled) {
            setLoadError("Foto konnte nicht geladen werden.");
            setLoading(false);
          }
        };
        img.src = dataUrl;
      } catch (err) {
        console.error("Foto für den Markup-Editor konnte nicht geladen werden:", err);
        if (!cancelled) {
          setLoadError("Foto konnte nicht geladen werden.");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [photo.photo_url]);

  const pushUndoSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    undoStackRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (undoStackRef.current.length > MARKUP_UNDO_LIMIT) undoStackRef.current.shift();
    setCanUndo(true);
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || undoStackRef.current.length === 0) return;
    const ctx = canvas.getContext("2d");
    ctx.putImageData(undoStackRef.current.pop(), 0, 0);
    setCanUndo(undoStackRef.current.length > 0);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImageDataRef.current) return;
    pushUndoSnapshot();
    canvas.getContext("2d").putImageData(baseImageDataRef.current, 0, 0);
  };

  // Rechnet Bildschirm- in Canvas-Koordinaten um — der Canvas wird per CSS
  // (max-h-full/max-w-full) responsiv herunterskaliert, seine tatsächliche
  // Zeichenauflösung (canvas.width/height) bleibt aber konstant bei MARKUP_MAX_DIM.
  const posFromEvent = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const drawArrow = (ctx, fromX, fromY, toX, toY) => {
    const headLength = Math.max(12, strokeWidth * 2.4);
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  };

  const handlePointerDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    const pos = posFromEvent(e);
    pushUndoSnapshot();
    drawStateRef.current = { startX: pos.x, startY: pos.y, lastX: pos.x, lastY: pos.y };
    if (tool === "pen") {
      const ctx = canvas.getContext("2d");
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      // Kurzer Ministrich statt eines reinen moveTo: macht auch einen Tap ohne
      // jede Bewegung (z.B. um nur einen Punkt zu markieren) sichtbar.
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(pos.x + 0.01, pos.y + 0.01);
      ctx.stroke();
    }
  };

  const handlePointerMove = (e) => {
    const state = drawStateRef.current;
    if (!state) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = posFromEvent(e);

    if (tool === "pen") {
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(state.lastX, state.lastY);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      state.lastX = pos.x;
      state.lastY = pos.y;
      return;
    }

    // Formen (Pfeil/Kreis/Rechteck): Live-Vorschau — der beim Zeichenbeginn gepushte
    // Undo-Snapshot wird bei jeder Bewegung zunächst restauriert und die Form darüber
    // neu gezeichnet, damit stets nur EINE (die aktuelle) Vorschau sichtbar ist statt
    // sich überlagernder Zwischenstände.
    const snapshot = undoStackRef.current[undoStackRef.current.length - 1];
    if (snapshot) ctx.putImageData(snapshot, 0, 0);
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    if (tool === "arrow") {
      drawArrow(ctx, state.startX, state.startY, pos.x, pos.y);
    } else if (tool === "circle") {
      const rx = Math.max(1, Math.abs(pos.x - state.startX) / 2);
      const ry = Math.max(1, Math.abs(pos.y - state.startY) / 2);
      const cx = (pos.x + state.startX) / 2;
      const cy = (pos.y + state.startY) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (tool === "rectangle") {
      ctx.strokeRect(state.startX, state.startY, pos.x - state.startX, pos.y - state.startY);
    }
  };

  const handlePointerUp = (e) => {
    if (!drawStateRef.current) return;
    const canvas = canvasRef.current;
    if (canvas?.hasPointerCapture?.(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    drawStateRef.current = null;
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaveError("");
    setSaving(true);
    try {
      const rawDataUrl = canvas.toDataURL("image/jpeg", MARKUP_EXPORT_QUALITY);
      // Nochmalige, großzügig bemessene Komprimierung über denselben Pfad wie alle
      // anderen eingebetteten Fotos (siehe compressImageDataUrl) — hält die
      // Dateigröße auch bei einer sehr hochauflösenden Ausgangsaufnahme im
      // praxistauglichen Rahmen für State/Sync-Warteschlange und PDF-Export.
      const compressed = await compressImageDataUrl(rawDataUrl, PDF_PHOTO_MAX_WIDTH * 2, PDF_PHOTO_MAX_HEIGHT * 2, MARKUP_EXPORT_QUALITY);
      await onSave(compressed.dataUrl);
    } catch (err) {
      console.error("Markup konnte nicht gespeichert werden:", err);
      setSaveError("Änderungen konnten nicht gespeichert werden. Bitte erneut versuchen.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-bold text-white">
          <PenTool size={16} className="text-[#FF2A00]" /> Foto-Markup
        </p>
        <button onClick={onClose} disabled={saving} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-40">
          <X size={20} />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-3">
        {loading && (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Loader2 size={24} className="animate-spin" />
            <span className="text-xs">Foto wird geladen…</span>
          </div>
        )}
        {loadError && !loading && <p className="text-sm text-rose-400">{loadError}</p>}
        <canvas
          ref={canvasRef}
          className={`max-h-full max-w-full touch-none rounded-lg border border-slate-800 shadow-2xl ${loading || loadError ? "hidden" : ""}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>

      {!loading && !loadError && (
        <div className="border-t border-slate-800 bg-slate-900 px-3 py-3">
          <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
            {MARKUP_TOOLS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTool(t.key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  tool === t.key ? "bg-[#FF2A00] text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <t.icon size={14} /> {t.label}
              </button>
            ))}
            <span className="mx-1 h-5 w-px bg-slate-700" />
            {MARKUP_COLORS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setColor(c.value)}
                title={c.label}
                className={`h-7 w-7 rounded-full border-2 transition ${color === c.value ? "border-white" : "border-transparent"}`}
                style={{ backgroundColor: c.value }}
              />
            ))}
            <span className="mx-1 h-5 w-px bg-slate-700" />
            {MARKUP_STROKE_WIDTHS.map((w) => (
              <button
                key={w.key}
                type="button"
                onClick={() => setStrokeWidth(w.value)}
                title={w.label}
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition ${
                  strokeWidth === w.value ? "bg-slate-700" : "hover:bg-slate-800"
                }`}
              >
                <span className="rounded-full bg-white" style={{ width: w.value, height: w.value }} />
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={handleUndo}
                disabled={!canUndo}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Undo2 size={14} /> Rückgängig
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
              >
                <Eraser size={14} /> Zurücksetzen
              </button>
            </div>
            <div className="flex items-center gap-2">
              {saveError && <span className="text-[11px] font-medium text-rose-400">{saveError}</span>}
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF2A00] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#E02400] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Änderungen speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Einzelnes Vorschaubild in der Fotogalerie eines Pins (siehe PinModal unten) —
// eigene Komponente statt eines Inline-Ausdrucks innerhalb von photos.map(), weil
// useOfflineCapableAssetUrl (Offline-Asset-Cache, siehe oben) einen eigenen React-
// Hook je Foto braucht, das ist innerhalb einer .map()-Callback-Funktion nicht
// zulässig (Regeln der Hooks). Reicht die aufgelöste (online: unveränderte, offline:
// ggf. lokale object:-URL) sowohl an das Vorschaubild selbst als auch an den
// Lightbox-Trigger weiter, damit beide dieselbe, bereits zwischengespeicherte
// Quelle verwenden.
function PinPhotoThumb({ photo, readOnly, onZoom, onRemove, onMarkup }) {
  const resolvedUrl = useOfflineCapableAssetUrl(photo.photo_url);
  const displayUrl = resolvedUrl || photo.photo_url;
  return (
    <div className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200">
      <img
        src={displayUrl}
        alt=""
        className="h-full w-full cursor-zoom-in object-cover transition group-hover:opacity-90"
        onClick={() => onZoom(displayUrl)}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
        <ZoomIn size={16} className="text-white opacity-0 transition group-hover:opacity-100" />
      </div>
      {!readOnly && (
        <button
          onClick={() => onRemove(photo)}
          className="absolute right-1 top-1 rounded-full bg-slate-900/70 p-0.5 text-white opacity-0 transition group-hover:opacity-100"
        >
          <X size={12} />
        </button>
      )}
      {/* Foto-Markup-Editor-Trigger — bewusst dauerhaft sichtbar (nicht erst bei Hover
          wie die Löschen-Schaltfläche), damit das Werkzeug auf den kleinen
          Vorschaubildern gut auffindbar bleibt (siehe Anforderung "gut sichtbares
          Stift-/Bearbeiten-Icon"). */}
      {!readOnly && (
        <button
          onClick={() => onMarkup(photo)}
          title="Foto bearbeiten (Markup)"
          className="absolute bottom-1 left-1 inline-flex items-center justify-center rounded-full bg-white/90 p-1 text-slate-700 shadow transition hover:bg-white hover:text-[#FF2A00]"
        >
          <PenTool size={12} />
        </button>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------------
// PIN DETAIL MODAL
// ----------------------------------------------------------------------------------

function PinModal({
  pin,
  pins,
  pinNumber,
  isNew,
  readOnly,
  trades,
  project,
  floor,
  plan,
  generatedBy,
  onRequestLogin,
  onClose,
  onSaveFields,
  onDelete,
  onAddTodo,
  onToggleTodo,
  onRemoveTodo,
  onUploadPhotos,
  onRemovePhoto,
  onSaveMarkup,
}) {
  const [draft, setDraft] = useState({
    title: pin.title,
    status: pin.status,
    priority: pin.priority,
    description: pin.description,
    assignee: pin.assigned_to || "",
    angle: pin.angle ?? 0,
    trade_id: pin.trade_id || "",
    dueDate: pin.due_date || "",
    referenceCode: pin.reference_code || "",
    area: pin.area || "",
  });
  const [todoInput, setTodoInput] = useState("");
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [todoBusy, setTodoBusy] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportPdfError, setExportPdfError] = useState("");
  const [markupPhoto, setMarkupPhoto] = useState(null); // aktuell im Foto-Markup-Editor geöffnetes Foto
  const fileInputRef = useRef(null);

  const update = (field, value) => {
    if (readOnly) return;
    setDraft((d) => ({ ...d, [field]: value }));
  };

  // Autocomplete-Vorschlagsliste für "Firma / Zuständige Person" — alle bislang für
  // diese Grundrissskizze vergebenen Namen/Firmen, dedupliziert. Bewusst nur dieses
  // eine Feld, nicht Gewerk (das hat bereits eine feste Auswahlliste aus der
  // Gewerke-Verwaltung).
  const uniqueAssignees = useMemo(() => {
    return Array.from(new Set((pins || []).map((p) => p.assigned_to).filter(Boolean)));
  }, [pins]);

  // Voice-to-Text (Abschnitt 2): zwei unabhängige Diktier-Sitzungen, je eine für
  // "Thema" und "Beschreibung / Notiz" — siehe useDictation weiter oben.
  const titleDictation = useDictation({ getBaseText: () => draft.title, setText: (v) => update("title", v) });
  const descriptionDictation = useDictation({ getBaseText: () => draft.description, setText: (v) => update("description", v) });

  const todos = pin.pin_todos || [];
  const photos = pin.pin_photos || [];

  const handleSave = async () => {
    if (readOnly) return;
    setSaving(true);
    try {
      await onSaveFields({
        title: draft.title.trim() || "Neuer Eintrag",
        status: draft.status,
        priority: draft.priority,
        description: draft.description,
        assigned_to: draft.assignee,
        angle: draft.angle,
        trade_id: draft.trade_id || null,
        due_date: draft.dueDate || null,
        reference_code: draft.referenceCode.trim(),
        area: draft.area.trim(),
      });
      // Bei Erfolg schließt der Aufrufer (App) das Modal.
    } catch {
      // Fehler wird bereits über das globale Banner in App angezeigt; Modal bleibt offen.
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = async () => {
    if (readOnly) return;
    setDeleting(true);
    try {
      await onDelete();
    } catch {
      setDeleting(false);
    }
  };

  // Schneller Einzel-PDF-Export dieses einen Pins (siehe generateSinglePinPdf) —
  // bewusst OHNE Login-Sperre (readOnly-Guard), da reine Berichtserstellung keine
  // Schreibaktion ist und auch Gästen beim schnellen Nachfragen an Nachunternehmer
  // nützt. Nur für bestehende Pins möglich (isNew hat noch keine gespeicherten Daten,
  // ID oder Fotos).
  const handleExportSinglePin = async () => {
    if (isNew) return;
    setExportPdfError("");
    setExportingPdf(true);
    try {
      await generateSinglePinPdf({ project, floor, plan, pin, exportNumber: pinNumber, trades, generatedBy });
    } catch (err) {
      console.error("Einzel-PDF-Export fehlgeschlagen:", err);
      setExportPdfError("Export fehlgeschlagen.");
    } finally {
      setExportingPdf(false);
    }
  };

  const addTodo = async () => {
    if (readOnly || !todoInput.trim() || todoBusy) return;
    const text = todoInput.trim();
    setTodoInput("");
    setTodoBusy(true);
    try {
      await onAddTodo(text);
    } finally {
      setTodoBusy(false);
    }
  };

  // Echter Datei-Upload: mehrere Bilder gleichzeitig möglich (Kamera oder Dateisystem).
  // Jede Datei wird direkt in den Bucket "pin-photos" hochgeladen (siehe uploadPinPhoto),
  // die öffentliche URL landet als eigener Datensatz in pin_photos.
  const handlePhotoFiles = async (fileList) => {
    if (readOnly) return;
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;
    setUploadingPhotos(true);
    try {
      await onUploadPhotos(files);
    } finally {
      setUploadingPhotos(false);
    }
  };

  return (
    <div className={`${MODAL_BACKDROP_BASE} z-50`}>
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[88vh] sm:max-w-lg sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex-1">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#FF2A00]">
              {isNew ? "Neuer Pin" : pinNumber ? `Pin Nr. ${pinNumber}` : `Pin #${pin.id.slice(0, 8)}`}
            </p>
            <div className="flex items-center gap-2">
              <input
                value={draft.title}
                onChange={(e) => update("title", e.target.value)}
                disabled={readOnly}
                placeholder="Titel des Mangels…"
                className="w-full min-w-0 flex-1 border-none p-0 text-lg font-bold text-slate-900 outline-none placeholder:text-slate-300 disabled:bg-transparent"
              />
              {!readOnly && <DictationButton dictation={titleDictation} label="Thema" />}
            </div>
          </div>
          <button onClick={onClose} className={MODAL_CLOSE_BTN}>
            <X size={20} />
          </button>
        </div>

        {readOnly && (
          <div className="mx-5 mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
            <Lock size={14} className="shrink-0" />
            <span>
              Nur Ansicht —{" "}
              <button onClick={onRequestLogin} className="underline underline-offset-2 hover:text-amber-900">
                jetzt anmelden
              </button>
              , um diesen Pin zu bearbeiten.
            </span>
          </div>
        )}

        {/* Automatische Zeit-/Benutzererfassung (Abschnitt 3) — transparent im Modal
            einsehbar, nicht manuell editierbar. */}
        {!isNew && (
          <p className="mx-5 mt-3 text-[11px] text-slate-400">
            Angelegt von {pin.created_by || "unbekannt"} am {formatDateTime(pin.created_at)}
            {pin.updated_by && pin.updated_at && pin.updated_at !== pin.created_at && (
              <> · zuletzt bearbeitet von {pin.updated_by} am {formatDateTime(pin.updated_at)}</>
            )}
          </p>
        )}

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Status</FieldLabel>
              <div className="flex flex-col gap-1.5">
                {Object.entries(STATUS).map(([key, s]) => (
                  <button
                    key={key}
                    onClick={() => update("status", key)}
                    disabled={readOnly}
                    className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed ${
                      draft.status === key ? `${s.bg} ${s.text} border-transparent ring-2 ring-inset ${s.ring}` : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${s.dot}`} /> {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>Priorität</FieldLabel>
              <div className="flex flex-col gap-1.5">
                {Object.entries(PRIORITY).map(([key, p]) => (
                  <button
                    key={key}
                    onClick={() => update("priority", key)}
                    disabled={readOnly}
                    className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed ${
                      draft.priority === key ? `${p.bg} ${p.text} border-transparent ring-2 ring-inset ring-current/20` : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`h-2 w-1 rounded-sm ${p.bar}`} /> {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Blickrichtung / Aufnahmewinkel */}
          <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
            <AngleCompass value={draft.angle ?? 0} onChange={(deg) => update("angle", deg)} disabled={readOnly} />
          </div>

          {/* Description */}
          <div>
            <FieldLabel>Beschreibung / Notiz</FieldLabel>
            <div className="relative">
              <textarea
                value={draft.description}
                onChange={(e) => update("description", e.target.value)}
                disabled={readOnly}
                rows={3}
                placeholder="Details zum Mangel oder zur Aufgabe…"
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 pr-10 text-sm text-slate-700 outline-none ring-[#FF2A00]/30 placeholder:text-slate-400 focus:border-[#FF2A00] focus:ring-4 disabled:bg-slate-50"
              />
              {!readOnly && (
                <div className="absolute right-2 top-2">
                  <DictationButton dictation={descriptionDictation} label="Beschreibung" />
                </div>
              )}
            </div>
          </div>

          {/* Zuständigkeit: Firma/Person (mit Autocomplete) & Gewerk nebeneinander */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>Firma / Zuständige Person</FieldLabel>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  list="pin-assignee-suggestions"
                  value={draft.assignee}
                  onChange={(e) => update("assignee", e.target.value)}
                  disabled={readOnly}
                  placeholder="z.B. Helmut / Fa. Mustermann Elektro"
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none ring-[#FF2A00]/30 placeholder:text-slate-400 focus:border-[#FF2A00] focus:ring-4 disabled:bg-slate-50"
                />
                <datalist id="pin-assignee-suggestions">
                  {uniqueAssignees.map((name, i) => (
                    <option key={i} value={name} />
                  ))}
                </datalist>
              </div>
            </div>
            <div>
              <FieldLabel>Gewerk</FieldLabel>
              <div className="relative">
                <Wrench className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select
                  value={draft.trade_id || ""}
                  onChange={(e) => update("trade_id", e.target.value)}
                  disabled={readOnly}
                  className="w-full appearance-none rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none ring-[#FF2A00]/30 focus:border-[#FF2A00] focus:ring-4 disabled:bg-slate-50"
                >
                  <option value="">Kein Gewerk zugeordnet</option>
                  {(trades || [])
                    .filter((t) => t.active || t.id === pin.trade_id)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                        {!t.active ? " (inaktiv)" : ""}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Frist / Fälligkeitsdatum */}
          <div>
            <FieldLabel>Frist / Fälligkeitsdatum</FieldLabel>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="date"
                value={draft.dueDate}
                onChange={(e) => update("dueDate", e.target.value)}
                disabled={readOnly}
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none ring-[#FF2A00]/30 focus:border-[#FF2A00] focus:ring-4 disabled:bg-slate-50"
              />
            </div>
          </div>

          {/* Anschlussbezeichnung & Bereich — für die Export-Spaltenstruktur des
              Geschoss-Berichts (Abschnitt 2). */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Anschlussbezeichnung</FieldLabel>
              <div className="relative">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  value={draft.referenceCode}
                  onChange={(e) => update("referenceCode", e.target.value)}
                  disabled={readOnly}
                  placeholder="z.B. S002"
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none ring-[#FF2A00]/30 placeholder:text-slate-400 focus:border-[#FF2A00] focus:ring-4 disabled:bg-slate-50"
                />
              </div>
            </div>
            <div>
              <FieldLabel>Bereich</FieldLabel>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  value={draft.area}
                  onChange={(e) => update("area", e.target.value)}
                  disabled={readOnly}
                  placeholder="z.B. Flur Nord"
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none ring-[#FF2A00]/30 placeholder:text-slate-400 focus:border-[#FF2A00] focus:ring-4 disabled:bg-slate-50"
                />
              </div>
            </div>
          </div>

          {/* Todos */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <ListChecks size={14} /> Aufgaben
            </label>
            <div className="space-y-1.5">
              {todos.map((t) => (
                <div key={t.id} className="group flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5">
                  <button onClick={() => !readOnly && onToggleTodo(t)} disabled={readOnly} className="shrink-0 text-[#FF2A00] disabled:cursor-not-allowed">
                    {t.completed ? <CheckSquare size={17} /> : <Square size={17} className="text-slate-400" />}
                  </button>
                  <span className={`flex-1 text-sm ${t.completed ? "text-slate-400 line-through" : "text-slate-700"}`}>{t.text}</span>
                  {!readOnly && (
                    <button onClick={() => onRemoveTodo(t.id)} className="text-slate-300 opacity-0 transition hover:text-rose-500 group-hover:opacity-100">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              {todos.length === 0 && <p className="text-xs text-slate-400">Noch keine Aufgaben erfasst.</p>}
            </div>
            {!readOnly && (
              <div className="mt-2 flex gap-2">
                <input
                  value={todoInput}
                  onChange={(e) => setTodoInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTodo()}
                  disabled={todoBusy}
                  placeholder="Neue Aufgabe hinzufügen…"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none ring-[#FF2A00]/30 placeholder:text-slate-400 focus:border-[#FF2A00] focus:ring-4 disabled:bg-slate-50"
                />
                <button
                  onClick={addTodo}
                  disabled={todoBusy}
                  className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {todoBusy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                </button>
              </div>
            )}
          </div>

          {/* Photos */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <Camera size={14} /> Fotogalerie
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                handlePhotoFiles(e.target.files);
                e.target.value = ""; // erlaubt erneuten Upload derselben Datei
              }}
            />
            <div className="grid grid-cols-4 gap-2">
              {photos.map((photo) => (
                <PinPhotoThumb
                  key={photo.id}
                  photo={photo}
                  readOnly={readOnly}
                  onZoom={setLightboxSrc}
                  onRemove={onRemovePhoto}
                  onMarkup={setMarkupPhoto}
                />
              ))}
              {uploadingPhotos && (
                <div className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-400">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-[10px] font-medium">Lädt hoch…</span>
                </div>
              )}
              {!readOnly && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhotos}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 text-slate-400 transition hover:border-[#FF2A00] hover:text-[#FF2A00] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ImagePlus size={18} />
                  <span className="text-[10px] font-medium">Foto hochladen</span>
                </button>
              )}
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">PNG, JPG oder WebP — direkt von Kamera oder Speicher.</p>
          </div>

          {/* Verlauf — vollständige Bearbeitungshistorie (Abschnitt 3), append-only */}
          {!isNew && (
            <div>
              <FieldLabel>
                <span className="inline-flex items-center gap-1.5">
                  <History size={12} /> Verlauf
                </span>
              </FieldLabel>
              <PinActivityHistory entries={pin.pin_activity_log} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5">
          {!isNew ? (
            <div className="relative flex items-center gap-1">
              <button
                onClick={handleExportSinglePin}
                disabled={exportingPdf}
                title="Diesen Pin als schnelles 1-Seiten-PDF exportieren — inkl. Foto und Lageplan-Ausschnitt"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {exportingPdf ? <Loader2 size={16} className="animate-spin" /> : <Crosshair size={16} />} Einzel-PDF
              </button>
              {!readOnly && (
                <button
                  onClick={handleDeleteClick}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Löschen
                </button>
              )}
              {exportPdfError && (
                <p className="absolute bottom-full left-0 mb-1.5 w-52 rounded-md bg-rose-50 px-2.5 py-1.5 text-[11px] font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
                  {exportPdfError}
                </p>
              )}
            </div>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={saving || deleting}
              className={BTN_SECONDARY}
            >
              {readOnly ? "Schließen" : "Abbrechen"}
            </button>
            {readOnly ? (
              <button
                onClick={onRequestLogin}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF2A00] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#E02400]"
              >
                <LogIn size={16} /> Anmelden zum Bearbeiten
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving || deleting}
                className={BTN_PRIMARY}
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Speichern
              </button>
            )}
          </div>
        </div>
      </div>

      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}

      {markupPhoto && (
        <PhotoMarkupEditor
          photo={markupPhoto}
          onClose={() => setMarkupPhoto(null)}
          onSave={async (dataUrl) => {
            await onSaveMarkup(markupPhoto, dataUrl);
            setMarkupPhoto(null);
          }}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------------
// SKIZZEN-NOTIZ BEARBEITEN — schlankes Modal für Text, Kategorie (Farbe) und
// Verschieben/Löschen einer Plan-Notiz. Bewusst deutlich einfacher als PinModal
// (kein Status, keine Priorität, keine Fotos/Aufgaben/Verlauf) — eine Notiz ist ein
// reiner Vor-Ort-Hinweis, keine dokumentationspflichtige Mängelerfassung.
// ----------------------------------------------------------------------------------
function PlanNoteModal({ note, isNew, readOnly, onRequestLogin, onClose, onSave, onDelete }) {
  const [text, setText] = useState(note.text || "");
  const [color, setColor] = useState(note.color || "amber");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (readOnly) return;
    if (!text.trim()) {
      setError("Bitte einen Text für die Notiz eingeben.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await onSave({ text: text.trim(), color });
    } catch (err) {
      console.error("Notiz konnte nicht gespeichert werden:", err);
      setError(err?.message || "Die Notiz konnte nicht gespeichert werden. Bitte erneut versuchen.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = async () => {
    if (readOnly) return;
    setDeleting(true);
    try {
      await onDelete();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className={`${MODAL_BACKDROP_BASE} z-50`}>
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[85vh] sm:max-w-md sm:rounded-2xl">
        <div className={MODAL_HEADER_ROW}>
          <div>
            <p className={MODAL_EYEBROW}>{isNew ? "Neue Notiz" : "Plan-Notiz"}</p>
            <h2 className="flex items-center gap-1.5 text-lg font-bold text-slate-900">
              <StickyNote size={18} className="text-amber-500" /> Skizzen-Notiz
            </h2>
          </div>
          <button onClick={onClose} className={MODAL_CLOSE_BTN}>
            <X size={20} />
          </button>
        </div>

        {readOnly && (
          <div className="mx-5 mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
            <Lock size={14} className="shrink-0" />
            <span>
              Nur Ansicht —{" "}
              <button onClick={onRequestLogin} className="underline underline-offset-2 hover:text-amber-900">
                jetzt anmelden
              </button>
              , um diese Notiz zu bearbeiten.
            </span>
          </div>
        )}

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <FieldLabel>Notiztext</FieldLabel>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={readOnly}
              rows={2}
              placeholder="z.B. Gefahrenbereich, Lagerfläche Elektro, Fluchtweg freihalten…"
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none ring-[#FF2A00]/30 placeholder:text-slate-400 focus:border-[#FF2A00] focus:ring-4 disabled:bg-slate-50"
            />
            {!readOnly && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {PLAN_NOTE_QUICK_TEXTS.map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setText(quick)}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                  >
                    {quick}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <FieldLabel>Kategorie / Farbe</FieldLabel>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(PLAN_NOTE_COLORS).map(([key, c]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => !readOnly && setColor(key)}
                  disabled={readOnly}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed ${
                    color === key ? `${c.bg} ${c.text} border-transparent ring-2 ring-inset ring-current/20` : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${c.dot}`} /> {c.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5">
          {!isNew && !readOnly ? (
            <button
              onClick={handleDeleteClick}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Löschen
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button onClick={onClose} disabled={saving || deleting} className={BTN_SECONDARY}>
              {readOnly ? "Schließen" : "Abbrechen"}
            </button>
            {readOnly ? (
              <button
                onClick={onRequestLogin}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF2A00] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#E02400]"
              >
                <LogIn size={16} /> Anmelden zum Bearbeiten
              </button>
            ) : (
              <button onClick={handleSave} disabled={saving || deleting} className={BTN_PRIMARY}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Speichern
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------------
// ROOT APP
// ----------------------------------------------------------------------------------

function App() {
  // -------------------------------------------------------------------------------
  // AUTH
  // -------------------------------------------------------------------------------
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Verpflichtende App-Zugriffssperre (siehe LoginScreen): getrennt von "session", weil
  // sie zusätzlich zur echten Supabase-Session auch über die Offline-Anmeldung
  // (verifyOfflineCredential) freigeschaltet werden kann, ohne dass dabei eine echte,
  // RLS-fähige Session entsteht. authSource hält fest, auf welchem Weg — steuert u.a.
  // die Kopfzeilen-Anzeige weiter unten. Default false: vor der ersten erfolgreichen
  // Anmeldung (bzw. bevor eine bereits von Supabase persistierte Session geladen ist)
  // ist ausschließlich der Login-Bildschirm sichtbar.
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authSource, setAuthSource] = useState(null); // 'online' | 'offline' | null

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) console.error("Session konnte nicht geladen werden:", error);
      setSession(data?.session ?? null);
      setAuthLoading(false);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Sobald eine echte Supabase-Session vorliegt (frisch angemeldet, oder von Supabase
  // selbst aus einer früheren Sitzung persistiert und beim Start automatisch
  // wiederhergestellt — das funktioniert dank localStorage-Persistenz sogar ohne
  // Netzverbindung), gilt die App-Zugriffssperre als aufgehoben. Bewusst einseitig
  // (setzt nur auf true, nie zurück auf false) — das Abmelden läuft ausschließlich
  // über handleAppLogout weiter unten, damit ein kurzzeitig null werdendes "session"
  // während eines Auth-Übergangs nicht versehentlich zurück auf den Login-Bildschirm
  // wechselt, während z. B. die Offline-Anmeldung bereits aktiv ist.
  useEffect(() => {
    if (session) {
      setIsAuthenticated(true);
      setAuthSource("online");
    }
  }, [session]);

  // "Angemeldet bleiben" für den Offline-Anmeldepfad (siehe rememberOfflineSession/
  // getRememberedOfflineEmail oben): erst NACHDEM der erste Supabase-Session-Check
  // abgeschlossen ist (authLoading === false), sonst würde diese Prüfung kurzzeitig
  // fälschlich "offline" anzeigen, obwohl gleich darauf noch eine echte Online-
  // Session eintrifft. Greift nur, wenn keine echte Session vorliegt — eine
  // vorhandene Online-Session hat immer Vorrang und setzt authSource bereits oben
  // auf "online".
  useEffect(() => {
    if (authLoading || session) return;
    const rememberedEmail = getRememberedOfflineEmail();
    if (rememberedEmail) {
      setIsAuthenticated(true);
      setAuthSource("offline");
    }
  }, [authLoading, session]);

  // Zentraler Guard für alle Schreibaktionen: Gäste (kein session) bekommen statt der
  // Aktion das Login-Modal angezeigt (Klick auf "Neues Projekt", "Bearbeiten",
  // "Löschen", Pin setzen/verschieben, Etage hinzufügen, …). Bewusst weiterhin an
  // "session" (nicht "isAuthenticated") gebunden: die App-Zugriffssperre erlaubt zwar
  // per Offline-Anmeldung das Betrachten der App, tatsächliche Schreibaktionen
  // benötigen aber zwingend eine echte, RLS-fähige Supabase-Session (siehe
  // OFFLINE-ANMELDUNG-Kommentar bei verifyOfflineCredential weiter oben).
  const requireAuth = () => {
    if (!session) {
      setAuthModalOpen(true);
      return false;
    }
    return true;
  };

  const handleSignIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Fingerabdruck für eine spätere Offline-Anmeldung an diesem Gerät aktualisieren —
    // bewusst ohne await/eigene Fehlerbehandlung hier: cacheOfflineCredential fängt
    // Fehler bereits intern ab und darf die gerade erfolgreiche Anmeldung nicht
    // nachträglich blockieren oder verzögern.
    cacheOfflineCredential(email, password);
  };

  const handleSignUp = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.error("Abmelden fehlgeschlagen:", err);
      setGlobalError("Abmelden ist fehlgeschlagen. Bitte erneut versuchen.");
    }
  };

  // Login-Bildschirm-Handler (siehe LoginScreen): versucht zuerst die echte Online-
  // Anmeldung (über handleSignIn, mit Zeitlimit gegen ein hängendes Funkloch-Fetch),
  // weicht bei einer tatsächlichen Verbindungsstörung (nicht bei aktiv von Supabase
  // abgelehnten Zugangsdaten, siehe isNetworkFailure) auf die lokale Offline-Anmeldung
  // aus. Wirft bei endgültigem Fehlschlag, damit LoginScreen die Meldung anzeigen kann.
  const handleGateLogin = async (email, password) => {
    if (isOnline()) {
      try {
        await withTimeout(handleSignIn(email, password), 9000, "Online-Anmeldung");
        return;
      } catch (err) {
        if (!isNetworkFailure(err)) throw err;
        console.warn("Online-Anmeldung nicht erreichbar, versuche Offline-Anmeldung:", err);
      }
    }
    const offlineOk = await verifyOfflineCredential(email, password);
    if (offlineOk) {
      setIsAuthenticated(true);
      setAuthSource("offline");
      // "Angemeldet bleiben" auf diesem Gerät (siehe rememberOfflineSession) — beim
      // nächsten Kaltstart ohne Netz muss das Passwort dadurch nicht erneut
      // eingegeben werden, siehe restoreRememberedOfflineSession weiter unten.
      rememberOfflineSession(email);
      return;
    }
    throw new Error(
      isOnline()
        ? "Anmeldung fehlgeschlagen. Bitte Zugangsdaten prüfen."
        : "Keine Internetverbindung und keine passenden, auf diesem Gerät zwischengespeicherten Zugangsdaten gefunden. Für die Offline-Anmeldung ist einmalig eine erfolgreiche Online-Anmeldung auf diesem Gerät erforderlich."
    );
  };

  // Vollständiges Abmelden aus Sicht der App-Zugriffssperre: löst bei Bedarf zusätzlich
  // die echte Supabase-Session auf (handleSignOut) und setzt in jedem Fall isAuthenticated/
  // authSource zurück — auch im reinen Offline-Anmeldefall, in dem es ohnehin keine
  // echte Session zum Auflösen gibt.
  const handleAppLogout = async () => {
    if (session) await handleSignOut();
    setIsAuthenticated(false);
    setAuthSource(null);
    // Löscht auch die "Angemeldet bleiben"-Markierung des Offline-Anmeldepfads
    // (siehe rememberOfflineSession/getRememberedOfflineEmail weiter oben) — ohne
    // diesen Aufruf würde ein Nutzer, der offline angemeldet war, nach dem Klick auf
    // "Abmelden" beim nächsten App-Start ohne Netzverbindung sofort wieder automatisch
    // eingeloggt, obwohl er sich aktiv ausgeloggt hat.
    forgetOfflineSession();
  };

  // -------------------------------------------------------------------------------
  // DATEN-STATE
  // -------------------------------------------------------------------------------
  const [projects, setProjects] = useState([]); // Projekte inkl. leichter Etagen-/Pin-Zusammenfassung
  const [loadingProjects, setLoadingProjects] = useState(true);

  const [floors, setFloors] = useState([]); // Etagen des aktuell geöffneten Projekts (inkl. leichter Pin-Zusammenfassung)
  const [loadingFloors, setLoadingFloors] = useState(false);

  const [floorPlans, setFloorPlans] = useState([]); // Grundrisskizzen der aktuell geöffneten Etage (inkl. leichter Pin-Zusammenfassung)
  const [loadingFloorPlans, setLoadingFloorPlans] = useState(false);

  const [pins, setPins] = useState([]); // Pins der aktuell geöffneten Grundrissskizze, inkl. pin_todos & pin_photos
  const [loadingPins, setLoadingPins] = useState(false);

  // Skizzen-Notizen (Plan Annotations) der aktuell geöffneten Grundrissskizze — werden
  // zusammen mit den Pins geladen (siehe Effekt bei selectedFloorPlanId weiter unten),
  // daher bewusst ohne eigenes loadingPlanNotes (loadingPins deckt beide ab).
  const [planNotes, setPlanNotes] = useState([]);

  const [creatingPin, setCreatingPin] = useState(false);
  const [creatingNote, setCreatingNote] = useState(false);
  const [globalError, setGlobalError] = useState(null);

  const [screen, setScreen] = useState("projects"); // projects | floors | sketches | plan
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedFloorId, setSelectedFloorId] = useState(null);
  const [selectedFloorPlanId, setSelectedFloorPlanId] = useState(null);
  const [query, setQuery] = useState("");
  const [modalState, setModalState] = useState(null); // { pinId, isNew }
  const [noteModalState, setNoteModalState] = useState(null); // { noteId, isNew }
  const [floorModalOpen, setFloorModalOpen] = useState(false);
  const [editFloorModalState, setEditFloorModalState] = useState(null); // { floor }
  const [deleteFloorConfirm, setDeleteFloorConfirm] = useState(null); // { target }
  const [deleteFloorBusy, setDeleteFloorBusy] = useState(false);
  const [floorPlanModalOpen, setFloorPlanModalOpen] = useState(false);
  const [editFloorPlanModalState, setEditFloorPlanModalState] = useState(null); // { plan }
  const [deleteFloorPlanConfirm, setDeleteFloorPlanConfirm] = useState(null); // { target }
  const [deleteFloorPlanBusy, setDeleteFloorPlanBusy] = useState(false);
  const [projectModalState, setProjectModalState] = useState(null); // { mode: "create" | "edit", project }
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { target }
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [trades, setTrades] = useState([]); // Gewerke-Katalog (unabhängig vom ausgewählten Projekt)
  const [tradesAdminOpen, setTradesAdminOpen] = useState(false);

  const [users, setUsers] = useState([]); // app_users, nur für angemeldete Nutzer ladbar (RLS)
  const [usersAdminOpen, setUsersAdminOpen] = useState(false);

  const [dropboxConnected, setDropboxConnected] = useState(() => isDropboxConnected());
  const [dropboxModalOpen, setDropboxModalOpen] = useState(false);

  const [pdfExportModalState, setPdfExportModalState] = useState(null); // { project }

  // Offline-First-Speicherung & Synchronisations-Warteschlange (Abschnitt/Punkt 15,
  // siehe Datenschicht-Funktionen weiter oben). online spiegelt navigator.onLine,
  // syncQueue die aktuell in localStorage wartenden Offline-Änderungen, syncing ist
  // true, während flushSyncQueue() gerade aktiv abarbeitet.
  const [online, setOnline] = useState(() => isOnline());
  const [syncQueue, setSyncQueue] = useState(() => readSyncQueue());
  const [syncing, setSyncing] = useState(false);

  const project = projects.find((p) => p.id === selectedProjectId);
  const floor = floors.find((f) => f.id === selectedFloorId);
  const plan = floorPlans.find((fp) => fp.id === selectedFloorPlanId);
  const activePin = modalState ? pins.find((p) => p.id === modalState.pinId) : null;
  // Fortlaufende Pin-Nummer des aktuell im Modal geöffneten Pins — exakt dieselbe
  // Sortierlogik (created_at aufsteigend, Index+1) wie pinNumberById in FloorPlanView
  // und wie die Export-Funktionen, damit die im Modal-Header angezeigte "Pin Nr. X"
  // garantiert mit der Nummer auf dem Plan und in der Export-Tabelle übereinstimmt.
  const activePinNumber = activePin
    ? [...pins].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).findIndex((p) => p.id === activePin.id) + 1
    : null;
  const activeNote = noteModalState ? planNotes.find((n) => n.id === noteModalState.noteId) : null;

  // Projektspezifische Gewerke-Einschränkung: null bedeutet "für dieses Projekt wurde
  // noch nie eine Auswahl gespeichert" (Bestandsprojekt von vor diesem Feature) — in
  // diesem Fall werden wie bisher alle aktiven Gewerke angeboten, um durch die
  // Migration niemanden auszusperren. Ein leeres Array ist dagegen eine bewusste
  // Entscheidung ("für dieses Projekt ist aktuell kein Gewerk relevant") und wird
  // auch so respektiert — betrifft die Gewerke-Filterung in FloorPlanView und die
  // Gewerk-Auswahl im Mängel-Modal (PinModal).
  const projectTradeIds = resolveProjectTradeIds(project);
  const projectTrades = projectTradeIds === null ? trades : trades.filter((t) => projectTradeIds.includes(t.id));
  // Ist dem aktuell geöffneten Pin ein Gewerk zugeordnet, das (z.B. durch eine
  // spätere Änderung der Projekt-Gewerke) nicht mehr in projectTrades enthalten ist,
  // wird es dem Pin-Modal zusätzlich mitgegeben — sonst würde eine bestehende
  // Zuordnung im Dropdown kommentarlos verschwinden, statt nur nicht mehr neu
  // wählbar zu sein.
  const activePinTrade = activePin?.trade_id ? trades.find((t) => t.id === activePin.trade_id) : null;
  const pinModalTrades =
    activePinTrade && !projectTrades.some((t) => t.id === activePinTrade.id) ? [...projectTrades, activePinTrade] : projectTrades;

  // Verknüpft die angemeldete Supabase-Auth-Session (nur E-Mail bekannt) mit dem
  // fachlichen Benutzerprofil aus app_users, sofern eines mit derselben E-Mail-
  // Adresse existiert. Wird u.a. von canAccessAdmin() zur Rollenprüfung genutzt.
  const currentAppUser = session?.user?.email
    ? users.find((u) => u.email?.toLowerCase() === session.user.email.toLowerCase()) || null
    : null;

  // Kompakte Akteur-Information für die automatische Zeit-/Benutzererfassung
  // (Abschnitt 3, siehe logPinActivity/created_by/updated_by) — null, solange
  // niemand angemeldet ist (Mängel-Aktionen erfordern ohnehin eine Anmeldung).
  const currentActor = session?.user?.email ? { email: session.user.email, name: currentAppUser?.name || session.user.email } : null;

  // -------------------------------------------------------------------------------
  // DATA FETCHING
  // -------------------------------------------------------------------------------

  // Einmalig beim ersten Laden: prüft, ob die aktuelle URL von einer Dropbox-
  // Weiterleitung stammt (siehe startDropboxConnect/completeDropboxConnectFromUrl),
  // schließt die Verbindung ggf. ab und räumt die URL wieder auf.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const connected = await completeDropboxConnectFromUrl();
        if (connected && !cancelled) setDropboxConnected(true);
      } catch (err) {
        console.error("Dropbox-Verbindung konnte nicht abgeschlossen werden:", err);
        if (!cancelled) setGlobalError("Die Dropbox-Verbindung konnte nicht abgeschlossen werden. Bitte erneut versuchen.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // An isAuthenticated statt an [] gebunden: solange die verpflichtende App-
  // Zugriffssperre aktiv ist (siehe LoginScreen), sollen Projektdaten erst gar nicht im
  // Hintergrund abgerufen werden — nicht nur nicht angezeigt. Feuert erneut, sobald
  // isAuthenticated von false auf true wechselt (erfolgreiche Anmeldung).
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let cancelled = false;
    (async () => {
      setLoadingProjects(true);
      try {
        if (!isOnline()) throw new Error("Keine Internetverbindung.");
        const data = await fetchProjectsWithSummary();
        if (!cancelled) {
          setProjects(data);
          cacheProjectsOffline(data);
        }
      } catch (err) {
        // Offline-First (Abschnitt 15): schlägt der Live-Abruf fehl (kein Netz, oder
        // Supabase nicht erreichbar), auf den zuletzt erfolgreich geladenen und lokal
        // zwischengespeicherten Stand zurückfallen, statt nur eine Fehlermeldung zu zeigen.
        const cached = readCachedProjects();
        if (cached) {
          console.warn("Projekte konnten nicht live geladen werden, verwende Offline-Cache:", err);
          if (!cancelled) setProjects(cached);
        } else {
          console.error("Projekte konnten nicht geladen werden:", err);
          if (!cancelled) {
            setGlobalError("Projekte konnten nicht geladen werden. Bitte Internetverbindung und Supabase-Konfiguration prüfen.");
          }
        }
      } finally {
        if (!cancelled) setLoadingProjects(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Gewerke sind öffentlich lesbar und unabhängig vom ausgewählten Projekt — werden
  // deshalb einmalig nach erfolgreicher Anmeldung geladen (inkl. automatischer
  // Erstbefüllung des Standard-Katalogs, falls die Tabelle noch leer ist, siehe
  // fetchTrades()). Ebenfalls an isAuthenticated statt an [] gebunden, aus demselben
  // Grund wie beim Projekte-Abruf direkt darüber.
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchTrades();
        if (!cancelled) setTrades(data);
      } catch (err) {
        console.error("Gewerke konnten nicht geladen werden:", err);
        if (!cancelled) setGlobalError("Gewerke konnten nicht geladen werden. Bitte erneut versuchen.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Die Benutzerliste enthält E-Mail-Adressen (RLS-Policy: nur "authenticated" darf
  // lesen) und wird deshalb erst nach erfolgreichem Login geladen.
  useEffect(() => {
    if (!session) {
      setUsers([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchUsers();
        if (!cancelled) setUsers(data);
      } catch (err) {
        console.error("Benutzer konnten nicht geladen werden:", err);
        if (!cancelled) setGlobalError("Benutzer konnten nicht geladen werden. Bitte erneut versuchen.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  useEffect(() => {
    if (!selectedProjectId) {
      setFloors([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingFloors(true);
      try {
        if (!isOnline()) throw new Error("Keine Internetverbindung.");
        const data = await fetchFloorsWithPinSummary(selectedProjectId);
        if (!cancelled) {
          setFloors(data);
          cacheFloorsOffline(selectedProjectId, data);
        }
      } catch (err) {
        const cached = readCachedFloors(selectedProjectId);
        if (cached) {
          console.warn("Etagen konnten nicht live geladen werden, verwende Offline-Cache:", err);
          if (!cancelled) setFloors(cached);
        } else {
          console.error("Etagen konnten nicht geladen werden:", err);
          if (!cancelled) setGlobalError("Etagen konnten nicht geladen werden. Bitte erneut versuchen.");
        }
      } finally {
        if (!cancelled) setLoadingFloors(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedProjectId]);

  useEffect(() => {
    if (!selectedFloorId) {
      setFloorPlans([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingFloorPlans(true);
      try {
        if (!isOnline()) throw new Error("Keine Internetverbindung.");
        const data = await fetchFloorPlansWithPinSummary(selectedFloorId);
        if (!cancelled) {
          setFloorPlans(data);
          cacheFloorPlansOffline(selectedFloorId, data);
        }
      } catch (err) {
        const cached = readCachedFloorPlans(selectedFloorId);
        if (cached) {
          console.warn("Grundrisskizzen konnten nicht live geladen werden, verwende Offline-Cache:", err);
          if (!cancelled) setFloorPlans(cached);
        } else {
          console.error("Grundrisskizzen konnten nicht geladen werden:", err);
          if (!cancelled) setGlobalError("Grundrisskizzen konnten nicht geladen werden. Bitte erneut versuchen.");
        }
      } finally {
        if (!cancelled) setLoadingFloorPlans(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedFloorId]);

  useEffect(() => {
    if (!selectedFloorPlanId) {
      setPins([]);
      setPlanNotes([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingPins(true);
      try {
        if (!isOnline()) throw new Error("Keine Internetverbindung.");
        const data = await fetchPinsWithDetails(selectedFloorPlanId);
        if (!cancelled) {
          setPins(data);
          cachePinsOffline(selectedFloorPlanId, data);
        }
      } catch (err) {
        const cached = readCachedPins(selectedFloorPlanId);
        if (cached) {
          console.warn("Pins konnten nicht live geladen werden, verwende Offline-Cache:", err);
          if (!cancelled) setPins(cached);
        } else {
          console.error("Pins konnten nicht geladen werden:", err);
          if (!cancelled) setGlobalError("Pins konnten nicht geladen werden. Bitte erneut versuchen.");
        }
      } finally {
        if (!cancelled) setLoadingPins(false);
      }
      // Skizzen-Notizen laufen bewusst als eigener, unabhängiger Block: ein Fehler
      // beim Laden der Notizen soll die bereits erfolgreich geladenen Pins nicht
      // verwerfen (und umgekehrt) — beide Ressourcen haben ihren eigenen
      // Offline-Lese-Cache (siehe cachePlanNotesOffline/readCachedPlanNotes).
      try {
        if (!isOnline()) throw new Error("Keine Internetverbindung.");
        const notes = await fetchPlanNotes(selectedFloorPlanId);
        if (!cancelled) {
          setPlanNotes(notes);
          cachePlanNotesOffline(selectedFloorPlanId, notes);
        }
      } catch (err) {
        const cachedNotes = readCachedPlanNotes(selectedFloorPlanId);
        if (cachedNotes) {
          console.warn("Notizen konnten nicht live geladen werden, verwende Offline-Cache:", err);
          if (!cancelled) setPlanNotes(cachedNotes);
        } else {
          console.error("Skizzen-Notizen konnten nicht geladen werden:", err);
          if (!cancelled) setPlanNotes([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedFloorPlanId]);

  // Hält den lokalen Offline-Cache auch nach optimistischen Zwischenständen aktuell
  // (neuer Pin, geänderte Felder, neues Foto, …), nicht nur beim initialen Laden
  // oben — damit ein Wechsel in den Offline-Modus unmittelbar danach den zuletzt
  // sichtbaren Stand zeigt, nicht den vom letzten Server-Fetch.
  useEffect(() => {
    if (selectedProjectId) cacheFloorsOffline(selectedProjectId, floors);
  }, [floors, selectedProjectId]);
  useEffect(() => {
    if (selectedFloorId) cacheFloorPlansOffline(selectedFloorId, floorPlans);
  }, [floorPlans, selectedFloorId]);
  useEffect(() => {
    if (selectedFloorPlanId) cachePinsOffline(selectedFloorPlanId, pins);
  }, [pins, selectedFloorPlanId]);
  useEffect(() => {
    if (selectedFloorPlanId) cachePlanNotesOffline(selectedFloorPlanId, planNotes);
  }, [planNotes, selectedFloorPlanId]);
  useEffect(() => {
    cacheProjectsOffline(projects);
  }, [projects]);

  // -------------------------------------------------------------------------------
  // Hilfsfunktionen, um die "leichten" Pin-Zusammenfassungen (nur id/status) in
  // floors-, floorPlans- und projects-State synchron zu halten, damit Badges auf
  // Etagen-, Grundrisskizzen- und Projektübersicht sofort korrekt sind, ohne nach
  // jeder Pin-Änderung alles neu vom Server zu laden. floorId aktualisiert die
  // geschossweite Aggregation (alle Skizzen zusammen), planId zusätzlich die
  // Aggregation der konkret betroffenen Grundrisskizze.
  // -------------------------------------------------------------------------------

  const addPinSummary = (floorId, planId, pin) => {
    const summary = { id: pin.id, status: pin.status };
    setFloors((prev) => prev.map((f) => (f.id === floorId ? { ...f, pins: [...(f.pins || []), summary] } : f)));
    setFloorPlans((prev) => prev.map((fp) => (fp.id === planId ? { ...fp, pins: [...(fp.pins || []), summary] } : fp)));
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== selectedProjectId
          ? p
          : { ...p, floors: (p.floors || []).map((f) => (f.id === floorId ? { ...f, pins: [...(f.pins || []), summary] } : f)) }
      )
    );
  };

  const removePinSummary = (floorId, planId, pinId) => {
    setFloors((prev) => prev.map((f) => (f.id === floorId ? { ...f, pins: (f.pins || []).filter((p) => p.id !== pinId) } : f)));
    setFloorPlans((prev) =>
      prev.map((fp) => (fp.id === planId ? { ...fp, pins: (fp.pins || []).filter((p) => p.id !== pinId) } : fp))
    );
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== selectedProjectId
          ? p
          : { ...p, floors: (p.floors || []).map((f) => (f.id === floorId ? { ...f, pins: (f.pins || []).filter((p2) => p2.id !== pinId) } : f)) }
      )
    );
  };

  const updatePinSummaryStatus = (floorId, planId, pinId, status) => {
    setFloors((prev) => prev.map((f) => (f.id === floorId ? { ...f, pins: (f.pins || []).map((p) => (p.id === pinId ? { ...p, status } : p)) } : f)));
    setFloorPlans((prev) =>
      prev.map((fp) =>
        fp.id === planId ? { ...fp, pins: (fp.pins || []).map((p) => (p.id === pinId ? { ...p, status } : p)) } : fp
      )
    );
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== selectedProjectId
          ? p
          : {
              ...p,
              floors: (p.floors || []).map((f) =>
                f.id === floorId ? { ...f, pins: (f.pins || []).map((p2) => (p2.id === pinId ? { ...p2, status } : p2)) } : f
              ),
            }
      )
    );
  };

  // -------------------------------------------------------------------------------
  // OFFLINE-FIRST-SPEICHERUNG & AUTOMATISCHE HINTERGRUND-SYNCHRONISATION (Punkt 15)
  // -------------------------------------------------------------------------------

  // Meldet Wechsel des Online-Status live an die App (window-Events statt Polling) —
  // steuert sowohl OfflineStatusIndicator als auch die automatische Synchronisation
  // unten.
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Ein Pin gilt als "noch nicht synchronisiert", solange irgendein Eintrag in der
  // Warteschlange sich auf ihn bezieht — entweder über seine (dann noch lokale)
  // Offline-ID, oder weil bereits eine Folgeänderung für ihn wartet. Weitere
  // Bearbeitungen an einem solchen Pin werden bewusst ebenfalls eingereiht (statt
  // direkt an Supabase gesendet), damit die Reihenfolge der Änderungen erhalten
  // bleibt, auch wenn zwischenzeitlich kurz wieder eine Verbindung bestand.
  const isPinPendingSync = (pinId) => isOfflineId(pinId) || syncQueue.some((q) => q.pinId === pinId || q.localId === pinId);

  // Arbeitet die Warteschlange sequenziell (FIFO) ab, sobald wieder eine Verbindung
  // besteht — ein einzelner fehlschlagender Eintrag beendet den Lauf, alle bereits
  // erfolgreich verarbeiteten Einträge bleiben dabei entfernt (kein Doppel-Senden),
  // der Rest wird beim nächsten Aufruf (nächster "online"-Wechsel oder manueller
  // erneuter Versuch) automatisch weiterverarbeitet. Nach einem erfolgreichen
  // (Teil-)Lauf werden Projekte/Etagen/Pins einmal neu vom Server geladen (siehe
  // refreshAfterSync) — das ersetzt sämtliche lokalen Platzhalter-IDs und
  // -Zeitstempel durch die serverseitig kanonischen Werte, ohne dass jede einzelne
  // Warteschlangen-Aktion ihr Ergebnis manuell in den React-State zurückschreiben muss.
  const flushSyncQueue = async () => {
    if (syncing) return;
    const queue = readSyncQueue();
    if (queue.length === 0) return;
    setSyncing(true);
    let processedAny = false;
    const idMap = new Map(Object.entries(readOfflineIdMap()));
    try {
      for (const item of queue) {
        const targetPinId = item.pinId ? idMap.get(item.pinId) || resolveOfflineId(item.pinId) : null;
        if (item.type === "create_pin") {
          const pin = await createPin(item.planId, item.floorId, item.x, item.y, item.actor);
          await logPinActivity(pin.id, "created", "Mängel-Pin angelegt (offline erfasst, synchronisiert)", item.actor);
          idMap.set(item.localId, pin.id);
          rememberSyncedPinId(item.localId, pin.id);
        } else if (item.type === "update_pin") {
          await updatePin(targetPinId, item.fields, item.actor);
          if (item.statusChangeDetail) await logPinActivity(targetPinId, "status_changed", item.statusChangeDetail, item.actor);
          if (item.updatedDetail) await logPinActivity(targetPinId, "updated", item.updatedDetail, item.actor);
          if (item.movedDetail) await logPinActivity(targetPinId, "moved", item.movedDetail, item.actor);
        } else if (item.type === "upload_photo") {
          const file = dataUrlToFile(item.dataUrl, item.fileName, item.mimeType);
          await uploadPinPhoto(targetPinId, file, item.actor);
          await logPinActivity(targetPinId, "photo_added", `Foto hochgeladen: „${item.fileName}" (offline erfasst, synchronisiert)`, item.actor);
        } else if (item.type === "update_photo") {
          // Foto-Markup, offline gespeichert (siehe handleSavePhotoMarkup) — ersetzt
          // beim Synchronisieren die Bilddatei des bereits bestehenden Fotos exakt wie
          // im Online-Fall (siehe updatePinPhotoUrl), inkl. Aufräumen der alten Version.
          await updatePinPhotoUrl({ id: item.photoId, pin_id: targetPinId, photo_url: item.oldPhotoUrl }, item.dataUrl, item.actor);
          await logPinActivity(targetPinId, "photo_edited", "Foto bearbeitet (offline erfasst, synchronisiert)", item.actor);
        } else if (item.type === "delete_pin") {
          // Offline-Löschung (siehe handleDeletePin) — photos wurde beim Einreihen des
          // Warteschlangen-Eintrags mitgeschickt (der lokale Zustand kennt den Pin zu
          // diesem Zeitpunkt ja bereits nicht mehr), deletePin() räumt damit wie im
          // Online-Fall auch die zugehörigen Storage-Dateien mit auf. Ein etwaiger noch
          // davor in der Warteschlange stehender update_pin-Eintrag für denselben Pin
          // (Bearbeitung vor der Löschung, beides offline) läuft in der Reihenfolge der
          // Warteschlange einfach vorher durch — unschädlich, das Ergebnis ist ohnehin
          // "gelöscht".
          await deletePin({ id: targetPinId, pin_photos: item.photos || [] });
        }
        processedAny = true;
        const remaining = readSyncQueue().filter((q) => q.id !== item.id);
        writeSyncQueue(remaining);
        setSyncQueue(remaining);
      }
    } catch (err) {
      console.error("Synchronisation eines Warteschlangen-Eintrags fehlgeschlagen, wird beim nächsten Verbindungsaufbau erneut versucht:", err);
      setGlobalError(
        "Ein Teil der offline erfassten Änderungen konnte noch nicht synchronisiert werden. Die App versucht es automatisch erneut, sobald wieder eine stabile Verbindung besteht."
      );
    }
    if (processedAny) await refreshAfterSync();
    setSyncing(false);
  };

  // Lädt Projekte (immer) sowie die aktuell geöffnete Etagen-/Pin-Ansicht (falls
  // offen) einmalig frisch vom Server nach — ersetzt damit jeden lokalen, optimistisch
  // gesetzten Offline-Zwischenstand durch den serverseitig kanonischen, nachdem die
  // Warteschlange (ganz oder teilweise) erfolgreich verarbeitet wurde.
  const refreshAfterSync = async () => {
    try {
      const freshProjects = await fetchProjectsWithSummary();
      setProjects(freshProjects);
    } catch (err) {
      console.error("Projekte konnten nach der Synchronisation nicht aktualisiert werden:", err);
    }
    if (selectedProjectId) {
      try {
        const freshFloors = await fetchFloorsWithPinSummary(selectedProjectId);
        setFloors(freshFloors);
      } catch (err) {
        console.error("Etagen konnten nach der Synchronisation nicht aktualisiert werden:", err);
      }
    }
    if (selectedFloorId) {
      try {
        const freshPlans = await fetchFloorPlansWithPinSummary(selectedFloorId);
        setFloorPlans(freshPlans);
      } catch (err) {
        console.error("Grundrisskizzen konnten nach der Synchronisation nicht aktualisiert werden:", err);
      }
    }
    if (selectedFloorPlanId) {
      try {
        const freshPins = await fetchPinsWithDetails(selectedFloorPlanId);
        setPins(freshPins);
      } catch (err) {
        console.error("Pins konnten nach der Synchronisation nicht aktualisiert werden:", err);
      }
    }
  };

  // Löst die Synchronisation automatisch aus: sowohl direkt nach einem Wechsel von
  // offline auf online, als auch beim (erneuten) Laden der Seite, falls zu diesem
  // Zeitpunkt bereits eine Verbindung besteht und noch nicht abgearbeitete Einträge
  // aus einer früheren Sitzung in der Warteschlange liegen.
  useEffect(() => {
    if (online && readSyncQueue().length > 0) flushSyncQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  // -------------------------------------------------------------------------------
  // NAVIGATION
  // -------------------------------------------------------------------------------

  const openProject = (id) => {
    setSelectedProjectId(id);
    setSelectedFloorId(null);
    setSelectedFloorPlanId(null);
    setScreen("floors");
  };

  // Führt zur Grundrisskizzen-Übersicht dieses Geschosses (Ebene 3) — NICHT mehr
  // direkt in die Planansicht. Erst die konkrete Auswahl einer Skizze (siehe
  // openFloorPlanSketch) öffnet die interaktive Pin-Ebene (Ebene 4).
  const openFloor = (id) => {
    setSelectedFloorId(id);
    setSelectedFloorPlanId(null);
    setScreen("sketches");
  };

  const openFloorPlanSketch = (id) => {
    setSelectedFloorPlanId(id);
    setScreen("plan");
  };

  // -------------------------------------------------------------------------------
  // PROJEKTE
  // -------------------------------------------------------------------------------

  const openCreateProject = () => {
    if (!requireAuth()) return;
    setProjectModalState({ mode: "create", project: null });
  };

  const openEditProject = (proj) => {
    if (!requireAuth()) return;
    setProjectModalState({ mode: "edit", project: proj });
  };

  const handleDeleteProjectClick = (proj) => {
    if (!requireAuth()) return;
    setDeleteConfirm({ target: proj });
  };

  // Favoriten-Stern in ProjectOverview (Grid- & Listenansicht) — optimistisches Update
  // mit Rollback, damit der Klick sofort sichtbar reagiert, ein Speicherfehler aber nicht
  // stillschweigend zu einem falschen Favoriten-Status in der Oberfläche führt.
  const handleToggleProjectFavorite = async (project) => {
    if (!requireAuth()) return;
    const nextValue = !project.is_favorite;
    setProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, is_favorite: nextValue } : p)));
    try {
      await updateProject(project.id, { is_favorite: nextValue });
    } catch (err) {
      console.error("Favoriten-Status konnte nicht gespeichert werden:", err);
      setProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, is_favorite: !nextValue } : p)));
      setGlobalError("Favoriten-Status konnte nicht gespeichert werden. Bitte erneut versuchen.");
    }
  };

  // Projekt abschließen/wiederherstellen (siehe "Projekt abschließen"-Button in
  // FloorOverview und die Schnell-Reaktivierung direkt auf der Kachel im Archiv-Filter
  // von ProjectOverview) — beide Oberflächen rufen denselben Handler, damit Status und
  // is_archived nie auseinanderlaufen können. Reines Umschalten anhand des aktuellen
  // project.is_archived: aktiv -> Abgeschlossen/archiviert, archiviert -> wieder
  // "In Bearbeitung"/aktiv. Optimistisches Update mit Rollback wie beim Favoriten-Stern.
  const handleToggleProjectArchive = async (project) => {
    if (!requireAuth()) return;
    const nextArchived = !project.is_archived;
    const nextStatus = nextArchived ? "Abgeschlossen" : "In Bearbeitung";
    const prevStatus = project.status;
    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? { ...p, is_archived: nextArchived, status: nextStatus } : p))
    );
    try {
      await updateProject(project.id, { is_archived: nextArchived, status: nextStatus });
    } catch (err) {
      console.error("Archiv-Status konnte nicht gespeichert werden:", err);
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, is_archived: !nextArchived, status: prevStatus } : p))
      );
      setGlobalError(
        nextArchived
          ? "Projekt konnte nicht abgeschlossen werden. Bitte erneut versuchen."
          : "Projekt konnte nicht wiederhergestellt werden. Bitte erneut versuchen."
      );
    }
  };

  const handleSaveProject = async (fields) => {
    // _coverImageFile ist kein echtes Projektfeld (siehe ProjectFormModal), sondern
    // die neu ausgewählte Titelbild-Datei, noch nicht hochgeladen — beim Anlegen
    // existiert die für den Storage-Pfad benötigte Projekt-ID erst NACH dem Insert,
    // deshalb läuft der eigentliche Upload immer erst hier, nie im Modal selbst.
    const { _coverImageFile: coverImageFile, ...projectFields } = fields;
    if (projectModalState.mode === "create") {
      const created = await createProject(projectFields);
      let finalProject = created;
      if (coverImageFile) {
        // Ein fehlgeschlagener Titelbild-Upload darf das bereits erfolgreich
        // angelegte Projekt nicht verwerfen — das Projekt bleibt bestehen, nur das
        // Titelbild fehlt dann, mit klarer Rückmeldung über das globale Fehler-Banner
        // statt eines Fehlers im (dann schon geschlossenen) Anlage-Dialog.
        try {
          const publicUrl = await uploadProjectCoverImage(created.id, coverImageFile);
          finalProject = await updateProject(created.id, { cover_image_url: publicUrl });
        } catch (err) {
          console.error("Projekt-Titelbild konnte nicht hochgeladen werden:", err);
          setGlobalError("Projekt wurde angelegt, das Titelbild konnte aber nicht hochgeladen werden. Bitte im Bearbeiten-Dialog erneut versuchen.");
        }
      }
      setProjects((prev) => [{ ...finalProject, floors: [] }, ...prev]);
    } else {
      let updatePayload = projectFields;
      if (coverImageFile) {
        try {
          const publicUrl = await uploadProjectCoverImage(projectModalState.project.id, coverImageFile);
          updatePayload = { ...updatePayload, cover_image_url: publicUrl };
        } catch (err) {
          console.error("Projekt-Titelbild konnte nicht hochgeladen werden:", err);
          setGlobalError("Die übrigen Änderungen werden gespeichert, das neue Titelbild konnte aber nicht hochgeladen werden. Bitte erneut versuchen.");
        }
      }
      const updated = await updateProject(projectModalState.project.id, updatePayload);
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
    }
    setProjectModalState(null);
    // Fehler werden (bis auf den separat abgefangenen Titelbild-Upload oben) NICHT
    // hier gefangen: ProjectFormModal wartet auf dieses Promise und zeigt einen
    // Fehlertext direkt im Modal, falls Insert/Update scheitern.
  };

  const confirmDeleteProject = async () => {
    if (!deleteConfirm) return;
    const target = deleteConfirm.target;
    setDeleteBusy(true);
    try {
      await deleteProject(target.id);
      setProjects((prev) => prev.filter((p) => p.id !== target.id));
      if (selectedProjectId === target.id) {
        setSelectedProjectId(null);
        setSelectedFloorId(null);
        setSelectedFloorPlanId(null);
        setScreen("projects");
      }
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Projekt konnte nicht gelöscht werden:", err);
      setGlobalError("Das Projekt konnte nicht gelöscht werden. Bitte erneut versuchen.");
    } finally {
      setDeleteBusy(false);
    }
  };

  // -------------------------------------------------------------------------------
  // ETAGEN
  // -------------------------------------------------------------------------------

  const openFloorModal = () => {
    if (!requireAuth()) return;
    setFloorModalOpen(true);
  };

  // Ein Geschoss ist ab sofort ein reiner Namens-Container (siehe createFloor) — kein
  // Datei-Upload mehr auf dieser Ebene, siehe stattdessen handleAddFloorPlanSketch.
  const handleAddFloor = async (name) => {
    if (!selectedProjectId) return;
    const newFloor = await createFloor(selectedProjectId, name);
    setFloors((prev) => [...prev, { ...newFloor, pins: [], floor_plans: [] }]);
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== selectedProjectId
          ? p
          : { ...p, floors: [...(p.floors || []), { id: newFloor.id, name: newFloor.name, pins: [] }] }
      )
    );
    setFloorModalOpen(false);
    // Fehler werden NICHT hier gefangen: NewFloorModal wartet auf dieses Promise
    // und zeigt einen Fehlertext direkt im Modal, falls der Insert scheitert.
  };

  const openEditFloorModal = (floor) => {
    if (!requireAuth()) return;
    setEditFloorModalState({ floor });
  };

  const handleUpdateFloor = async (name) => {
    if (!editFloorModalState) return;
    const floorId = editFloorModalState.floor.id;
    const updated = await updateFloor(floorId, name);
    setFloors((prev) => prev.map((f) => (f.id === floorId ? { ...f, name: updated.name } : f)));
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== selectedProjectId
          ? p
          : { ...p, floors: (p.floors || []).map((f) => (f.id === floorId ? { ...f, name: updated.name } : f)) }
      )
    );
    setEditFloorModalState(null);
    // Fehler werden NICHT hier gefangen: EditFloorModal wartet auf dieses Promise
    // und zeigt einen Fehlertext direkt im Modal, falls das Update scheitert.
  };

  const handleDeleteFloorClick = (floor) => {
    if (!requireAuth()) return;
    setDeleteFloorConfirm({ target: floor });
  };

  const confirmDeleteFloor = async () => {
    if (!deleteFloorConfirm) return;
    const target = deleteFloorConfirm.target;
    setDeleteFloorBusy(true);
    try {
      await deleteFloor(target);
      setFloors((prev) => prev.filter((f) => f.id !== target.id));
      setProjects((prev) =>
        prev.map((p) =>
          p.id !== selectedProjectId ? p : { ...p, floors: (p.floors || []).filter((f) => f.id !== target.id) }
        )
      );
      // Falls das gelöschte Geschoss gerade geöffnet war (z.B. Rücksprung aus der
      // Grundrisskizzen- oder Planansicht in die Geschossübersicht, ohne dass
      // selectedFloorId zwischenzeitlich geändert wurde): zurück zur Geschossübersicht
      // des Projekts, statt in ein anderes Geschoss zu springen — die darunterliegenden
      // Skizzen/Pins gehörten zum gelöschten Geschoss und sind serverseitig bereits
      // per ON DELETE CASCADE mitgelöscht.
      if (selectedFloorId === target.id) {
        setSelectedFloorId(null);
        setSelectedFloorPlanId(null);
        setScreen("floors");
      }
      setDeleteFloorConfirm(null);
    } catch (err) {
      console.error("Etage konnte nicht gelöscht werden:", err);
      setGlobalError("Die Etage konnte nicht gelöscht werden. Bitte erneut versuchen.");
    } finally {
      setDeleteFloorBusy(false);
    }
  };

  // -------------------------------------------------------------------------------
  // GRUNDRISSSKIZZEN (Ebene 3) — ein Geschoss kann mehrere Skizzen enthalten, jede
  // mit eigener Datei und eigenen, strikt daran gebundenen Pins (siehe plan_id).
  // -------------------------------------------------------------------------------

  const openFloorPlanModal = () => {
    if (!requireAuth()) return;
    setFloorPlanModalOpen(true);
  };

  const handleAddFloorPlanSketch = async (name, file) => {
    if (!selectedFloorId || !selectedProjectId) return;
    const newPlan = await createFloorPlanSketch(selectedFloorId, selectedProjectId, name, file);
    setFloorPlans((prev) => [...prev, { ...newPlan, pins: [] }]);
    setFloorPlanModalOpen(false);
    // Fehler werden NICHT hier gefangen: NewFloorPlanModal wartet auf dieses Promise
    // und zeigt einen Fehlertext direkt im Modal, falls Upload oder Insert scheitern.
  };

  const openEditFloorPlanModal = (plan) => {
    if (!requireAuth()) return;
    setEditFloorPlanModalState({ plan });
  };

  const handleUpdateFloorPlanSketch = async (name, file) => {
    if (!editFloorPlanModalState || !selectedProjectId) return;
    const planId = editFloorPlanModalState.plan.id;
    const updated = await updateFloorPlanSketch(planId, selectedProjectId, name, file);
    setFloorPlans((prev) => prev.map((fp) => (fp.id === planId ? { ...fp, ...updated } : fp)));
    setEditFloorPlanModalState(null);
    // Fehler werden NICHT hier gefangen: EditFloorPlanModal wartet auf dieses Promise
    // und zeigt einen Fehlertext direkt im Modal, falls Upload oder Update scheitern.
  };

  const handleDeleteFloorPlanClick = (plan) => {
    if (!requireAuth()) return;
    setDeleteFloorPlanConfirm({ target: plan });
  };

  const confirmDeleteFloorPlan = async () => {
    if (!deleteFloorPlanConfirm) return;
    const target = deleteFloorPlanConfirm.target;
    setDeleteFloorPlanBusy(true);
    try {
      await deleteFloorPlanSketch(target);
      setFloorPlans((prev) => prev.filter((fp) => fp.id !== target.id));
      // Aktualisiert die geschossweite Pin-Zusammenfassung (Ebene-2-Badges), da mit der
      // Skizze auch ihre Pins serverseitig per ON DELETE CASCADE mitgelöscht wurden.
      const removedPinIds = new Set((target.pins || []).map((p) => p.id));
      if (removedPinIds.size > 0 && selectedFloorId) {
        setFloors((prev) =>
          prev.map((f) => (f.id === selectedFloorId ? { ...f, pins: (f.pins || []).filter((p) => !removedPinIds.has(p.id)) } : f))
        );
      }
      // Falls die gelöschte Skizze gerade in der Planansicht geöffnet war, zurück zur
      // Grundrisskizzen-Übersicht des Geschosses (analog zu confirmDeleteFloor oben).
      if (selectedFloorPlanId === target.id) {
        setSelectedFloorPlanId(null);
        setScreen("sketches");
      }
      setDeleteFloorPlanConfirm(null);
    } catch (err) {
      console.error("Grundrissskizze konnte nicht gelöscht werden:", err);
      setGlobalError("Die Grundrissskizze konnte nicht gelöscht werden. Bitte erneut versuchen.");
    } finally {
      setDeleteFloorPlanBusy(false);
    }
  };

  // -------------------------------------------------------------------------------
  // GEWERKE (TRADES)
  // -------------------------------------------------------------------------------

  const openTradesAdmin = () => {
    if (!requireAuth()) return;
    if (!canAccessAdmin(session, currentAppUser)) {
      setGlobalError("Die Gewerkeverwaltung ist nur für Administratoren zugänglich.");
      return;
    }
    setTradesAdminOpen(true);
  };

  const handleCreateTrade = async (name) => {
    const sortOrder = trades.length;
    const created = await createTrade(name, sortOrder);
    setTrades((prev) => [...prev, created]);
  };

  const handleRenameTrade = async (tradeId, name) => {
    const updated = await updateTrade(tradeId, { name });
    setTrades((prev) => prev.map((t) => (t.id === tradeId ? { ...t, ...updated } : t)));
  };

  const handleToggleTradeActive = async (trade) => {
    const updated = await updateTrade(trade.id, { active: !trade.active });
    setTrades((prev) => prev.map((t) => (t.id === trade.id ? { ...t, ...updated } : t)));
  };

  const handleReorderTrades = async (orderedTrades) => {
    // Optimistisches Update, damit die Pfeile in TradesAdminModal sofort reagieren.
    setTrades((prev) => {
      const orderMap = new Map(orderedTrades.map((t, idx) => [t.id, idx]));
      return [...prev].sort((a, b) => (orderMap.get(a.id) ?? a.sort_order) - (orderMap.get(b.id) ?? b.sort_order));
    });
    await reorderTrades(orderedTrades);
    const refreshed = await fetchTrades();
    setTrades(refreshed);
  };

  // -------------------------------------------------------------------------------
  // BENUTZERVERWALTUNG
  // -------------------------------------------------------------------------------

  const openUsersAdmin = () => {
    if (!requireAuth()) return;
    if (!canAccessAdmin(session, currentAppUser)) {
      setGlobalError("Die Benutzerverwaltung ist nur für Administratoren zugänglich.");
      return;
    }
    setUsersAdminOpen(true);
  };

  const handleCreateUser = async (fields) => {
    const created = await createUser(fields);
    setUsers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleEditUser = async (userId, fields) => {
    const updated = await updateUser(userId, fields);
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updated } : u)));
  };

  const handleToggleUserActive = async (user) => {
    try {
      const updated = await updateUser(user.id, { active: !user.active });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...updated } : u)));
    } catch (err) {
      console.error("Benutzerstatus konnte nicht geändert werden:", err);
      setGlobalError("Der Benutzerstatus konnte nicht geändert werden. Bitte erneut versuchen.");
    }
  };

  // -------------------------------------------------------------------------------
  // DROPBOX-ARCHIVIERUNG
  // -------------------------------------------------------------------------------

  const openDropboxModal = () => {
    if (!requireAuth()) return;
    setDropboxModalOpen(true);
  };

  // startDropboxConnect() leitet den Browser bei Erfolg per window.location weiter
  // (kein React-Update mehr nötig) — schlägt bereits das Starten fehl (z.B. kein
  // DROPBOX_APP_KEY hinterlegt), wirft es, und DropboxConnectModal zeigt den Fehler.
  const handleConnectDropbox = () => startDropboxConnect();

  const handleDisconnectDropbox = () => {
    disconnectDropbox();
    setDropboxConnected(false);
  };

  // -------------------------------------------------------------------------------
  // PDF-EXPORT
  // -------------------------------------------------------------------------------

  const openPdfExportModal = (proj) => setPdfExportModalState({ project: proj });

  // -------------------------------------------------------------------------------
  // PINS
  // -------------------------------------------------------------------------------

  const handlePlanClick = async (x, y) => {
    if (!floor || !plan || creatingPin) return;
    if (!requireAuth()) return;
    setCreatingPin(true);
    setGlobalError(null);
    try {
      // Offline-First (Punkt 15): ohne Verbindung wird der Pin sofort lokal mit einer
      // eigenen Offline-ID angelegt (sichtbar, bearbeitbar, fotografierbar wie jeder
      // andere Pin) und die Anlage in die Warteschlange eingereiht. flushSyncQueue
      // ersetzt die Offline-ID beim nächsten Synchronisationslauf durch die echte.
      if (!online) {
        const localId = generateOfflineId();
        const nowIso = new Date().toISOString();
        const offlinePin = {
          id: localId,
          plan_id: plan.id,
          floor_id: floor.id,
          title: "Neuer Eintrag",
          description: "",
          status: "offen",
          priority: "mittel",
          assigned_to: "",
          trade_id: null,
          x,
          y,
          angle: 0,
          created_at: nowIso,
          updated_at: nowIso,
          created_by: currentActor?.email || null,
          updated_by: currentActor?.email || null,
          pin_todos: [],
          pin_photos: [],
          pin_activity_log: [
            {
              id: generateOfflineId(),
              pin_id: localId,
              action: "created",
              detail: "Mängel-Pin angelegt (offline erfasst, wird synchronisiert)",
              actor_email: currentActor?.email || null,
              actor_name: currentActor?.name || null,
              created_at: nowIso,
            },
          ],
        };
        setPins((prev) => [...prev, offlinePin]);
        addPinSummary(floor.id, plan.id, offlinePin);
        setSyncQueue(enqueueSyncItem({ type: "create_pin", localId, planId: plan.id, floorId: floor.id, x, y, actor: currentActor }));
        setModalState({ pinId: localId, isNew: true });
        return;
      }
      const newPin = await createPin(plan.id, floor.id, x, y, currentActor);
      // Abschnitt 3: automatische Zeit-/Benutzererfassung — jede Pin-Erstellung wird
      // sofort mit einem eigenen Eintrag in der Bearbeitungshistorie protokolliert.
      const activity = await logPinActivity(newPin.id, "created", "Mängel-Pin angelegt", currentActor);
      const pinWithActivity = { ...newPin, pin_activity_log: [activity] };
      setPins((prev) => [...prev, pinWithActivity]);
      addPinSummary(floor.id, plan.id, pinWithActivity);
      setModalState({ pinId: newPin.id, isNew: true });
    } catch (err) {
      console.error("Pin konnte nicht angelegt werden:", err);
      setGlobalError("Der neue Pin konnte nicht angelegt werden. Bitte Verbindung prüfen und erneut versuchen.");
    } finally {
      setCreatingPin(false);
    }
  };

  const handlePinClick = (pin) => setModalState({ pinId: pin.id, isNew: false });

  // Hängt einen neuen pin_activity_log-Eintrag optimistisch an den lokalen Zustand
  // eines Pins an — kleine, wiederverwendete Hilfsfunktion für die Pin-Handler unten.
  const appendPinActivity = (pinId, activity) => {
    setPins((prev) => prev.map((p) => (p.id === pinId ? { ...p, pin_activity_log: [...(p.pin_activity_log || []), activity] } : p)));
  };

  const handlePinMove = async (pinId, x, y) => {
    if (!session || !floor) return;
    const prevPin = pins.find((p) => p.id === pinId);
    if (!prevPin) return;
    setPins((prev) => prev.map((p) => (p.id === pinId ? { ...p, x, y } : p))); // optimistisches Update
    if (!online || isPinPendingSync(pinId)) {
      setSyncQueue(enqueueSyncItem({ type: "update_pin", pinId, fields: { x, y }, actor: currentActor }));
      appendPinActivity(pinId, {
        id: generateOfflineId(),
        pin_id: pinId,
        action: "moved",
        detail: "Position auf dem Grundriss verschoben (offline erfasst, wird synchronisiert)",
        actor_email: currentActor?.email || null,
        actor_name: currentActor?.name || null,
        created_at: new Date().toISOString(),
      });
      return;
    }
    try {
      await updatePin(pinId, { x, y }, currentActor);
      appendPinActivity(pinId, await logPinActivity(pinId, "moved", "Position auf dem Grundriss verschoben", currentActor));
    } catch (err) {
      console.error("Pin-Position konnte nicht gespeichert werden:", err);
      setGlobalError("Die neue Position des Pins konnte nicht gespeichert werden.");
      setPins((prev) => prev.map((p) => (p.id === pinId ? { ...p, x: prevPin.x, y: prevPin.y } : p))); // Rollback
    }
  };

  const handleSaveFields = async (pinId, fields) => {
    const prevPin = pins.find((p) => p.id === pinId);
    if (!online || isPinPendingSync(pinId)) {
      // Offline-First (Punkt 15): Feldänderungen (Titel, Beschreibung, Gewerk,
      // Zuständigkeit, Priorität) UND Statuswechsel (Offen → In Bearbeitung →
      // Abgeschlossen/Freigabe) laufen über denselben Save-Aufruf wie online — der
      // Unterschied ist ausschließlich, dass hier lokal aktualisiert und in die
      // Warteschlange eingereiht statt sofort an Supabase gesendet wird.
      const nowIso = new Date().toISOString();
      let statusChangeDetail = null;
      let updatedDetail = null;
      const newActivity = [];
      if (prevPin && fields.status !== undefined && fields.status !== prevPin.status) {
        const fromLabel = STATUS[prevPin.status]?.label || prevPin.status;
        const toLabel = STATUS[fields.status]?.label || fields.status;
        statusChangeDetail = `Status: ${fromLabel} → ${toLabel}`;
        newActivity.push({
          id: generateOfflineId(),
          pin_id: pinId,
          action: "status_changed",
          detail: `${statusChangeDetail} (offline erfasst, wird synchronisiert)`,
          actor_email: currentActor?.email || null,
          actor_name: currentActor?.name || null,
          created_at: nowIso,
        });
      }
      if (prevPin) {
        const changedLabels = Object.keys(PIN_FIELD_LABELS).filter(
          (key) => Object.prototype.hasOwnProperty.call(fields, key) && fields[key] !== prevPin[key]
        );
        if (changedLabels.length > 0) {
          updatedDetail = `Aktualisiert: ${changedLabels.map((k) => PIN_FIELD_LABELS[k]).join(", ")}`;
          newActivity.push({
            id: generateOfflineId(),
            pin_id: pinId,
            action: "updated",
            detail: `${updatedDetail} (offline erfasst, wird synchronisiert)`,
            actor_email: currentActor?.email || null,
            actor_name: currentActor?.name || null,
            created_at: nowIso,
          });
        }
      }
      setPins((prev) =>
        prev.map((p) =>
          p.id === pinId
            ? { ...p, ...fields, updated_by: currentActor?.email || null, updated_at: nowIso, pin_activity_log: [...(p.pin_activity_log || []), ...newActivity] }
            : p
        )
      );
      if (floor && plan && fields.status !== undefined) updatePinSummaryStatus(floor.id, plan.id, pinId, fields.status);
      setSyncQueue(enqueueSyncItem({ type: "update_pin", pinId, fields, actor: currentActor, statusChangeDetail, updatedDetail }));
      setModalState(null);
      return;
    }
    try {
      const updated = await updatePin(pinId, fields, currentActor);
      const newActivity = [];
      // Statusänderungen (inkl. Freigabe/Abschluss auf "erledigt") werden bewusst als
      // eigener, klar benannter Verlaufseintrag protokolliert statt nur als generisches
      // "aktualisiert" — Abschnitt 3 verlangt das explizit.
      if (prevPin && fields.status !== undefined && fields.status !== prevPin.status) {
        const fromLabel = STATUS[prevPin.status]?.label || prevPin.status;
        const toLabel = STATUS[fields.status]?.label || fields.status;
        newActivity.push(await logPinActivity(pinId, "status_changed", `Status: ${fromLabel} → ${toLabel}`, currentActor));
      }
      if (prevPin) {
        const changedLabels = Object.keys(PIN_FIELD_LABELS).filter(
          (key) => Object.prototype.hasOwnProperty.call(fields, key) && fields[key] !== prevPin[key]
        );
        if (changedLabels.length > 0) {
          const detail = `Aktualisiert: ${changedLabels.map((k) => PIN_FIELD_LABELS[k]).join(", ")}`;
          newActivity.push(await logPinActivity(pinId, "updated", detail, currentActor));
        }
      }
      setPins((prev) =>
        prev.map((p) => (p.id === pinId ? { ...p, ...updated, pin_activity_log: [...(p.pin_activity_log || []), ...newActivity] } : p))
      );
      if (floor && plan) updatePinSummaryStatus(floor.id, plan.id, pinId, updated.status);
      setModalState(null);
    } catch (err) {
      console.error("Pin konnte nicht gespeichert werden:", err);
      setGlobalError("Die Änderungen am Pin konnten nicht gespeichert werden. Bitte erneut versuchen.");
      throw err; // Modal fängt dies ab und bleibt geöffnet
    }
  };

  // Die gesamte Aufgabenverwaltung (unten) bleibt bewusst an eine bestehende
  // Verbindung gebunden (siehe Kommentar am Anfang des Offline-Moduls in der
  // Datenschicht) — requireOnline gibt dafür eine klare, sofortige Rückmeldung statt
  // eines rohen Netzwerkfehlers. Das Löschen eines Pins selbst ist seit der
  // Erweiterung der Offline-Synchronisation um Löschungen (siehe handleDeletePin/
  // "delete_pin" in flushSyncQueue) NICHT mehr an requireOnline gebunden.
  const requireOnline = (actionLabel) => {
    if (online) return true;
    setGlobalError(`${actionLabel} ist offline nicht möglich. Bitte bei bestehender Internetverbindung erneut versuchen.`);
    return false;
  };

  const handleDeletePin = async (pinId) => {
    if (!floor || !plan) return;
    const pinToDelete = pins.find((p) => p.id === pinId);
    if (!online || isPinPendingSync(pinId)) {
      // Offline-First (Erweiterung Löschungen): ein Pin, der auf diesem Gerät noch nie
      // synchronisiert wurde (offline angelegt, siehe isOfflineId/readOfflineIdMap),
      // existiert serverseitig noch gar nicht — dafür reicht es, ihn samt aller noch
      // ausstehenden Warteschlangen-Einträge (create_pin/update_pin/upload_photo/
      // update_photo) ersatzlos zu entfernen, statt einen "delete_pin"-Eintrag
      // anzulegen, der beim Synchronisieren ohnehin ins Leere liefe. Ein bereits
      // synchronisierter Pin bekommt stattdessen einen eigenen "delete_pin"-Eintrag,
      // der die Löschung nachholt, sobald wieder eine Verbindung besteht.
      if (isOfflineId(pinId) && !readOfflineIdMap()[pinId]) {
        const remaining = readSyncQueue().filter((q) => q.localId !== pinId && q.pinId !== pinId);
        writeSyncQueue(remaining);
        setSyncQueue(remaining);
      } else {
        setSyncQueue(
          enqueueSyncItem({ type: "delete_pin", pinId, photos: pinToDelete?.pin_photos || [], actor: currentActor })
        );
      }
      setPins((prev) => prev.filter((p) => p.id !== pinId));
      removePinSummary(floor.id, plan.id, pinId);
      setModalState(null);
      return;
    }
    try {
      await deletePin(pinToDelete || { id: pinId, pin_photos: [] });
      setPins((prev) => prev.filter((p) => p.id !== pinId));
      removePinSummary(floor.id, plan.id, pinId);
      setModalState(null);
    } catch (err) {
      console.error("Pin konnte nicht gelöscht werden:", err);
      setGlobalError("Der Pin konnte nicht gelöscht werden. Bitte erneut versuchen.");
      throw err;
    }
  };

  // -------------------------------------------------------------------------------
  // SKIZZEN-NOTIZEN (PLAN ANNOTATIONS) — bewusst schlanker als die Pin-Handler oben:
  // Anlegen, Verschieben, Bearbeiten und Löschen bleiben allesamt an eine bestehende
  // Verbindung gebunden (requireOnline), es gibt keine Offline-Anlage-Warteschlange
  // (siehe Kommentar bei der plan_notes-Datenschicht weiter oben).
  // -------------------------------------------------------------------------------

  const handleAddPlanNote = async (x, y) => {
    if (!plan || creatingNote) return;
    if (!requireAuth()) return;
    if (!requireOnline("Eine Notiz kann")) return;
    setCreatingNote(true);
    setGlobalError(null);
    try {
      const newNote = await createPlanNote(plan.id, x, y, currentActor);
      setPlanNotes((prev) => [...prev, newNote]);
      setNoteModalState({ noteId: newNote.id, isNew: true });
    } catch (err) {
      console.error("Notiz konnte nicht angelegt werden:", err);
      setGlobalError("Die neue Notiz konnte nicht angelegt werden. Bitte Verbindung prüfen und erneut versuchen.");
    } finally {
      setCreatingNote(false);
    }
  };

  const handleNoteClick = (note) => setNoteModalState({ noteId: note.id, isNew: false });

  const handleMoveNote = async (noteId, x, y) => {
    if (!session) return;
    const prevNote = planNotes.find((n) => n.id === noteId);
    if (!prevNote) return;
    setPlanNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, x, y } : n))); // optimistisches Update
    if (!requireOnline("Eine Notiz kann")) {
      setPlanNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, x: prevNote.x, y: prevNote.y } : n))); // Rollback
      return;
    }
    try {
      await updatePlanNote(noteId, { x, y }, currentActor);
    } catch (err) {
      console.error("Notiz-Position konnte nicht gespeichert werden:", err);
      setGlobalError("Die neue Position der Notiz konnte nicht gespeichert werden.");
      setPlanNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, x: prevNote.x, y: prevNote.y } : n))); // Rollback
    }
  };

  const handleSaveNoteFields = async (noteId, fields) => {
    if (!requireOnline("Eine Notiz kann")) return;
    try {
      const updated = await updatePlanNote(noteId, fields, currentActor);
      setPlanNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
      setNoteModalState(null);
    } catch (err) {
      console.error("Notiz konnte nicht gespeichert werden:", err);
      setGlobalError("Die Notiz konnte nicht gespeichert werden. Bitte erneut versuchen.");
      throw err; // Modal fängt dies ab und bleibt geöffnet
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!requireOnline("Eine Notiz kann")) return;
    try {
      await deletePlanNote(noteId);
      setPlanNotes((prev) => prev.filter((n) => n.id !== noteId));
      setNoteModalState(null);
    } catch (err) {
      console.error("Notiz konnte nicht gelöscht werden:", err);
      setGlobalError("Die Notiz konnte nicht gelöscht werden. Bitte erneut versuchen.");
      throw err;
    }
  };

  // -------------------------------------------------------------------------------
  // TODOS
  // -------------------------------------------------------------------------------

  const handleAddTodo = async (pinId, text) => {
    if (!requireOnline("Eine Aufgabe kann")) return;
    try {
      const todo = await addPinTodo(pinId, text, currentActor);
      const activity = await logPinActivity(pinId, "todo_added", `Aufgabe hinzugefügt: „${text}"`, currentActor);
      setPins((prev) =>
        prev.map((p) =>
          p.id === pinId
            ? { ...p, pin_todos: [...(p.pin_todos || []), todo], pin_activity_log: [...(p.pin_activity_log || []), activity] }
            : p
        )
      );
    } catch (err) {
      console.error("Aufgabe konnte nicht hinzugefügt werden:", err);
      setGlobalError("Die Aufgabe konnte nicht gespeichert werden.");
    }
  };

  const handleToggleTodo = async (pinId, todo) => {
    if (!requireOnline("Der Status einer Aufgabe kann")) return;
    try {
      const updated = await togglePinTodo(todo.id, !todo.completed);
      const activity = await logPinActivity(
        pinId,
        updated.completed ? "todo_completed" : "todo_reopened",
        `Aufgabe „${todo.text}" ${updated.completed ? "erledigt" : "wieder geöffnet"}`,
        currentActor
      );
      setPins((prev) =>
        prev.map((p) =>
          p.id === pinId
            ? {
                ...p,
                pin_todos: (p.pin_todos || []).map((t) => (t.id === todo.id ? updated : t)),
                pin_activity_log: [...(p.pin_activity_log || []), activity],
              }
            : p
        )
      );
    } catch (err) {
      console.error("Aufgabe konnte nicht aktualisiert werden:", err);
      setGlobalError("Der Status der Aufgabe konnte nicht aktualisiert werden.");
    }
  };

  const handleRemoveTodo = async (pinId, todoId) => {
    if (!requireOnline("Eine Aufgabe kann")) return;
    const todo = pins.find((p) => p.id === pinId)?.pin_todos?.find((t) => t.id === todoId);
    try {
      await deletePinTodo(todoId);
      const activity = await logPinActivity(pinId, "todo_removed", `Aufgabe entfernt: „${todo?.text || ""}"`, currentActor);
      setPins((prev) =>
        prev.map((p) =>
          p.id === pinId
            ? {
                ...p,
                pin_todos: (p.pin_todos || []).filter((t) => t.id !== todoId),
                pin_activity_log: [...(p.pin_activity_log || []), activity],
              }
            : p
        )
      );
    } catch (err) {
      console.error("Aufgabe konnte nicht gelöscht werden:", err);
      setGlobalError("Die Aufgabe konnte nicht gelöscht werden.");
    }
  };

  // -------------------------------------------------------------------------------
  // FOTOS
  // -------------------------------------------------------------------------------

  const handleUploadPhotos = async (pinId, files) => {
    for (const file of files) {
      try {
        // Offline-First (Punkt 15): das Foto wird sofort als data:-URL am Pin
        // angezeigt (Kamera-Aufnahme/Auswahl funktioniert unverändert) und der
        // eigentliche Supabase-Upload in die Warteschlange eingereiht. Die
        // Dropbox-Archivierung läuft ausschließlich für online aufgenommene Fotos
        // (siehe Kommentar im Offline-Modul der Datenschicht).
        if (!online || isPinPendingSync(pinId)) {
          const dataUrl = await fileToDataUrl(file);
          const nowIso = new Date().toISOString();
          const localPhoto = {
            id: generateOfflineId(),
            pin_id: pinId,
            photo_url: dataUrl,
            uploaded_by: currentActor?.email || null,
            created_at: nowIso,
          };
          setPins((prev) =>
            prev.map((p) =>
              p.id === pinId
                ? {
                    ...p,
                    pin_photos: [...(p.pin_photos || []), localPhoto],
                    pin_activity_log: [
                      ...(p.pin_activity_log || []),
                      {
                        id: generateOfflineId(),
                        pin_id: pinId,
                        action: "photo_added",
                        detail: `Foto hochgeladen: „${file.name}" (offline erfasst, wird synchronisiert)`,
                        actor_email: currentActor?.email || null,
                        actor_name: currentActor?.name || null,
                        created_at: nowIso,
                      },
                    ],
                  }
                : p
            )
          );
          setSyncQueue(
            enqueueSyncItem({
              type: "upload_photo",
              pinId,
              dataUrl,
              fileName: file.name,
              mimeType: file.type,
              actor: currentActor,
              // localPhotoId verknüpft diesen Warteschlangen-Eintrag mit dem lokal
              // angezeigten Foto — wird ein noch unsynchronisiertes Offline-Foto per
              // Markup-Editor bearbeitet (siehe handleSavePhotoMarkup), wird darüber
              // GENAU dieser Eintrag gefunden und seine dataUrl durch die bearbeitete
              // Fassung ersetzt, statt das unbearbeitete Original hochzuladen.
              localPhotoId: localPhoto.id,
            })
          );
          continue;
        }
        const photo = await uploadPinPhoto(pinId, file, currentActor);
        const activity = await logPinActivity(pinId, "photo_added", `Foto hochgeladen: „${file.name}"`, currentActor);
        setPins((prev) =>
          prev.map((p) =>
            p.id === pinId
              ? { ...p, pin_photos: [...(p.pin_photos || []), photo], pin_activity_log: [...(p.pin_activity_log || []), activity] }
              : p
          )
        );
        // Dropbox-Archivierung (Abschnitt 4) ist bewusst best effort: sie läuft NACH
        // dem primären, bereits erfolgreichen Supabase-Upload und darf diesen bei
        // einem Fehlschlag weder rückgängig machen noch blockieren.
        if (dropboxConnected && currentAppUser?.kuerzel) {
          syncPhotoToDropbox(file, currentAppUser.kuerzel).catch((err) => {
            console.error("Dropbox-Sync fehlgeschlagen:", err);
            setGlobalError(`Foto wurde gespeichert, die Dropbox-Archivierung ist aber fehlgeschlagen: ${err?.message || err}`);
          });
        }
      } catch (err) {
        console.error("Foto konnte nicht hochgeladen werden:", err);
        setGlobalError(`Foto "${file.name}" konnte nicht hochgeladen werden.`);
      }
    }
  };

  const handleRemovePhoto = async (pinId, photo) => {
    if (!requireOnline("Ein Foto kann")) return;
    try {
      await deletePinPhoto(photo);
      const activity = await logPinActivity(pinId, "photo_removed", "Foto entfernt", currentActor);
      setPins((prev) =>
        prev.map((p) =>
          p.id === pinId
            ? {
                ...p,
                pin_photos: (p.pin_photos || []).filter((ph) => ph.id !== photo.id),
                pin_activity_log: [...(p.pin_activity_log || []), activity],
              }
            : p
        )
      );
    } catch (err) {
      console.error("Foto konnte nicht gelöscht werden:", err);
      setGlobalError("Das Foto konnte nicht gelöscht werden.");
    }
  };

  // Foto-Markup (siehe PhotoMarkupEditor): das bearbeitete Bild wird sofort und
  // unabhängig vom Online-Status lokal im Pin-State hinterlegt ("im State des Pins
  // gesichert", siehe Anforderung) — die dauerhafte Speicherung läuft je nach
  // Herkunft/Verbindung über einen von drei Pfaden:
  //  1. Foto wurde offline aufgenommen und wartet SELBST noch auf Synchronisation
  //     (isOfflineId) → die bereits wartende "upload_photo"-Warteschlangen-Position
  //     wird direkt gepatcht (siehe localPhotoId oben), damit gleich die bearbeitete
  //     Fassung hochgeladen wird.
  //  2. Foto ist bereits synchronisiert, aber gerade keine Verbindung → eigener
  //     "update_photo"-Warteschlangen-Eintrag (siehe flushSyncQueue).
  //  3. Online & synchronisiert → direkter Upload via updatePinPhotoUrl.
  const handleSavePhotoMarkup = async (pinId, photo, editedDataUrl) => {
    const previousUrl = photo.photo_url;
    setPins((prev) =>
      prev.map((p) =>
        p.id === pinId
          ? { ...p, pin_photos: (p.pin_photos || []).map((ph) => (ph.id === photo.id ? { ...ph, photo_url: editedDataUrl } : ph)) }
          : p
      )
    );

    if (isOfflineId(photo.id)) {
      const queue = readSyncQueue();
      const idx = queue.findIndex((q) => q.type === "upload_photo" && q.localPhotoId === photo.id);
      if (idx !== -1) {
        queue[idx] = { ...queue[idx], dataUrl: editedDataUrl };
        writeSyncQueue(queue);
        setSyncQueue(queue);
      }
      return;
    }

    if (!online) {
      setSyncQueue(
        enqueueSyncItem({ type: "update_photo", pinId, photoId: photo.id, oldPhotoUrl: previousUrl, dataUrl: editedDataUrl, actor: currentActor })
      );
      appendPinActivity(pinId, {
        id: generateOfflineId(),
        pin_id: pinId,
        action: "photo_edited",
        detail: "Foto bearbeitet (offline erfasst, wird synchronisiert)",
        actor_email: currentActor?.email || null,
        actor_name: currentActor?.name || null,
        created_at: new Date().toISOString(),
      });
      return;
    }

    try {
      const updated = await updatePinPhotoUrl({ ...photo, photo_url: previousUrl }, editedDataUrl, currentActor);
      setPins((prev) =>
        prev.map((p) => (p.id === pinId ? { ...p, pin_photos: (p.pin_photos || []).map((ph) => (ph.id === photo.id ? updated : ph)) } : p))
      );
      appendPinActivity(pinId, await logPinActivity(pinId, "photo_edited", "Foto bearbeitet", currentActor));
    } catch (err) {
      console.error("Bearbeitetes Foto konnte nicht dauerhaft gespeichert werden:", err);
      setGlobalError("Das bearbeitete Foto konnte nicht dauerhaft gespeichert werden — die Änderung ist vorerst nur lokal sichtbar.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 font-sans text-slate-900">
      <SplashScreen />
      {/* Verpflichtende App-Zugriffssperre (siehe isAuthenticated in App()): solange sie
          aktiv ist, wird ausschließlich LoginScreen gerendert — weder Kopfzeile/
          Navigation noch Projektlisten, Etagen, Grundrisse oder Pins existieren dann im
          Rendering-Baum, entsprechende Datenabrufe (siehe DATA-FETCHING-Effekte weiter
          oben) laufen ebenfalls erst nach erfolgreicher Anmeldung an. */}
      {!isAuthenticated ? (
        <LoginScreen onLogin={handleGateLogin} onRegister={handleSignUp} />
      ) : (
        <>
      {/* Top bar — klares Weiß mit feiner Umrandung statt einer dunklen Fläche: passt
          sich damit nahtlos in das übrige, helle Anwendungsdesign ein. Die Wortmarke
          steht jetzt in Markenrot (tone="brand") statt in Weiß, da der Untergrund
          selbst weiß ist. Navigations-Highlights (aktueller Breadcrumb-Schritt,
          Primär-Button "Anmelden") tragen bewusst weiterhin das kräftige Markenrot —
          alle sekundären Kopfzeilen-Aktionen (Dropbox, Benutzer, Abmelden) sind
          dezent-neutral in Hellgrau gehalten, damit das Rot als Akzent erkennbar
          bleibt statt in der Fläche unterzugehen. */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white text-slate-700 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 text-xs font-medium sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-2">
              <BrandLogotype tone="brand" size="sm" />
              <span className="hidden text-slate-400 sm:inline">· BauDoc</span>
            </span>
            <span className="text-slate-300">/</span>
            <button
              onClick={() => setScreen("projects")}
              className={`transition hover:text-[#FF2A00] ${screen === "projects" ? "font-semibold text-[#FF2A00]" : "text-slate-500"}`}
            >
              Projekte
            </button>
            {project && (
              <>
                <span className="text-slate-300">/</span>
                <button
                  onClick={() => setScreen("floors")}
                  className={`transition hover:text-[#FF2A00] ${screen === "floors" ? "font-semibold text-[#FF2A00]" : "text-slate-500"}`}
                >
                  {project.name}
                </button>
              </>
            )}
            {floor && (screen === "sketches" || screen === "plan") && (
              <>
                <span className="text-slate-300">/</span>
                <button
                  onClick={() => setScreen("sketches")}
                  className={`transition hover:text-[#FF2A00] ${screen === "sketches" ? "font-semibold text-[#FF2A00]" : "text-slate-500"}`}
                >
                  {floor.name}
                </button>
              </>
            )}
            {plan && screen === "plan" && (
              <>
                <span className="text-slate-300">/</span>
                <span className="font-semibold text-[#FF2A00]">{plan.name}</span>
              </>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* Gewerkeverwaltung ist bewusst kein eigener globaler Menüpunkt mehr — der
                Zugriff (Anlegen/Umbenennen/Deaktivieren/Sortieren) erfolgt ausschließlich
                kontextbezogen aus dem Projektformular heraus, siehe onManageTrades bei
                ProjectFormModal weiter unten. */}
            <OfflineStatusIndicator online={online} pendingCount={syncQueue.length} syncing={syncing} />
            <button
              onClick={openDropboxModal}
              title="Dropbox-Verbindung (Foto-Archivierung)"
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-600 transition hover:bg-slate-200"
            >
              {dropboxConnected ? <Cloud size={13} className="text-emerald-600" /> : <CloudOff size={13} />}{" "}
              <span className="hidden sm:inline">Dropbox</span>
            </button>
            <button
              onClick={openUsersAdmin}
              title="Benutzerverwaltung"
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-600 transition hover:bg-slate-200"
            >
              <UserCog size={13} /> <span className="hidden sm:inline">Benutzer</span>
            </button>
            {authLoading ? (
              <span className="text-slate-400">Lädt…</span>
            ) : session ? (
              <>
                <span className="hidden items-center gap-1.5 text-slate-500 sm:flex">
                  <User size={13} /> Angemeldet als {session.user?.email}
                </span>
                <button
                  onClick={handleAppLogout}
                  className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-600 transition hover:bg-slate-200"
                >
                  <LogOut size={13} /> Abmelden
                </button>
              </>
            ) : (
              // An dieser Stelle ist isAuthenticated zwingend true (siehe App-
              // Zugriffssperre weiter oben) — dieser Zweig ist also ausschließlich die
              // Offline-Anmeldung (verifyOfflineCredential): keine echte, RLS-fähige
              // Supabase-Session vorhanden. Schreibaktionen bleiben in diesem Zustand
              // weiterhin über requireAuth() an eine echte Online-Anmeldung gebunden
              // (dort öffnet sich bei Bedarf ganz normal das AuthModal) — hier geht es
              // ausschließlich um das Beenden der App-Zugriffssperre selbst.
              <>
                <span
                  className="hidden items-center gap-1.5 text-amber-600 sm:flex"
                  title="Offline angemeldet — für Bearbeitungen ist zusätzlich eine Online-Anmeldung erforderlich, sobald wieder Netz verfügbar ist."
                >
                  {/* authSource dient hier als Plausibilitätsprüfung: session ist null, das
                      kann nach der App-Zugriffssperre weiter oben nur die Offline-Anmeldung
                      sein — bleibt authSource dennoch unerwartet leer, wird trotzdem kein
                      irreführendes "Offline" behauptet. */}
                  <WifiOff size={13} /> {authSource === "offline" ? "Offline angemeldet" : "Angemeldet"}
                </span>
                <button
                  onClick={handleAppLogout}
                  className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-600 transition hover:bg-slate-200"
                >
                  <LogOut size={13} /> Abmelden
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <ErrorBanner message={globalError} onClose={() => setGlobalError(null)} />

      {screen === "projects" && (
        <ProjectOverview
          projects={projects}
          loading={loadingProjects}
          onOpenProject={openProject}
          onToggleFavorite={handleToggleProjectFavorite}
          query={query}
          setQuery={setQuery}
          onCreateProject={openCreateProject}
          onEditProject={openEditProject}
          onDeleteProject={handleDeleteProjectClick}
          onArchiveProject={handleToggleProjectArchive}
        />
      )}

      {screen === "floors" && project && (
        <FloorOverview
          project={project}
          floors={floors}
          trades={trades}
          loading={loadingFloors}
          onBack={() => setScreen("projects")}
          onOpenFloor={openFloor}
          onOpenAddFloor={openFloorModal}
          onEditProject={openEditProject}
          onDeleteProject={handleDeleteProjectClick}
          onArchiveProject={handleToggleProjectArchive}
          onEditFloor={openEditFloorModal}
          onDeleteFloor={handleDeleteFloorClick}
          onExportPdf={openPdfExportModal}
          readOnly={!session}
        />
      )}

      {screen === "sketches" && floor && (
        <SketchOverview
          floor={floor}
          plans={floorPlans}
          loading={loadingFloorPlans}
          onBack={() => setScreen("floors")}
          onOpenPlan={openFloorPlanSketch}
          onOpenAddPlan={openFloorPlanModal}
          onEditPlan={openEditFloorPlanModal}
          onDeletePlan={handleDeleteFloorPlanClick}
          readOnly={!session}
        />
      )}

      {screen === "plan" && floor && plan && (
        <FloorPlanView
          floor={floor}
          plan={plan}
          pins={pins}
          planNotes={planNotes}
          loading={loadingPins}
          creatingPin={creatingPin}
          creatingNote={creatingNote}
          session={session}
          trades={projectTrades}
          project={project}
          generatedBy={currentActor?.name}
          onBack={() => setScreen("sketches")}
          onPlanClick={handlePlanClick}
          onPinClick={handlePinClick}
          onPinMove={handlePinMove}
          onAddNote={handleAddPlanNote}
          onNoteClick={handleNoteClick}
          onNoteMove={handleMoveNote}
        />
      )}

      {activePin && (
        <PinModal
          pin={activePin}
          pins={pins}
          pinNumber={activePinNumber}
          isNew={modalState.isNew}
          readOnly={!session}
          trades={pinModalTrades}
          project={project}
          floor={floor}
          plan={plan}
          generatedBy={currentActor?.name}
          onRequestLogin={() => setAuthModalOpen(true)}
          onClose={() => setModalState(null)}
          onSaveFields={(fields) => handleSaveFields(activePin.id, fields)}
          onDelete={() => handleDeletePin(activePin.id)}
          onAddTodo={(text) => handleAddTodo(activePin.id, text)}
          onToggleTodo={(todo) => handleToggleTodo(activePin.id, todo)}
          onRemoveTodo={(todoId) => handleRemoveTodo(activePin.id, todoId)}
          onUploadPhotos={(files) => handleUploadPhotos(activePin.id, files)}
          onRemovePhoto={(photo) => handleRemovePhoto(activePin.id, photo)}
          onSaveMarkup={(photo, dataUrl) => handleSavePhotoMarkup(activePin.id, photo, dataUrl)}
        />
      )}

      {activeNote && (
        <PlanNoteModal
          note={activeNote}
          isNew={noteModalState.isNew}
          readOnly={!session}
          onRequestLogin={() => setAuthModalOpen(true)}
          onClose={() => setNoteModalState(null)}
          onSave={(fields) => handleSaveNoteFields(activeNote.id, fields)}
          onDelete={() => handleDeleteNote(activeNote.id)}
        />
      )}

      {floorModalOpen && <NewFloorModal onClose={() => setFloorModalOpen(false)} onSave={handleAddFloor} />}

      {editFloorModalState && (
        <EditFloorModal
          floor={editFloorModalState.floor}
          onClose={() => setEditFloorModalState(null)}
          onSave={handleUpdateFloor}
        />
      )}

      {deleteFloorConfirm && (
        <ConfirmDialog
          title="Etage wirklich löschen?"
          message={`Möchtest du die Etage „${deleteFloorConfirm.target.name}" samt allen Grundrisskizzen und enthaltenen Pins wirklich löschen?`}
          onConfirm={confirmDeleteFloor}
          onCancel={() => setDeleteFloorConfirm(null)}
          busy={deleteFloorBusy}
        />
      )}

      {floorPlanModalOpen && (
        <NewFloorPlanModal floor={floor} onClose={() => setFloorPlanModalOpen(false)} onSave={handleAddFloorPlanSketch} />
      )}

      {editFloorPlanModalState && (
        <EditFloorPlanModal
          plan={editFloorPlanModalState.plan}
          onClose={() => setEditFloorPlanModalState(null)}
          onSave={handleUpdateFloorPlanSketch}
        />
      )}

      {deleteFloorPlanConfirm && (
        <ConfirmDialog
          title="Grundrissskizze wirklich löschen?"
          message={`Möchtest du die Grundrissskizze „${deleteFloorPlanConfirm.target.name}" samt allen enthaltenen Pins wirklich löschen?`}
          onConfirm={confirmDeleteFloorPlan}
          onCancel={() => setDeleteFloorPlanConfirm(null)}
          busy={deleteFloorPlanBusy}
        />
      )}

      {projectModalState && (
        <ProjectFormModal
          mode={projectModalState.mode}
          project={projectModalState.project}
          trades={trades}
          onManageTrades={openTradesAdmin}
          onClose={() => setProjectModalState(null)}
          onSave={handleSaveProject}
        />
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="Projekt wirklich löschen?"
          message={`„${deleteConfirm.target.name}" wird inklusive aller Etagen, Pins, Aufgaben und Fotos unwiderruflich gelöscht.`}
          onConfirm={confirmDeleteProject}
          onCancel={() => setDeleteConfirm(null)}
          busy={deleteBusy}
        />
      )}

      {tradesAdminOpen && (
        <TradesAdminModal
          trades={trades}
          onClose={() => setTradesAdminOpen(false)}
          onCreate={handleCreateTrade}
          onRename={handleRenameTrade}
          onToggleActive={handleToggleTradeActive}
          onReorder={handleReorderTrades}
        />
      )}

      {usersAdminOpen && (
        <UsersAdminModal
          users={users}
          projects={projects}
          onClose={() => setUsersAdminOpen(false)}
          onCreateUser={handleCreateUser}
          onEditUser={handleEditUser}
          onToggleUserActive={handleToggleUserActive}
        />
      )}

      {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} onSignIn={handleSignIn} onSignUp={handleSignUp} />}

      {dropboxModalOpen && (
        <DropboxConnectModal
          connected={dropboxConnected}
          kuerzel={currentAppUser?.kuerzel}
          onClose={() => setDropboxModalOpen(false)}
          onConnect={handleConnectDropbox}
          onDisconnect={handleDisconnectDropbox}
        />
      )}

      {pdfExportModalState && (
        <PdfExportModal
          project={pdfExportModalState.project}
          floors={floors}
          trades={projectTrades}
          users={users}
          generatedBy={currentActor?.name}
          onClose={() => setPdfExportModalState(null)}
        />
      )}
        </>
      )}
    </div>
  );
}

export default App;
