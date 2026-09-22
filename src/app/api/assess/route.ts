import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { PatientData, calculateDASI, calculateRCRI } from "@/lib/types";
import { formatGuidelineContext, retrieveGuidelineContext } from "@/lib/knowledge-base";
import { buildLocalAssessment, makeRetrievalQuery } from "@/lib/local-assessment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sseFromText(text: string, mode: "AI_RAG" | "LOCAL_KNOWLEDGE_BASE") {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text, mode })}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Assessment-Mode": mode,
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const data: PatientData = await req.json();
    const chunks = retrieveGuidelineContext(makeRetrievalQuery(data));
    const localReport = buildLocalAssessment(data, chunks);
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

    // The app remains fully usable without a paid model/API key.
    if (!apiKey || apiKey === "your_anthropic_api_key_here") {
      return sseFromText(JSON.stringify(localReport), "LOCAL_KNOWLEDGE_BASE");
    }

    const client = new Anthropic({ apiKey });
    const dasiScore = calculateDASI(data.dasiAnswers);
    const rcriScore = calculateRCRI(data);
    const system = `You are a perioperative cardiovascular clinical decision-support assistant.
Use ONLY the retrieved guideline summaries below for guideline claims. Do not invent recommendations,
classes of recommendation, evidence levels, patient facts, or citations. If information is insufficient,
state that clinician review/source verification is required. Medication interruption depends on indication,
renal function, bleeding risk, neuraxial anesthesia, and local protocols.

RETRIEVED KNOWLEDGE:
${formatGuidelineContext(chunks)}

OUTPUT CONTRACT:
Return ONLY one valid JSON object. Use the provided fallback report as the exact structural schema:
preserve every key and value type, including generationMode, but improve case-specific wording where the
retrieved knowledge supports it. Set generationMode to "AI_RAG". Keep the clinical disclaimer. Cite only
retrieved chunks in guidelineReferences using their source, year and KB id.`;

    const user = `Create a case-specific report.

Calculated RCRI: ${rcriScore}
Calculated DASI: ${dasiScore.toFixed(1)}
Patient input:
${JSON.stringify(data, null, 2)}

Required JSON shape and safe baseline:
${JSON.stringify(localReport, null, 2)}`;

    try {
      const stream = await client.messages.stream({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
        max_tokens: 6000,
        system,
        messages: [{ role: "user", content: user }],
      });

      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text, mode: "AI_RAG" })}\n\n`)
                );
              }
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (streamError) {
            // A stream cannot safely switch to a second JSON document once output has begun.
            controller.error(streamError);
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Assessment-Mode": "AI_RAG",
        },
      });
    } catch (modelError) {
      console.error("AI RAG unavailable; using local knowledge base:", modelError);
      return sseFromText(JSON.stringify(localReport), "LOCAL_KNOWLEDGE_BASE");
    }
  } catch (error) {
    console.error("Assessment error:", error);
    return NextResponse.json(
      { error: "Assessment failed because the submitted patient data could not be processed." },
      { status: 400 }
    );
  }
}
