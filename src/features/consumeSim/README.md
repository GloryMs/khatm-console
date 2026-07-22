# consumeSim

Testing/demo tool: simulates a consuming party's own `consume` call. The
operator pastes a party's API key; the request authenticates as that key
(`Authorization: Bearer khk_...`), never as the console session — see
hard constraints in the C2b session brief.

**Routes:** `/consume-sim` (`ConsumeSimPage`), any authenticated operator
(no scope gate). Deep-linked from credential search via `?id=<credentialId>`.

**Queries / mutations:** `useSimulateConsume` → `POST
/api/v1/credentials/consume`, deliberately outside the query cache (each
attempt is a fresh, unstored call).

The pasted API key lives only in component state: `type=password` with a
reveal toggle, never logged or put in the URL, and cleared on unmount and
on every navigation event (including in-place deep-link changes).
