import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export const maxDuration = 60; // pour Vercel Pro+

export async function POST() {
  const tenants = [
    { name: 'Mairie de Paris Centre', slug: 'mairie-de-paris-centre-75001', postCode: '75001', cityName: 'Paris', address: 'Place de l\'Hôtel de Ville', latitude: 48.8566, longitude: 2.3522, department: 'FR-75', region: 'FR-IDF' },
    { name: 'Mairie de Lyon', slug: 'mairie-de-lyon-69001', postCode: '69001', cityName: 'Lyon', address: '1 Place de la Comédie', latitude: 45.7675, longitude: 4.8330, department: 'FR-69', region: 'FR-ARA' },
    { name: 'Mairie de Marseille', slug: 'mairie-de-marseille-13001', postCode: '13001', cityName: 'Marseille', address: 'Quai du Port', latitude: 43.2965, longitude: 5.3698, department: 'FR-13', region: 'FR-PAC' },
    { name: 'Mairie de Bordeaux', slug: 'mairie-de-bordeaux-33000', postCode: '33000', cityName: 'Bordeaux', address: 'Place Pey Berland', latitude: 44.8378, longitude: -0.5792, department: 'FR-33', region: 'FR-NAQ' },
    { name: 'Mairie de Lille', slug: 'mairie-de-lille-59000', postCode: '59000', cityName: 'Lille', address: 'Place Roger Salengro', latitude: 50.6292, longitude: 3.0573, department: 'FR-59', region: 'FR-HDF' },
  ];

  let c = 0;
  for (const data of tenants) {
    await prisma.tenant.upsert({ where: { slug: data.slug }, update: data, create: { ...data, source: 'manual' } });
    c++;
  }

  const passwordHash = await bcrypt.hash('admin123', 4);
  await prisma.user.upsert({
    where: { email: 'admin@mairieconnect.fr' },
    update: {},
    create: { email: 'admin@mairieconnect.fr', name: 'Admin', passwordHash, role: 'superadmin' },
  });

  return NextResponse.json({ ok: true, tenants: c });
}