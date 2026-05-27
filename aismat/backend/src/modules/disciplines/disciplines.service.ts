import { prisma } from '../../db/prisma.js';
import { NotFoundError } from '../../utils/errors.js';
import type { CreateDisciplineInput, UpdateDisciplineInput } from './disciplines.schemas.js';

export async function listDisciplines() {
  return prisma.discipline.findMany({ orderBy: { name: 'asc' } });
}

export async function getDiscipline(id: number) {
  const discipline = await prisma.discipline.findUnique({ where: { id } });
  if (!discipline) throw new NotFoundError('Дисципліну не знайдено');
  return discipline;
}

export async function createDiscipline(input: CreateDisciplineInput) {
  return prisma.discipline.create({ data: input });
}

export async function updateDiscipline(id: number, input: UpdateDisciplineInput) {
  await getDiscipline(id);
  return prisma.discipline.update({ where: { id }, data: input });
}

export async function deleteDiscipline(id: number): Promise<void> {
  await getDiscipline(id);
  await prisma.discipline.delete({ where: { id } });
}
