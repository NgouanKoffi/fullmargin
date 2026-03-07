import type { PartialBlock } from "@blocknote/core";

export type BNEditor = { document?: PartialBlock[] };

export type Row = {
  id: string;
  title: string;
  updatedAt: number;
  pinned: boolean;
  tags: string[];
};
