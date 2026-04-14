import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve("reading_research_library");
const unavailableRoot = path.join(root, "99_unavailable_papers");
const fresh = process.argv.includes("--fresh");

const topics = [
  {
    id: "01_efficient_reading",
    label: "효율적으로 책 읽는 방법",
    queries: [
      "efficient reading strategies review comprehension",
      "study reading strategies comprehension meta analysis",
      "active reading strategies academic texts review",
    ],
  },
  {
    id: "02_reading_understanding",
    label: "글을 잘 읽고 이해하는 방법",
    queries: [
      "text comprehension reading understanding review",
      "reading comprehension processes review",
      "discourse comprehension reading review",
    ],
  },
  {
    id: "03_reading_comprehension_strategies",
    label: "reading comprehension strategies",
    queries: [
      "reading comprehension strategies meta analysis",
      "reciprocal teaching reading comprehension meta analysis",
      "reading strategy instruction review comprehension",
    ],
  },
  {
    id: "04_metacognition_in_reading",
    label: "metacognition in reading",
    queries: [
      "metacognition reading comprehension meta analysis",
      "metacognitive strategies reading comprehension review",
      "metacognitive awareness reading comprehension",
    ],
  },
  {
    id: "05_eye_movements_in_reading",
    label: "eye movements in reading",
    queries: [
      "eye movements in reading review Rayner",
      "eye tracking reading comprehension review",
      "eye movements reading cognitive processes",
    ],
  },
  {
    id: "06_fixation_saccade_regression",
    label: "fixation / saccade / regression in reading",
    queries: [
      "fixation saccade regression reading eye movements",
      "regressions in reading eye movements review",
      "fixation durations saccades reading comprehension",
    ],
  },
  {
    id: "07_chunking_phrase_reading",
    label: "chunking / phrase reading / 끊어읽기",
    queries: [
      "phrase-cued reading comprehension",
      "chunking phrase reading comprehension",
      "prosodic phrasing reading comprehension",
    ],
  },
  {
    id: "08_reading_speed_vs_comprehension",
    label: "reading speed vs comprehension",
    queries: [
      "reading speed comprehension tradeoff review",
      "speed reading comprehension meta analysis",
      "reading rate comprehension eye movements",
    ],
  },
  {
    id: "09_working_memory_and_reading",
    label: "working memory and reading comprehension",
    queries: [
      "working memory reading comprehension review",
      "working memory capacity reading comprehension meta analysis",
      "individual differences working memory text comprehension",
    ],
  },
  {
    id: "10_skilled_vs_poor_readers",
    label: "skilled readers vs poor readers in eye-tracking / reading behavior",
    queries: [
      "skilled poor readers eye movements reading",
      "eye tracking skilled readers poor readers comprehension",
      "dyslexia eye movements reading review",
    ],
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const excludeText = [
  "machine reading",
  "question answering",
  "neural",
  "transformer",
  "bert",
  "dataset",
  "benchmark",
  "conversational",
  "multilingual",
  "commonsense",
  "deep learning",
  "re-ranking",
  "re ranking",
  "natural language processing",
  "large language",
  "knowledge graph",
  "end-to-end",
  "end to end",
  "few-shot",
  "few shot",
  "chinese conversational",
];

const includeFieldHints = ["Psychology", "Education", "Medicine", "Linguistics"];

function sanitizePart(value, fallback = "untitled") {
  const cleaned = String(value || fallback)
    .normalize("NFKD")
    .replace(/[^\w\s.-]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 90);
  return cleaned || fallback;
}

function firstAuthorLastName(paper) {
  const name = paper.authors?.[0]?.name || "Unknown";
  return sanitizePart(name.split(/\s+/).at(-1) || name, "Unknown");
}

function paperKey(paper) {
  return (
    paper.externalIds?.DOI?.toLowerCase() ||
    paper.externalIds?.CorpusId ||
    paper.paperId ||
    `${paper.title}-${paper.year}`.toLowerCase()
  );
}

function paperType(paper) {
  const types = (paper.publicationTypes || []).map((x) => x.toLowerCase());
  const title = (paper.title || "").toLowerCase();
  if (types.some((x) => x.includes("meta")) || title.includes("meta-analysis") || title.includes("meta analysis")) {
    return "meta-analysis";
  }
  if (types.some((x) => x.includes("review")) || title.includes("review")) {
    return "review";
  }
  if (types.some((x) => x.includes("clinical trial") || x.includes("journalarticle"))) {
    return "experiment";
  }
  return "other";
}

function scorePaper(paper) {
  const type = paperType(paper);
  const typeBoost = type === "meta-analysis" ? 6000 : type === "review" ? 3500 : 0;
  const oaBoost = paper.openAccessPdf?.url ? 2000 : 0;
  const citationScore = Math.min(paper.citationCount || 0, 12000);
  const year = paper.year || 0;
  const recencyBoost = year >= 2018 ? 350 : year >= 2010 ? 180 : 0;
  return citationScore + typeBoost + oaBoost + recencyBoost;
}

async function ensureLayout() {
  if (fresh) {
    await fs.rm(root, { recursive: true, force: true });
  }
  await fs.mkdir(root, { recursive: true });
  await fs.mkdir(unavailableRoot, { recursive: true });
  for (const topic of topics) {
    await fs.mkdir(path.join(root, topic.id), { recursive: true });
  }
}

async function searchSemanticScholar(query) {
  const url = new URL("https://api.semanticscholar.org/graph/v1/paper/search");
  url.searchParams.set("query", query);
  url.searchParams.set("limit", "100");
  url.searchParams.set(
    "fields",
    [
      "title",
      "authors",
      "year",
      "venue",
      "journal",
      "externalIds",
      "url",
      "abstract",
      "citationCount",
      "openAccessPdf",
      "publicationTypes",
      "publicationDate",
      "fieldsOfStudy",
      "isOpenAccess",
    ].join(",")
  );

  let response;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    response = await fetch(url, {
      headers: { "User-Agent": "reading-research-library-builder/1.0" },
    });
    if (response.status !== 429) break;
    const waitMs = 30000 * attempt;
    console.log(`  rate limited; waiting ${Math.round(waitMs / 1000)}s before retry`);
    await sleep(waitMs);
  }
  if (!response.ok) {
    throw new Error(`Semantic Scholar search failed ${response.status} for ${query}`);
  }
  const data = await response.json();
  return data.data || [];
}

function isRelevantReadingResearch(paper, topic) {
  const haystack = `${paper.title || ""} ${paper.abstract || ""}`.toLowerCase();
  if (excludeText.some((term) => haystack.includes(term))) return false;

  const fields = paper.fieldsOfStudy || [];
  const hasHumanReadingField = fields.some((field) => includeFieldHints.includes(field));
  const looksLikeReading = /\bread(ing|ers?|ability| comprehension| strategy| fluency| rate)\b/.test(haystack);
  const looksLikeEyeMovementTopic =
    topic.id.includes("eye") ||
    topic.id.includes("fixation") ||
    topic.id.includes("skilled_vs_poor");
  const hasEyeMovementTerm = /\b(eye movement|eye movements|eye-tracking|eye tracking|fixation|saccade|regression|dyslexia)\b/.test(
    haystack
  );
  const hasWorkingMemoryTerm = topic.id.includes("working_memory")
    ? /\bworking memory|memory capacity|reading span\b/.test(haystack)
    : true;
  const hasChunkingTerm = topic.id.includes("chunking")
    ? /\bchunk|chunking|phrase|phrase-cued|phrasing|prosod|syntactic parsing\b/.test(haystack)
    : true;

  if (looksLikeEyeMovementTopic) return hasEyeMovementTerm && (hasHumanReadingField || !fields.includes("Computer Science"));
  return looksLikeReading && hasWorkingMemoryTerm && hasChunkingTerm && (hasHumanReadingField || !fields.includes("Computer Science"));
}

async function downloadPdf(url, targetPath) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "reading-research-library-builder/1.0" },
    });
    if (!response.ok) return { ok: false, reason: `HTTP ${response.status}` };
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length < 1000 || buffer.subarray(0, 5).toString() !== "%PDF-") {
      return { ok: false, reason: "downloaded content was not a PDF" };
    }
    await fs.writeFile(targetPath, buffer);
    return { ok: true, bytes: buffer.length };
  } catch (error) {
    return { ok: false, reason: error?.message || String(error) };
  } finally {
    clearTimeout(timeout);
  }
}

function apaCitation(paper) {
  const authors = (paper.authors || []).map((a) => a.name).slice(0, 8).join(", ") || "Unknown";
  const year = paper.year || "n.d.";
  const venue = paper.journal?.name || paper.venue || "";
  const doi = paper.externalIds?.DOI ? ` https://doi.org/${paper.externalIds.DOI}` : "";
  return `${authors}. (${year}). ${paper.title}. ${venue}.${doi}`.trim();
}

function mlaCitation(paper) {
  const authors = (paper.authors || []).map((a) => a.name).slice(0, 3).join(", ") || "Unknown";
  const venue = paper.journal?.name || paper.venue || "";
  const year = paper.year || "n.d.";
  const doi = paper.externalIds?.DOI ? ` doi:${paper.externalIds.DOI}.` : "";
  return `${authors}. "${paper.title}." ${venue}, ${year}.${doi}`.trim();
}

function chicagoCitation(paper) {
  const authors = (paper.authors || []).map((a) => a.name).slice(0, 8).join(", ") || "Unknown";
  const venue = paper.journal?.name || paper.venue || "";
  const year = paper.year || "n.d.";
  const doi = paper.externalIds?.DOI ? ` https://doi.org/${paper.externalIds.DOI}.` : "";
  return `${authors}. "${paper.title}." ${venue} (${year}).${doi}`.trim();
}

function metadataFor(paper, topic, pdfSource) {
  return {
    title: paper.title || null,
    authors: (paper.authors || []).map((a) => a.name),
    year: paper.year || null,
    journal: paper.journal?.name || paper.venue || null,
    doi: paper.externalIds?.DOI || null,
    url: paper.url || null,
    pdf_source: pdfSource || null,
    citation_count_if_available: Number.isFinite(paper.citationCount) ? paper.citationCount : null,
    topic: topic.label,
    paper_type: paperType(paper),
    abstract: paper.abstract || null,
    keywords: paper.fieldsOfStudy || [],
  };
}

function oneLine(paper) {
  const abs = paper.abstract || "";
  if (abs) return abs.replace(/\s+/g, " ").slice(0, 220);
  return "초록이 제공되지 않아 제목과 메타데이터를 기준으로 분류한 논문입니다.";
}

function summaryKo(paper, topic) {
  return `# ${paper.title}

- 제목: ${paper.title}
- 한줄 핵심: ${oneLine(paper)}
- 연구 목적: ${topic.label} 관점에서 독서 수행, 이해, 전략, 인지 처리 또는 안구운동과 관련된 핵심 근거를 확인하기 위해 선정했습니다.
- 연구 방법: 논문 원문 PDF와 초록/메타데이터를 확인해 읽을 예정입니다. 현재 파일은 자동 수집 단계에서 생성된 1차 요약입니다.
- 핵심 결과: 자동 수집 단계에서는 초록 전문 해석을 확정하지 않았습니다. 원문 검토 후 보강이 필요합니다.
- 이 논문이 중요한 이유: 인용수, 공개 PDF 접근 가능성, 주제 적합도, 리뷰/메타분석 우선순위를 기준으로 선별되었습니다.
- 독서법/독해 훈련 적용: 실제 적용 포인트는 원문 검토 후 전략, 메타인지, 시선 처리, 속도-이해 균형 중 해당되는 축으로 정리해야 합니다.
`;
}

function translationNoteKo(paper) {
  return `# ${paper.title}

이 파일은 저작권 문제를 피하기 위해 논문 원문 전체의 대체 번역본을 제공하지 않습니다.

대신 원문 PDF를 읽으면서 작성할 수 있는 한국어 상세 독해 노트 자리입니다. 공개 PDF가 저장되어 있으므로, 필요한 경우 각 섹션의 핵심 논리, 표/그림 설명, 주요 용어 번역을 원문을 대체하지 않는 범위에서 보강하세요.

## 초록 기반 1차 독해 메모

${paper.abstract || "Semantic Scholar에서 초록을 제공하지 않았습니다."}

## 섹션별 번역 노트

- 서론:
- 방법:
- 결과:
- 논의:
- 표/그림:
- 부록:
`;
}

function notesKo(paper) {
  return `# Notes

- 내가 읽을 때 중요한 포인트: 이 논문이 독서 효율, 독해 전략, 메타인지, 안구운동, 작업기억 중 어느 인지 메커니즘을 설명하는지 확인하세요.
- 다른 논문과 연결되는 지점: 같은 주제 폴더 안의 리뷰/메타분석 논문을 먼저 읽고, 이 논문을 대표 실험 근거로 배치하세요.
- 관련 반론이나 한계: 표본, 과제 유형, 읽기 자료 난이도, 측정 지표가 실제 독서 훈련으로 일반화되는지 확인해야 합니다.
- 비슷한 다른 논문 추천 3개: 같은 폴더의 상위 인용 논문 3편과 함께 비교하세요.
`;
}

async function writePaperFiles(folder, paper, topic, pdfSource) {
  const metadata = metadataFor(paper, topic, pdfSource);
  await fs.writeFile(path.join(folder, "metadata.json"), JSON.stringify(metadata, null, 2), "utf8");
  await fs.writeFile(path.join(folder, "summary_ko.md"), summaryKo(paper, topic), "utf8");
  await fs.writeFile(path.join(folder, "full_translation_ko.md"), translationNoteKo(paper), "utf8");
  await fs.writeFile(
    path.join(folder, "citation.txt"),
    `APA\n${apaCitation(paper)}\n\nMLA\n${mlaCitation(paper)}\n\nChicago\n${chicagoCitation(paper)}\n`,
    "utf8"
  );
  await fs.writeFile(path.join(folder, "notes.md"), notesKo(paper), "utf8");
}

async function main() {
  await ensureLayout();
  const masterRows = [];
  const unavailable = [];
  const storedByKey = new Map();
  const topicReports = [];

  for (const topic of topics) {
    console.log(`\n[topic] ${topic.id} ${topic.label}`);
    const candidates = new Map();
    for (const query of topic.queries) {
      try {
        const results = await searchSemanticScholar(query);
        for (const paper of results) {
          if (!paper.title || !paper.year) continue;
          const key = paperKey(paper);
          const prev = candidates.get(key);
          if (!prev || scorePaper(paper) > scorePaper(prev)) candidates.set(key, paper);
        }
        console.log(`  query ok: ${query} -> ${results.length}`);
      } catch (error) {
        console.log(`  query failed: ${query} -> ${error.message}`);
      }
      await sleep(4500);
    }

    const sorted = [...candidates.values()]
      .filter((paper) => paper.openAccessPdf?.url)
      .filter((paper) => isRelevantReadingResearch(paper, topic))
      .sort((a, b) => scorePaper(b) - scorePaper(a));

    let confirmed = 0;
    let downloaded = 0;
    for (const paper of sorted) {
      if (confirmed >= 15) break;
      const key = paperKey(paper);
      const folderName = `${firstAuthorLastName(paper)}_${paper.year || "nd"}_${sanitizePart(paper.title)}`;
      const folder = path.join(root, topic.id, folderName);
      await fs.mkdir(folder, { recursive: true });

      if (storedByKey.has(key)) {
        const original = storedByKey.get(key);
        await fs.writeFile(
          path.join(folder, "reference_to_original.md"),
          `# Reference to original\n\n원본 PDF는 이미 아래 위치에 저장되어 있습니다.\n\n${path.relative(folder, original.folder)}\n`,
          "utf8"
        );
        await writePaperFiles(folder, paper, topic, original.pdfSource);
        confirmed += 1;
        downloaded += 1;
        masterRows.push({ topic, paper, folder, downloaded: true, translation: false });
        continue;
      }

      const pdfTarget = path.join(folder, "paper.pdf");
      const result = await downloadPdf(paper.openAccessPdf.url, pdfTarget);
      if (!result.ok) {
        unavailable.push({ topic, paper, reason: result.reason, pdfSource: paper.openAccessPdf.url });
        continue;
      }

      await writePaperFiles(folder, paper, topic, paper.openAccessPdf.url);
      storedByKey.set(key, { folder, pdfSource: paper.openAccessPdf.url });
      confirmed += 1;
      downloaded += 1;
      masterRows.push({ topic, paper, folder, downloaded: true, translation: false });
      console.log(`  downloaded ${confirmed}/15: ${paper.title}`);
      await sleep(600);
    }

    topicReports.push({
      topic: topic.label,
      candidate_count: candidates.size,
      selected_count: confirmed,
      pdf_downloaded_count: downloaded,
      translation_completed_count: 0,
    });
    console.log(
      `  report: candidates=${candidates.size}, selected=${confirmed}, pdf=${downloaded}, translations=0`
    );
  }

  for (const item of unavailable) {
    const paper = item.paper;
    const folderName = `${sanitizePart(item.topic.id)}_${firstAuthorLastName(paper)}_${paper.year || "nd"}_${sanitizePart(paper.title)}`;
    const folder = path.join(unavailableRoot, folderName);
    await fs.mkdir(folder, { recursive: true });
    await fs.writeFile(
      path.join(folder, "metadata.json"),
      JSON.stringify({ ...metadataFor(paper, item.topic, item.pdfSource), unavailable_reason: item.reason }, null, 2),
      "utf8"
    );
  }

  const csvHeader = [
    "topic",
    "title",
    "authors",
    "year",
    "journal",
    "doi",
    "citation_count_if_available",
    "paper_type",
    "pdf_downloaded",
    "translation_completed",
    "folder_path",
  ];
  const csvRows = masterRows.map(({ topic, paper, folder, downloaded, translation }) =>
    [
      topic.label,
      paper.title || "",
      (paper.authors || []).map((a) => a.name).join("; "),
      paper.year || "",
      paper.journal?.name || paper.venue || "",
      paper.externalIds?.DOI || "",
      Number.isFinite(paper.citationCount) ? paper.citationCount : "",
      paperType(paper),
      downloaded ? "yes" : "no",
      translation ? "yes" : "no",
      folder,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  await fs.writeFile(path.join(root, "master_index.csv"), [csvHeader.join(","), ...csvRows].join("\n"), "utf8");

  const byTopic = new Map();
  for (const row of masterRows) {
    if (!byTopic.has(row.topic.id)) byTopic.set(row.topic.id, []);
    byTopic.get(row.topic.id).push(row);
  }
  let md = "# Reading Research Library Master Index\n\n";
  for (const topic of topics) {
    md += `## ${topic.id} - ${topic.label}\n\n`;
    for (const row of byTopic.get(topic.id) || []) {
      const p = row.paper;
      md += `- ${p.title} / ${(p.authors || []).map((a) => a.name).join(", ")} / ${p.year || ""} / ${p.journal?.name || p.venue || ""} / citations: ${Number.isFinite(p.citationCount) ? p.citationCount : "null"} / DOI: ${p.externalIds?.DOI || "null"} / PDF: yes / 번역: no / 핵심: ${oneLine(p)}\n`;
    }
    md += "\n";
  }
  await fs.writeFile(path.join(root, "master_index.md"), md, "utf8");

  const top30 = [...masterRows]
    .sort((a, b) => scorePaper(b.paper) - scorePaper(a.paper))
    .slice(0, 30);
  let topMd = "# Recommended Top 30\n\n";
  top30.forEach((row, index) => {
    const level = index < 10 ? "입문" : index < 20 ? "중급" : "심화";
    topMd += `${index + 1}. [${level}] ${row.paper.title} (${row.paper.year || "n.d."}) - 인용수 ${Number.isFinite(row.paper.citationCount) ? row.paper.citationCount : "null"}. 먼저 읽을 이유: ${paperType(row.paper)} 성격과 주제 적합도, 인용수를 기준으로 우선 배치했습니다.\n`;
  });
  await fs.writeFile(path.join(root, "recommended_top30.md"), topMd, "utf8");

  let unavailableMd = "# Unavailable Papers\n\n";
  for (const item of unavailable) {
    const p = item.paper;
    unavailableMd += `- ${p.title} / ${(p.authors || []).map((a) => a.name).join(", ")} / ${p.year || ""} / DOI: ${p.externalIds?.DOI || "null"} / 이유: ${item.reason} / 후보 PDF URL: ${item.pdfSource || "null"}\n`;
  }
  await fs.writeFile(path.join(root, "unavailable_papers.md"), unavailableMd, "utf8");

  await fs.writeFile(path.join(root, "collection_report.json"), JSON.stringify(topicReports, null, 2), "utf8");
  console.log("\n[done]");
  console.log(JSON.stringify(topicReports, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
