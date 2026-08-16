import { NextRequest } from 'next/server';
import { db } from '@/lib/data';

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
    db.tenant.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.tenant.count({ where }),
  ]);

  return Response.json({
      tenants: tenants.map((t: any) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        postCode: t.postCode,
        cityName: t.cityName,
        logoUrl: t.logoUrl,
        noticeCount: 0,
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
  const tenant = await db.tenant.create({
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