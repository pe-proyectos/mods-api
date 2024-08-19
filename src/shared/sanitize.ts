import sanitizeHtml from 'sanitize-html';

export function sanitizeInput(input: string) {
  if (!input) return "";
  const symbolToken = `_____${Date.now().toString()}_____`;
  const inputTokenized = input.split(':').join(symbolToken);
  const allowedPattern = /[^a-zA-Z0-9,.¡!¿?$%&()#+;/'" _-]/g;
  const sanitizedInput = sanitizeHtml(inputTokenized.replace(allowedPattern, ""));
  const resultTokenized = sanitizedInput.trim().replace(/<[^>]*>?/gm, '');
  return resultTokenized.split(symbolToken).join(':');
}
