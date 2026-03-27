const fs = require("fs");
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
        ShadingType, PageNumber, PageBreak, LevelFormat, TabStopType, TabStopPosition } = require("docx");

// ── Design tokens ──────────────────────────────────────────────────────────────
const GOLD = "C9A961";
const BLACK = "2C2622";
const CREAM = "FAF8F5";
const SAGE = "7C9A6B";
const COPPER = "D4895C";
const LIGHT_GOLD = "F5EDD8";
const LIGHT_GRAY = "F0F0F0";
const BORDER_GRAY = "DDDDDD";
const WHITE = "FFFFFF";

const PAGE_WIDTH = 11906; // A4
const PAGE_HEIGHT = 16838;
const MARGIN = 1440;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN; // ~9026

const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: BORDER_GRAY };
const borders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
const noBorders = { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } };

// ── Helpers ────────────────────────────────────────────────────────────────────
function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, spacing: { before: 360, after: 200 }, children: [new TextRun(text)] });
}

function para(text, opts = {}) {
  const runs = typeof text === "string"
    ? [new TextRun({ text, size: 22, font: "Inter", color: BLACK, ...opts })]
    : text;
  return new Paragraph({ spacing: { after: 160 }, children: runs });
}

function bold(text) {
  return new TextRun({ text, bold: true, size: 22, font: "Inter", color: BLACK });
}

function normal(text) {
  return new TextRun({ text, size: 22, font: "Inter", color: BLACK });
}

function goldTag(text) {
  return new TextRun({ text, bold: true, size: 22, font: "Inter", color: GOLD });
}

function emptyLine() {
  return new Paragraph({ spacing: { after: 80 }, children: [] });
}

// Simple table helper
function makeTable(headers, rows, colWidths) {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      borders,
      width: { size: colWidths[i], type: WidthType.DXA },
      shading: { fill: GOLD, type: ShadingType.CLEAR },
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20, font: "Inter", color: WHITE })] })]
    }))
  });

  const dataRows = rows.map(row => new TableRow({
    children: row.map((cell, i) => new TableCell({
      borders,
      width: { size: colWidths[i], type: WidthType.DXA },
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [new Paragraph({ children: typeof cell === "string"
        ? [new TextRun({ text: cell, size: 20, font: "Inter", color: BLACK })]
        : cell
      })]
    }))
  }));

  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows]
  });
}

// Callout box
function callout(title, text, fill = LIGHT_GOLD) {
  const leftBorder = { style: BorderStyle.SINGLE, size: 12, color: GOLD };
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH],
    rows: [new TableRow({
      children: [new TableCell({
        borders: { top: noBorders.top, bottom: noBorders.bottom, right: noBorders.right, left: leftBorder },
        shading: { fill, type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 200, right: 200 },
        width: { size: CONTENT_WIDTH, type: WidthType.DXA },
        children: [
          new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: title, bold: true, size: 22, font: "Inter", color: BLACK })] }),
          new Paragraph({ children: [new TextRun({ text, size: 20, font: "Inter", color: "555555" })] })
        ]
      })]
    })]
  });
}

// ── Document ───────────────────────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Inter", size: 22, color: BLACK } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Playfair Display", color: BLACK },
        paragraph: { spacing: { before: 480, after: 240 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Inter", color: GOLD },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Inter", color: BLACK },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "\u2013", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
      ]},
      { reference: "numbers", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      ]},
      { reference: "phases", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      ]},
    ]
  },
  sections: [
    // ── COVER PAGE ────────────────────────────────────────────────────────────
    {
      properties: {
        page: { size: { width: PAGE_WIDTH, height: PAGE_HEIGHT }, margin: { top: 4000, right: MARGIN, bottom: MARGIN, left: MARGIN } }
      },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [
          new TextRun({ text: "AUGUSTE", size: 72, bold: true, font: "Playfair Display", color: GOLD })
        ]}),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [
          new TextRun({ text: "Product Requirements Document v2", size: 28, font: "Inter", color: "888888" })
        ]}),
        emptyLine(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [
          new TextRun({ text: "Restructuration autour du Profil Restaurant", size: 32, bold: true, font: "Inter", color: BLACK })
        ]}),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [
          new TextRun({ text: "Mobile-first \u2022 Express Flow \u2022 3 clics pour des photos pro", size: 22, font: "Inter", color: "888888" })
        ]}),
        emptyLine(), emptyLine(), emptyLine(), emptyLine(),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: "Mars 2026", size: 22, font: "Inter", color: "AAAAAA" })
        ]}),
      ]
    },

    // ── MAIN CONTENT ─────────────────────────────────────────────────────────
    {
      properties: {
        page: { size: { width: PAGE_WIDTH, height: PAGE_HEIGHT }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } }
      },
      headers: {
        default: new Header({ children: [new Paragraph({
          children: [
            new TextRun({ text: "Auguste \u2014 PRD v2", size: 18, font: "Inter", color: "AAAAAA" }),
            new TextRun({ text: "\tMars 2026", size: 18, font: "Inter", color: "AAAAAA" })
          ],
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_GRAY, space: 4 } }
        })] })
      },
      footers: {
        default: new Footer({ children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Page ", size: 18, font: "Inter", color: "AAAAAA" }), new TextRun({ children: [PageNumber.CURRENT], size: 18, font: "Inter", color: "AAAAAA" })]
        })] })
      },
      children: [
        // ── 1. VISION ──────────────────────────────────────────────────────────
        heading("1. Vision et contexte"),

        para([bold("Auguste"), normal(" permet aux restaurateurs de transformer leur carte en un menu visuel professionnel avec photos IA, en moins de 3 minutes, depuis leur t\u00e9l\u00e9phone.")]),

        heading("Ce qui change dans la v2", HeadingLevel.HEADING_2),

        callout("Constat v1", "L\u2019interface actuelle demande 5-6 \u00e9tapes avant de voir un r\u00e9sultat. Le setup de style (2 photos + profil cuisine) est obligatoire. La page Restaurant fait 2 253 lignes. C\u2019est trop complexe pour un restaurateur press\u00e9 sur son t\u00e9l\u00e9phone."),

        emptyLine(),

        makeTable(
          ["Aspect", "v1 (actuel)", "v2 (cible)"],
          [
            ["Pivot central", "Le menu (fichier)", "Le profil restaurant"],
            ["Premi\u00e8re photo visible", "> 5 minutes", "< 2 minutes"],
            ["Setup style obligatoire", "Oui (2 photos + cuisine)", "Non (d\u00e9duit automatiquement)"],
            ["Mobile", "Non optimis\u00e9", "Mobile-first"],
            ["Parcours", "Lin\u00e9aire rigide", "Express (auto) + Avanc\u00e9 (optionnel)"],
            ["Nombre d\u2019\u00e9crans", "4-5 \u00e9crans complexes", "3 \u00e9crans simples"],
          ],
          [2000, 3513, 3513]
        ),

        // ── 2. ARCHITECTURE PROFIL RESTAURANT ──────────────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        heading("2. Le Profil Restaurant comme pivot"),

        para([normal("Tout part du restaurant. Le restaurateur cr\u00e9e son profil une fois, et toutes les g\u00e9n\u00e9rations de photos h\u00e9ritent automatiquement du bon style.")]),

        heading("Mod\u00e8le de donn\u00e9es \u2014 nouvelle table restaurants", HeadingLevel.HEADING_2),

        para([normal("On remplace la table "), bold("leads"), normal(" comme pivot par une vraie table "), bold("restaurants"), normal(" qui porte l\u2019identit\u00e9 visuelle :")]),

        makeTable(
          ["Champ", "Type", "Description"],
          [
            ["id", "uuid (PK)", "Identifiant unique"],
            ["owner_id", "uuid (FK auth.users)", "Propri\u00e9taire du restaurant"],
            ["name", "text", "Nom du restaurant"],
            ["cuisine_profile_id", "text", "Profil cuisine (kebab, pizza, bistrot...)"],
            ["cuisine_types", "text[]", "Types de cuisine d\u00e9tect\u00e9s"],
            ["address", "text", "Adresse"],
            ["phone", "text", "T\u00e9l\u00e9phone"],
            ["description", "text", "Description courte"],
            ["style_photo_url", "text", "Photo d\u2019ambiance (optionnelle)"],
            ["dish_reference_url", "text", "Photo plat r\u00e9f\u00e9rence (optionnelle)"],
            ["hero_photo_url", "text", "Banner hero"],
            ["google_place_id", "text", "Lien Google Business"],
            ["google_business_data", "jsonb", "Donn\u00e9es Google cach\u00e9es"],
            ["presentation_style_id", "text", "Style PDF (bistrot, gastro...)"],
            ["style_description", "text", "Description style personnalis\u00e9e"],
            ["logo_url", "text", "Logo du restaurant"],
            ["created_at", "timestamptz", "Date de cr\u00e9ation"],
          ],
          [2200, 2800, 4026]
        ),

        emptyLine(),

        callout("Principe cl\u00e9", "Le style visuel vit sur le restaurant, pas sur le menu. Un restaurant = un style. Tous les menus h\u00e9ritent du m\u00eame style automatiquement. Le restaurateur peut surcharger par menu s\u2019il le souhaite (mode avanc\u00e9)."),

        heading("Relations entre tables", HeadingLevel.HEADING_2),

        para([normal("Le sch\u00e9ma simplifi\u00e9 :")]),

        para([
          bold("auth.users"), normal(" 1\u2192N "), bold("restaurants"), normal(" 1\u2192N "), bold("menus"), normal(" 1\u2192N "), bold("menu_items"), normal(" 1\u21921 "), bold("generated_images")
        ]),

        emptyLine(),
        para([normal("La table "), bold("leads"), normal(" reste pour les donn\u00e9es de facturation (cr\u00e9dits, Stripe). Le restaurant porte l\u2019identit\u00e9 visuelle. Le menu porte les plats.")]),

        // ── 3. PARCOURS EXPRESS ────────────────────────────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        heading("3. Parcours utilisateur Express"),

        callout("Objectif", "Le restaurateur voit ses premi\u00e8res photos g\u00e9n\u00e9r\u00e9es en moins de 2 minutes, depuis son t\u00e9l\u00e9phone, sans aucune configuration de style."),

        heading("\u00c9tape 1 \u2014 Cr\u00e9er son profil", HeadingLevel.HEADING_2),

        para([normal("Un seul \u00e9cran mobile-friendly avec 3 champs :")]),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [
          bold("Nom du restaurant"), normal(" \u2014 texte libre. Champ principal, gros et visible.")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [
          bold("Type de cuisine"), normal(" \u2014 s\u00e9lecteur visuel avec \u00e9mojis (kebab, pizza, burger, bistrot...). Un tap suffit.")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [
          bold("Photo du restaurant"), normal(" \u2014 optionnel. Bouton \u00ab Prendre une photo \u00bb (cam\u00e9ra mobile) ou upload.")
        ]}),

        emptyLine(),
        para([normal("Alternative rapide : "), bold("recherche Google Business"), normal(". Le restaurateur tape son nom, on remplit tout automatiquement (nom, adresse, cuisine, photos Google).")]),

        heading("\u00c9tape 2 \u2014 Importer son menu", HeadingLevel.HEADING_2),

        para([normal("Depuis l\u2019\u00e9cran du profil, un gros bouton "), bold("\u00ab Ajouter mon menu \u00bb"), normal(" avec 3 options :")]),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [
          bold("Photo"), normal(" \u2014 prendre en photo sa carte avec le t\u00e9l\u00e9phone (acc\u00e8s cam\u00e9ra direct)")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [
          bold("Fichier"), normal(" \u2014 upload PDF ou image depuis la galerie")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [
          bold("Lien"), normal(" \u2014 coller l\u2019URL Uber Eats / Deliveroo / Just Eat")
        ]}),

        emptyLine(),
        para([normal("L\u2019extraction GPT-4o se lance imm\u00e9diatement. Pendant le chargement, un \u00e9cran de progression anime les plats d\u00e9tect\u00e9s un par un (\u00ab Margherita d\u00e9tect\u00e9e... Tiramisu d\u00e9tect\u00e9... \u00bb).")]),

        heading("\u00c9tape 3 \u2014 R\u00e9sultat + G\u00e9n\u00e9ration auto", HeadingLevel.HEADING_2),

        para([normal("D\u00e8s l\u2019extraction termin\u00e9e, l\u2019utilisateur voit sa liste de plats. Deux boutons :")]),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [
          bold("\u00ab G\u00e9n\u00e9rer toutes les photos \u00bb"), normal(" \u2014 lance la g\u00e9n\u00e9ration batch avec le style d\u00e9duit du profil cuisine")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [
          bold("\u00ab \u00c9diter d\u2019abord \u00bb"), normal(" \u2014 permet de corriger noms/prix avant de g\u00e9n\u00e9rer (mode avanc\u00e9)")
        ]}),

        emptyLine(),
        callout("D\u00e9duction automatique du style", "Le syst\u00e8me combine le cuisine_profile_id du restaurant avec les CATEGORY_STYLES existants (24+ cat\u00e9gories). Pas besoin de photo d\u2019ambiance ni de s\u00e9lection de style. Si le restaurateur a mis une photo de son resto, elle est utilis\u00e9e comme r\u00e9f\u00e9rence visuelle. Sinon, le profil cuisine suffit."),

        // ── 4. MOBILE FIRST ──────────────────────────────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        heading("4. Design Mobile-First"),

        para([normal("L\u2019application web doit \u00eatre utilisable sur un smartphone comme une app native. Pas de refonte compl\u00e8te du code \u2014 on adapte le responsive avec Tailwind.")]),

        heading("Principes de design", HeadingLevel.HEADING_2),

        makeTable(
          ["Principe", "Impl\u00e9mentation"],
          [
            ["Touch-friendly", "Boutons min 48px, espacement g\u00e9n\u00e9reux, pas de hover-only"],
            ["Un \u00e9cran = une action", "Pas de panneaux multiples visibles sur mobile"],
            ["Navigation bottom", "Barre de nav en bas (Profil / Menu / Photos / Export)"],
            ["Cam\u00e9ra native", "Acc\u00e8s cam\u00e9ra via input capture pour photo menu/resto"],
            ["Scroll vertical", "Pas de scroll horizontal, pas de tableaux larges sur mobile"],
            ["Feedback imm\u00e9diat", "Skeleton loaders, animations de progression, toasts"],
            ["Offline-tolerant", "Les photos g\u00e9n\u00e9r\u00e9es restent visibles m\u00eame hors connexion (cache)"],
          ],
          [3000, 6026]
        ),

        heading("Breakpoints Tailwind", HeadingLevel.HEADING_2),

        makeTable(
          ["Breakpoint", "Cible", "Layout"],
          [
            ["< 640px (d\u00e9faut)", "Smartphone", "1 colonne, nav bottom, cards empil\u00e9es"],
            ["sm (640px)", "Grand t\u00e9l\u00e9phone", "1 colonne, images plus grandes"],
            ["md (768px)", "Tablette", "2 colonnes pour la grille de plats"],
            ["lg (1024px+)", "Desktop", "Sidebar + contenu, layout actuel am\u00e9lior\u00e9"],
          ],
          [2000, 2513, 4513]
        ),

        heading("Navigation mobile", HeadingLevel.HEADING_2),

        para([normal("On remplace les onglets desktop (TopNav) par une bottom navigation bar fixe avec 4 ic\u00f4nes :")]),

        makeTable(
          ["Ic\u00f4ne", "Label", "Route", "Description"],
          [
            ["\uD83C\uDFE0", "Mon resto", "/profil", "Profil restaurant + infos"],
            ["\uD83D\uDCCB", "Ma carte", "/menu", "Liste des plats + \u00e9dition"],
            ["\uD83D\uDCF7", "Photos", "/photos", "G\u00e9n\u00e9ration + galerie photos IA"],
            ["\uD83D\uDCE4", "Exporter", "/export", "PDF, CSV, lien web, QR code"],
          ],
          [1000, 1500, 1800, 3726]
        ),

        // ── 5. PAGES DETAILLEES ──────────────────────────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        heading("5. D\u00e9tail des \u00e9crans"),

        heading("\u00c9cran 1 \u2014 Mon Restaurant (profil)", HeadingLevel.HEADING_2),

        para([normal("C\u2019est la page d\u2019accueil une fois connect\u00e9. Elle montre l\u2019identit\u00e9 du restaurant et donne acc\u00e8s \u00e0 tout.")]),

        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [
          bold("Header"), normal(" : photo hero (ou placeholder color\u00e9) + nom du restaurant + type cuisine")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [
          bold("Infos \u00e9ditables"), normal(" : nom, adresse, t\u00e9l\u00e9phone, description (tap pour \u00e9diter)")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [
          bold("Section style"), normal(" : cuisine profile (s\u00e9lecteur \u00e9moji), photo ambiance, photo plat r\u00e9f\u00e9rence")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [
          bold("Section menus"), normal(" : liste des menus import\u00e9s (cards), bouton \u00ab + Ajouter un menu \u00bb")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [
          bold("Cr\u00e9dits"), normal(" : jauge de cr\u00e9dits restants + bouton acheter")
        ]}),

        heading("\u00c9cran 2 \u2014 Ma Carte (menu)", HeadingLevel.HEADING_2),

        para([normal("Vue liste des plats du menu actif, group\u00e9s par cat\u00e9gorie. Optimis\u00e9e pour le scroll vertical mobile.")]),

        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [
          bold("Cat\u00e9gories"), normal(" : pills scrollables en haut (filtre horizontal)")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [
          bold("Plat card"), normal(" : miniature photo (si g\u00e9n\u00e9r\u00e9e) + nom + prix. Tap \u2192 \u00e9dition inline")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [
          bold("\u00c9dition"), normal(" : bottom sheet (slide up) avec nom, description, prix, tailles, suppl\u00e9ments, allerg\u00e8nes")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [
          bold("Actions batch"), normal(" : s\u00e9lection multiple + \u00ab G\u00e9n\u00e9rer les photos \u00bb")
        ]}),

        heading("\u00c9cran 3 \u2014 Photos (g\u00e9n\u00e9ration)", HeadingLevel.HEADING_2),

        para([normal("Galerie de toutes les photos g\u00e9n\u00e9r\u00e9es, avec acc\u00e8s \u00e0 la r\u00e9g\u00e9n\u00e9ration.")]),

        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [
          bold("Grille photos"), normal(" : 2 colonnes sur mobile, 3-4 sur desktop. Nom du plat sous chaque photo.")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [
          bold("Tap sur photo"), normal(" : vue plein \u00e9cran + options (r\u00e9g\u00e9n\u00e9rer, t\u00e9l\u00e9charger, partager)")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [
          bold("Plats sans photo"), normal(" : section \u00ab En attente \u00bb avec bouton g\u00e9n\u00e9rer")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [
          bold("Progression"), normal(" : barre de progression globale pendant la g\u00e9n\u00e9ration batch")
        ]}),

        heading("\u00c9cran 4 \u2014 Exporter", HeadingLevel.HEADING_2),

        para([normal("Hub d\u2019export avec tous les formats disponibles :")]),

        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [
          bold("PDF menu"), normal(" \u2014 14 th\u00e8mes visuels, pr\u00e9visualisation, t\u00e9l\u00e9chargement")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [
          bold("Photos ZIP"), normal(" \u2014 toutes les photos en haute r\u00e9solution")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [
          bold("CSV Uber Eats"), normal(" \u2014 format conforme pour import plateforme (Phase 3)")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [
          bold("CSV Deliveroo"), normal(" \u2014 format conforme pour import plateforme (Phase 3)")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [
          bold("Lien web + QR"), normal(" \u2014 menu consultable en ligne avec QR code (Phase 3)")
        ]}),

        // ── 6. DEDUCTION AUTOMATIQUE DU STYLE ────────────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        heading("6. D\u00e9duction automatique du style"),

        para([normal("Le c\u0153ur de la simplification : le restaurateur ne configure plus rien. Le syst\u00e8me d\u00e9duit le style \u00e0 partir de ce qu\u2019il sait.")]),

        heading("Logique de d\u00e9duction", HeadingLevel.HEADING_2),

        makeTable(
          ["Source", "Ce qu\u2019on en tire", "Priorit\u00e9"],
          [
            ["cuisine_profile_id", "Ambiance, vaisselle, sauce, pain, \u00e9clairage (via CUISINE_PROFILES)", "1 \u2014 Principal"],
            ["Noms des plats extraits", "Cat\u00e9gorie du plat (pizza, burger, dessert...) via CATEGORY_STYLES", "2 \u2014 Par plat"],
            ["Photo d\u2019ambiance (si fournie)", "R\u00e9f\u00e9rence visuelle pass\u00e9e \u00e0 gpt-image-1.5", "3 \u2014 Bonus"],
            ["Google Business data", "Cuisine types, photos, description \u2192 d\u00e9tection auto du profil", "4 \u2014 Fallback"],
          ],
          [2500, 4026, 2500]
        ),

        emptyLine(),
        para([normal("Concr\u00e8tement, si le restaurateur choisit \u00ab Kebab \u00bb comme profil et qu\u2019un plat est d\u00e9tect\u00e9 comme \u00ab burger \u00bb, le prompt combine : ambiance kebab (barquette alu, sauce blanche) + cat\u00e9gorie burger (brioche bun, cheddar fondu). C\u2019est ce qui fait d\u00e9j\u00e0 la force de la v1.")]),

        heading("Fallback sans profil cuisine", HeadingLevel.HEADING_2),

        para([normal("Si le restaurateur ne choisit pas de profil (skip), le syst\u00e8me analyse les noms des plats extraits pour deviner. Exemples :")]),

        makeTable(
          ["Plats d\u00e9tect\u00e9s", "Profil d\u00e9duit"],
          [
            ["Kebab, Tacos XL, Assiette mixte", "kebab"],
            ["Margherita, Calzone, Tiramisu", "pizza"],
            ["Boeuf bourguignon, Cr\u00e8me br\u00fbl\u00e9e", "french_bistro"],
            ["Pad Tha\u00ef, Nems, Bo bun", "asian_fusion"],
            ["Big Smash, Cheese Bacon, Onion Rings", "burger"],
          ],
          [4513, 4513]
        ),

        emptyLine(),
        para([normal("Cette d\u00e9duction se fait c\u00f4t\u00e9 Edge Function (extract-menu) : le prompt GPT-4o retourne d\u00e9j\u00e0 les cat\u00e9gories. On ajoute un champ "), bold("detected_cuisine_profile"), normal(" dans la r\u00e9ponse.")]),

        // ── 7. MODELE DE DONNEES COMPLET ─────────────────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        heading("7. Mod\u00e8le de donn\u00e9es v2"),

        para([normal("Sch\u00e9ma cible complet, compatible avec la v1 (migration non-destructive).")]),

        heading("Table restaurants (NOUVELLE)", HeadingLevel.HEADING_2),
        para([normal("D\u00e9j\u00e0 d\u00e9taill\u00e9e en section 2. C\u2019est le pivot central.")]),

        heading("Table menus (modifi\u00e9e)", HeadingLevel.HEADING_2),

        makeTable(
          ["Champ", "Changement", "Raison"],
          [
            ["restaurant_id", "AJOUT (FK restaurants)", "Lie le menu au restaurant (remplace lead_id \u00e0 terme)"],
            ["lead_id", "CONSERV\u00c9", "R\u00e9tro-compatibilit\u00e9 pendant la migration"],
            ["detected_cuisine_profile", "AJOUT", "Profil cuisine d\u00e9duit des plats extraits"],
            ["source_type", "AJOUT", "Type d\u2019import : file, url, photo"],
          ],
          [2800, 2800, 3426]
        ),

        heading("Table menu_items (enrichie)", HeadingLevel.HEADING_2),

        para([normal("Les enrichissements d\u00e9j\u00e0 typ\u00e9s dans le code (tailles, supplements, accompagnements, allergenes, labels, disponible) sont appliqu\u00e9s en DB :")]),

        makeTable(
          ["Champ", "Type", "Statut"],
          [
            ["tailles", "jsonb", "Existe en TypeScript, \u00e0 migrer en DB"],
            ["supplements", "jsonb", "Existe en TypeScript, \u00e0 migrer en DB"],
            ["accompagnements", "jsonb", "Existe en TypeScript, \u00e0 migrer en DB"],
            ["allergenes", "text[]", "Existe en TypeScript, \u00e0 migrer en DB"],
            ["labels", "text[]", "Existe en TypeScript, \u00e0 migrer en DB"],
            ["disponible", "boolean", "Existe en TypeScript, \u00e0 migrer en DB"],
            ["item_type", "text", "Existe en TypeScript, \u00e0 migrer en DB"],
            ["position", "integer", "D\u00e9j\u00e0 en DB"],
          ],
          [2800, 2200, 4026]
        ),

        heading("Table leads (conserv\u00e9e, simplifi\u00e9e)", HeadingLevel.HEADING_2),

        para([normal("La table leads garde uniquement son r\u00f4le de facturation : credits_used, credits_purchased, stripe_customer_id. Les champs li\u00e9s au restaurant (restaurant_name, style_description, etc.) migrent vers la table restaurants.")]),

        // ── 8. ROADMAP ───────────────────────────────────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        heading("8. Roadmap par phases"),

        heading("Phase 1 \u2014 Profil Restaurant + Parcours Express", HeadingLevel.HEADING_2),
        para([goldTag("PRIORIT\u00c9 ABSOLUE"), normal(" \u2014 2-3 semaines")]),

        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 80 }, children: [
          normal("Cr\u00e9er la table "), bold("restaurants"), normal(" + migration des donn\u00e9es depuis leads")
        ]}),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 80 }, children: [
          normal("Cr\u00e9er l\u2019\u00e9cran "), bold("Profil Restaurant"), normal(" (mobile-first)")
        ]}),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 80 }, children: [
          normal("Rendre le style optionnel dans "), bold("ImageGenerator"), normal(" (fallback sur cuisine_profile)")
        ]}),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 80 }, children: [
          normal("Ajouter la "), bold("d\u00e9duction auto du profil cuisine"), normal(" dans extract-menu")
        ]}),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 80 }, children: [
          normal("Impl\u00e9menter la "), bold("bottom navigation"), normal(" mobile")
        ]}),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 80 }, children: [
          normal("Simplifier "), bold("FileUpload"), normal(" : acc\u00e8s cam\u00e9ra + 3 options claires")
        ]}),

        emptyLine(),
        callout("R\u00e9sultat Phase 1", "Un restaurateur peut cr\u00e9er son profil, importer son menu, et voir ses photos g\u00e9n\u00e9r\u00e9es en < 2 min depuis son t\u00e9l\u00e9phone. Z\u00e9ro configuration de style requise."),

        heading("Phase 2 \u2014 Menu enrichi + \u00c9dition mobile", HeadingLevel.HEADING_2),
        para([normal("2-3 semaines")]),

        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 80 }, children: [
          normal("Migration DB : colonnes jsonb sur menu_items (tailles, supplements, allerg\u00e8nes)")
        ]}),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 80 }, children: [
          normal("Mettre \u00e0 jour le prompt extract-menu pour extraire tailles/suppl\u00e9ments")
        ]}),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 80 }, children: [
          normal("Bottom sheet d\u2019\u00e9dition mobile (remplace le tableau desktop)")
        ]}),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 80 }, children: [
          normal("Gestion des cat\u00e9gories : r\u00e9ordonnancement, sous-cat\u00e9gories")
        ]}),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 80 }, children: [
          normal("R\u00e9g\u00e9n\u00e9ration photo avec instructions (\u00ab plus sombre \u00bb, \u00ab angle diff\u00e9rent \u00bb)")
        ]}),

        heading("Phase 3 \u2014 Exports multi-canaux", HeadingLevel.HEADING_2),
        para([normal("3-4 semaines")]),

        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 80 }, children: [
          normal("Export CSV Uber Eats (format conforme)")
        ]}),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 80 }, children: [
          normal("Export CSV Deliveroo (format conforme)")
        ]}),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 80 }, children: [
          normal("Menu web responsive : URL publique + QR code g\u00e9n\u00e9r\u00e9")
        ]}),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 80 }, children: [
          normal("Redimensionnement auto des photos par format (1200x800 Uber, carr\u00e9 Insta)")
        ]}),

        heading("Phase 4 \u2014 Mise en production", HeadingLevel.HEADING_2),
        para([normal("1-2 semaines")]),

        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 80 }, children: [
          normal("Deploy Vercel + domaine + Stripe live")
        ]}),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 80 }, children: [
          normal("CGU, mentions l\u00e9gales, RGPD")
        ]}),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 80 }, children: [
          normal("SEO basique + landing page optimis\u00e9e mobile")
        ]}),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 80 }, children: [
          normal("Analytics (Plausible ou PostHog)")
        ]}),

        heading("Phase 5 \u2014 App native (futur)", HeadingLevel.HEADING_2),
        para([normal("\u00c0 \u00e9valuer apr\u00e8s validation du product-market fit")]),

        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [
          normal("PWA d\u2019abord (Service Worker + manifest) pour l\u2019installation sur \u00e9cran d\u2019accueil")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [
          normal("App native ensuite (React Native ou Capacitor) si la traction le justifie")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [
          normal("Int\u00e9gration OpenClaw : automatisation (commandes vocales, WhatsApp, notifications)")
        ]}),

        // ── 9. CE QUI NE CHANGE PAS ─────────────────────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        heading("9. Ce qui ne change pas"),

        para([normal("La v2 est une restructuration du parcours, pas une r\u00e9\u00e9criture. Le moteur IA, le backend, et le syst\u00e8me de paiement restent identiques.")]),

        makeTable(
          ["Composant", "Statut v2"],
          [
            ["Edge Functions (extract-menu, generate-dish-photo, etc.)", "Conserv\u00e9es, enrichies"],
            ["Supabase (Auth, Storage, DB)", "Conserv\u00e9"],
            ["Stripe (cr\u00e9dits, checkout, webhook)", "Conserv\u00e9"],
            ["gpt-image-1.5 + GPT-4o", "Conserv\u00e9s"],
            ["14 styles de pr\u00e9sentation PDF", "Conserv\u00e9s"],
            ["24+ CATEGORY_STYLES", "Conserv\u00e9s"],
            ["CUISINE_PROFILES", "Conserv\u00e9s (pivot\u00e9s vers le restaurant)"],
            ["Design system (or, cuivre, cr\u00e8me)", "Conserv\u00e9"],
            ["Export PDF", "Conserv\u00e9, li\u00e9 au restaurant au lieu du menu"],
            ["i18n FR/EN", "Conserv\u00e9, \u00e0 compl\u00e9ter"],
          ],
          [5000, 4026]
        ),

        // ── 10. METRIQUES ────────────────────────────────────────────────────
        emptyLine(),
        heading("10. M\u00e9triques de succ\u00e8s"),

        makeTable(
          ["M\u00e9trique", "Objectif", "Mesure"],
          [
            ["Time-to-first-photo", "< 2 min", "Timer depuis inscription jusqu\u2019\u00e0 premi\u00e8re photo affich\u00e9e"],
            ["Taux de compl\u00e9tion profil", "> 80%", "Profils avec cuisine_profile_id renseign\u00e9"],
            ["Photos g\u00e9n\u00e9r\u00e9es / session", "> 10", "Moyenne de photos g\u00e9n\u00e9r\u00e9es par visite"],
            ["Usage mobile", "> 60%", "Part du trafic depuis mobile"],
            ["Taux de conversion freemium", "> 5%", "Utilisateurs gratuits qui ach\u00e8tent un pack"],
            ["NPS restaurateurs", "> 40", "Enqu\u00eate post-utilisation"],
          ],
          [2500, 1500, 5026]
        ),

        emptyLine(), emptyLine(),

        // Closing
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 600 },
          border: { top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_GRAY, space: 12 } },
          children: [new TextRun({ text: "Auguste v2 \u2014 Simple pour le restaurateur, puissant sous le capot.", italics: true, size: 22, font: "Inter", color: "888888" })]
        }),
      ]
    }
  ]
});

// ── Generate ─────────────────────────────────────────────────────────────────
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/sessions/optimistic-focused-hopper/mnt/App-generation-menu-all/docs/PRD_v2_Auguste.docx", buffer);
  console.log("PRD generated successfully!");
});
