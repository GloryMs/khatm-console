import { useMutation, useQueryClient } from '@tanstack/react-query';
import { credentialSearchKeys } from '@/features/credentials/hooks';
import { bulkIssueCredentials, type BulkIssueRequest } from './api';

export { usePublishedSchemas, useIssueSchema } from '@/features/issuance/hooks';

/** Submit a bulk-issue batch; invalidates credential search so freshly issued rows show up. */
export function useBulkIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: BulkIssueRequest) => bulkIssueCredentials(req),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: credentialSearchKeys.all });
    },
  });
}
