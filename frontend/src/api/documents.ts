import client from './client';

export async function downloadWordReport(configId: string) {
  const response = await client.post(
    '/documents/generate',
    { config_id: configId, doc_type: 'installation_report', format: 'docx' },
    { responseType: 'blob' }
  );
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = `安装报告_${new Date().toISOString().slice(0, 10)}.docx`;
  link.click();
  window.URL.revokeObjectURL(url);
}
