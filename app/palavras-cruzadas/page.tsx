import CrosswordGameShell from '@/components/CrosswordGameShell';
import { getCachedCategories } from '@/lib/data/categories';
import type { Category } from '@/lib/types/games';

export const revalidate = 1800;

export default async function PalavrasCruzadasPage() {
  let categories: Category[] = [];

  try {
    categories = await getCachedCategories();
  } catch (error) {
    console.error('Falha ao obter categorias iniciais:', error);
  }

  return <CrosswordGameShell initialCategories={categories} />;
}

