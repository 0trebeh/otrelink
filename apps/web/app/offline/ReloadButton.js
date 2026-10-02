'use client';
import { Button } from '@/components/ui';

export default function ReloadButton() {
  return <Button variant="primary" onClick={() => window.location.reload()}>Try again</Button>;
}
