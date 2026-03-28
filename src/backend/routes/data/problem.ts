import { db } from '@db';
import { Prisma } from '@prisma/client';
import { FastifyInstance } from 'fastify';

export function parseProblemPath(pathStr: string) {
  const usacoDivisions = new Set(['silver', 'gold', 'bronze', 'platinum']);
  const usacoMerged = new Set(['usacosilver', 'usacogold', 'usacobronze', 'usacoplatinum']);
  let segs = pathStr.split('/').filter(Boolean);
  if (usacoMerged.has(segs[0]?.toLowerCase())) return null;
  if (segs[0]?.toLowerCase() === 'usaco' && segs[1] && usacoDivisions.has(segs[1].toLowerCase())) {
    segs = [`usaco${segs[1].toLowerCase()}`, ...segs.slice(2)];
  }
  const n = segs.length;
  if (n === 0) {
    return null;
  }

  const toText = (s: string) => s.replace(/_/g, ' ');
  const isInt = (s: string) => /^\d+$/.test(s);

  let source: string | undefined;
  let year: number | undefined;
  let extra: string | undefined;
  let number: number | undefined;
  let name: string | undefined;

  if (n === 1) {
    name = toText(segs[0]);
  } else if (n === 2) {
    source = segs[0];
    name = toText(segs[1]);
  } else if (n === 3) {
    source = segs[0];
    if (isInt(segs[1])) year = parseInt(segs[1]);
    if (isInt(segs[2])) {
      number = parseInt(segs[2]);
    } else {
      name = toText(segs[2]);
    }
  } else if (n === 4) {
    source = segs[0];
    if (isInt(segs[1])) year = parseInt(segs[1]);
    extra = toText(segs[2]);
    if (isInt(segs[3])) {
      number = parseInt(segs[3]);
    } else {
      name = toText(segs[3]);
    }
  } else {
    // n >= 5: source/year/extra/number/name...
    source = segs[0];
    if (isInt(segs[1])) {
      year = parseInt(segs[1]);
    }
    extra = toText(segs[2]);
    if (isInt(segs[3])) {
      number = parseInt(segs[3]);
    }
    name = toText(segs.slice(4).join('/'));
  }
  return { source, year, extra, number, name };
}

export function buildProblemWhere(parsed: NonNullable<ReturnType<typeof parseProblemPath>>) {
  const where: Record<string, unknown> = {};
  if (parsed.source) {
    where.source = parsed.source;
  }
  if (parsed.year !== undefined) {
    where.year = parsed.year;
  }
  if (parsed.extra !== undefined) {
    where.extra = parsed.extra;
  }
  if (parsed.number !== undefined) {
    where.number = parsed.number;
  }
  if (parsed.name) {
    where.name = parsed.name;
  }
  return where;
}

type ProblemWithLinks = Awaited<ReturnType<typeof db.problem.findUnique>> & {
  problemLinks: { id: number; problemId: number; platform: string; url: string }[];
} | null;

export async function findProblemByPath(pathStr: string): Promise<ProblemWithLinks> {
  const parsed = parseProblemPath(pathStr);
  if (!parsed) {
    return null;
  }

  const where = buildProblemWhere(parsed);
  let prob = await db.problem.findFirst({ where, include: { problemLinks: true } });
  if (!prob && parsed.name) {
    const conditions: Prisma.Sql[] = [Prisma.sql`LOWER(name) = LOWER(${parsed.name})`];
    if (parsed.source) {
      conditions.push(Prisma.sql`source = ${parsed.source}`);
    }
    if (parsed.year !== undefined) {
      conditions.push(Prisma.sql`year = ${parsed.year}`);
    }
    if (parsed.extra !== undefined) {
      conditions.push(Prisma.sql`extra = ${parsed.extra}`);
    }
    if (parsed.number !== undefined) {
      conditions.push(Prisma.sql`number = ${parsed.number}`);
    }
    const rows = await db.$queryRaw<{ id: number }[]>`
      SELECT id FROM "Problem" WHERE ${Prisma.join(conditions, ' AND ')} LIMIT 1
    `;
    if (rows[0]) {
      prob = await db.problem.findUnique({ where: { id: rows[0].id }, include: { problemLinks: true } });
    }
  }

  return prob;
}

export async function problem(app: FastifyInstance) {
  app.get('/problem/*', async (req) => {
    const pathStr = (req.params as Record<string, string>)['*'] ?? '';
    const prob = await findProblemByPath(pathStr);

    if (!prob) {
      return { problem: null };
    }

    return {
      problem: {
        id: prob.id,
        name: prob.name,
        source: prob.source,
        year: prob.year,
        extra: prob.extra || null,
        number: prob.number,
        links: prob.problemLinks.reduce((acc, l) => {
          acc[l.platform] = l.url;
          return acc;
        }, {} as Record<string, string>)
      }
    };
  });
}
