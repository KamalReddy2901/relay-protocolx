export type FormatId = 'WA-A' | 'WA-I' | 'PLAIN' | 'BRACKET-TIME' | 'BRACKET-ISO';
export type DateOrder = 'DMY' | 'MDY';

export interface Participant {
  id: string;
  displayName: string;
  messageCount: number;
}

export interface Message {
  id: string;
  lineStart: number;
  lineEnd: number;
  authorRaw: string;
  participantId: string;
  timestamp: string | null;
  timestampRaw: string;
  text: string;
  isUnread: boolean;
}

export interface ParseIssue {
  line: number;
  kind: 'unrecognized' | 'no-timestamp' | 'ambiguous-date' | 'continuation-orphan' | 'system-line';
  rawLine: string;
  handling: 'attached-to-previous' | 'kept-as-system' | 'excluded-shown';
}

export interface ParseResult {
  format: FormatId | null;
  messages: Message[];
  participants: Participant[];
  issues: ParseIssue[];
  /** True when day/month cannot be told apart and the caller must choose. */
  dateOrderAmbiguous: boolean;
  dateOrderUsed: DateOrder | null;
  hasTimestamps: boolean;
}

export type ItemKind = 'action' | 'decision' | 'change' | 'proposal' | 'cancellation' | 'conflict';
export type ItemStatus = 'confirmed' | 'proposed' | 'cancelled' | 'needs-clarification';
export type EvidenceRole =
  | 'states'
  | 'assigns'
  | 'proposes'
  | 'confirms'
  | 'revises'
  | 'cancels'
  | 'before'
  | 'after';
export type ChangeField = 'time' | 'place' | 'owner' | 'date' | 'task' | 'other';

export interface RawEvidence {
  id: string;
  quote: string;
  role: EvidenceRole;
}

export interface RawChangeField {
  field: ChangeField;
  before_value: string;
  after_value: string;
  before_id: string;
  after_id: string;
}

export interface RawItem {
  kind: ItemKind;
  title: string;
  owner_name: string | null;
  deadline_text: string | null;
  status: ItemStatus;
  subject: string;
  change_fields?: RawChangeField[];
  evidence: RawEvidence[];
}

export interface RawExtraction {
  items: RawItem[];
}

export interface Evidence {
  messageId: string;
  quote: string;
  role: EvidenceRole;
  /** Offsets of the quote within Message.text. */
  start: number;
  end: number;
}

export interface Item {
  id: string;
  kind: ItemKind;
  title: string;
  ownerRaw: string | null;
  ownerParticipantId: string | null;
  ownerAmbiguous: boolean;
  deadlineText: string | null;
  status: ItemStatus;
  subjectKey: string;
  evidence: Evidence[];
  chunkIndex: number;
  /** Set when a validated owner change replaced this assignment. */
  supersededBy?: string;
}

export interface ChangePair {
  id: string;
  itemId: string;
  subjectKey: string;
  field: ChangeField;
  before: { value: string; evidence: Evidence };
  after: { value: string; evidence: Evidence };
}

export interface ValidationReport {
  items: Item[];
  changes: ChangePair[];
  discarded: { reason: string; title: string }[];
  droppedQuotes: number;
}

export interface UserAction {
  itemId: string;
  state: 'done' | 'not-mine' | 'edited';
  edits?: { ownerParticipantId?: string | null; deadlineText?: string | null };
  at: string;
}

export interface Coverage {
  totalUnread: number;
  processedUnread: number;
  failedRanges: string[];
  discardedCount: number;
  complete: boolean;
  cancelled: boolean;
  thinkingStripped: boolean;
}
