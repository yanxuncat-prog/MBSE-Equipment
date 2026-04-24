import client from './client';

export interface ParsedField {
  field_name: string;
  field_value: string;
  confidence: string;
}

export interface ParseResult {
  parsed_fields: ParsedField[];
  raw_text_preview: string;
}

export async function uploadAndParse(file: File): Promise<ParseResult> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await client.post('/report-parsing/upload', form);
  return data;
}

export async function applyParsedFields(body: {
  config_id: string;
  equipment_id: string;
  fields: { field_name: string; value: string }[];
}) {
  const { data } = await client.post('/report-parsing/apply', body);
  return data;
}
