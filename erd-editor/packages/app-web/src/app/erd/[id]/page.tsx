'use client';

import { use } from 'react';
import ERDEditor from '../../../pages/ERDEditor';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ERDEditorRoute({ params }: PageProps) {
  const { id } = use(params);
  return <ERDEditor erdId={id} />;
}
