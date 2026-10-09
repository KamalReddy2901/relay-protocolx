# Relay demo run

## Input

Use [`../examples/SYNTHETIC-HANDOVER-DEMO.txt`](../examples/SYNTHETIC-HANDOVER-DEMO.txt). Tell the judges it is a synthetic example written to show a plan change; do not present it as a real conversation.

## Before the demo

Open the deployed app and check whether Qwen3-4B is already cached in this browser. A first use downloads a large model and can take longer than the demo slot. If it is not cached, either start the download before the judges arrive or use **Use instant rules (no model)** and state clearly that this run uses rules. Do not call rules output an AI result.

## Click path

1. Import the `.txt` file.
2. On Review, select **Day/Month/Year** if asked and use `Asia/Kolkata`.
3. Expand **My name or someone else's isn't in the list**, enter `Kamal` as your name, and add `Arjun` under other people mentioned. (Arjun is named in the chat but never speaks in it.)
4. Set **I last read up to…** to **m1**, the original confirmed 3pm / Room B214 plan.
5. Choose **Catch me up with private AI**. If WebGPU is unavailable or setup fails, switch to the visibly labeled instant rules mode. If inference runs longer than the demo allows, choose **Switch to instant rules** on the running screen; it interrupts AI and clearly identifies the separate rules-based result.
6. Show the brief's **Act now** section: the printed check-in sheets and the projector, now reassigned to Kamal. Point out the stated deadlines.
7. Show **What changed**: `3pm · Room B214 → 4pm · LT-2`. Open both source references and show the proposal question is not treated as the confirmation.
8. Show the proposal for a livestream under **For context**, and the cancelled evening rehearsal. Explain these are a suggestion and a separate cancellation; the robotics showcase itself remains on.
9. Switch the selected person to **Arjun**. Show that the action list is recalculated for him. Switch back to Kamal.

## What to say

> “I came back to a busy project chat. Relay asks who I am and where I stopped reading, then gives me a personal handover: what needs me, what changed, and which exact messages prove each item. Here, the time and room changed, and the projector task moved from Arjun to me. The question asking for 4pm stays a proposal; the later confirmation is what creates the redline. The livestream is still only an idea, while a separate rehearsal was cancelled.”

> “Why not paste this into ChatGPT? A general model can summarize it, but Relay makes identity and last-read position part of the workflow, ranks actions for that person, and connects each changed value to its before and after messages. In the AI path, Qwen runs locally with WebGPU; Relay does not send the chat to a server. The first model download is large, so I can also use a clearly labeled rules fallback.”

## Evidence and honesty

Open source messages rather than asking the audience to trust a generated summary. The fixture is synthetic and tests a controlled example; it does not establish general accuracy. If the brief says “Complete,” explain that it means all selected messages were processed, not that Relay guarantees it found every important fact. Check original messages before acting on a result.
