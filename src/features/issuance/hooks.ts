import { useMutation, useQuery } from '@tanstack/react-query';
import {
  getIssueSchema,
  issueCredential,
  listAttestedSchemas,
  listPublishedSchemas,
  mintClaimCode,
  type ClaimCodeMintRequest,
  type IssueRequest,
} from './api';

export const issuanceKeys = {
  all: ['issuance'] as const,
  schemas: () => [...issuanceKeys.all, 'schemas'] as const,
  schema: (id: string) => [...issuanceKeys.schemas(), id] as const,
  attestedSchemas: () => [...issuanceKeys.all, 'attestedSchemas'] as const,
};

/** List schemas that can be used for the standard (non-attested) Issue flow. */
export function usePublishedSchemas() {
  return useQuery({
    queryKey: issuanceKeys.schemas(),
    queryFn: listPublishedSchemas,
  });
}

/** List schemas for the attested-document wizard (`requiresAttestation` only). */
export function useAttestedSchemas() {
  return useQuery({
    queryKey: issuanceKeys.attestedSchemas(),
    queryFn: listAttestedSchemas,
  });
}

/** Load the selected schema's full issue metadata. */
export function useIssueSchema(id: string | null) {
  return useQuery({
    queryKey: id ? issuanceKeys.schema(id) : [...issuanceKeys.schemas(), 'none'],
    queryFn: () => getIssueSchema(id as string),
    enabled: Boolean(id),
  });
}

export interface IssueAndMintRequest {
  issue: IssueRequest;
  mintTtlMinutes?: ClaimCodeMintRequest['ttlMinutes'];
}

/** Issue a credential, then mint the one-time wallet claim code for it. */
export function useIssueAndMintCredential() {
  return useMutation({
    mutationFn: async ({ issue, mintTtlMinutes }: IssueAndMintRequest) => {
      const issued = await issueCredential(issue);
      if (!issued.id) throw new Error('issue.missingCredentialId');
      if (!issued.sdJwt) throw new Error('issue.missingSdJwt');
      const claimCode = await mintClaimCode(issued.id, {
        sdJwt: issued.sdJwt,
        ttlMinutes: mintTtlMinutes,
      });
      return { issued, claimCode };
    },
  });
}
