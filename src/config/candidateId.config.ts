export const resolveCandidateId = (value: unknown): string => {
  if (typeof value !== "string") {
    throw new Error("EXPO_PUBLIC_CANDIDATE_ID must be a non-empty string")
  }

  const candidateId = value.trim()

  if (!candidateId) {
    throw new Error("EXPO_PUBLIC_CANDIDATE_ID must be a non-empty string")
  }

  return candidateId
}
