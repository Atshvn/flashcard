"use client";

import { usePathname } from "next/navigation";

const STUDY_ROUTES = [
  /^\/study\//,
  /^\/deck\/[^/]+\/write$/,
  /^\/deck\/[^/]+\/multiple-choice$/,
  /^\/deck\/[^/]+\/match$/,
];

export function useIsStudyMode(): boolean {
  const pathname = usePathname();
  return STUDY_ROUTES.some((pattern) => pattern.test(pathname));
}
