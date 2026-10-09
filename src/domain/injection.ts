/**
 * Heuristic, defence-in-depth detector for chat text that tries to instruct the model.
 * It is NOT a guarantee: the primary defences are the data-only prompt contract and evidence validation.
 * A flagged message can still be quoted as plain chat, but never serves as the confirming, assigning,
 * cancelling or revising source of an item.
 */
const PATTERNS: RegExp[] = [
  /\b(ignore|disregard|forget|override)\b[^.\n]{0,40}\b(previous|prior|above|earlier|all|any|your|the)\b[^.\n]{0,30}\b(instructions?|rules?|prompts?|messages?)\b/i,
  /\b(you are|act as|pretend to be)\b[^.\n]{0,30}\b(an?|the|now)\b[^.\n]{0,20}\b(ai|assistant|model|bot|system)\b/i,
  /\b(mark|set|say|report|output|respond|reply|return|treat)\b[^.\n]{0,40}\b(everyone|everything|all|every task|all tasks)\b[^.\n]{0,30}\b(done|confirmed|complete|completed|finished)\b/i,
  /^\s*(system|assistant|developer)\s*:/im,
  /<\s*\/?\s*(script|iframe|img|svg|object)\b[^>]*>/i,
  /\b(new|updated)\s+instructions?\b/i,
];

export function isInstructionLike(text: string): boolean {
  return PATTERNS.some((p) => p.test(text));
}
