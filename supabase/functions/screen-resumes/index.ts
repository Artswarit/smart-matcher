import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { jobDescription, resumes } = await req.json();

    if (!jobDescription || !resumes || !Array.isArray(resumes) || resumes.length === 0) {
      return new Response(JSON.stringify({ error: "Job description and at least one resume are required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const resumeList = resumes
      .map((r: { name: string; content: string }, i: number) => `--- Resume ${i + 1}: ${r.name} ---\n${r.content}`)
      .join("\n\n");

    const systemPrompt = `You are an expert HR recruiter and resume screening specialist. You analyze resumes against job descriptions with precision and fairness. You must return structured JSON output via the provided tool.`;

    const userPrompt = `Analyze the following resumes against this job description and score each candidate.

JOB DESCRIPTION:
${jobDescription}

RESUMES:
${resumeList}

For each candidate, provide:
- match_score (0-100, be realistic and varied)
- strengths (exactly 2-3 key strengths relevant to the JD)
- gaps (exactly 2-3 key gaps or missing skills)
- recommendation: "Strong Fit", "Moderate Fit", or "Not Fit"

Rank candidates by score descending.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        temperature: 0,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "screen_resumes",
              description: "Return screening results for all candidates",
              parameters: {
                type: "object",
                properties: {
                  candidates: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Candidate name from resume" },
                        match_score: { type: "number", description: "Score 0-100" },
                        strengths: {
                          type: "array",
                          items: { type: "string" },
                          description: "2-3 key strengths",
                        },
                        gaps: {
                          type: "array",
                          items: { type: "string" },
                          description: "2-3 key gaps",
                        },
                        recommendation: {
                          type: "string",
                          enum: ["Strong Fit", "Moderate Fit", "Not Fit"],
                        },
                      },
                      required: ["name", "match_score", "strengths", "gaps", "recommendation"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["candidates"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "screen_resumes" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const result = JSON.parse(toolCall.function.arguments);

    // Sort by score descending
    result.candidates.sort((a: any, b: any) => b.match_score - a.match_score);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("screen-resumes error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
