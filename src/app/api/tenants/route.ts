import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get('q')?.trim() ?? '';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));

  const where = q
    ? {
        isActive: true,
        OR: [
          { name: { contains: q } },
          { cityName: { contains: q } },
          { postCode: { contains: q } },
        ],
      }
    : { isActive: true };

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.tenant.count({ where }),
  ]);

  return Response.json({
    tenants: tenants.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      postCode: t.postCode,
      cityName: t.cityName,
      logoUrl: t.logoUrl,
      noticeCount: 0, // TODO: count notices
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

// POST: Create a new tenant
export async function POST(request: NextRequest) {
  const body = await request.json();
  const tenant = await prisma.tenant.create({
    data: {
      name: body.name,
      slug: body.slug,
      postCode: body.postCode,
      cityName: body.cityName,
      address: body.address,
      latitude: body.latitude,
      longitude: body.longitude,
      source: 'manual',
    },
  });
  return Response.json(tenant, { status: 201 });
}