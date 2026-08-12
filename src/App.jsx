import React, { useState, useRef, forwardRef } from "react";
import {
  Search,
  ChevronLeft,
  Building2,
  Layers,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
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
  Ruler,
  Compass,
} from "lucide-react";

// ----------------------------------------------------------------------------------
// MOCK DATA
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

const PLAN_IMAGES = [
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1400&q=80",
  "https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=1400&q=80",
  "https://images.unsplash.com/photo-1523726491678-bf852e717f6a?w=1400&q=80",
  "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1400&q=80",
  "https://images.unsplash.com/photo-1541976590-713941681591?w=1400&q=80",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1400&q=80",
];

const MOCK_PHOTOS = [
  "https://images.unsplash.com/photo-1541976590-713941681591?w=400&q=80",
  "https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=400&q=80",
  "https://images.unsplash.com/photo-1590644365607-1c5a53a5f1c6?w=400&q=80",
  "https://images.unsplash.com/photo-1591588582259-e5789e2adaa4?w=400&q=80",
];

let idCounter = 1000;
const nextId = () => idCounter++;

const makePin = (x, y, overrides = {}) => ({
  id: nextId(),
  x,
  y,
  title: "Neuer Eintrag",
  status: "offen",
  priority: "mittel",
  description: "",
  assignee: "",
  angle: 0, // Blickrichtung/Aufnahmewinkel in Grad, 0-360, 0° = Norden (im Uhrzeigersinn)
  todos: [],
  photos: [], // Array von Bild-URLs. Aktuell: Unsplash-Mock oder lokale blob: URLs aus URL.createObjectURL.
  ...overrides,
});

const initialProjects = [
  {
    id: 1,
    name: "Neubau Wohnpark Süd",
    address: "Ahornweg 14, 76646 Bruchsal",
    status: "In Bearbeitung",
    floors: [
      {
        id: 11,
        name: "Tiefgarage",
        image: PLAN_IMAGES[0],
        fileType: "image",
        pins: [
          makePin(22, 35, { title: "Riss in Bodenplatte", status: "offen", priority: "hoch", angle: 135, description: "Ca. 2m langer Riss nahe Stellplatz 14, Ursache unklar, Statiker informiert.", assignee: "Fa. Betonbau Krämer", todos: [{ id: 1, text: "Statiker vor Ort bestellen", done: true }, { id: 2, text: "Foto-Dokumentation Verlauf", done: false }], photos: [MOCK_PHOTOS[0]] }),
          makePin(58, 62, { title: "Beleuchtung Abschnitt C defekt", status: "bearbeitung", priority: "mittel", angle: 270, description: "3 von 6 Leuchten ohne Funktion, Elektriker informiert.", assignee: "Elektro Vogt GmbH", todos: [{ id: 1, text: "Ersatzleuchten bestellen", done: true }], photos: [] }),
          makePin(78, 20, { title: "Entwässerungsrinne verschmutzt", status: "erledigt", priority: "niedrig", description: "Rinne war mit Bauschutt verstopft, wurde gereinigt.", assignee: "Bauleitung", todos: [{ id: 1, text: "Rinne reinigen", done: true }, { id: 2, text: "Freigabe dokumentieren", done: true }], photos: [MOCK_PHOTOS[1], MOCK_PHOTOS[2]] }),
        ],
      },
      {
        id: 12,
        name: "Erdgeschoss",
        image: PLAN_IMAGES[1],
        fileType: "image",
        pins: [
          makePin(35, 45, { title: "Türzarge beschädigt", status: "offen", priority: "mittel", description: "Zarge Wohnung 1.02 beim Transport verkratzt.", assignee: "Schreinerei Holz & Fein", todos: [{ id: 1, text: "Ersatz bestellen", done: false }], photos: [MOCK_PHOTOS[3]] }),
          makePin(66, 30, { title: "Fliesenfugen unsauber", status: "offen", priority: "niedrig", description: "Im Eingangsbereich, optische Mängel an mehreren Stellen.", assignee: "Fliesenleger Rossi", todos: [], photos: [] }),
        ],
      },
      {
        id: 13,
        name: "1. Obergeschoss",
        image: PLAN_IMAGES[2],
        fileType: "cad",
        fileExt: "dwg",
        fileName: "1OG_Rohbau_v3.dwg",
        pins: [
          makePin(50, 50, { title: "Heizkörper fehlt", status: "bearbeitung", priority: "hoch", description: "Wohnung 2.03, Heizkörper laut Plan noch nicht montiert.", assignee: "Sanitär Bäumler", todos: [{ id: 1, text: "Lieferung prüfen", done: false }, { id: 2, text: "Montagetermin abstimmen", done: false }], photos: [] }),
          makePin(28, 68, { title: "Maßabweichung Innenwand", status: "offen", priority: "mittel", description: "Wand laut CAD-Plan 12cm versetzt zur Ausführung.", assignee: "Bauleitung", todos: [{ id: 1, text: "Vermessung beauftragen", done: false }], photos: [] }),
        ],
      },
      {
        id: 14,
        name: "Dachgeschoss",
        image: PLAN_IMAGES[3],
        fileType: "image",
        pins: [],
      },
    ],
  },
  {
    id: 2,
    name: "Sanierung Bürokomplex",
    address: "Industriestraße 9, 75015 Bretten",
    status: "In Bearbeitung",
    floors: [
      {
        id: 21,
        name: "Erdgeschoss",
        image: PLAN_IMAGES[4],
        fileType: "image",
        pins: [
          makePin(40, 40, { title: "Asbestverdacht Deckenplatte", status: "offen", priority: "hoch", description: "Verdächtiges Material im Bereich Empfang entdeckt, Bereich abgesperrt.", assignee: "Gutachter Umwelt AG", todos: [{ id: 1, text: "Probe entnehmen lassen", done: true }, { id: 2, text: "Laborergebnis abwarten", done: false }, { id: 3, text: "Bereich weiträumig sperren", done: true }], photos: [MOCK_PHOTOS[0], MOCK_PHOTOS[1]] }),
          makePin(70, 65, { title: "Kabelkanal falsch verlegt", status: "bearbeitung", priority: "mittel", description: "Abweichung vom Elektroplan im Flurbereich Nord.", assignee: "Elektro Vogt GmbH", todos: [{ id: 1, text: "Rücksprache mit Planer", done: true }], photos: [] }),
        ],
      },
      {
        id: 22,
        name: "1. Obergeschoss",
        image: PLAN_IMAGES[5],
        fileType: "image",
        pins: [
          makePin(25, 55, { title: "Fensterdichtung undicht", status: "erledigt", priority: "niedrig", description: "Nach Sturm Undichtigkeit festgestellt, Dichtung erneuert.", assignee: "Fensterbau Nagel", todos: [{ id: 1, text: "Dichtung tauschen", done: true }], photos: [MOCK_PHOTOS[2]] }),
        ],
      },
      {
        id: 23,
        name: "2. Obergeschoss",
        image: PLAN_IMAGES[0],
        fileType: "cad",
        fileExt: "dxf",
        fileName: "2OG_Bestand.dxf",
        pins: [],
      },
    ],
  },
  {
    id: 3,
    name: "Gewerbepark Nordring",
    address: "Nordring 3, 76133 Karlsruhe",
    status: "Planung",
    floors: [
      {
        id: 31,
        name: "Erdgeschoss",
        image: PLAN_IMAGES[1],
        fileType: "image",
        pins: [
          makePin(45, 48, { title: "Bodenplatte Feuchtigkeit", status: "offen", priority: "hoch", description: "Feuchtestellen nach Regen im süd-westlichen Bereich.", assignee: "Bauleitung", todos: [{ id: 1, text: "Messgerät einsetzen", done: false }], photos: [] }),
        ],
      },
      {
        id: 32,
        name: "Halle A",
        image: PLAN_IMAGES[3],
        fileType: "image",
        pins: [],
      },
    ],
  },
];

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

// Robuste Typ-Ermittlung für bereits gespeicherte Etagen (nicht nur für den Upload-Moment):
// Fällt auf eine Dateinamens-Prüfung zurück, falls `fileType` an einer Etage fehlt oder
// veraltet ist — verhindert, dass eine .dwg/.dxf-Datei versehentlich in einem <img>-Tag
// landet und die Grundrissfläche leer bleibt.
function resolveFloorKind(floor) {
  if (floor.fileType === "cad" || floor.fileType === "pdf" || floor.fileType === "image") return floor.fileType;
  const name = (floor.fileName || floor.image || "").toLowerCase();
  if (name.endsWith(".dwg") || name.endsWith(".dxf")) return "cad";
  if (name.endsWith(".pdf")) return "pdf";
  return "image";
}

const FLOOR_UPLOAD_ACCEPT = ".png,.jpg,.jpeg,.webp,.pdf,.dwg,.dxf,image/png,image/jpeg,image/webp,application/pdf";
const FLOOR_UPLOAD_HINT = "Grundriss hochladen (PNG, JPG, PDF, DWG, DXF)";

// ----------------------------------------------------------------------------------
// SMALL COMPONENTS
// ----------------------------------------------------------------------------------

function StatusBadge({ status, size = "sm" }) {
  const s = STATUS[status];
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${s.bg} ${s.text} ${pad} ring-1 ring-inset ${s.ring}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const p = PRIORITY[priority];
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold ${p.bg} ${p.text}`}>
      <span className={`h-2 w-1 rounded-sm ${p.bar}`} />
      {p.label}
    </span>
  );
}

function CadBadge({ ext = "dwg", className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow ${className}`}>
      <Ruler size={11} /> {ext}
    </span>
  );
}

function countPins(floors) {
  const all = floors.flatMap((f) => f.pins);
  return {
    total: all.length,
    open: all.filter((p) => p.status === "offen").length,
  };
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
// SCREEN 1: PROJECT OVERVIEW
// ----------------------------------------------------------------------------------

function ProjectOverview({ projects, onOpenProject, query, setQuery }) {
  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.address.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
          <Building2 size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Baustellen-Dokumentation</h1>
          <p className="text-sm text-slate-500">Projekte, Grundrisse &amp; Mängel im Überblick</p>
        </div>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((project) => {
          const { total, open } = countPins(project.floors);
          const heroFloor = project.floors[0];
          const heroKind = heroFloor ? resolveFloorKind(heroFloor) : "image";
          return (
            <button
              key={project.id}
              onClick={() => onOpenProject(project.id)}
              className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30"
            >
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
                {heroKind === "image" && (
                  // Nur echte Bilddateien werden per <img> gerendert — .dwg/.dxf/.pdf
                  // laufen über die Zweige oben, damit kein <img> mit einem CAD-Blob
                  // fehlschlägt und die Karte leer bleibt.
                  <img
                    src={heroFloor?.image}
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
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h3 className="font-semibold text-slate-900">{project.name}</h3>
                <p className="text-xs text-slate-500">{project.address}</p>
                <div className="mt-1 flex items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Layers size={14} className="text-slate-400" /> {project.floors.length} Etagen
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={14} className="text-slate-400" /> {total} Pins
                  </span>
                </div>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-sm text-slate-400">
            Kein Projekt gefunden für „{query}“.
          </div>
        )}
      </div>
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
  const inputRef = useRef(null);

  const acceptFile = (f) => {
    if (!f) return;
    const info = getFileInfo(f);
    if (!info) {
      setError("Bitte nur PNG, JPG, WebP, PDF, DWG oder DXF hochladen.");
      return;
    }
    setError("");
    // HINWEIS PRODUKTIV-BETRIEB:
    // URL.createObjectURL(f) erzeugt eine rein lokale, temporäre blob:-URL, die nur im
    // aktuellen Browser-Tab gültig ist (kein Server-Upload, kein Teilen zwischen Geräten).
    // Für eine echte Mehrbenutzer-Anwendung würde man hier stattdessen z.B.:
    //   const { data, error } = await supabase.storage.from("grundrisse").upload(path, f);
    //   const url = supabase.storage.from("grundrisse").getPublicUrl(path).data.publicUrl;
    // oder einen S3 PutObject-Call samt anschließender CDN/Public-URL nutzen und
    // "url" statt der blob:-URL im State bzw. in der Datenbank speichern.
    // Für .dwg/.dxf käme zusätzlich ein Konvertierungsschritt (z.B. ODA File Converter oder
    // Autodesk Platform Services) dazwischen, der aus der CAD-Datei ein anzeigbares Bild/SVG
    // erzeugt, bevor die resultierende URL gespeichert wird.
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
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("Bitte einen Namen für die Etage vergeben.");
      return;
    }
    if (!previewUrl) {
      setError("Bitte eine Grundriss-Datei hochladen.");
      return;
    }
    onSave({
      id: nextId(),
      name: name.trim(),
      image: previewUrl, // Aktuell blob:-URL, künftig Cloud-Storage- bzw. Konvertierungs-URL (s.o.)
      fileType: fileKind,
      fileExt,
      fileName: file?.name,
      pins: [],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[88vh] sm:max-w-md sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-blue-600">Neue Etage</p>
            <h2 className="text-lg font-bold text-slate-900">Grundriss hinzufügen</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Name der Etage</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. 2. Obergeschoss"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none ring-blue-500/30 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">{FLOOR_UPLOAD_HINT}</label>
            <input
              ref={inputRef}
              type="file"
              accept={FLOOR_UPLOAD_ACCEPT}
              className="hidden"
              onChange={(e) => acceptFile(e.target.files?.[0])}
            />
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
                isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50"
              }`}
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

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100">
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Save size={16} /> Etage speichern
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------------
// SCREEN 2: FLOOR OVERVIEW
// ----------------------------------------------------------------------------------

function FloorOverview({ project, onBack, onOpenFloor, onOpenAddFloor }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
      >
        <ChevronLeft size={17} /> Zurück zu allen Projekten
      </button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{project.name}</h1>
          <p className="text-sm text-slate-500">{project.address}</p>
        </div>
        <button
          onClick={onOpenAddFloor}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={16} /> Neue Etage / Grundriss hinzufügen
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {project.floors.map((floor) => {
          const open = floor.pins.filter((p) => p.status === "offen").length;
          const floorKind = resolveFloorKind(floor);
          const isCad = floorKind === "cad";
          const isPdf = floorKind === "pdf";
          return (
            <button
              key={floor.id}
              onClick={() => onOpenFloor(floor.id)}
              className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30"
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
                  <img src={floor.image} alt="" className="h-full w-full object-cover opacity-80 transition duration-300 group-hover:scale-105" />
                )}
                <div className="absolute inset-0 ring-1 ring-inset ring-black/10" />
                {isCad && <CadBadge ext={floor.fileExt || "dwg"} className="absolute left-2 top-2" />}
                {open > 0 && (
                  <span className="absolute right-2 top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white shadow">
                    {open}
                  </span>
                )}
              </div>
              <div className="p-3">
                <h3 className="text-sm font-semibold text-slate-900">{floor.name}</h3>
                <p className="mt-0.5 text-[11px] text-slate-500">{floor.pins.length} Pin{floor.pins.length !== 1 ? "s" : ""}</p>
              </div>
            </button>
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

function PinMarker({ pin, onClick }) {
  const s = STATUS[pin.status];
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(pin);
      }}
      style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
      className="absolute z-10 -translate-x-1/2 -translate-y-full focus:outline-none"
      title={`${pin.title} (${pin.angle ?? 0}°)`}
    >
      <span className="relative flex flex-col items-center drop-shadow-md">
        <ViewCone angle={pin.angle ?? 0} colorClass={s.text} />
        {pin.status === "offen" && (
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

function FloorPlanView({ floor, onBack, onPlanClick, onPinClick }) {
  const imgRef = useRef(null);

  const handleClick = (e) => {
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onPlanClick(Math.min(98, Math.max(2, x)), Math.min(98, Math.max(2, y)));
  };

  const open = floor.pins.filter((p) => p.status === "offen").length;
  const inProgress = floor.pins.filter((p) => p.status === "bearbeitung").length;
  const done = floor.pins.filter((p) => p.status === "erledigt").length;
  const floorKind = resolveFloorKind(floor);
  const isPdf = floorKind === "pdf";
  const isCad = floorKind === "cad";

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
            {isCad && <CadBadge ext={floor.fileExt || "dwg"} />}
          </div>
          <p className="text-sm text-slate-500">Auf den Grundriss tippen, um einen neuen Pin zu setzen.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
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
        <div
          className="relative w-full cursor-crosshair select-none"
          onClick={handleClick}
          style={
            isCad
              ? undefined
              : {
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }
          }
        >
          {isCad && (
            // CAD-Grundriss (.dwg/.dxf): stilisierte Blueprint-Ansicht, siehe CadBlueprintPlan.
            // Pins werden exakt wie bei Bild-/PDF-Grundrissen über % Koordinaten relativ zu
            // diesem Container platziert, verschoben und verwaltet.
            <CadBlueprintPlan ref={imgRef} fileName={floor.fileName} ext={floor.fileExt || "dwg"} />
          )}
          {isPdf && !isCad && (
            // PDF-Grundrisse werden per <embed> gerendert, da <img> keine PDFs darstellen kann.
            <div ref={imgRef} className="relative aspect-[4/3] w-full bg-white">
              <embed src={floor.image} type="application/pdf" className="pointer-events-none h-full w-full" />
            </div>
          )}
          {!isCad && !isPdf && (
            <img ref={imgRef} src={floor.image} alt={floor.name} className="pointer-events-none block w-full select-none opacity-90" draggable={false} />
          )}
          {floor.pins.map((pin) => (
            <PinMarker key={pin.id} pin={pin} onClick={onPinClick} />
          ))}
        </div>
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

function AngleCompass({ value, onChange }) {
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
    setDragging(true);
    onChange(angleFromEvent(e));
  };
  const handlePointerMove = (e) => {
    if (!dragging) return;
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
        className="relative h-28 w-28 shrink-0 cursor-pointer touch-none select-none rounded-full border-2 border-slate-200 bg-slate-50 shadow-inner"
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
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
        </div>
        <div className="flex gap-1.5">
          {QUICK_ANGLES.map((q) => (
            <button
              key={q.label}
              onClick={() => onChange(q.value)}
              className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition ${
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

function PinModal({ pin, isNew, onClose, onSave, onDelete }) {
  const [draft, setDraft] = useState(pin);
  const [todoInput, setTodoInput] = useState("");
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const fileInputRef = useRef(null);

  const update = (field, value) => setDraft((d) => ({ ...d, [field]: value }));

  const addTodo = () => {
    if (!todoInput.trim()) return;
    update("todos", [...draft.todos, { id: Date.now(), text: todoInput.trim(), done: false }]);
    setTodoInput("");
  };

  const toggleTodo = (id) =>
    update(
      "todos",
      draft.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );

  const removeTodo = (id) => update("todos", draft.todos.filter((t) => t.id !== id));

  // Echter Datei-Upload: mehrere Bilder gleichzeitig möglich (Kamera oder Dateisystem).
  const handlePhotoFiles = (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;
    // HINWEIS PRODUKTIV-BETRIEB:
    // Auch hier liefert URL.createObjectURL(f) nur eine lokale blob:-URL für die Sitzung.
    // Für Persistenz/Sync zwischen Geräten müsste jede Datei stattdessen z.B. per
    //   await supabase.storage.from("pin-fotos").upload(`${pinId}/${f.name}`, f)
    // oder einen S3-Presigned-Upload hochgeladen werden; die zurückgegebene öffentliche
    // URL würde dann anstelle von objectUrl in "photos" gespeichert werden.
    const newUrls = files.map((f) => URL.createObjectURL(f));
    update("photos", [...draft.photos, ...newUrls]);
  };

  const removePhoto = (idx) => update("photos", draft.photos.filter((_, i) => i !== idx));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[88vh] sm:max-w-lg sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex-1">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-blue-600">
              {isNew ? "Neuer Pin" : `Pin #${draft.id}`}
            </p>
            <input
              value={draft.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Titel des Mangels…"
              className="w-full border-none p-0 text-lg font-bold text-slate-900 outline-none placeholder:text-slate-300"
            />
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</label>
              <div className="flex flex-col gap-1.5">
                {Object.entries(STATUS).map(([key, s]) => (
                  <button
                    key={key}
                    onClick={() => update("status", key)}
                    className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                      draft.status === key ? `${s.bg} ${s.text} border-transparent ring-2 ring-inset ${s.ring}` : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${s.dot}`} /> {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Priorität</label>
              <div className="flex flex-col gap-1.5">
                {Object.entries(PRIORITY).map(([key, p]) => (
                  <button
                    key={key}
                    onClick={() => update("priority", key)}
                    className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
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
            <AngleCompass value={draft.angle ?? 0} onChange={(deg) => update("angle", deg)} />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Beschreibung / Notiz</label>
            <textarea
              value={draft.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              placeholder="Details zum Mangel oder zur Aufgabe…"
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none ring-blue-500/30 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4"
            />
          </div>

          {/* Assignee */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Zuständige Person / Dienstleister</label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={draft.assignee}
                onChange={(e) => update("assignee", e.target.value)}
                placeholder="z.B. Fa. Mustermann Elektro"
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none ring-blue-500/30 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4"
              />
            </div>
          </div>

          {/* Todos */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <ListChecks size={14} /> Aufgaben
            </label>
            <div className="space-y-1.5">
              {draft.todos.map((t) => (
                <div key={t.id} className="group flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5">
                  <button onClick={() => toggleTodo(t.id)} className="shrink-0 text-blue-600">
                    {t.done ? <CheckSquare size={17} /> : <Square size={17} className="text-slate-400" />}
                  </button>
                  <span className={`flex-1 text-sm ${t.done ? "text-slate-400 line-through" : "text-slate-700"}`}>{t.text}</span>
                  <button onClick={() => removeTodo(t.id)} className="text-slate-300 opacity-0 transition hover:text-rose-500 group-hover:opacity-100">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={todoInput}
                onChange={(e) => setTodoInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTodo()}
                placeholder="Neue Aufgabe hinzufügen…"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none ring-blue-500/30 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4"
              />
              <button onClick={addTodo} className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-200">
                <Plus size={15} />
              </button>
            </div>
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
              {draft.photos.map((src, idx) => (
                <div key={idx} className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200">
                  <img
                    src={src}
                    alt=""
                    className="h-full w-full cursor-zoom-in object-cover transition group-hover:opacity-90"
                    onClick={() => setLightboxSrc(src)}
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
                    <ZoomIn size={16} className="text-white opacity-0 transition group-hover:opacity-100" />
                  </div>
                  <button
                    onClick={() => removePhoto(idx)}
                    className="absolute right-1 top-1 rounded-full bg-slate-900/70 p-0.5 text-white opacity-0 transition group-hover:opacity-100"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 text-slate-400 transition hover:border-blue-400 hover:text-blue-500"
              >
                <ImagePlus size={18} />
                <span className="text-[10px] font-medium">Foto hochladen</span>
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">PNG, JPG oder WebP — direkt von Kamera oder Speicher.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5">
          {!isNew ? (
            <button
              onClick={() => onDelete(draft.id)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              <Trash2 size={16} /> Löschen
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100">
              Abbrechen
            </button>
            <button
              onClick={() => onSave(draft)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Save size={16} /> Speichern
            </button>
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

export default function App() {
  const [projects, setProjects] = useState(initialProjects);
  const [screen, setScreen] = useState("projects"); // projects | floors | plan
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedFloorId, setSelectedFloorId] = useState(null);
  const [query, setQuery] = useState("");
  const [modalState, setModalState] = useState(null); // { pin, isNew }
  const [floorModalOpen, setFloorModalOpen] = useState(false);

  const project = projects.find((p) => p.id === selectedProjectId);
  const floor = project?.floors.find((f) => f.id === selectedFloorId);

  const openProject = (id) => {
    setSelectedProjectId(id);
    setScreen("floors");
  };

  const openFloor = (id) => {
    setSelectedFloorId(id);
    setScreen("plan");
  };

  const updateFloorPins = (updater) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== selectedProjectId
          ? p
          : {
              ...p,
              floors: p.floors.map((f) => (f.id !== selectedFloorId ? f : { ...f, pins: updater(f.pins) })),
            }
      )
    );
  };

  const handlePlanClick = (x, y) => {
    setModalState({ pin: makePin(x, y), isNew: true });
  };

  const handlePinClick = (pin) => setModalState({ pin, isNew: false });

  const handleSave = (draft) => {
    updateFloorPins((pins) => {
      const exists = pins.some((p) => p.id === draft.id);
      return exists ? pins.map((p) => (p.id === draft.id ? draft : p)) : [...pins, draft];
    });
    setModalState(null);
  };

  const handleDelete = (id) => {
    updateFloorPins((pins) => pins.filter((p) => p.id !== id));
    setModalState(null);
  };

  const handleAddFloor = (newFloor) => {
    setProjects((prev) =>
      prev.map((p) => (p.id !== selectedProjectId ? p : { ...p, floors: [...p.floors, newFloor] }))
    );
    setFloorModalOpen(false);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 font-sans text-slate-900">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-slate-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5 text-xs font-medium sm:px-6">
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
      </div>

      {screen === "projects" && (
        <ProjectOverview projects={projects} onOpenProject={openProject} query={query} setQuery={setQuery} />
      )}

      {screen === "floors" && project && (
        <FloorOverview
          project={project}
          onBack={() => setScreen("projects")}
          onOpenFloor={openFloor}
          onOpenAddFloor={() => setFloorModalOpen(true)}
        />
      )}

      {screen === "plan" && floor && (
        <FloorPlanView
          floor={floor}
          onBack={() => setScreen("floors")}
          onPlanClick={handlePlanClick}
          onPinClick={handlePinClick}
        />
      )}

      {modalState && (
        <PinModal
          pin={modalState.pin}
          isNew={modalState.isNew}
          onClose={() => setModalState(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      {floorModalOpen && (
        <NewFloorModal onClose={() => setFloorModalOpen(false)} onSave={handleAddFloor} />
      )}
    </div>
  );
}