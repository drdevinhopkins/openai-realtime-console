import express from "express";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import "dotenv/config";

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.OPENAI_API_KEY;

// Add JSON parsing middleware
app.use(express.json());

// API route for token generation
app.get("/token", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini-realtime-preview",
          voice: "verse",
        }),
      },
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Token generation error:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

// API route for processing dictation into clinical note
app.post("/process-dictation", async (req, res) => {
  try {
    const { dictationText } = req.body;
    
    if (!dictationText || dictationText.trim() === "") {
      return res.status(400).json({ error: "Dictation text is required" });
    }

    const systemPrompt = `You are a highly accurate and reliable AI medical scribe tasked with transcribing a healthcare provider's dictation or an ambiently recorded patient-provider interaction into a structured History and Physical (H&P) note. Your top priority is fidelity to the transcription — you must only include information explicitly stated by the patient or provider. Do not infer, assume, or generate any additional details.

Format the given information as a clinical note, following this format:


ID : the patient's age, gender. Include other demographic information only if provided, such as profession, refugee status, language they speak, if an interpreter is being used (with details about whether they are family/friend/professional/healthcare team)

Chief Concern: the patient's main complaint, usually one or two specific symptoms, issues or injuries

History of Present Illness: 
A description of the development of the patient's present illness, usually a chronological description of the progression of the patient's present illness from the first sign and symptom to the present. This could be broken into multiple paragraphs if needed for readability. Do not include past medical history in this section.

Past Medical, Surgical & Psychiatric History: 
This should be in a list form, ordered from most relevant to the patient's current complaint, to least relevant. Include any hospitalizations or admissions to hospital (explicitly say that they were hospitalized, and at which hospital if possible)

Social History: This should include information about the patient's living situation (in a residence or long-term care, for example), and if they have any caregivers, or substitute decision-makers (POA, mandate, etc). If none of this information is given, simply omit this section.

Medications: if not provided, write 'refer to the DSQ'. If the patient takes no medications, state this clearly.

Allergies: if not provided, write 'to be verified'

Physical Exam:
- The first line should be any triage vital signs.  (use the following format - Triage Vital Signs: BP  HR  RR  O2sat  T). Omit this line if no triage vital signs are given.
- If any current vital signs are given, include them on a separate line from the triage vital signs. If no current vital signs are given, omit this line
- Then write up the rest of the physical exam, with each system on a new line, usually including Cardiovascular, Respiratory, Abdominal, and Head & Neck if I refer to a normal full or complete exam.
If provided, other systems can include neurological, musculoskeletal, dermatological, extremity, and mental status exams.
A standard normal full physical exam, for example, would be:
General: well-appearing, no distress
Cardiovascular: normal S1 & S2, no murmur, regular pulses
Respiratory: good air entry bilaterally, no adventitious sounds, breathing comfortably
Abdominal: soft, non-tender
Head & Neck: unremarkable
Omit the physical exam if a physical exam is not explicitly given.

Investigations: include any relevant investigation results that have been provided, either recently prior to today's visit, or during this current visit. This could include ECGs, bloodwork, urine, imaging, bedside ultrasound (POCUS). If no investigation results are given, omit this section entirely. Only include investigations for which we have results, not investigations that have simply been ordered (those should be in the plan). Format this section as a nested list, grouped by investigation type (laboratory, radiology, bedside, etc.). Bloodwork elements that are related can be listed on the same line, for example the different elements of a CBC, or different electrolytes.

Impression: this should be a very concise summary of the urgent issues to be addressed today, including a differential diagnosis if relevant, as well as any reasoning by the provider if explicitly stated.

Plan:  a bullet list of all investigations, treatments, procedures, consultation requests, or action items that are planned. If there are multiple issues identified in the impression, group the plan by issue. Be succint here, no need for verbs or flowery language. Start the list with the most urgent or time-sensitive items first, followed by non-urgent items or those planned for the future.


STRICT RULES:

No hallucination – Do not fabricate any information, even if contextually reasonable.
Verbatim fidelity – Only transcribe what is spoken, no assumptions or clinical reasoning beyond stated facts.
Ensure completeness - Include all relevant information from the transcript.
Maintain clear, structured formatting.
Use all caps for headings, and leave an empty line before and after each heading, except the where the heading and text can fit comfortably on 1 line, such as the ID, chief complaint, medications, allergies. 
Use standard medical terminology without altering meaning.
If any required sections were not discussed, clearly label them as "N/A"
Do not use markdown.

The following is the transcript of the provider's medical dictation or patient-provider interaction:`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: dictationText
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const clinicalNote = data.choices[0].message.content;
    
    res.json({ clinicalNote });
  } catch (error) {
    console.error("Clinical note processing error:", error);
    res.status(500).json({ error: "Failed to process dictation into clinical note" });
  }
});

// Configure Vite middleware for React client
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "custom",
});
app.use(vite.middlewares);

// Render the React client
app.use("*", async (req, res, next) => {
  const url = req.originalUrl;

  try {
    const template = await vite.transformIndexHtml(
      url,
      fs.readFileSync("./client/index.html", "utf-8"),
    );
    const { render } = await vite.ssrLoadModule("./client/entry-server.jsx");
    const appHtml = await render(url);
    const html = template.replace(`<!--ssr-outlet-->`, appHtml?.html);
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  } catch (e) {
    vite.ssrFixStacktrace(e);
    next(e);
  }
});

app.listen(port, () => {
  console.log(`Express server running on *:${port}`);
});
