import React, { useState, useRef, useEffect, forwardRef } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Search,
  ChevronLeft,
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
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none ring-blue-500/30 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 disabled:bg-slate-50";

// Kopf-/Fußzeile und Scroll-Body der einheitlichen Modal-Karte (Header mit Titel +
// Schließen-Button, scrollbarer Inhaltsbereich, Footer mit Abbrechen/Speichern).
const MODAL_HEADER_ROW = "flex items-center justify-between border-b border-slate-100 px-5 py-4";
const MODAL_FOOTER_ROW = "flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3.5";
const MODAL_BODY_SCROLL = "flex-1 space-y-4 overflow-y-auto px-5 py-4";
// Kleine, blau hervorgehobene Eyebrow-Zeile über dem eigentlichen Modal-Titel
// (z.B. "Neues Projekt" über "Projekt anlegen").
const MODAL_EYEBROW = "mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-blue-600";
// Schließen-Button (X) oben rechts im Modal-Header — zwei Varianten, je nachdem ob
// die jeweilige Stelle während des Speicherns/Löschens deaktiviert werden kann.
const MODAL_CLOSE_BTN = "rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700";
const MODAL_CLOSE_BTN_DISABLED = `${MODAL_CLOSE_BTN} disabled:cursor-not-allowed disabled:opacity-40`;

// Sekundärer ("Abbrechen") und primärer (blauer Submit-)Button in Formular-Footern.
const BTN_SECONDARY = "rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40";
const BTN_PRIMARY =
  "inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60";

// ----------------------------------------------------------------------------------
// STATUS / PRIORITÄT (Mängel-Pins)
// ----------------------------------------------------------------------------------

const STATUS = {
  offen: { label: "Offen", dot: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50", ring: "ring-rose-200" },
  bearbeitung: { label: "In Bearbeitung", dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", ring: "ring-amber-200" },
  erledigt: { label: "Erledigt", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", ring: "ring-emerald-200" },
};

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
  todo_added: { label: "Aufgabe hinzugefügt", icon: ListChecks },
  todo_completed: { label: "Aufgabe erledigt", icon: CheckSquare },
  todo_reopened: { label: "Aufgabe wieder geöffnet", icon: Square },
  todo_removed: { label: "Aufgabe entfernt", icon: Trash2 },
};

// ----------------------------------------------------------------------------------
// PROJEKT-STATUS & HOAI-LEISTUNGSPHASEN (LPH 1–9)
// ----------------------------------------------------------------------------------

const PROJECT_STATUS_OPTIONS = ["Geplant", "In Bearbeitung", "Abgeschlossen"];

const PROJECT_STATUS_META = {
  Geplant: { text: "text-slate-600", bg: "bg-slate-100", dot: "bg-slate-400" },
  "In Bearbeitung": { text: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-500" },
  Abgeschlossen: { text: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-500" },
};

const LPH_PHASES = [
  { key: "1", label: "LPH 1 · Grundlagenermittlung" },
  { key: "2", label: "LPH 2 · Vorplanung" },
  { key: "3", label: "LPH 3 · Entwurfsplanung" },
  { key: "4", label: "LPH 4 · Genehmigungsplanung" },
  { key: "5", label: "LPH 5 · Ausführungsplanung" },
  { key: "6", label: "LPH 6 · Vorbereitung der Vergabe" },
  { key: "7", label: "LPH 7 · Mitwirkung bei der Vergabe" },
  { key: "8", label: "LPH 8 · Objektüberwachung" },
  { key: "9", label: "LPH 9 · Objektbetreuung" },
];

const LPH_STATUS_META = {
  ausstehend: { label: "Ausstehend", dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-100" },
  bearbeitung: { label: "In Bearbeitung", dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
  abgeschlossen: { label: "Abgeschlossen", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  nicht_relevant: { label: "Nicht relevant", dot: "bg-slate-300", text: "text-slate-400", bg: "bg-slate-50" },
};

function defaultLphStatus() {
  return LPH_PHASES.reduce((acc, phase) => {
    acc[phase.key] = "ausstehend";
    return acc;
  }, {});
}

// ----------------------------------------------------------------------------------
// LPH-AUFTRAGSAUSWAHL (Array der beauftragten/relevanten Phasen)
// ----------------------------------------------------------------------------------
// Eigenständiger Baustein neben dem 4-Status-Fortschritt oben (LPH_PHASES /
// LphStatusGrid / LphProgressRow bilden "ausstehend/in Bearbeitung/abgeschlossen/
// nicht relevant" ab). Hier geht es um eine reine Ja/Nein-Auswahl, wer/was pro
// Objekt beauftragt bzw. relevant ist, daher bewusst eigene Namen, um mit dem
// bestehenden LPH-Fortschritt nicht zu kollidieren.
// Datenformat: Array der ausgewählten Phasen-Keys, z.B. ["1", "3", "5"].
// Leere Auswahl ist ein leeres Array [].

const LPH_AUFTRAGS_PHASEN = [
  { key: "1", label: "LPH 1", title: "Grundlagenermittlung" },
  { key: "2", label: "LPH 2", title: "Vorplanung" },
  { key: "3", label: "LPH 3", title: "Entwurfsplanung" },
  { key: "4", label: "LPH 4", title: "Genehmigungsplanung" },
  { key: "5", label: "LPH 5", title: "Ausführungsplanung" },
  { key: "6", label: "LPH 6", title: "Vorbereitung der Vergabe" },
  { key: "7", label: "LPH 7", title: "Mitwirkung bei der Vergabe" },
  { key: "8", label: "LPH 8", title: "Objektüberwachung" },
  { key: "9", label: "LPH 9", title: "Objektbetreuung" },
];

// Normalisiert eine LPH-Auswahl unabhängig von ihrer Herkunft auf ein Array aus
// String-Keys. Deckt drei Fälle ab: das neue Array-Format ["1","3"], das ältere
// Objekt-Format { "1": true, "2": false, ... } aus einer früheren Version dieser
// Funktion (falls in Supabase noch Altbestände in diesem Format liegen), sowie
// null/undefined (z.B. bei einem Projekt ohne gesetzte Auswahl). Vergleicht Keys
// stets als String, damit es keinen Unterschied macht, ob Zahlen oder Strings
// hereinkommen.
function normalizeLphSelection(value) {
  if (Array.isArray(value)) return value.map((key) => String(key));
  if (value && typeof value === "object") {
    return Object.entries(value)
      .filter(([, active]) => !!active)
      .map(([key]) => String(key));
  }
  return [];
}

// ----------------------------------------------------------------------------------
// PROJEKTSPEZIFISCHE GEWERKE-AUSWAHL (project.selected_trades)
// ----------------------------------------------------------------------------------
// Bewusst analog zu lph_beauftragt: ein Array von Gewerke-IDs, die für ein konkretes
// Projekt relevant sind. Anders als bei lph_beauftragt wird hier aber zwischen "noch
// nie gesetzt" (null/undefined — Bestandsprojekt von vor diesem Feature) und "bewusst
// leer" ([] — es wurde explizit kein Gewerk ausgewählt) unterschieden: nur im ersten
// Fall gilt in der App weiterhin die alte, unbeschränkte Auswahl aller aktiven
// Gewerke, damit die Migration niemanden aussperrt. Sobald einmal über das
// Projektformular gespeichert wurde, ist die Auswahl immer ein (ggf. leeres) Array.
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

const selectAllLphAuftrag = () => LPH_AUFTRAGS_PHASEN.map((phase) => phase.key);
const selectLphAuftrag1to8 = () => LPH_AUFTRAGS_PHASEN.filter((phase) => phase.key !== "9").map((phase) => phase.key);
const resetLphAuftragsSelection = () => [];

// Kompakter Fortschrittsbalken + Text, z.B. "6 / 9 Phasen beauftragt".
function LphAuftragsProgressRow({ lphSelection }) {
  const selected = normalizeLphSelection(lphSelection);
  const activeCount = selected.length;
  const percent = Math.round((activeCount / LPH_AUFTRAGS_PHASEN.length) * 100);

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${percent}%` }} />
      </div>
      <span className="shrink-0 text-xs font-semibold text-slate-600">
        {activeCount} / {LPH_AUFTRAGS_PHASEN.length} Phasen beauftragt
      </span>
    </div>
  );
}

// Kompakte Chip-Buttons nebeneinander in einem Raster (statt volle Breite/eine Zeile
// pro Phase), damit die Auswahl im Formular möglichst wenig vertikalen Platz braucht.
// Beschriftung bewusst auf "LPH 1" … "LPH 9" gekürzt — der volle Phasenname bleibt als
// Tooltip (title-Attribut) verfügbar. Der aktive Zustand wird über .includes() auf der
// normalisierten String-Liste geprüft, damit Zahl- oder String-Keys aus lphSelection
// keinen Unterschied machen.
function LphAuftragsGrid({ lphSelection, onToggle, disabled = false }) {
  const selected = normalizeLphSelection(lphSelection);

  return (
    <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-9">
      {LPH_AUFTRAGS_PHASEN.map((phase) => {
        const active = selected.includes(String(phase.key));
        return (
          <button
            key={phase.key}
            type="button"
            onClick={() => onToggle(phase.key)}
            disabled={disabled}
            aria-pressed={active}
            title={`${phase.label} · ${phase.title}`}
            className={`flex items-center justify-center gap-1 rounded-lg border px-1.5 py-2 text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              active
                ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:bg-blue-50/50"
            }`}
          >
            {active && <Check size={11} strokeWidth={3} />}
            {phase.label}
          </button>
        );
      })}
    </div>
  );
}

// Schnell-Auswahl: "Alle auswählen (1–9)", "LPH 1–8", "Zurücksetzen".
function LphAuftragsQuickActions({ onApply, disabled = false }) {
  const baseClass =
    "rounded-md border px-2.5 py-1 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onApply(selectAllLphAuftrag())}
        disabled={disabled}
        className={`${baseClass} border-slate-200 bg-white text-slate-600 hover:bg-slate-50`}
      >
        Alle auswählen (1–9)
      </button>
      <button
        type="button"
        onClick={() => onApply(selectLphAuftrag1to8())}
        disabled={disabled}
        className={`${baseClass} border-slate-200 bg-white text-slate-600 hover:bg-slate-50`}
      >
        LPH 1–8
      </button>
      <button
        type="button"
        onClick={() => onApply(resetLphAuftragsSelection())}
        disabled={disabled}
        className={`${baseClass} border-rose-200 bg-white text-rose-600 hover:bg-rose-50`}
      >
        Zurücksetzen
      </button>
    </div>
  );
}

// ----------------------------------------------------------------------------------
// PROJEKTSPEZIFISCHE GEWERKE-CHIPS (analog zur LPH-Auftragsauswahl)
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
                ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:bg-blue-50/50"
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
                ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:bg-blue-50/50"
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
    badgeClass: "bg-blue-50 text-blue-700 ring-blue-200",
  },
  Bauleitung: {
    label: "Bauleitung",
    description: "Bearbeitet Etagen, Pins und LPH-Status in zugeordneten Projekten.",
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
  if (floor.file_type === "cad" || floor.file_type === "pdf" || floor.file_type === "image") return floor.file_type;
  const name = deriveFileNameFromUrl(floor.image_url).toLowerCase();
  if (name.endsWith(".dwg") || name.endsWith(".dxf")) return "cad";
  if (name.endsWith(".pdf")) return "pdf";
  return "image";
}

const FLOOR_UPLOAD_ACCEPT = ".png,.jpg,.jpeg,.webp,.pdf,.dwg,.dxf,image/png,image/jpeg,image/webp,application/pdf";
const FLOOR_UPLOAD_HINT = "Grundriss hochladen (PNG, JPG, PDF, DWG, DXF)";

// ----------------------------------------------------------------------------------
// SUPABASE DATA LAYER
// Alle Netzwerkzugriffe sind hier gebündelt: reine async Funktionen, die entweder
// Daten zurückgeben oder werfen (try/catch passiert jeweils beim Aufrufer in App()).
// Lese-Policies sind öffentlich (auch für Gäste), Schreib-Policies (insert/update/
// delete) sind serverseitig per RLS auf die Rolle "authenticated" beschränkt — siehe
// supabase_schema_v2_auth_and_projects.sql.
// ----------------------------------------------------------------------------------

// Projekte inkl. einer "leichten" Etagen-/Pin-Zusammenfassung (nur id + status) laden.
// Das reicht aus, um in der Projektübersicht Vorschaubild, Etagenzahl und offene
// Pins darzustellen, ohne pro Karte einen eigenen Request abzusetzen.
async function fetchProjectsWithSummary() {
  const { data, error } = await supabase
    .from("projects")
    .select("*, floors(id, name, image_url, file_type, pins(id, status))")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// lph_beauftragt wird hier bewusst noch einmal explizit und normalisiert gesetzt
// (nicht nur über den Spread von fields durchgereicht), damit Insert und Update
// unabhängig vom Aufrufer immer ein valides, JSON-kompatibles Array in Supabase
// ablegen und nie undefined oder ein falsch typisiertes Objekt landet.
async function createProject(fields) {
  const payload = {
    ...fields,
    lph_beauftragt: normalizeLphSelection(fields.lph_beauftragt),
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
  // lph_beauftragt/selected_trades werden nur normalisiert, wenn sie tatsächlich Teil
  // des Updates sind — sonst würde z.B. ein reines Status-Update ({ lph_status: {...} })
  // die bestehende Auftrags- bzw. Gewerke-Auswahl versehentlich auf ein leeres Array
  // zurücksetzen.
  const payload = { ...fields };
  if (Object.prototype.hasOwnProperty.call(fields, "lph_beauftragt")) {
    payload.lph_beauftragt = normalizeLphSelection(fields.lph_beauftragt);
  }
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
// Etagenübersicht) laden.
async function fetchFloorsWithPinSummary(projectId) {
  const { data, error } = await supabase
    .from("floors")
    .select("*, pins(id, status)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// Pins einer Etage inkl. aller zugehörigen To-dos und Fotos in einem einzigen
// Request laden (verschachtelter Supabase-Select über die Fremdschlüssel).
async function fetchPinsWithDetails(floorId) {
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

async function createFloor(projectId, name, file) {
  const { publicUrl, fileType } = await uploadFloorPlan(projectId, file);
  const { data, error } = await supabase
    .from("floors")
    .insert({ project_id: projectId, name, image_url: publicUrl, file_type: fileType })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Aktualisiert Name und/oder Grundriss-Datei einer bestehenden Etage. Die Datei ist
// optional: wird keine neue Datei übergeben, bleibt image_url/file_type unverändert und
// nur der Name wird aktualisiert. Die alte Grundriss-Datei im Storage bleibt beim
// Austausch technisch bedingt liegen (analog zu deleteProject() oben) — das Aufräumen
// verwaister Storage-Dateien ist nicht Teil dieses Umbaus.
async function updateFloor(floorId, projectId, name, file) {
  const fields = { name };
  if (file) {
    const { publicUrl, fileType } = await uploadFloorPlan(projectId, file);
    fields.image_url = publicUrl;
    fields.file_type = fileType;
  }
  const { data, error } = await supabase.from("floors").update(fields).eq("id", floorId).select().single();
  if (error) throw error;
  return data;
}

// Löscht eine Etage. pins/pin_todos/pin_photos hängen per ON DELETE CASCADE an floors,
// werden also serverseitig automatisch mitgelöscht. Die zugehörigen Storage-Dateien
// (Grundriss der Etage, Fotos der enthaltenen Pins) bleiben dabei technisch bedingt
// liegen — siehe deleteProject() oben.
async function deleteFloor(floor) {
  const { error } = await supabase.from("floors").delete().eq("id", floor.id);
  if (error) throw error;
}

// actor ({ email, name }) stammt aus der angemeldeten Session in App() (siehe
// currentActor) und wird ausschließlich zur automatischen Zeit-/Benutzererfassung
// verwendet (created_by/updated_by-Spalten sowie die Einträge in pin_activity_log,
// siehe logPinActivity weiter unten) — nie zur Autorisierung, die läuft weiterhin
// über RLS auf Supabase-Ebene.
async function createPin(floorId, x, y, actor) {
  const { data, error } = await supabase
    .from("pins")
    .insert({
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

// ----------------------------------------------------------------------------------
// OFFLINE-FIRST-SPEICHERUNG & SYNCHRONISATIONS-WARTESCHLANGE (Abschnitt/Punkt 15)
// ----------------------------------------------------------------------------------
// Zweck: einmal geladene Projekte/Etagen/Pins bleiben auch ohne Internetverbindung
// nutzbar (Anzeigen, Zoomen/Verschieben, neue Pins setzen, Text/Beschreibung/Gewerk
// erfassen, Fotos aufnehmen, Status ändern). Alle drei Kern-Datensätze werden nach
// jedem erfolgreichen Laden UND nach jeder lokalen Änderung als einfaches JSON in
// localStorage gespiegelt (baudoc_offline_cache_v1). Offline getätigte Schreib-
// aktionen landen zusätzlich als Eintrag in einer geordneten Warteschlange
// (baudoc_offline_sync_queue_v1) und werden automatisch abgearbeitet, sobald wieder
// eine Verbindung besteht (siehe flushSyncQueue in App()).
//
// Bewusste Begrenzung des Umfangs: Löschen von Pins/Aufgaben/Fotos sowie Aufgaben-
// Verwaltung bleiben an eine bestehende Verbindung gebunden (siehe requireOnline-
// Guards in den jeweiligen Handlern in App()) — das sind seltenere, weniger
// zeitkritische Baustellen-Aktionen, und ihr Wegfall im Offline-Fall hält die
// Synchronisationslogik überschaubar und nachvollziehbar.
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
function cachePinsOffline(floorId, pins) {
  const cache = readJsonStorage(OFFLINE_CACHE_KEY, {});
  writeJsonStorage(OFFLINE_CACHE_KEY, { ...cache, pinsByFloor: { ...(cache.pinsByFloor || {}), [floorId]: pins } });
}
function readCachedPins(floorId) {
  return readJsonStorage(OFFLINE_CACHE_KEY, {}).pinsByFloor?.[floorId] || null;
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

// Rendert Seite 1 eines PDF-Grundrisses über pdf.js in ein Offscreen-Canvas und
// liefert dasselbe Format wie loadImageAsDataUrl — wiederverwendet dieselbe
// pdf.js-Ladefunktion (loadPdfJs) wie die interaktive PdfPlanCanvas beim Zoomen.
async function renderPdfPlanToDataUrl(url, scale = 2.5) {
  const pdfjsLib = await loadPdfJs();
  const pdf = await pdfjsLib.getDocument(url).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
  return { dataUrl: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height };
}

// Lädt für eine Liste von Etagen jeweils alle Pins inkl. Fotos/Aufgaben/Verlauf
// (siehe fetchPinsWithDetails) und hängt eine Referenz auf die jeweilige Etage an
// jeden Pin — vereinfacht Filtern/Sortieren über alle Etagen eines Projekts hinweg.
async function fetchAllPinsForProject(floors) {
  const perFloor = await Promise.all(
    floors.map(async (floor) => (await fetchPinsWithDetails(floor.id)).map((pin) => ({ ...pin, floor })))
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
const PDF_STATUS_RGB = { offen: [244, 63, 94], bearbeitung: [245, 158, 11], erledigt: [16, 185, 129] };

function sanitizeFileNamePart(text) {
  return (text || "").replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+|_+$/g, "") || "Export";
}

// Baut den vollständigen, drucktauglichen Bericht (Abschnitt 5.2: Deckblatt,
// Planübersicht mit nummerierten Pins, Detaildokumentation je Pin inkl. Fotos und
// Bearbeitungshistorie) und löst am Ende automatisch den Browser-Download aus.
// Fehler beim Laden EINES einzelnen Bilds (Grundriss oder Foto) brechen den
// Gesamt-Export bewusst nicht ab — der Bericht ist auch mit einzelnen fehlenden
// Bildern noch nützlich, ein kompletter Abbruch wäre ärgerlicher als eine Lücke.
async function generateProjectReportPdf({ project, floors, pins, filters, trades, generatedBy }) {
  const jsPDF = await loadJsPdf();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
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

  // ---- 2. Planübersicht je Etage mit nummerierten Pin-Markierungen ------------------
  const floorsWithPins = floors.filter((f) => numberedPins.some((p) => p.floor.id === f.id));
  for (const f of floorsWithPins) {
    doc.addPage();
    doc.setFontSize(14);
    bold();
    doc.text(f.name, margin, 20);
    normal();
    doc.setFontSize(10);

    const floorPins = numberedPins.filter((p) => p.floor.id === f.id);
    const floorKind = resolveFloorKind(f);
    let imgRect = null;
    try {
      let imgData = null;
      if (floorKind === "pdf") imgData = await renderPdfPlanToDataUrl(f.image_url);
      else if (floorKind === "image") imgData = await loadImageAsDataUrl(f.image_url);
      if (imgData) {
        const availableW = contentWidth;
        const availableH = pageHeight - 35 - margin;
        const ratio = Math.min(availableW / imgData.width, availableH / imgData.height);
        const w = imgData.width * ratio;
        const h = imgData.height * ratio;
        const x = margin + (availableW - w) / 2;
        const imgY = 28;
        doc.addImage(imgData.dataUrl, "PNG", x, imgY, w, h);
        imgRect = { x, y: imgY, w, h };
      }
    } catch (err) {
      console.error(`Grundriss "${f.name}" konnte nicht in den PDF-Export geladen werden:`, err);
    }

    if (imgRect) {
      floorPins.forEach((pin) => {
        const px = imgRect.x + (pin.x / 100) * imgRect.w;
        const py = imgRect.y + (pin.y / 100) * imgRect.h;
        doc.setFillColor(...(PDF_STATUS_RGB[pin.status] || PDF_STATUS_RGB.offen));
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
      floorPins.forEach((pin) => {
        doc.text(`${pin.exportNumber}. ${pin.title}`, margin, listY);
        listY += 6;
      });
    }
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
    field("Status", STATUS[pin.status]?.label || pin.status);
    field("Priorität", PRIORITY[pin.priority]?.label || pin.priority);
    field("Gewerk", tradesById.get(pin.trade_id)?.name);
    field("Verantwortlicher", pin.assigned_to);
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
          const imgData = await loadImageAsDataUrl(photo.photo_url);
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
    <span className={`inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow ${className}`}>
      <Ruler size={11} /> {ext}
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
        trade.active ? "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200" : "bg-slate-100 text-slate-400 ring-1 ring-inset ring-slate-200"
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

// Reihenfolge, in der ein Klick auf eine beauftragte LPH-Phase deren Status weiterschaltet.
// "nicht_relevant" bleibt bewusst außen vor: Diese Phasen sind hier per Definition bereits
// beauftragt (lph_beauftragt), "nicht relevant" ist daher kein sinnvoller Klick-Zielzustand.
const LPH_STATUS_CYCLE = ["ausstehend", "bearbeitung", "abgeschlossen"];

function nextLphStatus(current) {
  const idx = LPH_STATUS_CYCLE.indexOf(current);
  return LPH_STATUS_CYCLE[(idx + 1) % LPH_STATUS_CYCLE.length];
}

// Kompakte Punktreihe für Projektkarten: ein Quadrat je BEAUFTRAGTER LPH (aus
// lph_beauftragt), eingefärbt nach Status. Phasen, die nicht beauftragt sind, werden
// hier gar nicht erst gerendert — Anzahl der Punkte und der "x/N"-Text passen sich
// dynamisch an die tatsächliche Auftragsauswahl des Projekts an.
function LphProgressRow({ lphStatus, lphBeauftragt }) {
  const status = lphStatus || {};
  const beauftragtKeys = normalizeLphSelection(lphBeauftragt);
  const activePhases = LPH_PHASES.filter((phase) => beauftragtKeys.includes(phase.key));

  if (activePhases.length === 0) {
    return <span className="text-[11px] font-medium text-slate-400">Keine LPH beauftragt</span>;
  }

  const doneCount = activePhases.filter((p) => status[p.key] === "abgeschlossen").length;
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {activePhases.map((phase) => {
          const meta = LPH_STATUS_META[status[phase.key] || "ausstehend"];
          return <span key={phase.key} className={`h-2 w-2 rounded-sm ${meta.dot}`} title={`${phase.label}: ${meta.label}`} />;
        })}
      </div>
      <span className="text-[11px] font-medium text-slate-400">
        {doneCount}/{activePhases.length} LPH abgeschlossen
      </span>
    </div>
  );
}

// Ausführliche Badge-Übersicht für die Projekt-Detailansicht (FloorOverview-Header).
// Zeigt NUR beauftragte Phasen (lph_beauftragt) und erlaubt per Klick das Weiterschalten
// des Status (ausstehend → in Bearbeitung → abgeschlossen → ausstehend), sofern nicht
// disabled (z.B. im Gast-Modus ohne Login).
function LphStatusGrid({ lphStatus, lphBeauftragt, onChangeStatus, disabled = false }) {
  const status = lphStatus || {};
  const beauftragtKeys = normalizeLphSelection(lphBeauftragt);
  const activePhases = LPH_PHASES.filter((phase) => beauftragtKeys.includes(phase.key));

  if (activePhases.length === 0) {
    return <p className="text-xs text-slate-400">Für dieses Projekt sind noch keine Leistungsphasen beauftragt.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
      {activePhases.map((phase) => {
        const currentStatus = status[phase.key] || "ausstehend";
        const meta = LPH_STATUS_META[currentStatus];
        return (
          <button
            key={phase.key}
            type="button"
            disabled={disabled}
            onClick={() => onChangeStatus && onChangeStatus(phase.key, nextLphStatus(currentStatus))}
            title={
              disabled
                ? `${phase.label}: ${meta.label}`
                : `${phase.label}: ${meta.label} · Klicken zum Ändern`
            }
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-left text-[11px] font-semibold transition ${meta.bg} ${meta.text} ${
              disabled ? "cursor-default" : "cursor-pointer hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            }`}
          >
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`} />
            <span className="truncate">
              {phase.label.split(" · ")[0]} · {meta.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function countPins(floors) {
  const all = (floors || []).flatMap((f) => f.pins || []);
  return {
    total: all.length,
    open: all.filter((p) => p.status === "offen").length,
  };
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

// Kompakter Verbindungs-/Synchronisations-Status in der Kopfzeile (Abschnitt 15.3):
// grün = online und nichts ausstehend, bernstein = offline (Änderungen werden lokal
// gespeichert), blau = online, aber die Warteschlange wird gerade abgearbeitet bzw.
// wartet noch auf den nächsten Synchronisationslauf.
function OfflineStatusIndicator({ online, pendingCount, syncing }) {
  if (!online) {
    return (
      <span
        title={pendingCount > 0 ? `${pendingCount} Änderung(en) werden lokal gespeichert und automatisch synchronisiert, sobald wieder eine Verbindung besteht.` : "Keine Internetverbindung — Daten werden lokal gespeichert."}
        className="inline-flex items-center gap-1.5 rounded-md bg-amber-900/40 px-2.5 py-1.5 font-semibold text-amber-300"
      >
        <WifiOff size={13} />
        <span className="hidden sm:inline">Offline{pendingCount > 0 ? ` · ${pendingCount} ausstehend` : " · wird lokal gespeichert"}</span>
      </span>
    );
  }
  if (syncing || pendingCount > 0) {
    return (
      <span
        title="Offline erfasste Änderungen werden mit der Datenbank synchronisiert."
        className="inline-flex items-center gap-1.5 rounded-md bg-blue-900/40 px-2.5 py-1.5 font-semibold text-blue-300"
      >
        {syncing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
        <span className="hidden sm:inline">{syncing ? "Synchronisiert…" : `${pendingCount} ausstehend`}</span>
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
// PDF-GRUNDRISS — hochauflösendes, zoomabhängiges Rendering via pdf.js (statt <embed>)
// ----------------------------------------------------------------------------------
// <embed type="application/pdf"> überlässt das Rendering dem eingebauten PDF-Viewer
// des Browsers; skaliert man den umgebenden Container per CSS-Transform (unser Zoom),
// wird nur das bereits gerenderte Bild vergrößert — die Schrift wirkt dadurch schnell
// unscharf/verpixelt. Ein einmalig mit fester Auflösung gerendertes <canvas> hat
// dasselbe Problem, sobald über diese feste Auflösung hinaus gezoomt wird. pdf.js
// rendert die Seite deshalb bei jeder signifikanten Zoom-Änderung mit einer an den
// aktuellen Zoomfaktor (zoomScale, siehe FloorPlanView) gekoppelten, höheren
// Auflösung neu — siehe computeTargetScale()/renderAtScale() in PdfPlanCanvas unten.
// Die Position der Pins ist davon unberührt, sie bleiben weiterhin ausschließlich
// über Prozent-Koordinaten relativ zur äußeren "Bühne" verankert (siehe FloorPlanView),
// unabhängig davon, mit welcher internen Auflösung das Canvas gerade gefüllt ist.
//
// pdf.js wird bewusst NICHT als npm-Paket importiert (kein "import pdfjs-dist" bzw.
// "import(...)") — Vite versucht ein solches Modul im eigenen Projekt aufzulösen und
// bricht mit "Failed to resolve import" ab, solange das Paket nicht als Abhängigkeit
// installiert ist. Stattdessen wird die fertig gebündelte Browser-Version per
// <script>-Tag von einer CDN (cdnjs) nachgeladen und hängt sich dabei selbst als
// globale Variable window.pdfjsLib ein — funktioniert dadurch unabhängig von der
// Bundler-Konfiguration des Projekts. loadPdfJs() cacht das Laden (Promise + Prüfung
// auf window.pdfjsLib), damit das Script auch bei mehreren gleichzeitig offenen
// PDF-Grundrissen nur einmal eingebunden wird. Schlägt das Laden oder Rendern fehl
// (z. B. weil die CDN nicht erreichbar ist), fällt die Komponente automatisch auf
// die bisherige <embed>-Darstellung zurück, damit die Etage trotzdem nutzbar bleibt.
const PDFJS_CDN_BASE = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174";
let pdfjsLoadPromise = null;
function loadPdfJs() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("pdf.js benötigt eine Browser-Umgebung."));
  }
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (pdfjsLoadPromise) return pdfjsLoadPromise;

  pdfjsLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${PDFJS_CDN_BASE}/pdf.min.js`;
    script.async = true;
    script.onload = () => {
      if (!window.pdfjsLib) {
        pdfjsLoadPromise = null;
        reject(new Error("pdf.js-Script wurde geladen, aber window.pdfjsLib ist nicht verfügbar."));
        return;
      }
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN_BASE}/pdf.worker.min.js`;
      resolve(window.pdfjsLib);
    };
    script.onerror = () => {
      pdfjsLoadPromise = null;
      reject(new Error("pdf.js konnte nicht von der CDN geladen werden."));
    };
    document.head.appendChild(script);
  });

  return pdfjsLoadPromise;
}

const PdfPlanCanvas = forwardRef(function PdfPlanCanvas({ url, renderScale, zoomScale = 1 }, ref) {
  const canvasRef = useRef(null);
  const pageRef = useRef(null); // aktuell geladene pdf.js-Seite, für wiederholtes Rendern ohne erneutes Laden/Parsen
  const renderTaskRef = useRef(null); // laufende pdf.js RenderTask, um sie bei einem neuen Zoom abzubrechen
  const lastRenderedScaleRef = useRef(0); // zuletzt tatsächlich gerenderter Ziel-Maßstab
  const [status, setStatus] = useState("loading"); // "loading" | "ready" | "error"

  // Ermittelt den tatsächlichen pdf.js-Render-Maßstab aus Basis-Auflösung, aktuellem
  // Zoomfaktor der Grundriss-"Bühne" und Pixel-Dichte des Displays (devicePixelRatio,
  // gekappt bei PDF_RENDER_DPR_CAP, damit 3x-Retina-Geräte kein unverhältnismäßig
  // großes Canvas erzeugen). PDF_RENDER_SCALE_MAX kappt das Ergebnis zusätzlich nach
  // oben, unabhängig von Zoom und Pixel-Dichte — Schutz gegen zu großen Speicher-/
  // Rechenaufwand bzw. das vom Browser erlaubte Canvas-Größenlimit.
  const computeTargetScale = (zoom) => {
    const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, PDF_RENDER_DPR_CAP);
    return Math.min(PDF_RENDER_SCALE_MAX, renderScale * Math.max(1, zoom) * dpr);
  };

  // Rendert die bereits geladene Seite mit dem übergebenen Maßstab neu auf das Canvas.
  // Eine noch laufende Render-Aufgabe wird zuerst abgebrochen, da pdf.js keine zwei
  // gleichzeitigen render()-Aufrufe auf demselben Canvas erlaubt (z.B. wenn während
  // eines laufenden Renderns bereits der nächste, höhere Zoom-Schritt eintrifft).
  const renderAtScale = async (targetScale) => {
    const page = pageRef.current;
    const canvas = canvasRef.current;
    if (!page || !canvas) return;
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch (e) {
        // Ein Abbruch eines bereits abgeschlossenen/fehlgeschlagenen Tasks wirft
        // teils selbst einen Fehler — für unsere Zwecke bewusst irrelevant.
      }
      renderTaskRef.current = null;
    }
    const viewport = page.getViewport({ scale: targetScale });
    // Bewusst NICHT direkt in das sichtbare <canvas>: canvas.width/height zu setzen
    // leert dessen Inhalt sofort (Browser-Verhalten), was während des asynchronen
    // pdf.js-Renderings zu dem kurzen weißen Aufblitzen beim Zoomen führen würde. Es
    // wird stattdessen unsichtbar in ein Offscreen-Canvas gerendert und erst nach
    // erfolgreichem Abschluss in einem einzigen synchronen Schritt auf das sichtbare
    // Canvas übertragen — bis dahin bleibt der bisherige Plan unverändert sichtbar.
    const offscreen = document.createElement("canvas");
    offscreen.width = viewport.width;
    offscreen.height = viewport.height;
    const task = page.render({ canvasContext: offscreen.getContext("2d"), viewport });
    renderTaskRef.current = task;
    try {
      await task.promise;
      lastRenderedScaleRef.current = targetScale;
      canvas.width = offscreen.width;
      canvas.height = offscreen.height;
      canvas.getContext("2d").drawImage(offscreen, 0, 0);
    } catch (err) {
      // RenderingCancelledException ist der erwartbare Fall, wenn renderAtScale
      // erneut aufgerufen wurde, während dieser Render-Vorgang noch lief — lautlos
      // ignorieren, das sichtbare Canvas bleibt dabei unangetastet (kein Weißwerden).
      if (err?.name !== "RenderingCancelledException") throw err;
    } finally {
      if (renderTaskRef.current === task) renderTaskRef.current = null;
    }
  };

  // Lädt Dokument + erste Seite bei jeder neuen PDF-URL neu und rendert einmalig mit
  // dem zum Ladezeitpunkt aktuellen Zoomfaktor.
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    pageRef.current = null;
    lastRenderedScaleRef.current = 0;

    (async () => {
      try {
        const pdfjsLib = await loadPdfJs();
        const pdf = await pdfjsLib.getDocument(url).promise;
        if (cancelled) return;
        const page = await pdf.getPage(1);
        if (cancelled) return;
        pageRef.current = page;
        await renderAtScale(computeTargetScale(zoomScale));
        if (!cancelled) setStatus("ready");
      } catch (err) {
        console.error("PDF-Rendering (pdf.js via CDN) fehlgeschlagen, Fallback auf <embed>:", err);
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) renderTaskRef.current.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, renderScale]);

  // Gedrosseltes (debounced) Neu-Rendern bei Zoom-Änderungen: statt bei jedem
  // einzelnen Wheel-/Pinch-Zwischenschritt neu zu rendern, wird erst PDF_RERENDER_
  // DEBOUNCE_MS nach der letzten Änderung tatsächlich neu gezeichnet — also i.d.R.
  // erst, wenn eine Zoom-Geste beendet ist bzw. kurz innehält. Beim Rauszoomen wird
  // bewusst NICHT auf eine niedrigere Auflösung heruntergerendert (kein Schärfegewinn,
  // nur unnötige Render-Last) — die zuletzt erreichte, höhere Auflösung bleibt stehen.
  useEffect(() => {
    if (!pageRef.current) return undefined;
    const target = computeTargetScale(zoomScale);
    if (target <= lastRenderedScaleRef.current * 1.05) return undefined;

    const timer = setTimeout(() => {
      renderAtScale(target).catch((err) => {
        console.error("PDF-Re-Rendering beim Zoomen fehlgeschlagen:", err);
      });
    }, PDF_RERENDER_DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomScale, status]);

  return (
    <div ref={ref} className="relative aspect-[4/3] w-full bg-white">
      {status === "error" ? (
        <embed src={url} type="application/pdf" className="pointer-events-none h-full w-full" />
      ) : (
        <canvas
          ref={canvasRef}
          className="pointer-events-none block h-full w-full select-none object-contain transition-opacity"
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
              mode === "login" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Anmelden
          </button>
          <button
            onClick={() => switchMode("register")}
            className={`flex-1 border-b-2 pb-2 text-sm font-semibold transition ${
              mode === "register" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
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
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
            <p className="mb-0.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-blue-600">
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
                    className="flex-1 rounded-md border border-blue-300 px-2 py-1 text-sm outline-none ring-blue-500/30 focus:ring-4"
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
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-blue-500/30 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 disabled:bg-slate-50"
            />
            <button
              onClick={handleCreate}
              disabled={creating}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4 disabled:bg-slate-50"
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
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4 disabled:bg-slate-50"
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
                    className="h-3.5 w-3.5 accent-blue-600"
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
            <p className="mb-0.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-blue-600">
              <UserCog size={13} /> Verwaltung
            </p>
            <h2 className="text-lg font-bold text-slate-900">Benutzer</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFormState({ mode: "create", user: null })}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
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
      await generateProjectReportPdf({ project, floors: floors || [], pins: filteredPins, filters, trades, generatedBy });
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
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-2 text-sm text-slate-700 outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4 disabled:bg-slate-50"
                />
              </div>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  disabled={busy}
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-2 text-sm text-slate-700 outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4 disabled:bg-slate-50"
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
// PROJEKT-FORMULAR — Anlegen & Bearbeiten (inkl. LPH 1–9)
// ----------------------------------------------------------------------------------

function ProjectFormModal({ mode, project, trades = [], onManageTrades, onClose, onSave }) {
  const [name, setName] = useState(project?.name || "");
  const [projectNumber, setProjectNumber] = useState(project?.project_number || "");
  const [address, setAddress] = useState(project?.address || "");
  const [status, setStatus] = useState(project?.status || "Geplant");
  const [projectLeader, setProjectLeader] = useState(project?.project_leader || "");
  // selectedLph: Array der ausgewählten Phasen-Keys, z.B. ["1", "3", "5"]. Der Lazy-
  // Initializer sorgt dafür, dass beim allerersten Render bereits der richtige Wert
  // steht (kein Aufblitzen einer leeren Auswahl beim Bearbeiten eines Projekts).
  const [selectedLph, setSelectedLph] = useState(() => normalizeLphSelection(project?.lph_beauftragt));
  // selectedTrades: Array der ausgewählten Gewerke-IDs für dieses Projekt. Bei einem
  // Bestandsprojekt ohne gespeicherte Auswahl (resolveProjectTradeIds → null) startet
  // die Auswahl bewusst leer — der Hinweistext unten erklärt, was das für den Nutzer
  // bedeutet, statt es stillschweigend so zu belassen.
  const [selectedTrades, setSelectedTrades] = useState(() => resolveProjectTradeIds(project) ?? []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isLegacyTradeSelection = mode === "edit" && resolveProjectTradeIds(project) === null;

  // Zusätzlicher, expliziter Reset bei jedem Öffnen des Modals: greift sowohl beim
  // Anlegen (project ist null, also leeres Array) als auch beim Bearbeiten (project
  // ist gesetzt, also die gespeicherte Auswahl). Normalisiert dabei robust sowohl das
  // aktuelle Array-Format als auch ältere Objekt-Bestände aus Supabase.
  useEffect(() => {
    setSelectedLph(normalizeLphSelection(project?.lph_beauftragt));
    setSelectedTrades(resolveProjectTradeIds(project) ?? []);
  }, [project]);

  const handleToggleTrade = (tradeId) => {
    setSelectedTrades((prev) => (prev.includes(tradeId) ? prev.filter((id) => id !== tradeId) : [...prev, tradeId]));
  };

  // Schlanke Handler-Funktion für die interaktive Auftragsauswahl: schaltet genau
  // eine Phase um, ohne die übrigen Werte zu verändern (immutable update über die
  // Setter-Funktion, damit React den Zustandswechsel beim allerersten Klick sofort
  // erkennt und sichtbar macht). Vergleicht Keys konsequent als String, damit es
  // keinen Unterschied macht, ob eine Phase als Zahl oder als String hereinkommt.
  const handleToggleLph = (phaseKey) => {
    const key = String(phaseKey);
    setSelectedLph((prev) => {
      const current = normalizeLphSelection(prev);
      return current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
    });
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Bitte einen Projektnamen vergeben.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        project_number: projectNumber.trim(),
        address: address.trim(),
        status,
        project_leader: projectLeader.trim(),
        lph_beauftragt: selectedLph,
        selected_trades: selectedTrades,
      });
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
            <div>
              <FieldLabel>Projekt-Status</FieldLabel>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={submitting}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4 disabled:bg-slate-50"
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
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none ring-blue-500/30 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 disabled:bg-slate-50"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">HOAI-Leistungsphasen (LPH 1–9) · Auftragsauswahl</label>
              <LphAuftragsQuickActions onApply={setSelectedLph} disabled={submitting} />
            </div>
            <div className="space-y-2">
              <LphAuftragsProgressRow lphSelection={selectedLph} />
              <LphAuftragsGrid lphSelection={selectedLph} onToggle={handleToggleLph} disabled={submitting} />
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

function ProjectOverview({ projects, loading, onOpenProject, query, setQuery, onCreateProject, onEditProject, onDeleteProject }) {
  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.address.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <Building2 size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Baustellen-Dokumentation</h1>
            <p className="text-sm text-slate-500">Projekte, Grundrisse &amp; Mängel im Überblick</p>
          </div>
        </div>
        <button
          onClick={onCreateProject}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={16} /> Neues Projekt
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Projekt nach Name oder Adresse suchen…"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 shadow-sm outline-none ring-blue-500/30 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4"
        />
      </div>

      {loading ? (
        <LoadingBlock label="Projekte werden geladen…" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => {
            const { total, open } = countPins(project.floors);
            const heroFloor = project.floors?.[0];
            const heroKind = heroFloor ? resolveFloorKind(heroFloor) : "image";
            return (
              <div
                key={project.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
              >
                <button onClick={() => onOpenProject(project.id)} className="flex flex-col text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30">
                  <div className="relative h-32 w-full overflow-hidden bg-slate-900">
                    {heroKind === "cad" && (
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
                    )}
                    {heroKind === "pdf" && (
                      <div className="flex h-full w-full items-center justify-center bg-slate-800">
                        <FileText size={26} className="text-rose-400/80" />
                      </div>
                    )}
                    {heroKind === "image" && heroFloor && (
                      // Nur echte Bilddateien werden per <img> gerendert — .dwg/.dxf/.pdf
                      // laufen über die Zweige oben, damit kein <img> mit einer falschen
                      // Datei fehlschlägt und die Karte leer bleibt.
                      <img
                        src={heroFloor.image_url}
                        alt=""
                        className="h-full w-full object-cover opacity-70 transition duration-300 group-hover:scale-105 group-hover:opacity-80"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/10 to-transparent" />
                    <span className="absolute bottom-2 left-3 text-xs font-semibold uppercase tracking-wider text-white/90">
                      {project.status}
                    </span>
                    {open > 0 && (
                      <span className="absolute right-3 top-2.5 inline-flex items-center gap-1 rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-bold text-white shadow">
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
                    <LphProgressRow lphStatus={project.lph_status} lphBeauftragt={project.lph_beauftragt} />
                    <div className="mt-1 flex items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Layers size={14} className="text-slate-400" /> {(project.floors || []).length} Etagen
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={14} className="text-slate-400" /> {total} Pins
                      </span>
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-2.5">
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
          {filtered.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-sm text-slate-400">
              {projects.length === 0 ? "Noch keine Projekte vorhanden." : `Kein Projekt gefunden für „${query}“.`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------------
// NEUE ETAGE / GRUNDRISS HOCHLADEN — MODAL
// ----------------------------------------------------------------------------------

function NewFloorModal({ onClose, onSave }) {
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
    // persistierte URL kommt erst nach dem Upload aus Supabase Storage (onSave -> createFloor).
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
      setError("Bitte einen Namen für die Etage vergeben.");
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
            <p className={MODAL_EYEBROW}>Neue Etage</p>
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
            <FieldLabel>Name der Etage</FieldLabel>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              placeholder="z.B. 2. Obergeschoss"
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
              } ${isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50"}`}
            >
              {!previewUrl && (
                <>
                  <UploadCloud size={28} className={isDragging ? "text-blue-500" : "text-slate-400"} />
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
            {submitting ? "Wird hochgeladen…" : "Etage speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------------
// ETAGE BEARBEITEN — Name ändern und/oder Grundriss austauschen
// ----------------------------------------------------------------------------------
// Analog zu NewFloorModal, aber mit vorbefüllten Werten und optionalem Datei-Upload:
// wird keine neue Datei gewählt, bleibt der bisherige Grundriss unverändert und es
// wird nur der Name aktualisiert.

function EditFloorModal({ floor, onClose, onSave }) {
  const [name, setName] = useState(floor?.name || "");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileKind, setFileKind] = useState(null); // "image" | "pdf" | "cad"
  const [fileExt, setFileExt] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  const existingKind = resolveFloorKind(floor);
  const existingFileName = deriveFileNameFromUrl(floor?.image_url);
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
    // persistierte URL kommt erst nach dem Upload aus Supabase Storage (onSave -> updateFloor).
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
      setError("Bitte einen Namen für die Etage vergeben.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      // file ist bewusst optional: onSave(name, null) aktualisiert nur den Namen und
      // lässt den bestehenden Grundriss unangetastet.
      await onSave(name.trim(), file);
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
              } ${isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50"}`}
            >
              {!previewUrl && (
                <>
                  {existingKind === "image" && floor?.image_url ? (
                    <img src={floor.image_url} alt="Aktueller Grundriss" className="mx-auto max-h-32 rounded-lg object-contain shadow-sm" />
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
  onChangeLphStatus,
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
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">HOAI-Leistungsphasen</p>
            <LphStatusGrid
              lphStatus={project.lph_status}
              lphBeauftragt={project.lph_beauftragt}
              onChangeStatus={(phaseKey, newStatus) => onChangeLphStatus && onChangeLphStatus(phaseKey, newStatus)}
              disabled={readOnly}
            />
          </div>
          <div className="mt-3 max-w-xl">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">LPH-Auftragsauswahl</p>
            <LphAuftragsProgressRow lphSelection={project.lph_beauftragt} />
          </div>
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
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={16} /> Neue Etage / Grundriss hinzufügen
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingBlock label="Etagen werden geladen…" />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {floors.map((floor) => {
            const open = (floor.pins || []).filter((p) => p.status === "offen").length;
            const floorKind = resolveFloorKind(floor);
            const isCad = floorKind === "cad";
            const isPdf = floorKind === "pdf";
            const fileName = deriveFileNameFromUrl(floor.image_url);
            return (
              <div
                key={floor.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
              >
                <button
                  onClick={() => onOpenFloor(floor.id)}
                  className="flex flex-col text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30"
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
                      <img src={floor.image_url} alt="" className="h-full w-full object-cover opacity-80 transition duration-300 group-hover:scale-105" />
                    )}
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/10" />
                    {isCad && <CadBadge ext={deriveFileExt(fileName) || "dwg"} className="absolute left-2 top-2" />}
                    {open > 0 && (
                      <span className="absolute right-2 top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white shadow">
                        {open}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-slate-900">{floor.name}</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">{(floor.pins || []).length} Pin{(floor.pins || []).length !== 1 ? "s" : ""}</p>
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
            className="flex min-h-[104px] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-500 sm:min-h-[120px]"
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
// SCREEN 3: INTERACTIVE FLOOR PLAN
// ----------------------------------------------------------------------------------

// Sichtfeld-Fächer, der die Blickrichtung/den Aufnahmewinkel eines Pins visualisiert.
// 0° zeigt nach oben (Norden) und wird per CSS transform: rotate(angle) gedreht — der
// Fächer ist an der Pin-Spitze verankert, sodass sich Sichtfeld und Pin gemeinsam ausrichten.
function ViewCone({ angle, colorClass }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="pointer-events-none absolute h-14 w-14"
      style={{
        left: "50%",
        top: "0px",
        transform: `translate(-50%, -2px) rotate(${angle}deg)`,
        transformOrigin: "50% 4px",
      }}
    >
      <path
        d="M 50 4 L 18 62 A 40 40 0 0 0 82 62 Z"
        className={colorClass}
        fill="currentColor"
        opacity="0.22"
      />
      <path d="M 50 4 L 18 62 A 40 40 0 0 0 82 62 Z" className={colorClass} fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.55" />
    </svg>
  );
}

function PinMarker({ pin, draggable, isDragging, onClick, onDragStart, viewScale = 1 }) {
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
        <MapPin
          size={30}
          strokeWidth={1.5}
          className={`${s.text} fill-white transition group-hover:scale-110`}
          style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.35))" }}
        />
        <span className={`absolute top-[7px] h-2 w-2 rounded-full ${s.dot}`} />
      </span>
    </button>
  );
}

// ----------------------------------------------------------------------------------
// STUFENLOSES ZOOM & PAN — Konfiguration für die interaktive Grundriss-Ansicht
// ----------------------------------------------------------------------------------
const FLOORPLAN_MIN_SCALE = 0.5;
const FLOORPLAN_MAX_SCALE = 10.0;
const FLOORPLAN_PAN_CLICK_THRESHOLD = 5; // px — ab hier zählt eine Interaktion als Verschieben statt als Klick

// Basis-Render-Auflösung für PDF-Grundrisse ohne interaktiven Zoom (siehe
// PdfPlanCanvas) — entspricht dem scale-Parameter von pdf.js' getViewport(). PDF-
// Punkte sind mit 72 dpi definiert; 4.0 entspricht damit einer Rasterung von ca.
// 288 dpi (nahe an den 300 dpi als Referenzwert für "gestochen scharf"). Diese Basis
// wird beim Zoomen zusätzlich mit dem aktuellen Zoomfaktor und der Pixel-Dichte des
// Displays multipliziert (siehe computeTargetScale() in PdfPlanCanvas) — der Plan
// wird beim Heranzoomen also aktiv mit höherer Auflösung neu gerendert, statt nur
// per CSS gestreckt zu werden.
const PDF_RENDER_SCALE_MIN = 4.0;
// Obergrenze für die tatsächliche Render-Skalierung (nach Zoom- und DPR-
// Multiplikation): verhindert, dass bei starkem Zoom kombiniert mit hoher Pixel-
// Dichte ein unverhältnismäßig großes Canvas entsteht — Speicher-/Performance-Risiko
// bzw. u.U. sogar über dem vom Browser erlaubten Canvas-Größenlimit.
const PDF_RENDER_SCALE_MAX = 10;
// devicePixelRatio wird gedeckelt: auf 3x-Displays würde eine ungedeckelte
// Multiplikation die Canvas-Fläche unnötig weiter aufblähen, 2x deckt die
// allermeisten Retina-Displays (u.a. iPhone) bereits ausreichend scharf ab.
const PDF_RENDER_DPR_CAP = 2;
// Debounce für das Neu-Rendern bei Zoom-Änderungen: verhindert, dass während einer
// laufenden Wheel-/Pinch-Geste bei jedem Zwischenschritt neu gerendert wird — es wird
// erst nach einer kurzen Pause (i.d.R. Ende der Geste) tatsächlich neu gezeichnet.
const PDF_RERENDER_DEBOUNCE_MS = 300;

function FloorPlanView({ floor, pins, loading, creatingPin, session, trades = [], onBack, onPlanClick, onPinClick, onPinMove }) {
  const imgRef = useRef(null);
  const viewportRef = useRef(null);
  const [draggingPinId, setDraggingPinId] = useState(null);
  const [dragPos, setDragPos] = useState(null);
  const dragMovedRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Zoom- & Pan-Zustand: scale = Zoomfaktor (1 = 100 %, ungezoomt), translate =
  // Verschiebung der Grundriss-"Bühne" in Pixeln relativ zum sichtbaren Ausschnitt.
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanningActive, setIsPanningActive] = useState(false);
  // Gewerke-Filter der Grundriss-Ansicht: "all" zeigt alle Pins, ansonsten wird auf
  // pin.trade_id gefiltert. Rein clientseitig, da Pins der aktuellen Etage bereits
  // vollständig geladen sind.
  const [tradeFilter, setTradeFilter] = useState("all");

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

  // Beim Wechsel der Etage Zoom/Pan zurücksetzen, damit jede Etage wieder in der
  // ursprünglichen 100%-Ansicht startet.
  useEffect(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, [floor?.id]);

  const clampScale = (v) => Math.min(FLOORPLAN_MAX_SCALE, Math.max(FLOORPLAN_MIN_SCALE, v));

  // Berechnet Zoomfaktor + Verschiebung so, dass der Punkt unter (clientX, clientY)
  // vor und nach der Skalierung an derselben Bildschirmposition bleibt — sorgt für
  // "Zoom zum Cursor/Finger" statt Zoom zur Bildmitte.
  const computeZoomAtClientPoint = (clientX, clientY, targetScale, baseScale, baseTranslate) => {
    const viewportEl = viewportRef.current;
    if (!viewportEl) return { scale: baseScale, translate: baseTranslate };
    const rect = viewportEl.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const newScale = clampScale(targetScale);
    const worldX = (localX - baseTranslate.x) / baseScale;
    const worldY = (localY - baseTranslate.y) / baseScale;
    return {
      scale: newScale,
      translate: {
        x: localX - worldX * newScale,
        y: localY - worldY * newScale,
      },
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
      // Sanfter, stufenloser Zoom-Schritt je Wheel-Ereignis, zentriert auf den
      // Mauszeiger statt auf die Bildmitte (computeZoomAtClientPoint).
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
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
  }, [floor?.id]);

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
    // PinMarker ruft bei eigenem Pointerdown stopPropagation() auf — hier kommen
    // also ausschließlich Pointer an, die den Grundriss selbst (Hintergrund) treffen.
    if (creatingPin) return;
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
    // Pin-Verschieben hat immer Vorrang vor Pan/Zoom der Ansicht.
    if (draggingPinId) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMovedRef.current = true;
      setDragPos(posFromEvent(e));
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
      setTranslate({
        x: gesture.startTranslate.x + dx,
        y: gesture.startTranslate.y + dy,
      });
    }
  };

  const handleViewportPointerUp = (e) => {
    if (draggingPinId) {
      endDrag(e);
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
      if (wasBackgroundPointer && gesture && !gesture.moved && !creatingPin) {
        // Kurzer Tap/Klick ohne nennenswerte Bewegung (≤ 5px): neuen Pin an der
        // exakten Position setzen.
        const pos = posFromEvent(e);
        if (pos) onPlanClick(pos.x, pos.y);
      }
    }
  };

  const activeTrades = (trades || []).filter((t) => t.active);
  const visiblePins = tradeFilter === "all" ? pins : pins.filter((p) => p.trade_id === tradeFilter);
  const open = visiblePins.filter((p) => p.status === "offen").length;
  const inProgress = visiblePins.filter((p) => p.status === "bearbeitung").length;
  const done = visiblePins.filter((p) => p.status === "erledigt").length;
  const floorKind = resolveFloorKind(floor);
  const isPdf = floorKind === "pdf";
  const isCad = floorKind === "cad";
  const fileName = deriveFileNameFromUrl(floor.image_url);
  const fileExt = deriveFileExt(fileName) || "dwg";

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
      <button
        onClick={onBack}
        className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
      >
        <ChevronLeft size={17} /> Zurück zu den Etagen
      </button>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{floor.name}</h1>
            {isCad && <CadBadge ext={fileExt} />}
          </div>
          <p className="text-sm text-slate-500">
            {creatingPin
              ? "Pin wird angelegt…"
              : session
              ? "Auf den Grundriss tippen, um einen neuen Pin zu setzen — bestehende Pins lassen sich per Ziehen verschieben. Mit dem Mausrad, per Zwei-Finger-Geste oder über die Zoom-Buttons lässt sich der Plan stufenlos vergrößern und verschieben."
              : "Nur Ansicht — zum Setzen oder Verschieben von Pins bitte anmelden. Zoomen und Verschieben des Grundrisses ist auch ohne Anmeldung möglich."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <div className="relative">
            <Filter className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <select
              value={tradeFilter}
              onChange={(e) => setTradeFilter(e.target.value)}
              title="Pins nach Gewerk filtern"
              className="appearance-none rounded-full border border-slate-200 bg-white py-1 pl-7 pr-6 text-[11px] font-semibold text-slate-600 outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4"
            >
              <option value="all">Alle Gewerke</option>
              {activeTrades.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-rose-700 ring-1 ring-inset ring-rose-200">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> {open} offen
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700 ring-1 ring-inset ring-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {inProgress} in Arbeit
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 ring-1 ring-inset ring-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {done} erledigt
          </span>
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
              style={{ cursor: creatingPin ? "wait" : isPanningActive ? "grabbing" : "grab" }}
              onPointerDown={handleViewportPointerDown}
              onPointerMove={handleViewportPointerMove}
              onPointerUp={handleViewportPointerUp}
              onPointerLeave={handleViewportPointerUp}
              onPointerCancel={handleViewportPointerUp}
            >
              <div
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
                  // Pins werden exakt wie bei Bild-/PDF-Grundrissen über % Koordinaten relativ zu
                  // diesem Container platziert, verschoben und verwaltet — bleiben dadurch beim
                  // Zoomen/Verschieben der "Bühne" exakt an ihrer relativen Position fixiert.
                  <CadBlueprintPlan ref={imgRef} fileName={fileName} ext={fileExt} />
                )}
                {isPdf && !isCad && (
                  // PDF-Grundrisse werden über pdf.js in ein <canvas> gerendert (siehe
                  // PdfPlanCanvas), statt wie zuvor per <embed> — und bei jeder signifikanten
                  // Zoom-Änderung mit höherer Auflösung neu gerendert (zoomScale={scale}),
                  // statt das einmal gerenderte Bild nur per CSS zu strecken. Dadurch bleiben
                  // Pläne und Schriftzüge auch beim starken Heranzoomen gestochen scharf.
                  <PdfPlanCanvas ref={imgRef} url={floor.image_url} renderScale={PDF_RENDER_SCALE_MIN} zoomScale={scale} />
                )}
                {!isCad && !isPdf && (
                  <img
                    ref={imgRef}
                    src={floor.image_url}
                    alt={floor.name}
                    className="pointer-events-none block w-full select-none opacity-90"
                    draggable={false}
                  />
                )}
                {visiblePins.map((pin) => (
                  <PinMarker
                    key={pin.id}
                    pin={draggingPinId === pin.id && dragPos ? { ...pin, x: dragPos.x, y: dragPos.y } : pin}
                    draggable={!!session}
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
        <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600" />

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
            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-bold text-blue-700">{value}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-blue-600 disabled:opacity-60"
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
                  ? "border-transparent bg-blue-600 text-white shadow-sm"
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
// PIN DETAIL MODAL
// ----------------------------------------------------------------------------------

function PinModal({ pin, isNew, readOnly, trades, onRequestLogin, onClose, onSaveFields, onDelete, onAddTodo, onToggleTodo, onRemoveTodo, onUploadPhotos, onRemovePhoto }) {
  const [draft, setDraft] = useState({
    title: pin.title,
    status: pin.status,
    priority: pin.priority,
    description: pin.description,
    assignee: pin.assigned_to || "",
    angle: pin.angle ?? 0,
    trade_id: pin.trade_id || "",
  });
  const [todoInput, setTodoInput] = useState("");
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [todoBusy, setTodoBusy] = useState(false);
  const fileInputRef = useRef(null);

  const update = (field, value) => {
    if (readOnly) return;
    setDraft((d) => ({ ...d, [field]: value }));
  };

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
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-blue-600">
              {isNew ? "Neuer Pin" : `Pin #${pin.id.slice(0, 8)}`}
            </p>
            <input
              value={draft.title}
              onChange={(e) => update("title", e.target.value)}
              disabled={readOnly}
              placeholder="Titel des Mangels…"
              className="w-full border-none p-0 text-lg font-bold text-slate-900 outline-none placeholder:text-slate-300 disabled:bg-transparent"
            />
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
            <textarea
              value={draft.description}
              onChange={(e) => update("description", e.target.value)}
              disabled={readOnly}
              rows={3}
              placeholder="Details zum Mangel oder zur Aufgabe…"
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none ring-blue-500/30 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 disabled:bg-slate-50"
            />
          </div>

          {/* Assignee */}
          <div>
            <FieldLabel>Zuständige Person / Dienstleister</FieldLabel>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={draft.assignee}
                onChange={(e) => update("assignee", e.target.value)}
                disabled={readOnly}
                placeholder="z.B. Fa. Mustermann Elektro"
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none ring-blue-500/30 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 disabled:bg-slate-50"
              />
            </div>
          </div>

          {/* Gewerk */}
          <div>
            <FieldLabel>Gewerk</FieldLabel>
            <div className="relative">
              <Wrench className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={draft.trade_id || ""}
                onChange={(e) => update("trade_id", e.target.value)}
                disabled={readOnly}
                className="w-full appearance-none rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-4 disabled:bg-slate-50"
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

          {/* Todos */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <ListChecks size={14} /> Aufgaben
            </label>
            <div className="space-y-1.5">
              {todos.map((t) => (
                <div key={t.id} className="group flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5">
                  <button onClick={() => !readOnly && onToggleTodo(t)} disabled={readOnly} className="shrink-0 text-blue-600 disabled:cursor-not-allowed">
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
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none ring-blue-500/30 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 disabled:bg-slate-50"
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
                <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200">
                  <img
                    src={photo.photo_url}
                    alt=""
                    className="h-full w-full cursor-zoom-in object-cover transition group-hover:opacity-90"
                    onClick={() => setLightboxSrc(photo.photo_url)}
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
                    <ZoomIn size={16} className="text-white opacity-0 transition group-hover:opacity-100" />
                  </div>
                  {!readOnly && (
                    <button
                      onClick={() => onRemovePhoto(photo)}
                      className="absolute right-1 top-1 rounded-full bg-slate-900/70 p-0.5 text-white opacity-0 transition group-hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
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
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 text-slate-400 transition hover:border-blue-400 hover:text-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
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
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
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

  // Zentraler Guard für alle Schreibaktionen: Gäste (kein session) bekommen statt der
  // Aktion das Login-Modal angezeigt (Klick auf "Neues Projekt", "Bearbeiten",
  // "Löschen", Pin setzen/verschieben, Etage hinzufügen, …).
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

  // -------------------------------------------------------------------------------
  // DATEN-STATE
  // -------------------------------------------------------------------------------
  const [projects, setProjects] = useState([]); // Projekte inkl. leichter Etagen-/Pin-Zusammenfassung
  const [loadingProjects, setLoadingProjects] = useState(true);

  const [floors, setFloors] = useState([]); // Etagen des aktuell geöffneten Projekts (inkl. leichter Pin-Zusammenfassung)
  const [loadingFloors, setLoadingFloors] = useState(false);

  const [pins, setPins] = useState([]); // Pins der aktuell geöffneten Etage, inkl. pin_todos & pin_photos
  const [loadingPins, setLoadingPins] = useState(false);

  const [creatingPin, setCreatingPin] = useState(false);
  const [globalError, setGlobalError] = useState(null);

  const [screen, setScreen] = useState("projects"); // projects | floors | plan
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedFloorId, setSelectedFloorId] = useState(null);
  const [query, setQuery] = useState("");
  const [modalState, setModalState] = useState(null); // { pinId, isNew }
  const [floorModalOpen, setFloorModalOpen] = useState(false);
  const [editFloorModalState, setEditFloorModalState] = useState(null); // { floor }
  const [deleteFloorConfirm, setDeleteFloorConfirm] = useState(null); // { target }
  const [deleteFloorBusy, setDeleteFloorBusy] = useState(false);
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
  const activePin = modalState ? pins.find((p) => p.id === modalState.pinId) : null;

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

  useEffect(() => {
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
  }, []);

  // Gewerke sind öffentlich lesbar und unabhängig vom ausgewählten Projekt — werden
  // deshalb einmalig beim Start geladen (inkl. automatischer Erstbefüllung des
  // Standard-Katalogs, falls die Tabelle noch leer ist, siehe fetchTrades()).
  useEffect(() => {
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
  }, []);

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
      setPins([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingPins(true);
      try {
        if (!isOnline()) throw new Error("Keine Internetverbindung.");
        const data = await fetchPinsWithDetails(selectedFloorId);
        if (!cancelled) {
          setPins(data);
          cachePinsOffline(selectedFloorId, data);
        }
      } catch (err) {
        const cached = readCachedPins(selectedFloorId);
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
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedFloorId]);

  // Hält den lokalen Offline-Cache auch nach optimistischen Zwischenständen aktuell
  // (neuer Pin, geänderte Felder, neues Foto, …), nicht nur beim initialen Laden
  // oben — damit ein Wechsel in den Offline-Modus unmittelbar danach den zuletzt
  // sichtbaren Stand zeigt, nicht den vom letzten Server-Fetch.
  useEffect(() => {
    if (selectedProjectId) cacheFloorsOffline(selectedProjectId, floors);
  }, [floors, selectedProjectId]);
  useEffect(() => {
    if (selectedFloorId) cachePinsOffline(selectedFloorId, pins);
  }, [pins, selectedFloorId]);
  useEffect(() => {
    cacheProjectsOffline(projects);
  }, [projects]);

  // -------------------------------------------------------------------------------
  // Hilfsfunktionen, um die "leichten" Pin-Zusammenfassungen (nur id/status) in
  // floors- und projects-State synchron zu halten, damit Badges auf Etagen- und
  // Projektübersicht sofort korrekt sind, ohne nach jeder Pin-Änderung alles neu
  // vom Server zu laden.
  // -------------------------------------------------------------------------------

  const addPinSummary = (floorId, pin) => {
    const summary = { id: pin.id, status: pin.status };
    setFloors((prev) => prev.map((f) => (f.id === floorId ? { ...f, pins: [...(f.pins || []), summary] } : f)));
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== selectedProjectId
          ? p
          : { ...p, floors: (p.floors || []).map((f) => (f.id === floorId ? { ...f, pins: [...(f.pins || []), summary] } : f)) }
      )
    );
  };

  const removePinSummary = (floorId, pinId) => {
    setFloors((prev) => prev.map((f) => (f.id === floorId ? { ...f, pins: (f.pins || []).filter((p) => p.id !== pinId) } : f)));
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== selectedProjectId
          ? p
          : { ...p, floors: (p.floors || []).map((f) => (f.id === floorId ? { ...f, pins: (f.pins || []).filter((p2) => p2.id !== pinId) } : f)) }
      )
    );
  };

  const updatePinSummaryStatus = (floorId, pinId, status) => {
    setFloors((prev) => prev.map((f) => (f.id === floorId ? { ...f, pins: (f.pins || []).map((p) => (p.id === pinId ? { ...p, status } : p)) } : f)));
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
          const pin = await createPin(item.floorId, item.x, item.y, item.actor);
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
        const freshPins = await fetchPinsWithDetails(selectedFloorId);
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
    setScreen("floors");
  };

  const openFloor = (id) => {
    setSelectedFloorId(id);
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

  const handleSaveProject = async (fields) => {
    if (projectModalState.mode === "create") {
      const created = await createProject(fields);
      setProjects((prev) => [{ ...created, floors: [] }, ...prev]);
    } else {
      const updated = await updateProject(projectModalState.project.id, fields);
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
    }
    setProjectModalState(null);
    // Fehler werden NICHT hier gefangen: ProjectFormModal wartet auf dieses Promise
    // und zeigt einen Fehlertext direkt im Modal, falls Insert/Update scheitern.
  };

  // Schaltet den Status einer einzelnen, beauftragten LPH-Phase in der Detailansicht um
  // (Klick auf die entsprechende Kachel in LphStatusGrid) und persistiert die Änderung in
  // Supabase. Optimistisches Update im lokalen State für sofortiges visuelles Feedback,
  // mit Rollback, falls das Update serverseitig fehlschlägt.
  const handleUpdateLphStatus = async (phaseKey, newStatus) => {
    if (!requireAuth() || !project) return;
    const previousStatus = project.lph_status || defaultLphStatus();
    const updatedStatus = { ...previousStatus, [phaseKey]: newStatus };
    setProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, lph_status: updatedStatus } : p)));
    try {
      await updateProject(project.id, { lph_status: updatedStatus });
    } catch (err) {
      console.error("LPH-Status konnte nicht gespeichert werden:", err);
      setGlobalError("Der LPH-Status konnte nicht gespeichert werden. Bitte erneut versuchen.");
      setProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, lph_status: previousStatus } : p)));
    }
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

  const handleAddFloor = async (name, file) => {
    if (!selectedProjectId) return;
    const newFloor = await createFloor(selectedProjectId, name, file);
    setFloors((prev) => [...prev, { ...newFloor, pins: [] }]);
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== selectedProjectId
          ? p
          : {
              ...p,
              floors: [
                ...(p.floors || []),
                { id: newFloor.id, name: newFloor.name, image_url: newFloor.image_url, file_type: newFloor.file_type, pins: [] },
              ],
            }
      )
    );
    setFloorModalOpen(false);
    // Fehler werden NICHT hier gefangen: NewFloorModal wartet auf dieses Promise
    // und zeigt einen Fehlertext direkt im Modal, falls Upload oder Insert scheitern.
  };

  const openEditFloorModal = (floor) => {
    if (!requireAuth()) return;
    setEditFloorModalState({ floor });
  };

  const handleUpdateFloor = async (name, file) => {
    if (!editFloorModalState || !selectedProjectId) return;
    const floorId = editFloorModalState.floor.id;
    const updated = await updateFloor(floorId, selectedProjectId, name, file);
    setFloors((prev) => prev.map((f) => (f.id === floorId ? { ...f, ...updated } : f)));
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== selectedProjectId
          ? p
          : {
              ...p,
              floors: (p.floors || []).map((f) =>
                f.id === floorId ? { ...f, name: updated.name, image_url: updated.image_url, file_type: updated.file_type } : f
              ),
            }
      )
    );
    setEditFloorModalState(null);
    // Fehler werden NICHT hier gefangen: EditFloorModal wartet auf dieses Promise
    // und zeigt einen Fehlertext direkt im Modal, falls Upload oder Update scheitern.
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
      // Falls die gelöschte Etage gerade geöffnet war (z.B. Rücksprung aus der
      // Grundriss-Ansicht in die Etagenübersicht, ohne dass selectedFloorId zwischenzeitlich
      // geändert wurde), automatisch auf eine verbleibende Etage wechseln — der useEffect
      // auf selectedFloorId lädt deren Pins dann selbstständig nach. Gibt es keine Etage
      // mehr, zurück zur Etagenübersicht des Projekts.
      if (selectedFloorId === target.id) {
        const remaining = floors.filter((f) => f.id !== target.id);
        if (remaining.length > 0) {
          setSelectedFloorId(remaining[0].id);
        } else {
          setSelectedFloorId(null);
          setScreen("floors");
        }
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
    if (!floor || creatingPin) return;
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
        addPinSummary(floor.id, offlinePin);
        setSyncQueue(enqueueSyncItem({ type: "create_pin", localId, floorId: floor.id, x, y, actor: currentActor }));
        setModalState({ pinId: localId, isNew: true });
        return;
      }
      const newPin = await createPin(floor.id, x, y, currentActor);
      // Abschnitt 3: automatische Zeit-/Benutzererfassung — jede Pin-Erstellung wird
      // sofort mit einem eigenen Eintrag in der Bearbeitungshistorie protokolliert.
      const activity = await logPinActivity(newPin.id, "created", "Mängel-Pin angelegt", currentActor);
      const pinWithActivity = { ...newPin, pin_activity_log: [activity] };
      setPins((prev) => [...prev, pinWithActivity]);
      addPinSummary(floor.id, pinWithActivity);
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
      if (floor && fields.status !== undefined) updatePinSummaryStatus(floor.id, pinId, fields.status);
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
      if (floor) updatePinSummaryStatus(floor.id, pinId, updated.status);
      setModalState(null);
    } catch (err) {
      console.error("Pin konnte nicht gespeichert werden:", err);
      setGlobalError("Die Änderungen am Pin konnten nicht gespeichert werden. Bitte erneut versuchen.");
      throw err; // Modal fängt dies ab und bleibt geöffnet
    }
  };

  // Löschen von Pins sowie die gesamte Aufgabenverwaltung (unten) bleiben bewusst an
  // eine bestehende Verbindung gebunden (siehe Kommentar am Anfang des Offline-Moduls
  // in der Datenschicht) — requireOnline gibt dafür eine klare, sofortige Rückmeldung
  // statt eines rohen Netzwerkfehlers.
  const requireOnline = (actionLabel) => {
    if (online) return true;
    setGlobalError(`${actionLabel} ist offline nicht möglich. Bitte bei bestehender Internetverbindung erneut versuchen.`);
    return false;
  };

  const handleDeletePin = async (pinId) => {
    if (!floor) return;
    if (!requireOnline("Ein Pin kann")) return;
    const pinToDelete = pins.find((p) => p.id === pinId);
    try {
      await deletePin(pinToDelete || { id: pinId, pin_photos: [] });
      setPins((prev) => prev.filter((p) => p.id !== pinId));
      removePinSummary(floor.id, pinId);
      setModalState(null);
    } catch (err) {
      console.error("Pin konnte nicht gelöscht werden:", err);
      setGlobalError("Der Pin konnte nicht gelöscht werden. Bitte erneut versuchen.");
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
          setSyncQueue(enqueueSyncItem({ type: "upload_photo", pinId, dataUrl, fileName: file.name, mimeType: file.type, actor: currentActor }));
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

  return (
    <div className="min-h-screen w-full bg-slate-50 font-sans text-slate-900">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-slate-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 text-xs font-medium sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Building2 size={14} className="text-blue-400" /> BauDoc
            </span>
            <span className="text-slate-500">/</span>
            <button
              onClick={() => setScreen("projects")}
              className={`transition hover:text-white ${screen === "projects" ? "text-white" : "text-slate-400"}`}
            >
              Projekte
            </button>
            {project && (
              <>
                <span className="text-slate-500">/</span>
                <button
                  onClick={() => setScreen("floors")}
                  className={`transition hover:text-white ${screen === "floors" ? "text-white" : "text-slate-400"}`}
                >
                  {project.name}
                </button>
              </>
            )}
            {floor && screen === "plan" && (
              <>
                <span className="text-slate-500">/</span>
                <span className="text-white">{floor.name}</span>
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
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-2.5 py-1.5 font-semibold text-slate-200 transition hover:bg-slate-700"
            >
              {dropboxConnected ? <Cloud size={13} className="text-emerald-400" /> : <CloudOff size={13} />}{" "}
              <span className="hidden sm:inline">Dropbox</span>
            </button>
            <button
              onClick={openUsersAdmin}
              title="Benutzerverwaltung"
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-2.5 py-1.5 font-semibold text-slate-200 transition hover:bg-slate-700"
            >
              <UserCog size={13} /> <span className="hidden sm:inline">Benutzer</span>
            </button>
            {authLoading ? (
              <span className="text-slate-500">Lädt…</span>
            ) : session ? (
              <>
                <span className="hidden items-center gap-1.5 text-slate-300 sm:flex">
                  <User size={13} /> Angemeldet als {session.user?.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-2.5 py-1.5 font-semibold text-slate-200 transition hover:bg-slate-700"
                >
                  <LogOut size={13} /> Abmelden
                </button>
              </>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-2.5 py-1.5 font-semibold text-white transition hover:bg-blue-700"
              >
                <LogIn size={13} /> Anmelden
              </button>
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
          query={query}
          setQuery={setQuery}
          onCreateProject={openCreateProject}
          onEditProject={openEditProject}
          onDeleteProject={handleDeleteProjectClick}
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
          onChangeLphStatus={handleUpdateLphStatus}
          onEditFloor={openEditFloorModal}
          onDeleteFloor={handleDeleteFloorClick}
          onExportPdf={openPdfExportModal}
          readOnly={!session}
        />
      )}

      {screen === "plan" && floor && (
        <FloorPlanView
          floor={floor}
          pins={pins}
          loading={loadingPins}
          creatingPin={creatingPin}
          session={session}
          trades={projectTrades}
          onBack={() => setScreen("floors")}
          onPlanClick={handlePlanClick}
          onPinClick={handlePinClick}
          onPinMove={handlePinMove}
        />
      )}

      {activePin && (
        <PinModal
          pin={activePin}
          isNew={modalState.isNew}
          readOnly={!session}
          trades={pinModalTrades}
          onRequestLogin={() => setAuthModalOpen(true)}
          onClose={() => setModalState(null)}
          onSaveFields={(fields) => handleSaveFields(activePin.id, fields)}
          onDelete={() => handleDeletePin(activePin.id)}
          onAddTodo={(text) => handleAddTodo(activePin.id, text)}
          onToggleTodo={(todo) => handleToggleTodo(activePin.id, todo)}
          onRemoveTodo={(todoId) => handleRemoveTodo(activePin.id, todoId)}
          onUploadPhotos={(files) => handleUploadPhotos(activePin.id, files)}
          onRemovePhoto={(photo) => handleRemovePhoto(activePin.id, photo)}
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
          message={`Möchtest du die Etage „${deleteFloorConfirm.target.name}" samt allen enthaltenen Pins wirklich löschen?`}
          onConfirm={confirmDeleteFloor}
          onCancel={() => setDeleteFloorConfirm(null)}
          busy={deleteFloorBusy}
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
    </div>
  );
}

export default App;
