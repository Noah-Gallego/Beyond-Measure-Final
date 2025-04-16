'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../../../utils/supabase';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

export default function EditProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  
  // Rest of the component remains the same
  return <div>Edit page for project {projectId}</div>;
} 