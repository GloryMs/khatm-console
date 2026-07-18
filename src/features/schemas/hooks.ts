import { useQuery } from '@tanstack/react-query';
import { listSchemas } from './api';

export const schemasKeys = {
  all: ['schemas'] as const,
  list: () => [...schemasKeys.all, 'list'] as const,
};

export function useSchemas() {
  return useQuery({ queryKey: schemasKeys.list(), queryFn: listSchemas });
}
