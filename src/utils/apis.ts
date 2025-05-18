import axios from "axios";
export async function callContextCompletionAI(
  language: string,
  context: string
) {
  const res = await axios.post("http://localhost:5000/suggest", {
    language,
    context: context,
  });
  return res.data;
}

export async function callManualCompletionAI(
  prompt: string,
  language: string,
  context: string
) {
  const res = await axios.post("http://localhost:5000/manual-prompt", {
    prompt,
    language,
    context: context,
  });
  return res.data;
}
